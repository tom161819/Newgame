import { tileCenter, isWalkable } from './map.js';
import { gridToWorld } from './isometric.js';
import { tileKey } from './stones.js';
import { planGroundOrder, planTowerExit, towerNeighbors, buildingDepth, towerTop, buildingDefinition } from './buildings.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { advanceMovement } from './movement.js';

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
    this.definition = sprite.getData?.('definition') ?? objectRegistry.require(sprite.getData?.('objectId') ?? 'king');
    this.speed = this.definition.gameplay?.movementSpeed ?? 3.5;
    this.depthOffset = this.definition.depth?.offset ?? 0;
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
    if(!order.silent)this.scene.setStatus(order.kind === 'enter' ? 'Jdu k dostupnému vstupu do věže.'
      : order.pickupKey ? 'Jdu sebrat kámen. Dalším kliknutím změníš cíl.' : 'Mířím do cíle.');
    if (!this.nextTile && this.path.length === 0) this.arrive();
    return true;
  }

  arrive() {
    this.walking = false;
    const order = this.order;
    this.order = null;
    this.scene.marker.setVisible(false);
    if(order?.kind==='approachAnimal'){
      // Zvíře mohlo během cesty změnit polohu; dosah ověří HuntingSystem.
    } else if(order?.kind==='drop'){
      this.scene.dropSystem.collect(order.dropId,this.tile);
    } else if (order?.kind === 'enter') {
      this.climb(order.tower);
    } else if (order?.kind === 'collect' && this.scene.collectResource(order.pickupKey,this.tile)) {
      this.scene.setStatus('Surovina sebrána.');
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
    if (!buildingDefinition(tower).interactions.includes('enter') || this.nextTile || !isWalkable(this.scene.map, this.tile.x, this.tile.y)
      || !towerNeighbors(tower).some(tile => tileKey(tile) === tileKey(this.tile))) return;
    this.currentTower = tower;
    this.setState(PLAYER_STATE.ENTERING);
    this.sprite.setDepth(buildingDepth(tower) + 0.2);
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
        this.sprite.setDepth(this.sprite.y + this.depthOffset);
        this.setState(PLAYER_STATE.GROUND);
        if (this.path.length === 0) this.arrive();
        else this.scene.setStatus('Král je dole a pokračuje k cíli.');
      },
    });
  }

  update(delta) {
    this.walking = false;
    if (this.state !== PLAYER_STATE.GROUND) return;
    advanceMovement(this,delta);
    const projected = gridToWorld(this.position.x, this.position.y);
    this.sprite.setPosition(projected.x, projected.y);
    this.sprite.setDepth(this.sprite.y + this.depthOffset);
    if (!this.nextTile && this.path.length === 0 && this.scene.marker.visible) this.arrive();
  }
}
