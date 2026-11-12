import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { NEEDS,happinessOf,moodFor,mainProblem } from '../src/data/needs.js';
import { POPULATION } from '../src/data/jobs.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { sortedPopulation } from '../src/ui/populationData.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=()=>{const s=workerScene(undefined,{starter:true});s.workerSystem.unsubscribe?.();return s;};
const day=s=>s.gameTime.dayDuration;
const add=(s,type,x,y)=>{const d=s.objectRegistry.require(type),b={id:s.buildings.length+100,type,x,y,definition:d,tiles:[]};s.buildings.push(b);return b;};
const person=(s,tile)=>{const w=s.workerSystem.create(tile);return w;};

test('S13 formula: weighted Happiness minus the unpaid penalty; moods and the main problem',()=>{
  assert.equal(happinessOf({food:100,rest:100,housing:100,safety:100}),100);assert.equal(happinessOf({food:0,rest:0,housing:0,safety:0}),0);
  assert.equal(happinessOf({food:80,rest:25,housing:100,safety:70}),Math.round(80*.35+25*.25+100*.25+70*.15),'the issue example: 65 %');
  assert.equal(happinessOf({food:100,rest:100,housing:100,safety:100},30),70,'unpaid wages counted once as a separate penalty');
  assert.deepEqual([moodFor(70).id,moodFor(69).id,moodFor(40).id,moodFor(39).id,moodFor(25).id,moodFor(24).id],['happy','neutral','neutral','unhappy','unhappy','critical']);
  assert.equal(mainProblem({food:80,rest:25,housing:100,safety:70}),'rest','Main problem: Low Rest');assert.equal(mainProblem({food:100,rest:100,housing:100,safety:100}),null);
  assert.equal(mainProblem({food:100,rest:100,housing:100,safety:100},10),'wages');
});

test('S13 every resident has own needs; Food follows only the existing daily meal (no second consumption); Rest follows work',()=>{
  const s=scene(),a=person(s,{x:40,y:40}),b=person(s,{x:41,y:40});s.inventory.add('bread',3);const bread=s.inventory.count('bread');
  s.foodSystem.syncResidents();s.foodSystem.residents.get(a.id).hungry=true;a.workState='Working';b.workState='Waiting';
  s.needs.step(day(s)/2);
  const ra=s.needs.records.get(a.id),rb=s.needs.records.get(b.id);
  assert.equal(ra.food,100-NEEDS.food.declinePerDay/2,'a missed meal lowers Food gradually');
  // #68: a fed resident heads for the Normal-rations target (60 % with no kinds eaten yet) at the same rate, not in a jump.
  assert.equal(rb.food,100-NEEDS.food.declinePerDay/2);
  assert.equal(ra.rest,100-NEEDS.rest.drainPerDay/2,'work tires');assert.equal(rb.rest,100,'waiting does not');ra.food=50;
  assert.equal(s.inventory.count('bread'),bread,'needs never consume food themselves');
  const meals=s.foodSystem.residents.get(a.id);meals.hungry=false;meals.meals={apple:s.gameTime.day,bread:s.gameTime.day,meat:s.gameTime.day,fish:s.gameTime.day};
  s.needs.step(day(s)/4);assert.equal(ra.food,50+NEEDS.food.recoverPerDay/4,'after a real meal Food recovers gradually');
  a.workState='Waiting';s.needs.step(day(s)/4);assert.equal(ra.rest,100-NEEDS.rest.drainPerDay/2-NEEDS.rest.drainPerDay/4+NEEDS.rest.recoverPerDay/4,'half a day of work, a quarter more, then a quarter of rest');
  const st=s.needs.status(a);assert.equal(st.housing,100);assert.equal(st.home.kind,'settlement');assert.ok(st.happiness>0&&st.happiness<=100);
});

