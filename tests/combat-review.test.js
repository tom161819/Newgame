import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { freeAround,awayFrom,isHostile } = await import('../src/game/combatSpacing.js');
const { STANCES,MILITARY_RULES } = await import('../src/data/military.js');
const { setSquad,squadMembers } = await import('../src/ui/armySquads.js');

const grid=()=>Array.from({length:20},()=>Array(20).fill(0));
test('combat 16 Nov 2026: melee fighters spread around a target',()=>{
  const map=grid(),target={tile:{x:10,y:10},position:{x:10.5,y:10.5}},other={isAlive:true,tile:{x:11,y:10},path:[]};
  const scene={map,workerSystem:{liveWorkers:()=>[other]},animalSystem:{animals:new Map()},character:null};
  const free=freeAround(scene,target,null);assert.ok(free.length>0);assert.ok(!free.some(t=>t.x===11&&t.y===10),'a taken tile is left out');
  const away=awayFrom({map},{x:10,y:10},{x:12,y:10},5);assert.ok(away.length&&away.every(t=>t.x<10),'steps away from the danger');
  assert.ok(isHostile({type:'wolf'})&&isHostile({definition:{gameplay:{hostile:true}}})&&!isHostile({type:'horse',definition:{gameplay:{}}}));
});
test('combat 16 Nov 2026: stances and retreat rules',()=>{
  assert.deepEqual(Object.keys(STANCES),['aggressive','defensive','hold']);
  assert.ok(STANCES.hold.hold&&!STANCES.hold.retreat&&STANCES.defensive.engage<STANCES.aggressive.engage);
  assert.ok(MILITARY_RULES.retreatBelow<MILITARY_RULES.retreatUntil);
});
test('combat 16 Nov 2026: number-key groups (one soldier is enough; others leave the group)',()=>{
  const w=(id,p='soldier')=>({id,isAlive:true,profession:p});const a=w('a'),b=w('b'),c=w('c'),cook=w('d','cook');
  const scene={workerSystem:{liveSubjects:()=>[a,b,c,cook]}};
  assert.equal(setSquad(scene,[a,b],3),2);assert.deepEqual(squadMembers(scene,3).map(x=>x.id),['a','b']);
  assert.equal(setSquad(scene,[c,cook],3),1);assert.deepEqual(squadMembers(scene,3).map(x=>x.id),['c']);assert.equal(a.squad,undefined);
  assert.equal(setSquad(scene,[a],0),0);
});
