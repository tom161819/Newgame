import assert from 'node:assert/strict';
import { readFileSync,readdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

// m-ukladani-chyba (3): a busy village saved by an earlier release loads, plays on for a while (time ×3), saves through
// the real save check into IndexedDB and loads back. Fixtures: tests/fixtures/saves/*.json.gz.
export async function saveCompatSmoke(page){
  // The smokes after this one expect the game they had: keep it and load it back at the end.
  const original=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const dir=new URL('../tests/fixtures/saves/',import.meta.url),files=readdirSync(dir).filter(f=>f.endsWith('.json.gz'));
  for(const file of files){
    const data=JSON.parse(gunzipSync(readFileSync(new URL(file,dir))).toString('utf8'));
    const result=await page.evaluate(async state=>{
      const app=window.__game.registry.get('application');await app.load(state);const s=app.scene;
      for(let i=0;i<1200;i++)s.simulationStep(50);
      const saved=app.snapshot(),record=await app.saves.save({name:'save-compat smoke',state:saved});
      await app.load((await app.saves.get(record.id)).state);const day=app.scene.gameTime.day;await app.saves.delete(record.id);
      return {day,savedDay:saved.time.day,workers:app.scene.workerSystem.liveWorkers().length};
    },data);
    assert.equal(result.day,result.savedDay,`${file}: the loaded game is the saved one`);assert.ok(result.workers>5,`${file}: residents kept`);
  }
  await page.evaluate(async state=>{await window.__game.registry.get('application').load(state);},original);
  console.log(`PASS Save compatibility: ${files.length} earlier-release save(s) load, play on for 60 s, save through the check and load back`);
}
