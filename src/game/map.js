export const TILE_SIZE = 32;
export const COLUMNS = 20;
export const ROWS = 15;
// Prostor nad mapou pro střechy věží v nejsevernější řadě.
export const MAP_HEADROOM = 56;

// 0 = volné políčko, 1 = překážka. Souřadnice začínají vlevo nahoře.
export const grid = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
for (let y = 2; y <= 10; y++) {
  if (y !== 8) grid[y][6] = 1;
}
for (let x = 10; x <= 16; x++) grid[5][x] = 1;
for (let y = 8; y <= 12; y++) grid[y][13] = 1;
for (let x = 3; x <= 8; x++) grid[12][x] = 1;

export function isWalkable(map, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && map[y]?.[x] === 0;
}

export function tileCenter(tile) {
  return { x: tile.x * TILE_SIZE + TILE_SIZE / 2, y: tile.y * TILE_SIZE + TILE_SIZE / 2 };
}
