import { gridToWorld } from './isometric.js';
import { buildingDefinition,towerBase } from './buildings.js';
import { YARD_RESOURCES,pileStage } from '../data/logistics.js';

// m-sklady-materialu-koncept (21, 49): visible material piles drawn in code. A Material Yard has four fields
// (wood, stone, iron ore, iron), each pile growing in PILE_STAGES sizes; producers have one small pile by the building.
// Textures are generated once per resource and size; views change texture only when a size changes.
const LOG_ROWS=[[],[2],[3,2],[4,3,2],[5,4,3,2]];
const BLOCKS=[[],[[0,0,0],[1,0,0]],[[0,0,0],[1,0,0],[0,1,0],[1,1,0]],[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,2,0],[1,2,0],[.5,.5,1],[.5,1.5,1]],[[0,0,0],[1,0,0],[0,1,0],[1,1,0],[0,2,0],[1,2,0],[0,.5,1],[1,.5,1],[0,1.5,1],[1,1.5,1],[.5,1,2]]];
const HEAP=[[0,0],[16,6],[22,10],[27,14],[31,18]];
// Point in polygon (kept free of Phaser so node tests can drive these views with a stub scene).
const inside=(points,x,y)=>{let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;}return hit;};
export const PILE_TEXTURE={width:72,height:64,baseY:48};
// Stage of every yard field from a location's stock: one field per resource fills at a quarter of the capacity.
export const yardPileStages=location=>Object.fromEntries(YARD_RESOURCES.map(id=>[id,pileStage(location?.stock?.[id]??0,(location?.capacity??0)/YARD_RESOURCES.length)]));
export const producerPileStage=location=>pileStage(Object.values(location?.stock??{}).reduce((n,v)=>n+v,0),location?.capacity??0);

// Grid-aligned box: u along grid x, v along grid y (screen px), z up.
function box(g,u0,u1,v0,v1,z0,z1,[top,left,right]){
  const p=(u,v,z)=>({x:u-v,y:(u+v)/2-z});
  g.fillStyle(left,1);g.fillPoints([p(u0,v1,z0),p(u1,v1,z0),p(u1,v1,z1),p(u0,v1,z1)],true);
  g.fillStyle(right,1);g.fillPoints([p(u1,v0,z0),p(u1,v1,z0),p(u1,v1,z1),p(u1,v0,z1)],true);
  g.fillStyle(top,1);g.fillPoints([p(u0,v0,z1),p(u1,v0,z1),p(u1,v1,z1),p(u0,v1,z1)],true);
  g.lineStyle(1,0x2b261f,.35);g.strokePoints([p(u0,v0,z1),p(u1,v0,z1),p(u1,v1,z1),p(u0,v1,z1)],true);
}
function drawPile(g,resource,stage){
  g.fillStyle(0x1f1a12,.22);g.fillEllipse(0,2,14+stage*9,6+stage*3.5);
  if(resource==='wood'){
    // Logs lie along grid y; rows stack upwards, back to front.
    const axis={x:-12,y:6},side={x:6.2,y:3.1};
    LOG_ROWS[stage].forEach((count,row)=>{for(let i=0;i<count;i++){const o=(i-(count-1)/2),c={x:o*side.x,y:o*side.y-row*5.2-2};
      g.lineStyle(6,0x5c3f25,1);g.lineBetween(c.x-axis.x,c.y-axis.y,c.x+axis.x,c.y+axis.y);g.lineStyle(2,0x8a6440,1);g.lineBetween(c.x-axis.x,c.y-axis.y-2,c.x+axis.x,c.y+axis.y-2);
      g.fillStyle(0x7a5634,1);g.fillEllipse(c.x+axis.x,c.y+axis.y,6.4,6);g.fillStyle(0xc9a36b,1);g.fillEllipse(c.x+axis.x,c.y+axis.y,4.4,4);g.fillStyle(0x9b7647,1);g.fillCircle(c.x+axis.x,c.y+axis.y,1);
    }});
  }else if(resource==='stone'){
    const blocks=[...BLOCKS[stage]].sort((a,b)=>a[2]-b[2]||a[0]+a[1]-b[0]-b[1]);
    for(const [i,j,k]of blocks){const u=-9+i*9,v=-11+j*8;box(g,u,u+8,v,v+7,k*6,k*6+6,(i+j+k)%2?[0xc0bbad,0x8f8a7e,0x75716a]:[0xb2ad9f,0x878275,0x6c685f]);}
  }else if(resource==='iron_ore'){
    const [w,h]=HEAP[stage],pts=[];for(let i=0;i<=16;i++){const a=Math.PI*i/16;pts.push({x:-w*Math.cos(a),y:2-h*Math.sin(a)*(1+.12*Math.sin(i*2.3))});}
    g.fillStyle(0x4f443d,1);g.fillPoints([...pts,{x:w*.7,y:4},{x:-w*.7,y:4}],true);
    g.fillStyle(0x3e3530,1);g.fillPoints([{x:w*.15,y:2-h*.95},{x:w,y:2},{x:w*.7,y:4},{x:w*.1,y:4}],true);
    for(let i=0;i<stage*7;i++){const a=(i*2.39)%Math.PI,r=.25+((i*37)%60)/100,x=-Math.cos(a)*w*r,y=2-Math.sin(a)*h*r*.9;g.fillStyle(i%3?0x2e2826:0x9a5a3a,1);g.fillCircle(x,y,i%4?1.4:2);}
  }else if(resource==='iron'){
    // Ingots in crossed layers of two.
    for(let layer=0;layer<stage;layer++)for(let n=0;n<2;n++){const z=layer*3.2,c=[0xa2aab0,0x6d757b,0x565d62];
      if(layer%2)box(g,-9+n*9,-2+n*9,-10,6,z,z+3,c);else box(g,-10,6,-9+n*9,-2+n*9,z,z+3,c);}
  }
}
export function pileTexture(scene,resource,stage){
  const key=`material-pile:${resource}:${stage}`;
  if(!scene.textures.exists(key)){const g=scene.make.graphics({x:0,y:0,add:false});g.translateCanvas(PILE_TEXTURE.width/2,PILE_TEXTURE.baseY);if(stage)drawPile(g,resource,stage);g.generateTexture(key,PILE_TEXTURE.width,PILE_TEXTURE.height);g.destroy();}
  return key;
}

