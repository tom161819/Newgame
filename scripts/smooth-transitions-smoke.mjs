import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { decodePng } from './png-lite.mjs';

// m-plynule-prechody (73, 78) in a real page: fish rise and sink smoothly and touch the surface with light rings (none
// under winter ice); the continuous ground changes season gradually in patches over the 3-day window, a few chunks
// per step, trees and bushes by the same mask; a game loaded mid-change draws the same step; FPS with and without a
// change running. Screenshots /tmp/shots/smooth-*.png (look at them), numbers in /tmp/smooth-transitions.json.
const SHOTS = '/tmp/shots', WORLD = 'MKW5-155515555555-1', MEASURE_MS = Number(process.env.SMOOTH_MEASURE_MS ?? 40000);
const scene = (page, fn, arg) => page.evaluate(fn, arg);
const frames = page => page.evaluate(() => new Promise(resolve => { window.__game.registry.get('application').scene.refreshVisibility(); requestAnimationFrame(() => requestAnimationFrame(resolve)); }));
// Repaint until every chunk in view shows its current ground look (one ground repaint a frame).
async function settle(page, timeout = 60000) {
  const end = Date.now() + timeout;
  for (;;) {
    await frames(page);
    const left = await scene(page, () => { const s = window.__game.registry.get('application').scene, t = s.terrain; let n = 0; for (const key of t.neededChunks ?? []) { const [cx, cy] = key.split(',').map(Number), c = t.groundCache?.get(key); if (!c || c.stamp.split('|')[0] !== t.groundLook(cx, cy).key || t.dirtyChunks.has(key)) n++; } return n; });
    if (!left) return; if (Date.now() > end) throw new Error(`${left} chunks still waiting for their season repaint`);
  }
}
const advance = (page, ms) => scene(page, ms => { const s = window.__game.registry.get('application').scene; s.gameTime.setPaused(false); s.gameTime.update(ms); s.gameTime.setPaused(true); }, ms);
// Milliseconds from now to `day` (float, days into the cycle counted from cycle day 1).
const msTo = (page, day) => scene(page, day => { const s = window.__game.registry.get('application').scene, D = s.gameTime.dayDuration; return (day - (s.seasons.cycleDay - 1)) * D - s.seasons.cycleElapsed; }, day);
const sample = page => scene(page, () => {
  const s = window.__game.registry.get('application').scene, t = s.terrain, keys = {}, trees = {}, bushes = {};
  for (const key of t.neededChunks ?? []) { const [cx, cy] = key.split(',').map(Number), k = t.groundLook(cx, cy).key, kind = k.includes('>') ? 'mixed' : k; keys[kind] = (keys[kind] ?? 0) + 1; }
  const view = s.cameras.main.worldView;
  for (const o of s.naturalResources.byId.values()) { const v = s.naturalResources.view(o); if (!v?.season) continue; const p = { x: 3200 + (o.x - o.y) * 32, y: 128 + (o.x + o.y) * 16 }; if (p.x < view.x || p.x > view.right || p.y < view.y || p.y > view.bottom) continue; trees[v.season] = (trees[v.season] ?? 0) + 1; }
  for (const key of s.bushes?.keys?.() ?? []) { const [x, y] = key.split(',').map(Number), season = t.tileSeason(x, y); bushes[season] = (bushes[season] ?? 0) + 1; }
  return { state: s.seasonTransition.state(), keys, trees, bushes, season: t.season };
});
// Mean brightness of the map area of a screenshot (HUD edges cut off).
function brightness(file) { const png = decodePng(file); let sum = 0, n = 0; for (let y = 220; y < png.height - 220; y += 3) for (let x = 320; x < png.width - 320; x += 3) { const o = (y * png.width + x) * 4; sum += png.data[o] + png.data[o + 1] + png.data[o + 2]; n++; } return sum / n / 3; }
async function shot(page, name) { const path = `${SHOTS}/${name}.png`; await page.screenshot({ path }); return { path, brightness: +brightness(await readFile(path)).toFixed(1) }; }

