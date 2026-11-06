// Ruins (#149): decorative wrecks for review in the studio. No game mechanics yet.
// `kind` picks the recipe; `seed` makes the broken edges, fallen blocks and rubble
// repeatable, so a variant always renders the same. Palette materials only:
// soot and charring use `soot` and `charred_wood` (matte, unlike glowing `coals`), overgrowth uses the foliage materials.
// Visible faces: "left" = +Z (sunlit), "right" = +X.
import { box, prism, sphere, lean, cylinderTop, seeded, clamp, lerp } from './shapes.js';
import { WALL_HEIGHT } from './wallkit.js';

export const params = [
  { key: 'kind', values: ['tower', 'wall', 'foundation', 'burnt', 'rubble'], description: 'Broken tower, broken wall, overgrown foundations, burnt building or scattered stones.' },
  { key: 'seed', description: 'Repeatable randomness for broken edges, fallen blocks and rubble.' },
  { key: 'height', unit: 'units', description: 'Height of the tallest standing part.' },
  { key: 'size', unit: 'units', description: 'Tower width or building size (clamped to the footprint).' },
  { key: 'collapse', description: '0 = barely damaged, 1 = mostly fallen.' },
  { key: 'material', values: ['stone', 'wood'], description: 'Burnt building: charred timber or blackened stone.' },
  { key: 'pieces', description: 'Rubble: number of loose stones and bricks.' },
  { key: 'heaps', description: 'Rubble: one heap or several small ones.' },
  { key: 'overgrown', description: 'Grass and moss on the stones.' },
  { key: 'snow', description: 'Winter look: snow on the tops of the stones.' },
];

const COURSE = 0.18;
// Half extents of the footprint for the variant being built: loose stones never leave it.
let bounds = [0.5, 0.5];
const stones = ['stone', 'stone_light', 'stone_dark'];

// A wall run from a to b (model x/z) built of columns whose height falls off unevenly.
function brokenRun(parts, rnd, [ax, az], [bx, bz], { height, thickness, collapse, material = 'stone', soot = 0 }) {
  const length = Math.hypot(bx - ax, bz - az), columns = Math.max(2, Math.round(length / 0.22)), step = length / columns, along = Math.abs(bx - ax) >= Math.abs(bz - az);
  let level = height * lerp(1, 0.45, collapse * rnd());
  for (let i = 0; i < columns; i++) {
    const t = (i + 0.5) / columns, x = lerp(ax, bx, t), z = lerp(az, bz, t);
    level = clamp(level + (rnd() - 0.55) * height * 0.35 * (0.5 + collapse), COURSE, height);
    if (rnd() < collapse * 0.18) continue; // a breach down to the ground
    const h = Math.round(level / COURSE) * COURSE, size = along ? [step + 0.01, h, thickness] : [thickness, h, step + 0.01];
    parts.push(box(along ? [step + 0.03, 0.1, thickness + 0.06] : [thickness + 0.06, 0.1, step + 0.03], [x, 0, z], 'stone_dark'));
    parts.push(box(size, [x, 0.1, z], rnd() < soot ? 'soot' : material));
    if (h > COURSE * 2 && rnd() < 0.35) parts.push(box(along ? [step * 0.6, COURSE * 0.8, thickness * 0.8] : [thickness * 0.8, COURSE * 0.8, step * 0.6], [x + (rnd() - 0.5) * 0.05, 0.1 + h, z], stones[Math.floor(rnd() * 3)]));
  }
}

// Fallen blocks and bricks scattered around a point, lying at random angles.
function rubble(parts, rnd, count, { spread = 0.4, at = [0, 0], big = 0.16 } = {}) {
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = spread * Math.sqrt(rnd()), s = big * (0.45 + rnd() * 0.7), brick = rnd() < 0.45;
    const size = brick ? [s * 1.6, s * 0.55, s * 0.8] : [s, s * 0.7, s * 0.9];
    const reach = Math.hypot(size[0], size[2]) / 2 + 0.03, x = clamp(at[0] + Math.cos(a) * r, -bounds[0] + reach, bounds[0] - reach), z = clamp(at[1] + Math.sin(a) * r, -bounds[1] + reach, bounds[1] - reach);
    parts.push(box(size, [x, 0, z], brick ? 'stone_light' : stones[Math.floor(rnd() * 3)], { rotation: rnd() * Math.PI, tilt: [(rnd() - 0.5) * 0.5, (rnd() - 0.5) * 0.5] }));
  }
}

function overgrowth(parts, rnd, count, spread, snow) {
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = spread * Math.sqrt(rnd()), s = 0.06 + rnd() * 0.07, reach = s * 1.3 + 0.03;
    parts.push(sphere([s * 1.3, s * 0.7, s * 1.3], [clamp(Math.cos(a) * r, -bounds[0] + reach, bounds[0] - reach), 0, clamp(Math.sin(a) * r, -bounds[1] + reach, bounds[1] - reach)], snow ? 'snow' : rnd() < 0.5 ? 'foliage_dark' : 'foliage', 1));
  }
}

