// Continuous ground (plan g-souvisla-zeme): grass is painted as one surface instead of one picture per tile.
// - Texture in world space: a fine grass detail sampled by map position with a repeat that does not line up with the
//   64 × 32 tile grid, so neither the diamonds nor the repetition show.
// - Patches: large value noise over the map (10–30 tiles) makes the grass lusher, drier or darker in places.
// - Zone transitions: zone weights are blended bilinearly at a noise-warped position, so the border between meadow,
//   dry grass, forest floor … runs as soft, irregular tongues over a few tiles instead of along tile edges.
// - No baked shading: light and shadows come from the lighting, not from the ground texture.
// Only grass tiles are painted this way; water, sand and the other grounds keep their tiles in the prototype.

const GROUND_DEFAULTS_ALPHA = {};
export const GROUND_DEFAULTS_BASE = {
  patchSize: 18, patchStrength: 0.16, edgeWidth: 1.6, blend: 1.2, detail: 0.22, speckles: 1,
  flowersSmall: 0.6, flowersLarge: 0.25, thistles: 0.15, shrubs: 0.12, tuftGreen: 0.5, tuftDry: 0.3, tuftDark: 0.2, plantSize: 1,
  pebbles: 0.4, gravel: 0.2, stones: 0.12, flatStones: 0.06,
  shoreCurve: 0.6, shoreSmooth: 0.7, shoreFoam: 0.35, wetBank: 0.5, ripples: 0.5, depthBlend: 1, flow: 0.6,
  waterRocks: 0.4, waterPebbles: 0.6, reedBeds: 0.5, lilies: 0.3, algae: 0.4,
  fishAmount: 0.5, fishSize: 1, fishOpacity: 0.45, duckFamilies: 3,
  waterColors: ['#8f8d6c', '#647458', '#3c4e44'],
  zoneColors: ['#689640', '#4a8834', '#8c9650', '#62763e', '#649642', '#76845a', '#d6c38c', '#dcbf7e', '#7a5f43', '#9a958a'],
  time: 'day', season: 'summer', year: 0.5, weather: 'clear',
};
export const WATER_NAMES = ['Ford', 'Shallow water', 'Deep water'];
export const ZONE_NAMES = ['Meadow', 'Lush grass', 'Dry grass', 'Forest floor', 'Flowery', 'Stony', 'Beach sand', 'Desert sand', 'Mud bank', 'Shore rocks'];
export const TIMES = [['dawn', 'Dawn'], ['day', 'Day'], ['dusk', 'Dusk'], ['night', 'Night']];
export const SEASONS = [['spring', 'Spring'], ['summer', 'Summer'], ['autumn', 'Autumn'], ['winter', 'Winter']];
export const WEATHERS = [['clear', 'Clear'], ['overcast', 'Overcast'], ['rain', 'Rain'], ['fog', 'Fog'], ['snow', 'Snow']];
export const GROUND_SETTINGS = [
  { key: 'patchSize', label: 'Patch size (tiles)', min: 6, max: 40, step: 1 },
  { key: 'patchStrength', label: 'Patch strength', min: 0, max: 0.35, step: 0.01 },
  { key: 'edgeWidth', label: 'Zone border wobble (tiles)', min: 0, max: 4, step: 0.1 },
  { key: 'blend', label: 'Shades flowing into each other', min: 0, max: 4, step: 0.1 },
  { key: 'detail', label: 'Grass detail', min: 0, max: 0.45, step: 0.01 },
  { key: 'speckles', label: 'Tiny flowers & pebbles', min: 0, max: 2, step: 0.1 },
  { key: 'flowersSmall', label: 'Small flowers', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'flowersLarge', label: 'Large flowers', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'thistles', label: 'Thistles', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'shrubs', label: 'Small shrubs', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'tuftGreen', label: 'Tall grass – green', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'tuftDry', label: 'Tall grass – dry', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'tuftDark', label: 'Tall grass – dark sedge', min: 0, max: 2, step: 0.05, group: 'plants' },
  { key: 'plantSize', label: 'Plant size', min: 0.6, max: 1.6, step: 0.05, group: 'plants' },
  { key: 'shoreCurve', label: 'Shore curve', min: 0, max: 1, step: 0.05, group: 'water' },
  { key: 'shoreSmooth', label: 'Natural river shape (no tile steps)', min: 0, max: 1, step: 0.05, group: 'water' },
  { key: 'flow', label: 'Flowing water', min: 0, max: 1, step: 0.05, group: 'water' },
  { key: 'shoreFoam', label: 'Foam at the shore', min: 0, max: 1, step: 0.05, group: 'water' },
  { key: 'wetBank', label: 'Wet bank', min: 0, max: 1, step: 0.05, group: 'water' },
  { key: 'depthBlend', label: 'Shallow → deep transition', min: 0.2, max: 2, step: 0.05, group: 'water' },
  { key: 'ripples', label: 'Ripples', min: 0, max: 1, step: 0.05, group: 'water' },
  { key: 'waterRocks', label: 'Rocks sticking out of the water', min: 0, max: 2, step: 0.05, group: 'waterObjects' },
  { key: 'waterPebbles', label: 'Pebbles at the waterline', min: 0, max: 2, step: 0.05, group: 'waterObjects' },
  { key: 'reedBeds', label: 'Reeds', min: 0, max: 2, step: 0.05, group: 'waterObjects' },
  { key: 'lilies', label: 'Water lilies', min: 0, max: 2, step: 0.05, group: 'waterObjects' },
  { key: 'algae', label: 'Algae and weed', min: 0, max: 2, step: 0.05, group: 'waterObjects' },
  { key: 'fishAmount', label: 'Fish – amount', min: 0, max: 2, step: 0.05, group: 'life' },
  { key: 'fishSize', label: 'Fish – size', min: 0.4, max: 2, step: 0.05, group: 'life' },
  { key: 'fishOpacity', label: 'Fish – opacity', min: 0.1, max: 1, step: 0.05, group: 'life' },
  { key: 'duckFamilies', label: 'Duck families on the map', min: 0, max: 6, step: 1, group: 'life' },
  { key: 'pebbles', label: 'Pebbles', min: 0, max: 2, step: 0.05, group: 'stones' },
  { key: 'gravel', label: 'Gravel patches', min: 0, max: 2, step: 0.05, group: 'stones' },
  { key: 'stones', label: 'Stones', min: 0, max: 2, step: 0.05, group: 'stones' },
  { key: 'flatStones', label: 'Large flat stones', min: 0, max: 2, step: 0.05, group: 'stones' },
];
// Every plant and stone kind also has its own opacity ("sink it into the ground"): key <kind>Alpha, 0.1–1.
export const OBJECT_KINDS = ['flowersSmall', 'flowersLarge', 'thistles', 'shrubs', 'tuftGreen', 'tuftDry', 'tuftDark', 'pebbles', 'gravel', 'stones', 'flatStones'];
export const WATER_KINDS = ['waterRocks', 'waterPebbles', 'reedBeds', 'lilies', 'algae'];
export const WATER_PRESETS = [['czech', 'Czech river', ['#8f8d6c', '#647458', '#3c4e44']], ['brown', 'Muddy lowland river', ['#8e8466', '#6c654a', '#47432f']], ['clear', 'Clear mountain stream', ['#9fae94', '#6f8f86', '#3f5f62']], ['blue', 'Blue (old)', ['#8cb4a0', '#60aac0', '#2c6894']]];
for (const kind of [...OBJECT_KINDS, ...WATER_KINDS]) GROUND_DEFAULTS_ALPHA[`${kind}Alpha`] = 1;
export const GROUND_DEFAULTS = Object.freeze({ ...GROUND_DEFAULTS_BASE, ...GROUND_DEFAULTS_ALPHA });
const hex = c => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
// Season shift of the grass colour: [multiply r, g, b] then mix towards a tint.
const SEASON = { spring: { mul: [0.95, 1.06, 0.92], tint: [150, 196, 90], mix: 0.08 }, summer: { mul: [1, 1, 1], tint: [0, 0, 0], mix: 0 }, autumn: { mul: [1.12, 0.92, 0.78], tint: [168, 132, 62], mix: 0.22 }, winter: { mul: [0.9, 0.9, 0.95], tint: [236, 240, 246], mix: 0.72 } };

