import Phaser from 'phaser';
import { directionName,DIRECTION_POSES } from './directions.js';
import { CargoBundleView } from './CargoBundleView.js';
import { HUMAN_APPEARANCE as COLORS } from '../data/humanAppearance.js';
import { APPROVED_VILLAGER_ART,PROFESSION_LOOKS,FACING_INDEX,villagerSex,walkFrame,walkKey,militaryLook,soldierFrame,soldierIdle } from '../data/objects/approvedArt.js';
import { FISHER_WALK_ART,FISHER_LOOKS } from '../data/fisherWalkArt.js';
// Approved looks with only a walk sheet (the Fisher): the walk sheet carries all eight directions.
import { SOLDIER_ANIM_ART } from '../data/soldierAnimArt.js';
const villagerArt=look=>APPROVED_VILLAGER_ART[look]??SOLDIER_ANIM_ART[look]??FISHER_WALK_ART[look]??null;
const professionLooks=profession=>PROFESSION_LOOKS[profession]??(profession==='fisher'?FISHER_LOOKS:null);
const hasWalk=(scene,look)=>!!villagerArt(look)?.walk&&!!scene?.textures?.exists?.(walkKey(look));
import { assetURL } from '../systems/AssetManager.js';
import { MOVEMENT_SPEED_SCALE } from '../data/movement.js';
import { FishingAnimator,fishingFrame,fishingSheet,residentSeed } from './fishingAnim.js';

import { ensureLook,lookKey } from './lookLoader.js';

