import { isWalkable } from './map.js';
import { profileHooks } from '../systems/FrameProfiler.js';
import { currentRelief, RELIEF_RULES } from './terrainRelief.js';

const DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
const EPSILON = 1e-9;

// Diagonála je bezpečná jen se dvěma volnými bočními políčky.
export function canStep(map, from, to) {
  if (!isWalkable(map, from.x, from.y) || !isWalkable(map, to.x, to.y)) return false;
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dx) > 1 || Math.abs(dy) > 1 || (!dx && !dy)) return false;
  return !dx || !dy || (isWalkable(map, from.x + dx, from.y) && isWalkable(map, from.x, from.y + dy));
}

// Přípustný odhad délky při cenách 1 za přímý krok a √2 za diagonálu.
export function octileDistance(a, b) {
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y);
  return Math.max(dx, dy) + (Math.SQRT2 - 1) * Math.min(dx, dy);
}

class MinHeap {
  constructor() { this.items = []; }

  before(a, b) {
    return a.estimate < b.estimate || (a.estimate === b.estimate
      && (a.heuristic < b.heuristic || (a.heuristic === b.heuristic && a.index < b.index)));
  }

  push(item) {
    const items = this.items;
    let index = items.length;
    items.push(item);
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (!this.before(item, items[parent])) break;
      items[index] = items[parent]; index = parent;
    }
    items[index] = item;
  }

  pop() {
    const items = this.items, first = items[0], last = items.pop();
    if (!items.length) return first;
    let index = 0;
    while (index * 2 + 1 < items.length) {
      let child = index * 2 + 1;
      if (child + 1 < items.length && this.before(items[child + 1], items[child])) child++;
      if (!this.before(items[child], last)) break;
      items[index] = items[child]; index = child;
    }
    items[index] = last;
    return first;
  }
}

// A* pro celou mapu i několik možných vstupů/výstupů věže.
// Souřadnice a ceny jsou logické; kamera a izometrická projekce je neovlivňují.
// performance-1: the developer profiler times A* here (one boolean check when it is off).
export function findPathToAny(...args) { return profileHooks.on ? profileHooks.run('pathfinding', searchPathToAny, args) : searchPathToAny(...args); }
// performance-1: a goal shut in a small pocket (a porch seat behind standing residents) used to make A* walk the whole
// map before failing, every simulation step. Steps are symmetric (canStep), so when a short flood from the goals ends
// without reaching the start, no route exists: the answer is the same null, found in a few dozen tiles.
const POCKET_LIMIT = 64;
function goalsEnclosed(map, width, length, targets, first) {
  const seen = new Uint8Array(length), queue = new Int32Array(POCKET_LIMIT + 8);let head = 0, tail = 0;
  for (const index of targets) { if (index === first) return false; seen[index] = 1; if (tail >= POCKET_LIMIT) return false; queue[tail++] = index; }
  while (head < tail) {
    const index = queue[head++], x = index % width, y = Math.floor(index / width), row = map[y];
    for (let d = 0; d < 8; d++) {
      const dx = DIRECTIONS[d][0], dy = DIRECTIONS[d][1], tx = x + dx, ty = y + dy, toRow = map[ty];
      if (!toRow || toRow[tx] !== 0) continue;
      if (dx && dy && (row[tx] !== 0 || toRow[x] !== 0)) continue;
      const next = ty * width + tx;if (seen[next]) continue;
      if (next === first) return false;
      if (tail >= POCKET_LIMIT) return false;
      seen[next] = 1; queue[tail++] = next;
    }
  }
  return true;
}
function searchPathToAny(map, start, goals, {speedMultiplier=null,maxSpeed=1}={}) {
  if (!isWalkable(map, start.x, start.y)) return null;
  const width = map[0].length, length = width * map.length;
  const validGoals = goals.filter(p => isWalkable(map, p.x, p.y));
  if (!validGoals.length) return null;
  const targets = new Set(validGoals.map(p => p.y * width + p.x));
  if (goalsEnclosed(map, width, length, targets, start.y * width + start.x)) return null;
  const maximum=Number.isFinite(maxSpeed)&&maxSpeed>=1?maxSpeed:1;
  // performance-1: the same search with fewer allocations – each tile's speed is asked once per search (it does not
  // change during one), neighbours are tested on the map rows directly (canStep's rule), the octile estimate inline.
  // Costs, estimates and the heap order are computed exactly as before, so every route is the same.
  const speeds = speedMultiplier ? new Float64Array(length).fill(-1) : null;
  const speedAt=(x,y,index)=>{if(!speeds)return 1;let value=speeds[index];if(value<0){const raw=speedMultiplier({x,y})??1;value=speeds[index]=Number.isFinite(raw)&&raw>0?Math.min(maximum,raw):1;}return value;};
  const goalCount=validGoals.length,goalX=validGoals.map(g=>g.x),goalY=validGoals.map(g=>g.y),SLOPE=Math.SQRT2 - 1;
  const heuristicAt = (x,y) => {
    let best = Infinity;
    for (let g=0;g<goalCount;g++) {const dx = Math.abs(x - goalX[g]), dy = Math.abs(y - goalY[g]);best = Math.min(best, Math.max(dx, dy) + SLOPE * Math.min(dx, dy));}
    return best/maximum;
  };
  // m-teren-vyska: a step uphill takes longer (the same rule advanceMovement walks by), downhill costs nothing extra,
  // so routes go round a steep hill when that is quicker. Costs only grow: the estimate stays admissible.
  const relief = currentRelief(), heights = relief && relief.tiles.length === length ? relief.tiles : null, CLIMB = RELIEF_RULES.climbSlowdown, CLIMB_MAX = 1 / RELIEF_RULES.climbMinFactor - 1;
  const costs = new Float64Array(length).fill(Infinity);
  const parents = new Int32Array(length).fill(-1);
  const closed = new Uint8Array(length);
  const open = new MinHeap();
  const first = start.y * width + start.x, initialHeuristic = heuristicAt(start.x,start.y);
  costs[first] = 0; parents[first] = first;
  open.push({ index: first, cost: 0, estimate: initialHeuristic, heuristic: initialHeuristic });
  while (open.items.length) {
    const current = open.pop(), index = current.index;
    if (closed[index] || current.cost > costs[index] + EPSILON) continue;
    const x = index % width, y = Math.floor(index / width);
    if (targets.has(index)) {
      const path = [];
      for (let step = index; step !== first; step = parents[step]) {
        path.push({ x: step % width, y: Math.floor(step / width) });
      }
      return { path: path.reverse(), destination: { x, y }, cost: costs[index] };
    }
    closed[index] = 1;
    const row = map[y], here = speedAt(x,y,index);
    for (let d = 0; d < 8; d++) {
      const dx = DIRECTIONS[d][0], dy = DIRECTIONS[d][1], tx = x + dx, ty = y + dy, toRow = map[ty];
      if (!toRow || toRow[tx] !== 0 || !Number.isInteger(tx)) continue;
      if (dx && dy && (row[tx] !== 0 || toRow[x] !== 0)) continue;
      const next = ty * width + tx;
      // Center-to-center motion spends half the step in each tile, matching
      // advanceMovement's real boundary-based speed changes.
      const length1 = dx && dy ? Math.SQRT2 : 1, rise = heights ? heights[next] - heights[index] : 0;
      const cost = costs[index] + length1*.5*(1/here+1/speedAt(tx,ty,next)) * (rise > 0 ? 1 + Math.min(CLIMB_MAX, CLIMB * rise / length1) : 1);
      if (closed[next] || cost + EPSILON >= costs[next]) continue;
      costs[next] = cost; parents[next] = index;
      const h = heuristicAt(tx,ty);
      open.push({ index: next, cost, estimate: cost + h, heuristic: h });
    }
  }
  return null;
}

