// #116 Path renderer V2 in the game: the geometry of the Path Lab's V2 renderer (studio/src/path-lab/v2.js), copied
// unchanged so the game draws exactly what the owner picked in the lab ("V2 pesinav2", src/data/pathStyle.js).
// tests/path-v2.test.js checks that this copy and the lab give the same geometry and field for the same map.
// The painting differs from the lab only in where it happens: the lab paints the whole scene at once, the game paints
// one tile diamond at a time into the terrain chunks (TerrainRenderer), from one geometry built for the whole map.
import { tileCenter } from './isometric.js';
import { PATH_STYLE } from '../data/pathStyle.js';

const STEP = Math.hypot(32, 32); // ground distance between orthogonal tile centres
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

// --- deterministic noise -------------------------------------------------------------------------------------------
function hash(x, y, seed) { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(seed | 0, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
const fade = t => t * t * (3 - 2 * t);
export function valueNoise(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y), tx = fade(x - x0), ty = fade(y - y0);
  const a = hash(x0, y0, seed), b = hash(x0 + 1, y0, seed), c = hash(x0, y0 + 1, seed), d = hash(x0 + 1, y0 + 1, seed);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}
// Fractal noise in [-1, 1]; `detail` 0 = one smooth octave, 1 = three octaves.
export function noise(x, y, seed, detail = 0) {
  let sum = 0, amp = 1, total = 0, freq = 1; const octaves = 1 + Math.round(detail * 2);
  for (let i = 0; i < octaves; i++) { sum += (valueNoise(x * freq, y * freq, seed + i * 101) * 2 - 1) * amp; total += amp; amp *= 0.5; freq *= 2.1; }
  return sum / total;
}

// --- topology --------------------------------------------------------------------------------------------------------
export const ground = tile => { const c = tileCenter(tile); return { x: c.x, y: c.y * 2 }; };
// Game only (performance): numeric keys instead of strings (less garbage); the iteration order is unchanged.
const key = (x, y) => (y + 16) * 8192 + (x + 16);
export function topology(map) {
  const worn = (x, y) => map.get(x, y) > 0;
  // An area only where the ground is trodden on all sides (owner 8 Nov 2026): a tile belongs to an area when some full
  // 3 × 3 block of worn tiles contains it. Side-by-side paths or a zigzag (2 × 2 blocks) stay paths, not squares.
  const BLOCK3 = [-1, 0, 1].flatMap(dy => [-1, 0, 1].map(dx => [dx, dy]));
  const area = (x, y) => worn(x, y) && BLOCK3.some(([ox, oy]) => BLOCK3.every(([dx, dy]) => worn(x + ox + dx, y + oy + dy)));
  const nodes = new Map();
  for (let y = 0; y < map.size; y++) for (let x = 0; x < map.size; x++) if (worn(x, y)) nodes.set(key(x, y), { x, y, level: map.get(x, y), area: area(x, y), links: [] });
  for (const n of nodes.values()) for (const [dx, dy] of NEIGHBOURS) {
    const m = nodes.get(key(n.x + dx, n.y + dy)); if (!m) continue;
    if (dx && dy && (worn(n.x + dx, n.y) || worn(n.x, n.y + dy))) continue; // a diagonal only where no corner tile is worn
    if (n.area && m.area) continue; // inside an area the surface is one shape, not a mesh of links
    n.links.push(m);
  }
  // Chains: start at every node that is not a plain pass-through (degree ≠ 2, or an area), walk until the next such node.
  const passThrough = n => !n.area && n.links.length === 2, used = new Set(), chains = [];
  const edgeKey = (a, b) => (a.y * 1000 + a.x < b.y * 1000 + b.x ? key(a.x, a.y) * 2097152 + key(b.x, b.y) : key(b.x, b.y) * 2097152 + key(a.x, a.y));
  const walk = (start, next) => { const tiles = [start]; let prev = start, cur = next; used.add(edgeKey(start, next));
    while (passThrough(cur)) { tiles.push(cur); const nxt = cur.links.find(l => l !== prev && !used.has(edgeKey(cur, l))); if (!nxt) break; used.add(edgeKey(cur, nxt)); prev = cur; cur = nxt; if (cur === start) break; }
    tiles.push(cur); return tiles; };
  for (const n of nodes.values()) if (!passThrough(n)) for (const l of n.links) if (!used.has(edgeKey(n, l))) chains.push(walk(n, l));
  for (const n of nodes.values()) if (passThrough(n)) for (const l of n.links) if (!used.has(edgeKey(n, l))) chains.push(walk(n, l)); // closed loops
  const isolated = [...nodes.values()].filter(n => !n.links.length && !n.area);
  return { nodes, chains, areas: [...nodes.values()].filter(n => n.area), isolated };
}

// --- centerlines -----------------------------------------------------------------------------------------------------
function chaikin(points, iterations) {
  let pts = points;
  for (let k = 0; k < iterations; k++) {
    if (pts.length < 3) return pts;
    const out = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; out.push({ x: a.x * 0.75 + b.x * 0.25, y: a.y * 0.75 + b.y * 0.25, level: a.level }, { x: a.x * 0.25 + b.x * 0.75, y: a.y * 0.25 + b.y * 0.75, level: b.level }); }
    out.push(pts.at(-1)); pts = out;
  }
  return pts;
}
function simplify(points) {
  if (points.length < 3) return points;
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) { const a = out.at(-1), b = points[i], c2 = points[i + 1], cross = (b.x - a.x) * (c2.y - b.y) - (b.y - a.y) * (c2.x - b.x); if (Math.abs(cross) > 1e-6) out.push(b); }
  out.push(points.at(-1)); return out;
}
function fillet(points, radius) {
  if (points.length < 3 || radius <= 0) return points;
  const out = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const p = points[i], a = points[i - 1], b = points[i + 1], la = Math.hypot(p.x - a.x, p.y - a.y), lb = Math.hypot(b.x - p.x, b.y - p.y);
    const r = Math.min(radius, la * 0.48, lb * 0.48), s0 = { x: p.x + (a.x - p.x) * r / la, y: p.y + (a.y - p.y) * r / la, level: p.level }, s1 = { x: p.x + (b.x - p.x) * r / lb, y: p.y + (b.y - p.y) * r / lb, level: p.level };
    out.push(s0); for (let k = 1; k < 8; k++) { const t = k / 8, u = 1 - t; out.push({ x: u * u * s0.x + 2 * u * t * p.x + t * t * s1.x, y: u * u * s0.y + 2 * u * t * p.y + t * t * s1.y, level: p.level }); } out.push(s1);
  }
  out.push(points.at(-1)); return out;
}
function resample(points, spacing) {
  const out = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1], len = Math.hypot(b.x - a.x, b.y - a.y), n = Math.max(1, Math.ceil(len / spacing));
    for (let j = 1; j <= n; j++) { const t = j / n; out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, level: a.level + (b.level - a.level) * t }); }
  }
  return out;
}
// Width by wear level, linear between the levels: 1 = trampled grass, 2–4 = soil (width1–width3).
const widthFor = (level, c) => {
  const table = [0, c.widthGrass, c.width1, c.width2, c.width3], l = Math.max(0, Math.min(4, level)), i = Math.min(3, Math.floor(l));
  return table[i] + (table[i + 1] - table[i]) * (l - i);
};

