// m-noseni-zamestnanci (owner 15 Nov 2026): a Hauler carries twice the hand load; a producer's worker waits half a game
// day for a Hauler to bring inputs, then fetches them himself; outputs still go after a moment.
import test from 'node:test';
import assert from 'node:assert/strict';
import { LogisticsTaskManager } from '../src/systems/LogisticsTaskManager.js';
import { PRODUCER_WAIT,HAULER_LOAD_FACTOR,carryCapacity } from '../src/data/logistics.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

function fake(dayDuration=120000){
  const hauler={profession:'hauler',commandState:null};
  return {scene:{gameTime:{totalElapsed:0,dayDuration},foodProduction:{records:new Map([[7,{nextCycle:1}]])},workerSystem:{liveWorkers:()=>[hauler]}},storage:{locations:new Map(),route:()=>({})},producerWaits:new Map()};
}
const building={id:7,type:'mill',definition:objectRegistry.require('mill')};
test('noseni: inputs wait for a Hauler half a day, outputs a moment; then the worker carries himself',()=>{
  const m=fake(),wait=kind=>LogisticsTaskManager.prototype.waitForHauler.call(m,building,kind);
  assert.equal(wait('input'),true);assert.equal(wait('output'),true);
  m.scene.gameTime.totalElapsed=PRODUCER_WAIT.outputMs+1;assert.equal(wait('output'),false,'outputs: a moment');assert.equal(wait('input'),true,'inputs: still waiting');
  m.scene.gameTime.totalElapsed=60000-1;assert.equal(wait('input'),true);
  m.scene.gameTime.totalElapsed=60000;assert.equal(wait('input'),false,'after half a day the worker fetches it himself');
  m.scene.foodProduction.records.get(7).nextCycle=2;assert.equal(wait('input'),true,'a new batch waits again');
});
test('noseni: a Hauler carries twice what another worker carries',()=>{
  assert.equal(HAULER_LOAD_FACTOR,2);
  for(const r of ['stone','wood','wheat','iron_ore'])assert.equal(carryCapacity({profession:'hauler'},r),2*carryCapacity({profession:'miller'},r),r);
});
// Owner 19 Nov 2026: "zaměstnanci tkalcovny ať si chodí sami pro len do skladu" – no wait for a Hauler for inputs.
test('noseni: weavers fetch Flax themselves at once; outputs still wait a moment for a Hauler',()=>{
  const m=fake(),weaver={id:7,type:'weaver',definition:objectRegistry.require('weaver')},wait=kind=>LogisticsTaskManager.prototype.waitForHauler.call(m,weaver,kind);
  assert.equal(wait('input'),false,'input: goes himself');assert.equal(wait('output'),true,'output: Hauler first');
  const tailor={id:7,type:'tailor',definition:objectRegistry.require('tailor')};assert.equal(LogisticsTaskManager.prototype.waitForHauler.call(fake(),tailor,'input'),true,'tailor unchanged');
});
