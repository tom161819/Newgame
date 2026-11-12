import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { buildingUnlockStatus } from '../src/systems/BuildingUnlockManager.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { BASE_PRICES,TRADE_RULES,price,priceTable,tradeableResources } from '../src/data/trade.js';
globalThis.document={querySelector:()=>({textContent:''})};

test('tradeable goods come from the resource registry and all have a price', () => {
  const ids=tradeableResources(objectRegistry).map(d=>d.id);
  for(const id of ['stone','wood','iron_ore','iron','wheat','apple','flour','bread','meat','bow','sword','armor'])assert.ok(ids.includes(id),id);
  for(const id of ['gold','wheelbarrow','horse_wagon','oak_tree','stone_deposit'])assert.equal(ids.includes(id),false,id);
  for(const id of ids)assert.ok(BASE_PRICES[id]>0,`${id} has a base price`);
  assert.equal(priceTable(objectRegistry).length,ids.length);
});

test('a caravan sells at 115 % and buys at 80 %, rounded to whole Gold, at least 1, buy always above sell', () => {
  assert.equal(price('bread','buy'),8);assert.equal(price('bread','sell'),6);assert.equal(price('wood','buy'),5);assert.equal(price('wood','sell'),3);
  assert.equal(price('wheat','sell'),2);assert.equal(price('wheat','buy'),3,'2.3 would round to the sell price; buy stays above it');
  for(const id of Object.keys(BASE_PRICES)){const buy=price(id,'buy'),sell=price(id,'sell');assert.ok(Number.isInteger(buy)&&Number.isInteger(sell)&&sell>=1&&buy>sell,id);}
  assert.equal(price('x','buy',{basePrice:.2}),2);assert.equal(price('x','sell',{basePrice:.2}),1);
  assert.equal(price('dragon','buy'),null);assert.throws(()=>price('wood','steal'));
  // Making goods from bought inputs and selling them is never free money, and processed goods are worth their inputs.
  assert.ok(BASE_PRICES.iron>=3*BASE_PRICES.iron_ore+2*BASE_PRICES.wood);assert.ok(BASE_PRICES.sword>=3*BASE_PRICES.iron+2*BASE_PRICES.wood);
  assert.ok(BASE_PRICES.armor>=5*BASE_PRICES.iron+2*BASE_PRICES.wood);assert.ok(BASE_PRICES.bow>=8*BASE_PRICES.wood);
});

test('the Marketplace is a 3×3 Logistics building for 12 Stone + 8 Wood, open from the start (m-trziste-bez-skladu, owner 12 Nov)', () => {
  const d=objectRegistry.require('marketplace');
  assert.deepEqual([d.width,d.height,d.buildingCategory,d.buildable],[3,3,'logistics',true]);assert.deepEqual(d.cost,{stone:12,wood:8});
  assert.deepEqual(d.trade,{capacity:TRADE_RULES.marketplaceCapacity,loadingSpots:2});assert.equal(TRADE_RULES.marketplaceCapacity,80);
  assert.equal(buildingUnlockStatus(d,[],objectRegistry).unlocked,true,'no Warehouse needed');
});

test('a Marketplace site and a finished Marketplace survive Save/Load; only a finished one trades', () => {
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()}),d=s.objectRegistry.require('marketplace');
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;s.foodStorage.deposit(starter,'stone',12);s.foodStorage.deposit(starter,'wood',8);
  s.foodStorage.deposit(starter,'stone',10);s.foodStorage.deposit(starter,'wood',4);const warehouse=placeBuilding({map:s.map,anchor:{x:56,y:40},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:s.objectRegistry.require('warehouse')});assert.ifError(warehouse.error);s.towerViews.set(warehouse.building.id,s.createBuildingView(warehouse.building.definition,warehouse.building));s.events?.emit?.('buildings:changed');
  const result=placeBuilding({map:s.map,anchor:{x:48,y:40},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});
  assert.ifError(result.error);const b=result.building;s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(d,b));
  assert.equal(buildingIsComplete(b),false);
  const trading=scene=>scene.buildings.filter(x=>x.type==='marketplace'&&buildingIsComplete(x)).length;
  assert.equal(trading(s),0,'an unfinished Marketplace does not trade');
  let saved=validateGameState(serializeGameState(s));
  let r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);
  // A finished Marketplace (placed and paid at once, as older tests place finished buildings).
  const done=placeBuilding({map:s.map,anchor:{x:44,y:48},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:(s.foodStorage.deposit(starter,'stone',12),s.foodStorage.deposit(starter,'wood',8),s.inventory),buildings:s.buildings,definition:d});
  assert.ifError(done.error);s.towerViews.set(done.building.id,s.createBuildingView(d,done.building));
  assert.equal(trading(s),1);saved=validateGameState(serializeGameState(s));
  r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});loadGameState(r,saved);assert.equal(trading(r),1);
});
