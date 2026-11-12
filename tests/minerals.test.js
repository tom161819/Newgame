import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,placementError,towerNeighbors } from '../src/game/buildings.js';
import { reachableTiles } from '../src/game/pathfinding.js';
import { treeState } from '../src/data/naturalResources.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { captureMapKnowledge } from '../src/game/mapMemoryObjects.js';
import { LOGISTICS_RULES } from '../src/data/logistics.js';

globalThis.document={querySelector:()=>({textContent:''})};
function fixture(starter=true){const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;}
function deposit(s,type='stone_deposit',tile={x:49,y:44},remaining=80){const max=type==='stone_deposit'?160:60,n={id:`deposit-${s.naturalResources.nextDepositId++}`,kind:'deposit',remaining,max,boundBuildingId:null};s.addResource(s.objectRegistry.require(type),tile,n);return s.naturalResources.byId.get(n.id);}
function building(s,type='quarry',anchor={x:47,y:43}){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;}
function worker(s,b){for(let y=46;y<55;y++)for(let x=40;x<45;x++)if(s.map[y][x]===0&&!s.reservedTiles().some(t=>t.x===x&&t.y===y)){const w=s.workerSystem.create({x,y});assert.ok(s.workplaceSystem.assign(b,w));return w;}throw Error('No worker location');}
// m-sklady-materialu-koncept (49): miners drop output on the building's pile; a Hauler (no idle stone pickup) takes it to a store.
function hauler(s){for(let y=46;y<55;y++)for(let x=40;x<45;x++)if(s.map[y][x]===0&&!s.reservedTiles().some(t=>t.x===x&&t.y===y)&&!s.workerSystem.liveWorkers().some(w=>w.tile.x===x&&w.tile.y===y)){const w=s.workerSystem.create({x,y});assert.ok(s.workerSystem.jobs.assign(w,'hauler'));w.stoneCollection={...w.stoneCollection,enabled:false};return w;}throw Error('No hauler location');}
function until(s,condition,limit=80000){for(let elapsed=0;elapsed<limit&&!condition();elapsed+=50)s.tick(50);assert.ok(condition(),JSON.stringify(s.workerSystem.liveWorkers().map(w=>({task:w.workTask,cargo:w.cargo,message:w.workMessage}))));}
function error(s,type,anchor){return placementError(s.map,anchor,s.resourceOccupancy,s.reservedTiles(),s.objectRegistry.require(type),s.buildings);}
function total(s,r){return s.inventory.count(r)+[...s.foodStorage.locations.values()].filter(l=>l.kind==='pile').reduce((n,l)=>n+(l.stock[r]??0),0)+[...s.dropSystem.drops.values()].filter(d=>d.resource===r).reduce((n,d)=>n+d.amount,0)+s.workerSystem.liveWorkers().filter(w=>w.cargo?.resource===r).reduce((n,w)=>n+w.cargo.amount,0);}

