// Path surface V3 (owner 8 Nov 2026: "úplný rework path lab, aby to sedělo na nový povrchy"). The V2 path geometry
// (pathV2.js: meandering centerlines, areas, level field) is kept; what changes is the painting. V2 laid flat colour
// overlays from the old tile textures over the ground. V3 paints the path as part of the continuous ground, pixel by
// pixel in the same pass: the ground under it is trampled (darker, flatter, fewer plants), soil shows through by wear
// level with the ground's own grain, and the soil takes its colour from what it lies on (meadow earth, sand, mud,
// stony gravel); in winter the path is packed, brownish snow. Used by the World/Path Lab and the game alike.
import { fieldAt } from '../game/pathV2.js';
import { gridToWorld } from '../game/isometric.js';

const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function hash(x, y, s) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
function vnoise(x, y, s) { const x0 = Math.floor(x), y0 = Math.floor(y), tx = x - x0, ty = y - y0, fx = tx * tx * (3 - 2 * tx), fy = ty * ty * (3 - 2 * ty), a = hash(x0, y0, s), b = hash(x0 + 1, y0, s), c = hash(x0, y0 + 1, s), d = hash(x0 + 1, y0 + 1, s); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; }

// Sliders of the Path Lab ("Surface (V3)"). Colours are hex strings so presets and the game data stay readable.
export const PATH_SURFACE_SETTINGS = Object.freeze([
  { key: 'trample', label: 'Trampled grass: darkening', min: 0, max: 1, step: 0.01, default: 0.3, tip: 'How much darker the grass is where people walk (level 1 and the path edges).' },
  { key: 'trampleDesat', label: 'Trampled grass: paler', min: 0, max: 1, step: 0.01, default: 0.25, tip: 'Trampled grass loses colour.' },
  { key: 'soilShow', label: 'Soil showing through', min: 0, max: 1.5, step: 0.01, default: 1, tip: 'How soon bare soil appears with wear (level 2 is patchy, level 4 is bare).' },
  { key: 'patchScale', label: 'Soil patch size', min: 0.1, max: 1, step: 0.01, default: 0.45, tip: 'Size of grass islands left in a lightly worn path.' },
  { key: 'edgeSoft', label: 'Edge softness', min: 0, max: 1, step: 0.01, default: 0.45, tip: 'Width of the fade from soil into grass.' },
  { key: 'edgeRagged', label: 'Edge raggedness', min: 0, max: 1, step: 0.01, default: 0.5, tip: 'Grass breaking into the soil edge.' },
  { key: 'halo', label: 'Trampled border', min: 0, max: 1, step: 0.01, default: 0.5, tip: 'A band of trodden grass beside the soil.' },
  { key: 'grain', label: 'Soil grain', min: 0, max: 2, step: 0.01, default: 1, tip: 'Grain and lumps in the soil (the same grain as the ground).' },
  { key: 'pebbles', label: 'Pebbles', min: 0, max: 1, step: 0.01, default: 0.35, tip: 'Small stones in the soil, more on worn paths.' },
  { key: 'centreWear', label: 'Worn centre', min: 0, max: 1, step: 0.01, default: 0.4, tip: 'Darker, packed middle of a well-worn path.' },
  { key: 'plantClear', label: 'Plants cleared', min: 0, max: 1, step: 0.01, default: 0.8, tip: 'How far plants keep off the path (0 = plants grow on paths).' },
  { key: 'winterSnow', label: 'Winter: packed snow', min: 0, max: 1, step: 0.01, default: 0.6, tip: 'In winter the path is packed brownish snow instead of bare soil.' },
]);
export const PATH_SURFACE_COLORS = Object.freeze([
  { key: 'earthLight', label: 'Earth, light wear', default: '#8c7048' },
  { key: 'earth', label: 'Earth, worn', default: '#7a5c3a' },
  { key: 'earthDeep', label: 'Earth, well worn', default: '#664a30' },
  { key: 'sand', label: 'Path on sand', default: '#bd9f6a' },
  { key: 'mud', label: 'Path on mud', default: '#55402c' },
  { key: 'gravel', label: 'Path on shore rocks', default: '#9a8b72' },
  { key: 'snow', label: 'Packed snow', default: '#c9c2b2' },
]);
export const PATH_SURFACE_DEFAULTS = Object.freeze(Object.fromEntries([...PATH_SURFACE_SETTINGS, ...PATH_SURFACE_COLORS].map(p => [p.key, p.default])));

// Zones of continuousGround (ZONE_NAMES): 0–5 grass (5 stony), 6 beach, 7 desert, 8 mud, 9 shore rocks.
const SOIL_FOR_ZONE = { 6: 'sand', 7: 'sand', 8: 'mud', 9: 'gravel' }, STONY = 5;

