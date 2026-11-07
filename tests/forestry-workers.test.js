import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { treeState } from '../src/data/naturalResources.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { captureMapKnowledge } from '../src/game/mapMemoryObjects.js';

globalThis.document={querySelector:()=>({textContent:''})};
function fixture(starter=true){const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;}
function hut(s){const d=s.objectRegistry.require('lumberjack_hut');s.inventory.add('wood',6);const result=placeBuilding({map:s.map,anchor:{x:44,y:43},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;}
function tree(s,tile={x:49,y:45}){const n=treeState(`tree-${s.naturalResources.nextId++}`);n.ageCheckpoint=s.naturalResources.ageClock;n.growthCheckpoint=s.naturalResources.growthClock;s.addResource(s.objectRegistry.require('oak_tree'),tile,n);return s.naturalResources.byId.get(n.id);}
function worker(s,building){for(let y=46;y<55;y++)for(let x=40;x<45;x++)if(s.map[y][x]===0&&!s.reservedTiles().some(t=>t.x===x&&t.y===y)){const w=s.workerSystem.create({x,y});assert.equal(s.workplaceSystem.assign(building,w),true);return w;}throw Error('No worker fixture location.');}
function until(s,condition,limit=65000){for(let elapsed=0;elapsed<limit&&!condition();elapsed+=50)s.tick(50);assert.ok(condition(),`Unfinished forestry action: ${JSON.stringify([...s.workerSystem.workers.values()].map(w=>({state:w.workState,message:w.workMessage,task:w.workTask,cargo:w.cargo})))}`);}
const totalWood=s=>s.inventory.count('wood')+[...s.dropSystem.drops.values()].filter(d=>d.resource==='wood').reduce((n,d)=>n+d.amount,0)+s.workerSystem.liveWorkers().filter(w=>w.cargo?.resource==='wood').reduce((n,w)=>n+w.cargo.amount,0);

test('Lumberjack Hut uses 6 Wood (0.49),2×2,three actual seats and waits for blueprint completion',()=>{
  const s=fixture(),b=hut(s),d=b.definition;assert.equal(s.inventory.count('wood'),0);assert.equal(b.tiles.length,4);assert.equal(d.workRadius,18);assert.deepEqual(d.workplace,{capacity:3,profession:'woodcutter',skill:'woodcutting'});
  s.workplaceSystem.records.delete(b.id);s.constructionSystem.plan(b);const w=s.workerSystem.create({x:42,y:46});assert.equal(s.workplaceSystem.assign(b,w),false);s.tick(100);assert.equal(w.profession,'idle');assert.equal(s.inventory.count('wood'),0);
});
test('a Woodcutter reserves real tree/output capacity, approaches, cuts, picks ground Wood and walks to the original store',()=>{
  const s=fixture(),b=hut(s),t=tree(s),w=worker(s,b);until(s,()=>w.workTask?.kind==='chopTree');assert.equal(t.natural.workDone,0);assert.equal(s.foodStorage.reservations.get(w.workTask.capacityReservation).amount,6);assert.equal(s.workerSystem.reservations.owners.get(w.workTask.reservation),w.id);assert.equal(s.inventory.count('wood'),0);
  until(s,()=>w.workTask?.kind==='foodPickup');assert.equal(t.natural.stage,0);assert.equal(w.cargo,null);assert.equal([...s.dropSystem.drops.values()][0].amount,6);assert.equal(s.inventory.count('wood'),0);assert.equal(w.skills.woodcutting.totalXP,18);assert.equal(w.experience.totalXP,15);
  until(s,()=>w.cargo?.resource==='wood');assert.equal(w.cargo.amount,6);assert.equal(s.inventory.count('wood'),0);assert.equal(totalWood(s),6);until(s,()=>s.inventory.count('wood')===6);assert.equal(w.cargo,null);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workplaceSystem.records.get(b.id).delivered.wood,6);assert.deepEqual(s.naturalResources.forestry.summary(b),{known:false,trees:0,harvested:6,today:6});assert.equal(w.skills.woodcutting.totalXP,18);assert.equal(w.experience.totalXP,15);assert.ok(s.pathWear.revision>0);s.gameTime.update(s.gameTime.dayDuration-s.gameTime.elapsed);assert.equal(s.naturalResources.forestry.summary(b).today,0);assert.equal(s.naturalResources.forestry.summary(b).harvested,6);
});
test('three workers reserve different trees and work positions without duplicating timber or harvest XP',()=>{
  const s=fixture(),b=hut(s),trees=[tree(s,{x:49,y:42}),tree(s,{x:49,y:45}),tree(s,{x:47,y:48})],workers=Array.from({length:3},()=>worker(s,b));until(s,()=>workers.every(w=>w.workTask?.kind==='chopTree'));assert.equal(new Set(workers.map(w=>w.workTask.targetId)).size,3);assert.equal(new Set(workers.map(w=>`${w.workTask.goal.x},${w.workTask.goal.y}`)).size,3);
  until(s,()=>trees.every(t=>t.natural.stage===0));assert.equal(totalWood(s),18);until(s,()=>s.inventory.count('wood')===18);s.simulate(5000);assert.equal(totalWood(s),18);assert.equal(s.naturalResources.forestry.summary(b).harvested,18);for(const w of workers){assert.equal(w.experience.totalXP,15);assert.equal(w.skills.woodcutting.totalXP,18);}assert.equal(s.foodStorage.reservations.size,0);
});
test('a full store prevents a new cutting cycle; releasing capacity permits exactly one real harvest',()=>{
  const s=fixture(),b=hut(s),t=tree(s),w=worker(s,b);s.inventory.add('wood',160);s.simulate(6000);assert.equal(w.workTask,null);assert.match(w.workMessage,/storage/);assert.equal(t.natural.workDone,0);assert.equal(s.dropSystem.drops.size,0);assert.equal(w.experience.totalXP,0);s.inventory.spend('wood',6);until(s,()=>s.inventory.count('wood')===160);assert.equal(t.natural.stage,0);assert.equal(w.experience.totalXP,15);assert.equal(s.dropSystem.drops.size,0);
});
test('chopping, ground pickup and loaded delivery roundtrip exactly, without repeated input, Wood or XP',()=>{
  for(const stage of ['chopTree','foodPickup','foodDeliver']){const s=fixture(),b=hut(s),t=tree(s),w=worker(s,b);until(s,()=>w.workTask?.kind===stage&&(stage!=='chopTree'||t.natural.workDone>2500));const saved=validateGameState(serializeGameState(s)),r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);until(r,()=>r.inventory.count('wood')===6);r.simulate(500);assert.equal(totalWood(r),6);assert.equal(r.workerSystem.workers.get(w.id).experience.totalXP,15);assert.equal(r.workerSystem.workers.get(w.id).skills.woodcutting.totalXP,18);assert.equal(r.foodStorage.reservations.size,0);}
});
test('job cancellation releases work/capacity, retains partial tree work, and a loaded death leaves one recoverable cargo',()=>{
  const s=fixture(),b=hut(s),t=tree(s),w=worker(s,b);until(s,()=>t.natural.workDone>2000);const partial=t.natural.workDone;s.workplaceSystem.remove(w);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);s.simulate(500);assert.equal(t.natural.workDone,partial);assert.equal(w.experience.totalXP,0);s.workplaceSystem.assign(b,w);until(s,()=>!!w.cargo);w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);assert.equal(s.inventory.count('wood'),0);assert.equal(totalWood(s),6);assert.equal(w.experience.totalXP,15);assert.equal(s.workplaceSystem.employees(b).length,0);validateGameState(serializeGameState(s));
});
test('hut details count last-known mature trees outside sight and never reveal live hidden regrowth or felling',()=>{
  const s=fixture(),b=hut(s),t=tree(s,{x:60,y:44});s.fog.setEnabled(true);assert.equal(s.naturalResources.forestry.eligible(b).length,1);assert.equal(s.naturalResources.forestry.summary(b).trees,0);const remove=s.fog.registerSource('test',()=>({center:{x:60.5,y:44.5},radius:1}));captureMapKnowledge(s);remove();t.natural.stage=0;s.naturalResources.refreshMap(t);captureMapKnowledge(s);assert.equal(s.naturalResources.forestry.eligible(b).length,0);assert.equal(s.naturalResources.forestry.summary(b).trees,1);
});
test('regrowth waits for real ground timber rather than embedding undelivered materials in a new trunk',()=>{
  const s=fixture(),t=tree(s);t.natural.stage=2;t.natural.growthDays=4;s.naturalResources.refreshMap(t);const drop=s.dropSystem.create('wood',{x:t.x,y:t.y},6);s.gameTime.update(1000);assert.equal(t.natural.stage,2);assert.equal(s.map[t.y][t.x],0);const cargo=s.dropSystem.takeForTransport(drop.id,6);assert.equal(cargo.amount,6);s.gameTime.update(1000);assert.equal(t.natural.stage,3);assert.equal(s.map[t.y][t.x],1);
});
test('a newly blocked work position releases tree/output reservations instead of stranding a Woodcutter',()=>{
  const s=fixture(),b=hut(s),t=tree(s,{x:60,y:48}),w=worker(s,b);until(s,()=>w.workTask?.kind==='chopTree');const goal={...w.workTask.goal};s.map[goal.y][goal.x]=1;s.tick(50);assert.equal(w.workTask,null);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);assert.equal(t.natural.workDone,0);assert.equal(totalWood(s),0);
});
