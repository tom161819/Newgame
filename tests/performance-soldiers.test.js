import test from 'node:test';
import assert from 'node:assert/strict';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { TerrainRenderer } from '../src/game/TerrainRenderer.js';

// Owner 18 Nov 2026 ("udělej vše" – the performance test with 30 soldiers, project document claude/test-vykonu-0.146.md).
const time={day:1,onNewDay:()=>()=>{}};
test('soldiers do not tread paths (they still walk faster on paths others made)',()=>{
  const map=Array.from({length:20},()=>Array(20).fill(0)),terrain=map.map(r=>r.map(()=>0)),wear=new PathWearSystem({map,terrain,time});
  const person={definition:{category:'character'},state:null},soldier={...person,profession:'soldier'};
  for(let i=0;i<40;i++)wear.enter(soldier,{x:5,y:5});assert.equal(wear.level({x:5,y:5}),0);
  for(let i=0;i<40;i++)wear.enter(person,{x:6,y:5});assert.ok(wear.level({x:6,y:5})>0);
  assert.ok(wear.speedMultiplier(soldier,{x:6,y:5})>1,'a soldier is faster on the path');
});
test('the fog revision moves only when a tile is seen or lost, not when a source moves inside seen ground',()=>{
  const king={position:{x:10.5,y:10.5},definition:{gameplay:{baseSight:20}},state:'ground'},fog=new FogOfWarSystem(king,true,{width:60,height:60});
  let men=[{id:'a',center:{x:10.5,y:10.5},radius:3}];fog.registerSource('men',()=>men);fog.update();const r0=fog.revision;
  men=[{id:'a',center:{x:11.5,y:10.5},radius:3}];fog.update();assert.equal(fog.revision,r0,'inside the King\'s sight: nothing new');assert.ok(fog.sources.some(s=>s.center.x===11.5),'the source itself moved');
  men=[{id:'a',center:{x:30.5,y:10.5},radius:3}];fog.update();assert.equal(fog.revision,r0+1);assert.ok(fog.added.length>0&&fog.isInSightTile({x:30,y:10}));
});
test('with relief the flat chunk picture is not uploaded to the GPU unless it is shown',()=>{
  let uploads=0;const tex={refresh(){uploads++;}},self={scene:{relief:{},reliefLift:true,textures:{exists:()=>true,get:()=>tex}}};
  const {lifts,uploadFlat,flushFlat}=TerrainRenderer.prototype;Object.assign(self,{lifts,uploadFlat,flushFlat});
  globalThis.document??={};self.uploadFlat(tex);assert.equal(uploads,0);assert.equal(tex.flatStale,true);
  self.flushFlat('1,2');assert.equal(uploads,1,'uploaded once when it has to be shown');self.flushFlat('1,2');assert.equal(uploads,1);
  self.scene.relief=null;self.uploadFlat(tex);assert.equal(uploads,2,'no relief: uploaded at once');
});
