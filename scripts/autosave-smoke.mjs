import assert from 'node:assert/strict';

// N06 (#37): Autosave settings, active-time counting, real IndexedDB slot, failure without losing the previous Autosave, loading it from the menu.
export async function autosaveSmoke(page){
  const before=await page.evaluate(()=>window.__game.registry.get('application').saves.list().then(rows=>rows.map(r=>r.id)));
  await page.locator('#settings-button').click();await page.locator('#settings-panel.open').waitFor();
  assert.equal(await page.locator('#autosave-toggle').isChecked(),true);assert.equal(await page.locator('#autosave-interval').inputValue(),'300000');
  await page.locator('#autosave-interval').selectOption('60000');
  assert.deepEqual(await page.evaluate(()=>{const a=window.__game.registry.get('application').autosave;return {interval:a.intervalMs,stored:JSON.parse(localStorage.getItem('newgame.autosave'))};}),{interval:60000,stored:{enabled:true,intervalMs:60000}});
  await page.locator('#close-settings').click();
  // Active play advances the timer; a paused game does not.
  const counted=await page.evaluate(async()=>{const app=window.__game.registry.get('application'),a=app.autosave;a.elapsed=0;await new Promise(r=>setTimeout(r,800));const active=a.elapsed;app.scene.pauseManager.set('autosave-smoke',true);await new Promise(r=>setTimeout(r,300));const paused=a.elapsed;await new Promise(r=>setTimeout(r,600));return {active,paused,after:a.elapsed};});
  assert.ok(counted.active>200,`active play counts (${counted.active} ms)`);assert.equal(counted.after,counted.paused,'paused play does not count');
  // Reaching the interval writes the Autosave slot in IndexedDB.
  const first=await page.evaluate(async()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('autosave-smoke',false);await new Promise(r=>setTimeout(r,300));app.autosave.update(60000);await app.autosave.pending;const record=await app.saves.get('autosave');return {record,status:document.querySelector('#autosave-status').textContent};});
  assert.equal(first.record.name,'Autosave');assert.equal(first.record.saveVersion,first.record.state.saveVersion);assert.match(first.status,/^Last autosave: .* · Day \d+$/);
  // A failing write keeps the previous Autosave and is announced once.
  const failed=await page.evaluate(async()=>{const app=window.__game.registry.get('application'),original=app.saves.save.bind(app.saves);let notices=0;const notify=app.notify.bind(app);app.notify=m=>{notices++;notify(m);};
    app.saves.save=async()=>{throw new Error('QuotaExceededError');};await new Promise(r=>setTimeout(r,200));await app.autosave.run();await new Promise(r=>setTimeout(r,200));await app.autosave.run();
    const status=document.querySelector('#autosave-status').textContent,kept=await app.saves.get('autosave');app.saves.save=original;app.notify=notify;return {status,kept,notices};});
  assert.match(failed.status,/^Autosave failed: QuotaExceededError\. The previous autosave/);assert.deepEqual(failed.kept,first.record);assert.equal(failed.notices,1,'no repeated failure notices');
  // The Autosave slot is labelled in Load Game and loads like any save.
  await page.evaluate(()=>window.__game.registry.get('application').openSaves('load'));const row=page.locator('#save-list .save-row.autosave');await row.waitFor();
  assert.equal(await row.locator('.save-badge').textContent(),'Autosave');
  await row.locator('[data-action="load"]').click();await page.waitForFunction(()=>!document.querySelector('#save-load-dialog').open&&window.__game.registry.get('application').scene?.workerSystem);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').autosave.elapsed<1000),true,'a loaded game restarts the interval');
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.gameTime.day),first.record.state.time.day);
  // Switched OFF: the interval passes without a write.
  await page.locator('#settings-button').click();await page.locator('#autosave-toggle').uncheck();await page.locator('#close-settings').click();
  const off=await page.evaluate(async()=>{const app=window.__game.registry.get('application'),updatedAt=(await app.saves.get('autosave')).updatedAt;app.autosave.update(600000);await app.autosave.pending;return {same:(await app.saves.get('autosave')).updatedAt===updatedAt,status:document.querySelector('#autosave-status').textContent};});
  assert.deepEqual(off,{same:true,status:'Autosave is off.'});
  await page.evaluate(async before=>{const app=window.__game.registry.get('application');for(const r of await app.saves.list())if(!before.includes(r.id))await app.saves.delete(r.id);localStorage.removeItem('newgame.autosave');app.autosave.configure({enabled:true,intervalMs:300000});document.querySelector('#autosave-toggle').checked=true;document.querySelector('#autosave-interval').value='300000';document.querySelector('#autosave-interval').disabled=false;app.autosaveStatus();},before);
  console.log('PASS Autosave: settings remembered, only active play counts, IndexedDB slot written, failed write keeps the previous Autosave with one notice, labelled slot loads and restarts the interval, OFF writes nothing');
}
