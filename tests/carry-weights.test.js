import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { RESOURCE_WEIGHTS,loadWeight,loadCapacity,carryCapacity,physicalResources,LOGISTICS_RULES } from '../src/data/logistics.js';

test('every physical resource has a central load weight; gold is never carried',()=>{
  for(const id of physicalResources(objectRegistry))assert.ok(Number.isSafeInteger(RESOURCE_WEIGHTS[id])&&RESOURCE_WEIGHTS[id]>0,id);
  assert.equal(Object.hasOwn(RESOURCE_WEIGHTS,'gold'),false);
  assert.deepEqual(['stone','wood','iron_ore','meat','wheat','apple','flour','bread'].map(loadWeight),[10,5,10,1,1,1,1,1]);
});

test('a person carries 40 load units: 4 Stone, 8 Wood or 40 food; Logistics adds 2 units every 5 levels for Haulers only',()=>{
  assert.equal(LOGISTICS_RULES.loadUnits,40);const king={},hauler=level=>({profession:'hauler',skills:{logistics:{level}}});
  assert.deepEqual(['stone','wood','meat'].map(id=>carryCapacity(king,id)),[4,8,40]);
  assert.deepEqual([1,5,6,50].map(l=>loadCapacity(hauler(l))),[40,40,42,58]);
  assert.equal(loadCapacity({profession:'miner',skills:{logistics:{level:50}}}),40);
  assert.equal(carryCapacity({},'armor'),5);
});
