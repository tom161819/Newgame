import { t } from '../i18n/index.js';
import { MORALE,FLANK,STANCES } from '../data/military.js';
import { awayFrom } from '../game/combatSpacing.js';

// Owner 20 Nov 2026 ("zpracuj postupně všechny ty návrhy" – morale and flank attacks). Runtime only: morale is not
// saved (a loaded game starts every soldier at full morale).
export const isEnemySoldier=unit=>!!unit?.definition?.gameplay?.hostile&&!unit.definition.gameplay.nightPredator&&!unit.definition.gameplay.ram&&unit.type!=='wolf';
const dist=(a,b)=>Math.hypot(a.position.x-b.position.x,a.position.y-b.position.y);

// How much harder a blow lands from the side or behind: the target faces the one he fights (or the way he walks).
export function flankFactor(attacker,target,facing){
  if(!facing)return 1;const vx=attacker.position.x-target.position.x,vy=attacker.position.y-target.position.y,n=Math.hypot(vx,vy),m=Math.hypot(facing.x,facing.y);
  if(!n||!m)return 1;const cos=(vx*facing.x+vy*facing.y)/(n*m);return cos<=FLANK.rearCos?FLANK.rear:cos<=FLANK.sideCos?FLANK.side:1;
}
export function facingOf(unit,combat){
  const foe=combat?.attacks?.get(unit);if(foe?.isAlive&&foe.position)return {x:foe.position.x-unit.position.x,y:foe.position.y-unit.position.y};
  return (unit.nextTile||unit.path?.length)&&unit.direction?unit.direction:null;
}

export class MoraleSystem{
  constructor(scene){this.scene=scene;scene.combat?.on?.('death',unit=>this.onDeath(unit));}
  ours(){const s=this.scene;return (s.workerSystem?.liveWorkers?.()??[]).filter(w=>w.isAlive&&w.profession==='soldier'&&!w.away&&w.sleepingIn==null);}
  enemies(){return [...(this.scene.animalSystem?.animals?.values?.()??[])].filter(a=>a.isAlive&&a.active!==false&&isEnemySoldier(a));}
  isLeader(unit){const s=this.scene;if(unit===s.character)return true;if(isEnemySoldier(unit))return unit.type==='enemy_knight'||unit.definition?.id==='enemy_knight';return s.military?.unit?.(unit)?.type==='knight';}
  side(unit){return isEnemySoldier(unit)?'enemy':this.scene.workerSystem?.workers?.has?.(unit.id)&&unit.profession==='soldier'?'ours':null;}
  friends(unit){return this.side(unit)==='enemy'?this.enemies():this.ours();}
  foes(unit){return this.side(unit)==='enemy'?[...this.ours(),...(this.scene.character?.isAlive&&!this.scene.character.away?[this.scene.character]:[])]:this.enemies();}
  led(unit){const s=this.scene,list=this.side(unit)==='ours'&&s.character?.isAlive&&!s.character.away?[...this.ours(),s.character]:this.friends(unit);return list.some(f=>f!==unit&&this.isLeader(f)&&dist(f,unit)<=MORALE.leaderRadius);}
  factor(unit){return (this.led(unit)?MORALE.leaderFactor:1)*(STANCES[unit.stance]?.hold?MORALE.holdFactor:1);}
  morale(unit){return unit.morale??MORALE.max;}
  lose(unit,amount){if(!(amount>0))return;const before=this.morale(unit);unit.morale=Math.max(0,before-amount*this.factor(unit));if(!unit.routed&&unit.morale<MORALE.rout)this.rout(unit);}
  onDeath(unit){const side=this.side(unit);if(!side)return;for(const f of this.friends(unit))if(f!==unit&&dist(f,unit)<=MORALE.deathRadius)this.lose(f,MORALE.death);}
  rout(unit){
    unit.routed=true;const s=this.scene;s.combat?.stopAttack?.(unit);
    if(isEnemySoldier(unit)){if(unit.marching){unit.routedMarch=unit.marching;unit.marching=null;}s.animalSystem?.stopRetaliation?.(unit);unit.path=[];}
    this.say(unit,t('combat.routed'),'#ffd27a');
  }
  rally(unit){unit.routed=false;if(unit.routedMarch){unit.marching=unit.routedMarch;delete unit.routedMarch;}if(isEnemySoldier(unit))unit.path=[];this.say(unit,t('combat.rallied'),'#c9e6a0');}
  say(unit,text,color){const s=this.scene,v=unit.view;if(!s.add?.text||!v?.visible)return;const label=s.add.text(v.x,v.y-(unit.definition?.visual?.healthBarOffset??40)-22,text,{fontSize:'12px',fontStyle:'bold',color,stroke:'#1b140e',strokeThickness:3}).setOrigin(.5).setDepth((v.depth??0)+2);
    s.tweens?.add?.({targets:label,y:label.y-18,alpha:0,duration:1400,onComplete:()=>label.destroy()})??setTimeout(()=>label.destroy(),1400);}
  update(delta){
    const dt=Math.max(0,delta)/1000;if(!dt)return;const combat=this.scene.combat;
    const fighting=new Set();for(const [a,b] of combat?.attacks??[]){fighting.add(a);fighting.add(b);}
    for(const unit of [...this.ours(),...this.enemies()]){
      const foes=this.foes(unit),near=foes.filter(f=>dist(f,unit)<=MORALE.enemyRadius);
      if(near.length){
        let loss=0;if(fighting.has(unit)&&unit.currentHP<unit.maxHP*.5)loss+=MORALE.wounded;
        const crowd=near.filter(f=>dist(f,unit)<=MORALE.crowdRadius).length,friends=this.friends(unit).filter(f=>dist(f,unit)<=MORALE.crowdRadius).length;if(crowd>2*friends)loss+=MORALE.outnumbered;
        if(loss)this.lose(unit,loss*dt);else if(this.led(unit))unit.morale=Math.min(MORALE.max,this.morale(unit)+MORALE.steady*dt);
      }else if(this.morale(unit)<MORALE.max)unit.morale=Math.min(MORALE.max,this.morale(unit)+MORALE.calm*dt);
      if(unit.routed&&this.morale(unit)>=MORALE.rally)this.rally(unit);
    }
  }
  // An enemy who has lost heart runs from the nearest of ours; true while he does (AnimalSystem skips the rest).
  leadRouted(animal,delta){
    if(!animal.routed)return false;const s=this.scene;s.combat?.stopAttack?.(animal);
    const foe=this.foes(animal).filter(f=>dist(f,animal)<=MORALE.enemyRadius+4).sort((a,b)=>dist(a,animal)-dist(b,animal))[0];
    animal.fleeWait=(animal.fleeWait??0)-delta;
    if(foe&&!animal.nextTile&&!animal.path?.length&&animal.fleeWait<=0){animal.fleeWait=700;const to=awayFrom(s,animal.tile,foe.tile,6);if(to.length)animal.moveTo?.(to);}
    return true;
  }
}
