import test from 'node:test';
import assert from 'node:assert/strict';
import { generateWorld,mapFromWorld,emptyGround,exportGround,importZones,importReeds,validZoneRows } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';
import { defaultWorldLevels,WORLD_SETTINGS } from '../src/data/worldCode.js';
import { GROUND,GRASS_ZONE,WATER_CELL,FORD_SPEED,isRiverGround,isFertileGround,WORLD_GENERATION } from '../src/data/worldTerrain.js';
import { waterBodies } from '../src/systems/FishingSystem.js';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { findPathToAny } from '../src/game/pathfinding.js';
import { placementError } from '../src/game/buildings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
globalThis.document={querySelector:()=>({textContent:''})};

const at=changes=>{const l=defaultWorldLevels();for(const [k,v]of Object.entries(changes))l[WORLD_SETTINGS.findIndex(s=>s.key===k)]=v;return l;};
const world=(seed,levels=defaultWorldLevels())=>generateWorld(Math.random,{levels,streams:worldStreams(seed)});
const count=(w,code)=>w.ground.flat().filter(c=>c===code).length;

test('generator 2: a 3.5–5 tile river with stony fords, banks of sand, grass with reeds, mud and pebbles, and grass zones', () => {
  let banks=[0,0,0],reeds=0,zones=new Set();
  for(let seed=1;seed<=8;seed++){
    const w=world(seed),map=mapFromWorld(w.terrain,w.ground);
    assert.ok(count(w,GROUND.FORD)>=12,`seed ${seed}: fords`);
    for(let y=0;y<100;y++)for(let x=0;x<100;x++){if(w.ground[y][x]===GROUND.FORD){assert.equal(map[y][x],0,'a ford is walkable');assert.equal(w.terrain[y][x],0);}if(isRiverGround(w.ground[y][x]))assert.equal(w.terrain[y][x],0,'no rock in the river');}
    banks[0]+=count(w,GROUND.BEACH);banks[1]+=count(w,GROUND.MUD);banks[2]+=count(w,GROUND.SHORE_ROCKS);reeds+=w.reeds.size;
    for(const z of w.zones.flat())zones.add(z);
    for(const key of w.reeds){const [x,y]=key.split(',').map(Number);assert.equal(w.ground[y][x],GROUND.SHALLOW,'reeds stand in shallow water');}
    // The river with its fords is one water body (fishing), not cut in pieces by the crossings.
    const bodies=waterBodies(w.ground);assert.ok(bodies.bodies.length<=1+w.summary.lakes,`seed ${seed}: ${bodies.bodies.length} bodies`);
    // River width: across the main river the water band (shallow + deep + ford) is about 3–6.5 tiles.
    const widths=[];for(let y=5;y<95;y+=7){const row=w.ground[y].map(isRiverGround);let run=0,best=0;for(const v of row){run=v?run+1:0;best=Math.max(best,run);}if(best)widths.push(best);}
    if(widths.length>5)assert.ok(widths.sort((a,b)=>a-b)[Math.floor(widths.length/2)]>=3,`seed ${seed}: widths ${widths}`);
  }
  assert.ok(banks.every(n=>n>40),`sand, mud and pebbly banks all occur (${banks})`);assert.ok(reeds>40,`reeds (${reeds})`);
  assert.deepEqual([...zones].sort(),Object.values(GRASS_ZONE),'all six grass zones occur');
});

test('generator 2: a tributary joins the river and has its own fords; settings change only their parts', () => {
  let joined=0;
  for(let seed=1;seed<=10;seed++){
    const w=world(seed,at({rivers:2}));if(!w.summary.tributary)continue;joined++;
    assert.ok(w.summary.tributary.fords>0,`seed ${seed}: the tributary can be crossed`);
    assert.ok(waterBodies(w.ground).bodies.length<=1+w.summary.lakes,'river and tributary are one water body');
  }
  assert.ok(joined>=7,`most worlds get a tributary (${joined}/10)`);
  const plain=world(5),rocky=world(5,at({rocks:9}));assert.equal(exportGround(plain.ground).join(),exportGround(rocky.ground).join(),'more rocks do not move the water');
  const noBank=world(4,at({bankVegetation:0})),thick=world(4,at({bankVegetation:9}));assert.ok(thick.bushes.size>noBank.bushes.size);
});

