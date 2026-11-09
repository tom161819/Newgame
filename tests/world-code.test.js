import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeWorldCode,decodeWorldCode,defaultWorldLevels,WORLD_SETTINGS,WORLD_GENERATOR_VERSION,WORLD_SEED_MAX,applyPresets,presetsFromLevels,settingsFromLevels,randomWorldCode } from '../src/data/worldCode.js';
import { worldStreams,worldRandom } from '../src/game/seededRandom.js';
import { generateWorld,mapFromWorld,exportGround,exportBushes } from '../src/game/worldGeneration.js';
import { GROUND,isWaterGround,WORLD_GENERATION } from '../src/data/worldTerrain.js';
import { reachableTiles } from '../src/game/pathfinding.js';
import { PLAYER_START } from '../src/game/map.js';

const count=(ground,code)=>ground.flat().filter(c=>c===code).length;
const water=ground=>ground.flat().filter(isWaterGround).length;
const world=(seed,levels=defaultWorldLevels())=>generateWorld(Math.random,{levels,streams:worldStreams(seed)});
const snapshot=w=>JSON.stringify({terrain:w.terrain,ground:exportGround(w.ground),bushes:exportBushes(w.bushes)});
const seeded=seed=>{let n=seed;return ()=>((n=Math.imul(n,1664525)+1013904223>>>0)/2**32);};

test('world code: MKW<generator>-<levels>-<seed base36>, round trip, lower case accepted', () => {
  assert.equal(WORLD_GENERATOR_VERSION,4,'velke-prirodni-objekty: generator 4 (thickets, rock ridges and groups, large deposits)');assert.equal(WORLD_SETTINGS.length,12);
  const code=encodeWorldCode({levels:defaultWorldLevels(),seed:parseInt('7KQ9X2',36)});assert.equal(code,'MKW4-155515555555-7KQ9X2');
  assert.deepEqual(decodeWorldCode(` ${code.toLowerCase()} `),{generator:4,levels:defaultWorldLevels(),seed:parseInt('7KQ9X2',36)});
  assert.equal(decodeWorldCode(encodeWorldCode({seed:WORLD_SEED_MAX})).seed,WORLD_SEED_MAX);assert.equal(decodeWorldCode(encodeWorldCode({seed:0})).seed,0);
  for(const bad of ['','MKW3','MKW4-15551555555-A','MKW4-155515555555-','MKW4-355515555555-A','MKW4-155545555555-A','MKW4-155515555555-123456789','XYZ3-155515555555-A',42,null])
    assert.throws(()=>decodeWorldCode(bad),e=>e.reason==='invalid'&&e.message==='Invalid world code',String(bad));
  assert.throws(()=>decodeWorldCode('MKW1-155515555555-A'),e=>e.reason==='generator'&&e.message==='This world code is for generator version 1; this build uses version 4.');
  // m-kamenolom-u-hradu: a generator-2 code (0.77.x) is refused for a New Game, but a saved game keeps it (current:null).
  assert.throws(()=>decodeWorldCode('MKW2-155515555555-7KQ9X2'),e=>e.reason==='generator');
  assert.deepEqual(decodeWorldCode('MKW2-155515555555-7KQ9X2',{current:null}),{generator:2,levels:defaultWorldLevels(),seed:parseInt('7KQ9X2',36)});
  assert.throws(()=>decodeWorldCode('MKW2-1-A',{current:null}),e=>e.reason==='invalid');
  // velke-prirodni-objekty: a generator-3 code (0.78–0.82) is refused for a New Game too; its saved games keep it.
  assert.throws(()=>decodeWorldCode('MKW3-155515555555-7KQ9X2'),e=>e.reason==='generator');
  assert.equal(decodeWorldCode('MKW3-155515555555-7KQ9X2',{current:null}).generator,3);
  assert.throws(()=>encodeWorldCode({seed:-1}));assert.throws(()=>encodeWorldCode({seed:1,levels:[1,2]}));
  assert.match(randomWorldCode(),/^MKW4-155515555555-[0-9A-Z]{1,8}$/);
});

