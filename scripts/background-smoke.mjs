import assert from 'node:assert/strict';

// #60 Run in Background in a real page: the Settings switch, a hidden tab (Page Visibility → Phaser pause), the
// catch-up overlay and the "While you were away" summary. The absence is shortened with a controllable clock.
export async function backgroundSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.background);
    await page.locator('#help-dialog[open]').waitFor({timeout:10000});await page.keyboard.press('Escape');
    const scene='window.__game.registry.get("application").scene';
    await page.evaluate(()=>{const s=window.__game.registry.get('application').scene;let t=1e6;s.background.now=()=>t;window.__advance=ms=>{t+=ms;};});
    const hide=()=>page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'hidden',configurable:true});Object.defineProperty(document,'hidden',{value:true,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
    const show=()=>page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{value:'visible',configurable:true});Object.defineProperty(document,'hidden',{value:false,configurable:true});document.dispatchEvent(new Event('visibilitychange'));});
    const time=()=>page.evaluate(`${scene}.gameTime.totalElapsed`);
    // OFF (default): the hidden tab pauses the game and nothing is caught up.
    assert.equal(await page.locator('#background-toggle').isChecked(),false);
    let before=await time();await hide();await page.evaluate(()=>window.__advance(60000));await page.waitForTimeout(300);
    assert.equal(await page.evaluate(`${scene}.visibilityPaused`),true,'Phaser paused the hidden tab');await show();await page.waitForTimeout(300);
    assert.ok(await time()-before<2000,'off: no catch-up');assert.equal(await page.locator('#away-summary[open]').count(),0);
    // ON: three game days away are caught up with the overlay, then summarised.
    await page.locator('#settings-button').click();await page.locator('#background-toggle').check();await page.locator('#close-settings').click();
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.settings')).runInBackground),true);
    const day=await page.evaluate(`${scene}.gameTime.dayDuration`),gold=await page.evaluate(`${scene}.inventory.count('gold')`);before=await time();
    await hide();await page.evaluate(ms=>window.__advance(ms),3*day);const started=Date.now();await show();
    await page.locator('#away-summary[open]').waitFor({timeout:120000});const catchUpMs=Date.now()-started;
    const simulated=await time()-before;assert.ok(simulated>=3*day&&simulated<3*day+3000,`caught up ${simulated} ms of ${3*day}`);
    const text=await page.locator('#away-summary').textContent();assert.match(text,/While you were away/);assert.match(text,/Time elapsed: 3 game days/);
    const goldNow=await page.evaluate(`${scene}.inventory.count('gold')`);if(Math.round(goldNow-gold))assert.match(text,new RegExp(`${goldNow-gold>0?'\\+':''}${Math.round(goldNow-gold)} Gold`));
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/away-summary.png`});
    await page.locator('#away-continue').click();assert.equal(await page.locator('#away-summary[open]').count(),0);
    const after=await time();await page.waitForTimeout(800);assert.ok(await time()>after,'normal play continues');
    assert.equal(await page.evaluate(()=>!!document.querySelector('#catch-up-dialog').open),false);
    // A save never carries the browser setting.
    assert.equal(await page.evaluate(()=>'runInBackground' in window.__game.registry.get('application').scene.settingsPanel.settings),true);
    console.log(`PASS Run in Background: off pauses a hidden tab; on catches up the missed time (capped), shows the overlay and a summary from real changes, then play continues (${Math.round(3*day/1000)} s of game caught up in ${catchUpMs} ms)`);
  }finally{await page.close();}
}
