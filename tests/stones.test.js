import test from 'node:test';
import assert from 'node:assert/strict';
import { grid, PLAYER_START, isWalkable } from '../src/game/map.js';
import { generateStones, STONE_COUNT, tileKey, StoneSpawner, stoneCandidates, MAX_STONES, STONE_INTERVAL } from '../src/game/stones.js';
import { Inventory } from '../src/game/inventory.js';

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('náhodná rozmístění mají vždy 30 různých dosažitelných kamenů mimo překážky a start', () => {
  const start = PLAYER_START;
  const originalMap = structuredClone(grid);
  const layouts = new Set();
  for (let seed = 1; seed <= 30; seed++) {
    const stones = generateStones(grid, start, STONE_COUNT, seededRandom(seed));
    assert.equal(stones.length, 30);
    assert.equal(new Set(stones.map(tileKey)).size, 30);
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
  const map = [[0, 0, 0], [1, 0, 1]];
  const stones = generateStones(map, { x: 0, y: 0 }, 3, seededRandom(8));
  assert.deepEqual(stones.map(tileKey).sort(), ['1,0', '1,1', '2,0']);
  assert.throws(() => generateStones(map, { x: 0, y: 0 }, 4), RangeError);
});

test('nový kámen vznikne přesně po 20 sekundách, limit 80 platí i při dlouhém kroku času', () => {
  const map=Array.from({length:12},()=>Array(12).fill(0)),stones=new Map();
  const spawner=new StoneSpawner({map,stones,getOrigins:()=>[{x:0,y:0}],getReserved:()=>[{x:0,y:0},{x:1,y:0}],
    spawn:tile=>stones.set(tileKey(tile),tile),random:seededRandom(5)});
  spawner.update(STONE_INTERVAL-1);assert.equal(stones.size,0);
  spawner.update(1);assert.equal(stones.size,1);
  spawner.update(2*STONE_INTERVAL);assert.equal(stones.size,3);
  spawner.update(100*STONE_INTERVAL);assert.equal(stones.size,MAX_STONES);
  assert.ok(!stones.has('0,0')&&!stones.has('1,0'));
  stones.delete(stones.keys().next().value);
  spawner.update(STONE_INTERVAL-1);assert.equal(stones.size,79);
  spawner.update(1);assert.equal(stones.size,80);
});

test('spawn vynechá nepřístupné oblasti, budovy, existující kameny a rezervovaná políčka', () => {
  const map=[[0,0,1,0],[0,0,1,0],[0,0,1,0]],stones=new Map([['0,1',{}]]);
  const candidates=stoneCandidates(map,[{x:0,y:0}],[{x:0,y:0},{x:1,y:0}],stones);
  assert.deepEqual(candidates.map(tileKey).sort(),['0,2','1,1','1,2']);
  map[1][1]=1; // Nová stavba.
  assert.ok(!stoneCandidates(map,[{x:0,y:0}],[],stones).some(p=>tileKey(p)==='1,1'));
  const spawner=new StoneSpawner({map,stones,getOrigins:()=>[],getReserved:()=>[],spawn:()=>assert.fail('Není dostupné políčko.')});
  assert.equal(spawner.spawnOne(),false);
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
