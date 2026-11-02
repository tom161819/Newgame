import Phaser from 'phaser';
import { COLUMNS, ROWS, TILE_SIZE, MAP_HEADROOM, grid, isWalkable, tileCenter } from './map.js';
import { Inventory } from './inventory.js';
import { drawStone, generateStones, tileKey } from './stones.js';
import { placeTower, placementError, towerTiles, towerBase, TOWER_COST } from './buildings.js';
import { TowerView } from './TowerView.js';
import { PlayerController, PLAYER_STATE } from './PlayerController.js';
import { BuildingBar } from '../ui/BuildingBar.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    this.cameras.main.setScroll(0, -MAP_HEADROOM);
    // Každá nová hra dostane vlastní mapu, do které lze zapisovat budovy.
    this.map = grid.map(row => [...row]);
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLUMNS; x++) {
        const position = tileCenter({ x, y });
        const color = this.map[y][x] ? 0x586b79 : (x + y) % 2 ? 0x1e303b : 0x223540;
        this.add.rectangle(position.x, position.y, TILE_SIZE - 1, TILE_SIZE - 1, color);
      }
    }
    const start = { x: 2, y: 2 };
    this.inventory = new Inventory();
    this.stones = new Map(generateStones(this.map, start).map(tile => [tileKey(tile), drawStone(this, tile)]));
    this.buildings = [];
    this.towerViews = new Map();
    this.buildMode = false;
    this.previewAnchor = null;
    this.previewKey = null;
    this.preview = new TowerView(this, { x: 0, y: 0, tiles: towerTiles({ x: 0, y: 0 }) }, true);
    this.preview.setVisible(false);
    this.marker = this.add.rectangle(0, 0, 26, 26).setStrokeStyle(2, 0x85d6ce).setDepth(9998).setVisible(false);
    const position = tileCenter(start);
    this.player = this.add.circle(position.x, position.y, 10, 0x388dff).setStrokeStyle(2, 0xa8d1ff);
    this.character = new PlayerController(this, this.player, start);
    this.buildingBar = new BuildingBar({
      onSelect: () => this.startBuilding(),
      onCancel: () => this.cancelBuilding(),
    });
    this.buildingBar.close();
    this.updateInventory();
    this.setStatus('Vyber kámen, volné políčko nebo otevři Buildings.');
    this.input.mouse.disableContextMenu();
    this.input.on('pointerdown', pointer => this.handleClick(pointer));
    this.input.on('pointermove', pointer => {
      if (!this.buildMode) return;
      this.previewAnchor = this.pointerTile(pointer);
      this.updateBuildingPreview();
    });
    this.input.on('gameout', () => {
      this.previewAnchor = null;
      this.preview.setVisible(false);
      this.previewKey = null;
    });
    const onEscape = () => { if (this.buildMode) this.cancelBuilding(); };
    this.input.keyboard.on('keydown-ESC', onEscape);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.buildingBar.destroy();
      this.input.keyboard.off('keydown-ESC', onEscape);
      this.game.canvas.style.cursor = '';
    });
  }

  pointerTile(pointer) {
    pointer.updateWorldPoint(this.cameras.main);
    return { x: Math.floor(pointer.worldX / TILE_SIZE), y: Math.floor(pointer.worldY / TILE_SIZE) };
  }

  handleClick(pointer) {
    if (pointer.rightButtonDown()) {
      if (this.buildMode) this.cancelBuilding();
      return;
    }
    if (!pointer.leftButtonDown()) return;
    const goal = this.pointerTile(pointer);
    if (this.buildMode) {
      this.previewAnchor = goal;
      const result = placeTower({ map: this.map, anchor: goal, stones: this.stones,
        reservedTiles: this.character.reservedTiles(), inventory: this.inventory, buildings: this.buildings });
      if (result.error) {
        this.previewKey = null;
        this.updateBuildingPreview();
        this.setStatus(result.error);
      } else {
        this.towerViews.set(result.tower.id, new TowerView(this, result.tower));
        this.updateInventory();
        this.cancelBuilding('Věž postavena za 10 kamenů. Klikni na ni a hráč dojde ke vstupu.');
      }
      return;
    }
    if (this.character.transitioning) {
      this.setStatus('Počkej, až hráč dokončí výstup nebo sestup.');
      return;
    }
    // Nový levý klik ruší předchozí sběr i plánovaný vstup, ne právě probíhající animaci.
    this.character.order = null;
    const tower = this.towerAtPoint(pointer.worldX, pointer.worldY, goal);
    if (tower) {
      this.character.command({ kind: 'enter', tower });
    } else if (!isWalkable(this.map, goal.x, goal.y)) {
      this.setStatus('Tady je překážka nebo okraj mapy. Vyber volné políčko.');
    } else {
      this.character.command({ kind: 'move', goal, pickupKey: this.stones.has(tileKey(goal)) ? tileKey(goal) : null });
    }
  }

  towerAtPoint(x, y, tile) {
    return [...this.buildings].sort((a, b) => towerBase(b).y - towerBase(a).y).find(tower =>
      this.towerViews.get(tower.id).contains(x, y) || tower.tiles.some(part => tileKey(part) === tileKey(tile)));
  }

  startBuilding() {
    if (this.character.transitioning) {
      this.setStatus('Nejdřív dokonči výstup nebo sestup z věže.');
      return false;
    }
    this.character.stopForBuilding();
    this.buildMode = true;
    this.previewKey = null;
    this.previewAnchor = null;
    this.game.canvas.style.cursor = 'crosshair';
    this.updateBuildingUI();
    this.setStatus('Tower: vyber 2 × 2 volná políčka. Cena 10 kamenů. Esc nebo pravý klik stavbu zruší.');
    return true;
  }

  cancelBuilding(message = 'Režim stavění zrušen. Můžeš se znovu pohybovat a sbírat kameny.') {
    this.buildMode = false;
    this.previewAnchor = null;
    this.previewKey = null;
    this.preview.setVisible(false);
    this.game.canvas.style.cursor = '';
    this.updateBuildingUI();
    this.setStatus(message);
  }

  updateBuildingPreview() {
    const anchor = this.previewAnchor;
    if (!this.buildMode || !anchor || anchor.x < 0 || anchor.y < 0 || anchor.x >= COLUMNS || anchor.y >= ROWS) {
      this.preview.setVisible(false);
      return;
    }
    const error = placementError(this.map, anchor, this.stones, this.character.reservedTiles())
      ?? (this.inventory.count('stone') < TOWER_COST ? 'Na věž potřebuješ 10 kamenů.' : null);
    const key = `${tileKey(anchor)}:${error}`;
    if (key !== this.previewKey) {
      this.preview.paint({ ...anchor, tiles: towerTiles(anchor) }, error ? 0xf27777 : 0x71dba6);
      this.previewKey = key;
      this.setStatus(error ?? 'Platné místo: levým kliknutím postavíš věž za 10 kamenů.');
    }
    this.preview.setVisible(true);
  }

  showMarker(tile) {
    const center = tileCenter(tile);
    this.marker.setPosition(center.x, center.y).setVisible(true);
  }

  collectStone(tile) {
    if (this.character.state !== PLAYER_STATE.GROUND) return false;
    const key = tileKey(tile);
    const stone = this.stones.get(key);
    if (!stone) return false;
    stone.destroy();
    this.stones.delete(key);
    this.inventory.add('stone');
    this.updateInventory();
    return true;
  }

  updateInventory() {
    for (const element of document.querySelectorAll('[data-resource-count]')) {
      element.textContent = this.inventory.count(element.dataset.resourceCount);
    }
    this.updateBuildingUI();
  }

  updateBuildingUI() {
    this.buildingBar.update(this.inventory.count('stone'), this.buildMode);
  }

  setStatus(message) {
    document.querySelector('#status').textContent = message;
  }

  update(_time, delta) {
    this.character.update(delta);
    if (this.buildMode) this.updateBuildingPreview();
  }
}