// Smooth centerline of one chain in ground space: [{x, y, level, width}].
export function centerline(chain, config = PATH_STYLE, seed = 1) {
  const c = { ...PATH_STYLE, ...config }, first = chain[0], last = chain.at(-1);
  // An end that joins a junction or an area stays put (meander fades out) so connections line up.
  const anchored = node => node.area || node.links.length > 2;
  // Keep only the turning points of straight runs, then fillet every turn with a real radius (limited to half of the
  // runs beside it, so the curve stays inside the trodden corridor), then a light corner-cut for smoothness.
  let pts = simplify(chain.map(n => ({ ...ground(n), level: n.level })));
  pts = fillet(pts, c.cornerRounding * c.minCurveRadius * STEP * 1.6);
  pts = resample(chaikin(pts, c.cornerRounding > 0 ? 1 : 0), 4);
  const lengths = [0]; for (let i = 1; i < pts.length; i++) lengths.push(lengths[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const total = lengths.at(-1) || 1, fadeLen = STEP * 0.9, amp = c.meanderStrength * 34, scale = c.meanderFrequency / STEP;
  const out = pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], len = Math.hypot(b.x - a.x, b.y - a.y) || 1, nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
    const s = lengths[i], envelope = Math.min(anchored(first) ? Math.min(1, s / fadeLen) : 1, anchored(last) ? Math.min(1, (total - s) / fadeLen) : 1) * (total < STEP * 1.5 ? total / (STEP * 1.5) : 1);
    const drift = noise(p.x * scale, p.y * scale, seed, 1 - c.meanderSmoothness) * amp * fade(Math.max(0, Math.min(1, envelope)));
    return { x: p.x + nx * drift, y: p.y + ny * drift, level: p.level, width: widthFor(p.level, c) };
  });
  return out;
}

