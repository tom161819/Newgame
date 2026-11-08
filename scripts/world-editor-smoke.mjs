import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

// m-world-editor-obrazovka: the World Editor screen in a real page, in its own browser context (its localStorage must
// not leak into the other New Game smokes). Button right under Load Game; full screen with tabs, map and iso preview;
// settings and a named preset survive a reload; New Game offers the last used levels; Default (with confirmation)
// resets everything but keeps presets; ↺ resets one tab; full storage shows a message; Start game builds the map of
// the preview and carries the ground look into the save. Screenshot /tmp/shots/world-editor.png.
const app = 'window.__game.registry.get("application")';
const setRange = (page, name, value) => page.locator(`#world-editor input[name="${name}"]`).evaluate((e, v) => { e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, value);
const tab = (page, id) => page.locator(`#we-tab-${id}`).click();
const drawn = async page => Number(await page.locator('#world-editor').getAttribute('data-drawn') || 0);
async function waitDraw(page, after) { await page.waitForFunction(n => Number(document.querySelector('#world-editor').dataset.drawn || 0) > n, after, { timeout: 15000 }); }

export async function worldEditorSmoke(context, url, instrument) {
  const own = await context.browser().newContext({ viewport: { width: 1440, height: 1000 } });
  await own.addInitScript(() => { try { if (!localStorage.getItem('newgame.tutorial')) localStorage.setItem('newgame.tutorial', 'done'); localStorage.setItem('newgame.language', 'en'); } catch { /* none */ } });
  const page = await own.newPage(); await instrument?.(page); const errors = []; page.on('pageerror', e => errors.push(e.message));
  try {
    await page.goto(url); await page.locator('#new-game:not([disabled])').waitFor();
    assert.equal(await page.locator('#main-load-game').evaluate(e => e.nextElementSibling?.id), 'main-world-editor', 'World Editor sits right under Load Game');
    await page.locator('#main-world-editor:not([disabled])').click();
    await page.locator('#world-editor:not([hidden])').waitFor(); await waitDraw(page, 0);
    assert.equal(await page.locator('#main-menu').isHidden(), true, 'a full screen, not a window over the menu');
    const box = await page.locator('#world-editor').boundingBox(); assert.ok(box.width >= 1400 && box.height >= 950, 'fills the window');
    assert.equal(await page.locator('.we-tabs [role=tab]').count(), 8);
    // Both previews have content (not one flat colour).
    const variety = sel => page.locator(sel).evaluate(c => { const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, set = new Set(); for (let i = 0; i < d.length; i += 4 * 97) set.add(`${d[i] >> 4},${d[i + 1] >> 4},${d[i + 2] >> 4}`); return set.size; });
    assert.ok(await variety('#we-map') > 8, 'map preview drawn'); assert.ok(await variety('#we-iso') > 20, 'iso preview drawn');
    const ms = await page.evaluate(`${app}.worldEditor.lastMs`); console.log(`world editor: preview drawn in ${Math.round(ms)} ms`);

    // Sliders change the code; a ground-look slider on the River look tab.
    let n = await drawn(page); await tab(page, 'land'); await setRange(page, 'we-forest', 8); await waitDraw(page, n);
    assert.match(await page.locator('#we-code').inputValue(), /^MKW2-155515558555-[0-9A-Z]+$/);
    await tab(page, 'river'); await setRange(page, 'we-reedBeds', 2);
    await tab(page, 'saved'); await page.locator('#we-preset-name').fill('Smoke world'); await page.locator('#we-preset-save').click();
    assert.match(await page.locator('#we-status').textContent(), /Saved “Smoke world”/);
    const code = await page.locator('#we-code').inputValue();

    // Reload: the last settings and the preset come back.
    await page.reload(); await page.locator('#main-world-editor:not([disabled])').click(); await page.locator('#world-editor:not([hidden])').waitFor();
    assert.equal(await page.locator('#we-code').inputValue(), code, 'last used settings restored after reload');
    await tab(page, 'river'); assert.equal(await page.locator('input[name="we-reedBeds"]').inputValue(), '2');
    await tab(page, 'saved'); assert.equal(await page.locator('[data-preset="Smoke world"] code').textContent(), code);
    await page.locator('#we-new-seed').click(); assert.notEqual(await page.locator('#we-code').inputValue(), code);
    await page.locator('[data-preset-load="Smoke world"]').click(); assert.equal(await page.locator('#we-code').inputValue(), code, 'Load');

    // ↺ resets one tab only.
    await tab(page, 'land'); await page.locator('[data-reset-tab="land"]').click();
    assert.match(await page.locator('#we-code').inputValue(), /^MKW2-155515555555-/); await tab(page, 'river'); assert.equal(await page.locator('input[name="we-reedBeds"]').inputValue(), '2', 'other tabs keep their values');
    // Default asks first; Cancel changes nothing; Reset restores everything, presets stay.
    await tab(page, 'water'); await setRange(page, 'we-lakes', 3); await page.locator('#we-default').click(); await page.locator('.we-confirm').waitFor();
    await page.locator('#we-default-no').click(); assert.match(await page.locator('#we-code').inputValue(), /^MKW2-155535555555-/);
    await page.locator('#we-default').click(); await page.locator('#we-default-yes').click();
    assert.match(await page.locator('#we-code').inputValue(), /^MKW2-155515555555-/); await tab(page, 'river');
    assert.notEqual(await page.locator('input[name="we-reedBeds"]').inputValue(), '2', 'ground look back at the game default');
    await tab(page, 'saved'); assert.equal(await page.locator('[data-preset="Smoke world"]').count(), 1, 'Default keeps presets');

    // Full storage: a message, the editor keeps working.
    await page.evaluate(() => { window.__realSet = Storage.prototype.setItem; Storage.prototype.setItem = function () { throw new DOMException('full', 'QuotaExceededError'); }; });
    await page.locator('#we-preset-name').fill('Too much'); await page.locator('#we-preset-save').click();
    assert.match(await page.locator('#we-status').textContent(), /storage is full/); assert.equal(await page.locator('[data-preset="Too much"]').count(), 0);
    await page.evaluate(() => { Storage.prototype.setItem = window.__realSet; });
    await page.locator('[data-preset-load="Smoke world"]').click(); assert.equal(await page.locator('#we-code').inputValue(), code);

    // Back → main menu; New Game offers the last used levels (fresh seed) and links back to the editor.
    await page.locator('#we-back').click(); await page.locator('#main-menu:not([hidden])').waitFor();
    await page.locator('#new-game').click(); await page.locator('#game-setup:not([hidden])').waitFor();
    if (!await page.locator('#setup-custom').evaluate(d => d.open)) await page.locator('#setup-custom > summary').click();
    assert.equal((await page.locator('#setup-world-code').inputValue()).split('-')[1], code.split('-')[1], 'New Game offers the editor levels');
    assert.equal(await page.locator('#setup-editor-note').isVisible(), true);
    await page.locator('#setup-open-editor').click(); await page.locator('#world-editor:not([hidden])').waitFor();
    await page.locator('#we-back').click(); await page.locator('#game-setup:not([hidden])').waitFor();
    await page.locator('#setup-back').click(); await page.locator('#main-world-editor').click(); await page.locator('#world-editor:not([hidden])').waitFor();
    await page.locator('[data-preset-load="Smoke world"]').click(); n = await drawn(page); await tab(page, 'river'); await waitDraw(page, n - 1).catch(() => {});
    await page.waitForTimeout(400);
    await mkdir('/tmp/shots', { recursive: true }); await page.screenshot({ path: '/tmp/shots/world-editor.png' });

    // Start game: the map of the preview, the world code and the ground look in the save.
    const preview = await page.evaluate(`JSON.stringify({ground:${app}.worldEditor.lastWorld.ground,terrain:${app}.worldEditor.lastWorld.terrain})`);
    await page.locator('#we-start').click();
    await page.waitForFunction(() => window.__game?.registry.get('application').scene?.animalSystem, null, { timeout: 30000 });
    await page.locator('#help-dialog[open]').waitFor({ timeout: 10000 }).then(() => page.keyboard.press('Escape')).catch(() => {});
    const started = await page.evaluate(() => { const a = window.__game.registry.get('application'), s = a.snapshot(), w = a.worldEditor.lastWorld; return { code: s.gameSettings.worldCode, look: s.groundLook ?? null, startTerrain: JSON.stringify(a.scene.startWorldFingerprint ?? null), ground: JSON.stringify(a.scene.groundGrid) }; });
    assert.equal(started.code, code, 'the game uses the editor world code');
    assert.equal(started.ground, JSON.parse(preview) && JSON.stringify(JSON.parse(preview).ground), 'the game ground is the preview ground');
    assert.equal(started.look?.reedBeds, 2, 'the ground look is stored in the save');
    assert.deepEqual(errors, []);
    console.log('PASS World Editor: button under Load Game, full screen with 8 tabs, map + iso preview, presets and last settings survive a reload, New Game offers them, ↺ and Default (confirmed, presets kept), full storage message, Start game = preview map with the ground look saved');
  } finally { await own.close(); }
}
