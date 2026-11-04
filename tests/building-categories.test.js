import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { BUILDING_CATEGORIES,buildingsInCategory } from '../src/data/buildingCategories.js';
test('each implemented building has a central valid menu category; All contains only actual buildables',()=>{
  const all=buildingsInCategory(objectRegistry,'all');assert.deepEqual(all,objectRegistry.buildables());assert.equal(all.length,15);
  for(const d of objectRegistry.byCategory('building'))assert.ok(Object.hasOwn(BUILDING_CATEGORIES,d.buildingCategory));
  assert.deepEqual(buildingsInCategory(objectRegistry,'defense').map(d=>d.id),['tower','castle','wall','barracks']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'food').map(d=>d.id),['hunting_lodge','farmhouse','wheat_field','orchard','mill','bakery','granary']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'industry').map(d=>d.id),['quarry','lumberjack_hut','iron_mine']);assert.deepEqual(buildingsInCategory(objectRegistry,'logistics').map(d=>d.id),['warehouse']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'housing'),[]);assert.deepEqual(buildingsInCategory(objectRegistry,'infrastructure'),[]);
});
test('data-only additions join their registered category automatically; uncategorized legacy extensions remain in All',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  registry.register({...base,id:'new_test_building',buildingCategory:'infrastructure'});assert.equal(buildingsInCategory(registry,'infrastructure')[0].id,'new_test_building');
  delete base.buildingCategory;registry.register({...base,id:'uncategorized'});assert.ok(buildingsInCategory(registry,'all').some(d=>d.id==='uncategorized'));
  assert.throws(()=>registry.register({...base,id:'wrong',buildingCategory:'made_up'}),/kategorie/);
});
