import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { OAK_WIND } from '../src/data/objects/oakWind.js';
import { windFrame,windPart } from '../src/render/oakWind.js';
import { APPROVED_TREE_ART } from '../src/data/objects/approvedArt.js';

test('m-duby-vitr: a wind sheet for every oak look and season; sizes match the views and frames',()=>{
  for(const look of ['young','broad','grand'])for(const season of ['spring','summer','autumn','winter']){
    const s=OAK_WIND.sheets[`${look}-${season}`];assert.ok(s,`${look}-${season}`);assert.deepEqual(s.views,[0,90,180,270]);
    const buf=readFileSync(new URL(`../public${s.sprite}`,import.meta.url));assert.equal(buf.readUInt32BE(16),s.frameWidth*OAK_WIND.frames);assert.equal(buf.readUInt32BE(20),s.frameHeight*4);
    for(const view of s.views)assert.ok(APPROVED_TREE_ART.oak_tree[`${look}-${season}-${view}`]);
  }
});
test('m-duby-vitr: trees do not move in step – phase and pace come from the tile',()=>{
  assert.deepEqual(windPart('grand-autumn-270'),{name:'grand-autumn',view:270});assert.equal(windPart('winter'),null);
  const frames=new Set();for(let x=0;x<20;x++)frames.add(windFrame({x,y:3},1234));assert.ok(frames.size>=6,'neighbours show different frames at the same moment');
  const seen=new Set();for(let t=0;t<OAK_WIND.periodMs*1.2;t+=50)seen.add(windFrame({x:5,y:5},t));assert.equal(seen.size,OAK_WIND.frames,'every frame is used');
});
