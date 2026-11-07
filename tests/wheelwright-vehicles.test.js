import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { storageResources,physicalResources,carryCapacity,loadCapacity } from '../src/data/logistics.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function person(s,tile,{home=null,job=null}={}){const w=s.workerSystem.create(tile);if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,job);if(job==='hauler')w.stoneCollection={enabled:false,radius:80};return w;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
const restore=state=>{const r=scene(false);loadGameState(r,structuredClone(state));return r;};

test("the Wheelwright's Workshop: 3×3, 12 Stone + 15 Wood, two Wheelwrights; a Wheelbarrow is never a stored good",()=>{
  const s=scene(),d=s.objectRegistry.require('wheelwright_workshop');
  assert.deepEqual([d.width,d.height,d.cost,d.workplace.capacity,d.workplace.profession,d.recipe.input,d.recipe.output,d.recipe.duration],[3,3,{stone:12,wood:15},2,'wheelwright',{wood:10,iron:2},{wheelbarrow:1},30000]);
  for(const id of ['warehouse','starter_stockpile','granary','armory'])assert.equal(storageResources(s.objectRegistry.require(id),s.objectRegistry).includes('wheelbarrow'),false,id);
  assert.equal(physicalResources(s.objectRegistry).includes('wheelbarrow'),false);
  assert.deepEqual([loadCapacity({}),loadCapacity({vehicleType:'wheelbarrow'}),carryCapacity({vehicleType:'wheelbarrow'},'stone')],[40,200,20],'five times the load: 20 Stone per trip');
});

test('Wheelwrights build a real Wheelbarrow from delivered Wood and Iron; it rolls out beside the workshop; a Hauler fetches it and carries 5×',()=>{
  let s=scene();const warehouse=building(s,'warehouse',44,44),shop=building(s,'wheelwright_workshop',52,50);
  s.foodStorage.deposit(`warehouse-${warehouse.id}`,'wood',10);s.foodStorage.deposit(`warehouse-${warehouse.id}`,'iron',2);
  person(s,{x:50,y:55},{home:shop});person(s,{x:51,y:55},{home:shop});const hauler=person(s,{x:46,y:48},{job:'hauler'});
  assert.equal(s.military?true:true,true);until(s,()=>s.vehicles.vehicles.size===1);
  const [cart]=s.vehicles.vehicles.values();assert.equal(cart.type,'wheelbarrow');assert.ok(Math.abs(cart.x-shop.x)<=4&&Math.abs(cart.y-shop.y)<=4,'beside the workshop');
  const receipts=[...s.resourceLedger.history,s.resourceLedger.current].flatMap(d=>d.transactions);assert.equal(receipts.filter(t=>t.source==='Wheelwright Production').reduce((n,t)=>n+t.quantity,0),1);
  assert.equal(s.inventory.count('wood')+s.inventory.count('iron'),0,'the inputs were used once');
  until(s,()=>s.vehicles.held(hauler));assert.ok(Math.max(Math.abs(hauler.tile.x-cart.x),Math.abs(hauler.tile.y-cart.y))<=1,'taken in person, not teleported');assert.equal(hauler.vehicleType,'wheelbarrow');
  const saved=validateGameState(serializeGameState(s));s=restore(saved);assert.deepEqual(validateGameState(serializeGameState(s)),saved);
  const h=s.workerSystem.workers.get(hauler.id);assert.equal(h.vehicleType,'wheelbarrow');
  s.foodStorage.deposit(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`,'stone',20);
  until(s,()=>h.cargo?.resource==='stone');assert.equal(h.cargo.amount,20,'20 Stone in one Wheelbarrow trip');
  const mid=validateGameState(serializeGameState(s));assert.deepEqual(validateGameState(serializeGameState(restore(mid))),mid);
});

test('Hands mode parks it; death leaves it on the ground; another Hauler takes it; one vehicle never has two operators',()=>{
  const s=scene(),first=person(s,{x:50,y:50},{job:'hauler'}),second=person(s,{x:60,y:60},{job:'hauler'}),cart=s.vehicles.create('wheelbarrow',{x:52,y:50});s.vehicles.setMode(second,'hands');
  until(s,()=>s.vehicles.held(first));
  assert.equal([...s.vehicles.vehicles.values()].filter(v=>v.operatorId).length,1);
  assert.equal(s.vehicles.setMode(first,'hands'),true);assert.equal(s.vehicles.held(first),null);assert.equal(cart.state,'parked');assert.deepEqual([cart.x,cart.y],[first.tile.x,first.tile.y]);
  s.vehicles.setMode(second,'wheelbarrow');until(s,()=>s.vehicles.held(second));
  const spot={...second.tile};second.currentHP=0;second.isAlive=false;s.workerSystem.onDeath(second);
  assert.equal(cart.state,'parked');assert.deepEqual([cart.x,cart.y],[spot.x,spot.y]);assert.equal(s.vehicles.vehicles.size,1);
  s.vehicles.setMode(first,'auto');until(s,()=>s.vehicles.held(first));
  const state=validateGameState(serializeGameState(s));assert.equal(state.vehicles.vehicles.length,1);
  for(const bad of [{...state.vehicles,vehicles:[{...state.vehicles.vehicles[0],type:'cart'}]},{...state.vehicles,modes:{[first.id]:'fly'}}])assert.throws(()=>validateGameState({...structuredClone(state),vehicles:bad}));
});
