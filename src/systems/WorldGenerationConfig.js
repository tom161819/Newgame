import { PLAYER_START } from '../game/config.js';
import { isWalkable,tileCenter } from '../game/map.js';
import { levelDefinition, placementError,buildingTiles,towerNeighbors,buildingDefinition } from '../game/buildings.js';
import { findPathToAny,reachableTiles } from '../game/pathfinding.js';
import { STARTING_RESOURCES } from './GameSettings.js';

// Volá se pouze při New Game, před rozmístěním surovin a jednotek.
export function createStartingCastle(scene,start=PLAYER_START){
  if(!scene.gameSettings.startingCastle)return null;
  // m-hrad-urovne: the starting Castle is level 1 (the thatched hall on 4 × 4).
  const definition=levelDefinition(scene.objectRegistry.require('castle'),1),candidates=[];
  for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++)candidates.push({x:start.x+dx,y:start.y+dy});
  candidates.sort((a,b)=>Math.hypot(a.x+1.5-start.x-.5,a.y+1.5-start.y-.5)-Math.hypot(b.x+1.5-start.x-.5,b.y+1.5-start.y-.5));
  for(const anchor of candidates){
    if(placementError(scene.map,anchor,scene.resourceOccupancy,[start],definition,scene.buildings))continue;
    const building={id:Math.max(0,...scene.buildings.map(b=>b.id))+1,type:definition.id,definition,...anchor,tiles:buildingTiles(anchor,definition),...(definition.level?{level:definition.level}:{})};
    for(const t of building.tiles)scene.map[t.y][t.x]=1;
    if(!findPathToAny(scene.map,start,towerNeighbors(building))){for(const t of building.tiles)scene.map[t.y][t.x]=0;continue;}
    scene.buildings.push(building);scene.towerViews.set(building.id,scene.createBuildingView(definition,building));return building;
  }
  throw new Error('Poblíž krále není dostupné místo pro počáteční hrad.');
}

export function createStartingStockpile(scene,start=PLAYER_START){
  const definition=scene.objectRegistry.require('starter_stockpile'),castle=scene.buildings.find(b=>b.type==='castle'),cd=castle?buildingDefinition(castle):null,origin=castle?{x:castle.x+(cd.width-1)/2+1.5,y:castle.y+cd.height+1}:start,candidates=[];
  const reachable=reachableTiles(scene.map,[start]).length;
  for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++)candidates.push({x:start.x+dx,y:start.y+dy});
  // Před hradem ve směru kamery (větší x+y); zbytek jen jako deterministická záloha.
  const frontSum=castle?castle.x+castle.y+cd.width+cd.height-1:-Infinity,isFront=a=>a.x+a.y>=frontSum;
  candidates.sort((a,b)=>(isFront(b)-isFront(a))||Math.hypot(a.x+1-origin.x,a.y+1-origin.y)-Math.hypot(b.x+1-origin.x,b.y+1-origin.y)||a.y-b.y||a.x-b.x);
  for(const anchor of candidates){
    if(placementError(scene.map,anchor,scene.resourceOccupancy,[start],{...definition,buildable:true},scene.buildings))continue;
    // Owner 15 Nov 2026 (60): at least STARTER_STOCKPILE_GAP free tiles between the stockpile and the Castle, so a
    // later, bigger Castle level has room.
    if(castle&&tileGap(anchor,definition,castle,cd)<STARTER_STOCKPILE_GAP)continue;
    const building={id:Math.max(0,...scene.buildings.map(b=>b.id))+1,type:definition.id,definition,...anchor,tiles:buildingTiles(anchor,definition)};
    for(const t of building.tiles)scene.map[t.y][t.x]=1;
    if(!findPathToAny(scene.map,start,towerNeighbors(building))||reachableTiles(scene.map,[start]).length<reachable-4){for(const t of building.tiles)scene.map[t.y][t.x]=0;continue;}
    scene.buildings.push(building);scene.towerViews.set(building.id,scene.createBuildingView(definition,building));return building;
  }
  throw new Error('Poblíž krále není dostupné místo pro počáteční skladiště.');
}

export const STARTER_STOCKPILE_GAP=2;
// Free tiles between two footprints along the grid (0 = touching, also diagonally).
export function tileGap(a,ad,b,bd){
  const gx=Math.max(b.x-(a.x+ad.width),a.x-(b.x+bd.width),-1),gy=Math.max(b.y-(a.y+ad.height),a.y-(b.y+bd.height),-1);
  return Math.max(gx,gy,0);
}
// Owner 15 Nov 2026 (62): the King starts in front of the Castle (towards the camera: larger x+y) instead of behind it.
// The nearest free, reachable tile to the middle of the Castle's front; the start tile when there is none.
export function kingStartTile(scene,start=PLAYER_START){
  const castle=scene.buildings.find(b=>b.type==='castle');if(!castle)return start;
  // In front = on the camera side (+x or +y of the footprint); the aim is just past the bottom corner, below the Castle on screen.
  const cd=buildingDefinition(castle),front={x:castle.x+cd.width+1,y:castle.y+cd.height+1},inFront=(x,y)=>x>=castle.x+cd.width||y>=castle.y+cd.height;
  const taken=new Set(scene.buildings.flatMap(b=>b.tiles??[]).map(t=>`${t.x},${t.y}`)),reach=new Set(reachableTiles(scene.map,[start]).map(t=>`${t.x},${t.y}`));
  let best=null,bestD=Infinity;
  for(let y=castle.y-2;y<=castle.y+cd.height+6;y++)for(let x=castle.x-2;x<=castle.x+cd.width+6;x++){
    if(!inFront(x,y)||!isWalkable(scene.map,x,y)||taken.has(`${x},${y}`)||!reach.has(`${x},${y}`))continue;
    const d=Math.hypot(x+.5-front.x,y+.5-front.y);if(d<bestD){bestD=d;best={x,y};}
  }
  return best??start;
}
export function placeKingInFront(scene){
  const king=scene.character;if(!king)return null;const tile=kingStartTile(scene,king.tile);
  king.tile={...tile};king.position={x:tile.x+.5,y:tile.y+.5};king.path=[];king.nextTile=null;
  const p=tileCenter(tile);king.sprite?.setPosition?.(p.x,p.y);return tile;
}

// New Game only, once: the chosen starting goods go physically into the Starter
// Stockpile through the ordinary storage deposit (settings already cap the total).
export function depositStartingResources(scene){
  const starter=scene.buildings.find(b=>b.type==='starter_stockpile'),id=starter&&`stockpile-${starter.id}`;
  for(const [key,resource]of Object.entries(STARTING_RESOURCES)){
    const amount=scene.gameSettings?.[key]??0;if(!amount)continue;
    if(!id||!scene.foodStorage?.deposit(id,resource,amount))throw new Error(`Starting ${resource} does not fit the Starter Stockpile.`);
  }
}
