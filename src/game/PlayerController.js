import { tileCenter, isWalkable } from './map.js';
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
    this.nextTile = null;
    this.path = [];
    this.speed = 144;
    this.state = PLAYER_STATE.GROUND;
    this.currentTower = null;
    this.order = null;
  }

  get transitioning() {
    return this.state === PLAYER_STATE.ENTERING || this.state === PLAYER_STATE.EXITING;
  }

  reservedTiles() {
    // Chráníme oba konce právě procházeného úseku, nejen zaokrouhlenou polohu.
    return this.state === PLAYER_STATE.GROUND ? [this.tile, this.nextTile].filter(Boolean) : [];
  }

  stopForBuilding() {
    this.path = [];
    this.order = null;
    this.scene.marker.setVisible(false);
    // Probíhající krok doběhne do středu; hráč se při otevření lišty neposune skokem.
  }

  command(order) {
    if (this.transitioning) {
      this.scene.setStatus('Počkej, až hráč dokončí výstup nebo sestup.');
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
        this.scene.setStatus('Z věže nevede dostupná cesta k tomuto cíli. Hráč zůstává nahoře.');
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
    this.scene.setStatus('Hráč šplhá na plošinu věže…');
    this.scene.tweens.add({
      targets: this.sprite, ...towerTop(tower), duration: 900, ease: 'Sine.InOut',
      onComplete: () => {
        this.setState(PLAYER_STATE.ON_TOWER);
        this.scene.setStatus('Jsi na věži. Klikni na průchozí políčko a hráč nejprve sleze dolů.');
      },
    });
  }

  descend(exit) {
    this.setState(PLAYER_STATE.EXITING);
    this.scene.setStatus('Hráč slézá z věže…');
    this.scene.tweens.add({
      targets: this.sprite, ...tileCenter(exit), duration: 900, ease: 'Sine.InOut',
      onComplete: () => {
        this.tile = exit;
        this.currentTower = null;
        this.sprite.setDepth(this.sprite.y + 10);
        this.setState(PLAYER_STATE.GROUND);
        if (this.path.length === 0) this.arrive();
        else this.scene.setStatus('Hráč je dole a pokračuje k cíli.');
      },
    });
  }

  update(delta) {
    if (this.state !== PLAYER_STATE.GROUND) return;
    let distanceLeft = this.speed * delta / 1000;
    while (distanceLeft > 0) {
      if (!this.nextTile) this.nextTile = this.path.shift();
      if (!this.nextTile) break;
      const target = tileCenter(this.nextTile);
      const dx = target.x - this.sprite.x;
      const dy = target.y - this.sprite.y;
      const distance = Math.hypot(dx, dy);
      if (distance <= distanceLeft) {
        this.sprite.setPosition(target.x, target.y);
        distanceLeft -= distance;
        this.tile = this.nextTile;
        this.nextTile = null;
      } else {
        this.sprite.x += dx / distance * distanceLeft;
        this.sprite.y += dy / distance * distanceLeft;
        break;
      }
    }
    this.sprite.setDepth(this.sprite.y + 10);
    if (!this.nextTile && this.path.length === 0 && this.scene.marker.visible) this.arrive();
  }
}
