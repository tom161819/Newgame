import { COLUMNS, ROWS, PLAYER_START } from './config.js';
export { COLUMNS, ROWS, MAP_HEADROOM, PLAYER_START, TILE_WIDTH, TILE_HEIGHT } from './config.js';
export { tileCenter } from './isometric.js';

// Logická mapa: 0 = volno, 1 = překážka. Neobsahuje obrazové souřadnice.
export function createMap(random=null) {
  const map = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
  for (let i = 0; i < 65; i++) {
    const x = 2 + (random?Math.floor(random()*94):(i * 37 + 11) % 94);
    const y = 2 + (random?Math.floor(random()*94):(i * 61 + 29) % 94);
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2 + i % 2; dx++) {
      if (Math.abs(x + dx - PLAYER_START.x) < 5 && Math.abs(y + dy - PLAYER_START.y) < 5) continue;
      map[y + dy][x + dx] = 1;
    }
  }
  // Několik původních zdí poblíž středu pro ukázku obcházení překážek.
  for (let y = 44; y <= 52; y++) if (y !== 50) map[y][46] = 1;
  for (let x = 52; x <= 58; x++) map[47][x] = 1;
  return map;
}

export function isWalkable(map, x, y) {
  return Number.isInteger(x) && Number.isInteger(y) && map[y]?.[x] === 0;
}
