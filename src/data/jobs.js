export const SKILLS=Object.freeze({woodcutting:'Woodcutting',mining:'Mining',hunting:'Hunting',construction:'Construction',farming:'Farming',combat:'Combat',milling:'Milling',baking:'Baking',logistics:'Logistics'});
export const SKILL_IDS=Object.freeze(Object.keys(SKILLS));
export const WORK_RULES=Object.freeze({efficiencyPerLevel:.01,miningDuration:1500,searchInterval:500,workRadius:24,
  fleeRatio:.3,recoverRatio:.8,combatXPPerDamage:1,combatXPPerTarget:40});
export const POPULATION=Object.freeze({initial:3,maximum:20,migrantsPerDay:1,wanderRadius:5,recentDeathDays:3});
export const JOBS=Object.freeze({
  idle:Object.freeze({portraitColor:'#62655d',name:'Unemployed',skill:null}),
  woodcutter:Object.freeze({portraitColor:'#365e42',name:'Woodcutter',skill:'woodcutting',workplace:'lumberjack_hut',requiresWorkplace:true}),
  miner:Object.freeze({portraitColor:'#4b6980',name:'Miner',skill:'mining',workplace:'quarry',requiresWorkplace:false}),
  hunter:Object.freeze({portraitColor:'#304d3b',name:'Hunter',skill:'hunting',workplace:'hunting_lodge',requiresWorkplace:false}),
  builder:Object.freeze({portraitColor:'#8b603e',name:'Builder',skill:'construction',workplace:null,requiresWorkplace:false}),
  farmer:Object.freeze({portraitColor:'#7d7835',name:'Farmer',skill:'farming',workplace:'farmhouse',requiresWorkplace:true}),
  miller:Object.freeze({portraitColor:'#9d8058',name:'Miller',skill:'milling',workplace:'mill',requiresWorkplace:true}),
  baker:Object.freeze({portraitColor:'#ab6d43',name:'Baker',skill:'baking',workplace:'bakery',requiresWorkplace:true}),
  hauler:Object.freeze({portraitColor:'#69517b',name:'Hauler',skill:'logistics',workplace:'warehouse',requiresWorkplace:true}),
  soldier:Object.freeze({portraitColor:'#863f3c',name:'Soldier',skill:'combat',workplace:'barracks',requiresWorkplace:false}),
});
