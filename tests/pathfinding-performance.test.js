import test from 'node:test';
import assert from 'node:assert/strict';
import { findPathToAny,canStep,octileDistance } from '../src/game/pathfinding.js';
import { isWalkable } from '../src/game/map.js';

// performance-1: the faster A* must give exactly the routes of the previous implementation (kept here as the reference).
const DIRECTIONS = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [-1, -1], [1, -1]];
const EPSILON = 1e-9;
class MinHeap {
  constructor() { this.items = []; }
  before(a, b) { return a.estimate < b.estimate || (a.estimate === b.estimate && (a.heuristic < b.heuristic || (a.heuristic === b.heuristic && a.index < b.index))); }
  push(item) { const items = this.items; let index = items.length; items.push(item); while (index > 0) { const parent = Math.floor((index - 1) / 2); if (!this.before(item, items[parent])) break; items[index] = items[parent]; index = parent; } items[index] = item; }
  pop() { const items = this.items, first = items[0], last = items.pop(); if (!items.length) return first; let index = 0; while (index * 2 + 1 < items.length) { let child = index * 2 + 1; if (child + 1 < items.length && this.before(items[child + 1], items[child])) child++; if (!this.before(items[child], last)) break; items[index] = items[child]; index = child; } items[index] = last; return first; }
}
function referenceSearch(map, start, goals, {speedMultiplier=null,maxSpeed=1}={}) {
  if (!isWalkable(map, start.x, start.y)) return null;
  const width = map[0].length, length = width * map.length;
  const validGoals = goals.filter(p => isWalkable(map, p.x, p.y));
  if (!validGoals.length) return null;
  const targets = new Set(validGoals.map(p => p.y * width + p.x));
  const maximum=Number.isFinite(maxSpeed)&&maxSpeed>=1?maxSpeed:1;
  const speed=point=>{const value=speedMultiplier?.(point)??1;return Number.isFinite(value)&&value>0?Math.min(maximum,value):1;};
  const heuristic = point => {
    let best = Infinity;
    for (const goal of validGoals) best = Math.min(best, octileDistance(point, goal));
    return best/maximum;
  };
  const costs = new Float64Array(length).fill(Infinity);
  const parents = new Int32Array(length).fill(-1);
  const closed = new Uint8Array(length);
  const open = new MinHeap();
  const first = start.y * width + start.x, initialHeuristic = heuristic(start);
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
    for (const [dx, dy] of DIRECTIONS) {
      const to = { x: x + dx, y: y + dy };
      if (!canStep(map, { x, y }, to)) continue;
      const next = to.y * width + to.x;
      // Center-to-center motion spends half the step in each tile, matching
      // advanceMovement's real boundary-based speed changes.
      const cost = costs[index] + (dx && dy ? Math.SQRT2 : 1)*.5*(1/speed({x,y})+1/speed(to));
      if (closed[next] || cost + EPSILON >= costs[next]) continue;
      costs[next] = cost; parents[next] = index;
      const h = heuristic(to);
      open.push({ index: next, cost, estimate: cost + h, heuristic: h });
    }
  }
  return null;
}


function rng(seed){let s=seed>>>0;return()=>((s=Math.imul(s,1664525)+1013904223>>>0)/2**32);}
test('findPathToAny returns exactly the reference routes, costs and failures on random maps with speeds and several goals',()=>{
  let compared=0,failed=0;
  for(let seed=1;seed<=160;seed++){
    const r=rng(seed),w=12+Math.floor(r()*30),h=12+Math.floor(r()*30),block=r()*.45,map=Array.from({length:h},()=>Array.from({length:w},()=>r()<block?1:0));
    const speed=new Float64Array(w*h).map(()=>[1,1,1,1.25,1.5,2,.6,0,NaN][Math.floor(r()*9)]);
    for(let k=0;k<6;k++){
      const start={x:Math.floor(r()*w),y:Math.floor(r()*h)},goals=Array.from({length:1+Math.floor(r()*9)},()=>({x:Math.floor(r()*w),y:Math.floor(r()*h)}));
      const options=k%3===0?undefined:{speedMultiplier:t=>speed[t.y*w+t.x],maxSpeed:k%3===1?2:1.5};
      const expected=referenceSearch(map,start,goals,options),actual=findPathToAny(map,start,goals,options);
      assert.deepEqual(actual,expected,`seed ${seed} search ${k}`);compared++;if(!expected)failed++;
    }
  }
  assert.ok(compared===960&&failed>50&&failed<900,`both found and failed searches are covered (${failed} failed)`);
});

test('reachableCount equals reachableTiles(...).length on random maps and origin sets',async()=>{
  const { reachableTiles,reachableCount }=await import('../src/game/pathfinding.js');
  for(let seed=1;seed<=120;seed++){const r=rng(seed*7),w=5+Math.floor(r()*40),h=5+Math.floor(r()*40),map=Array.from({length:h},()=>Array.from({length:w},()=>r()<r()*.6?1:0));
    const origins=Array.from({length:Math.floor(r()*4)},()=>({x:Math.floor(r()*w),y:Math.floor(r()*h)}));
    assert.equal(reachableCount(map,origins),reachableTiles(map,origins).length,`seed ${seed}`);}
});
