import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { placeBuilding } from '../src/game/buildings.js';
import { EmploymentSystem } from '../src/systems/EmploymentSystem.js';

globalThis.document={querySelector(){return {};}};
const world=(extra={})=>workerScene(undefined,{workplaces:true,logistics:true,construction:true,gameSettings:gameSettings({fogOfWar:false,startingWood:0,startingStone:0,startingApples:0,startingMeat:0}),...extra});
const until=(s,p,limit=30000)=>{for(let n=0;n<limit&&!p();n+=50)s.tick(50);assert.ok(p(),'condition reached');};
const total=(s,id)=>[...s.foodStorage.locations.values()].reduce((n,l)=>n+(l.stock[id]??0),0)+s.workerSystem.liveWorkers().reduce((n,w)=>n+(w.cargo?.resource===id?w.cargo.amount:0),0)+[...s.dropSystem.drops.values()].reduce((n,d)=>n+(d.resource===id?d.amount:0),0);

test('Move reaches its target, holds for a full AI interval, and Resume returns to the current job',()=>{
 const s=world(),w=s.workerSystem.create({x:60,y:60});s.workerSystem.jobs.assign(w,'hauler');const c=s.workerSystem.commands;
 assert.equal(c.move([w],{x:65,y:60}),1);until(s,()=>w.commandState.state==='Holding');assert.deepEqual(w.tile,{x:65,y:60});s.simulate(9000);assert.deepEqual(w.tile,{x:65,y:60});assert.equal(w.workTask,null);assert.equal(w.profession,'hauler');
 c.resume(w);s.tick(50);assert.equal(w.commandState.state,'Working');assert.equal(w.profession,'hauler');assert.notEqual(w.workState,'Holding');
});

test('three units receive distinct destinations, no physical overlap, and selection does not include visitors or dead residents',()=>{
 const s=world(),ws=[0,1,2].map(y=>s.workerSystem.create({x:60,y:60+y})),visitor=s.workerSystem.create({x:60,y:63},{isSubject:false}),dead=s.workerSystem.create({x:60,y:64});dead.isAlive=false;dead.currentHP=0;s.workerSystem.onDeath(dead);
 const c=s.workerSystem.commands;assert.equal(c.move([...ws,visitor,dead],{x:68,y:61}),3);assert.equal(new Set(ws.map(w=>JSON.stringify(w.commandState.goal))).size,3);
 for(let n=0;n<350;n++){s.tick(50);assert.equal(new Set(ws.map(w=>`${w.position.x.toFixed(6)},${w.position.y.toFixed(6)}`)).size,3);}
 assert.ok(ws.every(w=>w.commandState.state==='Holding'));assert.ok(ws.every(w=>JSON.stringify(w.tile)===JSON.stringify(w.commandState.goal)));assert.equal(c.hold(visitor),false);assert.equal(c.hold(dead),false);
});

test('Hold releases a pending pickup, preserves loaded cargo once, and Resume physically returns it',()=>{
 const s=world(),w=s.workerSystem.create({x:60,y:60});s.workerSystem.jobs.assign(w,'hauler');const store=[...s.foodStorage.locations.values()].find(l=>l.kind==='fallback');s.foodStorage.deposit(store.id,'stone',10);
 assert.equal(s.foodProduction.move(w,store.id,store.id,'stone',10),false);
 const drop=s.dropSystem.create('wood',{x:62,y:60},9);assert.ok(s.foodProduction.moveGround(w,drop,store.id,9));assert.ok(s.foodStorage.reservations.size>0);
 s.workerSystem.commands.hold(w);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.byKey?.size??0,0);assert.equal(total(s,'wood'),9);
 s.workerSystem.commands.resume(w);assert.ok(s.foodProduction.moveGround(w,drop,store.id,9));until(s,()=>w.cargo?.amount===9);s.workerSystem.commands.hold(w);const before=structuredClone(w.cargo);assert.equal(s.foodStorage.reservations.size,0);s.simulate(1500);assert.deepEqual(w.cargo,before);assert.equal(total(s,'wood'),9);
 validateGameState(serializeGameState(s));s.workerSystem.commands.resume(w);until(s,()=>!w.cargo);assert.equal(total(s,'wood'),9);s.simulate(2000);assert.equal(total(s,'wood'),9);
});

test('job changes and automatic employment cannot override Hold; death drops cargo and clears the command',()=>{
 const s=world(),w=s.workerSystem.create({x:60,y:60}),c=s.workerSystem.commands;c.hold(w);s.employment=new EmploymentSystem(s);assert.equal(s.employment.available(w),false);
 s.workerSystem.jobs.assign(w,'hauler');s.tick(50);assert.equal(w.commandState.state,'Holding');assert.equal(w.workState,'Holding');w.cargo={resource:'wood',amount:4};w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);assert.equal(w.commandState.state,'Working');assert.equal(w.cargo,null);assert.equal(total(s,'wood'),4);assert.equal(c.resume(w),false);validateGameState(serializeGameState(s));
});

