import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,placementError } from '../src/game/buildings.js';
import { FishingSystem,waterBodies } from '../src/systems/FishingSystem.js';
import { FISHING,stockCapacity,stockFactor,stockState } from '../src/data/fishing.js';
import { GROUND,WATER_CELL } from '../src/data/worldTerrain.js';
import { emptyGround } from '../src/game/worldGeneration.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { EDIBLE_RESOURCES } from '../src/data/seasons.js';
import { FOOD_RESOURCE_IDS } from '../src/data/foodProduction.js';
import { BASE_PRICES,MERCHANT_TYPES } from '../src/data/trade.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

// A lake east of the start: shallow rim x 51..60 / y 36..50, deep water inside.
function lakeScene(){
  const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true});s.workerSystem.unsubscribe();
  s.groundGrid=emptyGround();
  for(let y=36;y<=50;y++)for(let x=51;x<=60;x++){s.groundGrid[y][x]=x>52&&x<59&&y>37&&y<49?GROUND.DEEP:GROUND.SHALLOW;s.map[y][x]=WATER_CELL;}
  s.fishing=new FishingSystem(s);s.eventFeed={pushed:[],push(key,text){this.pushed.push(key);return true;}};return s;
}
function hut(s,anchor={x:49,y:43}){
  const d=objectRegistry.require('fisherman_hut');ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const r=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);
  s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;
}
function fisher(s,b){const w=s.workerSystem.create({x:46,y:46});assert.equal(s.workplaceSystem.assign(b,w),true);w.naturalTalent='woodcutting';return w;}
const fishStock=s=>s.inventory.count('fish');

test('Fishing data: fish is food and a trade good; the hut is a food workplace for two Fishers after a Granary',()=>{
  assert.ok(EDIBLE_RESOURCES.includes('fish')&&FOOD_RESOURCE_IDS.includes('fish'));assert.equal(BASE_PRICES.fish,3);
  assert.ok(MERCHANT_TYPES.food.stock.fish&&MERCHANT_TYPES.general.stock.fish);
  const d=objectRegistry.require('fisherman_hut');
  assert.deepEqual([d.width,d.height,d.buildingCategory,d.cost,d.requiresCompletedBuildings],[2,2,'food',{wood:12,stone:4},['granary']]);
  assert.deepEqual(d.workplace,{capacity:2,profession:'fisher',skill:'fishing'});
  assert.deepEqual([stockCapacity(3),stockCapacity(50),stockCapacity(500)],[40,200,400]);
  assert.deepEqual([stockFactor(.8),stockFactor(.25),stockFactor(.09)],[1,.5,0]);
  assert.deepEqual([stockState(.6),stockState(.3),stockState(.05)],['plentiful','thinning','overfished']);
});

test('water bodies are found by flood fill; a hut must touch water',()=>{
  const ground=emptyGround();for(let x=0;x<10;x++)ground[5][x]=GROUND.DEEP;for(let y=20;y<23;y++)for(let x=20;x<23;x++)ground[y][x]=GROUND.SHALLOW;
  const water=waterBodies(ground);assert.equal(water.bodies.length,2);assert.deepEqual(water.bodies.map(b=>[b.tiles,b.capacity]),[[10,40],[9,40]]);
  const s=lakeScene();ensureBuildingPrerequisites(s,objectRegistry.require('fisherman_hut'));
  const error=anchor=>placementError(s.map,anchor,s.resourceOccupancy,[],objectRegistry.require('fisherman_hut'),s.buildings);
  assert.equal(error({x:49,y:43}),null);assert.match(error({x:30,y:30}),/water/);
  assert.equal(s.fishing.bodies.length,1);assert.equal(s.fishing.capacity(0),400);
});

