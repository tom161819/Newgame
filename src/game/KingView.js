import Phaser from 'phaser';
import { directionName, DIRECTION_POSES } from './directions.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { AnimalView } from './AnimalView.js';

// Grafická vrstva krále. Controller dodává logický směr, nikoli úhel obrazovky.
// Každý z osmi směrů má vlastní pózu; později ji může nahradit animovaný sprite.
export class KingView extends Phaser.GameObjects.Container {
  constructor(scene, x, y, definition=objectRegistry.require('king')) {
    super(scene, x, y);
    scene.add.existing(this);
    this.setData('objectId',definition.id);
    const shadow=definition.shadow;
    this.shadow = scene.add.ellipse(shadow?.x??0,shadow?.y??0,shadow?.width??1,shadow?.height??1,shadow?.color??0x30291c,shadow?.alpha??0);
    this.torsoGroup = scene.add.container(0, 0);
    this.leftLeg = scene.add.rectangle(-4, -5, 5, 11, 0x374858);
    this.rightLeg = scene.add.rectangle(4, -5, 5, 11, 0x374858);
    this.leftBoot = scene.add.rectangle(-4, 0, 7, 4, 0x3d2d20);
    this.rightBoot = scene.add.rectangle(4, 0, 7, 4, 0x3d2d20);
    this.figure = scene.add.graphics();
    this.leftArm = scene.add.rectangle(-9, -20, 4, 14, 0xc6a17c);
    this.rightArm = scene.add.rectangle(9, -20, 4, 14, 0xc6a17c);
    this.torsoGroup.add([this.figure, this.leftArm, this.rightArm]);
    this.add([this.shadow, this.leftLeg, this.rightLeg, this.leftBoot, this.rightBoot, this.torsoGroup]);
    this.phase = 0;
    this.facing = 'S';
    this.isWalking = false;
    this.paint();
  }

  paint() {
    const g = this.figure.clear();
    const pose = DIRECTION_POSES[this.facing];
    this.pose = pose;
    const { back, profile } = pose, horizontal = pose.screenX;
    const bodyWidth = profile ? 5 : 7, capeWidth = profile ? 8 : 13;
    const headX = horizontal * (profile ? 1.5 : 0.6);
    this.legSpacing = profile ? 2.5 : 4;
    const poly = (color, points) => {
      g.fillStyle(color);
      g.fillPoints(points.map(([x, y]) => ({ x, y })), true);
    };
    const cape = () => {
      const offset = -horizontal * 2;
      poly(0x8d2827, [[-7,-31],[-capeWidth+offset,-7],[-5+offset,-3],
        [offset,-6],[6+offset,-3],[capeWidth+offset,-7],[7,-31]]);
      poly(0xb13b32, [[-5,-30],[-6+offset,-8],[offset,-7],[1,-30]]);
      g.lineStyle(1, 0xd3ae58, 0.9);
      g.lineBetween(-capeWidth+offset,-7,-5+offset,-3);
      g.lineBetween(6+offset,-3,capeWidth+offset,-7);
    };
    if (!back) cape();
    poly(0x355b78, [[-bodyWidth,-31],[bodyWidth,-31],[bodyWidth+1,-12],[-bodyWidth-1,-12]]);
    g.fillStyle(0xd5b65f);
    g.fillRect(-bodyWidth-1,-16,bodyWidth*2+2,3);
    g.fillRect(horizontal-1,-29,2,13);
    if (back) cape();
    poly(0xe5d6b3, [[-bodyWidth-1,-31],[-4,-34],[0,-31],[4,-34],[bodyWidth+1,-31],[3,-28],[-3,-28]]);
    g.fillStyle(back ? 0x765333 : 0xd6b18a);
    g.fillEllipse(headX,-38,profile ? 9 : 12,12);
    g.fillStyle(0x6c492b);
    g.fillRect(headX-6,-41,2,7); g.fillRect(headX+4,-41,2,7);
    if (!back) {
      g.fillStyle(0x3b3024);
      if (horizontal === 0) { g.fillRect(-3,-39,2,2); g.fillRect(2,-39,2,2); }
      else g.fillRect(headX+horizontal*2,-39,2,2);
      g.fillStyle(0xe0b990);
      g.fillCircle(headX+horizontal*(profile ? 5 : 4),-36,2);
      poly(0x927044, [[headX-4+horizontal,-35],[headX+horizontal,-31],[headX+4+horizontal,-35]]);
    }
    const crownWidth = profile ? 5 : 7;
    g.fillStyle(0xc59a34); g.fillRect(headX-crownWidth+1,-46,crownWidth*2-2,5);
    poly(0xf0d36d, [[headX-crownWidth,-46],[headX-crownWidth,-53],[headX-3,-49],
      [headX,-55],[headX+3,-49],[headX+crownWidth,-53],[headX+crownWidth-1,-46]]);
    g.fillStyle(back ? 0xb29240 : 0x982e2a); g.fillCircle(headX+horizontal,-44,1.5);
    this.leftArm.setAlpha(horizontal > 0 ? 0.6 : 1);
    this.rightArm.setAlpha(horizontal < 0 ? 0.6 : 1);
    // Profilové pózy mají vzdálenou paži za tělem, čelní obě před ním.
    this.torsoGroup.bringToTop(this.figure);
    if (horizontal >= 0) this.torsoGroup.bringToTop(this.rightArm);
    if (horizontal <= 0) this.torsoGroup.bringToTop(this.leftArm);
  }

