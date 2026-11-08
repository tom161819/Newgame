import { COLUMNS, ROWS } from './config.js';
import { tileCenter, worldToGrid } from './isometric.js';
import { geometry, buckets, fieldAt } from './pathV2.js';
import { PATH_STYLE, PATH_STYLE_SEED } from '../data/pathStyle.js';

// #116 The V2 path surface inside the terrain chunks. One geometry is built for the whole map from the levels the
// renderer may show (live wear, or remembered wear under Fog of War) and rebuilt only when those levels change; the
// tiles it touches are then repainted. Each tile diamond is painted from that geometry exactly like the Path Lab paints
// its scene (same colours, coverage, halo, snow and Earth grain), and the result is cached per tile, so fog and season
// repaints only copy it. Level 1 is trampled grass (dark green, no soil); 2–4 are the soil levels.
const RESOLUTION = 2; // ground px per sample, as in the Path Lab
const MARGIN = 2; // tiles around a changed chain whose painting may change (meander, area blend, level field)
const REBUILD_MS = 500; // at most this often the shown levels are compared and the geometry rebuilt
const FRAME_BUDGET_MS = 3; // V2 tile renders per frame; the rest keep their previous look (or wait) until the next frame
const hex = c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
const smoothstep = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const WINTER = [0, 2.2, 1.9, 1.3, 1];
const GRASS_TRACK = { core: '#33561c', edge: '#466b28', density: 0.62 };
const DENSITY = [0, GRASS_TRACK.density, 0.8, 0.9, 1];
const SNOW = [232, 237, 220];
const BLEED = .8; // as the terrain tiles (TerrainRenderer TILE_BLEED)

