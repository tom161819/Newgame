import { gameSettings } from '../src/systems/GameSettings.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { ROCK_MINING as RULES } from '../src/data/rockMining.js';
import { MINING_WORK } from '../src/data/minerals.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const scene=(starter=true,terrain=undefined)=>{const s=workerScene(terrain,{naturalResources:true,ledger:true,construction:true,foodProduction:true,logistics:true,starter});s.workerSystem.unsubscribe();s.gameSettings=gameSettings({dayLengthSeconds:240});s.gameTime.dayDuration=240000;return s;};
const rocks=s=>s.naturalResources.miningWork.rocks;
function rock(s,x=60,y=50){const tile={x,y};s.terrainGrid[y][x]=1;s.map[y][x]=1;assert.equal(rocks(s).mark(tile),true);return rocks(s).records.get(`${x},${y}`);}
function miner(s,x=50,y=50){const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'miner');return w;}
function until(s,p,max=250000){for(let elapsed=0;elapsed<max&&!p();elapsed+=50)s.tick(50);assert.ok(p());}
function add(s,type,x,y){const d=s.objectRegistry.require(type);if(type==='quarry')s.addResource(s.objectRegistry.require('stone_deposit'),{x,y},{id:`deposit-${s.naturalResources.nextDepositId++}`,kind:'deposit',remaining:80,max:160,boundBuildingId:null});ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
test('a marked rock yields exactly ten progressive physical Stones, slower than Quarry, then is removed and carried before the next',()=>{
 const s=scene(),a=rock(s),b=rock(s,65,50),w=miner(s),before=s.inventory.count('stone');assert.ok(RULES.duration>MINING_WORK.quarry.duration);
 until(s,()=>a.produced===1);assert.equal(s.inventory.count('stone'),before);assert.equal(s.dropSystem.drops.get(a.dropId).amount,1);assert.equal(s.terrainGrid[50][60],1);validateGameState(serializeGameState(s));
 until(s,()=>a.produced===10);assert.equal(s.terrainGrid[50][60],0);assert.equal(s.map[50][60],0);assert.equal(s.dropSystem.drops.get(a.dropId).amount,10);assert.equal(b.produced,0);validateGameState(serializeGameState(s));
 until(s,()=>s.inventory.count('stone')===before+10);assert.equal(b.produced,0);until(s,()=>b.produced>0);assert.equal(a.produced,10);
 const receipts=[s.resourceLedger.current,...s.resourceLedger.history].flatMap(d=>d.transactions).filter(t=>t.source==='Manual Rock Mining'&&t.entityId===a.id);assert.equal(receipts.reduce((n,t)=>n+t.quantity,0),10);validateGameState(serializeGameState(s));assert.equal(w.assignedWorkplaceId,null);
});
test('no free Miner does no work; employed Quarry Miner is never taken from the workplace',()=>{
 const s=scene(),r=rock(s),quarry=add(s,'quarry',70,50),w=miner(s);s.workplaceSystem.assign(quarry,w);s.simulate(50000);assert.equal(r.produced,0);assert.equal(r.workDone,0);assert.equal(w.assignedWorkplaceId,quarry.id);
});
test('cancelling and remarking preserves partial work and goods, while manual Hold and job changes release claims',()=>{
 const s=scene(),r=rock(s),w=miner(s);until(s,()=>r.produced===2&&r.workDone>1000);const amount=r.produced,work=r.workDone;assert.equal(rocks(s).mark(r.tile,false),true);s.simulate(3000);assert.equal(r.produced,amount);assert.equal(r.workDone,work);assert.equal(w.workTask,null);assert.equal(w.manualRockId,null);assert.equal(s.dropSystem.drops.get(r.dropId).amount,2);validateGameState(serializeGameState(s));
 rocks(s).mark(r.tile);until(s,()=>w.workTask?.kind==='mineRock');s.workerSystem.commands.hold(w);assert.equal(w.manualRockId,null);assert.equal(s.workerSystem.reservations.owners.has(`rock:${r.id}`),false);s.workerSystem.commands.resume(w);until(s,()=>r.produced===3);s.workerSystem.jobs.assign(w,'hauler');assert.equal(w.manualRockId,null);assert.equal(w.workTask,null);validateGameState(serializeGameState(s));
});
test('blocked rock, invisible rock and full storage fail safely without spending or losing physical output',()=>{
 const s=scene(),r=rock(s),w=miner(s);for(const p of rocks(s).goals(r,w))s.map[p.y][p.x]=1;s.simulate(5000);assert.equal(r.produced,0);assert.equal(w.workTask,null);assert.equal(rocks(s).mark({x:-1,y:-1}),false);
 for(const p of [{x:59,y:50},{x:61,y:50},{x:60,y:49},{x:60,y:51}])s.map[p.y][p.x]=0;
 for(const l of s.foodStorage.locations.values())if(l.allowed.includes('stone'))l.capacity=s.foodStorage.used(l);until(s,()=>r.produced===10);s.simulate(5000);assert.equal(s.dropSystem.drops.get(r.dropId).amount,10);assert.equal(w.cargo,null);assert.equal(w.manualRockId,r.id);
 const visible=s.fog.isVisibleTile;s.fog.isVisibleTile=()=>false;assert.equal(rocks(s).mark({x:65,y:50}),false);s.fog.isVisibleTile=visible;
});
test('current Load restores partial work and active delivery without repeating production; malformed records and old schema reject',()=>{
 const s=scene(),r=rock(s),w=miner(s);until(s,()=>r.produced===3&&r.workDone>500);const state=validateGameState(serializeGameState(s)),restored=scene(false,state.terrain);loadGameState(restored,structuredClone(state));const rr=rocks(restored).records.get(r.id);assert.equal(rr.produced,3);assert.equal(rr.workDone,r.workDone);until(restored,()=>rr.produced===10);until(restored,()=>restored.workerSystem.workers.get(w.id).cargo!=null);
 const transit=validateGameState(serializeGameState(restored)),again=scene(false,transit.terrain);loadGameState(again,transit);const before=again.inventory.count('stone');until(again,()=>!again.workerSystem.workers.get(w.id).manualRockId);assert.equal(again.inventory.count('stone'),before+10);assert.equal(rocks(again).records.get(r.id).produced,10);validateGameState(serializeGameState(again));
 for(const mutate of [s=>s.saveVersion=SAVE_VERSION-1,s=>s.naturalResources.rockMining.records[0].produced=11,s=>s.naturalResources.rockMining.records.push(structuredClone(s.naturalResources.rockMining.records[0])),s=>s.workers[0].manualRockId='99,99']){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));}
});
test('two free Miners never own the same rock; Hold, death and workplace assignment release ownership without losing work',()=>{
 const s=scene(),r=rock(s),other=rock(s,65,50),a=miner(s,50,49),b=miner(s,50,51);until(s,()=>a.workTask?.kind==='mineRock'&&b.workTask?.kind==='mineRock');assert.notEqual(a.manualRockId,b.manualRockId);validateGameState(serializeGameState(s));
 s.workerSystem.commands.hold(a);assert.equal(a.manualRockId,null);const quarry=add(s,'quarry',75,50);s.workplaceSystem.assign(quarry,b);assert.equal(b.manualRockId,null);assert.equal(b.workTask,null);assert.equal(s.workerSystem.reservations.owners.has(`rock:${r.id}`),false);assert.equal(s.workerSystem.reservations.owners.has(`rock:${other.id}`),false);
 const c=miner(s);until(s,()=>c.workTask?.kind==='mineRock');const id=c.manualRockId;c.currentHP=0;c.isAlive=false;s.workerSystem.onDeath(c);assert.equal(c.manualRockId,null);assert.equal(s.workerSystem.reservations.owners.has(`rock:${id}`),false);validateGameState(serializeGameState(s));
});
test('active combat and pause stop mining; a partial-capacity destination accepts only the real reserved load',()=>{
 const s=scene(),r=rock(s),w=miner(s);until(s,()=>r.workDone>500);const work=r.workDone;s.gameTime.setPaused(true);s.simulate(1000);assert.equal(r.workDone,work);s.gameTime.setPaused(false);
 s.combat.attacks.set(w,s.character);s.simulate(500);assert.equal(r.workDone,work);assert.equal(w.workTask,null);s.combat.attacks.delete(w);until(s,()=>r.produced===10);const destination=[...s.foodStorage.locations.values()].find(l=>l.allowed.includes('stone'));s.foodStorage.deposit(destination.id,'wood',destination.capacity-s.foodStorage.used(destination)-2);until(s,()=>w.cargo!=null);assert.equal(w.cargo.amount,2);assert.equal(s.dropSystem.drops.get(r.dropId).amount,8);validateGameState(serializeGameState(s));
});
test('Hold and current Load with mined cargo keep its provenance; Resume reserves a fresh physical delivery safely',()=>{
 const s=scene(),r=rock(s),w=miner(s);until(s,()=>w.cargo!=null);const amount=w.cargo.amount;assert.equal(w.cargo.rockId,r.id);s.workerSystem.commands.hold(w);s.simulate(100);assert.equal(w.displayProfession,'miner');const held=validateGameState(serializeGameState(s)),restored=scene(false,held.terrain);loadGameState(restored,held);const worker=restored.workerSystem.workers.get(w.id);assert.equal(worker.cargo.amount,amount);assert.equal(worker.cargo.rockId,r.id);restored.workerSystem.commands.resume(worker);until(restored,()=>worker.workTask?.kind==='foodDeliver');assert.equal(worker.workTask.manualMining,true);validateGameState(serializeGameState(restored));until(restored,()=>worker.manualRockId==null&&!worker.cargo&&!rocks(restored).records.get(r.id).marked);assert.equal(restored.inventory.count('stone'),10);validateGameState(serializeGameState(restored));
});
test('after cleared output is built over, resumed mining chooses another open adjacent output tile',()=>{
 const s=scene(),r=rock(s),w=miner(s);until(s,()=>r.produced===1);const old={...r.outputTile};s.workerSystem.commands.move([w],{x:48,y:45});until(s,()=>w.commandState.state==='Holding');const hauler=s.workerSystem.create({x:50,y:45});s.workerSystem.jobs.assign(hauler,'hauler');hauler.stoneCollection={enabled:false,radius:80};until(s,()=>s.inventory.count('stone')===1);assert.equal(s.dropSystem.drops.has(r.dropId),false);
 add(s,'wall',old.x,old.y);s.workerSystem.commands.resume(w);until(s,()=>r.produced===2);assert.notDeepEqual(r.outputTile,old);const drop=s.dropSystem.drops.get(r.dropId);assert.equal(s.map[drop.tile.y][drop.tile.x],0);validateGameState(serializeGameState(s));
});