// Pohled poddaného používá stejných osm logických směrů jako král.
export class HumanView extends Phaser.GameObjects.Container {
  constructor(scene,x,y,definition){
    super(scene,x,y);scene.add.existing(this);this.definition=definition;this.phase=0;this.facing='S';
    this.shadow=scene.add.ellipse(0,1,23,10,0x26301e,.25);
    this.leftLeg=scene.add.rectangle(-3,-5,4,11,0x454334);this.rightLeg=scene.add.rectangle(3,-5,4,11,0x454334);
    this.body=scene.add.graphics();this.arms=[scene.add.rectangle(-7,-21,4,14,COLORS.armSkin),scene.add.rectangle(7,-21,4,14,COLORS.armSkin)];
    this.weapon=scene.add.graphics().setVisible(false);this.tool=scene.add.graphics().setVisible(false);this.art=scene.add.image(0,0,'__DEFAULT').setVisible(false);this.add([this.shadow,this.leftLeg,this.rightLeg,this.body,...this.arms,this.weapon,this.tool,this.art]);this.cargoBundle=new CargoBundleView(scene,this);this.paint();
    // (86b) the enemy King wears a gold crown over his head (provisional, until his own art).
    if(definition?.crown){this.crown=scene.add.graphics();this.crown.fillStyle(0xf0c53a,1).lineStyle(1,0x6b4a10,1);const pts=[{x:-8,y:-56},{x:-8,y:-64},{x:-4,y:-60},{x:0,y:-67},{x:4,y:-60},{x:8,y:-64},{x:8,y:-56}];this.crown.fillPoints(pts,true);this.crown.strokePoints(pts,true);this.add(this.crown);}
    if(definition?.look)this.updateLook();// an enemy soldier wears his look from the start (also if he never moves)
  }
  // Profession and name decide the approved look; the procedural figure stays until it loads.
  updateLook(){
    // An enemy soldier (an animal definition with a fixed look) wears that look.
    if(this.definition?.look){const look=this.definition.look;if(look===this.look)return;this.look=look;this.lookReady=false;if(villagerArt(look))this.lookReady=ensureLook(this.scene,look,()=>{if(this.look===look&&this.scene){this.lookReady=true;this.applyArt();}});this.applyArt();return;}
    const worker=this.getData?.('worker');if(!worker)return;
    const sex=worker.identity?(worker.identity.sex==='f'?'female':'male'):villagerSex(worker.name),profession=worker.isSubject===false?worker.profession:(worker.displayProfession??'idle');
    // g-vojaci-grafika: a soldier wears the look of his rank. Owner 18 Nov 2026: an untrained Recruit wears the Branec.
    const unitType=worker.profession==='soldier'&&this.scene?.military?(this.scene.military.unit?.(worker)?.type??'recruit'):null;
    const look=(unitType&&militaryLook(unitType,sex,worker.id))??professionLooks(profession)?.[sex]??null;
    if(look===this.look)return;this.look=look;this.lookReady=false;
    if(look&&villagerArt(look))this.lookReady=ensureLook(this.scene,look,()=>{if(this.look===look&&this.scene){this.lookReady=true;this.applyArt();}});
    this.applyArt();
  }
  applyArt(){
    const on=!!(this.look&&this.lookReady),k=FACING_INDEX[this.facing]??0;
    for(const part of [this.shadow,this.leftLeg,this.rightLeg,this.body,...this.arms])part.setVisible(!on);
    if(!on){this.art.setVisible(false);return;}
    const art=villagerArt(this.look);this.tool.setVisible(false);this.weapon.setVisible(false);
    if(art.anim&&hasWalk(this.scene,this.look)){const frame=soldierFrame(art.anim,k,{walkedMs:this.walked??0,walkFps:art.walk.fps,moving:!!this.isWalking,attackMs:this.attackMs??0,attacking:!!this.attacking,idleCol:this.idleCol??art.anim.idle}),key=walkKey(this.look);
      if(this.artFrame!==`${key}:${frame}`){this.artFrame=`${key}:${frame}`;this.art.setTexture(key,frame).setOrigin(art.walk.origin.x,art.walk.origin.y).setScale(art.walk.scale??1);}this.art.setVisible(true);return;}
    if(hasWalk(this.scene,this.look)){const frame=walkFrame(k,this.walked??0,art.walk.fps,!!this.isWalking),key=walkKey(this.look);
      if(this.artFrame!==`${key}:${frame}`){this.artFrame=`${key}:${frame}`;this.art.setTexture(key,frame).setOrigin(art.walk.origin.x,art.walk.origin.y).setScale(art.walk.scale??1);}this.art.setVisible(true);return;}
    const origin=art.origins[k];this.artFrame=null;this.art.setScale(1);
    this.art.setTexture(lookKey(this.look,k)).setOrigin(origin.x,origin.y).setVisible(true);
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
    this.isWalking=moving;this.phase+=delta*(moving ? .014*MOVEMENT_SPEED_SCALE : .002);const stride=moving?Math.sin(this.phase)*2:0,pose=DIRECTION_POSES[this.facing];
    this.leftLeg.setPosition(-3+pose.screenX*stride,-5+pose.screenY*stride);this.rightLeg.setPosition(3-pose.screenX*stride,-5-pose.screenY*stride);
    this.arms[0].rotation=stride*.07;this.arms[1].rotation=-stride*.07;
    this.updateLook();
    // Approved looks with a walk sheet step frame by frame (no bob); without one they bob and sway lightly.
    if(this.art.visible){
      if(hasWalk(this.scene,this.look)){this.walked=moving?(this.walked??0)+delta*MOVEMENT_SPEED_SCALE:0;{const anim=villagerArt(this.look)?.anim;if(anim)this.idleCol=moving||this.attacking?anim.idle:soldierIdle(anim,this.idleState??={},delta);}this.applyArt();this.art.y=0;this.art.rotation=0;}
      else{this.art.y=moving?-Math.abs(Math.sin(this.phase))*1.6:0;this.art.rotation=moving?Math.sin(this.phase)*.035:0;}}
  }
  setAttackPose(delta,active,direction){
    const animArt=this.art.visible?villagerArt(this.look)?.anim:null;
    if(animArt){this.weapon.setVisible(false);this.attacking=!!active;if(active){const face=directionName(direction);if(face)this.facing=face;this.attackMs=(this.attackMs??0)+delta;}else this.attackMs=0;this.art.rotation=0;this.applyArt();return;}
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
  // #98 Sitting on a porch (provisional pose until seated sprites exist): the figure sinks onto the seat, legs folded
  // under it, and now and then picks his nose.
  setSeated(on){
    if(!on){if(this.seatedOn){this.seatedOn=false;this.setScale(1,1);this.nose?.setVisible(false);}return;}
    this.seatedOn=true;this.setScale(1,.8);
    if(!this.nose){this.nose=this.scene.add.rectangle(2,-36,2,5,COLORS.armSkin).setVisible(false);this.add(this.nose);}
    this.seatPhase=((this.seatPhase??Math.random()*9000)+16)%9000;this.nose.setVisible(this.seatPhase<1200);
  }
  // m-animace-rybar: a Fisher at his spot plays the approved fishing loop (cast, sit-idle with twitches, bite → reel →
  // store on each catch) facing the water. The sheet loads like the walk sheets; until it is in, or if it fails, the
  // Fisher looks as before. Frames change only while he is on screen and in sight.
  workerSex(){const w=this.getData?.('worker');return w?.identity?(w.identity.sex==='f'?'female':'male'):villagerSex(w?.name);}
  setFishing(delta,info){
    const sheet=info?fishingSheet(this.scene,this.workerSex()):null,art=sheet?.art,key=sheet?.key;
    if(!sheet){this.fishAnimator?.reset();if(this.fishing){this.fishing=false;this.fishArt?.setVisible(false);this.applyArt();}return false;}
    if(!this.fishAnimator||this.fishAnimator.art!==art)this.fishAnimator=new FishingAnimator(art,residentSeed(this.getData?.('worker')));
    const state=this.fishAnimator.update(delta,info);
    if(info.facing!=null&&info.facing!==this.fishFacing)this.fishFacing=info.facing;
    if(!this.fishArt){this.fishArt=this.scene.add.image(0,0,key).setVisible(false);this.add(this.fishArt);}
    this.fishing=true;for(const part of [this.shadow,this.leftLeg,this.rightLeg,this.body,...this.arms,this.art,this.tool,this.weapon])part.setVisible(false);
    const view=this.scene.cameras?.main?.worldView,onScreen=!view||this.x>view.x-80&&this.x<view.right+80&&this.y>view.y-80&&this.y<view.bottom+120;
    if(this.visible&&onScreen){const frame=fishingFrame(art,this.fishFacing??0,state.column);if(this.fishFrame!==frame||this.fishArt.texture.key!==key){this.fishFrame=frame;this.fishArt.setTexture(key,frame).setOrigin(art.origin.x,art.origin.y);}this.fishArt.setVisible(true);}
    return true;
  }
  setCargo(cargo){this.cargoBundle.update(cargo);}
  // #58 C2: a small red "!" over a striking or leaving resident.
  setDiscontent(on){
    if(!!on===!!this.discontentIcon?.visible)return;
    if(on&&!this.discontentIcon){const g=this.scene.add.graphics();g.fillStyle(0xb8322a,1);g.fillCircle(0,-58,6);g.lineStyle(1.5,0xf3e3c4,1);g.strokeCircle(0,-58,6);g.fillStyle(0xffffff,1);g.fillRect(-1,-62,2,5);g.fillRect(-1,-55.5,2,1.8);this.discontentIcon=g;this.add(g);}
    this.discontentIcon?.setVisible(!!on);
  }
}
