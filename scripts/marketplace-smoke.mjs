import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Trade F1.1 (#59) in its own page: the Marketplace is locked until a Warehouse is finished, then it is placed from the
// Buildings menu, and a finished Marketplace opens its panel with goods space, loading spots and the price list.
export async function marketplaceSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.locator('#buildings-tab').click();await page.locator('[data-building-category="logistics"]').click();
    assert.equal(await page.locator('#marketplace-choice').isDisabled(),true,'locked without a finished Warehouse');
    assert.match(await page.locator('#marketplace-availability').textContent(),/Warehouse/);
    await page.locator('#buildings-tab').click();
    // A finished building as a fixture (placed whole, like the starting Castle), so the test does not wait for builders.
    const finished=type=>page.evaluate(type=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require(type),c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let tiles,anchor;
      for(let y=c.y+4;y<c.y+20&&!anchor;y++)for(let x=c.x-14;x<c.x+14&&!anchor;x++){const candidate=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)candidate.push({x:x+dx,y:y+dy});if(candidate.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`))){anchor={x,y};tiles=candidate;}}
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,...anchor,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.events.emit('buildings:changed');s.updateInventory();return b.id;
    },type);
    await finished('warehouse');
    const {id}=await placeBlueprint(page,'marketplace');
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id).type,id),'marketplace');
    // The placed site waits for builders; a finished Marketplace next to it opens the panel.
    const market=await finished('marketplace');
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},market);
    await page.locator('#marketplace-dialog[open]').waitFor();
    if(process.env.SMOKE_SHOTS){await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marketplace-panel.png`});await page.keyboard.press('Escape');await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.cameras.main.centerOn(...Object.values(s.towerViews.get(id)?.container?{x:s.towerViews.get(id).container.x,y:s.towerViews.get(id).container.y}:{x:0,y:0}));},id);await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marketplace-map.png`});await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},id);}
    const text=await page.locator('#marketplace-status').textContent();assert.match(text,/Next caravan expected in about/);assert.match(text,/Goods space: 0 \/ 80/);assert.match(text,/Loading spots: 2/);
    assert.equal(await page.locator('[data-market-resource="bread"] td').allTextContents().then(v=>v.join('/')),'8/6');
    assert.ok(await page.locator('#marketplace-prices tbody tr').count()>=12);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#marketplace-dialog').evaluate(d=>d.open),false);
    // F1.2: the developer console brings a caravan now; it drives in from the edge, trades, then leaves.
    assert.equal(await page.evaluate(()=>window.mkDev.summonCaravan()),true);
    const arrived=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.caravans.active,start={...c.tile};for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++){s.caravans.update(100);s.caravanViews.update();}return {start,phase:s.caravans.active.phase,view:!!s.caravanViews.view,stock:Object.keys(s.caravans.active.stock).length};});
    if(process.env.SMOKE_SHOTS){await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,v=s.caravanViews.view;s.fog?.setEnabled?.(false);s.worldCamera&&(s.worldCamera.following=false);s.cameras.main.centerOn(v.x,v.y);s.cameras.main.setZoom(1.6);});await page.waitForTimeout(500);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/caravan.png`});}
    assert.ok(arrived.start.x===0||arrived.start.y===0||arrived.start.x===99||arrived.start.y===99);assert.equal(arrived.phase,'trading');assert.equal(arrived.view,true);assert.ok(arrived.stock>=1);
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},market);
    assert.match(await page.locator('#marketplace-status').textContent(),/is here\. Leaving in \d+:\d\d/);assert.match(await page.locator('#marketplace-status').textContent(),/Merchant’s Gold: \d+/);
    await page.keyboard.press('Escape');
    const gone=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.caravans.leave();for(let i=0;i<20000&&s.caravans.active;i++){s.caravans.update(100);s.caravanViews.update();}return {active:s.caravans.active,view:s.caravanViews.view,next:s.caravans.nextVisitAt};});
    assert.equal(gone.active,null);assert.equal(gone.view,null);assert.ok(gone.next>0);
    console.log('PASS Marketplace: locked until a Warehouse is finished, placed from the Logistics menu, panel with goods space, loading spots and prices; a summoned caravan drives in from the edge, trades, leaves and the next one is scheduled');
  }finally{await page.close();}
}
