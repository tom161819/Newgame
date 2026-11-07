import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { WorkerSystem } from '../src/systems/WorkerSystem.js';
import { POPULATION } from '../src/data/jobs.js';
import { buildingsInCategory } from '../src/data/buildingCategories.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';

globalThis.document??={querySelector:()=>({textContent:''})};

function build(s,x,y,{complete=true}={}){
  const d=s.objectRegistry.require('house');for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);
  const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);
  if(!complete)r.building.construction={state:'planned',progress:0,workDone:0};s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.events?.emit('buildings:changed');return r.building;
}

test('the House is a 2×2 Housing building with the approved art; each completed one adds 5 residents',()=>{
  const s=workerScene(),d=s.objectRegistry.require('house');
  assert.deepEqual([d.width,d.height,d.buildingCategory,d.renderMode,d.housing.capacity],[2,2,'housing','sprite',5]);
  assert.deepEqual(buildingsInCategory(s.objectRegistry,'housing').map(b=>b.id),['house','village_green']);
  assert.equal(s.workerSystem.capacity(),POPULATION.maximum);
  build(s,60,60);build(s,64,60);assert.equal(s.workerSystem.capacity(),POPULATION.maximum+10);
  const site=build(s,68,60,{complete:false});assert.equal(s.workerSystem.capacity(),POPULATION.maximum+10,'a blueprint gives no room yet');
  site.construction.state='complete';assert.equal(s.workerSystem.capacity(),POPULATION.maximum+15);
});

test('migration fills the extra room and stops at the new capacity; the HUD hears about new Houses',()=>{
  const s=workerScene();s.events=new EventEmitter();s.workerSystem.destroy();s.workerSystem=new WorkerSystem(s);
  const heard=[];s.workerSystem.listeners.add((count,maximum)=>heard.push(maximum));
  s.workerSystem.spawnInitial();build(s,60,60);assert.equal(heard.at(-1),POPULATION.maximum+5);
  s.gameTime.update(40*120000);assert.equal(s.workerSystem.liveSubjects().length,POPULATION.maximum+5);
});

test('capacity comes from the saved Houses after Save/Load in the current schema',()=>{
  const s=workerScene();build(s,60,60);build(s,64,60);
  const state=validateGameState(serializeGameState(s)),r=workerScene(undefined,{starter:false});loadGameState(r,structuredClone(state));
  assert.equal(r.workerSystem.capacity(),POPULATION.maximum+10);
});
