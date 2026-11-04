// Ground recipe (2D): seamless 64 × 32 grass tiles and worn-path stages.
// Unlike the 3D recipes it paints straight onto a canvas, because ground is a
// flat texture the game stamps tile by tile (src/game/TerrainRenderer.js).
//
// Output per variant:
//   sheet  one row of game tiles. Grass: `tiles` interchangeable variants.
//          Path: wear levels 0–3 (0 = this grass, 1–3 = trampled stages).
//   canvas a preview patch the size of the footprint, anchored at its centre.
// The base colour field is periodic noise shared by every tile of a variant,
// so tiles join without seams in any combination; per-tile detail fades out
// towards the edges.
import { TILE_W, TILE_H, WEAR_STAGES, pixelToTile, tileToPixel, edgeDistance, smoothstep, hexToRgb, mixRgb, resolveColour, periodicFbm, periodicNoise, tileRandom, validateSurfaceSpec } from '../lib/surface.js';

export const params = [
  { key: 'mode', values: ['grass', 'path'], description: 'Grass tiles, or the three trampled stages of a path over that grass.' },
  { key: 'base', description: 'Main grass colour (#rrggbb or palette name).' },
  { key: 'shades', description: 'Colours the patchy noise blends between, dark to light.' },
  { key: 'patchiness', description: 'Contrast of the large colour patches, 0–1.' },
  { key: 'blades.density', description: 'Grass blades per tile (0–120).' },
  { key: 'blades.height', unit: 'px', description: '[min, max] blade height at 1×.' },
  { key: 'blades.colours', description: 'Blade colours; mixed per blade.' },
  { key: 'blades.tufts', description: 'Blades per clump (1–4).' },
  { key: 'flowers', description: '{ density, colours } small flowers or clover per tile.' },
  { key: 'tiles', description: 'Number of interchangeable grass tiles (1–8).' },
  { key: 'ground', description: 'Path mode: the grass spec the path is trampled into.' },
  { key: 'stages', description: 'Path mode: wear levels 1–3 { colour, edge, coverage, blades, width, softness }.' },
  { key: 'preview', description: 'Path mode: wear levels along the preview strip (0–3), e.g. a path that fades back into grass.' },
  { key: 'seed', description: 'Integer seed; change it for a different but equivalent layout.' },
];

const rgb = (style, value) => hexToRgb(resolveColour(style, value));
const css = c => `rgb(${c.map(n => Math.round(n)).join(',')})`;

function diamond(ctx, x, y, s) {
  ctx.beginPath();
  ctx.moveTo(x + TILE_W / 2 * s, y); ctx.lineTo(x + TILE_W * s, y + TILE_H / 2 * s);
  ctx.lineTo(x + TILE_W / 2 * s, y + TILE_H * s); ctx.lineTo(x, y + TILE_H / 2 * s); ctx.closePath();
}

// Colour field of one tile at scale s, with an optional worn patch.
function paintField(ctx, s, grass, style, index, seed, stage) {
  const width = TILE_W * s, height = TILE_H * s, image = ctx.createImageData(width, height), data = image.data;
  const shades = grass.shades.map(c => rgb(style, c)), base = rgb(style, grass.base), contrast = 0.6 + (grass.patchiness ?? 0.5) * 1.4;
  const soil = stage ? rgb(style, stage.colour) : null, edge = stage ? rgb(style, stage.edge) : null;
  const mask = new Float32Array(width * height);
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) {
    const { u, v } = pixelToTile((px + 0.5) / s, (py + 0.5) / s), i = py * width + px;
    if (u < -0.04 || u > 1.04 || v < -0.04 || v > 1.04) continue; // 1 px bleed: no seams where tiles meet; the game clips to the diamond
    let t = 0.5 + (periodicFbm(seed, u, v, 3, 2) - 0.5) * contrast;
    t += (periodicFbm(seed + 31 + index * 977, u, v, 2, 4) - 0.5) * 0.45 * smoothstep(0.03, 0.22, edgeDistance(u, v));
    t = Math.min(1, Math.max(0, t)) * (shades.length - 1);
    const k = Math.min(shades.length - 2, Math.floor(t));
    let colour = mixRgb(mixRgb(shades[k], shades[k + 1], t - k), base, 0.35);
    if (stage) {
      const du = u - 0.5, dv = v - 0.5, r = Math.hypot(du, dv) * 2 + (periodicNoise(seed + 7 + index * 13, 5, u, v) - 0.5) * 0.3;
      const m = 1 - smoothstep(stage.coverage - 0.22, stage.coverage + 0.04, r);
      mask[i] = m;
      const ring = Math.min(1, m * (1 - m) * 4);
      colour = mixRgb(mixRgb(colour, edge, Math.min(1, m * 1.4) * 0.7), soil, m * m);
      colour = mixRgb(colour, edge, ring * 0.25);
    }
    const grain = (periodicNoise(seed + 977, 16, u, v) - 0.5) * 14 + (((px * 73856093) ^ (py * 19349663)) % 7 - 3);
    data[i * 4] = colour[0] + grain; data[i * 4 + 1] = colour[1] + grain; data[i * 4 + 2] = colour[2] + grain * 0.7; data[i * 4 + 3] = 255;
  }
  ctx.putImageData(image, 0, 0);
  return mask;
}

