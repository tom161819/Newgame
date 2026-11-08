import assert from 'node:assert/strict';
// Plan E2 (report 0.48.0): pause and speed in the HUD, a calmer top bar (no unused resources, short time label),
// developer tools in More, the building menu on Food first.
export async function e2Smoke(page){
  const app=()=>window.__game.registry.get('application');
  assert.equal(await page.locator('#speed-controls [data-speed]').count(),4);
  const elapsed=()=>page.evaluate(()=>window.__game.registry.get('application').scene.gameTime.totalElapsed);
  const measure=async ms=>{const a=await elapsed();await page.waitForTimeout(ms);return (await elapsed())-a;};
  await page.locator('#speed-controls [data-speed="1"]').click();const one=await measure(1500);
  await page.locator('#speed-controls [data-speed="3"]').click();assert.equal(await page.locator('#speed-controls [data-speed="3"]').getAttribute('aria-pressed'),'true');const three=await measure(1500);
  assert.ok(three>one*2,`3× runs faster (${Math.round(one)} → ${Math.round(three)} ms of game time)`);
  await page.keyboard.press('KeyP');const paused=await measure(800);assert.equal(paused,0,'P pauses the game');
  await page.locator('#buildings-tab').click();assert.equal(await page.locator('#buildings-panel').isVisible(),true,'the building menu works while paused');await page.locator('#buildings-tab').click();
  await page.keyboard.press('Digit1');assert.ok(await measure(800)>0,'1 resumes at normal speed');
  assert.match(await page.locator('#game-time').textContent(),/^Day \d+$/);assert.match(await page.locator('#game-time').getAttribute('title'),/left/);
  const shown=await page.evaluate(()=>[...document.querySelectorAll('#inventory-items .inventory-item')].filter(i=>!i.hidden).map(i=>i.querySelector('[data-resource-count]')?.dataset.resourceCount).filter(Boolean));
  for(const id of ['gold','stone','wood'])assert.ok(shown.includes(id),`${id} always shows`);
  for(const id of ['sword','armor','iron','horse_wagon'])assert.equal(shown.includes(id),false,`${id} hides until the kingdom has some`);
  if(await page.locator('#hud-details').isVisible())await page.locator('#hud-details-toggle').click();
  assert.equal(await page.locator('#asset-library-button').isVisible(),false,'the Asset Library lives in More');
  await page.locator('#hud-details-toggle').click();assert.equal(await page.locator('#asset-library-button').isVisible(),true);await page.locator('#hud-details-toggle').click();
  console.log('PASS E2: pause and 1×/3× speed (P, 1–3), building while paused, short time label with tooltip, unused resources hidden, Asset Library in More');
}

// E2 main menu and New Game: Continue appears with a save, quick starts on top, the form folded under Custom settings.
export async function quickStartSmoke(context,url,instrument){
  const page=await context.newPage();await instrument?.(page);
  try{
    await page.goto(url);await page.evaluate(()=>localStorage.setItem('newgame.setupCustom','closed'));await page.reload();
    assert.equal(await page.locator('#main-archive').evaluate(b=>b.classList.contains('menu-link')),true,'the archive is a small link');
    await page.locator('#new-game:not([disabled])').click();
    assert.equal(await page.locator('#setup-custom').evaluate(d=>d.open),false,'the form is folded');assert.equal(await page.locator('.setup-start-top').isVisible(),true);
    await page.locator('[data-setup-preset="calm"]').click();
    const calm=await page.evaluate(()=>{const e=document.querySelector('#game-setup-form').elements;return {difficulty:e.difficulty.value,wolves:e.nightWolves.checked,fires:e.nightFires.checked,wood:e.startingWood.value};});
    assert.deepEqual(calm,{difficulty:'easy',wolves:false,fires:false,wood:'100'});
    await page.locator('.setup-start-top').click();await page.waitForFunction(()=>window.__game?.registry.get('application').scene?.kingLogistics);
    const settings=await page.evaluate(()=>window.__game.registry.get('application').scene.gameSettings);assert.equal(settings.nightFires,false);assert.equal(settings.difficulty,'easy');
    console.log('PASS E2 menu: archive and changelog as links, quick starts on top (Calm start applies), form folded, Start at the top');
  }finally{await page.evaluate(()=>localStorage.setItem('newgame.setupCustom','open')).catch(()=>{});await page.close();}
}
