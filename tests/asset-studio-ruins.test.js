// #149 v2: the rough stone wall recipe of the ruins generator.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { checkModel } from '../studio/src/lib/specs.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const asset = json('art/assets/decorations/ruined-wall/asset.json');
const build = spec => GENERATORS.ruins.build(spec, { footprint: asset.footprint, style });
const wallStones = model => model.primitives.filter(p => p.shape === 'box' && p.material.startsWith('fieldstone'));

const live = asset.variants.filter(v => !v.baked);

test('every broken wall variant is a v2 rough stone wall that fits its footprint and repeats exactly', () => {
  for (const variant of live) {
    assert.equal(variant.version, 2, variant.id);
    assert.equal(variant.spec.kind, 'stonewall', variant.id);
    const model = build(variant.spec);
    assert.deepEqual(checkModel(model, { footprint: asset.footprint, style }), [], variant.id);
    assert.deepEqual(build(variant.spec), model, `${variant.id}: same seed, same model`);
    assert.ok(!model.primitives.some(p => p.material === 'stone' || p.material === 'stone_light'), `${variant.id}: no brick-textured blocks`);
    assert.ok(model.primitives.some(p => p.material === 'soil'), `${variant.id}: stands on soil, not on a flat plinth`);
  }
});

test('stones are irregular: lengths, heights and twists differ and the broken top is uneven', () => {
  for (const variant of live) {
    const stones = wallStones(build(variant.spec));
    const distinct = values => new Set(values.map(v => v.toFixed(3))).size;
    assert.ok(distinct(stones.map(s => s.size[0])) > stones.length * 0.6, `${variant.id}: stone lengths vary`);
    assert.ok(distinct(stones.map(s => s.size[1])) > stones.length * 0.5, `${variant.id}: stone heights vary`);
    assert.ok(stones.filter(s => s.rotation).length > stones.length * 0.9, `${variant.id}: stones are twisted`);
    // Highest stone per 0.2-unit slice along the wall: the top must not be flat or a regular staircase.
    const tops = new Map();
    for (const s of stones) { const bin = Math.floor((s.at[0] + 1) / 0.2); tops.set(bin, Math.max(tops.get(bin) ?? 0, s.at[1] + s.size[1])); }
    const steps = [...tops.keys()].sort((a, b) => a - b).map(k => tops.get(k)).map((v, i, all) => (i ? v - all[i - 1] : 0)).slice(1);
    assert.ok(distinct(steps) >= steps.length - 1, `${variant.id}: the top does not drop in equal steps`);
  }
});

test('the breach is open to the ground with a heap in it, and seeds change the wall', () => {
  const breach = asset.variants.find(v => v.id === 'ruined-wall-breach').spec, model = build(breach);
  const gap = wallStones(model).filter(s => Math.abs(s.at[0]) < 0.08 && s.at[1] > 0.3);
  assert.equal(gap.length, 0, 'no wall stones above 0.3 units in the middle of the breach');
  assert.ok(model.primitives.filter(p => p.shape === 'sphere' && p.material.startsWith('fieldstone') && Math.abs(p.at[0]) < 0.4).length >= 8, 'fallen stones heap up in the breach');
  assert.notDeepEqual(build({ ...breach, seed: breach.seed + 1 }), model);
});

