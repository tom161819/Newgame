import assert from 'node:assert/strict';

// #121: right click on the map closes open panels and does nothing else; with no panel open it still orders Move;
// the pause menu is never closed by it.
export async function rightClickSmoke(page){
  const canvas=await page.locator('canvas').boundingBox(),at={x:canvas.x+90,y:canvas.y+canvas.height*0.55};
  const ids=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,[w]=s.workerSystem.liveSubjects().filter(x=>!x.arriving);s.unitSelection.clear();return {worker:w.id};});
  const state=()=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return {cmd:w.commandState?.state??null,open:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),settings:s.settingsPanel.open,selected:s.unitSelection.ids.size};},ids.worker);
  // 1. A modal panel (unit detail): the right click lands on its backdrop and closes it.
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.unitPanel.open(s.workerSystem.workers.get(id));},ids.worker);
  await page.locator('#unit-dialog[open]').waitFor();
  await page.mouse.click(at.x,at.y,{button:'right'});
  assert.deepEqual((await state()).open,[],'unit panel closed');
  // 2. Settings open and a subject selected: the right click only closes Settings, no Move order.
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.unitSelection.set([s.workerSystem.workers.get(id)]);},ids.worker);
  const before=(await state()).cmd;
  await page.locator('#settings-button').click();assert.equal((await state()).settings,true);
  await page.mouse.click(at.x,at.y,{button:'right'});
  let now=await state();assert.equal(now.settings,false,'settings closed');assert.equal(now.cmd,before,'no Move was ordered by that click');
  // 3. Nothing open: the right click keeps commanding the selected subject as before.
  await page.mouse.click(at.x,at.y,{button:'right'});
  now=await state();assert.equal(now.cmd,'Moving','Move ordered when no panel is open');
  // 4. The pause menu is a menu, not a panel: a right click leaves it open.
  await page.evaluate(()=>window.__game.registry.get('application').showPause());await page.locator('#pause-menu[open]').waitFor();
  await page.mouse.click(at.x,at.y,{button:'right'});assert.ok((await state()).open.includes('pause-menu'),'pause menu stays');
  await page.evaluate(()=>{const app=window.__game.registry.get('application');app.resume();app.scene.unitSelection.clear();});
  console.log('PASS #121 right click: closes the unit panel and Settings without ordering Move, still orders Move with nothing open, leaves the pause menu open');
}
