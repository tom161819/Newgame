import test from 'node:test';
import assert from 'node:assert/strict';
import { WearMap, History, stamp, strokeLine, SCENARIOS, scenarioMap, exportLab, importLab, validateLab, LAB_SIZE } from '../studio/src/path-lab/model.js';
import { PARAMS, PRESETS, RENDERERS, defaultConfig, clampParam } from '../studio/src/path-lab/params.js';
import { currentPathRenderer } from '../studio/src/path-lab/current.js';

test('#115 Path Lab brush: square stamps, gap-free strokes, levels clamped, edges ignored', () => {
  const map = new WearMap(LAB_SIZE);
  stamp(map, 5, 5, 2, 3);assert.equal(map.count(), 9);assert.equal(map.get(4, 4), 2);assert.equal(map.get(6, 6), 2);
  strokeLine(map, { x: 0, y: 12 }, { x: 23, y: 20 }, 1);for (let x = 0; x <= 23; x++) assert.ok([...Array(24).keys()].some(y => map.get(x, y) === 1), `column ${x} painted`);
  map.set(1, 1, 9);assert.equal(map.get(1, 1), 4);stamp(map, 0, 0, 3, 5);assert.equal(map.get(-1, -1), 0, 'outside the map is ignored');
});

test('#115 Path Lab history: one entry per stroke, undo/redo, no entry without a change', () => {
  const map = new WearMap(8), history = new History(map);
  strokeLine(map, { x: 0, y: 0 }, { x: 7, y: 0 }, 2);assert.equal(history.commit(map), true);assert.equal(history.commit(map), false);
  stamp(map, 3, 3, 3, 2);history.commit(map);
  const undone = history.undo();assert.equal(undone.count(), 8);assert.equal(history.undo().count(), 0);assert.equal(history.undo(), null);
  assert.equal(history.redo().count(), 8);assert.equal(history.redo().count(), 12);assert.equal(history.canRedo, false);
});

test('#115 Path Lab scenarios are deterministic and cover the required scenes', () => {
  for (const id of ['straight', 'curves', 'corner', 'junctions', 'path-to-area', 'mixed', 'levels', 'transitions']) assert.ok(SCENARIOS.some(s => s.id === id), id);
  for (const s of SCENARIOS) assert.ok(scenarioMap(s.id).equals(scenarioMap(s.id)), `${s.id} deterministic`);
  const straight = scenarioMap('straight');assert.equal(straight.count(), 12, 'the straight path is 1 × 12');
  const area = scenarioMap('path-to-area');assert.equal([5, 6, 7].every(y => [9, 10, 11].every(x => area.get(x, y) === 4)), true, '3 × 3 area (soil level 3 is lab level 4)');assert.equal(area.get(13, 16), 4, '5 × 5 area');
  assert.deepEqual([...new Set(scenarioMap('levels').cells)].sort(), [0, 1, 2, 3, 4], 'the levels scene shows all five levels');
  assert.equal(SCENARIOS.find(s => s.id === 'path-to-area').priority, true);assert.throws(() => scenarioMap('nope'), /Unknown scenario/);
});

test('#115 Path Lab JSON: export round trip, strict validation with clear messages', () => {
  const map = scenarioMap('corner'), data = exportLab({ name: 'Mine', preset: 'organic', seed: 7, season: 'Winter', map, config: { cornerRounding: 0.8 } });
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data);
  const back = importLab(JSON.parse(JSON.stringify(data)), { presets: PRESETS, params: PARAMS });
  assert.ok(back.map.equals(map));assert.equal(back.season, 'Winter');assert.equal(back.config.cornerRounding, 0.8);assert.equal(back.preset, 'organic');
  const errors = validateLab({ ...data, schema: 3, season: 'Monsoon', wear: [5], preset: 'x', config: { cornerRounding: 9, bogus: 1 } }, { presets: PRESETS, params: PARAMS });
  for (const part of [/schema 3/, /season/, /wear must hold/, /unknown preset/, /cornerRounding must be/, /unknown parameter "bogus"/]) assert.ok(errors.some(e => part.test(e)), `${part} in ${errors.join(' | ')}`);
  assert.throws(() => importLab({ kind: 'other' }), /kind must be/);
});

