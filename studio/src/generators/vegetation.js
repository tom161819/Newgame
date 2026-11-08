// Plants of the countryside (plan g-sad-pole-kere, owner 8 Nov 2026): shrubs of five kinds in three sizes, thickets over
// several tiles, apple trees of the orchard by phase and a wheat field tile by phase. Seasons as in the game (spring
// blossom, summer green, autumn colour and fruit, winter bare with snow). One tile of a field or orchard is one sprite,
// like the game's crop plots (CropPlotView paints ground and per-tile plants).
import { box, cylinder, sphere, lean, clamp, seeded, lerp } from './shapes.js';

export const params = [
  { key: 'kind', values: ['shrub', 'thicket', 'apple', 'wheat'], description: 'A shrub, a thicket over the footprint, an orchard apple tree tile, or a wheat field tile.' },
  { key: 'species', values: ['hazel', 'rosehip', 'juniper', 'bramble', 'heather'], description: 'Shrub kind.' },
  { key: 'size', description: 'Shrub size 1 small, 2 medium, 3 large.' },
  { key: 'phase', description: 'Orchard: young, blossom, green, fruit, harvested, winter. Wheat: ploughed, sown, sprouts, green, ripe, stubble, winter.' },
  { key: 'season', values: ['spring', 'summer', 'autumn', 'winter'], description: 'Season of a shrub or thicket.' },
  { key: 'wind', description: 'Wheat: 0 or 1, the two frames of the wind.' },
  { key: 'seed', description: 'Deterministic variation.' },
];

// Leaves, flowers and fruit by species and season.
const SHRUB = {
  hazel: { leaf: ['foliage', 'foliage_dark', 'foliage_light'], autumn: ['foliage_autumn_light', 'foliage_autumn', 'gold_trim'], round: 1, tall: 1.15, fruit: { autumn: 'hair_brown' }, catkins: true },
  rosehip: { leaf: ['foliage_dark', 'foliage', 'olive_scrub'], autumn: ['foliage_autumn_dark', 'foliage_autumn', 'olive_scrub'], round: 0.9, tall: 0.85, flower: { spring: 'blossom', summer: 'blossom' }, fruit: { autumn: 'cloth_red', winter: 'cloth_red' }, thorny: true },
  juniper: { leaf: ['pine_needles', 'foliage_dark', 'pine_needles'], autumn: ['pine_needles', 'foliage_dark', 'pine_needles'], evergreen: true, cone: true, tall: 1.3, fruit: { autumn: 'banner_blue', winter: 'banner_blue' } },
  bramble: { leaf: ['foliage_dark', 'foliage', 'foliage_dark'], autumn: ['foliage_autumn_dark', 'hair_auburn', 'foliage_dark'], round: 1.25, tall: 0.6, flower: { summer: 'cloth_linen' }, fruit: { autumn: 'horse_dark' }, sprawl: true },
  heather: { leaf: ['olive_scrub', 'foliage_dark', 'olive_scrub'], autumn: ['blossom', 'olive_scrub', 'blossom'], round: 1.1, tall: 0.4, flower: { summer: 'blossom', autumn: 'blossom' }, low: true },
};

const rnd = seeded;
// A shrub: a woody base, then leafy lumps over a dome; flowers and fruit dots on the outside; bare twigs in winter.
function shrub(parts, r, { x = 0, z = 0, species = 'hazel', size = 2, season = 'summer', limit = 0.45 }) {
  const s = SHRUB[species] ?? SHRUB.hazel, scale = [0.2, 0.3, 0.4][clamp(size, 1, 3) - 1] * (0.9 + r() * 0.2);
  const w = Math.min(limit, scale * (s.round ?? 1)), h = scale * 1.5 * (s.tall ?? 1);
  const bare = season === 'winter' && !s.evergreen, leaves = season === 'autumn' ? s.autumn : s.leaf;
  // Stems.
  for (let i = 0; i < 5 + size * 2; i++) parts.push(lean({ length: h * (bare ? 0.9 : 0.6) * (0.6 + r() * 0.5), radiusBottom: 0.012 * size, radiusTop: 0.004, segments: 4 }, r() * 6.28, 0.25 + r() * 0.45, [x + (r() - 0.5) * w * 0.4, 0, z + (r() - 0.5) * w * 0.4], 'twigs').part);
  if (bare) { for (let i = 0; i < 4 + size * 2; i++) parts.push(lean({ length: h * 0.45, radiusBottom: 0.006, radiusTop: 0.002, segments: 3 }, r() * 6.28, 0.3 + r() * 0.3, [x + (r() - 0.5) * w, h * (0.3 + r() * 0.4), z + (r() - 0.5) * w], 'twigs').part); }
  else if (s.cone) {
    // Juniper: a pointed column of needle lumps.
    for (let i = 0; i < 6 + size * 3; i++) { const t = i / (6 + size * 3), rad = w * (1 - t * 0.75), a = r() * 6.28; parts.push(sphere([rad * 0.55, h * 0.18, rad * 0.55], [x + Math.cos(a) * rad * 0.3, h * t * 0.85, z + Math.sin(a) * rad * 0.3], leaves[i % leaves.length], 1)); }
  } else {
    const lumps = 6 + size * 5;
    for (let i = 0; i < lumps; i++) {
      const a = r() * 6.28, d = Math.sqrt(r()) * w * 0.75, k = 0.45 + r() * 0.35, y = s.low ? r() * h * 0.3 : (0.15 + r() * 0.55) * h * (1 - d / w * 0.6);
      parts.push(sphere([w * k * 0.55, h * k * 0.32, w * k * 0.5], [x + Math.cos(a) * d, y, z + Math.sin(a) * d], leaves[i % leaves.length], 1, { rotation: r() * 3 }));
    }
    if (s.sprawl) for (let i = 0; i < 4; i++) parts.push(lean({ length: w * 1.1, radiusBottom: 0.01, radiusTop: 0.004, segments: 4 }, r() * 6.28, 1.1, [x, h * 0.35, z], 'foliage_dark').part); // arching bramble canes
  }
  if (season === 'winter') parts.push(sphere([w * 0.7, 0.02, w * 0.6], [x, bare ? 0 : h * 0.72, z], 'snow', 1));
  const dots = (material, count, size) => { for (let i = 0; i < count; i++) { const a = r() * 6.28, d = w * (0.45 + r() * 0.35), y = (s.low ? 0.15 : 0.3 + r() * 0.5) * h; parts.push(sphere([size, size, size], [x + Math.cos(a) * d, y, z + Math.sin(a) * d], material, 0)); } };
  if (s.flower?.[season]) dots(s.flower[season], 8 + size * 6, 0.016);
  if (s.fruit?.[season]) dots(s.fruit[season], 6 + size * 4, 0.014);
  if (s.catkins && season === 'spring') dots('gold_trim', 10, 0.012);
  return h;
}

