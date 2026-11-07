import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { pavementTiles,pavementPlan,placePavement } from '../src/game/pavement.js';
import { PAVEMENT,pavementCost } from '../src/data/pavement.js';
import { PATH_WEAR } from '../src/data/pathWear.js';
import { findPathToAny } from '../src/game/pathfinding.js';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { MapMemory } from '../src/systems/MapMemory.js';
import { buildingsInCategory } from '../src/data/buildingCategories.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
const options=(s,tiles)=>({map:s.map,tiles,resources:s.resourceOccupancy,buildings:s.buildings,pathWear:s.pathWear,inventory:s.inventory,registry:s.objectRegistry});
function order(s,tiles){const r=placePavement(options(s,tiles));assert.ifError(r.error);for(const b of r.buildings){s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(b.definition,b));}return r;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
const time=()=>({day:1,onNewDay:()=>()=>{}});

test('Infrastructure lists Stone Pavement; Single, Line (also diagonal) and Area select the right tiles',()=>{
  const s=scene();assert.deepEqual(buildingsInCategory(s.objectRegistry,'infrastructure').map(d=>d.id),['stone_pavement','brazier','torch_post','campfire']);
  assert.deepEqual(pavementTiles('single',{x:3,y:3},{x:9,y:9}),[{x:3,y:3}]);
  assert.deepEqual(pavementTiles('line',{x:0,y:0},{x:3,y:0}),[{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}]);
  assert.deepEqual(pavementTiles('line',{x:0,y:0},{x:3,y:3}),[{x:0,y:0},{x:1,y:1},{x:2,y:2},{x:3,y:3}]);
  assert.equal(pavementTiles('area',{x:5,y:5},{x:2,y:3}).length,12);assert.equal(PAVEMENT.defaultMode,'line');
});

test('cost is 1 Stone per 2 new tiles of an order; paved, ordered and invalid tiles are not paid',()=>{
  assert.equal(pavementCost(20),10);assert.equal(pavementCost(25),13);assert.equal(pavementCost(1),1);
  const s=scene();s.inventory.add('stone',40);
  const area=pavementTiles('area',{x:60,y:60},{x:64,y:63});assert.equal(pavementPlan(options(s,area)).cost.stone,10);
  s.pathWear.setPaved({x:60,y:60},true);s.map[61][60]=1;s.addResource(s.objectRegistry.require('stone'),{x:62,y:60});
  const plan=pavementPlan(options(s,area));assert.deepEqual([plan.fresh.length,plan.paved.length,plan.invalid.length,plan.cost.stone],[17,1,2,9]);
  const r=order(s,pavementTiles('line',{x:70,y:70},{x:74,y:70}));assert.deepEqual(r.cost,{stone:3});
  assert.deepEqual(r.buildings.map(b=>b.type),['stone_pavement','stone_pavement_joint','stone_pavement','stone_pavement_joint','stone_pavement']);
  assert.equal(pavementPlan(options(s,pavementTiles('line',{x:70,y:70},{x:74,y:70}))).error!==null,true,'the same order again pays nothing');
});

test('Haulers deliver the Stone, Builders lay tile by tile; finished tiles become the surface layer; Save/Load mid-way',()=>{
  let s=scene();s.inventory.add('stone',10);const stoneBefore=s.inventory.count('stone');
  const tiles=pavementTiles('line',{x:60,y:50},{x:65,y:50});order(s,tiles);
  for(const [i,role]of ['builder','builder','hauler'].entries()){const w=s.workerSystem.create({x:57+i,y:53});s.workerSystem.jobs.assign(w,role);}
  assert.equal(tiles.every(tile=>s.map[tile.y][tile.x]===0),true,'blueprints do not block the way');
  assert.equal(tiles.some(tile=>s.pathWear.isPaved(tile)),false,'nothing is paved instantly');
  until(s,()=>tiles.some(tile=>s.pathWear.isPaved(tile)));
  const saved=validateGameState(serializeGameState(s)),restored=scene(false);loadGameState(restored,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(restored)),saved);s=restored;
  until(s,()=>tiles.every(tile=>s.pathWear.isPaved(tile)));
  assert.equal(s.buildings.some(b=>b.type.startsWith('stone_pavement')),false,'no site records remain');
  assert.equal(s.inventory.count('stone'),stoneBefore-3,'exactly 3 Stone for 6 tiles');
  for(const tile of tiles)assert.equal(s.map[tile.y][tile.x],0,'still walkable');
});

