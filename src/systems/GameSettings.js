export const DEFAULT_GAME_SETTINGS=Object.freeze({difficulty:'normal',wildlifePopulation:'normal',treasureCount:1,initialStoneCount:30});
export const DIFFICULTIES=Object.freeze({
  easy:{kingHP:1.5,kingDPS:1.25,animalHP:.75,animalDPS:.75},
  normal:{kingHP:1,kingDPS:1,animalHP:1,animalDPS:1},
  hard:{kingHP:.8,kingDPS:.85,animalHP:1.3,animalDPS:1.3},
});
export const WILDLIFE_COUNTS=Object.freeze({rare:1,normal:3,abundant:8});
export function gameSettings(input=DEFAULT_GAME_SETTINGS){
  const s={...DEFAULT_GAME_SETTINGS,...input};
  if(!Object.hasOwn(DIFFICULTIES,s.difficulty)||!Object.hasOwn(WILDLIFE_COUNTS,s.wildlifePopulation)
    ||!Number.isInteger(s.treasureCount)||s.treasureCount<0||s.treasureCount>10
    ||!Number.isInteger(s.initialStoneCount)||s.initialStoneCount<0||s.initialStoneCount>100||s.initialStoneCount%5!==0)throw new Error('Neplatné nastavení nové hry.');
  return Object.freeze(Object.fromEntries(Object.keys(DEFAULT_GAME_SETTINGS).map(k=>[k,s[k]])));
}
export function configuredStats(definition,settings){
  const stats={...definition.stats},d=DIFFICULTIES[settings?.difficulty??'normal'];
  if(definition.id==='king'){stats.maxHP*=d.kingHP;stats.attackDPS*=d.kingDPS;}
  else if(definition.gameplay?.huntable){stats.maxHP*=d.animalHP;stats.attackDPS*=d.animalDPS;}
  return stats;
}
export const animalInitialCount=(definition,settings)=>definition.gameplay.huntable?WILDLIFE_COUNTS[settings?.wildlifePopulation??'normal']:definition.gameplay.initialCount;
export const resourceSpawnSettings=(definition,settings)=>definition.id==='stone'?{...definition.spawn,initial:settings?.initialStoneCount??definition.spawn.initial,max:Math.max(definition.spawn.max,settings?.initialStoneCount??0)}:definition.spawn;
