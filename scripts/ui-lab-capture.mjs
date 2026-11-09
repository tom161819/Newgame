#!/usr/bin/env node
// UI Lab (Studio): captures the game's real interface so the Lab can restyle and rearrange it without running the game.
// Builds the game, starts a new game in a headless browser, and saves to art/ui/snapshots/:
//   screen.html – the game screen markup (HUD, bars, corner panels) with the map canvas left out,
//   background.png – the map itself (no interface), as the Lab's backdrop,
//   panels.json – each window and panel opened, filled with live data: { id, title, kind, html },
//   img/<hash>.png – pictures the interface shows inline (building icons…); the HTML points at them as
//   __UI_IMG__/<hash>.png so the snapshots stay small and the Lab resolves them at build time.
//   npm run ui:capture
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { browserRuntime } from './browser-runtime.mjs';
import { serveStudio } from './studio-server.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const build = '/tmp/mk-ui-capture', out = path.join(root, 'art/ui/snapshots');
await rm(build, { recursive: true, force: true });
execFileSync(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js'), 'build', '--outDir', build, '--emptyOutDir', '--base', '/game/', '--logLevel', 'warn'], { cwd: root, stdio: 'inherit' });
const server = await serveStudio({ directory: build, base: '/game/' });
const runtime = await browserRuntime();
const browser = await runtime.chromium.launch({ executablePath: runtime.executablePath, args: ['--no-sandbox', '--disable-dev-shm-usage', '--enable-unsafe-swiftshader'] });
const W = 1440, H = 900;
// Each window the Lab can show: how to open it in the game and how the player closes it again.
// Inline pictures (data: URLs) go to img/ once each; the markup refers to them by hash.
const images = new Map();
const extractImages = html => html.replace(/data:image\/(png|jpeg|webp|svg\+xml);base64,([A-Za-z0-9+/=]+)/g, (_, type, data) => {
  const bytes = Buffer.from(data, 'base64'), hash = createHash('sha256').update(bytes).digest('hex').slice(0, 12), ext = type === 'svg+xml' ? 'svg' : type === 'jpeg' ? 'jpg' : type;
  images.set(`${hash}.${ext}`, bytes);
  return `__UI_IMG__/${hash}.${ext}`;
});
const PANELS = [
  { id: 'hud-details', title: 'Resources (expanded HUD)', kind: 'hud', open: 'click:#hud-details-toggle', close: 'click:#hud-details-toggle' },
  { id: 'buildings-panel', title: 'Buildings menu', kind: 'bar', open: 'click:#buildings-tab', close: 'click:#buildings-tab' },
  { id: 'population-panel', title: 'Population sidebar', kind: 'sidebar', open: 'click:#population-tab', close: 'click:#close-population' },
  { id: 'settings-panel', title: 'Settings', kind: 'sidebar', open: 'click:#settings-button', close: 'click:#close-settings' },
  { id: 'help-dialog', title: 'Getting started', kind: 'panel', open: 'scene:gettingStarted', close: 'click:.help-window-summary' },
  { id: 'storage-dialog', title: 'Storage', kind: 'dialog', open: 'scene:storagePanel', close: 'key:Escape' },
  { id: 'food-economy-dialog', title: 'Food economy', kind: 'dialog', open: 'clicks:#hud-details-toggle|#open-food-economy', close: 'key:Escape' },
  { id: 'employment-panel', title: 'Employment', kind: 'sidebar', open: 'scene:employmentPanel', close: 'key:Escape' },
  { id: 'equipment-dialog', title: 'Equipment', kind: 'dialog', open: 'scene:equipmentPanel', close: 'key:Escape' },
  { id: 'unit-dialog', title: 'King / unit', kind: 'docked', open: 'unit', close: 'key:Escape' },
  { id: 'workplace-dialog', title: 'Workplace (Lumberjack Hut)', kind: 'dialog', open: 'fixture:lumberjack_hut', close: 'key:Escape' },
  { id: 'pause-menu', title: 'Pause menu', kind: 'dialog', open: 'key:Escape', close: 'key:Escape' },
  { id: 'marketplace-dialog', title: 'Marketplace (trade)', kind: 'dialog', open: 'fixture:marketplace>marketplacePanel', close: 'key:Escape' },
];

try {
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  // Same hook as the browser smoke: expose the Phaser game as window.__game.
  await page.route('**/assets/index-*.js', async route => { const response = await route.fetch(); await route.fulfill({ response, body: (await response.text()).replace(/new ([\w$]+)\.Game\(/, 'window.__game = new $1.Game(') }); });
  await page.goto(`${server.url}index.html`);
  await page.locator('#new-game:not([disabled])').click(); await page.locator('#start-game').click();
  await page.waitForFunction(() => window.__game?.registry.get('application').scene?.kingLogistics);
  await page.locator('#help-dialog').waitFor({ timeout: 15000 }).catch(() => {});await page.evaluate(()=>{const d=document.querySelector('#help-dialog');if(d)d.open=false;});
  await page.evaluate(() => { const s = window.__game.registry.get('application').scene; s.fog?.setEnabled?.(false); });
  // Let the HUD's resource icons and the minimap finish drawing.
  await page.waitForTimeout(5000);
  await mkdir(out, { recursive: true });
  // The map alone: hide every overlay of the viewport, screenshot it, show them again.
  await page.addStyleTag({ content: '.ui-capture-hide * { visibility: hidden !important; } .ui-capture-hide #game, .ui-capture-hide #game > canvas { visibility: visible !important; }' });
  await page.evaluate(() => document.body.classList.add('ui-capture-hide'));
  const box = await page.locator('.viewport').boundingBox();
  await page.screenshot({ path: path.join(out, 'background.png'), clip: box });
  await page.evaluate(() => document.body.classList.remove('ui-capture-hide'));
  // The whole in-game page: <main> with the HUD and bars plus the fixed tabs, sidebars and (closed) dialogs around it.
  const screen = await page.evaluate(() => {
    // Canvases outside the map (minimap, resource icons) become pictures of what they showed.
    const pictures = [...document.body.querySelectorAll('canvas')].map(c => { if (c.closest('#game')) return null; try { return c.toDataURL('image/png'); } catch { return null; } });
    const body = document.body.cloneNode(true);
    [...body.querySelectorAll('canvas')].forEach((c, i) => {
      if (!pictures[i]) { c.remove(); return; }
      const img = document.createElement('img');
      for (const a of c.attributes) if (a.name !== 'id') img.setAttribute(a.name, a.value);
      if (c.id) img.dataset.canvasId = c.id;
      img.src = pictures[i]; img.alt = ''; img.style.width ||= `${c.width}px`; img.style.height ||= `${c.height}px`;
      c.replaceWith(img);
    });
    for (const el of body.querySelectorAll('#main-menu, #game-setup, script, .ui-capture-hide-style')) el.remove();
    for (const el of body.querySelectorAll('[inert]')) el.removeAttribute('inert');
    for (const d of body.querySelectorAll('dialog[open]')) d.removeAttribute('open');
    body.querySelector('#game')?.replaceChildren();
    return `<body class="${document.body.className}">${body.innerHTML}</body>`;
  });
  await rm(path.join(out, 'img'), { recursive: true, force: true }); await mkdir(path.join(out, 'img'), { recursive: true });
  await writeFile(path.join(out, 'screen.html'), `${extractImages(screen)}\n`);
  const panels = [];
  for (const panel of PANELS) {
    const act = async how => {
      const [type, arg] = how.split(/:(.*)/s);
      if (type === 'click') await page.locator(arg).click();
      else if (type === 'key') await page.keyboard.press(arg);
      else if (type === 'scene') await page.evaluate(name => window.__game.registry.get('application').scene[name].open(), arg);
      else if (type === 'unit') await page.evaluate(() => { const s = window.__game.registry.get('application').scene; s.unitPanel.open(s.character ?? s.king); });
      else if (type === 'clicks') { for (const selector of arg.split('|')) await page.locator(selector).click(); }
      else if (type === 'fixture') await page.evaluate(spec => {
        const [type, panelName = 'workplacePanel'] = spec.split('>');
        // A finished building placed whole near the King (as the game smokes do), then its panel.
        const s = window.__game.registry.get('application').scene, d = s.objectRegistry.require(type), c = s.character.tile, taken = new Set(s.reservedTiles().map(t => `${t.x},${t.y}`));
        let tiles = null, anchor = null;
        for (let y = c.y + 3; y < c.y + 20 && !anchor; y++) for (let x = c.x - 14; x < c.x + 14 && !anchor; x++) {
          const t = []; for (let dy = 0; dy < d.height; dy++) for (let dx = 0; dx < d.width; dx++) t.push({ x: x + dx, y: y + dy });
          if (t.every(p => s.map[p.y]?.[p.x] === 0 && !taken.has(`${p.x},${p.y}`) && !s.resourceOccupancy.has(`${p.x},${p.y}`))) { tiles = t; anchor = { x, y }; }
        }
        const b = { id: Math.max(0, ...s.buildings.map(b => b.id)) + 1, type, definition: d, ...anchor, tiles };
        s.buildings.push(b); for (const t of tiles) s.map[t.y][t.x] = 1; s.towerViews.set(b.id, s.createBuildingView(d, b));
        s.workplaceSystem?.register?.(b); s[panelName].open(b);
      }, arg);
    };
    try {
      await act(panel.open);
      await page.waitForTimeout(400);
      const html = await page.evaluate(id => { const el = document.getElementById(id); if (!el) return null; const c = el.cloneNode(true); c.removeAttribute('hidden'); if (c.tagName === 'DIALOG') c.setAttribute('open', ''); return c.outerHTML; }, panel.id);
      if (!html) throw new Error('not found');
      panels.push({ id: panel.id, title: panel.title, kind: panel.kind, html: extractImages(html) });
      console.log(`captured ${panel.id} (${html.length} chars)`);
      await act(panel.close).catch(() => {});
      await page.waitForTimeout(250);
      await page.evaluate(() => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); });
    } catch (error) { console.log(`skipped ${panel.id}: ${error.message.split('\n')[0]}`); await page.evaluate(() => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); }).catch(() => {}); }
  }
  for (const [name, bytes] of images) await writeFile(path.join(out, 'img', name), bytes);
  await writeFile(path.join(out, 'panels.json'), `${JSON.stringify({ capturedAt: new Date().toISOString(), viewport: { width: W, height: H }, panels }, null, 1)}\n`);
  if (errors.length) console.log('page errors:', errors);
} finally {
  await browser.close();
  await server.close();
}
