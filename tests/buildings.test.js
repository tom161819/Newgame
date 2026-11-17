import test from 'node:test';
import assert from 'node:assert/strict';
import { entryTiles } from '../src/game/buildings.js';
import { Inventory } from '../src/game/inventory.js';
import { findPath } from '../src/game/pathfinding.js';
import { placeTower, placementError, towerTiles, towerNeighbors, approachTower, planTowerExit } from '../src/game/buildings.js';

const emptyMap = () => Array.from({ length: 10 }, () => Array(10).fill(0));
function setup(stones = 25) {
  const inventory = new Inventory();
  inventory.add('stone', stones);
  return { map: emptyMap(), inventory, buildings: [], stones: new Map(), reservedTiles: [{ x: 0, y: 0 }] };
}

test('věž stojí přesně 20 kamenů a zablokuje přesně 4 políčka 2 × 2', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 3, y: 3 } });
  assert.deepEqual(tower.tiles, [{ x: 3, y: 3 }, { x: 4, y: 3 }, { x: 3, y: 4 }, { x: 4, y: 4 }]);
  assert.equal(world.inventory.count('stone'), 5);
  assert.equal(world.map.flat().filter(value => value === 1).length, 4);
  assert.equal(world.buildings.length, 1);
  const path = findPath(world.map, { x: 2, y: 3 }, { x: 5, y: 3 });
  assert.equal(path.length, 5, 'Cesta musí obejít severní stranu věže.');
  assert.ok(path.every(tile => !tower.tiles.some(part => part.x === tile.x && part.y === tile.y)));
});

test('překážky, kameny, hráč, jeho probíhající krok a okraj mapy zabrání stavbě bez platby', () => {
  for (const obstruction of ['wall', 'stone', 'player', 'step', 'edge']) {
    const world = setup();
    let anchor = { x: 3, y: 3 };
    if (obstruction === 'wall') world.map[4][4] = 1;
    if (obstruction === 'stone') world.stones.set('4,4', {});
    if (obstruction === 'player') world.reservedTiles = [{ x: 4, y: 4 }];
    if (obstruction === 'step') world.reservedTiles.push({ x: 3, y: 4 });
    if (obstruction === 'edge') anchor = { x: 9, y: 9 };
    const before = structuredClone(world.map);
    assert.ok(placeTower({ ...world, anchor }).error, obstruction);
    assert.equal(world.inventory.count('stone'), 25);
    assert.deepEqual(world.map, before);
    assert.equal(world.buildings.length, 0);
  }
});

test('nedostatek surovin nemění svět a více věží si zachová vlastní pozice', () => {
  const poor = setup(19);
  assert.ok(placeTower({ ...poor, anchor: { x: 2, y: 2 } }).error);
  assert.equal(poor.inventory.count('stone'), 19);
  assert.equal(poor.map.flat().reduce((a, b) => a + b), 0);
  const world = setup(40);
  const first = placeTower({ ...world, anchor: { x: 2, y: 2 } }).tower;
  assert.ok(placementError(world.map, { x: 3, y: 3 }, world.stones));
  assert.ok(placeTower({ ...world, anchor: { x: 3, y: 3 } }).error);
  assert.equal(world.inventory.count('stone'), 20);
  const second = placeTower({ ...world, anchor: { x: 6, y: 6 } }).tower;
  assert.notEqual(first.id, second.id);
  assert.equal(world.buildings.length, 2);
  assert.equal(world.map.flat().reduce((a, b) => a + b), 8);
  assert.equal(world.inventory.count('stone'), 0);
});

test('owner 17 Nov 2026: a Tower is entered only at its door – the tiles in front of the side it faces', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 3, y: 3 } });
  assert.deepEqual(entryTiles(tower), [{ x: 3, y: 5 }, { x: 4, y: 5 }], 'facing 0: the door is on the S side (grid y+)');
  assert.deepEqual(approachTower(world.map, { x: 0, y: 3 }, tower).destination, { x: 3, y: 5 });
  world.map[5][3] = 1;
  assert.deepEqual(approachTower(world.map, { x: 0, y: 3 }, tower).destination, { x: 4, y: 5 });
  world.map[5][4] = 1;
  assert.equal(approachTower(world.map, { x: 0, y: 3 }, tower), null, 'free sides do not help: only the door leads in');
  assert.deepEqual(entryTiles({ ...tower, facing: 1 }), [{ x: 5, y: 3 }, { x: 5, y: 4 }]);
  assert.deepEqual(entryTiles({ ...tower, facing: 2 }), [{ x: 3, y: 2 }, { x: 4, y: 2 }]);
  assert.deepEqual(entryTiles({ ...tower, facing: 3 }), [{ x: 2, y: 3 }, { x: 2, y: 4 }]);
});

test('owner 17 Nov 2026: one coming down a Tower steps out at its door; a blocked door means no way down', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 3, y: 3 } });
  const order = { kind: 'move', goal: { x: 8, y: 3 } };
  const route = planTowerExit(world.map, tower, order);
  assert.ok([[3, 5], [4, 5]].some(([x, y]) => route.exit.x === x && route.exit.y === y));
  for (const tile of entryTiles(tower)) world.map[tile.y][tile.x] = 1;
  assert.equal(planTowerExit(world.map, tower, order), null);
});

test('a Tower at the map edge is entered only if its door is on the map', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 8, y: 8 } });
  assert.equal(towerTiles(tower).length, 4);
  assert.equal(approachTower(world.map, { x: 0, y: 0 }, tower), null, 'facing 0: the door would be off the map');
  const route = approachTower(world.map, { x: 0, y: 0 }, { ...tower, facing: 2 });
  assert.ok(route);
  assert.ok(route.destination.x < 10 && route.destination.y < 10);
});

test('všechny čtyři rohy věže 2 × 2 se obcházejí bez průchodu mezi rohy', () => {
  const world=setup();
  placeTower({...world,anchor:{x:3,y:3}});
  for(const [start,goal] of [
    [{x:2,y:3},{x:3,y:2}], [{x:4,y:2},{x:5,y:3}],
    [{x:5,y:4},{x:4,y:5}], [{x:3,y:5},{x:2,y:4}],
  ]){
    const path=findPath(world.map,start,goal);
    assert.equal(path.length,2);
    let previous=start;
    for(const point of path){
      assert.equal(Math.abs(point.x-previous.x)+Math.abs(point.y-previous.y),1);
      assert.equal(world.map[point.y][point.x],0);previous=point;
    }
    assert.deepEqual(previous,goal);
  }
});

test('výstup porovnává délku cesty s diagonálami, ne počet políček', () => {
  const map=['000000000','011000000','001001000','000110110','000110001',
    '000000000','100000100','100000000','101110110'].map(row=>[...row].map(Number));
  const route=planTowerExit(map,{x:3,y:3},{kind:'move',goal:{x:6,y:7}});
  assert.deepEqual(route.exit,{x:4,y:5});
  assert.ok(Math.abs(route.cost-(2+Math.SQRT2))<1e-9);
});
