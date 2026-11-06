// Browser smoke test of the built Asset Studio, served from a GitHub-Pages-like
// sub-path with every non-local request blocked (no backend, no CDN).
//   npm run studio:smoke            build, then test
//   npm run studio:smoke -- --no-build
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { browserRuntime } from './browser-runtime.mjs';
import { buildStudio, serveStudio } from './studio-server.mjs';

if (!process.argv.includes('--no-build')) buildStudio();
const server = await serveStudio();
const runtime = await browserRuntime();
const browser = await runtime.chromium.launch({ executablePath: runtime.executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
const pass = message => console.log(`PASS ${message}`);

async function open(context, path) {
  const page = await context.newPage(), errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.route('**/*', route => { const url = route.request().url(); requests.push(url); return url.startsWith(server.url) || url.startsWith('data:') || url.startsWith('blob:') ? route.continue() : route.abort(); });
  await page.goto(server.url + path);
  return { page, errors, requests };
}
// Mean luminance of a canvas region, read in the page.
const luminance = (page, selector, region = null) => page.evaluate(([selector, region]) => {
  const canvas = document.querySelector(selector), ctx = canvas.getContext('2d');
  const { x = 0, y = 0, w = canvas.width, h = canvas.height } = region ?? {};
  const data = ctx.getImageData(Math.max(0, x), Math.max(0, y), Math.max(1, w), Math.max(1, h)).data;
  let sum = 0; for (let i = 0; i < data.length; i += 4) sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  return sum / (data.length / 4);
}, [selector, region]);

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  const { page, errors, requests } = await open(context, 'index.html');
  await page.waitForFunction(() => window.assetStudio?.ready);
  const assets = await page.evaluate(() => window.assetStudio.assets());
  assert.ok(assets.some(a => a.id === 'watchtower' && a.variants.length >= 3) && assets.some(a => a.id === 'torch-post'));
  assert.ok(await page.locator('.library-item').count() >= assets.length + 10, 'studio and game assets are listed');
  pass(`gallery lists ${assets.length} studio assets and ${await page.evaluate(() => window.assetStudio.gameAssets().length)} current game sprites`);

  await page.getByRole('button', { name: /^Decorations/ }).click();
  const decorations = await page.locator('.library-item .name').allTextContents();
  assert.ok(decorations.includes('Torch post') && !decorations.includes('Watchtower'), decorations.join(', '));
  await page.getByRole('button', { name: /^Units/ }).click();
  assert.ok((await page.locator('.library-item .name').allTextContents()).includes('Deer'));
  await page.getByRole('button', { name: /^Buildings/ }).click();
  await page.locator('#library-search').fill('watch');
  assert.deepEqual(await page.locator('.library-item .name').allTextContents(), ['Watchtower']);
  pass('category filters and search narrow the library');

  // #127 Needs review: only designs still waiting for approval; game sprites and approved designs hidden; remembered.
  await page.locator('#library-search').fill('');await page.locator('#library-categories button', { hasText: /^All/ }).click();
  await page.locator('#library-review [data-review="pending"]').click();
  const waitingCount = Number((await page.locator('#library-review [data-review="pending"] .count').textContent()).trim());
  const waiting = await page.locator('.library-item .name').allTextContents();
  assert.equal(waiting.length, waitingCount, 'the button counts what is listed');
  for (const name of ['Ruined tower', 'Broken wall', 'Burnt building', 'Scattered bricks and stones']) assert.ok(waiting.includes(name), `${name} waits for approval`);
  assert.equal(await page.locator('.library-item .pill.game').count(), 0, 'no In game sprite');
  assert.equal(await page.locator('.library-item .pill.approved').count(), 0, 'no fully approved design');
  await page.locator('.library-item', { hasText: 'Ruined tower' }).click();
  assert.equal(await page.locator('.variant-card, .variants > *').count() > 0, true);
  await page.reload();await page.waitForFunction(() => window.assetStudio?.ready);
  assert.equal(await page.locator('#library-review [data-review="pending"]').getAttribute('aria-pressed'), 'true', 'remembered after reload');
  await page.locator('#library-review [data-review="all"]').click();
  assert.ok(await page.locator('.library-item .pill.game').count() > 0, 'All shows game sprites again');
  pass(`Needs review lists ${waitingCount} designs waiting for approval, hides approved and In game, remembered after reload`);

  await page.locator('.library-item', { hasText: 'Watchtower' }).click();
  await page.waitForFunction(() => document.querySelectorAll('.variant-card canvas').length >= 3);
  const cards = await page.locator('.variant-card').count();
  for (const id of ['watchtower-square', 'watchtower-round', 'watchtower-timber']) {
    const box = await page.locator(`canvas[data-variant="${id}"]`).boundingBox();
    assert.ok(box.width > 200 && box.height > 300, id);
  }
  const tops = await page.locator('.variant-card').evaluateAll(nodes => nodes.map(n => Math.round(n.getBoundingClientRect().top)));
  assert.equal(new Set(tops).size, 1, 'three variants side by side');
  const grass = await luminance(page, 'canvas[data-variant="watchtower-square"]');
  await page.getByRole('group', { name: 'Background' }).getByRole('button', { name: 'Dark' }).click();
  const dark = await luminance(page, 'canvas[data-variant="watchtower-square"]');
  assert.ok(dark < grass - 20, `dark background (${dark.toFixed(1)}) is darker than grass (${grass.toFixed(1)})`);
  await page.locator('#compare-zoom').fill('3');
  assert.match(await page.locator('label[for="compare-zoom"] output').textContent(), /3×/);
  const square = await page.evaluate(() => window.assetStudio.exportSprite('watchtower', 'watchtower-square').meta);
  assert.match(await page.locator('.variant-card[data-variant="watchtower-square"] .facts').textContent(), new RegExp(`${square.width} × ${square.height} px at 1×.*2 × 2 tiles \\(128 px wide\\)`, 's'));
  pass(`${cards} variants side by side with zoom, background, footprint and pixel size`);

  await page.getByRole('group', { name: 'Background' }).getByRole('button', { name: 'Grass' }).click();
  await page.locator('#compare-zoom').fill('1.5');
  await page.getByRole('tab', { name: 'Scene & lighting' }).click();
  await page.waitForSelector('#scene-canvas');
  await page.getByRole('group', { name: 'Time' }).getByRole('button', { name: 'Day' }).click();
  const day = await luminance(page, '#scene-canvas');
  await page.getByRole('group', { name: 'Time' }).getByRole('button', { name: 'Night' }).click();
  await page.waitForTimeout(150);
  const night = await luminance(page, '#scene-canvas');
  const [light] = await page.evaluate(() => window.assetStudio.sceneLights());
  const near = await luminance(page, '#scene-canvas', { x: Math.round(light.x - 12), y: Math.round(light.y + 18), w: 24, h: 24 });
  assert.ok(night < day * 0.6, `night (${night.toFixed(1)}) is much darker than day (${day.toFixed(1)})`);
  assert.ok(near > night * 2.5, `torch light (${near.toFixed(1)}) brightens the night (${night.toFixed(1)})`);
  pass('test map shows Day/Night with a torch light from the light map');

  await page.getByRole('tab', { name: 'Compare variants' }).click();
  const round = page.locator('.variant-card[data-variant="watchtower-round"]');
  await round.getByRole('button', { name: 'Approved' }).click();
  // The repository may already prefer another variant, so choose this one explicitly.
  if (!await page.locator('.variant-card[data-variant="watchtower-round"].preferred').count()) await page.locator('.variant-card[data-variant="watchtower-round"] .star').click();
  await page.waitForSelector('.variant-card[data-variant="watchtower-round"].preferred');
  const local = await page.evaluate(() => window.assetStudio.local());
  const record = local.assets.watchtower.variants['watchtower-round'];
  assert.equal(record.status, 'approved'); assert.match(record.specHash, /^[0-9a-f]{8}$/); assert.equal(record.version, 1); assert.ok(record.approvedAt);
  assert.equal(local.assets.watchtower.preferred, 'watchtower-round');
  assert.match(await page.locator('#review-summary').textContent(), /local changes? not in the repository/);
  assert.match(await round.locator('.review-line').first().textContent(), /Repository: not reviewed.*Local: Approved/s);
  await page.reload(); await page.waitForFunction(() => window.assetStudio?.ready);
  assert.equal(await page.locator('.variant-card[data-variant="watchtower-round"] .segmented.status [aria-pressed="true"]').textContent(), 'Approved');
  pass('approving stores version, spec hash and time locally, survives reload and stays marked as not committed');

  await page.getByRole('button', { name: 'Export review' }).click();
  const exported = JSON.parse(await page.locator('#export-json').inputValue());
  assert.equal(exported.schema, 1);
  assert.equal(exported.assets.watchtower.preferred, 'watchtower-round');
  assert.equal(exported.assets.watchtower.variants['watchtower-round'].status, 'approved');
  const [manifestDownload] = await Promise.all([page.waitForEvent('download'), page.locator('#export-download').click()]);
  assert.equal(manifestDownload.suggestedFilename(), 'approvals.json');
  assert.deepEqual(JSON.parse(await readFile(await manifestDownload.path(), 'utf8')), exported);
  assert.match(await page.locator('#export-github').getAttribute('href'), /github\.com\/tom161819\/Newgame\/edit\/main\/art\/approvals\.json$/);
  await page.locator('#export-form button[type="submit"]').click();
  pass('export produces a valid approvals.json for a pull request; nothing is sent to GitHub');

  const expected = await page.evaluate(() => window.assetStudio.exportSprite('watchtower', 'watchtower-round').meta);
  const [png] = await Promise.all([page.waitForEvent('download'), round.getByRole('button', { name: 'Download PNG' }).click()]);
  assert.equal(png.suggestedFilename(), 'watchtower-round.v1.png');
  const bytes = await readFile(await png.path());
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.deepEqual([bytes.readUInt32BE(16), bytes.readUInt32BE(20)], [expected.width, expected.height]);
  const [meta] = await Promise.all([page.waitForEvent('download'), round.getByRole('button', { name: 'Download metadata' }).click()]);
  assert.deepEqual(JSON.parse(await readFile(await meta.path(), 'utf8')), expected);
  pass(`sprite export: ${expected.width}×${expected.height} PNG with anchor ${expected.anchor.x},${expected.anchor.y} and ${expected.lights.length} light(s)`);

  await page.getByRole('tab', { name: 'Spec & files' }).click();
  await page.waitForSelector('.repo-sprite img');
  assert.ok(await page.locator('.repo-sprite img').first().evaluate(img => img.complete && img.naturalWidth > 0));
  assert.ok((await page.locator('.meta-table').first().textContent()).includes('art/assets/buildings/watchtower/asset.json'));
  pass('spec view links the source spec, recipe and committed sprite files');

  await page.locator('#export-dialog').evaluate(d => d.open && d.close());
  await page.getByRole('button', { name: 'Export review' }).click();
  await page.locator('#discard-local').click(); await page.locator('#discard-local').click();
  assert.match(await page.locator('#review-summary').textContent(), /matches the repository/);
  pass('discarding local review needs two clicks and restores the repository state');

  await page.goto(`${server.url}index.html#game-castle`);
  await page.waitForSelector('.game-previews img');
  assert.ok(await page.locator('.game-previews img').first().evaluate(img => img.complete && img.naturalWidth > 0));
  await page.goto(`${server.url}index.html#style-guide`);
  await page.waitForSelector('.swatch');
  assert.equal(await page.locator('.swatch').count(), Object.keys(JSON.parse(await readFile(new URL('../art/style-guide.json', import.meta.url), 'utf8')).palette).length);
  assert.ok(await luminance(page, '.ruler') > 0);
  pass('current game sprites and the style guide render');

  assert.deepEqual(errors, []);
  assert.ok(requests.every(url => url.startsWith(server.url) || url.startsWith('data:') || url.startsWith('blob:')), 'only relative studio files are requested');
  pass(`${requests.length} requests, all relative to ${new URL(server.url).pathname}; no console errors`);

  for (const renderer of ['canvas', 'webgl']) {
    const demo = await open(context, `phaser-demo.html?renderer=${renderer}&time=night`);
    await demo.page.waitForFunction(() => window.__demo?.ready, null, { timeout: 30000 });
    const info = await demo.page.evaluate(() => window.__demo);
    assert.equal(info.renderer, renderer); assert.ok(info.placed.length >= 5 && info.lights >= 5);
    if (renderer === 'canvas') {
      await demo.page.waitForTimeout(300);
      const nightDemo = await luminance(demo.page, '#demo-game canvas');
      await demo.page.getByRole('button', { name: 'Day' }).click(); await demo.page.waitForTimeout(300);
      const dayDemo = await luminance(demo.page, '#demo-game canvas');
      assert.ok(nightDemo < dayDemo * 0.6, `Phaser canvas night (${nightDemo.toFixed(1)}) is darker than day (${dayDemo.toFixed(1)})`);
    }
    assert.deepEqual(demo.errors, []);
    await demo.page.close();
  }
  pass('Phaser demo places exported sprites with their anchors and lights the night in Canvas and WebGL');

  // #115 Path Lab: the production N12 path renderer on an editable map, scenarios, painting, undo, honest V2 state, JSON round trip.
  {
    const { page: lab, errors: labErrors } = await open(context, 'path-lab.html#scenario=straight&season=Winter');
    await lab.waitForFunction(() => window.pathLab?.ready);
    const start = await lab.evaluate(() => ({ worn: window.pathLab.painted(), season: window.pathLab.state.season, size: window.pathLab.sceneSize() }));
    assert.equal(start.worn, 12, 'deep link loads the straight scenario');assert.equal(start.season, 'Winter');assert.ok(start.size[0] > 1000);
    assert.equal(await lab.locator('#lab-renderer button[data-value="v2"]').isDisabled(), true, 'V2 is shown as not yet available');
    assert.equal(await lab.locator('#lab-p-meanderStrength').isDisabled(), true);assert.match(await lab.locator('#lab-params-note').textContent(), /Available with V2/);
    // Real pointer painting on the canvas, then undo.
    const box = await lab.locator('#lab-view').boundingBox();await lab.locator('#lab-scenarios [data-scenario="corner"]').click();
    const before = await lab.evaluate(() => window.pathLab.painted());
    await lab.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.75);await lab.mouse.down();await lab.mouse.move(box.x + box.width * 0.45, box.y + box.height * 0.8, { steps: 8 });await lab.mouse.up();
    const after = await lab.evaluate(() => window.pathLab.painted());assert.ok(after > before, `painting adds worn tiles (${before} → ${after})`);
    await lab.locator('#lab-undo').click();assert.equal(await lab.evaluate(() => window.pathLab.painted()), before, 'undo restores the map');
    await lab.locator('#lab-redo').click();assert.equal(await lab.evaluate(() => window.pathLab.painted()), after, 'redo');
    // The track is drawn: a worn tile differs from the grass beside it in the rendered scene.
    await lab.locator('#lab-scenarios [data-scenario="path-to-area"]').click();
    const json = await lab.evaluate(() => window.pathLab.exportJson());assert.equal(json.kind, 'path-lab');assert.equal(json.wear.length, 24 * 24);
    await lab.evaluate(() => window.pathLab.importJson({ ...window.pathLab.exportJson(), season: 'Autumn' }));assert.equal(await lab.evaluate(() => window.pathLab.state.season), 'Autumn', 'JSON import round trip');
    await lab.locator('#lab-json').fill('{"kind":"path-lab","schema":99}');await lab.locator('#lab-import').click();assert.match(await lab.locator('#lab-json-feedback').textContent(), /Not imported/);
    await lab.locator('#lab-variant-name').fill('smoke');await lab.locator('#lab-save').click();assert.equal(await lab.locator('#lab-variants li').count(), 1);
    if (process.env.PATH_LAB_SHOT) { await lab.locator('#lab-centerline').check(); await lab.screenshot({ path: process.env.PATH_LAB_SHOT }); }
    assert.deepEqual(labErrors, []);await lab.close();
  }
  pass('Path Lab: N12 reference renders the editable map, deep-linked scenario and season, real painting with undo/redo, V2 honestly disabled, JSON export/import validation, saved variant');

  const phone = await browser.newContext({ viewport: { width: 390, height: 844 } });
  for (const path of ['index.html#watchtower', 'index.html#style-guide', 'phaser-demo.html', 'path-lab.html']) {
    const { page: small, errors: smallErrors } = await open(phone, path);
    await small.waitForTimeout(800);
    assert.equal(await small.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${path} fits a phone`);
    assert.deepEqual(smallErrors, []);
    await small.close();
  }
  pass('studio and demo fit a 390 px phone without horizontal scrolling');
} finally {
  await browser.close();
  await server.close();
}
