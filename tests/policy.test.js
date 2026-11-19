import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { PolicySystem } from '../src/systems/PolicySystem.js';
import { TAX_RATES,RATIONS,foodNeedTarget,normalizeTax,taxHappiness,taxLevel,validTax } from '../src/data/policy.js';
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
  assert.equal(s.policy.tax,.5);assert.equal(s.policy.rations,'normal');assert.equal(s.policy.happiness(),0);
  assert.equal(s.policy.set('tax','pirate'),false);assert.equal(s.policy.set('rations','feast'),false);assert.equal(s.policy.set('tax',NaN),false);assert.equal(s.policy.tax,.5);
  assert.equal(s.policy.set('tax','very_high'),true);assert.equal(s.policy.set('rations','generous'),true);
  // Policy v2 P1: the choice waits for the morning; the effect then moves towards the new target.
  assert.deepEqual([s.policy.tax,s.policy.rations,s.policy.happiness()],[.5,'normal',0]);assert.deepEqual(s.policy.pending,{tax:1.5,rations:'generous'});
  assert.equal(s.policy.apply(),true);assert.deepEqual([s.policy.tax,s.policy.rations,s.policy.target(),s.policy.pending],[1.5,'generous',-20,null]);
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
  // Over 4 days each of 2 residents eats 0.4 / 0.8 / 1.2 portions a day (m-jidlo-balanc): 1.6 / 3.2 / 4.8 → 1 / 3 / 4 whole
  // meals each; the King always eats his own 2 a day (8).
  assert.deepEqual([small-8,normal-8,generous-8],[2,6,8]);
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],base=s.needs.status(w).happiness;
  const now=(tax,rations='normal')=>{s.policy.set('tax',tax);s.policy.set('rations',rations);s.policy.apply();s.policy.effect=s.policy.target();};
  now('very_high');assert.equal(s.needs.status(w).happiness,Math.max(0,base-20));
  // #68: rations no longer add to Happiness directly (Generous raises the Food need instead).
  now('none','generous');assert.equal(s.needs.status(w).happiness,Math.min(100,base+10));
});

test('policy is saved and loaded; an unknown rate is rejected', () => {
  const s=world();s.policy.set('tax','high');s.policy.set('rations','small');s.gameTime.update(day(s));
  s.policy.set('tax','low');s.gameTime.update(day(s)/2);
  const saved=validateGameState(serializeGameState(s));assert.deepEqual({...saved.policy,effect:undefined},{tax:1,rations:'small',lastTaxDay:2,pending:{tax:.25,rations:'small'},effect:undefined,feastUntil:null,lastFeastAt:null});
  assert.ok(Math.abs(saved.policy.effect+2.5)<1e-6,'half a day at 5 points a day towards −25');
  for(const corrupt of [p=>p.pending={tax:1,rations:'small'},p=>p.pending={tax:'pirate',rations:'small'},p=>p.pending={tax:.33,rations:'small'},p=>p.tax=1.55,p=>p.effect=-40,p=>p.effect=15.01,p=>delete p.effect]){const bad=structuredClone(saved);corrupt(bad.policy);assert.throws(()=>validateGameState(bad));}
  // #68: a save from before the change may still hold the removed Generous +5 on top of No taxes (+10).
  const legacy=structuredClone(saved);legacy.policy.effect=15;assert.doesNotThrow(()=>validateGameState(legacy));
  const bad=structuredClone(saved);bad.policy.tax='robbery';assert.throws(()=>validateGameState(bad));
  const r=workerScene(saved.terrain,{starter:false,gameSettings:gameSettings()});r.policy=new PolicySystem(r);loadGameState(r,saved);assert.deepEqual(r.policy.exportState(),saved.policy);
});

