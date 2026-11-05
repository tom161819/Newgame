import assert from 'node:assert/strict';

// NEW16: Settings → Developer → Show FPS, F3, the overlay text and its per-browser persistence outside the save.
export async function devFpsSmoke(page){
  await page.evaluate(()=>{try{localStorage.removeItem('newgame.dev');}catch{}});
  assert.equal(await page.locator('#fps-overlay').isHidden(),true,'FPS overlay is off by default');
  await page.keyboard.press('F3');await page.waitForFunction(()=>/FPS/.test(document.querySelector('#fps-overlay')?.textContent??''));
  const text=await page.locator('#fps-overlay').textContent();assert.match(text,/\d+ FPS .* \d+ ms .*(Canvas|WebGL)/);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('newgame.dev')).showFps),true);
  assert.equal(await page.evaluate(()=>JSON.stringify(window.__game.registry.get('application').snapshot()).includes('showFps')),false,'never in a save');
  await page.click('#settings-button');assert.equal(await page.locator('#dev-fps-toggle').isChecked(),true);
  await page.locator('#dev-fps-toggle').click();assert.equal(await page.locator('#fps-overlay').isHidden(),true);await page.click('#close-settings');
  await page.evaluate(()=>{try{localStorage.removeItem('newgame.dev');}catch{}});
}
