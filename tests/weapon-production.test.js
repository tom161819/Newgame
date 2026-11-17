import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { storageResources } from '../src/data/logistics.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function worker(s,home,tile){const w=s.workerSystem.create(tile);if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,'hauler');return w;}
function until(s,p,max=400000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
const stock=(s,location)=>s.foodStorage.locations.get(location)?.stock??{};

test('Bow, Sword and Armor go only to an Armory; Warehouses and the Starter Stockpile never take them',()=>{
  const s=scene(),r=s.objectRegistry;
  assert.deepEqual(storageResources(r.require('armory'),r).sort(),['armor','bow','crossbow','halberd','light_armor','sword']);
  for(const id of ['warehouse','material_yard','starter_stockpile'])for(const item of ['bow','sword','armor','halberd','crossbow','light_armor'])assert.equal(storageResources(r.require(id),r).includes(item),false,`${id} ${item}`);
  assert.equal(r.require('armory').storage.capacity,40);
});

test('workshops really make one Bow, Sword and Armor from stored Wood and Iron; Haulers carry them to the Armory; Save/Load mid-way',()=>{
  let s=scene();const warehouse=building(s,'material_yard',44,44),armory=building(s,'armory',60,44);
  const shops={bowyer:building(s,'bowyer',50,50),swordsmith:building(s,'swordsmith',54,50),armorer:building(s,'armorer',58,50)};
  s.foodStorage.deposit(`yard-${warehouse.id}`,'wood',40);s.foodStorage.deposit(`yard-${warehouse.id}`,'iron',16);
  for(const [type,b]of Object.entries(shops)){const w=worker(s,b,{x:b.x,y:b.y+3});assert.equal(w.profession,type);}
  worker(s,null,{x:46,y:48});worker(s,null,{x:47,y:48});
  until(s,()=>Object.values(shops).every(b=>s.foodProduction.records.get(b.id)?.cycle));
  const saved=validateGameState(serializeGameState(s)),restored=scene(false);loadGameState(restored,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(restored)),saved);s=restored;
  until(s,()=>['bow','sword','armor'].every(item=>(stock(s,`armory-${armory.id}`)[item]??0)>=1));
  const store=stock(s,`yard-${warehouse.id}`);for(const item of ['bow','sword','armor'])assert.equal(store[item]??0,0,`${item} never in the Material Yard`);
  const receipts=[...s.resourceLedger.history,s.resourceLedger.current].flatMap(d=>d.transactions),total=source=>receipts.filter(t=>t.source===source).reduce((n,t)=>n+t.quantity,0);
  const made={bow:total('Bowyer Production'),sword:total('Swordsmith Production'),armor:total('Armorer Production')};
  for(const [item,n]of Object.entries(made)){assert.ok(n>=1,item);assert.equal(stock(s,`armory-${armory.id}`)[item]+(stock(s,`output-${shops[{bow:'bowyer',sword:'swordsmith',armor:'armorer'}[item]].id}`)[item]??0)+s.workerSystem.liveWorkers().filter(w=>w.cargo?.resource===item).reduce((a,w)=>a+w.cargo.amount,0),n,`${item}: every one made is in the Armory, a buffer or a Hauler's hands`);}
  // Each finished item consumed its recipe; at most one more batch is already inside a workshop.
  for(const [source,per,count]of [['Bowmaking',8,made.bow],['Swordsmithing',3,made.sword],['Armorsmithing',5,made.armor]]){const used=total(source);assert.ok(used>=per*count&&used<=per*(count+1),`${source}: ${used} for ${count}`);}
});
