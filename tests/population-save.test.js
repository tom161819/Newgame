import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { placeBuilding } from '../src/game/buildings.js';
import { populationSummary } from '../src/ui/populationData.js';

globalThis.document={querySelector:()=>({textContent:''})};
const die=(scene,worker)=>{worker.isAlive=false;worker.currentHP=0;scene.workerSystem.onDeath(worker);};
function fixture(){const s=workerScene(undefined,{construction:true,logistics:true,seasons:true});s.workerSystem.unsubscribe();const worker=s.workerSystem.create({x:41,y:40});s.workerSystem.jobs.assign(worker,'miner');s.gameTime.update(s.gameTime.dayDuration+5000);die(s,worker);const visitor=s.workerSystem.create({x:42,y:40},{isSubject:false});s.gameTime.update(s.gameTime.dayDuration/2);return {s,worker,visitor};}
const restore=data=>{const s=workerScene(data.terrain,{construction:true,logistics:true,seasons:true,starter:false});loadGameState(s,data);s.workerSystem.unsubscribe();return s;};

test('Recent Deaths lasts three complete configured game days from the actual partial-day death and ignores pauses',()=>{
  for(const seconds of [60,120,240]){
    const s=workerScene(undefined,{gameSettings:gameSettings({dayLengthSeconds:seconds})});s.workerSystem.unsubscribe();const w=s.workerSystem.create({x:41,y:40});s.gameTime.update(12345.678901);die(s,w);const diedAt=w.diedAt;
    assert.deepEqual(s.workerSystem.recentDeaths(),[w]);assert.equal(s.workerSystem.liveSubjects().length,0);s.gameTime.setPaused(true);s.gameTime.update(seconds*1000*10);assert.equal(w.diedAt,diedAt);assert.deepEqual(s.workerSystem.recentDeaths(),[w]);s.gameTime.setPaused(false);
    s.gameTime.update(seconds*1000*3-1);assert.deepEqual(s.workerSystem.recentDeaths(),[w]);s.workerSystem.onDeath(w);assert.equal(w.diedAt,diedAt);
    s.gameTime.update(1);assert.deepEqual(s.workerSystem.recentDeaths(),[]);assert.equal(s.workerSystem.workers.get(w.id),w);
  }
});
test('Save10 keeps one worker authority, exact death age, visitor identity and old wage debts without duplicate workers or payment',()=>{
  const {s,worker,visitor}=fixture(),saved=validateGameState(serializeGameState(s)),r=restore(saved);assert.equal(saved.saveVersion,SAVE_VERSION);assert.deepEqual(serializeGameState(r),saved);
  assert.equal(saved.workers.length,2);assert.equal(Object.hasOwn(saved.population,'recentDeaths'),false);assert.equal(r.workerSystem.workers.get(visitor.id).isSubject,false);assert.equal(r.workerSystem.recentDeaths()[0].id,worker.id);assert.equal(populationSummary(r.workerSystem.workers.values()).total,0);
  assert.ok(r.wageSystem.totalUnpaid()>0);r.inventory.add('gold',10);const remaining=3*r.gameTime.dayDuration-(r.gameTime.totalElapsed-worker.diedAt);r.gameTime.update(remaining-1);assert.equal(r.workerSystem.recentDeaths().length,1);r.gameTime.update(1);assert.equal(r.workerSystem.recentDeaths().length,0);
  assert.equal(r.wageSystem.totalUnpaid(),0);assert.ok(r.inventory.count('gold')>8&&r.inventory.count('gold')<=9);assert.equal(r.workerSystem.workers.has(worker.id),true);assert.equal(r.workerSystem.workers.size,2);
});
test('visitors keep physical movement but cannot take kingdom jobs, wages, workplace seats or food',()=>{
  const s=workerScene(undefined,{workplaces:true,seasons:true});s.workerSystem.unsubscribe();const visitor=s.workerSystem.create({x:41,y:40},{isSubject:false}),d=s.objectRegistry.require('quarry');for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);
  const {building,error}=placeBuilding({map:s.map,anchor:{x:46,y:45},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(error);s.towerViews.set(building.id,s.createBuildingView(d,building));
  assert.equal(s.workerSystem.jobs.assign(visitor,'miner'),false);assert.equal(s.workplaceSystem.assign(building,visitor),false);assert.equal(s.workplaceSystem.employees(building).length,0);assert.equal(s.wageSystem.dailyWage({...visitor,profession:'soldier'}),0);
  s.inventory.add('meat',10);s.gameTime.update(s.gameTime.dayDuration);assert.equal(s.inventory.count('meat'),8);assert.equal(s.foodSystem.dailyConsumption,2);assert.equal(s.workerSystem.liveSubjects().length,0);
  assert.equal(visitor.moveTo([{x:44,y:40}]),true);const x=visitor.position.x;s.workerSystem.update(200);assert.ok(visitor.position.x>x);assert.equal(visitor.profession,'idle');assert.equal(visitor.workTask,null);
});
test('malformed current ownership/death fields are rejected before mutating the running kingdom',()=>{
  const {s}=fixture(),saved=serializeGameState(s),changes=[data=>delete data.workers[0].isSubject,data=>data.workers[0].diedAt=data.time.totalElapsed+1,data=>data.workers[0].diedAt=-1,data=>data.workers[1].diedAt=0,data=>data.workers[1].profession='miner'];
  for(const change of changes){const data=structuredClone(saved);change(data);const target=workerScene(),before=serializeGameState(target);assert.throws(()=>loadGameState(target,data));assert.deepEqual(serializeGameState(target),before);}
});
