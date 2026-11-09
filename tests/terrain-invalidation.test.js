import test from 'node:test';
import assert from 'node:assert/strict';
import { TerrainRenderer } from '../src/game/TerrainRenderer.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

function renderer(){
  const textures=new Map(),context={clearRect(){},beginPath(){},moveTo(){},lineTo(){},closePath(){},save(){},clip(){},fill(){},restore(){}};
  const r=Object.create(TerrainRenderer.prototype);
  Object.assign(r,{map:Array.from({length:100},()=>Array(100).fill(0)),fog:{displayState:()=>0},season:'Spring',dirtyChunks:new Set(['0,0']),dirtyTiles:new Map(),paintStats:{tiles:0,chunks:0},
    scene:{textures:{exists:key=>textures.has(key),get:key=>textures.get(key),createCanvas(key,width,height){const texture={width,height,getContext:()=>context,refresh(){}};textures.set(key,texture);return texture;}}}});
  return r;
}
test('a changed visibility cell repaints one terrain tile instead of the entire cached 100-tile chunk',()=>{
  const r=renderer();r.chunkTexture(0,0);assert.equal(r.paintStats.tiles,100);
  r.invalidateArea([{x:4,y:5}],false);r.chunkTexture(0,0);assert.equal(r.paintStats.tiles,101);assert.equal(r.paintStats.chunks,2);
  assert.equal(r.dirtyChunks.size,0);assert.equal(r.dirtyTiles.size,0);
});
test('shared path neighbours invalidate only their actual cells; a full seasonal reset overrides partial dirtiness',()=>{
  const r=renderer();r.chunkTexture(0,0);r.invalidateArea([{x:4,y:5}]);r.chunkTexture(0,0);assert.equal(r.paintStats.tiles,109);
  r.invalidateArea([{x:4,y:5}],false);r.setSeason('Winter');r.chunkTexture(0,0);assert.equal(r.paintStats.tiles,209);
});

test('several sight updates between renders cannot leave the earlier circle painted fully visible',()=>{
  const king={definition:objectRegistry.require('king'),state:'ground',position:{x:10.5,y:10.5}},fog=new FogOfWarSystem(king,true),r=renderer();
  r.updateFog({},fog);r.dirtyChunks.clear();r.dirtyTiles.clear();
  king.position={x:40.5,y:40.5};fog.update();
  king.position={x:70.5,y:70.5};fog.update();r.updateFog({},fog);
  assert.equal(fog.isVisibleTile({x:10,y:10}),false);
  assert.ok(r.dirtyTiles.get('1,1')?.has(1010),'the first painted circle must be invalidated, even though the last fog delta only describes the middle circle');
  assert.ok(r.dirtyTiles.get('7,7')?.has(7070));
});

test('a legitimate second sight source keeps its tiles lit until that source leaves too',()=>{
  const king={definition:objectRegistry.require('king'),state:'ground',position:{x:10.5,y:10.5}},fog=new FogOfWarSystem(king,true),r=renderer();
  const remove=fog.registerSource('ally',()=>({center:{x:10.5,y:10.5},radius:3}));r.updateFog({},fog);r.dirtyChunks.clear();r.dirtyTiles.clear();
  king.position={x:40.5,y:40.5};fog.update();r.updateFog({},fog);
  assert.equal(fog.isVisibleTile({x:10,y:10}),true);assert.equal(r.dirtyTiles.get('1,1')?.has(1010)??false,false);
  r.dirtyChunks.clear();r.dirtyTiles.clear();remove();king.position={x:70.5,y:70.5};fog.update();r.updateFog({},fog);
  assert.equal(fog.isVisibleTile({x:10,y:10}),false);assert.ok(r.dirtyTiles.get('1,1')?.has(1010));
});

test('an explicit complete transition redraw drains visible chunks while normal live redraw stays bounded',()=>{
 const r=Object.create(TerrainRenderer.prototype),keys=['0,0','1,0','2,0','3,0','4,0','5,0'];let painted=[];
 const image=()=>({setTexture(){return this;},setPosition(){return this;},setVisible(){return this;}});
 Object.assign(r,{scene:{},dirtyTiles:new Map(),neededChunks:keys,chunks:new Map(keys.map(k=>[k,image()])),dirtyChunks:new Set(keys),chunkTexture(x,y){const key=`${x},${y}`;painted.push(key);this.dirtyChunks.delete(key);return {key,x,y};}});
 r.repaintDirty();assert.equal(painted.length,2);assert.equal(r.dirtyChunks.size,4);
 r.invalidateChunksOf(keys.map(k=>{const [x,y]=k.split(',').map(Number);return {x:x*10,y:y*10};}),{immediate:true});r.repaintDirty();assert.equal(r.dirtyChunks.size,0,'paused scenes have no future simulation frames to finish the seasonal redraw');assert.equal(painted.length,8);
 r.dirtyChunks=new Set(keys);painted=[];r.repaintDirty();assert.equal(painted.length,2,'normal live redraw remains bounded');
});

