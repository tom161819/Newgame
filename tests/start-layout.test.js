import test from 'node:test';
import assert from 'node:assert/strict';
import { tileGap,kingStartTile,STARTER_STOCKPILE_GAP } from '../src/systems/WorldGenerationConfig.js';

// Owner 15 Nov 2026 (60, 62): the Starter Stockpile keeps 2 free tiles from the Castle; the King starts in front of it.
test('tileGap counts the free tiles between two footprints (diagonal too)',()=>{
  const d={width:4,height:4},s={width:2,height:2};
  assert.equal(tileGap({x:0,y:0},d,{x:4,y:0},s),0,'touching');assert.equal(tileGap({x:0,y:0},d,{x:6,y:1},s),2);
  assert.equal(tileGap({x:0,y:0},d,{x:6,y:6},s),2,'diagonal: the larger of the two gaps');assert.equal(tileGap({x:6,y:6},s,{x:0,y:0},d),2,'symmetric');
  assert.equal(STARTER_STOCKPILE_GAP,2);
});
test('the King starts on a free reachable tile in front of the Castle',()=>{
  const map=Array.from({length:30},()=>Array(30).fill(0)),castle={type:'castle',x:10,y:10,definition:{width:4,height:4},tiles:[]};
  for(let y=10;y<14;y++)for(let x=10;x<14;x++){castle.tiles.push({x,y});map[y][x]=1;}
  const scene={map,buildings:[castle]},tile=kingStartTile(scene,{x:9,y:9});
  assert.deepEqual(tile,{x:14,y:14},'just past the bottom corner, on the camera side');
  map[tile.y][tile.x]=1;const next=kingStartTile(scene,{x:9,y:9});assert.notDeepEqual(next,tile,'a blocked tile is skipped');
});
