import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Day and night N3 (fire) in a real page: a finished House catches fire at night; flames burn on its roof and the
// notice "Fire!" comes; residents carry buckets from a Well beside it and put it out. Screenshot: fire.png.
const finish=(page,id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
export async function fireSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.setItem('newgame.nightSpeed','1'));await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.nightThreats);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',60);s.inventory.add('stone',40);s.updateInventory();s.fog?.setEnabled?.(false);});
    const house=await placeBlueprint(page,'house');assert.equal(await finish(page,house.id),true);
    const well=await placeBlueprint(page,'well');assert.equal(await finish(page,well.id),true);
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration*(s.dayNight.nightStart()+.01)-g.elapsed);s.nightThreats.random=()=>.5;s.nightThreats.ignite(s.buildings.find(b=>b.id===id));},house.id);
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.fireViews.views.has(id),house.id,{timeout:5000});
    const feed=await page.evaluate(()=>[...document.querySelectorAll('#event-feed *')].map(e=>e.textContent).join('|'));assert.match(feed,/Fire!/);
    if(process.env.SMOKE_SHOTS){await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,g=s.fireViews.views.get(id);if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(1.5);s.cameras.main.centerOn(g.x,g.y+40);},house.id);
      await page.waitForTimeout(1500);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/fire.png`});}
    await page.waitForFunction(()=>[...window.__game.registry.get('application').scene.nightThreats.fires.values()].some(f=>f.fate==='saved')&&/Villagers are putting it out/.test(document.querySelector('#event-feed')?.textContent??''),null,{timeout:60000});
    await page.waitForFunction(id=>!window.__game.registry.get('application').scene.nightThreats.fires.has(id),house.id,{timeout:120000});
    const standing=await page.evaluate(id=>window.__game.registry.get('application').scene.buildings.some(b=>b.id===id),house.id);
    assert.equal(standing,true,'put out before it burnt down');
    console.log('PASS Day and night N3 fire: a House on fire at night (flames, notice); residents with buckets from the Well put it out (feed: villagers are putting it out)');
  }finally{await page.close();}
}
