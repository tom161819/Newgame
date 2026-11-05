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

test('produced Sword and Armor are the existing king items; the Bow is new and not yet registered; recipes use real resources',()=>{
  const ids=Object.values(MILITARY_ITEMS).map(i=>i.itemId);assert.equal(new Set(ids).size,ids.length,'no duplicate items');
  for(const item of Object.values(MILITARY_ITEMS)){
    assert.ok(EQUIPMENT_SLOTS.includes(item.slot));
    const d=objectRegistry.get(item.itemId);
    if(item.exists){assert.equal(d.category,'equipment');assert.equal(d.equipment.slot,item.slot,'same slot as the king uses');}
    else assert.equal(d??null,null,'added by C07, not before');
    for(const resource of Object.keys(item.recipe))assert.equal(objectRegistry.require(resource).category,'resource');
  }
});

test('unit roles: one weapon each from the contract, Soldiers only, Knights locked until real Stables with a reservable horse',()=>{
  const weapons=new Set(Object.values(MILITARY_ITEMS).filter(i=>i.slot==='weapon').map(i=>i.itemId));
  for(const role of Object.values(UNIT_ROLES)){assert.ok(JOBS[role.profession]);assert.ok(weapons.has(role.weapon));}
  assert.equal(UNIT_ROLES.knight.mount,'horse');assert.equal(UNIT_ROLES.knight.lockedUntil,'stables');
  assert.equal(HORSE_CONTRACT.wildHorsesAssignable,false);
  // The king keeps exactly his two slots; mount is a contract slot for units, not an inventory slot.
  assert.match(readFileSync(new URL('../src/systems/EquipmentSystem.js',import.meta.url),'utf8'),/this\.slots=\{weapon:null,armor:null\}/);
});
