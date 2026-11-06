import { t } from '../i18n/index.js';
import { tileCenter, isWalkable } from './map.js';
import { gridToWorld } from './isometric.js';
import { tileKey } from './stones.js';
import { groundDepthAbove,planGroundOrder, planTowerExit, towerNeighbors, buildingDepth, towerTop, buildingDefinition,buildingIsComplete,roofAccessNeighbors } from './buildings.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { advanceMovement } from './movement.js';
import { canStep } from './pathfinding.js';
import { knownMap } from './knownMap.js';
import { isWall,isRoofAccess,roofIndex,findRoofPath,planRoofExit,planGroundRoofEntry } from './walls.js';
import { createCombatStats } from '../systems/CombatSystem.js';
import { createExperience } from '../data/experience.js';

export const PLAYER_STATE = Object.freeze({
  GROUND: 'ground', ENTERING: 'enteringTower', ON_TOWER: 'onTower', EXITING: 'exitingTower',
  ON_WALL: 'onWall',
  DEAD: 'dead',
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
    Object.assign(this,createCombatStats(this.definition,scene.gameSettings),{id:'king',type:'king'});
    this.experience=createExperience(this.definition);
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
    if ([PLAYER_STATE.ON_TOWER,PLAYER_STATE.ON_WALL].includes(this.state)) return [];
    const tiles = [this.tile, this.nextTile, this.exitTile].filter(Boolean);
    if (this.nextTile && this.nextTile.x !== this.tile.x && this.nextTile.y !== this.tile.y) {
      // Stavba nesmí zavřít ani jeden roh právě procházené diagonály.
      tiles.push({ x: this.nextTile.x, y: this.tile.y }, { x: this.tile.x, y: this.nextTile.y });
    }
    return tiles;
  }

  stopForBuilding() {
    this.scene.naturalResources?.cancelKing();
    this.path = [];
    this.order = null;
    this.roofContinuation = null;
    this.roofOrder = null;
    this.scene.marker.setVisible(false);
    // Probíhající krok doběhne do středu; král se při otevření lišty neposune skokem.
  }

  command(order) {
    this.scene.naturalResources?.cancelKing();
    if(!this.isAlive||this.state===PLAYER_STATE.DEAD)return false;
    if(order.kind==='enter'&&!buildingIsComplete(order.tower))return false;
    if (this.transitioning) {
      this.scene.setStatus(t('status.waitClimb'));
      return false;
    }
    this.order = null;
    this.roofOrder = null;
    if(this.state===PLAYER_STATE.ON_WALL)return this.commandOnWall(order);
    if (this.state === PLAYER_STATE.ON_TOWER) {
      if(order.kind==='enter'&&order.tower!==this.currentTower){const roofPath=findRoofPath(this.scene.buildings,this.currentTower,order.tower);if(roofPath!==null){this.startRoofRoute(roofPath,null);return true;}if(isWall(order.tower)){this.scene.setStatus(t('status.noWallPath'));return false;}}
      if (order.kind === 'enter' && order.tower === this.currentTower) {
        this.scene.setStatus(t('status.onTower'));
        return false;
      }
      const route = planTowerExit(order.explore?knownMap(this.scene):this.scene.map, this.currentTower, order,this.scene.pathWear?.routingOptions(this));
      if (!route) {
        this.scene.setStatus(t('status.noTowerPath'));
        return false;
      }
      this.order = order;
      this.path = route.path;
      this.scene.showMarker(route.destination);
      this.descend(route.exit);
      return true;
    }

    if(order.kind==='enter'&&isWall(order.tower)&&!isRoofAccess(order.tower)){
      const entry=planGroundRoofEntry(order.explore?knownMap(this.scene):this.scene.map,this.scene.buildings,this.nextTile??this.tile,order.tower,this.scene.pathWear?.routingOptions(this));
      if(!entry){this.scene.setStatus(t('status.noRoofAccess'));return false;}
      this.roofOrder={...order};order={kind:'enter',tower:entry.access};
    }
    const route = planGroundOrder(order.explore?knownMap(this.scene):this.scene.map, this.nextTile ?? this.tile, order,this.scene.pathWear?.routingOptions(this));
    if (!route) {
      this.scene.setStatus(t('status.noPath'));
      return false;
    }
    this.order = order;
    this.path = route.path;
    this.scene.showMarker(route.destination);
    if(!order.silent)this.scene.setStatus(order.explore ? t('status.toUnknown') : order.kind === 'enter' ? t('status.toTowerEntrance')
      : order.pickupKey ? t('status.toStone') : t('status.toTarget'));
    if (!this.nextTile && this.path.length === 0) this.arrive();
    return true;
  }

  // Into the unknown the route was planned on the known map; a real obstacle met on the way is only seen when reached.
  canEnterTile(tile){return !this.order?.explore||canStep(this.scene.map,this.tile,tile);}
  replanExplore(){
    const route=planGroundOrder(knownMap(this.scene),this.tile,this.order,this.scene.pathWear?.routingOptions(this));
    if(!route){this.path=[];this.order=null;this.scene.marker.setVisible(false);this.scene.setStatus(t('status.exploreBlocked'));return;}
    this.path=route.path;this.scene.showMarker(route.destination);
    if(!this.path.length)this.arrive();
  }
  wallAt(tile){const key=`${this.scene.constructionSystem?.revision??0}:${this.scene.buildings.length}`;if(this.roofMapKey!==key){this.roofMapKey=key;this.roofMap=roofIndex(this.scene.buildings);}return this.roofMap.get(tileKey(tile));}
  commandOnWall(order){
    const start=this.nextTile?this.wallAt(this.nextTile):this.currentTower;
    if(order.kind==='enter'&&(isWall(order.tower)||isRoofAccess(order.tower))){
      const route=findRoofPath(this.scene.buildings,start,order.tower);
      if(route!==null){this.startRoofRoute(route,null);return true;}
      this.scene.setStatus(t('status.noWallPath'));return false;
    }
    const route=planRoofExit(order.explore?knownMap(this.scene):this.scene.map,this.scene.buildings,start,order,this.scene.pathWear?.routingOptions(this));
    if(!route){
      this.path=[];this.roofContinuation=null;this.scene.marker.setVisible(false);
      this.scene.setStatus(t('status.noWallPath'));return false;
    }
    this.startRoofRoute(route.roofPath,{order,path:route.path,destination:route.destination,exit:route.exit,accessId:route.accessId});return true;
  }
  startRoofRoute(buildings,continuation){
    this.setState(PLAYER_STATE.ON_WALL);
    this.path=buildings.map(b=>({x:b.x,y:b.y}));this.roofContinuation=continuation;
    this.scene.marker.setVisible(false);this.scene.setStatus(t('status.kingOnWallPath'));
    if(!this.nextTile&&!this.path.length)this.finishRoofRoute();
  }
  finishRoofRoute(){
    this.walking=false;
    const continuation=this.roofContinuation;this.roofContinuation=null;
    if(continuation){
      const access=this.scene.buildings.find(b=>b.id===continuation.accessId),route=access&&planTowerExit(this.scene.map,access,continuation.order,this.scene.pathWear?.routingOptions(this));
      if(!route){this.path=[];this.scene.marker.setVisible(false);this.scene.setStatus(t('status.noTowerPath'));return;}
      this.currentTower=access;this.order=continuation.order;this.path=route.path;this.scene.showMarker(route.destination);this.descend(route.exit);
    }else{const owner=this.scene.buildings.find(b=>b.id===this.currentTower?.id);if(owner&&!isWall(owner)&&tileKey(owner)===tileKey(this.tile)){this.currentTower=owner;this.setState(PLAYER_STATE.ON_TOWER);}this.scene.setStatus(t('status.kingOnWall'));}
  }

  arrive() {
    this.walking = false;
    const order = this.order;
    this.order = null;
    this.scene.marker.setVisible(false);
    if(order?.kind==='openChest'){
      this.scene.treasureSystem.requestOpen(order.chest);
    } else if(order?.kind==='approachAnimal'){
      // Zvíře mohlo během cesty změnit polohu; dosah ověří HuntingSystem.
    } else if(order?.kind==='drop'){
      this.scene.dropSystem.collect(order.dropId,this.tile);
    } else if (order?.kind === 'enter') {
      this.climb(order.tower);
    } else if (order?.kind === 'collect' && this.scene.collectResource(order.pickupKey,this.tile)) {
      this.scene.setStatus(t('status.resourceCollected'));
    } else if (order?.pickupKey === tileKey(this.tile) && this.scene.collectStone(this.tile)) {
      this.scene.setStatus(t('status.stoneCollected'));
    } else {
      this.scene.setStatus(t('status.arrived'));
    }
  }

  setState(state) {
    this.state = state;
    this.scene.updateBuildingUI();
  }

  climb(tower) {
    // Animaci nelze spustit z dálky, z obsazeného políčka ani během kroku.
    if (!buildingIsComplete(tower)||!isRoofAccess(tower) || this.nextTile || !isWalkable(this.scene.map, this.tile.x, this.tile.y)
      || !roofAccessNeighbors(tower).some(tile => tileKey(tile) === tileKey(this.tile))) return;
    this.currentTower = tower;
    this.setState(PLAYER_STATE.ENTERING);
    this.sprite.setDepth(buildingDepth(tower) + 0.2);
    this.scene.setStatus(t('status.kingClimbingUp'));
    this.transitionTween=this.scene.tweens.add({
      targets: this.sprite, ...towerTop(tower), duration: 900, ease: 'Sine.InOut',
      onComplete: () => {this.completeClimb(tower);},
    });
  }

  completeClimb(tower){
    this.transitionTween=null;
    this.tile={x:tower.x,y:tower.y};this.position={x:tower.x+.5,y:tower.y+.5};this.path=[];this.nextTile=null;
    if(isWall(tower)){
      this.tile={x:tower.x,y:tower.y};this.position={x:tower.x+.5,y:tower.y+.5};this.path=[];this.nextTile=null;
      this.setState(PLAYER_STATE.ON_WALL);
      this.scene.setStatus(t('status.onWall'));
    }else{
      this.setState(PLAYER_STATE.ON_TOWER);
      this.scene.setStatus(t('status.onPlatform'));
    }
    const pending=this.roofOrder;this.roofOrder=null;if(pending)this.command(pending);
  }

  descend(exit) {
    this.exitTile = exit;
    this.setState(PLAYER_STATE.EXITING);
    this.scene.setStatus(t('status.kingClimbingDown'));
    this.transitionTween=this.scene.tweens.add({
      targets: this.sprite, ...tileCenter(exit), duration: 900, ease: 'Sine.InOut',
      onComplete: () => {this.completeDescent(exit);},
    });
  }

  completeDescent(exit){
    this.transitionTween=null;
    this.tile = exit;
    this.exitTile = null;
    this.position = { x: exit.x + 0.5, y: exit.y + 0.5 };
    this.currentTower = null;
    this.sprite.setDepth(groundDepthAbove(this.scene.buildings,{x:Math.floor(this.position.x),y:Math.floor(this.position.y)},this.sprite.y + this.depthOffset));
    this.setState(PLAYER_STATE.GROUND);
    if (this.path.length === 0) this.arrive();
    else this.scene.setStatus(t('status.kingDown'));
  }

  update(delta) {
    this.availableWorkMs=0;
    this.walking = false;
    if(this.state===PLAYER_STATE.ON_WALL){
      advanceMovement(this,delta);
      this.currentTower=this.wallAt(this.tile)??this.currentTower;
      const point=gridToWorld(this.position.x,this.position.y),center=tileCenter(this.currentTower),top=towerTop(this.currentTower),next=this.nextTile&&this.wallAt(this.nextTile);
      let offset={x:top.x-center.x,y:top.y-center.y};
      if(next){const nCenter=tileCenter(next),nTop=towerTop(next),distance=Math.hypot(this.nextTile.x-this.tile.x,this.nextTile.y-this.tile.y),fraction=Math.min(1,Math.hypot(this.position.x-this.tile.x-.5,this.position.y-this.tile.y-.5)/distance);offset={x:offset.x+(nTop.x-nCenter.x-offset.x)*fraction,y:offset.y+(nTop.y-nCenter.y-offset.y)*fraction};}
      this.sprite.setPosition(point.x+offset.x,point.y+offset.y).setDepth(buildingDepth(this.currentTower)+point.y-center.y+.2);
      if(!this.nextTile&&!this.path.length){this.walking=false;if(this.roofContinuation)this.finishRoofRoute();}
      return;
    }
    if (this.state !== PLAYER_STATE.GROUND) return;
    this.availableWorkMs=advanceMovement(this,delta);
    if(this.order?.explore&&!this.nextTile&&this.path.length&&!this.canEnterTile(this.path[0]))this.replanExplore();
    const projected = gridToWorld(this.position.x, this.position.y);
    this.sprite.setPosition(projected.x, projected.y);
    this.sprite.setDepth(groundDepthAbove(this.scene.buildings,{x:Math.floor(this.position.x),y:Math.floor(this.position.y)},this.sprite.y + this.depthOffset));
    if (!this.nextTile && this.path.length === 0 && this.scene.marker.visible) this.arrive();
  }
}
