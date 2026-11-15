import test from 'node:test';
import assert from 'node:assert/strict';
import { recolourLeaves,isLeaf,oakLook,treeHash } from '../src/render/treeSeasonTexture.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

test('m-duby: autumn and spring recolour only the leaves; trunk, shadow and empty pixels stay',()=>{
  const px=()=>new Uint8ClampedArray([60,110,50,255, 90,60,40,255, 0,0,0,0, 20,20,20,90]);
  const a=recolourLeaves(px(),'Autumn',0),b=recolourLeaves(px(),'Autumn',1),sp=recolourLeaves(px(),'Spring'),su=recolourLeaves(px(),'Summer');
  assert.ok(a[0]>a[1]&&a[1]>a[2],'leaf turned orange');assert.notDeepEqual([...a.slice(0,3)],[...b.slice(0,3)],'two autumn tones');
  assert.ok(sp[1]>110,'spring leaf is lighter');assert.deepEqual([...su],[...px()]);
  for(const out of [a,b,sp]){assert.deepEqual([...out.slice(4)],[...px().slice(4)]);assert.equal(out[3],255);}
  assert.equal(isLeaf(100,.5),true);assert.equal(isLeaf(25,.5),false);
});
test('m-duby: the oak has young, broad and grand in four seasons and four views; a tile always picks the same view',async()=>{
    const looks=Object.keys(objectRegistry.require('oak_tree').artSprites);assert.equal(looks.length,48);
  const seen=new Set();for(let x=0;x<40;x++){const look=oakLook({stage:3},'Summer',treeHash({x,y:7}));assert.ok(looks.includes(look));seen.add(look);assert.equal(look.replace('-summer-','-autumn-'),oakLook({stage:3},'Autumn',treeHash({x,y:7})));}
  assert.equal(seen.size,4,'all four views appear');
  assert.match(oakLook({stage:2},'Spring',1),/^young-spring-/);assert.equal(oakLook({stage:3,grand:true},'Summer',2),'grand-summer-180');
  assert.equal(oakLook({stage:3},'Winter',1),'broad-winter-90');assert.equal(oakLook({stage:2},'Winter',1),'young-winter-90');
});

// --- the grand oak on 2 × 2 -------------------------------------------------------------------------------------
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { treeState,GRAND_OAK,grandTiles,oakCanSpread,FORESTRY } from '../src/data/naturalResources.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { devObjectWood } from '../src/data/devBalance.js';
globalThis.document??={querySelector:()=>({textContent:''})};
function fixture(){const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true});s.workerSystem.unsubscribe();s.events=new EventEmitter();return s;}
function tree(s,tile,{stage=3,ageDays=20,type='oak_tree'}={}){const n=treeState(`tree-${s.naturalResources.nextId++}`,{stage,ageDays});n.ageCheckpoint=s.naturalResources.ageClock;n.growthCheckpoint=s.naturalResources.growthClock;s.addResource(s.objectRegistry.require(type),tile,n);return s.naturalResources.byId.get(n.id);}
const spreading=(from=60)=>{for(let x=from;x<90;x++)if(oakCanSpread({x,y:60}))return {x,y:60};throw new Error('no tile');};
const plain=(from=60)=>{for(let x=from;x<90;x++)if(!oakCanSpread({x,y:64}))return {x,y:64};throw new Error('no tile');};

