import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// #58 phase C2: strikes after two whole days below 25 Happiness, emigration after three days below 15.
function world(){
  const s=workerScene(undefined,{morale:true});const feed=[];s.eventFeed={push:(key,text)=>feed.push(text)};
  const w=s.workerSystem.create({x:40,y:40});w.arriving=false;s.workerSystem.jobs.assign(w,'hauler');
  let happiness=60;const status=s.needs.status.bind(s.needs);s.needs.status=(worker,...rest)=>({...status(worker,...rest),happiness});
  return {s,w,feed,set:h=>{happiness=h;},endDay:()=>s.gameTime.update(s.gameTime.dayDuration-s.gameTime.elapsed+1)};
}
const until=(s,p,max=200000)=>{let n=0;while(!p()&&n<max){s.tick(50);n+=50;}assert.ok(p(),`not reached after ${n} ms`);};

test('two whole days below 25 start a strike: no work, no wages; Happiness 45 ends it', () => {
  const {s,w,feed,set,endDay}=world();s.needs.step(1000);
  set(20);endDay();assert.equal(s.needs.records.get(w.id).strike,false,'one day is not enough');
  set(60);endDay();assert.equal(s.needs.records.get(w.id).lowDays,0,'a good day resets the count');
  set(20);endDay();endDay();const r=s.needs.records.get(w.id);assert.equal(r.strike,true);assert.ok(feed.some(t=>/on strike/.test(t)));
  s.tick(50);assert.equal(w.workState,'On Strike');assert.equal(w.profession,'hauler','keeps the profession');assert.equal(s.wageSystem.dailyWage(w),0);
  assert.ok(s.needs.summary().striking>=1);assert.equal(s.needs.status(w).strike,true);
  set(44);s.needs.step(1000);assert.equal(r.strike,true);set(45);s.needs.step(1000);assert.equal(r.strike,false);
  s.tick(50);assert.notEqual(w.workState,'On Strike');assert.ok(s.wageSystem.dailyWage(w)>0);
});

test('three days below 15: the resident gives up his job, walks to the map edge and leaves the kingdom', () => {
  const {s,w,feed,set,endDay}=world();const before=s.workerSystem.liveSubjects().length;s.needs.step(1000);
  set(10);endDay();endDay();assert.equal(s.needs.records.get(w.id).strike,true);endDay();
  assert.equal(s.needs.records.get(w.id).leaving,true);assert.equal(s.needs.records.get(w.id).strike,false);
  s.tick(50);assert.equal(w.workState,'Leaving Kingdom');assert.equal(w.profession,'idle');
  const mid=validateGameState(serializeGameState(s));assert.equal(mid.needs.records.find(r=>r.id===w.id).leaving,true);
  const r=workerScene(mid.terrain,{starter:false,morale:true});loadGameState(r,mid);assert.equal(r.needs.records.get(w.id).leaving,true);
  until(s,()=>!w.isAlive,600000);
  assert.equal(w.workState,'Left Kingdom');assert.equal(s.workerSystem.liveSubjects().includes(w),false);assert.ok(before>=1);
  assert.equal(s.workerSystem.recentDeaths().some(x=>x.id===w.id),false,'not counted as a death');
  assert.ok(feed.some(t=>/left your kingdom due to poor living conditions/.test(t)));
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.workers.find(x=>x.id===w.id).workState,'Left Kingdom');
  const bad=structuredClone(saved);bad.workers.find(x=>x.id===w.id).isAlive=true;assert.throws(()=>validateGameState(bad));
});
