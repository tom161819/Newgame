import test from 'node:test';
import assert from 'node:assert/strict';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { topology } from '../src/game/pathV2.js';
import { topology as labTopology } from '../studio/src/path-lab/v2.js';

const walker=()=>({definition:{category:'character'},state:'ground',path:[]});
function wear(){const map=Array.from({length:10},()=>Array(10).fill(0));return new PathWearSystem({map,terrain:map,time:{day:1,onNewDay:()=>()=>{}}});}

test('owner 9 Nov: a short idle step between waiting spots wears no path, a real trip does', () => {
  const w=wear(),idle=walker(),busy=walker();
  idle.path=[{x:2,y:2}];idle.idleStep=idle.path;
  for(let i=0;i<50;i++)w.enter(idle,{x:2,y:2});
  assert.equal(w.scores[w.index({x:2,y:2})],0);
  idle.path=[{x:5,y:5}]; // a new task route replaces the idle step
  w.enter(idle,{x:3,y:3});busy.path=[{x:3,y:3}];w.enter(busy,{x:3,y:3});
  assert.equal(w.scores[w.index({x:3,y:3})],2);
});

test('owner 9 Nov: only bare soil (level 2+) forms an area; trampled grass stays lines, in the game and the Path Lab', () => {
  for(const topo of [topology,labTopology]){
    const grid=level=>({size:8,get:(x,y)=>x>=2&&x<=4&&y>=2&&y<=4?level:0});
    assert.equal(topo(grid(1)).areas.length,0,'a 3 × 3 block of level 1 is no area');
    assert.equal(topo(grid(2)).areas.length,9,'a 3 × 3 block of soil is an area');
  }
});
