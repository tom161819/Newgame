import { placeBuilding,buildingDefinition } from './buildings.js';
import { replaceWalls } from './wallReplacement.js';
import { markEnemyBuilding } from '../systems/SiegeSystem.js';

// Owner 20 Nov 2026 (86a): a scenario template made on the Test map – the world (its code, land and size), the buildings
// and units of both sides put there, the goal and where our army starts. It is a description, not a saved game, so it
// lasts across game versions. Templates are kept in this browser, exported and imported as files; ones the owner
// approves can later ship with the game. Conquest / Defence (86b, 86c) and foreign kingdoms (86d) start from them.
export const SCENARIO_SCHEMA='mk-scenario';
export const SCENARIO_VERSION=1;
export const SCENARIO_KEY='newgame.scenarios';
export const SCENARIO_GOALS=Object.freeze(['king','castle','army','hold']);
export const SCENARIO_LIMITS=Object.freeze({name:60,description:400,buildings:2000,units:1500,holdDays:[1,30]});
const BUILDING_FIELDS=Object.freeze(['gateAxis','facing','level','look']);
// Only what was put down on the Test map: the world's own animals (and wolves) come again with the same world.
const ourUnit=w=>w.isAlive&&!w.away&&w.profession==='soldier'&&w.sandbox;
const foe=a=>a.isAlive&&(a.type==='wolf'||!!a.definition?.gameplay?.hostile);

