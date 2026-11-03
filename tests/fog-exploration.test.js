import test from 'node:test';
import assert from 'node:assert/strict';
import { FogOfWarSystem,VISIBILITY,FOG_STYLE } from '../src/systems/FogOfWarSystem.js';
import { MapMemory } from '../src/systems/MapMemory.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

function world(){
  const king={definition:objectRegistry.require('king'),state:'ground',position:{x:20.5,y:20.5}};
  const fog=new FogOfWarSystem(king,true),memory=new MapMemory(fog),grid=Array.from({length:100},()=>Array(100).fill(0));
  return {king,fog,memory,grid};
}

test('exploration distinguishes exact current sight, persistent discovery and never-seen tiles',()=>{
  const {king,fog}=world(),old={x:20,y:20},next={x:50,y:50},corner={x:30,y:30};
  assert.equal(fog.state(old),VISIBILITY.VISIBLE);assert.equal(fog.state(next),VISIBILITY.UNEXPLORED);
  assert.equal(fog.state(corner),VISIBILITY.UNEXPLORED);
  king.position={x:50.5,y:50.5};fog.update();
  assert.equal(fog.state(old),VISIBILITY.EXPLORED);assert.equal(fog.state(next),VISIBILITY.VISIBLE);
  assert.equal(fog.state({x:-1,y:20}),VISIBILITY.UNEXPLORED);
  assert.equal(fog.explored.reduce((sum,value)=>sum+value,0),634);
});

test('both runtime display switches preserve the exact exploration history',()=>{
  const {fog}=world(),unknown={x:90,y:90},before=Array.from(fog.explored);
  fog.setExplorationEnabled(false);assert.equal(fog.displayState(unknown),VISIBILITY.EXPLORED);
  assert.equal(fog.state(unknown),VISIBILITY.UNEXPLORED);assert.equal(fog.isVisibleTile(unknown),false);
  fog.setEnabled(false);assert.equal(fog.displayState(unknown),VISIBILITY.VISIBLE);assert.equal(fog.isVisibleTile(unknown),true);
  fog.setExplorationEnabled(true);assert.equal(fog.displayState(unknown),VISIBILITY.VISIBLE);
  assert.deepEqual(Array.from(fog.explored),before);
  fog.setEnabled(true);assert.equal(fog.displayState(unknown),VISIBILITY.UNEXPLORED);
  assert.deepEqual(Array.from(fog.explored),before);
  assert.ok(FOG_STYLE.brightness>=.25&&FOG_STYLE.brightness<=.35);assert.ok(FOG_STYLE.saturation<=.25);
});

test('terrain memory freezes discovered terrain, paths and seasons until ordinary sight returns',()=>{
  const {king,fog,memory,grid}=world(),tile={x:22,y:20},index=2022;let level=0;
  const wear={level:()=>level};grid[20][22]=1;
  const changed=memory.observeTerrain(grid,wear,'Spring');assert.ok(changed.some(t=>t.x===22&&t.y===20));
  assert.deepEqual(memory.terrainAt(tile,grid,wear,'Spring'),[1,0,'Spring',0]);
  king.position={x:80.5,y:80.5};fog.update();grid[20][22]=0;level=3;
  memory.observeTerrain(grid,wear,'Winter');assert.deepEqual(memory.terrain.get(index),[1,0,'Spring',0]);
  assert.deepEqual(memory.terrainAt(tile,grid,wear,'Winter'),[1,0,'Spring',0]);
  fog.setEnabled(false);memory.observeTerrain(grid,wear,'Winter');assert.equal(memory.terrain.get(index)[0],1);
  assert.equal(memory.terrainAt(tile,grid,wear,'Winter')[0],0);
  fog.setEnabled(true);assert.equal(memory.terrainAt(tile,grid,wear,'Winter')[0],1);
  king.position={x:22.5,y:20.5};fog.update();memory.observeTerrain(grid,wear,'Winter');
  assert.equal(memory.terrain.get(index)[0],0);assert.equal(memory.terrain.get(index)[1],3);assert.equal(memory.terrain.get(index)[2],'Winter');
});

test('terrain memory never records unknown areas while exploration or fog display is disabled',()=>{
  const {fog,memory,grid}=world();fog.setEnabled(false);fog.setExplorationEnabled(false);
  memory.observeTerrain(grid,null,'Summer');assert.equal(memory.terrain.size,317);assert.equal(memory.terrain.has(9090),false);
  const revision=memory.revision;assert.deepEqual(memory.observeTerrain(grid,null,'Summer'),[]);assert.equal(memory.revision,revision);
});