test('S13 updates follow the central game clock at most once a second and stop while paused',()=>{
  const s=scene(),w=person(s,{x:40,y:40});w.workState='Working';s.foodSystem.syncResidents();
  const before=s.needs.revision;s.gameTime.update(400);s.gameTime.update(400);assert.equal(s.needs.revision,before,'no update before a full second');
  s.gameTime.update(400);assert.equal(s.needs.revision,before+1);assert.ok(s.needs.records.get(w.id).rest<100);
  const rest=s.needs.records.get(w.id).rest;s.gameTime.paused=true;s.gameTime.update?.(5000);assert.equal(s.needs.records.get(w.id).rest,rest,'pause freezes needs');
});

test('S13 Housing: base settlement places, then 5 per completed House; residents beyond capacity are homeless',()=>{
  const s=scene();const people=Array.from({length:POPULATION.maximum+6},(_,i)=>person(s,{x:10+(i%30),y:10+Math.floor(i/30)}));
  let homes=s.needs.homes();assert.equal(people.filter(p=>!homes.has(p.id)).length,6,'six above the base capacity have no home');
  const house=add(s,'house',70,70);homes=s.needs.homes();
  const housed=people.filter(p=>homes.get(p.id)?.kind==='house');assert.equal(housed.length,POPULATION.houseCapacity);assert.ok(housed.every(p=>homes.get(p.id).buildingId===house.id));
  const homeless=people.find(p=>!homes.has(p.id));assert.equal(s.needs.status(homeless).housing,0);assert.equal(s.needs.status(homeless).homeless,true);
  assert.equal(new Set([...homes.keys()]).size,homes.size,'one home per resident');
});

test('S13 Safety: base 45, finished Castle +25, tower +15, Barracks or a soldier +10, a recent attack lowers it for a day',()=>{
  const s=scene(),w=person(s,{x:50,y:50});w.position={x:50.5,y:50.5};assert.equal(s.needs.status(w).safety,45);
  const castle=add(s,'castle',48,48);assert.equal(s.needs.status(w).safety,70);
  castle.construction={state:'planned'};assert.equal(s.needs.status(w).safety,45,'blueprints give no safety');castle.construction={state:'complete'};
  add(s,'tower',52,52);assert.equal(s.needs.status(w).safety,85);add(s,'barracks',45,52);assert.equal(s.needs.status(w).safety,95);
  s.needs.step(1000);w.currentHP-=5;s.needs.step(1000);assert.equal(s.needs.status(w).safety,95-NEEDS.safety.attack.penalty,'attacked just now');
  s.gameTime.totalElapsed+=day(s)/2;assert.equal(s.needs.status(w).safety,95-NEEDS.safety.attack.penalty/2,'fades over a day');
  s.gameTime.totalElapsed+=day(s);assert.equal(s.needs.status(w).safety,95);
  const far=person(s,{x:5,y:5});far.position={x:5.5,y:5.5};assert.equal(s.needs.status(far).safety,45);
});

test('S13 kingdom summary and Happiness sort; the king and visitors have no needs',()=>{
  const s=scene();assert.equal(s.needs.summary().happiness,null,'no residents: no bonus or penalty');
  const a=person(s,{x:40,y:40}),b=person(s,{x:41,y:40});s.needs.records.set(b.id,{id:b.id,food:10,rest:10,hp:b.currentHP,attackedAt:null});
  const sum=s.needs.summary();assert.equal(sum.population,2);assert.equal(sum.hungry,1);assert.equal(sum.tired,1);assert.equal(sum.happiness,Math.round((s.needs.status(a).happiness+s.needs.status(b).happiness)/2));
  const order=sortedPopulation([a,b],{sortBy:'happiness',direction:'asc',profession:'all'},'',{happiness:w=>s.needs.status(w).happiness});assert.deepEqual(order.map(w=>w.id),[b.id,a.id],'lowest first');
  const visitor=s.workerSystem.create({x:42,y:40},{isSubject:false});assert.equal(s.needs.status(visitor),null);assert.equal(s.needs.status(s.character),null);
});