// Apple tree of an orchard tile, with the grass between rows and a ground patch.
function apple(parts, r, { phase = 'green' }) {
  parts.push(sphere([0.44, 0.008, 0.4], [0, 0, 0], phase === 'winter' ? 'snow' : 'grass_scrub', 1), sphere([0.16, 0.012, 0.15], [0, 0, 0], 'soil', 1));
  const young = phase === 'young', trunk = young ? 0.3 : 0.5, crown = young ? 0.2 : 0.38;
  parts.push(cylinder({ radiusBottom: young ? 0.018 : 0.04, radiusTop: young ? 0.012 : 0.028, height: trunk, segments: 6 }, [0, 0, 0], 'bark'));
  for (let i = 0; i < (young ? 3 : 5); i++) parts.push(lean({ length: crown * 1.1, radiusBottom: young ? 0.008 : 0.016, radiusTop: 0.005, segments: 4 }, i * 1.3 + r(), 0.7, [0, trunk * 0.9, 0], 'bark').part);
  if (young) parts.push(cylinder({ radiusBottom: 0.008, height: 0.3, segments: 4 }, [0.05, 0, 0.02], 'wood')); // stake
  if (phase !== 'winter' && phase !== 'harvested-bare') {
    const leaves = phase === 'harvested' ? ['foliage_autumn', 'foliage_autumn_light', 'foliage'] : phase === 'blossom' ? ['foliage_light', 'blossom', 'foliage_spring'] : ['foliage', 'foliage_dark', 'foliage_light'];
    for (let i = 0; i < (young ? 7 : 16); i++) { const a = r() * 6.28, d = r() * crown * 0.75; parts.push(sphere([crown * 0.5, crown * 0.38, crown * 0.47], [Math.cos(a) * d, trunk + crown * (0.2 + r() * 0.8), Math.sin(a) * d], leaves[i % leaves.length], 1)); }
    const dots = (m, n, s) => { for (let i = 0; i < n; i++) { const a = r() * 6.28, d = crown * (0.6 + r() * 0.35); parts.push(sphere([s, s, s], [Math.cos(a) * d, trunk + crown * (0.3 + r() * 0.9), Math.sin(a) * d], m, 0)); } };
    if (phase === 'blossom') dots('cloth_linen', 26, 0.02);
    if (phase === 'fruit') { dots('apple', 18, 0.026); parts.push(box([0.12, 0.08, 0.1], [0.24, 0, 0.18], 'wood_dark', { rotation: 0.4 })); for (let i = 0; i < 5; i++) parts.push(sphere([0.022, 0.022, 0.022], [0.22 + (r() - 0.5) * 0.06, 0.07, 0.17 + (r() - 0.5) * 0.05], 'apple', 0)); } // and a basket
    if (phase === 'harvested') for (let i = 0; i < 4; i++) parts.push(sphere([0.02, 0.01, 0.02], [(r() - 0.5) * 0.6, 0, (r() - 0.5) * 0.6], 'foliage_autumn', 0)); // fallen leaves
  } else for (let i = 0; i < 4; i++) parts.push(sphere([0.12, 0.03, 0.1], [(r() - 0.5) * 0.2, trunk + 0.15 + r() * 0.2, (r() - 0.5) * 0.2], 'snow', 1));
}

