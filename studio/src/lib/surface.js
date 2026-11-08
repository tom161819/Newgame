// Pure helpers for 2D ground recipes (grass tiles, worn paths). No DOM here, so
// validation and the seamless-noise maths are testable in Node.
//
// Tile space: a 64 × 32 diamond whose top corner is pixel (32, 0). (u, v) run
// along the game's grid x and y from 0 to 1 across one tile, so tile (gx, gy)
// covers u ∈ [gx, gx + 1), v ∈ [gy, gy + 1). Noise that repeats with period 1
// in u and v therefore tiles without seams in every direction.
export const TILE_W = 64, TILE_H = 32;
export const WEAR_STAGES = 4;
const HEX = /^#[0-9a-f]{6}$/i;

export function pixelToTile(px, py) {
  const x = px / (TILE_W / 2) - 1, y = py / (TILE_H / 2);
  return { u: (x + y) / 2, v: (y - x) / 2 };
}
export function tileToPixel(u, v) { return { x: (u - v) * TILE_W / 2 + TILE_W / 2, y: (u + v) * TILE_H / 2 }; }
export const insideTile = (u, v) => u >= 0 && u <= 1 && v >= 0 && v <= 1;
export const edgeDistance = (u, v) => Math.min(u, 1 - u, v, 1 - v);
export const smoothstep = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [n >> 16 & 255, n >> 8 & 255, n & 255];
}
export const rgbToHex = ([r, g, b]) => `#${[r, g, b].map(c => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;
export const mixRgb = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// A colour is either #rrggbb or a style-guide palette name.
export function resolveColour(style, value) {
  if (typeof value !== 'string') return null;
  if (HEX.test(value)) return value.toLowerCase();
  return style.palette[value] ?? null;
}

// Perceived lightness, hue (degrees) and chroma (0–1), used by the path checks:
// worn stages must darken and stay muted green or brown, never orange or red.
export const lightness = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
export const hue = ([r, g, b]) => {
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (!d) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
};
export const chroma = ([r, g, b]) => (Math.max(r, g, b) - Math.min(r, g, b)) / 255;

function hash2(seed, x, y) {
  let h = Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(x, 0xc2b2ae35) ^ Math.imul(y, 0x27d4eb2f);
  h = Math.imul(h ^ h >>> 15, 0x2c1b3c6d); h = Math.imul(h ^ h >>> 12, 0x297a2d39);
  return ((h ^ h >>> 15) >>> 0) / 0x100000000;
}

// Value noise with `cells` lattice cells per tile, wrapping every tile.
export function periodicNoise(seed, cells, u, v) {
  const x = (((u % 1) + 1) % 1) * cells, y = (((v % 1) + 1) % 1) * cells;
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const at = (i, j) => hash2(seed, ((i % cells) + cells) % cells, ((j % cells) + cells) % cells);
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * sx;
  const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * sx;
  return top + (bottom - top) * sy;
}
// Fractal sum of periodic octaves (2, 4, 8 … cells), normalised to 0–1.
export function periodicFbm(seed, u, v, octaves = 3, base = 2) {
  let sum = 0, amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) { sum += periodicNoise(seed + o * 101, base << o, u, v) * amp; total += amp; amp *= 0.5; }
  return sum / total;
}

// Deterministic sequence for blade and flower placement inside one tile.
export function tileRandom(seed) {
  let state = (seed * 2654435761) >>> 0 || 1;
  return () => { state ^= state << 13; state >>>= 0; state ^= state >>> 17; state ^= state << 5; state >>>= 0; return state / 0x100000000; };
}

const num = (value, min, max) => typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

// Problems with a ground spec, or [] when it is valid.
export function validateSurfaceSpec(spec, { style }) {
  const problems = [], colour = (value, where) => { if (!resolveColour(style, value)) problems.push(`${where}: "${value}" is neither #rrggbb nor a palette colour.`); };
  if (spec.mode === 'transition') { // round shores (g-svet-kulate-brehy): two grass specs and an edge band
    for (const key of ['outer', 'inner']) problems.push(...validateSurfaceSpec({ ...spec[key], mode: 'grass' }, { style }).map(p => `${key}.${p}`));
    if (spec.edge) { colour(spec.edge.colour, 'edge.colour'); if (!num(spec.edge.width ?? 0.05, 0, 0.3)) problems.push('edge.width must be 0–0.3.'); }
    return problems;
  }
  if (!['grass', 'path'].includes(spec.mode)) { problems.push('mode must be "grass", "path" or "transition".'); return problems; }
  const grass = spec.mode === 'grass' ? spec : spec.ground;
  if (!grass || typeof grass !== 'object') { problems.push('path variants need a "ground" grass spec.'); return problems; }
  colour(grass.base, 'base');
  if (!Array.isArray(grass.shades) || grass.shades.length < 2) problems.push('shades needs at least two colours.');
  else grass.shades.forEach((c, i) => colour(c, `shades[${i}]`));
  if (!num(grass.patchiness ?? 0.5, 0, 1)) problems.push('patchiness must be 0–1.');
  const blades = grass.blades ?? {};
  if (!num(blades.density ?? 0, 0, 120)) problems.push('blades.density must be 0–120 per tile.');
  if (!Array.isArray(blades.height) || blades.height.length !== 2 || !num(blades.height[0], 1, 12) || !num(blades.height[1], blades.height[0], 12)) problems.push('blades.height must be [min, max] pixels between 1 and 12.');
  if (!Array.isArray(blades.colours) || !blades.colours.length) problems.push('blades.colours needs at least one colour.');
  else blades.colours.forEach((c, i) => colour(c, `blades.colours[${i}]`));
  for (const [i, c] of (grass.flowers?.colours ?? []).entries()) colour(c, `flowers.colours[${i}]`);
  if (!num(grass.flowers?.density ?? 0, 0, 12)) problems.push('flowers.density must be 0–12 per tile.');
  if (grass.snow !== undefined) {
    if (!num(grass.snow?.coverage, 0, 1)) problems.push('snow.coverage must be 0–1.');
    for (const key of ['colour', 'shade']) if (grass.snow?.[key] !== undefined) colour(grass.snow[key], `snow.${key}`);
  }
  if (grass.leaves !== undefined) {
    if (!num(grass.leaves?.density, 0, 40)) problems.push('leaves.density must be 0–40 per tile.');
    if (!Array.isArray(grass.leaves?.colours) || !grass.leaves.colours.length) problems.push('leaves.colours needs at least one colour.');
    else grass.leaves.colours.forEach((c, i) => colour(c, `leaves.colours[${i}]`));
  }
  if (!Number.isInteger(grass.tiles ?? 4) || (grass.tiles ?? 4) < 1 || (grass.tiles ?? 4) > 8) problems.push('tiles must be 1–8.');
  if (spec.mode === 'path') {
    if (!Array.isArray(spec.stages) || spec.stages.length !== WEAR_STAGES - 1) { problems.push(`stages needs ${WEAR_STAGES - 1} entries (wear levels 1–3).`); return problems; }
    let previous = lightness(hexToRgb(resolveColour(style, grass.base) ?? '#000000'));
    spec.stages.forEach((stage, i) => {
      const where = `stages[${i}]`;
      colour(stage.colour, `${where}.colour`); colour(stage.edge, `${where}.edge`);
      if (!num(stage.coverage, 0.05, 1)) problems.push(`${where}.coverage must be 0.05–1.`);
      if (!num(stage.blades, 0, 1)) problems.push(`${where}.blades must be 0–1 (share of grass left).`);
      if (!num(stage.width, 1, 24)) problems.push(`${where}.width must be 1–24 px (connection strip).`);
      const hex = resolveColour(style, stage.colour);
      if (!hex) return;
      const rgb = hexToRgb(hex), l = lightness(rgb), h = hue(rgb);
      if (l > previous + 0.02) problems.push(`${where}: each stage must be darker than the one before.`);
      if (chroma(rgb) > 0.24) problems.push(`${where}: ${hex} is too saturated and reads orange; worn ground stays muted.`);
      else if (chroma(rgb) > 0.06 && (h < 25 || h > 160)) problems.push(`${where}: ${hex} reads red or purple; worn ground stays green or brown.`);
      previous = l;
    });
  }
  return problems;
}

// Colours of the connection strip the game draws between worn tiles
// (src/data/objects/terrain.js wearSurfaces: color, edge, width).
export function gameWearFromSpec(spec, style) {
  if (spec.mode !== 'path') return null;
  return spec.stages.map((stage, i) => ({ level: i + 1, color: resolveColour(style, stage.colour), edge: resolveColour(style, stage.edge), width: stage.width }));
}

// Uneven season change: the game's own function, so the studio preview and
// the game agree tile for tile.
export { seasonBlend } from '../../../src/game/SeasonTransition.js';
