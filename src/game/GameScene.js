import Phaser from 'phaser';
import { COLUMNS, ROWS, PLAYER_START, grid, isWalkable, tileCenter } from './map.js';
import { tilePolygon, worldToTile } from './isometric.js';
import { TerrainRenderer } from './TerrainRenderer.js';
import { WorldCamera } from './WorldCamera.js';
import { Inventory } from './inventory.js';
import { drawStone, generateStones, tileKey, StoneSpawner, MAX_STONES } from './stones.js';
import { placeTower, placementError, towerTiles, towerBase, towerNeighbors, TOWER_COST } from './buildings.js';
import { TowerView } from './TowerView.js';
import { KingView } from './KingView.js';
import { PlayerController, PLAYER_STATE } from './PlayerController.js';
import { BuildingBar } from '../ui/BuildingBar.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('Game');
  }

  create() {
    // Každá nová hra dostane vlastní mapu, do které lze zapisovat budovy.
    this.map = grid.map(row => [...row]);
    this.terrain = new TerrainRenderer(this, grid);
    const start = PLAYER_START;
    this.inventory = new Inventory();
    this.stones = new Map(generateStones(this.map, start).map(tile => [tileKey(tile), drawStone(this, tile)]));
    this.buildings = [];
    this.towerViews = new Map();
    this.buildMode = false;
    this.previewAnchor = null;
    this.previewTracking = false;
    this.previewKey = null;
    this.preview = new TowerView(this, { x: 0, y: 0, tiles: towerTiles({ x: 0, y: 0 }) }, true);
    this.preview.setVisible(false);
    this.marker = this.add.graphics().setDepth(9998).setVisible(false);
    const position = tileCenter(start);
    this.player = new KingView(this, position.x, position.y);
    this.character = new PlayerController(this, this.player, start);
    this.worldCamera = new WorldCamera(this, this.player);
    this.spawner = new StoneSpawner({
      map: this.map, stones: this.stones,
      getOrigins: () => {
        const character = this.character;
        if (character.exitTile) return [character.exitTile];
        if (character.currentTower) return towerNeighbors(character.currentTower);
        return [character.nextTile ?? character.tile];
      },
      getReserved: () => this.character.reservedTiles(),
      spawn: tile => {
        this.stones.set(tileKey(tile), drawStone(this, tile));
        this.updateWorldCount();
      },
    });
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
      this.previewTracking = true;
      this.previewAnchor = this.pointerTile(pointer);
      this.updateBuildingPreview();
    });
    this.input.on('gameout', () => {
      this.previewAnchor = null;
      this.previewTracking = false;
      this.preview.setVisible(false);
      this.previewKey = null;
    });
    const onEscape = () => { if (this.buildMode) this.cancelBuilding(); };
    this.input.keyboard.on('keydown-ESC', onEscape);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.buildingBar.destroy();
      this.worldCamera.destroy();
      this.input.keyboard.off('keydown-ESC', onEscape);
      this.game.canvas.style.cursor = '';
    });
  }

  pointerTile(pointer) {
    pointer.updateWorldPoint(this.cameras.main);
    return worldToTile(pointer.worldX, pointer.worldY);
  }

  handleClick(pointer) {
    if (pointer.rightButtonDown()) {
      if (this.buildMode) this.cancelBuilding();
      return;
    }
    if (!pointer.leftButtonDown()) return;
    let goal = this.pointerTile(pointer);
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
        this.cancelBuilding('Věž postavena za 10 kamenů. Klikni na ni a král dojde ke vstupu.');
      }
      return;
    }
    if (this.character.transitioning) {
      this.setStatus('Počkej, až král dokončí výstup nebo sestup.');
      return;
    }
    // Nový levý klik ruší předchozí sběr i plánovaný vstup, ne právě probíhající animaci.
    this.character.order = null;
    const tower = this.towerAtPoint(pointer.worldX, pointer.worldY, goal);
    let accepted = false;
    if (tower) {
      accepted = this.character.command({ kind: 'enter', tower });
    } else {
      // I horní plocha kamene může trochu přesahovat kosočtverec jeho políčka.
      const hit = [...this.stones.values()].find(stone => stone.visible
        && Math.abs(pointer.worldX-stone.x)<14 && pointer.worldY>stone.y-12 && pointer.worldY<stone.y+10);
      if (hit) goal = hit.getData('tile');
      if (!isWalkable(this.map, goal.x, goal.y)) this.setStatus('Tady je překážka nebo okraj mapy. Vyber volné políčko.');
      else accepted = this.character.command({ kind: 'move', goal, pickupKey: this.stones.has(tileKey(goal)) ? tileKey(goal) : null });
    }
    if (accepted) this.worldCamera.follow();
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
    this.previewTracking = false;
    this.game.canvas.style.cursor = 'crosshair';
    this.updateBuildingUI();
    this.setStatus('Tower: vyber 2 × 2 volná políčka. Cena 10 kamenů. Esc nebo pravý klik stavbu zruší.');
    return true;
  }

  cancelBuilding(message = 'Režim stavění zrušen. Můžeš se znovu pohybovat a sbírat kameny.') {
    this.buildMode = false;
    this.previewAnchor = null;
    this.previewTracking = false;
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
    this.marker.clear().lineStyle(2, 0xe3c879, 1).strokePoints(tilePolygon(tile), true).setVisible(true);
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
    this.updateWorldCount();
  }

  updateWorldCount() {
    document.querySelector('#world-stones').textContent = `Mapa 100 × 100 · kameny ${this.stones.size} / ${MAX_STONES}`;
  }

  updateBuildingUI() {
    this.buildingBar.update(this.inventory.count('stone'), this.buildMode);
  }

  setStatus(message) {
    document.querySelector('#status').textContent = message;
  }

  update(_time, delta) {
    this.character.update(delta);
    this.player.animate(delta, this.character.walking && this.character.state === PLAYER_STATE.GROUND, this.character.direction);
    this.spawner.update(delta);
    this.worldCamera.update(delta);
    this.terrain.update(this.cameras.main);
    const view = this.cameras.main.worldView;
    for (const stone of this.stones.values()) stone.setVisible(stone.x>view.x-40&&stone.x<view.right+40&&stone.y>view.y-40&&stone.y<view.bottom+40);
    for (const tower of this.towerViews.values()) tower.setVisible(tower.inView(view));
    this.player.setVisible(this.player.x>view.x-40&&this.player.x<view.right+40&&this.player.y>view.y-20&&this.player.y<view.bottom+70);
    if (this.buildMode) {
      if (this.previewTracking) this.previewAnchor = this.pointerTile(this.input.activePointer);
      this.updateBuildingPreview();
    }
  }
}
