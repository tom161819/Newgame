import { FOOD_RESOURCE_IDS } from './foodProduction.js';
export const LOGISTICS_RULES=Object.freeze({starterCapacity:300,legacyStarterCapacity:40,warehouseCapacity:200,loadUnits:40,planningInterval:500});
// Idle Haulers pick up loose stones within a radius (tiles) of reachable Castles, material storage or active sites.
export const IDLE_STONE=Object.freeze({defaultRadius:80,maxRadius:150,pickupDuration:1000,candidates:40});
export const defaultStoneCollection=()=>({enabled:true,radius:IDLE_STONE.defaultRadius});
// Weapons and armour are stored goods kept apart from building materials: only an Armory takes them.
export const equipmentResources=registry=>registry.byCategory('resource').filter(d=>d.resourceCategory==='equipment').map(d=>d.id);
export const materialResources=registry=>registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&!FOOD_RESOURCE_IDS.includes(d.id)&&d.resourceCategory!=='equipment'&&d.resourceCategory!=='vehicle').map(d=>d.id);
// Vehicles (S12) are real objects on the map, never stored or carried goods.
export const physicalResources=registry=>registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&d.resourceCategory!=='vehicle').map(d=>d.id);
export function storageResources(definition,registry){return definition.storage.accepts==='materials'?materialResources(registry):definition.storage.accepts==='all'?physicalResources(registry).filter(id=>registry.get(id)?.resourceCategory!=='equipment'):definition.storage.accepts==='equipment'?equipmentResources(registry):[...definition.storage.resources];}
// S12: carrying by weight. Every physical resource has a load weight (game units, not kilograms); a person carries
// 40 load units by hand (the developer's balance choice over the spec's 10: 4 Stone, 8 Wood or 40 food), a Hauler
// 2 more for every 5 Logistics levels. Gold is never carried.
export const RESOURCE_WEIGHTS=Object.freeze({pitch:2,torch:1,stone:10,iron:5,iron_ore:10,wood:5,armor:8,sword:4,bow:3,meat:1,wheat:1,apple:1,flour:1,bread:1,fish:1});
export const loadWeight=resource=>RESOURCE_WEIGHTS[resource]??1;
// S12: a vehicle multiplies the load; one transport mode at a time, never combined.
export const VEHICLES=Object.freeze({wheelbarrow:Object.freeze({multiplier:5,speed:.9}),horse_wagon:Object.freeze({multiplier:10,speed:1.1,requiresHorse:true})});
export const TRANSPORT_MODES=Object.freeze(['auto','hands','wheelbarrow','horse_wagon']);
// The largest load one trip can ever hold (best Hauler on a Horse Wagon), for Save validation.
export const MAX_TRIP_UNITS=(LOGISTICS_RULES.loadUnits+20)*Math.max(...Object.values(VEHICLES).map(v=>v.multiplier));
export function loadCapacity(actor){return (LOGISTICS_RULES.loadUnits+(actor.profession==='hauler'?Math.floor(((actor.skills?.logistics?.level??1)-1)/5)*2:0))*(VEHICLES[actor.vehicleType]?.multiplier??1);}
// How many pieces of one resource fit in one trip (at least one, so heavy goods still move); without a resource, load units.
export function carryCapacity(actor,resource=null){const units=loadCapacity(actor);return resource?Math.max(1,Math.floor(units/loadWeight(resource))):units;}
export const stockLocationId=building=>`${building.type==='starter_stockpile'?'stockpile':building.type==='warehouse'?'warehouse':building.type==='armory'?'armory':'granary'}-${building.id}`;
