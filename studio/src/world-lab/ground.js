// Continuous ground (plan g-souvisla-zeme): grass is painted as one surface instead of one picture per tile.
// - Texture in world space: a fine grass detail sampled by map position with a repeat that does not line up with the
//   64 × 32 tile grid, so neither the diamonds nor the repetition show.
// - Patches: large value noise over the map (10–30 tiles) makes the grass lusher, drier or darker in places.
// - Zone transitions: zone weights are blended bilinearly at a noise-warped position, so the border between meadow,
//   dry grass, forest floor … runs as soft, irregular tongues over a few tiles instead of along tile edges.
// - No baked shading: light and shadows come from the lighting, not from the ground texture.
// Only grass tiles are painted this way; water, sand and the other grounds keep their tiles in the prototype.

export const GROUND_DEFAULTS = Object.freeze({ patchSize: 18, patchStrength: 0.16, edgeWidth: 1.6, detail: 0.22, speckles: 1 });
export const GROUND_SETTINGS = [
  { key: 'patchSize', label: 'Patch size (tiles)', min: 6, max: 40, step: 1 },
  { key: 'patchStrength', label: 'Patch strength', min: 0, max: 0.35, step: 0.01 },
  { key: 'edgeWidth', label: 'Zone transition (tiles)', min: 0, max: 4, step: 0.1 },
  { key: 'detail', label: 'Grass detail', min: 0, max: 0.45, step: 0.01 },
  { key: 'speckles', label: 'Flowers & pebbles', min: 0, max: 2, step: 0.1 },
];

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
  const warpScale = 1 / 3.2, warp = s.edgeWidth;
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    const [fx, fy] = toWorld(px + 0.5, py + 0.5), tx = Math.floor(fx), ty = Math.floor(fy);
    if (!isGrass(tx, ty)) continue;
    // Zone weights at a warped position: bilinear over the four nearest tile centres.
    const wx = fx + (fbm(fx * warpScale, fy * warpScale, 3) - 0.5) * warp * 2 - 0.5, wy = fy + (fbm(fx * warpScale, fy * warpScale, 7) - 0.5) * warp * 2 - 0.5;
    const ix = Math.floor(wx), iy = Math.floor(wy), ax = warp > 0 ? smooth(Math.min(1, Math.max(0, wx - ix))) : (wx - ix < 0.5 ? 0 : 1), ay = warp > 0 ? smooth(Math.min(1, Math.max(0, wy - iy))) : (wy - iy < 0.5 ? 0 : 1);
    let r = 0, g = 0, b = 0;
    const zones = [[ix, iy, (1 - ax) * (1 - ay)], [ix + 1, iy, ax * (1 - ay)], [ix, iy + 1, (1 - ax) * ay], [ix + 1, iy + 1, ax * ay]];
    let speckZone = 0, best = -1;
    for (const [zx, zy, w] of zones) {
      if (!w) continue;
      const z = ZONES[isGrass(zx, zy) ? zoneAt(zx, zy) : zoneAt(tx, ty)] ?? ZONES[0];
      r += z.base[0] * w; g += z.base[1] * w; b += z.base[2] * w;
      if (w > best) { best = w; speckZone = z; }
    }
    // Large patches: lusher / drier / darker in places.
    const p1 = fbm(fx / s.patchSize, fy / s.patchSize, 11) - 0.5, p2 = fbm(fx / (s.patchSize * 0.6), fy / (s.patchSize * 0.6), 17) - 0.5;
    const light = 1 + p1 * s.patchStrength * 2.2, dry = Math.max(0, p2) * s.patchStrength * 1.6;
    r = r * light + dry * 70; g = g * light + dry * 30; b = b * light - dry * 10;
    // Fine detail in world space (anchored to the canvas pixel grid, which is a fixed linear map of the world).
    const d = field[((py % DH) * DW) + (px % DW)] * s.detail;
    r *= 1 + d; g *= 1 + d; b *= 1 + d * 0.8;
    // Speckles: flowers, straws, pebbles, fallen leaves of the dominant zone.
    if (s.speckles > 0) for (const sp of [speckZone.speck, speckZone.speck2, speckZone.speck3]) {
      if (sp && hash(px >> 1, py >> 1, sp[0][0]) < sp[1] * s.speckles) { [r, g, b] = sp[0]; break; }
    }
    const o = (py * width + px) * 4;
    out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}
