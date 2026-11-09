// Terrain height (plan m-teren-vyska, step 1): the pure height module the World Lab uses now and the world generator
// will reuse. Deterministic from the seed, water flat at 0 and lower than its banks, banks descending to the water,
// sliders that do what they say, and the default file / proposal format.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { generateWorld } from '../src/game/worldGeneration.js';
import { worldStreams, worldRandom } from '../src/game/seededRandom.js';
import { DEFAULT_WORLD_LEVELS, WORLD_SETTINGS } from '../src/data/worldCode.js';
import { isRiverGround } from '../src/data/worldTerrain.js';
import {
  HEIGHT_MAX, HEIGHT_SETTINGS, DEFAULT_HEIGHT_LEVELS, BUILD_MAX_SLOPE, computeHeights, heightsForWorld, heightStats, heightAt, tileCorners, tileHeight, tileSlope,
  heightDefaultsProposal, validHeightLevels, cornerAt,
} from '../src/game/terrainHeight.js';
import { heightsFor, heightChecks, heightDefaultFile, worldFor } from '../studio/src/world-lab/model.js';

const worldOf = (seed, levels = DEFAULT_WORLD_LEVELS) => generateWorld(Math.random, { levels, streams: worldStreams(seed) });
const lakes3 = DEFAULT_WORLD_LEVELS.map((l, i) => WORLD_SETTINGS[i].key === 'lakes' ? 3 : WORLD_SETTINGS[i].key === 'rivers' ? 2 : l);
const SEEDS = [1, 777, 4242];

test('terrain height: the same seed and levels give the same height map, another seed another one', () => {
  const world = worldOf(777);
  const a = heightsForWorld(world, 777), b = heightsForWorld(worldOf(777), 777);
  assert.equal(a.corners.length, (world.ground[0].length + 1) * (world.ground.length + 1));
  assert.deepEqual([...a.corners], [...b.corners]);
  assert.notDeepEqual([...heightsForWorld(world, 778).corners], [...a.corners]);
  // Its own stream: the result is computeHeights with rng(seed, 'height').
  assert.deepEqual([...computeHeights({ ground: world.ground, random: worldRandom(777, 'height') }).corners], [...a.corners]);
  // The World Lab uses the same algorithm.
  assert.deepEqual([...heightsFor(worldFor(DEFAULT_WORLD_LEVELS, 777)).corners], [...a.corners]);
});

test('terrain height: heights stay within 0–HEIGHT_MAX; water is flat at 0 and lower than every land tile beside it', () => {
  for (const seed of SEEDS) for (const levels of [DEFAULT_WORLD_LEVELS, lakes3]) {
    const world = worldOf(seed, levels), map = heightsForWorld(world, seed, { hillHeight: 9, hilliness: 9 });
    let water = 0;
    for (const v of map.corners) assert.ok(v >= 0 && v <= HEIGHT_MAX);
    for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
      if (!isRiverGround(world.ground[y][x])) continue;
      water++;
      assert.deepEqual(tileCorners(map, x, y), [0, 0, 0, 0], `water tile ${x},${y} is flat at 0`);
    }
    assert.ok(water > 0);
    const stats = heightStats(map, world.ground);
    assert.equal(stats.waterLower, true, `seed ${seed}: water lower than its banks (${stats.waterViolations} violations)`);
    // Every land corner off the waterline is above the water.
    for (let y = 1; y < map.height; y++) for (let x = 1; x < map.width; x++) {
      const wet = [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]].some(([i, j]) => isRiverGround(world.ground[j][i]));
      if (!wet) assert.ok(cornerAt(map, x, y) > 0);
    }
  }
});

