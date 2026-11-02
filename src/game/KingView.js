import Phaser from 'phaser';

// Grafická vrstva krále. Controller zná jen pozici, hloubku a animate(); později
// lze tuto třídu nahradit spritem bez změny pathfindingu nebo inventáře.
export class KingView extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);
    this.shadow = scene.add.ellipse(0, 1, 27, 12, 0x30291c, 0.32);
    this.torsoGroup = scene.add.container(0, 0);
    this.leftLeg = scene.add.rectangle(-4, -5, 5, 11, 0x374858);
    this.rightLeg = scene.add.rectangle(4, -5, 5, 11, 0x374858);
    this.leftBoot = scene.add.rectangle(-4, 0, 7, 4, 0x3d2d20);
    this.rightBoot = scene.add.rectangle(4, 0, 7, 4, 0x3d2d20);
    this.figure = scene.add.graphics();
    this.leftArm = scene.add.rectangle(-9, -20, 4, 14, 0xc6a17c);
    this.rightArm = scene.add.rectangle(9, -20, 4, 14, 0xc6a17c);
    this.torsoGroup.add([this.figure, this.leftArm, this.rightArm]);
    this.add([this.shadow,this.leftLeg,this.rightLeg,this.leftBoot,this.rightBoot,this.torsoGroup]);
    this.phase = 0; this.facing = 'SE'; this.isWalking = false;
    this.paint();
  }

  paint() {
    const g=this.figure.clear(), back=this.facing.startsWith('N'), left=this.facing.endsWith('W');
    const poly=(color,points)=>{g.fillStyle(color);g.fillPoints(points.map(([x,y])=>({x,y})),true);};
    const cape=()=>{
      poly(0x8d2827,[[-8,-31],[-13,-7],[-6,-3],[0,-6],[7,-3],[13,-7],[8,-31]]);
      poly(0xb13b32,[[-6,-30],[-8,-8],[0,-7],[1,-30]]);
      g.lineStyle(1,0xd3ae58,0.9);g.lineBetween(-12,-7,-6,-3);g.lineBetween(7,-3,12,-7);
    };
    if(!back)cape();
    poly(0x355b78,[[-7,-31],[7,-31],[8,-12],[-8,-12]]);
    g.fillStyle(0xd5b65f);g.fillRect(-8,-16,16,3);g.fillRect(-1,-29,2,13);
    if(back)cape();
    poly(0xe5d6b3,[[-8,-31],[-5,-34],[0,-31],[5,-34],[8,-31],[4,-28],[-4,-28]]);
    g.fillStyle(back?0x765333:0xd6b18a);g.fillCircle(0,-38,6);
    g.fillStyle(0x6c492b);g.fillRect(-6,-41,2,7);g.fillRect(4,-41,2,7);
    if(!back){
      g.fillStyle(0x3b3024);g.fillRect(left?-4:1,-39,2,2);
      g.fillStyle(0xe0b990);g.fillCircle(left?-5:5,-36,2);
      poly(0x927044,[[-4,-35],[0,-31],[4,-35]]);
    }
    g.fillStyle(0xc59a34);g.fillRect(-6,-46,12,5);
    poly(0xf0d36d,[[-7,-46],[-7,-53],[-3,-49],[0,-55],[3,-49],[7,-53],[6,-46]]);
    g.fillStyle(0x982e2a);g.fillCircle(0,-44,1.5);
  }

  animate(delta, moving, direction) {
    this.isWalking = moving;
    if(moving && direction && (direction.x||direction.y)) {
      const facing=`${direction.y<0?'N':'S'}${direction.x<0?'W':'E'}`;
      if(facing!==this.facing){this.facing=facing;this.paint();}
    }
    this.phase+=delta*(moving?0.013:0.002);
    const stride=moving?Math.sin(this.phase)*2.6:0;
    this.leftLeg.y=-5+stride;this.leftBoot.y=stride;
    this.rightLeg.y=-5-stride;this.rightBoot.y=-stride;
    this.leftArm.rotation=moving?Math.sin(this.phase)*0.22:0.02;
    this.rightArm.rotation=-this.leftArm.rotation;
    this.torsoGroup.y=moving?-Math.abs(Math.sin(this.phase))*1.3:Math.sin(this.phase)*0.4;
  }
}
