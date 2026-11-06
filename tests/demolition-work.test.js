import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { DemolitionSystem,demolitionRefund } from '../src/systems/DemolitionSystem.js';
globalThis.document??={querySelector:()=>({textContent:''})};
function fixture({complete}={}){
 const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();let finishes=0;
 s.demolition=new DemolitionSystem(s,{complete:complete??((b,refund)=>{finishes++;s.buildings.splice(s.buildings.indexOf(b),1);return true;})});const tick=s.tick;s.tick=delta=>{tick(delta);s.demolition.update(delta);};
 const d=s.objectRegistry.require('tower');for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x:60,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);
 const worker=(x=57,y=54)=>{const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;};return {s,b:result.building,worker,finishes:()=>finishes};
}
function until(s,p,max=120000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p());}
test('demolition is a Builder job with real travel; no Builder means no work or callback',()=>{
 const {s,b,worker,finishes}=fixture();assert.equal(s.demolition.request(b),true);assert.equal(s.demolition.request(b),false);s.simulate(2000);assert.equal(b.demolition.workDone,0);assert.equal(finishes(),0);
 const w=worker();until(s,()=>w.workTask?.kind==='dismantle');assert.equal(b.demolition.workDone,0);assert.equal(s.constructionSystem.canWork(s.demolition.site(b.id),s.character),false);
 until(s,()=>b.demolition.workDone>0);assert.ok(s.constructionSystem.atSite(w,s.constructionSystem.assignments.get(w.id)));assert.ok(s.buildings.includes(b));until(s,()=>finishes()===1);s.simulate(2000);assert.equal(finishes(),1);assert.equal(s.demolition.jobs.size,0);assert.equal(w.workTask,null);
});
test('Hold/death/reassignment and cancellation release the same perimeter reservations without refunding',()=>{
 const {s,b,worker,finishes}=fixture();s.demolition.request(b);const a=worker(),c=worker(58,54);until(s,()=>b.demolition.assignedBuilders.length===2);const goals=[a.workTask.reservation,c.workTask.reservation];assert.notEqual(...goals);
 s.workerSystem.commands.hold(a);assert.equal(s.constructionSystem.assignments.has(a.id),false);assert.equal(b.demolition.assignedBuilders.includes(a.id),false);
 s.workerSystem.jobs.assign(c,'idle');assert.equal(s.constructionSystem.assignments.has(c.id),false);assert.equal(b.demolition.assignedBuilders.length,0);assert.equal(s.demolition.cancel(b.id),true);assert.equal(b.demolition,undefined);assert.ok(s.buildings.includes(b));assert.equal(finishes(),0);assert.equal(s.demolition.cancel(b.id),false);
});
test('completion waits at exact work budget for atomic lifecycle safety without duplicating work',()=>{
 let calls=0,allow=false;const {s,b,worker}=fixture({complete:(b,refund)=>{calls++;assert.deepEqual(refund,demolitionRefund(b.definition));if(!allow)return false;s.buildings.splice(s.buildings.indexOf(b),1);return true;}});s.demolition.request(b);worker();until(s,()=>calls>0);const work=b.demolition.workDone,total=Object.values(b.demolition.contributions).reduce((a,b)=>a+b,0);assert.equal(work,b.demolition.requiredWork);assert.ok(Math.abs(total-work)<1e-6);s.simulate(1000);assert.equal(b.demolition.workDone,work);assert.ok(s.buildings.includes(b));allow=true;s.tick(25);assert.equal(s.buildings.includes(b),false);const doneCalls=calls;s.simulate(1000);assert.equal(calls,doneCalls);
});
test('Castle, starter, noncanonical/unfinished targets and occupied roofs are protected; odd prices round down',()=>{
 const {s,b}=fixture();assert.deepEqual(demolitionRefund({cost:{stone:5,wood:3,gold:1}}),{stone:2,wood:1});assert.equal(s.demolition.request({...b}),false);
 assert.equal(s.demolition.request(s.buildings.find(b=>b.type==='starter_stockpile')),false);const original=b.type;b.type='castle';assert.equal(s.demolition.request(b),false);b.type=original;
 s.character.state='onTower';assert.equal(s.demolition.request(b),false);s.character.state='ground';s.constructionSystem.plan(b);assert.equal(s.demolition.request(b),false);
});

test('schema33 keeps partial demolition and shared Builder reservations; rejects corrupted refunds and old saves',async()=>{
 const {serializeGameState,validateGameState,SAVE_VERSION}=await import('../src/systems/GameStateSerializer.js'),{loadGameState}=await import('../src/systems/GameStateLoader.js');
 const {s,b,worker}=fixture();s.demolition.request(b);const w=worker();until(s,()=>b.demolition.workDone>500);const state=validateGameState(serializeGameState(s));assert.equal(state.saveVersion,SAVE_VERSION);assert.equal(SAVE_VERSION,33);
 const r=workerScene(state.terrain,{construction:true,foodProduction:true,logistics:true,starter:false});r.demolition=new DemolitionSystem(r,{complete:()=>false});loadGameState(r,structuredClone(state));assert.equal(r.demolition.jobs.get(b.id).workDone,b.demolition.workDone);assert.deepEqual(r.constructionSystem.assignments.get(w.id),s.constructionSystem.assignments.get(w.id));assert.deepEqual(validateGameState(serializeGameState(r)),state);
 for(const mutate of [s=>s.buildings.find(x=>x.id===b.id).demolition.refund.stone++,s=>s.buildings.find(x=>x.id===b.id).demolition.assignedBuilders.push('king'),s=>s.buildings.find(x=>x.id===b.id).demolition.workDone++,s=>s.workers.find(x=>x.id===w.id).workTask.targetId=9999,s=>s.saveVersion=32]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));}
});
