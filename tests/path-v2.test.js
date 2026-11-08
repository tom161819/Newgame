import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { geometry, fieldAt, buckets } from '../src/game/pathV2.js';
import * as lab from '../studio/src/path-lab/v2.js';
import { PATH_STYLE } from '../src/data/pathStyle.js';
import { PATH_WEAR, wearLevel } from '../src/data/pathWear.js';
import { PathV2Layer } from '../src/game/PathV2Layer.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

const preset = JSON.parse(readFileSync(new URL('../art/path-lab/pesinav2.json', import.meta.url)));
const owner = JSON.parse(readFileSync(new URL('../art/path-lab/pesiny-v3.json', import.meta.url)));
const wearMap = (size, wear) => ({ size, get: (x, y) => x < 0 || y < 0 || x >= size || y >= size ? 0 : wear[y * size + x] });

test('the game uses the owner\'s pesiny-v3 settings from the Path Lab proposal', () => {
  assert.deepEqual({ ...PATH_STYLE }, owner.config);
});

test('#116 the game copy of the V2 geometry gives the lab\'s shapes and field for the lab test map', () => {
  const map = wearMap(preset.size, preset.wear), game = geometry(map, PATH_STYLE, preset.seed), studio = lab.geometry(map, PATH_STYLE, preset.seed);
  assert.deepEqual(game.lines, studio.lines); assert.deepEqual(game.discs, studio.discs); assert.deepEqual(game.tiles, studio.tiles); assert.equal(game.segments.length, studio.segments.length);
  const gameIndex = buckets(game), labIndex = lab.buckets(studio);
  for (let i = 0; i < 400; i++) {
    const x = 400 + (i * 37) % 1100, y = 300 + (i * 53) % 900, a = gameIndex.at(x, y), b = labIndex.at(x, y);
    if (!a || !b) { if (b && !a) assert.ok(lab.fieldAt(studio, x, y, b).distance > 15, `nothing drawn where the game skips ${x},${y}`); continue; }
    const f = fieldAt(game, x, y, a), g = lab.fieldAt(studio, x, y, b);
    // The game looks up fewer far shapes (they cannot change what is drawn): compare where the surface is drawn.
    if (g.distance > 15) { assert.ok(f.distance > 15 || Math.abs(f.distance - g.distance) < 1e-9, `far at ${x},${y}`); continue; }
    assert.ok(Math.abs(f.distance - g.distance) < 1e-9 && Math.abs(f.level - g.level) < 1e-9, `field at ${x},${y}`);
  }
});

test('#116 four wear levels: trampled grass first at half the traffic, then the former soil levels and bonuses', () => {
  assert.deepEqual(PATH_WEAR.thresholds, [0, 3, 5, 15, 30]); assert.deepEqual(PATH_WEAR.speedMultipliers, [1, 1, 1.05, 1.1, 1.15]);
  assert.deepEqual([2, 3, 5, 15, 30].map(wearLevel), [0, 1, 2, 3, 4]);
  assert.equal(objectRegistry.require(PATH_WEAR.terrainIds[1]).id, 'grass_trodden');
  assert.deepEqual(PATH_WEAR.terrainIds.slice(2), ['grass_trampled_1', 'grass_trampled_2', 'grass_trampled_3']);
});

test('#116 the V2 layer rebuilds only when shown levels change and repaints only around the changed path', () => {
  const levels = new Map(), invalidated = [];
  for (let x = 20; x < 30; x++) levels.set(`${x},20`, 3);
  for (let y = 60; y < 70; y++) levels.set(`70,${y}`, 2);
  const renderer = { registry: objectRegistry, wear: { levelRevision: 1 }, pathLevel: t => levels.get(`${t.x},${t.y}`) ?? 0, invalidateArea: tiles => invalidated.push(...tiles), scene: { textures: { exists: () => false } } };
  const layer = new PathV2Layer(renderer);
  assert.equal(layer.refresh(), true); assert.equal(layer.stats.builds, 1); assert.equal(layer.refresh(), false, 'nothing changed');
  layer.cache.set(20 * 100 + 25, { veil: 0, canvas: null }); layer.cache.set(65 * 100 + 70, { veil: 0, canvas: null });
  levels.set('30,20', 3); renderer.wear.levelRevision++; layer.lastScan = -Infinity;
  assert.equal(layer.refresh(), true); assert.equal(layer.stats.builds, 2);
  assert.ok(invalidated.some(t => t.x === 30 && t.y === 20) && invalidated.some(t => t.x === 20 && t.y === 20), 'the whole changed chain is repainted');
  assert.ok(!invalidated.some(t => t.x === 70), 'the other path is untouched');
  assert.equal(layer.cache.get(20 * 100 + 25).stale, true); assert.equal(layer.cache.get(65 * 100 + 70).stale, undefined);
  assert.equal(layer.near(25, 20), true); assert.equal(layer.near(50, 90), false);
});
