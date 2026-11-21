import { buildingIsComplete } from '../game/buildingState.js';
import { CASTLE_MAX_LEVEL } from './castle.js';

// m-uroven-kralovstvi (owner 21 Nov 2026): the kingdom's rank follows the level of its Castle: Settlement → Village →
// Small town → Town. The HUD shows the rank and how many of the conditions for the next rank are met; the Castle can
// be upgraded to the next level only when all of them are met. Buildings unlock by the Castle level (table below).
export const KINGDOM_RANKS=Object.freeze({1:'settlement',2:'village',3:'smallTown',4:'town'});

// The Castle level at which each building can be placed (owner's table, 21 Nov 2026). Buildings missing in the
// owner's table got a level that matches their neighbours (confirmed by the owner).
export const BUILDING_UNLOCK_LEVEL=Object.freeze({
  castle:1,house:1,hunting_lodge:1,fisherman_hut:1,granary:1,quarry:1,lumberjack_hut:1,material_yard:1,starter_stockpile:1,
  brazier:1,campfire:1,burnt_ruins:1,
  tower:2,village_green:2,swing_tree:2,haystack:2,well:2,farmhouse:2,wheat_field:2,orchard:2,mill:2,bakery:2,
  builder_workshop:2,iron_mine:2,smelter:2,marketplace:2,stables:2,
  wall:3,gate:3,barracks:3,wheelwright_workshop:3,pitch_kiln:3,warehouse:3,stone_pavement:3,stone_pavement_joint:3,torch_post:3,
  bowyer:4,swordsmith:4,armorer:4,armory:4,
  // not in the owner's table; confirmed by the owner 21 Nov 2026
  stakes:1,flax_field:2,fountain:3,moat:3,wall_gate:3,catapult_site:3,ram_site:3,weaver:3,tailor:3,
});
export const buildingUnlockLevel=id=>BUILDING_UNLOCK_LEVEL[id]??1;

// Conditions for reaching a level (the Castle upgrade to it). Levels 3 and 4: to be added by the owner later.
// `buildings`: complete buildings, without the Castle, paving, walls, field defences, lights and ruins.
export const RANK_REQUIREMENTS=Object.freeze({
  2:Object.freeze([
    Object.freeze({id:'granary',kind:'building',building:'granary'}),
    Object.freeze({id:'material_yard',kind:'building',building:'material_yard'}),
    Object.freeze({id:'happiness',kind:'happiness',min:70}),
    Object.freeze({id:'foodDays',kind:'foodDays',min:10}),
    Object.freeze({id:'buildings',kind:'buildings',min:8}),
    Object.freeze({id:'population',kind:'population',min:20}),
  ]),
  3:Object.freeze([Object.freeze({id:'population',kind:'population',min:50})]),
  4:Object.freeze([Object.freeze({id:'population',kind:'population',min:80})]),
});
// Owner 21 Nov 2026: the most residents the kingdom can have at each Castle level (null = no limit). The owner's
// cap is the one after the upgrade (2: 50, 3: 100, 4: none); level 1 holds the 20 the upgrade to 2 needs.
export const RANK_POPULATION_CAP=Object.freeze({1:20,2:50,3:100,4:null});
export const rankPopulationCap=level=>RANK_POPULATION_CAP[level]??null;
export const RANK_UNCOUNTED=new Set(['castle','stone_pavement','stone_pavement_joint','wall','stakes','moat','brazier','torch_post','campfire','burnt_ruins']);

const typeOf=b=>b.type??b.definition?.id;
// The kingdom's level: the highest standing (complete) Castle's level; without a Castle level 1.
export function kingdomLevel(buildings){
  let level=1;for(const b of buildings??[])if(typeOf(b)==='castle'&&buildingIsComplete(b))level=Math.max(level,Math.min(CASTLE_MAX_LEVEL,Math.max(1,b.level??1)));
  return level;
}
export const countedBuildings=buildings=>(buildings??[]).filter(b=>buildingIsComplete(b)&&!RANK_UNCOUNTED.has(typeOf(b))).length;

// What the kingdom has now for each condition of `level`. `stats`: {happiness (0–100 or null), foodDays}.
export function rankRequirements(level,buildings,stats={}){
  const list=RANK_REQUIREMENTS[level];if(!list)return [];
  const complete=new Set((buildings??[]).filter(buildingIsComplete).map(typeOf));
  return list.map(r=>{
    if(r.kind==='building')return {...r,ok:complete.has(r.building),current:complete.has(r.building)?1:0,target:1};
    if(r.kind==='happiness'){const v=stats.happiness;return {...r,ok:v!=null&&v>=r.min,current:v,target:r.min};}
    if(r.kind==='foodDays'){const v=stats.foodDays??0;return {...r,ok:v>=r.min,current:Number.isFinite(v)?Math.floor(v):v,target:r.min};}
    if(r.kind==='population'){const v=stats.population??0;return {...r,ok:v>=r.min,current:v,target:r.min};}
    if(r.kind==='buildings'){const v=countedBuildings(buildings);return {...r,ok:v>=r.min,current:v,target:r.min};}
    return {...r,ok:false};
  });
}
// The rank and the progress to the next one.
export function kingdomRank(buildings,stats={}){
  const level=kingdomLevel(buildings),next=level<CASTLE_MAX_LEVEL?level+1:null,items=next?rankRequirements(next,buildings,stats):[];
  return {level,rank:KINGDOM_RANKS[level],next,nextRank:next?KINGDOM_RANKS[next]:null,items,met:items.filter(i=>i.ok).length,total:items.length,ready:!!next&&items.every(i=>i.ok)};
}
