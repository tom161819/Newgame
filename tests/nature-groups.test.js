import { gameSettings } from '../src/systems/GameSettings.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,placementError } from '../src/game/buildings.js';
import { generateWorld,exportBushes } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';
import { defaultWorldLevels } from '../src/data/worldCode.js';
import { BUSH_TYPES,WORLD_GENERATION } from '../src/data/worldTerrain.js';
import { NATURE_GROUP_SIZES,groupTiles,groupIntact,validGroupSize,pruneNatureGroups,exportNatureGroups,importNatureGroups,mergeThickets } from '../src/game/natureGroups.js';
import { ROCK_MINING } from '../src/data/rockMining.js';
import { MINERAL_DEPOSITS,depositFamily } from '../src/data/minerals.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { canStep } from '../src/game/pathfinding.js';
// velke-prirodni-objekty: thickets, rock obstacles and ridges as one object over their bushes and rocks; 3 × 3 deposits.
globalThis.document??={querySelector:()=>({textContent:''})};
const world=(seed,levels=defaultWorldLevels())=>generateWorld(Math.random,{levels,streams:worldStreams(seed)});
const scene=(starter=true,terrain=undefined)=>{const s=workerScene(terrain,{naturalResources:true,ledger:true,construction:true,foodProduction:true,logistics:true,starter});s.workerSystem.unsubscribe();s.gameSettings=gameSettings({dayLengthSeconds:240});s.gameTime.dayDuration=240000;s.bushes??=new Map();s.natureGroups??=[];return s;};
const marks=s=>s.naturalResources.miningWork.rocks;
function until(s,p,max=400000){for(let elapsed=0;elapsed<max&&!p();elapsed+=50)s.tick(50);assert.ok(p());}
function build(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function thicket(s,x,y,w,h,type=0){for(const t of groupTiles({x,y,w,h}))s.bushes.set(`${t.x},${t.y}`,type);const g={kind:'thicket',x,y,w,h};s.natureGroups.push(g);return g;}
function rocks(s,x,y,w,h){for(const t of groupTiles({x,y,w,h})){s.terrainGrid[t.y][t.x]=1;s.map[t.y][t.x]=1;}const g={kind:'rocks',x,y,w,h};s.natureGroups.push(g);return g;}
function person(s,job,x,y,home=null){const w=s.workerSystem.create({x,y});if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,job);return w;}

test('generator 4: thickets, rock obstacles and ridges have the approved footprints, lie on their parts and never overlap', () => {
  const seen=new Set();
  for(const seed of [1,2,3,4,5,77]){
    const w=world(seed),taken=new Set();
    for(const g of w.natureGroups){
      assert.ok(validGroupSize(g.kind,g.w,g.h),JSON.stringify(g));seen.add(`${g.kind}:${g.w}x${g.h}`);
      assert.ok(groupIntact(g,{bushes:w.bushes,terrain:w.terrain}),JSON.stringify(g));
      for(const t of groupTiles(g)){const key=`${t.x},${t.y}`;assert.ok(!taken.has(key));taken.add(key);}
      if(g.kind==='thicket')for(const t of groupTiles(g))assert.notEqual(BUSH_TYPES[w.bushes.get(`${t.x},${t.y}`)],'bush_scrub');
    }
    // The fair start stays clear: no group within the bush clearance of the start.
    for(const g of w.natureGroups.filter(g=>g.kind==='thicket'))for(const t of groupTiles(g))assert.ok(Math.hypot(t.x+.5-50.5,t.y+.5-50.5)>WORLD_GENERATION.bushClear);
    assert.ok(w.natureGroups.filter(g=>g.kind==='thicket').length>=5,`seed ${seed}: thickets`);
    assert.ok(w.natureGroups.filter(g=>g.kind==='rocks'&&g.w===4).length>=5,`seed ${seed}: ridges`);
  }
  for(const kind of Object.keys(NATURE_GROUP_SIZES))for(const [w,h] of NATURE_GROUP_SIZES[kind])assert.ok(seen.has(`${kind}:${w}x${h}`),`${kind} ${w}x${h} appears`);
});

