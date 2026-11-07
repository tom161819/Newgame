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
    const state=await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;return {tax:s.policy.tax,rations:s.policy.rations,taxes:s.policy.dailyTaxes(),residents:s.policy.residents().length,income:s.wageSystem.overview().income,castle:s.production.dailyIncome().gold??0};});
    assert.deepEqual([state.tax,state.rations],['high','generous']);assert.equal(state.taxes,state.residents*1);assert.equal(state.income,state.castle+state.taxes);
    assert.match(await page.locator('#policy-tax-effect').textContent(),/1\.00 Gold per resident.*Happiness -10/);assert.match(await page.locator('#policy-rations-effect').textContent(),/1\.5 portions a day\. Happiness \+10/);
    console.log('PASS Kingdom policy: tax rate and rations in the Castle panel change taxes, income and the shown Happiness effects');
  }finally{await page.close();}
}
