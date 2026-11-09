// Terrain height (plan m-teren-vyska, step 1: prototype in the Studio's World Lab). Pure module: the World Lab uses it
// now and the world generator will reuse the same algorithm (steps 2–3), so a world code gives the same hills.
// Model: a height at every tile corner, grid (COLUMNS + 1) × (ROWS + 1), continuous 0–HEIGHT_MAX units
// (1 unit ≈ ¼ of the tile diamond's height on screen). Tile height = mean of its 4 corners, tile slope = largest
// corner difference. River, ford and lake water sits at 0 and is flat.
// Height = (base + low-frequency hills × plains mask × valley) × bank ramp. The bank ramp falls to 0 at the water
// over 2–8 tiles that vary along the bank with noise (gentle in places, steeper elsewhere); fords keep gentle banks;
// the castle's surroundings stay level. Everything draws from one random stream, rng(seed, 'height').
import { COLUMNS, ROWS, PLAYER_START, TILE_HEIGHT } from './config.js';
import { isRiverGround } from '../data/worldTerrain.js';
import { worldRandom } from './seededRandom.js';

export const HEIGHT_VERSION = 1;
export const HEIGHT_MAX = 8;
export const HEIGHT_UNIT_PX = TILE_HEIGHT / 4;
// Proposal: buildings stand on tiles whose corners differ by at most this many units.
export const BUILD_MAX_SLOPE = 1.5;
// A tile counts as "nearly flat" (plains) below this slope.
export const FLAT_SLOPE = 0.35;
export const BANK_LENGTH = Object.freeze([2, 8]);
export const START_FLAT_RADIUS = 10;

const linear = (at0, at5, at9) => level => level <= 5 ? at0 + (at5 - at0) * level / 5 : at5 + (at9 - at5) * (level - 5) / 4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

// One level 0–9 per slider, like WORLD_SETTINGS (so step 2 can add them to the world code).
export const HEIGHT_SETTINGS = Object.freeze([
  { key: 'hilliness', name: 'Hilliness', max: 9, default: 5, value: l => ({ scale: linear(24, 15, 9)(l), threshold: linear(.56, .4, .26)(l) }),
    describe: l => `hills about ${Math.round(2 * linear(24, 15, 9)(l))} tiles across, ${['few', 'some', 'many'][l < 3 ? 0 : l < 7 ? 1 : 2]}` },
  { key: 'hillHeight', name: 'Hill height', max: 9, default: 5, value: linear(1.5, 5, 7.4), describe: l => `up to ${linear(1.5, 5, 7.4)(l).toFixed(1)} units` },
  { key: 'plains', name: 'Plains', max: 9, default: 5, value: linear(0, .3, .7), describe: l => `${Math.round(100 * linear(0, .3, .7)(l))} % of the land nearly flat` },
  { key: 'bankSlope', name: 'Bank slope', max: 9, default: 5, value: linear(6.5, 4, 2.4), describe: l => `banks about ${linear(6.5, 4, 2.4)(l).toFixed(1)} tiles long` },
]);
export const validHeightLevels = levels => !!levels && typeof levels === 'object' && HEIGHT_SETTINGS.every(s => Number.isInteger(levels[s.key]) && levels[s.key] >= 0 && levels[s.key] <= s.max);
// Owner-approved defaults. The World Lab proposes new ones (heightDefaults/proposal, or its export
// art/terrain/height-default.json); taking them over writes them here and into that file (a test keeps both equal).
// The game never imports art/ (only art/ui), so the levels live here like DEFAULT_WORLD_LEVELS in worldCode.js.
export const DEFAULT_HEIGHT_LEVELS = Object.freeze({ hilliness: 5, hillHeight: 5, plains: 5, bankSlope: 5 });
export function heightOptions(levels = DEFAULT_HEIGHT_LEVELS) {
  const l = { ...DEFAULT_HEIGHT_LEVELS, ...levels };
  if (!validHeightLevels(l)) throw new RangeError('Invalid height levels');
  const v = key => HEIGHT_SETTINGS.find(s => s.key === key).value(l[key]);
  return { hills: v('hilliness'), amplitude: v('hillHeight'), plains: v('plains'), bankLength: v('bankSlope') };
}