export function findPath(map, start, goal) {
  return findPathToAny(map, start, [goal])?.path ?? null;
}

// performance-1: reachableTiles(map, origins).length without building the tile list (same steps and corner rule).
export function reachableCount(map, origins) {
  const width = map[0]?.length ?? 0;
  const seen = new Uint8Array(width * map.length), queue = new Int32Array(seen.length);
  let head = 0, tail = 0;
  for (const p of origins) {
    const index = p.y * width + p.x;
    if (isWalkable(map, p.x, p.y) && !seen[index]) { seen[index] = 1; queue[tail++] = index; }
  }
  while (head < tail) {
    const index = queue[head++], x = index % width, y = Math.floor(index / width), row = map[y];
    for (let d = 0; d < 8; d++) {
      const dx = DIRECTIONS[d][0], dy = DIRECTIONS[d][1], tx = x + dx, ty = y + dy, toRow = map[ty];
      if (!toRow || toRow[tx] !== 0) continue;
      if (dx && dy && (row[tx] !== 0 || toRow[x] !== 0)) continue;
      const next = ty * width + tx;
      if (seen[next]) continue;
      seen[next] = 1; queue[tail++] = next;
    }
  }
  return tail;
}

// Dostupnost pro generátor kamenů používá stejných osm sousedů a pravidlo rohů.
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
      const to = { x: x + dx, y: y + dy };
      if (!canStep(map, { x, y }, to)) continue;
      const next = to.y * width + to.x;
      if (seen[next]) continue;
      seen[next] = 1; queue[tail++] = next;
    }
  }
  return tiles;
}

