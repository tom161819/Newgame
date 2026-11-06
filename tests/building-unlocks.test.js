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

test('new games and starting castles do not unlock farming; other food buildings keep their existing availability',()=>{
  const s=scene();s.buildings.push({id:90,type:'castle'});s.events.emit('buildings:changed');
  for(const id of ['granary','mill','bakery','hunting_lodge','tower','warehouse'])assert.equal(s.buildingUnlocks.status(definition(id)).unlocked,true);
  for(const id of ['farmhouse','wheat_field','orchard'])assert.equal(s.buildingUnlocks.status(definition(id)).unlocked,false);
  assert.match(s.buildingUnlocks.status(definition('farmhouse')).description,/Build a Granary/);
});
test('the placement transaction rejects locked objects before payment, reservations, occupancy or world mutation',()=>{
  const s=scene();s.inventory.add('stone',30);const before=serializeGameState(s);
  for(const id of ['farmhouse','wheat_field','orchard']){assert.ok(place(s,id).error);assert.deepEqual(serializeGameState(s),before);}
});
test('only physical Granary completion unlocks Farmhouse, then completed Farmhouse unlocks both crops',()=>{
  const s=scene();s.inventory.add('stone',30);const result=place(s,'granary');assert.ifError(result.error);const granary=result.building;s.constructionSystem.plan(granary);
  assert.equal(s.inventory.count('stone'),20);assert.match(s.buildingUnlocks.status(definition('farmhouse')).description,/completed Granary/);assert.ok(place(s,'farmhouse',50,44).error);
  assert.equal(s.kingLogistics.startMaterials(granary),true);until(s,()=>s.constructionSystem.materials.ready(granary));assert.equal(s.buildingUnlocks.status(definition('farmhouse')).unlocked,false);
  assert.equal(s.constructionSystem.commandKing(granary),true);until(s,()=>buildingIsComplete(granary));assert.equal(s.buildingUnlocks.status(definition('farmhouse')).unlocked,true);
  const farm=build(s,'farmhouse',50,44);assert.equal(s.buildingUnlocks.status(definition('wheat_field')).unlocked,true);assert.equal(s.buildingUnlocks.status(definition('orchard')).unlocked,true);
  assert.equal(s.inventory.count('stone'),10);assert.equal(s.buildings.filter(b=>b.type==='granary').length,1);assert.equal(s.buildings.find(b=>b.id===farm.id),farm);validateGameState(serializeGameState(s));
});
test('loss of the last prerequisite relocks placement and preserves blueprints; orphan plots wait for their Farmers',()=>{
  const s=scene();s.inventory.add('stone',30);const granary=build(s,'granary',44,44),farmResult=place(s,'farmhouse',50,44);assert.ifError(farmResult.error);const farm=farmResult.building;s.constructionSystem.plan(farm);
  s.buildings=s.buildings.filter(b=>b!==granary);s.events.emit('buildings:changed');assert.equal(s.buildingUnlocks.status(definition('farmhouse')).unlocked,false);assert.ok(place(s,'farmhouse',54,44).error);
  assert.equal(s.kingLogistics.startMaterials(farm),true);until(s,()=>s.constructionSystem.materials.ready(farm));s.constructionSystem.commandKing(farm);until(s,()=>buildingIsComplete(farm));
  const field=place(s,'wheat_field',54,44);assert.ifError(field.error);s.constructionSystem.plan(field.building);s.buildings=s.buildings.filter(b=>b!==farm);s.events.emit('buildings:changed');
  assert.equal(s.buildingUnlocks.status(definition('wheat_field')).unlocked,false);assert.ok(place(s,'orchard',60,44).error);assert.ok(s.buildings.includes(field.building));
  assert.equal(field.building.farmId,null);assert.equal(s.constructionSystem.materials.ready(field.building),true);assert.equal(s.constructionSystem.commandKing(field.building),false);s.simulate(1000);assert.equal(field.building.construction.workDone,0);
  s.buildings.push(farm);s.towerViews.set(farm.id,s.createBuildingView(farm.definition,farm));s.events.emit('buildings:changed');assert.equal(field.building.farmId,farm.id);const farmer=s.workerSystem.create({x:49,y:43});assert.ok(s.workplaceSystem.assign(farm,farmer));until(s,()=>buildingIsComplete(field.building));assert.equal(s.farmingSystem.records.has(field.building.id),true);assert.equal(farmer.skills.construction.totalXP,0);assert.ok(farmer.skills.farming.totalXP>0);
});
test('requirements are ANDed across completed types; duplicate sources survive until the last is removed',()=>{
  const d={requiresCompletedBuildings:['granary','farmhouse']},world=[{type:'granary'},{type:'farmhouse',construction:{state:'planned'}}];
  assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,false);world[1].construction.state='complete';assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,true);
  world.push({type:'granary'});world.shift();assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,true);world.pop();assert.equal(buildingUnlockStatus(d,world,objectRegistry).unlocked,false);
});
test('cached UI updates on world events and registry changes while transactional checks always inspect current world',()=>{
  const s=scene();let changes=0;const unsubscribe=s.buildingUnlocks.subscribe(()=>changes++);s.buildings.push({id:42,type:'granary'});
  assert.equal(s.buildingUnlocks.status(definition('farmhouse')).unlocked,false);assert.equal(s.buildingUnlocks.status(definition('farmhouse'),{live:true}).unlocked,true);
  s.events.emit('buildings:changed');assert.equal(changes,1);assert.equal(s.buildingUnlocks.status(definition('farmhouse')).unlocked,true);unsubscribe();s.buildingUnlocks.destroy();s.events.emit('buildings:changed');assert.equal(changes,1);
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
test('Save/Load derives prerequisites from actual buildings and preserves legacy dependent structures without inventing unlock state',()=>{
  const s=scene();s.inventory.add('stone',30);build(s,'granary',44,44);build(s,'farmhouse',50,44);const saved=validateGameState(serializeGameState(s)),r=scene({starter:false});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);
  assert.equal(r.buildingUnlocks.status(definition('wheat_field')).unlocked,true);assert.equal(Object.hasOwn(saved,'buildingUnlocks'),false);
  const legacy=structuredClone(saved);legacy.buildings=legacy.buildings.filter(b=>b.type!=='granary');legacy.foodStorage.locations=legacy.foodStorage.locations.filter(l=>l.kind!=='storage');
  legacy.workplaces.records=legacy.workplaces.records.filter(record=>legacy.buildings.some(b=>b.id===record.buildingId));
  // The removed Granary was empty, with no reservations/cargo; this represents
  // an older existing Farmhouse which never required a Granary.
  const old=scene({starter:false});loadGameState(old,legacy);assert.equal(old.buildings.some(b=>b.type==='farmhouse'),true);assert.equal(old.buildingUnlocks.status(definition('farmhouse')).unlocked,false);assert.equal(old.buildingUnlocks.status(definition('wheat_field')).unlocked,true);validateGameState(serializeGameState(old));
});
test('canceling an unfinished prerequisite releases its payment and updates the pending tooltip without unlocking',()=>{
  const s=scene();s.inventory.add('stone',10);const {building}=place(s,'granary');s.constructionSystem.plan(building);assert.match(s.buildingUnlocks.status(definition('farmhouse')).description,/completed Granary/);
  assert.equal(s.constructionSystem.cancel(building),true);assert.match(s.buildingUnlocks.status(definition('farmhouse')).description,/Build a Granary/);assert.equal(s.inventory.count('stone'),10);assert.equal(s.character.experience.totalXP,0);validateGameState(serializeGameState(s));
});
