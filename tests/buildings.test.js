import test from 'node:test';
import assert from 'node:assert/strict';
import { Inventory } from '../src/game/inventory.js';
import { findPath } from '../src/game/pathfinding.js';
import { placeTower, placementError, towerTiles, towerNeighbors, approachTower, planTowerExit } from '../src/game/buildings.js';

const emptyMap = () => Array.from({ length: 10 }, () => Array(10).fill(0));
function setup(stones = 15) {
  const inventory = new Inventory();
  inventory.add('stone', stones);
  return { map: emptyMap(), inventory, buildings: [], stones: new Map(), reservedTiles: [{ x: 0, y: 0 }] };
}

test('věž stojí přesně 10 kamenů a zablokuje přesně 4 políčka 2 × 2', () => {
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
    assert.equal(world.inventory.count('stone'), 15);
    assert.deepEqual(world.map, before);
    assert.equal(world.buildings.length, 0);
  }
});

test('nedostatek surovin nemění svět a více věží si zachová vlastní pozice', () => {
  const poor = setup(9);
  assert.ok(placeTower({ ...poor, anchor: { x: 2, y: 2 } }).error);
  assert.equal(poor.inventory.count('stone'), 9);
  assert.equal(poor.map.flat().reduce((a, b) => a + b), 0);
  const world = setup(20);
  const first = placeTower({ ...world, anchor: { x: 2, y: 2 } }).tower;
  assert.ok(placementError(world.map, { x: 3, y: 3 }, world.stones));
  assert.ok(placeTower({ ...world, anchor: { x: 3, y: 3 } }).error);
  assert.equal(world.inventory.count('stone'), 10);
  const second = placeTower({ ...world, anchor: { x: 6, y: 6 } }).tower;
  assert.notEqual(first.id, second.id);
  assert.equal(world.buildings.length, 2);
  assert.equal(world.map.flat().reduce((a, b) => a + b), 8);
  assert.equal(world.inventory.count('stone'), 0);
});

test('vstup volí nejkratší dostupnou cestu k okraji věže', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 3, y: 3 } });
  assert.deepEqual(approachTower(world.map, { x: 0, y: 3 }, tower).destination, { x: 2, y: 3 });
  world.map[3][2] = 1;
  assert.deepEqual(approachTower(world.map, { x: 0, y: 3 }, tower).destination, { x: 2, y: 4 });
  for (const tile of towerNeighbors(tower)) world.map[tile.y][tile.x] = 1;
  assert.equal(approachTower(world.map, { x: 0, y: 3 }, tower), null);
});

test('výstup hledá souseda s cestou k cíli; úplné obklíčení výstup zakáže', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 3, y: 3 } });
  const order = { kind: 'move', goal: { x: 8, y: 3 } };
  const route = planTowerExit(world.map, tower, order);
  assert.deepEqual(route.exit, { x: 5, y: 3 });
  assert.equal(route.path.length, 3);
  for (const tile of towerNeighbors(tower)) world.map[tile.y][tile.x] = 1;
  assert.equal(planTowerExit(world.map, tower, order), null);
});

test('okrajová věž poskytuje jen sousedy ležící v mapě', () => {
  const world = setup();
  const { tower } = placeTower({ ...world, anchor: { x: 8, y: 8 } });
  assert.equal(towerTiles(tower).length, 4);
  const route = approachTower(world.map, { x: 0, y: 0 }, tower);
  assert.ok(route);
  assert.ok(route.destination.x < 10 && route.destination.y < 10);
});
