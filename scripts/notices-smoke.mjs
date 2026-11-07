import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';
// Right-bottom notices for a real supplied site with no Builder: shown, filtered by category, dismissed.
export async function noticesSmoke(page){
  await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('stone',20);s.updateInventory();});
  const site=await placeBlueprint(page,'tower');
  // No Builder in the kingdom: one notice right away, before any materials arrive (the C04 check waited for them, so it
  // never fired in a new game where nobody delivers). Made to last now instead of waiting the 10 s in game time.
  const notice=await page.evaluate(id=>{
    const s=window.__game.registry.get('application').scene,d=s.diagnostics;window.__noticeRestore=()=>{};
    d.nextCheck=0;d.update();const issue=d.issues.get(`${id}:noBuilder`);issue.firstSeen-=60000;d.nextCheck=0;d.update();return {reason:issue.reason,reported:issue.lastNotified!=null,ready:s.constructionSystem.materials.ready(s.buildings.find(b=>b.id===id))};
  },site.id);
  assert.deepEqual(notice,{reason:'noBuilder',reported:true,ready:false});
  await page.locator('#notices-panel:not([hidden])').waitFor();assert.match(await page.locator('#notices-list').textContent(),/No builders – assign a villager to the Builder profession \(1 construction\(s\) waiting\)/);
  if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/no-builder-notice.png`});
  await page.locator('#notices-list .notice-text').first().click();await page.locator('#employment-panel:not([hidden])').waitFor();await page.locator('#close-employment').click();
  await page.locator('[data-notice-category="construction"]').click();assert.equal(await page.locator('#notices-list li').count(),0);assert.equal(await page.locator('[data-notice-category="construction"]').getAttribute('aria-pressed'),'false');
  await page.locator('[data-notice-category="construction"]').click();assert.equal(await page.locator('#notices-list li').count(),1);
  await page.locator('[data-dismiss-notice]').click();assert.equal(await page.locator('#notices-list li').count(),0);assert.equal(await page.locator('#notices-panel').isHidden(),true);
  await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;window.__noticeRestore();delete window.__noticeRestore;s.constructionSystem.cancel(s.buildings.find(b=>b.id===id));s.inventory.spend('stone',20);s.updateInventory();s.diagnostics.nextCheck=0;s.diagnostics.update();},site.id);
  assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('stone')),0,'the fixture stone is taken back');
  // E1: the empty smoke start has no food, so a foodLow notice may stay; the construction issues are gone.
  assert.equal(await page.evaluate(()=>[...window.__game.registry.get('application').scene.diagnostics.issues.values()].filter(i=>i.reason!=='foodLow').length),0);
  console.log('PASS right-bottom notices: lasting no-Builder site reported, category filter, dismiss, resolved when the site is gone');
}