// The year as one continuous value 0–1 (0 = midwinter, 0.25 spring, 0.5 summer, 0.75 autumn).
const SEASON_KEYS = ['winter', 'spring', 'summer', 'autumn'];
export const seasonOf = year => SEASON_KEYS[Math.round(((year % 1) + 1) % 1 * 4) % 4];
export const yearOf = season => ({ winter: 0, spring: 0.25, summer: 0.5, autumn: 0.75 })[season] ?? 0.5;
function seasonLook(year) {
  const t = ((year % 1) + 1) % 1 * 4, i = Math.floor(t) % 4, f = t - Math.floor(t), a = SEASON[SEASON_KEYS[i]], b = SEASON[SEASON_KEYS[(i + 1) % 4]];
  const lerp = (x, y) => x + (y - x) * f, mixA = a.mix, mixB = b.mix, tintA = mixA ? a.tint : b.tint, tintB = mixB ? b.tint : a.tint;
  return { mul: a.mul.map((v, k) => lerp(v, b.mul[k])), tint: tintA.map((v, k) => lerp(v, tintB[k])), mix: lerp(mixA, mixB), snow: SEASON_KEYS[i] === 'winter' ? 1 - f : SEASON_KEYS[(i + 1) % 4] === 'winter' ? f : 0 };
}
// Growth (how many plants and how big) and wither (browning) over the year, per kind: [year, value] keys, cyclic.
const CURVES = {
  flowersSmall: { grow: [[0, 0], [0.22, 0], [0.38, 0.6], [0.5, 1], [0.62, 0.7], [0.74, 0.1], [0.8, 0]], wither: [[0, 1], [0.3, 0], [0.55, 0], [0.75, 1]] },
  flowersLarge: { grow: [[0, 0], [0.28, 0], [0.42, 0.5], [0.52, 1], [0.64, 0.6], [0.76, 0]], wither: [[0, 1], [0.35, 0], [0.58, 0], [0.76, 1]] },
  thistles: { grow: [[0, 0.35], [0.25, 0.1], [0.42, 0.5], [0.6, 1], [0.8, 0.8], [0.95, 0.5]], wither: [[0, 1], [0.3, 0.4], [0.45, 0], [0.62, 0], [0.82, 1]] },
  shrubs: { grow: [[0, 1], [1, 1]], wither: [[0, 1], [0.25, 0.2], [0.35, 0], [0.62, 0], [0.8, 0.9]] },
  tuftGreen: { grow: [[0, 0.3], [0.2, 0.25], [0.35, 0.7], [0.5, 1], [0.7, 0.9], [0.9, 0.5]], wither: [[0, 1], [0.25, 0.4], [0.35, 0], [0.62, 0], [0.85, 0.9]] },
  tuftDry: { grow: [[0, 0.6], [0.3, 0.3], [0.5, 0.7], [0.65, 1], [0.85, 0.9]], wither: [[0, 1], [1, 1]] },
  pebbles: { grow: [[0, 1], [1, 1]], wither: [[0, 0], [1, 0]] }, gravel: { grow: [[0, 1], [1, 1]], wither: [[0, 0], [1, 0]] }, stones: { grow: [[0, 1], [1, 1]], wither: [[0, 0], [1, 0]] }, flatStones: { grow: [[0, 1], [1, 1]], wither: [[0, 0], [1, 0]] },
  tuftDark: { grow: [[0, 0.5], [0.3, 0.6], [0.5, 1], [0.8, 0.9]], wither: [[0, 0.8], [0.3, 0.2], [0.45, 0], [0.7, 0.1], [0.9, 0.6]] },
};
function curve(keys, year) {
  const t = ((year % 1) + 1) % 1, ks = [...keys, [keys[0][0] + 1, keys[0][1]]];
  for (let i = 0; i < ks.length - 1; i++) { const [a, va] = ks[i], [b, vb] = ks[i + 1]; if (t >= a && t <= b) return va + (vb - va) * smooth((t - a) / Math.max(1e-6, b - a)); }
  return keys[keys.length - 1][1];
}
const mixHex = (a, b, t) => { const A = hex(a), B = hex(b); return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(' ')})`; };

// Zones as in worldTerrain (0 meadow, 1 lush, 2 dry, 3 forest floor, 4 flowers, 5 stony): base colour and speckles.
const ZONES = [
  { base: [104, 150, 64], speck: [[226, 214, 120], 0.004] },
  { base: [74, 136, 52], speck: [[150, 196, 92], 0.004] },
  { base: [140, 150, 80], speck: [[206, 186, 112], 0.012] },
  { base: [98, 118, 62], speck: [[118, 86, 52], 0.014] },
  { base: [100, 150, 66], speck: [[236, 228, 236], 0.012], speck2: [[226, 112, 140], 0.006], speck3: [[238, 206, 82], 0.006] },
  { base: [118, 132, 90], speck: [[156, 154, 146], 0.02] },
  // Other land (plan g-souvisla-zeme, round 5): painted the same way, blending with the grass; water stays tiles.
  { base: [214, 195, 140], speck: [[176, 160, 120], 0.03], speck2: [[240, 230, 200], 0.02], detail: 0.45 },
  { base: [220, 191, 126], speck: [[190, 160, 100], 0.02], detail: 0.5 },
  { base: [122, 95, 67], speck: [[92, 72, 52], 0.04], speck2: [[150, 128, 96], 0.02], detail: 0.8 },
  { base: [154, 149, 138], speck: [[120, 116, 108], 0.08], speck2: [[186, 182, 172], 0.05], detail: 1.2 },
];

const hash = (x, y, s = 0) => { let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const smooth = t => t * t * (3 - 2 * t);
function noise(x, y, s) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = smooth(x - ix), fy = smooth(y - iy);
  const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}
const fbm = (x, y, s) => noise(x, y, s) * 0.55 + noise(x * 2.1, y * 2.1, s + 1) * 0.3 + noise(x * 4.3, y * 4.3, s + 2) * 0.15;

// Fine grass detail, a tileable 197 × 151 px luminance field (sizes chosen not to divide by 64 or 32): soft
// clumps plus short blade strokes leaning one way, as seen from the isometric camera.
let detailField = null;
const DW = 197, DH = 151;
function detail() {
  if (detailField) return detailField;
  const f = new Float32Array(DW * DH);
  const wrapNoise = (x, y, period, s) => { // tileable noise: blend four shifted copies
    const u = x / DW, v = y / DH, n = (a, b) => noise(a * period, b * period, s);
    return n(u, v) * (1 - u) * (1 - v) + n(u - 1, v) * u * (1 - v) + n(u, v - 1) * (1 - u) * v + n(u - 1, v - 1) * u * v;
  };
  for (let y = 0; y < DH; y++) for (let x = 0; x < DW; x++) f[y * DW + x] = (wrapNoise(x, y, 18, 31) - 0.5) * 0.9 + (wrapNoise(x, y, 46, 37) - 0.5) * 0.6;
  for (let k = 0; k < 2600; k++) { // blades: short dark/bright strokes
    const x0 = hash(k, 1, 51) * DW, y0 = hash(k, 2, 51) * DH, len = 2 + hash(k, 3, 51) * 4, tone = hash(k, 4, 51) < 0.55 ? -0.9 : 0.8, lean = (hash(k, 5, 51) - 0.3) * 0.6;
    for (let t = 0; t < len; t++) { const x = Math.floor(x0 + lean * t + DW) % DW, y = Math.floor(y0 - t + DH) % DH; f[y * DW + x] = f[y * DW + x] * 0.4 + tone * (1 - t / len * 0.5); }
  }
  return (detailField = f);
}

// Paints the land (grass zones and the other land grounds) of the iso window into `ctx`. `isGrass(x, y)` and `zoneAt(x, y)` read the world; `toWorld(px, py)`
// turns a canvas pixel into a map position (tile x, y as floats).
// Water field for one view: the water tiles of the window (plus a margin) blurred into smooth grids.
// - wet: blurred 0/1 water map; its 0.5 contour is the shoreline, so the river follows a natural curve instead of
//   the tile steps (more blur passes = rounder), with a light noise warp for meanders;
// - depth: depth averaged over water only, for the ford → shallow → deep blend;
// - flow: the direction along the river (perpendicular to the gradient of a strongly blurred wet map).
export function makeWaterField({ x0, y0, span, depthAt, settings = GROUND_DEFAULTS }) {
  const s = { ...GROUND_DEFAULTS, ...settings }, M = 8, gx0 = x0 - M, gy0 = y0 - M, N = span + M * 2;
  const W = new Float32Array(N * N), D = new Float32Array(N * N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const d = depthAt(gx0 + x, gy0 + y); W[y * N + x] = d >= 0 ? 1 : 0; D[y * N + x] = d >= 0 ? d : 0; }
  const blur = (src, passes) => { let a = src.slice(), b = new Float32Array(N * N); for (let p = 0; p < passes; p++) { for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const l = a[y * N + Math.max(0, x - 1)], r = a[y * N + Math.min(N - 1, x + 1)]; b[y * N + x] = (l + 2 * a[y * N + x] + r) / 4; } for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const u = b[Math.max(0, y - 1) * N + x], d = b[Math.min(N - 1, y + 1) * N + x]; a[y * N + x] = (u + 2 * b[y * N + x] + d) / 4; } } return a; };
  const wetGrid = blur(W, Math.round(s.shoreSmooth * 4)), Dw = blur(D, Math.max(1, Math.round(s.depthBlend * 2))), Ww = blur(W, Math.max(1, Math.round(s.depthBlend * 2))), F = blur(W, 6);
  const at = (grid, fx, fy) => { const gx = Math.min(N - 1.001, Math.max(0, fx - 0.5 - gx0)), gy = Math.min(N - 1.001, Math.max(0, fy - 0.5 - gy0)), ix = Math.floor(gx), iy = Math.floor(gy), ax = gx - ix, ay = gy - iy, i = iy * N + ix; return grid[i] * (1 - ax) * (1 - ay) + grid[i + 1] * ax * (1 - ay) + grid[i + N] * (1 - ax) * ay + grid[i + N + 1] * ax * ay; };
  const c = s.shoreCurve * 0.45;
  return {
    wet: (fx, fy) => at(wetGrid, fx + (fbm(fx * 0.5, fy * 0.5, 41) - 0.5) * c, fy + (fbm(fx * 0.5, fy * 0.5, 43) - 0.5) * c),
    depth: (fx, fy) => { const w = at(Ww, fx, fy); return w > 0.001 ? Math.min(1, at(Dw, fx, fy) / w) : 0.4; },
    flow: (fx, fy) => { const e = 0.6, gx = at(F, fx + e, fy) - at(F, fx - e, fy), gy = at(F, fx, fy + e) - at(F, fx, fy - e), l = Math.hypot(gx, gy); if (l < 1e-4) return [0.7, 0.7]; let tx = -gy / l, ty = gx / l; if (tx + ty * 0.6 < 0) { tx = -tx; ty = -ty; } return [tx, ty]; },
  };
}
export function wetness(fx, fy, depthAt, settings = GROUND_DEFAULTS) { // single-point fallback (no field)
  const wx = fx - 0.5, wy = fy - 0.5, ix = Math.floor(wx), iy = Math.floor(wy), ax = smooth(wx - ix), ay = smooth(wy - iy), wet = (x, y) => (depthAt(x, y) >= 0 ? 1 : 0);
  return wet(ix, iy) * (1 - ax) * (1 - ay) + wet(ix + 1, iy) * ax * (1 - ay) + wet(ix, iy + 1) * (1 - ax) * ay + wet(ix + 1, iy + 1) * ax * ay;
}
export function paintContinuousGround(ctx, { width, height, toWorld, isGrass, zoneAt, depthAt = () => -1, inWorld = () => true, inside = null, field = null, settings = GROUND_DEFAULTS, step = 4 }) {
  const wetAt = field ? field.wet : (fx, fy) => wetness(fx, fy, depthAt, settings), mask = new Uint8Array(width * height);
  const s = { ...GROUND_DEFAULTS, ...settings }, img = ctx.getImageData(0, 0, width, height), out = img.data, grain = detail();
  const warpScale = 1 / 3.2, warp = s.edgeWidth, colors = GROUND_DEFAULTS_BASE.zoneColors.map((c, i) => hex(s.zoneColors?.[i] ?? c)), wcolors = GROUND_DEFAULTS_BASE.waterColors.map((c, i) => hex(s.waterColors?.[i] ?? c)), season = seasonLook(s.year ?? yearOf(s.season));
  // The slow part (zone blend, patches, depth, current) is computed on a coarse grid every `step` pixels and
  // interpolated; grain, speckles, foam and the shoreline threshold stay per pixel, so edges remain sharp.
  const gw = Math.ceil(width / step) + 1, gh = Math.ceil(height / step) + 1, n = gw * gh;
  const LR = new Float32Array(n), LG = new Float32Array(n), LB = new Float32Array(n), P1 = new Float32Array(n), WR = new Float32Array(n), WG = new Float32Array(n), WB = new Float32Array(n), WET = new Float32Array(n), DEP = new Float32Array(n), SZ = new Uint8Array(n);
  for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
    const i = gy * gw + gx, [fx, fy] = toWorld(gx * step + 0.5, gy * step + 0.5), tx = Math.floor(fx), ty = Math.floor(fy);
    WET[i] = wetAt(fx, fy);
    const land = landBase(fx, fy, tx, ty), water = waterBase(fx, fy, s, wcolors, season, field);
    LR[i] = land[0]; LG[i] = land[1]; LB[i] = land[2]; SZ[i] = land[3]; P1[i] = land[4];
    WR[i] = water[0]; WG[i] = water[1]; WB[i] = water[2]; DEP[i] = water[3];
  }
  function landBase(fx, fy, tx, ty) {
    const wx = fx + (fbm(fx * warpScale, fy * warpScale, 3) - 0.5) * warp * 2 - 0.5, wy = fy + (fbm(fx * warpScale, fy * warpScale, 7) - 0.5) * warp * 2 - 0.5;
    let r = 0, g = 0, b = 0, total = 0, zone = 0, best = -1;
    const ring = s.blend > 0 ? [[0, 0, 2], [s.blend, 0, 1], [-s.blend, 0, 1], [0, s.blend, 1], [0, -s.blend, 1]] : [[0, 0, 1]];
    for (const [ox, oy, rw] of ring) {
      const jx = wx + ox * 0.7, jy = wy + oy * 0.7, kx = Math.floor(jx), ky = Math.floor(jy);
      const bx = warp > 0 || ox || oy ? smooth(Math.min(1, Math.max(0, jx - kx))) : (jx - kx < 0.5 ? 0 : 1), by = warp > 0 || ox || oy ? smooth(Math.min(1, Math.max(0, jy - ky))) : (jy - ky < 0.5 ? 0 : 1);
      for (const [zx, zy, w0] of [[kx, ky, (1 - bx) * (1 - by)], [kx + 1, ky, bx * (1 - by)], [kx, ky + 1, (1 - bx) * by], [kx + 1, ky + 1, bx * by]]) {
        const w = w0 * rw; if (!w || !isGrass(zx, zy)) continue;
        const zi = zoneAt(zx, zy), c = colors[zi] ?? colors[0];
        r += c[0] * w; g += c[1] * w; b += c[2] * w; total += w;
        if (w > best) { best = w; zone = zi; }
      }
    }
    if (!total) { // inside water: borrow the nearest land so the shore pixels have a colour
      let found = 6; for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1], [2, 0], [0, 2], [-2, 0], [0, -2]]) if (isGrass(tx + dx, ty + dy)) { found = zoneAt(tx + dx, ty + dy); break; }
      const c = colors[found] ?? colors[6]; r = c[0]; g = c[1]; b = c[2]; total = 1; zone = found;
    }
    r /= total; g /= total; b /= total;
    const p1 = fbm(fx / s.patchSize, fy / s.patchSize, 11) - 0.5, p2 = fbm(fx / (s.patchSize * 0.6), fy / (s.patchSize * 0.6), 17) - 0.5;
    const light = 1 + p1 * s.patchStrength * 2.2, dry = Math.max(0, p2) * s.patchStrength * 1.6;
    return [r * light + dry * 70, g * light + dry * 30, b * light - dry * 10, zone, p1];
  }
  // toWorld is affine (iso projection): fx = ax*px + bx*py + cx, fy = ay*px + by*py + cy.
  const [c0x, c0y] = toWorld(0.5, 0.5), [c1x, c1y] = toWorld(1.5, 0.5), [c2x, c2y] = toWorld(0.5, 1.5), ax = c1x - c0x, ay = c1y - c0y, bxw = c2x - c0x, byw = c2y - c0y;
  const snowy = season.snow < 0.5, sp = s.speckles, mul0 = season.mul[0], mul1 = season.mul[1], mul2 = season.mul[2];
  for (let py = 0; py < height; py++) {
    const gy = Math.min(gh - 2, Math.floor(py / step)), vy = (py - gy * step) / step, grow = (py % DH) * DW;
    let fx = c0x + bxw * py - ax, fy = c0y + byw * py - ay;
    for (let px = 0; px < width; px++) {
      fx += ax; fy += ay;
      if (inside ? !inside(fx, fy) : !inWorld(Math.floor(fx), Math.floor(fy))) continue;
      const gx = Math.min(gw - 2, Math.floor(px / step)), vx = (px - gx * step) / step, i = gy * gw + gx, i1 = i + 1, i2 = i + gw, i3 = i2 + 1;
      const w00 = (1 - vx) * (1 - vy), w10 = vx * (1 - vy), w01 = (1 - vx) * vy, w11 = vx * vy;
      const wetV = WET[i] * w00 + WET[i1] * w10 + WET[i2] * w01 + WET[i3] * w11, o = (py * width + px) * 4;
      let r, g, b;
      if (wetV >= 0.5) {
        r = WR[i] * w00 + WR[i1] * w10 + WR[i2] * w01 + WR[i3] * w11; g = WG[i] * w00 + WG[i1] * w10 + WG[i2] * w01 + WG[i3] * w11; b = WB[i] * w00 + WB[i1] * w10 + WB[i2] * w01 + WB[i3] * w11;
        const depth = DEP[i] * w00 + DEP[i1] * w10 + DEP[i2] * w01 + DEP[i3] * w11;
        if (depth < 0.35 && hash(px >> 1, py >> 1, 71) < 0.06 * (1 - depth / 0.35)) { r = r * 0.7 + 50; g = g * 0.7 + 46; b = b * 0.7 + 34; }
        if (wetV < 0.6 && s.shoreFoam > 0) { const k = (1 - (wetV - 0.5) / 0.1) * 0.55 * s.shoreFoam * (0.6 + hash(px, py, 73) * 0.4); r += (236 - r) * k; g += (242 - g) * k; b += (244 - b) * k; }
        mask[py * width + px] = 1;
      } else {
        const z = ZONES[SZ[w00 >= 0.25 ? i : w10 >= 0.25 ? i1 : w01 >= 0.25 ? i2 : i3]] ?? ZONES[0];
        r = LR[i] * w00 + LR[i1] * w10 + LR[i2] * w01 + LR[i3] * w11; g = LG[i] * w00 + LG[i1] * w10 + LG[i2] * w01 + LG[i3] * w11; b = LB[i] * w00 + LB[i1] * w10 + LB[i2] * w01 + LB[i3] * w11;
        const d = grain[grow + (px % DW)] * s.detail * (z.detail ?? 1);
        r *= (1 + d) * mul0; g *= (1 + d) * mul1; b *= (1 + d * 0.8) * mul2;
        if (season.mix) { const p1 = P1[i] * w00 + P1[i1] * w10 + P1[i2] * w01 + P1[i3] * w11, m = season.snow > 0 ? Math.max(0, Math.min(1, season.mix + (p1 * 0.9 + d * 0.4) * season.snow)) : season.mix; r += (season.tint[0] - r) * m; g += (season.tint[1] - g) * m; b += (season.tint[2] - b) * m; }
        if (sp > 0 && snowy) { const h = hash(px >> 1, py >> 1, z.speck[0][0]); if (h < z.speck[1] * sp) [r, g, b] = z.speck[0]; else if (z.speck2 && h < (z.speck[1] + z.speck2[1]) * sp) [r, g, b] = z.speck2[0]; else if (z.speck3 && h < (z.speck[1] + z.speck2[1] + z.speck3[1]) * sp) [r, g, b] = z.speck3[0]; }
        if (wetV > 0.3 && s.wetBank > 0) { const k = 1 - (wetV - 0.3) / 0.2 * 0.28 * s.wetBank; r *= k; g *= k; b *= k * 1.02; }
      }
      out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return { mask };
}
// Water base colour at a point: ford → shallow → deep by depth, the current and ripples, the winter tint;
// returns [r, g, b, depth]. Pebbles under fords and the shore foam are added per pixel.
function waterBase(fx, fy, s, wcolors, season, field) {
  let depth = field ? field.depth(fx, fy) : 0.5;
  depth = Math.min(1, Math.max(0, depth + (fbm(fx * 0.5, fy * 0.5, 61) - 0.5) * 0.25));
  const [f, sh, dp] = wcolors, t = depth < 0.5 ? depth / 0.5 : (depth - 0.5) / 0.5, A = depth < 0.5 ? f : sh, B = depth < 0.5 ? sh : dp;
  let r = A[0] + (B[0] - A[0]) * t, g = A[1] + (B[1] - A[1]) * t, b = A[2] + (B[2] - A[2]) * t;
  if (field && s.flow > 0) { const [tx, ty] = field.flow(fx, fy), across = fx * -ty + fy * tx, along = fx * tx + fy * ty, st = Math.sin(across * 9 + fbm(along * 0.35, across * 2, 79) * 6); if (st > 0.82) { const k = (st - 0.82) / 0.18 * 0.18 * s.flow * (0.5 + fbm(along * 1.4, across * 3, 81)); r += (210 - r) * k; g += (220 - g) * k; b += (215 - b) * k; } }
  if (s.ripples > 0) { const band = Math.sin(fx * 4.3 + fy * 2.1 + fbm(fx * 0.9, fy * 0.9, 67) * 14 + fbm(fx * 3, fy * 3, 69) * 3); if (band > 0.94) { const k = (band - 0.94) / 0.06 * 0.3 * s.ripples; r += (230 - r) * k; g += (240 - g) * k; b += (245 - b) * k; } }
  if (season.snow > 0) { const k = season.snow * 0.45; r += (205 - r) * k; g += (222 - g) * k; b += (232 - b) * k; }
  return [r, g, b, depth];
}

// ---------- plants on top of the ground ----------
// Every grass tile gets a few hashed candidate spots; each kind keeps a spot with a chance set by its slider.
const KINDS = OBJECT_KINDS;
const PER_TILE = { flowersSmall: 1.2, flowersLarge: 0.35, thistles: 0.18, shrubs: 0.12, tuftGreen: 0.7, tuftDry: 0.45, tuftDark: 0.3, pebbles: 1.4, gravel: 0.3, stones: 0.35, flatStones: 0.12 };
// Where each kind likes to grow (zone index → factor).
const LIKES = { flowersSmall: [1, 0.7, 0.4, 0.3, 2.2, 0.5, 0, 0, 0.05, 0], flowersLarge: [1, 0.6, 0.3, 0.2, 2.4, 0.3, 0, 0, 0, 0], thistles: [0.6, 0.3, 1.8, 0.3, 0.5, 1.6, 0.2, 0.6, 0, 0.3], shrubs: [0.5, 0.8, 0.6, 2.2, 0.4, 1, 0.1, 0.2, 0.3, 0.4], tuftGreen: [1, 1.8, 0.4, 1, 0.8, 0.5, 0.1, 0, 0.6, 0.2], tuftDry: [0.6, 0.3, 2.2, 0.5, 0.5, 1.4, 0.5, 0.6, 0.2, 0.4], tuftDark: [0.5, 1.2, 0.3, 1.8, 0.4, 0.6, 0.2, 0, 1.8, 0.4], pebbles: [0.7, 0.4, 1.2, 0.8, 0.5, 2.6, 0.7, 1.2, 0.6, 3], gravel: [0.4, 0.2, 1, 0.5, 0.3, 2.8, 0.5, 0.8, 0.3, 3], stones: [0.5, 0.3, 1, 1, 0.3, 2.6, 0.3, 1, 0.4, 2.6], flatStones: [0.4, 0.3, 0.8, 1, 0.2, 2.4, 0.2, 0.6, 0.3, 2.4] };
export function plantsFor({ x0, y0, span, isGrass, zoneAt, depthAt = () => -1, field = null, settings = GROUND_DEFAULTS }) {
  const wetAt = field ? field.wet : (fx, fy) => wetness(fx, fy, depthAt, settings);
  const s = { ...GROUND_DEFAULTS, ...settings }, out = [];
  for (let y = y0 - 2; y < y0 + span + 2; y++) for (let x = x0 - 2; x < x0 + span + 2; x++) {
    if (!isGrass(x, y)) continue;
    const z = zoneAt(x, y), edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isGrass(x + dx, y + dy) && zoneAt(x + dx, y + dy) !== z) ? 1.6 : 1;
    KINDS.forEach((kind, k) => {
      const year = s.year ?? yearOf(s.season), growth = curve(CURVES[kind].grow, year), wither = curve(CURVES[kind].wither, year);
      const want = (s[kind] ?? 0) * PER_TILE[kind] * LIKES[kind][z] * edge * growth;
      // The same spot keeps its plant as the year turns: plants appear one by one as growth rises.
      for (let n = 0; n < 3; n++) if (hash(x, y, 100 + k * 7 + n) < want / 3 && wetAt(x + hash(x, y, 200 + k * 7 + n), y + hash(x, y, 300 + k * 7 + n)) < 0.4) out.push({ kind, fx: x + hash(x, y, 200 + k * 7 + n), fy: y + hash(x, y, 300 + k * 7 + n), size: s.plantSize * (0.7 + hash(x, y, 400 + k * 7 + n) * 0.6) * (0.45 + 0.55 * growth), seed: hash(x, y, 500 + k * 7 + n), alpha: s[`${kind}Alpha`] ?? 1, wither, snow: seasonLook(year).snow });
    });
  }
  return out;
}
const FLOWER_COLORS = { spring: ['#f4f0f6', '#f2d24e', '#e88fb0', '#a8b8ee'], summer: ['#f4f0f6', '#f2d24e', '#d9534f', '#b48be0'], autumn: ['#e6b04a', '#c9773a', '#efe6d8'], winter: [] };
// Draws one plant with its foot at (sx, sy); sizes are in screen pixels at zoom 1.
export function drawPlant(ctx, p, sx, sy, season = 'summer') {
  ctx.save(); ctx.globalAlpha = Math.max(0.05, Math.min(1, p.alpha ?? 1));
  try { drawShape(ctx, p, sx, sy, season); } finally { ctx.restore(); }
}
function drawShape(ctx, p, sx, sy, season) {
  if (WATER_KINDS.includes(p.kind)) return drawWaterShape(ctx, p, sx, sy, i => hash(Math.floor(p.seed * 1e6), i, 77), p.size);
  const k = p.size, rnd = i => hash(Math.floor(p.seed * 1e6), i, 77), w = p.wither ?? 0, winter = (p.snow ?? 0) > 0.5, autumn = !winter && w > 0.5;
  const brown = (c, amount = w) => mixHex(c, '#9a8650', amount), cols = (FLOWER_COLORS[season].length ? FLOWER_COLORS[season] : FLOWER_COLORS.autumn).map(c => brown(c, w * 0.8));
  const blades = (n, h, colors, spread) => { for (let i = 0; i < n; i++) { const a = (rnd(i) - 0.5) * spread, len = h * (0.6 + rnd(i + 20) * 0.5); ctx.strokeStyle = colors[i % colors.length]; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(sx + (rnd(i + 40) - 0.5) * 4 * k, sy); ctx.quadraticCurveTo(sx + a * len * 0.4, sy - len * 0.6, sx + a * len, sy - len); ctx.stroke(); } };
  switch (p.kind) {
    case 'flowersSmall': { if (w > 0.85) return; for (let i = 0; i < 3; i++) { const x = sx + (rnd(i) - 0.5) * 8 * k, y = sy + (rnd(i + 5) - 0.5) * 4 * k; ctx.fillStyle = brown('#3d6b2a'); ctx.fillRect(x, y - 3 * k, 1, 3 * k); ctx.fillStyle = cols[Math.floor(rnd(i + 9) * cols.length)]; ctx.fillRect(x - 1, y - 4 * k, 2.2, 2.2); } return; }
    case 'flowersLarge': { if (w > 0.9) return; ctx.strokeStyle = brown('#3a6427'); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (rnd(1) - 0.5) * 3, sy - 9 * k); ctx.stroke(); ctx.fillStyle = brown('#4b7a33'); ctx.beginPath(); ctx.ellipse(sx + 2, sy - 3 * k, 2.4 * k, 1.1 * k, -0.5, 0, Math.PI * 2); ctx.fill(); const c = cols[Math.floor(rnd(2) * cols.length)]; ctx.fillStyle = c; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(sx + Math.cos(a) * 2.2 * k, sy - 9 * k + Math.sin(a) * 1.4 * k, 1.5 * k, 0, Math.PI * 2); ctx.fill(); } ctx.fillStyle = brown('#f0c63a'); ctx.beginPath(); ctx.arc(sx, sy - 9 * k, 1.1 * k, 0, Math.PI * 2); ctx.fill(); return; }
    case 'thistles': { const stem = winter ? '#8a8270' : brown('#5f7a46'); ctx.strokeStyle = stem; ctx.lineWidth = 1.3; for (let i = 0; i < 3; i++) { const tx = sx + (i - 1) * 3 * k, ty = sy - (10 + rnd(i) * 5) * k; ctx.beginPath(); ctx.moveTo(sx + (i - 1) * k, sy); ctx.lineTo(tx, ty); ctx.stroke(); ctx.fillStyle = stem; ctx.beginPath(); ctx.ellipse(tx, ty + 1.5 * k, 1.8 * k, 2.2 * k, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = winter ? '#d8d4cc' : mixHex('#b06ac4', '#c9b8a0', w); ctx.beginPath(); ctx.ellipse(tx, ty - 0.5 * k, 1.9 * k, 1.4 * k, 0, 0, Math.PI * 2); ctx.fill(); } for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(sx, sy - 3 * k); ctx.lineTo(sx + (i - 1.5) * 3 * k, sy - (4 + rnd(i + 3) * 3) * k); ctx.stroke(); } return; }
    case 'shrubs': { const base = winter ? ['#5b5a4c', '#6b6a5c'] : ['#3f6b2c', '#4f7d34', '#365d26'].map((c, i) => mixHex(c, ['#8a6a2e', '#a3772c', '#6f5a2a'][i], w)); ctx.fillStyle = 'rgb(0 0 0 / .18)'; ctx.beginPath(); ctx.ellipse(sx + 2 * k, sy + 1, 8 * k, 3 * k, 0, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 6; i++) { ctx.fillStyle = base[i % base.length]; ctx.beginPath(); ctx.arc(sx + (rnd(i) - 0.5) * 10 * k, sy - (3 + rnd(i + 8) * 6) * k, (2.8 + rnd(i + 16) * 2) * k, 0, Math.PI * 2); ctx.fill(); } if (winter) { ctx.fillStyle = '#eef2f6'; ctx.beginPath(); ctx.ellipse(sx, sy - 8 * k, 5 * k, 2 * k, 0, 0, Math.PI * 2); ctx.fill(); } return; }
    case 'tuftGreen': return blades(9, 12 * k, winter ? ['#8c8a70', '#a19c80'] : ['#4f8a34', '#62a03e', '#3e7428'].map(c => brown(c)), 1.1);
    case 'tuftDry': return blades(10, 13 * k, winter ? ['#b8ad8a', '#c9bf9c'] : ['#c2b268', '#d6c47a', '#a8964f'], 1.2);
    case 'pebbles': { for (let i = 0; i < 4; i++) { const x = sx + (rnd(i) - 0.5) * 10 * k, y = sy + (rnd(i + 4) - 0.5) * 5 * k, r = (0.9 + rnd(i + 8)) * k; ctx.fillStyle = ['#9a968c', '#b4afa2', '#85817a'][i % 3]; ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); if (winter) { ctx.fillStyle = '#f2f5f8'; ctx.fillRect(x - r, y - r * 0.9, r * 2, r * 0.6); } } return; }
    case 'gravel': { for (let i = 0; i < 14; i++) { const a = rnd(i) * Math.PI * 2, d = Math.sqrt(rnd(i + 20)) * 9 * k, x = sx + Math.cos(a) * d, y = sy + Math.sin(a) * d * 0.5; ctx.fillStyle = ['#a29d90', '#8b877d', '#bcb6a8', '#77736b'][i % 4]; ctx.fillRect(x, y, 1.6 * k, 1.1 * k); } return; }
    case 'stones': { const r = (3 + rnd(1) * 2) * k; ctx.fillStyle = 'rgb(0 0 0 / .2)'; ctx.beginPath(); ctx.ellipse(sx + 1.5 * k, sy + 0.8 * k, r * 1.2, r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#8e8a80'; ctx.beginPath(); ctx.ellipse(sx, sy - r * 0.35, r, r * 0.7, rnd(2) - 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = winter ? '#f1f4f7' : '#aaa598'; ctx.beginPath(); ctx.ellipse(sx - r * 0.2, sy - r * 0.6, r * 0.6, r * 0.35, rnd(2) - 0.5, 0, Math.PI * 2); ctx.fill(); return; }
    case 'flatStones': { const r = (6 + rnd(1) * 3) * k; ctx.fillStyle = 'rgb(0 0 0 / .15)'; ctx.beginPath(); ctx.ellipse(sx + k, sy + k, r * 1.05, r * 0.45, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#87837a'; ctx.beginPath(); ctx.ellipse(sx, sy, r, r * 0.42, rnd(3) * 0.4 - 0.2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = winter ? '#eef2f6' : '#a19c90'; ctx.beginPath(); ctx.ellipse(sx - r * 0.1, sy - r * 0.08, r * 0.82, r * 0.3, rnd(3) * 0.4 - 0.2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = 'rgb(60 58 52 / .35)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(sx - r * 0.3, sy - r * 0.15); ctx.lineTo(sx + r * 0.2, sy + r * 0.1); ctx.stroke(); return; }
    case 'tuftDark': return blades(8, 15 * k, winter ? ['#6e6c5a'] : ['#2f5a2a', '#3c6a30', '#2a4d24'].map(c => brown(c, w * 0.7)), 0.7);
  }
}

// ---------- time of day and weather over the whole view ----------
const TIME_TINT = { dawn: ['rgb(255 170 120 / .18)', 'rgb(40 50 90 / .18)'], day: null, dusk: ['rgb(255 130 70 / .2)', 'rgb(50 30 80 / .28)'], night: ['rgb(30 50 110 / .2)', 'rgb(5 10 35 / .58)'] };
export function drawAtmosphere(ctx, { width, height, time = 'day', weather = 'clear', seed = 1 }) {
  const t = TIME_TINT[time];
  if (t) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = t[1]; ctx.fillRect(0, 0, width, height); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = t[0]; ctx.fillRect(0, 0, width, height); ctx.restore(); }
  if (weather === 'overcast' || weather === 'rain' || weather === 'snow') { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgb(128 128 128 / ${weather === 'overcast' ? 0.28 : 0.38})`; ctx.fillRect(0, 0, width, height); ctx.restore(); ctx.fillStyle = 'rgb(20 26 34 / .12)'; ctx.fillRect(0, 0, width, height); }
  if (weather === 'fog') { const g = ctx.createLinearGradient(0, 0, 0, height); g.addColorStop(0, 'rgb(220 226 230 / .55)'); g.addColorStop(1, 'rgb(220 226 230 / .25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, width, height); for (let i = 0; i < 18; i++) { const x = hash(i, 1, seed) * width, y = hash(i, 2, seed) * height, r = 120 + hash(i, 3, seed) * 220; const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgb(235 238 240 / .35)'); rg.addColorStop(1, 'rgb(235 238 240 / 0)'); ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2); } }
  if (weather === 'rain') { ctx.strokeStyle = 'rgb(190 205 225 / .45)'; ctx.lineWidth = 1; ctx.beginPath(); for (let i = 0; i < width * height / 2600; i++) { const x = hash(i, 4, seed) * width, y = hash(i, 5, seed) * height; ctx.moveTo(x, y); ctx.lineTo(x - 4, y + 14); } ctx.stroke(); }
  if (weather === 'snow') { ctx.fillStyle = 'rgb(250 252 255 / .9)'; for (let i = 0; i < width * height / 1400; i++) { const x = hash(i, 6, seed) * width, y = hash(i, 7, seed) * height, r = 0.8 + hash(i, 8, seed) * 1.4; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } }
}

