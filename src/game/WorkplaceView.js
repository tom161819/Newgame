import Phaser from 'phaser';
import { gridToWorld,tilePolygon } from './isometric.js';
import { towerBase,buildingDefinition,buildingDepth } from './buildings.js';

const polygon=(g,color,p)=>{g.fillStyle(color);g.fillPoints(p,true);};
export class WorkplaceView {
  constructor(scene,building,preview=false){this.scene=scene;this.preview=preview;this.body=scene.add.graphics();this.footprint=scene.add.graphics();this.paint(building);if(preview)this.body.setAlpha(.55);}
  paint(building,tint=null){
    const d=this.definition=buildingDefinition(building),base=this.base=towerBase(building),point=(x,y,z=0)=>{const p=gridToWorld(x,y);return{x:p.x-base.x,y:p.y-base.y-z};};
    const {x,y}=building,w=d.width,h=d.height,g=this.body.clear().setPosition(base.x,base.y).setDepth(this.preview?10001:buildingDepth(building));
    const floor=this.footprint.clear().setDepth(this.preview?10000:-90);floor.fillStyle(tint??0x857b50,.25);floor.lineStyle(1,tint??0xc2b489,.8);for(const tile of building.tiles){floor.fillPoints(tilePolygon(tile),true);floor.strokePoints(tilePolygon(tile),true);}
    g.fillStyle(0x292d20,.3);g.fillEllipse(12,-15,w*59,h*21);
    const a=point(x+.1,y+.1),b=point(x+w-.1,y+.1),c=point(x+w-.1,y+h-.1),e=point(x+.1,y+h-.1);
    polygon(g,tint??0x8f8773,[a,b,c,e]);
    if(d.id==='quarry'){
      polygon(g,tint??0x706f61,[point(x+.35,y+.35,16),point(x+w-.35,y+.35,16),point(x+w-.35,y+.35,44),point(x+.35,y+.35,44)]);
      for(const [dx,dy,size]of [[.6,1.1,24],[1.3,1.1,29],[1.9,1.1,22],[.6,2,22],[1.35,2,26]]){
        const p=point(x+dx,y+dy);polygon(g,tint??0x777b70,[{x:p.x-size/2,y:p.y},{x:p.x,y:p.y-size},{x:p.x+size/2,y:p.y-3},{x:p.x,y:p.y+7}]);polygon(g,tint??0xb8b7a4,[{x:p.x-size/2,y:p.y},{x:p.x,y:p.y-size},{x:p.x+size/2,y:p.y-3},{x:p.x,y:p.y-5}]);
      }
      const post=point(x+2.4,y+1.5);g.lineStyle(5,tint??0x725735);g.lineBetween(post.x,post.y,post.x,post.y-68);g.lineBetween(post.x-26,post.y-55,post.x+32,post.y-72);g.lineStyle(1,0xbab18d);g.lineBetween(post.x+30,post.y-71,post.x+30,post.y-24);g.strokeCircle(post.x+30,post.y-20,4);
    }else{
      const height=d.id==='mill'?77:d.id==='granary'?65:d.id==='barracks'?57:43,roof=height+36,raise=p=>({...p,y:p.y-height});
      polygon(g,tint??0xa29676,[e,c,raise(c),raise(e)]);polygon(g,tint??0x746f5a,[c,b,raise(b),raise(c)]);
      for(let z=12;z<height;z+=12){g.lineStyle(1,0x524f3e,.45);g.lineBetween(e.x,e.y-z,c.x,c.y-z);g.lineBetween(c.x,c.y-z,b.x,b.y-z);}
      const near=point(x+w/2,y+h-.1,roof),far=point(x+w/2,y+.1,roof);
      polygon(g,tint??0xa29676,[raise(e),near,raise(c)]);polygon(g,tint??0x80795f,[raise(a),far,raise(b)]);
      polygon(g,tint??(d.id==='barracks'?0x675748:d.id==='farmhouse'?0xc3a25a:0x98724b),[raise(e),near,far,raise(a)]);polygon(g,tint??(d.id==='barracks'?0x494d44:d.id==='farmhouse'?0x92733c:0x654e35),[near,raise(c),raise(b),far]);
      const door=point(x+w*.65,y+h-.1);g.fillStyle(0x393a2b);g.fillRect(door.x-10,door.y-32,20,32);g.lineStyle(1,0xc4a66a);g.lineBetween(door.x,door.y-30,door.x,door.y);
      if(d.id==='barracks'){const p=point(x+w*.6,y+h*.6,roof);g.lineStyle(2,0xb9a268);g.lineBetween(p.x,p.y,p.x,p.y-30);polygon(g,tint??0x9d4e3b,[{x:p.x,y:p.y-30},{x:p.x+25,y:p.y-22},{x:p.x,y:p.y-15}]);}
      if(d.id==='mill'){
        const p=point(x+w*.55,y+h-.05,roof-8);g.lineStyle(5,tint??0x4c3c28);g.lineBetween(p.x-39,p.y-39,p.x+39,p.y+39);g.lineBetween(p.x-39,p.y+39,p.x+39,p.y-39);
        g.lineStyle(10,tint??0xdfd3a9);for(const [dx,dy]of [[-1,-1],[1,1],[-1,1],[1,-1]])g.lineBetween(p.x+dx*14,p.y+dy*14,p.x+dx*36,p.y+dy*36);g.fillStyle(0x634b30);g.fillCircle(p.x,p.y,6);
      }
      if(d.id==='bakery'){
        const p=point(x+.4,y+.5,roof);g.fillStyle(tint??0x8c7963);g.fillRect(p.x-7,p.y-25,15,38);const oven=point(x+w-.18,y+h-.1);g.fillStyle(tint??0x55452f);g.fillCircle(oven.x,oven.y-13,12);g.fillStyle(tint??0xf1a13e);g.fillEllipse(oven.x,oven.y-10,12,11);
      }
      if(d.id==='granary')for(const [dx,dy]of [[.5,2.8],[1,2.8],[1.5,2.8]]){const p=point(x+dx,y+dy);g.fillStyle(tint??0xc2a66c);g.fillEllipse(p.x,p.y-9,13,21);g.lineStyle(2,tint??0x78603b);g.lineBetween(p.x-5,p.y-15,p.x+5,p.y-15);}
    }
    this.hitArea=new Phaser.Geom.Polygon([point(x,y,d.visualHeight),point(x+w,y,d.visualHeight),b,c,e,point(x,y+h,d.visualHeight)]);
  }
  contains(x,y){return Phaser.Geom.Polygon.Contains(this.hitArea,x-this.base.x,y-this.base.y);}
  setAlpha(value){this.body.setAlpha(value);this.footprint.setAlpha(value);return this;}
  setVisible(value){this.body.setVisible(value);this.footprint.setVisible(value);return this;}
  inView(view){const width=(this.definition.width+this.definition.height)*32;return this.base.x+width>=view.x&&this.base.x-width<=view.right&&this.base.y+10>=view.y&&this.base.y-this.definition.visualHeight<=view.bottom;}
  destroy(){this.body.destroy();this.footprint.destroy();}
}