test('S13 Save/Load keeps every resident\'s needs exactly; damaged records are rejected; the dead are not saved',()=>{
  const s=scene(),a=person(s,{x:40,y:40}),b=person(s,{x:41,y:40});a.workState='Working';s.needs.step(day(s)/3);s.needs.records.get(b.id).food=33.5;s.needs.records.get(a.id).attackedAt=s.gameTime.totalElapsed;
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.needs.records.length,2);
  const r=scene();loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)).needs,saved.needs);
  assert.deepEqual(r.needs.status(r.workerSystem.workers.get(a.id)),s.needs.status(a),'the same needs, mood and problem after Load');
  for(const bad of [x=>x.needs.records[0].food=101,x=>x.needs.records[0].id='ghost',x=>x.needs.records.push({...x.needs.records[0]}),x=>x.needs.records[0].attackedAt=x.time.totalElapsed+1,x=>delete x.needs.records[0].rest])
    {const copy=structuredClone(saved);bad(copy);assert.throws(()=>validateGameState(copy));}
  b.currentHP=0;b.isAlive=false;s.workerSystem.onDeath?.(b);assert.equal(validateGameState(serializeGameState(s)).needs.records.length,1);
});

test('S13 performance: 200 residents update in one step without per-frame work',()=>{
  const s=scene();for(let i=0;i<200;i++){const w=person(s,{x:5+(i%80),y:5+Math.floor(i/80)});w.workState=i%2?'Working':'Waiting';}
  const start=performance.now();s.needs.step(1000);const sum=s.needs.summary();const ms=performance.now()-start;
  assert.equal(sum.population,200);assert.ok(ms<200,`${ms} ms for a step and a summary of 200 residents`);
});

test('S13 phase C: the mood scales work speed (Happy ×1.10, Unhappy and Critical ×0.80) on top of skill and hunger; walking and combat unchanged',()=>{
  const s=workerScene(undefined,{starter:true,morale:true});s.workerSystem.unsubscribe?.();const w=person(s,{x:40,y:40}),speed=w.moveSpeed??w.speed,attack=w.attack;
  const base=s.skillSystem.efficiency(w,'mining')*s.foodSystem.workMultiplier(w);
  assert.equal(s.skillSystem.workEfficiency(w,'mining'),base,'no update yet: neutral');
  s.needs.step(1000);assert.equal(s.needs.status(w).mood,'happy');assert.ok(Math.abs(s.skillSystem.workEfficiency(w,'mining')-base*1.1)<1e-9,'happy works 10 % faster');
  const r=s.needs.records.get(w.id);r.food=0;r.rest=0;s.needs.refresh();assert.ok(['unhappy','critical'].includes(s.needs.status(w).mood));
  assert.ok(Math.abs(s.skillSystem.workEfficiency(w,'mining')-base*.8)<1e-9,'unhappy works 20 % slower');
  assert.equal(w.moveSpeed??w.speed,speed);assert.equal(w.attack,attack);assert.equal(s.needs.workModifier(s.character),1,'the King has no mood factor');
});

test('S13 phase C: Kingdom Happiness is part of the existing Kingdom Attractiveness, with no effect while there are no residents',()=>{
  const s=workerScene(undefined,{starter:true,seasons:true,morale:true});s.workerSystem.unsubscribe?.();
  s.needs.refresh();assert.equal(s.attractiveness.modifiers.get('happiness'),0,'no residents: no bonus or penalty');
  const w=person(s,{x:40,y:40});s.needs.step(1000);assert.ok(s.needs.kingdomHappiness>=80);assert.equal(s.attractiveness.modifiers.get('happiness'),15);
  const r=s.needs.records.get(w.id);r.food=0;r.rest=0;s.needs.refresh();const h=s.needs.kingdomHappiness;assert.ok(h<50,`${h}`);
  assert.equal(s.attractiveness.modifiers.get('happiness'),h>=30?-20:-45);assert.ok(s.attractiveness.value<=100+s.attractiveness.modifiers.get('happiness'));
  // Derived, not saved: the factor is rebuilt from the saved needs on Load.
  const saved=s.needs.exportState();assert.equal('work' in saved,false);s.needs.work.clear();s.needs.importState(saved);assert.ok(s.needs.workModifier(w)<1);
  s.needs.destroy();assert.equal(s.attractiveness.modifiers.has('happiness'),false);
});