test('#115/#116 Path Lab parameters and presets: every V2 control is real data in range', () => {
  const keys = ['meanderStrength', 'meanderFrequency', 'meanderSmoothness', 'cornerRounding', 'minCurveRadius', 'widthGrass', 'width1', 'width2', 'width3', 'levelBlend', 'edgeIrregularity', 'edgeSoftness', 'noiseScale', 'areaExpansion', 'areaSmoothness', 'blendDistance'];
  assert.deepEqual(PARAMS.map(p => p.key), keys);
  for (const p of PARAMS) assert.ok(p.min < p.max && p.default >= p.min && p.default <= p.max && p.tip, p.key);
  assert.deepEqual(PRESETS.map(p => p.id), ['current', 'natural-subtle', 'organic', 'wild', 'pesinav2', 'custom']);
  for (const p of PRESETS.filter(p => p.config)) for (const [k, v] of Object.entries(p.config)) assert.equal(clampParam(k, v), v, `${p.id}.${k} in range`);
  assert.equal(RENDERERS.current, true);assert.equal(RENDERERS.v2, true, 'V2 (#116) is registered');assert.equal(Object.keys(defaultConfig()).length, keys.length);
});

test('#115 Current reference uses the production N12 path geometry on the lab map (links, areas, determinism)', () => {
  const straight = currentPathRenderer(scenarioMap('straight'));
  const mid = straight.pathElements(10, 12);assert.ok(mid.links.length >= 2, 'a straight path links its neighbours');assert.equal(mid.areas.length, 0);
  assert.deepEqual(JSON.stringify(currentPathRenderer(scenarioMap('straight')).pathElements(10, 12)), JSON.stringify(mid), 'deterministic');
  const area = currentPathRenderer(scenarioMap('path-to-area')).pathElements(14, 16);assert.ok(area.areas.length > 0, 'a 5 × 5 area becomes N12 blobs');
  assert.equal(currentPathRenderer(new WearMap(LAB_SIZE)).pathElements(5, 5).links.length, 0);
});

import { topology, geometry, centerline, fieldAt, buckets, noise, ground } from '../studio/src/path-lab/v2.js';
import { PRESETS as LAB_PRESETS } from '../studio/src/path-lab/params.js';
const cfg = id => LAB_PRESETS.find(p => p.id === id).config;

test('#116 V2 topology: chains through junctions, areas from 2 × 2 blocks, a 1-tile line never becomes an area', () => {
  const straight = topology(scenarioMap('straight'));assert.equal(straight.chains.length, 1);assert.equal(straight.chains[0].length, 12);assert.equal(straight.areas.length, 0);
  const junctions = topology(scenarioMap('junctions'));assert.equal(junctions.chains.length, 10, 'T (3) + Y (3) + crossing (4)');
  const area = topology(scenarioMap('path-to-area'));assert.ok(area.areas.length >= 9 + 25, 'both areas');assert.equal(area.chains.length, 3, 'three narrow paths enter the areas');
  // A diagonal joins only where no corner tile is worn (no false links, as N12).
  const diag = new WearMap(8);diag.set(2, 2, 2);diag.set(3, 3, 2);assert.equal(topology(diag).chains.length, 1);diag.set(3, 2, 2);const l = topology(diag).chains;assert.equal(l.length, 1);assert.equal(l[0].length, 3, 'an L through the corner tile, no diagonal shortcut');
});

