// Castle concepts (plan g-hrad-nova-grafika): three approaches on the game's castle footprint, no taller than allowed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectDefinitions } from '../src/data/objects/index.js';
import { GENERATORS } from '../studio/src/generators/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json'), spec = json('art/assets/buildings/castle/asset.json');
const game = objectDefinitions.find(d => d.id === 'castle');

test('castle concepts keep the game footprint and stay within 20 % of today’s height', () => {
  assert.deepEqual(spec.footprint, { width: game.width, height: game.height }, 'the footprint does not change (saves, gathering)');
  assert.equal(spec.gameObjectId, 'castle');
  // The owner's renders of the four Castle levels (castle-l1 … l4, 14 Nov 2026) are imported pictures, not concepts.
  const concepts = spec.variants.filter(v => !v.baked);
  assert.deepEqual(concepts.map(v => v.spec.layout), ['curtain', 'keep', 'motte']);
  for (const variant of concepts) {
    const meta = json(`art/sprites/castle/${variant.id}.v${variant.version}.json`);
    assert.ok(meta.height <= Math.round(game.visualHeight * 1.2), `${variant.id}: ${meta.height} px ≤ ${Math.round(game.visualHeight * 1.2)} px`);
    assert.ok(meta.platform, `${variant.id}: a platform for the king`);
  }
});

test('every castle has its banner, gate torches on the gathering side and lit windows', () => {
  for (const variant of spec.variants) {
    const model = GENERATORS.castle.build(variant.spec, { footprint: spec.footprint, style });
    assert.ok(model.primitives.some(p => p.material === 'banner'), `${variant.id} banner`);
    const torches = model.lights.filter(l => l.type === 'torch'), windows = model.lights.filter(l => l.type === 'window');
    assert.equal(torches.length, 2, `${variant.id}: two gate torches`);
    assert.ok(torches.every(l => l.at[2] > 0.9), `${variant.id}: the gate faces +Z, where people gather`);
    assert.ok(windows.length >= 2, `${variant.id}: lit windows`);
    assert.ok(model.platform[1] > 2, `${variant.id}: the platform is high up`);
  }
  assert.equal(style.lightSources.window.flameSize, 0, 'window light glows without a flame');
});
