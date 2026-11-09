import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// Trade F1.1 (#59) in its own page: the Marketplace is locked until a Warehouse is finished, then it is placed from the
// Buildings menu, and a finished Marketplace opens its panel with goods space, loading spots and the price list.
export async function marketplaceSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.locator('#buildings-tab').click();await page.locator('[data-building-category="logistics"]').click();
    assert.equal(await page.locator('#marketplace-choice').isDisabled(),true,'locked without a finished Warehouse');
    assert.match(await page.locator('#marketplace-availability').textContent(),/Warehouse/);
    await page.locator('#buildings-tab').click();
    // A finished building as a fixture (placed whole, like the starting Castle), so the test does not wait for builders.
    const finished=type=>page.evaluate(type=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require(type),c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let tiles,anchor;
      for(let y=c.y+4;y<c.y+20&&!anchor;y++)for(let x=c.x-14;x<c.x+14&&!anchor;x++){const candidate=[];for(let dy=0;dy<d.height;dy++)for(let dx=0;dx<d.width;dx++)candidate.push({x:x+dx,y:y+dy});if(candidate.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`))){anchor={x,y};tiles=candidate;}}
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,...anchor,tiles};s.buildings.push(b);for(const t of tiles)s.map[t.y][t.x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));s.foodStorage.register(b);s.events.emit('buildings:changed');s.updateInventory();return b.id;
    },type);
    await finished('warehouse');
    const {id}=await placeBlueprint(page,'marketplace');
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id).type,id),'marketplace');
    // The placed site waits for builders; a finished Marketplace next to it opens the panel.
    const market=await finished('marketplace');
    // m-start-v2: a new game has 200 Bread; this check wants a kingdom without Bread, so the fixture takes it out.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;for(const l of s.foodStorage.locations.values())if(l.stock?.bread)delete l.stock.bread;s.foodStorage.changed?.();s.trade?.invalidate?.();});
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},market);
    await page.locator('#marketplace-dialog[open]').waitFor();
    if(process.env.SMOKE_SHOTS){await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marketplace-panel.png`});await page.keyboard.press('Escape');await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.cameras.main.centerOn(...Object.values(s.towerViews.get(id)?.container?{x:s.towerViews.get(id).container.x,y:s.towerViews.get(id).container.y}:{x:0,y:0}));},id);await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marketplace-map.png`});await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},id);}
    const text=await page.locator('#marketplace-status').textContent();assert.match(text,/Next caravan expected in about/);assert.match(text,/Goods space: 0 \/ 80/);assert.match(text,/Loading spots: 2/);
    // F2: live prices. The kingdom has no Bread, so it is at least its list price (8/6) and marked ▲ with a reason.
    const bread=await page.locator('[data-market-resource="bread"] td').allTextContents();assert.match(bread.join('/'),/^\d+ ▲\/\d+ ▲$/);assert.ok(parseInt(bread[0])>=8&&parseInt(bread[1])>=6,bread.join('/'));assert.ok(Number(await page.locator('[data-market-resource="bread"] td').first().getAttribute('data-price-factor'))>100);
    assert.match(await page.locator('[data-market-resource="bread"] td').first().getAttribute('title'),/little of it/);
    assert.match(await page.locator('#marketplace-stats').textContent(),/Trade statistics.*No trade yet/);
    assert.ok(await page.locator('#marketplace-prices tbody tr').count()>=12);
    // m-ui-prehled-surovin (26): goods with icons and group tints.
    assert.equal(await page.locator('[data-market-resource="bread"]').getAttribute('data-resource-group'),'food');assert.ok(await page.locator('[data-market-resource="bread"] .market-good-icon').count()===1);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#marketplace-dialog').evaluate(d=>d.open),false);
    // F1.2: the developer console brings a caravan now; it drives in from the edge, trades, then leaves.
    assert.equal(await page.evaluate(()=>window.mkDev.summonCaravan()),true);
    const arrived=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.caravans.active,start={...c.tile};for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++){s.caravans.update(100);s.caravanViews.update();}return {start,phase:s.caravans.active.phase,view:!!s.caravanViews.view,stock:Object.keys(s.caravans.active.stock).length};});
    if(process.env.SMOKE_SHOTS){await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,v=s.caravanViews.view;s.fog?.setEnabled?.(false);s.worldCamera&&(s.worldCamera.following=false);s.cameras.main.centerOn(v.x,v.y);s.cameras.main.setZoom(1.6);});await page.waitForTimeout(500);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/caravan.png`});}
    assert.ok(arrived.start.x===0||arrived.start.y===0||arrived.start.x===99||arrived.start.y===99);assert.equal(arrived.phase,'trading');assert.equal(arrived.view,true);assert.ok(arrived.stock>=1);
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},market);
    // m-obchod-vylepseni: escort drawn with the caravan; a parked Wheelbarrow sold to the merchant; Keep between offered.
    const escort=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,c=s.caravans.active;c.escort={porters:2,guards:3};c.gold=Math.max(c.gold,200);s.caravanViews.update();
      const k=s.character.tile;s.vehicles.create('wheelbarrow',{x:k.x+2,y:k.y+2});return {people:s.caravanViews.people.length,guards:s.caravanViews.people.filter(p=>p.kind==='guard').length,gold:c.gold};});
    assert.deepEqual([escort.people,escort.guards],[5,3]);
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.tradeKey=null;s.marketplacePanel.render();},market);
    const sellVehicle=page.locator('.market-sell-vehicle').first();await sellVehicle.waitFor();assert.match(await sellVehicle.textContent(),/Sell Wheelbarrow \(\d+ Gold\)/);
    const goldBefore=await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('gold'));await sellVehicle.click();
    assert.equal(await page.evaluate(()=>[...window.__game.registry.get('application').scene.vehicles.vehicles.values()].filter(v=>v.type==='wheelbarrow').length),0);
    assert.ok(await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('gold'))>goldBefore,'paid for the Wheelbarrow');
    assert.ok(await page.locator('[data-auto-mode="wood"] option[value="between"]').count()===1,'Keep between offered');
    assert.match(await page.locator('#marketplace-status').textContent(),/is here\. Leaving in \d+:\d\d/);assert.match(await page.locator('#marketplace-status').textContent(),/Merchant’s Gold: \d+/);
    // F1.3: sell 20 Wood through the trade window; Gold arrives only when Haulers have carried it and the caravan takes it.
    const gold0=await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('gold'));
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.inventory.pay({gold:Math.max(0,s.inventory.count('gold')-400)},{source:'Smoke'});});
    const gold1=await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('gold'));
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;for(const w of s.workerSystem.liveWorkers().slice(0,3))s.workerSystem.jobs.assign(w,'hauler');const c=s.caravans.active;c.departAt=s.gameTime.totalElapsed+.75*s.gameTime.dayDuration;});
    await page.locator('[data-trade-qty="wood"]').fill('20');await page.locator('[data-trade-side="sell"][data-trade-resource="wood"]').click();
    await page.locator('[data-trade-order]').first().waitFor();assert.match(await page.locator('[data-trade-order]').first().textContent(),/Sell 20 Wood/);if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/trade-window.png`});
    await page.keyboard.press('Escape');
    await page.waitForFunction(()=>window.__game.registry.get('application').scene.trade.orders[0]?.status==='Completed',null,{timeout:150000});
    const unit=await page.evaluate(()=>window.__game.registry.get('application').scene.trade.orders[0].price);assert.ok(unit>=2&&unit<=5,`live Wood price ${unit}`);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('gold')),gold1+20*unit,'paid on hand-over at the agreed price');
    // F2 statistics: the sale shows in the totals, the recent trades and the price history chart.
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},market);
    const stats=await page.locator('#marketplace-stats').textContent();assert.match(stats,new RegExp(`Sold for ${20*unit} Gold`));assert.match(stats,new RegExp(`sold \\d+ Wood at ${unit} Gold`));assert.match(stats,/Top goods: Wood/);
    await page.locator('#marketplace-chart-good').selectOption('wood');assert.ok(await page.locator('.market-chart circle.sell').count()>=1);
    if(process.env.SMOKE_SHOTS)await page.locator('#marketplace-stats').screenshot({path:`${process.env.SMOKE_SHOTS}/trade-stats.png`});
    // F3: automatic trade rules in the Marketplace panel (off by default; one rule per good; invalid values are refused).
    assert.match(await page.locator('#marketplace-auto-summary').textContent(),/Automatic trade: off, 0 rules/);
    await page.locator('#marketplace-auto-summary').click();await page.locator('[data-auto-mode="stone"]').selectOption('sell');
    await page.locator('#auto-stone-keep').fill('-1');await page.locator('#auto-stone-keep').dispatchEvent('change');assert.equal(await page.locator('#auto-stone-keep.invalid').count(),1);
    await page.locator('#auto-stone-keep').fill('40');await page.locator('#auto-stone-keep').dispatchEvent('change');
    await page.locator('[data-auto-mode="apple"]').selectOption('buy');await page.locator('#auto-apple-upTo').fill('70');await page.locator('#auto-apple-upTo').dispatchEvent('change');
    assert.deepEqual(await page.evaluate(()=>{const a=window.__game.registry.get('application').scene.trade.auto;return {enabled:a.enabled,stone:a.rules.stone,apple:a.rules.apple.upTo};}),{enabled:false,stone:{mode:'sell',keep:40,minPrice:2},apple:70});
    await page.locator('#auto-trade-enabled').check();assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.trade.auto.enabled),true);
    await page.locator('#marketplace-title').click();await page.waitForTimeout(1200);assert.match(await page.locator('#marketplace-auto-summary').textContent(),/on, 2 rules/);
    if(process.env.SMOKE_SHOTS)await page.locator('#marketplace-auto').screenshot({path:`${process.env.SMOKE_SHOTS}/auto-trade.png`});
    await page.locator('#auto-trade-enabled').uncheck();
    await page.keyboard.press('Escape');
    assert.ok(gold0>=gold1);
    const gone=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.caravans.leave();for(let i=0;i<20000&&s.caravans.active;i++){s.caravans.update(100);s.caravanViews.update();}return {active:s.caravans.active,view:s.caravanViews.view,next:s.caravans.nextVisitAt};});
    assert.equal(gone.active,null);assert.equal(gone.view,null);assert.ok(gone.next>0);
    console.log('PASS Marketplace: locked until a Warehouse is finished, placed from the Logistics menu, panel with goods space, loading spots and live prices with reasons; trade statistics and price history after a sale; automatic trade rules; a summoned caravan drives in from the edge, trades, leaves and the next one is scheduled');
  }finally{await page.close();}
}
