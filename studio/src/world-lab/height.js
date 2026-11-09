// Terrain height in the World Lab (plan m-teren-vyska, step 1). The flat ground (tiles or the continuous ground) is
// painted first, in world space, with a soft slope shading; every tile is then redrawn as a diamond whose corners are
// lifted by the height map, two affine triangles per tile, back to front. Neighbouring tiles share their corners, so
// the world-space texture stretches over slopes without seams, and hills in front cover what stands behind them.
import { BUILD_MAX_SLOPE, HEIGHT_UNIT_PX, HEIGHT_MAX, cornerShade, heightAt, tileCorners, tileSlope, tileHeight } from '../../../src/game/terrainHeight.js';
import { GROUND, isRiverGround } from '../../../src/data/worldTerrain.js';

export { BUILD_MAX_SLOPE, HEIGHT_UNIT_PX, HEIGHT_MAX };
const hash = (x, y, salt = 0) => { let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const shadeCache = new WeakMap();
const shadeOf = map => { if (!shadeCache.has(map)) shadeCache.set(map, cornerShade(map)); return shadeCache.get(map); };
function shadeAt(map, fx, fy) {
  const s = shadeOf(map), CW = map.width + 1, x = Math.max(0, Math.min(map.width, fx)), y = Math.max(0, Math.min(map.height, fy));
  const x0 = Math.min(map.width - 1, Math.floor(x)), y0 = Math.min(map.height - 1, Math.floor(y)), tx = x - x0, ty = y - y0, at = (i, j) => s[(y0 + j) * CW + x0 + i];
  return (at(0, 0) * (1 - tx) + at(1, 0) * tx) * (1 - ty) + (at(0, 1) * (1 - tx) + at(1, 1) * tx) * ty;
}

// Slope shading painted on the flat ground (quarter resolution, smoothed): light from the upper left, low contrast.
export function paintShading(ctx, { width, height, toWorld, map, strength = 1.6, max = 0.28 }) {
  const step = 4, w = Math.ceil(width / step), h = Math.ceil(height / step), img = new ImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const [fx, fy] = toWorld(i * step + step / 2, j * step + step / 2);
    if (fx < 0 || fy < 0 || fx > map.width || fy > map.height || heightAt(map, fx, fy) <= 0.001) continue; // water stays flat and unshaded
    const s = shadeAt(map, fx, fy), a = Math.min(max, Math.abs(s) * strength), o = (j * w + i) * 4;
    if (s > 0) { img.data[o] = 255; img.data[o + 1] = 246; img.data[o + 2] = 222; img.data[o + 3] = Math.round(a * 0.7 * 255); }
    else { img.data[o] = 18; img.data[o + 1] = 22; img.data[o + 2] = 30; img.data[o + 3] = Math.round(a * 255); }
  }
  const small = new OffscreenCanvas(w, h); small.getContext('2d').putImageData(img, 0, 0);
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(small, 0, 0, w * step, h * step); ctx.restore();
}

// Draws one flat-space triangle of `source` lifted by l0–l2 px into `out` (an affine map: x stays, y moves up).
function liftTriangle(out, source, p, l, occ = null, water = false) {
  const [[x0, y0], [x1, y1], [x2, y2]] = p, det = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
  if (!det) return;
  const a = ((l[1] - l[0]) * (y2 - y0) - (l[2] - l[0]) * (y1 - y0)) / det, b = ((x1 - x0) * (l[2] - l[0]) - (x2 - x0) * (l[1] - l[0])) / det, c = l[0] - a * x0 - b * y0;
  if (1 - b < 0.05) return; // a face turned away from the viewer (hidden behind its own hill)
  const d = p.map(([x, y], i) => [x, y - l[i]]), cx = (d[0][0] + d[1][0] + d[2][0]) / 3, cy = (d[0][1] + d[1][1] + d[2][1]) / 3;
  const grow = ([x, y]) => { const dx = x - cx, dy = y - cy, n = Math.hypot(dx, dy) || 1; return [x + dx / n * 0.75, y + dy / n * 0.75]; };
  const e = d.map(grow);
  out.save(); out.beginPath(); out.moveTo(...e[0]); out.lineTo(...e[1]); out.lineTo(...e[2]); out.closePath(); out.clip();
  out.setTransform(1, -a, 0, 1 - b, 0, -c);
  const bx = Math.max(0, Math.floor(Math.min(x0, x1, x2)) - 2), by = Math.max(0, Math.floor(Math.min(y0, y1, y2)) - 2), bw = Math.min(source.width - bx, Math.ceil(Math.max(x0, x1, x2)) + 2 - bx), bh = Math.min(source.height - by, Math.ceil(Math.max(y0, y1, y2)) + 2 - by);
  if (bw > 0 && bh > 0) out.drawImage(source, bx, by, bw, bh, bx, by, bw, bh);
  out.restore();
  if (occ) { occ.globalCompositeOperation = water ? 'destination-out' : 'source-over'; occ.beginPath(); occ.moveTo(...e[0]); occ.lineTo(...e[1]); occ.lineTo(...e[2]); occ.closePath(); occ.fill(); }
}

