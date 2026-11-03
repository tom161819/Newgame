import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { totalXPForLevel } from '../src/data/experience.js';
import { WORK_RULES,SKILL_IDS,POPULATION } from '../src/data/jobs.js';
import { TaskReservationSystem } from '../src/systems/TaskReservationSystem.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { findPath,canStep } from '../src/game/pathfinding.js';

const makeWorker=(s,tile={x:50,y:50})=>s.workerSystem.create(tile);
const addStone=(s,x,y)=>s.addResource(s.objectRegistry.require('stone'),{x,y});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} !== ${b}`);

test('subjects have separate overall progression and six skill tracks; profession changes preserve progress',()=>{
  const s=workerScene(),a=makeWorker(s),b=makeWorker(s,{x:51,y:50});
  assert.deepEqual(Object.keys(a.skills),SKILL_IDS);assert.ok(Object.values(a.skills).every(v=>v.level===1&&v.totalXP===0));
  s.experienceSystem.addXP(a,101);s.skillSystem.addXP(a,'mining',500);const before=structuredClone({overall:a.experience,skills:a.skills});
  assert.equal(s.workerSystem.jobs.assign(a,'miner'),true);assert.equal(s.workerSystem.jobs.assign(a,'hunter'),true);assert.deepEqual({overall:a.experience,skills:a.skills},before);
  assert.equal(b.skills.mining.totalXP,0);assert.equal(b.experience.totalXP,0);assert.equal(s.workerSystem.jobs.assign(a,'invented_job'),false);
  a.currentHP=0;a.isAlive=false;s.workerSystem.onDeath(a);assert.equal(s.workerSystem.jobs.assign(a,'miner'),false);assert.equal(s.workerSystem.reservations.owners.size,0);
});

test('two miners reserve different stones and perform physical work without duplicate resources or XP',()=>{
  const s=workerScene(),a=makeWorker(s),b=makeWorker(s,{x:50,y:51});addStone(s,51,50);addStone(s,51,51);
  s.workerSystem.jobs.assign(a,'miner');s.workerSystem.jobs.assign(b,'miner');s.workerSystem.update(0);
  assert.notEqual(a.workTask.targetId,b.workTask.targetId);assert.equal(s.workerSystem.reservations.owners.size,2);assert.equal(s.inventory.count('stone'),0);
  assert.deepEqual(a.position,{x:50.5,y:50.5});s.simulate(5000);
  assert.equal(s.inventory.count('stone'),2);assert.equal(s.resources.size,0);assert.equal(a.skills.mining.totalXP,3);assert.equal(b.skills.mining.totalXP,3);
  assert.equal(a.experience.totalXP,3);assert.equal(b.experience.totalXP,3);assert.equal(s.character.experience.totalXP,0);assert.equal(s.workerSystem.reservations.owners.size,0);
  s.simulate(5000);assert.equal(s.inventory.count('stone'),2);assert.equal(a.experience.totalXP,3);
  assert.ok(s.pathWear.active.size>0);
});

test('changing a job releases its task and cancels partly completed work without granting rewards',()=>{
  const s=workerScene(),a=makeWorker(s);addStone(s,51,50);s.workerSystem.jobs.assign(a,'miner');s.simulate(700);
  assert.equal(a.workState,'Working');assert.ok(a.workTask.progressMs>0&&a.workTask.progressMs<WORK_RULES.miningDuration);
  const position={...a.position};s.workerSystem.jobs.assign(a,'farmer');assert.deepEqual(a.position,position);assert.equal(a.workTask,null);assert.equal(s.workerSystem.reservations.owners.size,0);
  s.simulate(5000);assert.equal(a.workMessage,'Waiting for workplace');assert.equal(s.inventory.count('stone'),0);assert.equal(a.experience.totalXP,0);
  s.workerSystem.jobs.assign(a,'miner');s.simulate(1600);assert.equal(s.inventory.count('stone'),1);assert.equal(a.skills.mining.totalXP,3);
});

test('hunter uses real DPS, loots the resulting meat, gains Hunting and Combat but overall completion XP only once',()=>{
  const s=workerScene(),a=makeWorker(s),rabbit=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:51,y:50});rabbit.wanderWait=1e8;
  s.workerSystem.jobs.assign(a,'hunter');s.simulate(4000);assert.equal(rabbit.isAlive,false);assert.equal(s.inventory.count('meat'),5);
  assert.equal(a.skills.hunting.totalXP,10);near(a.skills.combat.totalXP,15);assert.equal(a.experience.totalXP,12);assert.equal(s.character.experience.totalXP,0);
  assert.equal(s.dropSystem.drops.size,0);assert.equal(s.workerSystem.reservations.owners.size,0);s.simulate(1000);assert.equal(a.experience.totalXP,12);
});

test('an injured hunter stops retaliation, walks home and recovers instead of teleporting or dying at work',()=>{
  const s=workerScene(),a=makeWorker(s,{x:55,y:50}),boar=s.animalSystem.create(s.objectRegistry.require('wild_boar'),{x:56,y:50});boar.wanderWait=1e8;
  s.workerSystem.jobs.assign(a,'hunter');s.workerSystem.update(0);assert.equal(s.combat.attacks.size,2);a.currentHP=17;
  const position={...a.position};s.workerSystem.update(0);assert.equal(a.workState,'Fleeing');assert.deepEqual(a.position,position);assert.equal(s.combat.attacks.size,0);assert.equal(boar.retaliationTarget,null);
  s.simulate(1300);assert.equal(a.workState,'Recovering');assert.ok(a.currentHP>17);assert.ok(s.workerSystem.homeGoals().some(t=>t.x===a.tile.x&&t.y===a.tile.y));
  a.currentHP=48;s.workerSystem.update(0);assert.equal(a.workState,'Searching for Work');assert.equal(a.experience.totalXP,0);
});

test('skill efficiency affects work duration and applicable DPS, composes with equipment and never adds extra resources',()=>{
  for(const level of [1,50]){
    const s=workerScene(),a=makeWorker(s);s.skillSystem.addXP(a,'mining',totalXPForLevel(level));addStone(s,50,50);s.workerSystem.jobs.assign(a,'miner');s.workerSystem.update(0);
    const duration=WORK_RULES.miningDuration/(1+(level-1)*.01);s.workerSystem.update(duration-1);assert.equal(s.inventory.count('stone'),0);s.workerSystem.update(1.001);assert.equal(s.inventory.count('stone'),1);assert.equal(a.experience.totalXP,3);
  }
  const s=workerScene(),king=s.character,deer=s.animalSystem.create(s.objectRegistry.require('deer'),{x:41,y:40});
  s.inventory.add('basic_sword');s.equipment.equip('basic_sword');s.skillSystem.addXP(king,'hunting',198156);s.combat.startAttack(king,deer);near(king.attackDPS,44.7);assert.equal(king.baseStats.attackDPS,15);
  s.combat.stopAttack(king);assert.equal(king.attackDPS,30);assert.equal(king.speed,3.5);assert.equal(king.armor,0);
  s.experienceSystem.addXP(king,1e9);s.activities.emit('resourceCollected',{actor:king,objectType:'stone'});assert.equal(king.experience.level,50);assert.equal(king.skills.mining.totalXP,3);
});

test('work target removal, unreachable stones and 2x2 building corners never grant phantom work',()=>{
  const s=workerScene(),a=makeWorker(s);addStone(s,53,53);s.workerSystem.jobs.assign(a,'miner');s.workerSystem.update(0);const key=a.workTask.targetId;
  s.resources.get(key).destroy();s.resources.delete(key);s.resourceOccupancy.delete(key);s.simulate(2000);assert.equal(a.workTask,null);assert.equal(a.experience.totalXP,0);
  for(let y=51;y<=52;y++)for(let x=51;x<=52;x++)s.map[y][x]=1;
  const route=findPath(s.map,{x:50,y:50},{x:54,y:54});assert.ok(route);let prev={x:50,y:50};for(const p of route){assert.equal(canStep(s.map,prev,p),true);prev=p;}
  addStone(s,55,55);for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]])s.map[55+dy][55+dx]=1;
  s.simulate(1500);assert.equal(a.workTask,null);assert.equal(s.inventory.count('stone'),0);
});

test('woodcutters/farmers/builders wait without fake output and soldiers never initiate neutral combat',()=>{
  for(const job of ['woodcutter','farmer','builder','soldier']){
    const s=workerScene(),a=makeWorker(s);s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:51,y:50});s.workerSystem.jobs.assign(a,job);s.simulate(10000);
    assert.equal(a.workState,'Waiting');assert.equal(a.experience.totalXP,0);assert.equal(s.inventory.count('stone'),0);assert.equal(s.inventory.count('meat'),0);assert.equal(s.combat.attacks.size,0);
  }
});

test('migration creates physical incoming units once per day, respects capacity and adds no XP for travel',()=>{
  const s=workerScene();s.workerSystem.spawnInitial();assert.equal(s.workerSystem.liveWorkers().length,POPULATION.initial);
  s.gameTime.update(120000);const migrant=[...s.workerSystem.workers.values()].at(-1);assert.equal(migrant.arriving,true);assert.ok(migrant.path.length>0);assert.ok(migrant.tile.x<=1||migrant.tile.y<=1||migrant.tile.x>=98||migrant.tile.y>=98);
  s.workerSystem.onNewDay(2);assert.equal(s.workerSystem.liveWorkers().length,4);s.gameTime.update(30*120000);assert.equal(s.workerSystem.liveWorkers().length,POPULATION.maximum);
  s.simulate(50000,100);assert.equal(migrant.arriving,false);assert.equal(migrant.experience.totalXP,0);
});

test('reservation ownership is exclusive and releasing one worker does not release another target',()=>{
  const r=new TaskReservationSystem();assert.equal(r.reserve('stone:a','one'),true);assert.equal(r.reserve('stone:a','two'),false);assert.equal(r.reserve('stone:b','two'),true);
  r.release('stone:a','two');assert.equal(r.available('stone:a','two'),false);r.releaseActor('one');assert.equal(r.available('stone:a','two'),true);assert.equal(r.available('stone:b','one'),false);
});

test('save/load restores moving/working subjects, skill XP, combat targets and reservations without duplicate work',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const s=workerScene(),a=makeWorker(s),b=makeWorker(s,{x:55,y:50});addStone(s,51,50);const deer=s.animalSystem.create(s.objectRegistry.require('deer'),{x:56,y:50});deer.wanderWait=1e8;
  s.workerSystem.jobs.assign(a,'miner');s.workerSystem.jobs.assign(b,'hunter');s.simulate(800);
  const saved=validateGameState(JSON.parse(JSON.stringify(serializeGameState(s)))),r=workerScene(saved.terrain);loadGameState(r,saved);
  assert.deepEqual(serializeGameState(r),saved);assert.equal(r.workerSystem.reservations.owners.size,2);assert.ok(r.animalSystem.animals.get(deer.id).retaliationTarget===r.workerSystem.workers.get(b.id));
  r.simulate(8000);assert.equal(r.inventory.count('stone'),1);assert.ok(r.workerSystem.workers.get(a.id).skills.mining.totalXP===3);
  const duplicate=structuredClone(saved);duplicate.workers[1].workTask={...duplicate.workers[0].workTask};duplicate.workers[1].profession='miner';assert.throws(()=>validateGameState(duplicate));
  const malformed=structuredClone(saved);malformed.workers[0].skills.mining.level=51;assert.throws(()=>validateGameState(malformed));
  const legacy=structuredClone(saved);delete legacy.workers;delete legacy.population;delete legacy.wages;delete legacy.skillSystem;delete legacy.player.skills;delete legacy.player.activitySkill;
  // Starší verze neměla poddané ani boj proti nim.
  legacy.animals[0].retaliationId=null;legacy.commands.attacks=[];legacy.skillSystem=undefined;
  const old=workerScene(saved.terrain);loadGameState(old,legacy);assert.equal(old.workerSystem.liveWorkers().length,3);assert.ok(Object.values(old.character.skills).every(t=>t.level===1));
});
