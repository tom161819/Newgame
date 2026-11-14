import { buildingDefinition,buildingIsComplete } from './buildings.js';

// m-budovy-hp (point 49, owner 14 Nov 2026): fortifications have hit points. Nothing attacks buildings yet (wolves do
// not), so today the number is shown in the building detail and can only go down through `damageBuilding` (the hook for
// enemies to come). A building at full health stores nothing; `hp` is saved only while it is damaged.
export const BUILDING_HP=Object.freeze({wall:200,wall_gate:300,gate:300,tower:400,castle:1500});
export const buildingMaxHP=building=>BUILDING_HP[building?.type]??null;
export const buildingHP=building=>{const max=buildingMaxHP(building);return max==null?null:{hp:Math.min(max,building.hp??max),max};};
// Takes hit points away; returns the new state, or null for a building without hit points. At zero `destroyed` is true
// and the caller removes the building (detachLostBuilding).
export function damageBuilding(building,amount){
  const state=buildingHP(building);if(!state||!buildingIsComplete(building)||!(amount>0))return state&&{...state,destroyed:false};
  const hp=Math.max(0,Math.round((state.hp-amount)*100)/100);if(hp>=state.max)delete building.hp;else building.hp=hp;return {hp,max:state.max,destroyed:hp<=0};
}
export function repairBuilding(building,amount){const state=buildingHP(building);if(!state)return null;const hp=Math.min(state.max,state.hp+Math.max(0,amount));if(hp>=state.max)delete building.hp;else building.hp=hp;return {hp,max:state.max};}
export const buildingHPLabel=building=>{const s=buildingHP(building);return s?{...s,name:buildingDefinition(building).name}:null;};
