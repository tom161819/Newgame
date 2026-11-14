import Phaser from 'phaser';
import { treeState,stumpGone } from '../data/naturalResources.js';

const TREE_BLOWS=7;
export class TreeView extends Phaser.GameObjects.Container {
  constructor(scene,definition,context){
    super(scene,context.x,context.y);scene.add.existing(this);this.definition=definition;this.object=context.object??{natural:treeState('preview')};this.body=scene.add.graphics();this.bar=scene.add.graphics();this.art=scene.add.image(0,0,'__DEFAULT').setVisible(false);this.add([this.body,this.art,this.bar]);this.tile=context.tile??null;this.season=context.season??scene.seasons?.season??'Spring';this.setDepth(context.y+(definition.depth?.offset??0));this.paint();
  }
  setNaturalState(object){this.object=object;this.paint();return this;}
  // Live trees follow the gradual season change of their tile; remembered (map memory) trees keep what was seen.
  setSeason(value){this.targetSeason=value;return this.applySeason();}
  applySeason(){const target=this.targetSeason??this.season,o=this.object,value=Number.isFinite(o?.x)?this.scene.seasonTransition?.seasonAt(o,target)??target:target;if(value!==this.season){this.season=value;this.paint();}return this;}
  // Approved Asset Studio art for this stage, season and tile, or null (procedural drawing).
  artKey(){
    const art=this.definition.artSprites,assets=this.scene.assets,stage=this.object.natural.stage;if(!art||!assets||stage<2)return null;
    const pine=this.definition.id==='pine_tree',season=this.season,tile=this.tile??this.object,hash=((Math.imul((tile?.x??0)+17,374761393)^Math.imul((tile?.y??0)+29,668265263))>>>0)%2;
    const look=stage===2?(pine||season==='Spring'||season==='Summer'?'young':null):season==='Winter'?'winter':pine?'mature':season==='Spring'?'spring':season==='Autumn'?'autumn':hash&&art.broad?'broad':'mature';
    return look&&art[look]&&assets.hasTexture(this.definition.id,`art-${look}`)?look:null;
  }
  paint(){
    // m-parezy-na-ceste: a stump that rotted away on a worn path is not drawn.
    if(stumpGone(this.object.natural)){this.art.setVisible(false);this.artLook=null;this.body.clear();this.bar?.clear?.();return;}
    const look=this.artKey();
    if(look){
      const art=this.definition.artSprites[look],key=this.scene.assets.key(this.definition.id,`art-${look}`);
      this.art.setTexture(key).setOrigin(art.origin.x,art.origin.y).setVisible(true);this.artLook=look;this.body.clear();
      this.setDepth(this.y+(this.object.natural.stage<3?-.15:this.definition.depth?.offset??0));
      return;
    }
    this.art.setVisible(false);this.artLook=null;
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
  // m-stromy-bez-hp (owner, 12 Nov): no bar over a tree being felled. The tree shivers at every blow instead (the
  // work is split into TREE_BLOWS blows; the shiver is a short rocking of the whole tree about its foot).
  showWork(ratio=null){
    this.bar.clear();if(ratio==null){this.blow=null;this.setAngle(0);return;}
    const blow=Math.floor(Math.max(0,Math.min(.999,ratio))*TREE_BLOWS);if(blow===this.blow)return;this.blow=blow;
    const side=blow%2?1:-1;this.shiver?.stop?.();this.setAngle(0);
    this.shiver=this.scene.tweens?.add?.({targets:this,angle:{from:1.6*side,to:0},duration:220,ease:'Sine.easeOut'})??null;
  }
  getMemoryState(){return{stage:this.object.natural.stage,season:this.season};}
  containsPoint(x,y){
    if(stumpGone(this.object.natural))return false;
    if(this.artLook){const frame=this.art.frame,px=Math.floor(x-this.x+this.art.originX*frame.width),py=Math.floor(y-this.y+this.art.originY*frame.height);return px>=0&&py>=0&&px<frame.width&&py<frame.height&&(this.scene.textures.getPixelAlpha(px,py,this.art.texture.key)??0)>=128;}
    const stage=this.object.natural.stage,dx=x-this.x,dy=y-this.y;if(stage===0)return Math.abs(dx)<12&&dy>=-15&&dy<=8;const scale=stage===1?.25:stage===2?.58:1,pine=this.definition.id==='pine_tree',height=(pine?100:84)*scale;
    if(Math.abs(dx)<=6*scale&&dy>=-height*.7&&dy<=8)return true;
    if(pine){for(let tier=0;tier<3;tier++){const distance=dy+height*(1-tier*.22);if(distance>=0&&distance<=height*.38&&Math.abs(dx)<=(13+tier*7)*scale*distance/(height*.38))return true;}return false;}
    if(this.season==='Winter')return Math.abs(dx)<=22*scale&&dy>=-height&&dy<=-height*.4;
    return(dx/(27.5*scale))**2+((dy+height*.59)/(21.5*scale))**2<=1||[[-14,.75,18],[13,.77,19],[-5,.86,17]].some(([cx,cy,r])=>(dx-cx*scale)**2+(dy+height*cy)**2<=(r*scale)**2);
  }
}
