import test from 'node:test';
import assert from 'node:assert/strict';
import { BattleMarks,BATTLE_MARKS,validBattleMarks } from '../src/systems/BattleMarks.js';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';

globalThis.document??={querySelector(){return {};}};
const day=600000,clock={totalElapsed:0,dayDuration:day};
const marks=()=>new BattleMarks({gameTime:clock});
const soldier=(x,y,look='army-recruit',facing='E')=>({id:`u${x}`,position:{x,y},view:{look,facing}});

test('point 69: the dead lie where they fell for three days; a procedural figure leaves only blood', () => {
  clock.totalElapsed=0;const m=marks();assert.ok(m.addCorpse(soldier(10.5,20.5)));assert.equal(m.corpses.length,1);assert.equal(m.stains.length,1,'a pool under the body');
  assert.equal(m.addCorpse({id:'w',position:{x:3,y:3},view:{look:null}}),null);
  clock.totalElapsed=3*day-1000;m.check=0;m.update(16);assert.equal(m.corpses.length,1,'still there on the third day');
  clock.totalElapsed=3*day+10;m.check=0;m.update(16);assert.equal(m.corpses.length,0,'gone after three days');
});

test('wounds leave stains, at most one per unit every 450 ms; they fade out within two days', () => {
  clock.totalElapsed=0;const m=marks(),u=soldier(5,5);
  assert.ok(m.addStain(u));assert.equal(m.addStain(u),null);clock.totalElapsed=500;assert.ok(m.addStain(u));assert.equal(m.stains.length,2);
  clock.totalElapsed=2*day+600;m.check=0;m.update(16);assert.equal(m.stains.length,0);
  for(let i=0;i<BATTLE_MARKS.maxStains+20;i++)m.addStain({id:i,position:{x:1,y:1}},null,true);assert.equal(m.stains.length,BATTLE_MARKS.maxStains,'old stains give way');
});

test('bodies and stains are saved, loaded and strictly validated', () => {
  const s=workerScene();s.battleMarks=new BattleMarks(s);s.battleMarks.addCorpse(soldier(30.5,31.5,'army-archer','NW'));s.battleMarks.addStain(soldier(30,31));
  const data=validateGameState(serializeGameState(s));assert.equal(data.battleMarks.corpses[0].look,'army-archer');assert.equal(data.battleMarks.corpses[0].facing,'NW');
  const r=workerScene();r.battleMarks=new BattleMarks(r);loadGameState(r,structuredClone(data));assert.deepEqual(r.battleMarks.exportState(),data.battleMarks);
  assert.ok(!validBattleMarks({corpses:[{x:1,y:1,at:0,look:'a',facing:'Q'}],stains:[]}));assert.ok(!validBattleMarks({corpses:[],stains:[{x:1,y:1,at:0,size:9}]}));assert.ok(!validBattleMarks({corpses:[],stains:[],extra:1}));
  assert.throws(()=>validateGameState({...data,battleMarks:{corpses:'x',stains:[]}}));
  const empty=workerScene();empty.battleMarks=new BattleMarks(empty);assert.equal(serializeGameState(empty).battleMarks,undefined,'nothing saved when there is nothing');
});