// Lifts the flat ground of the window into `out`, back to front; `drawObjects(sum)` is called after the tiles of
// diagonal row sum + 1 (one row late, so a sprite is not cut by the flat ground just in front of its feet).
export function liftGround(out, flat, { world, map, x0, y0, span, at, W, H, occlusion = null, drawObjects }) {
  const U = HEIGHT_UNIT_PX, occ = occlusion?.getContext('2d') ?? null;
  if (occ) { occ.clearRect(0, 0, occlusion.width, occlusion.height); occ.fillStyle = '#000'; }
  for (let sum = 0; sum <= 2 * (span - 1); sum++) {
    for (let dx = 0; dx < span; dx++) {
      const dy = sum - dx; if (dy < 0 || dy >= span) continue;
      const x = x0 + dx, y = y0 + dy, { sx, sy } = at(x, y), c = tileCorners(map, x, y).map(v => v * U), water = isRiverGround(world.ground[y][x]);
      const N = [sx, sy], E = [sx + W / 2, sy + H / 2], S = [sx, sy + H], Wp = [sx - W / 2, sy + H / 2];
      liftTriangle(out, flat, [N, E, Wp], [c[0], c[1], c[3]], occ, water);
      liftTriangle(out, flat, [Wp, E, S], [c[3], c[1], c[2]], occ, water);
    }
    drawObjects?.(sum - 1);
  }
  drawObjects?.(2 * span);
}

// Screen position of a map point with its height.
export const liftedScreen = (screen, map, fx, fy) => { const [sx, sy] = screen(fx, fy); return [sx, sy - heightAt(map, fx, fy) * HEIGHT_UNIT_PX]; };

// Unbuildable tiles (slope > BUILD_MAX_SLOPE) tinted on the flat ground before lifting.
export function paintUnbuildable(ctx, { world, map, x0, y0, span, at, W, H }) {
  ctx.save(); ctx.fillStyle = 'rgb(205 52 36 / .3)'; ctx.strokeStyle = 'rgb(205 52 36 / .55)'; ctx.lineWidth = 1;
  for (let y = y0; y < y0 + span; y++) for (let x = x0; x < x0 + span; x++) {
    if (isRiverGround(world.ground[y][x]) || tileSlope(map, x, y) <= BUILD_MAX_SLOPE) continue;
    const { sx, sy } = at(x, y); ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + W / 2, sy + H / 2); ctx.lineTo(sx, sy + H); ctx.lineTo(sx - W / 2, sy + H / 2); ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}

