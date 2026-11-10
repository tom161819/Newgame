import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
globalThis.document={querySelector:()=>({textContent:''})};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,farming:true,foodProduction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;};
function build(s,type,x,y,planned=false){const definition=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,definition);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition,reserveMaterials:planned});assert.ifError(result.error);const b=result.building;if(planned)s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
function until(s,predicate,max=60000){for(let t=0;t<max&&!predicate();t+=25)s.tick(25);assert.ok(predicate(),JSON.stringify(s.workerSystem.liveWorkers().map(w=>({id:w.id,job:w.profession,task:w.workTask,message:w.workMessage}))));}
function farmer(s,home,x=44,y=40){const w=s.workerSystem.create({x,y});assert.ok(s.workplaceSystem.assign(home,w));return w;}
function fixture(type='wheat_field'){const s=scene(),home=build(s,'farmhouse',45,40),plot=build(s,type,49,40,true);return {s,home,plot};}

test('zero-cost fields and orchards remain real sites; Builders and King cannot establish them or consume goods',()=>{
  for(const type of ['wheat_field','orchard']){const {s,plot}=fixture(type),builder=s.workerSystem.create({x:48,y:44});s.workerSystem.jobs.assign(builder,'builder');assert.deepEqual(plot.definition.cost,{});assert.deepEqual(plot.materialSupply.required,{});assert.equal(s.inventory.count('stone'),0);assert.equal(s.constructionSystem.commandKing(plot,{fetch:true}),false);assert.equal(s.constructionSystem.reserve(plot,builder,{x:48,y:40}),false);s.simulate(20000);assert.equal(plot.construction.workDone,0);assert.equal(builder.workTask,null);assert.equal(s.farmingSystem.records.has(plot.id),false);assert.equal(s.inventory.count('stone'),0);validateGameState(serializeGameState(s));}
});

test('Farmers physically establish only their own plots and earn Farming XP once; growth starts on completion',()=>{
  const {s,home,plot}=fixture(),other=build(s,'farmhouse',57,40),foreign=farmer(s,other,56,40);s.simulate(1000);assert.equal(s.constructionSystem.canWork(plot,foreign),false);assert.equal(plot.construction.workDone,0);const w=farmer(s,home);until(s,()=>plot.construction.workDone>0);assert.equal(w.workTask.kind,'build');assert.ok(s.constructionSystem.atSite(w,s.constructionSystem.assignments.get(w.id)));assert.equal(w.skills.farming.totalXP,0);assert.equal(w.skills.construction.totalXP,0);assert.equal(s.farmingSystem.records.has(plot.id),false);
  until(s,()=>buildingIsComplete(plot));assert.ok(w.skills.farming.totalXP>0);assert.equal(w.skills.construction.totalXP,0);const xp=w.skills.farming.totalXP,total=w.experience.totalXP;near(s.farmingSystem.records.get(plot.id).growthDays,0);assert.equal(s.inventory.count('wheat'),0);s.simulate(1000);assert.equal(w.skills.farming.totalXP,xp);assert.equal(w.experience.totalXP,total);assert.ok(s.farmingSystem.records.get(plot.id).growthDays>0);assert.equal(s.inventory.count('stone'),0);
});

test('partial establishment survives exact current Save/Load without a completion jump or repeated XP',()=>{
  const {s,home,plot}=fixture('orchard'),w=farmer(s,home);until(s,()=>plot.construction.workDone>500);const snapshot=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,snapshot);assert.deepEqual(serializeGameState(r),snapshot);const p=r.buildings.find(b=>b.id===plot.id),rw=r.workerSystem.workers.get(w.id),before=p.construction.workDone;r.tick(25);assert.ok(p.construction.workDone-before<=25+1e-7);assert.equal(rw.skills.farming.totalXP,0);until(r,()=>buildingIsComplete(p));assert.ok(rw.skills.farming.totalXP>0);assert.equal(rw.skills.construction.totalXP,0);assert.equal(r.inventory.count('apple'),0);validateGameState(serializeGameState(r));
});

test('cancelling partial planting releases slots and workers without goods refunds or XP',()=>{
  const {s,home,plot}=fixture(),w=farmer(s,home);until(s,()=>plot.construction.workDone>500);const stone=s.inventory.count('stone');assert.ok(s.constructionSystem.cancel(plot));assert.equal(w.workTask,null);assert.equal(s.constructionSystem.assignments.has(w.id),false);assert.equal(s.workerSystem.reservations.owners.size,0);assert.equal(s.inventory.count('stone'),stone);assert.equal(w.skills.farming.totalXP,0);assert.equal(w.skills.construction.totalXP,0);assert.equal(w.experience.totalXP,0);validateGameState(serializeGameState(s));
});

