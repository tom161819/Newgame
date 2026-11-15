// m-kamenolom-u-hradu (playtest 0.76.0 #13, owner): every new world has a Stone Deposit for a Quarry 8–16 tiles from the
// Castle (buildable by the game's own placement rules, reachable, clear of the start) and rocks to mark within 10 tiles.
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { generateWorld,mapFromWorld } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';
import { defaultWorldLevels,settingsFromLevels } from '../src/data/worldCode.js';
import { isFordGround,WORLD_GENERATION } from '../src/data/worldTerrain.js';
import { START_QUARRY } from '../src/data/minerals.js';
import { FORESTRY } from '../src/data/naturalResources.js';
import { PLAYER_START } from '../src/game/config.js';
import { placementError,buildingTiles,buildingDefinition,towerNeighbors } from '../src/game/buildings.js';
import { reachableTiles } from '../src/game/pathfinding.js';
import { footprintDistance } from '../src/systems/MineralSystem.js';
import { gameSettings,NEW_GAME_DEFAULTS } from '../src/systems/GameSettings.js';
globalThis.document={querySelector:()=>({textContent:''})};

// The New Game order of GameScene for the parts that decide where deposits go: world, Castle and Starter Stockpile,
// trees (with the fair start), the random deposits, then the start Quarry deposit.
// trees:false skips the forest (the slow part) for the 200-seed sweep; a smaller sweep below keeps them.
function newWorld(seed,levels=defaultWorldLevels(),{ensure=true,trees=true}={}){
  const streams=worldStreams(seed),w=generateWorld(Math.random,{levels,streams});
  const s=workerScene(mapFromWorld(w.terrain,w.ground),{logistics:true,naturalResources:true,construction:true,gameSettings:gameSettings(NEW_GAME_DEFAULTS),start:PLAYER_START});
  // Fog off: placing a Quarry also needs the deposit explored (it is 8–16 tiles out, beyond the start sight; the tutorial points at it).
  s.workerSystem.unsubscribe();s.fog.setEnabled(false);s.terrainGrid=w.terrain.map(r=>[...r]);s.groundGrid=w.ground;
  s.fordKeys=new Set();for(let y=0;y<100;y++)for(let x=0;x<100;x++)if(isFordGround(w.ground[y][x]))s.fordKeys.add(`${x},${y}`);s.isFordTile=t=>s.fordKeys.has(`${t.x},${t.y}`);
  const o=settingsFromLevels(levels),F=WORLD_GENERATION.fairStart,at=(grid,t)=>grid[t.y*100+t.x]??0;
  if(trees)s.naturalResources.generate(streams('trees'),Math.round(FORESTRY.initialTrees*o.forest),{weight:t=>at(w.forestWeight,t),start:o.forest>=.5?{center:PLAYER_START,radius:F.radius,trees:F.trees}:null});
  s.naturalResources.mining.generate(streams('minerals'),t=>.25+.75*at(w.stoneWeight,t));
  const iron=snapshot(s,'iron_deposit'),stone=snapshot(s,'stone_deposit');
  const result=ensure?s.naturalResources.mining.ensureStartQuarry(streams('start-quarry')):null;
  return {s,result,iron,stone};
}
const snapshot=(s,type)=>s.naturalResources.mining.deposits().filter(d=>d.type===type).map(d=>({x:d.x,y:d.y,max:d.natural.max}));
const castleOf=s=>s.buildings.find(b=>b.type==='castle');
const centreOf=b=>{const d=buildingDefinition(b);return {x:b.x+d.width/2,y:b.y+d.height/2};};
// Every Quarry anchor over the deposit that the game's placementError accepts (fog off in test scenes, unlocks granted).
function quarrySpots(s,deposit){
  const q=s.objectRegistry.require('quarry'),spots=[];
  for(let dy=-2;dy<=1;dy++)for(let dx=-2;dx<=1;dx++){const anchor={x:deposit.x+dx,y:deposit.y+dy};if(placementError(s.map,anchor,s.resourceOccupancy,s.reservedTiles(),q,s.buildings,{status:()=>({unlocked:true})})===null)spots.push(anchor);}
  return spots;
}
function startQuarries(s){
  const c=centreOf(castleOf(s));
  return s.naturalResources.mining.deposits().filter(d=>d.type==='stone_deposit'&&Math.hypot(d.x+1-c.x,d.y+1-c.y)>=START_QUARRY.min&&Math.hypot(d.x+1-c.x,d.y+1-c.y)<=START_QUARRY.max).map(d=>({d,spots:quarrySpots(s,d)})).filter(e=>e.spots.length);
}

