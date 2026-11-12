import test from 'node:test';
import assert from 'node:assert/strict';
import { stepSpeed } from '../src/ui/SpeedControls.js';
test('m-klavesy-rychlost: + and − step pause ↔ 1× ↔ 2× ↔ 3× without wrapping', () => {
  assert.equal(stepSpeed(true,2,1),1);assert.equal(stepSpeed(false,1,1),2);assert.equal(stepSpeed(false,3,1),3);
  assert.equal(stepSpeed(false,3,-1),2);assert.equal(stepSpeed(false,1,-1),0);assert.equal(stepSpeed(true,1,-1),0);
});
test('m-sklady-co-patri: a store lists what it takes, also at 0, and names the missing maker', async () => {
  const { storeAccepts } = await import('../src/ui/StoragePanel.js');
  const scene={buildings:[{type:'lumberjack_hut'}]},rows=storeAccepts(scene,{allowed:['pitch','torch'],stock:{torch:3}});
  assert.deepEqual(rows,[{resource:'pitch',count:0,missing:'pitch_kiln'},{resource:'torch',count:3,missing:'pitch_kiln'}]);
  assert.equal(storeAccepts(scene,{allowed:['wood'],stock:{}})[0].missing,null);
});
