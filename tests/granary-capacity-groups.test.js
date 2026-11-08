import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FOOD_RESOURCE_IDS } from '../src/data/foodProduction.js';
import { GRANARY_GROUP_CAPACITY,granaryGroup,granaryUsage } from '../src/data/granaryCapacity.js';

// farmhouse-store (owner 8 Nov 2026): Wheat and Flour moved to Farmhouse stores, so the Granary has one food group.
test('each actually accepted Granary good belongs to exactly one registry-backed group',()=>{
 assert.deepEqual(GRANARY_GROUP_CAPACITY,{food:1000});assert.ok(Object.isFrozen(GRANARY_GROUP_CAPACITY));
 assert.deepEqual(Object.fromEntries(FOOD_RESOURCE_IDS.map(id=>[id,granaryGroup(id,objectRegistry)])),{meat:'food',wheat:null,flour:null,bread:'food',apple:'food',fish:'food'});
 assert.deepEqual(objectRegistry.require('granary').storage.resources,['meat','bread','apple','fish'],'the Granary takes no Wheat or Flour');
 for(const id of ['stone','wood','iron_ore','gold','bow','sword','armor','farmhouse','missing','wheat','flour'])assert.equal(granaryGroup(id,objectRegistry),null);
});
test('food quantities are counted without mutation, double credit or silent overflow clipping; grain is not Granary stock',()=>{
 const stock={bread:100,meat:50,apple:50};assert.deepEqual(granaryUsage(stock,objectRegistry),{food:200});assert.deepEqual(stock,{bread:100,meat:50,apple:50});
 assert.deepEqual(granaryUsage({bread:1001},objectRegistry),{food:1001},'callers must be able to detect overfull storage');assert.deepEqual(granaryUsage({},objectRegistry),{food:0});
 for(const bad of [{bread:-1},{bread:.5},{bread:NaN},{bread:Infinity},{wood:1},{unknown:0},{wheat:1},{flour:1}])assert.throws(()=>granaryUsage(bad,objectRegistry));
});
test('new accepted products follow their own edible metadata, while excluded items remain excluded',()=>{
 const additions={barley:{id:'barley',category:'resource',edible:false},stew:{id:'stew',category:'resource',edible:true}};
 const registry={get(id){if(id==='granary'){const d=objectRegistry.require('granary');return {...d,storage:{...d.storage,resources:[...d.storage.resources,...Object.keys(additions)]}};}return additions[id]??objectRegistry.get(id);}};
 assert.equal(granaryGroup('barley',registry),null,'a raw good has no Granary group any more');assert.equal(granaryGroup('stew',registry),'food');assert.deepEqual(granaryUsage({stew:40,apple:5},registry),{food:45});assert.equal(granaryGroup('sword',registry),null);
});
