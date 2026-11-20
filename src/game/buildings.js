import { isFertileGround,isFordGround } from '../data/worldTerrain.js';
import { currentRelief, tooSteep } from './terrainRelief.js';
import { availableFarm } from '../data/farmPlots.js';
import { t } from '../i18n/index.js';
import { dataName } from '../i18n/names.js';
import { isWalkable } from './map.js';
import { gridToWorld } from './isometric.js';
import { findPathToAny } from './pathfinding.js';
import { tileKey } from './stones.js';
import { objectRegistry } from '../systems/ObjectRegistry.js';
import { adjacentTiles } from './interaction.js';
import { buildingUnlockStatus } from '../systems/BuildingUnlockManager.js';
import { HOUSE_DECORATIONS } from '../data/children.js';
// Local wood for a campfire (kept here, not imported from the threat system, to avoid an import cycle).
export function campfireWood(scene,tile,range){
  for(const key of scene.bushes?.keys?.()??scene.bushes??[]){const [x,y]=String(key).split(',').map(Number);if(Math.hypot(x-tile.x,y-tile.y)<=range)return true;}
  for(const o of scene.naturalResources?.byId?.values?.()??[])if(o.definition?.tree&&Math.hypot(o.x-tile.x,o.y-tile.y)<=range)return true;
  return false;
}
export { buildingIsComplete } from './buildingState.js';
import { buildingIsComplete } from './buildingState.js';