test('terrain height: banks descend towards the water and their length follows the Bank slope slider', () => {
  const ringMeans = (world, map) => {
    // Mean height of land corners by distance (in tiles, Chebyshev) to the nearest water corner, rings 1–8.
    const W = map.width + 1, H = map.height + 1, wet = new Uint8Array(W * H), sums = Array(9).fill(0), counts = Array(9).fill(0);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) wet[y * W + x] = [[x - 1, y - 1], [x, y - 1], [x - 1, y], [x, y]].some(([i, j]) => isRiverGround(world.ground[j]?.[i])) ? 1 : 0;
    for (let y = 8; y < H - 8; y++) for (let x = 8; x < W - 8; x++) {
      if (wet[y * W + x]) continue;
      let d = 9; for (let r = 1; r <= 8 && d === 9; r++) for (let j = -r; j <= r && d === 9; j++) for (let i = -r; i <= r; i++) if (wet[(y + j) * W + x + i]) { d = r; break; }
      if (d <= 8) { sums[d] += cornerAt(map, x, y); counts[d]++; }
    }
    return sums.map((s, i) => counts[i] ? s / counts[i] : NaN);
  };
  for (const seed of SEEDS) {
    const world = worldOf(seed), mean = ringMeans(world, heightsForWorld(world, seed));
    for (let d = 1; d < 4; d++) assert.ok(mean[d] < mean[d + 1], `seed ${seed}: ring ${d} (${mean[d].toFixed(2)}) lower than ring ${d + 1} (${mean[d + 1].toFixed(2)})`);
    // Steeper banks (higher level) reach the land's height sooner: higher ground right by the water.
    const gentle = ringMeans(world, heightsForWorld(world, seed, { bankSlope: 0 })), steep = ringMeans(world, heightsForWorld(world, seed, { bankSlope: 9 }));
    assert.ok(steep[1] > gentle[1] && steep[2] > gentle[2], `seed ${seed}: steep banks rise faster`);
    const stats = s => heightStats(heightsForWorld(world, seed, { bankSlope: s }), world.ground).bankMeanSlope;
    assert.ok(stats(9) > stats(0));
  }
});

test('terrain height: the Plains slider changes the share of nearly flat land, Hill height and Hilliness the relief', () => {
  for (const seed of SEEDS) {
    const world = worldOf(seed), flat = plains => heightStats(heightsForWorld(world, seed, { plains }), world.ground).flatPercent;
    const none = flat(0), some = flat(5), most = flat(9);
    assert.ok(none < some && some < most, `seed ${seed}: plains 0 → 9 gives ${none.toFixed(1)} < ${some.toFixed(1)} < ${most.toFixed(1)} % flat land`);
    assert.ok(most - none > 15);
    const relief = levels => heightStats(heightsForWorld(world, seed, levels), world.ground);
    assert.ok(relief({ hillHeight: 9 }).meanHeight > relief({ hillHeight: 0 }).meanHeight);
    assert.ok(relief({ hillHeight: 9 }).maxHeight > relief({ hillHeight: 0 }).maxHeight + 3);
    assert.ok(relief({ hilliness: 9, hillHeight: 9 }).buildablePercent < relief({ hilliness: 0, hillHeight: 9 }).buildablePercent);
  }
});

test('terrain height: default worlds are mostly buildable and the castle stands on level ground', () => {
  for (const seed of SEEDS) {
    const world = worldOf(seed), map = heightsForWorld(world, seed), stats = heightChecks(worldFor(DEFAULT_WORLD_LEVELS, seed), map);
    assert.ok(stats.buildablePercent > 85, `seed ${seed}: ${stats.buildablePercent.toFixed(1)} % buildable`);
    assert.equal(stats.start.radius, 10);
    assert.equal(stats.start.buildablePercent, 100);
    assert.ok(tileSlope(map, 50, 50) <= BUILD_MAX_SLOPE / 2);
    // heightAt matches the tile corners and the tile height lies between them.
    assert.equal(heightAt(map, 50, 50), cornerAt(map, 50, 50));
    const c = tileCorners(map, 40, 60), h = tileHeight(map, 40, 60);
    assert.ok(h >= Math.min(...c) && h <= Math.max(...c));
    assert.ok(Math.abs(heightAt(map, 40.5, 60.5) - h) < 1e-5);
  }
});

test('terrain height: default file and the Studio proposal use one level 0–9 per slider', () => {
  const file = JSON.parse(readFileSync(new URL('../art/terrain/height-default.json', import.meta.url), 'utf8'));
  assert.equal(file.id, 'terrain-height');
  assert.ok(validHeightLevels(file.levels));
  assert.deepEqual({ ...DEFAULT_HEIGHT_LEVELS }, file.levels, 'the exported default file and the game defaults agree');
  assert.deepEqual(HEIGHT_SETTINGS.map(s => s.key), ['hilliness', 'hillHeight', 'plains', 'bankSlope']);
  const levels = { hilliness: 7, hillHeight: 3, plains: 9, bankSlope: 0 };
  assert.partialDeepStrictEqual(heightDefaultsProposal(levels, { by: 'u1', note: 'kopce' }), { levels, by: 'u1', note: 'kopce', version: 1 });
  assert.deepEqual(heightDefaultFile(levels).levels, levels);
  assert.equal(heightDefaultFile(levels).id, 'terrain-height');
  assert.throws(() => heightDefaultsProposal({ ...levels, plains: 10 }));
  assert.throws(() => heightDefaultsProposal({ hilliness: 1 }));
  assert.equal(validHeightLevels({ ...levels, bankSlope: 1.5 }), false);
});
