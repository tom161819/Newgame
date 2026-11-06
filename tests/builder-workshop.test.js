import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete,towerNeighbors } from '../src/game/buildings.js';
import { idleHomes } from '../src/data/idleGathering.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const scene=(terrain=undefined,starter=true)=>{const s=workerScene(terrain,{construction:true,foodProduction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;};
function add(s,type,x,y,{planned=false}={}){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);if(planned)s.constructionSystem.plan(result.building);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function builder(s,x=40,y=40){const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;}
function until(s,p,max=120000){for(let time=0;time<max&&!p();time+=25)s.tick(25);assert.ok(p());}
test('only actual Builder construction is halved without a base; a shared completed reachable base restores both Builders',()=>{
 const s=scene(),a=builder(s),b=builder(s,42,40),target=add(s,'tower',65,50,{planned:true}),speed=s.skillSystem.workEfficiency(a,'construction'),move=a.speed;assert.equal(s.constructionSystem.workSpeed(target,a),speed*.5);assert.equal(s.constructionSystem.workSpeed(target,s.character),s.skillSystem.workEfficiency(s.character,'construction'));
 const workshop=add(s,'builder_workshop',50,50);assert.equal(s.constructionSystem.workshops.home(a).id,workshop.id);assert.equal(s.constructionSystem.workshops.home(b).id,workshop.id);assert.equal(s.constructionSystem.workSpeed(target,a),speed);assert.equal(s.constructionSystem.workSpeed(target,b),s.skillSystem.workEfficiency(b,'construction'));assert.equal(a.speed,move);assert.equal(a.assignedWorkplaceId,null);assert.equal(s.workplaceSystem.records.has(workshop.id),false);assert.equal(s.objectRegistry.require('builder_workshop').renderMode,'procedural');
 assert.equal(s.constructionSystem.workSpeed({...target,demolition:true},a),speed);s.buildings.splice(s.buildings.indexOf(workshop),1);s.constructionSystem.revision++;assert.equal(s.constructionSystem.workSpeed(target,a),speed*.5);
});
test('unfinished and truly unreachable workshops never provide a buff; another reachable workshop is used',()=>{
 const s=scene(),w=builder(s),base=add(s,'builder_workshop',55,50,{planned:true}),target=add(s,'tower',70,50,{planned:true});assert.equal(s.constructionSystem.workshops.home(w),null);assert.equal(s.constructionSystem.workSpeed(target,w),.5);
 base.construction.state='complete';for(const t of towerNeighbors(base))s.map[t.y][t.x]=1;s.constructionSystem.revision++;assert.equal(s.constructionSystem.workshops.home(w),null);const other=add(s,'builder_workshop',75,60);assert.equal(s.constructionSystem.workshops.home(w).id,other.id);assert.equal(s.constructionSystem.workSpeed(target,w),1);
});
test('Builders without a workshop still physically finish finite construction at half speed with no movement penalty',()=>{
 const s=scene(),target=add(s,'tower',55,50,{planned:true}),w=builder(s,50,50);until(s,()=>s.constructionSystem.assignments.has(w.id)&&s.constructionSystem.atSite(w,s.constructionSystem.assignments.get(w.id)));const before=target.construction.workDone;s.simulate(1000,25);assert.ok(Math.abs(target.construction.workDone-before-500)<1e-6);until(s,()=>buildingIsComplete(target));assert.equal(target.construction.workDone,target.construction.requiredWork);assert.equal(w.experience.totalXP,15);
});
test('workshop idle anchors are distinct, jobs preempt them and Hold/role changes never pull a worker back',()=>{
 const s=scene(),castle=add(s,'castle',60,50),base=add(s,'builder_workshop',50,50),people=[builder(s,30,35),builder(s,32,35),builder(s,34,35)];until(s,()=>people.every(w=>s.workerSystem.gather.atHome(w)));assert.ok(people.every(w=>s.workerSystem.gather.claims.get(w.id).homeId===base.id));assert.equal(new Set(people.map(w=>`${w.tile.x},${w.tile.y}`)).size,3);assert.ok(people.every(w=>w.displayProfession==='builder'));assert.notEqual(base.id,castle.id);
 const target=add(s,'tower',70,55,{planned:true});s.simulate(800);assert.ok(people.some(w=>w.workTask?.kind==='build'));for(const w of people.filter(w=>w.workTask))assert.equal(s.workerSystem.gather.claims.has(w.id),false);
 const w=people[0],tile={...(w.nextTile??w.tile)};s.workerSystem.commands.hold(w);s.simulate(1000);assert.equal(s.workerSystem.gather.claims.has(w.id),false);if(!w.nextTile)assert.deepEqual(w.tile,tile);s.workerSystem.jobs.assign(w,'hauler');assert.deepEqual(idleHomes(s,w).map(h=>h.kind),['castle']);assert.equal(target.type,'tower');validateGameState(serializeGameState(s));
});
test('current Save/Load rebuilds derived bases and idle anchors while retaining workshop and unfinished construction',()=>{
 const s=scene(),base=add(s,'builder_workshop',55,50),w=builder(s);until(s,()=>s.workerSystem.gather.atHome(w));const target=add(s,'tower',70,50,{planned:true});until(s,()=>target.construction.workDone>1000);const state=validateGameState(serializeGameState(s));assert.equal(state.saveVersion,SAVE_VERSION);assert.equal(JSON.stringify(state).includes('idle-anchor:'),false);
 const r=scene(state.terrain,false);loadGameState(r,structuredClone(state));const worker=r.workerSystem.workers.get(w.id);assert.equal(r.constructionSystem.workshops.home(worker).id,base.id);assert.equal(r.constructionSystem.workshops.factor(worker),1);const restored=r.buildings.find(b=>b.id===target.id);assert.equal(restored.construction.workDone,target.construction.workDone);until(r,()=>buildingIsComplete(restored));validateGameState(serializeGameState(r));
});