test('four Stone, three Iron and three large (3 × 3) deposits preserve all original reachable terrain and existing forests',()=>{
  const s=fixture();let seed=77123;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);s.naturalResources.generate(random);const before=reachableTiles(s.map,[s.character.tile]).length;
  assert.equal(s.naturalResources.mining.generate(random),10);const ds=s.naturalResources.mining.deposits(),of=type=>ds.filter(d=>d.type===type).length;
  assert.deepEqual([of('stone_deposit'),of('iron_deposit'),of('stone_deposit_large'),of('iron_deposit_large')],[4,3,2,1]);assert.equal(s.naturalResources.byId.size,210);assert.equal(reachableTiles(s.map,[s.character.tile]).length,before-7*4-3*9);
  for(const d of ds){assert.equal(d.tiles.length,d.type.endsWith('_large')?9:4);assert.ok(d.natural.max>=d.definition.deposit.min&&d.natural.max<=d.definition.deposit.max);assert.equal(d.natural.remaining,d.natural.max);assert.ok(towerNeighbors(d).some(t=>s.map[t.y]?.[t.x]===0));assert.ok(d.tiles.every(t=>s.resourceOccupancy.has(`${t.x},${t.y}`)));}
  const saved=validateGameState(serializeGameState(s)),r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);assert.equal(r.naturalResources.mining.deposits().length,10);
});
test('new Quarry must overlap exactly one actual finite Stone Deposit, binds once and rejects other obstacles and loose stones',()=>{
  const s=fixture(),d=deposit(s);assert.match(error(s,'quarry',{x:43,y:43}),/overlap/);s.addResource(s.objectRegistry.require('stone'),{x:44,y:44});assert.match(error(s,'quarry',{x:43,y:43}),/overlap/);const b=building(s);assert.equal(b.tiles.length,9);assert.equal(b.quarryMode,'finite');assert.equal(b.depositId,d.natural.id);assert.equal(d.natural.boundBuildingId,b.id);assert.match(error(s,'quarry',{x:50,y:45}),/assigned/);validateGameState(serializeGameState(s));
  const t=fixture();deposit(t);t.terrainGrid[43][47]=t.map[43][47]=1;assert.ok(error(t,'quarry',{x:47,y:43}));
});
test('finite building placement distinguishes a missing rock from unreachable external access',()=>{
  const s=fixture();deposit(s);for(let y=42;y<=47;y++)for(let x=46;x<=51;x++)if(x===46||x===51||y===42||y===47)s.map[y][x]=s.terrainGrid[y][x]=1;
  assert.match(error(s,'quarry',{x:47,y:43}),/reachable external/);
});
test('Quarry accepts one corner or the full rock footprint while other buildings cannot use the rock exception',()=>{
  for(const anchor of [{x:47,y:42},{x:48,y:43}]){const s=fixture(),d=deposit(s);assert.equal(error(s,'quarry',anchor),null);assert.ok(error(s,'castle',anchor));const b=building(s,'quarry',anchor);assert.equal(b.depositId,d.natural.id);assert.ok(towerNeighbors(b).some(t=>s.map[t.y]?.[t.x]===0));validateGameState(serializeGameState(s));}
});
test('overlapping several rocks binds the stable primary only and never switches to the untouched secondary deposit',()=>{
  const s=fixture(),primary=deposit(s,undefined,{x:49,y:44},1),secondary=deposit(s,undefined,{x:47,y:44},80),b=building(s,'quarry',{x:48,y:43});
  assert.equal(b.depositId,primary.natural.id);assert.equal(secondary.natural.boundBuildingId,null);const saved=validateGameState(serializeGameState(s)),r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);const restored=r.buildings.find(o=>o.id===b.id);worker(r,restored);hauler(r);until(r,()=>r.inventory.count('stone')===1);r.simulate(18000);assert.equal(r.naturalResources.byId.get(secondary.natural.id).natural.remaining,80);assert.equal(restored.depositId,primary.natural.id);assert.equal(r.inventory.count('stone'),1);validateGameState(serializeGameState(r));
});
test('separate Quarries may mine distinct primary rocks whose unused edges also sit beneath their neighbour',()=>{
  const s=fixture(),a=deposit(s,undefined,{x:49,y:44},1),b=deposit(s,undefined,{x:47,y:44},1),first=building(s,'quarry',{x:48,y:43}),second=building(s,'quarry',{x:45,y:44});assert.equal(first.depositId,a.natural.id);assert.equal(second.depositId,b.natural.id);
  const saved=validateGameState(serializeGameState(s)),bad=structuredClone(saved);bad.resources.find(o=>o.natural?.id===b.natural.id).natural.boundBuildingId=first.id;assert.throws(()=>validateGameState(bad));const r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);for(const home of r.buildings.filter(o=>o.type==='quarry'))worker(r,home);hauler(r);until(r,()=>r.inventory.count('stone')===2);assert.equal(r.naturalResources.byId.get(a.natural.id).natural.remaining,0);assert.equal(r.naturalResources.byId.get(b.natural.id).natural.remaining,0);assert.equal(total(r,'stone'),2);validateGameState(serializeGameState(r));
});
test('Iron Mine costs 20 Wood (owner price 0.49), has three Miners and stands over a visible unbound Iron Deposit (m-dul-na-lozisku)',()=>{
  const s=fixture(),d=deposit(s,'iron_deposit',{x:51,y:44},60);assert.match(error(s,'iron_mine',{x:45,y:43}),/overlap/);assert.equal(error(s,'iron_mine',{x:50,y:43}),null);
  s.fog.setEnabled(true);assert.ok(error(s,'iron_mine',{x:50,y:43}));s.fog.setEnabled(false);const b=building(s,'iron_mine',{x:50,y:43});assert.deepEqual(b.definition.cost,{wood:20});assert.equal(b.definition.workplace.capacity,3);assert.equal(d.natural.boundBuildingId,b.id);assert.equal(s.inventory.count('stone'),0);assert.equal(s.inventory.count('wood'),0);assert.equal(s.foodStorage.manages('iron_ore'),true);assert.notEqual(s.objectRegistry.require('iron_ore').id,'iron');
  assert.ok(error(s,'iron_mine',{x:50,y:43}),'the deposit is bound now');
});
test('m-dul-na-lozisku: an Iron Mine of an older save beside its deposit keeps working it (miningMode adjacent)',()=>{
  const s=fixture(),d=deposit(s,'iron_deposit',{x:51,y:44},60),b=building(s,'iron_mine',{x:50,y:43});const data=validateGameState(serializeGameState(s));
  const old=structuredClone(data),mine=old.buildings.find(x=>x.id===b.id),dep=old.resources.find(r=>r.natural?.id===d.natural.id);dep.tile={x:54,y:44};
  const v=validateGameState(old);assert.equal(v.buildings.find(x=>x.id===b.id).miningMode,'adjacent');void mine;
});
test('three Miners reserve only two remaining units, mine at reachable external slots and physically deliver without extra pickup XP',()=>{
  const s=fixture(),d=deposit(s,undefined,undefined,2),b=building(s),ws=Array.from({length:3},()=>worker(s,b));deposit(s,'stone_deposit',{x:65,y:50},80);hauler(s);s.addResource(s.objectRegistry.require('stone'),{x:52,y:48});until(s,()=>s.naturalResources.miningWork.claims(d.natural.id)===2);assert.equal(d.natural.remaining,2);assert.equal(s.inventory.count('stone'),0);assert.equal(new Set(ws.filter(w=>w.workTask).map(w=>`${w.workTask.goal.x},${w.workTask.goal.y}`)).size,2);
  until(s,()=>d.natural.remaining<2);assert.equal(s.inventory.count('stone'),0);assert.equal(total(s,'stone')+d.natural.remaining,2);until(s,()=>s.inventory.count('stone')===2);s.simulate(15000);assert.equal(d.natural.remaining,0);assert.equal(total(s,'stone'),2);assert.equal(ws.reduce((n,w)=>n+w.experience.totalXP,0),10);assert.equal(ws.reduce((n,w)=>n+w.skills.mining.totalXP,0),10);assert.ok(b.depleted,'m-vytezeny-dul-ctverecky: the exhausted Quarry is depleted');assert.ok(ws.every(w=>w.assignedWorkplaceId!==b.id),'its Miners left');assert.equal(s.foodStorage.reservations.size,0);validateGameState(serializeGameState(s));
});
test('Iron extraction takes20 seconds at level1, talent grants only20percent Mining XP and real Ore reaches the original store',()=>{
  const s=fixture(),d=deposit(s,'iron_deposit',{x:51,y:44},1),b=building(s,'iron_mine',{x:50,y:43}),w=worker(s,b);hauler(s);w.naturalTalent='mining';until(s,()=>w.workState==='Working');const progress=w.workTask.progressMs;s.simulate(19000-progress);assert.equal(d.natural.remaining,1);assert.equal(total(s,'iron_ore'),0);until(s,()=>!!w.cargo);assert.equal(w.cargo.resource,'iron_ore');assert.equal(s.inventory.count('iron_ore'),0);assert.equal(w.experience.totalXP,8);assert.ok(Math.abs(w.skills.mining.totalXP-9.6)<1e-8);until(s,()=>s.inventory.count('iron_ore')===1);assert.equal(w.experience.totalXP,8);assert.equal(s.inventory.count('iron'),0);
});
test('mining, just-created ground material and loaded delivery roundtrip exactly without duplicated depletion, material or XP',()=>{
  for(const phase of ['mineDeposit','foodPickup','foodDeliver']){const s=fixture(),d=deposit(s,undefined,undefined,1),b=building(s),w=worker(s,b);const advance=s.foodProduction.update.bind(s.foodProduction);if(phase==='foodPickup')s.foodProduction.update=()=>{};until(s,()=>w.workTask?.kind===phase&&(phase!=='mineDeposit'||w.workTask.progressMs>2000));const saved=validateGameState(serializeGameState(s)),r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);hauler(r);until(r,()=>r.inventory.count('stone')===1);r.simulate(2000);assert.equal(r.naturalResources.byId.get(d.natural.id).natural.remaining,0);assert.equal(total(r,'stone'),1);assert.equal(r.workerSystem.workers.get(w.id).experience.totalXP,5);assert.equal(r.foodStorage.reservations.size,0);}
});
test('a full output pile prevents extraction; job change releases claims and loaded death preserves one real material',()=>{
  const s=fixture(),d=deposit(s,undefined,undefined,1),b=building(s),w=worker(s,b);const pile=`pile-${b.id}`;s.foodProduction.carryOwnOutput=()=>false;/* m-pracovnici-odnaseji-vyrobky: here as if no store had room */s.foodStorage.deposit(pile,'stone',LOGISTICS_RULES.outputPileCapacity);s.simulate(6000);assert.equal(d.natural.remaining,1);assert.equal(w.workMessage,'Output pile full');s.foodStorage.withdraw(pile,'stone',1);until(s,()=>w.workTask?.kind==='mineDeposit');s.workplaceSystem.remove(w);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);assert.equal(d.natural.remaining,1);s.workplaceSystem.assign(b,w);until(s,()=>!!w.cargo);w.currentHP=0;w.isAlive=false;s.workerSystem.onDeath(w);assert.equal(d.natural.remaining,0);assert.equal(total(s,'stone'),LOGISTICS_RULES.outputPileCapacity);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);validateGameState(serializeGameState(s));
});
test('cancelled Quarry blueprint releases its unique deposit binding and keeps every rock tile solid',()=>{
  const s=fixture(),d=deposit(s),b=building(s);s.workplaceSystem.records.delete(b.id);s.constructionSystem.plan(b);assert.ok(s.constructionSystem.cancel(b));s.naturalResources.mining.reconcile();for(const drop of [...s.dropSystem.drops.values()]){const cargo=s.dropSystem.takeForTransport(drop.id,drop.amount);s.inventory.add(cargo.resource,cargo.amount);}assert.equal(d.natural.boundBuildingId,null);assert.ok(d.tiles.every(t=>s.map[t.y][t.x]===1));assert.equal(error(s,'quarry',{x:47,y:43}),null);
});
test('cleared stumps may be built over only without ground timber and never regrow beneath finished walkable fields',()=>{
  const s=fixture();ensureBuildingPrerequisites(s,s.objectRegistry.require('wheat_field'));const tile={x:47,y:43},n=treeState(`tree-${s.naturalResources.nextId++}`,{stage:0});s.addResource(s.objectRegistry.require('oak_tree'),tile,n);assert.equal(error(s,'wheat_field',tile),null);const drop=s.dropSystem.create('wood',tile,6);assert.ok(error(s,'wheat_field',tile));s.dropSystem.takeForTransport(drop.id,6);building(s,'wheat_field',tile);s.gameTime.update(12*s.gameTime.dayDuration);assert.equal(s.naturalResources.byId.get(n.id).natural.stage,0);validateGameState(serializeGameState(s));
});
test('map memory freezes only depleted appearance and rejects leaked quantity; hidden simulation may exhaust the actual deposit',()=>{
  const s=fixture(),d=deposit(s,'iron_deposit',{x:65,y:44},1);s.fog.setEnabled(true);const remove=s.fog.registerSource('test',()=>({center:{x:65.5,y:44.5},radius:3}));captureMapKnowledge(s);remove();d.natural.remaining=0;captureMapKnowledge(s);const memory=s.mapMemory.objects.get('resource:65,44');assert.deepEqual(memory.visual,{depleted:false});const saved=validateGameState(serializeGameState(s));saved.exploration.objects.find(e=>e.key===memory.key).visual.remaining=0;assert.throws(()=>validateGameState(saved));
});
test('malformed depleted counts, nonreciprocal bindings, loose-stone fallback and excess unit claims are rejected without mutating the running world',()=>{
  const s=fixture(),d=deposit(s,undefined,undefined,2),b=building(s),ws=[worker(s,b),worker(s,b)];until(s,()=>s.naturalResources.miningWork.claims(d.natural.id)===2);const saved=validateGameState(serializeGameState(s));
  for(const change of [a=>a.resources.find(r=>r.natural?.id===d.natural.id).natural.remaining=-1,a=>a.resources.find(r=>r.natural?.id===d.natural.id).natural.remaining=1,a=>a.resources.find(r=>r.natural?.id===d.natural.id).natural.boundBuildingId=null,a=>a.buildings.find(o=>o.id===b.id).depositId='deposit-999',a=>a.workers.find(o=>o.id===ws[0].id).workTask.goal={x:b.x,y:b.y}]){const bad=structuredClone(saved);change(bad);assert.throws(()=>validateGameState(bad));assert.deepEqual(serializeGameState(s),saved);}
  const bad=structuredClone(saved),w=bad.workers.find(w=>w.id===ws[0].id);w.workTask={kind:'mine',targetId:'55,45',goal:{x:55,y:45},progressMs:0,reservation:'resource:55,45'};bad.resources.push({type:'stone',tile:{x:55,y:45}});assert.throws(()=>validateGameState(bad));
});
test('paused mining cannot reserve or extract, and blocked work access safely releases the unit and capacity',()=>{
  const s=fixture(),d=deposit(s,undefined,undefined,1),b=building(s),w=worker(s,b);until(s,()=>w.workTask?.kind==='mineDeposit'&&w.workTask.progressMs>1000);const progress=w.workTask.progressMs;s.gameTime.setPaused(true);s.naturalResources.miningWork.update(w,30000);assert.equal(w.workTask.progressMs,progress);assert.equal(d.natural.remaining,1);assert.equal(total(s,'stone'),0);s.gameTime.setPaused(false);s.map[w.workTask.goal.y][w.workTask.goal.x]=1;s.tick(50);assert.equal(w.workTask,null);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);assert.equal(d.natural.remaining,1);
});
