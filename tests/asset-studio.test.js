import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gridToWorld } from '../src/game/isometric.js';
import { objectDefinitions } from '../src/data/objects/index.js';
import { projectPoint, footprintDiamond, heightInPixels, PIXELS_PER_UNIT, VERTICAL_PIXELS_PER_UNIT, cameraDirection } from '../studio/src/lib/projection.js';
import { stableStringify, fnv1a, specHash } from '../studio/src/lib/hash.js';
import { validateAssetSpec, buildCatalog, filterCatalog, studioCategoryForGameObject, checkModel, modelBounds, primitiveBounds, CATEGORY_IDS } from '../studio/src/lib/specs.js';
import { STATUSES, emptyManifest, validateManifest, readLocal, writeLocal, reviewState, updateLocal, discardLocal, buildExportManifest, pendingChanges, LOCAL_KEY } from '../studio/src/lib/approvals.js';
import { timePreset, flicker, lightStrength, resolveLight, hexToRgb, rgbToHex, TIMES } from '../studio/src/lib/lighting.js';
import { GENERATORS } from '../studio/src/generators/index.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const approvals = json('art/approvals.json');
const specs = readdirSync(path.join(root, 'art/assets')).flatMap(category => readdirSync(path.join(root, 'art/assets', category)).map(id => ({ ...json(`art/assets/${category}/${id}/asset.json`), dir: `${category}/${id}` })));
const catalog = buildCatalog({ specs, generators: GENERATORS, style, gameDefinitions: objectDefinitions, gameSprites: {} });

