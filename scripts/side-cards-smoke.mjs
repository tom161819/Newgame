import assert from 'node:assert/strict';

// Side cards (owner points 5 and 6): Kingdom Policy above the Population tab, Employments below; one card open at a
// time; the Policy card is the same policy as the Castle panel; Employments is the Castle's Employment panel. Checked in
// the owner's style and the four starting styles.
export async function sideCardsSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#setup-world-code').fill('MKW5-155515555555-1');await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.sideCards);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const open=()=>page.evaluate(()=>({policy:!document.querySelector('#policy-card').hidden,population:document.querySelector('#population-panel').classList.contains('open'),employment:!document.querySelector('#employment-panel').hidden}));
    for(const style of ['studio','olive','wood-iron','parchment','stone-castle']){
      await page.evaluate(style=>{const s=document.querySelector('#settings-ui-style');s.value=style;s.dispatchEvent(new Event('change'));},style);await page.waitForTimeout(150);
      const tabs=await page.evaluate(()=>['#policy-tab','#population-tab','#employment-tab'].map(sel=>{const r=document.querySelector(sel).getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,visible:r.width>0&&r.height>0};}));
      assert.ok(tabs.every(t=>t.visible),`${style}: three tabs`);assert.ok(tabs[0].bottom<=tabs[1].top&&tabs[1].bottom<=tabs[2].top,`${style}: Policy – Population – Employments (${JSON.stringify(tabs)})`);
      assert.ok(Math.abs(tabs[0].left-tabs[1].left)<2&&Math.abs(tabs[2].left-tabs[1].left)<2,`${style}: one edge`);
      await page.locator('#policy-tab').click();assert.deepEqual(await open(),{policy:true,population:false,employment:false});
      await page.locator('#population-tab').click();assert.deepEqual(await open(),{policy:false,population:true,employment:false},'one card at a time');
      await page.locator('#employment-tab').click();assert.deepEqual(await open(),{policy:false,population:false,employment:true});
      await page.locator('#employment-tab').click();assert.deepEqual(await open(),{policy:false,population:false,employment:false},'a second click closes it');
      if(process.env.SMOKE_SHOTS&&style==='studio'){await page.locator('#policy-tab').click();await page.screenshot({path:`${process.env.SMOKE_SHOTS}/side-cards-policy.png`});await page.locator('#policy-tab').click();}
    }
    // A tax change in the card shows in the Castle panel's slider (the same policy), and Cancel in either clears it.
    await page.locator('#policy-tab').click();const card=page.locator('#policy-card .policy-slider-tax input');await card.focus();await page.keyboard.press('ArrowRight');
    assert.equal(await card.getAttribute('data-level'),'high');await page.locator('#policy-card [data-policy="pending"]:not([hidden])').waitFor();
    await page.locator('#employment-tab').click();assert.equal(await page.locator('#policy-tax').getAttribute('data-level'),'high','the Castle panel shows the card\'s choice');
    // A priority change in the Employments card is the Castle window's own control.
    const select=page.locator('#employment-panel [data-priority-profession="miner"]');await select.selectOption('5');
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.employment.priorities.miner),5);
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;s.employmentPanel.close();s.employmentPanel.open();});assert.equal(await select.inputValue(),'5');
    await page.evaluate(()=>window.__game.registry.get('application').scene.policy.cancel());
    console.log('PASS Side cards: Kingdom Policy – Population – Employments on one edge in all five styles, one card open at a time, the Policy card and the Castle panel share the policy, Employments is the Castle window');
  }finally{await page.close();}
}
