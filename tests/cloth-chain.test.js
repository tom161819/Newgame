import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { storageResources } from '../src/data/logistics.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { ClothingSystem } from '../src/systems/ClothingSystem.js';
import { CLOTHING,clothingHappiness } from '../src/data/clothing.js';
import { UNIT_TYPES,legacyKit } from '../src/data/military.js';
import { FARMING_RULES } from '../src/data/farming.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter,farming:true});s.workerSystem.unsubscribe();s.clothing=new ClothingSystem(s);return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function worker(s,home,tile){const w=s.workerSystem.create(tile);if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,'hauler');return w;}
function until(s,p,max=400000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
const stock=(s,location)=>s.foodStorage.locations.get(location)?.stock??{};

test('p71 data: Flax Field gives Flax into the Farmhouse store; Cloth goes to a Warehouse; the Tailor sews Light Armor from Cloth',()=>{
  const s=scene(),r=s.objectRegistry;
  assert.equal(r.require('flax_field').crop.resource,'flax');assert.ok(FARMING_RULES.crops.flax_field);
  assert.ok(storageResources(r.require('farmhouse'),r).includes('flax'));assert.ok(storageResources(r.require('warehouse'),r).includes('cloth'));
  assert.equal(storageResources(r.require('granary'),r).includes('flax'),false);
  assert.deepEqual([r.require('weaver').recipe.input,r.require('weaver').recipe.output],[{flax:3},{cloth:2}]);
  assert.deepEqual([r.require('tailor').recipe.input,r.require('tailor').recipe.output],[{cloth:3},{light_armor:1}]);
  for(const type of ['swordsman','royal_archer','crossbowman','light_cavalry'])assert.equal(UNIT_TYPES[type].equipment.armor,'light_armor',type);
  assert.deepEqual(legacyKit('swordsman'),{sword:1});assert.equal(legacyKit('crossbowman'),null);assert.equal(legacyKit('soldier'),null);
});

test('p71: the Weaver weaves Flax into Cloth, the Tailor sews it into Light Armor, Haulers carry each where it belongs',()=>{
  const s=scene(),farm=building(s,'farmhouse',30,62),warehouse=building(s,'warehouse',40,64),armory=building(s,'armory',60,64),weaver=building(s,'weaver',36,72),tailor=building(s,'tailor',46,72);
  assert.ok(s.foodStorage.deposit(`farmhouse-${farm.id}`,'flax',9)||s.foodStorage.deposit([...s.foodStorage.locations.values()].find(l=>l.buildingId===farm.id&&l.kind==='storage').id,'flax',9));
  worker(s,weaver,{x:36,y:75});worker(s,tailor,{x:46,y:75});worker(s,null,{x:42,y:68});worker(s,null,{x:43,y:68});
  until(s,()=>(stock(s,`armory-${armory.id}`).light_armor??0)>=1);
  assert.equal(s.workerSystem.liveWorkers().filter(w=>w.profession==='weaver').length,1);
});

test('p71 Clothing: clothes wear out each day, Cloth from the stores renews them, Happiness follows the level; saved',()=>{
  const s=scene(),warehouse=building(s,'warehouse',48,40);for(let i=0;i<10;i++)s.workerSystem.create({x:30+i,y:30});
  const people=s.needs.residents().length;assert.ok(people>=10);
  assert.equal(s.clothing.level,1);assert.equal(s.clothing.happiness(),CLOTHING.bonus);
  for(let d=0;d<CLOTHING.wearDays/2;d++)s.clothing.newDay(d+2);
  assert.ok(Math.abs(s.clothing.level-.5)<1e-9,'half worn after half the days');assert.equal(s.clothing.happiness(),0);
  s.foodStorage.deposit([...s.foodStorage.locations.values()].find(l=>l.buildingId===warehouse.id).id,'cloth',3);
  s.clothing.newDay(20);assert.equal(s.foodStorage.available('cloth'),0,'every Cloth was used');assert.ok(Math.abs(s.clothing.level-(.45+3/people))<1e-9);
  for(let d=0;d<30;d++)s.clothing.newDay(30+d);assert.equal(s.clothing.level,0);assert.equal(s.clothing.happiness(),-CLOTHING.penalty);
  const w=s.needs.residents()[0],status=s.needs.status(w);assert.equal(status.clothing,-CLOTHING.penalty);
  assert.equal(clothingHappiness(1),CLOTHING.bonus);
  s.clothing.level=.25;const state=validateGameState(serializeGameState(s));assert.deepEqual(state.clothing,{level:.25,warned:true});
  const t=scene(false);loadGameState(t,structuredClone(state));assert.equal(t.clothing.level,.25);
  delete state.clothing;const u=scene(false);loadGameState(u,validateGameState(state));assert.equal(u.clothing.level,1,'an older save starts clothed');
  state.clothing={level:2};assert.throws(()=>validateGameState(state));
});

test('p71: a Swordsman trained before Light Armor joined his kit stays valid; an order already training finishes with what it got',()=>{
  const s=scene(),barracks=building(s,'barracks',50,50);const w=s.workerSystem.create({x:50,y:56});assert.equal(s.workplaceSystem.assign(barracks,w),true);
  s.military.units.set(w.id,{type:'swordsman',equipment:{weapon:'sword'}});s.military.apply(w);
  const state=serializeGameState(s);assert.doesNotThrow(()=>validateGameState(state));
  const v=s.workerSystem.create({x:51,y:56});assert.equal(s.workplaceSystem.assign(barracks,v),true);
  const order={id:s.military.nextOrder++,workerId:v.id,barracksId:barracks.id,type:'swordsman',state:'training',items:{sword:1},required:UNIT_TYPES.swordsman.trainingTime,workDone:0};s.military.orders.set(order.id,order);
  const saved=validateGameState(serializeGameState(s));const t=scene(false);loadGameState(t,structuredClone(saved));
  t.military.finish(t.military.orders.get(order.id),t.workerSystem.workers.get(v.id));assert.deepEqual(t.military.units.get(v.id).equipment,{weapon:'sword'});
});
