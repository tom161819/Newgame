import { ORIGIN, worldToGrid, projectionLift } from './isometric.js';
import { TILE_WIDTH, TILE_HEIGHT, COLUMNS, ROWS } from './config.js';
import { VISIBILITY, FOG_STYLE } from '../systems/FogOfWarSystem.js';

// m-svet-vzhled-2 (owner request 30): soft Fog of War edge. Drawing only — sight and memory logic are untouched.
// The terrain still paints each tile visible / remembered / unknown; this layer darkens the visible side of the border
// so the per-tile step becomes a gradient over ~1.5 tiles. A small grid-space alpha mask (`resolution` px per tile,
// darkness falling off with the distance to the nearest unseen tile) is shown through a container whose scale and a
// 45° child rotation equal the isometric projection, so one bilinear-filtered image covers the whole edge (WebGL). The
// Canvas renderer (the default, often without a GPU) pays per covered pixel for a rotated or sub-pixel image, so there the
// mask is projected once per change into a screen-sized cache that is blitted 1:1 at whole pixels every frame.
// Mask pixels per tile by the size of the region (fine near the King, coarse when zoomed far out).
export const FOG_EDGE=Object.freeze({width:1.5,strength:1,resolution:4,levels:Object.freeze([[3000,4],[Infinity,2]]),margin:3,quantum:4,rebuildMs:0,pad:96,depth:-60,memoryGrey:110,maxTiles:COLUMNS+8});
const smooth=t=>t<=0?0:t>=1?1:t*t*(3-2*t);

// Pure mask: alpha 0..1 per pixel over a grid rectangle (row-major, columns*resolution wide). `visible(x,y)` is the
// sight test, `target(x,y)` the darkness the remembered/unknown tile already has (the gradient ends there).
export function fogEdgeMask({left,top,columns,rows,resolution:R=FOG_EDGE.resolution,visible,target,width=FOG_EDGE.width,strength=FOG_EDGE.strength,buffers=null}){
  const W=columns*R,H=rows*R,n=W*H,fit=b=>b&&b.length>=n?b:new Float32Array(n),dist=fit(buffers?.dist),tgt=fit(buffers?.tgt),alpha=fit(buffers?.alpha),INF=1e9,D=Math.SQRT2;
  alpha.fill(0,0,n);let seeds=0,lit=0;
  for(let ty=0;ty<rows;ty++)for(let tx=0;tx<columns;tx++){
    const x=left+tx,y=top+ty,v=visible(x,y),t=v?0:target(x,y);if(v)lit++;else seeds++;
    for(let sy=0;sy<R;sy++){let i=(ty*R+sy)*W+tx*R;for(let sx=0;sx<R;sx++,i++){dist[i]=v?INF:0;tgt[i]=t;}}
  }
  if(!seeds||!lit)return {alpha,tgt,width:W,height:H,empty:true};
  // Two-pass chamfer distance (1, √2) carrying the darkness of the nearest unseen pixel.
  const relax=(i,j,step)=>{const d=dist[j]+step;if(d<dist[i]){dist[i]=d;tgt[i]=tgt[j];}};
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(!dist[i])continue;
    if(x>0)relax(i,i-1,1);if(y>0){relax(i,i-W,1);if(x>0)relax(i,i-W-1,D);if(x<W-1)relax(i,i-W+1,D);}}
  for(let y=H-1;y>=0;y--)for(let x=W-1;x>=0;x--){const i=y*W+x;if(!dist[i])continue;
    if(x<W-1)relax(i,i+1,1);if(y<H-1){relax(i,i+W,1);if(x<W-1)relax(i,i+W+1,D);if(x>0)relax(i,i+W-1,D);}}
  let any=false;
  for(let i=0;i<n;i++){const d=dist[i];if(!d||d>=INF)continue;const tiles=(d-.5)/R;if(tiles>=width)continue;const a=tgt[i]*strength*(1-smooth(tiles/width));if(a>0){alpha[i]=a;any=true;}}
  // Bilinear filtering ramps between pixel centres: unseen pixels touching the edge take the edge darkness, so the
  // ramp falls on the unseen side (no bright rim on the visible side of the border).
  if(any)for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(dist[i])continue;let a=0;
    if(x>0&&dist[i-1])a=Math.max(a,alpha[i-1]);if(x<W-1&&dist[i+1])a=Math.max(a,alpha[i+1]);if(y>0&&dist[i-W])a=Math.max(a,alpha[i-W]);if(y<H-1&&dist[i+W])a=Math.max(a,alpha[i+W]);
    if(a>0)alpha[i]=a;}
  return {alpha,tgt,width:W,height:H,empty:!any};
}

