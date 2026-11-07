import Phaser from 'phaser';
import { gridToWorld,tileCenter } from './isometric.js';
import { buildingDefinition,towerBase } from './buildings.js';
import { VILLAGE_GREEN } from '../data/children.js';

// Children and the Village Green D1: provisional drawing of the green (grass square, worn play patch, linden tree with a
// swing, bench) until the Studio art (plan g-deti-naves-grafika) is approved. The ground lies under people like a
// field; the tree and the bench sort by depth. The placement preview and the green's panel show the 10-tile reach and
// outline the houses inside it.
export class VillageGreenView {
  constructor(scene,building,preview=false){
    this.scene=scene;this.preview=preview;this.floor=scene.add.image(0,0,'__WHITE');this.tree=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);this.bench=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);
    this.range=scene.add.graphics().setVisible(false);this.alpha=preview?.6:1;this.rangeOn=preview;this.season=scene.seasons?.season??'Summer';this.paint(building);
  }
  paint(building,tint=null){
    this.building=building;this.definition=buildingDefinition(building);this.base=towerBase(building);this.tint=tint;const d=this.definition,b=building;
    const back=gridToWorld(b.x,b.y);this.floor.setTexture(this.floorTexture(tint)).setOrigin(d.height/(d.width+d.height),0).setPosition(back.x,back.y).setDepth(this.preview?10000:-89);
    const treeAt=tileCenter({x:b.x+1,y:b.y}),benchAt=tileCenter({x:b.x+2,y:b.y+1});
    this.tree.setTexture(this.treeTexture(tint)).setPosition(treeAt.x,treeAt.y+6).setDepth(this.preview?10001:treeAt.y+.2);
    this.bench.setTexture(this.benchTexture(tint)).setPosition(benchAt.x,benchAt.y+4).setDepth(this.preview?10001:benchAt.y+.1);
    this.hitArea=new Phaser.Geom.Polygon([gridToWorld(b.x,b.y),gridToWorld(b.x+d.width,b.y),gridToWorld(b.x+d.width,b.y+d.height),gridToWorld(b.x,b.y+d.height)]);
    this.drawRange();this.setAlpha(this.alpha);
  }
  floorTexture(tint){
    const d=this.definition,key=`village-green:floor:${this.season}:${tint??'n'}`;
    if(!this.scene.textures.exists(key)){
      const g=this.scene.make.graphics({x:0,y:0,add:false}),pt=(x,y)=>({x:d.height*32+(x-y)*32,y:(x+y)*16}),winter=this.season==='Winter';
      g.fillStyle(tint??(winter?0xe4e8e6:this.season==='Autumn'?0x8c9a52:0x79a352),.97);g.fillPoints([pt(0,0),pt(d.width,0),pt(d.width,d.height),pt(0,d.height)],true);
      g.fillStyle(tint??(winter?0xd3d9d6:0xb3ad74),.85);const c=pt(d.width/2,d.height/2+.15);g.fillEllipse(c.x,c.y,d.width*34,d.height*15);
      g.lineStyle(2,tint??(winter?0xb8c1bd:0x557a37),.8);g.strokePoints([pt(0,0),pt(d.width,0),pt(d.width,d.height),pt(0,d.height)],true);
      if(!tint)for(let i=0;i<14;i++){const x=.3+((i*37)%27)/10,y=.3+((i*53)%27)/10,p=pt(x,y);g.fillStyle(winter?0xffffff:[0xe8d65a,0xf2f2f2,0xc97ab0][i%3],.9);g.fillCircle(p.x,p.y,1.4);}
      g.generateTexture(key,(d.width+d.height)*32,(d.width+d.height)*16);g.destroy();
    }
    return key;
  }
  treeTexture(tint){
    const key=`village-green:tree:${this.season}:${tint??'n'}`;
    if(!this.scene.textures.exists(key)){
      const g=this.scene.make.graphics({x:0,y:0,add:false}),leaves={Spring:0x5d9a3e,Summer:0x4c8434,Autumn:0xc3842f,Winter:null}[this.season];
      g.fillStyle(0x26271b,.25);g.fillEllipse(40,92,46,12);g.fillStyle(tint??0x5e4129);g.fillRect(36,44,8,48);g.lineStyle(4,tint??0x5e4129);g.lineBetween(40,58,62,46);g.lineBetween(40,54,20,44);
      // The swing hangs from the right branch.
      g.lineStyle(1,0x3b2c1d);g.lineBetween(56,49,56,80);g.lineBetween(64,45,64,78);g.fillStyle(tint??0x8a6a43);g.fillRect(54,78,12,3);
      if(leaves!=null){g.fillStyle(tint??leaves);g.fillCircle(40,30,22);g.fillCircle(24,40,15);g.fillCircle(57,38,16);g.fillStyle(tint??0x3e6f2a,.5);g.fillCircle(46,36,12);}
      else{g.lineStyle(2,tint??0x5e4129);g.lineBetween(40,44,30,18);g.lineBetween(40,44,52,16);g.lineBetween(40,48,62,30);}
      g.generateTexture(key,80,96);g.destroy();
    }
    return key;
  }
  benchTexture(tint){
    const key=`village-green:bench:${tint??'n'}`;
    if(!this.scene.textures.exists(key)){const g=this.scene.make.graphics({x:0,y:0,add:false});g.fillStyle(tint??0x8a6a43);g.fillRect(2,6,30,4);g.fillStyle(tint??0x5e4129);g.fillRect(4,10,3,6);g.fillRect(27,10,3,6);g.fillRect(2,1,30,3);g.generateTexture(key,34,16);g.destroy();}
    return key;
  }
  // Reach circle (10 tiles from the centre) and the outlines of houses inside it.
  drawRange(){
    const g=this.range.clear();if(!this.rangeOn){g.setVisible(false);return;}
    const b=this.building,d=this.definition,cx=b.x+d.width/2,cy=b.y+d.height/2,c=gridToWorld(cx,cy),r=VILLAGE_GREEN.range;
    g.lineStyle(2,0xf1e3a0,.85);g.strokeEllipse(c.x,c.y,r*64*Math.SQRT1_2*2,r*32*Math.SQRT1_2*2);
    for(const house of this.scene.buildings??[]){const hd=buildingDefinition(house);if(!this.scene.objectRegistry?.get?.(house.type)?.housing)continue;
      if(Math.hypot(house.x+hd.width/2-cx,house.y+hd.height/2-cy)>r)continue;
      g.lineStyle(3,0x9be08a,.95);g.strokePoints([gridToWorld(house.x,house.y),gridToWorld(house.x+hd.width,house.y),gridToWorld(house.x+hd.width,house.y+hd.height),gridToWorld(house.x,house.y+hd.height)],true);}
    g.setDepth(10002).setVisible(true);
  }
  showRange(on){this.rangeOn=!!on;this.drawRange();return this;}
  setSeason(season){if(season===this.season)return;this.season=season;this.paint(this.building,this.tint);}
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x,y)||Math.abs(x-this.tree.x)<24&&y<=this.tree.y&&y>=this.tree.y-90;}
  inView(view){const w=(this.definition.width+this.definition.height)*32;return this.base.x+w>=view.x&&this.base.x-w<=view.right&&this.base.y+10>=view.y&&this.base.y-this.definition.visualHeight-60<=view.bottom;}
  setAlpha(value){this.alpha=value;for(const o of [this.floor,this.tree,this.bench])o.setAlpha(value);return this;}
  setVisible(value){for(const o of [this.floor,this.tree,this.bench])o.setVisible(value);if(!value)this.range.setVisible(false);else this.drawRange();return this;}
  destroy(){for(const o of [this.floor,this.tree,this.bench,this.range])o.destroy();}
}
