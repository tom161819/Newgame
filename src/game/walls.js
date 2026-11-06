import { findPathToAny } from './pathfinding.js';
import { tileCenter } from './isometric.js';
import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete,placementError,buildingTiles,planTowerExit,towerNeighbors,roofAccessNeighbors,towerTop } from './buildings.js';
import { tileKey } from './stones.js';

export const WALL_DIRECTIONS=Object.freeze([{name:'N',x:0,y:-1},{name:'E',x:1,y:0},{name:'S',x:0,y:1},{name:'W',x:-1,y:0}]);
export const isWall=building=>buildingDefinition(building).navigation?.walkableTop===true;
export const isRoofAccess=b=>buildingDefinition(b).navigation?.roofAccess===true||!isWall(b)&&buildingDefinition(b).interactions?.includes('enter');
export function roofCells(building){
  const d=buildingDefinition(building);if(d.width===1&&d.height===1)return [building];
  const top=towerTop(building),center=tileCenter(building),definition={...d,width:1,height:1,navigation:{...d.navigation,walkableTop:true},platform:{x:top.x-center.x,y:top.y-center.y}};
  return building.tiles.map(tile=>({...building,...tile,tiles:[tile],definition,roofOwnerId:building.id}));
}
export const wallIndex=(buildings,includeUnfinished=false)=>new Map(buildings.filter(b=>isWall(b)&&(includeUnfinished||buildingIsComplete(b))).flatMap(roofCells).map(b=>[tileKey(b),b]));
export const roofIndex=buildings=>new Map(buildings.filter(b=>(isWall(b)||isRoofAccess(b))&&buildingIsComplete(b)).flatMap(roofCells).map(b=>[tileKey(b),b]));

export function wallLine(start,end){
  const dx=end.x-start.x,dy=end.y-start.y,horizontal=Math.abs(dx)>=Math.abs(dy);
  const length=Math.abs(horizontal?dx:dy),step=Math.sign(horizontal?dx:dy),tiles=[];
  for(let i=0;i<=length;i++)tiles.push({x:start.x+(horizontal?i*step:0),y:start.y+(horizontal?0:i*step)});
  return tiles;
}
export function connectionsFor(index,building){
  return Object.fromEntries(WALL_DIRECTIONS.map(d=>[d.name,index.has(tileKey({x:building.x+d.x,y:building.y+d.y}))]));
}
export function wallLinePlan({map,tiles,resources,reservedTiles=[],buildings,definition,inventory}){
  const existing=wallIndex(buildings,true),fresh=tiles.filter(tile=>!existing.has(tileKey(tile)));
  if(!fresh.length)return {error:t('status.wallExists'),tiles:[],cost:{}};
  for(const tile of fresh){const error=placementError(map,tile,resources,reservedTiles,definition,buildings);if(error)return {error,tiles:fresh,cost:{}};}
  const cost=Object.fromEntries(Object.entries(definition.cost).map(([id,amount])=>[id,amount*fresh.length]));
  if(!inventory.canAfford(cost))return {error:t('status.wallNoFunds'),tiles:fresh,cost};
  return {tiles:fresh,cost,error:null};
}
export function placeWallLine(options){
  const plan=wallLinePlan(options);if(plan.error)return plan;
  const construction=options.inventory.storage?.scene.constructionSystem,materials=options.reserveMaterials&&construction?.materials.enabled?construction.materials:null;
  if(!materials&&!options.inventory.pay(plan.cost))return {...plan,error:t('status.wallNoFunds')};
  const {buildings,map,definition}=options,created=[];
  let id=Math.max(buildings.reduce((n,b)=>Math.max(n,b.id),0)+1,materials?construction.nextId:1);
  for(const tile of plan.tiles){
    const building={...tile,id:id++,type:definition.id,definition,tiles:buildingTiles(tile,definition)};
    if(materials&&!materials.prepare(building)){for(const prepared of created)materials.discardPrepared(prepared);return {...plan,error:t('status.wallNoFunds')};}created.push(building);
  }
  // provisional: segments outside sight claim no tiles until each one is seen (ConstructionSystem.verifyProvisional).
  for(const building of created){if(options.provisional)building.unverified=true;else map[building.y][building.x]=definition.walkable?0:1;buildings.push(building);}
  return {...plan,buildings:created};
}

function roofTree(buildings,start){
  const index=roofIndex(buildings),first=tileKey(start),parents=new Map(),distances=new Map(),queue=[];
  if(index.has(first)){parents.set(first,null);distances.set(first,0);queue.push(first);}
  for(let i=0;i<queue.length;i++){
    const key=queue[i],building=index.get(key);if(!building)continue;
    for(const d of WALL_DIRECTIONS){const next=tileKey({x:building.x+d.x,y:building.y+d.y});
      if(index.has(next)&&!parents.has(next)){parents.set(next,key);distances.set(next,distances.get(key)+1);queue.push(next);}
    }
  }
  return {index,parents,distances};
}
function reconstruct(tree,end){
  const result=[];for(let key=tileKey(end);tree.parents.get(key)!==null;key=tree.parents.get(key))result.push(tree.index.get(key));
  return result.reverse();
}
export function connectedWalls(buildings,start){const tree=roofTree(buildings,start);return [...tree.parents.keys()].map(key=>tree.index.get(key)).filter(Boolean);}
export function findRoofPath(buildings,start,end){
  if(!start||!end)return null;
  const tree=roofTree(buildings,start);return tree.parents.has(tileKey(end))?reconstruct(tree,end):null;
}
export function planGroundRoofEntry(map,buildings,start,target,options){
  let best=null;
  for(const access of buildings.filter(b=>isRoofAccess(b)&&buildingIsComplete(b))){
    const roofPath=findRoofPath(buildings,access,target);if(roofPath===null)continue;
    const route=findPathToAny(map,start,roofAccessNeighbors(access),options);if(!route)continue;
    const totalCost=route.cost+roofPath.length;
    if(!best||totalCost<best.totalCost)best={...route,totalCost,access};
  }
  return best;
}
export function planRoofExit(map,buildings,start,order,options){
  const tree=roofTree(buildings,start);let best=null;
  for(const access of buildings.filter(b=>isRoofAccess(b)&&buildingIsComplete(b))){
    const key=tileKey(access),roofCost=tree.distances.get(key);if(roofCost==null)continue;
    const route=planTowerExit(map,access,order,options);if(!route)continue;
    const totalCost=roofCost+route.cost;
    if(!best||totalCost<best.totalCost)best={...route,totalCost,accessId:access.id,wall:tree.index.get(key),roofPath:reconstruct(tree,access)};
  }
  return best;
}
export function roofAccessOrigins(buildings,start){
  const tree=roofTree(buildings,start);
  return buildings.filter(b=>isRoofAccess(b)&&buildingIsComplete(b)&&tree.parents.has(tileKey(b))).flatMap(roofAccessNeighbors);
}
