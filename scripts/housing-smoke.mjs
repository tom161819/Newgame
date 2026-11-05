import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild } from './building-menu-smoke.mjs';

// A real House: Housing menu, blueprint gives no room, the finished House raises the HUD limit by 5, kept after Load.
export async function housingSmoke(page){
  const baseline=await page.evaluate(()=>window.__game.registry.get('application').snapshot());
  const load=async state=>{await page.evaluate(async state=>{const app=window.__game.registry.get('application');window.__housingReady=false;const ready=app.onGameReady.bind(app);app.onGameReady=s=>{ready(s);window.__housingReady=true;app.onGameReady=ready;};await app.load(state);},state);await page.waitForFunction(()=>window.__housingReady);};
  const limit=async()=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {capacity:s.workerSystem.capacity(),hud:document.querySelector('#population-count').textContent};});
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',10);s.inventory.add('stone',4);s.updateInventory();});
  const before=await limit();
  assert.equal(await page.locator('[data-building-category="housing"]').count(),1);
  const site=await placeBlueprint(page,'house');assert.deepEqual(await limit(),before,'a blueprint gives no room');
  await supplyAndBuild(page,site);const after=await limit();
  assert.equal(after.capacity,before.capacity+5);assert.match(after.hud,new RegExp(`/ ${after.capacity}\\b`));
  await load(await page.evaluate(()=>window.__game.registry.get('application').snapshot()));assert.deepEqual(await limit(),after);
  await load(baseline);assert.deepEqual(await limit(),before);
  console.log(`PASS House: Housing menu, real blueprint/build, resident limit ${before.capacity} → ${after.capacity} in the HUD, restored after Load`);
}
