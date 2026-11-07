import { objectDefinitions } from '../src/data/objects/index.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { rotateParts } from '../studio/src/generators/shapes.js';
import { validateAssetSpec, modelBounds } from '../studio/src/lib/specs.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json'), approvals = json('art/approvals.json');
const assets = readdirSync(path.join(root, 'art/assets')).flatMap(c => readdirSync(path.join(root, 'art/assets', c)).map(id => json(`art/assets/${c}/${id}/asset.json`)));
const byId = id => assets.find(a => a.id === id);
const build = (asset, variant) => GENERATORS[asset.generator].build(variant.spec, { footprint: asset.footprint, style });

test('V02 military buildings: C07 footprints, at least three variants, trade props; C07 buildings use only approved art, Stables stay unused', () => {
  for (const [id, size] of [['bowyer', 2], ['swordsmith', 2], ['armorer', 2], ['armory', 3], ['stables', 5]]) {
    const asset = byId(id);
    assert.deepEqual(asset.footprint, { width: size, height: size }, id);
    assert.equal(asset.plannedGameObjectId, id, `${id}: planned game id from C07, not yet in the game`);
    assert.equal(asset.gameObjectId, undefined);
    assert.ok(asset.variants.length >= 3, `${id}: three comparable variants`);
    assert.deepEqual(validateAssetSpec(asset, { generators: GENERATORS, style }), [], id);
    // Rejected variants (set aside when the owner chose another for the game) are allowed; they are never used.
    for (const variant of asset.variants) assert.ok(['approved', 'review', 'rejected', undefined].includes(approvals.assets[id]?.variants?.[variant.id]?.status), variant.id);
    const game = objectDefinitions.find(d => d.id === id);
    // C07 built it: the game shows an approved export of it, byte for byte, never a look still in review.
    const used = asset.variants.find(v => game.sprite.endsWith(`/${v.id}.v1.png`));
    assert.ok(used, `${id}: the game sprite is a Studio export`);
    assert.equal(approvals.assets[id].variants[used.id].status, 'approved', `${id}: ${used.id} is approved`);
    assert.ok(readFileSync(path.join(root, `public${game.sprite}`)).equals(readFileSync(path.join(root, `art/sprites/${id}/${used.id}.v1.png`))), `${id}: same bytes as the export`);
  }
  for (const variant of byId('swordsmith').variants) assert.ok(build(byId('swordsmith'), variant).lights.some(l => l.type === 'brazier'), `${variant.id}: forge glows`);
  for (const variant of byId('stables').variants) {
    assert.ok(variant.spec.props.filter(p => p.type === 'horse').length >= 3, `${variant.id}: horses in the paddock`);
    const front = variant.spec.props.filter(p => p.type === 'fence' && p.from[1] === p.to[1] && p.from[1] > 2);
    assert.ok(front.length === 2 && front[0].to[0] < front[1].from[0], `${variant.id}: the front fence leaves a real gate gap`);
  }
  for (const id of ['bow', 'sword', 'armor', 'horse']) assert.equal(byId(`equipment-${id}`).category, 'equipment');
});

test('V03 soldier classes read differently, include women, and the knight rides a real horse', () => {
  const classes = ['archer', 'soldier', 'swordsman', 'knight'].map(c => byId(`military-${c}`));
  for (const asset of classes) {
    assert.deepEqual(validateAssetSpec(asset, { generators: GENERATORS, style }), [], asset.id);
    assert.ok(asset.variants.length >= 3 && asset.variants.some(v => v.spec.sex === 'female'), asset.id);
  }
  const [archer, soldier, swordsman, knight] = classes.map(a => a.variants[0].spec);
  assert.ok(archer.tool === 'bow' && !archer.shield);
  assert.ok(soldier.tool === 'sword' && swordsman.tool === 'sword' && knight.mount);
  assert.notEqual(soldier.armor, swordsman.armor, 'the Swordsman is better armoured than the Soldier');
  assert.notEqual(soldier.headgear, swordsman.headgear);
  const rider = build(byId('military-knight'), byId('military-knight').variants[0]);
  assert.ok(rider.primitives.some(p => p.material === 'horse_bay') && rider.primitives.some(p => p.material === 'steel'));
  const standing = build(byId('military-soldier'), byId('military-soldier').variants[0]);
  assert.ok(modelBounds(rider).max[1] > modelBounds(standing).max[1] + 0.3, 'a mounted knight towers over foot soldiers');
});

