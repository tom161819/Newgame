import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete,buildingTiles,placeBuilding,placementError } from './buildings.js';
const tileKey=({x,y})=>`${x},${y}`;

// Owner 15 Nov 2026 (59): "Move" a finished building. The player places its blueprint elsewhere – it may overlap the
// building being moved – for half the materials of a new one. Builders dismantle the old building (no refund) and build
// it at the new spot. `building.relocation` = {x, y[, siteId]} on the old building while its demolition runs: with
// `siteId` the new site already stands (it does not overlap); without it the site is placed once the old one is gone.
export const RELOCATION_SHARE=.5;
const NOT_MOVABLE=new Set(['castle','starter_stockpile','wall','wall_gate','gate','tower','burnt_ruins']);
export const relocationCost=cost=>Object.fromEntries(Object.entries(cost??{}).map(([id,n])=>[id,Math.ceil(n*RELOCATION_SHARE)]).filter(([,n])=>n>0));
// The definition the blueprint is placed with: the same building at half its price (the site books that price).
export const relocationDefinition=building=>{const d=buildingDefinition(building);return {...d,cost:relocationCost(d.cost),relocation:true};};
export function canRelocate(scene,building){
  if(!building||!scene.buildings.includes(building)||!buildingIsComplete(building)||building.demolition||building.repair||building.upgrade||building.relocation)return false;
  const d=buildingDefinition(building);if(NOT_MOVABLE.has(building.type)||d.crop||d.pavement||!d.buildable)return false;
  return scene.demolition?.eligible(building)??false;
}
const overlaps=(building,anchor,d)=>{const own=new Set(building.tiles.map(tileKey));return buildingTiles(anchor,d).some(p=>own.has(tileKey(p)));};
// The placement check with the moved building's own tiles counted as free ground.
export function relocationError(scene,building,anchor){
  const d=relocationDefinition(building),own=building.tiles,saved=own.map(p=>scene.map[p.y][p.x]);
  for(const p of own)scene.map[p.y][p.x]=scene.terrainGrid?.[p.y]?.[p.x]??0;
  try{
    const others=scene.buildings.filter(b=>b!==building);
    const ownKeys=new Set(own.map(tileKey)),reserved=(scene.placementReserved?.()??[]).filter(p=>!ownKeys.has(tileKey(p)));
    const error=placementError(scene.map,anchor,scene.resourceOccupancy,reserved,d,others,null);
    if(error)return error;
    if(anchor.x===building.x&&anchor.y===building.y)return t('relocation.samePlace');
    if(!scene.inventory.canAfford(d.cost))return t('status.noFunds');
    return null;
  }finally{own.forEach((p,i)=>{scene.map[p.y][p.x]=saved[i];});}
}
// Orders the move; returns {error} or {building, site?}.
export function orderRelocation(scene,building,anchor){
  if(!canRelocate(scene,building))return {error:t('relocation.unavailable')};
  const error=relocationError(scene,building,anchor);if(error)return {error};
  const d=relocationDefinition(building);let site=null;
  if(!overlaps(building,anchor,d)){site=placeSite(scene,anchor,d);if(site.error)return site;site=site.building;}
  building.relocation={x:anchor.x,y:anchor.y,...(site?{siteId:site.id}:{})};
  if(!scene.demolition.request(building)){delete building.relocation;if(site)scene.constructionSystem?.cancel?.(site);return {error:t('relocation.unavailable')};}
  return {building,site};
}
function placeSite(scene,anchor,d){
  const result=placeBuilding({map:scene.map,anchor,resources:scene.resourceOccupancy,reservedTiles:scene.placementReserved?.()??[],inventory:scene.inventory,buildings:scene.buildings,definition:d,reserveMaterials:true});
  if(result.error)return result;
  scene.constructionSystem?.plan?.(result.building);scene.dropSystem?.clearSite?.(result.building);
  scene.towerViews?.set(result.building.id,scene.createBuildingView?.(d,result.building));scene.events?.emit?.('buildings:changed');
  return result;
}
// After the old building is gone (DemolitionSystem completion): the deferred site is placed now.
export function completeRelocation(scene,building){
  const plan=building?.relocation;if(!plan||plan.siteId!=null)return null;
  const result=placeSite(scene,{x:plan.x,y:plan.y},relocationDefinition(building));
  scene.setStatus?.(result.error?t('relocation.failed',{reason:result.error}):t('relocation.sitePlaced',{name:buildingDefinition(building).name}));
  return result;
}
// The player cancels the dismantling: the move is cancelled too (a site already placed is cancelled with it).
export function cancelRelocation(scene,building){
  const plan=building?.relocation;if(!plan)return false;delete building.relocation;
  if(plan.siteId!=null){const site=scene.buildings.find(b=>b.id===plan.siteId);if(site&&!buildingIsComplete(site))scene.constructionSystem?.cancel?.(site);}
  return true;
}
