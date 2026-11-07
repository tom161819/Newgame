import assert from 'node:assert/strict';

// #103 in its own page: the Castle panel has Kingdom policy; choosing a tax rate and rations changes the game and the
// shown effects, and the economy line includes the taxes.
export async function policySmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    await page.evaluate(()=>window.__game.registry.get('application').scene.employmentPanel.open());
    await page.locator('#policy-tax').waitFor({state:'visible'});
    assert.equal(await page.locator('#policy-tax').inputValue(),'normal');assert.equal(await page.locator('#policy-rations').inputValue(),'normal');
    await page.locator('#policy-tax').selectOption('high');await page.locator('#policy-rations').selectOption('generous');
    // Policy v2 P1: the choice waits for the morning; the panel says so and offers Cancel.
    await page.locator('#policy-pending:not([hidden])').waitFor();assert.match(await page.locator('#policy-pending-text').textContent(),/From tomorrow: High taxes, Generous .* rations\./);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.policy.tax),'normal');assert.equal(await page.locator('#policy-tax').inputValue(),'high');
    assert.match(await page.locator('#policy-gold').textContent(),/Gold per day: Castle .* = .*From tomorrow: /);assert.match(await page.locator('#policy-food').textContent(),/Food per day: /);
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.gameTime.update(s.gameTime.dayDuration-s.gameTime.elapsed+1);});
    const state=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {tax:s.policy.tax,rations:s.policy.rations,pending:s.policy.pending,taxes:s.policy.dailyTaxes(),residents:s.policy.residents().length,income:s.wageSystem.overview().income,castle:s.production.dailyIncome().gold??0,effect:s.policy.happiness(),target:s.policy.target()};});
    assert.deepEqual([state.tax,state.rations,state.pending],['high','generous',null]);assert.equal(state.taxes,state.residents*1);assert.equal(state.income,state.castle+state.taxes);
    assert.ok(state.effect>-1&&state.effect<=0&&state.target===-5,'the Happiness effect moves gradually');
    await page.waitForTimeout(1200);
    assert.match(await page.locator('#policy-tax-effect').textContent(),/1\.00 Gold per resident.*Happiness −10/);assert.match(await page.locator('#policy-rations-effect').textContent(),/1\.5 portions a day; .*Happiness \+5/);
    assert.equal(await page.locator('#policy-pending').isHidden(),true);assert.match(await page.locator('#policy-happiness').textContent(),/Happiness \d+/);
    await page.locator('#policy-tax').selectOption('none');await page.locator('#policy-cancel').click();assert.equal(await page.locator('#policy-pending').isHidden(),true);
    // Policy v2 P2: Small rations cap the Food need at 60 the next morning.
    await page.locator('#policy-rations').selectOption('small');
    const cap=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.gameTime.update(s.gameTime.dayDuration-s.gameTime.elapsed+1);const w=s.policy.residents()[0];return s.needs.status(w).foodCap;});
    assert.equal(cap,60);assert.match(await page.locator('#policy-rations-effect').textContent(),/at most 60/);
    if(process.env.SMOKE_SHOTS){await page.locator('#policy-tax').selectOption('low');await page.waitForTimeout(300);await page.screenshot({path:`${process.env.SMOKE_SHOTS}/policy-v2.png`});}
    console.log('PASS Kingdom policy: a new tax rate and rations take effect the next morning (pending line, Cancel), then change taxes and income; the Happiness effect moves gradually; overview of gold, food and Happiness; Small rations cap the Food need at 60');
  }finally{await page.close();}
}
