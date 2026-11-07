import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Children and the Village Green D1 in a real page: two Houses and a Village Green placed from the menu (finished at
// once for the test), residents move in, children appear and play, the green's panel and the residents' bonus, at
// rest time the children go in, and the frame rate with 40 children.
const finish=(page,id)=>page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);},id);
export async function childrenSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW2-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.childrenSystem);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',60);s.inventory.add('stone',30);s.updateInventory();for(const a of [...s.animalSystem.animals.values()])if(a.definition.id==='wild_boar')s.animalSystem.remove(a);});
    const population=await page.evaluate(()=>window.__game.registry.get('application').scene.workerSystem.liveSubjects().length);
    for(let i=0;i<2;i++){const site=await placeBlueprint(page,'house');assert.equal(await finish(page,site.id),true);}
    const green=await placeBlueprint(page,'village_green');assert.equal(await finish(page,green.id),true);
    await page.waitForFunction(()=>[...window.__game.registry.get('application').scene.childrenSystem.children.values()].some(c=>c.state==='out'),null,{timeout:30000});
    const state=await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,c=s.childrenSystem,homes=s.needs.homes(),g=s.buildings.find(b=>b.id===id);
      const inRange=c.housesInRange(g).map(h=>h.id),resident=[...homes].find(([,h])=>h.kind==='house'&&inRange.includes(h.buildingId));const st=resident?s.needs.status(s.workerSystem.workers.get(resident[0])):null;
      return {children:c.children.size,population:s.workerSystem.liveSubjects().length,green:st?.green,family:st?.greenFamily};},green.id);
    assert.ok(state.children>=1,'a family house has children');assert.equal(state.population,population,'children are not residents');assert.equal(state.green,4,'a resident in reach gets +4');
    // The green's panel: reach, houses in reach, children playing there.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.villagePanel.open('green',s.buildings.find(b=>b.id===id));},green.id);
    await page.locator('#village-dialog[open]').waitFor();assert.match(await page.locator('#village-details').textContent(),/Houses in reach: [1-9]/);
    if(process.env.SMOKE_SHOTS){await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,g=s.buildings.find(b=>b.id===id),v=s.towerViews.get(id);if(s.worldCamera)s.worldCamera.following=false;s.cameras.main.setZoom(1.6);s.cameras.main.centerOn(v.tree?.x??0,(v.tree?.y??0)-20);},green.id);
      await page.locator('#close-village').click();for(let i=0;i<3;i++){await page.waitForTimeout(2500);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/children-${i}.png`});}}
    else await page.locator('#close-village').click();
    // Rest time: the children go home and disappear inside.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(Math.max(0,g.dayDuration*.8-g.elapsed));});
    await page.waitForFunction(()=>[...window.__game.registry.get('application').scene.childrenSystem.children.values()].every(c=>c.state==='inside'),null,{timeout:30000});
    // Frame rate with 40 children (dev fill around the houses), by day.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,g=s.gameTime;g.update(g.dayDuration-g.elapsed+g.dayDuration*.1);window.mkDev.fillChildren(40);});
    await page.waitForFunction(()=>[...window.__game.registry.get('application').scene.childrenSystem.children.values()].filter(c=>c.state==='out').length>=30,null,{timeout:30000});
    const fps=await page.evaluate(()=>new Promise(resolve=>{let frames=0;const start=performance.now();const tick=()=>{frames++;if(performance.now()-start<3000)requestAnimationFrame(tick);else resolve(frames/((performance.now()-start)/1000));};requestAnimationFrame(tick);}));
    const count=await page.evaluate(()=>window.__game.registry.get('application').scene.childrenSystem.children.size);assert.equal(count,40);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/children-40.png`});
    console.log(`PASS Children D1: ${state.children} child(ren) in a family house, population unchanged (${population}), Village Green +${state.green}/+${state.family}, panel, home at rest time; 40 children at ${fps.toFixed(0)} FPS`);
  }finally{await page.close();}
}
