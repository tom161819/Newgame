import Phaser from 'phaser';
import { treeState } from '../data/naturalResources.js';

export class TreeView extends Phaser.GameObjects.Container {
  constructor(scene,definition,context){
    super(scene,context.x,context.y);scene.add.existing(this);this.definition=definition;this.object=context.object??{natural:treeState('preview')};this.body=scene.add.graphics();this.bar=scene.add.graphics();this.add([this.body,this.bar]);this.season=context.season??scene.seasons?.season??'Spring';this.setDepth(context.y+(definition.depth?.offset??0));this.paint();
  }
  setNaturalState(object){this.object=object;this.paint();return this;}
  setSeason(value){if(value!==this.season){this.season=value;this.paint();}return this;}
  paint(){
    const stage=this.object.natural.stage,g=this.body.clear(),pine=this.definition.id==='pine_tree',winter=this.season==='Winter',autumn=this.season==='Autumn',scale=stage===1?.25:stage===2?.58:1,height=(pine?100:84)*scale;
    this.setDepth(this.y+(stage<3?-.15:this.definition.depth?.offset??0));
    g.fillStyle(0x243023,.23);g.fillEllipse(8,3,stage===0?25:45*scale,stage===0?10:20*scale);
    if(stage===0){g.fillStyle(0x684c32);g.fillRect(-7,-10,14,12);g.fillStyle(0xb49763);g.fillEllipse(0,-10,15,7);g.lineStyle(1,0x795b39);g.strokeEllipse(0,-10,8,3);this.bar.clear();return;}
    g.fillStyle(0x745334);g.fillTriangle(-5*scale,1,5*scale,1,2*scale,-height*.7);g.lineStyle(Math.max(1,3*scale),0x785d3d);g.lineBetween(0,-height*.3,-15*scale,-height*.58);g.lineBetween(0,-height*.47,16*scale,-height*.7);
    if(pine){
      for(let tier=0;tier<3;tier++){const y=-height*(1-tier*.22),half=(13+tier*7)*scale;g.fillStyle(tier===0?0x4f7950:0x315b41);g.fillTriangle(0,y,-half,y+height*.38,half,y+height*.38);g.fillStyle(0x254b37);g.fillTriangle(0,y,0,y+height*.38,half,y+height*.38);if(winter){g.fillStyle(0xe2e9de,.9);g.fillTriangle(0,y,-half*.55,y+height*.2,half*.55,y+height*.2);}}
    }else if(winter){
      g.lineStyle(Math.max(1,3*scale),0x826e50);for(const [x,y]of [[-20,.72],[-12,.96],[13,.9],[24,.68]])g.lineBetween(0,-height*.4,x*scale,-height*y);g.lineStyle(Math.max(1,2*scale),0xd5dfd3);g.lineBetween(-19*scale,-height*.7,-10*scale,-height*.86);
    }else{
      const dark=autumn?0x965d2f:0x426738,light=autumn?0xc89343:0x78984b;g.fillStyle(dark);g.fillEllipse(0,-height*.59,55*scale,43*scale);g.fillCircle(-14*scale,-height*.75,18*scale);g.fillCircle(13*scale,-height*.77,19*scale);g.fillStyle(light);g.fillCircle(-5*scale,-height*.86,17*scale);g.fillCircle(-15*scale,-height*.73,12*scale);g.fillStyle(autumn?0xb27736:0x5a803c);g.fillCircle(16*scale,-height*.63,13*scale);
    }
  }
  showWork(ratio=null){const g=this.bar.clear();if(ratio==null)return;const y=-this.definition.visualHeight-9;g.fillStyle(0x20291e,.95);g.fillRect(-20,y,40,6);g.fillStyle(0xd9bd73);g.fillRect(-19,y+1,38*Math.max(0,Math.min(1,ratio)),4);}
  getMemoryState(){return{stage:this.object.natural.stage,season:this.season};}
  containsPoint(x,y){
    const stage=this.object.natural.stage,dx=x-this.x,dy=y-this.y;if(stage===0)return Math.abs(dx)<12&&dy>=-15&&dy<=8;const scale=stage===1?.25:stage===2?.58:1,pine=this.definition.id==='pine_tree',height=(pine?100:84)*scale;
    if(Math.abs(dx)<=6*scale&&dy>=-height*.7&&dy<=8)return true;
    if(pine){for(let tier=0;tier<3;tier++){const distance=dy+height*(1-tier*.22);if(distance>=0&&distance<=height*.38&&Math.abs(dx)<=(13+tier*7)*scale*distance/(height*.38))return true;}return false;}
    if(this.season==='Winter')return Math.abs(dx)<=22*scale&&dy>=-height&&dy<=-height*.4;
    return(dx/(27.5*scale))**2+((dy+height*.59)/(21.5*scale))**2<=1||[[-14,.75,18],[13,.77,19],[-5,.86,17]].some(([cx,cy,r])=>(dx-cx*scale)**2+(dy+height*cy)**2<=(r*scale)**2);
  }
}
