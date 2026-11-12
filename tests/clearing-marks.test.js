import { gameSettings } from '../src/systems/GameSettings.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,placementError } from '../src/game/buildings.js';
import { placeWallLine } from '../src/game/walls.js';
import { treeState } from '../src/data/naturalResources.js';
import { importBushes } from '../src/game/worldGeneration.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
// m-oznacovani-tezby (51, 56): marking trees and bushes, and wall plans over rocks, trees and bushes.
globalThis.document??={querySelector:()=>({textContent:''})};
const scene=(starter=true,terrain=undefined)=>{const s=workerScene(terrain,{naturalResources:true,ledger:true,construction:true,foodProduction:true,logistics:true,starter});s.workerSystem.unsubscribe();s.gameSettings=gameSettings({dayLengthSeconds:240});s.gameTime.dayDuration=240000;s.bushes??=new Map();return s;};
const marks=s=>s.naturalResources.miningWork.rocks;
function until(s,p,max=250000){for(let elapsed=0;elapsed<max&&!p();elapsed+=50)s.tick(50);assert.ok(p(),JSON.stringify(s.workerSystem.liveWorkers().map(w=>[w.profession,w.workState,w.workMessage,w.workTask?.kind])));}
function rock(s,x,y){s.terrainGrid[y][x]=1;s.map[y][x]=1;}
function tree(s,tile,stage=3){const n=treeState(`tree-${s.naturalResources.nextId++}`,{stage,ageDays:stage===3?10:3});n.ageCheckpoint=s.naturalResources.ageClock;n.growthCheckpoint=s.naturalResources.growthClock;s.addResource(s.objectRegistry.require('oak_tree'),tile,n);return s.naturalResources.byId.get(n.id);}
function build(s,type,x,y){const d=s.objectRegistry.require(type);if(type==='quarry')s.addResource(s.objectRegistry.require('stone_deposit'),{x,y},{id:`deposit-${s.naturalResources.nextDepositId++}`,kind:'deposit',remaining:80,max:160,boundBuildingId:null});ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function walls(s,tiles){const d=s.objectRegistry.require('wall');ensureBuildingPrerequisites(s,d);s.inventory.add('stone',tiles.length);const result=placeWallLine({map:s.map,tiles,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),buildings:s.buildings,definition:d,inventory:s.inventory});assert.ifError(result.error);for(const b of result.buildings){s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(d,b));}return result.buildings;}
function person(s,job,x,y,home=null){const w=s.workerSystem.create({x,y});if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,job);return w;}
// m-sklady-materialu-koncept (49): timber on the hut's pile still counts.
const wood=s=>s.inventory.count('wood')+[...s.foodStorage.locations.values()].filter(l=>l.kind==='pile').reduce((n,l)=>n+(l.stock.wood??0),0)+[...s.dropSystem.drops.values()].filter(d=>d.resource==='wood').reduce((n,d)=>n+d.amount,0)+s.workerSystem.liveWorkers().filter(w=>w.cargo?.resource==='wood').reduce((n,w)=>n+w.cargo.amount,0);

