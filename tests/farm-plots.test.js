import test from 'node:test';
import { EventEmitter } from 'node:events';
import { FarmingSystem } from '../src/systems/FarmingSystem.js';
import assert from 'node:assert/strict';
import { availableFarm,reconcileFarmPlots,farmPlots } from '../src/data/farmPlots.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FarmConnections } from '../src/ui/FarmConnections.js';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const definitionOf=b=>b.definition??objectRegistry.require(b.type);
const data=(id,type,x,y,farmId)=>({id,type,x,y,...(farmId===undefined?{}:{farmId})});
const scene=()=>{const s=workerScene(undefined,{construction:true,foodProduction:true,farming:true});s.workerSystem.unsubscribe();s.farmingSystem.destroy();s.events=new EventEmitter();s.farmingSystem=new FarmingSystem(s,{onHarvest:result=>s.foodProduction.harvest(result)});return s;};
function build(s,type,x,y,{planned=false,provisional=false}={}){const definition=s.objectRegistry.require(type);if(!provisional)ensureBuildingPrerequisites(s,definition);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition,provisional});assert.ifError(result.error);const b=result.building;if(planned||provisional)s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(definition,b));return b;}
function until(s,predicate){for(let t=0;t<30000&&!predicate();t+=25)s.tick(25);assert.ok(predicate());}
function four(s,home,planned=false){return [[49,40],[49,44],[53,40],[53,44]].map(([x,y],i)=>build(s,i%2?'orchard':'wheat_field',x,y,{planned:planned&&i===3}));}

test('four mixed plots occupy one farm; deterministic nearest free farm includes unfinished and provisional claims',()=>{
  const a=data(1,'farmhouse',45,40),b=data(2,'farmhouse',57,40),plots=[data(3,'wheat_field',48,40,1),data(4,'orchard',48,44,1),data(5,'wheat_field',52,44,1),{...data(6,'orchard',52,40,1),unverified:true,construction:{state:'planned'}}],buildings=[a,b,...plots],next=data(7,'wheat_field',49,48);
  assert.equal(availableFarm(next,buildings,definitionOf).id,2);buildings.push(next);reconcileFarmPlots(buildings,definitionOf);assert.equal(next.farmId,2);assert.equal(farmPlots(a,buildings,definitionOf).length,4);
  const tied=data(8,'orchard',50,40);assert.equal(availableFarm(tied,[{...b,x:56},a],definitionOf).id,1);b.construction={state:'planned'};assert.equal(availableFarm(next,buildings,definitionOf),null);
});

test('fifth physical plot remains orphan, then connects when another completed farm adds room without stealing old plots',()=>{
  const s=scene(),home=build(s,'farmhouse',45,40),plots=four(s,home),fifth=build(s,'wheat_field',57,40,{planned:true});assert.deepEqual(plots.map(b=>b.farmId),[home.id,home.id,home.id,home.id]);assert.equal(fifth.farmId,null);assert.deepEqual(s.farmingSystem.plotSummary(home),{count:4,capacity:4});
  const second=build(s,'farmhouse',57,46);assert.equal(fifth.farmId,second.id);assert.deepEqual(plots.map(b=>b.farmId),[home.id,home.id,home.id,home.id]);validateGameState(serializeGameState(s));
});

test('actual Farmers harvest and tend only their own farm plots in overlapping work ranges',()=>{
  const s=scene(),a=build(s,'farmhouse',45,40),b=build(s,'farmhouse',55,40),pa=build(s,'wheat_field',48,44),pb=build(s,'orchard',58,44),workers=[s.workerSystem.create({x:44,y:40}),s.workerSystem.create({x:54,y:40})];s.workplaceSystem.assign(a,workers[0]);s.workplaceSystem.assign(b,workers[1]);assert.equal(pa.farmId,a.id);assert.equal(pb.farmId,b.id);assert.equal(s.farmingSystem.inRange(workers[0],pb),false);assert.equal(s.farmingSystem.inRange(workers[1],pa),false);
  s.gameTime.update(3*s.gameTime.dayDuration);until(s,()=>workers.every(w=>w.workTask?.kind==='harvest'));assert.deepEqual(workers.map(w=>w.workTask.targetId),[pa.id,pb.id]);
  const saved=validateGameState(serializeGameState(s)),restored=scene();loadGameState(restored,saved);assert.deepEqual(serializeGameState(restored),saved);
  const wrong=structuredClone(saved);wrong.buildings.find(p=>p.id===pa.id).farmId=b.id;assert.throws(()=>validateGameState(wrong));
});

