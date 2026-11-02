import { isWalkable } from './map.js';

const DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1]];

// BFS na celé logické mapě. Číselné indexy omezují alokace i na 10 000 políčkách.
export function findPathToAny(map, start, goals) {
  if (!isWalkable(map, start.x, start.y)) return null;
  const width = map[0].length, length = width * map.length;
  const targets = new Set(goals.filter(p => isWalkable(map, p.x, p.y)).map(p => p.y * width + p.x));
  if (!targets.size) return null;
  const parents = new Int32Array(length).fill(-1);
  const queue = new Int32Array(length);
  const first = start.y * width + start.x;
  parents[first] = first; queue[0] = first;
  let head = 0, tail = 1;
  while (head < tail) {
    const index = queue[head++], x = index % width, y = Math.floor(index / width);
    if (targets.has(index)) {
      const path = [];
      for (let step = index; step !== first; step = parents[step]) path.push({ x: step % width, y: Math.floor(step / width) });
      return { path: path.reverse(), destination: { x, y } };
    }
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy, next = ny * width + nx;
      if (nx < 0 || nx >= width || ny < 0 || ny >= map.length || map[ny][nx] !== 0 || parents[next] !== -1) continue;
      parents[next] = index; queue[tail++] = next;
    }
  }
  return null;
}

export function findPath(map, start, goal) {
  return findPathToAny(map, start, [goal])?.path ?? null;
}

export function reachableTiles(map, origins) {
  const width = map[0]?.length ?? 0;
  const seen = new Uint8Array(width * map.length), queue = new Int32Array(seen.length);
  let head = 0, tail = 0;
  for (const p of origins) {
    const index = p.y * width + p.x;
    if (isWalkable(map, p.x, p.y) && !seen[index]) { seen[index] = 1; queue[tail++] = index; }
  }
  const tiles = [];
  while (head < tail) {
    const index = queue[head++], x = index % width, y = Math.floor(index / width);
    tiles.push({ x, y });
    for (const [dx, dy] of DIRECTIONS) {
      const nx = x + dx, ny = y + dy, next = ny * width + nx;
      if (nx < 0 || nx >= width || ny < 0 || ny >= map.length || map[ny][nx] !== 0 || seen[next]) continue;
      seen[next] = 1; queue[tail++] = next;
    }
  }
  return tiles;
}
