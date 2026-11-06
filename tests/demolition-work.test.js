import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { DemolitionSystem,demolitionRefund } from '../src/systems/DemolitionSystem.js';
globalThis.document??={querySelector:()=>({textContent:''})};
function fixture({complete,type='tower'}={}){
 const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();let finishes=0;
 s.demolition=new DemolitionSystem(s,{complete:complete??((b,refund)=>{finishes++;s.buildings.splice(s.buildings.indexOf(b),1);return true;})});const tick=s.tick;s.tick=delta=>{tick(delta);s.demolition.update(delta);};
 const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x:60,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);
 const worker=(x=57,y=54)=>{const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;};return {s,b:result.building,worker,finishes:()=>finishes};
}
function until(s,p,max=120000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p());}
test('demolition is a Builder job with real travel; no Builder means no work or callback',()=>{
 const {s,b,worker,finishes}=fixture();assert.equal(s.demolition.request(b),true);assert.equal(s.demolition.request(b),false);s.simulate(2000);assert.equal(b.demolition.workDone,0);assert.equal(finishes(),0);
 const w=worker();until(s,()=>w.workTask?.kind==='dismantle');assert.equal(b.demolition.workDone,0);assert.equal(s.constructionSystem.canWork(s.demolition.site(b.id),s.character),false);
 until(s,()=>b.demolition.workDone>0);assert.ok(s.constructionSystem.atSite(w,s.constructionSystem.assignments.get(w.id)));assert.ok(s.buildings.includes(b));until(s,()=>finishes()===1);s.simulate(2000);assert.equal(finishes(),1);assert.equal(s.demolition.jobs.size,0);assert.equal(w.workTask,null);
});
test('Hold/death/reassignment and cancellation release the same perimeter reservations without refunding',()=>{
 const {s,b,worker,finishes}=fixture();s.demolition.request(b);const a=worker(),c=worker(58,54);until(s,()=>b.demolition.assignedBuilders.length===2);const goals=[a.workTask.reservation,c.workTask.reservation];assert.notEqual(...goals);
 s.workerSystem.commands.hold(a);assert.equal(s.constructionSystem.assignments.has(a.id),false);assert.equal(b.demolition.assignedBuilders.includes(a.id),false);
 s.workerSystem.jobs.assign(c,'idle');assert.equal(s.constructionSystem.assignments.has(c.id),false);assert.equal(b.demolition.assignedBuilders.length,0);assert.equal(s.demolition.cancel(b.id),true);assert.equal(b.demolition,undefined);assert.ok(s.buildings.includes(b));assert.equal(finishes(),0);assert.equal(s.demolition.cancel(b.id),false);
});
test('completion waits at exact work budget for atomic lifecycle safety without duplicating work',()=>{
 let calls=0,allow=false;const {s,b,worker}=fixture({complete:(b,refund)=>{calls++;assert.deepEqual(refund,demolitionRefund(b.definition));if(!allow)return false;s.buildings.splice(s.buildings.indexOf(b),1);return true;}});s.demolition.request(b);worker();until(s,()=>calls>0);const work=b.demolition.workDone,total=Object.values(b.demolition.contributions).reduce((a,b)=>a+b,0);assert.equal(work,b.demolition.requiredWork);assert.ok(Math.abs(total-work)<1e-6);s.simulate(1000);assert.equal(b.demolition.workDone,work);assert.ok(s.buildings.includes(b));allow=true;s.tick(25);assert.equal(s.buildings.includes(b),false);const doneCalls=calls;s.simulate(1000);assert.equal(calls,doneCalls);
});
test('Castle, starter, noncanonical/unfinished targets and occupied roofs are protected; odd prices round down',()=>{
 const {s,b}=fixture();assert.deepEqual(demolitionRefund({cost:{stone:5,wood:3,gold:1}}),{stone:2,wood:1});assert.equal(s.demolition.request({...b}),false);
 assert.equal(s.demolition.request(s.buildings.find(b=>b.type==='starter_stockpile')),false);const original=b.type;b.type='castle';assert.equal(s.demolition.request(b),false);b.type=original;
 s.character.state='onTower';assert.equal(s.demolition.request(b),false);s.character.state='ground';s.constructionSystem.plan(b);assert.equal(s.demolition.request(b),false);
});

