import Phaser from 'phaser';
import { tileCenter,gridToWorld } from './isometric.js';
import { buildingDefinition,towerBase } from './buildings.js';

// Day and night N3: provisional drawing of a campfire (a ring of stones and crossed logs; grey ashes after its night)
// until the Studio art is approved. The flame and the glow come from the light layer (LitBuildingView).
export class CampfireView {
  constructor(scene,building,preview=false){this.scene=scene;this.preview=preview;this.body=scene.add.image(0,0,'__WHITE').setOrigin(.5,.8);this.footprint=scene.add.graphics();this.paint(building);}
  ashes(){return !!this.scene.nightThreats?.campfireAshes?.(this.building);}
  texture(tint){
    const ashes=this.ashes(),key=`campfire:${ashes?'ashes':'wood'}:${tint??'n'}`;if(this.scene.textures.exists(key))return key;
    const g=this.scene.make.graphics({x:0,y:0,add:false}),T=c=>tint??c;
    g.fillStyle(0x26271b,.3);g.fillEllipse(32,30,40,14);
    if(ashes){g.fillStyle(T(0x6f6c66));g.fillEllipse(32,28,22,8);g.fillStyle(T(0x3b3936));g.fillEllipse(30,27,10,4);}
    else{g.lineStyle(5,T(0x5e4129));g.lineBetween(20,30,44,22);g.lineBetween(20,22,44,30);}
    g.fillStyle(T(0x7c7a72));for(const [x,y] of [[16,27],[48,27],[22,33],[42,33],[32,21],[32,35]])g.fillEllipse(x,y,9,5);
    g.generateTexture(key,64,40);g.destroy();return key;
  }
  paint(building,tint=null){
    this.building=building;this.definition=buildingDefinition(building);this.base=towerBase(building);this.tint=tint;const c=tileCenter({x:building.x,y:building.y});
    this.body.setTexture(this.texture(tint)).setPosition(c.x,c.y+8).setDepth(this.preview?10001:c.y+.1);
    const f=this.footprint.clear().setDepth(this.preview?10000:-90);if(this.preview||tint){const b=building,p=[gridToWorld(b.x,b.y),gridToWorld(b.x+1,b.y),gridToWorld(b.x+1,b.y+1),gridToWorld(b.x,b.y+1)];f.fillStyle(tint??0x777450,.3);f.fillPoints(p,true);}
    this.hitArea=new Phaser.Geom.Rectangle(this.body.x-24,this.body.y-34,48,40);this.state=this.ashes();
  }
  refresh(){if(this.ashes()!==this.state)this.paint(this.building,this.tint);}
  contains(x,y){return this.hitArea.contains(x,y);}
  inView(view){return this.base.x+40>=view.x&&this.base.x-40<=view.right&&this.base.y+20>=view.y&&this.base.y-60<=view.bottom;}
  setAlpha(v){this.body.setAlpha(v);this.footprint.setAlpha(v);return this;}
  setVisible(v){this.body.setVisible(v);this.footprint.setVisible(v);return this;}
  destroy(){this.body.destroy();this.footprint.destroy();}
}
