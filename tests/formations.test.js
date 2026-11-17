import test from 'node:test';
import assert from 'node:assert/strict';
import { formationShape,formationOffsets,formationTiles,assignFormation,FORMATIONS } from '../src/game/formations.js';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';

globalThis.document??={querySelector(){return {};}};
const open=()=>true,key=t=>`${t.x},${t.y}`;

test('formation shapes: a line two deep, a block about square, a wedge with a point', () => {
  assert.deepEqual(formationShape('line',12),[6,6]);
  assert.deepEqual(formationShape('block',12),[5,5,2]);
  assert.deepEqual(formationShape('wedge',9),[1,3,5]);
  for(const f of FORMATIONS.filter(f=>f!=='loose'))for(const n of [2,7,30,50])assert.equal(formationShape(f,n).reduce((a,b)=>a+b,0),n,`${f} ${n}`);
});

test('the places turn with the facing: the front rank across it, the next ranks behind', () => {
  const east=formationTiles('line',6,{x:20,y:20},{x:1,y:0},open);
  assert.equal(new Set(east.map(key)).size,6);
  assert.ok(east.filter(t=>t.rank===0).every(t=>t.x===20)&&east.filter(t=>t.rank===1).every(t=>t.x===19),'front at x 20, second rank behind it');
  const south=formationTiles('line',6,{x:20,y:20},{x:0,y:1},open);assert.ok(south.filter(t=>t.rank===0).every(t=>t.y===20)&&south.filter(t=>t.rank===1).every(t=>t.y===19));
  const diagonal=formationTiles('block',9,{x:20,y:20},{x:1,y:1},open);assert.equal(new Set(diagonal.map(key)).size,9,'diagonal places stay apart');
  const o=formationOffsets('wedge',4,{x:0,y:-1});assert.deepEqual([o[0].x,o[0].y],[0,0]);assert.ok(o.slice(1).every(p=>p.y>0),'the wedge widens behind its point');
});

test('blocked tiles are skipped for the nearest free ones', () => {
  const tiles=formationTiles('block',9,{x:10,y:10},{x:1,y:0},(x,y)=>x!==10);
  assert.equal(tiles.length,9);assert.ok(tiles.every(t=>t.x!==10));assert.equal(new Set(tiles.map(key)).size,9);
});

test('shields in front, archers at the back, and nobody crosses within his rank', () => {
  const men=[{id:'a',attackRange:4,tile:{x:5,y:0}},{id:'b',armor:2,tile:{x:5,y:3}},{id:'c',tile:{x:5,y:1}},{id:'d',armor:2,tile:{x:5,y:-2}}];
  const tiles=formationTiles('line',4,{x:10,y:0},{x:1,y:0},open),place=assignFormation(men,tiles,{x:1,y:0});
  assert.equal(place.get(men[0]).rank,1);assert.equal(place.get(men[1]).rank,0);assert.equal(place.get(men[3]).rank,0);
  assert.ok(place.get(men[3]).y<place.get(men[1]).y,'the one on the left stays on the left');
});

test('a formation order sends the men to its places and they face its way when they stand', () => {
  const s=workerScene(undefined,{gameSettings:gameSettings({fogOfWar:false})}),ws=[0,1,2,3,4,5].map(i=>s.workerSystem.create({x:60+(i%3),y:60+(i/3|0)}));
  const c=s.workerSystem.commands;assert.equal(c.move(ws,{x:70,y:62},{formation:'line',facing:{x:0,y:1}}),6);
  const goals=ws.map(w=>w.commandState.goal);assert.equal(goals.filter(g=>g.y===62).length,3);assert.equal(goals.filter(g=>g.y===61).length,3);
  for(let n=0;n<600&&!ws.every(w=>w.commandState.state==='Holding');n++)s.tick(50);
  assert.ok(ws.every(w=>w.commandState.state==='Holding'));assert.ok(ws.every(w=>w.holdFace==='S'));
  assert.deepEqual(Object.keys(ws[0].commandState).sort(),['goal','state'],'the save still sees only state and goal');
});
