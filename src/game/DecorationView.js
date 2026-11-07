import Phaser from 'phaser';
import { gridToWorld,tileCenter } from './isometric.js';
import { buildingDefinition,towerBase } from './buildings.js';

// Children and the Village Green D2: provisional drawings of the house decorations (Swing Tree, Haystack, Well) until
// the Studio art (plan g-deti-naves-grafika) is approved. One generated texture per kind, season and tint; the tree
// loses its leaves in winter and the haystack and the well roof get snow.
const SIZE={swing_tree:[80,96],haystack:[56,52],well:[52,66]};
export class DecorationView {
  constructor(scene,building,preview=false){
    this.scene=scene;this.preview=preview;this.footprint=scene.add.graphics();this.body=scene.add.image(0,0,'__WHITE').setOrigin(.5,1);
    this.alpha=preview?.6:1;this.season=scene.seasons?.season??'Summer';this.paint(building);
  }
  paint(building,tint=null){
    this.building=building;this.definition=buildingDefinition(building);this.base=towerBase(building);this.tint=tint;const b=building,c=tileCenter({x:b.x,y:b.y});
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);
    if(this.preview||tint){floor.fillStyle(tint??0x777450,.3);floor.lineStyle(1,tint??0xb3a477,.8);const p=[gridToWorld(b.x,b.y),gridToWorld(b.x+1,b.y),gridToWorld(b.x+1,b.y+1),gridToWorld(b.x,b.y+1)];floor.fillPoints(p,true);floor.strokePoints(p,true);}
    this.body.setTexture(this.texture(tint)).setPosition(c.x,c.y+(this.definition.id==='swing_tree'?6:8)).setDepth(this.preview?10001:c.y+.2);
    this.hitArea=new Phaser.Geom.Rectangle(this.body.x-SIZE[this.definition.id][0]/2,this.body.y-SIZE[this.definition.id][1],SIZE[this.definition.id][0],SIZE[this.definition.id][1]);
    this.setAlpha(this.alpha);
  }
  texture(tint){
    const id=this.definition.id,key=`decoration:${id}:${this.season}:${tint??'n'}`;if(this.scene.textures.exists(key))return key;
    const [w,h]=SIZE[id],g=this.scene.make.graphics({x:0,y:0,add:false}),winter=this.season==='Winter',T=c=>tint??c;
    g.fillStyle(0x26271b,.25);g.fillEllipse(w/2,h-4,w*.6,10);
    if(id==='swing_tree'){
      const leaves={Spring:0x5d9a3e,Summer:0x4c8434,Autumn:0xc3842f,Winter:null}[this.season];
      g.fillStyle(T(0x5e4129));g.fillRect(36,44,8,48);g.lineStyle(4,T(0x5e4129));g.lineBetween(40,58,62,46);g.lineBetween(40,54,20,44);
      g.lineStyle(1,0x3b2c1d);g.lineBetween(56,49,56,80);g.lineBetween(64,45,64,78);g.fillStyle(T(0x8a6a43));g.fillRect(54,78,12,3);
      if(leaves!=null){g.fillStyle(T(leaves));g.fillCircle(40,30,22);g.fillCircle(24,40,15);g.fillCircle(57,38,16);g.fillStyle(T(0x3e6f2a),.5);g.fillCircle(46,36,12);}
      else{g.lineStyle(2,T(0x5e4129));g.lineBetween(40,44,30,18);g.lineBetween(40,44,52,16);g.lineBetween(40,48,62,30);g.fillStyle(0xffffff,.9);g.fillRect(28,44,24,2);}
    }else if(id==='haystack'){
      g.fillStyle(T(0xd9b44a));g.fillTriangle(6,h-6,w/2,8,w-6,h-6);g.fillEllipse(w/2,h-10,w-10,16);g.fillCircle(w/2,18,10);
      g.lineStyle(2,T(0xa8842a));for(const [y,r] of [[24,8],[32,13],[40,18]]){g.lineBetween(w/2-r,y,w/2+r,y+2);}
      if(winter){g.fillStyle(0xf4f7f6);g.fillCircle(w/2,14,9);g.fillTriangle(w/2-12,22,w/2,6,w/2+12,22);}
    }else{
      g.fillStyle(T(0x9a9384));g.fillRect(8,36,36,20);g.fillEllipse(26,56,36,10);g.lineStyle(2,T(0x4d4a42));g.strokeRect(8,36,36,20);
      g.fillStyle(T(0x2f4a5c));g.fillEllipse(26,36,36,10);g.lineStyle(1,T(0x6f6a5e));for(const y of [42,48])g.lineBetween(8,y,44,y);
      g.lineStyle(3,T(0x5e4129));g.lineBetween(11,36,11,12);g.lineBetween(41,36,41,12);g.lineStyle(2,T(0x5e4129));g.lineBetween(11,18,41,18);
      g.fillStyle(T(0x8a4a2b));g.fillTriangle(4,14,26,2,48,14);if(winter){g.fillStyle(0xf4f7f6);g.fillTriangle(8,12,26,3,44,12);}
      g.lineStyle(1,0x3b2c1d);g.lineBetween(26,18,26,28);g.fillStyle(T(0x7a5a36));g.fillRect(23,28,6,5);
    }
    g.generateTexture(key,w,h);g.destroy();return key;
  }
  setSeason(season){if(season===this.season)return;this.season=season;this.paint(this.building,this.tint);}
  contains(x,y){return this.hitArea.contains(x,y);}
  inView(view){return this.base.x+48>=view.x&&this.base.x-48<=view.right&&this.base.y+10>=view.y&&this.base.y-110<=view.bottom;}
  setAlpha(value){this.alpha=value;this.body.setAlpha(value);this.footprint.setAlpha(value);return this;}
  setVisible(value){this.body.setVisible(value);this.footprint.setVisible(value);return this;}
  destroy(){this.body.destroy();this.footprint.destroy();}
}
