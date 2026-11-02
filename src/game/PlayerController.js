import { tileCenter, isWalkable } from './map.js';
import { gridToWorld } from './isometric.js';
import { tileKey } from './stones.js';
import { planGroundOrder, planTowerExit, towerNeighbors, towerBase, towerTop } from './buildings.js';

export const PLAYER_STATE = Object.freeze({
  GROUND: 'ground', ENTERING: 'enteringTower', ON_TOWER: 'onTower', EXITING: 'exitingTower',
});

export class PlayerController {
  constructor(scene, sprite, start) {
    this.scene = scene;
    this.sprite = sprite;
    this.tile = { ...start };
    this.position = { x: start.x + 0.5, y: start.y + 0.5 };
    this.nextTile = null;
    this.path = [];
    this.speed = 3.5; // Logická políčka za sekundu, nezávisle na projekci a zoomu.
    this.walking = false;
    this.direction = { x: 0, y: 1 };
    this.state = PLAYER_STATE.GROUND;
    this.currentTower = null;
    this.order = null;
  }

  get transitioning() {
    return this.state === PLAYER_STATE.ENTERING || this.state === PLAYER_STATE.EXITING;
  }

  reservedTiles() {
    // Chráníme oba konce právě procházeného úseku, nejen zaokrouhlenou polohu.
    if (this.state === PLAYER_STATE.ON_TOWER) return [];
    const tiles = [this.tile, this.nextTile, this.exitTile].filter(Boolean);
    if (this.nextTile && this.nextTile.x !== this.tile.x && this.nextTile.y !== this.tile.y) {
      // Stavba nesmí zavřít ani jeden roh právě procházené diagonály.
      tiles.push({ x: this.nextTile.x, y: this.tile.y }, { x: this.tile.x, y: this.nextTile.y });
    }
    return tiles;
  }

  stopForBuilding() {
    this.path = [];
    this.order = null;
    this.scene.marker.setVisible(false);
    // Probíhající krok doběhne do středu; král se při otevření lišty neposune skokem.
  }

  command(order) {
    if (this.transitioning) {
      this.scene.setStatus('Počkej, až král dokončí výstup nebo sestup.');
      return false;
    }
    this.order = null;
    if (this.state === PLAYER_STATE.ON_TOWER) {
      if (order.kind === 'enter' && order.tower === this.currentTower) {
        this.scene.setStatus('Jsi na této věži. Pro sestup klikni na volné políčko.');
        return false;
      }
      const route = planTowerExit(this.scene.map, this.currentTower, order);
      if (!route) {
        this.scene.setStatus('Z věže nevede dostupná cesta k tomuto cíli. Král zůstává nahoře.');
        return false;
      }
      this.order = order;
      this.path = route.path;
      this.scene.showMarker(route.destination);
      this.descend(route.exit);
      return true;
    }

    const route = planGroundOrder(this.scene.map, this.nextTile ?? this.tile, order);
    if (!route) {
      this.scene.setStatus('K tomuto cíli nevede cesta.');
      return false;
    }
    this.order = order;
    this.path = route.path;
    this.scene.showMarker(route.destination);
    this.scene.setStatus(order.kind === 'enter' ? 'Jdu k dostupnému vstupu do věže.'
      : order.pickupKey ? 'Jdu sebrat kámen. Dalším kliknutím změníš cíl.' : 'Mířím do cíle.');
    if (!this.nextTile && this.path.length === 0) this.arrive();
    return true;
  }

  arrive() {
    this.walking = false;
    const order = this.order;
    this.order = null;
    this.scene.marker.setVisible(false);
    if (order?.kind === 'enter') {
      this.climb(order.tower);
    } else if (order?.pickupKey === tileKey(this.tile) && this.scene.collectStone(this.tile)) {
      this.scene.setStatus('Kámen sebrán! Vyber další kámen nebo volné políčko.');
    } else {
      this.scene.setStatus('Jsem v cíli. Vyber další políčko, kámen nebo věž.');
    }
  }

  setState(state) {
    this.state = state;
    this.scene.updateBuildingUI();
  }

  climb(tower) {
    // Animaci nelze spustit z dálky, z obsazeného políčka ani během kroku.
    if (this.nextTile || !isWalkable(this.scene.map, this.tile.x, this.tile.y)
      || !towerNeighbors(tower).some(tile => tileKey(tile) === tileKey(this.tile))) return;
    this.currentTower = tower;
    this.setState(PLAYER_STATE.ENTERING);
    this.sprite.setDepth(towerBase(tower).y + 0.2);
    this.scene.setStatus('Král šplhá na plošinu věže…');
    this.scene.tweens.add({
      targets: this.sprite, ...towerTop(tower), duration: 900, ease: 'Sine.InOut',
      onComplete: () => {
        this.setState(PLAYER_STATE.ON_TOWER);
        this.scene.setStatus('Jsi na věži. Klikni na průchozí políčko a král nejprve sleze dolů.');
      },
    });
  }

  descend(exit) {
    this.exitTile = exit;
    this.setState(PLAYER_STATE.EXITING);
    this.scene.setStatus('Král slézá z věže…');
    this.scene.tweens.add({
      targets: this.sprite, ...tileCenter(exit), duration: 900, ease: 'Sine.InOut',
      onComplete: () => {
        this.tile = exit;
        this.exitTile = null;
        this.position = { x: exit.x + 0.5, y: exit.y + 0.5 };
        this.currentTower = null;
        this.sprite.setDepth(this.sprite.y + 0.1);
        this.setState(PLAYER_STATE.GROUND);
        if (this.path.length === 0) this.arrive();
        else this.scene.setStatus('Král je dole a pokračuje k cíli.');
      },
    });
  }

  update(delta) {
    this.walking = false;
    if (this.state !== PLAYER_STATE.GROUND) return;
    let distanceLeft = this.speed * delta / 1000;
    while (distanceLeft > 0) {
      if (!this.nextTile) this.nextTile = this.path.shift();
      if (!this.nextTile) break;
      const target = { x: this.nextTile.x + 0.5, y: this.nextTile.y + 0.5 };
      const dx = target.x - this.position.x;
      const dy = target.y - this.position.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        this.walking = true;
        this.direction = { x: dx / distance, y: dy / distance };
      }
      if (distance <= distanceLeft) {
        this.position = target;
        distanceLeft -= distance;
        this.tile = this.nextTile;
        this.nextTile = null;
      } else {
        this.position.x += dx / distance * distanceLeft;
        this.position.y += dy / distance * distanceLeft;
        break;
      }
    }
    const projected = gridToWorld(this.position.x, this.position.y);
    this.sprite.setPosition(projected.x, projected.y);
    this.sprite.setDepth(this.sprite.y + 0.1);
    if (!this.nextTile && this.path.length === 0 && this.scene.marker.visible) this.arrive();
  }
}
