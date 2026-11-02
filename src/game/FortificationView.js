import Phaser from 'phaser';
import { gridToWorld,tilePolygon } from './isometric.js';
import { towerBase,buildingDepth,buildingDefinition } from './buildings.js';
import { isWall,wallIndex,connectionsFor } from './walls.js';

function polygon(g,color,points){g.fillStyle(color);g.fillPoints(points,true);}
function lerp(a,b,t){return {x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};}
function masonry(g,a,b,height,color){
  polygon(g,color,[a,b,{x:b.x,y:b.y-height},{x:a.x,y:a.y-height}]);
  g.lineStyle(1,0x5b5d4d,.45);
  for(let h=12,row=0;h<height;h+=12,row++){
    g.lineBetween(a.x,a.y-h,b.x,b.y-h);
    for(let t=(row%2?0.15:0.3);t<1;t+=.3){const p=lerp(a,b,t);g.lineBetween(p.x,p.y-h,p.x,p.y-Math.min(height,h+12));}
  }
}
function parapet(g,a,b,height,color){
  const p={x:a.x,y:a.y-height},q={x:b.x,y:b.y-height};
  polygon(g,color,[p,q,{x:q.x,y:q.y-5},{x:p.x,y:p.y-5}]);
  const count=Math.max(2,Math.round(Math.hypot(b.x-a.x,b.y-a.y)/18));
  for(let i=0;i<=count;i++){
    const point=lerp(p,q,i/count);
    g.fillStyle(color);g.fillRect(point.x-3,point.y-12,6,8);
    polygon(g,0xe0d7b9,[{x:point.x-3,y:point.y-12},{x:point.x,y:point.y-14},{x:point.x+3,y:point.y-12},{x:point.x,y:point.y-10}]);
  }
}

// Stejné rozhraní jako TowerView, rozměry a výška pocházejí z definice.
export class FortificationView {
  constructor(scene,building,preview=false){
    this.scene=scene;this.preview=preview;this.back=scene.add.graphics();this.front=scene.add.graphics();this.footprint=scene.add.graphics();
    this.paint(building);if(preview){this.back.setAlpha(.5);this.front.setAlpha(.5);}
  }
  paint(building,tint=null){
    this.definition=buildingDefinition(building);this.base=towerBase(building);
    const d=this.definition,h=d.visual.wallHeight,{x,y}=building;
    const points=[[x,y],[x+d.width,y],[x+d.width,y+d.height],[x,y+d.height]].map(([gx,gy])=>{const p=gridToWorld(gx,gy);return {x:p.x-this.base.x,y:p.y-this.base.y};});
    const [a,b,c,e]=points,depth=buildingDepth(building),g=this.back.clear().setPosition(this.base.x,this.base.y).setDepth(this.preview?10001:depth);
    const front=this.front.clear().setPosition(this.base.x,this.base.y).setDepth(this.preview?10002:depth+.3);
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);
    floor.fillStyle(tint??0x777450,this.preview?0.3:0.2);floor.lineStyle(1,tint??0xb3a477,.75);
    for(const tile of building.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}
    const shadow=d.shadow;if(shadow){g.fillStyle(shadow.color,shadow.alpha);g.fillEllipse(shadow.x,shadow.y,shadow.width,shadow.height);}
    const links=isWall(building)?building.connections??connectionsFor(wallIndex(this.scene.buildings),building):{};
    // Sousední tělesa tyto stěny překryjí. Ponechání obou ploch zamezí
    // otevřenému řezu, když se soused skryje za hranicí Fog of War.
    masonry(g,e,c,h,tint??0xada691);
    masonry(g,c,b,h,tint??0x818373);
    polygon(g,tint??0xbeb69b,points.map(p=>({x:p.x,y:p.y-h})));
    if(!links.N)parapet(g,a,b,h,tint??0x929481);
    if(!links.W)parapet(g,a,e,h,tint??0xb7b19b);
    if(!links.S)parapet(front,e,c,h,tint??0xb7b19b);
    if(!links.E)parapet(front,c,b,h,tint??0x969984);
    if(!isWall(building)){
      const p=lerp(e,c,.55),q=lerp(e,c,.77);
      polygon(g,0x3f3c2a,[p,q,{x:q.x,y:q.y-38},{x:p.x,y:p.y-38}]);
      g.lineStyle(2,0x8c7953);g.lineBetween((p.x+q.x)/2,(p.y+q.y)/2,(p.x+q.x)/2,(p.y+q.y)/2-38);
    }
    this.hitArea=new Phaser.Geom.Polygon([{x:a.x,y:a.y-h-14},{x:b.x,y:b.y-h-14},b,c,e,{x:e.x,y:e.y-h-14}]);
  }
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x-this.base.x,y-this.base.y);}
  setVisible(value){this.back.setVisible(value);this.front.setVisible(value);this.footprint.setVisible(value);return this;}
  inView(view){const width=(this.definition.width+this.definition.height)*32;return this.base.x+width>=view.x&&this.base.x-width<=view.right&&this.base.y+10>=view.y&&this.base.y-this.definition.visualHeight<=view.bottom;}
  destroy(){this.back.destroy();this.front.destroy();this.footprint.destroy();}
}