test('ripe reachable harvest preempts establishment within 250ms; cargo delivers once before planting resumes',()=>{
  const {s,home,plot}=fixture(),ripe=build(s,'wheat_field',49,45),w=farmer(s,home);until(s,()=>plot.construction.workDone>500);const record=s.farmingSystem.records.get(ripe.id);record.growthDays=ripe.definition.crop.growthDays;const start=s.gameTime.totalElapsed,progress=plot.construction.workDone;until(s,()=>w.workTask?.kind==='harvest',500);assert.ok(s.gameTime.totalElapsed-start<=250);assert.ok(plot.construction.workDone-progress<=250);until(s,()=>s.inventory.count('wheat')===10);assert.equal(w.skills.construction.totalXP,0);until(s,()=>w.workTask?.kind==='build'&&w.workTask.targetId===plot.id);until(s,()=>buildingIsComplete(plot));assert.equal(s.inventory.count('wheat'),10);
});

test('Hold and losing the owning farm stop physical establishment without remote progress',()=>{
  const {s,home,plot}=fixture(),w=farmer(s,home);until(s,()=>plot.construction.workDone>500);s.workerSystem.commands.hold(w);const progress=plot.construction.workDone;s.simulate(1000);assert.equal(plot.construction.workDone,progress);assert.equal(w.workTask,null);s.workerSystem.commands.resume(w);until(s,()=>w.workTask?.kind==='build');
  s.buildings=s.buildings.filter(b=>b!==home);for(const t of home.tiles)s.map[t.y][t.x]=0;s.farmingSystem.reconcilePlots();assert.equal(w.workTask,null);assert.equal(w.profession,'idle');assert.equal(plot.farmId,null);const stopped=plot.construction.workDone;s.simulate(1000);assert.equal(plot.construction.workDone,stopped);
});

test('C04 names a missing owning Farmer or Farmhouse and resolves without misreporting Builders',()=>{
  const {s,home,plot}=fixture(),builder=s.workerSystem.create({x:48,y:44});s.workerSystem.jobs.assign(builder,'builder');const diagnostics=new ProductionDiagnostics(s);assert.deepEqual(diagnostics.constructionIssues().map(i=>i.reason),['noFarmer']);const w=farmer(s,home);assert.deepEqual(diagnostics.constructionIssues(),[]);s.workerSystem.commands.hold(w);assert.deepEqual(diagnostics.constructionIssues().map(i=>i.reason),['noFarmer']);plot.farmId=null;assert.deepEqual(diagnostics.constructionIssues().map(i=>i.reason),['noFarm']);diagnostics.destroy();
});

test('a planned Farmhouse owns its plots: no Notices for them; orphan plots give one summary notice; cancelling the plan brings it back',async()=>{
  const {noticeText}=await import('../src/ui/noticeText.js'),{t}=await import('../src/i18n/index.js');
  const s=scene(),home=build(s,'farmhouse',45,40,true),plots=[[49,40],[49,44],[53,40],[53,44]].map(([x,y])=>build(s,'wheat_field',x,y,true));
  assert.equal(buildingIsComplete(home),false);assert.deepEqual(plots.map(p=>p.farmId),plots.map(()=>home.id),'a blueprint Farmhouse takes its four plots');
  const diagnostics=new ProductionDiagnostics(s);assert.deepEqual(diagnostics.constructionIssues().filter(i=>i.category==='construction'&&i.reason!=='noBuilder'),[]);
  const extra=[[45,46],[49,48]].map(([x,y])=>build(s,'wheat_field',x,y,true));assert.deepEqual(extra.map(p=>p.farmId),[null,null]);
  let farm=diagnostics.constructionIssues().filter(i=>i.reason==='noFarm');assert.equal(farm.length,1,'one notice for all orphan plots');assert.equal(farm[0].entityId,Math.min(...extra.map(p=>p.id)));assert.equal(farm[0].params.count,2);
  assert.equal(noticeText(s,farm[0]),t('notice.noFarmMany',{count:2}));
  s.constructionSystem.cancel(home);s.events?.emit?.('buildings:changed');s.farmingSystem.reconcilePlots();
  farm=diagnostics.constructionIssues().filter(i=>i.reason==='noFarm');assert.equal(farm[0]?.params.count,6,'without the planned Farmhouse every plot is an orphan again');
  diagnostics.destroy();
});
