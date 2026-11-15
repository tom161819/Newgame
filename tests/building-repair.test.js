// m-budovy-hp (owner 15 Nov 2026: "životy budov ano teď"): every building has hit points, fire takes them, Builders
// repair a damaged building for half the price of what is missing.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { RepairSystem } from '../src/systems/RepairSystem.js';
import { buildingMaxHP,buildingHP,damageBuilding,repairPlan,BUILDING_HP_RULES } from '../src/game/buildingHealth.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
globalThis.document??={querySelector:()=>({textContent:''})};
function fixture(type='house'){
  const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();
  s.repairs=new RepairSystem(s);const tick=s.tick;s.tick=delta=>{tick(delta);s.repairs.update(delta);};
  const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const result=placeBuilding({map:s.map,anchor:{x:60,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);
  const worker=(x=57,y=54)=>{const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;};return {s,b:result.building,d,worker};
}
function until(s,p,max=120000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p());}
test('hit points: fortifications fixed, other buildings 100 + 8 per price unit, none for fields, paving, campfires and ruins',()=>{
  const def=id=>({type:id,definition:objectRegistry.require(id)});
  assert.equal(buildingMaxHP(def('tower')),400);const house=objectRegistry.require('house');assert.equal(buildingMaxHP(def('house')),BUILDING_HP_RULES.base+8*Object.values(house.cost).reduce((a,b)=>a+b,0));
  for(const id of ['wheat_field','campfire','burnt_ruins'])assert.equal(buildingMaxHP(def(id)),null,id);
});
test('a damaged building is repaired by a Builder for half the missing price; hit points come back with the work; save keeps the job',async()=>{
  const {s,b,d,worker}=fixture();const max=buildingMaxHP(b);damageBuilding(b,max/2);assert.equal(buildingHP(b).hp,max/2);
  const plan=repairPlan(b);for(const [id,n]of Object.entries(d.cost))assert.equal(plan.cost[id],Math.ceil(n*.5*.5),id);
  for(const [id]of Object.entries(d.cost))s.inventory.spend?.(id,s.inventory.count(id));s.simulate?.(1500);for(let i=0;i<60;i++)s.tick(25);assert.equal(b.repair,undefined,'no repair without materials');
  for(const [id,n]of Object.entries(plan.cost))s.inventory.add(id,n);until(s,()=>!!b.repair);for(const [id]of Object.entries(plan.cost))assert.equal(s.inventory.count(id),0,'paid at the start');
  const w=worker();until(s,()=>w.workTask?.kind==='repair');until(s,()=>b.repair?.workDone>200);assert.ok(buildingHP(b).hp>max/2&&buildingHP(b).hp<max);
  const {serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js'),{loadGameState}=await import('../src/systems/GameStateLoader.js');
  const state=validateGameState(serializeGameState(s));const r=workerScene(state.terrain,{construction:true,foodProduction:true,logistics:true,starter:false});r.repairs=new RepairSystem(r);loadGameState(r,structuredClone(state));
  assert.equal(r.repairs.jobs.get(b.id).workDone,b.repair.workDone);assert.equal(r.buildings.find(x=>x.id===b.id).hp,b.hp);
  for(const mutate of [x=>x.buildings.find(y=>y.id===b.id).repair.workDone++,x=>x.workers.find(y=>y.id===w.id).workTask.targetId=9999]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));}
  until(s,()=>!b.repair);assert.equal(b.hp,undefined,'full again');assert.equal(w.workTask,null);assert.equal(buildingHP(b).hp,max);
});
test('a burning building is not repaired; the fire takes its hit points and a fire on a damaged building starts lower',async()=>{
  const {NightThreatSystem}=await import('../src/systems/NightThreatSystem.js');const {s,b}=fixture();
  const n=s.nightThreats??new NightThreatSystem(s,{nightFires:true});s.nightThreats=n;const max=buildingMaxHP(b);damageBuilding(b,max/4);
  const fire=n.ignite(b);assert.ok(Math.abs(fire.health-75)<1e-6);assert.equal(s.repairs.eligible(b),false);
  n.updateFires(5000);assert.ok(buildingHP(b).hp<max*.75);
});

// Owner 15 Nov 2026 (61): the Castle's upgrade is paid when ordered and built by Builders over the level's work; the new
// level stands when the work is done; the job saves and loads.
test('the Castle upgrade is built by Builders over time and the new level stands when the work is done',async()=>{
  const {levelDefinition,buildingTiles}=await import('../src/game/buildings.js'),{upgradeCastle,castleUpgradePlan}=await import('../src/game/castleUpgrade.js'),{CASTLE_LEVELS}=await import('../src/data/castle.js');
  const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove(a);
  s.repairs=new RepairSystem(s);const tick=s.tick;s.tick=delta=>{tick(delta);s.repairs.update(delta);};
  const d=levelDefinition(s.objectRegistry.require('castle'),1),castle={id:500,type:'castle',definition:d,x:60,y:60,level:1,tiles:buildingTiles({x:60,y:60},d)};s.buildings.push(castle);for(const t of castle.tiles)s.map[t.y][t.x]=1;
  s.inventory.add('wood',70);const r=upgradeCastle(s,castle);assert.equal(r.ordered,true);assert.equal(castle.level,1,'not yet');assert.equal(s.inventory.count('wood'),0,'paid when ordered');
  assert.equal(castle.upgrade.requiredWork,CASTLE_LEVELS[2].work);assert.match(castleUpgradePlan(s,castle).error,/2/,'a second order is refused while it is built');
  const w=s.workerSystem.create({x:57,y:58});s.workerSystem.jobs.assign(w,'builder');
  until(s,()=>w.workTask?.kind==='repair'&&w.workTask.targetId===castle.id);until(s,()=>castle.upgrade?.workDone>500);assert.equal(castle.level,1);
  const {serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');const state=validateGameState(serializeGameState(s));
  assert.equal(state.buildings.find(b=>b.id===castle.id).upgrade.level,2);const bad=structuredClone(state);bad.buildings.find(b=>b.id===castle.id).upgrade.level=4;assert.throws(()=>validateGameState(bad));
  until(s,()=>castle.level===2,400000);assert.equal(castle.upgrade,undefined);assert.equal(w.workTask,null);
});
