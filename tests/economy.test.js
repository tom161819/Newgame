import test from 'node:test';
import assert from 'node:assert/strict';
import { BASE_DAILY_WAGES } from '../src/data/economy.js';
import { workerScene } from './helpers/workerScene.js';
import { SKILL_IDS,JOBS } from '../src/data/jobs.js';
import { createProgress,totalXPForLevel } from '../src/data/experience.js';
import { initializeNaturalTalent } from '../src/systems/NaturalTalentSystem.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { DAY_DURATION } from '../src/systems/GameTimeSystem.js';

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} !== ${b}`);
const worker=s=>s.workerSystem.create({x:50,y:50});
const level=(w,skill,n)=>{w.skills[skill]=createProgress({initialLevel:n});};
const castle=s=>{const d=s.objectRegistry.require('castle');s.buildings.push({id:1,type:'castle',x:60,y:60,definition:d});};

test('new subjects get exactly one permanent talent and random level 3–8 / 1–4 skills on the existing XP curve',()=>{
  const s=workerScene(),seen=new Set();
  for(let i=0;i<120;i++){
    const w=worker(s);delete w.naturalTalent;let seed=i+1;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    initializeNaturalTalent(w,{random});seen.add(w.naturalTalent);
    assert.ok(SKILL_IDS.includes(w.naturalTalent));assert.ok(w.skills[w.naturalTalent].level>=3&&w.skills[w.naturalTalent].level<=8);
    const others=SKILL_IDS.filter(id=>id!==w.naturalTalent);assert.ok(others.filter(id=>w.skills[id].level>1).length<=1);assert.ok(others.every(id=>w.skills[id].level>=1&&w.skills[id].level<=4));
    for(const skill of Object.values(w.skills)){assert.equal(skill.totalXP,totalXPForLevel(skill.level));assert.equal(skill.currentXP,0);}
    assert.deepEqual(w.skills,w.initialSkills);assert.notEqual(w.skills,w.initialSkills);assert.equal(w.experience.totalXP,0);assert.equal(w.experience.level,1);
    const before=structuredClone({talent:w.naturalTalent,initial:w.initialSkills,skills:w.skills});initializeNaturalTalent(w,{random:()=>.99});
    s.workerSystem.jobs.assign(w,'miner');s.workerSystem.jobs.assign(w,'hunter');assert.deepEqual({talent:w.naturalTalent,initial:w.initialSkills,skills:w.skills},before);
  }
  // Explicitly exercise all talent choices, independently of PRNG sample distribution.
  for(let i=0;i<7;i++){const w=worker(s);delete w.naturalTalent;initializeNaturalTalent(w,{random:()=>i/7+.001});seen.add(w.naturalTalent);}
  assert.equal(seen.size,7);
});

test('talent grants precisely 20% skill XP, leaves overall XP and direct stats unchanged and respects replay/combat caps',()=>{
  const s=workerScene(),w=worker(s),target=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:51,y:50});w.naturalTalent='mining';
  const stats={...w.baseStats},speed=w.speed;s.activities.emit('resourceCollected',{actor:w,objectType:'stone'},'one-rock');
  near(w.skills.mining.totalXP,3.6);assert.equal(w.experience.totalXP,3);s.activities.emit('resourceCollected',{actor:w,objectType:'stone'},'one-rock');near(w.skills.mining.totalXP,3.6);
  s.skillSystem.addXP(w,'hunting',10);assert.equal(w.skills.hunting.totalXP,10);assert.deepEqual(w.baseStats,stats);assert.equal(w.speed,speed);assert.equal(w.attackDPS,stats.attackDPS);
  w.naturalTalent='combat';s.skillSystem.creditDamage(w,target,100);s.skillSystem.creditDamage(w,target,100);near(w.skills.combat.totalXP,48);assert.equal(w.experience.totalXP,3);
  s.skillSystem.addXP(w,'combat',1e9);assert.equal(w.skills.combat.level,50);assert.equal(w.skills.combat.totalXP,totalXPForLevel(50));
});

test('daily wage uses the current job skill with the exact 10/11 boundaries, never overall level or talent',()=>{
  const s=workerScene(),w=worker(s);s.experienceSystem.addXP(w,1e9);
  assert.equal(s.wageSystem.dailyWage(w),0);
  for(const job of Object.keys(JOBS).filter(id=>id!=='idle')){
    s.workerSystem.jobs.assign(w,job);
    for(const n of [1,10,11,20,21,30,31,40,41,50]){
      level(w,JOBS[job].skill,n);assert.equal(s.wageSystem.dailyWage(w),BASE_DAILY_WAGES[job]+Math.floor((n-1)/10));
    }
  }
  s.workerSystem.jobs.assign(w,'idle');assert.equal(s.wageSystem.dailyWage(w),0);
  w.isAlive=false;w.profession='soldier';assert.equal(s.wageSystem.dailyWage(w),0);
});

test('a day is charged once, prorated across jobs, unemployment and skill rates without rounding',()=>{
  const s=workerScene(),w=worker(s);s.inventory.add('gold',100);
  s.gameTime.update(30000);assert.equal(s.wageSystem.accrued(w),0);
  s.workerSystem.jobs.assign(w,'miner');s.gameTime.update(30000);near(s.wageSystem.accrued(w),.25);
  level(w,'mining',11);s.gameTime.update(30000);near(s.wageSystem.accrued(w),.75);
  s.workerSystem.jobs.assign(w,'soldier');s.gameTime.update(29999);s.workerSystem.jobs.assign(w,'idle');s.gameTime.update(1);
  const cost=.75+29999*2/DAY_DURATION;near(s.inventory.count('gold'),100-cost);assert.equal(s.wageSystem.totalUnpaid(),0);assert.equal(s.wageSystem.accrued(w),0);
  const gold=s.inventory.count('gold');assert.equal(s.wageSystem.processDay(2),false);assert.equal(s.wageSystem.processDay(1),false);assert.equal(s.inventory.count('gold'),gold);
});

test('partial wages leave individual debt, never negative Gold, and older debts are settled before newer wages',()=>{
  const s=workerScene(),a=worker(s),b=worker(s);s.workerSystem.jobs.assign(a,'miner');s.inventory.add('gold',.25);s.gameTime.update(DAY_DURATION);
  assert.equal(s.inventory.count('gold'),0);near(s.wageSystem.unpaid(a),.75);assert.equal(s.wageSystem.unpaid(b),0);assert.equal(a.isAlive,true);
  s.workerSystem.jobs.assign(a,'idle');s.workerSystem.jobs.assign(b,'soldier');s.inventory.add('gold',1);s.gameTime.update(DAY_DURATION);
  assert.equal(s.wageSystem.unpaid(a),0);near(s.wageSystem.unpaid(b),1.75);assert.equal(s.inventory.count('gold'),0);
  s.workerSystem.jobs.assign(b,'idle');s.inventory.add('gold',2);s.gameTime.update(DAY_DURATION);near(s.inventory.count('gold'),.25);assert.equal(s.wageSystem.totalUnpaid(),0);
  assert.throws(()=>s.inventory.spend('stone',.5));assert.throws(()=>s.inventory.spend('gold',NaN));assert.throws(()=>s.inventory.spend('gold',-1));
});

test('castle income is available before the same day payroll and economy follows jobs, real skills and buildings',()=>{
  const s=workerScene(),a=worker(s),b=worker(s);castle(s);s.workerSystem.jobs.assign(a,'miner');s.workerSystem.jobs.assign(b,'soldier');
  assert.deepEqual(s.wageSystem.overview(),{gold:0,income:5,wages:3,balance:2,unpaid:0});
  level(a,'mining',21);assert.deepEqual(s.wageSystem.overview(),{gold:0,income:5,wages:5,balance:0,unpaid:0});
  s.gameTime.update(DAY_DURATION);assert.equal(s.inventory.count('gold'),0);assert.equal(s.wageSystem.totalUnpaid(),0);
  s.workerSystem.jobs.assign(a,'idle');s.gameTime.update(DAY_DURATION);assert.equal(s.inventory.count('gold'),3);
});

test('paused time, different frame rates and multi-day updates preserve proportional costs and migration timing',()=>{
  for(const fps of [20,60,144]){
    const s=workerScene(),w=worker(s);s.workerSystem.jobs.assign(w,'miner');s.inventory.add('gold',10);s.gameTime.setPaused(true);s.gameTime.update(120000);assert.equal(s.wageSystem.accrued(w),0);
    s.gameTime.setPaused(false);for(let i=0;i<fps*120;i++)s.gameTime.update(1000/fps);
    near(s.inventory.count('gold'),9);assert.equal(s.gameTime.day,2);near(s.wageSystem.accrued(w),0);
  }
  const s=workerScene(),w=worker(s);s.workerSystem.jobs.assign(w,'soldier');s.inventory.add('gold',10);s.gameTime.update(3*DAY_DURATION+30000);
  near(s.inventory.count('gold'),4);near(s.wageSystem.accrued(w),.5);assert.equal(s.wageSystem.lastProcessedDay,4);
  assert.ok(s.workerSystem.liveWorkers().filter(a=>a!==w).every(a=>s.wageSystem.accrued(a)===0));
});

test('death stops new accrual but does not erase the wages already earned or unpaid debt',()=>{
  const s=workerScene(),w=worker(s);s.workerSystem.jobs.assign(w,'miner');s.gameTime.update(60000);w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);s.gameTime.update(60000);
  near(s.wageSystem.unpaid(w),.5);s.inventory.add('gold',1);s.gameTime.update(DAY_DURATION);near(s.inventory.count('gold'),.5);assert.equal(s.wageSystem.totalUnpaid(),0);
});

test('Save/Load preserves talent, original/current skills, exact fractional Gold, partial-day costs and payroll cursor',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const s=workerScene(),w=worker(s);s.workerSystem.jobs.assign(w,'soldier');s.inventory.add('gold',.25);s.gameTime.update(DAY_DURATION+35000);s.inventory.add('gold',.375);
  const saved=validateGameState(serializeGameState(s)),r=workerScene(saved.terrain);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);
  const loaded=r.workerSystem.workers.get(w.id);assert.equal(loaded.naturalTalent,w.naturalTalent);assert.deepEqual(loaded.initialSkills,w.initialSkills);near(r.wageSystem.accrued(loaded),35000*2/DAY_DURATION);
  const before=r.inventory.count('gold');r.wageSystem.processDay(r.gameTime.day);assert.equal(r.inventory.count('gold'),before);
  s.gameTime.update(DAY_DURATION-35000);r.gameTime.update(DAY_DURATION-35000);assert.deepEqual(r.wageSystem.exportState(),s.wageSystem.exportState());assert.equal(r.inventory.count('gold'),s.inventory.count('gold'));
  for(const mutate of [v=>v.workers[0].naturalTalent='invalid',v=>v.workers[0].initialSkills.mining.level=51,v=>v.wages.lastProcessedDay=1,v=>v.wages.accruals[w.id]={rateMilliseconds:-1,compensation:0},v=>v.wages.arrears[0].workerId='worker-999']){const bad=structuredClone(saved);mutate(bad);assert.throws(()=>validateGameState(bad));}
});

test('old saves receive stable default talents with preserved skills and no retroactive wages or repeated randomization',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const s=workerScene(),w=worker(s);s.skillSystem.addXP(w,'mining',500);s.workerSystem.jobs.assign(w,'miner');s.gameTime.update(60000);s.inventory.add('gold',20);
  const old=serializeGameState(s);delete old.wages;for(const worker of old.workers){delete worker.naturalTalent;delete worker.initialSkills;}
  const r=workerScene(old.terrain,{randomizeTalents:true});loadGameState(r,old);const a=r.workerSystem.workers.get(w.id);assert.deepEqual(a.skills,w.skills);assert.deepEqual(a.initialSkills,w.skills);assert.ok(SKILL_IDS.includes(a.naturalTalent));
  assert.equal(r.wageSystem.accrued(a),0);assert.equal(r.wageSystem.totalUnpaid(),0);assert.equal(r.wageSystem.lastProcessedDay,1);
  const next=validateGameState(serializeGameState(r)),r2=workerScene(old.terrain,{randomizeTalents:true});loadGameState(r2,next);assert.deepEqual(serializeGameState(r2),next);
  r2.gameTime.update(60000);near(r2.inventory.count('gold'),19.5);assert.equal(r2.workerSystem.workers.get(w.id).naturalTalent,a.naturalTalent);
});
