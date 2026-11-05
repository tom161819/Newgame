import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const scene=(starter=true)=>workerScene(undefined,{construction:true,logistics:true,starter});
const until=(s,p)=>{for(let n=0;n<60000&&!p();n+=25)s.tick(25);assert.ok(p());};
const save=s=>validateGameState(serializeGameState(s));
function collect(s,tile){s.addResource(s.objectRegistry.require('stone'),tile);s.character.command({kind:'move',goal:tile,pickupKey:`${tile.x},${tile.y}`});until(s,()=>!s.resources.has(`${tile.x},${tile.y}`));}
test('multiple loose stones remain physical and stationary until an explicit order; waiting and pending delivery both roundtrip',()=>{
 const s=scene();collect(s,{x:45,y:44});collect(s,{x:46,y:44});const tile={...s.character.tile};s.simulate(3000);
 assert.deepEqual(s.character.tile,tile);assert.equal(s.character.cargo.amount,2);assert.equal(s.inventory.count('stone'),0);assert.equal(s.foodStorage.reservations.size,0);assert.equal(s.character.experience.totalXP,0);
 const data=save(s),r=scene(false);loadGameState(r,data);assert.deepEqual(serializeGameState(r),data);r.simulate(1000);assert.equal(r.kingLogistics.task,null);assert.equal(r.character.cargo.amount,2);
 assert.equal(r.kingLogistics.commandDelivery(),true);const pending=save(r),rr=scene(false);loadGameState(rr,pending);assert.deepEqual(serializeGameState(rr),pending);until(rr,()=>!rr.character.cargo);assert.equal(rr.inventory.count('stone'),2);assert.equal(rr.character.experience.totalXP,6);rr.simulate(1000);assert.equal(rr.inventory.count('stone'),2);
});
test('cancelled delivery releases capacity and keeps cargo; a new order safely resumes',()=>{
 const s=scene();collect(s,{x:47,y:46});s.kingLogistics.commandDelivery();assert.ok(s.foodStorage.reservations.size);s.kingLogistics.cancel();s.character.command({kind:'move',goal:{x:49,y:47}});s.simulate(3000);assert.equal(s.character.cargo.amount,1);assert.equal(s.inventory.count('stone'),0);assert.equal(s.foodStorage.reservations.size,0);s.kingLogistics.commandDelivery();until(s,()=>!s.character.cargo);assert.equal(s.inventory.count('stone'),1);save(s);
});
test('full or absent storage rejects delivery without consuming or dropping cargo; unlike cargo types cannot mix',()=>{
 const s=scene();collect(s,{x:45,y:44});const stocks=[...s.foodStorage.locations.values()].filter(l=>l.allowed.includes('stone'));
 for(const l of stocks)s.foodStorage.deposit(l.id,'wood',s.foodStorage.room(l.id));assert.equal(s.kingLogistics.commandDelivery(),false);assert.equal(s.character.cargo.amount,1);assert.equal(s.kingLogistics.receive({resource:'wood',amount:1}),false);assert.equal(s.character.cargo.resource,'stone');
 for(const l of stocks)s.foodStorage.locations.delete(l.id);assert.equal(s.kingLogistics.commandDelivery(),false);assert.equal(s.character.cargo.amount,1);assert.equal(s.foodStorage.reservations.size,0);
});
