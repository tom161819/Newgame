import test from 'node:test';
import assert from 'node:assert/strict';
import { buildingReachable } from '../src/game/fogReach.js';

// Owner 19 Nov 2026 (80): an own building or blueprint opens in any fog; an enemy one needs explored ground.
const fog=(explored=[])=>{const f={enabled:true,width:10,explored:new Uint8Array(100),isVisibleObject:()=>false};for(const [x,y]of explored)f.explored[y*10+x]=1;return f;};
test('own buildings and blueprints are reachable in grey and black fog; enemy ones only on explored ground',()=>{
  const own={tiles:[{x:2,y:2}]},site={tiles:[{x:3,y:3}],construction:{}},enemy={enemy:true,tiles:[{x:5,y:5}]};
  for(const b of [own,site])assert.equal(buildingReachable(fog(),b),true);
  assert.equal(buildingReachable(fog(),enemy),false);assert.equal(buildingReachable(fog([[5,5]]),enemy),true);
  assert.equal(buildingReachable({enabled:false},enemy),true);assert.equal(buildingReachable(null,enemy),true);
});
