import { castleRules } from '../data/castle.js';
import { buildingDefinition,buildingIsComplete } from './buildings.js';

// m-budovy-hp (point 49, owner 14 Nov 2026; 15 Nov: "životy budov ano teď"): buildings have hit points. Fortifications
// have fixed numbers; every other building 100 + 8 per unit of its price. Fire takes them (NightThreatSystem), Builders
// repair a damaged building for half the price of what is missing (RepairSystem). Enemies will use `damageBuilding`.
// A building at full health stores nothing; `hp` is saved only while it is damaged.
export const BUILDING_HP=Object.freeze({wall:200,wall_gate:300,gate:300,tower:400,castle:1500});
export const BUILDING_HP_RULES=Object.freeze({base:100,perCostUnit:8,repairShare:.5,minRepairWork:3000});
// Buildings without hit points: fields, paving, campfires, ruins and other things that are not a structure.
const noHP=d=>!d||d.category!=='building'||!!d.crop||!!d.pavement||!!d.campfire||d.id==='burnt_ruins'||(!d.buildable&&d.id!=='castle');
export function buildingMaxHP(building){
  if(!building)return null;if(building.type==='castle'&&building.level)return castleRules(building).hp;if(BUILDING_HP[building.type]!=null)return BUILDING_HP[building.type];
  const d=building.definition??buildingDefinition(building);if(noHP(d))return null;
  return BUILDING_HP_RULES.base+BUILDING_HP_RULES.perCostUnit*Object.values(d.cost??{}).reduce((a,b)=>a+b,0);
}
export const buildingHP=building=>{const max=buildingMaxHP(building);return max==null?null:{hp:Math.min(max,building.hp??max),max};};
// Takes hit points away; returns the new state, or null for a building without hit points. At zero `destroyed` is true
// and the caller removes the building (detachLostBuilding).
export function damageBuilding(building,amount){
  const state=buildingHP(building);if(!state||!buildingIsComplete(building)||!(amount>0))return state&&{...state,destroyed:false};
  const hp=Math.max(0,Math.round((state.hp-amount)*100)/100);if(hp>=state.max)delete building.hp;else building.hp=hp;return {hp,max:state.max,destroyed:hp<=0};
}
export function repairBuilding(building,amount){const state=buildingHP(building);if(!state)return null;const hp=Math.min(state.max,state.hp+Math.max(0,amount));if(hp>=state.max)delete building.hp;else building.hp=hp;return {hp,max:state.max};}
export const buildingHPLabel=building=>{const s=buildingHP(building);return s?{...s,name:buildingDefinition(building).name}:null;};

// Repair: half the price of the missing share (rounded up, at least 1 of the main material), work time the same share of
// the building's construction time (at least 3 s).
export function repairPlan(building){
  const state=buildingHP(building);if(!state||state.hp>=state.max)return null;const d=building.definition??buildingDefinition(building),missing=1-state.hp/state.max;
  const cost={};for(const [id,n]of Object.entries(d.cost??{})){const k=Math.ceil(n*missing*BUILDING_HP_RULES.repairShare);if(k>0)cost[id]=k;}
  if(building.type==='castle'&&building.level){const c=castleRules(building).cost??{};for(const [id,n]of Object.entries(c)){cost[id]=Math.max(cost[id]??0,Math.ceil(n*missing*BUILDING_HP_RULES.repairShare));}}
  return {cost,missing,work:Math.max(BUILDING_HP_RULES.minRepairWork,Math.round((d.constructionTime??20000)*missing)),startHp:state.hp,max:state.max};
}
