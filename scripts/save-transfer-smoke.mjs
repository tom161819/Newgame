import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

// N05 (#36): Download Save → Import Save File → Load, plus corrupt, incompatible, cancelled and repeated imports and a phone-width dialog.
export async function saveTransferSmoke(page){
  const base=await page.evaluate(async()=>{const a=window.__game.registry.get('application');a.scene.pauseManager.set('save-transfer-smoke',true);const before=(await a.saves.list()).map(r=>r.id);const state=a.snapshot();const record=await a.saves.save({name:'Transfer smoke kingdom',state});return {before,record,state};});
  await page.evaluate(()=>window.__game.registry.get('application').openSaves('load'));await page.locator('#save-load-dialog[open]').waitFor();
  const row=page.locator('#save-list .save-row',{hasText:'Transfer smoke kingdom'});await row.waitFor();
  const [download]=await Promise.all([page.waitForEvent('download'),row.locator('[data-action="download"]').click()]);
  assert.equal(download.suggestedFilename(),'medieval-kingdom-transfer-smoke-kingdom.json');
  const text=await readFile(await download.path(),'utf8'),file=JSON.parse(text);
  assert.equal(file.format,'medieval-kingdom-save');assert.equal(file.saveVersion,base.record.saveVersion);assert.deepEqual(file.state,base.state);assert.equal(file.save.id,base.record.id);
  const count=()=>page.evaluate(()=>window.__game.registry.get('application').saves.list().then(rows=>rows.length));const slots=await count();
  const choose=(name,body)=>page.locator('#import-save-file').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(body)});
  // A cancelled file chooser changes nothing.
  await page.locator('#import-save-file').setInputFiles([]);assert.equal(await count(),slots);assert.equal(await page.locator('#save-error').textContent(),'');
  // Corrupt JSON and an incompatible schema are refused; the world and the slots stay as they were.
  await choose('broken.json','{"format":"medieval-kingdom-save","state":');await page.waitForFunction(()=>document.querySelector('#save-error').textContent.includes('not valid JSON'));assert.equal(await count(),slots);
  const old=structuredClone(file);old.saveVersion=old.state.saveVersion=file.saveVersion-1;await choose('old.json',JSON.stringify(old));
  await page.waitForFunction(()=>document.querySelector('#save-error').textContent.startsWith('Incompatible save file'));assert.equal(await count(),slots);
  assert.deepEqual(await page.evaluate(()=>window.__game.registry.get('application').snapshot()),base.state,'the running world is unchanged');
  // The same file again: the existing slot is offered for replacement; Keep both makes a new slot, Replace keeps the count.
  await choose('copy.json',text);await page.locator('#save-confirm[open]').waitFor();assert.match(await page.locator('#save-confirm-text').textContent(),/already exists/);
  await page.locator('#confirm-save-no').click();await page.waitForFunction(n=>document.querySelectorAll('#save-list .save-row').length===n+1,slots);assert.equal(await count(),slots+1);
  await choose('copy.json',text);await page.locator('#save-confirm[open]').waitFor();await page.locator('#confirm-save-yes').click();await page.waitForFunction(()=>document.querySelector('#save-notice').textContent.startsWith('Imported'));assert.equal(await count(),slots+1);
  // Phone width: the dialog does not scroll sideways.
  await page.setViewportSize({width:390,height:844});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await page.setViewportSize({width:1440,height:1000});
  // Load the imported copy through the menu: the world equals the exported one.
  const copy=await page.evaluate(id=>window.__game.registry.get('application').saves.list().then(rows=>rows.find(r=>r.name==='Transfer smoke kingdom'&&r.id!==id).id),base.record.id);
  assert.deepEqual(await page.evaluate(id=>window.__game.registry.get('application').saves.get(id).then(r=>r.state),copy),base.state,'the imported slot holds exactly the exported snapshot');
  await page.locator(`#save-list [data-action="load"][data-id="${copy}"]`).click();await page.waitForFunction(()=>!document.querySelector('#save-load-dialog').open&&window.__game.registry.get('application').scene?.kingLogistics);
  await page.waitForFunction(()=>window.__game.registry.get('application').scene?.workerSystem);
  const loaded=await page.evaluate(()=>{const a=window.__game.registry.get('application');a.scene.pauseManager.set('save-transfer-smoke',true);return a.snapshot();});
  // The loaded world may run a frame before this pause; compare what one frame cannot change.
  assert.deepEqual(loaded.foodStorage.locations,base.state.foodStorage.locations);assert.deepEqual(loaded.inventory,base.state.inventory);assert.deepEqual(loaded.buildings,base.state.buildings);assert.equal(loaded.time.day,base.state.time.day);
  assert.deepEqual(loaded.workers.map(w=>[w.id,w.profession,w.cargo,w.stoneCollection]),base.state.workers.map(w=>[w.id,w.profession,w.cargo,w.stoneCollection]));
  await page.evaluate(async before=>{const a=window.__game.registry.get('application');for(const r of await a.saves.list())if(!before.includes(r.id))await a.saves.delete(r.id);a.scene.pauseManager.set('save-transfer-smoke',false);},base.before);
  console.log('PASS Download Save → Import Save File → Load restores storage, units, time and inventory; corrupt and older-schema files are refused without changes; cancel, Keep both, Replace and phone width');
}
