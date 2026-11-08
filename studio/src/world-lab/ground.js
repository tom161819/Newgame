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
  zoneColors: ['#689640', '#4a8834', '#8c9650', '#62763e', '#649642', '#76845a'],
  time: 'day', season: 'summer', year: 0.5, weather: 'clear',
};
export const ZONE_NAMES = ['Meadow', 'Lush grass', 'Dry grass', 'Forest floor', 'Flowery', 'Stony'];
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
  { key: 'pebbles', label: 'Pebbles', min: 0, max: 2, step: 0.05, group: 'stones' },
  { key: 'gravel', label: 'Gravel patches', min: 0, max: 2, step: 0.05, group: 'stones' },
  { key: 'stones', label: 'Stones', min: 0, max: 2, step: 0.05, group: 'stones' },
  { key: 'flatStones', label: 'Large flat stones', min: 0, max: 2, step: 0.05, group: 'stones' },
];
// Every plant and stone kind also has its own opacity ("sink it into the ground"): key <kind>Alpha, 0.1–1.
export const OBJECT_KINDS = ['flowersSmall', 'flowersLarge', 'thistles', 'shrubs', 'tuftGreen', 'tuftDry', 'tuftDark', 'pebbles', 'gravel', 'stones', 'flatStones'];
for (const kind of OBJECT_KINDS) GROUND_DEFAULTS_ALPHA[`${kind}Alpha`] = 1;
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

