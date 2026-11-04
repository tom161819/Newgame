import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { StaffingStatus,staffingStatus } from '../src/systems/StaffingStatus.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';

globalThis.document={querySelector:()=>({textContent:''})};

function fixture(){const s=workerScene(undefined,{workplaces:true});s.events=new EventEmitter();s.workerSystem.unsubscribe();return s;}
function build(s,type='quarry',x=55,y=50){const d=s.objectRegistry.require(type);for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');return b;}

test('staffing uses actual assigned resident seats, including travelling, recovering and resting workers',()=>{
  const s=fixture(),model=new StaffingStatus(s),q=build(s),workers=Array.from({length:3},(_,i)=>s.workerSystem.create({x:45+i,y:50}));
  assert.equal(model.records.get(q.id).tone,'empty');assert.equal(model.records.get(q.id).missing,3);
  for(const [i,w]of workers.entries()){assert.equal(s.workplaceSystem.assign(q,w),true);if(i<2){assert.equal(model.records.get(q.id).count,i+1);assert.equal(model.records.get(q.id).tone,'partial');}}
  assert.equal(model.records.has(q.id),false);workers[0].workState='Recovering';workers[1].workState='Returning';workers[2].workplaceReached=false;assert.equal(staffingStatus(s,q).missing,0);model.destroy();
});
test('registry metadata excludes non-workplaces and blueprints; real world completion and removal refresh derived status',()=>{
  const s=fixture(),q=build(s),tower=build(s,'tower',60,50),model=new StaffingStatus(s);assert.equal(staffingStatus(s,tower),null);
  q.construction={state:'planned'};s.events.emit('buildings:changed');assert.equal(model.records.has(q.id),false);q.construction.state='complete';s.events.emit('buildings:changed');assert.equal(model.records.get(q.id).missing,3);
  s.buildings.splice(s.buildings.indexOf(q),1);s.events.emit('buildings:changed');assert.equal(model.records.size,0);model.destroy();assert.equal(s.events.listenerCount('buildings:changed'),0);
});
test('reassignment, profession changes and death update both workplaces without stealing other seats',()=>{
  const s=fixture(),q=build(s),bakery=build(s,'bakery',60,50),model=new StaffingStatus(s),w=s.workerSystem.create({x:46,y:50});s.workplaceSystem.assign(q,w);assert.equal(model.records.get(q.id).count,1);
  s.workplaceSystem.assign(bakery,w);assert.equal(model.records.get(q.id).count,0);assert.equal(model.records.get(bakery.id).count,1);s.workerSystem.jobs.assign(w,'idle');assert.equal(model.records.get(bakery.id).count,0);
  s.workplaceSystem.assign(q,w);w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);assert.equal(model.records.get(q.id).count,0);assert.equal(s.workplaceSystem.records.get(q.id).workerIds.length,0);model.destroy();
});
test('derived indicators do not mutate or duplicate Save10 and reconstruct from imported workplace seats',()=>{
  const s=fixture(),q=build(s),w=s.workerSystem.create({x:46,y:50});s.workplaceSystem.assign(q,w);const before=validateGameState(serializeGameState(s)),model=new StaffingStatus(s);assert.deepEqual(serializeGameState(s),before);assert.equal(Object.hasOwn(before,'staffingIndicators'),false);
  const r=fixture(),restored=new StaffingStatus(r);loadGameState(r,before);assert.equal(restored.records.get(q.id).count,1);assert.equal(restored.records.get(q.id).capacity,3);assert.deepEqual(serializeGameState(r),before);model.destroy();restored.destroy();
});
test('hundreds of workplaces retain a cached status without rescanning employees until an actual event',()=>{
  const s=fixture(),d=s.objectRegistry.require('quarry');for(let id=1;id<=300;id++){const b={id,type:d.id,definition:d,x:3+(id%20)*4,y:3+Math.floor(id/20)*4};s.buildings.push(b);s.workplaceSystem.register(b);}const model=new StaffingStatus(s),checks=model.checks,revision=model.revision;assert.equal(model.records.size,300);
  for(let frame=0;frame<300;frame++)for(const status of model.records.values())assert.equal(status.missing,3);assert.equal(model.checks,checks);assert.equal(model.revision,revision);
  const w=s.workerSystem.create({x:42,y:40});s.workplaceSystem.assign(s.buildings[0],w);assert.equal(model.checks,checks+1);assert.equal(model.records.get(s.buildings[0].id).count,1);model.destroy();
});