// Readability props for checking the look on slopes: a house on a gentle slope (on a plinth), a path across the slope,
// villagers, trees and rocks standing upright, and a villager behind a hill (should be hidden).
export function readabilityProps(world, map, { x0, y0, span }) {
  const land = (x, y) => world.ground[y]?.[x] !== undefined && !isRiverGround(world.ground[y][x]) && world.terrain[y][x] === 0;
  const cells = [];
  for (let y = y0 + 2; y < y0 + span - 2; y++) for (let x = x0 + 2; x < x0 + span - 2; x++) if (land(x, y)) cells.push({ x, y, slope: tileSlope(map, x, y), h: tileHeight(map, x, y) });
  if (!cells.length) return { items: [], path: [] };
  const cx = x0 + span / 2, cy = y0 + span / 2, used = new Set(), mark = (x, y, r = 1) => { for (let j = -r; j <= r; j++) for (let i = -r; i <= r; i++) used.add(`${x + i},${y + j}`); };
  const free = c => !used.has(`${c.x},${c.y}`), items = [];
  // House: the 2 × 2 buildable footprint with the most slope (still ≤ BUILD_MAX_SLOPE), nearest to the centre.
  let house = null, best = -Infinity;
  for (const c of cells) {
    const foot = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([i, j]) => ({ x: c.x + i, y: c.y + j }));
    if (!foot.every(t => land(t.x, t.y) && tileSlope(map, t.x, t.y) <= BUILD_MAX_SLOPE)) continue;
    const corners = []; for (let j = 0; j <= 2; j++) for (let i = 0; i <= 2; i++) corners.push(map.corners[(c.y + j) * (map.width + 1) + c.x + i]);
    const drop = Math.max(...corners) - Math.min(...corners), score = Math.min(drop, 2) * 3 - Math.hypot(c.x - cx, c.y - cy) * 0.2;
    if (score > best) { best = score; house = { kind: 'house', x: c.x, y: c.y, top: Math.max(...corners), sortX: c.x + 1, sortY: c.y + 1 }; }
  }
  if (house) { items.push(house); mark(house.x, house.y, 2); mark(house.x + 1, house.y + 1, 2); }
  // A path across the slope through the centre (painted on the ground, so it follows the terrain).
  const path = [];
  for (let t = -9; t <= 9; t += 0.25) { const fx = cx + t, fy = cy + 3 + Math.sin(t / 3) * 1.4, tx = Math.floor(fx), ty = Math.floor(fy); if (world.ground[ty]?.[tx] !== undefined && (land(tx, ty) || world.ground[ty][tx] === GROUND.FORD)) path.push([fx, fy]); }
  // Villagers on a spread of slopes, trees and rocks at hashed spots.
  const bySlope = cells.filter(free).sort((a, b) => a.slope - b.slope);
  for (let k = 0; k < 6 && bySlope.length; k++) { const c = bySlope[Math.min(bySlope.length - 1, Math.floor((k + 0.5) / 6 * bySlope.length))]; if (!free(c)) continue; items.push({ kind: 'villager', x: c.x + 0.5, y: c.y + 0.5, female: k % 2 === 1, sortX: c.x, sortY: c.y }); mark(c.x, c.y); }
  const spots = cells.filter(free).sort((a, b) => hash(a.x, a.y, 7) - hash(b.x, b.y, 7));
  for (const c of spots.slice(0, 10)) { if (!free(c)) continue; items.push({ kind: 'tree', x: c.x + 0.3 + hash(c.x, c.y, 3) * 0.4, y: c.y + 0.3 + hash(c.x, c.y, 4) * 0.4, size: 0.8 + hash(c.x, c.y, 5) * 0.5, sortX: c.x, sortY: c.y }); mark(c.x, c.y); }
  for (const c of spots.slice(10, 14)) { if (!free(c)) continue; items.push({ kind: 'rock', x: c.x + 0.5, y: c.y + 0.5, sortX: c.x, sortY: c.y }); mark(c.x, c.y); }
  // Behind a hill: the free land tile with the highest ground 2–6 rows in front of it (at least 1.5 units higher; a
  // villager is about 7 units tall, so a high hill hides it whole and a low one hides its legs).
  let hidden = null, rise = 1.5;
  for (const c of cells) { if (!free(c)) continue; for (let k = 2; k <= 6; k++) { const fx = c.x + k, fy = c.y + k; if (fx >= x0 + span || fy >= y0 + span) break; const d = tileHeight(map, fx, fy) - c.h; if (d > rise) { rise = d; hidden = { kind: 'villager', hidden: true, x: c.x + 0.5, y: c.y + 0.5, sortX: c.x, sortY: c.y, rise: d }; } } }
  if (hidden) items.push(hidden);
  return { items, path, hidden };
}

