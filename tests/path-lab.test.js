import test from 'node:test';
import assert from 'node:assert/strict';
import { WearMap, History, stamp, strokeLine, SCENARIOS, scenarioMap, exportLab, importLab, validateLab, LAB_SIZE } from '../studio/src/path-lab/model.js';
import { PARAMS, PRESETS, RENDERERS, defaultConfig, clampParam } from '../studio/src/path-lab/params.js';
import { currentPathRenderer } from '../studio/src/path-lab/current.js';

test('#115 Path Lab brush: square stamps, gap-free strokes, levels clamped, edges ignored', () => {
  const map = new WearMap(LAB_SIZE);
  stamp(map, 5, 5, 2, 3);assert.equal(map.count(), 9);assert.equal(map.get(4, 4), 2);assert.equal(map.get(6, 6), 2);
  strokeLine(map, { x: 0, y: 12 }, { x: 23, y: 20 }, 1);for (let x = 0; x <= 23; x++) assert.ok([...Array(24).keys()].some(y => map.get(x, y) === 1), `column ${x} painted`);
  map.set(1, 1, 9);assert.equal(map.get(1, 1), 3);stamp(map, 0, 0, 3, 5);assert.equal(map.get(-1, -1), 0, 'outside the map is ignored');
});

test('#115 Path Lab history: one entry per stroke, undo/redo, no entry without a change', () => {
  const map = new WearMap(8), history = new History(map);
  strokeLine(map, { x: 0, y: 0 }, { x: 7, y: 0 }, 2);assert.equal(history.commit(map), true);assert.equal(history.commit(map), false);
  stamp(map, 3, 3, 3, 2);history.commit(map);
  const undone = history.undo();assert.equal(undone.count(), 8);assert.equal(history.undo().count(), 0);assert.equal(history.undo(), null);
  assert.equal(history.redo().count(), 8);assert.equal(history.redo().count(), 12);assert.equal(history.canRedo, false);
});

test('#115 Path Lab scenarios are deterministic and cover the required scenes', () => {
  for (const id of ['straight', 'curves', 'corner', 'junctions', 'path-to-area', 'mixed', 'levels']) assert.ok(SCENARIOS.some(s => s.id === id), id);
  for (const s of SCENARIOS) assert.ok(scenarioMap(s.id).equals(scenarioMap(s.id)), `${s.id} deterministic`);
  const straight = scenarioMap('straight');assert.equal(straight.count(), 12, 'the straight path is 1 × 12');
  const area = scenarioMap('path-to-area');assert.equal([5, 6, 7].every(y => [9, 10, 11].every(x => area.get(x, y) === 3)), true, '3 × 3 area');assert.equal(area.get(13, 16), 3, '5 × 5 area');
  assert.equal(SCENARIOS.find(s => s.id === 'path-to-area').priority, true);assert.throws(() => scenarioMap('nope'), /Unknown scenario/);
});

test('#115 Path Lab JSON: export round trip, strict validation with clear messages', () => {
  const map = scenarioMap('corner'), data = exportLab({ name: 'Mine', preset: 'organic', seed: 7, season: 'Winter', map, config: { cornerRounding: 0.8 } });
  assert.deepEqual(JSON.parse(JSON.stringify(data)), data);
  const back = importLab(JSON.parse(JSON.stringify(data)), { presets: PRESETS, params: PARAMS });
  assert.ok(back.map.equals(map));assert.equal(back.season, 'Winter');assert.equal(back.config.cornerRounding, 0.8);assert.equal(back.preset, 'organic');
  const errors = validateLab({ ...data, schema: 2, season: 'Monsoon', wear: [5], preset: 'x', config: { cornerRounding: 9, bogus: 1 } }, { presets: PRESETS, params: PARAMS });
  for (const part of [/schema 2/, /season/, /wear must hold/, /unknown preset/, /cornerRounding must be/, /unknown parameter "bogus"/]) assert.ok(errors.some(e => part.test(e)), `${part} in ${errors.join(' | ')}`);
  assert.throws(() => importLab({ kind: 'other' }), /kind must be/);
});

test('#115 Path Lab parameters and presets: every V2 control is real data in range; V2 is not claimed before #116', () => {
  const keys = ['meanderStrength', 'meanderFrequency', 'meanderSmoothness', 'cornerRounding', 'minCurveRadius', 'width1', 'width2', 'width3', 'edgeIrregularity', 'edgeSoftness', 'noiseScale', 'areaExpansion', 'areaSmoothness', 'blendDistance'];
  assert.deepEqual(PARAMS.map(p => p.key), keys);
  for (const p of PARAMS) assert.ok(p.min < p.max && p.default >= p.min && p.default <= p.max && p.tip, p.key);
  assert.deepEqual(PRESETS.map(p => p.id), ['current', 'natural-subtle', 'organic', 'wild']);
  for (const p of PRESETS.filter(p => p.config)) for (const [k, v] of Object.entries(p.config)) assert.equal(clampParam(k, v), v, `${p.id}.${k} in range`);
  assert.equal(RENDERERS.current, true);assert.equal(RENDERERS.v2, false, 'V2 arrives with #116');assert.equal(Object.keys(defaultConfig()).length, keys.length);
});

test('#115 Current reference uses the production N12 path geometry on the lab map (links, areas, determinism)', () => {
  const straight = currentPathRenderer(scenarioMap('straight'));
  const mid = straight.pathElements(10, 12);assert.ok(mid.links.length >= 2, 'a straight path links its neighbours');assert.equal(mid.areas.length, 0);
  assert.deepEqual(JSON.stringify(currentPathRenderer(scenarioMap('straight')).pathElements(10, 12)), JSON.stringify(mid), 'deterministic');
  const area = currentPathRenderer(scenarioMap('path-to-area')).pathElements(14, 16);assert.ok(area.areas.length > 0, 'a 5 × 5 area becomes N12 blobs');
  assert.equal(currentPathRenderer(new WearMap(LAB_SIZE)).pathElements(5, 5).links.length, 0);
});