test('a marked tree outside the hut radius is felled before a nearer unmarked one; a marked sapling becomes a stump without wood',()=>{
  const s=scene(),hut=build(s,'lumberjack_hut',44,43),near=tree(s,{x:49,y:45}),far=tree(s,{x:44,y:75}),sapling=tree(s,{x:47,y:70},2);
  assert.ok(Math.hypot(far.x-44.5,far.y-43.5)>hut.definition.workRadius);
  assert.equal(marks(s).markTile({x:far.x,y:far.y}),1);const w=person(s,'woodcutter',42,46,hut);
  until(s,()=>w.workTask?.kind==='chopTree');assert.equal(w.workTask.targetId,far.natural.id);validateGameState(serializeGameState(s));
  until(s,()=>far.natural.stage===0);assert.equal(marks(s).trees.has(far.natural.id),false);assert.equal(near.natural.stage,3);
  const before=wood(s);assert.equal(marks(s).markTile({x:sapling.x,y:sapling.y}),1);until(s,()=>w.workTask?.kind==='clearMark');assert.equal(w.workTask.targetId,`tree:${sapling.natural.id}`);validateGameState(serializeGameState(s));
  until(s,()=>sapling.natural.stage===0);assert.equal(marks(s).trees.size,0);assert.equal(s.map[sapling.y][sapling.x],0);
  until(s,()=>w.workTask?.kind==='chopTree'&&w.workTask.targetId===near.natural.id);assert.ok(wood(s)>=before);assert.equal(s.dropSystem.drops.size===0||[...s.dropSystem.drops.values()].every(d=>d.tile.x!==sapling.x||d.tile.y!==sapling.y),true);
});
test('a marked bush is cut by a Woodcutter and disappears with no yield; Unmark cancels a bush order',()=>{
  const s=scene(),hut=build(s,'lumberjack_hut',44,43);s.bushes.set('50,50',0);s.bushes.set('52,50',1);
  assert.equal(marks(s).markTile({x:50,y:50}),1);assert.equal(marks(s).markTile({x:52,y:50}),1);assert.equal(marks(s).markTile({x:52,y:50},false),1);assert.equal(marks(s).bushes.size,1);
  const w=person(s,'woodcutter',42,46,hut),before=wood(s),stone=s.inventory.count('stone');until(s,()=>w.workTask?.kind==='clearMark'&&w.workState==='Working');validateGameState(serializeGameState(s));
  until(s,()=>!s.bushes.has('50,50'));assert.equal(marks(s).bushes.size,0);assert.equal(wood(s),before);assert.equal(s.inventory.count('stone'),stone);assert.equal(s.bushes.has('52,50'),true);
  const state=validateGameState(serializeGameState(s));assert.equal(state.bushes.some(b=>b[0]===50&&b[1]===50),false);assert.equal(state.naturalResources.rockMining.marks,undefined);
});
test('a wall plan over a rock, a tree and a bush marks them; it is built only after a free Miner and a Woodcutter clear the site',()=>{
  const s=scene(),hut=build(s,'lumberjack_hut',44,43);rock(s,60,50);const oak=tree(s,{x:61,y:50});s.bushes.set('62,50',2);
  const tiles=[{x:59,y:50},{x:60,y:50},{x:61,y:50},{x:62,y:50}],d=s.objectRegistry.require('wall');assert.equal(placementError(s.map,{x:60,y:50},s.resourceOccupancy,[],d,s.buildings),null);assert.equal(placementError(s.map,{x:61,y:50},s.resourceOccupancy,[],d,s.buildings),null);
  assert.notEqual(placementError(s.map,{x:60,y:50},s.resourceOccupancy,[],s.objectRegistry.require('lumberjack_hut'),s.buildings),null);
  const plan=walls(s,tiles),[,onRock,onTree,onBush]=plan;
  assert.equal(marks(s).records.get('60,50').planId,onRock.id);assert.equal(marks(s).trees.get(oak.natural.id).planId,onTree.id);assert.equal(marks(s).bushes.get('62,50').planId,onBush.id);
  assert.equal(s.constructionSystem.obstructed(onRock),true);assert.equal(s.constructionSystem.obstructed(onTree),true);assert.equal(s.constructionSystem.obstructed(onBush),false);validateGameState(serializeGameState(s));
  const builder=person(s,'builder',56,52);s.simulate(20000);assert.equal(onRock.construction.workDone,0);assert.equal(onTree.construction.workDone,0);
  const miner=person(s,'miner',55,50);person(s,'woodcutter',42,46,hut);
  until(s,()=>miner.workTask?.kind==='mineRock');validateGameState(serializeGameState(s));
  until(s,()=>oak.natural.stage===0);until(s,()=>s.terrainGrid[50][60]===0);assert.equal(s.map[50][60],1);
  until(s,()=>plan.every(b=>b.construction.state==='complete'));assert.equal(s.bushes.has('62,50'),false);assert.equal(marks(s).trees.size+marks(s).bushes.size,0);
  // An idle Builder may stand on the stone drop beside his finished wall; send him away (not part of this feature).
  s.workerSystem.commands.move([builder],{x:50,y:56});until(s,()=>!marks(s).records.get('60,50').marked,900000);assert.equal(marks(s).records.get('60,50').planId,undefined);validateGameState(serializeGameState(s));
});
test('with no free Miner one Quarry Miner leaves for the rocks of a wall plan and returns; with a free Miner nobody leaves',()=>{
  const s=scene(),quarry=build(s,'quarry',70,50),a=person(s,'miner',66,52,quarry),b=person(s,'miner',66,53,quarry);rock(s,60,45);
  until(s,()=>a.workplaceReached&&b.workplaceReached);walls(s,[{x:60,y:45}]);
  until(s,()=>[a,b].some(w=>w.workTask?.kind==='mineRock'));const lent=[a,b].find(w=>w.clearingLoan),other=lent===a?b:a;assert.ok(lent);assert.ok(!other.clearingLoan);assert.equal(lent.assignedWorkplaceId,quarry.id);
  const state=validateGameState(serializeGameState(s));assert.equal(state.workers.filter(w=>w.clearingLoan).length,1);
  const restored=scene(false,state.terrain);loadGameState(restored,structuredClone(state));assert.equal(restored.workerSystem.workers.get(lent.id).clearingLoan,true);validateGameState(serializeGameState(restored));
  const bad=structuredClone(state);bad.workers.find(w=>w.id===other.id).clearingLoan=true;assert.throws(()=>validateGameState(bad));
  until(s,()=>s.terrainGrid[45][60]===0);until(s,()=>!lent.clearingLoan&&lent.manualRockId==null&&!lent.cargo);assert.equal(lent.assignedWorkplaceId,quarry.id);until(s,()=>lent.workplaceReached);validateGameState(serializeGameState(s));
  // A free Miner takes plan rocks himself; employed Miners stay at work.
  const t=scene(),q=build(t,'quarry',70,50),c=person(t,'miner',66,52,q);rock(t,60,45);until(t,()=>c.workplaceReached);const free=person(t,'miner',55,45);walls(t,[{x:60,y:45}]);
  until(t,()=>free.workTask?.kind==='mineRock');t.simulate(20000);assert.ok(!c.clearingLoan);assert.equal(c.manualRockId,null);
});
test('cancelling a wall plan removes only the marks it made; marks under a plan cannot be removed by the tool',()=>{
  const s=scene();rock(s,60,50);rock(s,61,50);const oak=tree(s,{x:62,y:50});s.bushes.set('63,50',0);
  assert.equal(marks(s).markTile({x:61,y:50}),1);const plan=walls(s,[{x:60,y:50},{x:61,y:50},{x:62,y:50},{x:63,y:50}]);
  assert.equal(marks(s).records.get('60,50').planId,plan[0].id);assert.equal(marks(s).records.get('61,50').planId,undefined);
  assert.equal(marks(s).markTile({x:60,y:50},false),0);assert.equal(marks(s).markTile({x:61,y:50},false),0);assert.equal(marks(s).records.get('61,50').marked,true);
  for(const b of plan)s.constructionSystem.cancel(b);
  assert.equal(marks(s).records.get('60,50').marked,false);assert.equal(marks(s).records.get('61,50').marked,true);assert.equal(marks(s).trees.has(oak.natural.id),false);assert.equal(marks(s).bushes.size,0);
  assert.equal(s.map[50][60],1);assert.equal(s.map[50][62],1);validateGameState(serializeGameState(s));
});
test('Save/Load keeps tree, bush and plan marks; malformed marks are rejected',()=>{
  const s=scene();rock(s,60,50);const oak=tree(s,{x:61,y:50}),pine=tree(s,{x:50,y:60});s.bushes.set('51,60',3);
  marks(s).markTile({x:50,y:60});marks(s).markTile({x:51,y:60});const [onRock,onTree]=walls(s,[{x:60,y:50},{x:61,y:50}]);
  const state=validateGameState(serializeGameState(s));
  assert.deepEqual(state.naturalResources.rockMining.marks,{trees:[{id:pine.natural.id},{id:oak.natural.id,planId:onTree.id}],bushes:[{id:'51,60'}]});
  const restored=scene(false,state.terrain);restored.bushes=importBushes(state.bushes);loadGameState(restored,structuredClone(state));
  assert.deepEqual([...marks(restored).trees.values()],[{id:pine.natural.id,planId:null},{id:oak.natural.id,planId:onTree.id}]);assert.deepEqual([...marks(restored).bushes.keys()],['51,60']);
  assert.equal(marks(restored).records.get('60,50').planId,onRock.id);assert.equal(restored.constructionSystem.obstructed(restored.buildings.find(b=>b.id===onRock.id)),true);
  assert.deepEqual(validateGameState(serializeGameState(restored)).naturalResources.rockMining,state.naturalResources.rockMining);
  for(const mutate of [x=>x.naturalResources.rockMining.marks.trees.push({id:'tree-999'}),x=>x.naturalResources.rockMining.marks.bushes.push({id:'70,70'}),x=>x.naturalResources.rockMining.marks.trees[0].planId=onRock.id,
    x=>x.naturalResources.rockMining.marks.extra=[],x=>x.naturalResources.rockMining.records[0].planId=9999,x=>x.naturalResources.rockMining.records[0].marked=false,x=>{delete x.naturalResources.rockMining.records[0].planId;x.naturalResources.rockMining.records[0].marked=false;}]){
    const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));
  }
  const old=structuredClone(state);delete old.naturalResources.rockMining.marks;validateGameState(old);
});
test('m-hornici-oznacene-skaly: marked rocks come first – of 3 Quarry Miners 2 go to 3 marked rocks, one stays; 1 Miner never leaves',()=>{
  const s=scene(),quarry=build(s,'quarry',70,50),miners=[0,1,2].map(i=>person(s,'miner',66,52+i,quarry));for(const x of [58,60,62])rock(s,x,45);
  until(s,()=>miners.every(w=>w.workplaceReached));for(const x of [58,60,62])assert.ok(marks(s).mark({x,y:45}));
  until(s,()=>miners.filter(w=>w.clearingLoan).length===2,60000);s.simulate?.(5000);
  assert.equal(miners.filter(w=>w.clearingLoan).length,2,'one Miner stays in the Quarry');
  for(const w of miners.filter(w=>w.clearingLoan))assert.equal(w.assignedWorkplaceId,quarry.id,'keeps his workplace');
  validateGameState(serializeGameState(s));
  const t=scene(),q=build(t,'quarry',70,50),only=person(t,'miner',66,52,q);rock(t,60,45);until(t,()=>only.workplaceReached);assert.ok(marks(t).mark({x:60,y:45}));
  for(let i=0;i<200;i++)t.tick(50);assert.equal(!!only.clearingLoan,false,'the only Miner stays');
});
test('m-pracovnici-odnaseji-vyrobky: with no Hauler a Quarry Miner carries stone from his full pile to the store and mines on',()=>{
  const s=scene(),quarry=build(s,'quarry',70,50),m=person(s,'miner',66,52,quarry);
  const pile=s.foodStorage.pileFor(quarry),stored=()=>[...s.foodStorage.locations.values()].filter(l=>s.foodStorage.isStock(l)).reduce((n,l)=>n+(l.stock.stone??0),0),before=stored();
  until(s,()=>stored()>before,900000);assert.ok(pile);
  validateGameState(serializeGameState(s));
});
