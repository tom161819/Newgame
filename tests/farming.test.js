import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FARMING_RULES,cropStage } from '../src/data/farming.js';
import { placeBuilding,buildingIsComplete,buildingTiles } from '../src/game/buildings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { totalXPForLevel } from '../src/data/experience.js';
import { resourceCandidates,tileKey } from '../src/game/stones.js';
globalThis.document={querySelector:()=>({textContent:''})};

const scene=(options={})=>workerScene(undefined,{construction:true,farming:true,gameSettings:gameSettings({dayLengthSeconds:60,wildlifeRespawn:'off',...options})});
function building(s,type,x,y,blueprint=false){const definition=objectRegistry.require(type);
  // Completed structures are legacy world fixtures, deliberately permitted
  // without a Granary. New blueprint placement uses the current requirements.
  if(!blueprint){const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition,x,y,tiles:buildingTiles({x,y},definition)};s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=definition.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
  ensureBuildingPrerequisites(s,definition);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);
  const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);const b=result.building;
  if(blueprint)s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;
}
function farmer(s,home,tile={x:44,y:40}){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(home,w),true);return w;}
function until(s,predicate,max=20000){let elapsed=0;while(!predicate()&&elapsed<max){s.tick(25);elapsed+=25;}assert.ok(predicate(),`Condition not reached after ${elapsed}ms`);return elapsed;}
function farm(options={}){const s=scene(options),home=building(s,'farmhouse',45,40),wheat=building(s,'wheat_field',49,40),orchard=building(s,'orchard',49,46);return {s,home,wheat,orchard};}

