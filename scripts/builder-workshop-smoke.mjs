import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// #118 in its own page: the Builder's Workshop is placed from the Industry menu; once finished, a Builder gets a place,
// walks to it when idle, the panel shows "1 / 4 builders" and the resident panel names his workshop.
export async function builderWorkshopSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.builderWorkshops);
    await page.locator('#help-dialog').waitFor({timeout:10000});
    assert.match(await page.locator('#help-steps').textContent(),/Builder's Workshop/,'Getting started lists the workshop');
    const {id}=await placeBlueprint(page,'builder_workshop');
    const worker=await page.evaluate(id=>{
      const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),d=s.objectRegistry.require('builder_workshop');
      // Finished as a fixture (construction itself is covered by the construction smokes).
      delete b.construction;s.constructionSystem.sites.delete(b.id);s.towerViews.get(b.id)?.destroy?.();s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');
      const w=[...s.workerSystem.workers.values()].find(w=>w.isAlive);s.workerSystem.jobs.assign(w,'builder');return w.id;
    },id);
    assert.equal(await page.evaluate(({id,worker})=>{const s=window.__game.registry.get('application').scene;return s.builderWorkshops.workshopFor(s.workerSystem.workers.get(worker))?.id===id;},{id,worker}),true,'the Builder has a place');
    await page.waitForFunction(({id,worker})=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),w=s.workerSystem.workers.get(worker);
      if(w.path?.length||w.nextTile)return false;const dx=Math.max(b.x-w.tile.x,w.tile.x-(b.x+2),0),dy=Math.max(b.y-w.tile.y,w.tile.y-(b.y+2),0);return Math.max(dx,dy)>=1&&Math.max(dx,dy)<=5;},{id,worker},{timeout:90000});
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.builderWorkshopPanel.open(s.buildings.find(b=>b.id===id));},id);
    await page.locator('#builder-workshop-dialog[open]').waitFor();
    assert.equal(await page.locator('#builder-workshop-count').textContent(),'1 / 4 builders');
    assert.equal(await page.locator('#builder-workshop-list li').count(),1);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/builder-workshop-panel.png`});
    await page.locator('#close-builder-workshop').click();
    await page.evaluate(worker=>{const s=window.__game.registry.get('application').scene;s.unitPanel.open(s.workerSystem.workers.get(worker));},worker);
    assert.match(await page.locator('#unit-workplace').textContent(),/Builder's Workshop/);
    if(process.env.SMOKE_SHOTS){await page.keyboard.press('Escape');await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.centerOn(3200+(b.x+1.5-b.y-1.5)*32,128+(b.x+b.y+3)*16);},id);await page.waitForTimeout(500);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/builder-workshop.png`});}
    console.log("PASS #118 Builder's Workshop: Industry menu blueprint, Getting started step, a Builder gets a place, waits at the workshop, panel 1 / 4 builders, resident panel names the workshop");
  }finally{await page.close();}
}
