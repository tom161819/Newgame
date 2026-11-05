import { configuredStats } from './GameSettings.js';
export const clampArmor=value=>Math.max(0,Math.min(90,Number.isFinite(value)?value:0));

export function createCombatStats(definition,settings){
  if(!definition.stats)throw new TypeError(`Chybí bojové statistiky: ${definition.id}`);
  const baseStats=Object.freeze({hpRegenPerSecond:0,...configuredStats(definition,settings)});
  return {baseStats,statModifiers:{},maxHP:baseStats.maxHP,currentHP:baseStats.maxHP,attackDPS:baseStats.attackDPS,
    armor:clampArmor(baseStats.armor),attackRange:baseStats.attackRange,hpRegenPerSecond:baseStats.hpRegenPerSecond,isAlive:true,attackTarget:null};
}
export function recalculateStats(unit){
  const total={maxHP:0,attackBonus:0,armor:0,hpRegenPerSecond:0,attackRange:0};
  let attackMultiplier=1;
  for(const modifier of Object.values(unit.statModifiers)){for(const key of Object.keys(total))total[key]+=modifier[key]??0;attackMultiplier*=modifier.attackMultiplier??1;}
  const base=unit.baseStats;
  unit.maxHP=Math.max(1,base.maxHP+total.maxHP);
  unit.attackDPS=Math.max(0,base.attackDPS*(1+total.attackBonus/100)*attackMultiplier);
  unit.armor=clampArmor(base.armor+total.armor);unit.attackRange=Math.max(0,base.attackRange+total.attackRange);
  unit.hpRegenPerSecond=Math.max(0,base.hpRegenPerSecond+total.hpRegenPerSecond);
  unit.currentHP=unit.isAlive?Math.min(unit.currentHP,unit.maxHP):0;
}
