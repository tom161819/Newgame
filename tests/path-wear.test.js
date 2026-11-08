import test from 'node:test';
import assert from 'node:assert/strict';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { GameTimeSystem,DAY_DURATION } from '../src/systems/GameTimeSystem.js';
import { PATH_WEAR,wearLevel } from '../src/data/pathWear.js';
import { advanceMovement,enteredTiles } from '../src/game/movement.js';
import { MOVEMENT_SPEED_SCALE as S } from '../src/data/movement.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { TerrainRenderer } from '../src/game/TerrainRenderer.js';

function setup(){const map=Array.from({length:100},()=>Array(100).fill(0)),time=new GameTimeSystem(),scene={map};scene.pathWear=new PathWearSystem({map,terrain:map,time});return {map,time,scene,wear:scene.pathWear};}
function actor(scene,type='king',start={x:10,y:10}){return {scene,definition:type==='npc'?{category:'character',gameplay:{}}:objectRegistry.require(type),state:'ground',tile:{...start},position:{x:start.x+.5,y:start.y+.5},path:[],nextTile:null,speed:3.5,direction:{x:0,y:1}};}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} !== ${b}`);

test('central thresholds produce all five levels (trampled grass first, #116) and only human ground entries change scores',()=>{
  const {wear,scene,map}=setup(),tile={x:11,y:10},king=actor(scene),npc=actor(scene,'npc');
  assert.deepEqual([0,2,3,4,5,14,15,29,30,100].map(wearLevel),[0,0,1,1,2,2,3,3,4,4]);
  for(let i=0;i<30;i++)wear.enter(i%2?king:npc,tile);assert.equal(wear.scores[wear.index(tile)],30);assert.equal(wear.level(tile),4);
  const original=wear.scores[wear.index(tile)];for(const type of ['horse','deer','rabbit','wild_boar'])wear.enter(actor(scene,type),tile);
  king.state='onWall';wear.enter(king,tile);king.state='onTower';wear.enter(king,tile);assert.equal(wear.scores[wear.index(tile)],original);
  king.state='ground';map[10][12]=1;wear.enter(king,{x:12,y:10});assert.equal(wear.scores[1012],0);
  const water=new PathWearSystem({map,terrain:map,time:new GameTimeSystem(),isGrass:t=>t.x!==13});water.enter(king,{x:13,y:10});assert.equal(water.scores[1013],0);
});

test('standing, zero-time frames and repeated updates count no visits; leaving and re-entering counts once',()=>{
  const {wear,scene}=setup(),king=actor(scene);for(let i=0;i<100;i++)advanceMovement(king,100);assert.equal(wear.active.size,0);
  king.path=[{x:11,y:10},{x:12,y:10},{x:13,y:10}];advanceMovement(king,1000/S);assert.equal(king.tile.x,13);
  for(const x of [11,12,13])assert.equal(wear.scores[1010+x-10],1);
  const snapshot=wear.exportState();for(let i=0;i<100;i++)advanceMovement(king,0);advanceMovement(king,1000);assert.deepEqual(wear.exportState(),snapshot);
  king.path=[{x:12,y:10},{x:11,y:10},{x:10,y:10}];advanceMovement(king,1000/S);assert.equal(wear.scores[1010],1);assert.equal(wear.scores[1011],2);
});

test('high speed and every FPS visit each diagonal cell with no side-corner phantom visits',()=>{
  for(const fps of [1,20,60,144]){
    const {wear,scene}=setup(),king=actor(scene);king.speed=50;king.path=Array.from({length:20},(_,i)=>({x:11+i,y:11+i}));
    let elapsed=0;while(elapsed<1000){const ms=Math.min(1000/fps,1000-elapsed);advanceMovement(king,ms);elapsed+=ms;}
    assert.deepEqual(king.tile,{x:30,y:30});assert.equal(wear.active.size,20);
    for(let i=11;i<=30;i++){assert.equal(wear.scores[i*100+i],1);assert.equal(wear.scores[i*100+i-1],0);}
  }
  assert.deepEqual(enteredTiles({x:2.5,y:2.5},{x:1,y:1}),[{x:1,y:1}]);
  assert.deepEqual(enteredTiles({x:1,y:1},{x:.999,y:.999}),[{x:0,y:0}]);
  assert.deepEqual(enteredTiles({x:.5,y:.5},{x:1,y:.9999999999999999}),[{x:1,y:0}]);
});

test('eight directions preserve normalized speed and count physical cell crossings before the center',()=>{
  for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
    const {wear,scene}=setup(),king=actor(scene);king.path=[{x:10+dx,y:10+dy}];advanceMovement(king,100/S);
    near(Math.hypot(king.position.x-10.5,king.position.y-10.5),.35);assert.equal(wear.active.size,0);
    advanceMovement(king,130/S);assert.equal(wear.active.size,1);assert.equal(wear.scores[(10+dy)*100+10+dx],1);
    advanceMovement(king,1000);assert.equal(wear.active.size,1);
  }
});

test('surface speed applies only in occupied ground tile and composes with mounted base speed',()=>{
  for(let level=0;level<4;level++)for(const mounted of [false,true]){
    const {wear,scene}=setup(),king=actor(scene),worker=actor(scene,'npc'),tile={x:11,y:10};
    for(let i=0;i<PATH_WEAR.thresholds[level];i++)wear.enter(worker,tile);
    if(mounted){king.mountedHorse={};king.speed=7;}
    const base=king.speed,duration=(.5/base+.5/(base*PATH_WEAR.speedMultipliers[level]))*1000/S;
    king.path=[tile];advanceMovement(king,duration);near(king.position.x,11.5);assert.equal(king.speed,base);
    assert.equal(wear.scores[1011],PATH_WEAR.thresholds[level]+(mounted?2:1));
  }
});

test('unused paths recover once per day after three days; a fresh pass postpones recovery',()=>{
  const {wear,scene,time}=setup(),king=actor(scene),tile={x:12,y:12};let changes=0;wear.subscribe(()=>changes++);
  for(let i=0;i<30;i++)wear.enter(king,tile);assert.equal(changes,4);time.update(2*DAY_DURATION);assert.equal(wear.scores[1212],30);
  time.update(DAY_DURATION);assert.equal(time.day,4);assert.equal(wear.scores[1212],25);assert.equal(wear.level(tile),3);
  wear.onNewDay(4);assert.equal(wear.scores[1212],25);wear.enter(king,tile);time.update(2*DAY_DURATION);assert.equal(wear.scores[1212],26);
  time.update(DAY_DURATION);assert.equal(wear.scores[1212],21);time.update(5*DAY_DURATION);assert.equal(wear.scores[1212],0);assert.equal(wear.level(tile),0);assert.equal(wear.active.size,0);
});

test('saved numeric wear state restores unchanged, never recounts standing units or catches up offline',()=>{
  const original=setup(),king=actor(original.scene);for(let i=0;i<16;i++)original.wear.enter(king,{x:11,y:10});
  original.time.update(DAY_DURATION);const saved=JSON.parse(JSON.stringify(original.wear.exportState())),restored=setup();
  restored.time.importState(original.time.exportState());restored.wear.importState(saved);assert.deepEqual(restored.wear.exportState(),saved);
  const loadedKing=actor(restored.scene,'king',{x:11,y:10});advanceMovement(loadedKing,0);advanceMovement(loadedKing,10000);restored.time.update(0);assert.deepEqual(restored.wear.exportState(),saved);
  restored.wear.importState(null);assert.equal(restored.wear.active.size,0);assert.ok(restored.wear.scores.every(n=>n===0));assert.equal(restored.wear.lastDecayDay,2);
});

test('level changes invalidate only local terrain chunks including neighbors across chunk boundaries',()=>{
  const renderer=Object.create(TerrainRenderer.prototype);renderer.dirtyChunks=new Set();renderer.dirtyTiles=new Map();renderer.lastView='cached';
  renderer.invalidateArea([{x:9,y:9}]);assert.deepEqual([...renderer.dirtyChunks].sort(),['0,0','0,1','1,0','1,1']);assert.equal(renderer.lastView,'');
  renderer.dirtyChunks.clear();renderer.invalidateArea([{x:0,y:0},{x:99,y:99}]);assert.deepEqual([...renderer.dirtyChunks].sort(),['0,0','9,9']);
  const {wear,scene}=setup(),king=actor(scene);renderer.dirtyChunks.clear();wear.subscribe(tile=>renderer.invalidateArea([tile]));
  for(let i=0;i<2;i++)wear.enter(king,{x:25,y:25});assert.equal(renderer.dirtyChunks.size,0);
  wear.enter(king,{x:25,y:25});assert.deepEqual([...renderer.dirtyChunks],['2,2']);
});