// Smooth value noise on an endless hashed lattice (quintic fade), so the lattice never depends on the map size or a
// slider: every noise has its own salt drawn from the stream.
const lattice = (x, y, salt) => { let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const fade = t => t * t * t * (t * (t * 6 - 15) + 10);
function noise2(x, y, salt) {
  const x0 = Math.floor(x), y0 = Math.floor(y), sx = fade(x - x0), sy = fade(y - y0);
  const a = lattice(x0, y0, salt), b = lattice(x0 + 1, y0, salt), c = lattice(x0, y0 + 1, salt), d = lattice(x0 + 1, y0 + 1, salt);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
}
// Fractal noise in [0, 1]; `scale` is the feature size in tiles.
export function makeNoise(random, scale, octaves = 2) {
  const salts = Array.from({ length: octaves }, () => Math.floor(random() * 2 ** 31)), ox = random() * 1000, oy = random() * 1000;
  let norm = 0; for (let o = 0; o < octaves; o++) norm += .5 ** o;
  return (x, y) => { let v = 0; for (let o = 0; o < octaves; o++) { const f = 2 ** o; v += noise2((x + ox) / scale * f, (y + oy) / scale * f, salts[o]) * .5 ** o; } return v / norm; };
}

// Two-pass chamfer distance (in tiles) on the corner grid from the cells where `source` is true.
function chamfer(source, w, h, cap = 60) {
  const d = new Float32Array(w * h), D = Math.SQRT2;
  for (let i = 0; i < d.length; i++) d[i] = source[i] ? 0 : cap;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x; let v = d[i];
    if (x > 0) v = Math.min(v, d[i - 1] + 1);
    if (y > 0) { v = Math.min(v, d[i - w] + 1); if (x > 0) v = Math.min(v, d[i - w - 1] + D); if (x < w - 1) v = Math.min(v, d[i - w + 1] + D); }
    d[i] = v;
  }
  for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) {
    const i = y * w + x; let v = d[i];
    if (x < w - 1) v = Math.min(v, d[i + 1] + 1);
    if (y < h - 1) { v = Math.min(v, d[i + w] + 1); if (x < w - 1) v = Math.min(v, d[i + w + 1] + D); if (x > 0) v = Math.min(v, d[i + w - 1] + D); }
    d[i] = v;
  }
  return d;
}

