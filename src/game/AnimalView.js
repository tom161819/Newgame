import Phaser from 'phaser';
import { directionName,DIRECTION_POSES } from './directions.js';
import { animalLook,ensureAnimalLook,applyAnimalArt } from './animalArt.js';
import { MOVEMENT_SPEED_SCALE } from '../data/movement.js';
import { wildLook,wildArt,wildPose,stillKey,APPROVED_DEPLOY_ART } from './deployArt.js';

// Species drawn with an approved Studio look once it loads (m-zvirata-nahodny-vzhled); the others keep the drawing.
const ART_SPECIES=new Set(['wolf']);

export class AnimalView extends Phaser.GameObjects.Container {
  constructor(scene,x,y,definition){
    super(scene,x,y);scene.add.existing(this);this.definition=definition;
    this.figure=scene.add.graphics();this.add(this.figure);this.phase=0;this.facing='S';
    this.animate(0,false,{x:0,y:1});
  }
  animate(delta,moving,direction){
    this.phase+=delta*0.012*(moving?MOVEMENT_SPEED_SCALE:1);this.facing=directionName(direction)??this.facing;this.isWalking=moving;
    if(this.drawArt(delta,moving)||this.drawWildArt(delta,moving,direction))return;
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
  // A wolf gets one of the approved wolf looks by its id (stable after Load); attacking shows the attack pose of that
  // look when it has one, a look without it keeps walking frames.
  drawArt(delta,moving){
    const animal=this.getData?.('animal');if(!ART_SPECIES.has(this.definition.id)||!animal)return false;
    const look=animalLook(this.definition.id,animal.id);if(!look)return false;
    if(!this.art){this.art=this.scene.add.image(0,0,'__DEFAULT').setVisible(false);this.add(this.art);this.walked=0;}
    if(this.look!==look){this.look=look;ensureAnimalLook(this.scene,look);}
    if(moving)this.walked+=delta;
    const on=applyAnimalArt(this.scene,this.art,look,{facing:this.facing,moving,walkedMs:this.walked,pose:animal.attackTarget?'attack':null});
    this.figure.setVisible(!on);if(on)this.figure.clear();return on;
  }
  // m-nasadit-schvalenou-grafiku: horses, deer, wild boars and hares (rabbits) show an approved still look picked by
  // their id (single images facing the viewer's right, mirrored for left facings, a light bob while walking). The
  // King's mount is the saddled bay. Without the art (loading or failed) the drawing above stays.
  drawWildArt(delta,moving){
    const species=this.definition.id;if(!APPROVED_DEPLOY_ART.wild[species])return false;
    const animal=this.getData?.('animal'),ridden=!!this.ridden,lookId=ridden?'horse-bay':animal?wildLook(species,animal.id):null,look=wildArt(species,lookId);
    if(!look){this.art?.setVisible(false);return false;}
    const pose=wildPose(look,{attacking:!!animal?.attackTarget,moving,tamed:!!(animal&&this.scene.stables?.holds?.(animal)),ridden}),art=pose?look.poses[pose]:look,key=stillKey(this.scene,art);
    if(!key){this.art?.setVisible(false);this.figure.setVisible(true);return false;}
    if(!this.art){this.art=this.scene.add.image(0,0,key);this.add(this.art);}
    const left=['S','SW','W','NW'].includes(this.facing);
    this.art.setTexture(key).setOrigin(art.origin.x,art.origin.y).setFlipX(left).setVisible(true);
    this.art.y=moving?-Math.abs(Math.sin(this.phase*.8))*1.5:0;this.wildArt=true;
    this.figure.setVisible(false);this.figure.clear();return true;
  }
  containsPoint(worldX,worldY){
    const x=worldX-this.x,y=worldY-this.y,scale=this.definition.visual.bodyScale??1,pose=DIRECTION_POSES[this.facing];
    const hx=pose.screenX*11*scale,hy=-22*scale+pose.screenY*5*scale;
    return (x/(15*scale))**2+((y+13*scale)/(9.5*scale))**2<=1
      ||((x-hx)/(7*scale))**2+((y-hy)/(7*scale))**2<=1;
  }
}
