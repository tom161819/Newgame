import assert from 'node:assert/strict';
import { placeBlueprint,clickWorld } from './building-menu-smoke.mjs';

// Owner points 14–15 in a real page: a Quarry whose deposit is used up (emptied for the test) gets a notice, a
// warning sign over it and a line in its panel; with every store full, Woodcutters who cannot put their wood
// anywhere bring the "Storage full" notice, and making room clears it.
const finish=(page,ids)=>page.evaluate(ids=>ids.map(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id),m=s.constructionSystem.materials;
  if(b.materialSupply){const loc=s.foodStorage.locations.get(m.owner(b.id));loc.stock={...b.materialSupply.required};}b.construction.workDone=b.construction.requiredWork;return s.constructionSystem.finish(b);}),ids);
// Report lasting issues now instead of waiting 10 s of game time.
const settle=page=>page.evaluate(()=>{const d=window.__game.registry.get('application').scene.diagnostics;d.nextCheck=0;d.update();for(const i of d.issues.values())i.firstSeen-=60000;d.nextCheck=0;d.update();window.__game.registry.get('application').scene.refreshVisibility();});
export async function storageNoticesSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW3-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.diagnostics);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.add('wood',40);s.inventory.add('stone',40);s.updateInventory();});
    const hut=await placeBlueprint(page,'lumberjack_hut');
    // A real Quarry needs a seen Stone Deposit: reveal the map and click the nearest deposit with the Quarry tool.
    const spot=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('quarry'),k=s.character.tile;s.fog?.setEnabled?.(false);
      const deposits=s.naturalResources.mining.deposits().filter(o=>o.type==='stone_deposit'&&o.natural.remaining>0).sort((a,b)=>Math.hypot(a.x-k.x,a.y-k.y)-Math.hypot(b.x-k.x,b.y-k.y));
      for(const o of deposits)for(const [dx,dy]of [[0,0],[-1,0],[0,-1],[-1,-1],[1,0],[0,1]]){const a={x:o.x+dx,y:o.y+dy};if(!s.naturalResources.mining.placementError(d,a)&&!s.naturalResources.mining.accessError(s.map,d,a))return {tile:a,point:{x:s.map.length*32+(a.x-a.y)*32,y:128+(a.x+a.y+1)*16}};}return null;});
    assert.ok(spot,'a free Stone Deposit');
    await page.evaluate(t=>{const s=window.__game.registry.get('application').scene;s.startBuilding(s.objectRegistry.require('quarry'));s.cameras.main.centerOn(s.map.length*32+(t.x-t.y)*32,128+(t.x+t.y+1)*16);},spot.tile);
    await clickWorld(page,spot.point,{forBlueprint:true});await page.keyboard.press('Escape');
    const quarry={id:await page.waitForFunction(()=>window.__game.registry.get('application').scene.buildings.find(b=>b.type==='quarry')?.id,null,{timeout:8000}).then(h=>h.jsonValue())};
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;if(s.buildMode)s.cancelBuilding?.();for(const d of document.querySelectorAll('dialog[open]'))d.close();s.setPaused(false);});
    assert.deepEqual(await finish(page,[quarry.id,hut.id]),[true,true]);
    // 1. The Quarry's deposit runs out.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.naturalResources.byId.get(b.depositId).natural.remaining=0;},quarry.id);
    await settle(page);
    await page.locator('#notices-panel:not([hidden])').waitFor();assert.match(await page.locator('#notices-list').textContent(),/The Quarry has run out of Stone\./);
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.issueIcons.icons.has(id),quarry.id),true,'warning sign over the Quarry');
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.workplacePanel.open(s.buildings.find(b=>b.id===id));},quarry.id);
    assert.match(await page.locator('#workplace-issue').textContent(),/No Stone left in range – build a new Quarry near rocks\./);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/quarry-depleted.png`});
    await page.locator('#close-workplace').click();
    // 2. Every store that takes wood is full and the hut's output pile (m-sklady-materialu-koncept) is full too: the
    // Woodcutters wait with nowhere to put the wood.
    await page.evaluate(hut=>{const s=window.__game.registry.get('application').scene,st=s.foodStorage;for(const l of st.locations.values())if(st.isStock(l)&&l.allowed.includes('wood')){const room=st.room(l.id,'wood');if(room>0)l.stock.stone=(l.stock.stone??0)+room;}
      const pile=st.locations.get(`pile-${hut}`);pile.stock.wood=pile.capacity-(st.incoming(pile.id,'wood'));st.changed();},hut.id);
    await page.waitForFunction(()=>{const s=window.__game.registry.get('application').scene;return s.workerSystem.liveSubjects().some(w=>['Output pile full','Waiting for reachable timber storage capacity','Timber preserved on the ground'].includes(w.workMessage));},null,{timeout:120000});
    await settle(page);
    assert.match(await page.locator('#notices-list').textContent(),/Storage full: Wood has nowhere to go – build a Material Yard\./);
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.issueIcons.icons.has(id),hut.id),true,'warning sign over the Lumberjack Hut');
    const feed=await page.evaluate(()=>document.querySelector('#event-feed')?.textContent??'');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/storage-full.png`});
    // 3. Room again.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,st=s.foodStorage;for(const l of st.locations.values())if(st.isStock(l))l.stock.stone=0;st.changed();});
    await settle(page);assert.doesNotMatch(await page.locator('#notices-list').textContent(),/Storage full/);
    console.log(`PASS Notices 14–15: depleted Quarry (notice, sign, panel line), Storage full for Wood with the Material Yard advice and a sign over the Lumberjack Hut, cleared with room${/Storage full/.test(feed)?', in the event feed':''}`);
  }finally{await page.close();}
}
