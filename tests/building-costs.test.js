import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { objectDefinitions } from '../src/data/objects/index.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { CostError,costDiff,priceProposals,readBuildingCosts,writeBuildingCosts,validateCost,BUILDING_COST_KEY } from '../src/data/buildingCostAuthoring.js';
import { buildingDemolitionRefund,paidCost } from '../src/data/demolition.js';
globalThis.document={querySelector:()=>({textContent:''})};

const fresh=()=>new ObjectRegistry(objectDefinitions);
const code=fn=>{try{fn();}catch(error){assert.ok(error instanceof CostError,String(error));return error.code;}assert.fail('no error');};
const set=(r,costs)=>r.configureCosts({version:1,costs});

test('a price is at least one known resource, each a whole number from 1', () => {
  const resources=new Set(['stone','wood','gold']);
  assert.deepEqual(validateCost({stone:3,gold:1},resources),{stone:3,gold:1});
  assert.equal(code(()=>validateCost({},resources)),'cost.empty');
  assert.equal(code(()=>validateCost({stone:0},resources)),'cost.amount');
  assert.equal(code(()=>validateCost({stone:1.5},resources)),'cost.amount');
  assert.equal(code(()=>validateCost({stone:'2'},resources)),'cost.amount');
  assert.equal(code(()=>validateCost({stone:10000},resources)),'cost.amount');
  assert.equal(code(()=>validateCost({dragon:1},resources)),'cost.unknownResource');
  assert.equal(code(()=>validateCost(null,resources)),'cost.invalid');
});

test('the Asset Library can change an amount, add a resource and remove one; reset restores the default', () => {
  const r=fresh();assert.deepEqual(r.require('house').cost,{wood:10,stone:4});
  set(r,{house:{wood:6,stone:4,gold:5}});assert.deepEqual(r.require('house').cost,{wood:6,stone:4,gold:5},'changed wood, added gold');
  set(r,{house:{wood:6}});assert.deepEqual(r.require('house').cost,{wood:6},'stone removed: the override is the whole price');
  assert.deepEqual(r.costDefaults.get('house'),{wood:10,stone:4},'the default stays known');
  assert.deepEqual(costDiff(r.costDefaults.get('house'),r.require('house').cost).map(d=>`${d.resource}:${d.state}`),['wood:changed','stone:removed']);
  set(r,{house:{wood:6},farmhouse:{stone:10}});assert.deepEqual(r.costOverrides,{house:{wood:6}},'an override equal to the default is dropped');
  set(r,{});assert.deepEqual(r.require('house').cost,{wood:10,stone:4});assert.deepEqual(r.costOverrides,{});
});

test('invalid price lists change nothing', () => {
  const r=fresh();set(r,{tower:{stone:4}});
  for(const [costs,expected]of [[{tower:{}},'cost.empty'],[{tower:{stone:0}},'cost.amount'],[{tower:{oak_tree:1}},'cost.unknownResource'],[{tower:{sword:1}},'cost.unknownResource'],[{nothing:{stone:1}},'cost.unknownBuilding']])
    assert.equal(code(()=>set(r,costs)),expected);
  assert.equal(code(()=>r.configureCosts({version:2,costs:{}})),'cost.file');
  assert.deepEqual(r.require('tower').cost,{stone:4});
  // The Wheat Field is free by default; it may get a price, and reset makes it free again.
  set(r,{wheat_field:{wood:1}});assert.deepEqual(r.require('wheat_field').cost,{wood:1});set(r,{});assert.deepEqual(r.require('wheat_field').cost,{});
});

test('a new site books the new price; it keeps that price after a reset, through Save/Load, and demolition refunds half of it', () => {
  const r=fresh(),s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.objectRegistry=r;
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;s.foodStorage.deposit(starter,'stone',20);s.foodStorage.deposit(starter,'wood',10);
  set(r,{tower:{stone:4,wood:2}});
  const place=(x,y)=>{const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:r.require('tower'),reserveMaterials:true});assert.ifError(result.error);s.constructionSystem.plan(result.building);s.towerViews.set(result.building.id,s.createBuildingView(result.building.definition,result.building));return result.building;};
  const b=place(48,43);
  assert.deepEqual(b.materialSupply.required,{stone:4,wood:2});assert.deepEqual(b.construction.investedMaterials,{stone:4,wood:2});
  assert.deepEqual(paidCost(b,r.require('tower')),{stone:4,wood:2});
  set(r,{});assert.deepEqual(r.require('tower').cost,{stone:10});
  assert.deepEqual(s.constructionSystem.materials.required(b),{stone:4,wood:2},'the site still asks for what it booked');
  const saved=validateGameState(serializeGameState(s),r);
  const restored=workerScene(undefined,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});restored.objectRegistry=r;loadGameState(restored,saved);
  assert.deepEqual(serializeGameState(restored),saved,'a site placed with a changed price loads after the reset');
  const bad=structuredClone(saved),site=bad.buildings.find(x=>x.id===b.id);site.construction.investedMaterials.stone=3;assert.throws(()=>validateGameState(bad,r),'a site price that matches neither the price nor its booked supply is rejected');
  const finished={construction:{state:'complete',investedMaterials:{stone:4,wood:2}}};
  assert.deepEqual(buildingDemolitionRefund(finished,r.require('tower')),{stone:2,wood:1});
  assert.deepEqual(buildingDemolitionRefund({},r.require('castle')),{stone:5},'without a construction record the definition price counts');
});

test('prices are stored in this browser only and exported in the shared proposal format', () => {
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};
  assert.equal(writeBuildingCosts(storage,{house:{wood:6}}),true);assert.deepEqual(readBuildingCosts(storage),{version:1,costs:{house:{wood:6}}});
  const r=fresh();r.configureCosts(readBuildingCosts(storage));assert.deepEqual(r.require('house').cost,{wood:6});
  writeBuildingCosts(storage,{});assert.equal(data.has(BUILDING_COST_KEY),false);
  assert.equal(writeBuildingCosts({setItem(){throw new Error('quota');},removeItem(){}},{house:{wood:6}}),false);
  assert.deepEqual(priceProposals({house:{wood:6}},{by:'owner',at:'2026-11-07T00:00:00Z',note:''}),[{buildingId:'house',cost:{wood:6},by:'owner',at:'2026-11-07T00:00:00Z',note:''}]);
});
