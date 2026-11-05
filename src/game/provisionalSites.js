import { knownMap } from './knownMap.js';
import { placementError } from './buildings.js';

// A blueprint is provisional while any of its tiles lies outside current sight (Fog of War on).
export const isProvisional=(fog,tiles)=>!!fog?.enabled&&tiles.some(tile=>!fog.isInSightTile(tile));

// Validity from what the kingdom knows: seen or remembered tiles keep their real terrain, resources and
// mining rules; never-seen tiles count as open ground, and only units in sight block. Hidden prerequisites
// (a Quarry's rock, a mine's deposit) wait until the site is seen; no hidden obstacle shapes the answer.
export function knownContext(scene){
  const fog=scene.fog,known=tile=>fog.isInSightTile(tile)||!!fog.explored[tile.y*fog.width+tile.x];
  const natural=scene.resourceOccupancy.naturalContext,fromKey=key=>{const [x,y]=key.split(',').map(Number);return {x,y};};
  const resources={has:key=>scene.resourceOccupancy.has(key)&&known(fromKey(key)),naturalContext:natural?{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:(d,tile)=>known(tile)&&natural.mining.canBuildOver(d,tile)}}:null};
  return {map:knownMap(scene),resources,reservedTiles:scene.reservedTiles().filter(tile=>fog.isInSightTile(tile))};
}
export function knownPlacementError(scene,anchor,definition){
  const {map,resources,reservedTiles}=knownContext(scene);
  return placementError(map,anchor,resources,reservedTiles,definition,scene.buildings,scene.buildingUnlocks);
}
