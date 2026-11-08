import { gridToWorld, worldToGrid } from './isometric.js';
import { COLUMNS, ROWS } from './config.js';
import { GROUND } from '../data/worldTerrain.js';
import { WATER_LIFE, pickFishTiles, tileHash } from '../data/waterLife.js';

// m-svet-vzhled-2 (owner request 47): small dark fish shadows swim slowly in visible water and now and then a ring
// spreads on the surface. Density follows the water body's fish stock (FishingSystem.state); nothing under the fog,
// at most WATER_LIFE.maxOnScreen on screen. Purely visual: no game state is read beyond ground, sight and fish stock.
const TEXTURE='water:fish-shadow',FRAME_W=34,FRAME_H=20,DIRECTIONS=8;
export class FishShadows {
  constructor(scene){
    this.scene=scene;this.fish=new Map();this.pool=[];this.ripples=[];this.ripplePool=[];this.time=0;this.next=0;
    this.ensureTexture();
  }
  // Eight headings drawn in grid space through the isometric matrix, so a fish lies flat on the water.
  ensureTexture(){
    const textures=this.scene.textures;if(textures.exists(TEXTURE))return;
    const canvas=document.createElement('canvas');canvas.width=FRAME_W*DIRECTIONS;canvas.height=FRAME_H;const ctx=canvas.getContext('2d');
    for(let k=0;k<DIRECTIONS;k++){
      ctx.setTransform(32,16,-32,16,k*FRAME_W+FRAME_W/2,FRAME_H/2);ctx.rotate(k*Math.PI/4);ctx.fillStyle='rgb(14,30,38)';
      ctx.beginPath();ctx.ellipse(0,0,.19,.065,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.moveTo(-.15,0);ctx.lineTo(-.3,-.07);ctx.lineTo(-.27,0);ctx.lineTo(-.3,.07);ctx.closePath();ctx.fill();
    }
    ctx.setTransform(1,0,0,1,0,0);const texture=textures.addCanvas(TEXTURE,canvas);for(let k=0;k<DIRECTIONS;k++)texture.add(k,0,k*FRAME_W,0,FRAME_W,FRAME_H);
  }
  // Water tiles in the camera view that are in sight, with their stock state; then the deterministic pick.
  targets(){
    const s=this.scene,fishing=s.fishing,ground=s.groundGrid,fog=s.fog,camera=s.cameras.main;if(!fishing?.bodies||!ground)return [];
    const v=camera.worldView,c=[worldToGrid(v.x,v.y),worldToGrid(v.right,v.y),worldToGrid(v.x,v.bottom),worldToGrid(v.right,v.bottom)];
    const minX=Math.max(0,Math.floor(Math.min(...c.map(p=>p.x)))),maxX=Math.min(COLUMNS-1,Math.ceil(Math.max(...c.map(p=>p.x)))),minY=Math.max(0,Math.floor(Math.min(...c.map(p=>p.y)))),maxY=Math.min(ROWS-1,Math.ceil(Math.max(...c.map(p=>p.y))));
    const candidates=[],states=new Map();
    for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){
      const g=ground[y]?.[x];if(g!==GROUND.SHALLOW&&g!==GROUND.DEEP)continue;
      const p=gridToWorld(x+.5,y+.5);if(p.x<v.x-20||p.x>v.right+20||p.y<v.y-12||p.y>v.bottom+12)continue;
      if(fog&&!fog.isVisibleTile({x,y}))continue;
      const body=fishing.bodyAt(x,y);if(body<0)continue;let state=states.get(body);if(!state){state=fishing.state(body);states.set(body,state);}
      candidates.push({x,y,state,ground:g});
    }
    return pickFishTiles(candidates,WATER_LIFE.maxOnScreen);
  }
  refresh(){
    const keep=new Set();
    for(const t of this.targets()){const key=`${t.x},${t.y}`;keep.add(key);if(this.fish.has(key))continue;
      const image=this.pool.pop()??this.scene.add.image(0,0,TEXTURE,0).setDepth(-65);
      const r=WATER_LIFE.ripple;this.fish.set(key,{image,tile:{x:t.x,y:t.y},phase:tileHash(t.x,t.y,1)*Math.PI*2,dir:tileHash(t.x,t.y,2)<.5?1:-1,speed:WATER_LIFE.swim.speed*(.7+.6*tileHash(t.x,t.y,3)),ripple:this.time+r.minMs*.3+tileHash(t.x,t.y,4)*(r.maxMs-r.minMs)});
      image.setVisible(true);}
    for(const [key,f]of this.fish)if(!keep.has(key)){f.image.setVisible(false);this.pool.push(f.image);this.fish.delete(key);}
  }
  update(delta=16){
    const s=this.scene;this.time+=Math.max(0,delta);
    // Sight, camera and stock changes are picked up four times a second; animation and the fog check run every frame.
    if(this.time>=this.next){this.refresh();this.next=this.time+WATER_LIFE.refreshMs;}
    const fog=s.fog?.enabled?s.fog:null;
    const sw=WATER_LIFE.swim,rp=WATER_LIFE.ripple;
    for(const f of this.fish.values()){
      const a=f.phase+f.dir*this.time*f.speed,gx=f.tile.x+.5+Math.cos(a)*sw.radius,gy=f.tile.y+.5+Math.sin(a)*sw.radius*.8;
      // Heading = derivative of the loop, in grid space, mapped to the nearest of the 8 drawn frames.
      const hx=-Math.sin(a)*f.dir,hy=Math.cos(a)*.8*f.dir,frame=((Math.round(Math.atan2(hy,hx)/(Math.PI/4))%DIRECTIONS)+DIRECTIONS)%DIRECTIONS;
      const seen=!fog||fog.isInSightTile(f.tile);f.image.setVisible(seen);if(!seen)continue;
      const p=gridToWorld(gx,gy);f.image.setPosition(p.x,p.y).setFrame(frame).setAlpha(sw.alpha+sw.alphaWave*Math.sin(this.time*.0011+f.phase*3));
      if(this.time>=f.ripple){f.ripple=this.time+rp.minMs+tileHash(f.tile.x,f.tile.y,Math.floor(this.time))*(rp.maxMs-rp.minMs);this.ring(p.x,p.y);}
    }
    for(let i=this.ripples.length-1;i>=0;i--){
      const r=this.ripples[i],k=(this.time-r.born)/rp.durationMs;
      if(k>=1){r.shape.setVisible(false);this.ripplePool.push(r.shape);this.ripples.splice(i,1);continue;}
      r.shape.setScale(.25+k*.9).setAlpha(rp.alpha*(1-k)*(1-k));
    }
  }
  ring(x,y){
    const shape=this.ripplePool.pop()??this.scene.add.ellipse(0,0,WATER_LIFE.ripple.radius*2,WATER_LIFE.ripple.radius).setStrokeStyle(1,0xe4f2f0,1).setDepth(-64);
    shape.setPosition(x,y).setScale(.25).setAlpha(WATER_LIFE.ripple.alpha).setVisible(true);this.ripples.push({shape,born:this.time});
  }
  // Smoke/debug: the drawn fish tiles.
  tiles(){return [...this.fish.values()].map(f=>({...f.tile,visible:f.image.visible}));}
  destroy(){for(const f of this.fish.values())f.image.destroy();for(const i of this.pool)i.destroy();for(const r of this.ripples)r.shape.destroy();for(const r of this.ripplePool)r.destroy();this.fish.clear();this.ripples=[];}
}
