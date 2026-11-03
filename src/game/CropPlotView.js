import Phaser from 'phaser';
import { tileCenter,tilePolygon,gridToWorld } from './isometric.js';
import { buildingDefinition,towerBase } from './buildings.js';

// Ground and per-cell plants sort independently, so people can walk among them.
export class CropPlotView {
  constructor(scene,building,preview=false){
    this.scene=scene;this.preview=preview;this.floor=scene.add.graphics();this.plants=building.tiles.map(()=>scene.add.graphics());
    this.stage=preview?3:0;this.alpha=preview?.55:1;this.paint(building);
  }
  paint(building,tint=null){
    this.building=building;this.definition=buildingDefinition(building);this.base=towerBase(building);this.tint=tint;
    const floor=this.floor.clear().setDepth(this.preview?10000:-90);
    for(const [index,tile]of building.tiles.entries()){
      const position=tileCenter(tile),g=this.plants[index].clear().setPosition(position.x,position.y).setDepth(this.preview?10001:position.y+.03);
      floor.fillStyle(tint??(this.definition.id==='orchard'?0x777044:0x695239),.95);floor.fillPoints(tilePolygon(tile),true);
      floor.lineStyle(1,tint??0x453e2c,.6);floor.strokePoints(tilePolygon(tile),true);
      if(this.definition.id==='wheat_field')this.wheat(g,tint);else this.tree(g,tint);
    }
    const b=building,d=this.definition;
    this.hitArea=new Phaser.Geom.Polygon([
      gridToWorld(b.x,b.y),gridToWorld(b.x+d.width,b.y),gridToWorld(b.x+d.width,b.y+d.height),gridToWorld(b.x,b.y+d.height),
    ]);
    this.setAlpha(this.alpha);
  }
  wheat(g,tint){
    g.lineStyle(1,tint??0x3d3928,.6);
    for(let row=-1;row<=1;row++)g.lineBetween(-22,row*6-5,19,row*6+9);
    if(!this.stage)return;
    const height=[0,7,17,24][this.stage],color=tint??(this.stage===3?0xdfbd60:0x7f9d42);
    for(let row=0;row<3;row++)for(let column=0;column<3;column++){
      const x=-17+column*13+row*4,y=-6+row*5;
      g.lineStyle(1.6,color);g.lineBetween(x,y,x,y-height);g.lineBetween(x,y-height*.4,x-5,y-height*.65);g.lineBetween(x,y-height*.55,x+4,y-height*.8);
      if(this.stage>=2){g.lineStyle(this.stage===3?2.5:1.8,color);for(let i=0;i<3;i++){const top=y-height+i*3;g.lineBetween(x,top,x-3,top-3);g.lineBetween(x,top,x+3,top-3);}}
    }
  }
  tree(g,tint){
    g.fillStyle(0x273422,.25);g.fillEllipse(3,0,34,13);
    g.lineStyle(5,tint??0x6d4f30);g.lineBetween(0,-2,0,-38);g.lineStyle(3,tint??0x6d4f30);g.lineBetween(0,-25,-9,-41);g.lineBetween(0,-28,10,-47);
    g.fillStyle(tint??0x4c703e);g.fillCircle(-9,-42,14);g.fillCircle(9,-46,15);g.fillCircle(0,-56,15);
    g.fillStyle(tint??0x77934b);g.fillCircle(-7,-52,10);g.fillCircle(7,-57,10);
    if(this.stage)for(const [x,y]of [[-12,-46],[8,-50],[-4,-60],[15,-40],[0,-39]]){
      g.fillStyle(tint??(this.stage===1?0xe9c9c1:this.stage===2?0xa0b259:0xc64d36));g.fillCircle(x,y,this.stage===3?3.6:2.2);
      if(this.stage===3){g.lineStyle(1,0x66442b);g.lineBetween(x,y-3,x+1,y-6);}
    }
  }
  setGrowth(stage){if(stage===this.stage)return;this.stage=stage;this.paint(this.building,this.tint);}
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x,y)||this.plants.some(g=>x>=g.x-25&&x<=g.x+25&&y>=g.y-this.definition.visualHeight&&y<=g.y+12);}
  inView(view){const width=(this.definition.width+this.definition.height)*32;return this.base.x+width>=view.x&&this.base.x-width<=view.right&&this.base.y+10>=view.y&&this.base.y-this.definition.visualHeight-100<=view.bottom;}
  setAlpha(value){this.alpha=value;this.floor.setAlpha(value);for(const g of this.plants)g.setAlpha(value);return this;}
  setVisible(value){this.floor.setVisible(value);for(const g of this.plants)g.setVisible(value);return this;}
  destroy(){this.floor.destroy();for(const g of this.plants)g.destroy();}
}
