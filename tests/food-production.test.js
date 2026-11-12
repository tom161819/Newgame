import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { totalXPForLevel } from '../src/data/experience.js';
import { GRANARY_GROUP_CAPACITY } from '../src/data/granaryCapacity.js';
import { FARMHOUSE_STORE } from '../src/data/farming.js';
// farmhouse-store (8 Nov 2026): Wheat and Flour live in Farmhouse stores (RAW = one Farmhouse store); the Granary keeps food.
const RAW=FARMHOUSE_STORE.capacity,FOOD=GRANARY_GROUP_CAPACITY.food;
globalThis.document={querySelector:()=>({textContent:''})};
const scene=()=>workerScene(undefined,{construction:true,foodProduction:true});
function building(s,type,x,y,blueprint=false){const definition=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,definition);Object.entries(definition.cost).forEach(([r,k])=>s.inventory.add(r,k));const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);if(blueprint)s.constructionSystem.plan(result.building);s.towerViews.set(result.building.id,s.createBuildingView(definition,result.building));return result.building;}
function worker(s,home,tile={x:53,y:44}){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(home,w),true);return w;}
function until(s,predicate,maximum=60000){let elapsed=0;while(!predicate()&&elapsed<maximum){s.tick(25);elapsed+=25;}assert.ok(predicate(),`Condition not reached after ${elapsed}ms: ${JSON.stringify(s.workerSystem.liveWorkers().map(w=>({job:w.profession,task:w.workTask,cargo:w.cargo,message:w.workMessage})))}`);return elapsed;}
function millFixture({employees=1}={}){const s=scene(),granary=building(s,'farmhouse',48,45),mill=building(s,'mill',54,45),workers=[];for(let i=0;i<employees;i++)workers.push(worker(s,mill,{x:53+i,y:44}));return {s,granary,mill,workers,stock:`farmhouse-${granary.id}`,input:`input-${mill.id}`,output:`output-${mill.id}`,record:s.foodProduction.records.get(mill.id)};}
const quantities=s=>{const amounts={};const add=(id,n)=>amounts[id]=(amounts[id]??0)+n;for(const l of s.foodStorage.locations.values())for(const[id,n]of Object.entries(l.stock))add(id,n);for(const w of s.workerSystem.liveWorkers())if(w.cargo)add(w.cargo.resource,w.cargo.amount);for(const d of s.dropSystem.drops.values())add(d.resource,d.amount);return amounts;};
const restore=data=>{const s=scene();loadGameState(s,data);return s;};