test('generator 4: the same code gives the same groups and bushes, another seed others; fewer bushes give fewer thickets', () => {
  const a=world(123),b=world(123),c=world(124);
  assert.deepEqual(exportNatureGroups(a.natureGroups),exportNatureGroups(b.natureGroups));assert.deepEqual(exportBushes(a.bushes),exportBushes(b.bushes));
  assert.notDeepEqual(exportNatureGroups(a.natureGroups),exportNatureGroups(c.natureGroups));
  const none=defaultWorldLevels();none[10]=0;none[3]=0;const bare=world(123,none);
  assert.ok(bare.natureGroups.filter(g=>g.kind==='thicket').length<a.natureGroups.filter(g=>g.kind==='thicket').length);
  // The merge fills at most a third of a patch, from the patch's main bush kind, and only where a bush may grow.
  const bushes=new Map([['10,10',1],['11,10',1],['12,10',1],['10,11',1],['11,11',0]]);
  const groups=mergeThickets({bushes,canGrow:x=>x>=10,qualifies:()=>true,random:()=>0,fill:1});
  assert.deepEqual(groups,[{kind:'thicket',x:10,y:10,w:3,h:2}]);assert.equal(bushes.get('12,11'),1);
  const sparse=new Map([['10,10',1],['12,11',1]]);assert.deepEqual(mergeThickets({bushes:sparse,canGrow:()=>true,qualifies:()=>true,random:()=>0,fill:1}),[]);
});

test('a thicket is walkable bush ground; marking one tile marks every bush, a Woodcutter clears them all with no yield', () => {
  const s=scene(),g=thicket(s,60,50,3,2,1),hut=build(s,'lumberjack_hut',44,43);
  assert.ok(canStep(s.map,{x:60,y:50},{x:61,y:50}),'bushes (and so thickets) do not block walking');
  assert.equal(marks(s).markTile({x:61,y:51}),6);assert.equal(marks(s).bushes.size,6);
  assert.equal(marks(s).markTile({x:60,y:50},false),6);assert.equal(marks(s).bushes.size,0);marks(s).markTile({x:62,y:50});
  const w=person(s,'woodcutter',42,46,hut),stone=s.inventory.count('stone'),drops=s.dropSystem.drops.size;
  until(s,()=>s.bushes.size<6);assert.equal(pruneNatureGroups(s),true);assert.deepEqual(s.natureGroups,[],'the first cut bush splits the thicket');
  until(s,()=>s.bushes.size===0);assert.equal(s.inventory.count('stone'),stone);assert.equal(s.dropSystem.drops.size,drops);assert.equal(groupIntact(g,s),false);
  validateGameState(serializeGameState(s));
});

test('rock obstacles and ridges block like rocks; marking one tile orders the whole group, ten Stones per tile', () => {
  const s=scene(),ridge=rocks(s,60,50,4,2),obstacle=rocks(s,70,50,2,2);
  assert.ok(!canStep(s.map,{x:59,y:50},{x:60,y:50}));
  assert.notEqual(placementError(s.map,{x:59,y:49},s.resourceOccupancy,[],s.objectRegistry.require('lumberjack_hut'),s.buildings),null);
  assert.equal(marks(s).markTile({x:63,y:51}),8);assert.equal([...marks(s).records.values()].filter(r=>r.marked).length,8);
  assert.equal(marks(s).markTile({x:71,y:51}),4);
  const yieldOf=g=>groupTiles(g).length*ROCK_MINING.yield;assert.deepEqual([yieldOf(ridge),yieldOf(obstacle)],[80,40],'stone proportional to the footprint');
  // Mining one tile out splits the group; the others stay rock and keep their orders.
  const r=marks(s).records.get('60,50');r.produced=ROCK_MINING.yield;s.terrainGrid[50][60]=0;s.map[50][60]=0;
  assert.equal(pruneNatureGroups(s),true);assert.deepEqual(s.natureGroups,[obstacle]);assert.equal(s.terrainGrid[51][63],1);
});

