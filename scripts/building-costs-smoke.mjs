import { openAssetLibrary } from './building-menu-smoke.mjs';
import assert from 'node:assert/strict';
import { placeBlueprint } from './building-menu-smoke.mjs';

// #91 part 1 (owner request 7 Nov 2026), in its own page: the Asset Library changes a House price (amount, added Gold;
// removing a default resource is covered by tests/building-costs.test.js since the House is wood only), a new House site books that price, the change survives a reload, and Reset all prices restores it.
const scene=page=>page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {cost:s.objectRegistry.require('house').cost,gold:s.inventory.count('gold'),wood:s.foodStorage.available('wood'),stored:localStorage.getItem('newgame.building-costs.v1')};});
async function newGame(page){
  await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
  await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
  await page.locator('#help-dialog').waitFor({timeout:10000});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
}
async function openHouse(page){await openAssetLibrary(page);await page.locator('[data-object-id="house"]').click();await page.locator('[data-cost-editor="house"]').waitFor();}
export async function buildingCostsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.building-costs.v1'));await page.reload();await newGame(page);
    await openHouse(page);const editor=page.locator('[data-cost-editor="house"]');
    await editor.locator('[data-cost-add-resource]').selectOption('gold');await editor.locator('[data-cost-add-amount]').fill('5');await editor.locator('[data-cost-add]').click();
    await editor.locator('[data-cost-amount="wood"]').fill('8');await editor.locator('[data-cost-amount="wood"]').press('Enter');
    assert.deepEqual((await scene(page)).cost,{wood:8,gold:5});
    assert.equal(await editor.locator('.cost-removed').count(),0,'nothing removed (the House is wood only since 0.49)');
    assert.equal(await editor.locator('[data-cost-resource="gold"].cost-added').count(),1);assert.equal(await editor.locator('[data-cost-resource="wood"].cost-changed').count(),1);
    // The last resource cannot be removed.
    await editor.locator('[data-cost-remove="gold"]').click();await editor.locator('[data-cost-remove="wood"]').click();
    assert.deepEqual((await scene(page)).cost,{wood:8});assert.match(await editor.locator('.cost-editor-status').textContent(),/at least one resource/);
    await editor.locator('[data-cost-add-resource]').selectOption('gold');await editor.locator('[data-cost-add-amount]').fill('5');await editor.locator('[data-cost-add]').click();
    // Invalid amounts are refused with a message.
    await editor.locator('[data-cost-amount="wood"]').fill('0');await editor.locator('[data-cost-amount="wood"]').press('Enter');
    assert.deepEqual((await scene(page)).cost,{wood:8,gold:5});assert.match(await editor.locator('.cost-editor-status').textContent(),/whole number/);
    await editor.locator('[data-cost-copy]').click();const proposals=JSON.parse(await editor.locator('[data-cost-json]').inputValue());
    assert.deepEqual(proposals.map(p=>[p.buildingId,p.cost]),[['house',{wood:8,gold:5}]]);assert.ok(proposals[0].by&&proposals[0].at);
    await page.locator('#close-asset-gallery').click();
    await page.evaluate(()=>window.__game.registry.get('application').scene.buildingBar.selectCategory('all'));// E2: the menu opens on Food & Farming
    assert.match(await page.locator('#house-choice .building-price').textContent(),/8/);
    const before=await scene(page);const {id}=await placeBlueprint(page,'house');const after=await scene(page);
    const site=await page.evaluate(id=>{const b=window.__game.registry.get('application').scene.buildings.find(b=>b.id===id);return {required:b.materialSupply.required,invested:b.construction.investedMaterials};},id);
    assert.deepEqual(site.invested,{wood:8,gold:5});assert.deepEqual(site.required,{wood:8});
    assert.equal(before.gold-after.gold,5,'Gold is paid at placement');assert.equal(before.wood-after.wood,8,'8 Wood is booked for the site');
    // The price stays in this browser after a reload.
    await page.reload();await newGame(page);assert.deepEqual((await scene(page)).cost,{wood:8,gold:5});
    await openHouse(page);await page.locator('[data-cost-reset-all]').click();
    const reset=await scene(page);assert.deepEqual(reset.cost,{wood:10});assert.equal(reset.stored,null);
    await page.locator('#close-asset-gallery').click();
    console.log('PASS Asset Library prices: change, add and remove a resource (not the last), invalid amount refused, JSON export, new site books the price, kept after reload, Reset all');
  }finally{await page.evaluate(()=>localStorage.removeItem('newgame.building-costs.v1')).catch(()=>{});await page.close();}
}
