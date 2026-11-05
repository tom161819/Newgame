import assert from 'node:assert/strict';
// Castle Employment Priorities and the Auto Employment switch, through the real UI.
export async function employmentSmoke(page){
  const state=()=>page.evaluate(()=>window.__game.registry.get('application').scene.employment.exportState());
  // Paused: switching Auto Employment on here must not hire anyone and change the world for later smokes.
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('employment-smoke',true));
  const employed=()=>page.evaluate(()=>window.__game.registry.get('application').scene.workerSystem.liveSubjects().filter(w=>w.assignedWorkplaceId!=null).length),employedBefore=await employed();
  const before=await state();assert.equal(before.enabled,false,'the smoke game starts with Auto Employment off');
  await page.evaluate(()=>window.__game.registry.get('application').scene.employmentPanel.open());await page.locator('#employment-panel:not([hidden])').waitFor();
  assert.deepEqual(await page.locator('[data-employment-preset]').evaluateAll(b=>b.map(x=>[x.dataset.employmentPreset,x.getAttribute('aria-checked')])),[['balanced','true'],['food','false'],['production','false'],['custom','false']]);
  assert.equal(await page.locator('#employment-priorities select').count(),Object.keys(before.priorities).length);
  await page.locator('[data-employment-preset="food"]').click();assert.equal((await state()).priorities.farmer,5);assert.equal(await page.locator('[data-employment-preset="food"]').getAttribute('aria-checked'),'true');
  await page.locator('#priority-miner').selectOption('4');assert.equal((await state()).priorities.miner,4);assert.equal(await page.locator('[data-employment-preset="custom"]').getAttribute('aria-checked'),'true');
  await page.locator('#settings-button').click();await page.locator('#auto-employment-toggle').check();assert.equal((await state()).enabled,true);assert.match(await page.locator('#employment-state').textContent(),/ON/);
  await page.locator('#auto-employment-toggle').uncheck();await page.locator('#close-settings').click();
  const saved=await page.evaluate(()=>window.__game.registry.get('application').snapshot().employment);assert.deepEqual(saved,{...before,priorities:{...before.priorities,farmer:5,hunter:5,miller:5,baker:5,woodcutter:2,miner:4,smelter_operator:2,soldier:2,bowyer:2,swordsmith:2,armorer:2,wheelwright:2},enabled:false});
  await page.locator('[data-employment-preset="balanced"]').click();await page.locator('#close-employment').click();assert.equal(await page.locator('#employment-panel').isHidden(),true);
  assert.equal(await employed(),employedBefore,'nobody was hired while paused');
  await page.evaluate(()=>window.__game.registry.get('application').scene.pauseManager.set('employment-smoke',false));
  console.log('PASS Castle Employment Priorities: presets, Custom on hand edits, Auto Employment switch in Settings, saved with the game');
}
