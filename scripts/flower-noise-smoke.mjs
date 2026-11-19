import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// m-kvety-sum: flower density varies by area. The World Editor's Plants tab offers "Flowers – area scale" and
// "Flowers – contrast"; in a real game in summer a bigger piece of the map is shown zoomed out, so rich and bare
// flower areas are visible. Screenshot /tmp/shots/flower-noise.png (look at it: rich and bare meadow areas).
const app = 'window.__game.registry.get("application")';
const setRange = (page, name, value) => page.locator(`#world-editor input[name="${name}"]`).evaluate((e, v) => { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, value);

export async function flowerNoiseSmoke(context, url, instrument) {
  const own = await context.browser().newContext({ viewport: { width: 1440, height: 900 } });
  await own.addInitScript(() => { try { if (!localStorage.getItem('newgame.tutorial')) localStorage.setItem('newgame.tutorial', 'done'); localStorage.setItem('newgame.language', 'en'); } catch { /* none */ } });
  const page = await own.newPage(); await instrument?.(page); const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    // World Editor: the two sliders on the Plants tab, with their defaults; moving them redraws the preview.
    await page.goto(url); await page.locator('#main-world-editor:not([disabled])').click();
    await page.locator('#world-editor:not([hidden])').waitFor(); await page.locator('#we-tab-plants').click();
    const sliders = await page.locator('#world-editor').evaluate(root => ['flowerAreaScale', 'flowerContrast'].map(k => { const i = root.querySelector(`input[name="we-${k}"]`); return i && { value: i.value, min: i.min, max: i.max, label: i.closest('label')?.textContent }; }));
    assert.deepEqual(sliders.map(s => s && [s.value, s.min, s.max]), [['24', '6', '60'], ['6', '0', '9']], 'both sliders with defaults and ranges');
    assert.match(sliders[0].label, /Flowers – area scale/); assert.match(sliders[1].label, /Flowers – contrast/);
    const before = Number(await page.locator('#world-editor').getAttribute('data-drawn') || 0);
    await setRange(page, 'we-flowerContrast', 9);
    await page.waitForFunction(n => Number(document.querySelector('#world-editor').dataset.drawn || 0) > n, before, { timeout: 15000 });
    await setRange(page, 'we-flowerContrast', 6); await page.locator('#we-back').click(); await page.goto(url);

    // A game in summer, zoomed out over the meadows.
    await page.locator('#new-game:not([disabled])').click(); await page.locator('#setup-world-code').evaluate(e => { e.value = 'MKW6-1555155555555555-1'; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }); await page.locator('#start-game').click();
    await page.waitForFunction(() => window.__game?.registry.get('application').scene?.terrain);
    await page.locator('#help-dialog').waitFor({ timeout: 10000 }).catch(() => {});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
    const look = await page.evaluate(`(() => { const s = ${app}.scene; s.dayNight.ambientAlpha = () => 0; s.worldCamera.following = false; s.fog?.setEnabled?.(false); s.terrain.setSeason('Summer');
      const cam = s.cameras.main, x = 62, y = 18; cam.setZoom(0.55).centerOn(3200 + (x - y) * 32, 128 + (x + y) * 16); cam.preRender();
      return { season: s.terrain.season, seed: s.worldSeed }; })()`);
    assert.equal(look.season, 'Summer'); assert.equal(look.seed, 1, 'the world seed reaches the ground renderer');
    await page.waitForFunction(`${app}.scene.terrain.dirtyChunks.size === 0`, null, { timeout: 30000 }).catch(() => {}); await page.waitForTimeout(1500);
    await page.locator('.tutorial-close:visible, #tutorial-close:visible').first().click({ timeout: 1000 }).catch(() => {});
    await mkdir('/tmp/shots', { recursive: true }); await page.screenshot({ path: '/tmp/shots/flower-noise.png' });
    assert.deepEqual(errors, []);
    console.log('flower noise: sliders ok, summer map shot /tmp/shots/flower-noise.png');
  } finally { await own.close(); }
}
