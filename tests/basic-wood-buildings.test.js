// Plan m-e1-drevo-start (owner 7 Nov 2026): basic buildings are wooden, the start pays the first tutorial steps, and a
// kingdom with no wood and no Lumberjack Hut may build one Lumberjack Hut for free.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { NEW_GAME_DEFAULTS } from '../src/systems/GameSettings.js';
import { freeOffer,placeableDefinition } from '../src/game/freeBuildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// The owner priced the Warehouse with stone (10 Stone + 4 Wood, Studio 7 Nov) – it is not a first-day building.
const BASIC=['granary','farmhouse','hunting_lodge','fisherman_hut','lumberjack_hut','house','builder_workshop'];
test('basic buildings cost wood and no stone; the start pays Granary, Farmhouse, Hunting Lodge and Lumberjack Hut',()=>{
  for(const id of BASIC){const cost=objectRegistry.require(id).cost;assert.ok(cost.wood>0,`${id} costs wood`);assert.equal(cost.stone??0,0,`${id} costs no stone`);}
  const first=['granary','farmhouse','hunting_lodge','lumberjack_hut'].reduce((n,id)=>n+objectRegistry.require(id).cost.wood,0);
  assert.ok(first<=NEW_GAME_DEFAULTS.startingWood-10,`${first} wood for the first four steps leaves a reserve`);
  assert.equal(NEW_GAME_DEFAULTS.startingIronOre,0);
});
test('a free Lumberjack Hut only while the kingdom has neither the wood nor a hut, and only one',()=>{
  const s=workerScene(undefined,{construction:true,logistics:true}),d=objectRegistry.require('lumberjack_hut');ensureBuildingPrerequisites(s,d);
  while(s.inventory.count('wood')>0)s.inventory.spend?.({wood:s.inventory.count('wood')})??s.inventory.pay({wood:s.inventory.count('wood')});
  assert.equal(freeOffer(s,d),true);const free=placeableDefinition(s,d);assert.deepEqual(free.cost,{});assert.equal(free.freeOffer,true);
  assert.equal(freeOffer(s,objectRegistry.require('house')),false,'only the Lumberjack Hut');
  const r=placeBuilding({map:s.map,anchor:{x:44,y:43},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:free,reserveMaterials:true});assert.ifError(r.error);s.constructionSystem.plan(r.building);
  assert.deepEqual(r.building.construction.investedMaterials,{});assert.equal(freeOffer(s,d),false,'a planned hut ends the offer');
  validateGameState(serializeGameState(s));
  const t=workerScene(undefined,{construction:true,logistics:true});t.inventory.add('wood',6);assert.equal(freeOffer(t,d),false,'enough wood: pay as usual');
});

test('E1 food outlook: days of food, a low-food notice under 3 days and no newcomers under 2 days or with more than 3 unemployed',async()=>{
  const {foodDays,FOOD_OUTLOOK}=await import('../src/data/foodOutlook.js'),{KingdomAttractivenessSystem}=await import('../src/systems/KingdomAttractivenessSystem.js');
  assert.equal(foodDays({dailyConsumption:5,availablePortions:40}),8);assert.equal(foodDays({dailyConsumption:0,availablePortions:0}),Infinity);
  const people=n=>Array.from({length:n},()=>({profession:'idle'}));
  const scene=(portions,idle)=>({foodSystem:{dailyConsumption:5,availablePortions:portions,shortage:false},workerSystem:{liveSubjects:()=>people(idle)}});
  assert.equal(new KingdomAttractivenessSystem(scene(40,0)).blockReason(),null);
  assert.equal(new KingdomAttractivenessSystem(scene(9,0)).blockReason(),'food');
  assert.equal(new KingdomAttractivenessSystem(scene(40,4)).blockReason(),'jobs');assert.equal(new KingdomAttractivenessSystem(scene(40,4)).shouldSettle(()=>0),false);
  const {ProductionDiagnostics}=await import('../src/systems/ProductionDiagnostics.js'),d=Object.create(ProductionDiagnostics.prototype);d.scene=scene(14,0);
  assert.deepEqual(d.foodIssues().map(i=>[i.reason,i.params.days]),[['foodLow',2]]);d.scene=scene(15,0);assert.deepEqual(d.foodIssues(),[]);assert.equal(FOOD_OUTLOOK.warnDays,3);
});
