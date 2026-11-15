import { t } from '../i18n/index.js';
import { carryCapacity } from '../data/logistics.js';
export function storageName(scene,id){const location=scene.foodStorage.locations.get(id);if(!location)return t('transport.unavailable');const building=scene.buildings.find(b=>b.id===location.buildingId);return building?`${building.definition.name} #${building.id}${location.kind==='site'?` ${t('transport.site')}`:location.kind==='input'?` ${t('transport.input')}`:location.kind==='output'?` ${t('transport.output')}`:location.kind==='pile'?` ${t('transport.pile')}`:''}`:id==='legacy-materials'?t('transport.legacy'):t('transport.camp');}
export function cargoLabel(scene,actor){const cargo=actor.cargo;return `${t('transport.cargo',{load:cargo?`${cargo.amount} ${scene.objectRegistry.require(cargo.resource).name}`:t('transport.empty'),capacity:carryCapacity(actor,cargo?.resource)})}${cargo?.siteId!=null?` · ${storageName(scene,`site-${cargo.siteId}`)}`:''}`;}
export function transportLabel(scene,actor){
  const task=actor===scene.character?scene.kingLogistics.task:actor.workTask;
  if(!['foodPickup','foodDeliver','deposit','stockPickup','siteDeposit','withdraw'].includes(task?.kind))return t(actor.cargo?'transport.waiting':'transport.none');
  const pickup=['foodPickup','stockPickup','withdraw'].includes(task.kind),drop=task.sourceDropId&&scene.dropSystem.drops.get(task.sourceDropId),source=drop?t('transport.ground',{x:drop.tile.x,y:drop.tile.y}):storageName(scene,task.sourceId),destination=task.kind==='withdraw'?t('transport.kingCargo'):storageName(scene,task.destinationId);
  return `${t(pickup?'transport.collecting':'transport.delivering',{count:task.amount,resource:scene.objectRegistry.require(task.resource).name})} · ${pickup?`${source} → `:''}${destination}`;
}

// Point 57 (owner 15 Nov 2026): how a Hauler carries now – by hand, with a Wheelbarrow or a Horse Wagon.
export function haulerCarry(scene,worker){const v=scene.vehicles?.held?.(worker)??scene.vehicles?.reservedBy?.(worker);return t(v?.type==='horse_wagon'?'haul.carry.wagon':v?.type==='wheelbarrow'?'haul.carry.wheelbarrow':'haul.carry.hand');}
