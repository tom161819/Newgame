import test from 'node:test';
import assert from 'node:assert/strict';
import { PlayerController, PLAYER_STATE } from '../src/game/PlayerController.js';
import { towerTiles, towerNeighbors, towerTop } from '../src/game/buildings.js';
import { tileCenter } from '../src/game/map.js';

function setup() {
  const tower = { id: 1, x: 4, y: 4, tiles: towerTiles({ x: 4, y: 4 }) };
  const map = Array.from({ length: 12 }, () => Array(12).fill(0));
  for (const tile of tower.tiles) map[tile.y][tile.x] = 1;
  const sprite = { ...tileCenter({ x: 0, y: 0 }), setPosition(x, y) { this.x = x; this.y = y; return this; }, setDepth(depth) { this.depth = depth; return this; } };
  const animations = [];
  let gathered = 0;
  const scene = {
    map, marker: { visible: false, setVisible(value) { this.visible = value; } },
    showMarker() { this.marker.visible = true; }, setStatus() {}, updateBuildingUI() {},
    collectStone() { gathered++; return true; }, tweens: { add(config) { animations.push(config); } },
  };
  const character = new PlayerController(scene, sprite, { x: 0, y: 0 });
  function completeAnimation() {
    const animation = animations.shift();
    assert.ok(animation);
    sprite.setPosition(animation.x, animation.y);
    animation.onComplete();
  }
  return { character, tower, scene, sprite, animations, completeAnimation, gathered: () => gathered };
}

test('vstup nefunguje z dálky; nejprve cesta, potom animace a až pak pobyt nahoře', () => {
  const w = setup();
  w.character.climb(w.tower);
  assert.equal(w.character.state, PLAYER_STATE.GROUND);
  assert.equal(w.animations.length, 0);
  w.character.command({ kind: 'enter', tower: w.tower });
  assert.equal(w.character.state, PLAYER_STATE.GROUND);
  assert.ok(w.character.path.length > 1);
  w.character.update(10000);
  assert.equal(w.character.state, PLAYER_STATE.ENTERING);
  assert.ok(towerNeighbors(w.tower).some(tile => tile.x === w.character.tile.x && tile.y === w.character.tile.y));
  assert.notDeepEqual({ x: w.sprite.x, y: w.sprite.y }, towerTop(w.tower));
  w.completeAnimation();
  assert.equal(w.character.state, PLAYER_STATE.ON_TOWER);
  assert.deepEqual({ x: w.sprite.x, y: w.sprite.y }, towerTop(w.tower));
});

test('z vrcholu nelze chodit ani sbírat; sběr následuje až po animaci sestupu a chůzi', () => {
  const w = setup();
  w.character.command({ kind: 'enter', tower: w.tower });
  w.character.update(10000); w.completeAnimation();
  const roof = { x: w.sprite.x, y: w.sprite.y };
  w.character.update(10000);
  assert.deepEqual({ x: w.sprite.x, y: w.sprite.y }, roof);
  w.character.command({ kind: 'move', goal: { x: 10, y: 10 }, pickupKey: '10,10' });
  assert.equal(w.character.state, PLAYER_STATE.EXITING);
  w.character.update(10000);
  assert.equal(w.gathered(), 0);
  assert.deepEqual({ x: w.sprite.x, y: w.sprite.y }, roof);
  assert.equal(w.character.command({ kind: 'move', goal: { x: 0, y: 0 } }), false);
  w.completeAnimation();
  assert.equal(w.character.state, PLAYER_STATE.GROUND);
  assert.ok(towerNeighbors(w.tower).some(tile => tile.x === w.character.tile.x && tile.y === w.character.tile.y));
  w.character.update(10000);
  assert.deepEqual(w.character.tile, { x: 10, y: 10 });
  assert.equal(w.gathered(), 1);
});

test('obklíčený hráč zůstane nahoře; po uvolnění lze vstup a výstup opakovat', () => {
  const w = setup();
  w.character.command({ kind: 'enter', tower: w.tower });w.character.update(10000);w.completeAnimation();
  for (const tile of towerNeighbors(w.tower)) w.scene.map[tile.y][tile.x] = 1;
  assert.equal(w.character.command({ kind: 'move', goal: { x: 0, y: 0 } }), false);
  assert.equal(w.character.state, PLAYER_STATE.ON_TOWER);
  assert.equal(w.animations.length, 0);
  for (const tile of towerNeighbors(w.tower)) w.scene.map[tile.y][tile.x] = 0;
  for (let cycle = 0; cycle < 3; cycle++) {
    w.character.command({ kind: 'move', goal: { x: 0, y: 0 } });w.completeAnimation();w.character.update(10000);
    assert.equal(w.character.state, PLAYER_STATE.GROUND);
    w.character.command({ kind: 'enter', tower: w.tower });w.character.update(10000);w.completeAnimation();
    assert.equal(w.character.state, PLAYER_STATE.ON_TOWER);
  }
});
