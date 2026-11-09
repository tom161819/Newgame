import assert from 'node:assert/strict';

// m-91-asset-library-dev in a real page: the Dev tool icon sits right under the Settings icon, opens its menu (click again
// or Esc closes), a slider changes the game at once and puts a dot on the icon, the value survives Save/Load (it is in
// the save, not the browser), quick actions work, Reset brings ×1, and "Show Dev tool" in Settings hides the icon.
export async function devToolSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>{localStorage.removeItem('newgame.devBalance');localStorage.setItem('newgame.tutorial','off');});await page.reload();
    await page.locator('#new-game:not([disabled])').click();await page.locator('#start-game').click();
    await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.devBalancePanel);
    if(await page.locator('#help-dialog').evaluate(d=>d.open))await page.keyboard.press('Escape');
    const icon=page.locator('#dev-tool-button');await icon.waitFor({state:'visible'});await page.waitForTimeout(1100);
    const [s,d]=await Promise.all([page.locator('#settings-button').boundingBox(),icon.boundingBox()]);
    assert.ok(Math.abs((s.x+s.width/2)-(d.x+d.width/2))<=2&&d.y>s.y+s.height&&d.y-(s.y+s.height)<=16,`icon right under Settings (${JSON.stringify(s)} / ${JSON.stringify(d)})`);
    assert.equal(await page.locator('.dev-tool-dot').isVisible(),false,'no dot at ×1');
    await icon.click();await page.locator('#dev-balance-panel').waitFor({state:'visible'});
    assert.equal(await page.locator('#dev-balance-panel input[type=range]').count(),25,'16 coefficients, 6 Forest and wood values (m-drevorubci-stromy), 2 World look values (m-plynule-prechody) and the tooltip delay');
    const first=await page.locator('#dev-balance-panel input[type=range]').first().getAttribute('id');assert.equal(first,'dev-balance-immigration','Arrival first');
    assert.match(await page.locator('#dev-arrival-forecast').textContent(),/Next resident in ~[\d.]+ h/);
    const taxes=()=>page.evaluate(()=>window.__game.registry.get('application').scene.policy.dailyTaxes());const before=await taxes();
    await page.locator('#dev-balance-taxes').evaluate(e=>{e.value='2';e.dispatchEvent(new Event('input',{bubbles:true}));});
    await page.locator('#dev-balance-immigration').evaluate(e=>{e.value='4';e.dispatchEvent(new Event('input',{bubbles:true}));});
    assert.equal(await page.locator('#dev-balance-panel output[for="dev-balance-taxes"]').textContent(),'×2.00');
    const after=await taxes();assert.ok(before>0&&Math.abs(after-before*2)<.011,`taxes ×2 at once (${before} → ${after})`);
    assert.equal(await page.locator('.dev-tool-dot').isVisible(),true,'a dot while a coefficient ≠ ×1');
    assert.match(await page.locator('#dev-arrival-forecast').textContent(),/\(4 a day\)/);
    assert.ok(await page.locator('#dev-balance-overview table tr').count()>=10,'economy overview table');
    // Quick actions.
    const gold=()=>page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('gold'));const g0=await gold();
    await page.locator('#dev-action-gold').click();assert.equal(await gold(),g0+100);
    const wood=()=>page.evaluate(()=>window.__game.registry.get('application').scene.inventory.count('wood'));const w0=await wood();
    await page.locator('#dev-action-resources').click();assert.ok(await wood()>=w0,'resources only into free room');
    const added=await page.evaluate(()=>{const ws=window.__game.registry.get('application').scene.workerSystem,n=ws.liveSubjects().length,ids=new Set(ws.workers.keys());document.querySelector('#dev-action-resident').click();
      return {before:n,after:ws.liveSubjects().length,capacity:ws.capacity(),newIds:[...ws.workers.keys()].filter(id=>!ids.has(id)),status:document.querySelector('#dev-balance-status').textContent};});
    assert.ok(added.before<added.capacity?added.after===added.before+1&&added.newIds.length===1:added.after===added.before,`+1 resident within the beds (${JSON.stringify(added)})`);
    if(process.env.SMOKE_SHOTS)await page.screenshot({path:`${process.env.SMOKE_SHOTS}/dev-tool.png`});
    // Esc closes the menu, not the Game Menu.
    await page.keyboard.press('Escape');await page.locator('#dev-balance-panel').waitFor({state:'hidden'});assert.equal(await page.locator('#pause-menu').evaluate(d=>d.open),false);
    // Save/Load keeps the coefficients (from the save; the browser holds none).
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.devBalance')??'{}').values),undefined);
    const taxesSaved=await taxes();
    const saved=await page.evaluate(async()=>{const app=window.__game.registry.get('application'),save=app.snapshot(),ready=app.onGameReady.bind(app);window.__devReady=false;
      app.onGameReady=s=>{ready(s);window.__devReady=true;app.onGameReady=ready;};const field=save.state?.devBalance??save.devBalance;
      window.__game.registry.get('application').scene.devBalancePanel.reset.click();await app.load(save);return field;});
    assert.deepEqual(saved,{immigration:4,taxes:2});await page.waitForFunction(()=>window.__devReady);
    assert.equal(await page.evaluate(()=>window.__game.registry.get('application').scene.policy.dailyTaxes()),taxesSaved,'×2 restored on Load');
    await page.waitForFunction(()=>!document.querySelector('.dev-tool-dot').hidden);
    // Advance 1 day through the catch-up.
    const day=await page.evaluate(()=>window.__game.registry.get('application').scene.gameTime.day);
    await icon.click();await page.locator('#dev-action-day').click();
    await page.waitForFunction(d=>window.__game.registry.get('application').scene.gameTime.day===d+1,day,{timeout:60000});
    await page.waitForFunction(()=>!window.__game.registry.get('application').scene.background.running);
    if(await page.locator('#away-summary').evaluate(d=>d.open))await page.locator('#away-continue').click();
    // Reset → ×1, no dot; Show Dev tool off hides the icon.
    await page.locator('#dev-balance-reset').click();assert.ok(Math.abs(await taxes()*2-taxesSaved)<.011,'Reset → ×1');assert.equal(await page.locator('.dev-tool-dot').isVisible(),false);
    await page.keyboard.press('Escape');
    await page.locator('#settings-button').click();await page.locator('#settings-panel.open').waitFor();
    await page.locator('#dev-mode-toggle').uncheck();assert.equal(await icon.isVisible(),false);await page.locator('#dev-mode-toggle').check();assert.equal(await icon.isVisible(),true);
    await page.evaluate(()=>localStorage.removeItem('newgame.devBalance'));
    console.log(`PASS Dev tool: icon under Settings, menu (Arrival first + forecast, 16 coefficients, overview), taxes ${before} → ${after} at ×2 with a dot, +100 Gold, +resources, +1 resident, Esc closes, Save/Load keeps {immigration:4,taxes:2}, +1 day (day ${day} → ${day+1}), Reset, Show Dev tool`);
  }finally{await page.close();}
}
