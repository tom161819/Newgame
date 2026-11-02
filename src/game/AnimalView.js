import Phaser from 'phaser';
import { directionName,DIRECTION_POSES } from './directions.js';

export class AnimalView extends Phaser.GameObjects.Container {
  constructor(scene,x,y,definition){
    super(scene,x,y);scene.add.existing(this);this.definition=definition;
    this.figure=scene.add.graphics();this.add(this.figure);this.phase=0;this.facing='S';
    this.animate(0,false,{x:0,y:1});
  }
  animate(delta,moving,direction){
    this.phase+=delta*0.012;this.facing=directionName(direction)??this.facing;this.isWalking=moving;
    const pose=DIRECTION_POSES[this.facing],g=this.figure.clear(),v=this.definition.visual;
    const sx=pose.screenX,sy=pose.screenY,scale=v.bodyScale??1,stride=moving?Math.sin(this.phase)*3:0;
    g.fillStyle(0x26271b,0.3);g.fillEllipse(0,2,32*scale,13*scale);
    g.lineStyle(3*scale,0x4a3829);
    for(const side of [-1,1])for(const end of [-1,1]){
      const x=side*8*scale,y=-7*scale+end*3;
      g.lineBetween(x,y,x+stride*side*end,-1+stride*side*end*0.3);
    }
    g.fillStyle(v.bodyColor);g.fillEllipse(0,-13*scale,30*scale,19*scale);
    const hx=sx*11*scale,hy=-22*scale+sy*5*scale;
    g.fillStyle(v.headColor??v.bodyColor);g.fillEllipse(hx,hy,13*scale,13*scale);
    if(this.definition.id==='rabbit'){
      g.fillStyle(0xc4baa1);g.fillEllipse(hx-3,hy-8,4,14);g.fillEllipse(hx+3,hy-8,4,14);
      g.fillStyle(0xe7d8bd);g.fillCircle(-sx*12,-10,4);
    }else if(this.definition.id==='deer'){
      g.lineStyle(2,0xb7a984);g.lineBetween(hx-4,hy-4,hx-7,hy-15);g.lineBetween(hx+4,hy-4,hx+7,hy-15);
      g.lineBetween(hx-7,hy-10,hx-12,hy-13);g.lineBetween(hx+7,hy-10,hx+12,hy-13);
    }else if(this.definition.id==='wild_boar'){
      g.fillStyle(0xe6d7b6);g.fillTriangle(hx+6,hy+3,hx+10,hy-2,hx+10,hy+4);
    }else{
      g.fillStyle(0x3e2d20);g.fillRect(hx-5,hy-12,5,13);g.lineStyle(4,0x3e2d20);g.lineBetween(-sx*13,-16,-sx*24,-9);
      g.fillStyle(0x7c392b);g.fillEllipse(0,-22,16,7);
    }
    g.fillStyle(0x181e19);g.fillCircle(hx+sx*3-2,hy-2,1.4);g.fillCircle(hx+sx*3+2,hy-2,1.4);
  }
  containsPoint(worldX,worldY){
    const x=worldX-this.x,y=worldY-this.y,scale=this.definition.visual.bodyScale??1,pose=DIRECTION_POSES[this.facing];
    const hx=pose.screenX*11*scale,hy=-22*scale+pose.screenY*5*scale;
    return (x/(15*scale))**2+((y+13*scale)/(9.5*scale))**2<=1
      ||((x-hx)/(7*scale))**2+((y-hy)/(7*scale))**2<=1;
  }
}
