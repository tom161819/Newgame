import Phaser from 'phaser';
import { tileCenter,gridToWorld,tilePolygon } from './isometric.js';
import { buildingDefinition,towerBase,buildingIsComplete } from './buildings.js';

// Owner 20 Nov 2026 ("zatím udělej nějaký základní assety a modely, pak dodělám"): provisional drawings of the Stakes
// and the Moat, made in code until the owner's models are approved in the Studio.
class TileView {
  constructor(scene,building,preview=false){this.scene=scene;this.preview=preview;this.body=scene.add.image(0,0,'__WHITE');this.footprint=scene.add.graphics();this.paint(building);}
  paint(building,tint=null){
    this.building=building;this.definition=buildingDefinition(building);this.base=towerBase(building);this.tint=tint;const c=tileCenter({x:building.x,y:building.y});
    const done=this.preview||buildingIsComplete(building);this.body.setTexture(this.texture(tint,done)).setOrigin(.5,this.originY).setPosition(c.x,c.y+this.lift).setDepth(this.preview?10001:this.depth(c));
    const f=this.footprint.clear().setDepth(this.preview?10000:-90);if(this.preview||tint){f.fillStyle(tint??0x777450,.3);f.fillPoints(tilePolygon({x:building.x,y:building.y}),true);}
    this.hitArea=new Phaser.Geom.Polygon(tilePolygon({x:building.x,y:building.y}).map(p=>({x:p.x,y:p.y-(this.hitHeight??0)})));
  }
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x,y)||this.body.getBounds().contains(x,y);}
  inView(view){return this.base.x+40>=view.x&&this.base.x-40<=view.right&&this.base.y+20>=view.y&&this.base.y-60<=view.bottom;}
  setAlpha(v){this.body.setAlpha(this.preview?v*.6:v);this.footprint.setAlpha(v);return this;}
  setVisible(v){this.body.setVisible(v);this.footprint.setVisible(v);return this;}
  destroy(){this.body.destroy();this.footprint.destroy();}
}
export class StakesView extends TileView {
  get originY(){return .85;}get lift(){return 8;}depth(c){return c.y+16.02;}get hitHeight(){return 18;}
  texture(tint,done){
    const key=`stakes:${done?'done':'site'}:${tint??'n'}`;if(this.scene.textures.exists(key))return key;
    const g=this.scene.make.graphics({x:0,y:0,add:false}),T=c=>tint??c;
    g.fillStyle(0x2d2416,.28);g.fillEllipse(32,40,52,14);
    // Two crossed rows of stakes pointing outwards, lashed to a log.
    const stakes=done?[[12,40,-8],[20,36,-6],[28,42,6],[36,38,-5],[44,42,7],[52,38,8]]:[[20,40,-4],[36,40,4]];
    for(const [x,y,lean] of stakes){g.fillStyle(T(0x8d6036));g.fillTriangle(x-3,y,x+3,y,x+lean,y-24);g.fillStyle(T(0xc79a63));g.fillTriangle(x+lean-1.5,y-21,x+lean+1.5,y-21,x+lean,y-24);g.lineStyle(1,T(0x3c2814),.9);g.strokeTriangle(x-3,y,x+3,y,x+lean,y-24);}
    if(done){g.lineStyle(4,T(0x5b3c1f));g.lineBetween(8,37,56,37);}
    g.generateTexture(key,64,48);g.destroy();return key;
  }
}
export class MoatView extends TileView {
  get originY(){return .5;}get lift(){return 0;}depth(){return -80;}
  // Water runs on into a joined moat tile, so a dug line reads as one ditch (sides N, E, S, W of the grid).
  joined(){const b=this.building,s=this.scene,at=new Set((s.buildings??[]).filter(x=>x.type==='moat'&&x!==b).map(x=>`${x.x},${x.y}`));return ['N','E','S','W'].filter((d,i)=>at.has(`${b.x+[0,1,0,-1][i]},${b.y+[-1,0,1,0][i]}`)).join('');}
  texture(tint,done){
    const joined=this.preview?'':this.joined(),key=`moat:${done?'water':'dug'}:${joined}:${tint??'n'}`;if(this.scene.textures.exists(key))return key;
    const g=this.scene.make.graphics({x:0,y:0,add:false}),T=c=>tint??c;
    // Corners of the tile diamond: top = N/W corner (grid x,y), right = N/E, bottom = S/E, left = S/W.
    const top={x:32,y:0},right={x:64,y:16},bottom={x:32,y:32},left={x:0,y:16},c={x:32,y:16},k=.78,In=p=>({x:c.x+(p.x-c.x)*k,y:c.y+(p.y-c.y)*k});this.joinedKey=joined;
    g.fillStyle(T(0x5a4429));g.fillPoints([left,top,right,bottom],true);
    // Each edge is pushed out to the tile edge where the next moat tile joins.
    const edge={N:[top,right],E:[right,bottom],S:[bottom,left],W:[left,top]};
    const corner=(p,a,b)=>joined.includes(a)||joined.includes(b)?p:In(p);
    const water=[corner(left,'S','W'),corner(top,'W','N'),corner(right,'N','E'),corner(bottom,'E','S')];
    for(const d of joined){const [a,b]=edge[d];const i={N:[1,2],E:[2,3],S:[3,0],W:[0,1]}[d];water[i[0]]=a;water[i[1]]=b;}
    g.fillStyle(T(done?0x2f515b:0x463420));g.fillPoints(water,true);
    if(done){g.fillStyle(T(0x5e8c96),.5);g.fillPoints([{x:18,y:16},{x:32,y:9},{x:46,y:16},{x:32,y:23}],true);g.lineStyle(1,0xa9c9cf,.5);g.lineBetween(22,15,30,11);g.lineBetween(34,20,42,16);}
    g.generateTexture(key,64,32);g.destroy();return key;
  }
}
