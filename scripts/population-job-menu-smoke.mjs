import assert from 'node:assert/strict';
// Owner 7. 11. 2026: a job button between the resident's name and Locate in the Population list.
export async function populationJobMenuSmoke(page){
  const baseline=await page.evaluate(()=>{const app=window.__game.registry.get('application');app.scene.pauseManager.set('job-menu-smoke',true);return app.snapshot();});
  const ids=await page.evaluate(()=>{
    const s=window.__game.registry.get('application').scene;s.employment.setEnabled?.(false);const people=s.workerSystem.liveSubjects();
    const idle=people.find(w=>w.profession==='idle')??people[0];if(idle.profession!=='idle'){s.workplaceSystem.remove?.(idle);s.workerSystem.jobs.assign(idle,'idle');}
    return {idle:idle.id};
  });
  await page.locator('#population-tab').click();await page.locator('#population-search').fill('');
  const row=page.locator(`.population-row[data-worker-id="${ids.idle}"]`);await row.scrollIntoViewIfNeeded();const button=row.locator('.population-job');
  assert.equal(await button.getAttribute('title'),'Assign job');assert.ok(await button.evaluate(b=>b.classList.contains('is-unemployed')));
  const box=await row.boundingBox(),jobBox=await button.boundingBox(),locateBox=await row.locator('.population-locate').boundingBox();
  assert.ok(jobBox.x+jobBox.width<=locateBox.x+1&&jobBox.y>=box.y-1&&jobBox.y+jobBox.height<=box.y+box.height+1,'the job button sits in the row before Locate');
  await button.click();const menu=page.locator('#population-job-menu');await menu.waitFor({state:'visible'});
  const texts=await menu.locator('.population-job-item').allTextContents();assert.ok(texts.some(t=>/Builder/.test(t)));assert.ok(texts.some(t=>/\((\d+ free|full)\)/.test(t)),'free seats or (full) are shown');assert.equal(await menu.locator('.population-job-unemploy').count(),0,'no Unemploy for the unemployed');
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});assert.equal(await page.locator('#population-panel.open').count(),1,'Escape closes only the menu');
  await button.click();await menu.locator('.population-job-item[data-job="builder"]').click();await menu.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).profession,ids.idle),'builder');
  const changed=page.locator(`.population-row[data-worker-id="${ids.idle}"] .population-job`);await page.waitForFunction(id=>document.querySelector(`.population-row[data-worker-id="${id}"] .population-job`)?.title==='Change job',ids.idle);
  await changed.click();await menu.waitFor({state:'visible'});assert.equal(await menu.locator('.population-job-item[data-job="builder"]').isDisabled(),true,'the current job is marked and cannot be chosen again');
  await menu.locator('.population-job-unemploy').click();await menu.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.workerSystem.workers.get(id).profession,ids.idle),'idle');
  await changed.click();await menu.waitFor({state:'visible'});await page.mouse.click(5,5);await menu.waitFor({state:'hidden'});
  if(process.env.SMOKE_SHOTS){await changed.click();await menu.waitFor({state:'visible'});await page.screenshot({path:`${process.env.SMOKE_SHOTS}/population-job-menu.png`});await page.keyboard.press('Escape');}
  await page.locator('#close-population').click();
  await page.evaluate(save=>{const app=window.__game.registry.get('application');return new Promise(resolve=>{const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);app.onGameReady=ready;resolve();};app.load(save);});},baseline);
  console.log('PASS population job menu: assign a job to the unemployed, current job marked, Unemploy, Escape and outside click close the menu');
}
