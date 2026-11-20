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

// Owner 19 Nov 2026 (82): a square per neighbouring map with '?' or the found icon, the march time and the lock.
test('zone squares show the find, the hours of the march and open only with Castle 3 and Barracks',async()=>{
  const { minimapZoneMarks }=await import('../src/ui/Minimap.js');const { SCOUTING }=await import('../src/data/scouting.js');
  const scouting={zones:{e:{day:1,type:'forest'}},party:{zone:'n',phase:'away',at:6000,ids:['s0'],since:0},blocker:()=>null};
  const scene={scouting,gameTime:{totalElapsed:0,dayDuration:24000}};let marks=minimapZoneMarks(scene);
  assert.equal(marks.length,SCOUTING.zones.length);const by=id=>marks.find(m=>m.id===id);
  assert.equal(by('e').label,'🌲');assert.equal(by('w').label,'?');assert.equal(by('n').hours,6);assert.match(by('n').label,/6/);assert.ok(marks.every(m=>m.enabled));
  assert.deepEqual([by('n').sx,by('n').sy],[0,-2]);assert.deepEqual([by('e').sx,by('e').sy],[2,0]);
  scouting.party.phase='there';marks=minimapZoneMarks(scene);assert.equal(by('n').hours,null);
  scouting.blocker=()=>'barracks';assert.ok(minimapZoneMarks(scene).every(m=>!m.enabled));
});
