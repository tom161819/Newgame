import { drawCobbles } from './cobbles.js';
import { COLUMNS, ROWS } from './config.js';
import { tileCenter, worldToGrid, gridToWorld } from './isometric.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { PATH_WEAR } from '../data/pathWear.js';
import { canStep } from './pathfinding.js';
import { VISIBILITY, FOG_STYLE } from '../systems/FogOfWarSystem.js';
import { memoryTexture } from './memoryTexture.js';
import { MEMORY_DIRECTIONS } from '../systems/MapMemory.js';
import { GROUND, GROUND_TERRAIN_IDS, BUSH_TYPES, GRASS_ZONE } from '../data/worldTerrain.js';
import { PathV2Layer } from './PathV2Layer.js';

const CHUNK_SIZE = 10;
const TILE_BLEED = .8;

// Season tints as RGBA, for blending between seasons during a transition.
const SEASON_TINT={Spring:[95,145,65,.08],Summer:[185,159,70,.09],Autumn:[158,105,45,.17],Winter:[232,237,220,.83]};
function mixTint(from,to,t){const a=SEASON_TINT[from],b=SEASON_TINT[to];if(!a||!b)return null;const c=a.map((v,i)=>v+(b[i]-v)*t);return`rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${c[3].toFixed(3)})`;}

const WINTER_VEIL=[0,2.2,1.9,1.3,1]; // light tracks fade most under snow
function mixColour(a,b,t){const p=c=>[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)),x=p(a),y=p(b);return`rgb(${x.map((v,i)=>Math.round(v+(y[i]-v)*t)).join(',')})`;}
// #100 Ground blending: along an edge to a ground that ranks higher (grass over desert over beach over shallow over
// deep water), the neighbour's texture fades into this tile, so shores and the desert rim are soft, not diamond steps.
// World v2: ford sits between shallow water and sand; mud and pebbles blend into grass like sand.
const GROUND_RANK=[4,2,3,1,0,1.5,2.2,2.4];
// Edge order N (x-1), E (y-1), S (x+1), W (y+1): the shared edge's midpoint in the 64 × 32 tile and the unit normal
// pointing into the tile, perpendicular to the edge on screen so the fade runs parallel to it.
const EDGES=[{dx:-1,dy:0,start:[16,8],normal:[1,2]},{dx:0,dy:-1,start:[48,8],normal:[-1,2]},{dx:1,dy:0,start:[48,24],normal:[-1,-2]},{dx:0,dy:1,start:[16,24],normal:[1,-2]}];
const FEATHER=12; // px into the tile (the centre is about 14 px from an edge)
// Diagonal neighbours touch only a corner: N-E top, E-S right, S-W bottom, W-N left vertex.
const CORNERS=[{dx:-1,dy:-1,at:[32,0],edges:[0,1]},{dx:1,dy:-1,at:[64,16],edges:[1,2]},{dx:1,dy:1,at:[32,32],edges:[2,3]},{dx:-1,dy:1,at:[0,16],edges:[3,0]}];
// Winter: snow dusts the beach and lightly frosts water; the desert has no snow.
const GROUND_WINTER=[null,'rgba(232,237,220,.55)',null,'rgba(226,236,244,.28)','rgba(226,236,244,.18)','rgba(226,236,244,.3)','rgba(232,237,220,.5)','rgba(232,237,220,.45)'];
// World v2 grass zones: provisional colour washes over the approved grass until the zone textures (g-svet-textury)
// are approved. Each tile averages its 3×3 neighbourhood, so zones fade into each other instead of ending on a diamond.
const ZONE_TINT=[[0,0,0,0],[38,104,36,.2],[196,168,82,.26],[84,62,32,.2],[0,0,0,0],[128,128,118,.2]];
// Small decorations per zone: [kind, chance per tile, count range].
const ZONE_DECALS=[[['tuft',.3,[1,2]]],[['tuft',.5,[1,3]]],[['dryTuft',.3,[1,2]]],[['leaf',.55,[2,4]],['tuft',.15,[1,1]]],[['flower',.75,[2,5]],['tuft',.3,[1,2]]],[['pebble',.6,[1,3]],['tuft',.15,[1,1]]]];
// World v2 step 3 (rounded shores): the four corners of a tile take the share of land among the four tiles that meet
// there; a pixel's land share is the bilinear mix of its tile's corners and the shore is the 0.5 contour (marching
// squares with interpolation), so river and lake edges run in curves instead of diamond steps. Fords count as water.
const WATERY=new Set([GROUND.SHALLOW,GROUND.DEEP,GROUND.FORD]);
const CORNER_TILES=[[[0,0],[-1,0],[0,-1],[-1,-1]],[[0,0],[0,-1],[1,0],[1,-1]],[[0,0],[1,0],[0,1],[1,1]],[[0,0],[0,1],[-1,0],[-1,1]]]; // top, right, bottom, left
function terrainHash(x, y) { return ((Math.imul(x + 17, 374761393) ^ Math.imul(y + 29, 668265263)) >>> 0); }