test('groups give way to buildings and resources, and survive Save/Load; forged groups are rejected', () => {
  const s=scene(),t=thicket(s,60,50,2,2,0),r=rocks(s,70,50,4,2),gone=thicket(s,80,50,2,1,2);
  s.addResource(s.objectRegistry.require('stone'),{x:81,y:50});assert.equal(pruneNatureGroups(s),true);assert.deepEqual(s.natureGroups,[t,r]);
  const state=validateGameState(serializeGameState(s));assert.deepEqual(state.natureGroups,[['thicket',60,50,2,2],['rocks',70,50,4,2]]);
  const restored=scene(false,state.terrain);restored.bushes=new Map(state.bushes.map(([x,y,type])=>[`${x},${y}`,type]));restored.natureGroups=importNatureGroups(state.natureGroups);loadGameState(restored,structuredClone(state));
  assert.deepEqual(serializeGameState(restored).natureGroups,state.natureGroups);
  const bad=[s=>s.natureGroups.push(['thicket',60,50,2,2]),s=>s.natureGroups.push(['rocks',10,10,3,2]),s=>s.natureGroups.push(['thicket',10,10,2,1]),s=>s.natureGroups.push(['pond',10,10,2,2]),
    s=>s.natureGroups.push(['rocks',99,10,2,2]),s=>s.natureGroups[0].push(1),s=>{s.bushes=s.bushes.filter(b=>!(b[0]===61&&b[1]===51));}];
  for(const mutate of bad){const copy=structuredClone(state);mutate(copy);assert.throws(()=>validateGameState(copy));}
  const old=structuredClone(state);delete old.natureGroups;assert.deepEqual(validateGameState(old).natureGroups,[],'absent = no groups');
  // A building placed over a thicket tile ends the thicket (its bushes stay under the building as before).
  build(s,'lumberjack_hut',59,49);assert.equal(pruneNatureGroups(s),true);assert.deepEqual(s.natureGroups,[r]);
});

test('3 × 3 deposits: larger reserves, a Quarry over one and an Iron Mine near one bind to them, and they survive Save/Load', () => {
  for(const [type,rule] of Object.entries(MINERAL_DEPOSITS))if(rule.size){const small=MINERAL_DEPOSITS[rule.family];assert.ok(rule.min>small.max,`${type} holds more`);assert.equal(depositFamily(type),rule.family);}
  const s=scene();s.fog.isVisibleObject=()=>true;
  const add=(type,x,y,amount)=>{const id=`deposit-${s.naturalResources.nextDepositId++}`;s.addResource(s.objectRegistry.require(type),{x,y},{id,kind:'deposit',remaining:amount,max:amount,boundBuildingId:null});return s.naturalResources.byId.get(id);};
  const stone=add('stone_deposit_large',60,50,250),iron=add('iron_deposit_large',70,60,200);
  assert.equal(stone.tiles.length,9);assert.ok(stone.tiles.every(t=>s.map[t.y][t.x]===1));
  const quarry=build(s,'quarry',60,50);assert.equal(quarry.depositId,stone.natural.id);assert.equal(stone.natural.boundBuildingId,quarry.id);
  const mine=build(s,'iron_mine',74,60);assert.equal(mine.depositId,iron.natural.id);
  const state=validateGameState(serializeGameState(s)),restored=scene(false,state.terrain);loadGameState(restored,structuredClone(state));
  assert.deepEqual(serializeGameState(restored).resources.filter(r=>r.type.endsWith('_large')),state.resources.filter(r=>r.type.endsWith('_large')));
  const forged=structuredClone(state);forged.resources.find(r=>r.type==='stone_deposit_large').natural.max=100;assert.throws(()=>validateGameState(forged),'reserves below the large range');
});
