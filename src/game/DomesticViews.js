import Phaser from 'phaser';
import { gridToWorld } from './isometric.js';
import { RATS,RAT_MOVES } from '../data/domesticAnimals.js';
import { ratLevel } from '../data/domesticAnimals.js';
import { directionName } from './directions.js';
import { animalLook,ensureAnimalLook,applyAnimalArt } from './animalArt.js';
import { MOVEMENT_SPEED_SCALE } from '../data/movement.js';

// Domestic animals Z1: provisional drawings (cats and rats) until the Studio art (plan g-domaci-zvirata-grafika)
// is approved. Since m-zvirata-nahodny-vzhled the approved Studio looks are drawn once loaded (one look per animal, seeded
// by its id); the drawings stay as the fallback. Cats show where they are and which way they face; rats scurry around their store, 1–5 by the
// infestation level. Both hide outside sight like other creatures.
const COATS=[[0x3b3530,0x23201d],[0xc98a4b,0x8e5b2c],[0x9c9a94,0x6d6b66],[0xe8e2d4,0xb9b2a2],[0x5b4636,0x3a2c21]];
function drawCat(g,coat,facing,phase,walking){
  const [body,dark]=coat,dir=facing.x-facing.y>=0?1:-1,step=walking?Math.sin(phase*MOVEMENT_SPEED_SCALE)*1.5:0;g.clear();
  g.fillStyle(0x26271b,.28);g.fillEllipse(0,1,18,6);
  g.fillStyle(dark);g.fillRect(-5,-4,2,4+step);g.fillRect(3,-4,2,4-step);
  g.fillStyle(body);g.fillEllipse(0,-6,15,8);
  g.lineStyle(2,body);g.beginPath();g.moveTo(-6*dir,-7);g.lineTo(-10*dir,-12-Math.sin(phase*.5)*2);g.strokePath();
  g.fillCircle(7*dir,-10,4.2);g.fillStyle(dark);g.fillTriangle(5*dir,-13,6*dir,-17,8*dir,-13.5);g.fillTriangle(8*dir,-13.5,10*dir,-16.5,10.5*dir,-12.5);
  g.fillStyle(0xd9c25a);g.fillCircle(8.5*dir,-10.5,.9);
}
const DOG_COATS=[[0x7a5232,0x4b321f],[0xe4dccb,0x5a4a3a],[0x8d8f92,0x55575b]];
function drawDog(g,coat,facing,phase,walking,injured,sitting){
  const [body,dark]=coat,dir=facing.x-facing.y>=0?1:-1,step=walking?Math.sin(phase*1.6*MOVEMENT_SPEED_SCALE)*2:0;g.clear();
  g.fillStyle(0x26271b,.3);g.fillEllipse(0,1,24,8);
  if(injured){g.fillStyle(body);g.fillEllipse(0,-3,22,7);g.fillCircle(10*dir,-4,4.5);g.fillStyle(0xf2efe6);g.fillRect(-3,-6,6,3);return;}
  if(sitting){g.fillStyle(dark);g.fillRect(3*dir-1,-9,2.4,9);g.fillRect(6*dir-1,-9,2.4,9);g.fillStyle(body);g.fillEllipse(-3*dir,-4,13,8);g.fillEllipse(2*dir,-11,11,13);
    g.lineStyle(2.2,body);g.beginPath();g.moveTo(-9*dir,-2);g.lineTo(-13*dir,-1+Math.sin(phase*.7));g.strokePath();
    g.fillCircle(6*dir,-19,5);g.fillEllipse(10*dir,-18,6,3.5);g.fillStyle(dark);g.fillEllipse(4*dir,-19,3,6);g.fillStyle(0x1d1a17);g.fillCircle(12.5*dir,-18.5,1);return;}
  g.fillStyle(dark);for(const [x,s]of [[-7,step],[-4,-step],[5,step],[8,-step]])g.fillRect(x*dir-1,-6,2.4,6+s*.5);
  g.fillStyle(body);g.fillEllipse(0,-9,22,9);
  g.lineStyle(2.2,body);g.beginPath();g.moveTo(-10*dir,-10);g.lineTo(-14*dir,-15+Math.sin(phase)*2);g.strokePath();
  g.fillCircle(11*dir,-14,5);g.fillEllipse(15*dir,-13,6,3.5);g.fillStyle(dark);g.fillEllipse(9*dir,-14,3,6);g.fillStyle(0x1d1a17);g.fillCircle(17.5*dir,-13.5,1);
}
function drawRat(g,phase){g.clear();g.fillStyle(0x4a4038);g.fillEllipse(0,-1.5,7,3.6);g.fillCircle(3.4,-2,1.6);g.lineStyle(1,0x6b5a4c);g.beginPath();g.moveTo(-3.5,-1);g.lineTo(-7,-1+Math.sin(phase)*1.2);g.strokePath();}

