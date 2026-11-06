import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { BUILDING_CATEGORIES,buildingsInCategory } from '../src/data/buildingCategories.js';
test('each implemented building has a central valid menu category; All contains only actual buildables',()=>{
  const all=buildingsInCategory(objectRegistry,'all');assert.deepEqual(all,objectRegistry.buildables());assert.equal(all.length,26);
  for(const d of objectRegistry.byCategory('building'))assert.ok(Object.hasOwn(BUILDING_CATEGORIES,d.buildingCategory));
  assert.deepEqual(buildingsInCategory(objectRegistry,'defense').map(d=>d.id),['tower','castle','wall','barracks','bowyer','swordsmith','armorer','armory']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'food').map(d=>d.id),['granary','farmhouse','hunting_lodge','wheat_field','orchard','mill','bakery']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'industry').map(d=>d.id),['quarry','wheelwright_workshop','lumberjack_hut','iron_mine','smelter','builder_workshop']);assert.deepEqual(buildingsInCategory(objectRegistry,'logistics').map(d=>d.id),['warehouse','stables']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'housing').map(d=>d.id),['house']);assert.deepEqual(buildingsInCategory(objectRegistry,'infrastructure').map(d=>d.id),['stone_pavement','brazier']);
});
test('data-only additions join their registered category automatically; uncategorized legacy extensions remain in All',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  registry.register({...base,id:'new_test_building',buildingCategory:'infrastructure'});assert.deepEqual(buildingsInCategory(registry,'infrastructure').map(d=>d.id),['stone_pavement','brazier','new_test_building']);
  delete base.buildingCategory;registry.register({...base,id:'uncategorized'});assert.ok(buildingsInCategory(registry,'all').some(d=>d.id==='uncategorized'));
  assert.throws(()=>registry.register({...base,id:'wrong',buildingCategory:'made_up'}),/kategorie/);
});
