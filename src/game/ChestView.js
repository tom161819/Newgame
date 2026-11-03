import Phaser from 'phaser';

export class ChestView extends Phaser.GameObjects.Container {
  constructor(scene,x,y){
    super(scene,x,y);scene.add.existing(this);
    this.body=scene.add.graphics();this.lid=scene.add.graphics({x:0,y:-26});
    this.paint();this.add([this.body,this.lid]);this.opened=false;
    this.bodyHitArea=new Phaser.Geom.Polygon([{x:-19,y:-26},{x:0,y:-33},{x:19,y:-26},{x:19,y:-9},{x:0,y:0},{x:-19,y:-9}]);
  }
  paint(){
    const body=this.body.clear();this.lid.clear();
    const poly=(g,color,points)=>{g.fillStyle(color);g.fillPoints(points.map(([px,py])=>({x:px,y:py})),true);};
    body.fillStyle(0x30291c,.3);body.fillEllipse(1,3,43,15);
    poly(body,0x8b6239,[[-19,-9],[0,0],[0,-17],[-19,-26]]);
    poly(body,0x62452b,[[0,0],[19,-9],[19,-26],[0,-17]]);
    poly(body,0x272a1e,[[-17,-25],[0,-33],[17,-25],[0,-18]]);
    body.lineStyle(2,0xb49d60);body.lineBetween(-12,-22,-12,-6);body.lineBetween(12,-22,12,-6);
    body.fillStyle(0xb49d60);body.fillRect(-3,-17,6,8);body.fillStyle(0x24291d);body.fillCircle(0,-12,1.4);
    poly(this.lid,0xb0864c,[[-19,0],[0,-9],[19,0],[0,9]]);
    this.lid.lineStyle(2,0xc0ad75);this.lid.strokePoints([{x:-19,y:0},{x:0,y:-9},{x:19,y:0},{x:0,y:9}],true);
    this.lid.lineBetween(-10,-4,-10,4);this.lid.lineBetween(10,-4,10,4);
  }
  open(onComplete){
    if(this.opened){onComplete();return;}
    this.openTween=this.scene.tweens.add({targets:this.lid,y:-38,rotation:-.65,duration:350,ease:'Sine.Out',onComplete:()=>{this.openTween=null;this.opened=true;onComplete();}});
  }
  setOpened(value){this.opened=value;this.lid.setPosition(0,value?-38:-26).setRotation(value?-.65:0);}
  containsPoint(worldX,worldY){
    const x=worldX-this.x,y=worldY-this.y;
    if(Phaser.Geom.Polygon.Contains(this.bodyHitArea,x,y))return true;
    const dx=x-this.lid.x,dy=y-this.lid.y,c=Math.cos(this.lid.rotation),s=Math.sin(this.lid.rotation);
    return Math.abs(dx*c+dy*s)/19+Math.abs(-dx*s+dy*c)/9<=1;
  }
}
