import { FARMING_RULES } from './farming.js';
export const EXPERIENCE_MAX_LEVEL=50;
export const XP_REWARDS=Object.freeze({
  resourceCollected:Object.freeze({stone:3}),dropCollected:Object.freeze({meat:2}),
  animalKilled:Object.freeze({rabbit:10,deer:20,wild_boar:35}),
  buildingCompleted:Object.freeze({wall:2,tower:15,castle:30,house:10,quarry:15,hunting_lodge:10,barracks:20,farmhouse:10,wheat_field:5,orchard:8}),
  cropHarvested:Object.freeze(Object.fromEntries(Object.entries(FARMING_RULES.crops).map(([id,crop])=>[id,crop.xp]))),
});
export function getXPRequired(level){
  if(!Number.isInteger(level)||level<1||level>EXPERIENCE_MAX_LEVEL)throw new RangeError('Neplatný level.');
  const n=level-1;return 100+35*n+4*n*n;
}
export function totalXPForLevel(level){let total=0;for(let i=1;i<level;i++)total+=getXPRequired(i);return total;}
export function createProgress({initialLevel=1,maxLevel=50,enabled=true,gainMultiplier=1}={}){
  return {level:initialLevel,currentXP:0,totalXP:totalXPForLevel(initialLevel),xpToNextLevel:initialLevel<maxLevel?getXPRequired(initialLevel):0,
    maxLevel,enabled,gainMultiplier,modifiers:{}};
}
export function checkProgressLevelUp(e,onLevel=()=>{}){
  while(e.level<e.maxLevel&&e.currentXP>=getXPRequired(e.level)-1e-8){
    e.currentXP=Math.max(0,e.currentXP-getXPRequired(e.level));e.level++;e.xpToNextLevel=e.level<e.maxLevel?getXPRequired(e.level):0;
    if(e.level===e.maxLevel)e.currentXP=0;e.totalXP=totalXPForLevel(e.level)+e.currentXP;onLevel(e.level);
  }
}
export function addProgressXP(e,amount,onLevel=()=>{}){
  if(!e?.enabled||!Number.isFinite(amount)||amount<=0||e.level>=e.maxLevel)return 0;
  const multiplier=e.gainMultiplier*Object.values(e.modifiers).reduce((factor,value)=>factor*value,1);
  const accepted=Math.min(amount*multiplier,totalXPForLevel(e.maxLevel)-e.totalXP);if(accepted<=0||!Number.isFinite(accepted))return 0;
  const old=e.totalXP;e.currentXP+=accepted;e.totalXP+=accepted;checkProgressLevelUp(e,onLevel);return e.totalXP-old;
}
export function createExperience(definition){
  if(definition.category!=='character')return null;
  return createProgress(definition.experience);
}