test('Mill, Bakery and Granary retain exact prices, footprints, physical construction and no production before completion',()=>{
  const s=scene();for(const[type,cost,[bw,bh],x]of [['mill',24,[2,2],45],['bakery',20,[3,2],49],['granary',12,[3,3],57]]){
    const b=building(s,type,x,40,true);assert.equal(Object.values(b.definition.cost).reduce((a,n)=>a+n,0),cost);assert.equal(b.tiles.length,bw*bh,`${type} is ${bw}×${bh} (the Bakery is 3×2 since 0.38.0)`);assert.equal(s.inventory.count('stone'),0);assert.equal(buildingIsComplete(b),false);assert.equal(s.foodProduction.records.has(b.id),false);assert.equal([...s.foodStorage.locations.values()].some(l=>l.buildingId===b.id),false);
    const w=s.workerSystem.create({x:x-1,y:42});assert.equal(s.workplaceSystem.assign(b,w),false);
    assert.equal(s.constructionSystem.commandKing(b),true);until(s,()=>buildingIsComplete(b));assert.equal([...s.foodStorage.locations.values()].some(l=>l.buildingId===b.id),true);
  }
});
test('one authoritative food inventory enforces 30 fallback and independent raw and food Granary groups, reservations, edible resources and preserves overflowing legacy stock',()=>{
  const s=scene(),storage=s.foodStorage;assert.equal(storage.deposit('food-camp','apple',30),true);assert.equal(storage.deposit('food-camp','apple',1),false);assert.equal(s.inventory.resources.has('apple'),false);assert.equal(s.inventory.count('apple'),30);
  const b=building(s,'granary',48,45),farm=building(s,'farmhouse',44,39);assert.equal(storage.deposit(`granary-${b.id}`,'wheat',1),false,'the Granary refuses Wheat');assert.equal(storage.deposit(`granary-${b.id}`,'flour',1),false,'and Flour');assert.equal(storage.room(`granary-${b.id}`,'wheat'),0);assert.equal(storage.findDestination(s.character,'wheat',1)?.location.id,`farmhouse-${farm.id}`);assert.equal(storage.deposit(`farmhouse-${farm.id}`,'wheat',RAW),true);assert.equal(storage.findDestination(s.character,'bread',1)?.location.id,`granary-${b.id}`);assert.equal(storage.room(`farmhouse-${farm.id}`,'wheat'),0);assert.equal(storage.room(`granary-${b.id}`,'bread'),FOOD);const b2=building(s,'granary',54,45);assert.equal(storage.room(`granary-${b2.id}`),FOOD);
  const stock=storage.reserve('stock',`farmhouse-${farm.id}`,'wheat',4,'fixture');assert.equal(s.inventory.count('wheat'),RAW-4);assert.equal(storage.take(stock).amount,4);assert.equal(storage.take(stock),null);assert.equal(s.inventory.count('wheat'),RAW-4);
  storage.importState(null,{apple:75,meat:20});assert.equal(storage.locations.get('food-camp').legacyOverflow,65);assert.equal(s.inventory.count('apple'),75);assert.equal(storage.room('food-camp'),0);s.inventory.spend('apple',70);assert.equal(storage.locations.get('food-camp').legacyOverflow,0);assert.equal(s.inventory.count('meat'),20);assert.equal(s.foodSystem.availablePortions,25);
  s.inventory.add('bread',3);assert.equal(s.foodSystem.availablePortions,28);assert.equal(s.inventory.count('wheat'),0);s.inventory.add('flour',1);s.inventory.add('wheat',1);assert.equal(s.foodSystem.availablePortions,28);
});
test('Miller reserves stock but debits it only on physical pickup, delivers input before working and credits Flour only after return to storage',()=>{
  const {s,stock,mill,input,output,workers:[w],record}=millFixture();s.foodStorage.deposit(stock,'wheat',4);
  until(s,()=>w.workTask?.kind==='foodPickup');assert.equal(s.foodStorage.locations.get(stock).stock.wheat,4);assert.equal(s.inventory.count('wheat'),0);assert.equal(record.cycle,null);assert.equal(w.cargo,null);
  until(s,()=>w.cargo?.resource==='wheat');assert.equal(s.foodStorage.locations.get(stock).stock.wheat,undefined);assert.equal(w.cargo.amount,4);assert.equal(record.cycle,null);assert.equal(s.foodStorage.used(s.foodStorage.locations.get(input)),0);
  until(s,()=>record.cycle?.workDone>0);assert.equal(w.cargo,null);assert.equal(s.workplaceSystem.atWorkplace(w),true);assert.equal(s.foodStorage.used(s.foodStorage.locations.get(input)),0);const started=s.gameTime.totalElapsed,work=record.cycle.workDone;
  s.simulate(20000);assert.equal(record.completed,0);assert.equal(s.inventory.count('flour'),0);assert.ok(record.cycle.workDone>=20000+work-1);
  until(s,()=>record.completed===1);assert.ok(s.gameTime.totalElapsed-started>=30000-work-25);assert.equal(s.foodStorage.locations.get(output).stock.flour,2);assert.equal(s.inventory.count('flour'),0);assert.equal(w.experience.totalXP,8);assert.equal(w.skills.milling.totalXP,8);
  until(s,()=>s.inventory.count('flour')===2);assert.equal(w.cargo,null);assert.equal(s.workplaceSystem.records.get(mill.id).delivered.flour,2);s.simulate(5000);assert.equal(record.completed,1);assert.equal(w.experience.totalXP,8);assert.deepEqual(quantities(s),{flour:2});
});
test('full Wheat Field → Farmhouse → Mill → Farmhouse → Bakery → Granary chain uses existing Farmers, Milling/Baking skills and exact 10 Wheat → 24 Bread (2 Wheat left)',()=>{
  const {s,stock,mill,workers:[m],record,granary:home}=millFixture(),bakery=building(s,'bakery',54,51),granary=building(s,'granary',60,45),field=building(s,'wheat_field',44,50),b=worker(s,bakery,{x:53,y:50}),f=worker(s,home,{x:43,y:45});
  s.gameTime.update(240000);until(s,()=>f.cargo?.resource==='wheat');assert.equal(f.cargo.amount,10);assert.equal(s.inventory.count('wheat'),0);assert.equal(s.farmingSystem.records.get(field.id).cycle,1);
  until(s,()=>s.foodStorage.locations.get(stock).stock.wheat===10);assert.ok(s.foodStorage.atLocation(f,stock));assert.equal(f.skills.farming.totalXP,8);
  until(s,()=>s.inventory.count('bread')===24,250000);/* tabulka-budov-1: 2 Mill batches (4 Wheat → 2 Flour) and 4 Bakery batches × 6 Bread; 2 of the 10 Wheat wait for the next harvest */assert.equal(record.completed,2);assert.equal(s.foodProduction.records.get(bakery.id).completed,4);assert.equal(m.experience.totalXP,16);assert.equal(b.experience.totalXP,40);assert.equal(b.skills.baking.totalXP,40);assert.equal(quantities(s).wheat,2,'2 Wheat wait (in a store or the Mill buffer)');assert.equal(s.inventory.count('flour'),0);assert.ok(s.pathWear.active.size>0);assert.equal(s.foodStorage.locations.get(`granary-${granary.id}`).stock.bread,24,'Bread goes to the Granary');
});
test('production requires assigned physical workers, waits for missing input and full output capacity; Auto OFF preserves an active cycle',()=>{
  const {s,stock,mill,record,workers:[w]}=millFixture();s.simulate(4000);assert.equal(record.cycle,null);assert.match(w.workMessage,/wheat/);s.foodStorage.deposit(stock,'wheat',4);s.foodStorage.deposit(stock,'flour',RAW-4);until(s,()=>w.cargo?.resource==='wheat');s.foodStorage.deposit(stock,'flour',4);s.simulate(5000);assert.equal(record.cycle,null);assert.match(w.workMessage,/full|unreachable/);
  s.inventory.spend('flour',10);until(s,()=>record.cycle?.workDone>=5000);s.foodProduction.toggle(mill.id,false);const progress=record.cycle.workDone;s.simulate(10000);assert.equal(record.cycle.workDone,progress);assert.equal(record.completed,0);s.foodProduction.toggle(mill.id,true);until(s,()=>record.completed===1);until(s,()=>s.inventory.count('flour')===RAW-8);assert.equal(s.inventory.count('wheat'),0);
});
test('two Millers cooperate without duplicate inputs or XP; skill levels change active work duration and their daily wages',()=>{
  const durations=[];
  for(const [employees,level]of [[1,1],[1,50],[2,1]]){
    const {s,stock,mill,record,workers}=millFixture({employees});for(const w of workers)s.skillSystem.addXP(w,'milling',totalXPForLevel(level));s.foodStorage.deposit(stock,'wheat',4);
    const before=workers.reduce((n,w)=>n+w.experience.totalXP,0);until(s,()=>record.cycle?.workDone>0);const start=s.gameTime.totalElapsed;until(s,()=>record.completed===1);durations.push(s.gameTime.totalElapsed-start);
    assert.ok(Math.abs(workers.reduce((n,w)=>n+w.experience.totalXP,0)-before-8)<1e-7);assert.equal(s.wageSystem.dailyWage(workers[0]),level===50?5:1);assert.equal(s.foodStorage.locations.get(stock).stock.wheat,undefined);assert.equal(s.foodStorage.locations.get(`output-${mill.id}`).stock.flour,2);
  }
  assert.ok(durations[1]<durations[0]*.7);assert.ok(durations[2]<durations[0]*.55);
});
test('each production transport and active-cycle phase survives exact Save/Load without replaying debit or output',()=>{
  const {s,stock,record,workers:[w]}=millFixture();s.foodStorage.deposit(stock,'wheat',4);
  const phases=[()=>w.workTask?.kind==='foodPickup',()=>w.cargo?.resource==='wheat',()=>record.cycle?.workDone>=6000,()=>record.completed===1&&s.foodStorage.locations.get(`output-${record.buildingId}`).stock.flour===2,()=>w.cargo?.resource==='flour'];
  for(const phase of phases){until(s,phase);const data=validateGameState(serializeGameState(s)),r=restore(data);assert.deepEqual(serializeGameState(r),data);until(r,()=>r.inventory.count('flour')===2);assert.equal(r.inventory.count('wheat'),0);assert.equal(r.workerSystem.workers.get(w.id).experience.totalXP,8);assert.deepEqual(quantities(r),{flour:2});}
});
test('harvest reservations, carried yield and storage capacity survive Save/Load and canceled harvesting releases capacity',()=>{
  const s=scene(),home=building(s,'farmhouse',44,45),field=building(s,'wheat_field',44,50),f=worker(s,home,{x:43,y:45});s.gameTime.update(240000);until(s,()=>f.workTask?.kind==='harvest'&&f.workTask.progressMs>1000);
  const data=validateGameState(serializeGameState(s)),r=restore(data);assert.deepEqual(serializeGameState(r),data);until(r,()=>r.inventory.count('wheat')===10);assert.equal(r.farmingSystem.records.get(field.id).cycle,1);assert.equal(r.foodStorage.reservations.size,0);
  s.workerSystem.jobs.assign(f,'idle');assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.farmingSystem.records.get(field.id).reservedBy,null);assert.equal(s.inventory.count('wheat'),0);
});
test('profession changes, worker death and destroyed machines preserve consumed inputs or real cargo and release reservations',()=>{
  for(const outcome of ['job','death','machine']){
    const {s,stock,mill,record,workers:[w]}=millFixture();s.foodStorage.deposit(stock,'wheat',4);until(s,()=>w.cargo?.resource==='wheat');
    if(outcome==='job')s.workerSystem.jobs.assign(w,'idle');if(outcome==='death'){w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);}if(outcome==='machine'){s.buildings=s.buildings.filter(b=>b!==mill);s.tick(25);}
    assert.equal(s.foodStorage.reservations.size,0);assert.equal(quantities(s).wheat,4);assert.equal(s.inventory.count('flour'),0);
  }
  const {s,stock,mill,record}=millFixture();s.foodStorage.deposit(stock,'wheat',4);until(s,()=>record.cycle?.workDone>=1000);s.buildings=s.buildings.filter(b=>b!==mill);s.tick(25);assert.equal(quantities(s).wheat,4);assert.equal(s.foodProduction.records.has(mill.id),false);assert.equal(s.foodStorage.reservations.size,0);
});
test('large ground meat piles are carried in trips of at most 40 (40 load units of Meat) with one proportional collection reward and no phantom food',()=>{
  const s=scene(),home=building(s,'hunting_lodge',44,45),granary=building(s,'granary',48,45),w=worker(s,home,{x:43,y:45});s.dropSystem.create('meat',{x:43,y:46},47);
  let max=0;until(s,()=>{max=Math.max(max,w.cargo?.amount??0);return s.inventory.count('meat')===47;},60000);assert.equal(w.experience.totalXP,2);assert.equal(s.dropSystem.drops.size,0);assert.equal(max,40);assert.equal(s.foodStorage.locations.get(`granary-${granary.id}`).stock.meat,47);
});
test('Save validation rejects duplicate quantity/reservations, incompatible storage and forged cycles before mutating a world',()=>{
  const {s,stock,record}=millFixture();s.foodStorage.deposit(stock,'wheat',4);until(s,()=>record.cycle?.workDone>=1000);const data=validateGameState(serializeGameState(s));
  for(const change of [x=>x.foodStorage.locations[0].capacity=999,x=>x.foodStorage.locations.push(x.foodStorage.locations[0]),x=>x.foodStorage.reservations.push(x.foodStorage.reservations[0]),x=>x.foodStorage.reservations[0].amount+=5/* +1 is the Mill before 9 Nov (RECIPE_HISTORY) */,x=>x.foodProduction.records[0].cycle.inputs.wheat++,x=>x.foodProduction.records[0].cycle.workDone++,x=>x.inventory.apple=8]){const bad=structuredClone(data);change(bad);assert.throws(()=>validateGameState(bad));}
  assert.equal(s.foodProduction.records.get(record.buildingId).cycle.workDone,data.foodProduction.records[0].cycle.workDone);
});