test('m-duby: an old oak with room takes 2 × 2, blocks the four tiles and is felled from any side for more wood',()=>{
  const s=fixture(),N=s.naturalResources,at=spreading(),oak=tree(s,at),other=tree(s,plain()),young=tree(s,{x:at.x+6,y:at.y},{ageDays:3});
  N.flushGrowth();assert.equal(oak.natural.grand,true,'spread');assert.equal(other.natural.grand,undefined,'half of the oaks never spread');assert.equal(young.natural.grand,undefined,'too young');
  assert.equal(oak.tiles.length,4);for(const t of grandTiles(at)){assert.equal(s.map[t.y][t.x],1);assert.equal(s.resourceOccupancy.get(`${t.x},${t.y}`),`${at.x},${at.y}`);}
  const goals=N.goals(oak);assert.equal(goals.length,8);assert.ok(goals.every(g=>!grandTiles(at).some(t=>t.x===g.x&&t.y===g.y)));
  assert.equal(devObjectWood(oak),GRAND_OAK.wood);assert.equal(devObjectWood(other),FORESTRY.trees.oak_tree.wood);
  // save and load keep it
  const saved=validateGameState(serializeGameState(s)),r=fixture();loadGameState(r,saved);const again=r.naturalResources.byId.get(oak.natural.id);assert.equal(again.natural.grand,true);assert.equal(again.tiles.length,4);assert.equal(r.map[at.y+1][at.x+1],1);assert.deepEqual(serializeGameState(r).resources,saved.resources);
  // felled: a plain stump on one tile, the other three are free land again
  const w=s.workerSystem.create({x:at.x+2,y:at.y+1});s.workerSystem.reservations.reserve(N.reservation(oak),w.id);const before=[...s.dropSystem.drops.values()].length;
  for(let i=0;i<400&&oak.natural.stage===3;i++)N.work(oak,w,100);assert.equal(oak.natural.stage<3,true);assert.equal(oak.natural.grand,undefined);assert.equal(oak.tiles.length,1);
  for(const t of grandTiles(at).slice(1)){assert.equal(s.map[t.y][t.x],0);assert.equal(s.resourceOccupancy.has(`${t.x},${t.y}`),false);}
  const drop=[...s.dropSystem.drops.values()].at(-1);assert.equal([...s.dropSystem.drops.values()].length,before+1);assert.equal(drop.quantity??drop.amount??drop.count,GRAND_OAK.wood);
  validateGameState(serializeGameState(s));
});
test('m-duby: no room, no grand oak – a tree, a building, a person or a path beside it keeps the middle oak',()=>{
  const s=fixture(),N=s.naturalResources,a=spreading(60),b=spreading(a.x+5),c=spreading(b.x+5);
  const o1=tree(s,a);tree(s,{x:a.x+1,y:a.y+1},{stage:1});const o2=tree(s,b);s.workerSystem.create({x:b.x+1,y:b.y});const o3=tree(s,c);s.map[c.y+1][c.x]=1;
  N.flushGrowth();assert.equal(o1.natural.grand,undefined);assert.equal(o2.natural.grand,undefined);assert.equal(o3.natural.grand,undefined);
  // saving never spreads an oak
  const d=spreading(c.x+5),o4=tree(s,d);serializeGameState(s);assert.equal(o4.natural.grand,undefined);
  assert.throws(()=>validateGameState({...serializeGameState(s),resources:serializeGameState(s).resources.map(r=>r.natural?.id===o1.natural.id?{...r,natural:{...r.natural,grand:true}}:r)}),'a grand oak over another tree is not a valid save');
});
test('m-duby: a new world gets lone oaks outside the forests and grand oaks with their gap; reach is kept',async()=>{
  const {reachableTiles}=await import('../src/game/pathfinding.js');
  const s=fixture(),N=s.naturalResources;let seed=4711;const random=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/2**32);N.generate(random);
  const trees=N.byId.size,result=N.generateOaks(),grand=[...N.byId.values()].filter(o=>o.natural?.grand);
  assert.ok(result.lone>0,'lone oaks');assert.ok(result.grand>0,'grand oaks');assert.equal(grand.length,result.grand);assert.ok(N.byId.size<=trees+result.lone);
  for(const o of grand){assert.equal(o.type,'oak_tree');for(const t of grandTiles(o)){assert.equal(s.map[t.y][t.x],1);assert.equal(s.resourceOccupancy.get(`${t.x},${t.y}`),`${o.x},${o.y}`);}assert.ok(N.goals(o).length>0,'can be reached');}
  const a=fixture();seed=4711;a.naturalResources.generate(random);assert.deepEqual(a.naturalResources.generateOaks(),result,'the same world again');
  validateGameState(serializeGameState(s));assert.ok(reachableTiles(s.map,[s.character.tile]).length>1000);
});
