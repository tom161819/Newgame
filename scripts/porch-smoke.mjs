import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// #98 in a real page: a Mill and a Bowyer are finished at once; they get their approved porches in front (the trade
// porch for the Mill, the shared veranda for the Bowyer). Their workers have nothing to do (no grain, no wood
// delivered) and sit down on the seats; a screenshot shows them (SMOKE_SHOTS/porch.png).
const finish=(page,id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
export async function porchSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW3-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.porches);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',80);s.inventory.add('stone',40);s.updateInventory();s.fog?.setEnabled?.(false);s.gameTime.setPaused?.(false);});
    const mill=await placeBlueprint(page,'mill');assert.equal(await finish(page,mill.id),true);
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.porches.porches.has(id),mill.id,{timeout:10000});
    const porch=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,p=s.porches.porches.get(id),v=s.porches.views.get(id);return {...p,drawn:!!v&&v.visible,key:v?.texture?.key};},mill.id);
    assert.equal(porch.variant,'trade-porch-mill');assert.ok(porch.drawn,`the porch is drawn: ${JSON.stringify(porch)}`);
    // Two residents work at the Mill; without grain they wait and sit down.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),free=s.workerSystem.liveSubjects().filter(w=>!w.assignedWorkplaceId).slice(0,2);for(const w of free)s.workplaceSystem.assign(b,w);},mill.id);
    await page.waitForFunction(id=>window.__game.registry.get('application').scene.porches.seatedAt(id)>=1,mill.id,{timeout:90000});
    const seated=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;return {count:s.porches.seatedAt(id),states:s.workerSystem.liveSubjects().filter(w=>w.assignedWorkplaceId===id).map(w=>`${w.workState}: ${w.workMessage}`)};},mill.id);
    assert.ok(seated.count>=1,JSON.stringify(seated));
    if(process.env.SMOKE_SHOTS){await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,v=s.porches.views.get(id);if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(2.2);s.cameras.main.centerOn(v.x,v.y-30);},mill.id);
      await page.waitForTimeout(1200);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/porch.png`});}
    console.log(`PASS Porches #98: the Mill gets its approved trade porch in front; ${seated.count} idle miller(s) sit on it (${seated.states.join('; ')})`);
  }finally{await page.close();}
}
