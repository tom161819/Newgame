import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { captureMapKnowledge,staticMemoryEntries } from '../src/game/mapMemoryObjects.js';
import { placeBuilding } from '../src/game/buildings.js';
import { tileCenter } from '../src/game/isometric.js';
import { VISIBILITY,visibilityPlacementError,OUTSIDE_SIGHT } from '../src/systems/FogOfWarSystem.js';

globalThis.document={querySelector:()=>({textContent:''})};
const create=(starter=true)=>workerScene(undefined,{logistics:true,construction:true,seasons:true,starter});
function move(s,x,y){s.character.position={x:x+.5,y:y+.5};s.character.tile={x,y};s.player.setPosition(...Object.values(tileCenter({x,y})));captureMapKnowledge(s);}
function fixture(){
  const s=create();s.settingsPanel.settings.fogOfWar=true;s.fog.setEnabled(true);s.inventory.add('stone',20);
  const d=s.objectRegistry.require('tower'),{building,error}=placeBuilding({map:s.map,anchor:{x:44,y:40},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(error);
  s.towerViews.set(building.id,s.createBuildingView(d,building));s.addResource(s.objectRegistry.require('stone'),{x:42,y:40});captureMapKnowledge(s);
  move(s,80,80);s.resources.get('42,40').destroy();s.resources.delete('42,40');s.resourceOccupancy.delete('42,40');
  s.buildings.splice(s.buildings.indexOf(building),1);s.towerViews.get(building.id).destroy();s.towerViews.delete(building.id);for(const tile of building.tiles)s.map[tile.y][tile.x]=0;
  s.gameTime.update(12345);return {s,building};
}

test('Save9 restores exact exploration and stale static knowledge without recreating physical objects or stocks',()=>{
  const {s,building}=fixture(),saved=validateGameState(serializeGameState(s));assert.equal(saved.saveVersion,SAVE_VERSION);
  assert.ok(saved.exploration.objects.some(e=>e.key===`building:${building.id}`));assert.ok(saved.exploration.objects.some(e=>e.key==='resource:42,40'));
  const restored=create(false);loadGameState(restored,saved);const again=serializeGameState(restored);
  assert.deepEqual(again.exploration,saved.exploration);assert.deepEqual(again.inventory,saved.inventory);assert.deepEqual(again.workers,saved.workers);assert.deepEqual(again.time,saved.time);
  assert.equal(restored.buildings.some(b=>b.id===building.id),false);assert.equal(restored.resources.has('42,40'),false);assert.equal(restored.map[40][44],0);
  move(restored,40,40);assert.equal(restored.mapMemory.objects.has(`building:${building.id}`),false);assert.equal(restored.mapMemory.objects.has('resource:42,40'),false);
});

test('actual old-schema migration is idempotent, leaves input unchanged and reveals only the loaded king circle even with Fog OFF',()=>{
  const {s}=fixture(),old=serializeGameState(s);old.saveVersion=8;delete old.exploration;delete old.settings.explorationMode;delete old.gameSettings.explorationMode;old.settings.fogOfWar=false;
  const original=structuredClone(old),migrated=validateGameState(old);assert.deepEqual(validateGameState(migrated),migrated);assert.deepEqual(old,original);
  assert.deepEqual(migrated.exploration,{version:1,explored:[],terrain:[],objects:[]});
  const restored=create(false);loadGameState(restored,migrated);const saved=serializeGameState(restored);
  assert.equal(saved.exploration.explored.length,317);assert.equal(restored.fog.state({x:40,y:40}),VISIBILITY.UNEXPLORED);assert.equal(restored.fog.state({x:80,y:80}),VISIBILITY.VISIBLE);
  assert.equal(restored.fog.enabled,false);assert.equal(restored.fog.explorationEnabled,true);assert.deepEqual(saved.inventory,old.inventory);assert.deepEqual(saved.time,old.time);
});

test('corrupt knowledge is rejected before load, including fake dynamic snapshots and never-discovered objects',()=>{
  const {s}=fixture(),saved=serializeGameState(s),before=structuredClone(saved);
  const changes=[
    data=>delete data.exploration,
    data=>data.exploration.explored.push(data.exploration.explored[0]),
    data=>data.exploration.terrain.pop(),
    data=>data.exploration.terrain[0][1][2]='Invented season',
    data=>data.exploration.objects.push(structuredClone(data.exploration.objects[0])),
    data=>data.exploration.objects[0].type='deer',
    data=>Object.assign(data.exploration.objects[0],{x:99,y:99}),
    data=>data.exploration.objects[0].visual.inventory={gold:100},
    data=>delete data.settings.explorationMode,
  ];
  for(const change of changes){const bad=structuredClone(saved);change(bad);const target=create(false),original=serializeGameState(target);assert.throws(()=>loadGameState(target,bad));assert.deepEqual(serializeGameState(target),original);}
  assert.deepEqual(serializeGameState(s),before);
});

test('a new kingdom has fresh knowledge, and only static visuals enter memory without residents or stock contents',()=>{
  const s=create(),worker=s.workerSystem.create({x:41,y:40});s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:43,y:40});s.inventory.add('gold',123);
  captureMapKnowledge(s);const entries=staticMemoryEntries(s);assert.ok(entries.length>0);assert.ok(entries.every(entry=>!['character','animal'].includes(s.objectRegistry.require(entry.type).category)));
  assert.equal(JSON.stringify(entries).includes('123'),false);assert.equal(entries.some(entry=>entry.key.includes(worker.id)),false);
  assert.equal(s.mapMemory.exportState().explored.length,317);assert.equal(s.fog.state({x:80,y:80}),VISIBILITY.UNEXPLORED);
});

test('placement rejects any hidden footprint with one generic message independently of the actual hidden contents',()=>{
  const s=create(),fog=s.fog;fog.setEnabled(true);
  assert.equal(visibilityPlacementError(fog,[{x:40,y:40},{x:41,y:40}]),null);
  const outside=[{x:49,y:44},{x:50,y:44}];assert.equal(visibilityPlacementError(fog,outside),OUTSIDE_SIGHT);
  s.map[44][50]=1;assert.equal(visibilityPlacementError(fog,outside),OUTSIDE_SIGHT);
  fog.setExplorationEnabled(false);assert.equal(visibilityPlacementError(fog,outside),OUTSIDE_SIGHT);
  fog.setEnabled(false);assert.equal(visibilityPlacementError(fog,outside),null);
});
