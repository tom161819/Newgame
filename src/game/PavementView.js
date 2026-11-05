import Phaser from 'phaser';
import { gridToWorld,tileCenter } from './isometric.js';
import { drawCobbles } from './cobbles.js';

// A Stone Pavement blueprint or preview: one flat cobbled diamond under everything that stands on it.
export class PavementView {
  constructor(scene,building,preview=false){this.scene=scene;this.preview=preview;this.image=scene.add.image(0,0,'__WHITE');this.alpha=preview?.6:.75;this.paint(building);}
  texture(tint){
    const key=`pavement-site:${tint??'normal'}`;
    if(!this.scene.textures.exists(key)){
      const canvas=this.scene.textures.createCanvas(key,64,32),context=canvas.getContext();
      drawCobbles(context,32,16,{seed:7,tint});canvas.refresh();
    }
    return key;
  }
  paint(building,tint=null){
    this.building=building;const center=tileCenter(building);
    this.image.setTexture(this.texture(tint)).setOrigin(.5,.5).setPosition(center.x,center.y).setDepth(this.preview?10000:-80);
    const b=building;this.hitArea=new Phaser.Geom.Polygon([gridToWorld(b.x,b.y),gridToWorld(b.x+1,b.y),gridToWorld(b.x+1,b.y+1),gridToWorld(b.x,b.y+1)]);
    this.setAlpha(this.alpha);
  }
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x,y);}
  inView(view){const p=tileCenter(this.building);return p.x+32>=view.x&&p.x-32<=view.right&&p.y+16>=view.y&&p.y-16<=view.bottom;}
  setAlpha(value){this.alpha=value;this.image.setAlpha(value);return this;}
  setVisible(value){this.image.setVisible(value);return this;}
  destroy(){this.image.destroy();}
}