test('farm buildings retain exact costs, 2x2/3x3 footprints and original physical blueprints; unfinished sites neither grow nor employ farmers',()=>{
  const s=scene();for(const [type,cost,width,x]of [['farmhouse',10,2,45],['wheat_field',0,3,50],['orchard',0,3,55]]){
    const b=building(s,type,x,40,true);assert.equal(b.definition.cost.stone??0,cost);assert.equal(b.tiles.length,width*width);assert.equal(s.inventory.count('stone'),0);assert.equal(buildingIsComplete(b),false);for(const t of b.tiles)assert.equal(s.map[t.y][t.x],1);
    assert.equal(s.farmingSystem.records.has(b.id),false);const w=s.workerSystem.create({x:x-1,y:43});assert.equal(s.workplaceSystem.assign(b,w),false);
  }
  s.gameTime.update(600000);assert.equal(s.farmingSystem.records.size,0);assert.equal(s.inventory.count('wheat'),0);assert.equal(s.inventory.count('apple'),0);
  for(const b of s.buildings.filter(b=>!buildingIsComplete(b))){if(b.definition.crop){assert.equal(s.constructionSystem.commandKing(b),false);const home=s.buildings.find(x=>x.id===b.farmId),w=s.workerSystem.liveSubjects().find(w=>w.profession==='idle');assert.ok(s.workplaceSystem.assign(home,w));}else assert.equal(s.constructionSystem.commandKing(b),true);until(s,()=>buildingIsComplete(b),40000);if(b.definition.crop){assert.ok(s.farmingSystem.records.has(b.id));for(const t of b.tiles)assert.equal(s.map[t.y][t.x],0);assert.equal(s.farmingSystem.records.get(b.id).growthDays,0);}}
});
test('Farmhouse assigns exactly three existing Farmers, preserves their skill/talent, and never shares an employee between workplaces',()=>{
  const {s,home}=farm(),other=building(s,'farmhouse',45,47),workers=[0,1,2,3].map(i=>s.workerSystem.create({x:43,y:40+i}));
  for(const w of workers.slice(0,3)){const talent=w.naturalTalent,skills=structuredClone(w.skills);assert.equal(s.workplaceSystem.assign(home,w),true);assert.equal(w.profession,'farmer');assert.deepEqual(w.skills,skills);assert.equal(w.naturalTalent,talent);}
  assert.equal(s.workplaceSystem.assign(home,workers[3]),false);assert.equal(s.workplaceSystem.assign(other,workers[0]),true);assert.equal(s.workplaceSystem.employees(home).length,2);assert.equal(s.workplaceSystem.employees(other).length,1);
});
test('wheat and apples pass all four stages and mature after 2/3 configured game days independent of FPS, without automatic resources or XP',()=>{
  for(const seconds of [60,120,240])for(const fps of [30,144]){
    const {s,wheat,orchard}=farm({dayLengthSeconds:seconds});const seen=new Set([0]);
    for(let i=0;i<seconds*3*fps;i++){s.gameTime.update(1000/fps);if(i%(fps*10)===0)seen.add(s.farmingSystem.sync(wheat).stage);}
    assert.equal(s.farmingSystem.sync(wheat).growthDays,2);assert.equal(s.farmingSystem.sync(orchard).growthDays,3);assert.equal(s.farmingSystem.ripe(wheat),true);assert.equal(s.farmingSystem.ripe(orchard),true);assert.deepEqual([...seen].sort(),[0,1,2,3]);assert.equal(s.inventory.count('wheat'),0);assert.equal(s.inventory.count('apple'),0);assert.equal(s.character.experience.totalXP,0);
  }
  assert.deepEqual([0,1/3,2/3,1].map(f=>cropStage(f*3,3)),[0,1,2,3]);
});
test('pause and blueprint time do not grant plant growth; the growth modifier hook affects plants but never yields resources by itself',()=>{
  const {s,wheat}=farm();s.gameTime.setPaused(true);s.gameTime.update(999999);assert.equal(s.farmingSystem.sync(wheat).growthDays,0);s.gameTime.setPaused(false);
  s.farmingSystem.growthModifier=()=>0;s.gameTime.update(60000);assert.equal(s.farmingSystem.sync(wheat).growthDays,0);s.farmingSystem.growthModifier=()=>1.5;s.gameTime.update(60000);assert.equal(s.farmingSystem.sync(wheat).growthDays,1.5);assert.equal(s.inventory.count('wheat'),0);
});
test('farmer physically visits a workplace and ripe field, works, then gains exactly 8 Wheat plus one overall/Farming XP reward',()=>{
  const {s,home,wheat}=farm();s.gameTime.update(120000);const w=farmer(s,home);w.naturalTalent='farming';const start={...w.position};
  s.tick(25);assert.equal(s.inventory.count('wheat'),0);assert.equal(w.experience.totalXP,0);until(s,()=>w.workTask?.kind==='harvest'&&w.workTask.progressMs>0);assert.notDeepEqual(w.position,start);assert.ok(w.tile.x>=wheat.x&&w.tile.x<wheat.x+3);assert.ok(w.workTask.progressMs<FARMING_RULES.crops.wheat_field.workDuration);assert.equal(s.inventory.count('wheat'),0);
  const oldTask=structuredClone(w.workTask);until(s,()=>s.inventory.count('wheat')===8);assert.equal(w.experience.totalXP,8);assert.equal(w.skills.farming.totalXP,9.6);const record=s.farmingSystem.records.get(wheat.id);assert.equal(record.cycle,1);assert.equal(record.stage,0);assert.equal(record.reservedBy,null);assert.ok(s.pathWear.active.size>0);assert.equal(s.farmingSystem.harvest(w,wheat,record),false);assert.equal(s.inventory.count('wheat'),8);assert.ok(s.experienceSystem.processed.has(`harvest-${wheat.id}-${oldTask.cycle}`));
});
test('orchard harvest yields exactly 6 Apple, retains the same trees/building and begins another fruit cycle',()=>{
  const {s,home,wheat,orchard}=farm();s.gameTime.update(180000);s.farmingSystem.records.get(wheat.id).reservedBy='reserved-for-fixture';const w=farmer(s,home);const id=orchard.id;
  until(s,()=>s.inventory.count('apple')===6,25000);assert.equal(s.buildings.find(b=>b.id===id),orchard);assert.equal(s.farmingSystem.records.get(id).cycle,1);assert.equal(s.farmingSystem.records.get(id).stage,0);assert.equal(w.experience.totalXP,10);assert.equal(w.skills.farming.totalXP,10);s.gameTime.update(180000);assert.equal(s.farmingSystem.ripe(orchard),true);assert.equal(s.inventory.count('apple'),6);
});
test('multiple farmers reserve a ripe harvest exclusively and cannot duplicate its output or XP',()=>{
  const {s,home,wheat}=farm();s.gameTime.update(120000);const workers=[farmer(s,home,{x:44,y:40}),farmer(s,home,{x:44,y:41}),farmer(s,home,{x:45,y:39})];
  until(s,()=>workers.some(w=>w.workTask?.kind==='harvest'));assert.equal(workers.filter(w=>w.workTask?.targetId===wheat.id).length,1);until(s,()=>s.inventory.count('wheat')===8);s.simulate(5000);
  assert.equal(s.inventory.count('wheat'),8);assert.equal(workers.reduce((sum,w)=>sum+w.experience.totalXP,0),8);assert.equal(s.farmingSystem.records.get(wheat.id).cycle,1);
});
test('Farming levels speed only active harvest work; biological growth and yield remain identical',()=>{
  const durations=[];
  for(const level of [1,50]){const {s,home,wheat}=farm();s.gameTime.update(120000);const w=farmer(s,home);s.skillSystem.addXP(w,'farming',totalXPForLevel(level));until(s,()=>w.workTask?.kind==='harvest'&&s.workerSystem.ai.atGoal(w,w.workTask.goal));
    const start=s.gameTime.totalElapsed;until(s,()=>s.inventory.count('wheat')===8);durations.push(s.gameTime.totalElapsed-start);assert.equal(s.inventory.count('wheat'),8);assert.equal(s.farmingSystem.records.get(wheat.id).cycle,1);}
  assert.ok(durations[1]<durations[0]*.7);assert.ok(durations[1]>durations[0]*.64);
});
test('radius15, blocked routes, profession changes and death release reservations without remote or duplicated harvesting',()=>{
  const {s,home,wheat}=farm(),far=building(s,'wheat_field',65,40);s.gameTime.update(120000);const w=farmer(s,home);assert.equal(s.farmingSystem.inRange(w,far),false);until(s,()=>w.workTask?.kind==='harvest');const key=w.workTask.reservation;
  assert.equal(s.farmingSystem.harvest(w,wheat,s.farmingSystem.records.get(wheat.id)),false);s.workerSystem.jobs.assign(w,'idle');assert.equal(s.farmingSystem.records.get(wheat.id).reservedBy,null);assert.equal(s.workerSystem.reservations.available(key,w.id),true);assert.equal(s.inventory.count('wheat'),0);
  s.workplaceSystem.assign(home,w);until(s,()=>w.workTask?.kind==='harvest');w.isAlive=false;w.currentHP=0;s.workerSystem.onDeath(w);assert.equal(s.farmingSystem.records.get(wheat.id).reservedBy,null);assert.equal(s.inventory.count('wheat'),0);
  const r=farmer(s,home,{x:44,y:42});for(let y=0;y<100;y++)s.map[y][48]=1;s.simulate(5000);assert.equal(r.workTask,null);assert.equal(s.inventory.count('wheat'),0);
});
test('save/load preserves partial growth and active reserved harvest, resumes once, and rejects corrupt crop or reservation data',()=>{
  const {s,home,wheat}=farm();s.gameTime.update(120000);const w=farmer(s,home);until(s,()=>w.workTask?.progressMs>=1000);const data=validateGameState(serializeGameState(s));assert.equal(data.saveVersion,SAVE_VERSION);
  const r=scene();loadGameState(r,data);assert.deepEqual(serializeGameState(r),data);assert.equal(r.workerSystem.workers.get(w.id).workTask.reservation,`crop:${wheat.id}`);assert.equal(r.map[wheat.y][wheat.x],0);
  until(s,()=>s.inventory.count('wheat')===8);until(r,()=>r.inventory.count('wheat')===8);assert.equal(s.workerSystem.workers.get(w.id).experience.totalXP,r.workerSystem.workers.get(w.id).experience.totalXP);assert.equal(r.farmingSystem.records.get(wheat.id).cycle,1);r.simulate(5000);assert.equal(r.inventory.count('wheat'),8);
  for(const change of [x=>x.farming.records[0].stage=0,x=>x.farming.records[0].reservedBy='missing',x=>x.workers.find(a=>a.id===w.id).workTask.cycle++,x=>x.farming.records.push(x.farming.records[0])]){const bad=structuredClone(data);change(bad);assert.throws(()=>validateGameState(bad));}
});
test('completed walkable crop plots remain free of stone spawns and accept real dropped cargo without save corruption',()=>{
  const {s,wheat}=farm();const candidates=resourceCandidates(s.map,[s.character.tile],s.reservedTiles(),s.resourceOccupancy);const plot=new Set(wheat.tiles.map(tileKey));assert.ok(candidates.every(t=>!plot.has(tileKey(t))));s.dropSystem.create('apple',wheat.tiles[0],3);const data=validateGameState(serializeGameState(s)),r=scene();loadGameState(r,data);assert.equal(r.dropSystem.drops.size,1);assert.equal(r.inventory.count('apple'),0);assert.equal([...r.dropSystem.drops.values()][0].amount,3);
});
test('Apple is eaten before Meat by the single daily food scheduler, while Wheat stays inedible',()=>{
  const s=scene();s.inventory.add('wheat',12);s.inventory.add('apple',3);s.inventory.add('meat',1);assert.equal(objectRegistry.require('apple').edible,true);assert.equal(objectRegistry.require('wheat').edible,false);s.foodSystem.update(60000);assert.equal(s.inventory.count('meat'),1);assert.equal(s.inventory.count('apple'),1);s.foodSystem.update(120000);assert.equal(s.inventory.count('apple'),0);assert.equal(s.inventory.count('wheat'),12);assert.equal(s.foodSystem.availablePortions,0);assert.equal(s.foodSystem.elapsed,0);
});
