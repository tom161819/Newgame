import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings,NEW_GAME_DEFAULTS } from '../src/systems/GameSettings.js';
import { Inventory } from '../src/game/inventory.js';
import { GOLD_LIMIT } from '../src/data/economy.js';
import { LOGISTICS_RULES } from '../src/data/logistics.js';
import { buildingUnlockStatus } from '../src/systems/BuildingUnlockManager.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// Owner request 7 Nov 2026: a new game starts with a Castle, 500 Gold (the limit) and a full 160-unit Starter Stockpile.
const scene=settings=>workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings(settings)});
const starter=s=>s.foodStorage.locations.get(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`);

test('Gold has a limit of 500: income above it is not added and only what fits is recorded',()=>{
  const inventory=new Inventory(),income=[];inventory.ledger={income:(r,n)=>income.push([r,n]),expense(){}};
  assert.equal(inventory.limit('gold'),GOLD_LIMIT);assert.equal(inventory.limit('stone'),null);
  inventory.add('gold',480);inventory.add('gold',50);assert.equal(inventory.count('gold'),500);
  inventory.add('gold',5);assert.equal(inventory.count('gold'),500);
  assert.deepEqual(income,[['gold',480],['gold',20]],'the ledger counts only gold that was actually added');
  assert.equal(inventory.spend('gold',100),true);inventory.add('gold',30);assert.equal(inventory.count('gold'),430);
  inventory.add('stone',900);assert.equal(inventory.count('stone'),900,'other inventory counts have no limit here');
  const old=new Inventory();old.importState({gold:750});old.add('gold',10);assert.equal(old.count('gold'),750,'an older save above the limit keeps its gold but gains none');
});

test('only one Castle: a second one is refused in the menu and in placement, a starting Castle counts',()=>{
  const s=scene(NEW_GAME_DEFAULTS),castle=s.objectRegistry.require('castle');
  const status=buildingUnlockStatus(castle,s.buildings,s.objectRegistry);assert.equal(status.unlocked,false);assert.match(status.description,/Already built/);
  s.inventory.add('stone',20);
  const result=placeBuilding({map:s.map,anchor:{x:20,y:20},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:castle});
  assert.ok(result.error);assert.equal(s.buildings.filter(b=>b.type==='castle').length,1);
  const none=scene({...NEW_GAME_DEFAULTS,startingCastle:false});assert.equal(buildingUnlockStatus(castle,none.buildings,none.objectRegistry).unlocked,true,'without a starting Castle the player builds one');
});

test('a new game stores 160 units in the Starter Stockpile; an older game keeps its 40-unit stockpile on load',()=>{
  const s=scene(NEW_GAME_DEFAULTS);assert.equal(starter(s).capacity,LOGISTICS_RULES.starterCapacity);
  const old=scene({startingStone:20});starter(old).capacity=LOGISTICS_RULES.legacyStarterCapacity;
  const saved=validateGameState(JSON.parse(JSON.stringify(serializeGameState(old))));
  const r=workerScene(undefined,{construction:true,logistics:true,starter:false,gameSettings:gameSettings(saved.gameSettings)});loadGameState(r,saved);
  assert.equal(starter(r).capacity,40,'the older stockpile is unchanged');assert.deepEqual(serializeGameState(r),saved);
  const odd=structuredClone(saved);odd.foodStorage.locations.find(l=>l.kind==='fallback'&&l.buildingId!=null).capacity=80;assert.throws(()=>validateGameState(odd),'only 40 or 160 are valid');
});
