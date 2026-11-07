import Phaser from 'phaser';
import { gridToWorld } from './isometric.js';

// Children and the Village Green D1: provisional drawings of children (smaller than adults, six colour sets) and of
// snowmen until the Studio art (plan g-deti-naves-grafika) is approved. Only children on screen and in sight are
// redrawn each frame; the rest are hidden and skipped.
const LOOKS=[[0x8b4a3a,0x5b3a26],[0x4f6a8c,0x3a2a1c],[0x6f7f3e,0xc8a060],[0xb07a3a,0x2a1d14],[0x8a5a8c,0x6b4423],[0x3f7a6e,0xd8b878]];
function drawChild(g,child,phase){
  const [tunic,hair]=LOOKS[child.look%LOOKS.length],a=child.activity?.kind,moving=!!child.moving,dir=(child.facing?.x??0)-(child.facing?.y??0)>=0?1:-1,step=moving?Math.sin(phase*(a==='tag'?2.2:1.6))*2:0;g.clear();
  let lift=0,sway=0;
  if(!moving&&child.state==='out'&&a==='swing'){sway=Math.sin(phase*.9)*6;lift=3;}
  if(!moving&&child.state==='out'&&a==='snowball')lift=Math.max(0,Math.sin(phase*1.3))*1.5;
  g.fillStyle(0x26271b,.25);g.fillEllipse(sway,1,14,5);
  g.fillStyle(0x4a3d2c);g.fillRect(sway-3,-7-lift,2.4,7+step*.5);g.fillRect(sway+.8,-7-lift,2.4,7-step*.5);
  g.fillStyle(tunic);g.fillPoints([{x:sway-4,y:-18-lift},{x:sway+4,y:-18-lift},{x:sway+5,y:-7-lift},{x:sway-5,y:-7-lift}],true);
  g.fillStyle(0xe6c4a0);g.fillCircle(sway+dir*.5,-22-lift,4);
  g.fillStyle(hair);g.fillEllipse(sway,-25-lift,8.5,4.5);if(child.sex==='girl'){g.fillRect(sway-4.5,-25-lift,2,7);g.fillRect(sway+2.5,-25-lift,2,7);}
  if(child.state!=='out'||!child.activity)return;
  if(a==='hoop'){g.lineStyle(1.5,0x8a6a43);g.strokeCircle(sway+dir*8,-6,5.5);g.lineBetween(sway+dir*3,-13,sway+dir*7,-7);}
  if(a==='ball'){g.fillStyle(0xb8492f);g.fillCircle(dir*(6+Math.abs(step)),-2-Math.abs(Math.sin(phase*1.6))*4,2.4);}
  if(a==='swing'&&!moving){g.lineStyle(1,0x3b2c1d);g.lineBetween(sway-3,-18-lift,0,-40);g.lineBetween(sway+3,-18-lift,0,-40);}
  if(a==='snowball'&&!moving){const t=(phase*.6)%1;g.fillStyle(0xffffff);g.fillCircle(dir*(4+t*18),-20+Math.sin(t*Math.PI)*-8,1.8);}
  if(a==='snowman'&&!moving){g.fillStyle(0xf4f6f6);g.fillCircle(dir*9,-3,4.5);}
}
function drawSnowman(g,variant){
  g.clear();g.fillStyle(0x26271b,.2);g.fillEllipse(0,1,18,6);g.fillStyle(0xf5f7f7);g.fillCircle(0,-6,7);g.fillCircle(0,-16,5);g.fillStyle(0x2a2a2a);g.fillCircle(-1.5,-17,.8);g.fillCircle(1.5,-17,.8);
  g.fillStyle(0xd9762b);g.fillTriangle(0,-16,4,-15.3,0,-14.8);g.lineStyle(1.2,0x5e4129);g.lineBetween(-5,-11,-10,-15);g.lineBetween(5,-11,10,-14);
  if(variant){g.fillStyle(0x6b3a2a);g.fillRect(-4,-23,8,3);g.fillRect(-2.5,-27,5,4);}else{g.fillStyle(0x3d5a8a);g.fillRect(-5,-12,10,2);}
}

export class ChildViews {
  constructor(scene,system){this.scene=scene;this.system=system;this.phase=0;this.snowmen=new Map();}
  visible(position){return !this.scene.fog||this.scene.fog.isVisibleObject({position});}
  update(delta){
    const s=this.system,view=this.scene.cameras?.main?.worldView;this.phase+=delta*.012;
    for(const child of s.children.values()){
      if(!child.view){const v=new Phaser.GameObjects.Container(this.scene,0,0);this.scene.add.existing(v);v.figure=this.scene.add.graphics();v.add(v.figure);child.view=v;}
      const v=child.view,p=gridToWorld(child.x,child.y),onScreen=!view||p.x>view.x-40&&p.x<view.right+40&&p.y>view.y-40&&p.y<view.bottom+60;
      v.setPosition(p.x,p.y);v.setDepth(p.y+1.5);v.setVisible(child.state!=='inside'&&onScreen&&this.visible({x:child.x,y:child.y}));
      v.setAlpha(child.state==='leaving'?.7:1);
      if(v.visible)drawChild(v.figure,child,this.phase+child.index*1.7+child.houseId);
    }
    for(const child of [...this.known??[]])if(!s.children.has(child.id)){child.view?.destroy();child.view=null;}
    this.known=[...s.children.values()];
    const live=new Set();
    for(const sm of s.snowmen){live.add(sm.id);let g=this.snowmen.get(sm.id);if(!g){g=this.scene.add.graphics();drawSnowman(g,sm.variant);this.snowmen.set(sm.id,g);}
      const p=gridToWorld(sm.x,sm.y);g.setPosition(p.x,p.y).setDepth(p.y+1).setVisible(this.visible({x:sm.x,y:sm.y}));}
    for(const [id,g]of this.snowmen)if(!live.has(id)){g.destroy();this.snowmen.delete(id);}
  }
  destroy(){for(const c of this.system.children.values()){c.view?.destroy();c.view=null;}for(const g of this.snowmen.values())g.destroy();this.snowmen.clear();}
}