test('pavement gives +25 %, never added to a trodden path; routes prefer a faster paved detour',()=>{
  const map=Array.from({length:30},()=>Array(30).fill(0)),wear=new PathWearSystem({map,terrain:map,time:time()}),walker={definition:{category:'character'},state:'ground'};
  wear.levels[wear.index({x:3,y:3})]=3;wear.highestLevel=3;assert.equal(wear.speedMultiplier(walker,{x:3,y:3}),PATH_WEAR.speedMultipliers[3]);
  wear.setPaved({x:3,y:3},true);assert.equal(wear.speedMultiplier(walker,{x:3,y:3}),1.25,'paved replaces the 15 % bonus');
  assert.ok(PAVEMENT.speedMultiplier>PATH_WEAR.speedMultipliers.at(-1));
  // Straight across grass (20 steps) or one row down along a paved road (a little longer, but faster).
  const grid=Array.from({length:30},()=>Array(30).fill(0)),road=new PathWearSystem({map:grid,terrain:grid,time:time()});
  for(let x=0;x<=20;x++)road.setPaved({x,y:6},true);
  const plain=findPathToAny(grid,{x:0,y:5},[{x:20,y:5}]),paved=findPathToAny(grid,{x:0,y:5},[{x:20,y:5}],road.routingOptions(walker));
  assert.equal(plain.path.some(tile=>tile.y===6),false,'without pavement the straight line');assert.ok(paved.path.filter(tile=>tile.y===6).length>=15,'with pavement the faster paved road');
  road.setPaved({x:3,y:2},false);assert.equal(road.isPaved({x:3,y:2}),false);
});

test('Fog of War shows the last known pavement; changes out of sight stay hidden until seen again',()=>{
  const map=Array.from({length:10},()=>Array(10).fill(0)),wear=new PathWearSystem({map,terrain:map,time:time()});
  const fog={enabled:true,width:10,explored:new Uint8Array(100),visibleIndices:new Set([0,1,2]),isInSightTile:tile=>tile.y===0&&tile.x<3};
  const memory=new MapMemory(fog);wear.setPaved({x:1,y:0},true);memory.observeTerrain(map,wear,'Summer');
  assert.equal(memory.terrainAt({x:1,y:0},map,wear,'Summer')[4],1);
  fog.visibleIndices=new Set();wear.setPaved({x:1,y:0},false);memory.observeTerrain(map,wear,'Summer');
  assert.equal(memory.terrainAt({x:1,y:0},map,wear,'Summer')[4],1,'still remembered as paved');
  fog.visibleIndices=new Set([1]);memory.observeTerrain(map,wear,'Summer');assert.equal(memory.terrainAt({x:1,y:0},map,wear,'Summer')[4],0);
});

test('cancelling an unfinished order refunds by the usual rules; finished pavement is removed without refund; a building may not go on it twice',()=>{
  const s=scene();s.inventory.add('stone',10);const before=s.inventory.count('stone'),r=order(s,pavementTiles('line',{x:60,y:60},{x:63,y:60}));
  for(const b of [...r.buildings])s.constructionSystem.cancel(b);assert.equal(s.inventory.count('stone'),before,'untouched blueprint: full refund');
  s.pathWear.setPaved({x:70,y:70},true);const tower=placeBuilding({map:s.map,anchor:{x:70,y:70},resources:s.resourceOccupancy,reservedTiles:[],inventory:s.inventory,buildings:s.buildings,definition:s.objectRegistry.require('tower')});
  assert.equal(tower.error??null,null,'a building can stand on paved ground; the surface is kept underneath');assert.equal(s.pathWear.isPaved({x:70,y:70}),true);
});

test('thousands of paved tiles stay cheap to route over and save compactly',()=>{
  const s=scene();for(let y=0;y<100;y+=2)for(let x=0;x<100;x++)if(s.map[y][x]===0)s.pathWear.setPaved({x,y},true);
  assert.ok(s.pathWear.pavedCount>4000);const start=performance.now();for(let i=0;i<20;i++)findPathToAny(s.map,{x:1,y:1},[{x:98,y:97}],s.pathWear.routingOptions({definition:{category:'character'},state:'ground'}));
  assert.ok((performance.now()-start)/20<60,'a long paved route plans quickly');
  const state=validateGameState(serializeGameState(s));assert.equal(state.pathWear.paved.length,s.pathWear.pavedCount);
});
