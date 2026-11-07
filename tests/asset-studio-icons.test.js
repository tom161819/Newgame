// UI icon sets (plan g-ikony-dane-jidlo): taxes 5 levels of gold, rations 3 levels of food, for the Kingdom Policy sliders.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { objectDefinitions } from '../src/data/objects/index.js';
import { buildCatalog, validateAssetSpec } from '../studio/src/lib/specs.js';
import { GENERATORS } from '../studio/src/generators/index.js';
import { SETS, ICON_SIZE, icons, toSvg, bounds, validate } from '../studio/src/generators/icon.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8'));
const style = json('art/style-guide.json');
const specs = readdirSync(path.join(root, 'art/assets')).flatMap(category => readdirSync(path.join(root, 'art/assets', category)).map(id => json(`art/assets/${category}/${id}/asset.json`)));
const catalog = buildCatalog({ specs, generators: GENERATORS, style, gameDefinitions: objectDefinitions });
const allSets = catalog.studio.filter(asset => GENERATORS[asset.generator].kind === 'icon');
// The slider sets (taxes, rations) grow from level to level; the pet icons are a plain pair.
const sets = allSets.filter(asset => asset.variants.every(v => v.spec.set === 'tax' || v.spec.set === 'ration'));
const pngSize = file => { const data = readFileSync(path.join(root, file)); return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) }; };
// How much of something an icon shows: the area of its gold (taxes) or food (rations) shapes.
const GOLD = new Set(['gold', 'gold_dark']), FOOD = new Set(['porridge', 'bread', 'meat', 'apple', 'steel']);
const amount = (shapes, kinds) => shapes.filter(s => kinds.has(s.fill)).reduce((sum, s) => { const b = bounds([{ ...s, stroke: null }]); return sum + (b.x1 - b.x0) * (b.y1 - b.y0); }, 0);

test('tax and ration icon sets: two looks each, valid specs in the UI category', () => {
  assert.deepEqual(sets.map(a => a.id).sort(), ['ration-icons', 'tax-icons']);
  for (const asset of sets) {
    assert.equal(asset.category, 'ui');
    assert.ok(asset.variants.length >= 2, `${asset.id} has at least two looks to choose from`);
    assert.deepEqual(validateAssetSpec(specs.find(s => s.id === asset.id), { generators: GENERATORS, style }), []);
  }
  assert.deepEqual(validate({ set: 'tax', look: 'nope' }), ['look must be one of heaps, stacks.']);
  assert.equal(validate({ set: 'wine' }).length, 1);
});

test('every icon uses palette colours only and fits the 40 × 40 box', () => {
  for (const asset of sets) for (const variant of asset.variants) for (const icon of icons(variant.spec)) {
    const svg = toSvg(icon.shapes, style, icon.fit);
    assert.match(svg, /^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="40" height="40" viewBox="0 0 40 40"/);
    for (const hex of svg.match(/#[0-9a-f]{6}/g)) assert.ok(Object.values(style.palette).includes(hex), `${variant.id}/${icon.level}: ${hex}`);
    const b = bounds(icon.shapes), x0 = icon.fit.tx + icon.fit.s * b.x0, x1 = icon.fit.tx + icon.fit.s * b.x1, y0 = icon.fit.ty + icon.fit.s * b.y0, y1 = icon.fit.ty + icon.fit.s * b.y1;
    assert.ok(x0 >= 1.9 && y0 >= 1.9 && x1 <= ICON_SIZE - 1.9 && y1 <= ICON_SIZE - 1.9, `${variant.id}/${icon.level} inside the box`);
    assert.equal(svg, toSvg(icon.shapes, style, icon.fit), 'deterministic');
  }
});

test('each row grows: more gold for higher taxes, more food for bigger rations', () => {
  for (const asset of sets) for (const variant of asset.variants) {
    const list = icons(variant.spec), set = SETS[variant.spec.set];
    assert.deepEqual(list.map(i => i.level), set.levels);
    assert.equal(new Set(list.map(i => JSON.stringify(i.fit))).size, 1, 'one scale for the whole set');
    const amounts = list.map(i => amount(i.shapes, variant.spec.set === 'tax' ? GOLD : FOOD));
    if (variant.spec.set === 'tax') assert.equal(amounts[0], 0, `${variant.id}: None has no gold`);
    for (let i = 1; i < amounts.length; i++) assert.ok(amounts[i] > amounts[i - 1], `${variant.id}: ${list[i].level} shows more than ${list[i - 1].level} (${amounts.map(Math.round)})`);
  }
});

test('exported icons: SVG and PNG at 1× and 2× for every level, matching the current recipe', () => {
  for (const asset of sets) for (const variant of asset.variants) {
    const meta = json(variant.paths.spriteMeta);
    assert.equal(meta.specHash, variant.hash);
    assert.deepEqual(meta.icons.map(i => i.level), SETS[variant.spec.set].levels);
    for (const icon of meta.icons) {
      assert.deepEqual(pngSize(icon.png), { width: 40, height: 40 });
      assert.deepEqual(pngSize(icon.png2x), { width: 80, height: 80 });
      assert.ok(existsSync(path.join(root, icon.svg)));
      const drawn = icons(variant.spec).find(i => i.level === icon.level);
      assert.equal(readFileSync(path.join(root, icon.svg), 'utf8'), `${toSvg(drawn.shapes, style, drawn.fit)}\n`, `${icon.svg} is current`);
    }
  }
});

test('domestic animal icons: a cat and a hunting dog in two looks, valid UI specs', () => {
  const pets = allSets.find(asset => asset.id === 'pet-icons');
  assert.ok(pets);assert.equal(pets.category, 'ui');assert.ok(pets.variants.length >= 2);
  assert.deepEqual(validateAssetSpec(specs.find(s => s.id === 'pet-icons'), { generators: GENERATORS, style }), []);
  for (const variant of pets.variants) assert.deepEqual(icons(variant.spec).map(i => i.level), ['cat', 'dog']);
});