// m-velikost-mapy: a quick local check used while a world is filled with trees and deposits (two flood fills per
// candidate grew with the square of the map area). `mask` = reachableMask before the change. Blocking `tiles` loses
// exactly those tiles when they are all reachable, none is an origin and the open tiles around them stay connected
// to each other through that ring alone (any route through the block can then go round it). Returns true when that
// holds, false when a tile is not reachable (blocking it would lose nothing – the flood answer is "not -n"), and null
// when only a full flood can tell.
export function reachableMask(map, origins) {
  const width = map[0]?.length ?? 0, seen = new Uint8Array(width * map.length);
  for (const t of reachableTiles(map, origins)) seen[t.y * width + t.x] = 1;
  return seen;
}
export function blockKeepsReach(map, tiles, mask, origins = [], reach = 3) {
  const width = map[0]?.length ?? 0, own = new Set(tiles.map(t => t.y * width + t.x));
  for (const t of tiles) { if (map[t.y]?.[t.x] !== 0) return null; if (mask && !mask[t.y * width + t.x]) return false; }
  if (origins.some(o => own.has(o.y * width + o.x))) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const ring = new Set();
  for (const t of tiles) {
    x0 = Math.min(x0, t.x); y0 = Math.min(y0, t.y); x1 = Math.max(x1, t.x); y1 = Math.max(y1, t.y);
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const x = t.x + dx, y = t.y + dy, i = y * width + x;
      if (x >= 0 && y >= 0 && x < width && y < map.length && !own.has(i) && map[y][x] === 0) ring.add(i);
    }
  }
  if (!ring.size) return null;
  // The open tiles of a small window round the block (`reach` tiles beyond it) must join every open neighbour.
  x0 = Math.max(0, x0 - reach); y0 = Math.max(0, y0 - reach); x1 = Math.min(width - 1, x1 + reach); y1 = Math.min(map.length - 1, y1 + reach);
  const open = (x, y) => x >= x0 && y >= y0 && x <= x1 && y <= y1 && map[y][x] === 0 && !own.has(y * width + x);
  const [first] = ring, seen = new Set([first]), queue = [first];let found = 1;
  while (queue.length && found < ring.size) {
    const i = queue.pop(), px = i % width, py = (i - px) / width;
    for (const [dx, dy] of DIRECTIONS) {
      const x = px + dx, y = py + dy, j = y * width + x;
      if (seen.has(j) || !open(x, y)) continue;
      if (dx && dy && (!open(x, py) || !open(px, y))) continue;
      seen.add(j); queue.push(j); if (ring.has(j)) found++;
    }
  }
  return found === ring.size ? true : tiles.length === 1 && mask ? blockSplitsSearch(map, tiles[0], mask, origins) : null;
}

// The exact answer for one tile when the window cannot tell: a search from every reachable open neighbour, taken in
// turns, with searches joining where they meet. All of them joined = nothing is lost; one closing on its own without
// an origin = those tiles would be cut off. A search closing round an origin (rare) is left to the full flood (null).
// The small side of a cut closes quickly, so this is far cheaper than a flood of the map.
let scratch = null, scratchStamp = 0;
function blockSplitsSearch(map, tile, mask, origins) {
  const width = map[0]?.length ?? 0, size = width * map.length, centre = tile.y * width + tile.x;
  if (!scratch || scratch.owner.length !== size) { scratch = { owner: new Int32Array(size), stamp: new Uint32Array(size) }; scratchStamp = 0; }
  const stamp = ++scratchStamp, { owner } = scratch, marks = scratch.stamp, originSet = new Set(origins.map(o => o.y * width + o.x));
  const open = i => { const x = i % width, y = (i - x) / width; return i !== centre && map[y]?.[x] === 0; };
  const starts = [];
  for (const [dx, dy] of DIRECTIONS) { const x = tile.x + dx, y = tile.y + dy; if (x < 0 || y < 0 || x >= width || y >= map.length) continue; const i = y * width + x; if (map[y][x] === 0 && mask[i]) starts.push(i); }
  if (starts.length <= 1) return starts.length === 1 ? true : null;
  const parent = starts.map((_, k) => k), root = k => { while (parent[k] !== k) k = parent[k] = parent[parent[k]]; return k; };
  const queues = starts.map(i => [i]), heads = starts.map(() => 0), anchored = starts.map(() => false);
  starts.forEach((i, k) => { marks[i] = stamp; owner[i] = k; if (originSet.has(i)) anchored[k] = true; });
  let groups = starts.length;
  for (let guard = 0; guard < size * 2; guard++) {
    let progressed = false;
    for (let k = 0; k < starts.length; k++) {
      if (heads[k] >= queues[k].length) continue;
      progressed = true;
      const i = queues[k][heads[k]++], px = i % width, py = (i - px) / width;
      for (const [dx, dy] of DIRECTIONS) {
        const x = px + dx, y = py + dy;
        if (x < 0 || y < 0 || x >= width || y >= map.length) continue;
        const j = y * width + x;
        if (!open(j)) continue;
        if (dx && dy && (!open(y * width + px) || !open(py * width + x))) continue;
        if (marks[j] === stamp) { const a = root(k), b = root(owner[j]); if (a !== b) { parent[b] = a; anchored[a] = anchored[a] || anchored[b]; if (--groups === 1) return true; } continue; }
        marks[j] = stamp; owner[j] = k; queues[k].push(j); if (originSet.has(j)) anchored[root(k)] = true;
      }
      // A group whose searches all ran out is closed.
      if (heads[k] >= queues[k].length) {
        const r = root(k);
        if (!starts.some((_, m) => root(m) === r && heads[m] < queues[m].length)) return anchored[r] ? null : false;
      }
    }
    if (!progressed) break;
  }
  return null;
}