const LIFT_BLOCK=3,LIFT_ROOM=66;
export class FogEdgeLayer {
  constructor(scene){
    this.scene=scene;this.key='fog:edge-mask';const size=FOG_EDGE.maxTiles*FOG_EDGE.resolution;const most=Math.max(...FOG_EDGE.levels.map(([max,R])=>Math.min(max,FOG_EDGE.maxTiles**2)*R*R));this.buffers={dist:new Float32Array(most),tgt:new Float32Array(most),alpha:new Float32Array(most)};
    this.canvas=document.createElement('canvas');this.canvas.width=size;this.canvas.height=size;this.context=this.canvas.getContext('2d');
    this.pixels=this.context.createImageData(size,size);this.info=null;this.key2='';this.next=0;this.stats={builds:0,buildMs:0,lastMs:0,pixels:0,projects:0,projectMs:0};
    for(const key of [this.key,`${this.key}-screen`])if(scene.textures.exists(key))scene.textures.remove(key);
    this.gpu=!!scene.sys.game.renderer.gl;
    if(this.gpu){
      // Container scale (TW/√2, TH/√2) after a 45° rotation is exactly gridToWorld; the image stands at Rot45(left, top).
      this.texture=scene.textures.addCanvas(this.key,this.canvas);
      this.container=scene.add.container(ORIGIN.x,ORIGIN.y).setScale(TILE_WIDTH/Math.SQRT2,TILE_HEIGHT/Math.SQRT2).setDepth(FOG_EDGE.depth).setVisible(false);
      this.image=scene.add.image(0,0,this.key).setOrigin(0,0).setRotation(Math.PI/4);this.container.add(this.image);
    }else{
      this.screen=document.createElement('canvas');this.screenContext=this.screen.getContext('2d');this.screen.width=this.screen.height=1;
      this.texture=scene.textures.addCanvas(`${this.key}-screen`,this.screen);
      // NEAREST: the cache is copied 1:1 at whole pixels, so filtering would only cost time.
      this.texture.setFilter(1);this.image=scene.add.image(0,0,`${this.key}-screen`).setOrigin(0,0).setDepth(FOG_EDGE.depth).setVisible(false);this.container=this.image;this.cache=null;
    }
  }
  region(camera,fog){
    const v=camera.worldView,c=[worldToGrid(v.x,v.y),worldToGrid(v.right,v.y),worldToGrid(v.x,v.bottom),worldToGrid(v.right,v.bottom)],q=FOG_EDGE.quantum,m=FOG_EDGE.margin;
    // The camera box is snapped to `quantum` tiles so panning does not rebuild the mask every frame.
    let left=Math.floor((Math.min(...c.map(p=>p.x))-m)/q)*q,top=Math.floor((Math.min(...c.map(p=>p.y))-m)/q)*q,right=Math.ceil((Math.max(...c.map(p=>p.x))+m)/q)*q,bottom=Math.ceil((Math.max(...c.map(p=>p.y))+m)/q)*q;
    left=Math.max(left,fog.left-2,-2);top=Math.max(top,fog.top-2,-2);right=Math.min(right,fog.right+2,COLUMNS+2);bottom=Math.min(bottom,fog.bottom+2,ROWS+2);
    const columns=Math.min(FOG_EDGE.maxTiles,right-left),rows=Math.min(FOG_EDGE.maxTiles,bottom-top);
    return columns>0&&rows>0?{left,top,columns,rows}:null;
  }
  hide(){if(this.container.visible)this.container.setVisible(false);this.key2='';this.info=null;this.cache=null;}
  update(camera,fog){
    if(!fog?.enabled||!fog.sources?.length){this.hide();return;}
    const r=this.region(camera,fog);if(!r){this.hide();return;}
    const tiles=r.columns*r.rows,R=FOG_EDGE.levels.find(([max])=>tiles<=max)[1];
    const key=`${fog.revision}|${fog.memoryBrightness}|${fog.explorationEnabled}|${this.scene.terrain?.groundStyle}|${r.left},${r.top},${r.columns},${r.rows},${R}`;
    // Sight changes as every resident walks: rebuild at most every `rebuildMs`. 0 since 0.74.1 (was 150 ms, a build takes ~1 ms): the continuous ground shows newly seen tiles at once, so a late mask let them flash as bright squares in the dark (a build takes ~1 ms).
    if(key!==this.key2&&(performance.now()>=this.next||!this.info)){this.build(r,R,fog);this.key2=key;this.next=performance.now()+FOG_EDGE.rebuildMs;}
    if(!this.gpu&&this.info)this.place(camera);
  }
  build(r,R,fog){
    // Toward remembered ground the edge fades to a dark grey near the memory look (it is grey, not black), toward
    // unknown ground to black.
    const started=performance.now(),brightness=Math.min(1,fog.memoryBrightness+FOG_STYLE.edgeBrightness*.5),remembered=1-brightness,grey=Math.round(FOG_EDGE.memoryGrey*brightness);
    // Owner 9 Nov ("furt je tam ta linka … za ním je zase světlá oblast"): on continuous ground the terrain itself fades
    // from sight to the remembered grey (TerrainRenderer.shadeMemory). Darkening the visible side toward remembered
    // ground as well stacked a dark line in front of the lighter remembered land, so there this layer fades to unknown
    // land only.
    const memoryFade=this.scene.terrain?.groundStyle!=='continuous';
    const mask=fogEdgeMask({...r,resolution:R,buffers:this.buffers,visible:(x,y)=>fog.isInSightTile({x,y}),target:(x,y)=>x<0||y<0||x>=fog.width||y>=fog.height?1:fog.displayState({x,y})===VISIBILITY.UNEXPLORED?1:memoryFade?remembered:0});
    if(mask.empty){this.hide();}
    else{
      const data=this.pixels.data,W=mask.width,H=mask.height,alpha=mask.alpha,tgt=mask.tgt;let x0=W,y0=H,x1=-1,y1=-1;
      for(let y=0;y<H;y++){let o=y*W,p=(y*this.canvas.width)*4;for(let x=0;x<W;x++,o++,p+=4){const c=tgt[o]>=.999?0:grey,a=Math.round(alpha[o]*255);data[p]=data[p+1]=data[p+2]=c;data[p+3]=a;if(a){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;}}}
      this.context.putImageData(this.pixels,0,0,0,0,W,H);
      // Only the darkened pixels (+1 px for the filter) are drawn.
      x0=Math.max(0,x0-1);y0=Math.max(0,y0-1);x1=Math.min(W-1,x1+1);y1=Math.min(H-1,y1+1);
      this.info={left:r.left,top:r.top,R,W,H,crop:{x:x0,y:y0,width:x1-x0+1,height:y1-y0+1}};this.cache=null;
      if(this.gpu){this.texture.refresh();this.image.setCrop(x0,y0,x1-x0+1,y1-y0+1).setScale(1/R).setPosition((r.left-r.top)/Math.SQRT2,(r.left+r.top)/Math.SQRT2);this.container.setVisible(true);}
    }
    const ms=performance.now()-started;this.stats.builds++;this.stats.buildMs+=ms;this.stats.lastMs=ms;this.stats.pixels=mask.width*mask.height;
  }
  // Canvas: project the mask into a cache for the view plus `pad` screen px at the current zoom. The cache image moves
  // with the camera at whole screen pixels (a soft gradient does not mind the < 1 px offset) and is re-projected only
  // when the mask, the zoom or the view size changes, or the view leaves the padding.
  place(camera){
    const z=camera.zoom,view=camera.worldView,pad=FOG_EDGE.pad,c=this.cache;
    if(!c||c.zoom!==z||c.width!==camera.width||c.height!==camera.height||Math.abs((view.x-c.ox)*z-pad)>pad*.75||Math.abs((view.y-c.oy)*z-pad)>pad*.75)this.project(camera);
    const k=this.cache;if(!k||k.empty){this.container.setVisible(false);return;}
    // Whole-pixel screen offset from the camera scroll, so the blit stays an untransformed copy.
    const sx=Math.round((k.x-view.x)*z),sy=Math.round((k.y-view.y)*z);this.container.setPosition(view.x+sx/z,view.y+sy/z).setScale(1/z).setVisible(true);
  }
  // The cache holds only the projected box of the darkened pixels within the view + padding (a smaller canvas is
  // cheaper to clear, to snapshot and to blit).
  project(camera){
    const started=performance.now(),z=camera.zoom,view=camera.worldView,pad=FOG_EDGE.pad,m=this.info,c=m.crop,k=m.R,fullW=camera.width+2*pad,fullH=camera.height+2*pad;
    const ox=view.x-pad/z,oy=view.y-pad/z,e=(ORIGIN.x+(m.left-m.top)*32-ox)*z,f=(ORIGIN.y+(m.left+m.top)*16-oy)*z;
    // Mask pixel (u, v) → grid (left + u/R, top + v/R) → world (gridToWorld) → padded view pixel ((world − origin) · zoom).
    const corner=(u,v)=>({x:e+(u-v)*32*z/k,y:f+(u+v)*16*z/k}),q=[corner(c.x,c.y),corner(c.x+c.width,c.y),corner(c.x,c.y+c.height),corner(c.x+c.width,c.y+c.height)];
    const liftRoom=this.scene.relief&&this.scene.reliefLift!==false?LIFT_ROOM*z:0;
    const bx=Math.max(0,Math.floor(Math.min(...q.map(p=>p.x)))-1),by=Math.max(0,Math.floor(Math.min(...q.map(p=>p.y))-liftRoom)-1),bw=Math.min(Math.ceil(fullW),Math.ceil(Math.max(...q.map(p=>p.x)))+1)-bx,bh=Math.min(Math.ceil(fullH),Math.ceil(Math.max(...q.map(p=>p.y)))+1)-by;
    const base={zoom:z,width:camera.width,height:camera.height,ox,oy};
    if(bw<=0||bh<=0){this.cache={...base,empty:true};return;}
    if(this.screen.width<bw||this.screen.height<bh){this.texture.setSize(Math.max(this.screen.width,Math.ceil(bw/64)*64),Math.max(this.screen.height,Math.ceil(bh/64)*64));this.image.setSizeToFrame();this.used=null;}
    const ctx=this.screenContext;ctx.setTransform(1,0,0,1,0,0);if(this.used)ctx.clearRect(0,0,this.used[0],this.used[1]);
    ctx.imageSmoothingEnabled=true;
    if(!this.scene.relief||this.scene.reliefLift===false){ctx.setTransform(32*z/k,16*z/k,-32*z/k,16*z/k,e-bx,f-by);ctx.drawImage(this.canvas,c.x,c.y,c.width,c.height,c.x,c.y,c.width,c.height);}
    else{
      // m-teren-vyska (part 2): the ground is lifted, so the mask is laid in blocks of LIFT_BLOCK × LIFT_BLOCK tiles, each
      // moved up by the lift at its middle. Blocks reach one tile into their neighbours and replace what lies under them
      // ('copy' inside their own outline), back to front, so no gap opens and no soft edge is darkened twice.
      const B=LIFT_BLOCK,tx0=Math.floor(m.left+c.x/k),ty0=Math.floor(m.top+c.y/k),tx1=Math.ceil(m.left+(c.x+c.width)/k),ty1=Math.ceil(m.top+(c.y+c.height)/k),blocks=[];
      for(let ty=Math.floor(ty0/B)*B;ty<ty1;ty+=B)for(let tx=Math.floor(tx0/B)*B;tx<tx1;tx+=B)blocks.push([tx,ty]);blocks.sort((p,q)=>p[0]+p[1]-q[0]-q[1]);
      for(const [tx,ty] of blocks){
        const u0=Math.max(c.x,(tx-1-m.left)*k),v0=Math.max(c.y,(ty-1-m.top)*k),u1=Math.min(c.x+c.width,(tx+B+1-m.left)*k),v1=Math.min(c.y+c.height,(ty+B+1-m.top)*k);if(u1<=u0||v1<=v0)continue;
        ctx.save();ctx.setTransform(32*z/k,16*z/k,-32*z/k,16*z/k,e-bx,f-by-projectionLift(tx+B/2,ty+B/2)*z);ctx.beginPath();ctx.rect(u0,v0,u1-u0,v1-v0);ctx.clip();ctx.globalCompositeOperation='copy';
        ctx.drawImage(this.canvas,u0,v0,u1-u0,v1-v0,u0,v0,u1-u0,v1-v0);ctx.restore();}
    }
    ctx.setTransform(1,0,0,1,0,0);
    this.texture.refresh();this.used=[bw,bh];this.cache={...base,x:ox+bx/z,y:oy+by/z};
    this.image.setCrop(0,0,bw,bh);
    this.stats.projects++;this.stats.projectMs+=performance.now()-started;this.stats.cachePixels=bw*bh;
  }
  // Smoke/debug: alpha (0..255) of the mask at a world point, or null outside the mask.
  alphaAt(worldX,worldY){
    const m=this.info;if(!this.container.visible||!m)return null;const g=worldToGrid(worldX,worldY),px=Math.floor((g.x-m.left)*m.R),py=Math.floor((g.y-m.top)*m.R);
    if(px<0||py<0||px>=m.W||py>=m.H)return null;return this.pixels.data[(py*this.canvas.width+px)*4+3];
  }
  destroy(){this.container.destroy();for(const key of [this.key,`${this.key}-screen`])if(this.scene.textures.exists(key))this.scene.textures.remove(key);}
}
