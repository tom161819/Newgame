import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { COLUMNS,ROWS,PLAYER_START,MAP_SIZES,setMapSize,withMapSize,mapArea } from '../src/game/config.js';
import { ORIGIN,WORLD_BOUNDS } from '../src/game/isometric.js';
import { generateWorld,fairStartReport } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';
import { defaultWorldLevels } from '../src/data/worldCode.js';
import { gameSettings,wildlifeTarget,resourceSpawnSettings } from '../src/systems/GameSettings.js';
import { validateGameState } from '../src/systems/GameStateSerializer.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-velikost-mapy (34): the map side is 100 (default and every older save), 150, 200, 250 or 300.
const world=seed=>generateWorld(Math.random,{levels:defaultWorldLevels(),streams:worldStreams(seed)});
const digest=w=>w.ground.map(r=>r.join('')).join('|')+'#'+w.terrain.map(r=>r.join('')).join('');

test('map size: the live size, the castle in the middle and the projection follow setMapSize, and come back',()=>{
  assert.equal(COLUMNS,100);assert.deepEqual(PLAYER_START,{x:50,y:50});assert.equal(mapArea(),1);
  const origin=ORIGIN.x,width=WORLD_BOUNDS.width;
  withMapSize(200,()=>{assert.equal(COLUMNS,200);assert.equal(ROWS,200);assert.deepEqual(PLAYER_START,{x:100,y:100});assert.equal(ORIGIN.x,origin*2);assert.equal(WORLD_BOUNDS.width,width*2);assert.equal(mapArea(),4);});
  assert.equal(COLUMNS,100);assert.equal(ORIGIN.x,origin);assert.throws(()=>setMapSize(120));
  assert.equal(gameSettings({}).mapSize,100);assert.equal(gameSettings({mapSize:250}).mapSize,250);assert.throws(()=>gameSettings({mapSize:120}));
  assert.deepEqual(MAP_SIZES,[100,150,200,250,300]);
});

test('map size: each size makes a full, reproducible world with a fair start; counts grow with the area',()=>{
  const base=world(7),rocks100=base.terrain.flat().filter(Boolean).length;
  for(const size of [150,200]){
    withMapSize(size,()=>{
      const a=world(7),b=world(7);
      assert.equal(a.ground.length,size);assert.ok(a.ground.every(r=>r.length===size));assert.equal(a.terrain.length,size);
      assert.equal(digest(a),digest(b),'same code, same world');
      assert.ok(fairStartReport(a).ok||a.summary.fairStart.attempt>1);
      assert.ok(a.terrain.flat().filter(Boolean).length>rocks100*1.5,'more rock on a bigger map');
      assert.ok(wildlifeTarget(gameSettings({}))>3);
      assert.equal(resourceSpawnSettings(objectRegistry.require('stone'),gameSettings({})).initial,Math.round(30*mapArea()));
    });
  }
  assert.equal(digest(world(7)),digest(base),'the 100 × 100 world is unchanged after bigger ones');
});

test('map size: a save is checked at its own size whatever map runs now',()=>{
  const dir=new URL('./fixtures/saves/',import.meta.url),file=readdirSync(dir).find(f=>f.endsWith('.json.gz'));
  const data=JSON.parse(gunzipSync(readFileSync(new URL(file,dir))).toString('utf8'));
  withMapSize(200,()=>{const state=validateGameState(data);assert.equal(state.gameSettings.mapSize,100);assert.equal(COLUMNS,200,'the running size is kept');});
  const broken={...data,terrain:data.terrain.slice(0,90)};assert.throws(()=>validateGameState(broken));
});

import { reachableCount,reachableMask,blockKeepsReach } from '../src/game/pathfinding.js';
test('map size: the quick route test gives the same answer as two flood fills (random maps, single tiles and 2 × 2 blocks)',()=>{
  let n=12345;const rnd=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/2**32);let checked=0,quick=0;
  for(let round=0;round<40;round++){
    const W=24,map=Array.from({length:W},()=>Array.from({length:W},()=>rnd()<.22+round%4*.07?1:0)),origins=[{x:12,y:12}];map[12][12]=0;
    const mask=reachableMask(map,origins);
    for(let k=0;k<60;k++){
      const x=Math.floor(rnd()*(W-1)),y=Math.floor(rnd()*(W-1)),tiles=k%3?[{x,y}]:[{x,y},{x:x+1,y},{x,y:y+1},{x:x+1,y:y+1}];
      if(tiles.some(t=>map[t.y][t.x]!==0))continue;
      const before=reachableCount(map,origins);for(const t of tiles)map[t.y][t.x]=1;const after=reachableCount(map,origins);for(const t of tiles)map[t.y][t.x]=0;
      const flood=after===before-tiles.length,answer=blockKeepsReach(map,tiles,mask,origins);checked++;
      if(answer!==null){quick++;assert.equal(answer,flood,`round ${round} ${JSON.stringify(tiles)}`);}
    }
  }
  assert.ok(checked>500&&quick>checked*.8,`${quick}/${checked}`);
});