test('S13 phase D: need tooltips explain the values; Safety lists its factors and they add up',async()=>{
  const { needTooltip }=await import('../src/ui/NeedsDisplay.js');
  const s=scene(),w=person(s,{x:40,y:40});add(s,'castle',38,38);s.buildings.at(-1).completed=true;s.buildings.at(-1).construction=null;
  s.needs.step(1000);const r=s.needs.records.get(w.id);r.attackedAt=s.gameTime.totalElapsed;const st=s.needs.status(w);
  const sum=st.safetyFactors.reduce((n,[,v])=>n+v,0);assert.equal(st.safety,Math.max(0,Math.min(100,sum)));
  assert.equal(st.safetyFactors[0][0],'base');assert.ok(st.safetyFactors.some(([k,v])=>k==='attack'&&v<0),'a recent attack is listed');
  const tip=needTooltip('safety',st);assert.match(tip,/^Base 45/);assert.match(tip,/Recent attack −\d+/);
  assert.match(needTooltip('housing',st),/Home: /);assert.match(needTooltip('happiness',{...st,unpaidPenalty:10}),/Food 35 %.*Unpaid/);
  assert.equal(needTooltip('food',{...st,hungry:true}),'Missed meals: Food falls until the Granary or storage supplies food again.');
});

test('S13 phase D: 100 residents update needs and derived effects quickly',()=>{
  const s=workerScene(undefined,{starter:true,morale:true});s.workerSystem.unsubscribe?.();
  for(let i=0;i<100;i++){const w=s.workerSystem.create({x:20+i%40,y:20+Math.floor(i/40)*2});w.arriving=false;}
  const n=s.needs.residents().length;assert.ok(n>=100,`${n} residents`);
  const t0=performance.now();for(let i=0;i<10;i++)s.needs.step(1000);const per=(performance.now()-t0)/10;
  assert.ok(per<50,`one needs update for ${n} residents takes ${per.toFixed(1)} ms (runs at most once per game second)`);
  assert.equal(s.needs.work.size,n);assert.equal(s.needs.summary().population,n);console.log(`# 100-resident needs update: ${per.toFixed(2)} ms`);
});

test('performance-2: homes are worked out once while residents and houses stay the same, and again when either changes',()=>{
  const s=scene(),a=person(s,{x:40,y:40}),b=person(s,{x:41,y:40});
  const first=s.needs.homes();assert.equal(s.needs.homes(),first,'the same answer object while nothing changed');
  assert.equal(first.get(a.id).kind,'settlement');
  const house=add(s,'house',45,45),second=s.needs.homes();assert.notEqual(second,first,'a finished house: worked out again');
  assert.deepEqual(second.get(a.id),{kind:'house',buildingId:house.id});assert.equal(s.needs.homeOf(b).buildingId,house.id);
  const c=person(s,{x:42,y:40}),third=s.needs.homes();assert.notEqual(third,second,'a newcomer: worked out again');assert.ok(third.has(c.id));
  b.isAlive=false;assert.ok(!s.needs.homes().has(b.id),'a death: worked out again');
  s.buildings.splice(s.buildings.indexOf(house),1);assert.equal(s.needs.homeOf(a).kind,'settlement','the house is gone: back to the settlement');
  const state=s.needs.exportState();s.needs.importState(state);assert.equal(s.needs.homeOf(a).kind,'settlement','after a load the homes are worked out from the loaded assignments');
});
