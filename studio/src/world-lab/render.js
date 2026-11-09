// World Lab drawing: the top-down map (one pixel block per tile, minimap colours) and an isometric window with the
// game's own terrain tiles and decorations from public/assets (read only), tinted by grass zone like TerrainRenderer.
import { COLUMNS, ROWS, PLAYER_START, GROUND, tileColor, BUSH_COLOR, REED_COLOR } from './model.js';
import { GROUND_TERRAIN_IDS, BUSH_TYPES } from '../../../src/data/worldTerrain.js';
import { terrain as TERRAIN_DEFS } from '../../../src/data/objects/terrain.js';
import { decorations as DECORATION_DEFS } from '../../../src/data/objects/decorations.js';
import { paintContinuousGround, plantsFor, drawPlant, drawAtmosphere, seasonOf, yearOf, makeWaterField, waterObjectsFor, duckSites } from './ground.js';
import { HEIGHT_UNIT_PX, paintShading, liftGround, liftedScreen, paintUnbuildable, readabilityProps, paintPath, drawProp, topDownHeight } from './height.js';
import { heightAt, tileCorners } from '../../../src/game/terrainHeight.js';

const assetUrls = {
  ...import.meta.glob('../../../public/assets/{terrain,decorations}/**/*.{png,webp,svg}', { eager: true, query: '?url', import: 'default' }),
  // Readability props on slopes (terrain height): the house and two villagers.
  ...import.meta.glob(['../../../public/assets/buildings/house/house-timber.v3.png', '../../../public/assets/characters/villagers/villager-*.v1.facing-0.png'], { eager: true, query: '?url', import: 'default' }),
};
const urlFor = path => assetUrls[`../../../public${path}`] ?? null;
// Same washes as TerrainRenderer's ZONE_TINT (provisional until the zone textures of g-svet-textury are approved).
const ZONE_TINT = [[0, 0, 0, 0], [38, 104, 36, 0.2], [196, 168, 82, 0.26], [84, 62, 32, 0.2], [0, 0, 0, 0], [128, 128, 118, 0.2]];
const hash = (x, y, salt = 0) => { let h = (x * 374761393 + y * 668265263 + salt * 2246822519) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

const images = new Map();
function image(path) {
  if (!path) return null;
  if (!images.has(path)) {
    const url = urlFor(path), img = new Image();
    img.decoding = 'async';
    const entry = { img, ready: false, failed: !url };
    if (url) { img.onload = () => { entry.ready = true; onImage?.(); }; img.onerror = () => { entry.failed = true; }; img.src = url; }
    images.set(path, entry);
  }
  const entry = images.get(path);
  return entry.ready ? entry.img : null;
}
let onImage = null;
export const whenImagesLoad = callback => { onImage = callback; };

const terrainById = new Map(TERRAIN_DEFS.map(d => [d.id, d])), decorationById = new Map(DECORATION_DEFS.map(d => [d.id, d]));
const groundTiles = code => { const d = terrainById.get(GROUND_TERRAIN_IDS[code]); return d?.spriteVariants ?? (d?.sprite ? [d.sprite] : []); };
// Preload everything the isometric view can show so the first draw is complete.
export function preload() {
  for (let g = 0; g < GROUND_TERRAIN_IDS.length; g++) for (const path of groundTiles(g)) image(path);
  for (const id of ['rock_outcrop', ...BUSH_TYPES]) image(decorationById.get(id)?.sprite);
  for (const path of ['/assets/buildings/house/house-timber.v3.png', '/assets/characters/villagers/villager-male.v1.facing-0.png', '/assets/characters/villagers/villager-female.v1.facing-0.png']) image(path);
}
export function imagesPending() { return [...images.values()].some(e => !e.ready && !e.failed); }

// Top-down map: `scale` px per tile; optional overlays (forest / stone weights) and the visible iso window.
// Overlays 'height' (colours by height with hill shading) and 'slope' (red: steeper than BUILD_MAX_SLOPE) need `heights`.
export function drawTopDown(canvas, world, { scale = 4, overlay = 'none', focus = null, span = 0, heights = null } = {}) {
  canvas.width = COLUMNS * scale; canvas.height = ROWS * scale;
  const ctx = canvas.getContext('2d'), data = ctx.createImageData(COLUMNS, ROWS);
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLUMNS; x++) {
    let [r, g, b] = tileColor(world, x, y);
    const key = `${x},${y}`, i = y * COLUMNS + x;
    if (world.bushes.has(key)) [r, g, b] = BUSH_COLOR;
    else if (world.reeds.has(key)) [r, g, b] = REED_COLOR;
    const weight = overlay === 'forest' ? world.forestWeight?.[i] ?? 0 : overlay === 'stone' ? world.stoneWeight?.[i] ?? 0 : 0;
    if ((overlay === 'height' || overlay === 'slope') && heights) [r, g, b] = topDownHeight(world, heights, x, y, overlay, [r, g, b]);
    if (weight > 0) { const tint = overlay === 'forest' ? [24, 70, 20] : [70, 66, 60], a = Math.min(0.85, weight * 0.85); r = r * (1 - a) + tint[0] * a; g = g * (1 - a) + tint[1] * a; b = b * (1 - a) + tint[2] * a; }
    const o = i * 4; data.data[o] = r; data.data[o + 1] = g; data.data[o + 2] = b; data.data[o + 3] = 255;
  }
  const small = new OffscreenCanvas(COLUMNS, ROWS); small.getContext('2d').putImageData(data, 0, 0);
  ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, COLUMNS * scale, ROWS * scale);
  // The castle (start) and the iso window.
  ctx.fillStyle = '#b3261e'; ctx.fillRect((PLAYER_START.x - 1) * scale, (PLAYER_START.y - 1) * scale, 3 * scale, 3 * scale);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.strokeRect((PLAYER_START.x - 1) * scale + 0.5, (PLAYER_START.y - 1) * scale + 0.5, 3 * scale - 1, 3 * scale - 1);
  if (focus && span) { ctx.strokeStyle = 'rgb(255 255 255 / .9)'; ctx.lineWidth = 2; ctx.strokeRect((focus.x - span / 2) * scale, (focus.y - span / 2) * scale, span * scale, span * scale); }
}

