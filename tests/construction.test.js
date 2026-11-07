import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete,towerNeighbors } from '../src/game/buildings.js';
import { placeWallLine,wallIndex } from '../src/game/walls.js';
import { initializeConstructionSite } from '../src/systems/ConstructionSite.js';
import { advanceConstruction } from '../src/systems/ConstructionProgress.js';
import { createProgress } from '../src/data/experience.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { MountSystem } from '../src/systems/MountSystem.js';

const scene=()=>workerScene(undefined,{construction:true});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} !== ${b}`);
function site(s,type='tower',x=50,y=50){
  const d=s.objectRegistry.require(type);Object.entries(d.cost).forEach(([r,k])=>s.inventory.add(r,k));const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ok(r.building,r.error);s.constructionSystem.plan(r.building);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;
}
function builder(s,x=47,y=50){const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;}
function until(s,condition,max=65000){let ms=0;while(!condition()&&ms<max){s.tick(50);ms+=50;}assert.ok(condition(),`No condition after ${ms} ms`);return ms;}

test('registry times, paid blueprint footprints and activation gates preserve one original building instance',()=>{
  const s=scene();for(const [type,time]of Object.entries({wall:5000,tower:20000,castle:45000,quarry:30000,hunting_lodge:25000,barracks:40000}))assert.equal(s.objectRegistry.require(type).constructionTime,time);
  const castle=site(s,'castle'),quarry=site(s,'quarry',56,50),wall=site(s,'wall',60,50);assert.equal(s.buildings.length,3);assert.equal(s.inventory.count('stone'),0);assert.equal(castle.construction.state,'planned');assert.equal(castle.construction.progress,0);assert.equal(buildingIsComplete(castle),false);
  for(const b of s.buildings)for(const t of b.tiles)assert.equal(s.map[t.y][t.x],1);assert.equal(s.production.dailyIncome().gold,undefined);assert.equal(s.workplaceSystem.records.size,0);assert.equal(wallIndex(s.buildings).size,0);assert.equal(wallIndex(s.buildings,true).size,1);
  const worker=builder(s);assert.equal(s.workplaceSystem.assign(quarry,worker),false);assert.equal(s.character.command({kind:'enter',tower:castle}),false);assert.equal(s.character.experience.totalXP,0);s.constructionSystem.plan(castle);assert.equal(s.buildings.length,3);assert.equal(s.inventory.count('stone'),0);
});

test('one builder physically approaches, then takes exactly the base work time and earns one completion reward',()=>{
  const s=scene(),b=site(s),w=builder(s);s.tick(0);assert.equal(w.workTask.kind,'build');assert.equal(b.construction.workDone,0);const position={...w.position};s.tick(100);assert.ok(Math.hypot(w.position.x-position.x,w.position.y-position.y)<.4);assert.equal(b.construction.workDone,0);
  until(s,()=>s.constructionSystem.atSite(w,s.constructionSystem.assignments.get(w.id)));const work=b.construction.workDone;assert.ok(work<51);s.simulate(20000-work-1,50);assert.equal(buildingIsComplete(b),false);s.tick(1.01);assert.equal(buildingIsComplete(b),true);assert.equal(w.experience.totalXP,15);assert.equal(w.skills.construction.totalXP,15);assert.equal(w.workTask,null);assert.equal(s.workerSystem.reservations.owners.size,0);s.simulate(2000);assert.equal(w.experience.totalXP,15);
});

test('construction sums skill speeds and integrates staggered arrivals and completion exactly at different frame rates',()=>{
  for(const fps of [20,30,60,144]){
    const b={type:'quarry'};initializeConstructionSite(b);let clock=0;const end=30000/2.49;
    while(clock<end-1){const delta=Math.min(1000/fps,end-1-clock);advanceConstruction(b,[{id:'a',speed:1,available:delta},{id:'b',speed:1.49,available:delta}],delta);clock+=delta;}
    assert.ok(b.construction.workDone<30000);assert.equal(advanceConstruction(b,[{id:'a',speed:1,available:1},{id:'b',speed:1.49,available:1}],1),true);near(b.construction.contributions.a,30000/2.49);near(b.construction.contributions.b,30000*1.49/2.49);
  }
  const b={type:'wall'};initializeConstructionSite(b);advanceConstruction(b,[{id:'a',speed:1,available:10000},{id:'late',speed:1,available:1000}],10000);near(b.construction.contributions.a,5000);assert.equal(b.construction.contributions.late,undefined);
  const c={type:'tower'};initializeConstructionSite(c);advanceConstruction(c,[{id:'a',speed:1,available:10000},{id:'b',speed:1,available:5000}],10000);near(c.construction.workDone,15000);near(c.construction.contributions.a,10000);near(c.construction.contributions.b,5000);
});

test('three builders occupy distinct physical slots, cap staffing and split the original base XP pool by actual work',()=>{
  const s=scene(),b=site(s,'quarry'),workers=[builder(s,49,50),builder(s,49,51),builder(s,50,49),builder(s,51,49)];s.tick(0);
  assert.equal(b.construction.assignedBuilders.length,3);assert.equal(new Set([...s.constructionSystem.assignments.values()].map(a=>`${a.goal.x},${a.goal.y}`)).size,3);assert.equal(s.constructionSystem.commandKing(b),false);
  until(s,()=>buildingIsComplete(b));near(workers.reduce((sum,w)=>sum+w.experience.totalXP,0),15);near(workers.reduce((sum,w)=>sum+w.skills.construction.totalXP,0),15);assert.equal(s.workplaceSystem.records.get(b.id).capacity,3);assert.equal(b.construction.assignedBuilders.length,0);near(Object.values(b.construction.contributions).reduce((a,b)=>a+b,0),30000);
});

test('construction shares preserve the base reward pool and apply a natural talent only to its owners individual skill',()=>{
  const s=scene(),b=site(s,'quarry'),a=builder(s,49,50),other=builder(s,50,49);a.naturalTalent='construction';until(s,()=>buildingIsComplete(b));
  near(a.experience.totalXP+other.experience.totalXP,15);near(a.skills.construction.totalXP,a.experience.totalXP*1.2);near(other.skills.construction.totalXP,other.experience.totalXP);assert.equal(s.character.experience.totalXP,0);
});

test('king builds only after walking, can stop and resume, assists an existing builder and never loses earlier progress',()=>{
  const s=scene(),b=site(s,'wall',46,40);assert.equal(s.constructionSystem.commandKing(b),true);s.tick(100);assert.equal(b.construction.workDone,0);assert.ok(s.character.position.x<41);
  until(s,()=>b.construction.workDone>500);const work=b.construction.workDone;s.constructionSystem.stopKing();s.character.command({kind:'move',goal:{x:43,y:42}});s.simulate(500);near(b.construction.workDone,work);
  const w=builder(s,45,41);assert.equal(s.constructionSystem.commandKing(b),true);until(s,()=>buildingIsComplete(b));near(s.character.experience.totalXP+w.experience.totalXP,2);assert.ok(s.character.experience.totalXP>0);assert.ok(w.experience.totalXP>0);assert.equal(s.constructionSystem.assignments.size,0);
});

test('a mounted king automatically dismounts before building and a king on a finished tower descends before any work',()=>{
  const s=scene(),b=site(s,'wall',45,40),horse=s.animalSystem.create(s.objectRegistry.require('horse'),{x:41,y:40}),bystander=s.workerSystem.create({x:40,y:39});bystander.aiCooldown=1e8;s.fog.update=()=>{};s.mountSystem=new MountSystem(s);assert.equal(s.mountSystem.mount(horse),true);assert.equal(s.character.speed,7);assert.equal(s.constructionSystem.commandKing(b),true);assert.equal(s.character.mountedHorse,null);assert.equal(horse.mounted,false);assert.notDeepEqual(horse.tile,bystander.tile);assert.equal(s.character.speed,3.5);until(s,()=>buildingIsComplete(b));assert.equal(s.character.experience.totalXP,2);
  const r=scene(),d=r.objectRegistry.require('tower');r.inventory.add('stone',20);const {building:tower}=placeBuilding({map:r.map,anchor:{x:42,y:40},resources:r.resourceOccupancy,reservedTiles:r.reservedTiles(),inventory:r.inventory,buildings:r.buildings,definition:d});assert.equal(r.character.command({kind:'enter',tower}),true);until(r,()=>r.character.state==='enteringTower');r.character.completeClimb(tower);
  const wall=site(r,'wall',48,40);assert.equal(r.constructionSystem.commandKing(wall),true);assert.equal(r.character.state,'exitingTower');r.tick(500);assert.equal(wall.construction.workDone,0);r.character.completeDescent(r.character.exitTile);until(r,()=>buildingIsComplete(wall));assert.equal(r.character.experience.totalXP,2);
});

test('adjacent blueprints cannot assign two builders to the same shared work tile and a blocked old work slot is released',()=>{
  const s=scene(),a=site(s,'wall',50,50),b=site(s,'wall',52,50),workers=[builder(s,47,50),builder(s,51,47)];s.tick(0);const keys=[...s.constructionSystem.assignments.values()].map(a=>`${a.goal.x},${a.goal.y}`);assert.equal(new Set(keys).size,keys.length);
  const w=workers[0],assignment=s.constructionSystem.assignments.get(w.id);s.map[assignment.goal.y][assignment.goal.x]=1;s.constructionSystem.revision++;w.path=[];w.aiCooldown=0;s.tick(0);assert.equal(w.workTask,null);assert.ok(!a.construction.assignedBuilders.includes(w.id));assert.equal(b.construction.workDone,0);
});

test('cancellation refunds all planned material or floor(half) after real work, releases slots and never pays XP',()=>{
  const s=scene(),planned=site(s,'quarry');assert.equal(s.constructionSystem.cancel(planned),true);assert.equal(s.inventory.count('wood'),15);assert.equal(s.constructionSystem.cancel(planned),false);assert.equal(s.inventory.count('wood'),15);for(const t of planned.tiles)assert.equal(s.map[t.y][t.x],0);
  const b=site(s,'quarry'),w=builder(s);until(s,()=>b.construction.workDone>0);assert.equal(s.constructionSystem.cancel(b),true);assert.equal(s.inventory.count('wood'),22);assert.equal(w.experience.totalXP,0);assert.equal(w.workTask,null);assert.equal(s.workerSystem.reservations.owners.size,0);assert.ok(site(s,'wall').id>b.id);
});

test('wall dragging charges only fresh segments and only completed segments join the usable roof graph',()=>{
  const s=scene(),d=s.objectRegistry.require('wall'),options={map:s.map,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d};s.inventory.add('stone',10);
  const first=placeWallLine({...options,tiles:[{x:50,y:50},{x:51,y:50},{x:52,y:50}]});for(const b of first.buildings)s.constructionSystem.plan(b);assert.equal(s.inventory.count('stone'),7);assert.equal(wallIndex(s.buildings).size,0);
  const next=placeWallLine({...options,tiles:[{x:51,y:50},{x:52,y:50},{x:53,y:50}]});assert.equal(next.buildings.length,1);s.constructionSystem.plan(next.buildings[0]);assert.equal(s.inventory.count('stone'),6);
  builder(s,49,50);until(s,()=>first.buildings.some(buildingIsComplete));assert.ok(wallIndex(s.buildings).size>0&&wallIndex(s.buildings).size<4);assert.equal(s.character.command({kind:'enter',tower:next.buildings[0]}),false);
});

test('unreachable sites are cached until map changes, while job changes release build reservations without rewards',()=>{
  const s=scene(),b=site(s);for(const t of towerNeighbors(b))s.map[t.y][t.x]=1;const w=builder(s);s.simulate(4000);assert.equal(w.workTask,null);assert.equal(b.construction.workDone,0);assert.ok(s.constructionSystem.builderAI.blocked.has(`${w.id}:${b.id}`));
  for(const t of towerNeighbors(b))s.map[t.y][t.x]=0;s.constructionSystem.revision++;until(s,()=>!!w.workTask);s.workerSystem.jobs.assign(w,'miner');assert.equal(w.workTask,null);assert.equal(b.construction.assignedBuilders.length,0);assert.equal(s.workerSystem.reservations.owners.size,0);assert.equal(w.experience.totalXP,0);
});

test('a completed castle activates daily income only afterwards; paused time and cancelled partial work produce no rewards',()=>{
  const s=scene(),b=site(s,'castle'),w=builder(s);s.gameTime.update(120000);assert.equal(s.inventory.count('gold'),0);s.gameTime.setPaused(true);s.simulate(5000);assert.equal(b.construction.workDone,0);s.gameTime.setPaused(false);until(s,()=>buildingIsComplete(b));assert.equal(s.production.dailyIncome().gold,5);assert.equal(w.experience.totalXP,30);const gold=s.inventory.count('gold');s.gameTime.update(120000);assert.ok(s.inventory.count('gold')>gold);
});

test('precise Save/Load restores partial work, contributions, paid material, builder slots and king command without repeat payment or XP',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const s=scene(),b=site(s,'quarry',46,40),w=builder(s,45,40);s.constructionSystem.commandKing(b);until(s,()=>b.construction.workDone>3000);
  const saved=validateGameState(serializeGameState(s)),r=workerScene(saved.terrain,{construction:true});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);assert.equal(r.inventory.count('stone'),0);until(r,()=>buildingIsComplete(r.buildings[0]));near(r.character.experience.totalXP+r.workerSystem.workers.get(w.id).experience.totalXP,15);const earned=r.character.experience.totalXP;r.constructionSystem.finish(r.buildings[0]);assert.equal(r.character.experience.totalXP,earned);
  for(const mutate of [v=>v.buildings[0].construction.progress=99,v=>v.buildings[0].construction.investedMaterials.stone=2,v=>v.buildings[0].construction.assignedBuilders.push('king'),v=>v.constructionSystem.nextId=1]){const bad=structuredClone(saved);mutate(bad);assert.throws(()=>validateGameState(bad));}
});

test('older completed buildings keep all functions without rebuilding, repaying material or granting historical XP',()=>{
  globalThis.document??={querySelector:()=>({textContent:''})};
  const old=workerScene(),d=old.objectRegistry.require('castle');old.inventory.add('stone',20);placeBuilding({map:old.map,anchor:{x:50,y:50},resources:old.resourceOccupancy,reservedTiles:old.reservedTiles(),inventory:old.inventory,buildings:old.buildings,definition:d});const saved=serializeGameState(old),r=scene();loadGameState(r,saved);assert.equal(buildingIsComplete(r.buildings[0]),true);assert.equal(r.constructionSystem.sites.size,0);assert.equal(r.production.dailyIncome().gold,5);assert.equal(r.character.experience.totalXP,0);assert.equal(r.inventory.count('stone'),0);validateGameState(serializeGameState(r));
});

test('a Builder whose reserved goal tile becomes occupied by a standing unit picks another free side instead of waiting forever',()=>{
  const s=scene(),b=site(s),w=builder(s);s.tick(0);const goal={...s.constructionSystem.assignments.get(w.id).goal};
  // A villager standing still on that exact tile (in the pavement smoke an idle Hauler waited there).
  const blocker=s.workerSystem.create(goal);blocker.commandState={state:'Holding',goal:null};blocker.workState='Holding';
  until(s,()=>s.constructionSystem.atSite(w,s.constructionSystem.assignments.get(w.id)??{goal:{x:-1,y:-1}}),20000);
  assert.notDeepEqual(s.constructionSystem.assignments.get(w.id).goal,goal,'another side of the site');assert.deepEqual(blocker.tile,goal,'the blocker was not moved');
  until(s,()=>b.construction.workDone>0,2000);
});
