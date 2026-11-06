import test from 'node:test';
import assert from 'node:assert/strict';
import { validStaffing,staffingOutput,staffingWorkFactor } from '../src/data/workplaces.js';
import { ObjectRegistry,objectRegistry } from '../src/systems/ObjectRegistry.js';
import { objectDefinitions } from '../src/data/objects/index.js';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
function build(s,type,x=47,y=43){const definition=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,definition);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
function until(s,predicate){for(let elapsed=0;elapsed<30000&&!predicate();elapsed+=25)s.tick(25);assert.ok(predicate());}
function minerFixture(count){const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter:true});s.workerSystem.unsubscribe();s.addResource(s.objectRegistry.require('stone_deposit'),{x:49,y:44},{id:`deposit-${s.naturalResources.nextDepositId++}`,kind:'deposit',remaining:80,max:80,boundBuildingId:null});const b=build(s,'quarry'),workers=[];for(let i=0;i<count;i++){const w=s.workerSystem.create({x:47+i,y:47});assert.ok(s.workplaceSystem.assign(b,w));workers.push(w);}until(s,()=>workers.every(w=>w.workTask?.kind==='mineDeposit'&&!w.nextTile&&!w.path.length));return {s,b,workers};}

test('curves validate every headcount; linear fallback preserves per-worker speed',()=>{
  const spec={capacity:3,staffingOutput:[0,.2,.5,1]};assert.ok(validStaffing(spec));assert.deepEqual([0,1,2,3].map(n=>staffingOutput(spec,n)),[0,.2,.5,1]);
  for(const n of [1,2,3])near(staffingWorkFactor({capacity:3},n),1);
  for(const value of [{capacity:0},{capacity:51},{capacity:2,staffingOutput:[0,1]},{capacity:1,staffingOutput:[.1,1]},{capacity:1,staffingOutput:[0,NaN]},{capacity:1,staffingOutput:[0,1.1]}])assert.equal(validStaffing(value),false);
});

test('real Quarry game-time work with 3/2/1 present Miners produces 100/50/20 percent, retaining skill multipliers',()=>{
  const totals=[];
  for(const n of [1,2,3]){const {s,b,workers}=minerFixture(n);for(const w of workers)w.workTask.progressMs=0;s.gameTime.update(1000);for(const w of workers)s.naturalResources.miningWork.update(w,1000);totals.push(workers.reduce((sum,w)=>sum+w.workTask.progressMs,0));assert.equal(s.workplaceSystem.staffing(b).present,n);near(s.workplaceSystem.staffing(b).output,[0,.2,.5,1][n]);
    if(n===1){const w=workers[0];w.skills.mining.level=4;const before=w.workTask.progressMs,eff=s.skillSystem.workEfficiency(w,'mining');s.naturalResources.miningWork.update(w,100);near(w.workTask.progressMs-before,100*.6*eff);}
  }
  near(totals[0]/totals[2],.2);near(totals[1]/totals[2],.5);
});

test('physical remote goals count, travelling, cargo and manual Hold do not',()=>{
  const {s,b,workers:[w]}=minerFixture(1);assert.equal(s.workplaceSystem.staffing(b).present,1);
  w.path.push({x:0,y:0});assert.equal(s.workplaceSystem.staffing(b).present,0);w.path=[];
  w.cargo={resource:'stone',amount:1};assert.equal(s.workplaceSystem.staffing(b).present,0);w.cargo=null;
  w.commandState={state:'Holding'};assert.equal(s.workplaceSystem.staffing(b).present,0);w.commandState={state:'Working'};assert.equal(s.workplaceSystem.staffing(b).present,1);
});

test('authoring import is atomic and cannot replace profession or arbitrary definitions',()=>{
  const registry=new ObjectRegistry(objectDefinitions),before=registry.require('quarry');
  assert.throws(()=>registry.configureWorkplaces({version:1,workplaces:{quarry:{capacity:2},mill:{capacity:0}}}));assert.equal(registry.require('quarry'),before);
  assert.throws(()=>registry.configureWorkplaces({version:1,workplaces:{quarry:{capacity:2,profession:'idle'}}}));
  registry.configureWorkplaces({version:1,workplaces:{quarry:{capacity:2,staffingOutput:[0,.4,1]}}});assert.equal(registry.require('quarry').workplace.capacity,2);assert.equal(registry.require('quarry').workplace.profession,'miner');assert.ok(Object.isFrozen(registry.require('quarry').workplace.staffingOutput));
  registry.configureWorkplaces({version:1,workplaces:{}});assert.deepEqual(registry.require('quarry').workplace,before.workplace);
});

