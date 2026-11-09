import assert from 'node:assert/strict';
import { placeBlueprint,supplyAndBuild,clickBuilding } from './building-menu-smoke.mjs';

// m-vojaci-chyba (owner point 87) in its own page: a default New Game shows the starting garrison awake by the Castle and
// in the Population "Soldiers" group (a click finds him); a Barracks names what is missing (Armory, Sword) instead of an
// idle Train button; with an Armory and a Sword a new Soldier trains and is found through Population too.
export async function soldiersSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.military);
    if(await page.locator('#help-dialog[open]').count())await page.keyboard.press('Escape');
    await page.waitForTimeout(1500);
    // Day 1 dawn: the garrison stands watch instead of going to sleep in the Castle at once.
    const garrison=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return [...s.military.units.keys()].map(id=>{const w=s.workerSystem.workers.get(id);return {id,asleep:w.sleepingIn!=null,going:w.workState==='Going Home'};});});
    assert.equal(garrison.length,4);assert.ok(garrison.every(g=>!g.asleep&&!g.going),JSON.stringify(garrison));
    await page.locator('#population-tab').click();await page.locator('#population-soldiers:not([hidden])').waitFor();
    assert.equal(await page.locator('#population-soldiers .population-soldier').count(),4);assert.match(await page.locator('#population-soldiers summary').textContent(),/Soldiers · 4/);
    const first=page.locator('#population-soldiers .population-soldier').first(),id=await first.getAttribute('data-soldier-id');await first.click();
    await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.populationSidebar.selectedId===id&&s.worldCamera.panTarget;},id);
    assert.match(await page.locator('#camera-mode').textContent(),/./);await page.locator('#close-population').click();
    // A Barracks with a recruit: the lock names the Armory, then the Sword and who makes it.
    const barracks=await placeBlueprint(page,'barracks');await supplyAndBuild(page,barracks);
    // The Armory is only a blueprint yet: it does not count until finished.
    const armory=await placeBlueprint(page,'armory');
    const recruit=await page.evaluate(b=>{const s=window.__game.registry.get('application').scene,all=s.workerSystem.liveSubjects();s.employment?.setEnabled(false);
      // Auto-employment may already have staffed the new Barracks; otherwise one resident is assigned.
      let w=all.find(w=>w.assignedWorkplaceId===b&&!s.military.unit(w));if(!w){w=all.filter(w=>!w.arriving&&w.profession!=='soldier').sort((p,q)=>(p.profession==='idle'?0:1)-(q.profession==='idle'?0:1))[0];s.workplaceSystem.assign(s.buildings.find(x=>x.id===b),w);}return w.id;},barracks.id);
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    const row=page.locator(`.military-soldier[data-soldier="${recruit}"]`);
    assert.equal(await row.locator('[data-train="soldier"]').isDisabled(),true);assert.match(await row.locator('.military-reason').textContent(),/Armory/);
    assert.match(await page.locator('[data-unit-type="soldier"] .unit-type-blocked').textContent(),/Armory/);await page.locator('#close-workplace').click();
    // The Armory is built by the King through the same command as "Build with King" (its blueprint may be hidden behind
    // the Barracks roof, so it is not clicked).
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.constructionSystem.commandKing(s.buildings.find(b=>b.id===id),{fetch:true});},armory.id);
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id)?.construction?.state==='complete',armory.id,{timeout:180000});
    await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.match(await row.locator('.military-reason').textContent(),/1 Sword.*Swordsmith.*Iron/);
    await page.evaluate(a=>{const s=window.__game.registry.get('application').scene;s.foodStorage.deposit(`armory-${a}`,'sword',1);const h=s.workerSystem.liveSubjects().find(w=>!w.arriving&&!['soldier','hauler'].includes(w.profession));if(h&&!s.workerSystem.liveSubjects().some(w=>w.profession==='hauler')){s.workerSystem.jobs.assign(h,'hauler');h.stoneCollection={enabled:false,radius:80};}s.updateInventory();},armory.id);
    await page.locator('#close-workplace').click();await clickBuilding(page,barracks.id);await page.locator('#military-details:not([hidden])').waitFor();
    assert.equal(await row.locator('[data-train="soldier"]').isDisabled(),false);assert.equal(await row.locator('.military-reason').count(),0);
    await row.locator('[data-train="soldier"]').click();await page.locator('#close-workplace').click();
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.military.units.get(id)?.type==='soldier',recruit,{timeout:120000});
    // The new Soldier is in the Population Soldiers group and a click finds him.
    await page.locator('#population-tab').click();const mine=page.locator(`#population-soldiers [data-soldier-id="${recruit}"]`);await mine.waitFor();
    assert.ok(await page.locator('#population-soldiers .population-soldier').count()>=5,'garrison + the new Soldier (auto-employment may staff more recruits)');await mine.click();
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.populationSidebar.selectedId===id,recruit);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/soldiers.png`});
    console.log('PASS m-vojaci-chyba: garrison awake on day 1 and listed under Population › Soldiers (click finds him); Barracks lock names Armory, then 1 Sword (Swordsmith, Iron); a new Soldier trains and is found via Population');
  }finally{await page.close();}
}