  setMounted(definition){
    this.mount?.destroy();this.mount=null;
    if(definition){this.mount=new AnimalView(this.scene,0,0,definition);this.addAt(this.mount,1);}
    this.shadow.setVisible(!definition);
  }

  animate(delta, moving, direction) {
    this.isWalking = moving;
    // Směr je poslední skutečný pohyb z controlleru. Platí i při příjezdu
    // v jediném snímku; během klidu ho controller už nemění.
    const facing = directionName(direction);
    if (facing && facing !== this.facing) { this.facing = facing; this.paint(); }
    this.phase += delta * (moving ? 0.013 : 0.002);
    this.mount?.animate(delta,moving,direction);
    const stride = moving ? Math.sin(this.phase) * 2.6 : 0;
    const length = Math.hypot(this.pose.screenX, this.pose.screenY);
    const sx = this.pose.screenX / length, sy = this.pose.screenY / length;
    this.leftLeg.x = -this.legSpacing + sx * stride;
    this.rightLeg.x = this.legSpacing - sx * stride;
    this.leftBoot.x = this.leftLeg.x; this.rightBoot.x = this.rightLeg.x;
    this.leftLeg.y = -5 + sy * stride; this.leftBoot.y = sy * stride;
    this.rightLeg.y = -5 - sy * stride; this.rightBoot.y = -sy * stride;
    const arm = this.pose.profile ? 7 : 9;
    this.leftArm.x = -arm - sx * stride * 0.4;
    this.rightArm.x = arm + sx * stride * 0.4;
    this.leftArm.y = -20 - sy * stride * 0.5;
    this.rightArm.y = -20 + sy * stride * 0.5;
    this.leftArm.rotation = moving ? Math.sin(this.phase) * 0.22 : 0.02;
    this.rightArm.rotation = -this.leftArm.rotation;
    this.torsoGroup.y = moving ? -Math.abs(Math.sin(this.phase)) * 1.3 : Math.sin(this.phase) * 0.4;
    if(this.mount){
      this.torsoGroup.y-=19;
      this.leftLeg.y-=18;this.rightLeg.y-=18;this.leftBoot.y-=18;this.rightBoot.y-=18;
    }
    this.leftLeg.rotation=this.mount?0.65:0;this.rightLeg.rotation=this.mount?-0.65:0;
  }
}
