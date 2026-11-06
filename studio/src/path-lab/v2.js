// Path renderer V2 (#116), Path Lab only. A different geometric principle from N12:
//  1. topology: worn tiles become a graph (4-neighbours; a diagonal only where neither corner tile is worn, as in N12);
//     tiles inside a 2 × 2 worn block are AREA tiles; maximal runs through ordinary tiles become CHAINS, ending at
//     junctions, dead ends or areas;
//  2. centerlines: each chain is corner-cut (Chaikin) for rounded turns, resampled, and drifted sideways by smooth
//     world-space noise (meander) that fades out where the chain meets a junction or an area;
//  3. one surface: every point of the ground gets a signed distance to the union of all path capsules (variable width
//     by wear level, widening towards an area over the blend distance) and area discs, joined with a smooth minimum, so
//     a path flows into an area instead of ending in a circle; world-space noise roughens the edge.
// Ground space is (x, 2y) of the game's 64 × 32 projection, like N12's paths, so shapes lie flat on the ground.
// Pure geometry here; `createV2Renderer` paints it on a canvas. Deterministic for seed + tile coordinates.
import { tileCenter } from '../../../src/game/isometric.js';
import { defaultConfig } from './params.js';

export const V2_VERSION = 1;
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
const key = (x, y) => `${x},${y}`;
export function topology(map) {
  const worn = (x, y) => map.get(x, y) > 0;
  const area = (x, y) => worn(x, y) && [[0, 0], [-1, 0], [0, -1], [-1, -1]].some(([ox, oy]) => [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dy]) => worn(x + ox + dx, y + oy + dy)));
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
  const edgeKey = (a, b) => (a.y * 1000 + a.x < b.y * 1000 + b.x ? `${key(a.x, a.y)}|${key(b.x, b.y)}` : `${key(b.x, b.y)}|${key(a.x, a.y)}`);
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
const widthFor = (level, c) => level <= 1 ? c.width1 * level : level <= 2 ? c.width1 + (c.width2 - c.width1) * (level - 1) : c.width2 + (c.width3 - c.width2) * Math.min(1, level - 2);

// Smooth centerline of one chain in ground space: [{x, y, level, width}].
export function centerline(chain, config = defaultConfig(), seed = 1) {
  const c = { ...defaultConfig(), ...config }, first = chain[0], last = chain.at(-1);
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
export function geometry(map, config = defaultConfig(), seed = 1) {
  const c = { ...defaultConfig(), ...config }, topo = topology(map);
  // An area is the union of its tiles' own diamonds (in ground space a square turned 45°, half-diagonal 32), grown by
  // the expansion and rounded: flat trodden ground follows the worn tiles instead of a cluster of equal circles.
  // Tiles overlap by more than the rounding radius, so rounded corners never open holes where four tiles meet.
  const round = 8 + c.areaSmoothness * 22, half = 30 + round * 0.9 + c.areaExpansion * 16;
  const areaCentres = topo.areas.map(n => ({ ...ground(n), level: n.level, half, round, r: half, group: 'area' }));
  const lines = topo.chains.map(ch => centerline(ch, c, seed));
  // Path-to-area blend: a path widens towards the area it enters over the blend distance (no circle on a line).
  const blend = c.blendDistance * STEP;
  if (blend > 0 && areaCentres.length) for (const line of lines) for (const p of line) {
    let d = Infinity, r = 0; for (const a of areaCentres) { const dd = Math.hypot(a.x - p.x, a.y - p.y) - a.r; if (dd < d) { d = dd; r = a.r; } }
    if (d < blend) p.width = p.width + (Math.max(p.width, r * 1.1) - p.width) * fade(1 - Math.max(0, d) / blend) * 0.85;
  }
  const segments = [];
  lines.forEach((line, group) => { for (let i = 0; i < line.length - 1; i++) segments.push({ a: line[i], b: line[i + 1], group }); });
  const discs = topo.isolated.map((n, i) => ({ ...ground(n), level: n.level, r: widthFor(n.level, c) * 0.9, group: `disc${i}` }));
  return { topo, lines, segments, discs, tiles: areaCentres, config: c, seed };
}

// Signed distance (ground px) and blended wear level at a ground point; negative inside the surface.
// Within one shape (a chain's capsules, all area tiles) the union is exact (min), so densely sampled lines do not
// swell; different shapes meet with a smooth minimum, which makes a path flow into an area or another path.
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k / 4; };
export function fieldAt(geo, x, y, candidates = null) {
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
  return { distance: distance + edge, level: levelSum / weightSum };
}

