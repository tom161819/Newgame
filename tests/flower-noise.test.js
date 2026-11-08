// Plan m-kvety-sum: flower density varies by area (large smooth noise from the world seed); visual only.
import test from 'node:test';
import assert from 'node:assert/strict';
import { plantsFor, flowerDensity, GROUND_DEFAULTS, GROUND_SETTINGS } from '../src/render/continuousGround.js';
import { GAME_GROUND_SETTINGS, GROUND_LOOK_SETTINGS, validateGroundLook, sanitizeGroundLook, groundLookDiff, defaultGroundLook } from '../src/data/groundLook.js';
import { EDITOR_TABS } from '../src/ui/WorldEditor.js';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';

const SUMMER = { ...GAME_GROUND_SETTINGS, year: 0.5, season: 'summer' };
const field = { wet: () => 0 };
const meadow = (settings, seed, zone = 0, x0 = 0, y0 = 0, span = 40) => plantsFor({ x0, y0, span, isGrass: () => true, zoneAt: () => zone, field, settings, seed });
const isFlower = p => p.kind === 'flowersSmall' || p.kind === 'flowersLarge';
const strip = list => list.map(p => `${p.kind}:${p.fx.toFixed(4)},${p.fy.toFixed(4)}`).join('|');

test('same seed gives the same flower layout, another seed another one', () => {
  assert.equal(strip(meadow(SUMMER, 12345)), strip(meadow(SUMMER, 12345)));
  assert.notEqual(strip(meadow(SUMMER, 12345).filter(isFlower)), strip(meadow(SUMMER, 777).filter(isFlower)));
});

test('contrast 0 is exactly the density before the noise', () => {
  const flat = { ...SUMMER, flowerContrast: 0 };
  for (let y = 0; y < 200; y += 7) for (let x = 0; x < 200; x += 7) assert.equal(flowerDensity(x, y, flat, 99), 1);
  // Same plants as a renderer that knows nothing about the noise (no flower keys at all, defaults filled in).
  const { flowerAreaScale, flowerContrast, ...old } = flat; void flowerAreaScale; void flowerContrast;
  assert.equal(strip(meadow(flat, 1)), strip(meadow({ ...old, flowerContrast: 0 }, 424242)));
});

test('only flowers follow the noise; thistles, shrubs and stones stay put', () => {
  const a = meadow(SUMMER, 5).filter(p => !isFlower(p)), b = meadow({ ...SUMMER, flowerContrast: 0 }, 5).filter(p => !isFlower(p));
  assert.ok(a.length > 50); assert.equal(strip(a), strip(b));
});

test('defaults: about 30 % bare, 45 % normal, 25 % rich, with smooth borders', () => {
  assert.equal(GAME_GROUND_SETTINGS.flowerContrast, 6); assert.equal(GAME_GROUND_SETTINGS.flowerAreaScale, 24);
  let bare = 0, rich = 0, n = 0;
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) for (let y = 0; y < 160; y++) for (let x = 0; x < 160; x++) {
    const d = flowerDensity(x + 0.5, y + 0.5, SUMMER, seed * 1000003); n++;
    if (d <= 0.1) bare++; else if (d >= 1.5) rich++;
    assert.ok(d >= 0 && d <= 2);
    assert.ok(Math.abs(d - flowerDensity(x + 1.5, y + 0.5, SUMMER, seed * 1000003)) < 0.6, 'no hard border between neighbour tiles (at most ~half the step per tile)');
  }
  assert.ok(bare / n > 0.22 && bare / n < 0.38, `bare ${bare / n}`); assert.ok(rich / n > 0.18 && rich / n < 0.32, `rich ${rich / n}`);
  // Visible in plants: bare blocks with (almost) no flowers next to rich ones.
  const counts = []; const plants = meadow(SUMMER, 31337, 0, 0, 0, 120).filter(isFlower);
  for (let by = 0; by < 120; by += 10) for (let bx = 0; bx < 120; bx += 10) counts.push(plants.filter(p => p.fx >= bx && p.fx < bx + 10 && p.fy >= by && p.fy < by + 10).length);
  counts.sort((a, b) => a - b);
  assert.ok(counts[0] <= 3, `poorest block ${counts[0]}`); assert.ok(counts.at(-1) > 120, `richest block ${counts.at(-1)}`);
});

test('the flowery zone stays and multiplies with the noise; no flowers in winter', () => {
  const flowery = meadow(SUMMER, 8, 4).filter(isFlower).length, plain = meadow(SUMMER, 8, 0).filter(isFlower).length;
  assert.ok(flowery > plain * 1.8);
  assert.equal(meadow({ ...SUMMER, year: 0 }, 8, 4).filter(isFlower).length, 0);
});

test('contrast 9 makes bigger differences than the default; area scale changes the layout', () => {
  let spread6 = 0, spread9 = 0;
  for (let x = 0; x < 300; x += 3) { const d6 = flowerDensity(x, 40, SUMMER, 3), d9 = flowerDensity(x, 40, { ...SUMMER, flowerContrast: 9 }, 3); spread6 += Math.abs(d6 - 1); spread9 += Math.abs(d9 - 1); }
  assert.ok(spread9 > spread6 * 1.15, `${spread9} vs ${spread6}`); // bare areas clamp at ×0, so less than 1.5×
  assert.notEqual(flowerDensity(37.5, 11.5, { ...SUMMER, flowerAreaScale: 8 }, 3), flowerDensity(37.5, 11.5, SUMMER, 3));
});

test('World Editor offers and validates the two flower keys (Plants tab, en/cs labels)', () => {
  for (const key of ['flowerAreaScale', 'flowerContrast']) {
    assert.ok(GROUND_SETTINGS.some(s => s.key === key && s.group === 'plants')); assert.ok(GROUND_LOOK_SETTINGS.some(s => s.key === key));
    assert.ok(EDITOR_TABS.find(t => t.id === 'plants').look.includes(key));
    assert.ok(en[`editor.look.${key}`]); assert.ok(cs[`editor.look.${key}`]); assert.notEqual(en[`editor.look.${key}`], cs[`editor.look.${key}`]);
    assert.equal(defaultGroundLook()[key], GROUND_DEFAULTS[key]);
  }
  assert.deepEqual(validateGroundLook({ flowerContrast: 0, flowerAreaScale: 60 }), { flowerContrast: 0, flowerAreaScale: 60 });
  for (const bad of [{ flowerContrast: 10 }, { flowerContrast: -1 }, { flowerContrast: 2.5 }, { flowerAreaScale: 5 }, { flowerAreaScale: 61 }, { flowerAreaScale: '24' }, { flowerContrast: NaN }]) {
    assert.throws(() => validateGroundLook(bad)); assert.equal(sanitizeGroundLook(bad), null);
  }
  assert.deepEqual(groundLookDiff({ ...defaultGroundLook(), flowerContrast: 9 }), { flowerContrast: 9 });
});
