import test from 'node:test';
import assert from 'node:assert/strict';
globalThis.document??={querySelector:()=>null};
const { SANDBOX_UNITS,SANDBOX_COUNTS,tilesAround,sandboxSettings } = await import('../src/game/sandboxMode.js');
const { objectRegistry } = await import('../src/systems/ObjectRegistry.js');
const { UNIT_TYPES } = await import('../src/data/military.js');
test('owner 16 Nov 2026: the Test map offers our units, enemies and animals that exist',()=>{
  for(const u of SANDBOX_UNITS){if(u.unit)assert.ok(UNIT_TYPES[u.unit],u.unit);else assert.equal(objectRegistry.get(u.id)?.category,'animal',u.id);}
  assert.ok(SANDBOX_UNITS.some(u=>u.group==='foes'&&u.id==='raider'));assert.deepEqual(SANDBOX_COUNTS,[1,5,10,25,50]);
  const s=sandboxSettings();assert.equal(s.fogOfWar,false);assert.equal(s.startingCastle,true);assert.equal(s.nightWolves,false);
});
test('Test map: units are put on free tiles around the click',()=>{
  const map=Array.from({length:30},()=>Array(30).fill(0));map[10][11]=1;
  const scene={map,resourceOccupancy:new Map([['9,10','stone']]),workerSystem:{liveWorkers:()=>[{tile:{x:10,y:9}}]},animalSystem:{animals:new Map()}};
  const tiles=tilesAround(scene,{x:10,y:10},12),keys=tiles.map(t=>`${t.x},${t.y}`);
  assert.equal(tiles.length,12);assert.equal(new Set(keys).size,12);assert.ok(!keys.includes('11,10')&&!keys.includes('9,10')&&!keys.includes('10,9'));assert.equal(keys[0],'10,10');
});

test('owner 17 Nov 2026: all four of our ranks on the Test map (the Knight on foot), and the same four as enemies',async()=>{
  const { spawnSandboxUnits }=await import('../src/game/sandboxMode.js');const { workerScene }=await import('./helpers/workerScene.js');
  assert.deepEqual(SANDBOX_UNITS.filter(u=>u.group==='ours').map(u=>u.unit),['soldier','archer','swordsman','knight','halberdier','royal_archer','crossbowman','light_cavalry','catapult','ram','military_wagon']);
  for(const rank of ['soldier','archer','swordsman','knight'])assert.ok(SANDBOX_UNITS.some(u=>u.group==='foes'&&u.id===`enemy_${rank}`),rank);
  const s=workerScene(undefined,{foodProduction:true});assert.equal(spawnSandboxUnits(s,'knight',{x:60,y:60},2),2);
  const knights=s.workerSystem.liveWorkers().filter(w=>s.military.unit(w)?.type==='knight');assert.equal(knights.length,2);
  const w=s.workerSystem.create({x:64,y:64});assert.equal(s.military.enlist(w,'light_cavalry'),false,'in the game Light Cavalry needs a horse');assert.equal(spawnSandboxUnits(s,'light_cavalry',{x:60,y:66},1),1);
});