// All shapes of the surface: capsules (path segments) and discs (area tiles, isolated tiles).
export function geometry(map, config = PATH_STYLE, seed = 1) {
  const c = { ...PATH_STYLE, ...config }, topo = topology(map);
  // An area is the union of its tiles' own diamonds (in ground space a square turned 45°, half-diagonal 32), grown by
  // the expansion and rounded: flat trodden ground follows the worn tiles instead of a cluster of equal circles.
  // Tiles overlap by more than the rounding radius, so rounded corners never open holes where four tiles meet.
  const round = 8 + c.areaSmoothness * 22, half = 30 + round * 0.9 + c.areaExpansion * 16;
  const areaCentres = topo.areas.map(n => ({ ...ground(n), level: n.level, half, round, r: half, group: 'area' }));
  const lines = topo.chains.map(ch => centerline(ch, c, seed));
  // Path-to-area blend: a path widens towards the area it enters over the blend distance (no circle on a line).
  const blend = c.blendDistance * STEP;
  // Game only (performance): the nearest area is looked up in a grid of cells as large as the blend reach, so only the
  // area tiles within reach are measured; the result equals the lab's search over every area tile.
  if (blend > 0 && areaCentres.length) {
    const reach = blend + Math.max(...areaCentres.map(a => a.r)), grid = new Map(), cellOf = v => Math.floor(v / reach), cellKey = (gx, gy) => (gx + 512) * 4096 + gy + 512;
    for (const a of areaCentres) { const k = cellKey(cellOf(a.x), cellOf(a.y)); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(a); }
    for (const line of lines) for (const p of line) {
      let d = Infinity, r = 0; const gx = cellOf(p.x), gy = cellOf(p.y);
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) for (const a of grid.get(cellKey(gx + ox, gy + oy)) ?? []) { const dd = Math.hypot(a.x - p.x, a.y - p.y) - a.r; if (dd < d) { d = dd; r = a.r; } }
      if (d < blend) p.width = p.width + (Math.max(p.width, r * 1.1) - p.width) * fade(1 - Math.max(0, d) / blend) * 0.85;
    }
  }
  const segments = [];
  lines.forEach((line, group) => { for (let i = 0; i < line.length - 1; i++) segments.push({ a: line[i], b: line[i + 1], group }); });
  const discs = topo.isolated.map((n, i) => ({ ...ground(n), level: n.level, r: widthFor(n.level, c) * 0.9, group: `disc${i}` }));
  const worn = [...topo.nodes.values()].map(n => ({ ...ground(n), level: n.level }));
  return { topo, lines, segments, discs, tiles: areaCentres, worn, sigma: levelSigma(c), config: c, seed };
}

// Spread of the level field in ground px: 0 → about a quarter tile (changes near the tile edge), 1 → a full tile.
const levelSigma = c => STEP * (0.22 + c.levelBlend * 0.78);
// Wear level at a ground point: Gaussian-weighted mean of the worn tiles around it (grass tiles do not count, so a
// narrow path keeps its level to its edge), sampled at a point nudged by noise so the boundary between two levels
// wanders instead of following the tile diamonds. null when no worn tile is near.
export function levelAt(geo, x, y, worn = null) {
  const c = geo.config, warp = 5 + c.edgeIrregularity * 12, f = 1 / (STEP * 0.8);
  const wx = x + noise(x * f, y * f, geo.seed + 41, 0.4) * warp, wy = y + noise(x * f + 9.7, y * f - 4.3, geo.seed + 43, 0.4) * warp;
  const k = 1 / (2 * geo.sigma * geo.sigma); let sum = 0, weight = 0;
  for (const t of worn ?? geo.worn) { const d2 = (t.x - wx) ** 2 + (t.y - wy) ** 2, w = Math.exp(-d2 * k); sum += w * t.level; weight += w; }
  return weight > 1e-4 ? sum / weight : null;
}

