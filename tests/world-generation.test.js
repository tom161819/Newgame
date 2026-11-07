import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWorld, mapFromWorld, exportGround, importGround, exportBushes, importBushes, emptyGround } from '../src/game/worldGeneration.js';
import { GROUND, WATER_CELL, WORLD_GENERATION, BUSH_TYPES, isWaterGround } from '../src/data/worldTerrain.js';
import { reachableTiles } from '../src/game/pathfinding.js';
import { hasLineOfSight } from '../src/game/lineOfSight.js';
import { isWalkable, PLAYER_START } from '../src/game/map.js';
import { placementError } from '../src/game/buildings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { serializeGameState, validateGameState } from '../src/systems/GameStateSerializer.js';
import { workerScene, ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
globalThis.document={querySelector:()=>({textContent:''})};

const seeded=seed=>{let n=seed;return ()=>((n=Math.imul(n,1664525)+1013904223>>>0)/2**32);};
const START={x:PLAYER_START.x+.5,y:PLAYER_START.y+.5};
const count=(ground,code)=>ground.flat().filter(c=>c===code).length;

test('#100 generated worlds are seeded, keep the start plain grass, have a river with fords, a lake, a desert and bushes, and stay connected',()=>{
  assert.deepEqual(generateWorld(seeded(7)).ground,generateWorld(seeded(7)).ground,'the same seed gives the same world');
  for(let seed=1;seed<=25;seed++){
    const world=generateWorld(seeded(seed)),{terrain,ground,bushes,summary}=world,map=mapFromWorld(terrain,ground);
    for(let y=0;y<100;y++)for(let x=0;x<100;x++){
      const near=Math.hypot(x+.5-START.x,y+.5-START.y)<=WORLD_GENERATION.startClear;
      if(near)assert.equal(ground[y][x],GROUND.GRASS,`seed ${seed}: start area is grass at ${x},${y}`);
      if(isWaterGround(ground[y][x])){assert.equal(terrain[y][x],0,'no rock in water');assert.equal(map[y][x],WATER_CELL);assert.ok(!isWalkable(map,x,y));}
    }
    assert.ok(count(ground,GROUND.DEEP)>100&&count(ground,GROUND.SHALLOW)>100,`seed ${seed}: a river and a lake`);
    assert.ok(count(ground,GROUND.BEACH)>100&&count(ground,GROUND.DESERT)>200,`seed ${seed}: beaches and a desert`);
    assert.ok(summary.fords>=6&&summary.lake&&summary.desert);
    assert.ok(Math.hypot(summary.desert.x-START.x,summary.desert.y-START.y)>=WORLD_GENERATION.desert.startDistance-1);
    // Fords keep both banks connected: (almost) every walkable tile is reachable from the start.
    const walkable=map.flat().filter(v=>v===0).length,reachable=reachableTiles(map,[PLAYER_START]).length;
    assert.ok(reachable/walkable>.99,`seed ${seed}: ${reachable}/${walkable} reachable`);
    assert.ok(bushes.size>150&&bushes.size<400);
    for(const [key,type]of bushes){
      const [x,y]=key.split(',').map(Number);assert.equal(terrain[y][x],0);assert.ok(Math.hypot(x+.5-START.x,y+.5-START.y)>WORLD_GENERATION.bushClear);
      assert.equal(ground[y][x],BUSH_TYPES[type]==='bush_scrub'?GROUND.DESERT:GROUND.GRASS,'scrub grows on the desert, other bushes on grass');
    }
  }
});

test('#100 water blocks walking and building but not arrows; fields need grass while houses may stand on sand',()=>{
  const open=Array.from({length:7},()=>Array(7).fill(0));
  const river=open.map(row=>[...row]);for(let y=0;y<7;y++)river[y][3]=WATER_CELL;
  const rock=open.map(row=>[...row]);for(let y=0;y<7;y++)rock[y][3]=1;
  assert.ok(hasLineOfSight(river,{x:0,y:3},{x:6,y:3}),'arrows fly across water');
  assert.ok(hasLineOfSight(river,{x:0,y:0},{x:6,y:6}));
  assert.ok(!hasLineOfSight(rock,{x:0,y:3},{x:6,y:3}),'rock still blocks');
  assert.equal(reachableTiles(river,[{x:0,y:0}]).length,21,'nobody walks across');

  const s=workerScene(undefined,{naturalResources:true});s.groundGrid=emptyGround();
  for(let y=10;y<20;y++)for(let x=10;x<20;x++)s.groundGrid[y][x]=GROUND.BEACH;
  for(let y=10;y<20;y++)for(let x=30;x<34;x++){s.groundGrid[y][x]=GROUND.SHALLOW;s.map[y][x]=WATER_CELL;}
  for(const type of ['wheat_field','orchard','house'])ensureBuildingPrerequisites(s,objectRegistry.require(type));
  const error=(type,anchor)=>placementError(s.map,anchor,s.resourceOccupancy,[],objectRegistry.require(type),s.buildings);
  assert.match(error('wheat_field',{x:12,y:12}),/grass|trávu/);
  assert.match(error('orchard',{x:12,y:12}),/grass|trávu/);
  assert.equal(error('wheat_field',{x:60,y:60}),null);
  assert.equal(error('house',{x:12,y:12}),null,'houses may stand on sand');
  assert.ok(error('house',{x:31,y:12}),'nothing is built on water');
});

test('#100 paths wear only grass, trees grow only on grass, and the ground and bushes survive a save',()=>{
  const ground=emptyGround();for(let x=0;x<100;x++)ground[5][x]=GROUND.DESERT;
  const terrain=Array.from({length:100},()=>Array(100).fill(0)),map=mapFromWorld(terrain,ground);
  const wear=new PathWearSystem({map,terrain,time:new GameTimeSystem(120000),isGrass:tile=>terrain[tile.y][tile.x]===0&&ground[tile.y][tile.x]===GROUND.GRASS});
  assert.ok(wear.isGrass({x:3,y:4}));assert.ok(!wear.isGrass({x:3,y:5}),'sand never wears into a dirt track');

  const s=workerScene(undefined,{naturalResources:true});s.groundGrid=emptyGround();
  for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(x<35||x>65||y<35||y>65)s.groundGrid[y][x]=GROUND.DESERT;
  s.naturalResources.generate(seeded(3),120);
  const trees=[...s.naturalResources.byId.values()].filter(o=>o.definition.tree);
  assert.ok(trees.length>0);for(const t of trees)assert.equal(s.groundGrid[t.y][t.x],GROUND.GRASS,'no tree on the desert');

  const world=generateWorld(seeded(11)),saved=workerScene(world.terrain);saved.groundGrid=world.ground;saved.bushes=world.bushes;
  for(let y=0;y<100;y++)for(let x=0;x<100;x++)saved.map[y][x]=mapFromWorld(world.terrain,world.ground)[y][x];
  const data=validateGameState(JSON.parse(JSON.stringify(serializeGameState(saved))));
  assert.deepEqual(importGround(data.ground),world.ground);assert.deepEqual(importBushes(data.bushes),world.bushes);
  assert.equal(data.ground.length,100);assert.equal(typeof data.ground[0],'string');
  const water=world.ground.flatMap((row,y)=>row.map((c,x)=>({x,y,c}))).find(t=>isWaterGround(t.c));
  for(const corrupt of [d=>d.ground[0]=d.ground[0].slice(1),d=>d.ground[3]='9'.repeat(100),d=>d.bushes.push([water.x,water.y,0]),d=>d.bushes.push([...d.bushes[0]]),d=>d.bushes[0][2]=BUSH_TYPES.length,d=>d.terrain[water.y][water.x]=1]){
    const copy=JSON.parse(JSON.stringify(data));corrupt(copy);assert.throws(()=>validateGameState(copy));
  }
  assert.deepEqual(exportBushes(importBushes(data.bushes)),data.bushes);assert.deepEqual(exportGround(importGround(data.ground)),data.ground);
});
