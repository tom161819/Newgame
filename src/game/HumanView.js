import Phaser from 'phaser';
import { directionName,DIRECTION_POSES } from './directions.js';
import { CargoBundleView } from './CargoBundleView.js';

// Pohled poddaného používá stejných osm logických směrů jako král.
export class HumanView extends Phaser.GameObjects.Container {
  constructor(scene,x,y,definition){
    super(scene,x,y);scene.add.existing(this);this.definition=definition;this.phase=0;this.facing='S';
    this.shadow=scene.add.ellipse(0,1,23,10,0x26301e,.25);
    this.leftLeg=scene.add.rectangle(-3,-5,4,11,0x454334);this.rightLeg=scene.add.rectangle(3,-5,4,11,0x454334);
    this.body=scene.add.graphics();this.arms=[scene.add.rectangle(-7,-21,4,14,0xc6a37d),scene.add.rectangle(7,-21,4,14,0xc6a37d)];
    this.weapon=scene.add.graphics().setVisible(false);this.tool=scene.add.graphics().setVisible(false);this.add([this.shadow,this.leftLeg,this.rightLeg,this.body,...this.arms,this.weapon,this.tool]);this.cargoBundle=new CargoBundleView(scene,this);this.paint();
  }
  paint(){
    const pose=DIRECTION_POSES[this.facing],g=this.body.clear(),width=pose.profile?4:6,hx=pose.screenX;
    g.fillStyle(0x8b8052);g.fillPoints([{x:-width,y:-30},{x:width,y:-30},{x:width+2,y:-11},{x:-width-2,y:-11}],true);
    g.fillStyle(0x514333);g.fillRect(-width-1,-17,width*2+2,3);
    g.fillStyle(pose.back?0x765b3d:0xd2ad83);g.fillEllipse(hx,-37,pose.profile?9:12,12);
    g.fillStyle(0x604b33);g.fillEllipse(hx,-42,12,7);
    if(!pose.back){g.fillStyle(0x3b3026);g.fillRect(hx+(pose.profile?hx*3:-3),-38,2,2);if(!pose.profile)g.fillRect(hx+2,-38,2,2);}
  }
  animate(delta,moving,direction){
    const facing=directionName(direction);if(facing&&facing!==this.facing){this.facing=facing;this.paint();}
    this.isWalking=moving;this.phase+=delta*(moving ? .014 : .002);const stride=moving?Math.sin(this.phase)*2:0,pose=DIRECTION_POSES[this.facing];
    this.leftLeg.setPosition(-3+pose.screenX*stride,-5+pose.screenY*stride);this.rightLeg.setPosition(3-pose.screenX*stride,-5-pose.screenY*stride);
    this.arms[0].rotation=stride*.07;this.arms[1].rotation=-stride*.07;
  }
  setAttackPose(delta,active,direction){
    this.weapon.setVisible(active);if(!active)return;const face=directionName(direction);if(face&&face!==this.facing){this.facing=face;this.paint();}
    this.attackPhase=(this.attackPhase??0)+delta*.011;const pose=DIRECTION_POSES[this.facing],swing=Math.sin(this.attackPhase)*7;
    this.weapon.clear().lineStyle(3,0x82704e).lineBetween(6,-21,6+pose.screenX*18+swing,-26+pose.screenY*11-Math.abs(swing));
  }
  setWorkPose(delta,active){
    this.tool.setVisible(active);if(!active)return;
    this.workPhase=(this.workPhase??0)+delta*.008;const swing=Math.sin(this.workPhase),x=11+swing*5,y=-14+Math.abs(swing)*7;
    this.arms[0].rotation=-.5+swing*.3;this.arms[1].rotation=-.6+swing*.4;
    this.tool.clear().lineStyle(2,0x9e814e).lineBetween(6,-26,x+8,y+7).lineStyle(4,0x8e9586).lineBetween(x+3,y+4,x+11,y+4);
  }
  setCargo(cargo){this.cargoBundle.update(cargo);}
}
