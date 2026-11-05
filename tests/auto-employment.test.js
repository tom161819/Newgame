import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { EmploymentSystem,compareForSkill } from '../src/systems/EmploymentSystem.js';
import { EMPLOYMENT_PRESETS,EMPLOYMENT_PROFESSIONS,presetOf } from '../src/data/employment.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';

globalThis.document??={querySelector:()=>({textContent:''})};

function fixture(options={}){const s=workerScene(undefined,{workplaces:true,...options});s.events=new EventEmitter();s.employment=new EmploymentSystem(s);return s;}
function build(s,type,x,y,{complete=true}={}){
  const d=s.objectRegistry.require(type);for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);
  const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);
  if(!complete)r.building.construction={state:'planned',progress:0,workDone:0};s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.events.emit('buildings:changed');return r.building;
}
function resident(s,x,{talent='combat',levels={}}={}){const w=s.workerSystem.create({x,y:50});w.naturalTalent=talent;for(const[skill,level]of Object.entries(levels))w.skills[skill].level=level;return w;}

test('presets come from profession sectors; hand edits make Custom; priorities stay within 1–5',()=>{
  const s=fixture(),e=s.employment;assert.equal(e.preset,'balanced');assert.ok(EMPLOYMENT_PROFESSIONS.every(p=>e.priorities[p]===3));
  assert.equal(e.applyPreset('food'),true);assert.equal(e.preset,'food');assert.equal(e.priorities.farmer,5);assert.equal(e.priorities.miner,2);
  assert.equal(e.setPriority('miner',4),true);assert.equal(e.preset,'custom');
  for(const bad of [0,6,2.5])assert.equal(e.setPriority('miner',bad),false);assert.equal(e.setPriority('hauler',5),false,'global professions have no seats');
  assert.equal(presetOf(EMPLOYMENT_PRESETS.production),'production');
});

test('a talent for the skill wins first, then skill level, XP, overall level and stable id',()=>{
  const mk=(id,talent,level,xp=0,overall=1)=>({id,naturalTalent:talent,skills:{mining:{level,totalXP:xp}},experience:{level:overall}});
  const sorted=[mk('worker-5','combat',9),mk('worker-4','mining',2),mk('worker-3','combat',4,50),mk('worker-2','combat',4,90),mk('worker-11','combat',4,90,3),mk('worker-10','combat',4,90,3)].sort(compareForSkill('mining')).map(w=>w.id);
  assert.deepEqual(sorted,['worker-4','worker-5','worker-10','worker-11','worker-2','worker-3']);
});

test('the last Unemployed fills the higher-priority seat; employed residents are never moved by a priority change',()=>{
  const s=fixture(),quarry=build(s,'quarry',55,50),hut=build(s,'lumberjack_hut',62,50),w=resident(s,50,{levels:{mining:1,woodcutting:1}});
  s.employment.setPriority('woodcutter',5);s.employment.setPriority('miner',2);s.employment.update();
  assert.equal(w.assignedWorkplaceId,hut.id);assert.equal(w.profession,'woodcutter');
  s.employment.setPriority('miner',5);s.employment.setPriority('woodcutter',1);s.employment.update();
  assert.equal(w.assignedWorkplaceId,hut.id,'still at the hut');assert.deepEqual(s.workplaceSystem.records.get(quarry.id)?.workerIds??[],[]);
});

test('globally the best candidate takes each seat, whatever order the buildings were built in',()=>{
  const s=fixture(),hut=build(s,'lumberjack_hut',62,50),quarry=build(s,'quarry',55,50);
  const miner=resident(s,48,{talent:'mining',levels:{mining:1,woodcutting:1}}),cutter=resident(s,49,{talent:'woodcutting',levels:{mining:1,woodcutting:1}});
  s.employment.applyPreset('balanced');s.employment.update();
  assert.equal(miner.assignedWorkplaceId,quarry.id);assert.equal(cutter.assignedWorkplaceId,hut.id);
});

test('OFF hires nobody; blueprints, held and busy residents are skipped; a manual removal does not ping-pong',()=>{
  const s=fixture(),site=build(s,'quarry',55,50,{complete:false}),w=resident(s,50);
  s.employment.setEnabled(false);const hut=build(s,'lumberjack_hut',62,50);s.employment.update();assert.equal(w.assignedWorkplaceId,null);
  s.employment.setEnabled(true);s.employment.update();assert.equal(w.assignedWorkplaceId,hut.id,'never the unfinished Quarry');assert.equal(s.workplaceSystem.records.has(site.id),false);
  s.employment.hold(w);s.workplaceSystem.remove(w);for(let i=0;i<5;i++){s.employment.request();s.employment.update();}
  assert.equal(w.assignedWorkplaceId,null,'the player made them Unemployed; automatic employment leaves them');
  s.employment.release(w);s.workplaceSystem.assign(hut,w);assert.equal(w.assignedWorkplaceId,hut.id);
});