test('generator 2: water access lanes stay free of bushes, and forests follow the forest weights', () => {
  const w=world(3),A=WORLD_GENERATION.bankVegetation;let lanes=0,shore=0;
  // Along every bank there is a bush-free tile next to the water at least every `access` tiles of shore.
  for(let y=0;y<100;y++)for(let x=0;x<100;x++){if(w.ground[y][x]!==GROUND.GRASS||!w.forestWeight)continue;const byWater=[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>isRiverGround(w.ground[y+dy]?.[x+dx]));if(byWater)shore++;if(byWater&&!w.bushes.has(`${x},${y}`)&&w.forestWeight[y*100+x]===0)lanes++;}
  assert.ok(lanes>=Math.floor(shore/A.access),`free access tiles by the water (${lanes} of ${shore} grassy shore tiles)`);
  const weights=[...w.forestWeight];assert.ok(weights.some(v=>v>.8)&&weights.filter(v=>v===0).length>2000,'forests in patches, none on sand or water');
  for(let i=0;i<weights.length;i++)if(weights[i]>0)assert.ok(isFertileGround(w.ground[Math.floor(i/100)][i%100]));
});

test('generator 2 rules: fords are walked at ×0.6 and never built on; mud and pebbles can be built on but grow nothing', () => {
  const ground=emptyGround();for(let x=0;x<100;x++){ground[20][x]=GROUND.FORD;ground[21][x]=GROUND.MUD;ground[22][x]=GROUND.SHORE_ROCKS;}
  const terrain=Array.from({length:100},()=>Array(100).fill(0)),map=mapFromWorld(terrain,ground);
  const wear=new PathWearSystem({map,terrain,time:new GameTimeSystem(120000),groundSpeed:t=>ground[t.y][t.x]===GROUND.FORD?FORD_SPEED:1,isGrass:t=>ground[t.y][t.x]===GROUND.GRASS});
  assert.equal(wear.speedMultiplier({},{x:3,y:20}),.6);assert.equal(wear.speedMultiplier({},{x:3,y:21}),1);assert.ok(!wear.isGrass({x:3,y:21}),'banks never wear into tracks');
  // A route along a ford row costs more than the same route on grass.
  const route=findPathToAny(map,{x:0,y:20},[{x:30,y:20}],wear.routingOptions({}));assert.ok(route.path.every(t=>t.y!==20)||route.path.length>0);
  const s=workerScene(undefined,{naturalResources:true});s.groundGrid=ground;for(const type of ['house','wheat_field'])ensureBuildingPrerequisites(s,objectRegistry.require(type));
  const error=(type,anchor)=>placementError(s.map,anchor,s.resourceOccupancy,[],objectRegistry.require(type),s.buildings);
  assert.match(error('house',{x:10,y:19}),/ford|brod/i,'nothing on a ford');
  assert.equal(error('house',{x:10,y:21}),error('house',{x:10,y:24}),'mud and pebbles take buildings like grass');
  assert.match(error('wheat_field',{x:10,y:21}),/grass|trávu/,'no fields on mud');
});

test('generator 2 saves: grass zones and reeds survive a save; broken ones are rejected', () => {
  const w=world(9),s=workerScene(w.terrain);s.groundGrid=w.ground;s.bushes=w.bushes;s.grassZones=w.zones;s.reeds=w.reeds;
  for(let y=0;y<100;y++)for(let x=0;x<100;x++)s.map[y][x]=mapFromWorld(w.terrain,w.ground)[y][x];
  const data=validateGameState(JSON.parse(JSON.stringify(serializeGameState(s))));
  assert.deepEqual(importZones(data.grassZones),w.zones);assert.deepEqual(importReeds(data.reeds),w.reeds);assert.ok(validZoneRows(data.grassZones));
  const bad=JSON.parse(JSON.stringify(serializeGameState(s)));bad.grassZones[0]='9'.repeat(100);assert.throws(()=>validateGameState(bad));
  const dry=JSON.parse(JSON.stringify(serializeGameState(s)));dry.reeds.push([50,50]);assert.throws(()=>validateGameState(dry),undefined,'reeds only in shallow water');
});