// The template of what stands on the Test map now. Buildings the map started with (the Castle, the first store) are
// left out: the same world makes them again.
export function captureScenario(scene,{name,description='',goal='king',holdDays=3}={}){
  const s=scene,start=s.sandboxStartIds??new Set(),units=[];
  const buildings=s.buildings.filter(b=>!start.has(b.id)&&!b.construction).map(b=>{const out={type:b.type,x:b.x,y:b.y,side:b.enemy?'enemy':'ours'};for(const k of BUILDING_FIELDS)if(b[k]!=null)out[k]=b[k];return out;});
  for(const w of s.workerSystem.liveWorkers().filter(ourUnit)){const type=s.military.unit(w)?.type;if(type)units.push({side:'ours',unit:type,x:w.tile.x,y:w.tile.y});}
  for(const a of s.animalSystem.animals.values()){if(!a.isAlive||!a.sandbox)continue;const u={side:foe(a)?'enemy':'wild',id:a.type,x:a.tile.x,y:a.tile.y};if(a.onWall)u.wall=true;units.push(u);}
  const ours=units.filter(u=>u.side==='ours'),startAt=ours.length?{x:Math.round(ours.reduce((n,u)=>n+u.x,0)/ours.length),y:Math.round(ours.reduce((n,u)=>n+u.y,0)/ours.length)}:null;
  return normalizeScenario({schema:SCENARIO_SCHEMA,version:SCENARIO_VERSION,id:`scenario-${Date.now().toString(36)}`,name:name||'Scenario',description,
    world:{code:s.gameSettings.worldCode,land:s.sandboxLandId??'home',mapSize:s.map.length},goal:{type:goal,...(goal==='hold'?{days:holdDays}:{})},start:startAt,buildings,units,createdAt:new Date().toISOString()});
}
// Checks a template (from a file or the browser) and returns a clean copy; throws on anything it cannot use.
export function normalizeScenario(data){
  const fail=why=>{throw new TypeError(`Invalid scenario: ${why}`);},int=(v,what)=>Number.isSafeInteger(v)&&v>=0&&v<1000?v:fail(what),str=(v,max,what)=>typeof v==='string'&&v.length<=max?v:fail(what);
  if(!data||typeof data!=='object')fail('not an object');if(data.schema!==SCENARIO_SCHEMA)fail('schema');if(data.version!==SCENARIO_VERSION)fail('version');
  const w=data.world??{};const world={code:str(w.code,64,'world code'),land:str(w.land??'home',20,'land'),mapSize:int(w.mapSize,'map size')};
  const goalType=SCENARIO_GOALS.includes(data.goal?.type)?data.goal.type:fail('goal'),goal={type:goalType};
  if(goalType==='hold'){const d=data.goal.days;goal.days=Number.isSafeInteger(d)&&d>=SCENARIO_LIMITS.holdDays[0]&&d<=SCENARIO_LIMITS.holdDays[1]?d:fail('hold days');}
  if(!Array.isArray(data.buildings)||data.buildings.length>SCENARIO_LIMITS.buildings)fail('buildings');if(!Array.isArray(data.units)||data.units.length>SCENARIO_LIMITS.units)fail('units');
  const buildings=data.buildings.map((b,i)=>{const out={type:str(b?.type,40,`building ${i}`),x:int(b.x,`building ${i} x`),y:int(b.y,`building ${i} y`),side:b.side==='enemy'?'enemy':'ours'};
    if(b.gateAxis!=null)out.gateAxis=b.gateAxis==='x'?'x':'y';if(b.facing!=null)out.facing=Number.isSafeInteger(b.facing)?b.facing:fail(`building ${i} facing`);if(b.level!=null)out.level=int(b.level,`building ${i} level`);if(b.look!=null)out.look=str(b.look,60,`building ${i} look`);return out;});
  const units=data.units.map((u,i)=>{const side=['ours','enemy','wild'].includes(u?.side)?u.side:fail(`unit ${i} side`),out={side,x:int(u.x,`unit ${i} x`),y:int(u.y,`unit ${i} y`)};
    if(side==='ours')out.unit=str(u.unit,40,`unit ${i} type`);else out.id=str(u.id,40,`unit ${i} type`);if(u.wall)out.wall=true;return out;});
  const start=data.start==null?null:{x:int(data.start.x,'start x'),y:int(data.start.y,'start y')};
  return {schema:SCENARIO_SCHEMA,version:SCENARIO_VERSION,id:str(data.id||`scenario-${Date.now().toString(36)}`,80,'id'),name:str(String(data.name??'').slice(0,SCENARIO_LIMITS.name)||'Scenario',SCENARIO_LIMITS.name,'name'),
    description:str(String(data.description??'').slice(0,SCENARIO_LIMITS.description),SCENARIO_LIMITS.description,'description'),world,goal,start,buildings,units,...(typeof data.createdAt==='string'?{createdAt:data.createdAt.slice(0,40)}:{})};
}
// Puts a template on a fresh Test map of the same world. What cannot be placed (a changed world, an unknown type) is
// skipped and counted.
export function applyScenario(scene,template){
  const s=scene,t=normalizeScenario(template),free={pay:()=>true,canAfford:()=>true,storage:null};let built=0,units=0,skipped=0;
  for(const b of t.buildings){const definition=s.objectRegistry.get(b.type);if(definition?.category!=='building'){skipped++;continue;}
    const fields={};for(const k of BUILDING_FIELDS)if(b[k]!=null)fields[k]=b[k];
    const result=placeBuilding({map:s.map,anchor:{x:b.x,y:b.y},resources:s.resourceOccupancy,reservedTiles:s.placementReserved(),inventory:free,buildings:s.buildings,definition,reserveMaterials:false,provisional:false,fields,replaceWalls:(walls,building)=>replaceWalls(s,walls,building)});
    if(result.error){skipped++;continue;}const nb=result.building;s.dropSystem?.clearSite?.(nb);s.towerViews.set(nb.id,s.createBuildingView(buildingDefinition(nb),nb));if(b.side==='enemy')markEnemyBuilding(s,nb);built++;}
  s.refreshWallConnections?.();s.orientGates?.();s.events?.emit?.('buildings:changed');
  const fortAt=(x,y)=>s.buildings.find(b=>b.enemy&&b.tiles?.some(p=>p.x===x&&p.y===y));
  for(const u of t.units){const tile={x:u.x,y:u.y};if(s.map[u.y]?.[u.x]===undefined){skipped++;continue;}
    if(u.side==='ours'){const w=s.workerSystem.create(tile);if(s.military.enlist(w,u.unit,{withoutHorse:true})){w.sandbox=true;s.military.engines?.sandboxCrew?.(w,u.unit);units++;}else{w.isAlive=false;s.workerSystem.onDeath(w);skipped++;}continue;}
    const d=s.objectRegistry.get(u.id);if(!d){skipped++;continue;}const a=s.animalSystem.create(d,tile);a.sandbox=true;
    if(u.wall){const fort=fortAt(u.x,u.y);if(!(fort&&s.enemyArmy?.mount(a,fort,tile)))a.onWall=null;}units++;}
  s.workerSystem.updateUI?.();s.updateInventory?.();if(t.start)s.worldCamera?.lookAt?.(t.start);
  s.scenario=t;return {built,units,skipped};
}
// Templates kept in this browser (newest first).
export function storedScenarios(storage=globalThis.localStorage){try{const list=JSON.parse(storage?.getItem?.(SCENARIO_KEY)??'[]');return Array.isArray(list)?list.flatMap(d=>{try{return [normalizeScenario(d)];}catch{return [];}}):[];}catch{return [];}}
export function storeScenario(template,storage=globalThis.localStorage){const t=normalizeScenario(template),list=storedScenarios(storage).filter(d=>d.id!==t.id);list.unshift(t);storage?.setItem?.(SCENARIO_KEY,JSON.stringify(list));return t;}
export function forgetScenario(id,storage=globalThis.localStorage){const list=storedScenarios(storage).filter(d=>d.id!==id);storage?.setItem?.(SCENARIO_KEY,JSON.stringify(list));return list;}
export function scenarioFileName(t){return `${String(t.name).replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-+|-+$/g,'').toLowerCase()||'scenario'}.mk-scenario.json`;}
