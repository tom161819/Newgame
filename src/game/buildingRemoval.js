import { buildingDefinition,buildingIsComplete } from './buildings.js';
import { buildingDemolitionRefund } from '../data/demolition.js';

// Shared collision/render cleanup. Callers must first preserve contents and enforce their own removal policy.
// Starter Stockpile uses its empty-store policy; demolition uses completed physical Builder work.
export function removeBuildingShell(scene,building,{maximumWear=false}={}){
  if(!scene.buildings.includes(building)||building.type==='castle')return null;
  const tiles=building.tiles.map(t=>({...t}));scene.buildings.splice(scene.buildings.indexOf(building),1);
  for(const tile of tiles)scene.map[tile.y][tile.x]=scene.terrainGrid[tile.y][tile.x];
  scene.naturalResources?.mining.restoreTiles(tiles);
  scene.towerViews?.get(building.id)?.destroy();scene.towerViews?.delete(building.id);
  const key=`building:${building.id}`;if(scene.mapMemory?.objects.delete(key))scene.mapMemory.revision++;
  scene.mapMemory?.objectSignatures?.delete(key);
  if(maximumWear)scene.pathWear?.markMaximum(tiles);
  scene.terrain?.invalidateArea(tiles);return tiles;
}
const equal=(a,b)=>JSON.stringify(Object.entries(a).sort())===JSON.stringify(Object.entries(b).sort());
export function finishDemolition(scene,building,refund){
  const record=building?.demolition,d=building&&buildingDefinition(building),system=scene.demolition;
  if(!system?.eligible(building)||!buildingIsComplete(building)||!record||record.workDone<record.requiredWork||!equal(refund,record.refund)||!equal(refund,buildingDemolitionRefund(building,d))||system.roofBlocked(building))return false;
  const storage=scene.foodStorage,locations=[...storage.locations.values()].filter(l=>l.buildingId===building.id),ids=new Set(locations.map(l=>l.id));
  // A completed vehicle is a physical vehicle, never an ordinary resource refund or a deleted recipe buffer.
  scene.vehicles?.rollOut();
  if(locations.some(l=>Object.entries(l.stock).some(([resource,n])=>n>0&&['wheelbarrow','horse_wagon'].includes(resource))))return false;
  for(const order of [...(scene.military?.orders.values()??[])])if(order.barracksId===building.id)scene.military.cancel(order.id);
  for(const worker of scene.workerSystem.liveWorkers()){
    if(worker.assignedWorkplaceId===building.id){scene.stables?.cancel(worker);scene.military?.release(worker);scene.workplaceSystem.remove(worker);}
    const task=worker.workTask;
    if(task&&(ids.has(task.sourceId)||ids.has(task.destinationId)||task.targetId===building.id&&task.kind==='harvest'))scene.workerSystem.ai.cancel(worker);
  }
  const kingTask=scene.kingLogistics?.task;if(kingTask&&(ids.has(kingTask.sourceId)||ids.has(kingTask.destinationId)))scene.kingLogistics.cancel();
  scene.stables?.unreserveWorkshop(building.id);
  const tiles=removeBuildingShell(scene,building);if(!tiles)return false;
  // Clear the ground before preserving any stock, so even a full kingdom has a safe physical drop position.
  const origin={x:building.x,y:building.y};
  const production=scene.foodProduction?.records.get(building.id);if(production)scene.foodProduction.remove(production);
  // Reservations for another construction site keep their ownership when their source Warehouse disappears.
  for(const reservation of [...storage.reservations.values()])if(ids.has(reservation.locationId)&&reservation.kind==='stock'&&reservation.siteId!=null){
    const cargo=storage.take(reservation.id);if(!cargo)throw new Error('Cannot preserve committed construction stock.');
    scene.dropSystem.create(cargo.resource,origin,cargo.amount,null,{siteId:cargo.siteId,rewardRemaining:0,rewardUnits:0,haulEligible:false});
  }
  storage.removeBuilding(building);
  for(const record of scene.foodProduction?.records.values()??[]){
    if(record.cycle&&!storage.reservations.has(record.cycle.outputReservation))record.cycle.outputReservation=null;
    if(record.outputReservation&&!storage.reservations.has(record.outputReservation))record.outputReservation=null;
  }
  scene.workplaceSystem.records.delete(building.id);scene.workplaceSystem.changed(building.id);
  scene.stables?.removeBuilding(building);
  for(const [resource,amount]of Object.entries(refund)){
    storage.spill(resource,amount,origin);
    scene.resourceLedger?.income(resource,amount,'Demolition Refund',{id:`demolition-refund:${building.id}:${resource}`,entityId:building.id,type:'refund'});
  }
  scene.constructionSystem.materials.syncAreas();scene.refreshWallConnections?.();
  scene.events?.emit('buildings:changed');scene.updateInventory?.();return true;
}
