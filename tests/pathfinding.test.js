import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, reachableTiles } from '../src/game/pathfinding.js';
import { grid, COLUMNS, ROWS, PLAYER_START, isWalkable } from '../src/game/map.js';

test('BFS najde nejkratší obchůzku překážky', () => {
  const map = [[0, 1, 0], [0, 1, 0], [0, 0, 0]];
  const path = findPath(map, { x: 0, y: 0 }, { x: 2, y: 0 });
  assert.equal(path.length, 6);
  assert.deepEqual(path.at(-1), { x: 2, y: 0 });
});

test('neprůchozí, nedosažitelný cíl a hranice mapy', () => {
  const map = [[0, 1, 0]];
  for (const goal of [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }]) {
    assert.equal(findPath(map, { x: 0, y: 0 }, goal), null);
  }
  assert.deepEqual(findPath(map, { x: 0, y: 0 }, { x: 0, y: 0 }), []);
});

test('mapa má 100 × 100 políček a BFS vede platné cesty přes celou mapu', () => {
  assert.equal(grid.length, ROWS);
  assert.ok(grid.every(row => row.length === COLUMNS));
  assert.equal(COLUMNS * ROWS, 10000);
  const start = PLAYER_START;
  const reachable = reachableTiles(grid, [start]);
  assert.equal(reachable.length, grid.flat().filter(value => value === 0).length);
  for (const { x, y } of reachable.filter((_, i) => i % 251 === 0)) {
      const path = findPath(grid, start, { x, y });
      assert.notEqual(path, null);
      let previous = start;
      for (const step of path) {
        assert.ok(isWalkable(grid, step.x, step.y));
        assert.equal(Math.abs(step.x - previous.x) + Math.abs(step.y - previous.y), 1);
        previous = step;
      }
      assert.deepEqual(previous, { x, y });
  }
});
