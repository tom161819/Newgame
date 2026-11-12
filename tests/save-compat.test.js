import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-ukladani-chyba (3): real saves from earlier releases with the same save schema must still load, play on and save.
// Add a save from each release that keeps SAVE_VERSION (a busy village: workshops mid-batch, cargo, building sites).
const dir=new URL('./fixtures/saves/',import.meta.url);
const fixtures=readdirSync(dir).filter(f=>f.endsWith('.json.gz'));
test('earlier-release saves of the current schema pass the save check',()=>{
  assert.ok(fixtures.length>=1);
  for(const file of fixtures){
    const data=JSON.parse(gunzipSync(readFileSync(new URL(file,dir))).toString('utf8'));
    if(data.saveVersion!==SAVE_VERSION)continue;
    // The full load and play-on runs in the browser (save-load smoke); here the save check, which decides whether it loads.
    assert.doesNotThrow(()=>validateGameState(data),file);
  }
});
test('m-loziska-kamene-2x: stone deposits of an older save get twice their stone once; iron stays',()=>{
  const data=JSON.parse(gunzipSync(readFileSync(new URL(fixtures[0],dir))).toString('utf8'));
  const stone=data.resources.filter(r=>r.natural?.kind==='deposit'&&/^stone_deposit/.test(r.type)),iron=data.resources.filter(r=>r.natural?.kind==='deposit'&&/^iron_deposit/.test(r.type));
  assert.ok(stone.length);const state=validateGameState(data);
  for(const r of stone){const now=state.resources.find(x=>x.natural?.id===r.natural.id).natural;assert.equal(now.max,r.natural.max*2);assert.equal(now.remaining,r.natural.remaining*2);}
  for(const r of iron){const now=state.resources.find(x=>x.natural?.id===r.natural.id).natural;assert.equal(now.max,r.natural.max);}
  const again=validateGameState(state);for(const r of stone)assert.equal(again.resources.find(x=>x.natural?.id===r.natural.id).natural.max,r.natural.max*2,'not doubled twice');
});