const towerDefinition = () => objectRegistry.require('tower');
export const TOWER_COST = towerDefinition().cost.stone;
export const TOWER_SIZE = towerDefinition().width;
// Owner 13 Nov 2026 (Farmhouse 3 × 3 → 4 × 4): a type whose footprint grew keeps `legacyFootprint`. Buildings placed since
// carry `size` (= the new width); one without it (older saves) keeps the old footprint and shows the same art scaled down.
const legacyDefinitions=new WeakMap();
export function legacyDefinition(d){
  if(!legacyDefinitions.has(d)){
    const {width,height}=d.legacyFootprint,k=width/d.width,lv=d.legacyVisual;
    legacyDefinitions.set(d,Object.freeze({...d,width,height,legacy:true,visualHeight:Math.round((d.visualHeight??64)*k),
      ...(lv?{visual:{...(d.visual??{}),displayWidth:lv.displayWidth,displayHeight:lv.displayHeight}}:{}),
      ...(d.lights?{lights:d.lights.map(l=>({...l,x:l.x*k,y:l.y*k,radius:l.radius*k}))}:{}),
      ...(d.shadow?{shadow:{...d.shadow,width:d.shadow.width*k,height:d.shadow.height*k}}:{})}));
  }
  return legacyDefinitions.get(d);
}
// m-hrad-urovne: a building type with `levels` (the Castle) has a definition per level: footprint, look, income. A
// building without a level (older saves) keeps the type's own definition.
const levelDefinitions=new WeakMap();
export function levelDefinition(d,level){
  const rules=d?.levels?.[level];if(!rules)return d;let map=levelDefinitions.get(d);if(!map){map=new Map();levelDefinitions.set(d,map);}
  if(!map.has(level)){const art=d.artSprites?.[`l${level}`],{frontSprite,frontOrigin,platform,visibility,lights,shadow,...rest}=d;
    map.set(level,Object.freeze({...rest,level,width:rules.size,height:rules.size,cost:rules.cost,interactions:Object.freeze([]),renderer:'leveled',noFront:true,artLooks:Object.freeze([`l${level}`]),
      origin:art?.origin??d.origin,visualHeight:art?.visualHeight??d.visualHeight,visual:{},...(d.production?{production:{...d.production,amount:rules.income}}:{})}));}
  return map.get(level);
}
export const usesLegacyFootprint=(building,d)=>!!d?.legacyFootprint&&!!building&&building.size!==d.width;
export const withFootprint=(building,d)=>usesLegacyFootprint(building,d)?legacyDefinition(d):d;
export function definitionFor(building,registry,soft=false){
  const d=soft?registry.get?.(building.type):registry.require(building.type);if(!d||!building)return d;
  // A live building knows its footprint from its definition (legacy or not); the registry stays the source of the rest
  // (workplace capacities can be reconfigured at runtime). Save data has no definition: `size` decides.
  if(d.levels&&building.level)return levelDefinition(d,building.level);
  if(building.definition&&building.definition.id===d.id)return building.definition.legacy&&d.legacyFootprint?legacyDefinition(d):d;
  return withFootprint(building,d);
}
export const buildingDefinition = building => building.definition ?? withFootprint(building,objectRegistry.require(building.type ?? 'tower'));

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
// Owner 17 Nov 2026: a Tower is climbed only through its door; R turns it while placing (facing 0 S = grid y+, 1 E = x+,
// 2 N = y−, 3 W = x−). A Gate is climbed from its passage; a wall walk only from a Tower or a Gate joined to it.
export const DOOR_SIDES=Object.freeze(['S','E','N','W']);
export const towerDoorSide=building=>DOOR_SIDES[building.facing??0]??'S';
export function sideTiles(building,side){
  const {x,y}=building,{width,height}=buildingDefinition(building),out=[];
  if(side==='S'||side==='N')for(let i=0;i<width;i++)out.push({x:x+i,y:side==='S'?y+height:y-1});
  else for(let i=0;i<height;i++)out.push({x:side==='E'?x+width:x-1,y:y+i});
  return out;
}
const PLATFORMS=['tower','gate','wall_gate'];
const touches=(a,b)=>(a.tiles??[a]).some(t=>(b.tiles??[b]).some(u=>Math.abs(t.x-u.x)+Math.abs(t.y-u.y)===1));
// Ground tiles from which a building is climbed (and where one coming down steps off). Other buildings (the Castle)
// from any side; a wall (with the list of buildings) from the entries of the Towers and Gates touching it.
export function entryTiles(building,buildings=null){
  if(building.type==='tower')return sideTiles(building,towerDoorSide(building));
  if(building.type==='gate'||building.type==='wall_gate')return (building.tiles??[building]).map(t=>({x:t.x,y:t.y}));
  if(buildings&&buildingDefinition(building).navigation?.walkableTop)return buildings.filter(b=>PLATFORMS.includes(b.type)&&buildingIsComplete(b)&&touches(b,building)).flatMap(b=>entryTiles(b));
  return towerNeighbors(building);
}
export function towerBase(building) {
  const definition=buildingDefinition(building);
  return gridToWorld(building.x+definition.width,building.y+definition.height);
}
// Izometrické třídění: budova se řadí podle rohu (x+w,y+h); jednotka na dlaždici před čelní stěnou musí být nad ní.
export function groundDepthAbove(buildings,tile,depth){
  let result=depth;
  for(const b of buildings??[]){
    const d=buildingDefinition(b),w=d.width,h=d.height;
    const front=(tile.x>=b.x+w&&tile.y>=b.y&&tile.y<b.y+h+1)||(tile.y>=b.y+h&&tile.x>=b.x&&tile.x<b.x+w+1);
    if(front)result=Math.max(result,buildingDepth(b)+.05);
  }
  return result;
}
export function buildingDepth(building) { return towerBase(building).y+(buildingDefinition(building).depth?.offset??0); }
// Owner 20 Nov 2026 ("jednotky na věži překrývají texturu věže"): someone up on a wall, Tower or Gate is drawn above its
// back layer and below its front layer (+.3, the front merlons); on a Tower, Gate or Castle platform his offset (px,
// front = +) only orders the men up there among themselves.
// A wall tile keeps the plain screen order (a man stepping onto the tile behind still stands on this one's top).
export function elevatedDepth(building,offset=0){const d=buildingDefinition(building);return buildingDepth(building)+.2+(d.width>1||d.height>1?Math.max(-.08,Math.min(.08,offset*.002)):offset);}
// Owner 20 Nov 2026: while Space flattens the buildings, people on Towers, Gates, walls and the Castle stand on the
// ground plan (no lift: the unit is drawn on its own tile) instead of in the air.
export const FLAT_VIEW={on:false};
export function towerTop(building) {
  if(FLAT_VIEW.on)return gridToWorld(building.x+.5,building.y+.5);// = tileCenter: no lift over the ground
  const base=towerBase(building),platform=buildingDefinition(building).platform??{x:0,y:0};
  return {x:base.x+platform.x,y:base.y+platform.y};
}

