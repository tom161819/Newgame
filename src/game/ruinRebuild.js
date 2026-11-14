import { t } from '../i18n/index.js';
import { placeBuilding } from './buildings.js';

// m-trosky-znovu (owner 14 Nov 2026): "Build again" on Burnt Ruins plans the building that burnt down on the same spot
// for its full price; Builders then build it like any new building. Nothing changes when it cannot be placed or paid.
export function rebuildRuin(scene,ruin){
  if(ruin?.type!=='burnt_ruins'||!ruin.burntFrom||ruin.demolition||!scene.buildings.includes(ruin))return {error:t('ruins.rebuildUnavailable')};
  const definition=scene.objectRegistry.require(ruin.burntFrom),anchor={x:ruin.x,y:ruin.y};
  if(!definition.buildable)return {error:t('ruins.rebuildUnavailable')};if(!scene.inventory.canAfford(definition.cost))return {error:t('status.noFunds')};
  const index=scene.buildings.indexOf(ruin),ground=tile=>scene.terrainGrid?.[tile.y]?.[tile.x]??0;scene.buildings.splice(index,1);for(const tile of ruin.tiles)scene.map[tile.y][tile.x]=ground(tile);
  const result=placeBuilding({map:scene.map,anchor,resources:scene.resourceOccupancy,reservedTiles:scene.reservedTiles(),inventory:scene.inventory,buildings:scene.buildings,definition,reserveMaterials:true});
  if(result.error){scene.buildings.splice(index,0,ruin);for(const tile of ruin.tiles)scene.map[tile.y][tile.x]=1;return result;}
  scene.towerViews?.get(ruin.id)?.destroy();scene.towerViews?.delete(ruin.id);{const key=`building:${ruin.id}`;if(scene.mapMemory?.objects.delete(key))scene.mapMemory.revision++;scene.mapMemory?.objectSignatures?.delete(key);}
  scene.terrain?.invalidateArea(ruin.tiles);scene.constructionSystem?.plan(result.building);if(scene.createBuildingView)scene.towerViews?.set(result.building.id,scene.createBuildingView(definition,result.building));
  scene.events?.emit?.('buildings:changed');return result;
}