test('world code: simple Water / Desert / Forest choices set their levels; other changes read as Custom', () => {
  const d=defaultWorldLevels();assert.deepEqual(presetsFromLevels(d),{water:'normal',desert:'on',forest:'normal',custom:false});
  const l=applyPresets(d,{water:'high',desert:'off',forest:'dense'});assert.deepEqual(presetsFromLevels(l),{water:'high',desert:'off',forest:'dense',custom:false});
  assert.deepEqual([l[1],l[4],l[5],l[8]],[8,3,0,8]);
  const odd=[...d];odd[3]=9;assert.equal(presetsFromLevels(odd).custom,true);assert.equal(presetsFromLevels(odd).water,'custom');
  assert.deepEqual(Object.values(settingsFromLevels(d)),[1,1,1,1,1,1,1,1,1,1,1,1],'level 5 / the defaults are the base values');
});

test('seeded world: the same code gives the same world, another seed another; parts draw from separate streams', () => {
  assert.equal(snapshot(world(123)),snapshot(world(123)));assert.notEqual(snapshot(world(123)),snapshot(world(124)));
  const a=worldRandom(5,'river'),b=worldRandom(5,'river'),c=worldRandom(5,'lake');assert.deepEqual([a(),a(),a()],[b(),b(),b()]);assert.notEqual(worldRandom(5,'river')(),c());
  // More bushes or rocks change only those parts: the water, beaches and desert stay where they were.
  const more=defaultWorldLevels();more[10]=9;const base=world(77),busy=world(77,more);
  assert.equal(JSON.stringify(base.ground),JSON.stringify(busy.ground));assert.ok(busy.bushes.size>base.bushes.size);
});

test('world settings: rivers, lakes, desert and density levels change the map as described', () => {
  const at=changes=>{const l=defaultWorldLevels();for(const [k,v]of Object.entries(changes))l[WORLD_SETTINGS.findIndex(s=>s.key===k)]=v;return l;};
  for(const seed of [1,2,3]){
    const dry=world(seed,at({rivers:0,lakes:0}));assert.equal(water(dry.ground),0,'no river and no lake: no water');
    const lakes=world(seed,at({rivers:0,lakes:3}));assert.ok(lakes.summary.lakes>=2,'several lakes');
    assert.equal(count(world(seed,at({desert:0})).ground,GROUND.DESERT),0,'desert off');
    assert.ok(count(world(seed,at({desert:9})).ground,GROUND.DESERT)>count(world(seed,at({desert:2})).ground,GROUND.DESERT));
    const wide=world(seed,at({riverWidth:9,lakes:0})),narrow=world(seed,at({riverWidth:0,lakes:0}));assert.ok(water(wide.ground)>water(narrow.ground));
    const rocky=world(seed,at({rocks:9})),bare=world(seed,at({rocks:0}));assert.ok(rocky.terrain.flat().filter(Boolean).length>bare.terrain.flat().filter(Boolean).length);
  }
});

test('generator 2: 25 seeded worlds stay connected, keep the start clear and give a fair start', () => {
  for(let seed=1;seed<=25;seed++){
    const w=world(seed*7919),map=mapFromWorld(w.terrain,w.ground),walkable=map.flat().filter(v=>v===0).length,reachable=reachableTiles(map,[PLAYER_START]).length;
    assert.ok(reachable/walkable>.99,`seed ${seed}: ${reachable}/${walkable}`);
    for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(Math.hypot(x-PLAYER_START.x,y-PLAYER_START.y)<=WORLD_GENERATION.startClear)assert.equal(w.ground[y][x],GROUND.GRASS);
    assert.equal(w.summary.fairStart.ok,true,`seed ${seed}: ${JSON.stringify(w.summary.fairStart)}`);
    assert.ok(w.summary.fairStart.grass>=WORLD_GENERATION.fairStart.grass&&w.summary.fairStart.water<=WORLD_GENERATION.fairStart.waterDistance);
  }
});
