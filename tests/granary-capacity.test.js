import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { buildingTiles } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { GRANARY_GROUP_CAPACITY } from '../src/data/granaryCapacity.js';
import { LOGISTICS_RULES } from '../src/data/logistics.js';
const CAP=LOGISTICS_RULES.starterCapacity;
import { FARMHOUSE_STORE } from '../src/data/farming.js';
// farmhouse-store (owner 8 Nov 2026): the Granary keeps one food group; Wheat and Flour live in Farmhouse stores (RAW each).
const RAW=FARMHOUSE_STORE.capacity,FOOD=GRANARY_GROUP_CAPACITY.food;
globalThis.document={querySelector:()=>({textContent:''})};
const scene=(starter=true)=>workerScene(undefined,{construction:true,logistics:true,starter});
function building(s,type,x=52,y=45){const definition=s.objectRegistry.require(type),b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition,x,y,tiles:buildingTiles({x,y},definition)};s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=definition.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
function fixture(){const s=scene(),b=building(s,'granary');return {s,b,id:`granary-${b.id}`,storage:s.foodStorage};}
function until(s,p,max=90000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p(),'condition not reached');}
const snapshot=s=>validateGameState(serializeGameState(s));

test('the Granary keeps only food and refuses Wheat and Flour; a Farmhouse store has its own separate grain limit',()=>{
 const {s,id,storage}=fixture(),farm=building(s,'farmhouse',58,45),fid=`farmhouse-${farm.id}`;
 assert.equal(storage.deposit(id,'wheat',1),false);assert.equal(storage.deposit(id,'flour',1),false);assert.equal(storage.room(id,'wheat'),0);assert.equal(storage.room(id,'flour'),0);assert.equal(storage.reserve('capacity',id,'wheat',1,'x'),null);
 assert.ok(storage.deposit(id,'bread',FOOD-100));assert.ok(storage.deposit(id,'meat',50));assert.ok(storage.deposit(id,'apple',50));assert.equal(storage.used(storage.locations.get(id)),FOOD);assert.equal(storage.room(id),0);assert.equal(storage.deposit(id,'bread',1),false);assert.equal(storage.locations.get(id).legacyOverflow,0);
 assert.ok(storage.deposit(fid,'wheat',RAW-60));assert.ok(storage.deposit(fid,'flour',60));assert.equal(storage.room(fid,'wheat'),0);assert.equal(storage.deposit(fid,'wheat',1),false);assert.equal(storage.deposit(fid,'bread',1),false,'a Farmhouse keeps only grain');assert.equal(storage.groups(fid),null);snapshot(s);
 assert.ok(storage.withdraw(fid,'wheat',1));assert.equal(storage.room(fid,'flour'),1);assert.equal(storage.room(id,'bread'),0);assert.ok(storage.deposit(fid,'flour',1));
});
test('incoming reservations, partial deposits and cancellation share only the matching store without duplicate credit',()=>{
 const {s,id,storage}=fixture(),farm=building(s,'farmhouse',58,45),fid=`farmhouse-${farm.id}`;storage.deposit(fid,'wheat',RAW-5);storage.deposit(id,'bread',FOOD-5);const raw=storage.reserve('capacity',fid,'flour',5,'raw'),food=storage.reserve('capacity',id,'meat',5,'food');assert.ok(raw&&food);
 assert.equal(storage.reserve('capacity',fid,'wheat',1,'other'),null);assert.equal(storage.reserve('capacity',id,'apple',1,'other'),null);assert.equal(storage.deposit(fid,'wheat',1),false);assert.equal(storage.room(id,'bread'),0);
 assert.ok(storage.put(raw,3));assert.ok(storage.put(food,2));assert.equal(storage.room(fid,'flour'),0);storage.release(raw);assert.equal(storage.room(fid,'wheat'),2);assert.equal(storage.room(id,'apple'),0);assert.ok(storage.deposit(fid,'flour',2));assert.ok(storage.put(food,3));assert.equal(storage.put(food,1),false);assert.equal(storage.put(raw,2),false);assert.equal(storage.used(storage.locations.get(id)),FOOD);assert.equal(storage.used(storage.locations.get(fid)),RAW);snapshot(s);
});
test('each Granary has its own food group; Material Yard, Starter Stockpile and production buffers retain shared limits',()=>{
 const {s,id,storage}=fixture(),other=building(s,'granary',58,45),warehouse=building(s,'material_yard',64,45),bakery=building(s,'bakery',70,45),starter=[...storage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('wheat'));
 storage.deposit(id,'bread',FOOD);assert.equal(storage.room(`granary-${other.id}`,'bread'),FOOD);assert.equal(storage.room(`granary-${other.id}`,'wheat'),0);
 assert.ok(storage.deposit(`yard-${warehouse.id}`,'wood',300));assert.ok(storage.deposit(`yard-${warehouse.id}`,'stone',100));assert.equal(storage.room(`yard-${warehouse.id}`,'iron'),0);assert.equal(storage.groups(`yard-${warehouse.id}`),null);
 assert.ok(storage.deposit(starter.id,'wheat',80),'the Starter Stockpile still takes Wheat');assert.ok(storage.deposit(starter.id,'bread',CAP-80));assert.equal(storage.room(starter.id,'apple'),0);assert.ok(storage.deposit(`input-${bakery.id}`,'flour',20));assert.equal(storage.room(`input-${bakery.id}`,'flour'),0);snapshot(s);
});
test('two Haulers cannot overbook food capacity; real reserved transport survives a loaded roundtrip',()=>{
 const {s,id,storage}=fixture(),starter=[...storage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('bread'));storage.deposit(id,'bread',FOOD-6);storage.deposit(starter.id,'bread',12);
 const workers=[{x:48,y:43},{x:49,y:43}].map(tile=>{const w=s.workerSystem.create(tile);assert.ok(s.workerSystem.jobs.assign(w,'hauler'));return w;});let saved;
 until(s,()=>{const group=storage.groups(id).food;assert.ok(group.used+group.incoming<=FOOD);if(!saved&&workers.some(w=>w.cargo?.resource==='bread'))saved=snapshot(s);return storage.locations.get(id).stock.bread===FOOD&&workers.every(w=>!w.cargo);});
 assert.ok(saved);assert.equal(storage.locations.get(starter.id).stock.bread,6);assert.equal(s.inventory.count('bread'),FOOD+6);snapshot(s);
 const r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(serializeGameState(r),saved);until(r,()=>r.foodStorage.locations.get(id).stock.bread===FOOD&&r.workerSystem.liveWorkers().every(w=>!w.cargo));assert.equal(r.inventory.count('bread'),FOOD+6);snapshot(r);
});
test('current-schema saves preserve the Granary and Farmhouse stores and reject overflow or grain in a Granary',()=>{
 const {s,id,storage}=fixture(),farm=building(s,'farmhouse',58,45),fid=`farmhouse-${farm.id}`;storage.deposit(id,'bread',FOOD);storage.deposit(fid,'wheat',RAW);const data=snapshot(s),r=scene(false);loadGameState(r,structuredClone(data));assert.deepEqual(serializeGameState(r),data);
 for(const [where,stock] of [[id,{bread:FOOD+1}],[id,{bread:FOOD-50,meat:51}],[id,{bread:FOOD-1,wheat:1}],[id,{bread:FOOD-1,flour:1}],[fid,{wheat:RAW+1}],[fid,{wheat:RAW-1,bread:1}]]){const bad=structuredClone(data);bad.foodStorage.locations.find(l=>l.id===where).stock=stock;for(const key of Object.keys(bad.inventory))if(['wheat','bread','flour','meat'].includes(key))delete bad.inventory[key];assert.throws(()=>validateGameState(bad));assert.deepEqual(serializeGameState(s),data);}
});
test('a Bakery cannot book six food outputs into only two food slots',()=>{
 const {s,id,storage}=fixture(),bakery=building(s,'bakery',58,45),starter=[...storage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('bread'));storage.deposit(id,'bread',FOOD-2);storage.deposit(starter.id,'bread',CAP);storage.deposit(`input-${bakery.id}`,'flour',2);if(storage.physicalMaterials)storage.deposit(`input-${bakery.id}`,'wood',2);
 const w=s.workerSystem.create({x:57,y:45});s.workplaceSystem.assign(bakery,w);s.simulate(6000);assert.equal(s.foodProduction.records.get(bakery.id).cycle,null);assert.equal(storage.room(id,'wheat'),0);assert.equal(storage.room(id,'bread'),2);
 storage.withdraw(id,'bread',4);until(s,()=>s.foodProduction.records.get(bakery.id).completed===1&&!w.cargo&&s.inventory.count('bread')===FOOD+CAP);/* tabulka-budov-1: the batch makes 6 Bread from 1 Flour (FOOD-6 + CAP + 6) */snapshot(s);
});
