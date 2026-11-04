import { isWalkable } from './map.js';
import { gridToWorld } from './isometric.js';
import { findPathToAny } from './pathfinding.js';
import { tileKey } from './stones.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { adjacentTiles } from './interaction.js';
import { buildingUnlockStatus } from '../systems/BuildingUnlockManager.js';
export { buildingIsComplete } from './buildingState.js';

const towerDefinition = () => objectRegistry.require('tower');
export const TOWER_COST = towerDefinition().cost.stone;
export const TOWER_SIZE = towerDefinition().width;
export const buildingDefinition = building => building.definition ?? objectRegistry.require(building.type ?? 'tower');

export function buildingTiles({x,y},definition) {
  const tiles=[];
  for(let dy=0;dy<definition.height;dy++)for(let dx=0;dx<definition.width;dx++)tiles.push({x:x+dx,y:y+dy});
  return tiles;
}
export function towerTiles(anchor) { return buildingTiles(anchor,towerDefinition()); }

export function towerNeighbors(building) {
  const {x,y}=building,{width,height}=buildingDefinition(building),neighbors=[];
  for(let dx=0;dx<width;dx++)neighbors.push({x:x+dx,y:y+height},{x:x+dx,y:y-1});
  for(let dy=0;dy<height;dy++)neighbors.push({x:x-1,y:y+dy},{x:x+width,y:y+dy});
  return neighbors;
}
export function towerBase(building) {
  const definition=buildingDefinition(building);
  return gridToWorld(building.x+definition.width,building.y+definition.height);
}
export function buildingDepth(building) { return towerBase(building).y+(buildingDefinition(building).depth?.offset??0); }
export function towerTop(building) {
  const base=towerBase(building),platform=buildingDefinition(building).platform??{x:0,y:0};
  return {x:base.x+platform.x,y:base.y+platform.y};
}

export function placementError(map,anchor,resources,reservedTiles=[],definition=towerDefinition(),buildings=[],unlocks=null) {
  if(!definition.buildable||definition.category!=='building')return 'Tento objekt není určený ke stavbě.';
  const status=unlocks?.status(definition)??buildingUnlockStatus(definition,buildings,objectRegistry);if(!status.unlocked)return status.description;
  const tiles=buildingTiles(anchor,definition);
  if(tiles.some(tile=>tile.x<0||tile.y<0||tile.y>=map.length||tile.x>=map[0].length))return 'Budova musí zůstat uvnitř mapy.';
  const natural=resources.naturalContext,special=natural?.mining.placementError(definition,anchor);if(special)return special;
  if(tiles.some(tile=>!isWalkable(map,tile.x,tile.y)&&!natural?.mining.canBuildOver(definition,tile)))return `Budova potřebuje ${definition.width} × ${definition.height} volných políček uvnitř mapy.`;
  if(tiles.some(tile=>resources.has(tileKey(tile))&&!natural?.mining.canBuildOver(definition,tile)))return 'Na tomto místě leží surovina.';
  if(tiles.some(tile=>reservedTiles.some(p=>tileKey(p)===tileKey(tile))))return 'Tady stojí král nebo zvíře, případně právě dokončuje krok.';
  if(tiles.some(tile=>buildings.some(building=>building.tiles.some(p=>tileKey(p)===tileKey(tile)))))return 'Tady už stojí budova.';
  return natural?.mining.accessError(map,definition,anchor)??null;
}

export function placeBuilding({map,anchor,stones,resources=stones,reservedTiles,inventory,buildings,definition=towerDefinition(),reserveMaterials=false}) {
  const error=placementError(map,anchor,resources,reservedTiles,definition,buildings);
  if(error)return {error};
  const construction=inventory.storage?.scene.constructionSystem,materials=reserveMaterials&&construction?.materials.enabled?construction.materials:null;
  const building={id:Math.max(buildings.reduce((n,b)=>Math.max(n,b.id),0)+1,materials?construction.nextId:1),type:definition.id,definition,x:anchor.x,y:anchor.y,tiles:buildingTiles(anchor,definition)};
  if(!(materials?materials.prepare(building):inventory.pay(definition.cost)))return {error:'Na tuto budovu nemáš dostatek surovin.'};
  for(const tile of building.tiles)map[tile.y][tile.x]=definition.walkable?0:1;
  buildings.push(building);
  if(resources.naturalContext){resources.naturalContext.mining.bind(building);resources.naturalContext.topologyRevision++;}else if(definition.id==='quarry')building.quarryMode=reserveMaterials?'unbound':'legacy';
  return {building};
}
export function placeTower(options) {
  const result=placeBuilding({...options,definition:towerDefinition()});
  return result.error?result:{tower:result.building};
}

export function approachTower(map,start,building,options) { return findPathToAny(map,start,towerNeighbors(building),options); }
export function planGroundOrder(map,start,order,options) {
  if(order.kind==='approachAnimal')return findPathToAny(map,start,adjacentTiles(order.animal,map),options);
  if(order.kind==='enter')return approachTower(map,start,order.tower,options);
  if(order.kind==='collect')return approachTower(map,start,order.resource,options);
  if(order.kind==='openChest')return approachTower(map,start,order.chest,options);
  return findPathToAny(map,start,[order.goal],options);
}
export function planTowerExit(map,building,order,options) {
  let best=null;
  for(const exit of towerNeighbors(building)){
    if(!isWalkable(map,exit.x,exit.y))continue;
    const route=planGroundOrder(map,exit,order,options);
    if(route&&(!best||route.cost<best.cost))best={...route,exit};
  }
  return best;
}
