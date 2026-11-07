// World Lab (plan g-world-lab): the Studio uses the game's own generator and code format; favourites and the default
// proposal read from the page database are checked before use.
import test from 'node:test';
import assert from 'node:assert/strict';
import { checks, defaultsProposal, makeCode, readCode, readFavourite, slug, tileColor, worldFor } from '../studio/src/world-lab/model.js';
import { DEFAULT_WORLD_LEVELS, WORLD_GENERATOR_VERSION, WORLD_SETTINGS, decodeWorldCode } from '../src/data/worldCode.js';
import { generateWorld } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';

test('World Lab: reads and writes the game world code', () => {
  const code = makeCode(DEFAULT_WORLD_LEVELS, 123456);
  assert.deepEqual(decodeWorldCode(code), { generator: WORLD_GENERATOR_VERSION, levels: [...DEFAULT_WORLD_LEVELS], seed: 123456 });
  assert.partialDeepStrictEqual(readCode(` ${code.toLowerCase()} `), { ok: true, code, seed: 123456 });
  assert.partialDeepStrictEqual(readCode('nonsense'), { ok: false, reason: 'invalid' });
  assert.partialDeepStrictEqual(readCode('MKW1-1555-ABC'), { ok: false, reason: 'generator', generator: 1 });
});

test('World Lab: builds the same world as the game for a code', () => {
  const lab = worldFor(DEFAULT_WORLD_LEVELS, 777);
  const game = generateWorld(Math.random, { levels: DEFAULT_WORLD_LEVELS, streams: worldStreams(777) });
  assert.deepEqual(lab.ground, game.ground);
  assert.deepEqual(lab.terrain, game.terrain);
  assert.deepEqual([...lab.bushes], [...game.bushes]);
  assert.deepEqual(worldFor(DEFAULT_WORLD_LEVELS, 777).ground, lab.ground);
});

test('World Lab: reports checks with a fair start and a reachable map', () => {
  const report = checks(worldFor(DEFAULT_WORLD_LEVELS, 4242));
  assert.ok(report.waterPercent > 0);
  assert.ok(report.reachablePercent > 98);
  assert.equal(report.start.ok, true);
  assert.ok(report.start.grass >= report.start.needGrass);
  const dry = DEFAULT_WORLD_LEVELS.map((l, i) => (WORLD_SETTINGS[i].key === 'rivers' || WORLD_SETTINGS[i].key === 'lakes' ? 0 : l));
  assert.equal(checks(worldFor(dry, 4242)).lakes, 0);
  const world = worldFor(DEFAULT_WORLD_LEVELS, 4242);
  assert.equal(tileColor(world, 50, 50).length, 3);
});

test('World Lab: checks favourites and the default proposal', () => {
  assert.partialDeepStrictEqual(readFavourite({ id: 'x', data: { code: makeCode(DEFAULT_WORLD_LEVELS, 1), name: '  Údolí ', by: 'u1', at: '2026-11-07' } }), { id: 'x', name: 'Údolí', valid: true, oldGenerator: false, by: 'u1' });
  assert.partialDeepStrictEqual(readFavourite({ id: 'o', data: { code: 'MKW1-15551555555-A' } }), { valid: false, oldGenerator: true, name: 'MKW1-15551555555-A' });
  assert.equal(readFavourite({ id: 'n', data: { code: 5 } }), null);
  assert.partialDeepStrictEqual(readFavourite({ id: 'b', data: { code: 'x', by: { evil: 1 }, note: 7 } }), { by: null, note: '', valid: false });
  const p = defaultsProposal(DEFAULT_WORLD_LEVELS, { by: 'u1', note: 'more water' });
  assert.partialDeepStrictEqual(p, { levels: [...DEFAULT_WORLD_LEVELS], by: 'u1', note: 'more water', generator: WORLD_GENERATOR_VERSION });
  assert.throws(() => defaultsProposal([1, 2, 3]), RangeError);
  assert.throws(() => defaultsProposal(DEFAULT_WORLD_LEVELS.map(() => 99)), RangeError);
  assert.equal(slug('Říční údolí!'), 'ricni-udoli');
});
