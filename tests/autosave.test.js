import test from 'node:test';
import assert from 'node:assert/strict';
import { AutosaveService,AUTOSAVE_ID,AUTOSAVE_NAME,AUTOSAVE_DEFAULTS,AUTOSAVE_INTERVALS,readAutosaveSettings,saveAutosaveSettings } from '../src/systems/AutosaveService.js';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
globalThis.document={querySelector:()=>({textContent:''})};

// N06 (#37): autosave into one slot through the existing save manager.
function store({fail=false,hold=false}={}){
  const records=new Map(),calls=[];let release;
  return {records,calls,release:()=>release?.(),fail(value){fail=value;},
    async save({id,name,state,create}){calls.push({id,name,create,playTime:state.time.totalElapsed});
      if(hold)await new Promise(resolve=>{release=resolve;});if(fail)throw new Error('QuotaExceededError: disk full');
      const record={id,name,state,saveVersion:state.saveVersion,day:state.time.day,updatedAt:`t${calls.length}`};records.set(id,record);return record;}};
}
function world(){const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});return {s,snapshot:()=>{s.tick(25);return validateGameState(serializeGameState(s));}};}

test('defaults: ON every 5 real minutes, one fixed Autosave slot, settings remembered per browser',()=>{
  assert.deepEqual(AUTOSAVE_DEFAULTS,{enabled:true,intervalMs:300000});assert.deepEqual(AUTOSAVE_INTERVALS,[60000,120000,300000,600000]);
  const data=new Map(),storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
  assert.deepEqual(readAutosaveSettings(storage),AUTOSAVE_DEFAULTS);saveAutosaveSettings(storage,{enabled:false,intervalMs:60000});assert.deepEqual(readAutosaveSettings(storage),{enabled:false,intervalMs:60000});
  data.set('newgame.autosave','{"enabled":true,"intervalMs":7}');assert.equal(readAutosaveSettings(storage).intervalMs,300000,'an unknown interval falls back to the default');
  assert.deepEqual(readAutosaveSettings({getItem(){throw new Error('blocked');}}),AUTOSAVE_DEFAULTS);
});
test('the interval counts active time and writes a validated current-schema snapshot into the Autosave slot',async()=>{
  const saves=store(),{snapshot}=world(),statuses=[],a=new AutosaveService({saves,snapshot,onStatus:s=>statuses.push(s)});
  a.update(299999);assert.equal(saves.calls.length,0);a.update(1);await a.pending;
  assert.equal(saves.calls.length,1);assert.deepEqual({id:saves.calls[0].id,name:saves.calls[0].name,create:saves.calls[0].create},{id:AUTOSAVE_ID,name:AUTOSAVE_NAME,create:true});
  const record=saves.records.get(AUTOSAVE_ID);assert.equal(record.saveVersion,SAVE_VERSION);validateGameState(record.state);
  assert.equal(statuses.at(-1).type,'saved');a.update(0);a.update(-5);a.update(NaN);await a.pending;assert.equal(saves.calls.length,1,'no time, no write');
  a.update(300000);await a.pending;assert.equal(saves.calls.length,2,'a repeated timer keeps saving into the same slot');assert.equal(saves.records.size,1);
});
test('switched OFF, nothing is written; a shorter interval applies at once',async()=>{
  const saves=store(),{snapshot}=world(),a=new AutosaveService({saves,snapshot,settings:{enabled:false,intervalMs:300000}});
  a.update(10*60000);await a.pending;assert.equal(saves.calls.length,0);
  a.configure({enabled:true,intervalMs:60000});a.update(60000);await a.pending;assert.equal(saves.calls.length,1);
});
test('never two writes at once, and no write when play time has not advanced',async()=>{
  const saves=store({hold:true}),s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()}),snapshot=()=>validateGameState(serializeGameState(s)),a=new AutosaveService({saves,snapshot});
  s.tick(25);a.update(300000);assert.equal(a.saving,true);a.update(600000);a.run();assert.equal(saves.calls.length,1,'a running write blocks the next one');
  saves.release();await a.pending;assert.equal(a.saving,false);
  a.update(300000);await a.pending;assert.equal(saves.calls.length,1,'unchanged play time is not written again');
  s.tick(25);a.update(300000);saves.release();await a.pending;assert.equal(saves.calls.length,2);
});
test('a failed write keeps the previous Autosave and is reported once per streak',async()=>{
  const saves=store(),{snapshot}=world(),statuses=[],a=new AutosaveService({saves,snapshot,onStatus:s=>statuses.push(s)});
  await a.run();const good=saves.records.get(AUTOSAVE_ID);saves.fail(true);
  await a.run();await a.run();assert.equal(saves.records.get(AUTOSAVE_ID),good,'the last good Autosave is untouched');
  const failures=statuses.filter(s=>s.type==='failed');assert.equal(failures.length,2);assert.deepEqual(failures.map(f=>f.first),[true,false]);assert.match(failures[0].message,/disk full/);assert.equal(failures[0].lastSuccess.day,good.day);
  saves.fail(false);await a.run();assert.equal(statuses.at(-1).type,'saved');assert.equal(statuses.at(-1).recovered,true);
  const broken=new AutosaveService({saves,snapshot:()=>{throw new Error('Neplatná uložená hra.');}}),before=saves.calls.length;await broken.run();assert.equal(saves.calls.length,before,'an inconsistent snapshot is never written');
});
test('a new or loaded game restarts the interval',async()=>{
  const saves=store(),{snapshot}=world(),a=new AutosaveService({saves,snapshot});a.update(299000);a.reset();a.update(299000);await a.pending;assert.equal(saves.calls.length,0);a.update(1000);await a.pending;assert.equal(saves.calls.length,1);
});