test('current schema round-trips moving and holding orders, cargo, and rejects malformed command state before loading',()=>{
 const s=world(),a=s.workerSystem.create({x:60,y:60}),b=s.workerSystem.create({x:60,y:62});s.workerSystem.jobs.assign(b,'hauler');b.cargo={resource:'wood',amount:3};s.workerSystem.commands.hold(b);s.workerSystem.commands.move([a],{x:68,y:60});s.tick(120);
 const saved=serializeGameState(s);assert.equal(saved.saveVersion,SAVE_VERSION);validateGameState(saved);const clone=world({starter:false});loadGameState(clone,saved);assert.deepEqual(serializeGameState(clone),saved);until(clone,()=>clone.workerSystem.workers.get(a.id).commandState.state==='Holding');assert.equal(clone.workerSystem.workers.get(b.id).cargo.amount,3);
 for(const mutate of [w=>w.commandState.state='ResumingForever',w=>w.commandState.goal={x:-1,y:0},w=>delete w.commandState]){const invalid=structuredClone(saved);mutate(invalid.workers[0]);assert.throws(()=>validateGameState(invalid));}
});

test('unknown targets do not leak hidden obstacles; a discovered blockage leads to a bounded stop',()=>{
 const a=world(),b=world();for(const s of [a,b]){s.fog.setEnabled(true);s.workerSystem.create({x:60,y:60});}b.map[60][68]=1;b.terrainGrid[60][68]=1;
 assert.equal(a.workerSystem.commands.move(a.workerSystem.liveWorkers(),{x:68,y:60}),0,'hidden units cannot be selected');
 for(const s of [a,b]){s.fog.isVisibleObject=()=>true;s.fog.isInSightTile=()=>false;s.fog.explored.fill(0);assert.equal(s.workerSystem.commands.move(s.workerSystem.liveWorkers(),{x:68,y:60}),1);}
 assert.deepEqual(a.workerSystem.liveWorkers()[0].path,b.workerSystem.liveWorkers()[0].path);
 b.simulate(18000);const w=b.workerSystem.liveWorkers()[0];assert.equal(w.commandState.state,'Holding');assert.notDeepEqual(w.tile,{x:68,y:60});assert.equal(w.path.length,0);
});

test('100 held units do not plan any route each frame',()=>{
 const s=world();for(let y=55;y<65;y++)for(let x=55;x<65;x++){const w=s.workerSystem.create({x,y});s.workerSystem.commands.hold(w);}
 let calls=0;const original=s.workerSystem.commands.navigation.bind(s.workerSystem.commands);s.workerSystem.commands.navigation=(...args)=>{calls++;return original(...args);};s.simulate(2000);assert.equal(calls,0);assert.ok(s.workerSystem.liveWorkers().every(w=>w.commandState.state==='Holding'&&!w.path.length));
});


test('Hold releases a Builder slot without losing progress; another Builder resumes the same site',()=>{
 const s=workerScene(undefined,{construction:true}),d=s.objectRegistry.require('tower');s.inventory.add('stone',d.cost.stone);
 const result=placeBuilding({map:s.map,anchor:{x:60,y:60},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const site=result.building;s.constructionSystem.plan(site);s.towerViews.set(site.id,s.createBuildingView(d,site));
 const w=s.workerSystem.create({x:59,y:60});s.workerSystem.jobs.assign(w,'builder');until(s,()=>site.construction.workDone>500);const work=site.construction.workDone;s.workerSystem.commands.hold(w);
 assert.equal(s.constructionSystem.assignments.has(w.id),false);assert.equal(site.construction.assignedBuilders.includes(w.id),false);s.simulate(500);assert.equal(site.construction.workDone,work);validateGameState(serializeGameState(s));
 const replacement=s.workerSystem.create({x:60,y:59});s.workerSystem.jobs.assign(replacement,'builder');until(s,()=>site.construction.workDone>work+500);assert.equal(w.commandState.state,'Holding');assert.ok(site.construction.assignedBuilders.includes(replacement.id));
});


test('a dense group of 100 subjects can all receive orders without treating departing neighbours as permanent walls',()=>{
 const s=world(),ws=[];for(let y=55;y<65;y++)for(let x=55;x<65;x++)ws.push(s.workerSystem.create({x,y}));
 assert.equal(s.workerSystem.commands.move(ws,{x:75,y:75}),100);assert.equal(new Set(ws.map(w=>JSON.stringify(w.commandState.goal))).size,100);
 for(const w of ws)s.workerSystem.commands.hold(w);let calls=0;s.workerSystem.commands.navigation=()=>{calls++;throw Error('held route should not run');};s.simulate(2000);assert.equal(calls,0);
});


test('Hold pauses an already paid production cycle; Resume finishes it without spending its inputs twice',()=>{
 const s=workerScene(undefined,{construction:true,foodProduction:true});
 const add=(type,x,y)=>{const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;};
 add('granary',48,45);const mill=add('mill',54,45),w=s.workerSystem.create({x:53,y:44});s.workplaceSystem.assign(mill,w);s.foodStorage.deposit(`input-${mill.id}`,'wheat',4);const record=s.foodProduction.records.get(mill.id);
 until(s,()=>record.cycle?.workDone>100);const work=record.cycle.workDone,inputs=structuredClone(record.cycle.inputs);s.workerSystem.commands.hold(w);s.simulate(1500);assert.equal(record.cycle.workDone,work);assert.deepEqual(record.cycle.inputs,inputs);assert.equal(total(s,'wheat'),0);validateGameState(serializeGameState(s));
 s.workerSystem.commands.resume(w);until(s,()=>record.completed===1,60000);assert.equal(total(s,'wheat'),0);assert.equal(total(s,'flour'),mill.definition.recipe.output.flour);assert.equal(w.assignedWorkplaceId,mill.id);validateGameState(serializeGameState(s));
});