// geo: pathV2 geometry, index: its buckets (geo, cell). Returns the hooks paintContinuousGround takes as `surface`.
export function pathSurface(geo, index, settings = {}) {
  if (!geo || !index) return null;
  const s = { ...PATH_SURFACE_DEFAULTS, ...settings }, c = Object.fromEntries(PATH_SURFACE_COLORS.map(p => [p.key, hex(s[p.key])]));
  const soft = 1 + s.edgeSoft * 6, haloW = 3 + s.halo * 10, reach = soft + haloW + 6;
  return {
    reach,
    // Distance (ground px, negative inside) and wear level at a tile-space point; far away → [reach, 0].
    sample(fx, fy) {
      const p = gridToWorld(fx, fy), near = index.at(p.x, p.y * 2); if (!near) return [reach, 0];
      const f = fieldAt(geo, p.x, p.y * 2, near, reach); if (!f || f.distance >= reach) return [reach, 0];
      return [f.distance, f.level ?? 1];
    },
    // How much a plant at (fx, fy) is kept: 0 on the path, 1 well away from it.
    plantKeep(fx, fy) { if (!s.plantClear) return 1; const [d] = this.sample(fx, fy); return d >= reach ? 1 : smooth(-2, 4 + s.plantClear * 10, d) > 1 - s.plantClear ? 1 : 0; },
    // Colour of one land pixel. d = ground grain of the pixel (-..+), zone = ground zone, season = seasonLook().
    apply(r, g, b, dist, level, zone, px, py, fx, fy, d, season) {
      if (dist >= reach) return null;
      const lv = Math.max(1, Math.min(4, level || 1)), rag = (vnoise(fx * 3.1, fy * 3.1, 401) - 0.5) * s.edgeRagged * 10 + (hash(px, py, 409) - 0.5) * s.edgeRagged * 3;
      const cover = 1 - smooth(-soft, soft, dist + rag), border = (1 - smooth(0, haloW, dist + rag * 0.5)) * s.halo * 0.6;
      const tr = Math.min(1, Math.max(cover, border));
      if (tr <= 0) return null;
      // Trampled grass: darker, paler, flatter (the grass-blade grain d is pressed out).
      { const flat = 1 / (1 + d * Math.min(1, tr * 1.4)); r *= flat; g *= flat; b *= flat; }
      const patchy = 0.5 + 0.5 * vnoise(fx * 1.7, fy * 1.7, 443), lum = 0.3 * r + 0.59 * g + 0.11 * b, k = tr * s.trample * patchy, ds = tr * s.trampleDesat * patchy;
      r = (r + (lum - r) * ds) * (1 - k * 0.55); g = (g + (lum - g) * ds) * (1 - k * 0.5); b = (b + (lum - b) * ds) * (1 - k * 0.6);
      // Soil: patchy at level 2, bare at 4; grass islands from world noise so they run on across tiles.
      // Bare share by level: 2 ≈ half (grass islands), 3 ≈ most, 4 bare. Islands are smooth world noise (no pixel dots).
      const target = (smooth(1.2, 2, lv) * 0.5 + smooth(2, 3, lv) * 0.38 + smooth(3, 3.8, lv) * 0.3) * s.soilShow;
      const islands = vnoise(fx / s.patchScale, fy / s.patchScale, 419) * 0.85 + vnoise(fx * 4, fy * 4, 421) * 0.15;
      const soil = smooth(0.1, 0.85, cover * Math.max(0, Math.min(1, (target - islands) * 6 + 0.5)));
      if (soil > 0) {
        const name = SOIL_FOR_ZONE[zone], base = name ? c[name] : lv < 2.5 ? c.earthLight : lv < 3.5 ? c.earth : c.earthDeep;
        // Own grain (the ground grain is a grass-blade texture and would print a grid of blades into the soil).
        const grain = 1 + ((hash(px, py, 447) - 0.5) * 0.2 + (vnoise(fx * 14, fy * 14, 449) - 0.5) * 0.22 + (vnoise(fx * 3, fy * 3, 431) - 0.5) * 0.14) * s.grain;
        let sr = base[0] * grain, sg = base[1] * grain, sb = base[2] * grain;
        const centre = smooth(-3, -12, dist) * s.centreWear * smooth(2.6, 4, lv) * 0.22; sr *= 1 - centre; sg *= 1 - centre; sb *= 1 - centre;
        if (hash(px >> 1, py >> 1, 433) < s.pebbles * 0.03 * lv / 3 * (zone === STONY ? 3 : 1)) { const t = 1.15 + hash(px, py, 437) * 0.35; sr = sr * t + 18; sg = sg * t + 18; sb = sb * t + 16; }
        // Season: the ground's tint on soil too (autumn warmth), snow becomes packed brownish snow.
        if (season?.snow > 0 && s.winterSnow > 0) { const m = season.snow * s.winterSnow * (0.75 + hash(px >> 1, py >> 1, 439) * 0.25); sr += (c.snow[0] - sr) * m; sg += (c.snow[1] - sg) * m; sb += (c.snow[2] - sb) * m; }
        r += (sr - r) * soil; g += (sg - g) * soil; b += (sb - b) * soil;
      }
      return [r, g, b];
    },
  };
}