export function placementError(map,anchor,resources,reservedTiles=[],definition=towerDefinition(),buildings=[],unlocks=null) {
  if(!definition.buildable||definition.category!=='building')return t('status.notBuildable');
  const status=unlocks?.status(definition)??buildingUnlockStatus(definition,buildings,objectRegistry);if(!status.unlocked)return status.description;
  const tiles=buildingTiles(anchor,definition);
  if(tiles.some(tile=>tile.x<0||tile.y<0||tile.y>=map.length||tile.x>=map[0].length))return t('status.insideMap');
  const natural=resources.naturalContext,special=natural?.mining.placementError(definition,anchor);if(special)return special;
  // m-staveni-zdi-studna (59): Stone Wall segments under a Gate or Tower are replaced, so their tiles count as the ground
  // beneath them (the terrain, or a tree/rock the plan may clear); only the King standing on such a segment blocks it.
  const walls=wallsReplacedBy(buildings,tiles,definition),under=new Set(walls.flatMap(b=>b.tiles.map(tileKey))),replaced=tile=>under.has(tileKey(tile));
  const terrain=natural?.scene?.terrainGrid,open=tile=>replaced(tile)?(terrain?.[tile.y]?.[tile.x]??0)===0:isWalkable(map,tile.x,tile.y);
  if(tiles.some(tile=>!open(tile)&&!natural?.mining.canBuildOver(definition,tile)))return t('status.needsTiles',{width:definition.width,height:definition.height});
  const king=natural?.scene?.character;if(king&&king.state!=='ground'&&walls.some(w=>w===king.currentTower||[king.tile,king.nextTile].some(p=>p&&replaced(p))))return t('status.wallReplaceKing');
  // #100: fields and orchards need grass; nothing grows on beach or desert sand.
  // Fishing R1: a Fisherman's Hut must touch water on at least one side (remembered water counts outside sight).
  // Since 0.32.0 a Fisherman's Hut may stand anywhere; its Fishers walk to the nearest reachable shore.
  // m-teren-vyska: buildings need nearly level ground; fields and orchards take a steeper slope.
  if(tooSteep(currentRelief(),tiles.filter(tile=>!replaced(tile)),definition))return t('status.tooSteep');
  const ground=natural?.scene?.groundGrid;if(definition.crop&&ground&&tiles.some(tile=>!isFertileGround(ground[tile.y]?.[tile.x])))return t('status.needsGrass');
  // World v2: nothing is built on a ford.
  if(ground&&tiles.some(tile=>isFordGround(ground[tile.y]?.[tile.x])))return t('status.notOnFord');
  // Day and night N3: a campfire needs local wood (a tree or a bush within 6 tiles).
  if(definition.campfire&&natural?.scene&&!campfireWood(natural.scene,{x:anchor.x,y:anchor.y},definition.campfire.woodRange))return t('campfire.noWood',{range:definition.campfire.woodRange});
  // Children D2: decorations stay off worn paths and paving; a Haystack only stands near a farm.
  // m-staveni-zdi-studna (61): a Well may stand anywhere buildable, paths and paving included.
  if(definition.decoration){
    const wear=natural?.scene?.pathWear;if(wear&&!['well','fountain'].includes(definition.decoration.kind)&&tiles.some(tile=>wear.isPaved(tile)||wear.level(tile)>=HOUSE_DECORATIONS.pathLevel))return t('status.notOnPath');
    const range=definition.decoration.farmRange;
    if(range&&!buildings.some(b=>HOUSE_DECORATIONS.haystack.farms.includes(b.type)&&Math.hypot(b.x+buildingDefinition(b).width/2-(anchor.x+.5),b.y+buildingDefinition(b).height/2-(anchor.y+.5))<=range))return t('status.needsFarmNearby',{range});
  }
  // Point 45 (owner 14 Nov 2026): goods lying on the ground do not block a blueprint; they are moved off it.
  const loose=tile=>String(resources.get?.(tileKey(tile))??'').startsWith('drop-');
  if(tiles.some(tile=>resources.has(tileKey(tile))&&!loose(tile)&&!natural?.mining.canBuildOver(definition,tile)))return t('status.resourceHere');
  if(tiles.some(tile=>!replaced(tile)&&reservedTiles.some(p=>tileKey(p)===tileKey(tile))))return t('status.unitHere');
  if(tiles.some(tile=>buildings.some(building=>!walls.includes(building)&&building.tiles.some(p=>tileKey(p)===tileKey(tile)))))return t('status.buildingHere');
  return natural?.mining.accessError(map,definition,anchor)??null;
}