test('Policy v2 P1: switching around dawn cannot dodge taxes or jump Happiness; the effect moves 5 points a day both ways', () => {
  const s=world(),castle=s.production.dailyIncome().gold??0;let gold=s.inventory.count('gold');
  s.gameTime.update(day(s)*.99);s.policy.set('tax','very_high');s.gameTime.update(day(s)*.02);
  assert.equal(s.policy.tax,1.5,'the choice took effect at dawn');assert.equal(s.inventory.count('gold'),gold+castle+s.policy.residents().length*1.5,'taxed at the rate in force');gold=s.inventory.count('gold');
  s.policy.set('tax','none');assert.equal(s.policy.tax,1.5);assert.ok(s.policy.happiness()>-1,'no jump: only a moment of the new effect');
  s.gameTime.update(day(s)*.97);assert.equal(s.inventory.count('gold'),gold,'no second collection today');s.gameTime.update(day(s)*.02);assert.equal(s.inventory.count('gold'),gold+castle,'the next morning: no taxes');
  // Moving towards −20, then back towards +10, never faster than 5 points a day.
  const p=s.policy;p.cancel();p.effect=0;p.tax=1.5;p.pending=null;p.advance(day(s));assert.equal(p.happiness(),-5);p.advance(day(s)*3);assert.equal(p.happiness(),-20);p.advance(day(s));assert.equal(p.happiness(),-20);
  p.tax=0;p.advance(day(s)/2);assert.equal(p.happiness(),-17.5);assert.equal(p.daysToTarget(),5.5);
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

test('#68: the Food need comes from rations and variety: Small/Normal/Generous 30/60/80, +5 per kind, at most 100, 0 without food', () => {
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],p=s.policy,f=s.foodSystem,today=()=>s.gameTime.day;
  const rations=r=>{p.set('rations',r);p.apply();},settle=()=>{for(let i=0;i<30;i++)s.needs.step(s.gameTime.dayDuration/10);},meals=kinds=>{f.syncResidents();const r=f.residents.get(w.id);r.hungry=false;r.meals=Object.fromEntries(kinds.map(k=>[k,today()]));};
  const target=()=>s.needs.status(w).foodTarget;
  for(const [r,v] of [['small',30],['normal',60],['generous',80]]){rations(r);meals([]);assert.equal(target(),v,r);assert.equal(p.foodBase(),v);}
  rations('normal');for(const [kinds,v] of [[['apple'],65],[['apple','bread'],70],[['apple','bread','meat'],75],[['apple','bread','meat','fish'],80]]){meals(kinds);assert.equal(target(),v,`${kinds.length} kinds`);}
  rations('generous');meals(['apple','bread','meat','fish']);assert.equal(target(),100,'80 + 20');
  assert.equal(foodNeedTarget('generous',5).target,100,'capped at 100');assert.equal(foodNeedTarget('small',2).target,40);
  f.residents.get(w.id).hungry=true;assert.equal(target(),0,'no food: 0 %');assert.equal(s.needs.status(w).foodUnfed,true);
  // The value moves towards the target at the old rates (falls 50, rises 100 a game day), never jumps.
  rations('normal');meals(['apple']);const r=s.needs.records.get(w.id)??(s.needs.step(1),s.needs.records.get(w.id));r.food=100;
  s.needs.step(s.gameTime.dayDuration/10);assert.equal(r.food,95,'falls gradually');settle();assert.equal(s.needs.status(w).food,65);
  rations('generous');meals(['apple','bread','meat','fish']);s.needs.step(s.gameTime.dayDuration/10);assert.equal(r.food,75,'rises gradually');settle();assert.equal(s.needs.status(w).food,100);
  // Portions per day are unchanged (0.5 / 1 / 1.5), see the rations test above.
  assert.deepEqual(Object.values(RATIONS).map(x=>x.portions),[.4,.8,1.2]);
});

test('#68: the Food tooltip shows rations + variety = target (en + cs); a resident without food sees the hunger text', async () => {
  const { needTooltip }=await import('../src/ui/NeedsDisplay.js');const { setLanguage }=await import('../src/i18n/index.js');
  const st={foodRations:'normal',foodBase:60,foodKinds:3,foodVariety:15,foodTarget:75,hungry:false,foodUnfed:false};
  assert.equal(needTooltip('food',st),'Normal rations 60 % + 3 kinds of food 15 % = 75 %');
  assert.equal(needTooltip('food',{...st,foodRations:'small',foodBase:30,foodKinds:1,foodVariety:5,foodTarget:35}),'Small rations 30 % + 1 kind of food 5 % = 35 %');
  assert.match(needTooltip('food',{...st,foodUnfed:true}),/^Missed meals/);
  setLanguage('cs',{persist:false});try{
    assert.equal(needTooltip('food',st),'Běžné příděly 60 % + 3 druhy jídla 15 % = 75 %');
    assert.equal(needTooltip('food',{...st,foodRations:'generous',foodBase:80,foodKinds:0,foodVariety:0,foodTarget:80}),'Štědré příděly 80 % + 0 druhů jídla 0 % = 80 %');
  }finally{setLanguage('en',{persist:false});}
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0];s.needs.step(1000);assert.equal(needTooltip('food',s.needs.status(w)),'Normal rations 60 % + 0 kinds of food 0 % = 60 %');
});

