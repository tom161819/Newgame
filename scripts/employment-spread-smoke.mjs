import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Employment spread in a real page: a Quarry and a Lumberjack Hut (finished at once for the test) share the new
// residents instead of one taking all; a manual profession change in the unit panel takes a free seat; the Assign
// Worker list starts with people of the profession without a workplace and ends with those working elsewhere.
// Both finish in the same frame, so the employment plan sees two empty buildings at once.
const finish=(page,ids)=>page.evaluate(ids=>ids.map(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}delete b.unverified;b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);}),ids);
export async function employmentSpreadSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.employment);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',40);s.inventory.add('stone',40);s.updateInventory();});
    const quarry=await placeBlueprint(page,'quarry'),hut=await placeBlueprint(page,'lumberjack_hut');
    assert.deepEqual(await finish(page,[quarry.id,hut.id]),[true,true]);
    await page.waitForFunction(({q,h})=>{const s=window.__game.registry.get('application').scene,n=id=>s.workplaceSystem.employees(s.buildings.find(b=>b.id===id)).length;return n(q)+n(h)>=3;},{q:quarry.id,h:hut.id},{timeout:30000});
    const staff=await page.evaluate(({q,h})=>{const s=window.__game.registry.get('application').scene,n=id=>s.workplaceSystem.employees(s.buildings.find(b=>b.id===id)).length;return [n(q),n(h)];},{q:quarry.id,h:hut.id});
    assert.ok(staff[0]>=1&&staff[1]>=1&&Math.abs(staff[0]-staff[1])<=1,`both buildings get people (${staff})`);
    // A manual change to Miner in the unit panel: the Quarry still has a free seat.
    const w=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,k=s.character.tile;let spot=null;for(let r=1;r<6&&!spot;r++)for(let dx=-r;dx<=r&&!spot;dx++)for(let dy=-r;dy<=r&&!spot;dy++)if(s.map[k.y+dy]?.[k.x+dx]===0)spot={x:k.x+dx,y:k.y+dy};const w=s.workerSystem.create(spot);s.employment.hold(w);s.unitPanel.open(w,{management:true});return w.id;});
    await page.locator('#assign-job').selectOption('miner');
    const placed=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,w=s.workerSystem.workers.get(id);return {profession:w.profession,at:w.assignedWorkplaceId,text:document.querySelector('#unit-workplace').textContent};},w);
    assert.equal(placed.profession,'miner');assert.equal(placed.at,quarry.id,'took the free Quarry seat');assert.match(placed.text,/Quarry/);
    await page.evaluate(()=>window.__game.registry.get('application').scene.unitPanel.close?.());
    // Assign Worker groups in the Quarry panel.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.workplacePanel.open(s.buildings.find(b=>b.id===id));},quarry.id);
    const groups=await page.locator('[data-candidate-group]').evaluateAll(list=>list.map(e=>e.dataset.candidateGroup));assert.deepEqual(groups,['profession','free','employed']);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/employment-groups.png`});
    console.log(`PASS Employment spread: Quarry ${staff[0]} / Lumberjack Hut ${staff[1]}, a manual Miner took the free Quarry seat, Assign Worker groups profession → free → employed`);
  }finally{await page.close();}
}
