import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { EQUIPMENT_SLOTS,MILITARY_ITEMS,UNIT_ROLES,HORSE_CONTRACT,MILITARY_AUDIT } from '../src/data/militaryEquipment.js';
import { JOBS } from '../src/data/jobs.js';
import { WORKPLACES } from '../src/data/workplaces.js';
import { readFileSync } from 'node:fs';

test('the audit matches the registry: Stables, Wheelwright and Horse Wagon are not implemented yet, the rest exists',()=>{
  for(const id of ['stables','wheelwright','horse_wagon']){assert.equal(objectRegistry.get(id)??null,null,`${id} is a Stage 12 feature, not a regression`);assert.match(MILITARY_AUDIT[id],/not implemented yet/);}
  assert.equal(objectRegistry.require('iron_bar').category,'resource');assert.equal(objectRegistry.require('barracks').buildable,true);
  assert.equal(objectRegistry.require('horse').category,'animal');assert.equal(WORKPLACES.barracks.profession,'soldier');
});

test('C07 goods: Bow, Sword and Armor are stored equipment goods made by their workshops from real resources; king items stay separate',()=>{
  const ids=Object.values(MILITARY_ITEMS).map(i=>i.itemId);assert.equal(new Set(ids).size,ids.length,'no duplicate items');
  for(const item of Object.values(MILITARY_ITEMS)){
    assert.ok(EQUIPMENT_SLOTS.includes(item.slot));const d=objectRegistry.require(item.itemId);
    assert.deepEqual([d.category,d.resourceCategory],['resource','equipment']);
    assert.deepEqual(objectRegistry.require(item.workshop).recipe.input,item.recipe,`${item.workshop} recipe`);assert.deepEqual(objectRegistry.require(item.workshop).recipe.output,{[item.itemId]:1});
    for(const resource of Object.keys(item.recipe))assert.equal(objectRegistry.require(resource).category,'resource');
    if(item.modifiersFrom)assert.equal(objectRegistry.require(item.modifiersFrom).equipment.slot,item.slot,'C08 reuses the king item modifiers');
  }
});

test('unit roles: one weapon each from the contract, Soldiers only, Knights locked until real Stables with a reservable horse',()=>{
  const weapons=new Set(Object.values(MILITARY_ITEMS).filter(i=>i.slot==='weapon').map(i=>i.itemId));assert.deepEqual([...weapons].sort(),['bow','sword']);
  for(const role of Object.values(UNIT_ROLES)){assert.ok(JOBS[role.profession]);assert.ok(weapons.has(role.weapon));}
  assert.equal(UNIT_ROLES.knight.mount,'horse');assert.equal(UNIT_ROLES.knight.lockedUntil,'stables');
  assert.equal(HORSE_CONTRACT.wildHorsesAssignable,false);
  // The king keeps exactly his two slots; mount is a contract slot for units, not an inventory slot.
  assert.match(readFileSync(new URL('../src/systems/EquipmentSystem.js',import.meta.url),'utf8'),/this\.slots=\{weapon:null,armor:null\}/);
});
