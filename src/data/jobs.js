import { localizeJobs,localizeSkills } from '../i18n/names.js';
export const SKILLS=Object.freeze(localizeSkills({woodcutting:'Woodcutting',mining:'Mining',hunting:'Hunting',construction:'Construction',farming:'Farming',combat:'Combat',milling:'Milling',baking:'Baking',logistics:'Logistics',smelting:'Smelting',crafting:'Crafting',fishing:'Fishing'}));
export const SKILL_IDS=Object.freeze(Object.keys(SKILLS));
export const WORK_RULES=Object.freeze({efficiencyPerLevel:.01,miningDuration:1500,searchInterval:500,workRadius:24,
  fleeRatio:.3,recoverRatio:.8,combatXPPerDamage:1,combatXPPerTarget:40});
// m-start-v2 (owner 7 Nov 2026): the Castle settlement holds 10 people (was 20); Houses add their capacity.
export const POPULATION=Object.freeze({initial:3,maximum:10,houseCapacity:5,migrantsPerDay:1,wanderRadius:5,recentDeathDays:3});
export const JOBS=Object.freeze(localizeJobs({
  idle:Object.freeze({portraitColor:'#62655d',name:'Unemployed',skill:null}),
  woodcutter:Object.freeze({portraitColor:'#365e42',name:'Woodcutter',skill:'woodcutting',workplace:'lumberjack_hut',requiresWorkplace:true}),
  miner:Object.freeze({portraitColor:'#4b6980',name:'Miner',skill:'mining',workplace:'quarry',requiresWorkplace:false}),
  hunter:Object.freeze({portraitColor:'#304d3b',name:'Hunter',skill:'hunting',workplace:'hunting_lodge',requiresWorkplace:false}),
  fisher:Object.freeze({portraitColor:'#3f7a8c',name:'Fisher',skill:'fishing',workplace:'fisherman_hut',requiresWorkplace:true}),
  builder:Object.freeze({portraitColor:'#8b603e',name:'Builder',skill:'construction',workplace:null,requiresWorkplace:false}),
  farmer:Object.freeze({portraitColor:'#7d7835',name:'Farmer',skill:'farming',workplace:'farmhouse',requiresWorkplace:true}),
  miller:Object.freeze({portraitColor:'#9d8058',name:'Miller',skill:'milling',workplace:'mill',requiresWorkplace:true}),
  baker:Object.freeze({portraitColor:'#ab6d43',name:'Baker',skill:'baking',workplace:'bakery',requiresWorkplace:true}),
  smelter_operator:Object.freeze({portraitColor:'#a25428',name:'Smelter Operator',skill:'smelting',workplace:'smelter',requiresWorkplace:true}),
  hauler:Object.freeze({portraitColor:'#69517b',name:'Hauler',skill:'logistics',workplace:null,requiresWorkplace:false}),
  soldier:Object.freeze({portraitColor:'#863f3c',name:'Soldier',skill:'combat',workplace:'barracks',requiresWorkplace:false}),
  bowyer:Object.freeze({portraitColor:'#6d5a32',name:'Bowyer',skill:'crafting',workplace:'bowyer',requiresWorkplace:true}),
  stablehand:Object.freeze({portraitColor:'#7b6a3a',name:'Stablehand',skill:'hunting',workplace:'stables',requiresWorkplace:true}),
  wheelwright:Object.freeze({portraitColor:'#8a5a2b',name:'Wheelwright',skill:'crafting',workplace:'wheelwright_workshop',requiresWorkplace:true}),
  swordsmith:Object.freeze({portraitColor:'#5d6470',name:'Swordsmith',skill:'crafting',workplace:'swordsmith',requiresWorkplace:true}),
  armorer:Object.freeze({portraitColor:'#58606b',name:'Armorer',skill:'crafting',workplace:'armorer',requiresWorkplace:true}),
  pitch_maker:Object.freeze({portraitColor:'#4a3a2a',name:'Pitch Maker',skill:'crafting',workplace:'pitch_kiln',requiresWorkplace:true}),
}));
