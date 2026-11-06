// Ruins (#149): decorative wrecks for review in the studio. No game mechanics yet.
// `kind` picks the recipe; `seed` makes the broken edges, fallen blocks and rubble
// repeatable, so a variant always renders the same. Palette materials only:
// soot and charring use `soot` and `charred_wood` (matte, unlike glowing `coals`), overgrowth uses the foliage materials.
// Visible faces: "left" = +Z (sunlit), "right" = +X.
import { box, prism, sphere, lean, cylinderTop, seeded, clamp, lerp } from './shapes.js';
import { WALL_HEIGHT } from './wallkit.js';

export const params = [
  { key: 'kind', values: ['tower', 'wall', 'stonewall', 'foundation', 'burnt', 'rubble'], description: 'Broken tower, broken wall (coursed blocks), rough stone wall (irregular rubble masonry), overgrown foundations, burnt building or scattered stones.' },
  { key: 'seed', description: 'Repeatable randomness for broken edges, fallen blocks and rubble.' },
  { key: 'height', unit: 'units', description: 'Height of the tallest standing part.' },
  { key: 'size', unit: 'units', description: 'Tower width or building size (clamped to the footprint).' },
  { key: 'collapse', description: '0 = barely damaged, 1 = mostly fallen.' },
  { key: 'material', values: ['stone', 'wood'], description: 'Burnt building: charred timber or blackened stone.' },
  { key: 'pieces', description: 'Rubble: number of loose stones and bricks.' },
  { key: 'heaps', description: 'Rubble: number of heaps. Stone wall: fallen stone heaps as [t, amount 0–1, \'through\' to fill a breach].' },
  { key: 'overgrown', description: 'Grass and moss on the stones.' },
  { key: 'snow', description: 'Winter look: snow on the tops of the stones.' },
  { key: 'profile', description: 'Stone wall: broken top as [t along the wall 0–1, fraction of height] points.' },
  { key: 'ragged', description: 'Stone wall: 0 = clean break, 1 = many stones knocked off or askew near the top.' },
  { key: 'holes', description: 'Stone wall: share of stones missing from the face (0–0.3).' },
  { key: 'thickness', unit: 'units', description: 'Stone wall thickness.' },
  { key: 'lean', description: 'Stone wall: { from, to, amount } part of the wall (t) leaning out by amount units at the top.' },
  { key: 'window', description: 'Stone wall: { at, y, width, height } window opening (at = t, y = fraction of height).' },
  { key: 'green', description: 'Stone wall: grass and moss, 0–1.' },
  { key: 'ivy', description: 'Stone wall: number of ivy runs on the sunlit face.' },
  { key: 'bushes', description: 'Stone wall: number of bushes in the rubble.' },
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

// ---- Rough stone wall (#149 v2) -------------------------------------------------------------------------------
// Rubble masonry: every stone is its own box of random length, course height, depth, twist and lean, so nothing lines
// up. The broken top follows `profile` (points [t along the wall 0–1, fraction of `height`]) plus seeded noise, and
// stones near that line are shorter, missing or knocked askew. A dark core behind the stones shows through gaps and
// missing stones. Fallen stones lie in heaps (`heaps`: [t, amount 0–1, 'through' for a heap filling a breach]),
// on a patch of soil, with grass, moss, ivy and bushes by `green` (0–1), `ivy` and `bushes`.
const FIELD = ['fieldstone', 'fieldstone', 'fieldstone', 'fieldstone_light', 'fieldstone_light', 'fieldstone_dark'];
const pick = (rnd, list) => list[Math.floor(rnd() * list.length)];

function profileAt(points, t) {
  if (t <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) if (t <= points[i][0]) {
    const [t0, v0] = points[i - 1], [t1, v1] = points[i];
    return lerp(v0, v1, (t - t0) / Math.max(1e-6, t1 - t0));
  }
  return points[points.length - 1][1];
}

// Smooth seeded noise along the wall (−1…1), so the top wanders between the profile points.
function wander(rnd, samples = 28) {
  const raw = Array.from({ length: samples + 1 }, () => rnd() * 2 - 1);
  const smooth = raw.map((_, i) => (raw[Math.max(0, i - 1)] + raw[i] * 2 + raw[Math.min(samples, i + 1)]) / 4);
  return t => { const f = clamp(t, 0, 1) * samples, i = Math.floor(f); return lerp(smooth[i], smooth[Math.min(samples, i + 1)], f - i); };
}

// A low-poly stone (icosahedron) resting on the ground or a heap, kept inside the footprint.
function rock(parts, rnd, [x, y, z], size, material) {
  const rx = size * (0.9 + rnd() * 0.5), ry = size * (0.45 + rnd() * 0.3), rz = size * (0.8 + rnd() * 0.45), reach = Math.max(rx, rz) + 0.02;
  parts.push(sphere([rx, ry, rz], [clamp(x, -bounds[0] + reach, bounds[0] - reach), Math.max(0, y), clamp(z, -bounds[1] + reach, bounds[1] - reach)], material, 0, { rotation: rnd() * Math.PI }));
}

function heap(parts, rnd, { at: [hx, hz], rx, rz, height, count }) {
  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()), x = hx + Math.cos(a) * rx * r, z = hz + Math.sin(a) * rz * r;
    const size = lerp(0.045, 0.12, rnd() * rnd() + 0.25 * (1 - r)), y = height * (1 - r * r) * (0.55 + rnd() * 0.45) - size * 0.7;
    if (rnd() < 0.22) {
      // A dressed block fallen from the wall, lying askew.
      const s = size * 1.4, w = s * (1.4 + rnd()), reach = w / 2 + 0.03;
      parts.push(box([w, s * 0.75, s], [clamp(x, -bounds[0] + reach, bounds[0] - reach), Math.max(0, y), clamp(z, -bounds[1] + reach, bounds[1] - reach)], pick(rnd, FIELD), { rotation: rnd() * Math.PI, tilt: [(rnd() - 0.5) * 0.6, (rnd() - 0.5) * 0.6] }));
    } else rock(parts, rnd, [x, y, z], size, rnd() < 0.3 ? 'fieldstone_dark' : pick(rnd, FIELD));
  }
}

