import Phaser from 'phaser';
import { COLUMNS, ROWS, TILE_SIZE, grid, isWalkable, tileCenter } from './map.js';
import { findPath } from './pathfinding.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        const position = tileCenter({ x, y });
        const color = grid[y][x] ? 0x586b79 : (x + y) % 2 ? 0x1e303b : 0x223540;
        this.add.rectangle(position.x, position.y, TILE_SIZE - 1, TILE_SIZE - 1, color);
      }
    }
    this.tile = { x: 2, y: 2 };
    this.path = [];
    this.nextTile = null;
    this.speed = 144; // pixely za sekundu, nezávisle na počtu snímků
    this.marker = this.add.rectangle(0, 0, 22, 22).setStrokeStyle(2, 0x85d6ce).setVisible(false);
    const start = tileCenter(this.tile);
    this.player = this.add.circle(start.x, start.y, 10, 0x388dff).setStrokeStyle(2, 0xa8d1ff);
    this.input.on('pointerdown', (pointer) => {
      if (!pointer.leftButtonDown()) return;
      const goal = { x: Math.floor(pointer.worldX / TILE_SIZE), y: Math.floor(pointer.worldY / TILE_SIZE) };
      if (!isWalkable(grid, goal.x, goal.y)) {
        this.setStatus('Tady je překážka nebo okraj mapy. Vyber volné políčko.');
        return;
      }
      // Probíhající krok dokončíme, ale všechny další kroky ihned přepočítáme.
      const path = findPath(grid, this.nextTile ?? this.tile, goal);
      if (path === null) {
        this.setStatus('K tomuto políčku nevede cesta.');
        return;
      }
      this.path = path;
      const center = tileCenter(goal);
      this.marker.setPosition(center.x, center.y).setVisible(true);
      this.setStatus('Mířím do cíle. Dalším kliknutím změníš cestu.');
    });
  }

  setStatus(message) {
    document.querySelector('#status').textContent = message;
  }

  update(_time, delta) {
    let distanceLeft = this.speed * delta / 1000;
    // Zpracujeme i více krátkých kroků při pomalém snímku, bez přestřelení cíle.
    while (distanceLeft > 0) {
      if (!this.nextTile) this.nextTile = this.path.shift();
      if (!this.nextTile) {
        if (this.marker.visible) {
          this.marker.setVisible(false);
          this.setStatus('Jsem v cíli. Vyber další políčko.');
        }
        break;
      }
      const target = tileCenter(this.nextTile);
      const dx = target.x - this.player.x;
      const dy = target.y - this.player.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= distanceLeft) {
        this.player.setPosition(target.x, target.y);
        distanceLeft -= distance;
        this.tile = this.nextTile;
        this.nextTile = null;
      } else {
        this.player.x += dx / distance * distanceLeft;
        this.player.y += dy / distance * distanceLeft;
        break;
      }
    }
  }
}
