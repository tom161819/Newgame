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
