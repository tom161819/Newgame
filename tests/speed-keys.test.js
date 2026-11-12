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
test('m-okno-budovy-sklad: a building lists its own stores – input and output of a workshop, the pile of a producer', async () => {
  const { ownStoreRows } = await import('../src/ui/WorkplacePanel.js');
  const locs=[{id:'input-5',buildingId:5,kind:'input',capacity:20,allowed:['wheat'],stock:{wheat:4}},{id:'output-5',buildingId:5,kind:'output',capacity:20,allowed:['flour'],stock:{flour:20}},{id:'granary-1',buildingId:1,kind:'storage',capacity:100,allowed:['wheat'],stock:{}}];
  const storage={locations:new Map(locs.map(l=>[l.id,l])),isStock:l=>l.kind==='storage',used:l=>Object.values(l.stock).reduce((a,b)=>a+b,0),incoming:(id,r)=>id==='input-5'&&r==='wheat'?2:0,reserved:()=>0};
  const rows=ownStoreRows({foodStorage:storage},{id:5});
  assert.deepEqual(rows.map(r=>[r.kind,r.used,r.full]),[['input',4,false],['output',20,true]]);assert.deepEqual(rows[0].goods,[{resource:'wheat',amount:4,incoming:2,reserved:0}]);
});