test('Policy v2 P2 / #68: Small rations lower Happiness through the Food need; no ration bonus; situation penalties act at once with reasons', () => {
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],p=s.policy,now=(tax,rations)=>{p.set('tax',tax);p.set('rations',rations);p.apply();p.effect=p.target();};
  s.inventory.add('bread',100);now('normal','small');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);
  assert.equal(s.needs.status(w).food,30,'Small rations hold Food at 30');assert.equal(s.needs.status(w).foodBase,30);
  now('normal','normal');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);assert.equal(s.needs.status(w).food,60);
  // Small vs Normal: 0.35 × 30 = 10.5 Happiness through the Food weight.
  now('normal','small');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);const small=s.needs.status(w).happiness;now('normal','normal');for(let i=0;i<20;i++)s.needs.step(s.gameTime.dayDuration/10);
  assert.ok(Math.abs(s.needs.status(w).happiness-small-10.5)<=.5);
  now('normal','generous');assert.equal(p.target(),0,'#68: no Generous +5');assert.equal(p.target({tax:0,rations:'generous'}),10);
  // 1. Taxed but unpaid.
  s.wageSystem.unpaid=()=>2;assert.deepEqual(p.contextPenalties(w).map(c=>[c.id,c.value]),[['taxedUnpaid',10]]);now('none','normal');assert.deepEqual(p.contextPenalties(w),[]);s.wageSystem.unpaid=()=>0;
  // 2. Promised generous food that never came: −10.
  now('normal','generous');const fed=s.foodSystem.residents;s.foodSystem.residents=new Map([[w.id,{hungry:true}]]);assert.deepEqual(p.contextPenalties(w).map(c=>[c.id,c.value]),[['promisedFood',10]]);
  const st=s.needs.status(w);assert.ok(st.policyContext.length===1);s.foodSystem.residents=fed;assert.equal(s.needs.status(w).happiness-st.happiness,10);
  // 3. High taxes while hungry.
  now('high','normal');assert.deepEqual(p.contextPenalties(w,{hungry:true}).map(c=>[c.id,c.value]),[['hungryTaxes',5]]);assert.deepEqual(p.contextPenalties(w,{hungry:false}),[]);
  now('very_high','normal');assert.equal(s.needs.status(w).mainProblem,'policy','the policy is the biggest loss');
  for(const status of [s.needs.status(w)])assert.ok(status.happiness>=0&&status.happiness<=100);
});

test('Policy v2 P3 / #68: residents alternate kinds of food; variety raises the Food need, not Happiness directly; nothing is invented', () => {
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],f=s.foodSystem;
  for(const id of ['apple','bread','meat','fish'])s.inventory.add(id,5);
  const eaten=[];for(let i=0;i<4;i++){const before=Object.fromEntries(['apple','bread','meat','fish'].map(id=>[id,s.inventory.count(id)]));f.eat(w);eaten.push(Object.keys(before).find(id=>s.inventory.count(id)<before[id]));}
  assert.deepEqual(eaten,['apple','bread','meat','fish'],'each meal takes the kind eaten longest ago');assert.equal(f.recentKinds(w.id).length,4);assert.equal(f.varietyBonus,undefined,'the P3 Happiness bonus is gone');
  const solo=world({residents:1}),v=solo.workerSystem.liveWorkers()[0];solo.inventory.add('apple',5);solo.foodSystem.eat(v);solo.foodSystem.eat(v);assert.deepEqual(solo.foodSystem.recentKinds(v.id),['apple'],'one kind');
  solo.inventory.add('meat',1);solo.foodSystem.eat(v);assert.deepEqual(solo.foodSystem.recentKinds(v.id),['apple','meat']);
  // Three days later the old kinds no longer count.
  solo.gameTime.update(solo.gameTime.dayDuration*3);solo.inventory.add('apple',1);solo.foodSystem.eat(v);assert.deepEqual(solo.foodSystem.recentKinds(v.id),['apple']);
  const base=s.needs.status(w);assert.equal(base.foodKinds,4);assert.equal(base.foodTarget,80);assert.equal(base.variety,undefined);
  // Happiness = the weighted needs + nothing for variety: the same resident with the same needs but one kind is equally happy.
  const one=world({residents:1}),u=one.workerSystem.liveWorkers()[0];one.inventory.add('apple',1);one.foodSystem.eat(u);
  assert.equal(one.needs.status(u).happiness,s.needs.status(w).happiness,'same stored Food need, same Happiness');
});