// The height map for a generated ground grid. `random`: the 'height' stream. Returns
// { width, height, corners: Float32Array((width + 1) × (height + 1)), levels, version }.
export function computeHeights({ ground, random, levels = DEFAULT_HEIGHT_LEVELS, start = PLAYER_START }) {
  const H = ground.length, W = ground[0].length, CW = W + 1, CH = H + 1, o = heightOptions(levels);
  const isWater = (x, y) => x >= 0 && y >= 0 && x < W && y < H && isRiverGround(ground[y][x]);
  const isFord = (x, y) => x >= 0 && y >= 0 && x < W && y < H && ground[y][x] === 5;
  const wet = new Uint8Array(CW * CH), ford = new Uint8Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x;
    wet[i] = isWater(x - 1, y - 1) || isWater(x, y - 1) || isWater(x - 1, y) || isWater(x, y) ? 1 : 0;
    ford[i] = isFord(x - 1, y - 1) || isFord(x, y - 1) || isFord(x - 1, y) || isFord(x, y) ? 1 : 0;
  }
  const waterDistance = chamfer(wet, CW, CH), fordDistance = chamfer(ford, CW, CH, 20);
  // Draw order is fixed: hills, small undulation, plains, bank lengths.
  const hills = makeNoise(random, o.hills.scale, 3), swell = makeNoise(random, o.hills.scale * .45, 2), plainsNoise = makeNoise(random, 30, 2), bankNoise = makeNoise(random, 9, 2);
  // The plains threshold is the noise quantile that leaves the slider's share of corners nearly flat.
  let threshold = -Infinity;
  if (o.plains > 0) { const all = new Float32Array(CW * CH); for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) all[y * CW + x] = plainsNoise(x, y); all.sort(); threshold = all[Math.min(all.length - 1, Math.floor(o.plains * (all.length - 1)))]; }
  const relief = (x, y) => {
    const n = hills(x, y), shaped = smooth(o.hills.threshold - .2, o.hills.threshold + .34, n) * .8 + n * .2 + (swell(x, y) - .5) * .12;
    const flat = threshold === -Infinity ? 0 : smooth(threshold + .05, threshold - .05, plainsNoise(x, y));
    return Math.max(0, o.amplitude * shaped * (1 - .92 * flat));
  };
  const sx = start.x + .5, sy = start.y + .5, startRelief = relief(sx, sy), base = .6;
  const corners = new Float32Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x, d = waterDistance[i];
    if (wet[i]) { corners[i] = 0; continue; }
    // The castle's surroundings keep the start's height (a level place to build).
    const keep = 1 - smooth(START_FLAT_RADIUS * .9, START_FLAT_RADIUS * 1.6, Math.hypot(x - sx, y - sy));
    const r = lerp(relief(x, y), startRelief, keep);
    const valley = .3 + .7 * smooth(1, 16, d);
    const land = base + r * valley;
    // Bank length: noise along the bank, ×0.5–×2 around the slider's mean, 2–8 tiles; gentle by fords.
    let length = clamp(o.bankLength * 2 ** ((bankNoise(x, y) - .5) * 2.4), BANK_LENGTH[0], BANK_LENGTH[1]);
    length = lerp(Math.max(length, 7), length, smooth(2, 8, fordDistance[i]));
    length = lerp(length, Math.max(length, 6), keep); // gentle banks by the castle too
    const t = Math.min(1, d / length), ramp = t * (2 - t);
    corners[i] = clamp(land * ramp, .02, HEIGHT_MAX);
  }
  return { width: W, height: H, corners, levels: { ...DEFAULT_HEIGHT_LEVELS, ...levels }, version: HEIGHT_VERSION };
}

// The stream name follows the generator's fair-start attempts (`height#2`…), like every other part of the world.
export function heightsForWorld(world, seed, levels = DEFAULT_HEIGHT_LEVELS) {
  const attempt = world?.summary?.fairStart?.attempt ?? 1;
  return computeHeights({ ground: world.ground, random: worldRandom(seed, attempt > 1 ? `height#${attempt}` : 'height'), levels });
}

export const cornerAt = (map, x, y) => map.corners[clamp(y, 0, map.height) * (map.width + 1) + clamp(x, 0, map.width)];
// Corners of tile (x, y) in screen order: top (x, y), right (x + 1, y), bottom (x + 1, y + 1), left (x, y + 1).
export const tileCorners = (map, x, y) => [cornerAt(map, x, y), cornerAt(map, x + 1, y), cornerAt(map, x + 1, y + 1), cornerAt(map, x, y + 1)];
export const tileHeight = (map, x, y) => { const c = tileCorners(map, x, y); return (c[0] + c[1] + c[2] + c[3]) / 4; };
export const tileSlope = (map, x, y) => { const c = tileCorners(map, x, y); return Math.max(...c) - Math.min(...c); };
export const isBuildableSlope = (map, x, y) => tileSlope(map, x, y) <= BUILD_MAX_SLOPE;
// Height at a point of the map (bilinear between corners): where units, trees and buildings stand.
export function heightAt(map, fx, fy) {
  const x = clamp(fx, 0, map.width), y = clamp(fy, 0, map.height), x0 = Math.min(map.width - 1, Math.floor(x)), y0 = Math.min(map.height - 1, Math.floor(y)), tx = x - x0, ty = y - y0;
  return lerp(lerp(cornerAt(map, x0, y0), cornerAt(map, x0 + 1, y0), tx), lerp(cornerAt(map, x0, y0 + 1), cornerAt(map, x0 + 1, y0 + 1), tx), ty);
}
// Light from the screen's upper left (map −x), low contrast: −1…1 per corner, 0 on flat ground.
export function cornerShade(map, { vertical = .3 } = {}) {
  const CW = map.width + 1, CH = map.height + 1, out = new Float32Array(CW * CH), L = [-.62, -.22, .75], len = Math.hypot(...L);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const gx = (cornerAt(map, x + 1, y) - cornerAt(map, x - 1, y)) / 2 * vertical, gy = (cornerAt(map, x, y + 1) - cornerAt(map, x, y - 1)) / 2 * vertical;
    const n = [-gx, -gy, 1], nl = Math.hypot(...n);
    out[y * CW + x] = ((n[0] * L[0] + n[1] * L[1] + n[2] * L[2]) / nl - L[2]) / len;
  }
  return out;
}