// ---------- objects in the shallows and on the waterline ----------
// Candidate spots on every tile near water; each kind keeps a spot where the wetness / depth suit it.
const WATER_RULES = {
  waterRocks: { per: 0.5, ok: (w, d) => w > 0.55 && d < 0.75 },
  waterPebbles: { per: 1.2, ok: (w) => w > 0.4 && w < 0.62 },
  reedBeds: { per: 0.9, ok: (w, d) => w > 0.45 && w < 0.8 && d < 0.55 },
  lilies: { per: 0.5, ok: (w, d) => w > 0.75 && d > 0.25 && d < 0.85 },
  algae: { per: 0.8, ok: (w) => w > 0.62 },
};
export function waterObjectsFor({ x0, y0, span, field, depthAt, settings = GROUND_DEFAULTS }) {
  const s = { ...GROUND_DEFAULTS, ...settings }, out = [], winter = seasonLook(s.year ?? yearOf(s.season)).snow > 0.5;
  for (let y = y0 - 2; y < y0 + span + 2; y++) for (let x = x0 - 2; x < x0 + span + 2; x++) {
    if (![[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => depthAt(x + dx, y + dy) >= 0)) continue;
    WATER_KINDS.forEach((kind, k) => {
      const rule = WATER_RULES[kind];
      if (winter && (kind === 'lilies' || kind === 'algae')) return;
      for (let n = 0; n < 4; n++) {
        if (hash(x, y, 900 + k * 9 + n) >= (s[kind] ?? 0) * rule.per / 4) continue;
        const fx = x + hash(x, y, 910 + k * 9 + n), fy = y + hash(x, y, 920 + k * 9 + n), w = field.wet(fx, fy), d = field.depth(fx, fy);
        if (rule.ok(w, d)) out.push({ kind, fx, fy, size: 0.75 + hash(x, y, 930 + k * 9 + n) * 0.6, seed: hash(x, y, 940 + k * 9 + n), alpha: s[`${kind}Alpha`] ?? 1, flat: kind === 'lilies' || kind === 'algae', snow: winter ? 1 : 0, wither: 0 });
      }
    });
  }
  return out;
}
function drawWaterShape(ctx, p, sx, sy, rnd, k) {
  switch (p.kind) {
    case 'waterRocks': { const r = (3.5 + rnd(1) * 3) * k; ctx.fillStyle = 'rgb(230 236 230 / .45)'; ctx.beginPath(); ctx.ellipse(sx, sy + r * 0.15, r * 1.35, r * 0.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#6f6c64'; ctx.beginPath(); ctx.ellipse(sx, sy - r * 0.25, r, r * 0.62, rnd(2) - 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.snow ? '#eef2f6' : '#8f8b80'; ctx.beginPath(); ctx.ellipse(sx - r * 0.2, sy - r * 0.5, r * 0.6, r * 0.3, rnd(2) - 0.5, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgb(60 70 50 / .35)'; ctx.fillRect(sx - r, sy - 1, r * 2, 1.5); return; }
    case 'waterPebbles': { for (let i = 0; i < 5; i++) { const x = sx + (rnd(i) - 0.5) * 11 * k, y = sy + (rnd(i + 5) - 0.5) * 5 * k, r = (0.9 + rnd(i + 9) * 1.1) * k; ctx.fillStyle = ['#8e8a80', '#a6a194', '#76726a', '#b5ae9e'][i % 4]; ctx.beginPath(); ctx.ellipse(x, y, r * 1.3, r * 0.8, 0, 0, Math.PI * 2); ctx.fill(); } return; }
    case 'reedBeds': { const cols = p.snow ? ['#a69a74', '#8f8463'] : ['#5d7a3a', '#6f8c45', '#4b6630', '#8a8a4a']; for (let i = 0; i < 12; i++) { const bx = sx + (rnd(i) - 0.5) * 10 * k, h = (12 + rnd(i + 20) * 10) * k, lean = (rnd(i + 40) - 0.5) * 5; ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(bx, sy); ctx.quadraticCurveTo(bx + lean * 0.3, sy - h * 0.6, bx + lean, sy - h); ctx.stroke(); if (i % 4 === 0 && !p.snow) { ctx.fillStyle = '#6b4a2a'; ctx.fillRect(bx + lean - 1, sy - h - 1, 2.2, 5 * k); } } return; }
    case 'lilies': { for (let i = 0; i < 4; i++) { const x = sx + (rnd(i) - 0.5) * 14 * k, y = sy + (rnd(i + 4) - 0.5) * 6 * k, r = (2.4 + rnd(i + 8) * 1.6) * k; ctx.fillStyle = ['#4f7a3a', '#5e8a42', '#45703a'][i % 3]; ctx.beginPath(); ctx.ellipse(x, y, r * 1.2, r * 0.6, 0, 0.35, Math.PI * 2); ctx.lineTo(x, y); ctx.fill(); if (i === 0 && rnd(12) > 0.4) { ctx.fillStyle = rnd(13) > 0.5 ? '#f4eef0' : '#f0c0d0'; ctx.beginPath(); ctx.arc(x, y - 1, 1.6 * k, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#f0cc4a'; ctx.fillRect(x - 0.5, y - 1.5, 1, 1); } } return; }
    case 'algae': { ctx.fillStyle = 'rgb(70 96 46 / .45)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.ellipse(sx + (rnd(i) - 0.5) * 16 * k, sy + (rnd(i + 6) - 0.5) * 7 * k, (3 + rnd(i + 12) * 4) * k, (1.2 + rnd(i + 18) * 1.4) * k, rnd(i + 24) - 0.5, 0, Math.PI * 2); ctx.fill(); } ctx.strokeStyle = 'rgb(90 120 56 / .5)'; ctx.lineWidth = 0.8; for (let i = 0; i < 5; i++) { const x = sx + (rnd(i + 30) - 0.5) * 14 * k, y = sy + (rnd(i + 36) - 0.5) * 6 * k; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 3 * k, y - 1, x + 6 * k, y + 1); ctx.stroke(); } return; }
  }
}

// ---------- ducks: a few families on the whole map, ducklings in spring and summer ----------
// Places are chosen once per world: calm water tiles (shallow or deep, not fords) spread far apart.
export function duckSites(world, count, isWater) {
  if (!count) return [];
  const rows = world.ground.length, cols = world.ground[0].length, cand = [];
  for (let y = 2; y < rows - 2; y++) for (let x = 2; x < cols - 2; x++) if (isWater(x, y) && [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => isWater(x + dx, y + dy))) cand.push({ x, y, k: hash(x, y, 991) });
  cand.sort((a, b) => a.k - b.k);
  const out = [];
  for (const c of cand) { if (out.every(o => Math.hypot(o.x - c.x, o.y - c.y) > 28)) out.push(c); if (out.length >= count) break; }
  return out;
}
export function ducklingsFor(year) { const t = ((year % 1) + 1) % 1; return t > 0.27 && t < 0.62 ? 3 + Math.round(hash(Math.floor(t * 10), 1, 995) * 3) : 0; }
// Draws one duck at (x, y) heading `dir` (radians on screen); `scale` 1 = adult, 0.55 = duckling.
export function drawDuck(ctx, x, y, dir, scale, winter, duckling) {
  const k = scale, c = Math.cos(dir), s = Math.sin(dir);
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = 'rgb(230 236 232 / .35)'; ctx.beginPath(); ctx.ellipse(-c * 4 * k, -s * 2 * k, 6 * k, 2.4 * k, Math.atan2(s * 0.5, c), 0, Math.PI * 2); ctx.fill(); // wake
  ctx.fillStyle = duckling ? '#b59a52' : '#7a5f3e'; ctx.beginPath(); ctx.ellipse(0, -1.5 * k, 4.2 * k, 2.4 * k, Math.atan2(s * 0.5, c), 0, Math.PI * 2); ctx.fill();
  if (!duckling) { ctx.fillStyle = '#5b4630'; ctx.beginPath(); ctx.ellipse(-c * 2 * k, -2.2 * k, 2.2 * k, 1.2 * k, Math.atan2(s * 0.5, c), 0, Math.PI * 2); ctx.fill(); }
  const hx = c * 3.6 * k, hy = s * 1.8 * k - 3.6 * k;
  ctx.fillStyle = duckling ? '#c9ae60' : '#2f6b3e'; ctx.beginPath(); ctx.arc(hx, hy, 1.7 * k, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#d9a23a'; ctx.beginPath(); ctx.ellipse(hx + c * 1.7 * k, hy + 0.4 * k, 1.1 * k, 0.6 * k, Math.atan2(s * 0.5, c), 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
