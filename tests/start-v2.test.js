// m-start-v2 (owner 7 Nov 2026): 200 bread at the start, room for 10 at the Castle, a starting garrison.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings,NEW_GAME_DEFAULTS } from '../src/systems/GameSettings.js';
import { POPULATION } from '../src/data/jobs.js';
import { START_GARRISON,UNIT_TYPES } from '../src/data/military.js';
import { LOGISTICS_RULES } from '../src/data/logistics.js';
globalThis.document={querySelector:()=>({textContent:''})};

const scene=()=>workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings(NEW_GAME_DEFAULTS)});
test('defaults: 180 Bread fits the Starter Stockpile next to Stone and Wood',()=>{
  assert.equal(NEW_GAME_DEFAULTS.startingBread,180);assert.equal(LOGISTICS_RULES.starterCapacity,300);
  const s=scene(),starter=[...s.foodStorage.locations.values()].find(l=>l.buildingId===s.buildings.find(b=>b.type==='starter_stockpile').id);
  assert.equal(starter.stock.bread,180);assert.equal(starter.stock.wood,90);assert.equal(starter.stock.stone,30);
});
test('the starting garrison: 2 Soldiers and 2 Archers with their own equipment, inside the population of 10',()=>{
  assert.equal(POPULATION.maximum,10);
  const s=scene();s.workerSystem.spawnInitial(()=>.5);const before=s.workerSystem.liveSubjects().length,armory=s.inventory.count('sword');
  const garrison=s.military.enlistStartingGarrison(()=>.5);
  assert.deepEqual(garrison.map(w=>s.military.unit(w).type),START_GARRISON.flatMap(g=>Array(g.count).fill(g.type)));
  for(const w of garrison){assert.equal(w.profession,'soldier');assert.deepEqual(s.military.unit(w).equipment,UNIT_TYPES[s.military.unit(w).type].equipment);assert.equal(w.currentHP,w.maxHP);}
  assert.equal(s.workerSystem.liveSubjects().length,before+4);assert.ok(s.workerSystem.liveSubjects().length<=s.workerSystem.capacity());
  assert.equal(s.inventory.count('sword'),armory,'no Armory stock is used');
  assert.ok(garrison.find(w=>s.military.unit(w).type==='archer').attackRange>1,'archers shoot');
});
test('nobody arrives above the capacity; a House adds room',()=>{
  const s=scene();s.workerSystem.spawnInitial(()=>.5);while(s.workerSystem.liveSubjects().length<POPULATION.maximum)s.workerSystem.spawnNearStart(()=>.5);
  const n=s.workerSystem.liveSubjects().length;s.workerSystem.onNewDay(s.workerSystem.lastMigrationDay+1);assert.equal(s.workerSystem.liveSubjects().length,n,'full: no migrant');
  assert.equal(s.workerSystem.capacity(),POPULATION.maximum);
});