// The yard: packed earth with a low fence and four fields; people walk around it, piles sort by their field.
export class MaterialYardView {
  constructor(scene,building,preview=false){
    this.scene=scene;this.preview=preview;this.floor=scene.add.image(0,0,'__WHITE');this.piles=YARD_RESOURCES.map(()=>scene.add.image(0,0,'__WHITE').setOrigin(.5,PILE_TEXTURE.baseY/PILE_TEXTURE.height));
    this.stages=Object.fromEntries(YARD_RESOURCES.map(id=>[id,preview?2:0]));this.alpha=preview?.55:1;this.paint(building);
  }
  paint(building,tint=null){
    this.building=building;this.definition=buildingDefinition(building);this.base=towerBase(building);this.tint=tint;const d=this.definition,b=building;
    const back=gridToWorld(b.x,b.y),pad=14;
    this.floor.setTexture(this.groundTexture(tint,pad)).setOrigin(d.height/(d.width+d.height),pad/((d.width+d.height)*16+pad)).setPosition(back.x,back.y).setDepth(this.preview?10000:-90);
    YARD_RESOURCES.forEach((id,i)=>{const c=gridToWorld(b.x+i*d.width/4+d.width/8,b.y+d.height/2);this.piles[i].setTexture(pileTexture(this.scene,id,this.stages[id])).setPosition(c.x,c.y).setDepth(this.preview?10001:c.y+.03).setTint?.(tint??0xffffff);});
    this.hitArea=[gridToWorld(b.x,b.y),gridToWorld(b.x+d.width,b.y),gridToWorld(b.x+d.width,b.y+d.height),gridToWorld(b.x,b.y+d.height)];
    this.setAlpha(this.alpha);
  }
  groundTexture(tint,pad){
    const d=this.definition,key=`material-yard-ground:${d.width}x${d.height}:${tint??'normal'}`;
    if(!this.scene.textures.exists(key)){
      const g=this.scene.make.graphics({x:0,y:0,add:false}),point=(x,y,z=0)=>({x:d.height*32+(x-y)*32,y:pad+(x+y)*16-z});
      g.fillStyle(tint??0x7a6547,.95);g.fillPoints([point(0,0),point(d.width,0),point(d.width,d.height),point(0,d.height)],true);
      // Faint field borders and wheel ruts on packed earth.
      g.lineStyle(1,tint??0x5a4a33,.55);for(let i=1;i<4;i++){const x=i*d.width/4;g.lineBetween(point(x,.1).x,point(x,.1).y,point(x,d.height-.1).x,point(x,d.height-.1).y);}
      g.lineStyle(1,tint??0x8b7656,.5);for(let i=0;i<9;i++){const x=.3+i*.42,y=.2+((i*7)%10)/10*1.5,p=point(x,y),q=point(x+.18,y+.05);g.lineBetween(p.x,p.y,q.x,q.y);}
      // Low post-and-rail fence on all four sides.
      const edges=[[[0,0],[d.width,0]],[[d.width,0],[d.width,d.height]],[[0,d.height],[d.width,d.height]],[[0,0],[0,d.height]]];
      for(const [[x0,y0],[x1,y1]]of edges){const steps=Math.round(Math.hypot(x1-x0,y1-y0)*2);
        g.lineStyle(1.6,tint??0x6b4b2a,.95);for(const z of [5,9]){const a=point(x0,y0,z),c=point(x1,y1,z);g.lineBetween(a.x,a.y,c.x,c.y);}
        for(let s=0;s<=steps;s++){const t=s/steps,p=point(x0+(x1-x0)*t,y0+(y1-y0)*t);g.lineStyle(2.2,tint??0x4e361e,1);g.lineBetween(p.x,p.y,p.x,p.y-11);}
      }
      g.generateTexture(key,(d.width+d.height)*32,(d.width+d.height)*16+pad);g.destroy();
    }
    return key;
  }
  // Called by MaterialPiles with the stage of each field; repaints only the fields that changed.
  setPiles(stages){for(const [i,id]of YARD_RESOURCES.entries())if(stages[id]!==this.stages[id]){this.stages[id]=stages[id];this.piles[i].setTexture(pileTexture(this.scene,id,stages[id]));}}
  contains(x,y){return inside(this.hitArea,x,y)||this.piles.some(g=>x>=g.x-22&&x<=g.x+22&&y>=g.y-30&&y<=g.y+8);}
  inView(view){const width=(this.definition.width+this.definition.height)*32;return this.base.x+width>=view.x&&this.base.x-width<=view.right&&this.base.y+10>=view.y&&this.base.y-this.definition.visualHeight-100<=view.bottom;}
  setAlpha(value){this.alpha=value;this.floor.setAlpha(value);for(const g of this.piles)g.setAlpha(value);return this;}
  setVisible(value){this.floor.setVisible(value);for(const g of this.piles)g.setVisible(value);return this;}
  destroy(){this.floor.destroy();for(const g of this.piles)g.destroy();}
}