function snowCaps(parts) {
  const caps = [];
  for (const p of parts) if (p.shape === 'box' && !p.tilt && p.material !== 'snow' && p.size[1] > 0.08) caps.push(box([p.size[0] * 0.92, 0.035, p.size[2] * 0.92], [p.at[0], p.at[1] + p.size[1], p.at[2]], 'snow', p.rotation ? { rotation: p.rotation } : {}));
  parts.push(...caps);
}

function tower(spec, rnd, footprint, margin) {
  const size = clamp(spec.size ?? 1.4, 0.8, Math.min(footprint.width, footprint.height) - margin * 2), half = size / 2, height = clamp(spec.height ?? 2.6, 1, 4);
  const collapse = clamp(spec.collapse ?? 0.5, 0, 1), thickness = 0.24, parts = [box([size + 0.12, 0.12, size + 0.12], [0, 0, 0], 'stone_dark')];
  // Back walls stand taller than the visible front ones, so the hollow inside shows.
  brokenRun(parts, rnd, [-half, -half + thickness / 2], [half, -half + thickness / 2], { height, thickness, collapse: collapse * 0.6 });
  brokenRun(parts, rnd, [-half + thickness / 2, -half], [-half + thickness / 2, half], { height: height * 0.92, thickness, collapse: collapse * 0.7 });
  brokenRun(parts, rnd, [-half, half - thickness / 2], [half, half - thickness / 2], { height: height * lerp(0.75, 0.35, collapse), thickness, collapse });
  brokenRun(parts, rnd, [half - thickness / 2, -half], [half - thickness / 2, half], { height: height * lerp(0.7, 0.3, collapse), thickness, collapse });
  // A narrow window slit in a standing back wall and the fallen top around the foot.
  parts.push(box([0.08, 0.32, 0.03], [half * 0.2, height * 0.45, -half + thickness + 0.005], 'opening'));
  rubble(parts, rnd, Math.round(10 + collapse * 14), { spread: half + 0.35, big: 0.2 });
  return { parts, height: height + 0.3, spread: half + 0.3 };
}

function wall(spec, rnd, footprint) {
  const length = footprint.width - 0.08, height = clamp(spec.height ?? WALL_HEIGHT, 0.5, WALL_HEIGHT + 0.4), collapse = clamp(spec.collapse ?? 0.5, 0, 1), parts = [];
  // Same thickness and line as the wall kit, so a broken run can sit beside intact walls.
  brokenRun(parts, rnd, [-length / 2, 0], [length / 2, 0], { height, thickness: 0.92, collapse });
  for (let i = 0; i < footprint.width; i++) rubble(parts, rnd, Math.round(3 + collapse * 6), { spread: 0.45, at: [-length / 2 + 0.5 + i, 0.55], big: 0.18 });
  return { parts, height: height + 0.3, spread: Math.min(length / 2, 1) };
}

function foundation(spec, rnd, footprint, margin) {
  const w = footprint.width - margin * 2, d = footprint.height - margin * 2, height = clamp(spec.height ?? 0.7, 0.2, 1.4), collapse = clamp(spec.collapse ?? 0.6, 0, 1), t = 0.2, parts = [];
  parts.push(box([w * 0.9, 0.05, d * 0.9], [0, 0, 0], 'stone_dark')); // the old floor
  brokenRun(parts, rnd, [-w / 2, -d / 2 + t / 2], [w / 2, -d / 2 + t / 2], { height, thickness: t, collapse });
  brokenRun(parts, rnd, [-w / 2 + t / 2, -d / 2], [-w / 2 + t / 2, d / 2], { height, thickness: t, collapse });
  brokenRun(parts, rnd, [-w / 2, d / 2 - t / 2], [w / 2, d / 2 - t / 2], { height: height * 0.6, thickness: t, collapse });
  brokenRun(parts, rnd, [w / 2 - t / 2, -d / 2], [w / 2 - t / 2, d / 2], { height: height * 0.6, thickness: t, collapse });
  // Inner dividing wall stub and the doorway gap on the sunlit side.
  brokenRun(parts, rnd, [0, -d / 2], [0, 0], { height: height * 0.8, thickness: t * 0.8, collapse });
  rubble(parts, rnd, Math.round(6 + collapse * 8), { spread: Math.min(w, d) * 0.4, big: 0.14 });
  return { parts, height: height + 0.25, spread: Math.min(w, d) * 0.45 };
}

