import { buildingIsComplete,towerNeighbors } from './buildings.js';
import { removeBuildingShell } from './buildingRemoval.js';
import { paidCost,refundOf } from '../data/demolition.js';
import { isWalkable } from './map.js';

// m-staveni-zdi-studna (59): a Gate or Tower placed over Stone Wall segments replaces them. A planned segment is
// cancelled by the ordinary site rules (its booked materials come back); a finished one is removed at once and gives back
// the demolition refund (half of what the replaced segments really cost, rounded down, summed per placement).
// Returns settle(), run once the new building stands: it pays the refund beside it, refreshes the wall joints and returns it.
export function replaceWalls(scene,walls,building){
  const paid={};
  for(const wall of walls){
    if(!scene.buildings.includes(wall))continue;
    if(!buildingIsComplete(wall)){
      if(scene.constructionSystem?.cancel(wall))continue;
      scene.buildings.splice(scene.buildings.indexOf(wall),1);scene.towerViews?.get(wall.id)?.destroy();scene.towerViews?.delete(wall.id);
      if(!wall.unverified)for(const tile of wall.tiles)scene.map[tile.y][tile.x]=scene.terrainGrid?.[tile.y]?.[tile.x]??0;continue;
    }
    scene.demolition?.cancel(wall.id);
    for(const [id,n]of Object.entries(paidCost(wall,wall.definition??{cost:{}})))paid[id]=(paid[id]??0)+n;
    removeBuildingShell(scene,wall);
  }
  const refund=refundOf(paid);
  return ()=>{
    const origin=towerNeighbors(building).find(tile=>isWalkable(scene.map,tile.x,tile.y))??{x:building.x,y:building.y};
    for(const [resource,amount]of Object.entries(refund)){
      const details={id:`wall-replace-refund:${building.id}:${resource}`,entityId:building.id,type:'refund'};
      if(!scene.foodStorage){scene.inventory.add(resource,amount,{source:'Demolition Refund',...details});continue;}
      scene.foodStorage.spill(resource,amount,origin);scene.resourceLedger?.income(resource,amount,'Demolition Refund',details);
    }
    moveDropsOff(scene,building);scene.refreshWallConnections?.();scene.events?.emit?.('buildings:changed');return refund;
  };
}

// A cancelled planned segment leaves its returned materials on its own tile, which the new building now covers: move them
// to the nearest open tile beside it (same id, ownership and rewards).
function moveDropsOff(scene,building){
  const system=scene.dropSystem;if(!system)return;const covered=new Set(building.tiles.map(t=>`${t.x},${t.y}`));
  for(const drop of [...system.drops.values()]){
    if(!covered.has(`${drop.tile.x},${drop.tile.y}`))continue;let target=null;
    for(let r=1;r<=12&&!target;r++)for(let dy=-r;dy<=r&&!target;dy++)for(let dx=-r;dx<=r&&!target;dx++){
      const tile={x:drop.tile.x+dx,y:drop.tile.y+dy};if(!covered.has(`${tile.x},${tile.y}`)&&isWalkable(scene.map,tile.x,tile.y))target=tile;
    }
    if(!target)continue;system.drops.delete(drop.id);drop.view?.destroy();system.refreshOccupancy(drop.tile);
    const moved=system.create(drop.resource,target,drop.amount,drop.id,{rewardRemaining:drop.rewardRemaining,rewardUnits:drop.rewardUnits,haulEligible:drop.haulEligible!==false,siteId:drop.siteId??null});
    if(scene.character?.order?.dropId===drop.id)scene.character.order.dropId=moved.id;
  }
}
