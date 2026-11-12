import { FOOD_RESOURCE_IDS } from './foodProduction.js';
export const LOGISTICS_RULES=Object.freeze({starterCapacity:300,legacyStarterCapacity:40,warehouseCapacity:200,yardCapacity:400,outputPileCapacity:20,loadUnits:40,planningInterval:500});
// m-sklady-materialu-koncept (21, 49): one open Material Yard holds the raw building materials; a Warehouse no longer
// takes them. Producers (Quarry, Iron Mine, Lumberjack Hut) drop output on a small pile by their building for Haulers.
export const YARD_RESOURCES=Object.freeze(['wood','stone','iron_ore','iron']);
// Visible pile size 0 (empty) to 4 (full) for an amount against the amount that fills one pile.
export const PILE_STAGES=4;
// m-sklady-materialu-koncept (49): producers whose workers drop output on a pile by the building (Haulers take it away).
export const OUTPUT_PILES=Object.freeze({quarry:'stone',iron_mine:'iron_ore',lumberjack_hut:'wood'});
export const outputPile=definition=>OUTPUT_PILES[definition?.id]?{resource:OUTPUT_PILES[definition.id],capacity:LOGISTICS_RULES.outputPileCapacity}:null;
export const pileLocationId=building=>`pile-${building.id}`;
export const pileStage=(amount,full)=>amount>0&&full>0?Math.min(PILE_STAGES,Math.ceil(amount/full*PILE_STAGES)):0;
// Idle Haulers pick up loose stones within a radius (tiles) of reachable Castles, material storage or active sites.
export const IDLE_STONE=Object.freeze({defaultRadius:80,maxRadius:150,pickupDuration:1000,candidates:40});
export const defaultStoneCollection=()=>({enabled:true,radius:IDLE_STONE.defaultRadius});
// Weapons and armour are stored goods kept apart from building materials: only an Armory takes them.
export const equipmentResources=registry=>registry.byCategory('resource').filter(d=>d.resourceCategory==='equipment').map(d=>d.id);
export const materialResources=registry=>registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&!FOOD_RESOURCE_IDS.includes(d.id)&&d.resourceCategory!=='equipment'&&d.resourceCategory!=='vehicle').map(d=>d.id);
// Vehicles (S12) are real objects on the map, never stored or carried goods.
export const physicalResources=registry=>registry.byCategory('resource').filter(d=>d.collectible&&d.id!=='gold'&&d.resourceCategory!=='vehicle').map(d=>d.id);
export function storageResources(definition,registry){return definition.storage.accepts==='materials'?materialResources(registry).filter(id=>!YARD_RESOURCES.includes(id)):definition.storage.accepts==='all'?physicalResources(registry).filter(id=>registry.get(id)?.resourceCategory!=='equipment'):definition.storage.accepts==='equipment'?equipmentResources(registry):[...definition.storage.resources];}
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
export const stockLocationId=building=>`${building.type==='starter_stockpile'?'stockpile':building.type==='warehouse'?'warehouse':building.type==='material_yard'?'yard':building.type==='armory'?'armory':building.type==='farmhouse'?'farmhouse':'granary'}-${building.id}`;

// m-nosic-priorita (owner, 12 Nov): what a Hauler carries first. 'any' is the shared order of the catalog (the default);
// the others put matching tasks first (nearest first) and fall back to anything else so the Hauler never stands idle.
// Food for the hungry (catalog priority HAUL_URGENT or less) always comes first.
export const HAUL_PRIORITIES=Object.freeze(['any','build','food','inputs','outputs','resource']);
export const HAUL_URGENT=10;
export const BUILD_MATERIALS=Object.freeze(['stone','wood','iron','iron_ore']);
export const HAULABLE_RESOURCES=Object.freeze(Object.keys(RESOURCE_WEIGHTS));
const FOOD_IDS=new Set(['meat','wheat','flour','bread','apple','fish']);
export function validHaulPriority(p){return !!p&&typeof p==='object'&&HAUL_PRIORITIES.includes(p.kind)&&(p.kind==='resource'?HAULABLE_RESOURCES.includes(p.resource):p.resource===undefined)&&Object.keys(p).length===(p.kind==='resource'?2:1);}
// Does a catalog task match a Hauler's choice?
export function matchesHaulPriority(task,priority){
  const kind=priority?.kind??'any';if(kind==='any')return false;
  const r=task.resource,dest=String(task.destinationId??''),src=String(task.sourceId??'');
  if(kind==='resource')return r===priority.resource;
  if(kind==='build')return task.siteId!=null||BUILD_MATERIALS.includes(r);
  if(kind==='food')return FOOD_IDS.has(r);
  if(kind==='inputs')return dest.startsWith('input-');
  if(kind==='outputs')return src.startsWith('output-')||src.startsWith('pile-')||task.pile===true;
  return false;
}
