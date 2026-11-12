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
