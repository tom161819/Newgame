export const EXPERIENCE_MAX_LEVEL=50;
export const XP_REWARDS=Object.freeze({
  resourceCollected:Object.freeze({stone:3}),dropCollected:Object.freeze({meat:2}),
  animalKilled:Object.freeze({rabbit:10,deer:20,wild_boar:35}),
  buildingCompleted:Object.freeze({wall:2,tower:15,castle:30,house:10}),
});
export function getXPRequired(level){
  if(!Number.isInteger(level)||level<1||level>EXPERIENCE_MAX_LEVEL)throw new RangeError('Neplatný level.');
  const n=level-1;return 100+35*n+4*n*n;
}
export function totalXPForLevel(level){let total=0;for(let i=1;i<level;i++)total+=getXPRequired(i);return total;}
export function createExperience(definition){
  if(definition.category!=='character')return null;
  const config=definition.experience??{},maxLevel=config.maxLevel??EXPERIENCE_MAX_LEVEL,level=config.initialLevel??1;
  return {level,currentXP:0,totalXP:totalXPForLevel(level),xpToNextLevel:level<maxLevel?getXPRequired(level):0,maxLevel,
    enabled:config.enabled!==false,gainMultiplier:config.gainMultiplier??1,modifiers:{}};
}
