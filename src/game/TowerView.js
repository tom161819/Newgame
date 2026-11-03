import Phaser from 'phaser';
import { tilePolygon } from './isometric.js';
import { towerBase, buildingDepth, buildingDefinition } from './buildings.js';

function polygon(g,color,points){g.fillStyle(color);g.fillPoints(points.map(([x,y])=>({x,y})),true);}
function merlon(g,x,y,tint){
  polygon(g,tint??0xb3ad97,[[x-6,y-3],[x,y],[x,y-14],[x-6,y-17]]);
  polygon(g,tint??0x858778,[[x,y],[x+6,y-3],[x+6,y-17],[x,y-14]]);
  polygon(g,tint??0xd7ccb2,[[x-6,y-17],[x,y-20],[x+6,y-17],[x,y-14]]);
}

export class TowerView {
  constructor(scene,tower,preview=false){
    this.preview=preview;
    this.footprint=scene.add.graphics();this.back=scene.add.graphics();this.front=scene.add.graphics();
    this.hitArea=new Phaser.Geom.Polygon([-64,3,-64,-34,-56,-146,0,-166,56,-146,64,-34,64,3]);
    this.paint(tower);
    if(preview){this.back.setAlpha(0.5);this.front.setAlpha(0.5);}
  }

  paint(tower,tint=null){
    this.base=towerBase(tower);const {x,y}=this.base;
    this.definition=buildingDefinition(tower);
    const depth=buildingDepth(tower);
    const g=this.back.clear().setPosition(x,y).setDepth(this.preview?10001:depth);
    const front=this.front.clear().setPosition(x,y).setDepth(this.preview?10002:depth+0.3);
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);
    floor.fillStyle(tint??0x777450,this.preview?0.3:0.25);floor.lineStyle(1,tint??0xb3a477,0.8);
    for(const tile of tower.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}
    const shadow=this.definition.shadow;
    if(shadow){g.fillStyle(shadow.color,shadow.alpha);g.fillEllipse(shadow.x,shadow.y,shadow.width,shadow.height);}
    polygon(g,tint??0x777765,[[0,-64],[64,-32],[0,1],[-64,-32]]);
    polygon(g,tint??0xada691,[[-50,-25],[0,0],[0,-94],[-50,-119]]);
    polygon(g,tint??0x818373,[[0,0],[50,-25],[50,-119],[0,-94]]);
    g.lineStyle(1,tint??0x656b5d,0.7);
    for(let level=-15;level>=-90;level-=15){
      g.lineBetween(-50,level-25,0,level);g.lineBetween(0,level,50,level-25);
      const offset=level%30===0?12:30;
      g.lineBetween(-offset,level-offset/2,-offset,level-offset/2-15);
      g.lineBetween(offset,level-offset/2,offset,level-offset/2-15);
    }
    polygon(g,tint??0x3f493d,[[25,-17],[38,-24],[38,-53],[25,-46]]);
    g.lineStyle(2,tint??0xc1a46e,1);g.lineBetween(-4,-5,-4,-94);g.lineBetween(4,-5,4,-94);
    for(let rung=-10;rung>-94;rung-=9)g.lineBetween(-4,rung,4,rung);
    polygon(g,tint??0xc9c0a8,[[0,-146],[56,-118],[0,-90],[-56,-118]]);
    for(const [mx,my]of[[-48,-122],[-24,-134],[0,-146],[24,-134],[48,-122]])merlon(g,mx,my,tint);
    polygon(front,tint??0xa8a18a,[[-56,-118],[0,-90],[0,-81],[-56,-109]]);
    polygon(front,tint??0x7c8270,[[0,-90],[56,-118],[56,-109],[0,-81]]);
    for(const [mx,my]of[[-48,-114],[-24,-102],[0,-90],[24,-102],[48,-114]])merlon(front,mx,my,tint);
  }

  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x-this.base.x,y-this.base.y);}
  setAlpha(value){this.footprint.setAlpha(value);this.back.setAlpha(value);this.front.setAlpha(value);return this;}
  setVisible(value){this.footprint.setVisible(value);this.back.setVisible(value);this.front.setVisible(value);}
  inView(view){return this.base.x+70>=view.x&&this.base.x-70<=view.right&&this.base.y+10>=view.y&&this.base.y-(this.definition.visualHeight??166)-9<=view.bottom;}
  destroy(){this.footprint.destroy();this.back.destroy();this.front.destroy();}
}
