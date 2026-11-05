import test from 'node:test';
import assert from 'node:assert/strict';
import { unknownFogSeam } from '../scripts/fog-sampling.mjs';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
const king={x:50,y:50},camera={scrollX:2600,scrollY:1344,width:1200,height:800,zoom:.9};
const fog=()=>new FogOfWarSystem({tile:king,position:{x:50.5,y:50.5},definition:{gameplay:{baseSight:20}}},true);

test('the original fixed seam may be seen by a subject; the black-pixel fixture chooses actual unknown neighbours',()=>{
 const f=fog();f.registerSource('subjects',()=>[{id:'worker',center:{x:55.5,y:47.5},radius:7.5}]);f.update();assert.equal(f.state({x:59,y:42}),2);
 const chosen=unknownFogSeam(f,camera,king);assert.ok(chosen.neighbors.every(t=>f.state(t)===0));assert.notDeepEqual(chosen.tile,{x:59,y:42});assert.ok(chosen.screen.x>=0&&chosen.screen.x<camera.width&&chosen.screen.y>=0&&chosen.screen.y<camera.height);
});
test('remembered ground is not treated as unexplored, and lack of a valid sample fails the fixture',()=>{
 const f=fog();f.explored.fill(1);assert.throws(()=>unknownFogSeam(f,camera,king),/genuinely unexplored/);
});
test('unknown ground outside the viewport is not sampled as a canvas pixel',()=>{
 const f=fog();assert.throws(()=>unknownFogSeam(f,{...camera,scrollX:0,scrollY:0},king),/on-screen/);
});

test('removing subject sight still leaves explored memory; a remembered fixed corner is not a black sample',()=>{
 const f=fog();f.registerSource('subjects',()=>[{id:'worker',center:{x:55.5,y:47.5},radius:7.5}]);for(const index of f.visibleIndices)f.explored[index]=1;f.providers.delete('subjects');f.update();assert.equal(f.state({x:59,y:42}),1);
 const chosen=unknownFogSeam(f,camera,king);assert.notDeepEqual(chosen.tile,{x:59,y:42});assert.ok(chosen.neighbors.every(t=>f.state(t)===0));
});