test('#116 V2 centerlines: deterministic per seed, continuous, rounded corners, meander fades at junctions', () => {
  const chain = topology(scenarioMap('corner')).chains[0];
  const a = centerline(chain, cfg('organic'), 1), b = centerline(chain, cfg('organic'), 1), c2 = centerline(chain, cfg('organic'), 2);
  assert.deepEqual(a, b, 'same seed → same line');assert.notDeepEqual(a, c2, 'another seed → another line');
  for (let i = 1; i < a.length; i++) assert.ok(Math.hypot(a[i].x - a[i - 1].x, a[i].y - a[i - 1].y) < 12, 'no gaps along the line');
  // The 90° corner tile centre is no longer on the line: it is rounded off.
  const corner = ground({ x: 14, y: 8 }), nearest = Math.min(...a.map(p => Math.hypot(p.x - corner.x, p.y - corner.y)));assert.ok(nearest > 4, `corner rounded (${nearest.toFixed(1)} px)`);
  const flat = centerline(chain, { ...cfg('organic'), cornerRounding: 0, meanderStrength: 0 }, 1);assert.ok(Math.min(...flat.map(p => Math.hypot(p.x - corner.x, p.y - corner.y))) < 1, 'rounding 0 keeps the corner');
  // A straight 1 × 12 path drifts sideways with meander and stays straight without.
  const line = topology(scenarioMap('straight')).chains[0], off = l => Math.max(...l.map(p => Math.abs((p.x - l[0].x) * (l.at(-1).y - l[0].y) - (p.y - l[0].y) * (l.at(-1).x - l[0].x)) / Math.hypot(l.at(-1).x - l[0].x, l.at(-1).y - l[0].y)));
  assert.ok(off(centerline(line, cfg('wild'), 1)) > 4, 'wild meanders');assert.ok(off(centerline(line, { ...cfg('wild'), meanderStrength: 0 }, 1)) < 0.5, 'no meander → straight');
});

test('#116 V2 surface: inside the path and the area, outside in grass; the path widens into the area; widths follow wear', () => {
  const geo = geometry(scenarioMap('path-to-area'), cfg('organic'), 1), index = buckets(geo);
  const at = (x, y) => fieldAt(geo, x, y, index.at(x, y)).distance;
  const pathTile = ground({ x: 4, y: 6 }), areaTile = ground({ x: 13, y: 16 }), grass = ground({ x: 4, y: 11 });
  assert.ok(at(pathTile.x, pathTile.y) < 0 || at(geo.lines[0][Math.floor(geo.lines[0].length / 2)].x, geo.lines[0][Math.floor(geo.lines[0].length / 2)].y) < 0, 'on the path');
  assert.ok(at(areaTile.x, areaTile.y) < -10, 'deep inside the 5 × 5 area');assert.ok(at(grass.x, grass.y) > 10, 'grass stays grass');
  const entering = geo.lines.find(l => l.some(p => p.level >= 2)), widths = entering.map(p => p.width);
  assert.ok(Math.max(...widths) > Math.min(...widths) * 1.5, 'the path widens towards the area (blend)');
  const noBlend = geometry(scenarioMap('path-to-area'), { ...cfg('organic'), blendDistance: 0 }, 1);assert.ok(Math.max(...noBlend.lines.flat().map(p => p.width)) <= 14, 'without blend the width stays the wear width');
  const levels = geometry(scenarioMap('levels'), cfg('organic'), 1).lines.map(l => l[Math.floor(l.length / 2)]);
  const byLevel = lv => levels.find(p => Math.round(p.level) === lv)?.width;assert.ok(byLevel(2) < byLevel(3) && byLevel(3) < byLevel(4), 'wear 2 < 3 < 4');assert.ok(byLevel(1) > 0, 'trampled grass has its own width');
});

test('#116 V2 is local and fast: a far change leaves a path untouched; one full field pass stays quick', () => {
  const map = scenarioMap('straight'), before = geometry(map, cfg('organic'), 3).lines[0];
  map.set(22, 22, 3);map.set(22, 23, 3);const after = geometry(map, cfg('organic'), 3).lines.find(l => l.length === before.length);
  assert.deepEqual(after, before, 'world-space noise: a distant edit does not move the path');
  const geo = geometry(scenarioMap('mixed'), cfg('wild'), 1), index = buckets(geo);let samples = 0;const t0 = performance.now();
  for (let y = -200; y < 3200; y += 8) for (let x = 1600; x < 4800; x += 8) { const near = index.at(x, y); if (near) { fieldAt(geo, x, y, near); samples++; } }
  const ms = performance.now() - t0;assert.ok(ms < 1500, `${samples} samples in ${ms.toFixed(0)} ms`);
  assert.ok(Math.abs(noise(1.5, 2.5, 1)) <= 1 && noise(1.5, 2.5, 1) === noise(1.5, 2.5, 1));
});

