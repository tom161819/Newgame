import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete,buildingTiles,levelDefinition } from './buildings.js';
import { CASTLE_LEVELS,CASTLE_MAX_LEVEL,castleLevel } from '../data/castle.js';

// m-hrad-urovne (owner 15 Nov 2026): the Castle's upgrade. A bigger footprint needs free ground around (the Castle may
// grow to any side). Owner 15 Nov 2026 (61): the upgrade is paid when ordered and then built by Builders over the level's
// `work` (RepairSystem, `castle.upgrade`); the new level stands when the work is done. `paid`: the check at completion.
export function castleUpgradePlan(scene,castle,{paid=false}={}){
  if(castle?.type!=='castle'||!buildingIsComplete(castle))return {error:t('castle.upgradeUnavailable')};
  if(castle.upgrade&&!paid)return {next:castle.upgrade.level,rules:CASTLE_LEVELS[castle.upgrade.level],busy:true,error:t('castle.upgrading',{level:castle.upgrade.level,progress:Math.floor(castle.upgrade.progress??0)})};
  if(castle.repair&&!paid)return {error:t('castle.repairing')};
  const next=paid?castle.upgrade.level:castleLevel(castle)+1;if(next>CASTLE_MAX_LEVEL)return {error:t('castle.maxLevel'),max:true};
  const rules=CASTLE_LEVELS[next],d=levelDefinition(scene.objectRegistry.require('castle'),next),old=buildingDefinition(castle),grow=rules.size-old.width;
  const king=scene.character;if(king&&king.state!=='ground'&&king.currentTower===castle)return {next,rules,error:t('castle.kingInside')};
  const own=new Set(castle.tiles.map(p=>`${p.x},${p.y}`)),units=new Set();
  for(const u of [king,...(scene.workerSystem?.liveWorkers()??[]),...(scene.animalSystem?.animals.values()??[])])if(u?.isAlive!==false&&u?.tile)units.add(`${u.tile.x},${u.tile.y}`);
  const free=tile=>{const key=`${tile.x},${tile.y}`;if(own.has(key))return true;return scene.map[tile.y]?.[tile.x]===0&&!scene.resourceOccupancy?.has(key)&&!units.has(key)&&!scene.isFordTile?.(tile)&&!scene.buildings.some(b=>b!==castle&&b.tiles?.some(p=>p.x===tile.x&&p.y===tile.y));};
  // Shifts of the anchor, the most centred first.
  const shifts=[];for(let dy=0;dy<=grow;dy++)for(let dx=0;dx<=grow;dx++)shifts.push({dx,dy});const mid=grow/2;shifts.sort((a,b)=>Math.hypot(a.dx-mid,a.dy-mid)-Math.hypot(b.dx-mid,b.dy-mid));
  let anchor=null;for(const {dx,dy} of shifts){const a={x:castle.x-dx,y:castle.y-dy};if(buildingTiles(a,d).every(free)){anchor=a;break;}}
  if(!anchor)return {next,rules,error:t('castle.needsSpace',{from:`${old.width} × ${old.height}`,to:`${rules.size} × ${rules.size}`})};
  if(!paid&&!scene.inventory.canAfford(rules.cost))return {next,rules,anchor,error:t('status.noFunds')};
  return {next,rules,anchor,definition:d};
}
// Orders the upgrade: pays and hands the work to the Builders (RepairSystem). Without that system (tests of the old
// instant upgrade) the level stands at once.
export function upgradeCastle(scene,castle){
  const plan=castleUpgradePlan(scene,castle);if(plan.error)return plan;
  if(!scene.inventory.pay(plan.rules.cost,{source:'Castle Upgrade',entityId:castle.id}))return {...plan,error:t('status.noFunds')};
  if(scene.repairs?.requestUpgrade){scene.repairs.requestUpgrade(castle,plan);return {...plan,ordered:true};}
  return applyCastleLevel(scene,castle,plan);
}
// The new level stands: footprint, view, stores and memory follow.
export function applyCastleLevel(scene,castle,plan){
  const before=castle.tiles,d=plan.definition;
  for(const p of before)scene.map[p.y][p.x]=0;
  scene.towerViews?.get(castle.id)?.destroy();
  Object.assign(castle,{x:plan.anchor.x,y:plan.anchor.y,level:plan.next,definition:d,tiles:buildingTiles(plan.anchor,d)});delete castle.hp;delete castle.look;
  for(const p of castle.tiles)scene.map[p.y][p.x]=1;
  for(const l of scene.foodStorage?.locations.values()??[])if(l.buildingId===castle.id)Object.assign(l,{x:castle.x,y:castle.y,width:d.width,height:d.height});
  {const key=`building:${castle.id}`;if(scene.mapMemory?.objects.delete(key))scene.mapMemory.revision++;scene.mapMemory?.objectSignatures?.delete(key);}
  scene.terrain?.invalidateArea?.([...before,...castle.tiles]);
  if(scene.createBuildingView)scene.towerViews?.set(castle.id,scene.createBuildingView(d,castle));
  scene.fog?.update?.();scene.foodStorage?.changed?.();scene.events?.emit?.('buildings:changed');scene.updateInventory?.();scene.workerSystem?.updateUI?.();
  return {...plan,done:true};
}
