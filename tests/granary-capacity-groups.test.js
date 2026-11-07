import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FOOD_RESOURCE_IDS } from '../src/data/foodProduction.js';
import { GRANARY_GROUP_CAPACITY,granaryGroup,granaryUsage } from '../src/data/granaryCapacity.js';

test('each actually accepted Granary good belongs to exactly one registry-backed group',()=>{
 assert.deepEqual(GRANARY_GROUP_CAPACITY,{raw:1000,food:1000});assert.ok(Object.isFrozen(GRANARY_GROUP_CAPACITY));
 assert.deepEqual(Object.fromEntries(FOOD_RESOURCE_IDS.map(id=>[id,granaryGroup(id,objectRegistry)])),{meat:'food',wheat:'raw',flour:'raw',bread:'food',apple:'food',fish:'food'});
 for(const id of ['stone','wood','iron_ore','gold','bow','sword','armor','farmhouse','missing'])assert.equal(granaryGroup(id,objectRegistry),null);
});
test('raw and food quantities stay separate without mutation, double credit or silent overflow clipping',()=>{
 const stock={wheat:140,flour:60,bread:100,meat:50,apple:50};assert.deepEqual(granaryUsage(stock,objectRegistry),{raw:200,food:200});assert.deepEqual(stock,{wheat:140,flour:60,bread:100,meat:50,apple:50});
 assert.deepEqual(granaryUsage({wheat:201,bread:200},objectRegistry),{raw:201,food:200},'callers must be able to detect overfull raw storage independently');assert.deepEqual(granaryUsage({},objectRegistry),{raw:0,food:0});
 for(const bad of [{wheat:-1},{wheat:.5},{wheat:NaN},{wheat:Infinity},{wood:1},{unknown:0}])assert.throws(()=>granaryUsage(bad,objectRegistry));
});
test('new accepted products follow their own edible metadata, while excluded items remain excluded',()=>{
 const additions={barley:{id:'barley',category:'resource',edible:false},stew:{id:'stew',category:'resource',edible:true}};
 const registry={get(id){if(id==='granary'){const d=objectRegistry.require('granary');return {...d,storage:{...d.storage,resources:[...d.storage.resources,...Object.keys(additions)]}};}return additions[id]??objectRegistry.get(id);}};
 assert.equal(granaryGroup('barley',registry),'raw');assert.equal(granaryGroup('stew',registry),'food');assert.deepEqual(granaryUsage({barley:30,stew:40,wheat:10,apple:5},registry),{raw:40,food:45});assert.equal(granaryGroup('sword',registry),null);
});