// Isometric window of `span` × `span` tiles around `focus`, drawn at the game's 64 × 32 tile size.
// `height`: { map, on, props, unbuildable } (plan m-teren-vyska): with `on`, the ground is painted flat into an
// offscreen canvas, shaded, and lifted tile by tile (height.js); objects stand upright at their height.
export function drawIso(canvas, world, { focus, span = 28, ground = null, height = null }) {
  canvas._water = null; canvas._props = null;
  const W = 64, H = 32, x0 = Math.max(0, Math.min(COLUMNS - span, Math.round(focus.x - span / 2))), y0 = Math.max(0, Math.min(ROWS - span, Math.round(focus.y - span / 2)));
  const headroom = 72;
  canvas.width = span * W; canvas.height = span * H + headroom + 8;
  const out = canvas.getContext('2d'), map = height?.on && height.map ? height.map : null, flat = map ? new OffscreenCanvas(canvas.width, canvas.height) : null;
  let ctx = flat ? flat.getContext('2d') : out; ctx.imageSmoothingEnabled = false; out.imageSmoothingEnabled = false;
  out.fillStyle = '#1d2418'; out.fillRect(0, 0, canvas.width, canvas.height);
  if (flat) { ctx.fillStyle = '#1d2418'; ctx.fillRect(0, 0, canvas.width, canvas.height); }
  const flatToWorld = (px, py) => { const a = (px - canvas.width / 2) / (W / 2), b = (py - headroom) / (H / 2); return [x0 + (a + b) / 2, y0 + (b - a) / 2]; };
  const flatScreen = (fx, fy) => [(fx - x0 - (fy - y0)) * (W / 2) + canvas.width / 2, (fx - x0 + (fy - y0)) * (H / 2) + headroom];
  const at = (x, y) => ({ sx: (x - x0 - (y - y0)) * (W / 2) + canvas.width / 2, sy: (x - x0 + (y - y0)) * (H / 2) + headroom });
  const diamond = (sx, sy) => { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + W / 2, sy + H / 2); ctx.lineTo(sx, sy + H); ctx.lineTo(sx - W / 2, sy + H / 2); ctx.closePath(); };
  const objects = [];
  for (let sum = 0; sum <= 2 * (span - 1); sum++) for (let dx = 0; dx < span; dx++) {
    const dy = sum - dx; if (dy < 0 || dy >= span) continue;
    const x = x0 + dx, y = y0 + dy, g = world.ground[y][x], { sx, sy } = at(x, y), tiles = groundTiles(g), path = tiles[Math.floor(hash(x, y) * tiles.length)] ?? tiles[0], img = image(path);
    if (img) ctx.drawImage(img, sx - img.width / 2, sy + H / 2 - img.height / 2);
    else { const [r, gg, b] = tileColor(world, x, y); ctx.fillStyle = `rgb(${r} ${gg} ${b})`; diamond(sx, sy); ctx.fill(); }
    if (g === GROUND.GRASS) {
      let r = 0, gg = 0, b = 0, a = 0, n = 0;
      for (let oy = -1; oy <= 1; oy++) for (let ox = -1; ox <= 1; ox++) { const z = world.ground[y + oy]?.[x + ox] === GROUND.GRASS ? world.zones[y + oy][x + ox] : world.zones[y][x]; const t = ZONE_TINT[z] ?? ZONE_TINT[0]; r += t[0] * t[3]; gg += t[1] * t[3]; b += t[2] * t[3]; a += t[3]; n++; }
      if (a > 0) { ctx.fillStyle = `rgb(${Math.round(r / a)} ${Math.round(gg / a)} ${Math.round(b / a)} / ${(a / n).toFixed(3)})`; diamond(sx, sy); ctx.fill(); }
    }
    const key = `${x},${y}`;
    if (world.reeds.has(key)) objects.push({ kind: 'reeds', x, y, sx, sy });
    if (world.terrain[y][x] === 1) objects.push({ kind: 'rock_outcrop', x, y, sx, sy });
    else if (world.bushes.has(key)) objects.push({ kind: BUSH_TYPES[world.bushes.get(key)] ?? BUSH_TYPES[0], x, y, sx, sy });
  }
  if (ground?.mode === 'continuous') {
    // Land materials: grass zones 0–5, then beach, desert, mud bank, shore rocks; water (shallow, deep, ford) is not
    // painted and never blends, so river banks stay sharp.
    const LAND = { [GROUND.BEACH]: 6, [GROUND.DESERT]: 7, [GROUND.MUD]: 8, [GROUND.SHORE_ROCKS]: 9 };
    const isGrass = (x, y) => { const g = world.ground[y]?.[x]; return g === GROUND.GRASS || LAND[g] !== undefined; };
    const zoneAt = (x, y) => { const g = world.ground[y]?.[x]; return g === GROUND.GRASS ? world.zones[y]?.[x] ?? 0 : LAND[g] ?? 0; };
    const DEPTH = { [GROUND.FORD]: 0.15, [GROUND.SHALLOW]: 0.5, [GROUND.DEEP]: 1 };
    // Off the map, a position borrows the nearest tile on the map so the edge does not read as water or land.
    const cell = (x, y) => world.ground[Math.max(0, Math.min(world.ground.length - 1, y))]?.[Math.max(0, Math.min(world.ground[0].length - 1, x))];
    const depthAt = (x, y) => DEPTH[cell(x, y)] ?? -1, inWorld = (x, y) => world.ground[y]?.[x] !== undefined;
    const toWorld = (px, py) => { const a = (px - canvas.width / 2) / (W / 2), b = (py - headroom) / (H / 2); return [x0 + (a + b) / 2, y0 + (b - a) / 2]; };
    const field = makeWaterField({ x0, y0, span, depthAt, settings: ground.settings });
    const painted = paintContinuousGround(ctx, { width: canvas.width, height: canvas.height, toWorld, isGrass, zoneAt, depthAt, inWorld, field, settings: ground.settings });
    const screenOf = (fx, fy) => [(fx - x0 - (fy - y0)) * (W / 2) + canvas.width / 2, (fx - x0 + (fy - y0)) * (H / 2) + headroom];
    if (!world._ducks || world._ducks.count !== (ground.settings.duckFamilies ?? 3)) world._ducks = { count: ground.settings.duckFamilies ?? 3, sites: duckSites(world, ground.settings.duckFamilies ?? 3, (x, y) => { const g = world.ground[y]?.[x]; return g === GROUND.SHALLOW || g === GROUND.DEEP; }) };
    canvas._water = { mask: painted.mask, toWorld, toScreen: screenOf, field, flow: ground.settings.flow ?? 0, settings: ground.settings, ducks: world._ducks.sites };
    const screen = (fx, fy) => [(fx - x0 - (fy - y0)) * (W / 2) + canvas.width / 2, (fx - x0 + (fy - y0)) * (H / 2) + headroom];
    const season = seasonOf(ground.settings.year ?? yearOf(ground.settings.season));
    for (const p of waterObjectsFor({ x0, y0, span, field, depthAt, settings: ground.settings })) { const [sx, sy] = screen(p.fx, p.fy); if (p.flat) drawPlant(ctx, p, sx, sy, season); else objects.push({ kind: 'plant', plant: p, x: p.fx, y: p.fy, sx, sy }); }
    for (const p of plantsFor({ x0, y0, span, isGrass, zoneAt, depthAt, field, settings: ground.settings })) objects.push({ kind: 'plant', plant: p, x: p.fx, y: p.fy, sx: (p.fx - x0 - (p.fy - y0)) * (W / 2) + canvas.width / 2, sy: (p.fx - x0 + (p.fy - y0)) * (H / 2) + headroom });
  }
  // Terrain height: readability props, shading and unbuildable tiles on the flat ground, then lift it.
  if (map) {
    const props = height.props ? readabilityProps(world, map, { x0, y0, span }) : null;
    if (props) { paintPath(ctx, props.path, flatScreen); for (const item of props.items) objects.push({ kind: 'prop', item, x: item.sortX, y: item.sortY }); canvas._props = props; }
    if (height.unbuildable) paintUnbuildable(ctx, { world, map, x0, y0, span, at, W, H });
    paintShading(ctx, { width: canvas.width, height: canvas.height, toWorld: flatToWorld, map });
    const occlusion = canvas._water ? new OffscreenCanvas(canvas.width, canvas.height) : null;
    const buckets = new Map();
    for (const o of objects) { const k = Math.floor(o.x + o.y); if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(o); }
    const keys = [...buckets.keys()].sort((a, b) => a - b);
    let next = 0;
    liftGround(out, flat, { world, map, x0, y0, span, at, W, H, occlusion, drawObjects: upTo => { while (next < keys.length && keys[next] <= upTo) { for (const o of buckets.get(keys[next]).sort((a, b) => a.x + a.y - (b.x + b.y))) drawObject(o); next++; } } });
    while (next < keys.length) { for (const o of buckets.get(keys[next])) drawObject(o); next++; }
    // Streaks and fish only where the lifted land does not cover the water.
    if (occlusion && canvas._water) { const a = occlusion.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data, m = canvas._water.mask; for (let i = 0; i < m.length; i++) if (a[i * 4 + 3] > 127) m[i] = 0; }
    ctx = out;
  } else for (const o of objects.sort((a, b) => a.x + a.y - (b.x + b.y))) drawObject(o);
  function drawObject(o) {
    const lift = map ? heightAt(map, o.kind === 'plant' ? o.x : o.x + 0.5, o.kind === 'plant' ? o.y : o.y + 0.5) * HEIGHT_UNIT_PX : 0, target = map ? out : ctx;
    if (o.kind === 'prop') { drawProp(out, o.item, { map, screen: flatScreen, image, decoration: id => decorationById.get(id) }); return; }
    if (o.kind === 'plant') { drawPlant(target, o.plant, o.sx, o.sy - lift, seasonOf(ground.settings.year ?? yearOf(ground.settings.season))); return; }
    drawTileObject(target, o, lift);
  }
  function drawTileObject(ctx, o, lift) {
    o = { ...o, sy: o.sy - lift };
    if (o.kind === 'reeds') {
      ctx.strokeStyle = 'rgb(150 160 70)'; ctx.lineWidth = 1.5;
      for (let k = 0; k < 5; k++) { const px = o.sx - 14 + hash(o.x, o.y, k) * 28, py = o.sy + 10 + hash(o.x, o.y, k + 9) * 12; ctx.beginPath(); ctx.moveTo(px, py + 8); ctx.lineTo(px + (hash(o.x, o.y, k + 3) - 0.5) * 4, py - 6); ctx.stroke(); }
      return;
    }
    const def = decorationById.get(o.kind), img = image(def?.sprite);
    if (!img) return;
    const ox = def.origin?.x ?? 0.5, oy = def.origin?.y ?? 0.5;
    ctx.drawImage(img, o.sx - img.width * ox, o.sy + H / 2 - img.height * oy);
  }
  if (ground?.settings) drawAtmosphere(ctx, { width: canvas.width, height: canvas.height, time: ground.settings.time, weather: ground.settings.weather, seed: x0 * 31 + y0 });
  // The castle's tile, marked (buildings are not part of the generator).
  if (PLAYER_START.x >= x0 && PLAYER_START.x < x0 + span && PLAYER_START.y >= y0 && PLAYER_START.y < y0 + span) {
    const { sx, sy } = at(PLAYER_START.x, PLAYER_START.y), c = map ? tileCorners(map, PLAYER_START.x, PLAYER_START.y).map(v => v * HEIGHT_UNIT_PX) : [0, 0, 0, 0];
    ctx.strokeStyle = '#ffdf8a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx, sy - c[0]); ctx.lineTo(sx + W / 2, sy + H / 2 - c[1]); ctx.lineTo(sx, sy + H - c[2]); ctx.lineTo(sx - W / 2, sy + H / 2 - c[3]); ctx.closePath(); ctx.stroke();
    ctx.fillStyle = '#ffdf8a'; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Castle', sx, sy - 4 - c[0]);
  }
  // The villager behind a hill is labelled on top, so the owner can check that the hill hides it.
  if (map && canvas._props?.hidden) { const [hx, hy] = liftedScreen(flatScreen, map, canvas._props.hidden.x, canvas._props.hidden.y); ctx.save(); ctx.strokeStyle = '#ffdf8a'; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.arc(hx, hy - 14, 16, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.fillStyle = '#ffdf8a'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('behind the hill', hx, hy - 36); ctx.restore(); }
  return { x0, y0 };
}
