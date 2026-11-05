import test from 'node:test';
import assert from 'node:assert/strict';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { visibilityProfile,subjectSight } from '../src/systems/VisibilityModifiers.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

const king=(x=10.5,y=10.5)=>({definition:objectRegistry.require('king'),state:'ground',position:{x,y}});
const subject=(id,x,y)=>({id,definition:objectRegistry.require('peasant'),position:{x,y},isAlive:true});
function world(subjects){const fog=new FogOfWarSystem(king(),true);fog.registerSource('subjects',()=>subjects.filter(s=>s.isAlive).map(subjectSight));return fog;}
// The set a from-scratch union of circles would give, to check the incremental counts against.
const expected=(fog)=>{const set=new Set();for(const s of fog.sources)for(const i of fog.circle(s))set.add(i);return set;};

test('a walking king sees radius 10; every subject sees diameter 15 (radius 7.5), 75 % of the king',()=>{
  assert.equal(visibilityProfile(king()).radius,10);
  const s=subjectSight(subject('worker-1',30.2,40.9));
  assert.deepEqual([s.size,s.radius,s.center],[15,7.5,{x:30.5,y:40.5}]);
  const fog=world([subject('worker-1',50.5,50.5)]);
  assert.equal(fog.isInSightTile({x:57,y:50}),true);assert.equal(fog.isInSightTile({x:58,y:50}),false);
  assert.equal(fog.isInSightTile({x:50,y:43}),true);assert.equal(fog.isInSightTile({x:50,y:42}),false);
});

test('a subject that walks away leaves only memory behind; several moving subjects and the king combine correctly',()=>{
  const a=subject('worker-1',50.5,50.5),b=subject('worker-2',53.5,50.5),fog=world([a,b]);
  assert.equal(fog.isInSightTile({x:58,y:50}),true,'the second subject extends the shared sight');
  a.position={x:80.5,y:80.5};fog.update();
  assert.equal(fog.isInSightTile({x:44,y:50}),false,'the first circle is gone once its subject leaves');assert.ok(fog.removed.includes(50*100+44));
  assert.equal(fog.isInSightTile({x:50,y:50}),true,'still lit by the other subject');
  b.position={x:20.5,y:80.5};fog.update();
  assert.equal(fog.isInSightTile({x:50,y:50}),false);assert.deepEqual(fog.visibleIndices,expected(fog));
  for(let step=0;step<40;step++){a.position={x:80.5-step,y:80.5};b.position={x:20.5+step*.7,y:80.5-step*.3};fog.character.position={x:10.5+step,y:10.5+step};fog.update();assert.deepEqual(fog.visibleIndices,expected(fog));}
});

test('a new arrival registers its sight at once; death or emigration releases it',()=>{
  const people=[subject('worker-1',50.5,50.5)],fog=world(people);
  people.push(subject('worker-2',80.5,20.5));fog.update();assert.equal(fog.isInSightTile({x:80,y:20}),true);
  people[1].isAlive=false;fog.update();assert.equal(fog.isInSightTile({x:80,y:20}),false);
  people.splice(0,1);fog.update();assert.equal(fog.isInSightTile({x:50,y:50}),false);
  assert.deepEqual(fog.visibleIndices,expected(fog));assert.equal(fog.coverage.reduce((sum,count)=>sum+count,0),fog.circle(fog.sources[0]).length,'only the king is counted');
});

test('walking within one tile changes nothing; 200 moving subjects stay fast',()=>{
  const people=Array.from({length:200},(_,i)=>subject(`worker-${i}`,5.5+(i%20)*4.5,5.5+Math.floor(i/20)*9)),fog=world(people);
  const revision=fog.revision;for(const p of people)p.position={x:p.position.x+.3,y:p.position.y-.3};fog.update();
  assert.equal(fog.revision,revision,'no recalculation while every subject stays on its tile');
  const started=performance.now();
  for(let frame=0;frame<60;frame++){for(const [i,p]of people.entries())if(i%3===frame%3)p.position={x:Math.min(99.5,p.position.x+1),y:p.position.y};fog.update();}
  const elapsed=performance.now()-started;assert.deepEqual(fog.visibleIndices,expected(fog));
  assert.ok(elapsed<400,`60 frames with a third of 200 subjects changing tile took ${elapsed.toFixed(0)} ms`);
});