function tuft(parts, rnd, [x, z], scale = 1, material = 'foliage') {
  const blades = 3 + Math.floor(rnd() * 3), cx = clamp(x, -bounds[0] + 0.15, bounds[0] - 0.15), cz = clamp(z, -bounds[1] + 0.15, bounds[1] - 0.15);
  for (let i = 0; i < blades; i++) {
    const h = (0.07 + rnd() * 0.07) * scale;
    parts.push({ shape: 'cylinder', radiusBottom: 0.016 * scale, radiusTop: 0, height: h, segments: 3, at: [cx + (rnd() - 0.5) * 0.05, 0, cz + (rnd() - 0.5) * 0.05], material: rnd() < 0.4 ? 'foliage_light' : material, tilt: [(rnd() - 0.5) * 0.7, (rnd() - 0.5) * 0.7] });
  }
}

function bush(parts, rnd, [x, y, z], size) {
  const lumps = 3 + Math.floor(rnd() * 3), reach = size * 1.3 + 0.03;
  const cx = clamp(x, -bounds[0] + reach, bounds[0] - reach), cz = clamp(z, -bounds[1] + reach, bounds[1] - reach);
  for (let i = 0; i < lumps; i++) {
    const s = size * (0.6 + rnd() * 0.4), a = rnd() * Math.PI * 2, d = size * 0.45 * rnd();
    parts.push(sphere([s, s * 0.75, s], [cx + Math.cos(a) * d, y + rnd() * size * 0.3, cz + Math.sin(a) * d], pick(rnd, ['foliage', 'foliage_dark', 'foliage_dark', 'foliage_light']), 1));
  }
}

