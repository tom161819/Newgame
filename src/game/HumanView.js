import Phaser from 'phaser';
import { directionName,DIRECTION_POSES } from './directions.js';
import { CargoBundleView } from './CargoBundleView.js';
import { HUMAN_APPEARANCE as COLORS } from '../data/humanAppearance.js';
import { APPROVED_VILLAGER_ART,PROFESSION_LOOKS,FACING_INDEX,villagerSex } from '../data/objects/approvedArt.js';
import { assetURL } from '../systems/AssetManager.js';

// Approved villager looks load per look on first use (8 directions each).
const lookKey=(look,k)=>`villager-art:${look}:${k}`;
function ensureLook(scene,look,ready){
  scene.__villagerLooks??=new Map();const state=scene.__villagerLooks.get(look);
  if(state==='ready')return true;if(state){state.add(ready);return false;}
  const art=APPROVED_VILLAGER_ART[look],waiting=new Set([ready]);scene.__villagerLooks.set(look,waiting);
  for(let k=0;k<8;k++)if(!scene.textures.exists(lookKey(look,k)))scene.load.image(lookKey(look,k),assetURL(`${art.base}.facing-${k}.png`,scene.assets?.baseURL??import.meta.env?.BASE_URL??'/'));
  scene.load.once('complete',()=>{if(![0,1,2,3,4,5,6,7].every(k=>scene.textures.exists(lookKey(look,k))))return;scene.__villagerLooks.set(look,'ready');for(const fn of waiting)fn();});
  if(!scene.load.isLoading())scene.load.start();return false;
}

// Pohled poddaného používá stejných osm logických směrů jako král.
export class HumanView extends Phaser.GameObjects.Container {
  constructor(scene,x,y,definition){
    super(scene,x,y);scene.add.existing(this);this.definition=definition;this.phase=0;this.facing='S';
    this.shadow=scene.add.ellipse(0,1,23,10,0x26301e,.25);
    this.leftLeg=scene.add.rectangle(-3,-5,4,11,0x454334);this.rightLeg=scene.add.rectangle(3,-5,4,11,0x454334);
    this.body=scene.add.graphics();this.arms=[scene.add.rectangle(-7,-21,4,14,COLORS.armSkin),scene.add.rectangle(7,-21,4,14,COLORS.armSkin)];
    this.weapon=scene.add.graphics().setVisible(false);this.tool=scene.add.graphics().setVisible(false);this.art=scene.add.image(0,0,'__DEFAULT').setVisible(false);this.add([this.shadow,this.leftLeg,this.rightLeg,this.body,...this.arms,this.weapon,this.tool,this.art]);this.cargoBundle=new CargoBundleView(scene,this);this.paint();
  }
  // Profession and name decide the approved look; the procedural figure stays until it loads.
  updateLook(){
    const worker=this.getData?.('worker');if(!worker)return;
    const look=PROFESSION_LOOKS[worker.isSubject===false?worker.profession:(worker.displayProfession??'idle')]?.[villagerSex(worker.name)]??null;
    if(look===this.look)return;this.look=look;this.lookReady=false;
    if(look&&APPROVED_VILLAGER_ART[look])this.lookReady=ensureLook(this.scene,look,()=>{if(this.look===look&&this.scene){this.lookReady=true;this.applyArt();}});
    this.applyArt();
  }
  applyArt(){
    const on=!!(this.look&&this.lookReady),k=FACING_INDEX[this.facing]??0;
    for(const part of [this.shadow,this.leftLeg,this.rightLeg,this.body,...this.arms])part.setVisible(!on);
    if(!on){this.art.setVisible(false);return;}
    const origin=APPROVED_VILLAGER_ART[this.look].origins[k];
    this.art.setTexture(lookKey(this.look,k)).setOrigin(origin.x,origin.y).setVisible(true);this.tool.setVisible(false);this.weapon.setVisible(false);
  }
  paint(){
    const pose=DIRECTION_POSES[this.facing],g=this.body.clear(),width=pose.profile?4:6,hx=pose.screenX;
    g.fillStyle(COLORS.tunic);g.fillPoints([{x:-width,y:-30},{x:width,y:-30},{x:width+2,y:-11},{x:-width-2,y:-11}],true);
    g.fillStyle(COLORS.belt);g.fillRect(-width-1,-17,width*2+2,3);
    g.fillStyle(pose.back?COLORS.back:COLORS.skin);g.fillEllipse(hx,-37,pose.profile?9:12,12);
    g.fillStyle(COLORS.hair);g.fillEllipse(hx,-42,12,7);
    if(!pose.back){g.fillStyle(COLORS.eyes);g.fillRect(hx+(pose.profile?hx*3:-3),-38,2,2);if(!pose.profile)g.fillRect(hx+2,-38,2,2);}
    if(this.art)this.applyArt();
  }
  animate(delta,moving,direction){
    const facing=directionName(direction);if(facing&&facing!==this.facing){this.facing=facing;this.paint();}
    this.isWalking=moving;this.phase+=delta*(moving ? .014 : .002);const stride=moving?Math.sin(this.phase)*2:0,pose=DIRECTION_POSES[this.facing];
    this.leftLeg.setPosition(-3+pose.screenX*stride,-5+pose.screenY*stride);this.rightLeg.setPosition(3-pose.screenX*stride,-5-pose.screenY*stride);
    this.arms[0].rotation=stride*.07;this.arms[1].rotation=-stride*.07;
    this.updateLook();
    // Approved looks walk with a light bob and sway instead of moving legs.
    if(this.art.visible){this.art.y=moving?-Math.abs(Math.sin(this.phase))*1.6:0;this.art.rotation=moving?Math.sin(this.phase)*.035:0;}
  }
  setAttackPose(delta,active,direction){
    if(this.art.visible){this.weapon.setVisible(false);if(active){this.attackPhase=(this.attackPhase??0)+delta*.011;this.art.rotation=Math.sin(this.attackPhase)*.12;}return;}
    this.weapon.setVisible(active);if(!active)return;const face=directionName(direction);if(face&&face!==this.facing){this.facing=face;this.paint();}
    this.attackPhase=(this.attackPhase??0)+delta*.011;const pose=DIRECTION_POSES[this.facing],swing=Math.sin(this.attackPhase)*7;
    this.weapon.clear().lineStyle(3,0x82704e).lineBetween(6,-21,6+pose.screenX*18+swing,-26+pose.screenY*11-Math.abs(swing));
  }
  setWorkPose(delta,active){
    if(this.art.visible){this.tool.setVisible(false);if(active){this.workPhase=(this.workPhase??0)+delta*.008;this.art.rotation=Math.sin(this.workPhase)*.09;this.art.y=-Math.abs(Math.sin(this.workPhase))*1.2;}return;}
    this.tool.setVisible(active);if(!active)return;
    this.workPhase=(this.workPhase??0)+delta*.008;const swing=Math.sin(this.workPhase),x=11+swing*5,y=-14+Math.abs(swing)*7;
    this.arms[0].rotation=-.5+swing*.3;this.arms[1].rotation=-.6+swing*.4;
    this.tool.clear().lineStyle(2,0x9e814e).lineBetween(6,-26,x+8,y+7).lineStyle(4,0x8e9586).lineBetween(x+3,y+4,x+11,y+4);
  }
  setCargo(cargo){this.cargoBundle.update(cargo);}
}
