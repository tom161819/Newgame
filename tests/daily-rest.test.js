import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding,towerNeighbors } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { DAILY_REST } from '../src/data/needs.js';
import { isRestTime } from '../src/systems/DailyRest.js';
import { POPULATION } from '../src/data/jobs.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// #58 phase B – stored homes, walking home in the last quarter of the day, resting, and back to work.
const day=s=>s.gameTime.dayDuration;
function house(s,x,y){const d=s.objectRegistry.require('house');for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);return result.building;}
function resident(s,tile={x:40,y:40}){const w=s.workerSystem.create(tile);w.arriving=false;w.workState='Idle';return w;}
const restOf=(s,w)=>s.needs.records.get(w.id)?.rest;
function until(s,p,max=120000){let n=0;while(!p()&&n<max){s.tick(50);n+=50;}assert.ok(p(),`not reached after ${n} ms`);return n;}
// Jump to just before rest time without simulating the whole day.
function toEvening(s,before=500){const target=day(s)*DAILY_REST.startFraction-before;s.simulate(Math.max(0,target-s.gameTime.elapsed));}

test('homes are stored: Houses first, then the settlement base places, none when full; kept, promoted and reassigned',()=>{
  const s=workerScene();const a=resident(s),b=resident(s,{x:41,y:40});
  let homes=s.needs.homes();assert.deepEqual([homes.get(a.id),homes.get(b.id)],[{kind:'settlement'},{kind:'settlement'}]);
  const h=house(s,60,60);homes=s.needs.homes();
  assert.deepEqual(homes.get(a.id),{kind:'house',buildingId:h.id},'the oldest settlement resident moves into the new House');
  assert.deepEqual(homes.get(b.id),{kind:'house',buildingId:h.id});
  const capacity=s.objectRegistry.require('house').housing.capacity;
  const more=Array.from({length:capacity+POPULATION.maximum},(_,i)=>resident(s,{x:20+(i%30),y:20+Math.floor(i/30)}));
  homes=s.needs.homes();
  assert.equal([...homes.values()].filter(x=>x.kind==='house').length,capacity,'a House never takes more than its capacity');
  assert.equal([...homes.values()].filter(x=>x.kind==='settlement').length,POPULATION.maximum);
  assert.equal(homes.has(more.at(-1).id),false,'nobody is left over: the last arrival has no home');
  assert.equal(s.needs.status(more.at(-1)).homeless,true);
  assert.deepEqual(s.needs.homes(),homes,'assignment is stable');
  s.buildings.splice(s.buildings.indexOf(h),1);homes=s.needs.homes();
  assert.equal([...homes.values()].some(x=>x.kind==='house'),false,'a removed House frees its residents');
  assert.equal([...homes.values()].filter(x=>x.kind==='settlement').length,POPULATION.maximum);
});

test('in the last quarter of the day a resident walks to his House, rests faster than in the open, and is back at work next day',()=>{
  const s=workerScene(),h=house(s,60,60),w=resident(s,{x:45,y:45}),homeless=Array.from({length:POPULATION.maximum+5},(_,i)=>resident(s,{x:10+i,y:80}));
  const outside=homeless.find(x=>!s.needs.homes().has(x.id));assert.ok(outside,'someone has no home');
  assert.deepEqual(s.needs.homeOf(w),{kind:'house',buildingId:h.id});
  toEvening(s);assert.equal(w.restPhase,null);
  s.simulate(600);assert.equal(isRestTime(s.gameTime),true);assert.equal(w.restPhase,'going');assert.equal(w.workState,'Going Home');
  until(s,()=>w.workState==='Resting');
  assert.ok(towerNeighbors(h).some(t=>t.x===w.tile.x&&t.y===w.tile.y),'he rests next to his House (walked there, no teleport)');
  assert.equal(w.workMessage,'Sleeping at home');assert.equal(w.sleepingIn,h.id,'m-obyvatele-jmena-spanek-pohyb (42): asleep inside');assert.equal(outside.workMessage,'Resting outdoors (no home)');assert.equal(outside.sleepingIn,null);
  s.needs.records.get(w.id).rest=10;s.needs.records.get(outside.id).rest=10;s.simulate(day(s)*.05);
  assert.ok(restOf(s,w)>restOf(s,outside)+5,`home rest ${restOf(s,w)} beats rest in the open ${restOf(s,outside)}`);
  until(s,()=>!isRestTime(s.gameTime));until(s,()=>w.restPhase===null,day(s));
  assert.ok(restOf(s,w)>=DAILY_REST.rested);assert.notEqual(w.workState,'Resting');
});

test('a resident finishes the task in hand first: cargo is delivered, nothing is cut off or duplicated',()=>{
  const s=workerScene(),w=resident(s,{x:45,y:45});house(s,60,60);
  toEvening(s,100);w.cargo={resource:'stone',amount:1};w.workTask=null;
  s.simulate(500);assert.equal(isRestTime(s.gameTime),true);
  assert.equal(w.restPhase,null,'busy with cargo: no rest yet');
  w.cargo=null;s.tick(50);assert.equal(w.restPhase,'going');
});

test('a very tired resident rests early during the day and goes back to work once rested',()=>{
  const s=workerScene(),w=resident(s,{x:45,y:45});house(s,60,60);s.simulate(1500);
  s.needs.records.get(w.id).rest=DAILY_REST.tiredBelow-5;s.tick(50);
  assert.equal(isRestTime(s.gameTime),false);assert.equal(w.restPhase,'going');
  until(s,()=>w.restPhase===null,day(s)*.7);assert.ok(restOf(s,w)>=DAILY_REST.rested);assert.equal(isRestTime(s.gameTime),false);
});

test('soldiers keep their guard and a manual Hold order wins over rest',()=>{
  const s=workerScene(),soldier=resident(s,{x:45,y:45}),held=resident(s,{x:47,y:45});soldier.profession='soldier';house(s,60,60);
  held.commandState={state:'Holding',goal:{...held.tile}};toEvening(s);s.simulate(1000);
  assert.equal(soldier.restPhase,null);assert.equal(held.restPhase,null);
  held.restPhase='resting';held.workState='Resting';s.tick(50);assert.equal(held.restPhase,null,'a resident given an order stops resting');
});

test('Save/Load mid-rest restores homes and the rest phase exactly; malformed homes are rejected',()=>{
  const s=workerScene(),h=house(s,60,60),w=resident(s,{x:45,y:45});resident(s,{x:46,y:45});
  toEvening(s);s.simulate(1200);until(s,()=>w.restPhase==='going');s.simulate(400);
  const saved=validateGameState(JSON.parse(JSON.stringify(serializeGameState(s))));
  assert.deepEqual(saved.needs.homes.map(x=>x.kind),['house','house']);
  assert.equal(saved.workers.find(x=>x.id===w.id).restPhase,w.restPhase);
  const r=workerScene(saved.terrain);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);
  const loaded=r.workerSystem.workers.get(w.id);until(r,()=>loaded.workState==='Resting');
  assert.deepEqual(r.needs.homeOf(loaded),{kind:'house',buildingId:h.id});
  const twice=structuredClone(saved);twice.needs.homes.push({...twice.needs.homes[0]});assert.throws(()=>validateGameState(twice));
  const ghost=structuredClone(saved);ghost.needs.homes[0]={id:ghost.needs.homes[0].id,kind:'house',buildingId:999};assert.throws(()=>validateGameState(ghost));
  const bad=structuredClone(saved);bad.workers[0].restPhase='sleeping';assert.throws(()=>validateGameState(bad));
});
