import test from 'node:test';
import assert from 'node:assert/strict';
import { grid, isWalkable } from '../src/game/map.js';
import { generateStones, STONE_COUNT, tileKey } from '../src/game/stones.js';
import { Inventory } from '../src/game/inventory.js';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('náhodná rozmístění mají vždy 15 různých kamenů mimo překážky a start', () => {
  const start = { x: 2, y: 2 };
  const originalMap = structuredClone(grid);
  const layouts = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const stones = generateStones(grid, start, STONE_COUNT, seededRandom(seed));
    assert.equal(stones.length, 15);
    assert.equal(new Set(stones.map(tileKey)).size, 15);
    for (const tile of stones) {
      assert.ok(isWalkable(grid, tile.x, tile.y));
      assert.notDeepEqual(tile, start);
    }
    layouts.add(stones.map(tileKey).sort().join(';'));
  }
  assert.ok(layouts.size > 1, 'Kameny se nemají pokaždé objevit na stejných místech.');
  assert.deepEqual(grid, originalMap, 'Kameny nesmí měnit průchodnost mapy.');
});

test('generování vybere pouze dostupná políčka a ohlásí nedostatek místa', () => {
  const map = [[0, 1, 0], [1, 0, 1]];
  const stones = generateStones(map, { x: 0, y: 0 }, 2, seededRandom(8));
  assert.deepEqual(stones.map(tileKey).sort(), ['1,1', '2,0']);
  assert.throws(() => generateStones(map, { x: 0, y: 0 }, 3), RangeError);
});

test('inventář začíná od nuly, přičítá kameny a odděluje jednotlivé suroviny', () => {
  const inventory = new Inventory();
  assert.equal(inventory.count('stone'), 0);
  assert.equal(inventory.add('stone'), 1);
  assert.equal(inventory.add('stone'), 2);
  assert.equal(inventory.count('stone'), 2);
  inventory.add('wood', 3);
  assert.equal(inventory.count('wood'), 3);
  assert.equal(inventory.count('stone'), 2);
  assert.equal(new Inventory().count('stone'), 0);
});
