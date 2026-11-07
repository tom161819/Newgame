import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { PolicySystem } from '../src/systems/PolicySystem.js';
import { TAX_RATES,RATIONS } from '../src/data/policy.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

function world({castle=true,residents=3}={}){
  const s=workerScene(undefined,{gameSettings:gameSettings()});s.policy=new PolicySystem(s);
  if(castle)s.buildings.push({id:900,type:'castle',x:10,y:10,tiles:[]});
  for(let i=0;i<residents;i++)s.workerSystem.create({x:40+i,y:40});
  return s;
}
const day=s=>s.gameTime.dayDuration;

test('policy has five tax rates and three rations; Normal is the default and invalid values are refused', () => {
  const s=world();assert.deepEqual(Object.keys(TAX_RATES),['none','low','normal','high','very_high']);assert.deepEqual(Object.keys(RATIONS),['small','normal','generous']);
  assert.equal(s.policy.tax,'normal');assert.equal(s.policy.rations,'normal');assert.equal(s.policy.happiness(),0);
  assert.equal(s.policy.set('tax','pirate'),false);assert.equal(s.policy.set('rations','feast'),false);assert.equal(s.policy.tax,'normal');
  assert.equal(s.policy.set('tax','very_high'),true);assert.equal(s.policy.set('rations','generous'),true);
  // Policy v2 P1: the choice waits for the morning; the effect then moves towards the new target.
  assert.deepEqual([s.policy.tax,s.policy.rations,s.policy.happiness()],['normal','normal',0]);assert.deepEqual(s.policy.pending,{tax:'very_high',rations:'generous'});
  assert.equal(s.policy.apply(),true);assert.deepEqual([s.policy.tax,s.policy.rations,s.policy.target(),s.policy.pending],['very_high','generous',-15,null]);
});

test('taxes are collected once each morning from every permanent resident while the Castle stands', () => {
  const s=world(),people=s.policy.residents().length,castle=s.production.dailyIncome().gold??0;let gold=s.inventory.count('gold');assert.ok(people>=3);
  s.gameTime.update(day(s));assert.equal(s.inventory.count('gold'),gold+castle+s.policy.residents().length*.5,'each resident pays 0.5');gold=s.inventory.count('gold');
  s.policy.set('tax','very_high');s.gameTime.update(day(s));assert.equal(s.inventory.count('gold'),gold+castle+s.policy.residents().length*1.5);gold=s.inventory.count('gold');
  assert.equal(s.policy.collect(s.gameTime.day),0,'never twice for one day');
  s.policy.set('tax','none');s.gameTime.update(day(s));assert.equal(s.inventory.count('gold'),gold+castle);
  const n=world({castle:false});n.gameTime.update(day(n));assert.equal(n.inventory.count('gold'),0,'no Castle, no taxes');
});

test('rations change how often residents eat and their Happiness; taxes move Happiness too', () => {
  const eaten=rations=>{const s=world({residents:2});s.inventory.add('bread',100);s.policy.set('rations',rations);s.policy.apply();const start=s.inventory.count('bread');for(let i=0;i<40;i++)s.foodSystem.advance(day(s)/10);return start-s.inventory.count('bread');};
  const small=eaten('small'),normal=eaten('normal'),generous=eaten('generous');
  // Over 4 days 2 residents eat 4 / 8 / 12 portions; the King always eats his own 2 a day (8).
  assert.deepEqual([small-8,normal-8,generous-8],[4,8,12]);
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],base=s.needs.status(w).happiness;
  const now=(tax,rations='normal')=>{s.policy.set('tax',tax);s.policy.set('rations',rations);s.policy.apply();s.policy.effect=s.policy.target();};
  now('very_high');assert.equal(s.needs.status(w).happiness,Math.max(0,base-20));
  now('none','generous');assert.equal(s.needs.status(w).happiness,Math.min(100,base+15));
});

