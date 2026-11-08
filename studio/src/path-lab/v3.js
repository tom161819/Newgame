// Path Lab V3 (owner 8 Nov 2026): paths on the continuous ground of the World Lab / game. The lab map is painted with
// the game's continuous ground engine and the path surface of src/render/pathSurface.js in one pass, on a chosen
// ground (meadow, dry grass, sand, mud, stony, mixed zones or a river bank), so what the owner tunes here is what the
// game paints. The path shape (meander, areas, widths) still comes from the V2 parameters.
import { geometry, buckets } from '../../../src/game/pathV2.js';
import { worldToGrid, gridToWorld } from '../../../src/game/isometric.js';
import { paintContinuousGround, plantsFor, waterObjectsFor, drawPlant, makeWaterField, seasonOf, GROUND_DEFAULTS } from '../../../src/render/continuousGround.js';
import { pathSurface } from '../../../src/render/pathSurface.js';
import groundStyle from '../../../src/data/groundStyle.json';
import { sceneBounds } from './scene.js';

export const SEASON_YEAR = { Winter: 0.02, Spring: 0.3, Summer: 0.5, Autumn: 0.76 };
// Ground under the lab map. zone numbers as continuousGround ZONE_NAMES (0 meadow … 5 stony, 6 beach, 7 desert, 8 mud).
export const GROUNDS = Object.freeze([
  { id: 'meadow', label: 'Meadow', zone: () => 0 },
  { id: 'lush', label: 'Lush', zone: () => 1 },
  { id: 'dry', label: 'Dry grass', zone: () => 2 },
  { id: 'flowers', label: 'Flowers', zone: () => 4 },
  { id: 'stony', label: 'Stony', zone: () => 5 },
  { id: 'sand', label: 'Sand', zone: () => 6 },
  { id: 'mud', label: 'Mud', zone: () => 8 },
  { id: 'mixed', label: 'Mixed zones', zone: (x, y) => [0, 1, 2, 4, 5, 3][(Math.floor(x / 6) * 3 + Math.floor(y / 6) * 5) % 6] },
  { id: 'river', label: 'River bank', zone: (x, y, size) => (x + y > size * 1.35 ? 6 : (x + y > size * 1.2 ? 8 : 0)), water: (x, y, size) => x + y > size * 1.55 ? (x + y > size * 1.7 ? 1 : 0.5) : -1 },
]);

export function renderSceneV3(canvas, { map, season = 'Summer', ground = 'meadow', config, seed = 1, surface = {}, groundSettings = groundStyle.settings, step = 4 }) {
  const bounds = sceneBounds(map.size), size = map.size, kind = GROUNDS.find(g => g.id === ground) ?? GROUNDS[0];
  canvas.width = Math.ceil(bounds.width); canvas.height = Math.ceil(bounds.height);
  const ctx = canvas.getContext('2d'); ctx.clearRect(0, 0, canvas.width, canvas.height);
  const geo = geometry(map, config, seed), index = buckets(geo), surf = pathSurface(geo, index, surface);
  const settings = { ...GROUND_DEFAULTS, ...groundSettings, year: SEASON_YEAR[season] ?? 0.5 };
  const depthAt = (x, y) => kind.water?.(x, y, size) ?? -1, isGrass = (x, y) => depthAt(x, y) < 0, zoneAt = (x, y) => kind.zone(x, y, size);
  const inWorld = (x, y) => x >= 0 && y >= 0 && x < size && y < size, toWorld = (px, py) => { const g = worldToGrid(px + bounds.left, py + bounds.top); return [g.x, g.y]; };
  const field = makeWaterField({ x0: 0, y0: 0, span: size, depthAt, settings });
  const started = performance.now();
  paintContinuousGround(ctx, { width: canvas.width, height: canvas.height, toWorld, isGrass, zoneAt, depthAt, inWorld, field, settings, step, surface: surf });
  const screen = (fx, fy) => { const p = gridToWorld(fx, fy); return [p.x - bounds.left, p.y - bounds.top]; }, name = seasonOf(settings.year);
  for (const p of waterObjectsFor({ x0: 0, y0: 0, span: size, field, depthAt, settings })) if (inWorld(Math.floor(p.fx), Math.floor(p.fy))) drawPlant(ctx, p, ...screen(p.fx, p.fy), name);
  const plants = plantsFor({ x0: 0, y0: 0, span: size, isGrass, zoneAt, depthAt, field, settings }).filter(p => inWorld(Math.floor(p.fx), Math.floor(p.fy)) && surf.plantKeep(p.fx, p.fy)).sort((a, b) => a.fx + a.fy - b.fx - b.fy);
  for (const p of plants) drawPlant(ctx, p, ...screen(p.fx, p.fy), name);
  return { bounds, paths: { debugGeometry: () => ({ lines: geo.lines, discs: geo.discs, tiles: geo.tiles }) }, ms: performance.now() - started };
}
