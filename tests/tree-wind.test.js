import test from 'node:test';
import assert from 'node:assert/strict';
import { TREE_WIND } from '../src/data/objects/treeWind.js';
import { windFrame } from '../src/render/treeWind.js';

test('m-duby-vitr: trees do not move in step – phase and pace come from the tile; every frame is used',()=>{
  assert.equal(TREE_WIND.frames,12);assert.deepEqual(Object.keys(TREE_WIND.sheets).sort(),['oak_tree','pine_tree']);
  const frames=new Set();for(let x=0;x<20;x++)frames.add(windFrame({x,y:3},1234));assert.ok(frames.size>=6,'neighbours show different frames at the same moment');
  const seen=new Set();for(let t=0;t<TREE_WIND.periodMs*1.2;t+=50)seen.add(windFrame({x:5,y:5},t));assert.equal(seen.size,TREE_WIND.frames);
});
