import assert from 'node:assert/strict';

// m-jidlo-balanc in a real page: the Dev mode switch is hidden until 5 clicks on the version line in Settings; Dev mode
// shows the Balance button and panel; a multiplier changes the game at once (here: the Policy panel's tax income and
// the panel's live overview), Reset brings 1× (multipliers live in localStorage only, never in a save).
export async function devBalanceSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.removeItem('newgame.devBalance'));await page.reload();
    await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.devBalancePanel);
    if(await page.locator('#help-dialog').evaluate(d=>d.open))await page.keyboard.press('Escape');
    await page.locator('#settings-button').click();await page.locator('#settings-panel.open').waitFor();
    assert.equal(await page.locator('#dev-mode-row').isVisible(),false,'no Dev mode switch normally');assert.equal(await page.locator('#dev-balance-panel').isVisible(),false);
    for(let i=0;i<5;i++)await page.locator('#settings-panel .settings-version').click();
    await page.locator('#dev-mode-row').waitFor({state:'visible'});await page.locator('#dev-mode-toggle').check();
    await page.locator('#dev-balance-open').click();await page.locator('#dev-balance-panel').waitFor({state:'visible'});
    assert.equal(await page.locator('#dev-balance-panel input[type=range]').count(),11);
    const taxes=()=>page.evaluate(()=>window.__game.registry.get('application').scene.policy.dailyTaxes());const before=await taxes();
    await page.locator('#dev-balance-taxes').evaluate(e=>{e.value='2';e.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await page.locator('#dev-balance-panel output[for="dev-balance-taxes"]').textContent(),'2.00×');
    const after=await taxes();assert.ok(before>0&&Math.abs(after-before*2)<.011,`taxes ×2 at once (${before} → ${after})`);
    assert.match(await page.locator('#dev-balance-overview').textContent(),/Food a day: \+[\d.]+ \/ −[\d.]+/);
    const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.devBalance')));assert.equal(stored.mode,true);assert.equal(stored.values.taxes,2);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/dev-balance.png`});
    await page.locator('#dev-balance-reset').click();assert.equal(await taxes(),before,'Reset → 1×');
    await page.locator('#dev-mode-toggle').uncheck();assert.equal(await page.locator('#dev-balance-panel').isVisible(),false);
    await page.evaluate(()=>localStorage.removeItem('newgame.devBalance'));
    console.log(`PASS Dev balance: hidden switch (5 clicks), panel with 11 multipliers, taxes ${before} → ${after} at 2×, overview, Reset`);
  }finally{await page.close();}
}