test('Policy v2 P3: a Feast costs one food and one Gold per resident, gives +15 for 2 days and can be held again after 5 days', () => {
  const s=world({residents:3}),p=s.policy,n=p.residents().length,day=s.gameTime.dayDuration;
  assert.equal(p.feastStatus().reason,'food');s.inventory.add('bread',n);assert.equal(p.feastStatus().reason,'gold');s.inventory.add('gold',n+2);
  assert.deepEqual(p.feastStatus(),{ok:true,cost:{food:n,gold:n,residents:n}});
  const w=p.residents()[0],before=s.needs.status(w).happiness;assert.equal(p.holdFeast(),true);
  assert.equal(s.inventory.count('bread'),0);assert.equal(s.inventory.count('gold'),2);assert.equal(p.feastBonus(),15);assert.equal(s.needs.status(w).happiness,Math.min(100,before+15));
  assert.equal(p.feastStatus().reason,'cooldown');assert.equal(p.feastStatus().days,5);
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.policy.feastUntil-saved.policy.lastFeastAt,2*day);
  for(const corrupt of [q=>q.feastUntil=null,q=>q.feastUntil+=1,q=>q.lastFeastAt=-5]){const bad=structuredClone(saved);corrupt(bad.policy);assert.throws(()=>validateGameState(bad));}
  s.gameTime.update(2*day+1);assert.equal(p.feastBonus(),0,'over after 2 days');assert.equal(p.feastStatus().days,3);
  s.gameTime.update(3*day);s.inventory.add('bread',10);s.inventory.add('gold',10);assert.equal(p.feastStatus().ok,true,'again after 5 days');
});

// Owner 19 Nov 2026: the tax slider is analog – any rate 0–1.5 in steps of 0.05; Happiness runs between the named levels.
test('analog tax: rates snap to 0.05, Happiness and the "high taxes" rule follow the nearest levels, taxes scale', () => {
  assert.deepEqual([normalizeTax(.33),normalizeTax(-1),normalizeTax(9),normalizeTax('high'),normalizeTax('x')],[.35,0,1.5,1,null]);
  for(const [rate,happiness,level] of [[0,10,'none'],[.1,8,'none'],[.25,5,'low'],[.4,2,'normal'],[.75,-5,'normal'],[.8,-6,'high'],[1.25,-15,'high'],[1.5,-20,'very_high']]){
    assert.ok(Math.abs(taxHappiness(rate)-happiness)<1e-9,`happiness at ${rate}`);assert.equal(taxLevel(rate),level,`level at ${rate}`);assert.equal(validTax(rate),true);}
  assert.equal(validTax(.33),false);assert.equal(validTax(1.55),false);
  const s=world(),p=s.policy,n=p.residents().length;assert.equal(p.set('tax',.73),true);assert.equal(p.pending.tax,.75);
  assert.equal(p.balance().nextTaxes,Math.round(n*.75*100)/100);p.apply();assert.equal(p.target(),-5);
  const w=s.workerSystem.liveWorkers()[0];assert.deepEqual(p.contextPenalties(w,{hungry:true}).filter(c=>c.id==='hungryTaxes'),[],'0.75 still reads as Normal');
  p.set('tax',.8);p.apply();assert.deepEqual(p.contextPenalties(w,{hungry:true}).filter(c=>c.id==='hungryTaxes').map(c=>c.value),[5]);
});