// Stats for the Lab: buildable and flat share of the land, the start area, and the water check (water corners at 0,
// every land tile next to water strictly higher than the water tile). A land tile pinched between water tiles has all
// four corners on the waterline and stays at water level: it is counted as `flushTiles`, not as a violation (step 2:
// the generator may turn such tiles into shallows).
export function heightStats(map, ground, { start = PLAYER_START, radius = 10 } = {}) {
  let land = 0, flush = 0, bank = 0, bankSum = 0, buildable = 0, flat = 0, sum = 0, max = 0, startTiles = 0, startBuildable = 0, startMax = 0, startSum = 0, violations = 0, waterTiles = 0;
  const sx = start.x + .5, sy = start.y + .5, wetTile = (x, y) => x >= 0 && y >= 0 && x < map.width && y < map.height && isRiverGround(ground[y][x]);
  const wetCorner = (x, y) => wetTile(x - 1, y - 1) || wetTile(x, y - 1) || wetTile(x - 1, y) || wetTile(x, y);
  const isFlush = (x, y) => wetCorner(x, y) && wetCorner(x + 1, y) && wetCorner(x + 1, y + 1) && wetCorner(x, y + 1);
  for (let y = 0; y < map.height; y++) for (let x = 0; x < map.width; x++) {
    const h = tileHeight(map, x, y), s = tileSlope(map, x, y);
    if (isRiverGround(ground[y][x])) {
      waterTiles++;
      if (tileCorners(map, x, y).some(c => c !== 0)) violations++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const g = ground[y + dy]?.[x + dx]; if (g !== undefined && !isRiverGround(g) && !(tileHeight(map, x + dx, y + dy) > h) && !isFlush(x + dx, y + dy)) violations++; }
      continue;
    }
    land++; sum += h; if (isFlush(x, y)) flush++;
    if (wetCorner(x, y) || wetCorner(x + 1, y) || wetCorner(x + 1, y + 1) || wetCorner(x, y + 1)) { bank++; bankSum += s; } max = Math.max(max, h);
    if (s <= BUILD_MAX_SLOPE) buildable++;
    if (s <= FLAT_SLOPE) flat++;
    if (Math.hypot(x + .5 - sx, y + .5 - sy) <= radius) { startTiles++; startSum += s; startMax = Math.max(startMax, s); if (s <= BUILD_MAX_SLOPE) startBuildable++; }
  }
  const pct = (a, b) => b ? 100 * a / b : 0;
  return {
    landTiles: land, waterTiles, buildablePercent: pct(buildable, land), flatPercent: pct(flat, land), meanHeight: land ? sum / land : 0, bankMeanSlope: bank ? bankSum / bank : 0, maxHeight: max,
    start: { radius, tiles: startTiles, buildablePercent: pct(startBuildable, startTiles), maxSlope: startMax, meanSlope: startTiles ? startSum / startTiles : 0 },
    waterLower: violations === 0, waterViolations: violations, flushTiles: flush,
  };
}

// The default proposal (Studio page database heightDefaults/proposal); the Studio also exports the same levels as
// art/terrain/height-default.json (studio/src/world-lab/model.js heightDefaultFile).
export function heightDefaultsProposal(levels, { by, note = '' } = {}) {
  if (!validHeightLevels(levels)) throw new RangeError('Invalid height levels');
  return { levels: Object.fromEntries(HEIGHT_SETTINGS.map(s => [s.key, levels[s.key]])), ...(by ? { by } : {}), at: new Date().toISOString(), note: String(note).slice(0, 300), version: HEIGHT_VERSION };
}
