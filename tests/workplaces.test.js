import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,buildingTiles } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { tileCenter } from '../src/game/isometric.js';

const scene=()=>workerScene(undefined,{workplaces:true});
const worker=(s,x=50,y=50)=>s.workerSystem.create({x,y});
const stone=(s,x,y)=>s.addResource(s.objectRegistry.require('stone'),{x,y});
function build(s,type,x=55,y=50){
  ensureBuildingPrerequisites(s,s.objectRegistry.require(type)); // #132: a Hunting Lodge needs a completed Granary first.
  Object.entries(s.objectRegistry.require(type).cost).forEach(([r,k])=>s.inventory.add(r,k));const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:s.objectRegistry.require(type)});
  assert.ok(result.building,result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(b.definition,b));return b;
}
// m-jidlo-balanc: a Rabbit leaves 7 meat (data).
const MEAT=objectRegistry.require('rabbit').gameplay.meatDrop;
function until(s,condition,max=30000){let elapsed=0;while(!condition()&&elapsed<max){s.tick(50);elapsed+=50;}assert.ok(condition(),`Condition not reached after ${elapsed}ms`);return elapsed;}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} !== ${b}`);

test('workplace definitions use exact prices/footprints, reject occupied cells and enforce 3/1/12 unique existing employees (tabulka-budov-1, kasarna-branci)',()=>{
  const s=scene(),q=build(s,'quarry'),l=build(s,'hunting_lodge',61,50),b=build(s,'barracks',67,50);
  assert.equal(s.inventory.count('stone'),0);assert.equal(q.tiles.length,9);assert.equal(l.tiles.length,9);assert.deepEqual(l.definition.legacyFootprint,{width:2,height:2});assert.equal(b.tiles.length,20);assert.deepEqual(b.definition.legacyFootprint,{width:3,height:3});
  assert.deepEqual(q.definition.cost,{wood:15});assert.deepEqual(l.definition.cost,{wood:8});assert.deepEqual(b.definition.cost,{stone:12,wood:10});
  const workers=Array.from({length:17},(_,i)=>worker(s,45+i,56));let offset=0;
  for(const [building,capacity,profession]of [[q,3,'miner'],[l,1,'hunter'],[b,12,'soldier']]){
    for(let i=0;i<capacity;i++){const w=workers[offset++],old=structuredClone({id:w.id,skills:w.skills,initial:w.initialSkills,talent:w.naturalTalent,overall:w.experience,hp:w.currentHP});assert.equal(s.workplaceSystem.assign(building,w),true);assert.equal(w.profession,profession);assert.equal(w.assignedWorkplaceId,building.id);assert.deepEqual({id:w.id,skills:w.skills,initial:w.initialSkills,talent:w.naturalTalent,overall:w.experience,hp:w.currentHP},old);}
    assert.equal(s.workplaceSystem.assign(building,workers.at(-1)),false);assert.equal(s.workplaceSystem.summary(building).count,capacity);
  }
  assert.equal(s.workerSystem.workers.size,17);const displaced=workers[0];s.workplaceSystem.remove(workers[3]);assert.equal(s.workplaceSystem.assign(l,displaced),true);assert.equal(s.workplaceSystem.summary(q).count,2);assert.equal(s.workplaceSystem.summary(l).count,1);assert.equal(displaced.profession,'hunter');
  s.workplaceSystem.remove(displaced);assert.equal(displaced.profession,'idle');assert.equal(displaced.assignedWorkplaceId,null);
  const fail=placeBuilding({map:s.map,anchor:{x:55,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:q.definition});assert.ok(fail.error);assert.equal(s.buildings.length,3,'quarry, lodge and barracks (the lodge only recommends a Granary since 0.33.0)');
  for(const type of ['quarry','hunting_lodge','barracks'])s.activities.emit('buildingCompleted',{actor:s.character,objectType:type},`built-${type}`);
  assert.equal(s.character.experience.totalXP,45);assert.equal(s.character.skills.construction.totalXP,45);
  s.activities.emit('buildingCompleted',{actor:s.character,objectType:'quarry'},'built-quarry');assert.equal(s.character.experience.totalXP,45);
});

test('miner first visits the quarry, collects a real stone, physically returns and only then delivers one resource and XP',()=>{
  const s=scene(),q=build(s,'quarry'),w=worker(s,50,52);stone(s,62,52);s.workplaceSystem.assign(q,w);
  assert.equal(w.workplaceReached,false);assert.equal(w.workState,'Going to Workplace');const start={...w.position};s.tick(50);assert.ok(Math.hypot(w.position.x-start.x,w.position.y-start.y)<.2);assert.equal(w.workTask,null);
  until(s,()=>!!w.cargo);assert.equal(w.workplaceReached,true);assert.equal(s.resources.size,0);assert.deepEqual(w.cargo,{resource:'stone',amount:1});assert.equal(s.inventory.count('stone'),0);assert.equal(w.experience.totalXP,0);assert.equal(w.skills.mining.totalXP,0);
  until(s,()=>s.inventory.count('stone')===1);assert.equal(w.cargo,null);assert.equal(w.experience.totalXP,3);assert.equal(w.skills.mining.totalXP,3);assert.equal(s.workplaceSystem.summary(q).delivered.stone,1);assert.equal(s.workplaceSystem.atWorkplace(w),true);
  s.simulate(3000);assert.equal(s.inventory.count('stone'),1);assert.equal(w.experience.totalXP,3);assert.equal(w.workState,'Waiting');assert.ok(s.pathWear.active.size>0);
});

test('two quarry miners reserve different real stones, do not overlap while travelling and never create phantom production',()=>{
  const s=scene(),q=build(s,'quarry'),a=worker(s,52,50),b=worker(s,52,51);stone(s,62,50);stone(s,62,53);s.workplaceSystem.assign(q,a);s.workplaceSystem.assign(q,b);
  let reserved=false;for(let i=0;i<600;i++){
    s.tick(50);if(a.workTask&&b.workTask){assert.notEqual(a.workTask.reservation,b.workTask.reservation);reserved=true;}
    assert.ok(Math.floor(a.position.x)!==Math.floor(b.position.x)||Math.floor(a.position.y)!==Math.floor(b.position.y));
    if(s.inventory.count('stone')===2)break;
  }
  assert.ok(reserved);assert.equal(s.inventory.count('stone'),2);assert.equal(a.experience.totalXP+b.experience.totalXP,6);assert.equal(s.workplaceSystem.summary(q).delivered.stone,2);assert.equal(s.workerSystem.reservations.owners.size,0);
  s.simulate(5000);assert.equal(s.inventory.count('stone'),2);
});

test('reassignment drops an undelivered cargo safely; another miner can recover it once with no duplicated rewards',()=>{
  const s=scene(),q=build(s,'quarry'),w=worker(s,52,50);stone(s,61,50);s.workplaceSystem.assign(q,w);until(s,()=>!!w.cargo);
  const position={...w.position};s.workplaceSystem.remove(w);assert.deepEqual(w.position,position);assert.equal(w.profession,'idle');assert.equal(w.cargo,null);assert.equal(w.experience.totalXP,0);assert.equal(s.inventory.count('stone'),0);assert.equal(s.dropSystem.drops.size,1);assert.equal(s.workerSystem.reservations.owners.size,0);
  s.workplaceSystem.assign(q,w);until(s,()=>s.inventory.count('stone')===1);assert.equal(s.dropSystem.drops.size,0);assert.equal(w.experience.totalXP,3);assert.equal(w.skills.mining.totalXP,3);assert.equal(s.workplaceSystem.summary(q).delivered.stone,1);
});

test('lodge hunter uses real combat, gathers original meat amount, returns and earns Hunting/overall rewards only at delivery',()=>{
  const s=scene(),l=build(s,'hunting_lodge'),w=worker(s,53,50),rabbit=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:60,y:50});rabbit.wanderWait=1e8;s.workplaceSystem.assign(l,w);
  until(s,()=>!rabbit.isAlive);assert.equal(w.experience.totalXP,0);assert.equal(w.skills.hunting.totalXP,0);near(w.skills.combat.totalXP,15);assert.equal(s.dropSystem.drops.size,1);assert.equal(s.inventory.count('meat'),0);
  until(s,()=>!!w.cargo);assert.deepEqual(w.cargo,{resource:'meat',amount:MEAT});assert.equal(s.inventory.count('meat'),0);assert.equal(w.experience.totalXP,0);
  until(s,()=>s.inventory.count('meat')===MEAT);assert.equal(w.experience.totalXP,12);assert.equal(w.skills.hunting.totalXP,10);near(w.skills.combat.totalXP,15);assert.equal(s.workplaceSystem.summary(l).delivered.meat,MEAT);assert.equal(s.character.experience.totalXP,0);
});

test('injured hunter returns to the assigned lodge for recovery without teleporting or continuing retaliation',()=>{
  const s=scene(),l=build(s,'hunting_lodge'),w=worker(s,62,50);s.workplaceSystem.assign(l,w);w.workplaceReached=true;w.currentHP=17;
  const position={...w.position};s.tick(0);assert.deepEqual(w.position,position);assert.equal(w.workState,'Fleeing');until(s,()=>w.workState==='Recovering');assert.equal(s.workplaceSystem.atWorkplace(w),true);assert.equal(w.experience.totalXP,0);assert.equal(w.assignedWorkplaceId,l.id);
});

test('an injured hunter deposits already gathered meat immediately on reaching the lodge before resting to full health',()=>{
  const s=scene(),l=build(s,'hunting_lodge'),w=worker(s,53,50),rabbit=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:60,y:50});rabbit.wanderWait=1e8;s.workplaceSystem.assign(l,w);until(s,()=>!!w.cargo);w.currentHP=17;
  assert.equal(s.inventory.count('meat'),0);until(s,()=>w.workState==='Recovering');assert.equal(s.inventory.count('meat'),MEAT);assert.equal(w.cargo,null);assert.equal(w.experience.totalXP,12);assert.equal(w.skills.hunting.totalXP,10);assert.ok(w.currentHP<48);s.simulate(500);assert.equal(s.inventory.count('meat'),MEAT);assert.equal(w.experience.totalXP,12);
});

test('barracks patrols reuse the same subject, never initiate neutral combat and defend only when attacked; death releases the slot',()=>{
  const s=scene(),b=build(s,'barracks'),w=worker(s,53,50);s.workplaceSystem.assign(b,w);until(s,()=>w.workState==='Patrolling');const position={...w.position};until(s,()=>Math.hypot(w.position.x-position.x,w.position.y-position.y)>1,15000);
  assert.equal(s.combat.attacks.size,0);assert.equal(w.skills.combat.totalXP,0);assert.equal(s.workerSystem.workers.size,1);
  w.path=[];w.nextTile=null;w.position={x:w.tile.x+.5,y:w.tile.y+.5};w.aiCooldown=1e8;const neighbors=[[1,0],[-1,0],[0,1],[0,-1]].map(([dx,dy])=>({x:w.tile.x+dx,y:w.tile.y+dy})),tile=neighbors.find(t=>s.map[t.y]?.[t.x]===0);const boar=s.animalSystem.create(s.objectRegistry.require('wild_boar'),tile);boar.wanderWait=1e8;
  s.combat.startAttack(boar,w);assert.equal(s.combat.attacks.get(w),boar);s.simulate(200);assert.ok(w.skills.combat.totalXP>0);assert.equal(w.experience.totalXP,0);
  s.combat.applyDamage(w,1000,boar);assert.equal(s.workplaceSystem.summary(b).count,0);assert.equal(w.isAlive,false);assert.equal(w.assignedWorkplaceId,null);assert.equal(s.workerSystem.reservations.owners.size,0);
});

test('full save/load restores workplaces, occupied slots, production, carrying cargo and deferred rewards exactly once',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const s=scene(),q=build(s,'quarry'),w=worker(s,52,50);stone(s,61,50);s.workplaceSystem.assign(q,w);until(s,()=>!!w.cargo);
  const saved=validateGameState(serializeGameState(s)),r=workerScene(saved.terrain,{workplaces:true});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);const loaded=r.workerSystem.workers.get(w.id);assert.deepEqual(loaded.cargo,w.cargo);assert.equal(r.workplaceSystem.records.get(q.id).workerIds.length,1);
  until(r,()=>r.inventory.count('stone')===1);r.simulate(5000);assert.equal(r.inventory.count('stone'),1);assert.equal(loaded.experience.totalXP,3);assert.equal(r.workplaceSystem.records.get(q.id).delivered.stone,1);
  for(const mutate of [v=>v.workplaces.records[0].capacity=99,v=>v.workplaces.records[0].workerIds.push(w.id),v=>v.workers[0].profession='hunter',v=>v.workers[0].cargo.amount=-1,v=>v.workplaces.records[0].delivered.stone=.5]){const bad=structuredClone(saved);mutate(bad);assert.throws(()=>validateGameState(bad));}
});

test('older unassigned workers migrate to Idle without losing skills, talent, earned pay or gaining fake production',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const old=workerScene(),w=worker(old);old.skillSystem.addXP(w,'mining',500);old.workerSystem.jobs.assign(w,'miner');old.gameTime.update(60000);const saved=serializeGameState(old),r=scene();loadGameState(r,saved);const loaded=r.workerSystem.workers.get(w.id);
  assert.equal(loaded.profession,'idle');assert.equal(loaded.workState,'Idle');assert.equal(loaded.assignedWorkplaceId,null);assert.equal(loaded.workTask,null);assert.deepEqual(loaded.skills,w.skills);assert.equal(loaded.naturalTalent,w.naturalTalent);near(r.wageSystem.accrued(loaded),.5);assert.equal(r.inventory.count('stone'),0);validateGameState(serializeGameState(r));
});

test('a hunter saved between the real kill and meat pickup restores pending kill rewards without replaying them',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  // #132: the lodge needs a completed Granary, and a save with a Granary carries the food storage state.
  const s=workerScene(undefined,{workplaces:true,foodProduction:true}),l=build(s,'hunting_lodge'),w=worker(s,53,50),rabbit=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:60,y:50});rabbit.wanderWait=1e8;s.workplaceSystem.assign(l,w);until(s,()=>!rabbit.isAlive);
  assert.equal(w.cargo,null);assert.equal(w.pendingWorkRewards.length,1);assert.equal(w.pendingWorkRewards[0].type,'animalKilled');
  const saved=validateGameState(serializeGameState(s)),r=workerScene(saved.terrain,{workplaces:true,foodProduction:true});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);until(r,()=>r.inventory.count('meat')===MEAT);
  const loaded=r.workerSystem.workers.get(w.id);assert.equal(loaded.experience.totalXP,12);assert.equal(loaded.skills.hunting.totalXP,10);near(loaded.skills.combat.totalXP,15);assert.equal(loaded.pendingWorkRewards.length,0);r.simulate(4000);assert.equal(loaded.experience.totalXP,12);assert.equal(r.inventory.count('meat'),MEAT);
});

test('a blocked return route keeps the real cargo and grants nothing until the quarry becomes reachable again',()=>{
  const s=scene(),q=build(s,'quarry'),w=worker(s,52,50);stone(s,62,50);s.workplaceSystem.assign(q,w);until(s,()=>!!w.cargo);
  for(let y=49;y<=53;y++)for(let x=54;x<=58;x++)if(x===54||x===58||y===49||y===53)s.map[y][x]=1;
  s.simulate(5000);assert.ok(w.cargo);assert.equal(s.inventory.count('stone'),0);assert.equal(w.experience.totalXP,0);assert.equal(w.workState,'Returning to Workplace');
  for(let y=49;y<=53;y++)for(let x=54;x<=58;x++)if(x===54||x===58||y===49||y===53)s.map[y][x]=0;
  until(s,()=>s.inventory.count('stone')===1);assert.equal(w.experience.totalXP,3);assert.equal(s.workplaceSystem.summary(q).delivered.stone,1);
});
