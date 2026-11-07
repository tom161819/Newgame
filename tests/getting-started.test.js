import test from 'node:test';
import assert from 'node:assert/strict';
import { GETTING_STARTED_STEPS } from '../src/data/gettingStarted.js';
import { gettingStartedProgress,gettingStartedProblems } from '../src/systems/GettingStarted.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';

const complete=type=>({type});
const site=type=>({type,construction:{state:'planned'}});

test('Getting started lists the first buildings in an achievable order', () => {
  assert.deepEqual(GETTING_STARTED_STEPS.map(s=>s.buildingId),['warehouse','builder_workshop','granary','farmhouse','hunting_lodge','wheat_field','house','lumberjack_hut']);
  assert.deepEqual(gettingStartedProblems(objectRegistry),[]);
});

test('every step has a title and a reason in English and Czech', () => {
  for(const step of GETTING_STARTED_STEPS)for(const texts of [en,cs]){assert.ok(texts[`help.step.${step.id}`],step.id);assert.ok(texts[`help.step.${step.id}.why`],step.id);}
});

test('a step is done only when its building is completed', () => {
  let p=gettingStartedProgress([]);assert.equal(p.current,'warehouse');assert.equal(p.doneCount,0);assert.equal(p.allDone,false);
  p=gettingStartedProgress([site('warehouse')]);assert.equal(p.current,'warehouse','a construction site is not enough');
  p=gettingStartedProgress([complete('warehouse'),site('builder_workshop')]);assert.equal(p.current,'builder_workshop');assert.equal(p.doneCount,1);
  p=gettingStartedProgress([complete('warehouse'),complete('builder_workshop'),site('granary')]);assert.equal(p.current,'granary');assert.equal(p.doneCount,2);
  // Steps done out of order stay ticked; the highlight is the first one still missing.
  p=gettingStartedProgress([complete('house'),complete('warehouse')]);assert.equal(p.current,'builder_workshop');assert.deepEqual(p.steps.filter(s=>s.done).map(s=>s.id),['warehouse','house']);
  p=gettingStartedProgress(GETTING_STARTED_STEPS.map(s=>complete(s.buildingId)));assert.equal(p.allDone,true);assert.equal(p.current,null);assert.equal(p.doneCount,8);
  p=gettingStartedProgress([{definition:{id:'warehouse'},construction:{state:'complete'}}]);assert.equal(p.steps[0].done,true,'reads the definition id when type is missing');
});

test('the order check reports a step that needs a later building and an unknown building', () => {
  const registry=objectRegistry;
  assert.deepEqual(gettingStartedProblems(registry,[{id:'farm',buildingId:'farmhouse'},{id:'granary',buildingId:'granary'}]),['farm: needs granary before it'],'recommended earlier buildings keep the guide order too');
  assert.deepEqual(gettingStartedProblems(registry,[{id:'x',buildingId:'dragon_lair'}]),['x: unknown building dragon_lair']);
});
