import { PLAYER_START } from '../game/config.js';
import { placementError,buildingTiles,towerNeighbors } from '../game/buildings.js';
import { findPathToAny,reachableTiles } from '../game/pathfinding.js';

// Volá se pouze při New Game, před rozmístěním surovin a jednotek.
export function createStartingCastle(scene,start=PLAYER_START){
  if(!scene.gameSettings.startingCastle)return null;
  const definition=scene.objectRegistry.require('castle'),candidates=[];
  for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++)candidates.push({x:start.x+dx,y:start.y+dy});
  candidates.sort((a,b)=>Math.hypot(a.x+1.5-start.x-.5,a.y+1.5-start.y-.5)-Math.hypot(b.x+1.5-start.x-.5,b.y+1.5-start.y-.5));
  for(const anchor of candidates){
    if(placementError(scene.map,anchor,scene.resourceOccupancy,[start],definition,scene.buildings))continue;
    const building={id:Math.max(0,...scene.buildings.map(b=>b.id))+1,type:definition.id,definition,...anchor,tiles:buildingTiles(anchor,definition)};
    for(const t of building.tiles)scene.map[t.y][t.x]=1;
    if(!findPathToAny(scene.map,start,towerNeighbors(building))){for(const t of building.tiles)scene.map[t.y][t.x]=0;continue;}
    scene.buildings.push(building);scene.towerViews.set(building.id,scene.createBuildingView(definition,building));return building;
  }
  throw new Error('Poblíž krále není dostupné místo pro počáteční hrad.');
}

export function createStartingStockpile(scene,start=PLAYER_START){
  const definition=scene.objectRegistry.require('starter_stockpile'),castle=scene.buildings.find(b=>b.type==='castle'),origin=castle?{x:castle.x+1,y:castle.y+1}:start,candidates=[];
  const reachable=reachableTiles(scene.map,[start]).length;
  for(let dy=-12;dy<=12;dy++)for(let dx=-12;dx<=12;dx++)candidates.push({x:start.x+dx,y:start.y+dy});
  candidates.sort((a,b)=>Math.hypot(a.x+1-origin.x,a.y+1-origin.y)-Math.hypot(b.x+1-origin.x,b.y+1-origin.y));
  for(const anchor of candidates){
    if(placementError(scene.map,anchor,scene.resourceOccupancy,[start],{...definition,buildable:true},scene.buildings))continue;
    const building={id:Math.max(0,...scene.buildings.map(b=>b.id))+1,type:definition.id,definition,...anchor,tiles:buildingTiles(anchor,definition)};
    for(const t of building.tiles)scene.map[t.y][t.x]=1;
    if(!findPathToAny(scene.map,start,towerNeighbors(building))||reachableTiles(scene.map,[start]).length<reachable-4){for(const t of building.tiles)scene.map[t.y][t.x]=0;continue;}
    scene.buildings.push(building);scene.towerViews.set(building.id,scene.createBuildingView(definition,building));return building;
  }
  throw new Error('Poblíž krále není dostupné místo pro počáteční skladiště.');
}