test('capacity reduction releases excess residents safely, preserves wages, employment rules and current authored Save/Load',()=>{
  try{const {s,b,workers}=minerFixture(3);objectRegistry.configureWorkplaces({version:1,workplaces:{quarry:{capacity:1,staffingOutput:[0,1]}}});s.workplaceSystem.reconcileDefinitions();assert.equal(s.workplaceSystem.employees(b).length,1);assert.equal(s.workplaceSystem.records.get(b.id).capacity,1);for(const w of workers.slice(1)){assert.equal(w.profession,'idle');assert.equal(w.assignedWorkplaceId,null);assert.ok(w.isAlive);assert.equal(w.cargo,null);}
    assert.equal(s.workplaceSystem.summary(b).wages,s.wageSystem.dailyWage(workers[0]));const saved=validateGameState(serializeGameState(s)),r=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter:false});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);assert.equal('workplaceOverrides' in saved,false);
  }finally{objectRegistry.configureWorkplaces({version:1,workplaces:{}});}
});

test('recipe batches apply the total curve once, with exact skill-weighted work contributions',()=>{
  try{objectRegistry.configureWorkplaces({version:1,workplaces:{mill:{capacity:2,staffingOutput:[0,.25,1]}}});const totals=[];
    for(const n of [1,2]){const s=workerScene(undefined,{construction:true,foodProduction:true});s.workerSystem.unsubscribe();build(s,'granary',48,45);const b=build(s,'mill',54,45),workers=[];s.foodStorage.deposit(`input-${b.id}`,'wheat',4);
      for(let i=0;i<n;i++){const w=s.workerSystem.create({x:54+i,y:44});s.workplaceSystem.assign(b,w);workers.push(w);}
      const record=s.foodProduction.records.get(b.id);until(s,()=>!!record.cycle&&workers.every(w=>w.workTask?.kind==='produce'&&s.workplaceSystem.atWorkplace(w)));
      const before=record.cycle.workDone;s.gameTime.update(100);for(const w of workers)w.availableWorkMs=100;s.foodProduction.update(100);totals.push(record.cycle.workDone-before);
      near(record.cycle.workDone,Object.values(record.cycle.contributions).reduce((sum,value)=>sum+value,0));
      validateGameState(serializeGameState(s));
    }
    near(totals[0]/totals[1],.25);
  }finally{objectRegistry.configureWorkplaces({version:1,workplaces:{}});}
});

test('capacity edits cancel excess military/taming jobs immediately, including while paused before Save',()=>{
  try{
    const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,starter:true});s.workerSystem.unsubscribe();const b=build(s,'barracks',47,43),workers=[];for(let i=0;i<2;i++){const w=s.workerSystem.create({x:47+i,y:42});s.workplaceSystem.assign(b,w);workers.push(w);}s.inventory.add('gold',50);assert.equal(s.military.train(workers[1],'soldier'),null);assert.ok(s.military.order(workers[1]));
    s.gameTime.setPaused(true);objectRegistry.configureWorkplaces({version:1,workplaces:{barracks:{capacity:1}}});s.workplaceSystem.reconcileDefinitions();assert.equal(s.military.order(workers[1]),null);assert.equal(s.inventory.count('gold'),50);validateGameState(serializeGameState(s));
    objectRegistry.configureWorkplaces({version:1,workplaces:{}});
    const t=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,starter:true});t.workerSystem.unsubscribe();const stable=build(t,'stables',47,43),hands=[];for(let i=0;i<2;i++){const w=t.workerSystem.create({x:47+i,y:42});t.workplaceSystem.assign(stable,w);hands.push(w);}const horse=t.animalSystem.create(t.objectRegistry.require('horse'),{x:54,y:43});horse.wanderWait=1e8;t.stables.updateWorker(hands[1],25);assert.ok(t.stables.jobs.has(hands[1].id));
    t.gameTime.setPaused(true);objectRegistry.configureWorkplaces({version:1,workplaces:{stables:{capacity:1}}});t.workplaceSystem.reconcileDefinitions();assert.equal(t.stables.jobs.has(hands[1].id),false);assert.equal(hands[1].profession,'idle');assert.ok(horse.isAlive);validateGameState(serializeGameState(t));
  }finally{objectRegistry.configureWorkplaces({version:1,workplaces:{}});}
});
