import assert from 'node:assert/strict';

// m-jidlo-balanc → m-91 Dev tool: the per-building multipliers of 0.78 live in the "Advanced" fold of the Dev tool menu
// (opened from the icon under Settings; the 5-click unlock is gone). A per-building value and the Production master
// multiply, Copy values gives the JSON, Reset brings ×1; the browser keeps no values (they belong to the save).
export async function devBalanceSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.devBalance'));await page.reload();
    await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.devBalancePanel);
    if(await page.locator('#help-dialog').evaluate(d=>d.open))await page.keyboard.press('Escape');
    await page.locator('#dev-tool-button').click();await page.locator('#dev-balance-panel').waitFor({state:'visible'});
    assert.equal(await page.locator('#dev-balance-advanced input[type=range]').count(),7);assert.equal(await page.locator('#dev-balance-fisher').isVisible(),false,'folded');
    await page.locator('#dev-balance-advanced summary').click();await page.locator('#dev-balance-fisher').waitFor({state:'visible'});
    const set=(id,v)=>page.locator(`#dev-balance-${id}`).evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}));},v);
    await set('fisher','1.5');await set('production','2');
    await page.locator('#dev-balance-copy').click();const copied=await page.evaluate(()=>window.__game.registry.get('application').scene.devBalancePanel.lastCopied);
    assert.equal(JSON.parse(copied).fisher,1.5);assert.equal(JSON.parse(copied).production,2);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.devBalance')??'{}').values),undefined,'no values in the browser');
    await page.locator('#dev-balance-reset').click();assert.equal(JSON.parse(await page.evaluate(()=>{const p=window.__game.registry.get('application').scene.devBalancePanel;return p.copyValues().then(()=>p.lastCopied);})).fisher,1,'Reset → ×1');
    await page.locator('#dev-profiler-toggle').click();await page.locator('#dev-profiler').waitFor({state:'visible'});await page.keyboard.press('F8');await page.locator('#dev-profiler').waitFor({state:'hidden'});
    console.log(`PASS Dev balance: Advanced fold with 7 per-building multipliers, fisher ×1.5 × Production ×2, Copy values, no browser values, Reset, profiler button + F8`);
  }finally{await page.close();}
}