// Paints the grass of the iso window into `ctx`. `isGrass(x, y)` and `zoneAt(x, y)` read the world; `toWorld(px, py)`
// turns a canvas pixel into a map position (tile x, y as floats).
export function paintContinuousGround(ctx, { width, height, toWorld, isGrass, zoneAt, settings = GROUND_DEFAULTS }) {
  const s = { ...GROUND_DEFAULTS, ...settings }, img = ctx.getImageData(0, 0, width, height), out = img.data, field = detail();
  const warpScale = 1 / 3.2, warp = s.edgeWidth, colors = (s.zoneColors ?? GROUND_DEFAULTS.zoneColors).map(hex), season = seasonLook(s.year ?? yearOf(s.season));
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    const [fx, fy] = toWorld(px + 0.5, py + 0.5), tx = Math.floor(fx), ty = Math.floor(fy);
    if (!isGrass(tx, ty)) continue;
    // Zone weights at a warped position: bilinear over the four nearest tile centres.
    const wx = fx + (fbm(fx * warpScale, fy * warpScale, 3) - 0.5) * warp * 2 - 0.5, wy = fy + (fbm(fx * warpScale, fy * warpScale, 7) - 0.5) * warp * 2 - 0.5;
    const ix = Math.floor(wx), iy = Math.floor(wy), ax = warp > 0 ? smooth(Math.min(1, Math.max(0, wx - ix))) : (wx - ix < 0.5 ? 0 : 1), ay = warp > 0 ? smooth(Math.min(1, Math.max(0, wy - iy))) : (wy - iy < 0.5 ? 0 : 1);
    let r = 0, g = 0, b = 0, total = 0;
    let speckZone = ZONES[0], best = -1;
    // "Flowing" shades: average the warped bilinear weights over a ring of samples `blend` tiles wide.
    const ring = s.blend > 0 ? [[0, 0, 2], [s.blend, 0, 1], [-s.blend, 0, 1], [0, s.blend, 1], [0, -s.blend, 1]] : [[0, 0, 1]];
    for (const [ox, oy, rw] of ring) {
      const jx = wx + ox * 0.7, jy = wy + oy * 0.7, kx = Math.floor(jx), ky = Math.floor(jy), bx = smooth(Math.min(1, Math.max(0, jx - kx))), by = smooth(Math.min(1, Math.max(0, jy - ky)));
      const cells = ox || oy ? [[kx, ky, (1 - bx) * (1 - by)], [kx + 1, ky, bx * (1 - by)], [kx, ky + 1, (1 - bx) * by], [kx + 1, ky + 1, bx * by]] : [[ix, iy, (1 - ax) * (1 - ay)], [ix + 1, iy, ax * (1 - ay)], [ix, iy + 1, (1 - ax) * ay], [ix + 1, iy + 1, ax * ay]];
      for (const [zx, zy, w0] of cells) {
        const w = w0 * rw; if (!w) continue;
        const zi = isGrass(zx, zy) ? zoneAt(zx, zy) : zoneAt(tx, ty), c = colors[zi] ?? colors[0];
        r += c[0] * w; g += c[1] * w; b += c[2] * w; total += w;
        if (w > best) { best = w; speckZone = ZONES[zi] ?? ZONES[0]; }
      }
    }
    r /= total; g /= total; b /= total;
    // Large patches: lusher / drier / darker in places.
    const p1 = fbm(fx / s.patchSize, fy / s.patchSize, 11) - 0.5, p2 = fbm(fx / (s.patchSize * 0.6), fy / (s.patchSize * 0.6), 17) - 0.5;
    const light = 1 + p1 * s.patchStrength * 2.2, dry = Math.max(0, p2) * s.patchStrength * 1.6;
    r = r * light + dry * 70; g = g * light + dry * 30; b = b * light - dry * 10;
    // Fine detail in world space (anchored to the canvas pixel grid, which is a fixed linear map of the world).
    const d = field[((py % DH) * DW) + (px % DW)] * s.detail;
    r *= 1 + d; g *= 1 + d; b *= 1 + d * 0.8;
    // Season: shift the colour; winter snow lies thinner where the patch noise is low.
    r *= season.mul[0]; g *= season.mul[1]; b *= season.mul[2];
    if (season.mix) { const m = season.snow > 0 ? Math.max(0, Math.min(1, season.mix + (p1 * 0.9 + d * 0.4) * season.snow)) : season.mix; r += (season.tint[0] - r) * m; g += (season.tint[1] - g) * m; b += (season.tint[2] - b) * m; }
    // Speckles: flowers, straws, pebbles, fallen leaves of the dominant zone.
    if (s.speckles > 0 && season.snow < 0.5) for (const sp of [speckZone.speck, speckZone.speck2, speckZone.speck3]) {
      if (sp && hash(px >> 1, py >> 1, sp[0][0]) < sp[1] * s.speckles) { [r, g, b] = sp[0]; break; }
    }
    const o = (py * width + px) * 4;
    out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

// ---------- plants on top of the ground ----------
// Every grass tile gets a few hashed candidate spots; each kind keeps a spot with a chance set by its slider.
const KINDS = OBJECT_KINDS;
const PER_TILE = { flowersSmall: 1.2, flowersLarge: 0.35, thistles: 0.18, shrubs: 0.12, tuftGreen: 0.7, tuftDry: 0.45, tuftDark: 0.3, pebbles: 1.4, gravel: 0.3, stones: 0.35, flatStones: 0.12 };
// Where each kind likes to grow (zone index → factor).
const LIKES = { flowersSmall: [1, 0.7, 0.4, 0.3, 2.2, 0.5], flowersLarge: [1, 0.6, 0.3, 0.2, 2.4, 0.3], thistles: [0.6, 0.3, 1.8, 0.3, 0.5, 1.6], shrubs: [0.5, 0.8, 0.6, 2.2, 0.4, 1], tuftGreen: [1, 1.8, 0.4, 1, 0.8, 0.5], tuftDry: [0.6, 0.3, 2.2, 0.5, 0.5, 1.4], tuftDark: [0.5, 1.2, 0.3, 1.8, 0.4, 0.6], pebbles: [0.7, 0.4, 1.2, 0.8, 0.5, 2.6], gravel: [0.4, 0.2, 1, 0.5, 0.3, 2.8], stones: [0.5, 0.3, 1, 1, 0.3, 2.6], flatStones: [0.4, 0.3, 0.8, 1, 0.2, 2.4] };
export function plantsFor({ x0, y0, span, isGrass, zoneAt, settings = GROUND_DEFAULTS }) {
  const s = { ...GROUND_DEFAULTS, ...settings }, out = [];
  for (let y = y0 - 2; y < y0 + span + 2; y++) for (let x = x0 - 2; x < x0 + span + 2; x++) {
    if (!isGrass(x, y)) continue;
    const z = zoneAt(x, y), edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => isGrass(x + dx, y + dy) && zoneAt(x + dx, y + dy) !== z) ? 1.6 : 1;
    KINDS.forEach((kind, k) => {
      const year = s.year ?? yearOf(s.season), growth = curve(CURVES[kind].grow, year), wither = curve(CURVES[kind].wither, year);
      const want = (s[kind] ?? 0) * PER_TILE[kind] * LIKES[kind][z] * edge * growth;
      // The same spot keeps its plant as the year turns: plants appear one by one as growth rises.
      for (let n = 0; n < 3; n++) if (hash(x, y, 100 + k * 7 + n) < want / 3) out.push({ kind, fx: x + hash(x, y, 200 + k * 7 + n), fy: y + hash(x, y, 300 + k * 7 + n), size: s.plantSize * (0.7 + hash(x, y, 400 + k * 7 + n) * 0.6) * (0.45 + 0.55 * growth), seed: hash(x, y, 500 + k * 7 + n), alpha: s[`${kind}Alpha`] ?? 1, wither, snow: seasonLook(year).snow });
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
