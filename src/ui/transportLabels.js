import { carryCapacity } from '../data/logistics.js';
export function storageName(scene,id){const location=scene.foodStorage.locations.get(id);if(!location)return 'Unavailable destination';const building=scene.buildings.find(b=>b.id===location.buildingId);return building?`${building.definition.name} #${building.id}${location.kind==='site'?' (construction)':location.kind==='input'?' input':location.kind==='output'?' output':''}`:id==='legacy-materials'?'Legacy Stockpile':'Camp Storage';}
export function cargoLabel(scene,actor){const cargo=actor.cargo;return `Cargo: ${cargo?`${cargo.amount} ${scene.objectRegistry.require(cargo.resource).name}`:'empty'} / ${carryCapacity(actor)}${cargo?.siteId!=null?` · ${storageName(scene,`site-${cargo.siteId}`)}`:''}`;}
export function transportLabel(scene,actor){
  const task=actor===scene.character?scene.kingLogistics.task:actor.workTask;
  if(!['foodPickup','foodDeliver','deposit','stockPickup','siteDeposit','withdraw'].includes(task?.kind))return actor.cargo?'Waiting for delivery':'No active delivery';
  const pickup=['foodPickup','stockPickup','withdraw'].includes(task.kind),drop=task.sourceDropId&&scene.dropSystem.drops.get(task.sourceDropId),source=drop?`Ground (${drop.tile.x}, ${drop.tile.y})`:storageName(scene,task.sourceId),destination=task.kind==='withdraw'?'King cargo':storageName(scene,task.destinationId);
  return `${pickup?'Collecting':'Delivering'} ${task.amount} ${scene.objectRegistry.require(task.resource).name} · ${pickup?`${source} → `:''}${destination}`;
}
