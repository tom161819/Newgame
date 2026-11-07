import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { PROPS, PROP_TYPES } from '../studio/src/generators/props.js';
import { checkModel, validateAssetSpec, buildCatalog } from '../studio/src/lib/specs.js';
import { objectDefinitions } from '../src/data/objects/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const workshops = readdirSync(path.join(root, 'art/assets/buildings')).map(id => json(`art/assets/buildings/${id}/asset.json`)).filter(a => a.generator === 'workshop');
const catalog = buildCatalog({ specs: workshops, generators: GENERATORS, style }).studio;

test('every prop uses style materials and fits a 2 × 2 site (the wagon 3 × 3) when placed at its centre', () => {
  assert.ok(PROP_TYPES.length >= 20);
  for (const type of PROP_TYPES) {
    const parts = type === 'fence' ? PROPS.fence(-0.5, 0, 0.5, 0) : PROPS[type](0, 0, {});
    assert.ok(parts.length > 0, type);
    const site = type === 'wagon' ? 3 : 2; // the caravan wagon with its horse is a vehicle about two tiles long
    assert.deepEqual(checkModel({ primitives: parts }, { footprint: { width: site, height: site }, style }), [], type);
  }
});

test('building concepts tell their trade with props and stay concepts', () => {
  const gameIds = new Set(objectDefinitions.filter(d => d.category === 'building').map(d => d.id));
  const approvals = json('art/approvals.json');
  assert.ok(workshops.length >= 8);
  for (const asset of workshops) {
    assert.deepEqual(validateAssetSpec(asset, { generators: GENERATORS, style }), [], asset.id);
    if (asset.gameObjectId) assert.ok(gameIds.has(asset.gameObjectId), `${asset.id} names a real game building`);
    assert.ok(asset.variants.length >= 2, `${asset.id} offers alternatives`);
    for (const variant of asset.variants) {
      const types = new Set(variant.spec.props.map(p => p.type));
      assert.ok(types.size >= 3, `${variant.id}: at least three kinds of props`);
      const review = approvals.assets[asset.id]?.variants?.[variant.id];
      if (review?.status === 'approved') assert.equal(review.specHash, catalog.find(a => a.id === asset.id).variants.find(v => v.id === variant.id).hash, `${variant.id}: approval matches the current spec`);
    }
  }
  for (const id of ['farmhouse', 'granary', 'bakery', 'mill', 'warehouse', 'hunting_lodge', 'lumberjack_hut']) assert.ok(workshops.some(a => a.gameObjectId === id), id);
  // The furnace carries a runtime light like the approved brazier.
  const smelter = workshops.find(a => a.id === 'smelter'), model = GENERATORS.workshop.build(smelter.variants[0].spec, { footprint: smelter.footprint, style });
  assert.deepEqual(model.lights.map(l => l.type), ['brazier']);
});

test('wall kit: a full-tile block at the game wall height and one parapet per side', async () => {
  const { WALL_HEIGHT } = await import('../studio/src/generators/wallkit.js');
  const wall = (await import('../src/data/objects/index.js')).objectDefinitions.find(d => d.id === 'wall');
  assert.ok(Math.abs(WALL_HEIGHT * 39.191836 - wall.visual.wallHeight) < 1e-6, 'same 68 px wall walk as the game');
  const kit = json('art/assets/buildings/wall-kit/asset.json');
  assert.deepEqual(validateAssetSpec(kit, { generators: GENERATORS, style }), []);
  assert.deepEqual(kit.variants.map(v => v.spec.side ?? v.spec.piece).sort(), ['E', 'N', 'S', 'W', 'block']);
  const block = GENERATORS.wallkit.build({ piece: 'block' }, { footprint: kit.footprint, style });
  const top = Math.max(...block.primitives.map(p => p.at[1] + p.size[1]));
  assert.ok(Math.abs(top - WALL_HEIGHT) < 1e-9, 'the wall walk is the top of the block');
  const preview = json('art/assets/buildings/wall-kit-preview/asset.json'), cells = preview.variants[0].spec.cells.length;
  const model = GENERATORS.wallkit.build(preview.variants[0].spec, { footprint: preview.footprint, style });
  assert.equal(model.primitives.filter(p => p.material === 'stone_dark').length, cells, 'one block per cell');
});

// #97 gate, obchod F1 market and wagon, #100 bushes (7 Nov 2026 concepts).
test('the castle gate is a passable wall tile and the stair climbs to the wall walk', async () => {
  const { WALL_HEIGHT } = await import('../studio/src/generators/wallkit.js');
  const gate = state => GENERATORS.wallkit.build({ piece: 'gate', axis: 'x', state }, { footprint: { width: 1, height: 1 }, style });
  const blocking = model => model.primitives.filter(p => p.shape === 'box' && p.material.startsWith('stone') && p.at[1] < 0.5 && p.size[1] > 0.3 && Math.abs(p.at[2]) < 0.2);
  for (const state of ['closed', 'open', 'portcullis']) { const model = gate(state); assert.deepEqual(checkModel(model, { footprint: { width: 1, height: 1 }, style }), [], state); assert.equal(blocking(model).length, 0, `${state}: no masonry in the passage`); assert.ok(model.height >= WALL_HEIGHT, 'the walk continues over the gate'); }
  const doors = state => gate(state).primitives.filter(p => p.material === 'wood' && Math.abs(p.at[2]) < 0.2 && p.size?.[0] < 0.1).length;
  assert.ok(doors('closed') >= 2 && doors('open') === 0, 'closed doors stand across the passage, open ones lie against the jambs');
  const stair = GENERATORS.wallkit.build({ piece: 'stair', axis: 'x' }, { footprint: { width: 1, height: 1 }, style });
  const steps = stair.primitives.filter(p => p.size[2] > 0.5).sort((a, b) => a.at[0] - b.at[0]).map(p => p.size[1]);
  assert.ok(steps.every((h, i) => !i || h > steps[i - 1]) && Math.abs(steps.at(-1) - WALL_HEIGHT) < 1e-9, 'steps rise to the wall walk');
});

test('marketplace, merchant wagon and bushes are concepts that fit their tiles', () => {
  for (const id of ['marketplace', 'builders-workshop']) assert.deepEqual(json(`art/assets/buildings/${id}/asset.json`).footprint, { width: 3, height: 3 }, `${id} is 3 × 3`);
  const wagon = load => PROPS.wagon(0, 0, { load });
  for (const load of ['full', 'unloading', 'empty']) assert.deepEqual(checkModel({ primitives: wagon(load) }, { footprint: { width: 3, height: 3 }, style }), [], load);
  assert.ok(wagon('full').some(p => p.shape === 'prism' && p.material === 'cloth_linen') && !wagon('empty').some(p => p.shape === 'prism'), 'cover only when loaded');
  const turned = PROPS.wagon(0, 0, { angle: Math.PI / 2, horse: false });assert.ok(Math.max(...turned.map(p => Math.abs(p.at[0]))) < 0.4, 'angle turns the wagon to run along z');
  for (const spec of [{ kind: 'bush' }, { kind: 'bush', dry: true }, { kind: 'bush', berries: 'cloth_red' }]) { const model = GENERATORS.tree.build(spec, { footprint: { width: 1, height: 1 }, style }); assert.deepEqual(checkModel(model, { footprint: { width: 1, height: 1 }, style }), []); assert.ok(model.height < 1.3, 'a bush stays low'); }
});
