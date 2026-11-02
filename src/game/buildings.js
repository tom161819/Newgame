import { isWalkable, TILE_SIZE } from './map.js';
import { findPath } from './pathfinding.js';
import { tileKey } from './stones.js';

export const TOWER_COST = 10;
export const TOWER_SIZE = 2;

export function towerTiles({ x, y }) {
  return [{ x, y }, { x: x + 1, y }, { x, y: y + 1 }, { x: x + 1, y: y + 1 }];
}

export function towerNeighbors(tower) {
  const { x, y } = tower;
  const neighbors = [];
  for (let i = 0; i < TOWER_SIZE; i++) {
    neighbors.push({ x: x + i, y: y + 2 }, { x: x - 1, y: y + i },
      { x: x + 2, y: y + i }, { x: x + i, y: y - 1 });
  }
  return neighbors;
}

export function towerBase(tower) {
  return { x: (tower.x + 1) * TILE_SIZE, y: (tower.y + 2) * TILE_SIZE - 4 };
}

export function towerTop(tower) {
  const base = towerBase(tower);
  return { x: base.x, y: base.y - 83 };
}

export function placementError(map, anchor, stones, reservedTiles = []) {
  const tiles = towerTiles(anchor);
  if (tiles.some(tile => !isWalkable(map, tile.x, tile.y))) {
    return 'Věž potřebuje 4 volná políčka uvnitř mapy, bez překážek a budov.';
  }
  if (tiles.some(tile => stones.has(tileKey(tile)))) return 'Na tomto místě leží kámen.';
  if (tiles.some(tile => reservedTiles.some(reserved => tileKey(tile) === tileKey(reserved)))) {
    return 'Tady stojí hráč nebo právě dokončuje krok.';
  }
  return null;
}

// Validace, platba a obsazení mapy proběhnou společně; neplatný pokus nic nezmění.
export function placeTower({ map, anchor, stones, reservedTiles, inventory, buildings }) {
  const error = placementError(map, anchor, stones, reservedTiles);
  if (error) return { error };
  if (!inventory.spend('stone', TOWER_COST)) return { error: 'Na věž potřebuješ 10 kamenů.' };
  const tower = { id: buildings.length + 1, type: 'tower', x: anchor.x, y: anchor.y, tiles: towerTiles(anchor) };
  for (const tile of tower.tiles) map[tile.y][tile.x] = 1;
  buildings.push(tower);
  return { tower };
}

// Zvolíme sousední políčko s nejkratší skutečně dostupnou cestou, ne vzdušnou vzdáleností.
export function approachTower(map, start, tower) {
  let best = null;
  for (const tile of towerNeighbors(tower)) {
    const path = findPath(map, start, tile);
    if (path !== null && (!best || path.length < best.path.length)) best = { path, destination: tile };
  }
  return best;
}

export function planGroundOrder(map, start, order) {
  if (order.kind === 'enter') return approachTower(map, start, order.tower);
  const path = findPath(map, start, order.goal);
  return path === null ? null : { path, destination: order.goal };
}

export function planTowerExit(map, tower, order) {
  let best = null;
  for (const exit of towerNeighbors(tower)) {
    if (!isWalkable(map, exit.x, exit.y)) continue;
    const route = planGroundOrder(map, exit, order);
    if (route && (!best || route.path.length < best.path.length)) best = { ...route, exit };
  }
  return best;
}
