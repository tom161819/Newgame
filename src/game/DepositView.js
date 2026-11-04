import Phaser from 'phaser';
export class DepositView extends Phaser.GameObjects.Container {
  constructor(scene,definition,context){super(scene,context.x,context.y);scene.add.existing(this);this.definition=definition;this.object=context.object??{natural:{remaining:1}};this.body=scene.add.graphics();this.add(this.body);this.setDepth(context.y+(definition.depth?.offset??0));this.paint();}
  depleted(){return this.object.natural.depleted??this.object.natural.remaining===0;}
  setNaturalState(object){this.object=object;if(this.depleted()!==this.lastDepleted)this.paint();return this;}
  paint(){
    const g=this.body.clear(),iron=this.definition.id==='iron_deposit',depleted=this.depleted();this.lastDepleted=depleted;g.fillStyle(0x273426,.25);g.fillEllipse(8,12,124,42);
    for(const [x,y,size,height]of [[-36,2,25,36],[0,-12,32,62],[35,6,26,42],[5,20,22,25]]){const h=depleted?height*.4:height,left=iron?0x56675d:0x858e7d,top=iron?0x879486:0xb3b9a4,right=iron?0x394e43:0x646e5f;
      g.fillStyle(left);g.fillPoints([{x:x-size,y},{x:x-size*.4,y:y-h},{x,y:y-h-8},{x,y:y+12}],true);g.fillStyle(top);g.fillPoints([{x:x-size*.4,y:y-h},{x,y:y-h-8},{x:x+size,y:y-7},{x:x+size*.2,y:y-h*.4}],true);g.fillStyle(right);g.fillPoints([{x,y:y-h-8},{x:x+size,y:y-7},{x:x+size*.8,y:y+8},{x,y:y+12}],true);
      g.lineStyle(2,depleted?0x464f45:iron?0xad6843:0x66715f);g.lineBetween(x-2,y-h*.6,x+5,y-h*.25);g.lineBetween(x+5,y-h*.25,x+1,y+4);
    }
  }
  getMemoryState(){return{depleted:this.depleted()};}
  containsPoint(x,y){const dx=x-this.x,dy=y-this.y;return Math.abs(dx)<64&&dy>=-82&&dy<=30&&Math.abs(dx)/70+Math.max(0,dy)/42<1.6;}
}
