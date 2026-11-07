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
    await page.evaluate(()=>{
      const s=window.__game.registry.get('application').scene,d=s.objectRegistry.require('warehouse'),c=s.character.tile,occupied=new Set(s.reservedTiles().map(t=>`${t.x},${t.y}`));let tiles,anchor;
      for(let y=c.y+4;y<c.y+16&&!anchor;y++)for(let x=c.x-12;x<c.x+12&&!anchor;x++){const candidate=[];for(let dy=0;dy<3;dy++)for(let dx=0;dx<3;dx++)candidate.push({x:x+dx,y:y+dy});if(candidate.every(t=>s.map[t.y]?.[t.x]===0&&!occupied.has(`${t.x},${t.y}`)&&!s.resourceOccupancy.has(`${t.x},${t.y}`))){anchor={x,y};tiles=candidate;}}
      const b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'warehouse',definition:d,...anchor,tiles};s.buildings.push(b);s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(d,b));
      b.construction.workDone=b.construction.requiredWork;b.construction.progress=100;s.constructionSystem.finish(b);s.updateInventory();
    });
    const {id}=await placeBlueprint(page,'marketplace');
    assert.equal(await page.evaluate(id=>window.__game.registry.get('application').scene.buildings.find(b=>b.id===id).type,id),'marketplace');
    await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);b.construction.workDone=b.construction.requiredWork;b.construction.progress=100;s.constructionSystem.finish(b);s.marketplacePanel.open(b);},id);
    await page.locator('#marketplace-dialog[open]').waitFor();
    if(process.env.SMOKE_SHOTS){await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marketplace-panel.png`});await page.keyboard.press('Escape');await page.evaluate(id=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.id===id);s.cameras.main.centerOn(...Object.values(s.towerViews.get(id)?.container?{x:s.towerViews.get(id).container.x,y:s.towerViews.get(id).container.y}:{x:0,y:0}));},id);await page.waitForTimeout(600);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/marketplace-map.png`});await page.evaluate(id=>{const s=window.__game.registry.get('application').scene;s.marketplacePanel.open(s.buildings.find(b=>b.id===id));},id);}
    const text=await page.locator('#marketplace-status').textContent();assert.match(text,/No caravan yet/);assert.match(text,/Goods space: 0 \/ 80/);assert.match(text,/Loading spots: 2/);
    assert.equal(await page.locator('[data-market-resource="bread"] td').allTextContents().then(v=>v.join('/')),'8/6');
    assert.ok(await page.locator('#marketplace-prices tbody tr').count()>=12);
    await page.keyboard.press('Escape');assert.equal(await page.locator('#marketplace-dialog').evaluate(d=>d.open),false);
    console.log('PASS Marketplace: locked until a Warehouse is finished, placed from the Logistics menu, panel with goods space 0/80, 2 loading spots and the price list');
  }finally{await page.close();}
}
