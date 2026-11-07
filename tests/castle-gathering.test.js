import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,towerNeighbors } from '../src/game/buildings.js';
import { idleHomes } from '../src/data/idleGathering.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;};
function addExisting(s,type,x,y){const definition=s.objectRegistry.require(type),tiles=[];for(let dy=0;dy<definition.height;dy++)for(let dx=0;dx<definition.width;dx++){tiles.push({x:x+dx,y:y+dy});s.map[y+dy][x+dx]=1;}const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition,x,y,tiles};s.buildings.push(b);s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
function add(s,type,x,y){const definition=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,definition);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(definition,result.building));return result.building;}
function until(s,p,max=90000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p());}
function person(s,x,y,job='idle'){const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,job);if(job==='hauler')w.stoneCollection={enabled:false,radius:80};return w;}
const key=t=>`${t.x},${t.y}`;
test('three unemployed and three global Haulers gather at distinct Castle anchors away from doors',()=>{
 const s=scene(),castle=add(s,'castle',55,50),people=Array.from({length:6},(_,i)=>person(s,25+i*2,35,i<3?'idle':'hauler'));
 until(s,()=>people.every(w=>s.workerSystem.gather.atHome(w)));const claims=people.map(w=>s.workerSystem.gather.claims.get(w.id));assert.ok(claims.every(c=>c.homeId===castle.id));assert.equal(new Set(claims.map(c=>key(c.goal))).size,6);assert.equal(new Set(people.map(w=>key(w.tile))).size,6);
 const doors=new Set(towerNeighbors(castle).map(key));for(const w of people){assert.equal(doors.has(key(w.tile)),false);assert.equal(w.assignedWorkplaceId,null);}assert.equal(s.workplaceSystem.records.size,0);assert.ok(people.slice(3).every(w=>w.displayProfession==='hauler'));
 const positions=people.map(w=>key(w.tile));s.simulate(8000);assert.ok(people.some((w,i)=>key(w.tile)!==positions[i]));assert.equal(new Set([...s.workerSystem.gather.claims.values()].map(c=>key(c.goal))).size,6);validateGameState(serializeGameState(s));
});
test('idle Castle travel never delays a new global delivery and the Hauler returns after unloading',()=>{
 const s=scene();add(s,'castle',55,50);const warehouse=add(s,'warehouse',70,50),w=person(s,25,35,'hauler');until(s,()=>s.workerSystem.gather.claims.has(w.id));assert.ok(w.path.length>0);
 const starter=[...s.foodStorage.locations.values()].find(l=>l.kind==='fallback'&&l.buildingId!=null);s.foodStorage.deposit(starter.id,'wood',6);s.simulate(750);assert.equal(w.workTask?.kind,'foodPickup');assert.equal(s.workerSystem.gather.claims.has(w.id),false);
 until(s,()=>s.foodStorage.locations.get(`warehouse-${warehouse.id}`).stock.wood===6);assert.equal(w.assignedWorkplaceId,null);until(s,()=>s.workerSystem.gather.atHome(w));assert.equal(w.displayProfession,'hauler');validateGameState(serializeGameState(s));
});
test('multiple Castles choose a reachable one; losing it uses bounded local idle instead of crossing walls',()=>{
 // A second Castle can no longer be placed (maxCount 1), but older saves may hold two: add it as such a save would.
 const s=scene(),near=add(s,'castle',50,40),far=addExisting(s,'castle',70,50),w=person(s,30,50);
 for(let y=near.y-5;y<=near.y+7;y++)for(let x=near.x-5;x<=near.x+7;x++)if(x===near.x-5||x===near.x+7||y===near.y-5||y===near.y+7)s.map[y][x]=1;
 until(s,()=>s.workerSystem.gather.atHome(w));assert.equal(s.workerSystem.gather.claims.get(w.id).homeId,far.id);const before={...w.position};s.buildings.splice(s.buildings.indexOf(far),1);for(const t of far.tiles)s.map[t.y][t.x]=0;s.constructionSystem.revision++;
 s.simulate(1000);assert.equal(s.workerSystem.gather.claims.get(w.id).kind,'local');assert.ok(Math.hypot(w.position.x-before.x,w.position.y-before.y)<4);
 let searches=0;const navigation=s.workerSystem.navigationMap.bind(s.workerSystem);s.workerSystem.navigationMap=w=>{searches++;return navigation(w);};s.simulate(5000);assert.ok(searches<100,'unreachable Castle replans are bounded');
});
test('Move/Hold override gathering and Resume safely reacquires one idle anchor',()=>{
 const s=scene();add(s,'castle',55,50);const w=person(s,30,35);until(s,()=>s.workerSystem.gather.claims.has(w.id));assert.equal(s.workerSystem.commands.move([w],{x:20,y:20}),1);assert.equal(s.workerSystem.gather.claims.has(w.id),false);until(s,()=>w.commandState.state==='Holding');const tile={...w.tile};s.simulate(2000);assert.deepEqual(w.tile,tile);assert.equal(s.workerSystem.gather.claims.has(w.id),false);s.workerSystem.commands.resume(w);until(s,()=>s.workerSystem.gather.atHome(w));assert.equal(s.workerSystem.gather.claims.size,1);
});
test('functional job changes immediately but its uniform waits for physical arrival, including reassignment and Hold',()=>{
 const s=scene(),quarry=add(s,'quarry',60,50),other=add(s,'quarry',78,50),w=person(s,20,25);assert.equal(s.workplaceSystem.assign(quarry,w),true);assert.equal(w.profession,'miner');assert.equal(w.displayProfession,'idle');s.simulate(500);assert.equal(w.displayProfession,'idle');s.workerSystem.commands.hold(w);s.simulate(500);assert.equal(w.displayProfession,'idle');s.workerSystem.commands.resume(w);until(s,()=>w.workplaceReached);assert.equal(w.displayProfession,'miner');
 s.workerSystem.commands.hold(w);assert.equal(w.displayProfession,'miner');validateGameState(serializeGameState(s));s.workerSystem.commands.resume(w);assert.equal(s.workplaceSystem.assign(other,w),true);assert.equal(w.displayProfession,'idle');until(s,()=>w.workplaceReached);assert.equal(w.displayProfession,'miner');s.workplaceSystem.remove(w);assert.equal(w.profession,'idle');assert.equal(w.displayProfession,'idle');
});
test('unreachable employment keeps the unemployed outfit and does not wander toward a fake workplace',()=>{
 const s=scene(),quarry=add(s,'quarry',60,50),w=person(s,20,25);for(const t of towerNeighbors(quarry))s.map[t.y][t.x]=1;s.workplaceSystem.assign(quarry,w);s.simulate(5000);assert.equal(w.profession,'miner');assert.equal(w.displayProfession,'idle');assert.equal(w.workplaceReached,false);assert.deepEqual(w.tile,{x:20,y:25});
});
test('current Save/Load keeps arrived and pending uniforms, rebuilds anchors, and rejects foreign or missing outfits',()=>{
 const s=scene();add(s,'castle',55,50);const quarry=add(s,'quarry',75,60),a=person(s,30,35,'hauler'),b=person(s,20,25);s.workplaceSystem.assign(quarry,b);until(s,()=>s.workerSystem.gather.atHome(a));assert.equal(a.displayProfession,'hauler');const state=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(state));assert.equal(r.workerSystem.workers.get(a.id).displayProfession,'hauler');assert.equal(r.workerSystem.workers.get(b.id).displayProfession,b.displayProfession);assert.equal(r.workerSystem.gather.claims.size,0);assert.equal(JSON.stringify(state).includes('idle-anchor:'),false);r.simulate(1000);assert.ok(r.workerSystem.gather.claims.has(a.id));validateGameState(serializeGameState(r));
 for(const change of [s=>s.saveVersion=SAVE_VERSION-1,s=>delete s.workers[0].displayProfession,s=>s.workers[0].displayProfession='castle',s=>s.workers[0].displayProfession='baker']){const bad=structuredClone(state);change(bad);assert.throws(()=>validateGameState(bad));}
 assert.deepEqual(idleHomes(s,a).map(h=>h.kind),['castle']);assert.equal(a.assignedWorkplaceId,null);
});

test('a crowd never starts unreserved idle paths when planning is spread over frames',()=>{
 const s=scene();add(s,'castle',60,50);const people=Array.from({length:12},(_,i)=>person(s,20+i,30));s.tick(25);for(const w of people)if(w.path.length)assert.ok(s.workerSystem.gather.claims.has(w.id),'every autonomous idle path has one derived anchor owner');until(s,()=>people.every(w=>s.workerSystem.gather.atHome(w)));assert.equal(new Set(people.map(w=>key(w.tile))).size,people.length);
});
