import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';
// Right-bottom notices for a real supplied site with no Builder: shown, filtered by category, dismissed.
export async function noticesSmoke(page){
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',10);s.updateInventory();});
  const site=await placeBlueprint(page,'tower');
  const notice=await page.evaluate(id=>{
    const s=window.__game.registry.get('application').scene,d=s.diagnostics,materials=s.constructionSystem.materials,ready=materials.ready;
    // Supplied (the delivery itself is covered by the construction smokes) and lasting: report it now.
    materials.ready=site=>site.id===id||ready.call(materials,site);d.nextCheck=0;d.update();
    const issue=d.issues.get(`${id}:noBuilder`);issue.firstSeen-=60000;d.nextCheck=0;d.update();window.__noticeRestore=()=>{materials.ready=ready;};return {reason:issue.reason,reported:issue.lastNotified!=null};
  },site.id);
  assert.deepEqual(notice,{reason:'noBuilder',reported:true});
  await page.locator('#notices-panel:not([hidden])').waitFor();assert.match(await page.locator('#notices-list').textContent(),/Stone Tower: construction waiting, no Builder available/);
  await page.locator('[data-notice-category="construction"]').click();assert.equal(await page.locator('#notices-list li').count(),0);assert.equal(await page.locator('[data-notice-category="construction"]').getAttribute('aria-pressed'),'false');
  await page.locator('[data-notice-category="construction"]').click();assert.equal(await page.locator('#notices-list li').count(),1);
  await page.locator('[data-dismiss-notice]').click();assert.equal(await page.locator('#notices-list li').count(),0);assert.equal(await page.locator('#notices-panel').isHidden(),true);
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;window.__noticeRestore();delete window.__noticeRestore;s.constructionSystem.cancel(s.buildings.find(b=>b.id===id));s.inventory.spend('stone',10);s.updateInventory();s.diagnostics.nextCheck=0;s.diagnostics.update();},site.id);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('stone')),0,'the fixture stone is taken back');
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.diagnostics.issues.size),0);
  console.log('PASS right-bottom notices: lasting no-Builder site reported, category filter, dismiss, resolved when the site is gone');
}