function pngSize(file) {
  const data = readFileSync(path.join(root, file));
  assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${file} is a PNG`);
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

test('studio projection equals the game projection for ground points and the style guide numbers', () => {
  const origin = gridToWorld(0, 0);
  for (const [x, y] of [[1, 0], [0, 1], [3, 2], [-2, 5], [0.5, 0.5], [7.25, 1.5]]) {
    const game = gridToWorld(x, y), studio = projectPoint([x, 0, y]);
    assert.ok(Math.abs(studio.x - (game.x - origin.x)) < 1e-9 && Math.abs(studio.y - (game.y - origin.y)) < 1e-9, `${x},${y}`);
  }
  assert.ok(Math.abs(PIXELS_PER_UNIT - style.projection.pixelsPerUnit) < 1e-5);
  assert.ok(Math.abs(VERTICAL_PIXELS_PER_UNIT - style.projection.verticalPixelsPerUnit) < 1e-5);
  assert.ok(Math.abs(projectPoint([0, 1, 0]).y + VERTICAL_PIXELS_PER_UNIT) < 1e-9, 'height goes straight up');
  const diamond = footprintDiamond(2, 2);
  assert.deepEqual(diamond.map(p => [Math.round(p.x), Math.round(p.y)]), [[0, -32], [64, 0], [0, 32], [-64, 0]]);
  assert.equal(Math.round(heightInPixels(style.scale.humanHeight)), 47);
  const [cx, cy, cz] = cameraDirection();
  assert.ok(Math.abs(Math.hypot(cx, cy, cz) - 1) < 1e-12 && Math.abs(Math.asin(cy) * 180 / Math.PI - style.projection.elevationDeg) < 1e-9);
});

test('style guide is complete: materials use palette colours and known textures, times and light sources are defined', () => {
  const hex = /^#[0-9a-f]{6}$/;
  for (const [name, value] of Object.entries(style.palette)) assert.match(value, hex, name);
  for (const [id, m] of Object.entries(style.materials)) {
    assert.ok(style.palette[m.color], `${id} colour`);
    assert.ok(['bricks', 'planks', 'shingles', 'noise', 'none'].includes(m.texture), `${id} texture`);
    assert.ok(m.repeat > 0 && m.variation >= 0 && m.description, id);
  }
  assert.deepEqual(Object.keys(style.timeOfDay), TIMES);
  for (const time of TIMES) { assert.match(style.timeOfDay[time].ambient, hex); assert.ok(style.timeOfDay[time].lightScale >= 0); }
  assert.ok(style.lightSources.torch && style.lightSources.brazier);
  assert.equal(style.projection.tileWidth, 64); assert.equal(style.projection.tileHeight, 32);
});

test('every asset spec is valid, ids are unique and the watchtower has at least three variants', () => {
  for (const spec of specs) {
    assert.deepEqual(validateAssetSpec(spec, { generators: GENERATORS, style }), [], spec.id);
    assert.equal(spec.dir, `${spec.category}/${spec.id}`, 'folder matches category and id');
  }
  const variantIds = catalog.studio.flatMap(a => a.variants.map(v => v.id));
  assert.equal(new Set(variantIds).size, variantIds.length);
  const tower = catalog.studio.find(a => a.id === 'watchtower');
  assert.ok(tower.variants.length >= 3);
  assert.equal(tower.gameObjectId, 'tower');
  assert.ok(objectDefinitions.some(d => d.id === tower.gameObjectId), 'linked game object exists');
});

test('spec validation reports bad categories, ids, versions, materials and footprint overflow', () => {
  const base = structuredClone(specs.find(s => s.id === 'watchtower'));
  const bad = { ...base, category: 'castles', variants: [{ ...base.variants[0], id: 'other-a', version: 0 }] };
  const errors = validateAssetSpec(bad, { generators: GENERATORS, style });
  assert.ok(errors.some(e => /category/.test(e)) && errors.some(e => /must start with/.test(e)) && errors.some(e => /version/.test(e)));
  const model = { primitives: [{ shape: 'box', size: [3, 1, 0.5], at: [0, 0, 0], material: 'marble' }], lights: [{ type: 'laser', at: [0, 1, 0] }] };
  const problems = checkModel(model, { footprint: { width: 2, height: 2 }, style });
  assert.ok(problems.some(p => /marble/.test(p)) && problems.some(p => /leaves the 2×2 footprint/.test(p)) && problems.some(p => /laser/.test(p)));
});

test('generators are deterministic, clamp oversized specs into the footprint and emit lights for torches', () => {
  for (const asset of catalog.studio) for (const variant of asset.variants) {
    const generator = GENERATORS[asset.generator];
    if (generator.kind === 'surface') continue; // 2D recipes paint in the browser; tests/asset-studio-surface.test.js
    const a = generator.build(variant.spec, { footprint: asset.footprint, style }), b = generator.build(variant.spec, { footprint: asset.footprint, style });
    assert.equal(stableStringify(a), stableStringify(b), variant.id);
    const { max } = modelBounds(a);
    assert.ok(Math.abs(max[1] - a.height) < 0.05 || max[1] <= a.height + 0.05, `${variant.id} height`);
  }
  const huge = GENERATORS.watchtower.build({ body: 'square', width: 9, height: 20, top: 'hoarding', roof: 'pyramid', torches: [{ face: 'right', offset: 5, height: 50 }] }, { footprint: { width: 2, height: 2 }, style });
  assert.deepEqual(checkModel(huge, { footprint: { width: 2, height: 2 }, style }), []);
  assert.equal(huge.lights.length, 1);
  const square = catalog.studio.find(a => a.id === 'watchtower').variants.find(v => v.id === 'watchtower-square');
  const model = GENERATORS.watchtower.build(square.spec, { footprint: { width: 2, height: 2 }, style });
  assert.equal(model.lights.length, square.spec.torches.length);
  assert.ok(model.lights.every(l => l.type === 'torch' && l.at[1] > 1));
});

test('prism and sphere bounds are exact and only canopy parts may overhang the footprint', () => {
  const roof = { shape: 'prism', size: [1.2, 0.6, 2], at: [0, 1, 0], material: 'thatch' };
  assert.deepEqual(primitiveBounds(roof), { min: [-0.6, 1, -1], max: [0.6, 1.6, 1] });
  const turned = primitiveBounds({ ...roof, rotation: Math.PI / 2 });
  assert.ok(Math.abs(turned.max[0] - 1) < 1e-9 && Math.abs(turned.max[2] - 0.6) < 1e-9);
  assert.deepEqual(primitiveBounds({ shape: 'sphere', radii: [0.5, 0.3, 0.4], at: [1, 2, 3], material: 'foliage' }), { min: [0.5, 2, 2.6], max: [1.5, 2.6, 3.4] });
  const crown = { shape: 'sphere', radii: [0.7, 0.4, 0.7], at: [0, 1, 0], material: 'foliage' }, footprint = { width: 1, height: 1 };
  assert.ok(checkModel({ primitives: [crown] }, { footprint, style }).some(p => /leaves the 1×1 footprint/.test(p)), 'plain parts may not overhang');
  assert.deepEqual(checkModel({ primitives: [{ ...crown, overhang: true }] }, { footprint, style }), [], 'canopy may overhang by the style allowance');
  assert.ok(checkModel({ primitives: [{ ...crown, radii: [0.9, 0.4, 0.9], overhang: true }] }, { footprint, style }).some(p => /canopy overhang/.test(p)));
  for (const asset of catalog.studio.filter(a => a.generator === 'tree')) for (const variant of asset.variants) {
    const model = GENERATORS.tree.build(variant.spec, { footprint: asset.footprint, style });
    assert.ok(model.primitives.filter(p => !p.overhang).every(p => primitiveBounds(p).max[0] <= 0.5 && primitiveBounds(p).max[2] <= 0.5), `${variant.id} trunk stays on its tile`);
  }
  for (const variant of catalog.studio.find(a => a.id === 'stone-wall').variants) {
    const { min, max } = modelBounds(GENERATORS.wall.build(variant.spec, { footprint: { width: 1, height: 1 }, style }));
    assert.ok(Math.abs(min[0] + 0.5) < 1e-9 && Math.abs(max[0] - 0.5) < 1e-9, `${variant.id} spans the whole tile so segments join`);
  }
});

test('spec hashes are stable, order independent and change with spec, version or generator version', () => {
  assert.equal(stableStringify({ b: 1, a: [2, { d: 1, c: 2 }] }), '{"a":[2,{"c":2,"d":1}],"b":1}');
  assert.equal(fnv1a(''), '811c9dc5');
  const variant = { version: 1, spec: { a: 1, b: 2 } }, base = { generator: 'watchtower', generatorVersion: 1, styleVersion: 1 };
  const hash = specHash({ ...base, variant });
  assert.equal(hash, specHash({ ...base, variant: { version: 1, spec: { b: 2, a: 1 } } }));
  assert.notEqual(hash, specHash({ ...base, variant: { version: 2, spec: variant.spec } }));
  assert.notEqual(hash, specHash({ ...base, variant: { version: 1, spec: { a: 1, b: 3 } } }));
  assert.notEqual(hash, specHash({ ...base, generatorVersion: 2, variant }));
});

test('committed sprites exist for every variant, match the current spec hash and their PNG size', () => {
  for (const asset of catalog.studio) for (const variant of asset.variants) {
    assert.ok(existsSync(path.join(root, variant.paths.sprite)), `${variant.paths.sprite} exported`);
    const meta = json(variant.paths.spriteMeta), size = pngSize(variant.paths.sprite);
    assert.equal(meta.specHash, variant.hash, `${variant.id}: export is stale, run npm run studio:export`);
    assert.deepEqual([meta.width, meta.height], [size.width, size.height]);
    assert.equal(meta.assetId, asset.id); assert.equal(meta.variantId, variant.id); assert.equal(meta.version, variant.version);
    assert.ok(meta.anchor.x > 0 && meta.anchor.x < meta.width && meta.anchor.y > 0 && meta.anchor.y <= meta.height);
    assert.ok(Math.abs(meta.origin.x - meta.anchor.x / meta.width) < 1e-4 && Math.abs(meta.origin.y - meta.anchor.y / meta.height) < 1e-4);
    assert.ok(meta.lights.every(l => l.x >= 0 && l.x <= meta.width && l.y >= 0 && l.y <= meta.height && /^#[0-9a-f]{6}$/.test(l.color)));
    assert.equal(meta.styleGuide, `${style.id}@${style.version}`);
  }
});

test('committed review manifest is valid and refers only to existing variants', () => {
  assert.deepEqual(validateManifest(approvals), []);
  for (const [assetId, asset] of Object.entries(approvals.assets)) {
    const known = catalog.studio.find(a => a.id === assetId);
    assert.ok(known, assetId);
    for (const variantId of Object.keys(asset.variants ?? {})) assert.ok(known.variants.some(v => v.id === variantId), variantId);
  }
  assert.deepEqual(validateManifest({ schema: 1, assets: { a: { variants: { 'a-1': { status: 'final', version: 0, specHash: 'x' } } } } }).length, 3);
});

test('local review is separate from the repository, stamps approvals and exports a committable manifest', () => {
  const asset = catalog.studio.find(a => a.id === 'watchtower'), [first, second] = asset.variants;
  const repo = { schema: 1, updatedAt: null, assets: { watchtower: { preferred: first.id, variants: { [first.id]: { status: 'review', version: first.version, specHash: first.hash, note: 'Check roof', updatedAt: '2026-11-01T00:00:00.000Z' } } } } };
  let local = emptyManifest();
  assert.equal(reviewState({ repo, local, assetId: 'watchtower', variant: first }).effective.status, 'review');
  assert.equal(reviewState({ repo, local, assetId: 'watchtower', variant: first }).preferred, true);
  local = updateLocal(local, { assetId: 'watchtower', variant: second, status: 'approved' }, '2026-11-04T10:00:00.000Z');
  local = updateLocal(local, { assetId: 'watchtower', variant: second, preferred: true }, '2026-11-04T10:00:01.000Z');
  const state = reviewState({ repo, local, assetId: 'watchtower', variant: second });
  assert.deepEqual(state.pending, { status: 'approved', version: second.version, specHash: second.hash, note: '', updatedAt: '2026-11-04T10:00:00.000Z', approvedAt: '2026-11-04T10:00:00.000Z' });
  assert.equal(state.repoStatus, 'draft'); assert.equal(state.preferred, true); assert.equal(state.hasLocalChange, true);
  assert.equal(reviewState({ repo, local, assetId: 'watchtower', variant: first }).preferred, false);
  assert.equal(repo.assets.watchtower.variants[second.id], undefined, 'repository object is never mutated');
  // A note edit keeps the original approval time.
  const noted = updateLocal(local, { assetId: 'watchtower', variant: second, note: 'Lovely' }, '2026-11-05T00:00:00.000Z');
  assert.equal(noted.assets.watchtower.variants[second.id].approvedAt, '2026-11-04T10:00:00.000Z');
  const manifest = buildExportManifest({ repo: { ...repo, assets: { ...repo.assets, ghost: { preferred: 'ghost-a', variants: { 'ghost-a': repo.assets.watchtower.variants[first.id] } } } }, local, catalog: catalog.studio, now: '2026-11-04T12:00:00.000Z' });
  assert.deepEqual(validateManifest(manifest), []);
  assert.equal(manifest.assets.watchtower.preferred, second.id);
  assert.equal(manifest.assets.watchtower.variants[first.id].status, 'review');
  assert.equal(manifest.assets.watchtower.variants[second.id].status, 'approved');
  assert.equal(manifest.assets.ghost, undefined, 'records of removed assets are dropped');
  const changes = pendingChanges({ repo, local, catalog: catalog.studio });
  assert.deepEqual(changes.map(c => c.preferred ? `pref:${c.variantId}` : `${c.variantId}:${c.from}->${c.to}`).sort(), [`${second.id}:draft->approved`, `pref:${second.id}`].sort());
  assert.deepEqual(discardLocal(local), emptyManifest());
  assert.equal(discardLocal(local, 'watchtower').assets.watchtower, undefined);
  assert.throws(() => updateLocal(local, { assetId: 'watchtower', variant: first, status: 'final' }), RangeError);
});

test('approvals become outdated when the spec changes and local storage failures are tolerated', () => {
  const asset = catalog.studio.find(a => a.id === 'watchtower'), variant = asset.variants[0];
  const local = updateLocal(emptyManifest(), { assetId: 'watchtower', variant, status: 'approved' });
  assert.equal(reviewState({ repo: emptyManifest(), local, assetId: 'watchtower', variant }).outdated, false);
  assert.equal(reviewState({ repo: emptyManifest(), local, assetId: 'watchtower', variant: { ...variant, hash: 'deadbeef' } }).outdated, true);
  assert.equal(reviewState({ repo: emptyManifest(), local, assetId: 'watchtower', variant: { ...variant, version: variant.version + 1 } }).outdated, true);
  const memory = new Map(), storage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, v) };
  assert.equal(writeLocal(storage, local), true);
  assert.deepEqual(readLocal(storage), local);
  memory.set(LOCAL_KEY, '{broken');
  assert.deepEqual(readLocal(storage), emptyManifest());
  const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(readLocal(blocked), emptyManifest());
  assert.equal(writeLocal(blocked, local), false);
  assert.deepEqual(STATUSES, ['draft', 'review', 'approved']);
});

test('lighting presets, flicker and light resolution follow the style guide', () => {
  assert.deepEqual(hexToRgb('#34406b'), { r: 52, g: 64, b: 107 });
  assert.equal(rgbToHex({ r: 52, g: 64, b: 107 }), '#34406b');
  assert.throws(() => timePreset(style, 'noon'), RangeError);
  const torch = resolveLight(style, { type: 'torch' }, { x: 10, y: 20 }, 2);
  assert.equal(torch.radius, style.lightSources.torch.radiusTiles * 32 * 2);
  for (let t = 0; t < 20; t += 0.37) { const f = flicker(t, torch.flicker, 3); assert.ok(f >= 1 - torch.flicker.amplitude - 1e-9 && f <= 1 + torch.flicker.amplitude + 1e-9); }
  const day = lightStrength(torch, timePreset(style, 'day'), 0, 0, false), night = lightStrength(torch, timePreset(style, 'night'), 0, 0, false);
  assert.ok(night > day * 5, 'torches dominate at night and barely show by day');
});

test('game definitions map to studio categories and filters combine source, category and search', () => {
  assert.equal(studioCategoryForGameObject({ id: 'castle', category: 'building' }), 'buildings');
  assert.equal(studioCategoryForGameObject({ id: 'deer', category: 'animal' }), 'units');
  assert.equal(studioCategoryForGameObject({ id: 'oak_tree', category: 'resource' }), 'trees');
  assert.equal(studioCategoryForGameObject({ id: 'rock_outcrop', category: 'decoration' }), 'nature');
  assert.ok(catalog.game.every(item => CATEGORY_IDS.includes(item.category) && item.id.startsWith('game:')));
  assert.ok(catalog.game.some(item => item.gameObjectId === 'tower' && item.spritePath === 'public/assets/buildings/tower/watchtower-square.v1.png'));
  const studioBuildings = filterCatalog(catalog.all, { category: 'buildings', source: 'studio' });
  assert.ok(studioBuildings.every(i => i.category === 'buildings' && i.source === 'studio'));
  for (const id of ['house', 'quarry', 'stone-wall', 'watchtower', 'scaffold']) assert.ok(studioBuildings.some(i => i.id === id), id);
  const studioTrees = filterCatalog(catalog.all, { category: 'trees', source: 'studio' }).map(i => i.id);
  for (const id of ['oak-tree', 'pine-tree', 'oak-seasons', 'pine-seasons']) assert.ok(studioTrees.includes(id), id);
  assert.ok(filterCatalog(catalog.all, { category: 'trees', source: 'studio' }).every(i => i.category === 'trees'));
  assert.deepEqual(filterCatalog(catalog.all, { source: 'studio', query: 'TORCH' }).map(i => i.id), ['torch-post']);
  assert.ok(filterCatalog(catalog.all, { source: 'game' }).length >= 10);
});

test('the game never imports Asset Studio code or art and keeps its own build entry', () => {
  const files = [];
  const walk = dir => { for (const entry of readdirSync(path.join(root, dir), { withFileTypes: true })) { const file = `${dir}/${entry.name}`; if (entry.isDirectory()) walk(file); else if (file.endsWith('.js')) files.push(file); } };
  walk('src');
  // Game code may name an approved export (artSource) but never imports studio code or art files.
  for (const file of files) assert.doesNotMatch(readFileSync(path.join(root, file), 'utf8'), /(?:from\s*|import\s*\()\s*['"][^'"]*(?:studio\/|\/art\/)/, file);
  assert.doesNotMatch(readFileSync(path.join(root, 'index.html'), 'utf8'), /studio/);
  assert.doesNotMatch(readFileSync(path.join(root, 'vite.config.js'), 'utf8'), /studio/);
});

test('the game uses the approved Asset Studio exports byte for byte with their anchors, platform and lights', () => {
  const definitions = new Map(objectDefinitions.map(d => [d.id, d]));
  for (const [gameId, assetId] of [['tower', 'watchtower'], ['brazier', 'torch-post']]) {
    const definition = definitions.get(gameId), meta = json(definition.artSource);
    const repo = approvals.assets[assetId];
    assert.equal(repo.preferred, meta.variantId, `${assetId}: the game uses the preferred variant`);
    assert.equal(repo.variants[meta.variantId].status, 'approved');
    assert.equal(repo.variants[meta.variantId].specHash, meta.specHash, `${assetId}: approval matches the export`);
    const variant = catalog.studio.find(a => a.id === assetId).variants.find(v => v.id === meta.variantId);
    assert.equal(variant.hash, meta.specHash, `${assetId}: export matches the current spec`);
    assert.ok(readFileSync(path.join(root, `public${definition.sprite}`)).equals(readFileSync(path.join(root, variant.paths.sprite))), `${gameId} sprite equals the approved export`);
    assert.equal(definition.renderMode, 'sprite');
    assert.deepEqual(definition.origin, meta.baseOrigin);
    assert.equal(definition.visualHeight, meta.visualHeight);
    assert.deepEqual(definition.lights, meta.gameLights);
    assert.deepEqual([definition.width, definition.height], [meta.footprint.width, meta.footprint.height]);
    if (meta.frontLayer) {
      assert.ok(readFileSync(path.join(root, `public${definition.frontSprite}`)).equals(readFileSync(path.join(root, variant.paths.spriteFront))), `${gameId} front layer equals the export`);
      assert.deepEqual(definition.frontOrigin, meta.baseOrigin);
    }
    if (meta.platform) assert.deepEqual(definition.platform, meta.platform);
  }
  const front = pngSize('public/assets/buildings/tower/watchtower-square.v1.front.png'), main = pngSize('public/assets/buildings/tower/watchtower-square.v1.png');
  assert.deepEqual(front, main, 'front layer has the same frame as the tower sprite');
  assert.equal(definitions.get('brazier').buildingCategory, 'infrastructure');
  assert.ok(definitions.get('brazier').buildable && definitions.get('brazier').constructionTime > 0);
});

test('the game uses the approved grass and worn-path tiles byte for byte with their strip colours', () => {
  const definitions = new Map(objectDefinitions.map(d => [d.id, d]));
  const tile = (asset, variant, i) => readFileSync(path.join(root, `art/sprites/${asset}/${variant}.v1.tile-${i}.png`));
  for (const [asset, variant] of [['grass-ground', 'grass-ground-lush'], ['worn-path', 'worn-path-moss']]) {
    const repo = approvals.assets[asset];
    assert.equal(repo.preferred, variant); assert.equal(repo.variants[variant].status, 'approved');
    assert.equal(repo.variants[variant].specHash, json(`art/sprites/${asset}/${variant}.v1.json`).specHash);
  }
  const grass = definitions.get('grass_normal');
  assert.equal(grass.artSource, 'art/sprites/grass-ground/grass-ground-lush.v1.json');
  assert.equal(grass.spriteVariants.length, 4);
  grass.spriteVariants.forEach((file, i) => assert.ok(readFileSync(path.join(root, `public${file}`)).equals(tile('grass-ground', 'grass-ground-lush', i)), file));
  const wear = json('art/sprites/worn-path/worn-path-moss.v1.json').surface.gameWear;
  for (const stage of wear) {
    const d = definitions.get(`grass_trampled_${stage.level}`);
    assert.ok(readFileSync(path.join(root, `public${d.sprite}`)).equals(tile('worn-path', 'worn-path-moss', stage.level)), d.id);
    assert.deepEqual([d.visual.pathColor, d.visual.pathEdge, d.visual.pathWidth], [stage.color, stage.edge, stage.width]);
    assert.equal(d.artSource, 'art/sprites/worn-path/worn-path-moss.v1.json');
  }
});

test('approved production buildings use their Asset Studio exports byte for byte with anchors and lights', async () => {
  const { APPROVED_BUILDING_ART } = await import('../src/data/objects/approvedArt.js');
  const definitions = new Map(objectDefinitions.map(d => [d.id, d]));
  assert.ok(Object.keys(APPROVED_BUILDING_ART).length >= 8);
  for (const [gameId, art] of Object.entries(APPROVED_BUILDING_ART)) {
    const definition = definitions.get(gameId), meta = json(art.artSource), repo = approvals.assets[meta.assetId];
    assert.equal(definition.renderMode, 'sprite', gameId);
    assert.equal(repo.preferred, meta.variantId, `${gameId}: the game uses the preferred variant`);
    assert.equal(repo.variants[meta.variantId].status, 'approved');
    assert.equal(repo.variants[meta.variantId].specHash, meta.specHash);
    assert.equal(catalog.studio.find(a => a.id === meta.assetId).variants.find(v => v.id === meta.variantId).hash, meta.specHash);
    assert.deepEqual([definition.width, definition.height], [meta.footprint.width, meta.footprint.height], `${gameId}: footprint matches`);
    assert.ok(readFileSync(path.join(root, `public${definition.sprite}`)).equals(readFileSync(path.join(root, `art/sprites/${meta.assetId}/${meta.variantId}.v${meta.version}.png`))), `${gameId}: sprite equals the export`);
    assert.deepEqual(definition.origin, meta.baseOrigin);
    assert.equal(definition.visualHeight, meta.visualHeight);
    assert.deepEqual(definition.lights ?? [], meta.gameLights);
  }
});

test('trees use the approved Asset Studio art for each look, byte for byte with the studio anchor', async () => {
  const { APPROVED_TREE_ART } = await import('../src/data/objects/approvedArt.js');
  const definitions = new Map(objectDefinitions.map(d => [d.id, d]));
  for (const [gameId, looks] of Object.entries(APPROVED_TREE_ART)) {
    const definition = definitions.get(gameId);
    assert.equal(definition.renderer, 'tree', `${gameId}: TreeView keeps stumps, saplings and the fallback`);
    assert.deepEqual(Object.keys(definition.artSprites).sort(), Object.keys(looks).sort());
    for (const [look, art] of Object.entries(looks)) {
      const meta = json(art.artSource), repo = approvals.assets[meta.assetId];
      assert.equal(repo.variants[meta.variantId]?.status, 'approved', `${gameId} ${look}`);
      assert.equal(repo.variants[meta.variantId].specHash, meta.specHash);
      assert.ok(readFileSync(path.join(root, `public${art.sprite}`)).equals(readFileSync(path.join(root, `art/sprites/${meta.assetId}/${meta.variantId}.v1.png`))), `${gameId} ${look}`);
      assert.deepEqual(art.origin, meta.origin, `${gameId} ${look}: trees stand on the tile centre, the studio anchor`);
    }
  }
  assert.ok(APPROVED_TREE_ART.oak_tree.spring && APPROVED_TREE_ART.oak_tree.autumn && APPROVED_TREE_ART.oak_tree.winter && APPROVED_TREE_ART.pine_tree.winter);
});

test('construction sites use the approved scaffold art by stage, byte for byte with the export anchor', async () => {
  const { APPROVED_SCAFFOLD_ART, TIMBER_SCAFFOLD_BUILDINGS } = await import('../src/data/objects/approvedArt.js');
  assert.deepEqual(Object.keys(APPROVED_SCAFFOLD_ART).sort(), ['high', 'low', 'mid', 'timber']);
  for (const [look, art] of Object.entries(APPROVED_SCAFFOLD_ART)) {
    const meta = json(art.artSource);
    assert.equal(approvals.assets.scaffold.variants[meta.variantId]?.status, 'approved', look);
    assert.equal(meta.variantId, `scaffold-${look}`);
    assert.ok(readFileSync(path.join(root, `public${art.sprite}`)).equals(readFileSync(path.join(root, `art/sprites/scaffold/${meta.variantId}.v1.png`))), look);
    assert.deepEqual(art.origin, meta.baseOrigin);
    assert.equal(art.visualHeight, meta.visualHeight);
    assert.deepEqual(meta.footprint, { width: 2, height: 2 }, 'scaled by site width / 2 in ConstructionView');
  }
  const ids = new Set(objectDefinitions.map(d => d.id));
  assert.ok(TIMBER_SCAFFOLD_BUILDINGS.every(id => ids.has(id)));
});

test('untouched grass uses the approved season-ground tiles for spring, autumn and winter', () => {
  const grass = objectDefinitions.find(d => d.id === 'grass_normal');
  for (const [season, variant] of [['Spring', 'season-ground-spring'], ['Autumn', 'season-ground-autumn'], ['Winter', 'season-ground-snow']]) {
    assert.equal(approvals.assets['season-ground'].variants[variant]?.status, 'approved', variant);
    grass.seasonVariants[season].forEach((file, i) => assert.ok(readFileSync(path.join(root, `public${file}`)).equals(readFileSync(path.join(root, `art/sprites/season-ground/${variant}.v1.tile-${i}.png`))), `${season} ${i}`));
  }
  // Summer is the lush set already used for grass_normal.
  assert.equal(json('art/sprites/season-ground/season-ground-summer.v1.json').specHash, json('art/sprites/grass-ground/grass-ground-lush.v1.json').specHash);
});

test('villagers use the approved looks in eight directions, chosen by profession and name', async () => {
  const { APPROVED_VILLAGER_ART, PROFESSION_LOOKS, FACING_INDEX, villagerSex } = await import('../src/data/objects/approvedArt.js');
  assert.deepEqual(Object.values(FACING_INDEX).sort(), [0, 1, 2, 3, 4, 5, 6, 7]);
  for (const [look, art] of Object.entries(APPROVED_VILLAGER_ART)) {
    const meta = json(art.artSource);
    assert.equal(approvals.assets[meta.assetId].variants[look]?.status, 'approved', look);
    assert.equal(approvals.assets[meta.assetId].variants[look].specHash, meta.specHash);
    assert.equal(meta.facings.length, 8);
    for (let k = 0; k < 8; k++) {
      assert.ok(readFileSync(path.join(root, `public${art.base}.facing-${k}.png`)).equals(readFileSync(path.join(root, `art/sprites/${meta.assetId}/${look}.v1.facing-${k}.png`))), `${look} ${k}`);
      assert.deepEqual(art.origins[k], meta.facings[k].origin);
    }
  }
  for (const [profession, bySex] of Object.entries(PROFESSION_LOOKS)) for (const look of Object.values(bySex)) assert.ok(APPROVED_VILLAGER_ART[look], `${profession}: ${look} is approved and exported`);
  assert.deepEqual(['Matěj', 'Anna', 'Jakub 2', 'Eliška', 'Marie', 'Jan', 'Klára 3'].map(villagerSex), ['male', 'female', 'male', 'female', 'female', 'male', 'female']);
});

test('the connected wall uses the approved wall kit: a block and one parapet per side, byte for byte with the export', async () => {
  const { APPROVED_WALL_ART } = await import('../src/data/objects/approvedArt.js');
  assert.deepEqual(Object.keys(APPROVED_WALL_ART).sort(), ['E', 'N', 'S', 'W', 'block']);
  for (const [piece, art] of Object.entries(APPROVED_WALL_ART)) {
    const meta = json(art.artSource);
    assert.equal(meta.variantId, piece === 'block' ? 'wall-kit-block' : `wall-kit-parapet-${piece.toLowerCase()}`);
    assert.equal(approvals.assets['wall-kit'].variants[meta.variantId]?.status, 'approved', piece);
    assert.ok(readFileSync(path.join(root, `public${art.sprite}`)).equals(readFileSync(path.join(root, `art/sprites/wall-kit/${meta.variantId}.v1.png`))), piece);
    assert.deepEqual(art.origin, meta.baseOrigin, `${piece}: anchored at the tile's front corner like the procedural wall`);
    assert.deepEqual(meta.footprint, { width: 1, height: 1 });
  }
  const wall = objectDefinitions.find(d => d.id === 'wall');
  assert.equal(wall.renderer, 'fortification', 'FortificationView keeps the procedural fallback and the castle');
  assert.equal(wall.visual.wallHeight, 68);
});