function paintBlades(ctx, s, grass, style, index, seed, stage, mask) {
  const blades = grass.blades ?? {}, rand = tileRandom(seed * 31 + index * 7919 + (stage ? 101 : 0));
  const colours = blades.colours.map(c => rgb(style, c)), [h0, h1] = blades.height, tufts = Math.max(1, Math.min(4, blades.tufts ?? 2));
  const width = TILE_W * s, list = [];
  const clumps = Math.round((blades.density ?? 0) / tufts);
  for (let c = 0; c < clumps; c++) {
    const u = 0.05 + rand() * 0.9, v = 0.05 + rand() * 0.9, root = tileToPixel(u, v);
    if (edgeDistance(u, v) < 0.04) continue;
    const worn = stage ? mask[Math.min(mask.length - 1, Math.floor(root.y * s) * width + Math.floor(root.x * s))] : 0;
    if (stage && rand() < worn * (1 - stage.blades)) continue;
    const shorter = stage ? 1 - worn * 0.6 : 1;
    for (let b = 0; b < tufts; b++) list.push({ x: root.x + (rand() - 0.5) * 2.2, y: root.y + (rand() - 0.5) * 1.2, h: (h0 + rand() * (h1 - h0)) * shorter, lean: (rand() - 0.5) * 3.2, colour: colours[Math.floor(rand() * colours.length)], shade: rand() });
  }
  list.sort((a, b) => a.y - b.y);
  ctx.save(); diamond(ctx, 0, 0, s); ctx.clip(); ctx.lineCap = 'round';
  for (const blade of list) {
    const colour = mixRgb(blade.colour, [24, 34, 18], 0.18 - blade.shade * 0.18);
    ctx.strokeStyle = css(colour); ctx.lineWidth = Math.max(0.75, 0.85 * s);
    ctx.beginPath(); ctx.moveTo(blade.x * s, blade.y * s);
    ctx.quadraticCurveTo((blade.x + blade.lean * 0.3) * s, (blade.y - blade.h * 0.6) * s, (blade.x + blade.lean) * s, (blade.y - blade.h) * s);
    ctx.stroke();
  }
  const flowers = grass.flowers, frand = tileRandom(seed * 17 + index * 131);
  for (let f = 0; f < Math.round(flowers?.density ?? 0); f++) {
    const u = 0.1 + frand() * 0.8, v = 0.1 + frand() * 0.8, p = tileToPixel(u, v);
    const worn = stage ? mask[Math.floor(p.y * s) * width + Math.floor(p.x * s)] : 0;
    if (worn > 0.2) continue;
    ctx.fillStyle = css(rgb(style, flowers.colours[Math.floor(frand() * flowers.colours.length)]));
    ctx.beginPath(); ctx.arc(p.x * s, (p.y - 1.5) * s, Math.max(0.7, 0.95 * s), 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function tileCanvas(s) {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_W * s; canvas.height = TILE_H * s;
  return canvas;
}
function paintTile(s, grass, style, index, seed, stage = null) {
  const canvas = tileCanvas(s), ctx = canvas.getContext('2d', { willReadFrequently: true });
  const mask = paintField(ctx, s, grass, style, index, seed, stage);
  paintBlades(ctx, s, grass, style, index, seed, stage, mask);
  return canvas;
}

// The connection strip the game draws from a worn tile towards a worn
// neighbour (TerrainRenderer.drawConnections), plus an optional soft feather.
export function drawConnection(ctx, centre, [dx, dy], stage, s) {
  ctx.save();
  ctx.translate(centre.x, centre.y);
  ctx.beginPath(); ctx.moveTo(-32 * s, 0); ctx.lineTo(0, -16 * s); ctx.lineTo(32 * s, 0); ctx.lineTo(0, 16 * s); ctx.closePath(); ctx.clip();
  ctx.scale(1, 0.5); ctx.lineCap = 'round';
  const end = { x: (dx - dy) * 16 * s, y: (dx + dy) * 16 * s };
  const line = () => { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(end.x, end.y); ctx.stroke(); };
  for (let i = stage.softness ?? 0; i > 0; i--) { ctx.strokeStyle = stage.edge; ctx.globalAlpha = 0.16; ctx.lineWidth = (stage.width + 3 + i * 3) * s; line(); }
  ctx.strokeStyle = stage.edge; ctx.lineWidth = (stage.width + 3) * s; ctx.globalAlpha = 0.6; line();
  ctx.strokeStyle = stage.colour; ctx.lineWidth = stage.width * s; ctx.globalAlpha = 1; line();
  ctx.restore();
}

// Tile canvases (index = sheet frame) for a variant spec.
export function paintTiles(spec, { style, scale = 1 }) {
  const grass = spec.mode === 'grass' ? spec : spec.ground, seed = spec.seed ?? 1;
  if (spec.mode === 'grass') return Array.from({ length: grass.tiles ?? 4 }, (_, i) => paintTile(scale, grass, style, i, seed));
  const stages = resolveStages(spec, style);
  return [paintTile(scale, grass, style, 0, seed), ...stages.map((stage, i) => paintTile(scale, grass, style, i + 1, seed, stage))];
}
export const resolveStages = (spec, style) => spec.stages.map(stage => ({ ...stage, colour: resolveColour(style, stage.colour), edge: resolveColour(style, stage.edge) }));

// Which sheet frame sits on grid tile (gx, gy) of the preview patch.
export function previewFrame(spec, footprint, gx, gy) {
  if (spec.mode === 'grass') return { frame: Math.floor(periodicNoise(spec.seed ?? 1, 64, (gx + 0.5) / 64, (gy + 0.5) / 64) * (spec.tiles ?? 4)) % (spec.tiles ?? 4), level: 0 };
  const row = Math.floor(footprint.height / 2), ramp = spec.preview ?? [1, 2, 3, 3, 2, 1];
  const level = gy === row ? ramp[gx % ramp.length] ?? 0 : 0;
  return { frame: level, level };
}

export function paint(spec, { footprint, style, scale = 1 }) {
  const tiles = paintTiles(spec, { style, scale }), stages = spec.mode === 'path' ? resolveStages(spec, style) : [];
  const w = footprint.width, h = footprint.height;
  const canvas = document.createElement('canvas');
  canvas.width = (w + h) * TILE_W / 2 * scale; canvas.height = (w + h) * TILE_H / 2 * scale;
  const ctx = canvas.getContext('2d'), corner = (gx, gy) => ({ x: ((gx - gy) * TILE_W / 2 + h * TILE_W / 2) * scale, y: (gx + gy) * TILE_H / 2 * scale });
  const levels = [];
  for (let gy = 0; gy < h; gy++) for (let gx = 0; gx < w; gx++) {
    const { frame, level } = previewFrame(spec, footprint, gx, gy), p = corner(gx, gy);
    levels[gy * w + gx] = level;
    ctx.drawImage(tiles[frame], p.x - TILE_W / 2 * scale, p.y);
  }
  for (let gy = 0; gy < h; gy++) for (let gx = 0; gx < w; gx++) {
    const level = levels[gy * w + gx];
    if (!level) continue;
    const p = corner(gx, gy), centre = { x: p.x, y: p.y + TILE_H / 2 * scale };
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const other = gx + dx >= 0 && gx + dx < w && gy + dy >= 0 && gy + dy < h ? levels[(gy + dy) * w + gx + dx] : 0;
      if (other) drawConnection(ctx, centre, [dx, dy], { ...stages[level - 1], width: Math.min(stages[level - 1].width, stages[other - 1].width) }, scale);
    }
  }
  const sheet = document.createElement('canvas');
  sheet.width = tiles.length * TILE_W * scale; sheet.height = TILE_H * scale;
  tiles.forEach((tile, i) => sheet.getContext('2d').drawImage(tile, i * TILE_W * scale, 0));
  return { canvas, front: null, sheet, tiles, width: canvas.width, height: canvas.height, anchor: { x: (w + h) * TILE_W / 4 * scale, y: (w + h) * TILE_H / 4 * scale }, platform: null, lights: [], scale, footprint, modelHeight: 0, surface: true };
}

export function validate(spec, { style }) { return validateSurfaceSpec(spec, { style }); }

export default { id: 'ground', version: 1, label: 'Ground tiles (2D)', kind: 'surface', params, paint, validate, stages: WEAR_STAGES };
