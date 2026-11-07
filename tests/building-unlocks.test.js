import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { BuildingUnlockManager,buildingUnlockStatus } from '../src/systems/BuildingUnlockManager.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const definition=id=>objectRegistry.require(id);
const scene=({starter=true}={})=>{const s=workerScene(undefined,{construction:true,logistics:true,starter});s.events=new EventEmitter();s.events.on('buildings:changed',s.farmingSystem.worldChanged);s.buildingUnlocks=new BuildingUnlockManager(s);return s;};
function place(s,type,x=44,y=44){return placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:definition(type),reserveMaterials:true});}
function until(s,predicate,max=80000){let elapsed=0;while(!predicate()&&elapsed<max){s.tick(25);elapsed+=25;}assert.ok(predicate(),`Condition not reached (${elapsed}ms).`);}
function build(s,type,x,y){const result=place(s,type,x,y);assert.ifError(result.error);const b=result.building;s.constructionSystem.plan(b);assert.equal(s.kingLogistics.startMaterials(b),true);until(s,()=>s.constructionSystem.materials.ready(b));assert.equal(s.constructionSystem.commandKing(b),true);until(s,()=>buildingIsComplete(b));return b;}

test('Food menu (owner, 7 Nov): nothing is locked; a building without its earlier one shows a red warning instead',()=>{
  const s=scene();s.buildings.push({id:90,type:'castle'});s.events.emit('buildings:changed');
  for(const id of ['granary','mill','bakery','farmhouse','wheat_field','orchard','hunting_lodge','fisherman_hut'])assert.equal(s.buildingUnlocks.status(definition(id)).unlocked,true,id);
  assert.equal(s.buildingUnlocks.status(definition('farmhouse')).warning,'Needs a Granary to store food');
  assert.equal(s.buildingUnlocks.status(definition('hunting_lodge')).warning,'Needs a Granary to store food');
  assert.equal(s.buildingUnlocks.status(definition('fisherman_hut')).warning,'Needs a Granary to store food');
  assert.equal(s.buildingUnlocks.status(definition('wheat_field')).warning,'Needs a Farmhouse to tend it');
  assert.equal(s.buildingUnlocks.status(definition('mill')).warning,'Needs a Wheat Field');assert.equal(s.buildingUnlocks.status(definition('bakery')).warning,'Needs a Mill for flour');
  assert.equal(s.buildingUnlocks.status(definition('granary')).warning,'');
  for(const id of ['marketplace','village_green'])assert.equal(s.buildingUnlocks.status(definition(id)).unlocked,false,`other categories keep their locks (${id})`);
});
test('a Hunting Lodge can be placed before a Granary; the warning stays for an unfinished Granary and goes once it is complete',()=>{
  const s=scene();(s.inventory.add('stone',40),s.inventory.add('wood',40));
  assert.ifError(place(s,'hunting_lodge').error,'placed without a Granary');
  const granary=place(s,'granary',50,44).building;s.constructionSystem.plan(granary);s.events.emit('buildings:changed');
  assert.match(s.buildingUnlocks.status(definition('hunting_lodge')).warning,/Granary/);
  assert.equal(s.kingLogistics.startMaterials(granary),true);until(s,()=>s.constructionSystem.materials.ready(granary));
  assert.equal(s.constructionSystem.commandKing(granary),true);until(s,()=>buildingIsComplete(granary));
  assert.equal(s.buildingUnlocks.status(definition('hunting_lodge')).warning,'');
});
test('the placement transaction still rejects locked objects (other categories) before payment, reservations, occupancy or world mutation',()=>{
  const s=scene();(s.inventory.add('stone',30),s.inventory.add('wood',30));s.inventory.add('wood',30);const before=serializeGameState(s);
  for(const id of ['marketplace','village_green']){assert.ok(place(s,id).error);assert.deepEqual(serializeGameState(s),before);}
});
test('a Farmhouse before its Granary only warns; crops warn until a Farmhouse is complete',()=>{
  const s=scene();(s.inventory.add('stone',30),s.inventory.add('wood',40));const farmFirst=place(s,'farmhouse',56,44);assert.ifError(farmFirst.error,'Farmhouse without a Granary');s.constructionSystem.plan(farmFirst.building);
  assert.match(s.buildingUnlocks.status(definition('wheat_field')).warning,/Farmhouse/);
  const granary=build(s,'granary',44,44);assert.equal(s.buildingUnlocks.status(definition('farmhouse')).warning,'');
  const farm=build(s,'farmhouse',50,44);assert.equal(s.buildingUnlocks.status(definition('wheat_field')).warning,'');assert.equal(s.buildingUnlocks.status(definition('orchard')).warning,'');
  assert.ok(granary&&s.buildings.find(b=>b.id===farm.id));validateGameState(serializeGameState(s));
});
test('losing the earlier building brings the warning back; orphan plots still wait for their Farmers',()=>{
  const s=scene();(s.inventory.add('stone',30),s.inventory.add('wood',30));const granary=build(s,'granary',44,44),farm=build(s,'farmhouse',50,44);
  s.buildings=s.buildings.filter(b=>b!==granary);s.events.emit('buildings:changed');assert.match(s.buildingUnlocks.status(definition('farmhouse')).warning,/Granary/);assert.equal(s.buildingUnlocks.status(definition('farmhouse')).unlocked,true);
  const field=place(s,'wheat_field',54,44);assert.ifError(field.error);s.constructionSystem.plan(field.building);s.buildings=s.buildings.filter(b=>b!==farm);s.events.emit('buildings:changed');
  assert.match(s.buildingUnlocks.status(definition('wheat_field')).warning,/Farmhouse/);assert.ifError(place(s,'orchard',60,44).error,'an orchard can still be planned');assert.ok(s.buildings.includes(field.building));
  assert.equal(field.building.farmId,null);assert.equal(s.constructionSystem.commandKing(field.building),false);
});
test('requirements are ANDed across completed types; duplicate sources survive until the last is removed',()=>{
  const d={requiresCompletedBuildings:['granary','farmhouse']},world=[{type:'granary'},{type:'farmhouse',construction:{state:'planned'}}];
  assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,false);world[1].construction.state='complete';assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,true);
  world.push({type:'granary'});world.shift();assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,true);world.pop();assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,false);
});
test('cached UI updates on world events and registry changes while transactional checks always inspect current world',()=>{
  const s=scene();let changes=0;const unsubscribe=s.buildingUnlocks.subscribe(()=>changes++);s.buildings.push({id:42,type:'granary'});
  assert.match(s.buildingUnlocks.status(definition('farmhouse')).warning,/Granary/);assert.equal(s.buildingUnlocks.status(definition('farmhouse'),{live:true}).warning,'');
  s.events.emit('buildings:changed');assert.equal(changes,1);assert.equal(s.buildingUnlocks.status(definition('farmhouse')).warning,'');unsubscribe();s.buildingUnlocks.destroy();s.events.emit('buildings:changed');assert.equal(changes,1);
});
test('registry rejects unknown prerequisites, duplicates and cycles atomically',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(definition('tower')),before=registry.all().length;
  for(const requiresCompletedBuildings of [['missing'],['stone'],['new'],['granary','granary']])assert.throws(()=>registry.register({...base,id:'new',requiresCompletedBuildings}));
  assert.throws(()=>registry.registerAll([{...base,id:'a',requiresCompletedBuildings:['b']},{...base,id:'b',requiresCompletedBuildings:['a']}]),/cyklické/);assert.equal(registry.all().length,before);
});
test('data-only registry additions refresh unlock listeners and use their registered requirements',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),world={objectRegistry:registry,buildings:[{type:'granary'}],events:new EventEmitter()},manager=new BuildingUnlockManager(world);let changed=0;manager.subscribe(()=>changed++);
  const added=registry.register({...structuredClone(definition('tower')),id:'test_extension',buildingCategory:'food',requiresCompletedBuildings:['granary']});assert.equal(changed,1);assert.equal(manager.status(added).unlocked,true);
  for(let frame=0;frame<500;frame++)assert.equal(manager.status(added).unlocked,true);assert.equal(changed,1);manager.destroy();
});
test('Save/Load derives warnings from actual buildings without saving any unlock state',()=>{
  const s=scene();(s.inventory.add('stone',30),s.inventory.add('wood',30));build(s,'granary',44,44);build(s,'farmhouse',50,44);const saved=validateGameState(serializeGameState(s)),r=scene({starter:false});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);
  assert.equal(r.buildingUnlocks.status(definition('wheat_field')).warning,'');assert.equal(Object.hasOwn(saved,'buildingUnlocks'),false);
  const legacy=structuredClone(saved);legacy.buildings=legacy.buildings.filter(b=>b.type!=='granary');legacy.foodStorage.locations=legacy.foodStorage.locations.filter(l=>l.kind!=='storage');
  legacy.workplaces.records=legacy.workplaces.records.filter(record=>legacy.buildings.some(b=>b.id===record.buildingId));
  const old=scene({starter:false});loadGameState(old,legacy);assert.equal(old.buildings.some(b=>b.type==='farmhouse'),true);assert.match(old.buildingUnlocks.status(definition('farmhouse')).warning,/Granary/);assert.equal(old.buildingUnlocks.status(definition('wheat_field')).warning,'');validateGameState(serializeGameState(old));
});
test('canceling an unfinished Granary releases its payment; the warning stays',()=>{
  const s=scene();s.inventory.add('wood',12);const {building}=place(s,'granary');s.constructionSystem.plan(building);assert.match(s.buildingUnlocks.status(definition('farmhouse')).warning,/Granary/);
  assert.equal(s.constructionSystem.cancel(building),true);assert.match(s.buildingUnlocks.status(definition('farmhouse')).warning,/Granary/);assert.equal(s.inventory.count('wood'),12);assert.equal(s.character.experience.totalXP,0);validateGameState(serializeGameState(s));
});