// Spatial buckets so a pixel only looks at nearby shapes.
export function buckets(geo, cell = 96) {
  const grid = new Map(), add = (gx, gy, list, item) => { const k2 = `${gx},${gy}`; if (!grid.has(k2)) grid.set(k2, { segments: [], discs: [], tiles: [] }); grid.get(k2)[list].push(item); };
  const reach = 40 + geo.config.areaSmoothness * 30;
  for (const s of geo.segments) { const r = Math.max(s.a.width, s.b.width) / 2 + reach; for (let gx = Math.floor((Math.min(s.a.x, s.b.x) - r) / cell); gx <= Math.floor((Math.max(s.a.x, s.b.x) + r) / cell); gx++) for (let gy = Math.floor((Math.min(s.a.y, s.b.y) - r) / cell); gy <= Math.floor((Math.max(s.a.y, s.b.y) + r) / cell); gy++) add(gx, gy, 'segments', s); }
  for (const t of geo.tiles) { const r = t.half + reach; for (let gx = Math.floor((t.x - r) / cell); gx <= Math.floor((t.x + r) / cell); gx++) for (let gy = Math.floor((t.y - r) / cell); gy <= Math.floor((t.y + r) / cell); gy++) add(gx, gy, 'tiles', t); }
  for (const d of geo.discs) { const r = d.r + reach; for (let gx = Math.floor((d.x - r) / cell); gx <= Math.floor((d.x + r) / cell); gx++) for (let gy = Math.floor((d.y - r) / cell); gy <= Math.floor((d.y + r) / cell); gy++) add(gx, gy, 'discs', d); }
  return { cell, at: (x, y) => grid.get(`${Math.floor(x / cell)},${Math.floor(y / cell)}`) ?? null };
}

// --- painting (browser) --------------------------------------------------------------------------------------------
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const WINTER = [0, 1.9, 1.3, 1];

export function createV2Renderer(map, { earth = [], config = defaultConfig(), seed = 1, registry } = {}) {
  const visuals = [1, 2, 3].map(l => registry.require(['grass_normal', 'grass_trampled_1', 'grass_trampled_2', 'grass_trampled_3'][l]).visual);
  const geo = geometry(map, config, seed), index = buckets(geo);
  return {
    geometry: geo,
    debugGeometry: () => ({ lines: geo.lines, discs: geo.discs, tiles: geo.tiles }),
    // One pass over the whole scene (the lab draws V2 once, not per tile). resolution: ground px per sample.
    drawScene(context, bounds, veil = 0, resolution = 2) {
      const w = Math.ceil(bounds.width / resolution), h = Math.ceil(bounds.height / resolution), core = new ImageData(w, h), halo = new ImageData(w, h);
      const c = geo.config, soft = 0.6 + c.edgeSoftness * 4, haloWidth = 2 + c.edgeSoftness * 4;
      const colours = visuals.map(v => hex(v.pathColor)), edges = visuals.map(v => hex(v.pathEdge)), snow = [232, 237, 220];
      for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
        const sx = bounds.left + (px + 0.5) * resolution, sy = bounds.top + (py + 0.5) * resolution, gx = sx, gy = sy * 2;
        const near = index.at(gx, gy); if (!near) continue;
        const { distance, level } = fieldAt(geo, gx, gy, near); if (distance > haloWidth + soft) continue;
        const l = Math.max(1, Math.min(3, level)), i = Math.floor(l) - 1, f = l - Math.floor(l), j = Math.min(2, i + 1);
        const mix = (list, ch) => list[i][ch] + (list[j][ch] - list[i][ch]) * f, snowAmount = Math.min(0.85, veil * WINTER[Math.round(l)]);
        const tone = (list, ch) => mix(list, ch) + (snow[ch] - mix(list, ch)) * snowAmount;
        // Lightly worn ground keeps more grass showing through; a well-worn track is solid.
        const density = 0.8 + (l - 1) * 0.1, o = (py * w + px) * 4;
        const a = (1 - smoothstep(-soft, soft, distance)) * density;
        if (a > 0) { core.data[o] = tone(colours, 0); core.data[o + 1] = tone(colours, 1); core.data[o + 2] = tone(colours, 2); core.data[o + 3] = Math.round(a * 255); }
        const e = (1 - smoothstep(0, haloWidth, distance)) * 0.35 * density;
        if (e > 0) { halo.data[o] = tone(edges, 0); halo.data[o + 1] = tone(edges, 1); halo.data[o + 2] = tone(edges, 2); halo.data[o + 3] = Math.round(e * 255); }
      }
      const layer = (image, texture) => {
        const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; const ctx = canvas.getContext('2d'); ctx.putImageData(image, 0, 0);
        // The approved Earth track texture over the core, clipped to it, so the soil keeps the approved grain.
        // Only the soil centre of the approved tile (as N12 crops it), never its grass rim, or the tiles show as a grid.
        if (texture) { const scale = texture.width / 64, crop = document.createElement('canvas'); crop.width = 24; crop.height = 10; crop.getContext('2d').drawImage(texture, 20 * scale, 11 * scale, 24 * scale, 10 * scale, 0, 0, 24, 10); texture = crop; }
        if (texture) { const pattern = ctx.createPattern(texture, 'repeat'); pattern?.setTransform?.(new DOMMatrix().scale(1 / resolution)); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.5 * (1 - veil); ctx.fillStyle = pattern; ctx.fillRect(0, 0, w, h); }
        context.save(); context.imageSmoothingEnabled = true; context.drawImage(canvas, 0, 0, w * resolution, h * resolution); context.restore();
      };
      layer(halo, null); layer(core, earth[2] ?? earth[3] ?? null);
    },
  };
}