test('direction sheet: eight facings of one soldier, turning keeps the model in place', () => {
  const sheet = byId('military-directions');
  assert.deepEqual(sheet.variants.map(v => v.spec.facing), [0, 1, 2, 3, 4, 5, 6, 7]);
  const base = build(sheet, sheet.variants[0]), radius = m => Math.max(...m.primitives.map(p => Math.hypot(p.at[0], p.at[2])));
  for (const variant of sheet.variants.slice(1)) {
    const turned = build(sheet, variant);
    assert.equal(turned.primitives.length, base.primitives.length);
    assert.ok(Math.abs(radius(turned) - radius(base)) < 1e-9);
    assert.notDeepEqual(turned.primitives.map(p => p.at), base.primitives.map(p => p.at));
  }
  const full = rotateParts(rotateParts(base.primitives, Math.PI), Math.PI);
  full.forEach((p, i) => p.at.forEach((v, j) => assert.ok(Math.abs(v - base.primitives[i].at[j]) < 1e-9)));
});

test('walk cycle: stride 0 is the standing figure; a stride steps the feet and swings legs and free arms about hip and shoulder', async () => {
  const { partMatrix } = await import('../studio/src/generators/shapes.js');
  const figure = GENERATORS.figure;
  const standing = figure.build({ sex: 'male' }, { style }), still = figure.build({ sex: 'male', stride: 0 }, { style });
  assert.deepEqual(still, standing);
  for (const facing of [0, 1, 2, 5]) {
    const model = figure.build({ sex: 'male', stride: 1, facing }, { style });
    const swung = model.primitives.filter(p => p.shape === 'box' && p.tilt);
    assert.equal(swung.length, 4, 'two legs and two free arms swing');
    // The top of every swinging box stays at the hip (0.40) or shoulder (0.85), whatever the direction.
    for (const p of swung) {
      const m = partMatrix(p), top = p.at[1] + m[1][1] * p.size[1];
      assert.ok(Math.abs(top - 0.4) < 1e-9 || Math.abs(top - 0.85) < 1e-9, `${facing} ${p.material} ${top}`);
    }
    assert.notDeepEqual(model, figure.build({ sex: 'male', stride: -1, facing }, { style }));
  }
  // Busy hands stay put: a swordsman with a shield swings only his legs; a rider does not walk.
  assert.equal(figure.build({ sex: 'male', tool: 'sword', shield: true, stride: 1 }, { style }).primitives.filter(p => p.tilt && p.shape === 'box').length, 2);
  assert.deepEqual(figure.build({ sex: 'male', mount: { coat: 'horse_bay' }, stride: 1 }, { style }), figure.build({ sex: 'male', mount: { coat: 'horse_bay' } }, { style }));
});

test('approved walking figures are exported with a walk sheet: 8 directions × 3 frames sharing one anchor', () => {
  const approvals = JSON.parse(readFileSync(path.join(root, 'art/approvals.json'), 'utf8')).assets;
  let sheets = 0;
  for (const id of readdirSync(path.join(root, 'art/assets/units'))) {
    const asset = JSON.parse(readFileSync(path.join(root, `art/assets/units/${id}/asset.json`), 'utf8'));
    if (asset.generator !== 'figure') continue;
    for (const variant of asset.variants) {
      if (approvals[asset.id]?.variants?.[variant.id]?.status !== 'approved' || variant.spec.mount || variant.spec.facing !== undefined) continue;
      const base = `art/sprites/${asset.id}/${variant.id}.v${variant.version}`, meta = JSON.parse(readFileSync(path.join(root, `${base}.json`), 'utf8'));
      assert.deepEqual(meta.walk.columns, ['idle', 'stride-a', 'stride-b'], variant.id);
      assert.deepEqual(meta.walk.cycle, ['idle', 'stride-a', 'idle', 'stride-b']);
      const png = readFileSync(path.join(root, `${base}.walk.png`));
      assert.equal(png.readUInt32BE(16), meta.walk.frameWidth * 3, `${variant.id} sheet width`);
      assert.equal(png.readUInt32BE(20), meta.walk.frameHeight * 8, `${variant.id} sheet height`);
      sheets++;
    }
  }
  assert.ok(sheets >= 40, `${sheets} walk sheets`);
});