// Signed distance (ground px) and blended wear level at a ground point; negative inside the surface.
// Within one shape (a chain's capsules, all area tiles) the union is exact (min), so densely sampled lines do not
// swell; different shapes meet with a smooth minimum, which makes a path flow into an area or another path.
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; };
// maxDistance (game only): stop before the costly level field when the point is farther out than that.
export function fieldAt(geo, x, y, candidates = null, maxDistance = Infinity) {
  const c = geo.config, k = 6 + c.areaSmoothness * 22, groups = new Map();
  const take = (group, d, level) => { const g = groups.get(group); if (!g || d < g.d) groups.set(group, { d, level }); };
  for (const s of candidates?.segments ?? geo.segments) {
    const { a, b } = s, vx = b.x - a.x, vy = b.y - a.y, l2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((x - a.x) * vx + (y - a.y) * vy) / l2));
    const px = a.x + vx * t, py = a.y + vy * t; take(s.group, Math.hypot(x - px, y - py) - (a.width + (b.width - a.width) * t) / 2, a.level + (b.level - a.level) * t);
  }
  for (const d of candidates?.discs ?? geo.discs) take(d.group, Math.hypot(x - d.x, y - d.y) - d.r, d.level);
  // Rounded diamond of an area tile: box SDF in coordinates turned 45°.
  for (const t of candidates?.tiles ?? geo.tiles) {
    const dx = x - t.x, dy = y - t.y, u = Math.abs(dx + dy) / Math.SQRT2, v = Math.abs(dx - dy) / Math.SQRT2, side = t.half / Math.SQRT2 - t.round;
    const qx = u - side, qy = v - side; take(t.group, Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - t.round, t.level);
  }
  if (!groups.size) return { distance: Infinity, level: 0 };
  let distance = Infinity, levelSum = 0, weightSum = 0;
  // Areas get a broad, low-frequency wobble of their outline, so no diamond or square survives.
  const area = groups.get('area'); if (area) area.d += noise(x / (STEP * 1.7), y / (STEP * 1.7), geo.seed + 29, 0.3) * (6 + c.edgeIrregularity * 16) * (1.2 - c.areaSmoothness * 0.5);
  for (const g of [...groups.values()].sort((a, b) => a.d - b.d)) { distance = distance === Infinity ? g.d : smin(distance, g.d, k); const w = Math.exp(-Math.max(0, g.d) / 8); levelSum += g.level * w; weightSum += w; }
  const edge = noise(x / (c.noiseScale * STEP * 2.2), y / (c.noiseScale * STEP * 2.2), geo.seed + 7, 0) * c.edgeIrregularity * 9 + noise(x / (c.noiseScale * STEP * 0.45), y / (c.noiseScale * STEP * 0.45), geo.seed + 13, 0.5) * c.edgeIrregularity * 3;
  if (distance + edge > maxDistance) return { distance: distance + edge, level: 0 };
  const smooth = geo.worn ? levelAt(geo, x, y, candidates?.worn) : null;
  return { distance: distance + edge, level: smooth ?? levelSum / weightSum };
}

// Spatial buckets so a pixel only looks at nearby shapes.
export function buckets(geo, cell = 96) {
  const grid = new Map(), add = (gx, gy, list, item) => { const k2 = (gx + 512) * 4096 + gy + 512; if (!grid.has(k2)) grid.set(k2, { segments: [], discs: [], tiles: [], worn: [] }); grid.get(k2)[list].push(item); };
  // Game only (performance): a shape farther than this from a point cannot change what is drawn there (the surface is
  // drawn only within halo + softness ≈ 10 px plus edge noise ≈ 6 px, and a farther shape joins a nearer one only within
  // the smooth-minimum range k ≈ 26 px), so fewer cells hold each shape. The lab uses 40 + 30 × areaSmoothness.
  const reach = 16 + 6 + geo.config.areaSmoothness * 22 + 4;
  for (const s of geo.segments) { const r = Math.max(s.a.width, s.b.width) / 2 + reach; for (let gx = Math.floor((Math.min(s.a.x, s.b.x) - r) / cell); gx <= Math.floor((Math.max(s.a.x, s.b.x) + r) / cell); gx++) for (let gy = Math.floor((Math.min(s.a.y, s.b.y) - r) / cell); gy <= Math.floor((Math.max(s.a.y, s.b.y) + r) / cell); gy++) add(gx, gy, 'segments', s); }
  for (const t of geo.tiles) { const r = t.half + reach; for (let gx = Math.floor((t.x - r) / cell); gx <= Math.floor((t.x + r) / cell); gx++) for (let gy = Math.floor((t.y - r) / cell); gy <= Math.floor((t.y + r) / cell); gy++) add(gx, gy, 'tiles', t); }
  for (const t of geo.worn ?? []) { const r = geo.sigma * 3 + 20; for (let gx = Math.floor((t.x - r) / cell); gx <= Math.floor((t.x + r) / cell); gx++) for (let gy = Math.floor((t.y - r) / cell); gy <= Math.floor((t.y + r) / cell); gy++) add(gx, gy, 'worn', t); }
  for (const d of geo.discs) { const r = d.r + reach; for (let gx = Math.floor((d.x - r) / cell); gx <= Math.floor((d.x + r) / cell); gx++) for (let gy = Math.floor((d.y - r) / cell); gy <= Math.floor((d.y + r) / cell); gy++) add(gx, gy, 'discs', d); }
  return { cell, at: (x, y) => grid.get((Math.floor(x / cell) + 512) * 4096 + Math.floor(y / cell) + 512) ?? null };
}

