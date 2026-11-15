import test from 'node:test';
import assert from 'node:assert/strict';
import { GETTING_STARTED_STEPS } from '../src/data/gettingStarted.js';
import { gettingStartedProgress,gettingStartedProblems } from '../src/systems/GettingStarted.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { JOBS } from '../src/data/jobs.js';
import { GUIDE_TASK_KINDS } from '../src/data/guide.js';
import { GROUND } from '../src/data/worldTerrain.js';

const complete=type=>({type});
const site=type=>({type,construction:{state:'planned'}});
const world=({buildings=[],jobs=[],king=false,water=false}={})=>({buildings,workerSystem:{liveSubjects:()=>jobs.map(profession=>({profession}))},unitSelection:{king},
  groundGrid:[[water?GROUND.SHALLOW:GROUND.GRASS]],fog:{enabled:true,displayState:()=>1}});

// Owner 15 Nov 2026: his task list and order.
test('Getting started follows the owner\'s tasks in an achievable order', () => {
  assert.deepEqual(GETTING_STARTED_STEPS.map(s=>s.id),['granary','builder','hunting_lodge','lumberjack_hut','material_yard','king','water','fisherman_hut']);
  assert.deepEqual(gettingStartedProblems(objectRegistry,GETTING_STARTED_STEPS,JOBS),[]);
  for(const step of GETTING_STARTED_STEPS){assert.ok(GUIDE_TASK_KINDS.includes(step.kind),step.id);for(const lang of ['cs','en']){assert.ok(step.title?.[lang],`${step.id} title ${lang}`);assert.ok(step.why?.[lang],`${step.id} why ${lang}`);}}
});

test('a build task is done only when its building is completed; job, king and water tasks read the world', () => {
  let p=gettingStartedProgress(world());assert.equal(p.current,'granary');assert.equal(p.doneCount,0);assert.equal(p.allDone,false);
  p=gettingStartedProgress(world({buildings:[site('granary')]}));assert.equal(p.current,'granary','a construction site is not enough');
  p=gettingStartedProgress(world({buildings:[complete('granary')]}));assert.equal(p.current,'builder');
  p=gettingStartedProgress(world({buildings:[complete('granary')],jobs:['builder']}));assert.equal(p.current,'hunting_lodge');
  const built=['granary','hunting_lodge','lumberjack_hut','material_yard'].map(complete);
  p=gettingStartedProgress(world({buildings:built,jobs:['builder']}));assert.equal(p.current,'king');
  p=gettingStartedProgress(world({buildings:built,jobs:['builder'],king:true}));assert.equal(p.current,'water');
  p=gettingStartedProgress(world({buildings:built,jobs:['builder'],king:true,water:true}));assert.equal(p.current,'fisherman_hut');
  p=gettingStartedProgress({...world({buildings:built,jobs:['builder']}),guideFlags:{king:true,water:true}});assert.equal(p.current,'fisherman_hut','latched flags count');
  // A later finished building passes the king and water tasks (a loaded game never falls back to them).
  p=gettingStartedProgress(world({buildings:[...built,complete('fisherman_hut')],jobs:['builder']}));assert.equal(p.allDone,true);assert.equal(p.current,null);
  // Still a plain list of buildings works (build tasks only).
  p=gettingStartedProgress([{definition:{id:'granary'},construction:{state:'complete'}}]);assert.equal(p.steps[0].done,true,'reads the definition id when type is missing');
});

test('water counts only once a river or pond tile is explored', () => {
  const unexplored={...world({water:true}),fog:{enabled:true,displayState:()=>0}};
  assert.equal(gettingStartedProgress(unexplored).steps.find(s=>s.id==='water').done,false);
  assert.equal(gettingStartedProgress({...unexplored,fog:{enabled:false}}).steps.find(s=>s.id==='water').done,true,'fog off: everything is seen');
});

test('the order check reports a step that needs a later building, an unknown building, job or kind', () => {
  const registry=objectRegistry;
  assert.deepEqual(gettingStartedProblems(registry,[{id:'farm',kind:'build',building:'farmhouse'},{id:'granary',kind:'build',building:'granary'}]),['farm: needs granary before it'],'recommended earlier buildings keep the guide order too');
  assert.deepEqual(gettingStartedProblems(registry,[{id:'x',kind:'build',building:'dragon_lair'}]),['x: unknown building dragon_lair']);
  assert.deepEqual(gettingStartedProblems(registry,[{id:'j',kind:'job',job:'wizard'},{id:'q',kind:'quest'}],JOBS),['j: unknown job wizard','q: unknown kind quest']);
});