test('policy is saved and loaded; an unknown rate is rejected', () => {
  const s=world();s.policy.set('tax','high');s.policy.set('rations','small');s.gameTime.update(day(s));
  s.policy.set('tax','low');s.gameTime.update(day(s)/2);
  const saved=validateGameState(serializeGameState(s));assert.deepEqual({...saved.policy,effect:undefined},{tax:'high',rations:'small',lastTaxDay:2,pending:{tax:'low',rations:'small'},effect:undefined,feastUntil:null,lastFeastAt:null});
  assert.ok(Math.abs(saved.policy.effect+2.5)<1e-6,'half a day at 5 points a day towards −25');
  for(const corrupt of [p=>p.pending={tax:'high',rations:'small'},p=>p.pending={tax:'pirate',rations:'small'},p=>p.effect=-40,p=>delete p.effect]){const bad=structuredClone(saved);corrupt(bad.policy);assert.throws(()=>validateGameState(bad));}
  const bad=structuredClone(saved);bad.policy.tax='robbery';assert.throws(()=>validateGameState(bad));
  const r=workerScene(saved.terrain,{starter:false,gameSettings:gameSettings()});r.policy=new PolicySystem(r);loadGameState(r,saved);assert.deepEqual(r.policy.exportState(),saved.policy);
});

test('Policy v2 P1: switching around dawn cannot dodge taxes or jump Happiness; the effect moves 5 points a day both ways', () => {
  const s=world(),castle=s.production.dailyIncome().gold??0;let gold=s.inventory.count('gold');
  s.gameTime.update(day(s)*.99);s.policy.set('tax','very_high');s.gameTime.update(day(s)*.02);
  assert.equal(s.policy.tax,'very_high','the choice took effect at dawn');assert.equal(s.inventory.count('gold'),gold+castle+s.policy.residents().length*1.5,'taxed at the rate in force');gold=s.inventory.count('gold');
  s.policy.set('tax','none');assert.equal(s.policy.tax,'very_high');assert.ok(s.policy.happiness()>-1,'no jump: only a moment of the new effect');
  s.gameTime.update(day(s)*.97);assert.equal(s.inventory.count('gold'),gold,'no second collection today');s.gameTime.update(day(s)*.02);assert.equal(s.inventory.count('gold'),gold+castle,'the next morning: no taxes');
  // Moving towards −20, then back towards +10, never faster than 5 points a day.
  const p=s.policy;p.cancel();p.effect=0;p.tax='very_high';p.pending=null;p.advance(day(s));assert.equal(p.happiness(),-5);p.advance(day(s)*3);assert.equal(p.happiness(),-20);p.advance(day(s));assert.equal(p.happiness(),-20);
  p.tax='none';p.advance(day(s)/2);assert.equal(p.happiness(),-17.5);assert.equal(p.daysToTarget(),5.5);
  assert.equal(p.set('tax','none'),true);assert.equal(p.pending,null,'choosing the policy in force cancels nothing new');
  assert.equal(p.set('tax','low'),true);assert.equal(p.cancel(),true);assert.equal(p.pending,null);
});

test('Policy v2 P1: the balance adds Castle income, taxes and trade, minus wages; food shows production, use and days left', () => {
  const s=world();s.policy.set('tax','high');const b=s.policy.balance(),wages=s.workerSystem.liveWorkers().reduce((n,w)=>n+s.wageSystem.dailyWage(w),0);
  assert.equal(b.taxes,s.policy.dailyTaxes());assert.equal(b.nextTaxes,s.policy.residents().length*1);assert.equal(b.wages,wages);assert.equal(b.trade,0);
  assert.equal(b.total,b.castle+b.taxes-b.wages);assert.equal(b.nextTotal,b.castle+b.nextTaxes-b.wages);
  s.resourceLedger={history:[{totals:{gold:{incomeBySource:{'Trade Sale':30},expensesBySource:{'Trade Purchase':6}}}},{totals:{}},{totals:{gold:{incomeBySource:{'Trade Sale':6}}}}]};
  assert.equal(s.policy.balance().trade,10,'average of the last three days');
  const f=s.policy.food();assert.deepEqual(Object.keys(f),['production','consumption','net','days']);assert.equal(f.net,f.production-f.consumption);
});

