import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState,IncompatibleSaveError,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { exportSaveFile,parseSaveFile,saveFileName,SaveFileError,SAVE_FILE_FORMAT,SAVE_FILE_MAX_BYTES } from '../src/systems/SaveTransfer.js';
globalThis.document={querySelector:()=>({textContent:''})};

// N05 (#36): a stored save moves between devices as one JSON file and back into a new slot.
const settings=()=>gameSettings({startingStone:20,startingWood:10});
function busyWorld(){
  const s=workerScene(undefined,{construction:true,logistics:true,seasons:true,gameSettings:settings()});
  const h=s.workerSystem.create({x:48,y:52});s.workerSystem.jobs.assign(h,'hauler');s.dropSystem.create('stone',{x:46,y:50},6);
  for(let n=0;n<40000&&!h.cargo;n+=25)s.tick(25);assert.ok(h.cargo||h.workTask,'a transport is under way');return s;
}
const record=state=>({id:'slot-1',name:'Království — Day 1',createdAt:'2026-11-05T10:00:00.000Z',updatedAt:'2026-11-05T10:05:00.000Z',day:state.time.day,playTime:state.time.totalElapsed,saveVersion:state.saveVersion,state});

test('export → import → load restores the exact world: stock, reservations, units, cargo, time, weather and production',()=>{
  const s=busyWorld(),state=validateGameState(serializeGameState(s)),text=exportSaveFile(record(state),{gameVersion:'0.3.0',now:new Date('2026-11-05T12:00:00Z')});
  const file=JSON.parse(text);assert.equal(file.format,SAVE_FILE_FORMAT);assert.equal(file.saveVersion,SAVE_VERSION);assert.equal(file.gameVersion,'0.3.0');assert.equal(file.exportedAt,'2026-11-05T12:00:00.000Z');assert.equal(file.save.name,'Království — Day 1');
  const imported=parseSaveFile(text);assert.equal(imported.id,'slot-1');assert.equal(imported.name,'Království — Day 1');assert.deepEqual(imported.state,state);
  const r=workerScene(undefined,{construction:true,logistics:true,seasons:true,starter:false,gameSettings:settings()});loadGameState(r,imported.state);assert.deepEqual(serializeGameState(r),state);
  assert.ok(state.foodStorage.reservations.length>0||state.workers.some(w=>w.cargo),'the roundtrip covered live bookings or cargo');
  assert.equal(saveFileName(record(state)),'medieval-kingdom-kralovstvi-day-1.json');assert.equal(saveFileName({name:'***'}),'medieval-kingdom-kingdom.json');
});
test('corrupt, foreign, oversize or damaged files are rejected with a clear error',()=>{
  const state=validateGameState(serializeGameState(busyWorld())),good=JSON.parse(exportSaveFile(record(state)));
  assert.throws(()=>parseSaveFile('{"format":'),SaveFileError);
  assert.throws(()=>parseSaveFile('[1,2,3]'),SaveFileError);
  assert.throws(()=>parseSaveFile(JSON.stringify({...good,format:'other-game'})),SaveFileError);
  assert.throws(()=>parseSaveFile(JSON.stringify(good),{size:SAVE_FILE_MAX_BYTES+1}),SaveFileError);
  assert.throws(()=>parseSaveFile(null),SaveFileError);
  const damaged=structuredClone(good);damaged.state.inventory.stone=(damaged.state.inventory.stone??0)+999;assert.throws(()=>parseSaveFile(JSON.stringify(damaged)),SaveFileError);
  const script=structuredClone(good);script.save.name='<img src=x onerror=alert(1)>';script.save.id='../../etc';const parsed=parseSaveFile(JSON.stringify(script));assert.equal(parsed.id,null,'an unsafe id is dropped');assert.equal(parsed.name,'<img src=x onerror=alert(1)>','names stay plain text for textContent');
});
test('an incompatible alpha schema is refused before anything is stored or loaded',()=>{
  const state=validateGameState(serializeGameState(busyWorld())),good=JSON.parse(exportSaveFile(record(state)));
  for(const version of [SAVE_VERSION-1,SAVE_VERSION+1]){const old=structuredClone(good);old.saveVersion=version;old.state.saveVersion=version;assert.throws(()=>parseSaveFile(JSON.stringify(old)),e=>e instanceof IncompatibleSaveError&&e.savedVersion===version);}
  const mismatch=structuredClone(good);mismatch.saveVersion=SAVE_VERSION-1;assert.throws(()=>parseSaveFile(JSON.stringify(mismatch)),IncompatibleSaveError);
  assert.throws(()=>exportSaveFile({...record(state),state:{...state,saveVersion:SAVE_VERSION-1}}),IncompatibleSaveError,'an old slot is not exported');
  assert.throws(()=>exportSaveFile({id:'x',name:'empty'}),SaveFileError);
});
test('importing the same file twice yields two identical, independent states',()=>{
  const text=exportSaveFile(record(validateGameState(serializeGameState(busyWorld())))),a=parseSaveFile(text),b=parseSaveFile(text);
  assert.deepEqual(a.state,b.state);assert.notEqual(a.state,b.state);
});