// m-staveni-zdi-studna (59): the Stone Wall segments (planned or finished, never a Gate) a Gate or Tower footprint replaces.
export function wallsReplacedBy(buildings,tiles,definition){
  if(!definition.replacesWall)return [];const keys=new Set(tiles.map(tileKey));
  return buildings.filter(b=>b.type==='wall'&&b.tiles.some(p=>keys.has(tileKey(p))));
}
// Owner 13 Nov 2026 ("ať se při stavbě vždycky změní a postaví se jiná varianta"): a building type with several looks
// (definition.artLooks, e.g. the four House cottages) gives each new building the look after the one of the last
// building of that type placed, so neighbours never repeat. A saved building without a look keeps a stable one by id.
export function nextBuildingLook(definition,buildings){
  const looks=definition?.artLooks;if(!looks?.length)return null;
  const last=buildings.filter(b=>b.type===definition.id&&looks.includes(b.look)).reduce((a,b)=>!a||b.id>a.id?b:a,null);
  return looks[last?(looks.indexOf(last.look)+1)%looks.length:0];
}
export function buildingLook(definition,building){
  const looks=definition?.artLooks;if(!looks?.length||!building)return null;
  return looks.includes(building.look)?building.look:looks[(Number(building.id)||0)%looks.length];
}
// provisional: a blueprint outside sight, already validated by knownPlacementError; it claims no map tiles until verified.
// replaceWalls(walls,building): removes the replaced wall segments after payment and returns a settle() callback run once the
// new building stands (refunds). Without it a footprint over a wall is refused.
export function placeBuilding({map,anchor,stones,resources=stones,reservedTiles,inventory,buildings,definition=towerDefinition(),reserveMaterials=false,provisional=false,replaceWalls=null,fields=null}) {
  const error=provisional?null:placementError(map,anchor,resources,reservedTiles,definition,buildings);
  if(error)return {error};
  const walls=wallsReplacedBy(buildings,buildingTiles(anchor,definition),definition);if(walls.length&&!replaceWalls)return {error:t('status.buildingHere')};
  const construction=inventory.storage?.scene.constructionSystem,materials=reserveMaterials&&construction?.materials.enabled?construction.materials:null;
  const building={id:Math.max(buildings.reduce((n,b)=>Math.max(n,b.id),0)+1,materials?construction.nextId:1),type:definition.id,definition,x:anchor.x,y:anchor.y,tiles:buildingTiles(anchor,definition),...(fields??{})};
  if(definition.crop)building.farmId=availableFarm(building,buildings,buildingDefinition)?.id??null;
  const look=nextBuildingLook(definition,buildings);if(look)building.look=look;
  if(definition.legacyFootprint&&!definition.legacy)building.size=definition.width;
  if(definition.level)building.level=definition.level;
  if(!(materials?materials.prepare(building):inventory.pay(definition.cost,{source:`${dataName(definition)} Construction`,entityId:building.id})))return {error:t('status.noFunds')};
  const settle=walls.length?replaceWalls(walls,building):null,replaced=walls.length?{replaced:walls}:{};
  if(provisional){building.unverified=true;buildings.push(building);if(definition.id==='quarry')building.quarryMode='unbound';const refund=settle?.();return {building,...replaced,...(refund?{refund}:{})};}
  for(const tile of building.tiles)map[tile.y][tile.x]=definition.walkable?0:1;
  buildings.push(building);
  if(resources.naturalContext){resources.naturalContext.mining.bind(building);resources.naturalContext.topologyRevision++;}else if(definition.id==='quarry')building.quarryMode=reserveMaterials?'unbound':'legacy';
  const refund=settle?.();return {building,...replaced,...(refund?{refund}:{})};
}
export function placeTower(options) {
  const result=placeBuilding({...options,definition:towerDefinition()});
  return result.error?result:{tower:result.building};
}

export function approachTower(map,start,building,options) { return findPathToAny(map,start,entryTiles(building,options?.buildings),options); }
export function planGroundOrder(map,start,order,options) {
  if(order.kind==='approachAnimal')return findPathToAny(map,start,adjacentTiles(order.animal,map),options);
  if(order.kind==='enter')return approachTower(map,start,order.tower,options);
  if(order.kind==='collect')return approachTower(map,start,order.resource,options);
  if(order.kind==='openChest')return approachTower(map,start,order.chest,options);
  return findPathToAny(map,start,[order.goal],options);
}
export function planTowerExit(map,building,order,options) {
  let best=null;
  for(const exit of entryTiles(building,options?.buildings)){
    if(!isWalkable(map,exit.x,exit.y))continue;
    const route=planGroundOrder(map,exit,order,options);
    if(route&&(!best||route.cost<best.cost))best={...route,exit};
  }
  return best;
}
