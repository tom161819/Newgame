import assert from 'node:assert/strict';

// m-ui-prehled-surovin in a real page: the top bar shows tinted group capsules; resting the pointer on the Starter
// Stockpile (map) or on the store gauge (top bar) for 0.6 s shows used / capacity and icon + count; a quick pass
// shows nothing and leaving hides it.
export async function resourceGroupsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.storePreview);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');await page.waitForTimeout(600);
    const groups=await page.evaluate(()=>[...document.querySelectorAll('#inventory-items > .inventory-group')].filter(g=>getComputedStyle(g).display!=='none').map(g=>g.dataset.resourceGroup));
    assert.deepEqual(groups.slice(0,3),['gold','materials','food'],'visible groups in order (gold, materials, food at the start)');
    assert.notEqual(await page.evaluate(()=>getComputedStyle(document.querySelector('.inventory-group[data-resource-group="materials"]')).backgroundColor),'rgba(0, 0, 0, 0)');
    // The Starter Stockpile on the map.
    const point=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>b.type==='starter_stockpile');s.fog?.setEnabled?.(false);if(s.worldCamera)s.worldCamera.following=false;
      const w={x:s.map.length*32+(b.x-b.y)*32,y:128+(b.x+b.y+2)*16};s.cameras.main.centerOn(w.x,w.y);s.cameras.main.preRender();const r=s.game.canvas.getBoundingClientRect(),c=s.cameras.main;return {x:r.left+((w.x-c.worldView.x)*c.zoom)*r.width/c.width,y:r.top+((w.y-c.worldView.y)*c.zoom)*r.height/c.height};});
    const preview=page.locator('#store-preview');
    await page.mouse.move(point.x,point.y);await page.waitForTimeout(250);assert.equal(await preview.isVisible(),false,'not before the delay');
    await page.mouse.move(point.x+1,point.y);await page.waitForTimeout(700);assert.equal(await preview.isVisible(),true,'shown after resting');
    assert.match(await preview.locator('.store-preview-usage').textContent(),/^\d+ \/ 300$/);
    assert.ok(await preview.locator('.store-preview-item[data-resource-group="food"]').count()>=1,'bread with the food tint');
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/store-preview.png`});
    await page.mouse.move(5,point.y+250);await page.waitForTimeout(100);assert.equal(await preview.isVisible(),false,'hidden after leaving');
    // The gauge in the top bar.
    await page.locator('.storage-capacity').hover();await page.waitForTimeout(750);assert.equal(await preview.isVisible(),true);
    await page.mouse.move(5,600);await page.waitForTimeout(100);assert.equal(await preview.isVisible(),false);
    console.log(`PASS resource groups: tinted capsules (${groups.join(', ')}), store preview after 0.6 s on the map and on the gauge, hidden on leave`);
  }finally{await page.close();}
}