export async function smoothTransitionsSmoke(context, url, instrument) {
  const own = await context.browser().newContext({ viewport: { width: 1440, height: 900 } });
  await own.addInitScript(() => { try { localStorage.setItem('newgame.tutorial', 'off'); localStorage.setItem('newgame.tips', 'off'); localStorage.setItem('newgame.language', 'en'); localStorage.setItem('newgame.devBalance', JSON.stringify({ mode: true })); localStorage.removeItem('newgame.gameSpeed'); } catch { /* none */ } let state = 99173; Math.random = () => ((state = Math.imul(state, 1664525) + 1013904223 >>> 0) / 2 ** 32); });
  const page = await own.newPage(); await instrument?.(page); const errors = []; page.on('pageerror', e => errors.push(e.message));
  const sleeping = context.pages(); for (const p of sleeping) await p.evaluate(() => window.__game?.loop?.sleep?.()).catch(() => {});
  const out = { world: WORLD };
  try {
    await mkdir(SHOTS, { recursive: true });
    await page.goto(url); await page.locator('#new-game:not([disabled])').click();
    await page.locator('#setup-world-code').evaluate((e, code) => { e.value = code; e.dispatchEvent(new Event('input', { bubbles: true })); e.dispatchEvent(new Event('change', { bubbles: true })); }, WORLD);
    await page.locator('#start-game').click(); await page.waitForFunction(() => window.__game?.registry.get('application').scene?.seasonTransition);
    await page.locator('#help-dialog[open]').waitFor({ timeout: 10000 }).then(() => page.keyboard.press('Escape')).catch(() => {});
    await page.evaluate(() => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); });

    // ---- 73: fish on the river ----
    const water = await scene(page, () => {
      const s = window.__game.registry.get('application').scene, gr = s.groundGrid, c = s.character.tile; s.dayNight.ambientAlpha = () => 0; s.worldCamera.following = false; s.fog.setEnabled(false); s.workerSystem.unsubscribe?.();
      s.seasons.random = () => 0; s.seasons.setEnabled(true); s.playerPaused = true; // visuals run, the simulation stands
      let best = null; for (let y = 0; y < gr.length; y++) for (let x = 0; x < gr[y].length; x++) if (gr[y][x] === 4 && s.fishing.state(s.fishing.bodyAt(x, y)) === 'plentiful') { const d = Math.hypot(x - c.x, y - c.y); if (!best || d < best.d) best = { x, y, d }; }
      const cam = s.cameras.main; cam.setZoom(1.6).centerOn(3200 + (best.x - best.y) * 32, 128 + (best.x + best.y + 1) * 16); cam.preRender(); s.refreshVisibility();
      return best;
    });
    assert.ok(water, 'deep water with plentiful fish');
    await settle(page); await page.waitForTimeout(500);
    // Every frame for 1.2 s: the mean fade of the fish that end up surfaced (a few are diving in their cycle).
    const rise = await page.evaluate(() => new Promise(resolve => { const f = window.__game.registry.get('application').scene.fishShadows, rows = [], t0 = performance.now();
      // Start the fish afresh, so the first frames show them rising.
      for (const [key, v] of f.fish) f.release(key, v); f.next = 0;
      const tick = () => { rows.push({ t: Math.round(performance.now() - t0), fish: [...f.fish.entries()].map(([k, v]) => [k, v.fade, v.image.visible ? v.image.alpha : 0]) }); if (performance.now() - t0 < 2000) requestAnimationFrame(tick); else resolve(rows); }; tick(); }));
    const up = new Set(rise.at(-1).fish.filter(([, fade]) => fade >= 0.99).map(([k]) => k)); assert.ok(up.size >= 3, `fish in view (${up.size} up of ${rise.at(-1).fish.length}, ${rise.length} frames)`);
    const curve = rise.map(r => { const v = r.fish.filter(([k]) => up.has(k)); return { t: r.t, fade: v.length ? v.reduce((a, [, f]) => a + f, 0) / v.length : 0, alpha: Math.max(0, ...v.map(([, , a]) => a)) }; });
    const fades = curve.filter((_, i) => i % Math.max(1, Math.floor(curve.length / 8)) === 0).map(c => +c.fade.toFixed(2));
    assert.ok(curve[0].fade < 0.2, `fish start in the depth (${curve[0].fade})`); assert.ok(curve.at(-1).fade > 0.99, 'and are fully up after the fade');
    const full = curve.find(c => c.fade >= 0.99); assert.ok(full.t >= 600, `fully up after about 0.8 s, not at once (${full.t} ms)`);
    for (let i = 1; i < curve.length; i++) assert.ok(curve[i].fade >= curve[i - 1].fade - 1e-9 && curve[i].fade - curve[i - 1].fade <= 100 / 800 + 0.02, `rises smoothly, frame by frame: ${JSON.stringify(curve.map(c => [c.t, +c.fade.toFixed(2)]))}`);
    out.fishRise = curve.map(c => ({ t: c.t, fade: +c.fade.toFixed(3), alpha: +c.alpha.toFixed(3) }));
    await scene(page, () => { const f = window.__game.registry.get('application').scene.fishShadows; for (const v of f.fish.values()) { v.fade = 1; v.ripple = f.time; } f.update(16); });
    const rings = await scene(page, () => window.__game.registry.get('application').scene.fishShadows.ripples.length); assert.ok(rings > 0, 'rings on open water');
    await page.waitForTimeout(250); out.fishShot = await shot(page, 'smooth-fish'); out.rings = rings;

    // ---- 78: autumn → winter over the window, screenshots at several blend steps ----
    await scene(page, w => { const s = window.__game.registry.get('application').scene, cam = s.cameras.main; cam.setZoom(0.6).centerOn(3200 + (w.x + 6 - w.y) * 32, 128 + (w.x + w.y + 6) * 16); cam.preRender(); }, water);
    // Days counted from cycle day 1: autumn is [10, 15), winter [15, 20); the change into winter opens 1.5 days before 15.
    const window_ = { start: 15 - 1.5, days: 3 }; await scene(page, () => window.__game.registry.get('application').scene.pauseManager.set('smooth', true));
    await advance(page, await msTo(page, window_.start - 0.05)); await settle(page);
    let a = await sample(page); assert.equal(a.state, null, 'just before the window: plain autumn'); assert.equal(a.season, 'Autumn');
    const steps = []; steps.push({ step: 'before', ...a, ...(await shot(page, 'smooth-season-0-before')) });
    for (const k of [1, 3, 5, 7, 8]) {
      await advance(page, await msTo(page, window_.start + (k + 0.5) / 9 * window_.days)); const t0 = Date.now(); await settle(page); const settleMs = Date.now() - t0;
      a = await sample(page); assert.equal(a.state?.step, k, `step ${k}`); steps.push({ step: k, settleMs, ...a, ...(await shot(page, `smooth-season-${k}`)) });
    }
    await advance(page, await msTo(page, window_.start + window_.days + 0.05)); await settle(page); a = await sample(page);
    assert.equal(a.state, null); assert.equal(a.season, 'Winter'); steps.push({ step: 'after', ...a, ...(await shot(page, 'smooth-season-9-after')) });
    out.steps = steps;
    const mid = steps.filter(s => [3, 5].includes(s.step));
    assert.ok(mid.some(s => s.keys.mixed > 0), `mid-change chunks blend by the mask: ${JSON.stringify(mid.map(s => s.keys))}`);
    assert.ok(mid.some(s => s.trees.Autumn > 0 && s.trees.Winter > 0) || mid.every(s => !Object.keys(s.trees).length), `trees turn one by one: ${JSON.stringify(mid.map(s => s.trees))}`);
    assert.ok(mid.some(s => s.bushes.Autumn > 0 && s.bushes.Winter > 0) || !Object.keys(mid[0].bushes).length, `bushes turn one by one: ${JSON.stringify(mid.map(s => s.bushes))}`);
    // Gradual: the snow brightens the view step by step, no single step does most of the change.
    const b = steps.map(s => s.brightness), total = b.at(-1) - b[0]; assert.ok(total > 10, `winter is brighter (${b.join(' → ')})`);
    for (let i = 1; i < b.length; i++) assert.ok(b[i] - b[i - 1] < total * 0.5, `no popping: step ${steps[i].step} changes ${(b[i] - b[i - 1]).toFixed(1)} of ${total.toFixed(1)}`);

    // Under the ice no rings.
    await scene(page, w => { const s = window.__game.registry.get('application').scene, cam = s.cameras.main; cam.setZoom(1.6).centerOn(3200 + (w.x - w.y) * 32, 128 + (w.x + w.y + 1) * 16); cam.preRender(); s.refreshVisibility(); const f = s.fishShadows; f.next = 0; f.update(16); for (const r of f.ripples) r.born = -1e9; f.update(16); }, water);
    const ice = await scene(page, () => { const f = window.__game.registry.get('application').scene.fishShadows; for (const v of f.fish.values()) { v.fade = 1; v.ripple = f.time; } f.update(16); return { fish: f.fish.size, rings: f.ripples.length, frozen: [...f.fish.values()].every(v => f.frozen(v.tile)) }; });
    assert.ok(ice.fish > 0 && ice.frozen, 'fish under the ice'); assert.equal(ice.rings, 0, 'no rings under ice'); out.ice = ice; out.iceShot = await shot(page, 'smooth-fish-winter');

    // ---- Load mid-change: the same step, the same picture ----
    await scene(page, w => { const s = window.__game.registry.get('application').scene, cam = s.cameras.main; cam.setZoom(0.6).centerOn(3200 + (w.x + 6 - w.y) * 32, 128 + (w.x + w.y + 6) * 16); cam.preRender(); }, water);
    await advance(page, await msTo(page, 20 - 1.5 + 4.5 / 9 * 3)); await settle(page); const saved = await sample(page); assert.equal(saved.state?.from, 'Winter');
    const before = await shot(page, 'smooth-load-before'), snapshot = await scene(page, () => window.__game.registry.get('application').snapshot());
    await scene(page, async state => { const app = window.__game.registry.get('application'), ready = app.onGameReady.bind(app); window.__restored = false; app.onGameReady = s => { ready(s); s.pauseManager.set('smooth', true); s.dayNight.ambientAlpha = () => 0; s.worldCamera.following = false; s.workerSystem.unsubscribe?.(); window.__restored = true; app.onGameReady = ready; }; await app.load(state); }, snapshot);
    await page.waitForFunction(() => window.__restored); await page.evaluate(() => { for (const d of document.querySelectorAll('dialog[open]')) d.close(); });
    await scene(page, w => { const s = window.__game.registry.get('application').scene, cam = s.cameras.main; s.fog.setEnabled(false); cam.setZoom(0.6).centerOn(3200 + (w.x + 6 - w.y) * 32, 128 + (w.x + w.y + 6) * 16); cam.preRender(); }, water);
    await settle(page); const loaded = await sample(page), after = await shot(page, 'smooth-load-after');
    assert.deepEqual(loaded.state, saved.state, 'Load: the same step of the change'); assert.deepEqual(loaded.keys, saved.keys, 'Load: the same chunk looks');
    assert.ok(Math.abs(after.brightness - before.brightness) < 3, `Load: the same picture (${before.brightness} vs ${after.brightness})`);
    out.load = { saved: saved.state, loaded: loaded.state, before, after };

    // ---- FPS: ×3 in the middle of spring (no change), ×3 while spring → summer runs (about 3 steps), spring again; the
    // plain runs bracket the change so a busy machine (other agents' builds) shifts both alike. groundMs = time spent
    // painting and blending the ground in that window (the cost of the change itself, independent of the frame rate).
    const measure = async name => {
      await scene(page, () => { const s = window.__game.registry.get('application').scene; s.pauseManager.set('smooth', false); s.playerPaused = false; s.speedControls.setSpeed(3); s.devBalancePanel.setProfiling(false); s.devBalancePanel.setProfiling(true); s.__paints = [s.terrain.paintStats.groundPaints ?? 0, s.terrain.paintStats.groundBlends ?? 0, s.terrain.paintStats.groundMs ?? 0]; });
      await page.waitForTimeout(MEASURE_MS);
      const r = await scene(page, () => { const s = window.__game.registry.get('application').scene, r = s.devBalancePanel.profiler.report(), p = s.terrain.paintStats; s.devBalancePanel.setProfiling(false); s.pauseManager.set('smooth', true); return { fps: r.fps, frameMs: r.frameMs, paints: (p.groundPaints ?? 0) - s.__paints[0], blends: (p.groundBlends ?? 0) - s.__paints[1], groundMs: Math.round((p.groundMs ?? 0) - s.__paints[2]), state: s.seasonTransition.state() }; });
      r.groundShare = +(r.groundMs / MEASURE_MS * 100).toFixed(2);
      console.log(`  ${name}: ${r.fps} FPS, frame ${r.frameMs.avg} ms avg / ${r.frameMs.p95} ms p95, ${r.paints} ground paints + ${r.blends} blends = ${r.groundMs} ms (${r.groundShare} % of the time)${r.state ? `, change ${r.state.from}→${r.state.to} step ${r.state.step}` : ''}`); return r;
    };
    await advance(page, await msTo(page, 21.52)); await settle(page); const plainA = await measure('spring, no change ×3 (before)');
    await advance(page, await msTo(page, 23.45)); await settle(page); const during = await measure('spring → summer running ×3');
    await advance(page, await msTo(page, 26.6)); await settle(page); const plainB = await measure('summer, no change ×3 (after)');
    const plain = { fps: +((plainA.fps + plainB.fps) / 2).toFixed(1) };
    out.fps = { plainA, during, plainB, plainAvg: plain.fps, drop: +((1 - during.fps / plain.fps) * 100).toFixed(1), groundShare: during.groundShare };
    console.log(`  FPS during the change: ${out.fps.drop} % below the plain seasons around it; the change itself took ${during.groundShare} % of the time`);
    assert.ok(during.paints > 0, 'the change repainted chunks while measured');
    assert.deepEqual(errors, []);
    await writeFile('/tmp/smooth-transitions.json', JSON.stringify(out, null, 2) + '\n');
    console.log(`PASS smooth transitions: fish rise (${fades.join(' → ')}), ${rings} rings, none under ice; season steps ${steps.map(s => `${s.step}:${s.brightness}`).join(' ')}; Load mid-change identical; FPS ${plain.fps} → ${during.fps} (${out.fps.drop} %). Shots ${SHOTS}/smooth-*.png`);
  } finally { await own.close(); for (const p of sleeping) await p.evaluate(() => window.__game?.loop?.wake?.()).catch(() => {}); }
}
