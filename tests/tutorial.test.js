// E3 tutorial (plan m-e3-tutorial-sipka): steps follow the world, the first four building steps fit the starting stores.
import test from 'node:test';
import assert from 'node:assert/strict';
import { tutorialProgress } from '../src/systems/Tutorial.js';
import { TUTORIAL_STEPS } from '../src/data/tutorial.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { NEW_GAME_DEFAULTS } from '../src/systems/GameSettings.js';
import { gettingStartedProblems } from '../src/systems/GettingStarted.js';

const b=(type,complete=false)=>({type,construction:complete?undefined:{state:'planned'}});
const scene=({buildings=[b('castle',true),b('starter_stockpile',true)],jobs=['idle','idle','idle'],marked=false,speed=1}={})=>({buildings,gameSpeed:speed,workerSystem:{liveSubjects:()=>jobs.map(profession=>({profession}))},naturalResources:{mining:{rocks:{records:new Map(marked?[[1,{marked:true}]]:[])}}}});
test('steps tick from the state of the world, in order, and a skipped step counts as done',()=>{
  let p=tutorialProgress(scene());assert.equal(p.current.id,'king');
  const seen=new Set(['king']);p=tutorialProgress(scene(),{seen});assert.equal(p.current.id,'builder');
  p=tutorialProgress(scene({jobs:['builder']}),{seen});assert.equal(p.current.id,'granary');
  const world=[b('castle',true),b('starter_stockpile',true),b('granary'),b('farmhouse'),b('wheat_field'),b('hunting_lodge'),b('lumberjack_hut')];
  p=tutorialProgress(scene({buildings:world,jobs:['builder']}),{seen});assert.equal(p.current.id,'stone','a building also passes the king step');
  p=tutorialProgress(scene({buildings:world,jobs:['builder'],marked:true}));assert.equal(p.current.id,'house');
  p=tutorialProgress(scene({buildings:[...world,b('house')],jobs:['builder'],marked:true}));assert.equal(p.current.id,'house','a House must be finished');
  p=tutorialProgress(scene({buildings:[...world,b('house',true),b('material_yard'),b('builder_workshop')],jobs:['builder'],marked:true}));assert.equal(p.current.id,'speed');
  p=tutorialProgress(scene({buildings:[...world,b('house',true),b('material_yard'),b('builder_workshop')],jobs:['builder'],marked:true,speed:2}));assert.equal(p.allDone,true);
  assert.equal(tutorialProgress(scene(),{skipped:new Set(['king','builder'])}).current.id,'granary');
  assert.equal(TUTORIAL_STEPS.length,10);
});
test('the first four building steps are paid by the starting stores; the checklist under ? stays achievable',()=>{
  const ids=['granary','farmhouse','wheat_field','hunting_lodge','lumberjack_hut'],cost={};
  for(const id of ids)for(const [r,n] of Object.entries(objectRegistry.require(id).cost))cost[r]=(cost[r]??0)+n;
  assert.ok((cost.wood??0)<=NEW_GAME_DEFAULTS.startingWood&&(cost.stone??0)<=NEW_GAME_DEFAULTS.startingStone,JSON.stringify(cost));
  assert.deepEqual(gettingStartedProblems(objectRegistry),[]);
});