test('fog report 0.83: newly seen ground marks its chunk and the neighbour chunks whose edge ring covers it urgent',()=>{
  const king={definition:objectRegistry.require('king'),state:'ground',position:{x:10.5,y:10.5}},fog=new FogOfWarSystem(king,true),r=renderer();
  r.updateFog({},fog);r.urgentChunks?.clear();
  king.position={x:19.5,y:15.5};fog.update();r.updateFog({},fog);
  // Tiles at x 19 / 20 (chunk border) were seen for the first time: chunk 2,1 paints its ring black-out over them too.
  assert.ok(r.urgentChunks.has('1,1')&&r.urgentChunks.has('2,1'),[...r.urgentChunks].join(' '));
});

test('fog report 0.83: an urgent chunk redraws its fog over the previous ground while the ground repaint has to wait',()=>{
  const r=Object.create(TerrainRenderer.prototype),key='3,4',calls=[];
  const image=()=>({setTexture(){return this;},setPosition(){return this;},setVisible(){return this;}});
  Object.assign(r,{scene:{},dirtyTiles:new Map(),neededChunks:[key],chunks:new Map([[key,image()]]),dirtyChunks:new Set([key]),urgentChunks:new Set([key]),groundStyle:'continuous',composite:{touched:[],touch(k){this.touched.push(k);},sync(){}},
    chunkTexture(x,y){calls.push(this.paintingUrgent);return {key:`${x},${y}`,x,y,painted:!!this.paintingUrgent};}});
  r.repaintDirty();
  assert.deepEqual(calls,[true],'painted at once as urgent');
  assert.deepEqual(r.composite.touched,[key],'a fog-only repaint (chunk still dirty for its ground) still refreshes the composed ground');
  assert.equal(r.dirtyChunks.has(key),true,'the ground repaint stays pending');
});

test('owner 9 Nov: chunks beside unknown land redraw their fog (two a frame) ahead of the ground queue',()=>{
  const r=Object.create(TerrainRenderer.prototype),keys=['0,0','1,0','2,0','3,0'],calls=[];
  const image=()=>({setTexture(){return this;},setPosition(){return this;},setVisible(){return this;}});
  Object.assign(r,{scene:{},dirtyTiles:new Map(),neededChunks:keys,chunks:new Map(keys.map(k=>[k,image()])),dirtyChunks:new Set(keys),groundStyle:'continuous',groundCache:new Map(keys.map(k=>[k,{stamp:'old'}])),fogDirty:new Set(keys),
    chunkTexture(x,y){const key=`${x},${y}`;calls.push([key,!!this.fogOnlyPass]);this.fogDirty.delete(key);return {key,x,y,painted:true};}});
  r.repaintDirty();
  assert.equal(calls.filter(([,fogOnly])=>fogOnly).length,2,'two fog-only repaints this frame');
  assert.equal(r.fogDirty.size,2);r.repaintDirty();assert.equal(r.fogDirty.size,0,'the rest the next frame');
});

test('owner 9 Nov: land leaving sight that was seen before is patched per tile, not queued for a chunk repaint',()=>{
  const king={definition:objectRegistry.require('king'),state:'ground',position:{x:30.5,y:30.5}},fog=new FogOfWarSystem(king,true),r=renderer();
  r.groundStyle='continuous';r.tileData=()=>[0,0,'Spring',0,0];
  // Explore a band first (west to east), so the land the king later leaves is surrounded by known land.
  const seen=()=>{for(const i of fog.visibleIndices)fog.explored[i]=1;}; // MapMemory marks seen land in the game
  for(let x=20;x<=40;x+=2){king.position={x:x+.5,y:30.5};fog.update();seen();r.updateFog({},fog);}
  king.position={x:30.5,y:30.5};fog.update();seen();r.updateFog({},fog);r.dirtyChunks.clear();r.dirtyTiles.clear();r.fogPatch?.clear();
  king.position={x:31.5,y:30.5};fog.update();r.updateFog({},fog);
  const patched=[...(r.fogPatch?.values()??[])].reduce((n,set)=>n+set.size,0);
  assert.ok(patched>0,'tiles that left sight are queued as patches');
  // The smooth memory shading reaches 2 tiles: patched tiles lie within 2 tiles of a tile that changed.
  for(const set of r.fogPatch.values())for(const i of set){const y=Math.floor(i/100);assert.ok(Math.abs(y-30)<=12,`row ${y}`);}
});
