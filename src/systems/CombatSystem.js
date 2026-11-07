import { isWalkable } from '../game/map.js';
import { clampArmor } from './UnitStats.js';
import { hasLineOfSight } from '../game/lineOfSight.js';
export { clampArmor,createCombatStats } from './UnitStats.js';

export function inAttackRange(attacker,target,map=null) {
  const dx=Math.abs(attacker.position.x-target.position.x),dy=Math.abs(attacker.position.y-target.position.y);
  if(Math.max(dx,dy)>attacker.attackRange+1e-8)return false;
  const a={x:Math.floor(attacker.position.x),y:Math.floor(attacker.position.y)},b={x:Math.floor(target.position.x),y:Math.floor(target.position.y)};
  if(map&&attacker.attackRange<=1&&a.x!==b.x&&a.y!==b.y){
    return isWalkable(map,a.x,b.y)&&isWalkable(map,b.x,a.y);
  }
  // Ranged attacks need a clear line between the two tiles.
  return attacker.attackRange<=1||!map||hasLineOfSight(map,a,b);
}

// Integruje DPS po časových úsecích až k nejbližší smrti. Odvetný útok tak
// nekončí o celý snímek dříve nebo později podle FPS či pořadí jednotek.
export class CombatSystem {
  constructor({map=null,canFight=()=>true,regenerationRate=()=>0,canTarget=()=>true}={}) {
    this.map=map;this.canFight=canFight;this.canTarget=canTarget;this.regenerationRate=regenerationRate;this.attacks=new Map();this.listeners=new Map();this.dead=new WeakSet();
  }
  on(event,listener){if(!this.listeners.has(event))this.listeners.set(event,new Set());this.listeners.get(event).add(listener);return()=>this.listeners.get(event)?.delete(listener);}
  emit(event,...args){for(const listener of this.listeners.get(event)??[])listener(...args);}
  startAttack(attacker,target){
    if(attacker===target||!attacker.isAlive||!target.isAlive||attacker.attackDPS<=0||!this.canFight(attacker)||!this.canFight(target))return false;
    if(this.attacks.get(attacker)===target)return true;
    this.attacks.set(attacker,target);attacker.attackTarget=target;this.emit('attack',attacker,target);return true;
  }
  stopAttack(attacker){const existed=this.attacks.delete(attacker);attacker.attackTarget=null;if(existed)this.emit('attackStopped',attacker);}
  applyDamage(target,amount,attacker=null){return this.applyEffectiveDamage(target,amount*(1-clampArmor(target.armor)/100),false,attacker);}
  applyEffectiveDamage(target,amount,deferDeath=false,attacker=null){
    if(!target.isAlive||!Number.isFinite(amount)||amount<=0)return 0;
    const applied=Math.min(target.currentHP,amount);target.currentHP=Math.max(0,target.currentHP-applied);
    this.emit('damage',target,applied,attacker);
    if(target.currentHP<=1e-9&&!deferDeath)this.handleDeath(target,attacker);
    return applied;
  }
  handleDeath(unit,killer=null){
    if(this.dead.has(unit))return;
    this.dead.add(unit);unit.currentHP=0;unit.isAlive=false;this.stopAttack(unit);
    for(const [attacker,target]of this.attacks)if(target===unit)this.stopAttack(attacker);
    this.emit('death',unit,killer);
  }
  update(delta){
    const covered=new Map();
    let remaining=Number.isFinite(delta)?Math.max(0,delta)/1000:0;
    while(remaining>1e-9){
      const rates=new Map(),contributors=new Map();
      for(const [attacker,target]of this.attacks){
        if(!attacker.isAlive||!target.isAlive){this.stopAttack(attacker);continue;}
        if(!this.canFight(attacker)||!this.canFight(target)||!inAttackRange(attacker,target,this.map)||!this.canTarget(attacker,target))continue;
        const rate=Math.max(0,attacker.attackDPS)*(attacker.damageFactor??1)*(1-clampArmor(target.armor)/100);
        // Domestic animals Z2: a hunting dog close to its Hunter takes the bites meant for him.
        const shield=rate>0?this.shield?.(target,attacker):null;if(shield){shield.absorb(rate*remaining);continue;}
        if(rate>0){rates.set(target,(rates.get(target)??0)+rate);if(!contributors.has(target))contributors.set(target,[]);contributors.get(target).push({attacker,rate});}
      }
      if(!rates.size)break;
      let step=remaining;
      for(const [target,rate]of rates){const net=rate-this.regenerationRate(target);if(net>0)step=Math.min(step,target.currentHP/net);}
      for(const [target,rate]of rates){
        const regeneration=this.regenerationRate(target)*step;
        target.currentHP=Math.max(0,Math.min(target.maxHP,target.currentHP+regeneration-rate*step));
        covered.set(target,(covered.get(target)??0)+step*1000);
        for(const contribution of contributors.get(target))this.emit('damage',target,contribution.rate*step,contribution.attacker);
      }
      for(const target of rates.keys())if(target.currentHP<=1e-9){
        // Dokončující útok: nejvyšší příspěvek v rozhodujícím okamžiku,
        // shoda je deterministická podle ID a nezávisí na pořadí Map/FPS.
        const killer=contributors.get(target).sort((a,b)=>b.rate-a.rate||String(a.attacker.id).localeCompare(String(b.attacker.id)))[0].attacker;
        this.handleDeath(target,killer);
      }
      remaining-=step;
      if(step<=1e-12)break;
    }
    return covered;
  }
  clear(){for(const attacker of this.attacks.keys())attacker.attackTarget=null;this.attacks.clear();this.listeners.clear();}
}