import { levelAt } from '../studio/src/path-lab/v2.js';
import { tileCenter } from '../src/game/isometric.js';
test('Path Lab five levels: schema 1 files move up by one, N12 sees the soil levels only', () => {
  const old = { schema: 1, kind: 'path-lab', name: 'Old', preset: 'organic', seed: 1, season: 'Summer', size: 8, wear: Array(64).fill(0).map((_, i) => [0, 1, 2, 3][i % 4]), config: {} };
  const back = importLab(old, { presets: PRESETS, params: PARAMS });assert.deepEqual([...new Set(back.map.cells)].sort(), [0, 2, 3, 4], 'old 1–3 become 2–4');
  assert.ok(validateLab({ ...old, wear: Array(64).fill(4) }).some(e => /levels 0–3/.test(e)), 'schema 1 never had level 4');
  const map = new WearMap(8);map.set(2, 2, 1);map.set(3, 2, 4);const n12 = currentPathRenderer(map);
  assert.equal(n12.wear.level({ x: 2, y: 2 }), 0, 'trampled grass is grass for N12');assert.equal(n12.wear.level({ x: 3, y: 2 }), 3);
});

test('V2 wear level is a smooth field: no jump at tile edges, along a 1 → 4 path and inside a mixed 3/4 area', () => {
  const geo = geometry(scenarioMap('transitions'), cfg('organic'), 1), index = buckets(geo);
  const level = (x, y) => { const c = tileCenter({ x, y }), g = { x: c.x, y: c.y * 2 }; return fieldAt(geo, g.x, g.y, index.at(g.x, g.y)).level; };
  for (const [from, to, y] of [[1, 13, 8], [14, 19, 7], [14, 19, 9], [15, 15, 5]]) {
    let prev = null;
    for (let x = from; x <= Math.max(to, from + 0.01); x += 0.125) { const l = level(x, y); if (prev !== null) assert.ok(Math.abs(l - prev) < 0.3, `smooth at ${x.toFixed(2)},${y}: ${prev.toFixed(2)} → ${l.toFixed(2)}`); prev = l; }
  }
  assert.ok(level(2, 8) < 1.15 && level(12.5, 8) > 3.6, 'still reaches grass and full wear at the ends');
  const sharp = geometry(scenarioMap('transitions'), { ...cfg('organic'), levelBlend: 0 }, 1), soft = geometry(scenarioMap('transitions'), { ...cfg('organic'), levelBlend: 1 }, 1);
  const g = (() => { const c = tileCenter({ x: 7.5, y: 8 }); return { x: c.x, y: c.y * 2 }; })();
  assert.ok(Math.abs(levelAt(sharp, g.x, g.y) - 2.5) > Math.abs(levelAt(soft, g.x, g.y) - 2.5) - 0.05, 'Level transition widens the blend');
  assert.equal(levelAt(geometry(new WearMap(8), cfg('organic'), 1), 0, 0), null);
});

test("The owner's pesinav2 map and settings are committed, valid and match the preset", async () => {
  const { readFileSync } = await import('node:fs');
  const data = JSON.parse(readFileSync(new URL('../art/path-lab/pesinav2.json', import.meta.url), 'utf8'));
  const lab = importLab(data, { presets: PRESETS, params: PARAMS });assert.equal(lab.map.size, 24);assert.ok(lab.map.count() > 100);
  assert.deepEqual(PRESETS.find(p => p.id === 'pesinav2').config, { ...defaultConfig(), ...data.config }, 'preset = the exported settings');
});