test('current schema keeps partial demolition and shared Builder reservations; rejects corrupted refunds and old saves',async()=>{
 const {serializeGameState,validateGameState,SAVE_VERSION}=await import('../src/systems/GameStateSerializer.js'),{loadGameState}=await import('../src/systems/GameStateLoader.js');
 const {s,b,worker}=fixture();s.demolition.request(b);const w=worker();until(s,()=>b.demolition.workDone>500);const state=validateGameState(serializeGameState(s));assert.equal(state.saveVersion,SAVE_VERSION);
 const r=workerScene(state.terrain,{construction:true,foodProduction:true,logistics:true,starter:false});r.demolition=new DemolitionSystem(r,{complete:()=>false});loadGameState(r,structuredClone(state));assert.equal(r.demolition.jobs.get(b.id).workDone,b.demolition.workDone);assert.deepEqual(r.constructionSystem.assignments.get(w.id),s.constructionSystem.assignments.get(w.id));assert.deepEqual(validateGameState(serializeGameState(r)),state);
 for(const mutate of [s=>s.buildings.find(x=>x.id===b.id).demolition.refund.stone++,s=>s.buildings.find(x=>x.id===b.id).demolition.assignedBuilders.push('king'),s=>s.buildings.find(x=>x.id===b.id).demolition.workDone++,s=>s.workers.find(x=>x.id===w.id).workTask.targetId=9999,s=>s.saveVersion=SAVE_VERSION-1]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));}
});