test('settings, priorities and held residents survive Save/Load in the current schema',()=>{
  const s=fixture(),w=resident(s,50);s.employment.applyPreset('production');s.employment.setPriority('farmer',4);s.employment.hold(w);s.employment.setEnabled(false);
  const state=validateGameState(serializeGameState(s));assert.deepEqual(state.employment,{blockedBuildings:[],blockedTypes:[],enabled:false,priorities:{...EMPLOYMENT_PRESETS.production,farmer:4},held:[w.id]});
  for(const bad of [{...state.employment,priorities:{...state.employment.priorities,farmer:6}},{...state.employment,held:['worker-999']},{...state.employment,extra:1}])assert.throws(()=>validateGameState({...structuredClone(state),employment:bad}));
  const r=fixture({starter:false});loadGameState(r,structuredClone(state));assert.deepEqual(r.employment.exportState(),state.employment);assert.equal(r.employment.preset,'custom');
});

test('local employment exclusion blocks automatic and manual new assignments without firing or moving existing staff',()=>{
 const s=fixture(),a=build(s,'quarry',55,50),b=build(s,'quarry',62,50),old=resident(s,48),fresh=resident(s,49);
 assert.equal(s.workplaceSystem.assign(a,old),true);assert.equal(s.employment.setBuildingDisabled(a,true),true);s.employment.hold(fresh);
 assert.equal(s.workplaceSystem.assign(a,fresh),false);assert.equal(fresh.profession,'idle');assert.equal(old.assignedWorkplaceId,a.id);assert.equal(s.workplaceSystem.assign(a,old),true,'existing employee is unchanged');
 s.employment.release(fresh);s.employment.update();assert.equal(fresh.assignedWorkplaceId,b.id);assert.equal(old.assignedWorkplaceId,a.id);assert.equal(s.employment.blockReason(a),'local');assert.equal(s.employment.blockReason(b),null);
});
test('type ban covers future instances and local allow cannot bypass it; removing type ban preserves local rules',()=>{
 const s=fixture(),a=build(s,'quarry',55,50),b=build(s,'quarry',62,50);s.employment.setTypeDisabled(a,true);s.employment.setBuildingDisabled(b,true);s.employment.setBuildingDisabled(a,false);
 const c=build(s,'quarry',69,50),w=resident(s,49);s.employment.update();assert.equal(w.profession,'idle');for(const home of [a,b,c]){assert.equal(s.employment.blockReason(home),'type');assert.equal(s.workplaceSystem.assign(home,w),false);}
 s.employment.setTypeDisabled(c,false);assert.equal(s.employment.blockReason(b),'local');s.employment.update();assert.equal(w.assignedWorkplaceId,a.id);assert.equal(s.workplaceSystem.records.get(a.id).workerIds.filter(id=>id===w.id).length,1);assert.equal(s.employment.run(),0);
});
test('removing one building prunes its local rule only, preserves type rule and rejects foreign or non-workplace control targets',()=>{
 const s=fixture(),a=build(s,'quarry',55,50),b=build(s,'quarry',62,50);s.employment.setBuildingDisabled(a,true);s.employment.setBuildingDisabled(b,true);s.employment.setTypeDisabled(a,true);
 assert.equal(s.employment.setTypeDisabled({...a,type:'lumberjack_hut'},true),false);assert.equal(s.employment.setBuildingDisabled(a,'yes'),false);
 s.buildings.splice(s.buildings.indexOf(a),1);s.events.emit('buildings:changed');assert.deepEqual(s.employment.exportState().blockedBuildings,[b.id]);assert.deepEqual(s.employment.exportState().blockedTypes,['quarry']);
});
test('unblocking re-evaluates safely while held residents and full capacities remain authoritative',()=>{
 const s=fixture(),a=build(s,'quarry',55,50),held=resident(s,46),workers=[47,48,49,50].map(x=>resident(s,x));s.employment.hold(held);s.employment.setBuildingDisabled(a,true);s.employment.update();assert.ok(workers.every(w=>w.profession==='idle'));
 s.employment.setBuildingDisabled(a,false);s.employment.update();assert.equal(s.workplaceSystem.employees(a).length,3);assert.equal(held.profession,'idle');assert.equal(workers.filter(w=>w.profession==='idle').length,1);s.employment.request();s.employment.update();assert.equal(s.workplaceSystem.employees(a).length,3);
});
test('current-schema exclusions roundtrip exactly and reject corrupted rules without changing the running world',()=>{
 const s=fixture(),a=build(s,'quarry',55,50);s.employment.setBuildingDisabled(a,true);s.employment.setTypeDisabled(a,true);const state=validateGameState(serializeGameState(s));
 const r=fixture({starter:false});loadGameState(r,structuredClone(state));assert.deepEqual(r.employment.exportState(),state.employment);assert.equal(r.employment.blockReason(r.buildings.find(b=>b.id===a.id)),'type');
 for(const change of [e=>e.blockedBuildings.push(a.id),e=>e.blockedBuildings=[9999],e=>e.blockedBuildings=[-1],e=>e.blockedTypes=['castle'],e=>e.blockedTypes.push('quarry'),e=>delete e.blockedTypes]){const bad=structuredClone(state);change(bad.employment);assert.throws(()=>validateGameState(bad));assert.deepEqual(serializeGameState(s),state);}
});