export class DomesticViews {
  constructor(scene,system){this.scene=scene;this.system=system;this.rats=new Map();this.phase=0;}
  visible(position){return !this.scene.fog||this.scene.fog.isVisibleObject({position});}
  // m-zvirata-2 (38): a small, faint mark over strays (cats and dogs not yet taken in); it goes once they are.
  wildMark(v,wild){
    if(wild&&!v.wild){v.wild=this.scene.add.text(0,-30,'?',{fontFamily:'Georgia,serif',fontSize:'11px',color:'#f3ead2',stroke:'#2a2a1e',strokeThickness:2}).setOrigin(.5,1).setAlpha(.55);v.add(v.wild);}
    if(v.wild)v.wild.setVisible(!!wild);
  }
  // m-zvirata-2 (34): one rat's wandering round its store – to a random point within RAT_MOVES.radius tiles, a short
  // sniff, a quick dash, and now and then hiding (gone for a few seconds). Drawing only; nothing is saved.
  ratStep(rat,l,dt){
    const cx=l.x+(l.width??1)/2,cy=l.y+(l.height??1)/2,r=Math.random;
    if(rat.x==null){const a=r()*Math.PI*2,d=(l.width??1)/2+.4;rat.x=cx+Math.cos(a)*d;rat.y=cy+Math.sin(a)*d;rat.wait=r()*1.5;}
    if(rat.hidden>0){rat.hidden-=dt;if(rat.hidden<=0){rat.hidden=0;rat.target=null;}return false;}
    if(rat.wait>0){rat.wait-=dt;rat.moving=false;return true;}
    if(!rat.target){
      if(r()<RAT_MOVES.hideChance&&!rat.justHid){rat.target={x:cx+(r()-.5)*(l.width??1)*.6,y:cy+(r()-.5)*(l.height??1)*.6,hide:true};}
      else{const [lo,hi]=RAT_MOVES.radius,a=r()*Math.PI*2,d=lo+r()*(hi-lo);rat.target={x:cx+Math.cos(a)*d,y:cy+Math.sin(a)*d};}
      rat.justHid=false;rat.speed=RAT_MOVES.dash*(.6+r()*.8);
    }
    const dx=rat.target.x-rat.x,dy=rat.target.y-rat.y,dist=Math.hypot(dx,dy),step=rat.speed*MOVEMENT_SPEED_SCALE*dt;rat.facing={x:dx,y:dy};rat.moving=true;
    if(dist<=step){rat.x=rat.target.x;rat.y=rat.target.y;const hide=rat.target.hide;rat.target=null;rat.moving=false;
      if(hide){const [a,b]=RAT_MOVES.hideSeconds;rat.hidden=a+r()*(b-a);rat.justHid=true;return false;}
      const [a,b]=RAT_MOVES.sniff;rat.wait=a+r()*(b-a);return true;}
    rat.x+=dx/dist*step;rat.y+=dy/dist*step;return true;
  }
  // The approved look of a cat or dog view; true when the art is drawn (the figure is then hidden).
  art(v,species,id,{young=false,facing,moving,delta,pose=null}={}){
    const look=animalLook(species,id,{young});if(!look)return false;
    if(!v.art){v.art=this.scene.add.image(0,0,'__DEFAULT').setVisible(false);v.add(v.art);v.walked=0;}
    if(v.look!==look){v.look=look;ensureAnimalLook(this.scene,look);}
    v.facingName=directionName(facing)??v.facingName??'SE';if(moving)v.walked+=delta;
    const on=applyAnimalArt(this.scene,v.art,look,{facing:v.facingName,moving,walkedMs:v.walked,pose});v.figure.setVisible(!on);return on;
  }
  update(delta=16){
    this.phase+=delta*.012;const s=this.system;
    for(const cat of s.cats.values()){
      if(!cat.view){const v=new Phaser.GameObjects.Container(this.scene,0,0);this.scene.add.existing(v);v.figure=this.scene.add.graphics();v.add(v.figure);v.coat=COATS[Number(cat.id.slice(4))%COATS.length];cat.view=v;}
      const p=gridToWorld(cat.x,cat.y),v=cat.view,moving=!!cat.target&&Math.hypot(cat.x-cat.target.x,cat.y-cat.target.y)>.05;
      v.setPosition(p.x,p.y);v.setDepth(p.y+2);v.setVisible(this.visible({x:cat.x,y:cat.y}));
      this.wildMark(v,cat.state==='stray'&&v.visible);
      const young=cat.state==='kitten',drawn=v.visible&&this.art(v,'cat',cat.id,{young,facing:cat.facing,moving,delta});v.setScale(young&&!drawn?.7:1);
      if(v.visible&&!drawn)drawCat(v.figure,v.coat,cat.facing??{x:1,y:0},this.phase+Number(cat.id.slice(4)),moving);
    }
    for(const dog of s.dogs.values()){
      if(!dog.view){const v=new Phaser.GameObjects.Container(this.scene,0,0);this.scene.add.existing(v);v.figure=this.scene.add.graphics();v.add(v.figure);v.coat=DOG_COATS[Number(dog.id.slice(4))%DOG_COATS.length];dog.view=v;}
      const p=gridToWorld(dog.x,dog.y),v=dog.view,moving=!!dog.target&&Math.hypot(dog.x-dog.target.x,dog.y-dog.target.y)>.05;
      v.setPosition(p.x,p.y);v.setDepth(p.y+2);v.setVisible(this.visible({x:dog.x,y:dog.y}));
      this.wildMark(v,dog.state==='stray'&&v.visible);
      const injured=dog.injuredUntil!=null,sitting=!!dog.sitting&&!moving;
      const drawn=v.visible&&this.art(v,'dog',dog.id,{facing:dog.facing,moving:moving&&!injured,delta,pose:injured?'wounded':sitting?'sit':null});
      if(v.visible&&!drawn)drawDog(v.figure,v.coat,dog.facing??{x:1,y:0},this.phase+Number(dog.id.slice(4)),moving,injured,sitting);
    }
    // Rats: one group per store with food, sized by the level.
    const seen=new Set();
    for(const l of s.foodLocations()){
      const count=RATS.views[ratLevel(s.ratsAt(l.id))];if(!count)continue;seen.add(l.id);
      let group=this.rats.get(l.id);if(!group){group=[];this.rats.set(l.id,group);}
      while(group.length<count){const g=this.scene.add.graphics();g.art=this.scene.add.image(0,0,'__DEFAULT').setVisible(false);g.walked=0;group.push(g);}
      while(group.length>count){const g=group.pop();g.art.destroy();g.destroy();}
      group.forEach((g,i)=>{g.rat??={};const out=this.ratStep(g.rat,l,delta/1000),x=g.rat.x,y=g.rat.y,p=gridToWorld(x,y),angle=Math.atan2(g.rat.facing?.y??0,g.rat.facing?.x??1);
        g.setPosition(p.x,p.y);g.setDepth(p.y+1);g.setVisible(out&&this.visible({x,y}));
        // Rats wander round the store (ratStep), facing where they run, in one of the approved rat looks.
        const look=animalLook('rat',`${l.id}:${i}`);if(look)ensureAnimalLook(this.scene,look);if(g.rat.moving)g.walked+=delta;
        const drawn=g.visible&&!!look&&applyAnimalArt(this.scene,g.art,look,{facing:directionName(g.rat.facing??{x:1,y:0})??'SE',moving:!!g.rat.moving,walkedMs:g.walked});
        g.art.setPosition(p.x,p.y).setDepth(p.y+1);if(!g.visible)g.art.setVisible(false);
        if(drawn)g.clear();else if(g.visible){drawRat(g,this.phase*3+i);g.setScale(Math.cos(angle)>0?1:-1,1);}});
    }
    for(const [id,group]of this.rats)if(!seen.has(id)){for(const g of group){g.art?.destroy();g.destroy();}this.rats.delete(id);}
    for(const cat of [...this.knownCats??[]])if(!s.cats.has(cat.id)&&!s.dogs.has(cat.id))cat.view?.destroy();
    this.knownCats=[...s.cats.values(),...s.dogs.values()];
  }
  destroy(){for(const group of this.rats.values())for(const g of group){g.art?.destroy();g.destroy();}this.rats.clear();for(const cat of [...this.system.cats.values(),...this.system.dogs.values()]){cat.view?.destroy();cat.view=null;}}
}