function stonewall(spec, rnd, footprint) {
  const length = footprint.width - 0.16, height = clamp(spec.height ?? WALL_HEIGHT, 0.3, WALL_HEIGHT + 0.2), thickness = clamp(spec.thickness ?? 0.6, 0.4, 0.8);
  const line = clamp(spec.line ?? -0.1, -0.2, 0.1), ragged = clamp(spec.ragged ?? 0.5, 0, 1), holes = clamp(spec.holes ?? 0.05, 0, 0.3), green = clamp(spec.green ?? 0.3, 0, 1);
  const points = (spec.profile ?? [[0, 0.8], [0.5, 0.55], [1, 0.7]]).map(([t, v]) => [clamp(t, 0, 1), clamp(v, 0, 1)]).sort((a, b) => a[0] - b[0]);
  const noise = wander(rnd), leanSpec = spec.lean, win = spec.window;
  const left = -length / 2, front = line + thickness / 2, parts = [];
  const tOf = x => (x - left) / length;
  const topAt = t => Math.max(0, height * profileAt(points, t) + noise(t) * height * 0.07 * (0.5 + ragged));
  // Outward lean of part of the wall: z offset of a stone at height y (grows with height).
  const leanAt = (t, y) => {
    if (!leanSpec) return 0;
    const [from, to] = [leanSpec.from ?? 0.5, leanSpec.to ?? 1], w = clamp((t - from) / Math.max(0.01, to - from), 0, 1);
    return (leanSpec.amount ?? 0.06) * Math.sin(w * Math.PI * 0.5) * (y / height);
  };
  const inWindow = (x, y0, y1, half = 0) => win && Math.abs(tOf(x) - win.at) * length < win.width / 2 + half && y1 > win.y * height && y0 < win.y * height + win.height;

  // Soil and dust at the foot instead of a flat plinth; the wall grows out of the ground.
  parts.push(sphere([length / 2 + 0.02, 0.012, 0.36], [0, 0, clamp(line + 0.05, -0.12, 0.12)], 'soil', 1));

  // Core: dark rubble fill a little thinner than the stones, a narrow column at a time, under the broken line.
  for (let x = left + 0.05; x < -left - 0.04; x += 0.09) {
    const h = topAt(tOf(x)) - 0.26; // well under the top, so knocked-off stones open to the sky, not to a dark slab
    if (h > 0.08 && !inWindow(x, 0, h)) parts.push(box([0.1, h, thickness - 0.16], [x, 0, line + leanAt(tOf(x), h / 2)], 'rubble_fill'));
  }

  // Stones course by course; course heights and stone lengths vary, bigger stones low down.
  const tops = new Map(); // column bin → { y, z } of the highest stone, for moss and loose stones
  let y = 0, course = 0;
  while (y < height) {
    const low = 1.15 - 0.3 * (y / height), ch = lerp(0.11, 0.18, rnd()) * low;
    let x = left - rnd() * 0.12 * (course % 2 ? 1 : 0.4);
    while (x < -left - 0.05) {
      let len = Math.min(lerp(0.12, 0.3, rnd()) * low, -left - x);
      if (len < 0.07) { len = -left - x; if (len < 0.04) break; }
      const cx = Math.max(left + len / 2, x + len / 2), t = tOf(cx), top = topAt(t);
      x += len;
      if (y + ch * 0.45 > top + (rnd() - 0.5) * ch * 1.4 * (0.4 + ragged)) continue; // above the broken line, ragged per stone
      const nearTop = top - y < ch * 1.7;
      if (nearTop && rnd() < ragged * 0.4) continue; // knocked off the top
      if (!nearTop && y > 0.05 && rnd() < holes) continue; // a missing stone shows the dark core
      if (inWindow(cx, y, y + ch, len / 2 - 0.02)) continue;
      // Stones of one course differ in height too, so the bed joints wander instead of running level.
      const sh = Math.max(ch * 0.45, Math.min(ch * lerp(0.78, 1, rnd()), top - y)) - 0.016;
      const loose = nearTop ? ragged : 0.15, lz = leanAt(t, y);
      const depth = thickness * (0.9 + rnd() * 0.12), z = line + (rnd() - 0.5) * 0.045 + lz;
      const tilt = [(rnd() - 0.5) * 0.06 * (1 + loose * 2) + (leanSpec ? Math.atan(leanAt(t, height) / height) : 0), (rnd() - 0.5) * 0.07 * (1 + loose * 2)];
      parts.push(box([len - 0.018, sh, depth], [cx, y, z], y < 0.2 && rnd() < 0.3 ? 'fieldstone_dark' : pick(rnd, FIELD), { rotation: (rnd() - 0.5) * 0.14 * (1 + loose), tilt }));
      const bin = Math.round(cx / 0.12), prev = tops.get(bin);
      if (!prev || y + sh > prev.y) tops.set(bin, { x: cx, y: y + sh, z, len });
    }
    y += ch; course++;
  }

  // The window of a tall wall: a dark opening with a pale lintel and sill, if the wall still reaches them.
  if (win) {
    const wx = left + win.at * length, y0 = win.y * height;
    if (topAt(win.at) > y0 + win.height + 0.12) {
      parts.push(box([win.width, win.height, thickness - 0.1], [wx, y0, line + leanAt(win.at, y0)], 'opening'));
      parts.push(box([win.width + 0.16, 0.1, thickness * 0.95], [wx, y0 + win.height, line + leanAt(win.at, y0 + win.height)], 'fieldstone_light', { tilt: [0, 0.03] }));
    }
    parts.push(box([win.width + 0.08, 0.06, thickness * 0.98], [wx, y0 - 0.06, line + leanAt(win.at, y0)], 'fieldstone_light'));
  }

  // Loose stones balanced on the broken top, and moss on the highest stones.
  for (const top of tops.values()) {
    if (top.y > 0.25 && rnd() < 0.25 + ragged * 0.25) parts.push(box([lerp(0.1, 0.2, rnd()), lerp(0.06, 0.1, rnd()), lerp(0.14, thickness * 0.7, rnd())], [clamp(top.x + (rnd() - 0.5) * 0.08, left + 0.1, -left - 0.1), top.y, top.z + (rnd() - 0.5) * 0.1], pick(rnd, FIELD), { rotation: (rnd() - 0.5) * 0.9, tilt: [(rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.4] }));
    if (rnd() < green * 0.9) parts.push(sphere([lerp(0.07, 0.12, rnd()), 0.014 + green * 0.012, lerp(0.12, thickness * 0.42, rnd())], [top.x, top.y - 0.004, top.z], rnd() < 0.7 ? 'moss' : 'foliage_dark', 1));
  }

  // Heaps of fallen stones: in front of the wall, or filling a breach right through it.
  for (const [t, amount = 0.6, kind] of spec.heaps ?? [[0.5, 0.6]]) {
    const through = kind === 'through', a = clamp(amount, 0, 1), hx = left + clamp(t, 0, 1) * length;
    const hz = through ? line + 0.04 : front + 0.1, rz = through ? thickness / 2 + 0.16 : 0.15, rx = lerp(0.18, 0.36, a);
    heap(parts, rnd, { at: [hx, hz], rx, rz, height: lerp(0.12, through ? 0.36 : 0.26, a), count: Math.round(lerp(8, 26, a)) });
  }
  // A few single stones thrown further out.
  for (let i = 0; i < 5; i++) rock(parts, rnd, [lerp(left, -left, rnd()), 0, front + 0.05 + rnd() * 0.2], lerp(0.035, 0.07, rnd()), pick(rnd, FIELD));

  // Grass at the foot and between the stones; ivy climbing the sunlit face; bushes in the rubble.
  const tufts = Math.round(lerp(4, 22, green));
  for (let i = 0; i < tufts; i++) tuft(parts, rnd, [lerp(left - 0.04, -left + 0.04, rnd()), rnd() < 0.7 ? front + 0.02 + rnd() * 0.2 : line - thickness / 2 - 0.06 - rnd() * 0.1], 0.8 + green * 0.6, rnd() < 0.5 ? 'foliage' : 'foliage_dark');
  for (let v = 0; v < (spec.ivy ?? 0); v++) {
    let vx = lerp(left + 0.15, -left - 0.15, (v + 0.3 + rnd() * 0.4) / (spec.ivy ?? 1)), vy = 0.02;
    const reach = topAt(tOf(vx)) * lerp(0.6, 0.95, rnd());
    while (vy < reach) {
      const s = lerp(0.05, 0.085, rnd()), t = tOf(vx);
      parts.push(sphere([s, s * 0.8, 0.028], [clamp(vx, left + 0.06, -left - 0.06), vy, front + leanAt(t, vy) + 0.03], rnd() < 0.6 ? 'foliage_dark' : 'foliage', 1));
      vy += s * 1.1; vx += (rnd() - 0.5) * 0.14;
    }
  }
  for (let b = 0; b < (spec.bushes ?? 0); b++) bush(parts, rnd, [lerp(left + 0.1, -left - 0.1, rnd()), 0, rnd() < 0.75 ? front + 0.12 : line - thickness / 2 - 0.1], lerp(0.09, 0.16, rnd()));

  return { parts, height: height + 0.3, spread: Math.min(length / 2, 1) };
}

export function build(spec, { footprint, style }) {
  const margin = style.scale.footprintMargin, rnd = seeded(spec.seed ?? 1), kind = spec.kind ?? 'tower';
  bounds = [footprint.width / 2, footprint.height / 2];
  const made = kind === 'stonewall' ? stonewall(spec, rnd, footprint) : kind === 'wall' ? wall(spec, rnd, footprint) : kind === 'foundation' ? foundation(spec, rnd, footprint, margin)
    : kind === 'burnt' ? burnt(spec, rnd, footprint, margin) : kind === 'rubble' ? scattered(spec, rnd, footprint) : tower(spec, rnd, footprint, margin);
  if (spec.overgrown) overgrowth(made.parts, rnd, kind === 'rubble' ? 4 : 10, made.spread, spec.snow);
  if (spec.snow) snowCaps(made.parts);
  // The sprite height is the real top of the tallest piece (loose blocks can sit above a wall).
  const top = p => p.shape === 'cylinder' ? p.at[1] + Math.max(0, cylinderTop(p)[1]) : p.shape === 'sphere' ? p.at[1] + p.radii[1] * 2 : p.at[1] + p.size[1] + (p.tilt ? Math.max(p.size[0], p.size[2]) * 0.3 : 0);
  return { primitives: made.parts, lights: [], height: Math.max(...made.parts.map(top)) + 0.02 };
}

export default { id: 'ruins', version: 1, label: 'Ruins', params, build };
