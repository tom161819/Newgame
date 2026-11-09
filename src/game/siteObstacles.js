import { t } from '../i18n/index.js';
import { buildingTiles,buildingDefinition } from './buildings.js';
import { tileKey } from './stones.js';
import { isWaterGround,isFordGround } from '../data/worldTerrain.js';
import { depositFamily } from '../data/minerals.js';
import { footprintDistance } from '../systems/MineralSystem.js';

// m-zelezny-dul-misto (playtest 0.83.0 #5): WHY a spot is invalid, as one short reason (Rock, Unexplored, Out of deposit
// range…), for the Iron Mine's build mode and for a provisional site cancelled once it is seen. Reads the world as the
// player knows it: with fog, a tile never seen counts as unexplored and hides what is on it. Pure apart from the scene.
export const SITE_REASONS=Object.freeze(['edge','unexplored','outOfRange','depositUnseen','depleted','taken','deposit','rock','water','ford','tree','building','resource','unit','access']);
const known=(scene,tile)=>{const fog=scene.fog;return !fog?.enabled||fog.isInSightTile(tile)||!!fog.explored?.[tile.y*fog.width+tile.x];};
const objectAt=(scene,tile)=>scene.resources?.get(scene.resourceOccupancy?.get(tileKey(tile)))?.getData?.('object')??null;
// Iron Deposits the player knows (any tile seen or remembered) within the mine's range of the footprint.
export function knownDepositsInRange(scene,definition,anchor){
  const spec=definition.mining,natural=scene.naturalResources;if(!spec||!natural)return [];const footprint={...anchor,definition};
  return natural.mining.deposits().filter(d=>depositFamily(d.type)===spec.depositType&&footprintDistance(footprint,d)<=spec.range&&d.tiles.some(tile=>known(scene,tile)));
}
// The first reason the building cannot stand at `anchor`, or null. `ignore`: a building not to count (the site itself).
export function siteObstacle(scene,anchor,definition,{ignore=null}={}){
  const tiles=buildingTiles(anchor,definition),map=scene.map,spec=definition.mining,natural=scene.naturalResources;
  if(tiles.some(p=>p.x<0||p.y<0||p.y>=map.length||p.x>=map[0].length))return 'edge';
  if(spec&&!spec.overlap){
    const deposits=knownDepositsInRange(scene,definition,anchor);
    if(!deposits.length)return tiles.some(p=>!known(scene,p))?'unexplored':'outOfRange';
    const usable=deposits.filter(d=>d.natural.remaining>0&&d.natural.boundBuildingId==null);
    if(!usable.length)return deposits.some(d=>d.natural.remaining>0)?'taken':'depleted';
  }
  // reservedTiles() also lists every building footprint; only units standing there count as "someone".
  const footprint=b=>b.tiles??buildingTiles(b,buildingDefinition(b)),others=scene.buildings?.filter(b=>b!==ignore&&!b.unverified)??[],built=new Set(others.flatMap(footprint).map(tileKey)),all=new Set((scene.buildings??[]).flatMap(footprint).map(tileKey));
  const units=new Set((scene.reservedTiles?.()??[]).map(tileKey).filter(key=>!all.has(key)));
  for(const p of tiles){
    if(!known(scene,p))continue;const object=objectAt(scene,p),ground=scene.groundGrid?.[p.y]?.[p.x];
    if(object?.definition?.deposit&&spec&&!spec.overlap&&depositFamily(object.type)===spec.depositType)return 'deposit';
    if(scene.terrainGrid?.[p.y]?.[p.x]===1)return 'rock';
    if(isWaterGround(ground))return 'water';
    if(isFordGround(ground))return 'ford';
    if(built.has(tileKey(p)))return 'building';
    if(object?.definition?.tree)return object.natural?.stage>0?'tree':'resource';
    if(object)return 'resource';
  }
  if(tiles.some(p=>known(scene,p)&&units.has(tileKey(p))))return 'unit';
  if(tiles.some(p=>!known(scene,p)))return 'unexplored';
  if(spec&&!spec.overlap&&natural&&!knownDepositsInRange(scene,definition,anchor).some(d=>scene.fog?.isVisibleObject?.(d)??true))return 'depositUnseen';
  return 'access';
}
export const siteReasonText=reason=>t(`site.reason.${reason}`);
// The Iron Mine's build-mode line: the placement error as its short reason ("Iron Mine cannot stand here: Rock.").
// Other buildings, and a valid spot, keep the error as it is.
export function mineSpotError(scene,anchor,definition,error){
  if(!error||!definition?.mining||definition.mining.overlap||error===t('status.noFunds'))return error;
  return t('site.mineInvalid',{name:definition.name,reason:siteReasonText(siteObstacle(scene,anchor,definition))});
}
// m-zelezny-dul-misto: a provisional Iron Mine (outside sight) needs an Iron Deposit the player knows within its range;
// before, its mining rule waited until the site was seen and the blueprint was then cancelled as an "obstacle".
export function provisionalMineError(scene,anchor,definition){
  if(!definition?.mining||definition.mining.overlap)return null;
  return knownDepositsInRange(scene,definition,anchor).some(d=>d.natural.remaining>0&&d.natural.boundBuildingId==null)?null:mineSpotError(scene,anchor,definition,'x');
}
