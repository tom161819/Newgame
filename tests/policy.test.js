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
  assert.equal(s.policy.set('tax','very_high'),true);assert.equal(s.policy.set('rations','generous'),true);assert.equal(s.policy.happiness(),-10);
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
  const eaten=rations=>{const s=world({residents:2});s.inventory.add('bread',100);s.policy.set('rations',rations);const start=s.inventory.count('bread');for(let i=0;i<40;i++)s.foodSystem.advance(day(s)/10);return start-s.inventory.count('bread');};
  const small=eaten('small'),normal=eaten('normal'),generous=eaten('generous');
  // Over 4 days 2 residents eat 4 / 8 / 12 portions; the King always eats his own 2 a day (8).
  assert.deepEqual([small-8,normal-8,generous-8],[4,8,12]);
  const s=world({residents:1}),w=s.workerSystem.liveWorkers()[0],base=s.needs.status(w).happiness;
  s.policy.set('tax','very_high');assert.equal(s.needs.status(w).happiness,Math.max(0,base-20));
  s.policy.set('tax','none');s.policy.set('rations','generous');assert.equal(s.needs.status(w).happiness,Math.min(100,base+20));
});

test('policy is saved and loaded; an unknown rate is rejected', () => {
  const s=world();s.policy.set('tax','high');s.policy.set('rations','small');s.gameTime.update(day(s));
  const saved=validateGameState(serializeGameState(s));assert.deepEqual(saved.policy,{tax:'high',rations:'small',lastTaxDay:2});
  const bad=structuredClone(saved);bad.policy.tax='robbery';assert.throws(()=>validateGameState(bad));
  const r=workerScene(saved.terrain,{starter:false,gameSettings:gameSettings()});r.policy=new PolicySystem(r);loadGameState(r,saved);assert.deepEqual(r.policy.exportState(),saved.policy);
});
