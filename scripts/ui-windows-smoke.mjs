import assert from 'node:assert/strict';

// m-ui-okna-minimapa (owner requests 28, 55) in a real page: a right click inside a window closes it (building panel,
// Wiki, Population), a right click in the Wiki search field does not (the browser menu stays); the minimap + button
// makes the minimap bigger and the size survives a reload (localStorage, not the save).
export async function uiWindowsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const start=async()=>{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.minimap);
    await page.locator('#help-dialog').waitFor({timeout:10000}).catch(()=>{});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  };
  try{
    await page.setViewportSize({width:1280,height:800});await start();
    await page.evaluate(()=>{window.__menuPrevented=[];window.addEventListener('contextmenu',e=>window.__menuPrevented.push(e.defaultPrevented));});
    // Building panel: a right click on its title closes it.
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene,b=s.buildings.find(b=>{if(!s.fog.isVisibleObject(b))return false;s.demolitionUI.select(b);return s.demolitionUI.selectedId!=null;});s.demolitionUI.openSelected();});
    await page.locator('#building-detail-dialog[open]').waitFor();
    await page.locator('#building-detail-title').click({button:'right'});
    await page.waitForFunction(()=>!document.querySelector('#building-detail-dialog').open,null,{timeout:3000});
    // Wiki: the search field keeps the browser menu and the Wiki; a right click on the title closes it.
    await page.locator('#wiki-toggle').click();await page.locator('#wiki-dialog[open]').waitFor();
    await page.locator('#wiki-search').click({button:'right'});await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>document.querySelector('#wiki-dialog').open),true,'right click in the search field leaves the Wiki open');
    assert.equal(await page.evaluate(()=>window.__menuPrevented.at(-1)),false,'the browser context menu is not suppressed in the search field');
    await page.locator('#wiki-title').click({button:'right'});
    await page.waitForFunction(()=>!document.querySelector('#wiki-dialog').open,null,{timeout:3000});
    // Population: right click inside the sidebar collapses it; in its search field it stays.
    await page.locator('#population-tab').click();await page.waitForFunction(()=>window.__game.registry.get('application').scene.populationSidebar.open);
    await page.locator('#population-search').click({button:'right'});await page.waitForTimeout(150);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.populationSidebar.open),true,'search field keeps Population open');
    await page.locator('#population-title').click({button:'right'});
    await page.waitForFunction(()=>!window.__game.registry.get('application').scene.populationSidebar.open,null,{timeout:3000});
    // Minimap +: bigger, remembered across a reload.
    await page.evaluate(()=>{try{localStorage.removeItem('newgame.minimap.size');}catch{}});
    const before=await page.locator('#minimap canvas').boundingBox(),step0=await page.locator('#minimap').getAttribute('data-size');
    const camera=()=>page.evaluate(()=>{const c=window.__game.registry.get('application').scene.worldCamera;return c.panTarget?{...c.panTarget}:null;});const cam0=await camera();
    await page.locator('#minimap [data-minimap-size="bigger"]').click();await page.waitForTimeout(100);
    const after=await page.locator('#minimap canvas').boundingBox(),step1=await page.locator('#minimap').getAttribute('data-size');
    assert.ok(after.width>before.width*1.15,`minimap grew ${before.width} → ${after.width}`);assert.equal(Number(step1),Number(step0)+1);
    assert.deepEqual(await camera(),cam0,'the + button does not pan the camera');
    const title=await page.locator('#minimap [data-minimap-size="bigger"]').getAttribute('title');assert.ok(title&&!title.includes('minimap.'),`translated tooltip (${title})`);
    await start();
    assert.equal(await page.locator('#minimap').getAttribute('data-size'),step1,'size step survives a reload');
    const reloaded=await page.locator('#minimap canvas').boundingBox();assert.ok(Math.abs(reloaded.width-after.width)<2,`same size after reload ${reloaded.width}`);
    assert.deepEqual(errors,[]);
    console.log('PASS ui-windows: right click closes building panel, Wiki and Population (not in text fields); minimap + grows it and survives a reload');
  }finally{
    await page.evaluate(()=>{try{localStorage.removeItem('newgame.minimap.size');}catch{}}).catch(()=>{});await page.close();
  }
}
