import test from 'node:test';
import assert from 'node:assert/strict';
import { COLUMNS, ROWS, PLAYER_START } from '../src/game/config.js';
import { generateWorld } from '../src/game/worldGeneration.js';
import { worldStreams } from '../src/game/seededRandom.js';
import { buildRelief, setRelief, currentRelief, climbFactor, tooSteep, sightBonus, reliefSlope, reliefHeight, RELIEF_RULES } from '../src/game/terrainRelief.js';
import { findPath } from '../src/game/pathfinding.js';
import { advanceMovement } from '../src/game/movement.js';
import { isRiverGround } from '../src/data/worldTerrain.js';

const world = seed => generateWorld(Math.random, { streams: worldStreams(seed) });
// A hand-made relief: a ridge along x = 10..12 rising to `top` units, level elsewhere.
function ridge(top = 6, W = 30, H = 30) {
  const tiles = new Float32Array(W * H), slopes = new Float32Array(W * H), sight = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { tiles[y * W + x] = x === 11 ? top : x === 10 || x === 12 ? top / 2 : 0; slopes[y * W + x] = x >= 9 && x <= 13 ? top / 2 : 0; }
  return { width: W, height: H, tiles, slopes, sight, map: null, shade: null };
}
const flatMap = (W = 30, H = 30) => Array.from({ length: H }, () => Array(W).fill(0));

test('m-teren-vyska: the relief follows from ground and seed alone – the same after every load, different for another seed', () => {
  const w = world(1234), a = buildRelief(w.ground, 1234), b = buildRelief(w.ground.map(r => [...r]), 1234), c = buildRelief(w.ground, 99);
  assert.deepEqual(a.tiles, b.tiles); assert.notDeepEqual(a.tiles, c.tiles);
  assert.equal(a.width, COLUMNS); assert.equal(a.height, ROWS);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLUMNS; x++) if (isRiverGround(w.ground[y][x])) assert.equal(reliefHeight(a, { x, y }), 0, 'water lies at 0');
  assert.ok(Math.max(...a.tiles) > 2, 'there are hills');
  // The start is level enough to build on.
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) assert.ok(reliefSlope(a, { x: PLAYER_START.x + dx, y: PLAYER_START.y + dy }) <= RELIEF_RULES.buildMaxSlope);
  assert.ok(a.sight.some(v => v > 0), 'some hilltop sees further'); assert.ok(Math.max(...a.sight) <= RELIEF_RULES.sightBonusMax);
});

test('m-teren-vyska: uphill is slower than level ground, downhill is not; never slower than half speed', () => {
  const r = ridge(6);
  assert.equal(climbFactor(r, { x: 5, y: 5 }, { x: 6, y: 5 }), 1);
  assert.equal(climbFactor(r, { x: 9, y: 5 }, { x: 10, y: 5 }), 1 / (1 + .25 * 3));
  assert.equal(climbFactor(r, { x: 11, y: 5 }, { x: 12, y: 5 }), 1, 'downhill at full speed');
  assert.equal(climbFactor(ridge(40), { x: 9, y: 5 }, { x: 10, y: 5 }), RELIEF_RULES.climbMinFactor);
  assert.equal(climbFactor(null, { x: 9, y: 5 }, { x: 10, y: 5 }), 1);
  // The same actor takes longer over the ridge than over level ground.
  const walk = relief => { setRelief(relief); const actor = { speed: 2, position: { x: 8.5, y: 5.5 }, tile: { x: 8, y: 5 }, nextTile: null, path: [9, 10, 11, 12, 13].map(x => ({ x, y: 5 })) }; let ms = 0; while ((actor.path.length || actor.nextTile) && ms < 60000) { advanceMovement(actor, 50); ms += 50; } setRelief(null); return ms; };
  assert.ok(walk(ridge(6)) > walk(null));
});

test('m-teren-vyska: routes go round a steep ridge when that is quicker, and are unchanged without relief', () => {
  const map = flatMap(), start = { x: 8, y: 15 }, goal = { x: 14, y: 15 };
  setRelief(null); const plain = findPath(map, start, goal);
  // The ridge has a level gap at y = 13.
  const r = ridge(8); for (let x = 9; x <= 13; x++) { r.tiles[13 * 30 + x] = 0; }
  setRelief(r); const hilly = findPath(map, start, goal); setRelief(null);
  assert.ok(plain.every(p => p.y === 15)); assert.ok(hilly.some(p => p.y === 13), 'the route uses the gap');
  assert.deepEqual(findPath(map, start, goal), plain);
});

test('m-teren-vyska: buildings need level ground, fields take steeper ground, one-tile pieces follow the terrain', () => {
  const r = ridge(4), on = [{ x: 10, y: 5 }, { x: 11, y: 5 }, { x: 10, y: 6 }, { x: 11, y: 6 }], off = on.map(t => ({ x: t.x + 10, y: t.y }));
  assert.equal(tooSteep(r, on, { width: 2, height: 2 }), true); assert.equal(tooSteep(r, off, { width: 2, height: 2 }), false);
  assert.equal(tooSteep(r, on, { width: 2, height: 2, crop: 'wheat' }), false, 'slope 2 is fine for a field'); assert.equal(tooSteep(ridge(8), on, { width: 2, height: 2, crop: 'wheat' }), true);
  assert.equal(tooSteep(r, [on[0]], { width: 1, height: 1 }), false); assert.equal(tooSteep(null, on, { width: 2, height: 2 }), false);
});

test('m-teren-vyska: sight bonus is read per tile and is nothing without relief', () => {
  const r = ridge(6); r.sight[5 * 30 + 11] = 3;
  assert.equal(sightBonus(r, { x: 11.5, y: 5.5 }), 3); assert.equal(sightBonus(r, { x: 2.5, y: 5.5 }), 0); assert.equal(sightBonus(null, { x: 11.5, y: 5.5 }), 0); assert.equal(currentRelief(), null);
});