function sweep(seeds,options){
  let added=0;
  for(const seed of seeds){
    const {s,result,iron}=newWorld(seed,undefined,options),castle=castleOf(s),c=centreOf(castle),q=s.objectRegistry.require('quarry');
    assert.ok(castle,`seed ${seed}: castle`);assert.ok(result.deposit,`seed ${seed}: a start Quarry deposit`);if(result.added)added++;
    const found=startQuarries(s);assert.ok(found.length,`seed ${seed}: a deposit in range with a valid Quarry spot`);
    assert.ok(found.some(e=>e.d===result.deposit),`seed ${seed}: the chosen deposit is one of them`);
    const {spots}=found.find(e=>e.d===result.deposit),starts=s.buildings.filter(b=>START_QUARRY.keepClearOf.includes(b.type)).map(b=>({x:b.x,y:b.y,definition:buildingDefinition(b)}));
    assert.ok(spots.some(spot=>{
      // Clear of the Castle and the Starter Stockpile; building it cuts nothing off and a work position stays reachable.
      if(starts.some(b=>footprintDistance({...spot,definition:q},b)<START_QUARRY.clearance))return false;
      const before=reachableTiles(s.map,[s.character.tile]).length,tiles=buildingTiles(spot,q).filter(t=>s.map[t.y][t.x]===0);for(const t of tiles)s.map[t.y][t.x]=1;
      const after=reachableTiles(s.map,[s.character.tile]),reach=new Set(after.map(t=>`${t.x},${t.y}`));for(const t of tiles)s.map[t.y][t.x]=0;
      return after.length===before-tiles.length&&towerNeighbors({...spot,definition:q}).some(t=>reach.has(`${t.x},${t.y}`))&&towerNeighbors(castle).some(t=>reach.has(`${t.x},${t.y}`));
    }),`seed ${seed}: a Quarry spot clear of the start that keeps everything reachable`);
    // Manual mining: a rock (terrain 1) within 10 tiles of the Castle with a reachable side to work from.
    const reach=new Set(reachableTiles(s.map,[s.character.tile]).map(t=>`${t.x},${t.y}`));let rock=false;
    for(let y=0;y<100&&!rock;y++)for(let x=0;x<100&&!rock;x++)if(s.terrainGrid[y][x]===1&&Math.hypot(x+.5-c.x,y+.5-c.y)<=START_QUARRY.rocksWithin&&[[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>reach.has(`${x+dx},${y+dy}`)))rock=true;
    assert.ok(rock,`seed ${seed}: a rock to mark within 10 tiles`);
    assert.deepEqual(snapshot(s,'iron_deposit'),iron,`seed ${seed}: iron unchanged`);
  }
  return added;
}
const range=(from,to)=>Array.from({length:to-from+1},(_,i)=>from+i);
test('200 seeds: a Stone Deposit 8–16 tiles from the Castle takes a Quarry, reachable and clear of the start; rocks within 10',()=>{
  assert.ok(sweep(range(1,200),{trees:false})>0,'some worlds needed the extra deposit');
});
test('10 seeds with the starting forest (as in a New Game): the same guarantee',()=>{
  sweep(range(1001,1010),{trees:true});
});

test('the start deposit is deterministic, leaves the random deposits alone and is not added when one already qualifies',()=>{
  for(const seed of [3,17,58,141]){
    const a=newWorld(seed,undefined,{trees:seed===3}),b=newWorld(seed,undefined,{trees:seed===3}),list=r=>r.s.naturalResources.mining.deposits().map(d=>`${d.type}@${d.x},${d.y}:${d.natural.max}`);
    assert.deepEqual(list(a),list(b),`seed ${seed}: same world code, same deposits`);
    const before=newWorld(seed,undefined,{ensure:false,trees:seed===3});assert.deepEqual(snapshot(a.s,'iron_deposit'),before.iron);
    const stone=snapshot(a.s,'stone_deposit');assert.deepEqual(stone.slice(0,before.stone.length),before.stone,'the five random Stone Deposits stay');
    assert.equal(stone.length,before.stone.length+(a.result.added?1:0));
    if(!a.result.added)assert.ok(startQuarries(before.s).length,'already had one, so nothing was added');
    // Running it again on the same world adds nothing.
    const again=a.s.naturalResources.mining.ensureStartQuarry(()=>.5);assert.equal(again.added,false);assert.equal(again.deposit,a.result.deposit);
  }
});

test('other world settings (no river, dense forest, many rocks) keep the guarantee',()=>{
  const levels=changes=>{const l=defaultWorldLevels();for(const [i,v]of changes)l[i]=v;return l;};
  for(const [seed,l]of [[5,levels([[0,0]])],[9,levels([[8,9]])],[12,levels([[9,9]])],[21,levels([[0,2],[4,3]])]]){
    const {s,result}=newWorld(seed,l);assert.ok(result.deposit,`seed ${seed}`);assert.ok(startQuarries(s).some(e=>e.d===result.deposit),`seed ${seed}: buildable`);
  }
});

test('tutorial: the Stone step names the grey deposit near the castle; with the Quarry chosen the arrow points at it',async()=>{
  const { TutorialGuide }=await import('../src/ui/TutorialGuide.js'),{ gridToWorld }=await import('../src/game/isometric.js');
  const en=(await import('../src/i18n/en.js')).default,cs=(await import('../src/i18n/cs.js')).default;
  assert.match(en['tutorial.step.stone'],/Quarry on the grey deposit near the castle/);assert.match(cs['tutorial.step.stone'],/kamenolom na šedém ložisku kousek od hradu/);
  assert.ok(en['tutorial.step.stoneQuarry']&&cs['tutorial.step.stoneQuarry']);
  const {s,result}=newWorld(7,undefined,{trees:false}),step={id:'stone',check:'stone',target:'#mark-rocks',buildingIds:['quarry']}/* the stone arrow logic stays in TutorialGuide (owner 15 Nov 2026: no longer a guide step) */,guide=Object.create(TutorialGuide.prototype);
  Object.assign(guide,{scene:s,doc:{querySelector:()=>null,getElementById:()=>null}});
  s.buildMode=true;s.selectedBuilding=s.objectRegistry.require('quarry');
  const target=guide.target(step),nearest=guide.quarryDeposit(),p=gridToWorld(nearest.x+1,nearest.y+1);
  assert.ok(target.quarry&&target.placing);assert.deepEqual(target.world,{x:p.x,y:p.y-30});
  const c=s.naturalResources.mining.startCentre(),dist=d=>Math.hypot(d.x+1-c.x,d.y+1-c.y);assert.ok(dist(nearest)<=dist(result.deposit));
  s.selectedBuilding=s.objectRegistry.require('house');assert.ok(!guide.target(step).quarry,'another building: the usual Stone step arrow');
});
