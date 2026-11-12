import { COLUMNS, ROWS, TILE_WIDTH, TILE_HEIGHT, MAP_HEADROOM } from './config.js';

export const ORIGIN = { x: ROWS * TILE_WIDTH / 2, y: MAP_HEADROOM };
export const WORLD_BOUNDS = {
  x: 0, y: 0,
  width: (COLUMNS + ROWS) * TILE_WIDTH / 2,
  height: (COLUMNS + ROWS) * TILE_HEIGHT / 2 + MAP_HEADROOM + 32,
};

// m-teren-vyska (part 2): the ground is lifted on screen by its height. `lift(x, y)` gives the lift in px at a map
// point (terrainRelief sets it for the running world; null = a flat world, as in every unit test). The projection used
// by everything standing on the map – gridToWorld, tileCenter, tilePolygon, worldToGrid, worldToTile – follows the
// lift; the *Flat versions are for what is painted into the flat ground picture before it is lifted (terrain chunks,
// paths, the minimap's view frame).
let lift = null;
export function setProjectionLift(fn) { lift = typeof fn === 'function' ? fn : null; }
export const projectionLift = (x, y) => lift ? lift(x, y) : 0;

// Vstup je logická poloha na mřížce; desetinné hodnoty umožňují plynulý pohyb.
export function gridToWorldFlat(x, y) {
  return { x: ORIGIN.x + (x - y) * TILE_WIDTH / 2, y: ORIGIN.y + (x + y) * TILE_HEIGHT / 2 };
}
export function gridToWorld(x, y) {
  const p = gridToWorldFlat(x, y); if (lift) p.y -= lift(x, y); return p;
}

export function worldToGridFlat(x, y) {
  const horizontal = (x - ORIGIN.x) / (TILE_WIDTH / 2);
  const vertical = (y - ORIGIN.y) / (TILE_HEIGHT / 2);
  return { x: (vertical + horizontal) / 2, y: (vertical - horizontal) / 2 };
}
// The map point drawn at a screen point: the flat answer, then corrected by the lift found there (the lift changes
// slowly from tile to tile, so a few rounds settle within a fraction of a pixel on any slope that faces the viewer).
export function worldToGrid(x, y) {
  let g = worldToGridFlat(x, y); if (!lift) return g;
  for (let i = 0; i < 5; i++) g = worldToGridFlat(x, y + lift(g.x, g.y));
  return g;
}

export function worldToTile(x, y) {
  const point = worldToGrid(x, y);
  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}

export function tileCenterFlat(tile) {
  return gridToWorldFlat(tile.x + 0.5, tile.y + 0.5);
}
export function tileCenter(tile) {
  return gridToWorld(tile.x + 0.5, tile.y + 0.5);
}

export function tilePolygon(tile) {
  return [gridToWorld(tile.x, tile.y), gridToWorld(tile.x + 1, tile.y),
    gridToWorld(tile.x + 1, tile.y + 1), gridToWorld(tile.x, tile.y + 1)];
}

export function clampMapCenter(x, y) {
  const point = worldToGridFlat(x, y);
  return gridToWorldFlat(Math.max(0, Math.min(COLUMNS, point.x)), Math.max(0, Math.min(ROWS, point.y)));
}