export class PathV2Layer {
  constructor(renderer) {
    this.renderer = renderer; this.levels = new Uint8Array(COLUMNS * ROWS); this.geo = null; this.index = null; this.cache = new Map();
    this.sourceKey = null; this.lastScan = -Infinity; this.spent = 0; this.deferred = []; this.stats = { builds: 0, buildMs: 0, painted: 0, paintMs: 0, cached: 0 };
    const visuals = ['grass_trampled_1', 'grass_trampled_2', 'grass_trampled_3'].map(id => renderer.registry.require(id).visual);
    const looks = [{ pathColor: GRASS_TRACK.core, pathEdge: GRASS_TRACK.edge }, ...visuals];
    this.colours = looks.map(v => hex(v.pathColor)); this.edges = looks.map(v => hex(v.pathEdge));
  }
  // Once per frame: tiles deferred last frame are marked for repaint, and the budget starts again.
  frame() { this.spent = 0; if (this.deferred.length) { const tiles = this.deferred; this.deferred = []; this.renderer.invalidateArea(tiles, false); } }
  // Called before chunks are painted: rebuild the geometry when the shown levels changed, and mark what it touched.
  refresh() {
    const r = this.renderer, fogMode = !!(r.fog?.enabled && r.memory), key = `${fogMode}:${r.wear?.levelRevision ?? 0}:${fogMode ? r.memory.revision : 0}`;
    if (key === this.sourceKey && this.geo) return false;
    // Performance: while exploring, remembered levels change step by step; look and rebuild at most every REBUILD_MS.
    const now = performance.now(); if (this.geo && now - this.lastScan < REBUILD_MS) return false; this.lastScan = now; this.sourceKey = key;
    const next = new Uint8Array(COLUMNS * ROWS), changed = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLUMNS; x++) { const i = y * COLUMNS + x, level = r.pathLevel({ x, y }); next[i] = level; if (level !== this.levels[i]) changed.push({ x, y }); }
    if (this.geo && !changed.length) return false;
    const started = performance.now(), old = this.geo; this.levels = next;
    this.geo = geometry({ size: Math.max(COLUMNS, ROWS), get: (x, y) => x < 0 || y < 0 || x >= COLUMNS || y >= ROWS ? 0 : next[y * COLUMNS + x] }, PATH_STYLE, PATH_STYLE_SEED);
    // Performance: capsules every third centerline point (12 ground px instead of 4): the same curve within a fraction
    // of a pixel, half the capsules for every sample.
    const segments = [];this.geo.lines.forEach((line, group) => { for (let i = 0; i < line.length - 1; i += 3) segments.push({ a: line[i], b: line[Math.min(i + 3, line.length - 1)], group }); });this.geo.segments = segments;
    this.index = buckets(this.geo); this.stats.builds++; this.stats.buildMs = performance.now() - started;
    if (!old) { this.cache.clear(); r.pathChanged?.(null); return true; }
    // Every tile of a chain (old or new) that contains a changed tile, plus the changed tiles, plus a margin.
    const touched = new Set(changed.map(t => `${t.x},${t.y}`)), dirty = new Map(changed.map(t => [`${t.x},${t.y}`, t]));
    for (const geo of [old, this.geo]) for (const chain of geo.topo.chains) if (chain.some(n => touched.has(`${n.x},${n.y}`))) for (const n of chain) dirty.set(`${n.x},${n.y}`, { x: n.x, y: n.y });
    const tiles = [...dirty.values()];
    // Changed tiles keep their old picture as a stand-in until they are repainted (see the frame budget).
    for (const t of tiles) for (let dy = -MARGIN; dy <= MARGIN; dy++) for (let dx = -MARGIN; dx <= MARGIN; dx++) { const entry = this.cache.get((t.y + dy) * COLUMNS + t.x + dx); if (entry) entry.stale = true; }
    r.invalidateArea(tiles, true, MARGIN); r.pathChanged?.(tiles, MARGIN);
    return true;
  }
  near(x, y) { const c = tileCenter({ x, y }); for (const [dx, dy] of [[0, 0], [-32, 0], [32, 0], [0, -32], [0, 32]]) if (this.index.at(c.x + dx, c.y * 2 + dy)) return true; return false; }
  // The overlay of one tile at sample resolution (32 × 16 for the 64 × 32 tile rectangle), cached; null = nothing there.
  // Over this frame's budget a stale picture is kept (or nothing) and the tile is repainted on a later frame.
  tileOverlay(x, y, veil = 0) {
    if (!this.geo || x < 0 || y < 0 || x >= COLUMNS || y >= ROWS || !this.near(x, y)) return null;
    const id = y * COLUMNS + x, veilKey = Math.round(veil * 100);let entry = this.cache.get(id);
    if (entry && entry.veil === veilKey && !entry.stale) { this.stats.cached++; return entry.canvas; }
    if (this.spent >= FRAME_BUDGET_MS) { this.deferred.push({ x, y }); return entry?.canvas ?? null; }
    const started = performance.now(); entry = { veil: veilKey, canvas: this.render({ x, y }, veil) }; this.cache.set(id, entry);
    const ms = performance.now() - started; this.spent += ms; this.stats.painted++; this.stats.paintMs += ms; return entry.canvas;
  }
  // Paint the path surface of the given tiles into a chunk canvas whose top-left world point is (left, top).
  // The tile overlays own disjoint samples, so they are first laid side by side into one small image of the chunk (with
  // the tiles around it, so the edge blends on); that image is then scaled up once per Fog state, clipped to the union of
  // the tiles: no tile edge can show as a seam, and a translucent pixel is never drawn twice.
  drawChunk(context, cx, cy, left, top, tiles) {
    if (!this.geo || !tiles.length || typeof document === 'undefined') return;
    const small = this.scratch ??= document.createElement('canvas'); small.width = 640 / RESOLUTION; small.height = 320 / RESOLUTION;
    const s = small.getContext('2d'); s.clearRect(0, 0, small.width, small.height); let any = false;
    const veil = tiles[0].veil ?? 0;
    for (let y = cy * 10 - 1; y <= cy * 10 + 10; y++) for (let x = cx * 10 - 1; x <= cx * 10 + 10; x++) {
      const own = tiles.find(t => t.x === x && t.y === y), overlay = this.tileOverlay(x, y, own?.veil ?? veil);if (!overlay) continue;
      const c = tileCenter({ x, y });s.drawImage(overlay, (c.x - 32 - left) / RESOLUTION, (c.y - 16 - top) / RESOLUTION);any = true;
    }
    if (!any) return;
    const groups = new Map();for (const t of tiles) { if (!groups.has(t.filter)) groups.set(t.filter, []); groups.get(t.filter).push(t); }
    for (const [filter, list] of groups) {
      context.save();context.beginPath();
      for (const t of list) { const c = tileCenter(t), x = c.x - left, y = c.y - top, e = BLEED; context.moveTo(x - 32 - e, y); context.lineTo(x, y - 16 - e / 2); context.lineTo(x + 32 + e, y); context.lineTo(x, y + 16 + e / 2); context.closePath(); }
      context.clip();context.filter = filter ?? 'none';context.imageSmoothingEnabled = true;context.drawImage(small, 0, 0, 640, 320);context.restore();
    }
  }

  render(tile, veil) {
    if (typeof ImageData === 'undefined') return null;
    const centre = tileCenter(tile);
    const w = 64 / RESOLUTION, h = 32 / RESOLUTION, left = centre.x - 32, top = centre.y - 16, geo = this.geo, c = geo.config;
    const soft = 0.6 + c.edgeSoftness * 4, haloWidth = 2 + c.edgeSoftness * 4;
    // Scratch buffers are reused between tiles (only the finished tile canvas is new), to keep garbage low.
    this.buffers ??= [0, 1, 2].map(() => new ImageData(w, h));const [core, halo, soil] = this.buffers;for (const b of this.buffers) b.data.fill(0);
    // Performance: the full field is computed on a coarse grid (every BLOCK samples); a block wholly outside the
    // surface is skipped, a block wholly inside takes its level from the grid (the level field is smooth), and only
    // blocks on an edge are sampled at every point, exactly as in the lab.
    const BLOCK = 4, gw = Math.ceil(w / BLOCK) + 1, gh = Math.ceil(h / BLOCK) + 1, grid = new Array(gw * gh), reach = (BLOCK * RESOLUTION) * 1.5 + 4;
    const sample = (sx, sy, cutoff = Infinity) => { const near = this.index.at(sx, sy * 2); return near ? fieldAt(geo, sx, sy * 2, near, cutoff) : null; };
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) grid[gy * gw + gx] = sample(left + gx * BLOCK * RESOLUTION, top + gy * BLOCK * RESOLUTION);
    let any = false;
    const put = (px, py, distance, level) => {
      const l = Math.max(1, Math.min(4, level)), i = Math.floor(l) - 1, f = l - Math.floor(l), j = Math.min(3, i + 1);
      const mix = (list, ch) => list[i][ch] + (list[j][ch] - list[i][ch]) * f, between = list => list[i + 1] + (list[Math.min(4, i + 2)] - list[i + 1]) * f;
      const snowAmount = Math.min(0.85, veil * between(WINTER)), tone = (list, ch) => mix(list, ch) + (SNOW[ch] - mix(list, ch)) * snowAmount;
      const density = between(DENSITY), o = (py * w + px) * 4, a = (1 - smoothstep(-soft, soft, distance)) * density;
      if (a > 0) { any = true; core.data[o] = tone(this.colours, 0); core.data[o + 1] = tone(this.colours, 1); core.data[o + 2] = tone(this.colours, 2); core.data[o + 3] = Math.round(a * 255); soil.data[o + 3] = Math.round(a * smoothstep(1, 2, l) * 255); }
      const e = (1 - smoothstep(0, haloWidth, distance)) * 0.35 * density;
      if (e > 0) { any = true; halo.data[o] = tone(this.edges, 0); halo.data[o + 1] = tone(this.edges, 1); halo.data[o + 2] = tone(this.edges, 2); halo.data[o + 3] = Math.round(e * 255); }
    };
    for (let by = 0; by < gh - 1; by++) for (let bx = 0; bx < gw - 1; bx++) {
      const corners = [grid[by * gw + bx], grid[by * gw + bx + 1], grid[(by + 1) * gw + bx], grid[(by + 1) * gw + bx + 1]];
      const distances = corners.map(f => f?.distance ?? Infinity);
      if (distances.every(d => d > haloWidth + soft + reach)) continue;
      const inside = distances.every(d => d < -soft - reach);
      for (let py = by * BLOCK; py < Math.min(h, (by + 1) * BLOCK); py++) for (let px = bx * BLOCK; px < Math.min(w, (bx + 1) * BLOCK); px++) {
        const sx = left + (px + 0.5) * RESOLUTION, sy = top + (py + 0.5) * RESOLUTION;
        // Each sample belongs to exactly one tile (the one under its centre), so neighbouring overlays never overlap.
        const g = worldToGrid(sx, sy); if (Math.floor(g.x) !== tile.x || Math.floor(g.y) !== tile.y) continue;
        if (inside) {
          const u = (px + 0.5) / BLOCK - bx, v = (py + 0.5) / BLOCK - by, lv = (corners[0].level * (1 - u) + corners[1].level * u) * (1 - v) + (corners[2].level * (1 - u) + corners[3].level * u) * v;
          put(px, py, -soft - reach, lv); continue;
        }
        const field = sample(sx, sy, haloWidth + soft); if (!field || field.distance > haloWidth + soft) continue;
        put(px, py, field.distance, field.level);
      }
    }
    if (!any || typeof document === 'undefined') return null;
    const out = document.createElement('canvas'); out.width = w; out.height = h; const context = out.getContext('2d');
    this.scratchCanvases ??= [0, 1, 2, 3].map(() => { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; return canvas; });
    let next = 0;const toCanvas = image => { const canvas = this.scratchCanvases[next++]; const ctx = canvas.getContext('2d'); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.clearRect(0, 0, w, h); ctx.putImageData(image, 0, 0); return canvas; };
    const layer = (image, mask) => {
      const canvas = toCanvas(image), ctx = canvas.getContext('2d'), texture = mask ? this.grainTexture() : null;
      if (texture) {
        // The soil centre of the approved Earth tile, repeated in world space so the grain runs on across tiles.
        const grain = this.scratchCanvases[3], g = grain.getContext('2d'); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); const pattern = g.createPattern(texture, 'repeat');
        pattern?.setTransform?.(new DOMMatrix().scale(1 / RESOLUTION).translate(-left, -top)); g.fillStyle = pattern; g.fillRect(0, 0, w, h);
        g.globalCompositeOperation = 'destination-in'; g.drawImage(toCanvas(mask), 0, 0);
        ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.5 * (1 - veil); ctx.drawImage(grain, 0, 0);
      }
      context.drawImage(canvas, 0, 0);
    };
    layer(halo, null); layer(core, soil);
    return out;
  }
  grainTexture() {
    if (this.grain !== undefined) return this.grain;
    const r = this.renderer, key = r.assets?.hasTexture('grass_trampled_2') ? r.assets.key('grass_trampled_2') : null;
    if (!key || !r.scene.textures.exists?.(key)) return null;
    const image = r.scene.textures.get(key).getSourceImage(), scale = image.width / 64, crop = document.createElement('canvas'); crop.width = 24; crop.height = 10;
    crop.getContext('2d').drawImage(image, 20 * scale, 11 * scale, 24 * scale, 10 * scale, 0, 0, 24, 10); this.grain = crop; return crop;
  }
  invalidate() { this.cache.clear(); this.sourceKey = null; }
}