// Keeps yard fields and producer piles in step with storage (a producer pile sits on the tile in front of the
// building's front corner, so the building sprite never hides it); work happens only when the storage revision changes.
export class MaterialPiles {
  constructor(scene){this.scene=scene;this.revision=-1;this.images=new Map();this.applied=new Map();this.yardViews=new Map();}
  update(){
    const s=this.scene,storage=s.foodStorage;if(!storage)return;
    for(const [id,view]of this.yardViews)if(s.towerViews.get(id)!==view)this.revision=-1;
    if(storage.revision!==this.revision){
      this.revision=storage.revision;const keep=new Set();this.yardViews.clear();
      for(const l of storage.locations.values()){
        const b=l.buildingId!=null&&s.buildings.find(x=>x.id===l.buildingId);if(!b)continue;
        if(b.type==='material_yard'&&l.kind==='storage'){const view=s.towerViews.get(b.id);view?.setPiles?.(yardPileStages(l));this.yardViews.set(b.id,view);continue;}
        if(l.kind!=='pile')continue;keep.add(l.id);const stage=producerPileStage(l);let image=this.images.get(l.id);
        if(!image){const d=buildingDefinition(b),c=gridToWorld(b.x+d.width+.55,b.y+d.height+.35);image=s.add.image(c.x,c.y,'__WHITE').setOrigin(.5,PILE_TEXTURE.baseY/PILE_TEXTURE.height).setScale(.78).setDepth(c.y+.03);image.buildingId=b.id;this.images.set(l.id,image);this.applied.delete(l.id);}
        if(this.applied.get(l.id)!==stage){this.applied.set(l.id,stage);image.setTexture(pileTexture(s,l.allowed[0],stage));}
      }
      for(const [id,image]of this.images)if(!keep.has(id)){image.destroy();this.images.delete(id);this.applied.delete(id);}
    }
    for(const image of this.images.values()){const b=s.buildings.find(x=>x.id===image.buildingId);image.setVisible(!!b&&(!s.fog||s.fog.isVisibleObject(b)));}
  }
  destroy(){for(const image of this.images.values())image.destroy();this.images.clear();this.applied.clear();this.yardViews.clear();}
}
