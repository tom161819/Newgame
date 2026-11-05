import { FOOD_RESOURCE_IDS } from './foodProduction.js';
export const LOGISTICS_RULES=Object.freeze({starterCapacity:40,warehouseCapacity:200,baseCarry:20,planningInterval:500});
// Idle Haulers pick up loose stones within a radius (tiles) of the Castle.
export const IDLE_STONE=Object.freeze({defaultRadius:80,maxRadius:150,pickupDuration:1000,candidates:40});
export const defaultStoneCollection=()=>({enabled:true,radius:IDLE_STONE.defaultRadius});
export const materialResources=registry=>registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&!FOOD_RESOURCE_IDS.includes(d.id)).map(d=>d.id);
export const physicalResources=registry=>registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold').map(d=>d.id);
export function storageResources(definition,registry){return definition.storage.accepts==='materials'?materialResources(registry):definition.storage.accepts==='all'?physicalResources(registry):[...definition.storage.resources];}
export function carryCapacity(actor){return actor.profession==='hauler'?20+Math.floor(((actor.skills?.logistics?.level??1)-1)/5)*2:20;}
export const stockLocationId=building=>`${building.type==='starter_stockpile'?'stockpile':building.type==='warehouse'?'warehouse':'granary'}-${building.id}`;
