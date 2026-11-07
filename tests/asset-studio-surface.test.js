import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectDefinitions } from '../src/data/objects/index.js';
import { buildCatalog, validateAssetSpec } from '../studio/src/lib/specs.js';
import { GENERATORS } from '../studio/src/generators/index.js';
import { pixelToTile, tileToPixel, periodicNoise, periodicFbm, validateSurfaceSpec, gameWearFromSpec, hexToRgb, lightness, chroma, WEAR_STAGES } from '../studio/src/lib/surface.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const specs = readdirSync(path.join(root, 'art/assets')).flatMap(category => readdirSync(path.join(root, 'art/assets', category)).map(id => json(`art/assets/${category}/${id}/asset.json`)));
const catalog = buildCatalog({ specs, generators: GENERATORS, style, gameDefinitions: objectDefinitions });
const surfaces = catalog.studio.filter(asset => GENERATORS[asset.generator].kind === 'surface');
const pngSize = file => { const data = readFileSync(path.join(root, file)); return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }; };

test('tile space maps the diamond corners and round-trips', () => {
  assert.deepEqual(pixelToTile(32, 0), { u: 0, v: 0 });
  assert.deepEqual(pixelToTile(64, 16), { u: 1, v: 0 });
  assert.deepEqual(pixelToTile(32, 32), { u: 1, v: 1 });
  assert.deepEqual(pixelToTile(0, 16), { u: 0, v: 1 });
  for (const [u, v] of [[0.2, 0.7], [0.5, 0.5], [0.9, 0.1]]) { const p = tileToPixel(u, v), back = pixelToTile(p.x, p.y); assert.ok(Math.abs(back.u - u) < 1e-9 && Math.abs(back.v - v) < 1e-9); }
});

test('ground noise repeats every tile, so neighbouring tiles join without seams', () => {
  for (const [u, v] of [[0, 0.3], [0.25, 0], [0, 0], [0.61, 0.12]]) {
    assert.ok(Math.abs(periodicNoise(7, 5, u, v) - periodicNoise(7, 5, u + 1, v)) < 1e-9);
    assert.ok(Math.abs(periodicNoise(7, 5, u, v) - periodicNoise(7, 5, u, v + 3)) < 1e-9);
    assert.ok(Math.abs(periodicFbm(11, u, v) - periodicFbm(11, u - 2, v + 1)) < 1e-9);
  }
  const values = Array.from({ length: 50 }, (_, i) => periodicFbm(3, i / 50, (i * 7 % 50) / 50));
  assert.ok(Math.max(...values) - Math.min(...values) > 0.2, 'noise is not flat');
});

test('ground variants are valid, exported with a tile sheet and stay drafts or reviews', () => {
  assert.ok(surfaces.some(a => a.id === 'grass-ground') && surfaces.some(a => a.id === 'worn-path'));
  const approvals = json('art/approvals.json');
  for (const asset of surfaces) {
    assert.equal(asset.category, 'terrain');
    assert.deepEqual(validateAssetSpec(asset, { generators: GENERATORS, style }), [], asset.id);
    assert.ok(asset.variants.length >= 3, `${asset.id} offers several variants`);
    for (const variant of asset.variants) {
      const meta = json(variant.paths.spriteMeta), sheet = pngSize(variant.paths.spriteSheet);
      assert.equal(meta.specHash, variant.hash, `${variant.id}: export is stale, run npm run studio:export`);
      assert.ok(existsSync(path.join(root, variant.paths.spriteSheet)));
      assert.deepEqual(sheet, { width: meta.surface.frames * 64, height: 32 }, `${variant.id} sheet holds 64 × 32 frames`);
      assert.equal(meta.surface.frames, variant.spec.mode === 'path' ? WEAR_STAGES : variant.spec.mode === 'transition' ? 16 : variant.spec.tiles);
      const review = approvals.assets[asset.id]?.variants?.[variant.id];
      if (review?.status === 'approved') assert.equal(review.specHash, variant.hash, `${variant.id}: approval matches the current spec`);
    }
  }
});

test('worn stages darken towards muted brown; today\'s orange-tan path colours fail the rule', () => {
  const path = surfaces.find(a => a.id === 'worn-path');
  for (const variant of path.variants) {
    const wear = gameWearFromSpec(variant.spec, style);
    assert.equal(wear.length, 3);
    assert.ok(wear.every(w => /^#[0-9a-f]{6}$/.test(w.color) && /^#[0-9a-f]{6}$/.test(w.edge) && w.width > 0));
    const last = hexToRgb(wear[2].color);
    assert.ok(lightness(last) < 0.36 && chroma(last) <= 0.24, `${variant.id}: last stage is dark, muted soil`);
  }
  const moss = path.variants[0].spec;
  // The previous in-game path colours (before the approved moss path) fail the rule.
  const before = [['#a2a06c', '#9b9f66'], ['#a78d5c', '#96935f'], ['#a58353', '#8d8957']];
  const asBefore = { ...moss, stages: before.map(([colour, edge], i) => ({ ...moss.stages[i], colour, edge })) };
  assert.ok(validateSurfaceSpec(asBefore, { style }).some(p => /orange|darker/.test(p)));
  assert.ok(validateSurfaceSpec({ ...moss, stages: [moss.stages[0], { ...moss.stages[1], colour: '#b04020' }, moss.stages[2]] }, { style }).length);
  assert.ok(validateSurfaceSpec({ mode: 'grass', base: 'nope', shades: ['meadow'], blades: { density: 500, height: [9, 2], colours: [] } }, { style }).length >= 4);
});
