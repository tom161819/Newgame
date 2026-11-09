import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Day and night N2 in a real page: a Pitch Kiln and two Torch Posts are finished at once; a Hauler fills one post with
// Torches from the store during the day, the other stays empty ("No fuel" sign). At dusk the filled post lights up and
// the empty one stays dark (one notice); a resident's house without light is "Dark at night". Screenshot: torches.png.
const finish=(page,id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
export async function torchesSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.lightFuel);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',60);s.inventory.add('stone',30);s.updateInventory();s.fog?.setEnabled?.(false);});
    const kiln=await placeBlueprint(page,'pitch_kiln');assert.equal(await finish(page,kiln.id),true);
    const lit=await placeBlueprint(page,'torch_post');assert.equal(await finish(page,lit.id),true);
    const dark=await placeBlueprint(page,'torch_post');assert.equal(await finish(page,dark.id),true);
    const kilnRecipe=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.foodProduction.chooseRecipes();return s.foodProduction.records.get(id).recipe;},kiln.id);
    assert.equal(kilnRecipe,'pitch','no Pitch yet: the kiln makes Pitch');
    // Two Torches in the store and one Hauler: he fills one post (the other stays empty).
    await page.evaluate(({lit,dark})=>{const s=window.__game.registry.get('application').scene,store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));store.stock.torch=2;s.foodStorage.changed();
      const w=s.workerSystem.liveSubjects().find(w=>!w.assignedWorkplaceId);s.workerSystem.jobs.assign(w,'hauler');
      // Keep the other post out of the Haulers' list for this check.
      const original=s.lightFuel.candidates.bind(s.lightFuel);s.lightFuel.candidates=()=>original().filter(t=>t.destinationId===`fuel-${lit}`);},{lit:lit.id,dark:dark.id});
    try{await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.lightFuel.stock(s.buildings.find(b=>b.id===id))>=1;},lit.id,{timeout:120000});}
    catch(e){console.log('DEBUG',JSON.stringify(await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,store=[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));
      return {store:store&&{id:store.id,stock:store.stock,allowed:store.allowed.includes('torch')},fuel:s.foodStorage.locations.get(`fuel-${id}`),cands:s.lightFuel.candidates(),catalog:s.logisticsTasks.catalog.filter(t=>t.fuel),haulers:s.workerSystem.liveWorkers().filter(w=>w.profession==='hauler').map(w=>[w.workState,w.workMessage,w.restPhase])};},lit.id)));throw e;}
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(Math.max(1,g.dayDuration*(s.dayNight.nightStart()-.03)-g.elapsed));});
    await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.lightFuel.isLit(s.buildings.find(b=>b.id===id));},lit.id,{timeout:10000});
    const night=await page.evaluate(({lit,dark})=>{const s=window.__game.registry.get('application').scene,b=id=>s.buildings.find(x=>x.id===id);
      return {lit:s.lightFuel.isLit(b(lit)),dark:s.lightFuel.isLit(b(dark)),icon:s.fuelIcons.icons.has(dark),flames:s.towerViews.get(lit).worldLights().length,darkFlames:s.towerViews.get(dark).worldLights().length,
        notice:[...document.querySelectorAll('#event-feed *')].map(e=>e.textContent).join(' | ')};},{lit:lit.id,dark:dark.id});
    assert.equal(night.lit,true);assert.equal(night.dark,false);assert.equal(night.icon,true,'"No fuel" sign over the empty post');assert.equal(night.flames,1);assert.equal(night.darkFlames,0);
    if(process.env.SMOKE_SHOTS){await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration*.05);const v=s.towerViews.get(id);if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(1.4);s.cameras.main.centerOn(v.base.x,v.base.y-40);},lit.id);
      await page.waitForTimeout(900);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/torches.png`});}
    console.log(`PASS Day and night N2: Pitch Kiln (Pitch first), a Hauler fills a Torch Post, it lights up at dusk with ${night.flames} flame; the empty post stays dark with a "No fuel" sign`);
  }finally{await page.close();}
}
