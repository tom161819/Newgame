export const SKILLS=Object.freeze({woodcutting:'Woodcutting',mining:'Mining',hunting:'Hunting',construction:'Construction',farming:'Farming',combat:'Combat',milling:'Milling',baking:'Baking'});
export const SKILL_IDS=Object.freeze(Object.keys(SKILLS));
export const WORK_RULES=Object.freeze({efficiencyPerLevel:.01,miningDuration:1500,searchInterval:500,workRadius:24,
  fleeRatio:.3,recoverRatio:.8,combatXPPerDamage:1,combatXPPerTarget:40});
export const POPULATION=Object.freeze({initial:3,maximum:20,migrantsPerDay:1,wanderRadius:5});
export const JOBS=Object.freeze({
  idle:Object.freeze({name:'Unemployed',skill:null}),
  woodcutter:Object.freeze({name:'Woodcutter',skill:'woodcutting',workplace:'lumberjack_hut',requiresWorkplace:true}),
  miner:Object.freeze({name:'Miner',skill:'mining',workplace:'quarry',requiresWorkplace:false}),
  hunter:Object.freeze({name:'Hunter',skill:'hunting',workplace:'hunting_lodge',requiresWorkplace:false}),
  builder:Object.freeze({name:'Builder',skill:'construction',workplace:null,requiresWorkplace:false}),
  farmer:Object.freeze({name:'Farmer',skill:'farming',workplace:'farmhouse',requiresWorkplace:true}),
  miller:Object.freeze({name:'Miller',skill:'milling',workplace:'mill',requiresWorkplace:true}),
  baker:Object.freeze({name:'Baker',skill:'baking',workplace:'bakery',requiresWorkplace:true}),
  soldier:Object.freeze({name:'Soldier',skill:'combat',workplace:'barracks',requiresWorkplace:false}),
});
