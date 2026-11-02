import { COLUMNS, ROWS, TILE_WIDTH, TILE_HEIGHT, MAP_HEADROOM } from './config.js';

export const ORIGIN = { x: ROWS * TILE_WIDTH / 2, y: MAP_HEADROOM };
export const WORLD_BOUNDS = {
  x: 0, y: 0,
  width: (COLUMNS + ROWS) * TILE_WIDTH / 2,
  height: (COLUMNS + ROWS) * TILE_HEIGHT / 2 + MAP_HEADROOM + 32,
};

// Vstup je logická poloha na mřížce; desetinné hodnoty umožňují plynulý pohyb.
export function gridToWorld(x, y) {
  return { x: ORIGIN.x + (x - y) * TILE_WIDTH / 2, y: ORIGIN.y + (x + y) * TILE_HEIGHT / 2 };
}

export function worldToGrid(x, y) {
  const horizontal = (x - ORIGIN.x) / (TILE_WIDTH / 2);
  const vertical = (y - ORIGIN.y) / (TILE_HEIGHT / 2);
  return { x: (vertical + horizontal) / 2, y: (vertical - horizontal) / 2 };
}

export function worldToTile(x, y) {
  const point = worldToGrid(x, y);
  return { x: Math.floor(point.x), y: Math.floor(point.y) };
}

export function tileCenter(tile) {
  return gridToWorld(tile.x + 0.5, tile.y + 0.5);
}

export function tilePolygon(tile) {
  return [gridToWorld(tile.x, tile.y), gridToWorld(tile.x + 1, tile.y),
    gridToWorld(tile.x + 1, tile.y + 1), gridToWorld(tile.x, tile.y + 1)];
}

export function clampMapCenter(x, y) {
  const point = worldToGrid(x, y);
  return gridToWorld(Math.max(0, Math.min(COLUMNS, point.x)), Math.max(0, Math.min(ROWS, point.y)));
}
