import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { buildingTiles } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { PRODUCTION_RECIPES } from '../src/data/production.js';
import { FOOD_RECIPES } from '../src/data/foodProduction.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-palivo-vyroba (plan 38): ovens and forges burn Wood; `fuel` names the burnt part of the input.
const scene=(starter=true)=>workerScene(undefined,{construction:true,logistics:true,starter});
function building(s,type,x=52,y=45){const definition=s.objectRegistry.require(type),b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition,x,y,tiles:buildingTiles({x,y},definition)};s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=definition.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(definition,b));s.foodProduction.register(b);return b;}
function until(s,p,max=90000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p(),'condition not reached');}

test('fuel is part of the input: Bakery 1 Flour + 1 Wood, Smelter 2 Wood, forges 1 of 2 Wood',()=>{
  assert.deepEqual([FOOD_RECIPES.bakery.input,FOOD_RECIPES.bakery.fuel],[{flour:1,wood:1},{wood:1}]);
  assert.deepEqual([PRODUCTION_RECIPES.smelter.input,PRODUCTION_RECIPES.smelter.fuel],[{iron_ore:2,wood:2},{wood:2}]);assert.deepEqual([PRODUCTION_RECIPES.swordsmith.fuel,PRODUCTION_RECIPES.armorer.fuel],[{wood:1},{wood:1}]);
  for(const r of Object.values(PRODUCTION_RECIPES))for(const [id,n]of Object.entries(r.fuel??{}))assert.ok(r.input[id]>=n,'fuel is never more than the input');
});
test('a Bakery with Flour but no Wood does not bake; with Wood it does',()=>{
  const s=scene(),bakery=building(s,'bakery',58,45),w=s.workerSystem.create({x:57,y:48});s.workplaceSystem.assign(bakery,w);
  const starter=[...s.foodStorage.locations.values()].find(l=>l.kind==='fallback'&&l.allowed.includes('wood'));starter.stock.wood=0;s.foodStorage.changed?.();
  s.foodStorage.deposit(`input-${bakery.id}`,'flour',2);s.simulate(8000);assert.equal(s.foodProduction.records.get(bakery.id).cycle,null,'no Wood, no batch');
  s.foodStorage.deposit(`input-${bakery.id}`,'wood',1);until(s,()=>s.foodProduction.records.get(bakery.id).completed===1);
  assert.equal(s.foodStorage.locations.get(`input-${bakery.id}`).stock.wood??0,0,'the Wood was burnt');
});
test('a batch started before the oven needed Wood loads and finishes without it; an older input buffer gets the new list',()=>{
  const s=scene(),bakery=building(s,'bakery',58,45),w=s.workerSystem.create({x:57,y:48});s.workplaceSystem.assign(bakery,w);
  s.foodStorage.deposit(`input-${bakery.id}`,'flour',1);s.foodStorage.deposit(`input-${bakery.id}`,'wood',1);until(s,()=>!!s.foodProduction.records.get(bakery.id).cycle);
  const data=serializeGameState(s);
  // Make it an old save: the running batch took only Flour, the input buffer did not know Wood.
  const rec=data.foodProduction.records.find(r=>r.buildingId===bakery.id);rec.cycle.inputs={flour:1};
  const input=data.foodStorage.locations.find(l=>l.id===`input-${bakery.id}`);input.allowed=['flour'];delete input.stock.wood;
  const saved=validateGameState(data);assert.deepEqual(saved.foodStorage.locations.find(l=>l.id===`input-${bakery.id}`).allowed,['flour','wood']);
  const r=scene(false);loadGameState(r,structuredClone(saved));
  until(r,()=>r.foodProduction.records.get(bakery.id).completed===1);
  validateGameState(serializeGameState(r));
});
