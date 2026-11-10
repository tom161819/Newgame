import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { carryCapacity,loadCapacity,TRANSPORT_MODES } from '../src/data/logistics.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function person(s,tile,{home=null,job=null}={}){const w=s.workerSystem.create(tile);if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,job);if(job==='hauler')w.stoneCollection={enabled:false,radius:80};return w;}
function stabledHorse(s,stables,tile){const h=s.animalSystem.create(s.objectRegistry.require('horse'),tile);s.stables.horses.set(h.id,{state:'stabled',stableId:stables.id});s.stables.place(h.id);return h;}
function until(s,p,max=400000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
const roundtrip=s=>{const saved=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)),saved);return r;};

test('Horse Wagon: the Wheelwright\'s second recipe, 30 Wood + 6 Iron + a tamed horse, 90 s; ten times the load',()=>{
  const s=scene(),d=s.objectRegistry.require('wheelwright_workshop');
  assert.deepEqual(Object.keys(d.recipes),['wheelbarrow','horse_wagon']);assert.equal(d.recipes.wheelbarrow,d.recipe,'the Wheelbarrow stays the default');
  assert.deepEqual([d.recipes.horse_wagon.input,d.recipes.horse_wagon.output,d.recipes.horse_wagon.duration,d.recipes.horse_wagon.horse],[{wood:30,iron:6},{horse_wagon:1},90000,true]);
  assert.ok(d.bufferCapacity>=36,'the input buffer holds a whole wagon batch');
  assert.deepEqual([loadCapacity({vehicleType:'horse_wagon'}),carryCapacity({vehicleType:'horse_wagon'},'stone'),carryCapacity({vehicleType:'horse_wagon'},'wood')],[400,40,80]);
  assert.ok(TRANSPORT_MODES.includes('horse_wagon'));
});

test('no tamed horse, no wagon: the batch waits without using materials; then the horse is reserved, harnessed and leaves the Stables; Save/Load mid-batch',()=>{
  let s=scene();const warehouse=building(s,'material_yard',40,44),shop=building(s,'wheelwright_workshop',52,50),stables=building(s,'stables',60,40);
  s.foodStorage.deposit(`yard-${warehouse.id}`,'wood',30);s.foodStorage.deposit(`yard-${warehouse.id}`,'iron',6);
  const a=person(s,{x:50,y:55},{home:shop});/* tabulka-budov-1: one Wheelwright a workshop */
  assert.equal(s.foodProduction.setRecipe(shop.id,'horse_wagon'),true);assert.equal(s.foodProduction.setRecipe(shop.id,'cart'),false);
  until(s,()=>a.workMessage==='Waiting for a tamed horse in the Stables');
  s.tick(5000);assert.equal(s.foodProduction.records.get(shop.id).cycle,null);assert.equal(s.vehicles.vehicles.size,0);
  const horse=stabledHorse(s,stables,{x:61,y:41});
  until(s,()=>s.foodProduction.records.get(shop.id).cycle);
  const cycle=s.foodProduction.records.get(shop.id).cycle;assert.deepEqual([cycle.recipe,cycle.horseId,cycle.requiredWork],['horse_wagon',horse.id,90000]);
  assert.deepEqual(s.stables.horses.get(horse.id),{state:'reserved',stableId:stables.id,workshopId:shop.id});assert.equal(s.stables.freeHorse(),null,'the horse cannot go to a Knight now');
  s.foodProduction.setRecipe(shop.id,'wheelbarrow');assert.equal(s.foodProduction.cycleRecipe(s.foodProduction.records.get(shop.id),shop).horse,true,'a running batch keeps its recipe');
  s=roundtrip(s);
  until(s,()=>s.vehicles.vehicles.size===1);
  const [wagon]=s.vehicles.vehicles.values();assert.deepEqual([wagon.type,wagon.horseId],['horse_wagon',horse.id]);
  assert.deepEqual(s.stables.horses.get(horse.id),{state:'harnessed',vehicleId:wagon.id});assert.equal(s.stables.room(stables.id),4,'the harnessed horse left its paddock place');
  assert.equal(s.animalSystem.animals.get(horse.id).isAlive,true,'the horse is never consumed');
  const receipts=[...s.resourceLedger.history,s.resourceLedger.current].flatMap(d=>d.transactions);assert.equal(receipts.filter(t=>t.source==='Wheelwright Production'&&t.resource==='horse_wagon').reduce((n,t)=>n+t.quantity,0),1);
  roundtrip(s);
});

test('a Hauler in Auto prefers the Horse Wagon to a Wheelbarrow and carries 40 Stone per trip; the horse travels with it; a dead horse leaves the wagon unusable',()=>{
  let s=scene();const stables=building(s,'stables',60,40),horse=stabledHorse(s,stables,{x:61,y:41});building(s,'material_yard',40,44);
  s.stables.reserveForWorkshop(horse.id,999);const wagon=s.vehicles.create('horse_wagon',{x:48,y:58});s.stables.horses.set(horse.id,{state:'harnessed',vehicleId:wagon.id});wagon.horseId=horse.id;
  s.vehicles.create('wheelbarrow',{x:46,y:55});const hauler=person(s,{x:46,y:56},{job:'hauler'});
  until(s,()=>s.vehicles.held(hauler));assert.equal(hauler.vehicleType,'horse_wagon','the wagon first, although the Wheelbarrow is nearer');
    s=roundtrip(s);const h=s.workerSystem.workers.get(hauler.id);assert.equal(h.vehicleType,'horse_wagon');
  s.foodStorage.deposit(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`,'stone',40);
  until(s,()=>h.cargo?.resource==='stone');assert.equal(h.cargo.amount,40,'40 Stone in one wagon trip');
  const animal=s.animalSystem.animals.get(horse.id);assert.ok(Math.hypot(animal.position.x-h.position.x,animal.position.y-h.position.y)<1.5,'the horse goes with the wagon');
  roundtrip(s);
  until(s,()=>!h.cargo);animal.currentHP=0;animal.isAlive=false;
  const v=[...s.vehicles.vehicles.values()].find(v=>v.type==='horse_wagon');until(s,()=>v.horseId===null,5000);assert.equal(s.stables.horses.has(horse.id),false);assert.equal(v.state,'parked');assert.equal(h.vehicleType,null);
  const state=validateGameState(serializeGameState(s));assert.throws(()=>validateGameState({...structuredClone(state),vehicles:{...state.vehicles,vehicles:state.vehicles.vehicles.map(x=>x.type==='horse_wagon'?{...x,horseId:horse.id}:x)}}),'a wagon cannot claim a horse that is not harnessed to it');
});

test('a cancelled wagon batch gives the horse back: the workshop is demolished mid-batch',()=>{
  const s=scene(),warehouse=building(s,'material_yard',40,44),shop=building(s,'wheelwright_workshop',52,50),stables=building(s,'stables',60,40),horse=stabledHorse(s,stables,{x:61,y:41});
  s.foodStorage.deposit(`yard-${warehouse.id}`,'wood',30);s.foodStorage.deposit(`yard-${warehouse.id}`,'iron',6);
  person(s,{x:50,y:55},{home:shop});s.foodProduction.setRecipe(shop.id,'horse_wagon');
  until(s,()=>s.stables.horses.get(horse.id)?.state==='reserved');
  s.buildings.splice(s.buildings.indexOf(shop),1);s.tick(200);
  assert.deepEqual(s.stables.horses.get(horse.id),{state:'stabled',stableId:stables.id});assert.equal(s.stables.freeHorse(),horse.id);
});
