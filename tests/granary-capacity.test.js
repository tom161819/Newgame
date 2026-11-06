import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { buildingTiles } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const scene=(starter=true)=>workerScene(undefined,{construction:true,logistics:true,starter});
function building(s,type,x=52,y=45){const definition=s.objectRegistry.require(type),b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition,x,y,tiles:buildingTiles({x,y},definition)};s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=definition.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
function fixture(){const s=scene(),b=building(s,'granary');return {s,b,id:`granary-${b.id}`,storage:s.foodStorage};}
function until(s,p,max=90000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p(),'condition not reached');}
const snapshot=s=>validateGameState(serializeGameState(s));

test('Granary has independent raw200 and food200 capacity; neither201st unit can borrow from the other group',()=>{
 const {s,id,storage}=fixture();assert.ok(storage.deposit(id,'wheat',140));assert.ok(storage.deposit(id,'flour',60));assert.equal(storage.room(id,'wheat'),0);assert.equal(storage.room(id,'bread'),200);assert.equal(storage.deposit(id,'wheat',1),false);assert.equal(storage.deposit(id,'flour',1),false);
 assert.ok(storage.deposit(id,'bread',100));assert.ok(storage.deposit(id,'meat',50));assert.ok(storage.deposit(id,'apple',50));assert.equal(storage.used(storage.locations.get(id)),400);assert.equal(storage.room(id),0);assert.equal(storage.deposit(id,'bread',1),false);assert.equal(storage.locations.get(id).legacyOverflow,0);snapshot(s);
 assert.ok(storage.withdraw(id,'wheat',1));assert.equal(storage.room(id,'flour'),1);assert.equal(storage.room(id,'bread'),0);assert.equal(storage.deposit(id,'bread',1),false);assert.ok(storage.deposit(id,'flour',1));
});
test('incoming reservations, partial deposits and cancellation share only the matching group without duplicate credit',()=>{
 const {s,id,storage}=fixture();storage.deposit(id,'wheat',195);storage.deposit(id,'bread',195);const raw=storage.reserve('capacity',id,'flour',5,'raw'),food=storage.reserve('capacity',id,'meat',5,'food');assert.ok(raw&&food);
 assert.equal(storage.reserve('capacity',id,'wheat',1,'other'),null);assert.equal(storage.reserve('capacity',id,'apple',1,'other'),null);assert.equal(storage.deposit(id,'wheat',1),false);assert.equal(storage.room(id,'bread'),0);
 assert.ok(storage.put(raw,3));assert.ok(storage.put(food,2));assert.equal(storage.room(id,'flour'),0);storage.release(raw);assert.equal(storage.room(id,'wheat'),2);assert.equal(storage.room(id,'apple'),0);assert.ok(storage.deposit(id,'flour',2));assert.ok(storage.put(food,3));assert.equal(storage.put(food,1),false);assert.equal(storage.put(raw,2),false);assert.equal(storage.used(storage.locations.get(id)),400);snapshot(s);
});
test('each Granary has its own groups; Warehouse, Starter Stockpile and production buffers retain shared limits',()=>{
 const {s,id,storage}=fixture(),other=building(s,'granary',58,45),warehouse=building(s,'warehouse',64,45),bakery=building(s,'bakery',70,45),starter=[...storage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('wheat'));
 storage.deposit(id,'wheat',200);assert.equal(storage.room(`granary-${other.id}`,'wheat'),200);assert.equal(storage.room(`granary-${other.id}`,'bread'),200);
 assert.ok(storage.deposit(`warehouse-${warehouse.id}`,'wood',150));assert.ok(storage.deposit(`warehouse-${warehouse.id}`,'stone',50));assert.equal(storage.room(`warehouse-${warehouse.id}`,'iron'),0);assert.equal(storage.groups(`warehouse-${warehouse.id}`),null);
 assert.ok(storage.deposit(starter.id,'wheat',20));assert.ok(storage.deposit(starter.id,'bread',20));assert.equal(storage.room(starter.id,'apple'),0);assert.ok(storage.deposit(`input-${bakery.id}`,'flour',20));assert.equal(storage.room(`input-${bakery.id}`,'flour'),0);snapshot(s);
});
test('two Haulers cannot overbook food capacity when raw is full; real reserved transport survives a loaded roundtrip',()=>{
 const {s,id,storage}=fixture(),starter=[...storage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('bread'));storage.deposit(id,'wheat',200);storage.deposit(id,'bread',194);storage.deposit(starter.id,'bread',12);
 const workers=[{x:48,y:43},{x:49,y:43}].map(tile=>{const w=s.workerSystem.create(tile);assert.ok(s.workerSystem.jobs.assign(w,'hauler'));return w;});let saved;
 until(s,()=>{const group=storage.groups(id).food;assert.ok(group.used+group.incoming<=200);if(!saved&&workers.some(w=>w.cargo?.resource==='bread'))saved=snapshot(s);return storage.locations.get(id).stock.bread===200&&workers.every(w=>!w.cargo);});
 assert.ok(saved);assert.equal(storage.locations.get(starter.id).stock.bread,6);assert.equal(s.inventory.count('bread'),206);assert.equal(storage.locations.get(id).stock.wheat,200);snapshot(s);
 const r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(serializeGameState(r),saved);until(r,()=>r.foodStorage.locations.get(id).stock.bread===200&&r.workerSystem.liveWorkers().every(w=>!w.cargo));assert.equal(r.inventory.count('bread'),206);snapshot(r);
});
test('current-schema saves preserve independent groups and reject per-group overflow even below the combined400',()=>{
 const {s,id,storage}=fixture();storage.deposit(id,'wheat',200);storage.deposit(id,'bread',200);const data=snapshot(s),r=scene(false);loadGameState(r,structuredClone(data));assert.deepEqual(serializeGameState(r),data);
 for(const stock of [{wheat:201},{bread:201},{wheat:150,flour:51},{bread:150,meat:51}]){const bad=structuredClone(data);bad.foodStorage.locations.find(l=>l.id===id).stock=stock;for(const key of Object.keys(bad.inventory))if(['wheat','bread','flour','meat'].includes(key))delete bad.inventory[key];assert.throws(()=>validateGameState(bad));assert.deepEqual(serializeGameState(s),data);}
});
test('a Bakery cannot book four food outputs into only two food slots even with all raw capacity free',()=>{
 const {s,id,storage}=fixture(),bakery=building(s,'bakery',58,45),starter=[...storage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('bread'));storage.deposit(id,'bread',198);storage.deposit(starter.id,'bread',40);storage.deposit(`input-${bakery.id}`,'flour',2);
 const w=s.workerSystem.create({x:57,y:45});s.workplaceSystem.assign(bakery,w);s.simulate(6000);assert.equal(s.foodProduction.records.get(bakery.id).cycle,null);assert.equal(storage.room(id,'wheat'),200);assert.equal(storage.room(id,'bread'),2);
 storage.withdraw(id,'bread',4);until(s,()=>s.foodProduction.records.get(bakery.id).completed===1&&!w.cargo&&s.inventory.count('bread')===238);snapshot(s);
});
