import Phaser from 'phaser';
import { TILE_SIZE } from './map.js';
import { towerBase } from './buildings.js';

function polygon(graphics, color, points) {
  graphics.fillStyle(color);
  graphics.fillPoints(points.map(([x, y]) => ({ x, y })), true);
}

function merlon(g, x, y, tint) {
  polygon(g, tint ?? 0x9aa8b3, [[x - 4, y - 2], [x, y], [x, y - 10], [x - 4, y - 12]]);
  polygon(g, tint ?? 0x657787, [[x, y], [x + 4, y - 2], [x + 4, y - 12], [x, y - 10]]);
  polygon(g, tint ?? 0xc5d0d7, [[x - 4, y - 12], [x, y - 14], [x + 4, y - 12], [x, y - 10]]);
}

export class TowerView {
  constructor(scene, tower, preview = false) {
    this.preview = preview;
    this.footprint = scene.add.graphics();
    this.back = scene.add.graphics();
    this.front = scene.add.graphics();
    this.hitArea = new Phaser.Geom.Polygon([
      -32, 4, -32, -16, -28, -94, 0, -108, 28, -94, 32, -16, 32, 4,
    ]);
    this.paint(tower);
    if (preview) {
      this.back.setAlpha(0.5);
      this.front.setAlpha(0.5);
    }
  }

  paint(tower, tint = null) {
    this.base = towerBase(tower);
    const { x, y } = this.base;
    const g = this.back.clear().setPosition(x, y).setDepth(this.preview ? 10001 : y);
    const front = this.front.clear().setPosition(x, y).setDepth(this.preview ? 10002 : y + 0.3);
    const floor = this.footprint.clear().setDepth(this.preview ? 10000 : 0.5);
    floor.fillStyle(tint ?? 0x637987, this.preview ? 0.28 : 0.2);
    floor.lineStyle(1, tint ?? 0x879aa8, 0.7);
    for (const tile of tower.tiles) {
      floor.fillRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      floor.strokeRect(tile.x * TILE_SIZE, tile.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    }
    g.fillStyle(0x08141c, 0.4);
    g.fillEllipse(0, -6, 62, 16);
    polygon(g, tint ?? 0x4b606e, [[0, -30], [32, -14], [0, 3], [-32, -14]]);
    polygon(g, tint ?? 0x8999a6, [[-24, -16], [0, -3], [0, -67], [-24, -80]]);
    polygon(g, tint ?? 0x637888, [[0, -3], [24, -16], [24, -80], [0, -67]]);
    g.lineStyle(1, tint ?? 0x425966, 0.7);
    for (let level = -18; level >= -63; level -= 15) {
      g.lineBetween(-24, level - 13, 0, level);
      g.lineBetween(0, level, 24, level - 13);
      g.lineBetween(-12, level - 6, -12, level - 18);
      g.lineBetween(12, level - 6, 12, level - 18);
    }
    polygon(g, tint ?? 0x263d4b, [[5, -9], [14, -14], [14, -34], [5, -29]]);
    // Jednoduchý žebřík na přední straně.
    g.lineStyle(2, tint ?? 0xc6b38a, 1);
    g.lineBetween(-4, -7, -4, -65);
    g.lineBetween(4, -7, 4, -65);
    for (let rung = -12; rung > -65; rung -= 8) g.lineBetween(-4, rung, 4, rung);
    polygon(g, tint ?? 0xb3c1ca, [[0, -94], [28, -80], [0, -66], [-28, -80]]);
    for (const [mx, my] of [[-23, -82], [-12, -88], [0, -94], [12, -88], [23, -82]]) merlon(g, mx, my, tint);
    // Přední parapet se kreslí až před postavou stojící na plošině.
    polygon(front, tint ?? 0x8da0ae, [[-28, -80], [0, -66], [0, -59], [-28, -73]]);
    polygon(front, tint ?? 0x5d7484, [[0, -66], [28, -80], [28, -73], [0, -59]]);
    for (const [mx, my] of [[-23, -76], [-12, -70], [0, -64], [12, -70], [23, -76]]) merlon(front, mx, my, tint);
  }

  contains(x, y) {
    return Phaser.Geom.Polygon.Contains(this.hitArea, x - this.base.x, y - this.base.y);
  }

  setVisible(visible) {
    this.footprint.setVisible(visible);
    this.back.setVisible(visible);
    this.front.setVisible(visible);
  }
}