test('Policy v2 P2: rations cap the Food need; Generous adds a small bonus; situation penalties act at once with reasons', () => {
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],p=s.policy,now=(tax,rations)=>{p.set('tax',tax);p.set('rations',rations);p.apply();p.effect=p.target();};
  s.inventory.add('bread',100);now('normal','small');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);
  assert.equal(s.needs.status(w).food,60,'Small rations hold Food at 60');assert.equal(s.needs.status(w).foodCap,60);
  now('normal','normal');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);assert.equal(s.needs.status(w).food,100);
  // Small with High taxes: about the old −15 through the Food weight (0.35 × 40 = 14).
  now('normal','small');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);const small=s.needs.status(w).happiness;now('normal','normal');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);
  assert.equal(s.needs.status(w).happiness-small,14);
  now('normal','generous');assert.equal(p.target(),5);
  // 1. Taxed but unpaid.
  s.wageSystem.unpaid=()=>2;assert.deepEqual(p.contextPenalties(w).map(c=>[c.id,c.value]),[['taxedUnpaid',10]]);now('none','normal');assert.deepEqual(p.contextPenalties(w),[]);s.wageSystem.unpaid=()=>0;
  // 2. Promised generous food that never came: −10 and no well-fed bonus.
  now('normal','generous');const fed=s.foodSystem.residents;s.foodSystem.residents=new Map([[w.id,{hungry:true}]]);assert.deepEqual(p.contextPenalties(w).map(c=>[c.id,c.value]),[['promisedFood',15]]);
  const st=s.needs.status(w);assert.ok(st.policyContext.length===1);s.foodSystem.residents=fed;assert.equal(s.needs.status(w).happiness-st.happiness,15);
  // 3. High taxes while hungry.
  now('high','normal');assert.deepEqual(p.contextPenalties(w,{hungry:true}).map(c=>[c.id,c.value]),[['hungryTaxes',5]]);assert.deepEqual(p.contextPenalties(w,{hungry:false}),[]);
  now('very_high','normal');assert.equal(s.needs.status(w).mainProblem,'policy','the policy is the biggest loss');
  for(const status of [s.needs.status(w)])assert.ok(status.happiness>=0&&status.happiness<=100);
});

test('Policy v2 P3: residents alternate kinds of food; 2/3/4 kinds give +3/+5/+7 and bread +2; nothing is invented', () => {
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],f=s.foodSystem;
  for(const id of ['apple','bread','meat','fish'])s.inventory.add(id,5);
  const eaten=[];for(let i=0;i<4;i++){const before=Object.fromEntries(['apple','bread','meat','fish'].map(id=>[id,s.inventory.count(id)]));f.eat(w);eaten.push(Object.keys(before).find(id=>s.inventory.count(id)<before[id]));}
  assert.deepEqual(eaten,['apple','bread','meat','fish'],'each meal takes the kind eaten longest ago');assert.equal(f.varietyBonus(w.id),7+2);
  const solo=world({residents:1}),v=solo.workerSystem.liveWorkers()[0];solo.inventory.add('apple',5);solo.foodSystem.eat(v);solo.foodSystem.eat(v);assert.equal(solo.foodSystem.varietyBonus(v.id),0,'one kind: no bonus');
  solo.inventory.add('meat',1);solo.foodSystem.eat(v);assert.equal(solo.foodSystem.varietyBonus(v.id),3);
  // Three days later the old kinds no longer count.
  solo.gameTime.update(solo.gameTime.dayDuration*3);solo.inventory.add('apple',1);solo.foodSystem.eat(v);assert.deepEqual(solo.foodSystem.recentKinds(v.id),['apple']);
  const base=s.needs.status(w);assert.equal(base.variety,9);assert.equal(base.varietyKinds,4);
});

test('Policy v2 P3: a Feast costs one food and one Gold per resident, gives +15 for 2 days and can be held again after 5 days', () => {
  const s=world({residents:3}),p=s.policy,n=p.residents().length,day=s.gameTime.dayDuration;
  assert.equal(p.feastStatus().reason,'food');s.inventory.add('bread',n);assert.equal(p.feastStatus().reason,'gold');s.inventory.add('gold',n+2);
  assert.deepEqual(p.feastStatus(),{ok:true,cost:{food:n,gold:n,residents:n}});
  const w=p.residents()[0],before=s.needs.status(w).happiness;assert.equal(p.holdFeast(),true);
  assert.equal(s.inventory.count('bread'),0);assert.equal(s.inventory.count('gold'),2);assert.equal(p.feastBonus(),15);assert.equal(s.needs.status(w).happiness,Math.min(100,before+15+(s.needs.status(w).variety-0)));
  assert.equal(p.feastStatus().reason,'cooldown');assert.equal(p.feastStatus().days,5);
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.policy.feastUntil-saved.policy.lastFeastAt,2*day);
  for(const corrupt of [q=>q.feastUntil=null,q=>q.feastUntil+=1,q=>q.lastFeastAt=-5]){const bad=structuredClone(saved);corrupt(bad.policy);assert.throws(()=>validateGameState(bad));}
  s.gameTime.update(2*day+1);assert.equal(p.feastBonus(),0,'over after 2 days');assert.equal(p.feastStatus().days,3);
  s.gameTime.update(3*day);s.inventory.add('bread',10);s.inventory.add('gold',10);assert.equal(p.feastStatus().ok,true,'again after 5 days');
});