function burnt(spec, rnd, footprint, margin) {
  const w = clamp(spec.size ?? 1.7, 0.8, footprint.width - margin * 2), d = clamp((spec.size ?? 1.7) * 0.85, 0.8, footprint.height - margin * 2), height = clamp(spec.height ?? 1.1, 0.6, 2);
  const wood = spec.material === 'wood', collapse = clamp(spec.collapse ?? 0.6, 0, 1), t = wood ? 0.1 : 0.2, parts = [box([w + 0.06, 0.12, d + 0.06], [0, 0, 0], 'stone_dark')];
  const material = wood ? 'charred_wood' : 'stone_dark', soot = wood ? 0.5 : 0.35, run = (a, b, h) => brokenRun(parts, rnd, a, b, { height: h, thickness: t, collapse, material, soot });
  run([-w / 2, -d / 2 + t / 2], [w / 2, -d / 2 + t / 2], height);
  run([-w / 2 + t / 2, -d / 2], [-w / 2 + t / 2, d / 2], height * 0.95);
  run([-w / 2, d / 2 - t / 2], [w / 2, d / 2 - t / 2], height * 0.55);
  run([w / 2 - t / 2, -d / 2], [w / 2 - t / 2, d / 2], height * 0.6);
  // Corner posts still standing, charred roof beams fallen into the house, a slab of the old roof.
  for (const [x, z] of [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2]]) parts.push(box([0.1, height * (0.7 + rnd() * 0.4), 0.1], [x, 0.12, z], 'charred_wood'));
  // Fallen beams lean towards the middle of the house and always end inside the footprint.
  for (let i = 0; i < 4 + Math.round(collapse * 3); i++) {
    const from = [lerp(-w / 2, w / 2, rnd()) * 0.8, 0.12, lerp(-d / 2, d / 2, rnd()) * 0.8], angle = Math.atan2(-from[2], -from[0]) + (rnd() - 0.5) * 0.8;
    const beam = lean({ length: lerp(0.5, 0.9, rnd()) * Math.min(w, d), radiusBottom: 0.04, segments: 5 }, angle, lerp(0.9, 1.3, rnd()), from, rnd() < 0.5 ? 'soot' : 'charred_wood');
    if (Math.abs(beam.end[0]) < w / 2 - 0.05 && Math.abs(beam.end[2]) < d / 2 - 0.05) parts.push(beam.part);
  }
  if (collapse < 0.8) parts.push(prism([w * 0.6, 0.35, d * 0.5], [-w * 0.15, height * 0.45, -d * 0.1], wood ? 'charred_wood' : 'roof_shingle', { rotation: 0.35, tilt: [0.5, 0.15] }));
  parts.push(box([w * 0.7, 0.05, d * 0.6], [0.05, 0.12, 0.05], 'soot')); // ash on the floor
  rubble(parts, rnd, 5, { spread: Math.min(w, d) * 0.5, big: 0.12 });
  return { parts, height: height + 0.4, spread: Math.min(w, d) * 0.5 };
}

function scattered(spec, rnd, footprint) {
  const count = clamp(Math.round(spec.pieces ?? 9), 3, 24), parts = [];
  // A few small heaps or one spread-out field of stones and bricks inside one tile.
  const heaps = spec.heaps ?? 1;
  for (let h = 0; h < heaps; h++) {
    const at = heaps === 1 ? [0, 0] : [Math.cos(h * 2.1 + rnd()) * 0.28, Math.sin(h * 2.1 + rnd()) * 0.28];
    rubble(parts, rnd, Math.ceil(count / heaps), { spread: heaps === 1 ? 0.34 : 0.17, at, big: 0.22 });
    parts.push(box([0.2, 0.12, 0.16], [at[0], 0.08, at[1]], 'stone_light', { rotation: rnd() * Math.PI }));
  }
  return { parts, height: 0.3, spread: 0.35 };
}

export function build(spec, { footprint, style }) {
  const margin = style.scale.footprintMargin, rnd = seeded(spec.seed ?? 1), kind = spec.kind ?? 'tower';
  bounds = [footprint.width / 2, footprint.height / 2];
  const made = kind === 'wall' ? wall(spec, rnd, footprint) : kind === 'foundation' ? foundation(spec, rnd, footprint, margin)
    : kind === 'burnt' ? burnt(spec, rnd, footprint, margin) : kind === 'rubble' ? scattered(spec, rnd, footprint) : tower(spec, rnd, footprint, margin);
  if (spec.overgrown) overgrowth(made.parts, rnd, kind === 'rubble' ? 4 : 10, made.spread, spec.snow);
  if (spec.snow) snowCaps(made.parts);
  // The sprite height is the real top of the tallest piece (loose blocks can sit above a wall).
  const top = p => p.shape === 'cylinder' ? p.at[1] + Math.max(0, cylinderTop(p)[1]) : p.shape === 'sphere' ? p.at[1] + p.radii[1] * 2 : p.at[1] + p.size[1] + (p.tilt ? Math.max(p.size[0], p.size[2]) * 0.3 : 0);
  return { primitives: made.parts, lights: [], height: Math.max(...made.parts.map(top)) + 0.02 };
}

export default { id: 'ruins', version: 1, label: 'Ruins', params, build };
