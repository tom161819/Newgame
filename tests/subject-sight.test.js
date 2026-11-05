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
  // Subjects walk about three tiles a second, so at 60 frames each changes tile roughly every 20 frames; 200 subjects
  // then move 10 circles per frame. The previous algorithm recounted every circle and diffed the whole set each frame.
  const move=frame=>{for(const [i,p]of people.entries())if(i%20===frame%20)p.position={x:p.position.x+(frame%40<20?1:-1),y:p.position.y};};
  const previous=()=>{let last=new Set();return ()=>{const next=expected(fog);[...next].filter(i=>!last.has(i));[...last].filter(i=>!next.has(i));last=next;};};
  const time=step=>{const started=performance.now();for(let frame=0;frame<120;frame++){move(frame);step();}return performance.now()-started;};
  const elapsed=time(()=>fog.update());assert.deepEqual(fog.visibleIndices,expected(fog));
  const recount=previous(),baseline=time(()=>{fog.update();recount();})-elapsed;
  assert.ok(elapsed<baseline,`incremental ${elapsed.toFixed(0)} ms vs previous full recount ${baseline.toFixed(0)} ms for 120 frames of 200 walking subjects`);
});
