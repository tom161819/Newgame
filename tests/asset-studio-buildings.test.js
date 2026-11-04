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

test('every prop uses style materials and fits a 2 × 2 site when placed at its centre', () => {
  assert.ok(PROP_TYPES.length >= 20);
  for (const type of PROP_TYPES) {
    const parts = type === 'fence' ? PROPS.fence(-0.5, 0, 0.5, 0) : PROPS[type](0, 0, {});
    assert.ok(parts.length > 0, type);
    assert.deepEqual(checkModel({ primitives: parts }, { footprint: { width: 2, height: 2 }, style }), [], type);
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