test('completed physical demolition refunds floor50% as ground ownership once, never central inventory',async()=>{
 const {finishDemolition}=await import('../src/game/buildingRemoval.js'),{serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');
 let current;const {s,b,worker}=fixture({complete:(b,refund)=>finishDemolition(current,b,refund)});current=s;const before=s.inventory.count('stone'),expected=demolitionRefund(b.definition);s.demolition.request(b);worker();until(s,()=>!s.buildings.includes(b));assert.equal(s.inventory.count('stone'),before);
 const drops=[...s.dropSystem.drops.values()].filter(d=>d.resource==='stone');assert.equal(drops.reduce((n,d)=>n+d.amount,0),expected.stone);assert.equal(finishDemolition(s,b,expected),false);s.simulate(1000);assert.equal([...s.dropSystem.drops.values()].filter(d=>d.resource==='stone').reduce((n,d)=>n+d.amount,0),expected.stone);validateGameState(serializeGameState(s));
});
test('Warehouse demolition preserves stored and committed site stock, reservations and current Save/Load',async()=>{
 const {finishDemolition}=await import('../src/game/buildingRemoval.js'),{serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');
 const {s,b}=fixture({type:'warehouse'});s.foodStorage.register(b);const id=`warehouse-${b.id}`;s.foodStorage.deposit(id,'stone',12);s.foodStorage.deposit(id,'wood',19);
 const d=s.objectRegistry.require('house'),result=placeBuilding({map:s.map,anchor:{x:70,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(result.error);s.constructionSystem.plan(result.building);
 const expected=s.foodStorage.resourceBreakdown().find(r=>r.resource==='wood').total;s.demolition.request(b);Object.assign(b.demolition,{state:'building',workDone:b.demolition.requiredWork,progress:100});
 assert.equal(finishDemolition(s,b,b.demolition.refund),true);assert.equal(s.foodStorage.locations.has(id),false);assert.equal(s.foodStorage.resourceBreakdown().find(r=>r.resource==='wood').total,expected);
 const committed=[...s.dropSystem.drops.values()].filter(d=>d.siteId===result.building.id);assert.equal(committed.filter(d=>d.resource==='wood').reduce((n,d)=>n+d.amount,0),10);assert.equal(committed.filter(d=>d.resource==='stone').reduce((n,d)=>n+d.amount,0),4);assert.equal([...s.foodStorage.reservations.values()].some(r=>r.locationId===id),false);validateGameState(serializeGameState(s));
});
test('occupied Mill removal returns its active recipe inputs and leaves no worker or capacity ghost',async()=>{
 const {ensureBuildingPrerequisites}=await import('./helpers/workerScene.js'),{finishDemolition}=await import('../src/game/buildingRemoval.js'),{serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');
 const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();s.demolition=new DemolitionSystem(s,{complete:()=>false});const d=s.objectRegistry.require('mill');ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x:65,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(d,b));
 const w=s.workerSystem.create({x:64,y:50});s.workplaceSystem.assign(b,w);s.foodStorage.deposit(`input-${b.id}`,'wheat',d.recipe.input.wheat);until(s,()=>s.foodProduction.records.get(b.id).cycle?.workDone>100);const total=s.foodStorage.resourceBreakdown().find(r=>r.resource==='wheat').total;s.demolition.request(b);Object.assign(b.demolition,{state:'building',workDone:b.demolition.requiredWork,progress:100});assert.equal(finishDemolition(s,b,b.demolition.refund),true);assert.equal(w.profession,'idle');assert.equal(w.assignedWorkplaceId,null);assert.equal(s.foodProduction.records.has(b.id),false);assert.equal(s.foodStorage.resourceBreakdown().find(r=>r.resource==='wheat').total,total);validateGameState(serializeGameState(s));
});

test('blocked demolition waits safely; opening the existing route resumes physical work',()=>{
 const {s,b,worker,finishes}=fixture();s.demolition.request(b);const w=worker();const d=b.definition,ring=[];for(let y=b.y-1;y<=b.y+d.height;y++)for(let x=b.x-1;x<=b.x+d.width;x++)if(x===b.x-1||x===b.x+d.width||y===b.y-1||y===b.y+d.height){ring.push({x,y});s.map[y][x]=1;}
 s.simulate(5000);assert.equal(b.demolition.workDone,0);assert.equal(w.workTask,null);assert.equal(finishes(),0);for(const t of ring)s.map[t.y][t.x]=0;s.constructionSystem.revision++;until(s,()=>finishes()===1);
});
test('a dead Builder releases its slot and a surviving Builder completes the same finite order once',()=>{
 const {s,b,worker,finishes}=fixture();s.demolition.request(b);const a=worker(),c=worker(58,54);until(s,()=>b.demolition.workDone>500&&b.demolition.assignedBuilders.length===2);a.currentHP=0;a.isAlive=false;s.workerSystem.onDeath(a);assert.equal(s.constructionSystem.assignments.has(a.id),false);assert.equal(b.demolition.assignedBuilders.includes(a.id),false);until(s,()=>finishes()===1);assert.ok(c.isAlive);s.simulate(2000);assert.equal(finishes(),1);
});
test('Stables demolition preserves live horses, keeps a reserved training horse attached, and cancellation releases it',async()=>{
 const {finishDemolition}=await import('../src/game/buildingRemoval.js'),{serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');
 const {s,b}=fixture({type:'stables'});s.towerViews.set(b.id,s.createBuildingView(b.definition,b));const horse=()=>{const a=s.animalSystem.create(s.objectRegistry.require('horse'),{x:b.x+2,y:b.y+2});s.stables.horses.set(a.id,{state:'stabled',stableId:b.id});s.stables.place(a.id);return a;};const free=horse(),reserved=horse();
 const definition=s.objectRegistry.require('barracks');ensureBuildingPrerequisites(s,definition);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x:75,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);const home=result.building;s.towerViews.set(home.id,s.createBuildingView(definition,home));
 const rider=s.workerSystem.create({x:74,y:50});s.workplaceSystem.assign(home,rider);s.inventory.add('gold',100);const ad=s.objectRegistry.require('armory');ensureBuildingPrerequisites(s,ad);for(const [r,n]of Object.entries(ad.cost))s.inventory.add(r,n);const ar=placeBuilding({map:s.map,anchor:{x:85,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:ad});assert.ifError(ar.error);s.towerViews.set(ar.building.id,s.createBuildingView(ad,ar.building));const armory=s.foodStorage.locations.get(`armory-${ar.building.id}`);assert.ok(armory);s.foodStorage.deposit(armory.id,'sword',1);s.foodStorage.deposit(armory.id,'armor',1);
 // Reserve the second horse for actual Knight training; the first remains an ordinary paddock horse.
 while(rider.skills.combat.level<4)s.skillSystem.addXP(rider,'combat',1000);
 const original=s.stables.freeHorse;s.stables.freeHorse=()=>reserved.id;assert.equal(s.military.train(rider,'knight'),null);s.stables.freeHorse=original;
 s.demolition.request(b);Object.assign(b.demolition,{state:'building',workDone:b.demolition.requiredWork,progress:100});assert.equal(finishDemolition(s,b,b.demolition.refund),true);assert.equal(free.isAlive,true);assert.equal(s.stables.horses.has(free.id),false);assert.equal(s.stables.horses.get(reserved.id).stableId,null);validateGameState(serializeGameState(s));
 const order=s.military.order(rider);assert.ok(order);s.military.cancel(order.id);assert.equal(reserved.isAlive,true);assert.equal(s.stables.horses.has(reserved.id),false);validateGameState(serializeGameState(s));
});

test('loaded Hauler cargo targeting a demolished Warehouse stays owned and reaches the remaining starter store',async()=>{
 const {finishDemolition}=await import('../src/game/buildingRemoval.js'),{serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');
 const {s,b}=fixture({type:'warehouse'});s.foodStorage.register(b);const start=[...s.foodStorage.locations.values()].find(l=>l.kind==='fallback'&&l.buildingId!=null);assert.ok(start);s.foodStorage.deposit(start.id,'wood',6);const w=s.workerSystem.create({x:start.x-1,y:start.y});s.workerSystem.jobs.assign(w,'hauler');w.stoneCollection={enabled:false,radius:80};until(s,()=>w.cargo?.resource==='wood'&&w.workTask?.destinationId===`warehouse-${b.id}`);const amount=w.cargo.amount;
 s.demolition.request(b);Object.assign(b.demolition,{state:'building',workDone:b.demolition.requiredWork,progress:100});assert.equal(finishDemolition(s,b,b.demolition.refund),true);assert.equal(w.cargo.amount,amount);assert.equal(w.workTask,null);validateGameState(serializeGameState(s));until(s,()=>s.inventory.count('wood')===6);assert.equal(w.cargo,null);validateGameState(serializeGameState(s));
});
test('Farmhouse demolition safely releases its Farmer and leaves the existing plot orphaned without growth loss',async()=>{
 const {finishDemolition}=await import('../src/game/buildingRemoval.js'),{serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');
 const {EventEmitter}=await import('node:events'),{FarmingSystem}=await import('../src/systems/FarmingSystem.js');
 const {s,b}=fixture({type:'farmhouse'});s.farmingSystem.destroy();s.events=new EventEmitter();s.farmingSystem=new FarmingSystem(s,{onHarvest:result=>s.foodProduction.harvest(result)});s.towerViews.set(b.id,s.createBuildingView(b.definition,b));s.events.emit('buildings:changed');const d=s.objectRegistry.require('wheat_field'),result=placeBuilding({map:s.map,anchor:{x:65,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const plot=result.building;s.towerViews.set(plot.id,s.createBuildingView(d,plot));const w=s.workerSystem.create({x:59,y:50});assert.equal(s.workplaceSystem.assign(b,w),true);assert.equal(plot.farmId,b.id);const growth=s.farmingSystem.records.get(plot.id).growthDays;
 s.demolition.request(b);Object.assign(b.demolition,{state:'building',workDone:b.demolition.requiredWork,progress:100});assert.equal(finishDemolition(s,b,b.demolition.refund),true);assert.equal(w.profession,'idle');assert.equal(w.assignedWorkplaceId,null);assert.equal(plot.farmId,null);assert.equal(s.farmingSystem.records.get(plot.id).growthDays,growth);validateGameState(serializeGameState(s));
});