test('a Fisher walks to the shore, fills his basket, carries the fish to storage and the lake stock falls',()=>{
  const s=lakeScene(),b=hut(s),w=fisher(s,b),before=s.fishing.stocks.get(0);s.foodSystem.eat=()=>true; // nobody eats the catch during the test
  for(let i=0;i<6000&&!fishStock(s);i++)s.tick(50);
  const delivered=fishStock(s),record=s.fishing.catches.get(b.id);
  assert.ok(delivered>=4&&delivered<=FISHING.basket,JSON.stringify({delivered,state:w.workState,message:w.workMessage,task:w.workTask,cargo:w.cargo}));
  assert.equal(record.today+record.yesterday,delivered,'every caught fish reached storage');
  assert.ok(s.fishing.stocks.get(0)<before);assert.ok(w.skills.fishing.totalXP>=delivered*FISHING.xp,'fishing XP');assert.match(s.fishing.summary(b),/Plentiful/);
});

test('catch rate follows depth, season and weather; overfished water gives nothing and the stock recovers each day',()=>{
  const s=lakeScene();
  assert.equal(s.fishing.modifier(GROUND.DEEP),1.2);assert.equal(s.fishing.modifier(GROUND.SHALLOW),.8);
  s.seasons={growthMultiplier:()=>1,season:'Winter',weather:'Frost'};assert.ok(Math.abs(s.fishing.modifier(GROUND.SHALLOW)-.8*.5*.8)<1e-9);
  s.seasons={growthMultiplier:()=>1,season:'Spring',weather:'Rainy'};assert.ok(Math.abs(s.fishing.modifier(GROUND.DEEP)-1.2*1.1*1.1)<1e-9);
  s.fishing.stocks.set(0,30);assert.equal(s.fishing.state(0),'overfished');
  const b=hut(s),w=fisher(s,b);for(let i=0;i<600;i++)s.tick(50);assert.equal(fishStock(s),0);assert.equal(w.workMessage,'Overfished');
  s.seasons={growthMultiplier:()=>1,season:'Summer',weather:'Sunny'};s.fishing.newDay();assert.equal(s.fishing.stocks.get(0),30+370*.1);
  s.seasons={growthMultiplier:()=>1,season:'Winter',weather:'Sunny'};const stock=s.fishing.stocks.get(0);s.fishing.newDay();assert.ok(Math.abs(s.fishing.stocks.get(0)-(stock+(400-stock)*.05))<1e-9,'winter recovery is halved');
});

test('fish stocks and a Fisher mid-trip survive Save/Load; corrupt fishing state is rejected',()=>{
  const s=lakeScene(),b=hut(s),w=fisher(s,b);
  for(let i=0;i<4000&&!(w.workTask?.kind==='fish'&&w.workTask.caught>=2);i++)s.tick(50);
  assert.equal(w.workTask?.kind,'fish');s.fishing.stocks.set(0,321.5);
  const data=validateGameState(JSON.parse(JSON.stringify(serializeGameState(s))));
  assert.deepEqual(data.fishing.stocks,[[0,321.5]]);
  const r=workerScene(data.terrain,{naturalResources:true,construction:true,logistics:true,starter:false});r.groundGrid=s.groundGrid;r.fishing=new FishingSystem(r);loadGameState(r,data);
  assert.equal(r.fishing.stocks.get(0),321.5);const loaded=r.workerSystem.workers.get(w.id);assert.equal(loaded.workTask.kind,'fish');assert.equal(loaded.workTask.caught,w.workTask.caught);
  assert.equal(r.workerSystem.reservations.owners.get(loaded.workTask.reservation),w.id);
  for(const corrupt of [d=>d.fishing.stocks[0][1]=401,d=>d.fishing.stocks.push([1,10]),d=>d.fishing.catches.push([999,1,1]),d=>{const x=d.workers.find(x=>x.id===w.id);x.workTask.caught=FISHING.basket;},d=>{const x=d.workers.find(x=>x.id===w.id);x.workTask.depth=1;}]){
    const copy=JSON.parse(JSON.stringify(data));corrupt(copy);assert.throws(()=>validateGameState(copy));
  }
});
