import { isWalkable } from './map.js';

// BFS hledá nejkratší cestu ve čtyřech směrech; všechny kroky stojí stejně.
// Výsledek neobsahuje start. null znamená, že cesta neexistuje.
export function findPath(map, start, goal) {
  if (!isWalkable(map, start.x, start.y) || !isWalkable(map, goal.x, goal.y)) return null;
  const key = ({ x, y }) => `${x},${y}`;
  const queue = [start];
  const parents = new Map([[key(start), null]]);
  for (let head = 0; head < queue.length; head++) {
    const current = queue[head];
    if (current.x === goal.x && current.y === goal.y) {
      const path = [];
      let step = current;
      while (parents.get(key(step)) !== null) {
        path.push(step);
        step = parents.get(key(step));
      }
      return path.reverse();
    }
    for (const [dx, dy] of [[1, 0], [0, 1], [-1, 0], [0, -1]]) {
      const next = { x: current.x + dx, y: current.y + dy };
      if (!isWalkable(map, next.x, next.y) || parents.has(key(next))) continue;
      parents.set(key(next), current);
      queue.push(next);
    }
  }
  return null;
}
