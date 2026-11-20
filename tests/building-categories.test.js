import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { BUILDING_CATEGORIES,buildingsInCategory } from '../src/data/buildingCategories.js';
test('each implemented building has a central valid menu category; All contains only actual buildables',()=>{
  const all=buildingsInCategory(objectRegistry,'all');assert.deepEqual(new Set(all),new Set(objectRegistry.buildables()));assert.equal(all.length,43); // +2: Stakes, Moat (20 Nov) // +3: Flax Field, Weaver, Tailor (p71)
  // #132: menuOrder only reorders inside a category; every other building keeps its place in All.
  // Owner 15 Nov 2026 (63): BUILDING_MENU_ORDER reorders inside a category; every building keeps its category's slots in All.
  objectRegistry.buildables().forEach((d,i)=>{assert.equal(all[i].buildingCategory,d.buildingCategory);});
  for(const d of objectRegistry.byCategory('building'))assert.ok(Object.hasOwn(BUILDING_CATEGORIES,d.buildingCategory));
  assert.deepEqual(buildingsInCategory(objectRegistry,'defense').map(d=>d.id),['castle','gate','wall','tower','stakes','moat','barracks','armory','bowyer','swordsmith','armorer','tailor']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'food').map(d=>d.id),['granary','hunting_lodge','fisherman_hut','farmhouse','orchard','wheat_field','flax_field','mill','bakery']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'industry').map(d=>d.id),['lumberjack_hut','builder_workshop','quarry','iron_mine','smelter','pitch_kiln','wheelwright_workshop','weaver']);assert.deepEqual(buildingsInCategory(objectRegistry,'logistics').map(d=>d.id),['material_yard','warehouse','marketplace','stables']);
  assert.deepEqual(buildingsInCategory(objectRegistry,'housing').map(d=>d.id),['house','village_green','swing_tree','haystack','well','fountain']);assert.deepEqual(buildingsInCategory(objectRegistry,'infrastructure').map(d=>d.id),['stone_pavement','brazier','torch_post','campfire']);
});
test('data-only additions join their registered category automatically; uncategorized legacy extensions remain in All',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  registry.register({...base,id:'new_test_building',buildingCategory:'infrastructure'});assert.deepEqual(buildingsInCategory(registry,'infrastructure').map(d=>d.id),['stone_pavement','brazier','torch_post','campfire','new_test_building']);
  delete base.buildingCategory;registry.register({...base,id:'uncategorized'});assert.ok(buildingsInCategory(registry,'all').some(d=>d.id==='uncategorized'));
  assert.throws(()=>registry.register({...base,id:'wrong',buildingCategory:'made_up'}),/kategorie/);
});
test('#132 menuOrder sorts within a category after the owner\'s list and must be a number',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  registry.register({...base,id:'first_food',buildingCategory:'food',menuOrder:1});registry.register({...base,id:'second_food',buildingCategory:'food',menuOrder:2});
  const food=buildingsInCategory(registry,'food').map(d=>d.id);assert.equal(food[0],'granary','the owner\'s list comes first');assert.ok(food.indexOf('first_food')<food.indexOf('second_food'));
  registry.register({...base,id:'unordered_food',buildingCategory:'food'});
  assert.equal(buildingsInCategory(registry,'food').at(-1).id,'unordered_food','buildings without an order follow the ordered ones');
  assert.throws(()=>registry.register({...base,id:'bad_order',menuOrder:'first'}),/pořadí/);
});
// m-staveni-zdi-studna (59): Stone Wall, Tower and Gate keep their tool too.
test('Farmhouse, Wheat Field, Orchard, Stone Wall, Tower and Gate keep their tool after an order; other buildings are placed once',()=>{
  const repeat=objectRegistry.buildables().filter(d=>d.repeatPlacement).map(d=>d.id).sort();
  assert.deepEqual(repeat,['farmhouse','flax_field','gate','moat','orchard','stakes','tower','wall','wheat_field']);
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  assert.throws(()=>registry.register({...base,id:'bad_repeat',repeatPlacement:'yes'}),/opakované/);
});
