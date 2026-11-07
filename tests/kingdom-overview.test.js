import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { kingdomOverview,HelpArrow,helpSeen } from '../src/ui/KingdomOverview.js';
import { KingdomAttractivenessSystem } from '../src/systems/KingdomAttractivenessSystem.js';
globalThis.document??={querySelector:()=>({textContent:''})};

test('the overview counts residents against housing room and the unemployed, and averages the needs, mood and attractiveness', () => {
  const s=workerScene(undefined,{workplaces:true});s.attractiveness=new KingdomAttractivenessSystem(s);
  const people=[0,1,2].map(i=>s.workerSystem.create({x:40+i,y:40}));s.workerSystem.jobs.assign(people[0],'hauler');s.needs.update?.(0);
  const o=kingdomOverview(s);assert.equal(o.population,3);assert.equal(o.capacity,s.workerSystem.capacity());assert.equal(o.unemployed,2);
  for(const k of ['happiness','food','rest','housing','safety'])assert.ok(Number.isInteger(o[k])&&o[k]>=0&&o[k]<=100,k);
  assert.ok(['happy','neutral','unhappy','critical'].includes(o.mood));assert.equal(o.attractiveness,Math.round(s.attractiveness.value));
  Object.defineProperty(s.foodSystem,'shortage',{get:()=>true,configurable:true});assert.ok(kingdomOverview(s).factors.some(([id,v])=>id==='food'&&v===-40),'a food shortage shows as a factor');
});

test('the help arrow shows until the help is opened once (kept) or the first 10 minutes are over', () => {
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)};
  const listeners=[],arrow={hidden:true},button={hidden:false,addEventListener:(type,fn)=>listeners.push(fn)},doc={querySelector:id=>id==='#help-arrow'?arrow:id==='#help-toggle'?button:null};
  const scene={gameTime:{totalElapsed:0}},help=new HelpArrow(scene,{document:doc,storage});assert.equal(arrow.hidden,false,'shown at the start');
  scene.gameTime.totalElapsed=11*60000;help.update();assert.equal(arrow.hidden,true,'gone after 10 minutes');
  scene.gameTime.totalElapsed=0;help.update();assert.equal(arrow.hidden,false);listeners[0]();assert.equal(arrow.hidden,true,'opening the help hides it');assert.equal(helpSeen(storage),true);
  const again=new HelpArrow({gameTime:{totalElapsed:0}},{document:doc,storage});void again;assert.equal(arrow.hidden,true,'and it never comes back (e.g. after Load)');
});
