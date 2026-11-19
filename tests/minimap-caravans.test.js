import test from 'node:test';
import assert from 'node:assert/strict';
import { minimapCaravans,CARAVAN_MARKS } from '../src/ui/Minimap.js';

// Owner 19 Nov 2026 (77): caravans move on the minimap; the own one has its own colour.
test('the foreign caravan follows its position and the own one its Wagon only while it gathers',()=>{
  const wagon={id:'vehicle-1',x:10,y:12};
  const scene={caravans:{active:{position:{x:30.5,y:40.5}}},trade:{expedition:{state:{phase:'gathering',wagonId:'vehicle-1'}}},vehicles:{vehicles:new Map([[wagon.id,wagon]]),position:v=>({x:v.x+.5,y:v.y+.5})}};
  assert.deepEqual(minimapCaravans(scene),[{x:30.5,y:40.5,own:false},{x:10.5,y:12.5,own:true}]);
  scene.caravans.active.position={x:31,y:40};assert.equal(minimapCaravans(scene)[0].x,31);
  scene.trade.expedition.state.phase='away';scene.caravans.active=null;assert.deepEqual(minimapCaravans(scene),[]);
  assert.notEqual(CARAVAN_MARKS.own,CARAVAN_MARKS.foreign);
});
