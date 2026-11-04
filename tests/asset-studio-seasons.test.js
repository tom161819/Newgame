import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { cylinder, cylinderTop } from '../studio/src/generators/shapes.js';
import { primitiveBounds, validateAssetSpec } from '../studio/src/lib/specs.js';
import { seasonBlend } from '../studio/src/lib/surface.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const assets = readdirSync(path.join(root, 'art/assets')).flatMap(c => readdirSync(path.join(root, 'art/assets', c)).map(id => json(`art/assets/${c}/${id}/asset.json`)));

test('season blend: never one frame, uneven between neighbours, complete at the end, monotonic per tile', () => {
  const tiles = [];
  for (let y = 0; y < 40; y++) for (let x = 0; x < 40; x++) tiles.push([x, y]);
  assert.ok(tiles.every(([x, y]) => seasonBlend(0, x, y) === 0 && seasonBlend(1, x, y) === 1));
  const mid = tiles.map(([x, y]) => seasonBlend(0.5, x, y));
  assert.ok(mid.some(v => v === 0) || mid.some(v => v < 0.2), 'some tiles have barely started halfway through');
  assert.ok(mid.some(v => v > 0.8), 'others have almost finished');
  const early = tiles.filter(([x, y]) => seasonBlend(0.1, x, y) > 0).length;
  assert.ok(early > 0 && early < tiles.length / 2, 'the change starts on a minority of tiles');
  let differs = 0;
  for (const [x, y] of tiles) if (Math.abs(seasonBlend(0.45, x, y) - seasonBlend(0.45, x + 1, y)) > 0.02) differs++;
  assert.ok(differs > tiles.length * 0.3, 'neighbouring tiles change at different moments');
  for (const [x, y] of tiles.slice(0, 200)) { let last = 0; for (let p = 0; p <= 1.0001; p += 0.05) { const v = seasonBlend(p, x, y); assert.ok(v >= last - 1e-12); last = v; } }
});

test('seasonal assets: valid, transition order and trees point at real variants, seasons change the leaves', () => {
  const ground = assets.find(a => a.id === 'season-ground'), byId = new Map(assets.flatMap(a => a.variants.map(v => [v.id, { asset: a, variant: v }])));
  assert.deepEqual(validateAssetSpec(ground, { generators: GENERATORS, style }), []);
  assert.equal(ground.transition.order.length, ground.transition.trees.length);
  for (const id of ground.transition.order) assert.equal(byId.get(id)?.asset.id, 'season-ground', id);
  for (const ids of ground.transition.trees) for (const id of ids) assert.ok(byId.has(id), id);
  const materials = spec => new Set(GENERATORS.tree.build(spec, { footprint: { width: 1, height: 1 }, style }).primitives.map(p => p.material));
  const oak = assets.find(a => a.id === 'oak-seasons'), m = Object.fromEntries(oak.variants.map(v => [v.spec.season, materials(v.spec)]));
  assert.ok(m.autumn.has('foliage_autumn') && !m.autumn.has('foliage'));
  assert.ok(m.spring.has('blossom') && m.winter.has('snow') && !m.winter.has('foliage'));
  const summer = assets.find(a => a.id === 'oak-tree').variants[0].spec;
  assert.deepEqual([...materials({ ...summer, season: 'summer' })].sort(), [...materials(summer)].sort(), 'summer stays the original oak');
  const pine = materials(assets.find(a => a.id === 'pine-seasons').variants.find(v => v.spec.season === 'winter').spec);
  assert.ok(pine.has('snow') && pine.has('pine_needles'));
});

test('tilted cylinders: top point and bounds follow the lean', () => {
  assert.deepEqual(cylinderTop({ height: 2 }), [0, 2, 0]);
  const leaning = cylinder({ radiusBottom: 0.05, height: 1, tilt: [0, -Math.PI / 6] }, [0, 1, 0], 'bark'), [tx, ty] = cylinderTop(leaning);
  assert.ok(Math.abs(tx - 0.5) < 1e-9 && Math.abs(ty - Math.cos(Math.PI / 6)) < 1e-9);
  const b = primitiveBounds(leaning);
  assert.ok(b.max[0] >= 0.5 && b.min[0] <= -0.05 && b.max[1] >= 1 + ty);
});