export function paintPath(ctx, path, screen) {
  ctx.save(); ctx.fillStyle = 'rgb(128 100 66 / .78)';
  for (const [fx, fy] of path) { const [sx, sy] = screen(fx, fy); ctx.beginPath(); ctx.ellipse(sx, sy, 18, 9, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgb(160 132 92 / .55)';
  for (const [fx, fy] of path) { const [sx, sy] = screen(fx, fy); ctx.beginPath(); ctx.ellipse(sx, sy, 10, 5, 0, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}

// Draws one prop standing upright at its lifted position.
export function drawProp(ctx, item, { map, screen, image, decoration }) {
  if (item.kind === 'house') {
    // A stone plinth from the lowest corner up to the floor (the highest corner), then the house sprite.
    const U = HEIGHT_UNIT_PX, base = item.top * U, pt = (cx, cy) => { const [sx, sy] = screen(cx, cy); return [sx, sy - heightAt(map, cx, cy) * U, sy - base]; };
    const L = pt(item.x, item.y + 2), B = pt(item.x + 2, item.y + 2), R = pt(item.x + 2, item.y);
    ctx.save(); ctx.fillStyle = 'rgb(122 116 102)'; ctx.strokeStyle = 'rgb(70 66 58)'; ctx.lineWidth = 1;
    for (const [p, q, shade] of [[L, B, 'rgb(128 121 106)'], [B, R, 'rgb(104 98 86)']]) { ctx.fillStyle = shade; ctx.beginPath(); ctx.moveTo(p[0], p[2]); ctx.lineTo(q[0], q[2]); ctx.lineTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    ctx.restore();
    const img = image('/assets/buildings/house/house-timber.v3.png');
    if (img) ctx.drawImage(img, B[0] - img.width * 0.49618, B[2] - img.height * 0.98601);
    return;
  }
  const [sx, sy] = liftedScreen(screen, map, item.x, item.y);
  if (item.kind === 'villager') {
    const img = image(`/assets/characters/villagers/villager-${item.female ? 'female' : 'male'}.v1.facing-0.png`);
    ctx.fillStyle = 'rgb(20 24 16 / .3)'; ctx.beginPath(); ctx.ellipse(sx, sy, 9, 4, 0, 0, Math.PI * 2); ctx.fill();
    if (img) ctx.drawImage(img, sx - img.width / 2, sy - img.height * 0.94);
    else { ctx.fillStyle = item.hidden ? '#d23' : '#e8d8b0'; ctx.fillRect(sx - 3, sy - 26, 6, 26); }
    return;
  }
  if (item.kind === 'tree') {
    const k = item.size; ctx.fillStyle = 'rgb(20 24 16 / .3)'; ctx.beginPath(); ctx.ellipse(sx + 6 * k, sy, 20 * k, 8 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgb(86 62 40)'; ctx.fillRect(sx - 2.5 * k, sy - 26 * k, 5 * k, 26 * k);
    for (const [ox, oy, r, c] of [[0, -44, 20, 'rgb(52 82 40)'], [-9, -34, 14, 'rgb(46 74 36)'], [9, -36, 14, 'rgb(60 92 46)'], [-4, -52, 11, 'rgb(72 104 54)']]) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(sx + ox * k, sy + oy * k, r * k, 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  if (item.kind === 'rock') {
    const def = decoration('rock_outcrop'), img = image(def?.sprite);
    if (img) ctx.drawImage(img, sx - img.width * (def.origin?.x ?? 0.5), sy - img.height * (def.origin?.y ?? 0.5));
  }
}

// Top-down colours by height (water keeps its colour) with the same hill shading; `slope` marks unbuildable tiles.
const STOPS = [[0, [92, 138, 70]], [2, [134, 158, 84]], [4, [176, 164, 104]], [6, [150, 120, 88]], [8, [236, 230, 214]]];
export function heightColor(h) {
  for (let i = 1; i < STOPS.length; i++) if (h <= STOPS[i][0]) { const [a, ca] = STOPS[i - 1], [b, cb] = STOPS[i], t = (h - a) / (b - a); return ca.map((v, k) => v + (cb[k] - v) * t); }
  return STOPS.at(-1)[1];
}
export function topDownHeight(world, map, x, y, mode, base) {
  if (isRiverGround(world.ground[y][x])) return base;
  const s = shadeAt(map, x + 0.5, y + 0.5);
  if (mode === 'slope') { const sl = tileSlope(map, x, y); if (sl > BUILD_MAX_SLOPE) return [196, 60, 44]; const g = 210 - sl / BUILD_MAX_SLOPE * 90; return [g * 0.8, g, g * 0.72]; }
  const c = heightColor(tileHeight(map, x, y)), k = 1 + s * 1.4;
  return c.map(v => Math.max(0, Math.min(255, v * k)));
}
