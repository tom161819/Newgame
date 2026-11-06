import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { BUILDING_CATEGORIES,buildingsInCategory } from '../src/data/buildingCategories.js';
test('each implemented building has a central valid menu category; All contains only actual buildables',()=>{
  const all=buildingsInCategory(objectRegistry,'all');assert.deepEqual(new Set(all),new Set(objectRegistry.buildables()));assert.equal(all.length,25);
  // #132: menuOrder only reorders inside a category; every other building keeps its place in All.
  objectRegistry.buildables().forEach((d,i)=>{if(d.buildingCategory!=='food')assert.equal(all[i],d);else assert.equal(all[i].buildingCategory,'food');});
  for(const d of objectRegistry.byCategory('building'))assert.ok(Object.hasOwn(BUILDING_CATEGORIES,d.buildingCategory));
  assert.deepEqual(buildingsInCategory(objectRegistry,'defense').map(d=>d.id),['tower','castle','wall','barracks','bowyer','swordsmith','armorer','armory']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'food').map(d=>d.id),['granary','farmhouse','wheat_field','orchard','hunting_lodge','mill','bakery']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'industry').map(d=>d.id),['quarry','wheelwright_workshop','lumberjack_hut','iron_mine','smelter']);assert.deepEqual(buildingsInCategory(objectRegistry,'logistics').map(d=>d.id),['warehouse','stables']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'housing').map(d=>d.id),['house']);assert.deepEqual(buildingsInCategory(objectRegistry,'infrastructure').map(d=>d.id),['stone_pavement','brazier']);
});
test('data-only additions join their registered category automatically; uncategorized legacy extensions remain in All',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  registry.register({...base,id:'new_test_building',buildingCategory:'infrastructure'});assert.deepEqual(buildingsInCategory(registry,'infrastructure').map(d=>d.id),['stone_pavement','brazier','new_test_building']);
  delete base.buildingCategory;registry.register({...base,id:'uncategorized'});assert.ok(buildingsInCategory(registry,'all').some(d=>d.id==='uncategorized'));
  assert.throws(()=>registry.register({...base,id:'wrong',buildingCategory:'made_up'}),/kategorie/);
});
test('#132 menuOrder sorts within a category and must be a number',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  registry.register({...base,id:'first_food',buildingCategory:'food',menuOrder:1});
  assert.equal(buildingsInCategory(registry,'food')[0].id,'first_food');
  registry.register({...base,id:'unordered_food',buildingCategory:'food'});
  assert.equal(buildingsInCategory(registry,'food').at(-1).id,'unordered_food','buildings without an order follow the ordered ones');
  assert.throws(()=>registry.register({...base,id:'bad_order',menuOrder:'first'}),/pořadí/);
});