test('farm removal cancels exclusive work safely, releases employees and reassigns plots to another farm',()=>{
  const s=scene(),a=build(s,'farmhouse',45,40),b=build(s,'farmhouse',55,40),plot=build(s,'wheat_field',48,44),w=s.workerSystem.create({x:44,y:40});s.workplaceSystem.assign(a,w);s.gameTime.update(2*s.gameTime.dayDuration);until(s,()=>w.workTask?.kind==='harvest');const before=s.inventory.count('wheat');
  s.buildings=s.buildings.filter(x=>x!==a);for(const tile of a.tiles)s.map[tile.y][tile.x]=s.terrainGrid[tile.y][tile.x];s.towerViews.get(a.id).destroy();s.towerViews.delete(a.id);s.events.emit('buildings:changed');
  assert.equal(plot.farmId,b.id);assert.equal(w.workTask,null);assert.equal(w.profession,'idle');assert.equal(s.farmingSystem.records.get(plot.id).reservedBy,null);assert.equal(s.workplaceSystem.records.has(a.id),false);assert.equal(s.inventory.count('wheat'),before);validateGameState(serializeGameState(s));
});

test('current saves preserve a provisional plot whose later-created farm follows it in load order',()=>{
  const s=scene(),plot=build(s,'wheat_field',49,40,{provisional:true});assert.equal(plot.farmId,null);const home=build(s,'farmhouse',45,40);assert.equal(plot.farmId,home.id);assert.ok(s.buildings.indexOf(plot)<s.buildings.indexOf(home));
  const saved=validateGameState(serializeGameState(s)),r=scene();loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);assert.equal(r.buildings.find(b=>b.id===plot.id).farmId,home.id);
});

test('save validation rejects nonexistent, non-farm, remote and fifth ownership before changing a world',()=>{
  const s=scene(),home=build(s,'farmhouse',45,40),plots=four(s,home),fifth=build(s,'wheat_field',57,40),remote=build(s,'farmhouse',30,60),saved=validateGameState(serializeGameState(s));assert.equal(fifth.farmId,null);
  for(const change of [x=>x.buildings.find(b=>b.id===plots[0].id).farmId=99999,x=>x.buildings.find(b=>b.id===plots[0].id).farmId=plots[1].id,x=>x.buildings.find(b=>b.id===plots[0].id).farmId=remote.id,x=>x.buildings.find(b=>b.id===fifth.id).farmId=home.id,x=>delete x.buildings.find(b=>b.id===plots[0].id).farmId]){const bad=structuredClone(saved);change(bad);assert.throws(()=>loadGameState(s,bad));assert.deepEqual(serializeGameState(s),saved);}
});

test('connection overlays show only visible linked plots and clear immediately when the farm panel closes',()=>{
  const farm={...data(1,'farmhouse',45,40),tiles:[]},a={...data(2,'wheat_field',49,40,1),tiles:[{x:49,y:40}]},hidden={...data(3,'orchard',53,40,1),tiles:[]},orphan={...data(4,'wheat_field',57,40,null),tiles:[{x:57,y:40}]},g={setDepth(){return this;},clear(){return this;},lineStyle(){return this;},strokePoints(){return this;},lineBetween(){return this;},destroy(){}};
  const s={add:{graphics:()=>g},buildings:[farm,a,hidden,orphan],fog:{isVisibleObject:b=>b!==hidden},workplacePanel:{dialog:{open:true},building:farm}},overlay=new FarmConnections(s);overlay.refresh();assert.deepEqual(overlay.links,[a.id]);assert.deepEqual(overlay.orphans,[orphan.id]);s.workplacePanel.dialog.open=false;overlay.refresh();assert.deepEqual(overlay.links,[]);assert.deepEqual(overlay.orphans,[orphan.id]);overlay.destroy();overlay.refresh();
});


test('cancelling a planned plot frees its counted slot and immediately reconnects a waiting orphan',()=>{
  const s=scene(),home=build(s,'farmhouse',45,40),plots=four(s,home,true),orphan=build(s,'wheat_field',57,40);assert.equal(orphan.farmId,null);assert.equal(s.farmingSystem.plots(home).length,4);assert.ok(s.constructionSystem.cancel(plots[3]));assert.equal(orphan.farmId,home.id);assert.equal(s.farmingSystem.plots(home).length,4);assert.equal(s.farmingSystem.records.has(plots[3].id),false);validateGameState(serializeGameState(s));
});