test('an unreachable source never becomes remote input; a blocked return keeps its original cargo until the route reopens',()=>{
  const {s,stock,mill,workers:[w],record}=millFixture();s.foodStorage.deposit(stock,'wheat',4);
  for(let y=0;y<100;y++)s.map[y][52]=1;s.simulate(5000);assert.equal(s.foodStorage.locations.get(stock).stock.wheat,4);assert.equal(record.cycle,null);assert.equal(w.cargo,null);
  for(let y=0;y<100;y++)s.map[y][52]=0;until(s,()=>w.cargo?.resource==='wheat');
  for(let y=0;y<100;y++)s.map[y][52]=1;s.simulate(5000);assert.equal(w.cargo.amount,4);assert.equal(record.cycle,null);assert.equal(s.inventory.count('wheat'),0);assert.equal(quantities(s).wheat,4);
  for(let y=0;y<100;y++)s.map[y][52]=0;until(s,()=>s.inventory.count('flour')===2);assert.equal(record.completed,1);assert.equal(quantities(s).wheat,undefined);
});
test('a full Farmhouse store prevents wheat harvesting; a destroyed store preserves every physical unit on the ground',()=>{
  const s=scene(),granary=building(s,'granary',48,45),home=building(s,'farmhouse',44,45),barn=building(s,'farmhouse',44,39),field=building(s,'wheat_field',44,50),f=worker(s,home,{x:43,y:45});
  s.foodStorage.deposit(`farmhouse-${home.id}`,'flour',RAW);s.foodStorage.deposit(`farmhouse-${barn.id}`,'flour',RAW);s.foodStorage.deposit(`granary-${granary.id}`,'bread',FOOD);s.gameTime.update(240000);s.simulate(5000);assert.equal(f.cargo,null);assert.equal(f.workTask,null);assert.equal(s.farmingSystem.records.get(field.id).cycle,0,'no Farmhouse room and the Granary takes no Wheat');
  s.buildings=s.buildings.filter(b=>b!==granary&&b!==barn);s.tick(25);assert.equal(quantities(s).bread,FOOD);assert.equal(quantities(s).flour,RAW*2);assert.equal(s.inventory.count('bread'),0);assert.equal(s.foodStorage.locations.has(`granary-${granary.id}`),false);assert.equal(s.foodStorage.locations.has(`farmhouse-${barn.id}`),false);
  s.inventory.spend('flour',RAW);until(s,()=>s.inventory.count('wheat')===10);assert.equal(s.foodStorage.locations.get(`farmhouse-${home.id}`).stock.wheat,10);assert.equal(s.farmingSystem.records.get(field.id).cycle,1);validateGameState(serializeGameState(s));
});
test('m-ukladani-chyba: a batch saved under an earlier recipe (RECIPE_HISTORY) loads and finishes as it started; a forged one is still rejected',()=>{
  const {s,stock,record}=millFixture();s.foodStorage.deposit(stock,'wheat',4);until(s,()=>record.cycle?.workDone>=1000);
  const data=validateGameState(serializeGameState(s)),old=structuredClone(data),cycle=old.foodProduction.records[0].cycle;
  // The Mill made 3 Flour from 4 Wheat before the building table of 9 Nov.
  old.foodStorage.reservations.find(r=>r.id===cycle.outputReservation).amount=3;
  const r=restore(validateGameState(old));until(r,()=>r.inventory.count('flour')===3,120000);
  const forged=structuredClone(data);forged.foodStorage.reservations.find(x=>x.id===forged.foodProduction.records[0].cycle.outputReservation).amount=7;assert.throws(()=>validateGameState(forged));
});