// Wheat field tile: furrows, then plants by phase; the wind bends ripe ears one way or the other.
function wheat(parts, r, { phase = 'green', wind = 0 }) {
  const soil = phase === 'winter' ? 'snow' : 'soil';
  parts.push(box([0.96, 0.02, 0.96], [0, 0, 0], soil));
  const rows = 8;
  for (let i = 0; i < rows; i++) { const z = -0.4 + i * 0.8 / (rows - 1); parts.push(box([0.94, 0.035, 0.05], [0, 0.02, z], phase === 'winter' ? 'snow' : 'soil')); }
  if (phase === 'ploughed' || phase === 'winter') { for (let i = 0; i < 10; i++) parts.push(sphere([0.025, 0.015, 0.02], [(r() - 0.5) * 0.85, 0.02, (r() - 0.5) * 0.85], phase === 'winter' ? 'stone_light' : 'soil', 0)); return; }
  if (phase === 'sown') { for (let i = 0; i < 40; i++) parts.push(sphere([0.006, 0.004, 0.006], [(r() - 0.5) * 0.85, 0.05, -0.4 + Math.floor(r() * rows) * 0.8 / (rows - 1)], 'thatch', 0)); return; }
  const height = { sprouts: 0.07, green: 0.3, ripe: 0.38, stubble: 0.05 }[phase] ?? 0.3;
  const colour = phase === 'ripe' ? ['thatch', 'gold_trim', 'grass_scrub'] : phase === 'stubble' ? ['grass_scrub', 'thatch'] : ['foliage_light', 'foliage', 'foliage_spring'];
  for (let row = 0; row < rows; row++) for (let i = 0; i < 13; i++) {
    const x = -0.36 + i * 0.06 + (r() - 0.5) * 0.03, z = -0.36 + row * 0.72 / (rows - 1) + (r() - 0.5) * 0.03, len = height * (0.8 + r() * 0.35);
    const bend = phase === 'ripe' ? (wind ? 0.24 : 0.1) + r() * 0.06 : 0.08 + r() * 0.1, dir = phase === 'ripe' ? (wind ? 0.5 : 0.2) : r() * 6.28;
    const stalk = lean({ length: len, radiusBottom: 0.009, radiusTop: 0.004, segments: 3 }, dir, bend, [x, 0.03, z], colour[(row + i) % colour.length]);
    parts.push(stalk.part);
    if (phase === 'ripe' || phase === 'green') parts.push(sphere([0.016, 0.035, 0.016], [stalk.end[0], stalk.end[1] - 0.02, stalk.end[2]], phase === 'ripe' ? 'gold_trim' : 'foliage_light', 0));
  }
  if (phase === 'stubble') for (const [x, z] of [[-0.18, -0.1], [0.2, 0.15]]) { // sheaves
    for (let k = 0; k < 6; k++) parts.push(lean({ length: 0.3, radiusBottom: 0.03, radiusTop: 0.02, segments: 5 }, k * 1.05, 0.22, [x, 0.03, z], 'thatch').part);
    parts.push(cylinder({ radiusBottom: 0.035, height: 0.03, segments: 6 }, [x, 0.17, z], 'gold_trim'));
  }
}

export function build(spec, { footprint }) {
  const r = rnd(spec.seed ?? 1), parts = [], kind = spec.kind ?? 'shrub', w = footprint.width, d = footprint.height;
  if (kind === 'apple') apple(parts, r, spec);
  else if (kind === 'wheat') wheat(parts, r, spec);
  else if (kind === 'thicket') {
    // One continuous growth over the footprint: shrubs of mixed sizes in a staggered grid, a few taller, filling gaps.
    const species = spec.species ?? 'hazel', mix = spec.mix ?? [species];
    parts.push(sphere([w / 2 * 0.92, 0.008, d / 2 * 0.92], [0, 0, 0], spec.season === 'winter' ? 'snow' : 'moss', 1));
    const n = Math.round(w * d * 4.5);
    for (let i = 0; i < n; i++) { const x = (r() - 0.5) * (w - 0.75), z = (r() - 0.5) * (d - 0.75); shrub(parts, r, { x, z, species: mix[i % mix.length], size: 1 + Math.floor(r() * 3), season: spec.season, limit: 0.32 }); }
  } else {
    parts.push(sphere([0.38, 0.006, 0.34], [0, 0, 0], spec.season === 'winter' ? 'snow' : 'moss', 1));
    shrub(parts, r, { species: spec.species, size: spec.size ?? 2, season: spec.season, limit: 0.4 });
  }
  const top = p => p.shape === 'sphere' ? p.at[1] + p.radii[1] * 2 : p.shape === 'cylinder' ? p.at[1] + (p.height ?? 0.3) + 0.3 : p.at[1] + (p.size?.[1] ?? 0.4);
  return { primitives: parts, lights: [], height: Math.max(0.3, ...parts.map(top)) + 0.05 };
}

export default { id: 'vegetation', version: 1, label: 'Shrubs, orchard and field', params, build };