test('overgrowth, ivy, the window and the lean appear only when asked for', () => {
  const plain = build({ kind: 'stonewall', seed: 3, green: 0 }), overgrown = asset.variants.find(v => v.id === 'ruined-wall-overgrown').spec;
  const leaves = model => model.primitives.filter(p => p.shape === 'sphere' && p.material.startsWith('foliage')).length;
  assert.ok(leaves(build(overgrown)) > leaves(plain) + 20, 'ivy and bushes add foliage');
  assert.ok(build(overgrown).primitives.some(p => p.material === 'moss'));
  const crumbling = asset.variants.find(v => v.id === 'ruined-wall-crumbling').spec, model = build(crumbling);
  assert.ok(model.primitives.some(p => p.material === 'opening'), 'the tall end keeps its window');
  assert.ok(!plain.primitives.some(p => p.material === 'opening'));
  // Leaning part: stones high up on the right stand further out (+z, the sunlit face) than those on the upright left.
  const mean = list => list.reduce((sum, s) => sum + s.at[2], 0) / list.length, high = wallStones(model).filter(s => s.at[1] > 0.35);
  const leaning = high.filter(s => s.at[0] > 0.1), upright = high.filter(s => s.at[0] < -0.4);
  assert.ok(leaning.length >= 4 && mean(leaning) > mean(upright) + 0.01, 'the crumbling end leans out towards the sunlit face');
});

test('the older ruin recipes are unchanged (no generator version bump)', () => {
  assert.equal(GENERATORS.ruins.version, 1);
  const tower = json('art/assets/decorations/ruined-tower/asset.json'), approvals = json('art/approvals.json');
  for (const variant of tower.variants) {
    const meta = json(`art/sprites/ruined-tower/${variant.id}.v${variant.version}.json`);
    assert.equal(meta.generatorVersion, 1, variant.id);
    if (approvals.assets['ruined-tower']?.variants?.[variant.id]) assert.equal(approvals.assets['ruined-tower'].variants[variant.id].specHash, meta.specHash, `${variant.id} keeps its reviewed hash`);
  }
});

// Blender pilot: the baked twin of Breach is committed with metadata that matches the Studio's spec hash and anchor convention.
test('the Blender-baked Breach is committed at 1× and 2× with metadata matching its spec', async () => {
  const { buildCatalog } = await import('../studio/src/lib/specs.js');
  const { projectPoint } = await import('../studio/src/lib/projection.js');
  const baked = asset.variants.filter(v => v.baked);
  assert.deepEqual(baked.map(v => v.id), ['ruined-wall-blender']);
  const entry = buildCatalog({ specs: [asset], generators: GENERATORS, style }).studio[0].variants.find(v => v.id === 'ruined-wall-blender');
  const meta = json('art/sprites/ruined-wall/ruined-wall-blender.v1.json'), twin = json('art/sprites/ruined-wall/ruined-wall-breach.v2.json');
  assert.equal(meta.specHash, entry.hash, 'bake again after changing the spec');
  assert.equal(meta.generator, 'blender'); assert.equal(meta.render.renderHash, baked[0].baked.renderHash);
  assert.deepEqual(baked[0].spec, asset.variants.find(v => v.id === baked[0].baked.twin).spec, 'same layout as its Studio twin');
  // Same projection and framing as the Studio render of the same layout: identical anchor, size within a few pixels.
  assert.deepEqual(meta.anchor, twin.anchor);
  assert.ok(Math.abs(meta.width - twin.width) <= 3 && Math.abs(meta.height - twin.height) <= 3, `${meta.width}×${meta.height} vs ${twin.width}×${twin.height}`);
  const corner = projectPoint([1, 0, 0.5]);
  assert.deepEqual(meta.base, { x: +(meta.anchor.x + corner.x).toFixed(2), y: +(meta.anchor.y + corner.y).toFixed(2) });
  for (const axis of ['x', 'y']) assert.ok(Math.abs(meta.x2.anchor[axis] - meta.anchor[axis] * 2) <= 2, `2× anchor ${axis} is about twice the 1× anchor`);
  const png = readFileSync(path.join(root, 'art/sprites/ruined-wall/ruined-wall-blender.v1.png'));
  assert.equal(png.readUInt32BE(16), meta.width); assert.equal(png.readUInt32BE(20), meta.height);
  const png2 = readFileSync(path.join(root, 'art/sprites/ruined-wall/ruined-wall-blender.v1.x2.png'));
  assert.equal(png2.readUInt32BE(16), meta.x2.width); assert.equal(png2.readUInt32BE(20), meta.x2.height);
});