export class TerrainRenderer {
  constructor(scene, map, registry=objectRegistry, assets=null) {
    this.scene = scene; this.map = map;
    this.registry=registry;this.assets=assets;
    this.tiles = new Map(); this.wallPool = [];
    this.chunks = new Map(); this.chunkPool = [];
    this.lastView = '';
    this.dirtyChunks=new Set();this.dirtyTiles=new Map();this.paintStats={tiles:0,chunks:0};this.debugEnabled=false;this.debugGraphics=scene.add.graphics().setDepth(-99);
    for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);
    this.createTextures();
    this.outcrop=registry.require('rock_outcrop');
    this.wallTexture=assets?.textureFor(this.outcrop.id,'terrain-wall')??'terrain-wall';
    // Seasonal grass textures (wear level 0); summer uses the ordinary grass variants.
    const grass=registry.get?.(PATH_WEAR.terrainIds[0]);
    this.seasonGrass=Object.fromEntries(Object.entries(grass?.seasonVariants??{}).map(([season,list])=>[season,list.map((_,i)=>`season-${season}-${i}`).filter(layer=>assets?.hasTexture(grass.id,layer)).map(layer=>assets.key(grass.id,layer))]).filter(([,keys])=>keys.length));
    this.groundKinds=GROUND_TERRAIN_IDS.map((id,code)=>code===GROUND.GRASS?null:(registry.get?.(id)?.spriteVariants??[]).map((_,i)=>`variant-${i}`).filter(layer=>assets?.hasTexture(id,layer)).map(layer=>assets.key(id,layer)));
    this.bushSprites=new Map();this.bushPool=[];
    // #116: paths are drawn by the V2 renderer (the owner's pesinav2 style); N12 stays as a developer fallback.
    this.pathStyle='v2';this.shoreStyle='round';this.v2=new PathV2Layer(this);
    this.wearTextures=PATH_WEAR.terrainIds.map(id=>({key:assets?.hasTexture(id)?assets.textureKey(id):this.groundTextures[0].key,variants:(registry.get?.(id)?.spriteVariants??[]).map((_,i)=>`variant-${i}`).filter(layer=>assets?.hasTexture(id,layer)).map(layer=>assets.key(id,layer))}));
  }

  // A wear change can turn neighbours into (or out of) a trodden area, which reaches their own neighbours: repaint 5×5.
  setPathWear(system){this.wear=system;this.unsubscribeWear=system.subscribe(tile=>this.invalidateArea([tile],true,2));}
  // Developer switch (console mkDev.setPathRenderer('n12'|'v2')): repaint every chunk with the other path renderer.
  setPathStyle(style){if(!['v2','n12'].includes(style)||style===this.pathStyle)return false;this.pathStyle=style;this.v2?.invalidate();this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';return true;}
  // Developer switch (console mkDev.setShoreStyle('round'|'edges')): rounded shores (World v2 step 3) or the older edge feathering.
  setShoreStyle(style){if(!['round','edges'].includes(style)||style===this.shoreStyle)return false;this.shoreStyle=style;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';return true;}
  setDebug(value){this.debugEnabled=!!value;this.lastView='';if(!value)this.debugGraphics.clear();}
  setSeason(season){if(season===this.season)return;this.season=season;this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';}
  // Whole chunks, repainted in one pass, give the same pixels as a fresh draw (season transition).
  invalidateChunksOf(tiles,{immediate=false}={}){for(const tile of tiles){const key=`${Math.floor(tile.x/CHUNK_SIZE)},${Math.floor(tile.y/CHUNK_SIZE)}`;this.dirtyTiles.delete(key);this.dirtyChunks.add(key);}if(tiles.length){this.lastView='';if(immediate)this.repaintAll=true;}}
  invalidateArea(tiles,neighbors=true,reach=1){
    if(!tiles.length)return;
    const range=neighbors?reach:0;
    for(const tile of tiles)for(let dy=-range;dy<=range;dy++)for(let dx=-range;dx<=range;dx++){
      const x=tile.x+dx,y=tile.y+dy;if(x<0||x>=COLUMNS||y<0||y>=ROWS)continue;
      const key=`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`;
      if(this.dirtyChunks.has(key)&&!this.dirtyTiles.has(key))continue;
      if(!this.dirtyTiles.has(key))this.dirtyTiles.set(key,new Set());
      this.dirtyTiles.get(key).add(y*COLUMNS+x);this.dirtyChunks.add(key);
    }
    this.lastView='';
  }
  // Worn grass keeps the tile's own seasonal grass; the approved Earth track is drawn over it as a narrow
  // strip (soft halo, edge, soil texture from the approved tiles). Every tile draws the strips of all worn
  // tiles around it, clipped to its own diamond, so a single repainted tile matches a full repaint and the
  // track runs on across edges, corners and diagonals. Fog mode reads only remembered levels and links.
  pathLevel(tile){
    if(tile.x<0||tile.y<0||tile.x>=COLUMNS||tile.y>=ROWS)return 0;
    return this.fog?.enabled&&this.memory?this.memory.terrain.get(tile.y*this.fog.width+tile.x)?.[1]??0:this.wear?.level(tile)??0;
  }
  // Organic Earth track: a corridor is one gentle curve per pair of linked worn tiles, through slightly offset tile
  // nodes and shared by both tiles, so it runs on across tile edges without a kink. A diagonal joins only where no
  // corner tile is worn, so there are no stars or cross-hatching. Tiles inside any 2×2 block of worn tiles form one
  // trodden area of overlapping soft blobs with no internal links. Under Fog of War only remembered data is read.
  pathVisual(level){return this.registry.require(PATH_WEAR.terrainIds[level]).visual;}
  pathNode(tile){const center=tileCenter(tile),h=terrainHash(tile.x,tile.y);return {x:center.x+((h%7)-3)*1.1,y:(center.y+(((h>>>3)%5)-2)*.7)*2};}
  pathLinked(tile,neighbor,bit){
    if(this.fog?.enabled&&this.memory)return !!((this.memory.terrain.get(tile.y*this.fog.width+tile.x)?.[3]??0)&(1<<bit));
    return canStep(this.scene.map,tile,neighbor);
  }
  pathArea(tile){
    if(!this.pathLevel(tile))return false;
    return [[0,0],[-1,0],[0,-1],[-1,-1]].some(([ox,oy])=>[[0,0],[1,0],[0,1],[1,1]].every(([dx,dy])=>this.pathLevel({x:tile.x+ox+dx,y:tile.y+oy+dy})>0));
  }
  // Everything that can reach the diamond of tile (x, y): drawn from the worn tiles around it.
  pathElements(x,y){
    const nodes=[],areas=[],links=new Map();
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
      const tile={x:x+ox,y:y+oy},level=this.pathLevel(tile);if(!level)continue;
      const visual=this.pathVisual(level),h=terrainHash(tile.x,tile.y),area=this.pathArea(tile);
      if(area)areas.push({level,visual,center:this.pathNode(tile),radius:42+(h%5)*1.5});
      else nodes.push({level,visual,tile,width:visual.pathWidth,start:this.pathNode(tile)});
      for(const [bit,[dx,dy]]of MEMORY_DIRECTIONS.entries()){
        const neighbor={x:tile.x+dx,y:tile.y+dy},other=this.pathLevel(neighbor);if(!other)continue;
        if(dx&&dy&&(this.pathLevel({x:tile.x+dx,y:tile.y})||this.pathLevel({x:tile.x,y:tile.y+dy})))continue;
        if(area&&this.pathArea(neighbor))continue;
        const first=tile.y*COLUMNS+tile.x<neighbor.y*COLUMNS+neighbor.x,a=first?tile:neighbor,b=first?neighbor:tile,key=`${a.x},${a.y}|${b.x},${b.y}`;
        if(links.has(key)||!this.pathLinked(tile,neighbor,bit))continue;
        const low=Math.min(level,other),start=this.pathNode(a),end=this.pathNode(b),length=Math.hypot(end.x-start.x,end.y-start.y)||1,bend=((terrainHash(a.x*3+b.x,a.y*3+b.y)%7)-3)*1.4;
        links.set(key,{level:low,visual:this.pathVisual(low),width:Math.min(visual.pathWidth,this.pathVisual(other).pathWidth),start,end,
          control:{x:(start.x+end.x)/2-(end.y-start.y)/length*bend,y:(start.y+end.y)/2+(end.x-start.x)/length*bend}});
      }
    }
    const linked=new Set([...links.keys()].flatMap(key=>key.split('|')));
    for(const node of nodes)if(!linked.has(`${node.tile.x},${node.tile.y}`))node.width=Math.round(node.width*(1.05+(terrainHash(node.tile.x,node.tile.y)%5)*.06));
    return {nodes,areas,links:[...links.values()]};
  }
  // The soil core: the path colour with the centre of the approved Earth track tile laid over it, composed into one
  // opaque pattern repeated in world space. Being opaque, it is drawn with the tile overlap and never shows a seam.
  pathPattern(context,level,colour,alpha){
    this.pathPatterns??=new Map();const key=`${level}|${colour}|${alpha.toFixed(2)}`;if(this.pathPatterns.has(key))return this.pathPatterns.get(key);
    const texture=this.wearTextures?.[level]?.key;let style=colour;
    if(texture&&texture!==this.groundTextures?.[0]?.key&&this.scene.textures.exists?.(texture)&&typeof document!=='undefined'){
      const image=this.scene.textures.get(texture).getSourceImage(),scale=image.width/64,crop=document.createElement('canvas');crop.width=24;crop.height=10;
      const c=crop.getContext('2d');c.fillStyle=colour;c.fillRect(0,0,24,10);c.globalAlpha=alpha;c.drawImage(image,20*scale,11*scale,24*scale,10*scale,0,0,24,10);
      const pattern=context.createPattern(crop,'repeat');if(pattern){pattern.setTransform?.(new DOMMatrix().scale(1,2));style=pattern;}
    }
    this.pathPatterns.set(key,style);return style;
  }
  drawPaths(context,x,y,left,top,veil=0,clip=null){
    const {nodes,areas,links}=this.pathElements(x,y);if(!nodes.length&&!areas.length&&!links.length)return;
    const levels=[...new Set([...nodes,...areas,...links].map(e=>e.level))].sort((a,b)=>a-b);
    // One stroke or fill per group, so overlapping shapes never double their transparency; areas fill as one union.
    const lines=(list,style,alpha,extra)=>{const groups=new Map();for(const s of list){const w=s.width+extra;if(!groups.has(w))groups.set(w,[]);groups.get(w).push(s);}
      for(const [width,group]of groups){context.beginPath();for(const s of group){context.moveTo(s.start.x,s.start.y);if(s.end)context.quadraticCurveTo(s.control.x,s.control.y,s.end.x,s.end.y);else context.lineTo(s.start.x+.01,s.start.y);}context.strokeStyle=style;context.globalAlpha=alpha;context.lineWidth=width;context.stroke();}};
    const blobs=(list,style,alpha,extra)=>{if(!list.length)return;context.beginPath();for(const a of list){context.moveTo(a.center.x+a.radius+extra,a.center.y);context.arc(a.center.x,a.center.y,a.radius+extra,0,Math.PI*2);}context.fillStyle=style;context.globalAlpha=alpha;context.fill();};
    const at=(list,level)=>list.filter(e=>e.level===level);
    // Snow settles on the track: its colours fade towards snow (light tracks most), so it stays a trodden line.
    const snow=level=>Math.min(.85,veil*WINTER_VEIL[level]),tone=(colour,level)=>veil>0?mixColour(colour,'#e8eddc',snow(level)):colour;
    const begin=()=>{context.save();context.translate(-left,-top);context.scale(1,.5);context.lineCap='round';context.lineJoin='round';};
    // Translucent halo and edge: clipped to the exact diamond, as the 1 px overlap used for opaque ground would double them into seams.
    context.save();clip?.();begin();
    for(const level of levels){const visual=this.pathVisual(level),edge=tone(visual.pathEdge,level),strips=[...at(links,level),...at(nodes,level)],plots=at(areas,level);
      for(let i=visual.pathSoftness??0;i>0;i--){lines(strips,edge,.16,3+i*3);blobs(plots,edge,.16,2+i*3);}lines(strips,edge,.6,3);blobs(plots,edge,.6,2);}
    context.restore();context.restore();
    // Opaque soil core with the approved texture: drawn with the overlap, so tile edges never show a seam.
    begin();
    for(const level of levels){const core=tone(this.pathVisual(level).pathColor,level),grain=Math.round(.85*(1-(veil>0?snow(level):0))*20)/20;
      lines([...at(links,level),...at(nodes,level)],this.pathPattern(context,level,core,grain),1,0);blobs(at(areas,level),this.pathPattern(context,level,core,grain/2),1,0);}
    context.restore();
  }


  groundAt(x,y){return this.scene.groundGrid?.[y]?.[x]??GROUND.GRASS;}
  // Texture of a neighbour's ground as it would be drawn there (seasonal grass included).
  groundKey(x,y,ground,season){
    if(ground!==GROUND.GRASS){const keys=this.groundKinds[ground];return keys?.length?keys[terrainHash(x,y)%keys.length]:null;}
    const seasonal=this.seasonGrass[season],wear=this.wearTextures[0];
    if(season!=='Summer'&&seasonal?.length)return seasonal[terrainHash(x,y)%seasonal.length];
    return wear?.variants.length?wear.variants[terrainHash(x,y)%wear.variants.length]:null;
  }
  // The neighbour's texture faded towards this tile's centre: a 64 × 32 canvas per (texture, edge), cached.
  featheredEdge(key,edge){
    if(typeof document==='undefined'||!key||!this.scene.textures.exists?.(key))return null;
    this.edgeCache??=new Map();const id=`${key}|${edge}`;if(this.edgeCache.has(id))return this.edgeCache.get(id);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d'),frame=this.scene.textures.get(key).get();
    c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,64,32);
    let gradient;
    if(edge>=4){const [cx,cy]=CORNERS[edge-4].at;c.translate(cx,cy);c.scale(2,1);gradient=c.createRadialGradient(0,0,0,0,0,FEATHER*.75);}
    else{const {start:[sx,sy],normal:[nx,ny]}=EDGES[edge],length=Math.hypot(nx,ny);gradient=c.createLinearGradient(sx,sy,sx+nx/length*FEATHER,sy+ny/length*FEATHER);}
    gradient.addColorStop(0,'rgba(0,0,0,.92)');gradient.addColorStop(.5,'rgba(0,0,0,.45)');gradient.addColorStop(1,'rgba(0,0,0,0)');
    c.globalCompositeOperation='destination-in';c.fillStyle=gradient;c.fillRect(-64,-32,128,64);
    this.edgeCache.set(id,canvas);return canvas;
  }
  blendEdges(context,x,y,ground,left,top,season){
    const shore=other=>this.shoreStyle==='round'&&(WATERY.has(other)!==WATERY.has(ground)||!WATERY.has(other)&&!WATERY.has(ground)&&(other===GROUND.GRASS)!==(ground===GROUND.GRASS)||[other,ground].includes(GROUND.DEEP)&&[other,ground].includes(GROUND.SHALLOW));
    for(const [index,edge]of EDGES.entries()){
      const nx=x+edge.dx,ny=y+edge.dy;if(nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;
      const other=this.groundAt(nx,ny);if(GROUND_RANK[other]<=GROUND_RANK[ground]||shore(other))continue;
      const overlay=this.featheredEdge(this.groundKey(nx,ny,other,season),index);if(overlay)context.drawImage(overlay,left,top);
    }
    // A higher ground that touches only this corner rounds it off (neither side neighbour already blends it in).
    for(const [index,corner]of CORNERS.entries()){
      const nx=x+corner.dx,ny=y+corner.dy;if(nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;
      const other=this.groundAt(nx,ny);if(GROUND_RANK[other]<=GROUND_RANK[ground]||shore(other))continue;
      if(corner.edges.some(e=>{const g=this.groundAt(x+EDGES[e].dx,y+EDGES[e].dy);return GROUND_RANK[g]>=GROUND_RANK[other];}))continue;
      const overlay=this.featheredEdge(this.groundKey(nx,ny,other,season),4+index);if(overlay)context.drawImage(overlay,left,top);
    }
  }
  // A bush shows on open ground only: not under a building, resource, paving or a well-trodden path.
  bushVisible(x,y,occupied){
    const key=`${x},${y}`;return this.scene.map?.[y]?.[x]===0&&!this.scene.resourceOccupancy?.has(key)&&!occupied.has(key)&&!this.wear?.isPaved?.({x,y})&&(this.wear?.level({x,y})??0)<2;
  }
  buildingTiles(){const tiles=new Set();for(const b of this.scene.buildings??[])for(const t of b.tiles??[])tiles.add(`${t.x},${t.y}`);return tiles;}
  paintBush(sprite,type,state,fog){
    const id=BUSH_TYPES[type];let key=this.assets?.hasTexture(id)?this.assets.key(id):null;if(!key)return false;
    if(state===VISIBILITY.EXPLORED){const texture=this.scene.textures.get(key);key=memoryTexture(this.scene,texture,texture.get(),fog.memoryBrightness)??key;}
    if(sprite.texture?.key!==key)sprite.setTexture(key);return true;
  }

  // Rounded shores: corner land shares, the shore mask for them and the other side's texture drawn through it.
  landCorners(x,y){
    const own=this.groundAt(x,y);return CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>{const nx=x+dx,ny=y+dy,g=nx<0||ny<0||nx>=COLUMNS||ny>=ROWS?own:this.groundAt(nx,ny);return n+(WATERY.has(g)?0:.25);},0));
  }
  shoreMask(corners,land){
    const id=`${corners.join(',')}|${land?1:0}`;this.shoreMasks??=new Map();if(this.shoreMasks.has(id))return this.shoreMasks.get(id);
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d'),image=c.createImageData(64,32),[tp,rt,bt,lf]=corners;
    for(let py=0;py<32;py++)for(let px=0;px<64;px++){
      const s=Math.max(0,Math.min(1,((py+.5)/16+(px+.5-32)/32)/2)),t=Math.max(0,Math.min(1,((py+.5)/16-(px+.5-32)/32)/2));
      const v=tp*(1-s)*(1-t)+rt*s*(1-t)+bt*s*t+lf*(1-s)*t,k=Math.max(0,Math.min(1,(v-.4)/.2)),a=k*k*(3-2*k);
      image.data[(py*64+px)*4+3]=Math.round((land?a:1-a)*255);
    }
    c.putImageData(image,0,0);this.shoreMasks.set(id,canvas);return canvas;
  }
  // The texture of the other side (land over a water tile, water over a land tile), clipped by the shore mask.
  shoreOverlay(key,corners,land){
    if(typeof document==='undefined'||!key||!this.scene.textures.exists?.(key))return null;
    const id=`${key}|${corners.join(',')}|${land?1:0}`;this.shoreCache??=new Map();if(this.shoreCache.has(id))return this.shoreCache.get(id);
    if(this.shoreCache.size>2400)this.shoreCache.clear();
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=32;const c=canvas.getContext('2d'),frame=this.scene.textures.get(key).get();
    c.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,64,32);c.globalCompositeOperation='destination-in';c.drawImage(this.shoreMask(corners,land),0,0);
    this.shoreCache.set(id,canvas);return canvas;
  }
  // The same contour between grass and bare ground (sand, mud, pebbles, desert): rounded banks and desert rims.
  grassCorners(x,y){
    const own=this.groundAt(x,y);return CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>{const nx=x+dx,ny=y+dy,g=nx<0||ny<0||nx>=COLUMNS||ny>=ROWS?own:this.groundAt(nx,ny);return n+(g===GROUND.GRASS?.25:0);},0));
  }
  roundBank(context,x,y,ground,left,top,season){
    if(this.shoreStyle!=='round'||WATERY.has(ground))return false;
    const corners=this.grassCorners(x,y),grass=ground===GROUND.GRASS;
    if(grass?corners.every(v=>v===1):corners.every(v=>v===0))return false;
    let best=null;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((!dx&&!dy)||nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;const g=this.groundAt(nx,ny);if(WATERY.has(g)||(g===GROUND.GRASS)===grass)continue;
      const score=grass?(g===ground?0:5-GROUND_RANK[g]):1;if(!best||score>best.score)best={x:nx,y:ny,g,score};}
    if(!best)return false;
    const overlay=this.shoreOverlay(this.groundKey(best.x,best.y,best.g,season),corners,!grass);if(overlay)context.drawImage(overlay,left,top);
    return true;
  }
  // Inside the water: the deep channel's edge against the shallows follows the same rounded contour.
  roundDeep(context,x,y,ground,left,top,season){
    if(this.shoreStyle!=='round'||(ground!==GROUND.DEEP&&ground!==GROUND.SHALLOW))return false;
    const corners=CORNER_TILES.map(list=>list.reduce((n,[dx,dy])=>{const g=this.groundAt(x+dx,y+dy);return n+(g===GROUND.DEEP||!WATERY.has(g)&&ground===GROUND.DEEP?.25:0);},0)),deep=ground===GROUND.DEEP;
    if(deep?corners.every(v=>v===1):corners.every(v=>v===0))return false;
    let best=null;for(let dy=-1;dy<=1&&!best;dy++)for(let dx=-1;dx<=1&&!best;dx++){const g=this.groundAt(x+dx,y+dy);if((dx||dy)&&g===(deep?GROUND.SHALLOW:GROUND.DEEP))best={x:x+dx,y:y+dy,g};}
    if(!best)return false;
    const overlay=this.shoreOverlay(this.groundKey(best.x,best.y,best.g,season),corners,!deep);if(overlay)context.drawImage(overlay,left,top);
    return true;
  }
  roundShore(context,x,y,ground,left,top,season){
    if(this.shoreStyle!=='round')return false;
    const corners=this.landCorners(x,y),watery=WATERY.has(ground);
    if(watery?corners.every(v=>v===0):corners.every(v=>v===1))return false;
    // The neighbour that supplies the other side: land of the highest rank for water tiles, the shallowest water for land.
    let best=null;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const nx=x+dx,ny=y+dy;if((!dx&&!dy)||nx<0||ny<0||nx>=COLUMNS||ny>=ROWS)continue;const g=this.groundAt(nx,ny);if(WATERY.has(g)===watery)continue;
      const score=watery?GROUND_RANK[g]:g===GROUND.SHALLOW?3:g===GROUND.FORD?2:1;if(!best||score>best.score)best={x:nx,y:ny,g,score};}
    if(!best)return false;
    const overlay=this.shoreOverlay(this.groundKey(best.x,best.y,best.g,season),corners,watery);if(overlay)context.drawImage(overlay,left,top);
    return true;
  }
  // World v2: grass zone wash (3×3 average), decals, reeds and ford stones. Deterministic per tile (hash).
  zoneTint(x,y){
    const zones=this.scene.grassZones;if(!zones)return null;let r=0,g=0,b=0,a=0,n=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const z=zones[y+dy]?.[x+dx];const own=zones[y][x];const t=ZONE_TINT[(this.groundAt(x+dx,y+dy)===GROUND.GRASS?z:own)??own]??ZONE_TINT[0];r+=t[0]*t[3];g+=t[1]*t[3];b+=t[2]*t[3];a+=t[3];n++;}
    return a>.001?`rgba(${Math.round(r/a)},${Math.round(g/a)},${Math.round(b/a)},${(a/n).toFixed(3)})`:null;
  }
  decalPoint(h,i,cx,cy){const u=((h>>>(i*5))&31)/31-.5,v=((h>>>(i*5+3))&31)/31-.5;return {x:cx+(u-v)*36,y:cy+(u+v)*18};}
  paintDecals(context,x,y,cx,cy,season,occupied){
    const zone=this.scene.grassZones?.[y]?.[x];if(zone==null||occupied?.has(`${x},${y}`)||this.wear?.isPaved?.({x,y})||(this.wear?.level({x,y})??0)>=2||this.scene.resourceOccupancy?.has(`${x},${y}`))return;
    let h=terrainHash(x*7+3,y*13+5);
    const list=season==='Autumn'?[...ZONE_DECALS[zone],['leaf',.35,[1,3]]]:ZONE_DECALS[zone];
    for(const [kind,chance,[lo,hi]]of list){
      h=Math.imul(h^0x9e3779b9,2654435761)>>>0;if((h%1000)/1000>=chance)continue;if(season==='Winter'&&kind!=='pebble')continue;
      const count=lo+h%(hi-lo+1);
      for(let i=0;i<count;i++){const p=this.decalPoint(Math.imul(h,i+7)>>>0,i%3,cx,cy),k=(h>>>(i*3))&7;context.beginPath();
        if(kind==='tuft'||kind==='dryTuft'){context.strokeStyle=kind==='tuft'?(season==='Autumn'?'rgba(110,98,40,.7)':'rgba(48,92,34,.65)'):'rgba(150,128,62,.7)';context.lineWidth=1;for(const d of [-2,0,2]){context.moveTo(p.x+d*.6,p.y);context.lineTo(p.x+d,p.y-3-(k&1));}context.stroke();}
        else if(kind==='flower'){context.fillStyle=['#f1ecd8','#f2d45c','#b88ad6','#e7a0b8'][k&3];context.arc(p.x,p.y-1,1.2,0,Math.PI*2);context.fill();}
        else if(kind==='pebble'){context.fillStyle=k&1?'rgba(150,148,138,.9)':'rgba(118,116,108,.9)';context.ellipse(p.x,p.y,1.8+(k&1),1.1,0,0,Math.PI*2);context.fill();}
        else if(kind==='leaf'){context.fillStyle=['rgba(168,98,38,.75)','rgba(190,140,52,.75)','rgba(120,78,40,.75)'][k%3];context.ellipse(p.x,p.y,1.6,.9,k,0,Math.PI*2);context.fill();}}
    }
  }
  paintReeds(context,x,y,cx,cy,season){
    if(!this.scene.reeds?.has(`${x},${y}`))return;const h=terrainHash(x*11+1,y*5+7),colour=season==='Winter'||season==='Autumn'?'rgba(176,150,88,.95)':'rgba(70,118,52,.95)';
    context.strokeStyle=colour;context.lineWidth=1.2;context.beginPath();
    for(let i=0;i<7;i++){const p=this.decalPoint(Math.imul(h,i+3)>>>0,i%3,cx,cy),height=6+((h>>>i)&7);context.moveTo(p.x,p.y);context.quadraticCurveTo(p.x+1,p.y-height/2,p.x+((h>>>(i+2))&1?2:-2),p.y-height);}
    context.stroke();
  }
  paintFordStones(context,x,y,cx,cy){
    const h=terrainHash(x*5+9,y*7+2);for(let i=0;i<3;i++){const p=this.decalPoint(Math.imul(h,i+5)>>>0,i,cx,cy),r=2.4+((h>>>(i*4))&3)*.7;
      context.fillStyle='rgba(92,92,86,.95)';context.beginPath();context.ellipse(p.x,p.y+.8,r+.6,r*.62+.4,0,0,Math.PI*2);context.fill();
      context.fillStyle='rgba(156,154,144,.95)';context.beginPath();context.ellipse(p.x,p.y,r,r*.6,0,0,Math.PI*2);context.fill();}
  }
  tileData(tile){return this.memory?.terrainAt(tile,this.map,this.wear,this.season)??[this.map[tile.y]?.[tile.x]??0,this.wear?.level(tile)??0,this.season,0,this.wear?.isPaved?.(tile)?1:0];}

  chunkTexture(cx, cy) {
    const key = `terrain-chunk-${cx}-${cy}`;
    const origin = gridToWorld(cx * CHUNK_SIZE, cy * CHUNK_SIZE);
    const left = origin.x - CHUNK_SIZE * 32;
    if (!this.scene.textures.exists(key)||this.dirtyChunks.has(`${cx},${cy}`)) {
      // Sto statických diamantů se jednou složí do jedné textury. Při posouvání
      // kamery se pak kreslí desítky bloků, ne tisíce samostatných obrázků.
      const texture = this.scene.textures.exists(key)?this.scene.textures.get(key):this.scene.textures.createCanvas(key, CHUNK_SIZE * 64, CHUNK_SIZE * 32);
      const context = texture.getContext();
      let dirty=this.dirtyTiles.get(`${cx},${cy}`);
      // V2 paths are one continuous image per chunk: a partial repaint near a path would leave antialiased tile edges
      // between old and new pixels, so a chunk with a dirty tile near a path is repainted whole (cached overlays, cheap).
      if(dirty&&this.pathStyle==='v2'&&this.v2?.geo&&[...dirty].some(i=>this.v2.near(i%COLUMNS,Math.floor(i/COLUMNS))))dirty=null;
      if(!dirty)context.clearRect(0,0,texture.width,texture.height);
      // Ground first for every tile, tracks second: a neighbour's ground overlap can then never cover a track's edge.
      const paths=[],occupied=this.buildingTiles();
      for (let y = cy * CHUNK_SIZE; y < (cy + 1) * CHUNK_SIZE; y++) {
        for (let x = cx * CHUNK_SIZE; x < (cx + 1) * CHUNK_SIZE; x++) {
          if(dirty&&!dirty.has(y*COLUMNS+x))continue;
          this.paintStats.tiles++;
          const point = tileCenter({ x, y });
          const tile={x,y},state=this.fog?.displayState(tile)??VISIBILITY.VISIBLE,[,level,season]=this.tileData(tile);
          const polygon=(e=0)=>{context.beginPath();context.moveTo(point.x-left-32-e,point.y-origin.y);context.lineTo(point.x-left,point.y-origin.y-16-e/2);context.lineTo(point.x-left+32+e,point.y-origin.y);context.lineTo(point.x-left,point.y-origin.y+16+e/2);context.closePath();};
          // The clip reaches a little past the diamond so antialiased edges of neighbours overlap
          // instead of leaving a light seam; ground tiles carry a pixel of bleed for this.
          // Clear only the tile's own diamond, then draw with the reach, so a repainted tile never erases its neighbour's edge.
          // A whole-chunk paint starts from a cleared canvas; clearing each diamond again would leave its antialiased rim
          // half transparent where the previous neighbour had already painted, which shows as a light grid.
          if(dirty){context.save();polygon();context.clip();context.clearRect(point.x-left-33,point.y-origin.y-17,66,34);context.restore();}
          context.save();polygon(TILE_BLEED);context.clip();
          if(state===VISIBILITY.UNEXPLORED){context.fillStyle='#000';polygon(TILE_BLEED);context.fill();context.restore();continue;}
          const ground=this.groundAt(x,y),groundKeys=ground?this.groundKinds[ground]:null;
          if(groundKeys?.length){
            if(state===VISIBILITY.EXPLORED)context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;
            const key=groundKeys[terrainHash(x,y)%groundKeys.length],frame=this.scene.textures.get(key).get();
            context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);
            this.blendEdges(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            this.roundDeep(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            this.roundBank(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            this.roundShore(context,x,y,ground,point.x-left-32,point.y-origin.y-16,season);
            const winter=GROUND_WINTER[ground],mix=state===VISIBILITY.VISIBLE?this.seasonMix?.(x,y,season):null,amount=season==='Winter'?(mix?mix.amount:1):mix?.from==='Winter'?1-mix.amount:0;
            if(winter&&amount>0){context.globalCompositeOperation='source-atop';context.globalAlpha=amount;context.fillStyle=winter;polygon(TILE_BLEED);context.fill();context.globalAlpha=1;}
            context.globalCompositeOperation='source-over';
            if(ground===GROUND.FORD)this.paintFordStones(context,x,y,point.x-left,point.y-origin.y);
            else if(ground===GROUND.SHALLOW)this.paintReeds(context,x,y,point.x-left,point.y-origin.y,season);
            if(this.wear)paths.push({x,y,polygon,filter:context.filter,veil:season==='Winter'?.45:0});
            context.restore();continue;
          }
          const wear=this.wear?this.wearTextures[0]:null,entry=wear?(wear.variants.length?{key:wear.variants[terrainHash(x,y)%wear.variants.length]}:wear):this.groundTextures[terrainHash(x,y)%this.groundTextures.length];
          if(state===VISIBILITY.EXPLORED)context.filter=`grayscale(${(1-FOG_STYLE.saturation)*100}%) brightness(${(this.fog?.brightness(tile)??FOG_STYLE.brightness)*100}%)`;
          const draw=key=>{const frame=this.scene.textures.get(key).get(key===entry.key?entry.frame:undefined);context.drawImage(frame.source.image,frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,point.x-left-32,point.y-origin.y-16,64,32);};
          const mix=state===VISIBILITY.VISIBLE?this.seasonMix?.(x,y,season):null;
          // Untouched grass shows the season's own tiles; during a transition the new season fades in over the old one.
          const seasonal=season=>season==='Summer'?entry.key:this.seasonGrass[season]?.[terrainHash(x,y)%this.seasonGrass[season].length],grassSeason=wear&&seasonal(season)&&(!mix||seasonal(mix.from));
          if(grassSeason&&mix){draw(seasonal(mix.from));context.globalAlpha=mix.amount;draw(seasonal(season));context.globalAlpha=1;}
          else draw(grassSeason?seasonal(season):entry.key);
          if(this.wear)paths.push({x,y,polygon,filter:context.filter,veil:mix?(mix.from==='Winter'?1-mix.amount:0)*.45+(season==='Winter'?mix.amount:0)*.45:season==='Winter'?.45:0});
          const tint=(mix&&mixTint(mix.from,season,mix.amount))??{Spring:'rgba(95,145,65,.08)',Summer:'rgba(185,159,70,.09)',Autumn:'rgba(158,105,45,.17)',Winter:'rgba(232,237,220,.83)'}[season];
          if(tint&&!grassSeason){context.globalCompositeOperation='source-atop';context.fillStyle=tint;polygon(TILE_BLEED);context.fill();}
          const zoneTint=season==='Winter'?null:this.zoneTint(x,y);if(zoneTint){context.globalCompositeOperation='source-atop';context.fillStyle=zoneTint;polygon(TILE_BLEED);context.fill();}
          context.globalCompositeOperation='source-over';
          const bank=this.roundBank(context,x,y,GROUND.GRASS,point.x-left-32,point.y-origin.y-16,season),shore=this.roundShore(context,x,y,GROUND.GRASS,point.x-left-32,point.y-origin.y-16,season);
          if(!bank&&!shore)this.paintDecals(context,x,y,point.x-left,point.y-origin.y,season,occupied);
          context.restore();
        }
      }
      if(this.pathStyle==='v2'&&this.v2)this.v2.drawChunk(context,cx,cy,left,origin.y,paths);
      else for(const p of paths){context.save();p.polygon(TILE_BLEED);context.clip();context.filter=p.filter;this.drawPaths(context,p.x,p.y,left,origin.y,p.veil,()=>{p.polygon();context.clip();});context.restore();}
      // S11 Stone Pavement on top of ground and tracks; under Fog of War only the remembered surface is drawn.
      for(const p of paths){const paved=tile=>this.tileData(tile)[4]===1;if(!paved(p))continue;const c=tileCenter(p);context.save();context.filter=p.filter;
        drawCobbles(context,c.x-left,c.y-origin.y,{tileX:p.x,tileY:p.y,winter:p.veil>.3,edges:{N:!paved({x:p.x-1,y:p.y}),E:!paved({x:p.x,y:p.y-1}),S:!paved({x:p.x+1,y:p.y}),W:!paved({x:p.x,y:p.y+1})}});context.restore();}
      texture.refresh();
      this.paintStats.chunks++;
      this.dirtyChunks.delete(`${cx},${cy}`);
      this.dirtyTiles.delete(`${cx},${cy}`);
    }
    return { key, x: left, y: origin.y };
  }

  createTextures() {
    this.groundTextures=[];
    const palette=[];
    for(const id of ['grass','dirt']){
      const definition=this.registry.require(id);
      if(this.assets?.usesSprite(definition))this.groundTextures.push({key:this.assets.textureKey(id),frame:definition.spritesheet?definition.visual?.previewFrame??0:undefined});
      else for(const color of definition.visual?.colors??[0xaaa375]){
        const key=`terrain-${palette.length}`;palette.push(color);this.groundTextures.push({key});
      }
    }
    for (let i = 0; i < palette.length; i++) {
      if (this.scene.textures.exists(`terrain-${i}`)) continue;
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(palette[i]);
      g.fillPoints([{ x: 32, y: 0 }, { x: 64, y: 16 }, { x: 32, y: 32 }, { x: 0, y: 16 }], true);
      g.lineStyle(1, 0x5c583b, 0.15);
      g.strokePoints([{ x: 32, y: 0 }, { x: 64, y: 16 }, { x: 32, y: 32 }, { x: 0, y: 16 }], true);
      for (let j = 0; j < 9; j++) {
        const x = 16 + (i * 13 + j * 7) % 32, y = 10 + (i * 7 + j * 3) % 12;
        g.lineStyle(1, j % 2 ? 0xd1bd86 : 0x747843, 0.45);
        g.lineBetween(x, y, x + 2, y - 2);
      }
      g.generateTexture(`terrain-${i}`, 64, 32); g.destroy();
    }
    if (!this.scene.textures.exists('terrain-wall')) {
      const g = this.scene.make.graphics({ x: 0, y: 0, add: false });
      const poly = (color, points) => { g.fillStyle(color); g.fillPoints(points.map(([x,y])=>({x,y})),true); };
      g.fillStyle(0x302d20, 0.3); g.fillEllipse(33, 47, 52, 17);
      poly(0x8a8878, [[7,39],[18,18],[34,15],[34,50],[19,51]]);
      poly(0x666a60, [[34,15],[48,20],[58,40],[45,50],[34,50]]);
      poly(0xb2ae98, [[7,39],[18,18],[34,15],[48,20],[58,40],[34,35]]);
      g.lineStyle(1,0x606454,0.7); g.lineBetween(22,22,25,37);g.lineBetween(42,22,38,34);
      g.generateTexture('terrain-wall',64,64);g.destroy();
    }
  }

  // Remembered rocks use the same muted memory copy as other remembered objects; visible rocks the original art.
  paintWall(wall,state,fog){
    let key=this.wallTexture;
    if(state===VISIBILITY.EXPLORED){const texture=this.scene.textures.get(this.wallTexture);key=memoryTexture(this.scene,texture,texture.get(),fog.memoryBrightness)??key;}
    if(wall.texture.key!==key)wall.setTexture(key);
  }
  updateFog(camera,fog) {
    const mode=`${fog?.enabled}:${fog?.explorationEnabled}`;
    if(mode!==this.fogMode){
      this.originalBackground??=camera.backgroundColor?.rgba??'#3a3c2b';
      // Diamond edges are antialiased. Their transparent seams must reveal
      // black, never the normal olive scene background in undiscovered areas.
      camera.setBackgroundColor?.(fog?.enabled?'#000':this.originalBackground);
      this.fogMode=mode;this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';
    }else if(fog&&this.fogBrightness!==undefined&&this.fogBrightness!==fog.memoryBrightness){
      // The slider lives in Settings, which pause the game loop: repaint the shown chunks now, the rest when they scroll in.
      this.repaintAll=true;this.dirtyTiles.clear();for(let y=0;y<ROWS/CHUNK_SIZE;y++)for(let x=0;x<COLUMNS/CHUNK_SIZE;x++)this.dirtyChunks.add(`${x},${y}`);this.lastView='';
    }
    this.fogBrightness=fog?.memoryBrightness;
    if(fog&&this.fogRevision!==fog.revision){
      const previous=this.paintedVisibility??new Set(),current=fog.visibleIndices;
      // Consumers may skip revisions (Save, several source updates, a paused
      // frame). Compare against what this renderer actually painted, rather
      // than the last producer delta, which may already have been overwritten.
      const changed=[...previous].filter(index=>!current.has(index));
      for(const index of current)if(!previous.has(index))changed.push(index);
      this.paintedVisibility=new Set(current);this.fogRevision=fog.revision;
      if(fog.enabled)this.invalidateArea(changed.map(index=>({x:index%fog.width,y:Math.floor(index/fog.width)})),false);
    }
  }

  // Performance: a newly visible chunk is painted at once (never a hole); already shown chunks that became dirty
  // (fog, path wear, pavement, season) repaint at most two per frame, so a wave of changes never freezes a frame.
  repaintDirty(){
    let budget=this.repaintAll?Infinity:2;this.repaintAll=false;
    for (const key of this.neededChunks??[]) {
      const shown=this.chunks.has(key);if(shown&&!this.dirtyChunks.has(key))continue;if(shown&&budget--<=0)continue;
      const [cx,cy] = key.split(',').map(Number), texture = this.chunkTexture(cx,cy);
      const image = this.chunks.get(key)??this.chunkPool.pop() ?? this.scene.add.image(0,0,texture.key).setOrigin(0,0).setDepth(-100);
      image.setTexture(texture.key).setPosition(texture.x,texture.y).setVisible(true);
      this.chunks.set(key,image);
    }
  }
  update(camera,fog=null,memory=this.memory) {
    this.fog=fog;this.memory=memory;
    this.updateFog(camera,fog);
    if(this.wear&&this.pathStyle==='v2'){this.v2?.frame();this.v2?.refresh();}
    const view = camera.worldView;
    const cacheKey = [Math.floor(view.x / 16), Math.floor(view.y / 16), Math.ceil(view.width), Math.ceil(view.height),fog?`${fog.enabled}:${fog.explorationEnabled}`:'',this.debugEnabled?this.wear?.levelRevision??0:0,this.debugEnabled?this.wear?.revision:0,this.debugEnabled,this.scene.bushes?.size?`${this.scene.buildings?.length}:${this.scene.naturalResources?.topologyRevision}:${this.scene.resourceOccupancy?.size}:${this.wear?.levelRevision}`:''].join(',');
    // Performance: path wear repaints only its own tiles (invalidateArea), so it no longer re-walks every visible tile.
    // Sight moving by a step only re-tints the rock outcrops whose visibility changed; the full walk over every visible
    // tile runs when the camera moves, the Fog mode changes, or a newly seen rock has no sprite yet.
    if (cacheKey === this.lastView && fog && this.outcropFogRevision!==fog.revision) {
      const fresh=this.outcropFogRevision===fog.revision-1;this.outcropFogRevision=fog.revision;
      if(fresh)for(const index of [...fog.added,...fog.removed]){const x=index%fog.width,y=Math.floor(index/fog.width),key=`${x},${y}`;if(!this.tileData({x,y})[0])continue;
        const tile=this.tiles.get(key);if(!tile){if(fog.added.includes(index)){this.lastView='';break;}continue;}this.paintWall(tile,fog.displayState({x,y}),fog);}
      else this.lastView='';
    }
    if (cacheKey === this.lastView) {this.repaintDirty();return;}
    this.outcropFogRevision=fog?.revision;
    this.lastView = cacheKey;
    this.debugGraphics.clear();
    const padding = 100;
    const corners = [[view.x-padding,view.y-padding],[view.right+padding,view.y-padding],
      [view.x-padding,view.bottom+padding],[view.right+padding,view.bottom+padding]].map(([x,y])=>worldToGrid(x,y));
    const minX=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.x)))-1);
    const maxX=Math.min(COLUMNS-1,Math.ceil(Math.max(...corners.map(p=>p.x)))+1);
    const minY=Math.max(0,Math.floor(Math.min(...corners.map(p=>p.y)))-1);
    const maxY=Math.min(ROWS-1,Math.ceil(Math.max(...corners.map(p=>p.y)))+1);
    const visible = new Set(), neededChunks = new Set(), chunkIds = new Set(), shownBushes=new Set();let occupied=null;
    let visibleCount = 0;
    for(let y=minY;y<=maxY;y++) for(let x=minX;x<=maxX;x++) {
      const p=tileCenter({x,y});
      if(p.x<view.x-padding||p.x>view.right+padding||p.y<view.y-padding||p.y>view.bottom+padding)continue;
      visibleCount++;
      if(this.debugEnabled&&this.wear?.isGrass({x,y})&&(!fog||fog.isVisibleTile({x,y}))){
        const colors=[0x87a18a,0x7fbf6a,0xc6cf75,0xdfac67,0xe38b57],level=this.wear.level({x,y});
        this.debugGraphics.fillStyle(colors[level],level ? .36 : .08);this.debugGraphics.fillPoints([{x:p.x-31,y:p.y},{x:p.x,y:p.y-15},{x:p.x+31,y:p.y},{x:p.x,y:p.y+15}],true);
      }
      const chunk=Math.floor(y/CHUNK_SIZE)*64+Math.floor(x/CHUNK_SIZE);if(!chunkIds.has(chunk)){chunkIds.add(chunk);neededChunks.add(`${Math.floor(x/CHUNK_SIZE)},${Math.floor(y/CHUNK_SIZE)}`);}
      const bush=this.scene.bushes?.get(`${x},${y}`);
      if(bush!==undefined){
        occupied??=this.buildingTiles();const state=fog?.displayState({x,y})??VISIBILITY.VISIBLE;
        if(state!==VISIBILITY.UNEXPLORED&&(!fog?.enabled||fog.isInSightTile({x,y})||fog.explored[y*fog.width+x])&&this.bushVisible(x,y,occupied)){
          const key=`${x},${y}`,id=BUSH_TYPES[bush],definition=this.registry.get?.(id),sprite=this.bushSprites.get(key)??this.bushPool.pop()??this.scene.add.image(0,0,this.assets?.textureKey(id)??'__DEFAULT');
          if(this.paintBush(sprite,bush,state,fog)){sprite.setOrigin(definition?.origin?.x??.5,definition?.origin?.y??.6).setPosition(p.x,p.y).setDepth(p.y+(definition?.depth?.offset??0)).setVisible(true);this.bushSprites.set(key,sprite);shownBushes.add(key);}
          else{sprite.setVisible(false);this.bushPool.push(sprite);this.bushSprites.delete(key);}
        }
      }
      // Only rock outcrops need sprites: ordinary ground stops here without any fog or memory lookups.
      if(!this.map[y]?.[x])continue;
      const state=fog?.displayState({x,y})??VISIBILITY.VISIBLE;
      if(!this.tileData({x,y})[0]||state===VISIBILITY.UNEXPLORED)continue;
      if(fog?.enabled&&!fog.isInSightTile({x,y})&&!fog.explored[y*fog.width+x])continue;
      const key=`${x},${y}`; visible.add(key);
      if(this.tiles.has(key)){this.paintWall(this.tiles.get(key),state,fog);continue;}
      const wall=this.wallPool.pop()??this.scene.add.image(0,0,this.wallTexture).setOrigin(this.outcrop.origin?.x??0.5,this.outcrop.origin?.y??1);
      wall.setPosition(p.x,p.y).setDepth(p.y+(this.outcrop.depth?.offset??0)).setVisible(true);this.paintWall(wall,state,fog);
      this.tiles.set(key,wall);
    }
    for(const [key,tile] of this.tiles) if(!visible.has(key)) {
      tile.setVisible(false);this.wallPool.push(tile);
      this.tiles.delete(key);
    }
    for(const [key,sprite]of this.bushSprites)if(!shownBushes.has(key)){sprite.setVisible(false);this.bushPool.push(sprite);this.bushSprites.delete(key);}
    for (const [key, chunk] of this.chunks) if (!neededChunks.has(key)) {
      chunk.setVisible(false); this.chunkPool.push(chunk); this.chunks.delete(key);
    }
    this.neededChunks=neededChunks;this.repaintDirty();
    this.visibleCount=visibleCount;
  }
  destroy(){this.unsubscribeWear?.();this.debugGraphics.destroy();}
}
