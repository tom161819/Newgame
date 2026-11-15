// Owner 15 Nov 2026 (59): "Move" a building – its blueprint elsewhere (it may cover the building), half the materials of
// a new one, Builders dismantle the old one (no refund) and build the new one.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { DemolitionSystem } from '../src/systems/DemolitionSystem.js';
import { finishDemolition } from '../src/game/buildingRemoval.js';
import { orderRelocation,completeRelocation,relocationCost,relocationError,canRelocate } from '../src/game/relocation.js';
globalThis.document??={querySelector:()=>({textContent:''})};
function fixture(type='house'){
  const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();
  s.demolition=new DemolitionSystem(s,{complete:(b,refund)=>{const done=finishDemolition(s,b,refund);if(done)completeRelocation(s,b);return done;}});const tick=s.tick;s.tick=delta=>{tick(delta);s.demolition.update(delta);};
  const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const result=placeBuilding({map:s.map,anchor:{x:60,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);
  for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const worker=(x=57,y=54)=>{const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;};return {s,b:result.building,d,worker};
}
function until(s,p,max=200000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p());}
const stock=(s,cost)=>Object.fromEntries(Object.keys(cost).map(id=>[id,s.inventory.count(id)]));

test('the move costs half a new building and is refused for the Castle, the stockpile, fortifications and fields',()=>{
  assert.deepEqual(relocationCost({wood:15,stone:5,gold:1}),{wood:8,stone:3,gold:1});
  const {s,b}=fixture();assert.equal(canRelocate(s,b),true);
  for(const type of ['castle','starter_stockpile','wall','tower','gate','wheat_field'])assert.equal(canRelocate(s,{...b,type,definition:s.objectRegistry.get(type)??b.definition}),false,type);
  assert.match(relocationError(s,b,{x:b.x,y:b.y}),/./,'not the same place');
});
test('beside the building: the new site stands at once for half the price; Builders dismantle the old one without refund and build the new one',async()=>{
  const {s,b,d,worker}=fixture(),before=stock(s,d.cost),half=relocationCost(d.cost);
  const r=orderRelocation(s,b,{x:60,y:56});assert.ifError(r.error);const site=r.site;assert.ok(site&&!buildingIsComplete(site));
  assert.deepEqual(site.materialSupply.required,Object.fromEntries(Object.entries(half).filter(([id])=>id in site.materialSupply.required)));assert.deepEqual(site.construction.investedMaterials,half);
  assert.deepEqual(b.relocation,{x:60,y:56,siteId:site.id});assert.deepEqual(b.demolition.refund,{},'no refund for the moved building');
  const {serializeGameState,validateGameState}=await import('../src/systems/GameStateSerializer.js');const state=validateGameState(serializeGameState(s));
  assert.deepEqual(state.buildings.find(x=>x.id===b.id).relocation,b.relocation);const bad=structuredClone(state);bad.buildings.find(x=>x.id===b.id).relocation.siteId=9999;assert.throws(()=>validateGameState(bad));
  worker();worker(58,54);until(s,()=>!s.buildings.includes(b));until(s,()=>buildingIsComplete(site),400000);
  for(const [id,n]of Object.entries(before))assert.ok(s.inventory.count(id)<=n,`${id}: nothing came back`);
});
test('over the building itself: the site waits until the old one is dismantled, then it is placed; cancelling the dismantling cancels the move',()=>{
  const {s,b,worker}=fixture(),count=()=>s.buildings.filter(x=>x.type==='house').length;
  const r=orderRelocation(s,b,{x:61,y:51});assert.ifError(r.error);assert.equal(r.site,null);assert.deepEqual(b.relocation,{x:61,y:51});assert.equal(count(),1);
  s.demolition.cancel(b.id);assert.equal(b.relocation,undefined,'cancelled with the dismantling');
  assert.ifError(orderRelocation(s,b,{x:61,y:51}).error);worker();until(s,()=>!s.buildings.includes(b));
  const site=s.buildings.find(x=>x.type==='house');assert.ok(site&&!buildingIsComplete(site)&&site.x===61&&site.y===51,'placed over the old ground');
});
