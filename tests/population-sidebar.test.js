import test from 'node:test';
import assert from 'node:assert/strict';
import { populationSummary,populationWindow,professionColor,humanPortrait } from '../src/ui/populationData.js';
import { HUMAN_APPEARANCE } from '../src/data/humanAppearance.js';
import { JOBS } from '../src/data/jobs.js';
import { workerScene } from './helpers/workerScene.js';

test('population reuses living permanent residents, excludes strangers/deaths and preserves individual progress',()=>{
  const scene=workerScene(),system=scene.workerSystem,a=system.create({x:40,y:41}),b=system.create({x:41,y:41}),dead=system.create({x:42,y:41}),visitor=system.create({x:43,y:41});
  system.jobs.assign(b,'miner');visitor.isSubject=false;dead.currentHP=0;dead.isAlive=false;system.onDeath(dead);
  const progress=structuredClone(a.experience),summary=populationSummary(system.workers.values());
  assert.equal(summary.total,2);assert.equal(summary.employed,1);assert.equal(summary.unemployed,1);assert.equal(summary.residents[0],a);assert.equal(summary.residents[1],b);
  assert.deepEqual(system.liveSubjects(),summary.residents);assert.deepEqual(a.experience,progress);
});

test('population observers see created, imported and deceased subjects without creating a second record store',()=>{
  const scene=workerScene(),system=scene.workerSystem,counts=[],stop=system.subscribe(count=>counts.push(count));
  const worker=system.create({x:40,y:41});assert.equal(counts.at(-1),1);
  system.importState(system.exportState());assert.equal(counts.at(-1),1);
  worker.currentHP=0;worker.isAlive=false;system.onDeath(worker);assert.equal(counts.at(-1),0);assert.equal(system.workers.size,1);
  stop();const size=counts.length;system.create({x:41,y:41});assert.equal(counts.length,size);
});

test('200 residents use a bounded scroll window, including empty and shrinking lists',()=>{
  for(const scroll of [0,300,6000,11900,100000]){
    const range=populationWindow(200,scroll,420);assert.ok(range.end-range.start<=14);assert.ok(range.start>=0&&range.end<=200);assert.ok(range.end>range.start);
  }
  assert.deepEqual(populationWindow(0,10000,420),{start:0,end:0});assert.deepEqual(populationWindow(3,10000,420),{start:0,end:3});
  const middle=populationWindow(200,6000,420);assert.ok(middle.start<=100&&middle.end>106);
});

test('every actual profession has a distinct central portrait colour and fallback matches the procedural human palette',()=>{
  const colors=Object.keys(JOBS).map(professionColor);assert.equal(new Set(colors).size,Object.keys(JOBS).length);for(const color of colors)assert.match(color,/^#[a-f0-9]{6}$/i);
  assert.equal(professionColor('future-unconfigured-job'),JOBS.idle.portraitColor);
  const svg=decodeURIComponent(humanPortrait().split(',').slice(1).join(','));assert.ok(svg.startsWith('<svg'));for(const key of ['skin','hair','tunic'])assert.ok(svg.includes('#'+HUMAN_APPEARANCE[key].toString(16)));
});
