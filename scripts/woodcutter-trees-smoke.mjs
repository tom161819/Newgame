import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// m-drevorubci-stromy (playtest 0.83.0 #1) in a real page: a finished Lumberjack Hut whose forest is felled (its trees
// set young) gets the "nothing to fell" notice; automatic employment sends nobody there; a click on the notice pans the
// camera to the hut and opens its window with the young trees and the next mature tree; a mature tree ends the notice.
// The Dev tool's "Forest and wood" slider changes the value and it survives Save → Load.
const CODE='MKW5-155515555555-SU24BGPY';
export async function woodcutterTreesSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill(CODE);await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.diagnostics&&window.__game.registry.get('application').scene.minimap);
    await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.fog.setEnabled(false);s.refreshVisibility();});
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.employment.enabled),true,'automatic employment is on (New Game default)');
    const hut=await placeBlueprint(page,'lumberjack_hut');
    // Finish it, then fell its forest: every tree in the radius becomes a young tree (stage 2, 0 days).
    const before=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
      if(b.materialSupply){for(const r of [...s.foodStorage.reservations.values()])if(r.siteId===b.id)s.foodStorage.release(r.id);const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}b.construction.workDone=b.construction.requiredWork;b.construction.contributions={king:b.construction.requiredWork};s.constructionSystem.finish(b);
      for(const w of s.workplaceSystem.employees(b))s.workplaceSystem.remove(w);
      const n=s.naturalResources,trees=n.forestry.trees(b);let felled=0;for(const t of trees)if(t.natural.stage===3){t.natural.stage=2;t.natural.growthDays=0;t.natural.workDone=0;t.natural.growthCheckpoint=n.growthClock;n.refreshMap(t);n.view(t)?.setNaturalState?.(t);felled++;}
      s.employment.request();return {felled,young:trees.filter(t=>t.natural.stage===2).length,idle:s.workerSystem.liveSubjects().filter(w=>w.profession==='idle').length};},hut.id);
    assert.ok(before.felled>0&&before.young>0,`the hut had a forest (${JSON.stringify(before)})`);
    // A few seconds of game time: the notice lasts, automatic employment runs (with Unemployed residents around).
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.setPaused?.(false);s.gameSpeed=1;});
    await page.waitForFunction(id=>{const s=window.__game.registry.get('application').scene;return s.diagnostics.active().some(i=>i.reason==='noMatureTrees'&&i.entityId===id);},hut.id,{timeout:40000});
    const staff=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.employment.request();s.employment.update();return {staff:s.workplaceSystem.employees(b).length,idle:s.workerSystem.liveSubjects().filter(w=>w.profession==='idle').length};},hut.id);
    assert.equal(staff.staff,0,`automatic employment skips the hut (${JSON.stringify(staff)})`);
    await page.locator('#notices-panel:not([hidden])').waitFor();
    const row=page.locator('#notices-list .notice-text',{hasText:'has nothing to fell – build a new one near a forest'});await row.first().waitFor({timeout:10000});
    assert.equal(await row.count(),1,'one row');
    // The click pans the camera to the hut (manual camera) and opens its window.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.worldCamera.follow();});
    await row.first().click();
    const camera=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),c=s.worldCamera,x=s.map.length*32+(b.x+1-(b.y+1))*32,y=128+(b.x+1+b.y+1)*16-25;
      return {following:c.following,dx:Math.abs((c.panTarget?.x??1e9)-x),dy:Math.abs((c.panTarget?.y??1e9)-y),mode:document.querySelector('#camera-mode').textContent};},hut.id);
    assert.equal(camera.following,false);assert.ok(camera.dx<40&&camera.dy<40,`camera to the hut ${JSON.stringify(camera)}`);
    const young=await page.waitForFunction(()=>{const e=document.querySelector('#forestry-young');return e&&e.offsetParent!==null&&e.textContent;},null,{timeout:8000}).then(h=>h.jsonValue());
    assert.match(young,/^Young trees in working radius: \d+ · next mature tree in ~(\d+|<1) days?$/,young);
    const count=Number(young.match(/radius: (\d+)/)[1]);assert.ok(count>=before.young,`young trees counted (${young})`);
    await page.keyboard.press('Escape');
    // A mature tree in range again: the notice goes.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),n=s.naturalResources,t=n.forestry.trees(b).find(t=>t.natural.stage===2&&n.preservesRoutes(t));t.natural.stage=3;t.natural.growthDays=0;n.refreshMap(t);n.view(t)?.setNaturalState?.(t);s.diagnostics.nextCheck=0;s.diagnostics.update();},hut.id);
    await page.waitForFunction(()=>!document.querySelector('#notices-list').textContent.includes('has nothing to fell'),null,{timeout:8000});

    // ---- Dev tool: "Forest and wood".
    await page.locator('#dev-tool-button').click();await page.locator('#dev-balance-panel:not([hidden])').waitFor();
    await page.locator('#dev-balance-forest summary').click();
    assert.equal(await page.locator('#dev-balance-forest summary').textContent(),'Forest and wood');
    assert.equal(await page.locator('#dev-balance-forest input[type=range]').count(),6);
    assert.equal(await page.locator('output[for="dev-balance-saplingChance"]').textContent(),'50 %','default 50 %');
    await page.locator('#dev-balance-saplingChance').evaluate(e=>{e.value='0.8';e.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.locator('#dev-balance-woodRadius').evaluate(e=>{e.value='1.5';e.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await page.locator('output[for="dev-balance-saplingChance"]').textContent(),'80 %');assert.equal(await page.locator('output[for="dev-balance-woodRadius"]').textContent(),'×1.50');
    assert.equal(await page.locator('#dev-tool-button .dev-tool-dot').isHidden(),false,'the dot shows a changed value');
    const overview=await page.locator('#dev-forest-overview').textContent();assert.match(overview,/^Forest: \d+ mature \/ \d+ young trees in the radius of 1 Lumberjack Huts · Wood [\d.]+ a day$/,overview);
    const saved=await page.evaluate(async()=>{const a=window.__game.registry.get('application'),state=a.snapshot();await a.load(state);return state.devBalance;});
    assert.deepEqual(saved,{saplingChance:.8,woodRadius:1.5});
    await page.waitForFunction(()=>window.__game.registry.get('application').scene?.naturalResources&&window.__game.registry.get('application').scene.minimap);
    if(await page.locator('#dev-balance-panel').isHidden())await page.locator('#dev-tool-button').click();
    await page.locator('#dev-balance-panel:not([hidden])').waitFor();
    assert.equal(await page.locator('#dev-balance-saplingChance').inputValue(),'0.8','after Load');assert.equal(await page.locator('output[for="dev-balance-saplingChance"]').textContent(),'80 %');
    await page.locator('#dev-balance-reset').click();assert.equal(await page.locator('output[for="dev-balance-saplingChance"]').textContent(),'50 %','Reset: back to 50 %');
    await page.locator('#dev-balance-close').click();
    console.log(`PASS Woodcutter trees: notice "nothing to fell" once (camera to the hut, window: ${young}), automatic employment skips the hut, gone with a mature tree; Dev tool Forest and wood (6 sliders, 80 %, radius ×1.5) survives Save/Load, Reset`);
  }finally{await page.close();}
}
