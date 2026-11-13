import { t } from '../i18n/index.js';
import { tileKey } from './stones.js';
import { buildingTiles,buildingIsComplete, definitionFor } from './buildings.js';
import { PAVEMENT,pavementCost } from '../data/pavement.js';

// S11 Stone Pavement orders: the tiles a tool selects, which of them are new, already paved or invalid, and the cost.
export function pavementTiles(mode,start,end=start){
  if(mode==='single'||!end)return [{...start}];
  if(mode==='area'||mode==='remove'){const tiles=[];for(let y=Math.min(start.y,end.y);y<=Math.max(start.y,end.y);y++)for(let x=Math.min(start.x,end.x);x<=Math.max(start.x,end.x);x++)tiles.push({x,y});return tiles;}
  // Line: horizontal, vertical or diagonal on the grid, one tile per step (Bresenham).
  const tiles=[];let {x,y}=start;const dx=Math.abs(end.x-x),dy=-Math.abs(end.y-y),sx=Math.sign(end.x-x),sy=Math.sign(end.y-y);let err=dx+dy;
  for(;;){tiles.push({x,y});if(x===end.x&&y===end.y)break;const e2=2*err;if(e2>=dy){err+=dy;x+=sx;}if(e2<=dx){err+=dx;y+=sy;}}
  return tiles;
}
export const isPavementSite=b=>!!(b.definition??null)?.pavement||b.type==='stone_pavement'||b.type==='stone_pavement_joint';
// #150: a finished building can get a paved floor (it covers it until it is gone). Fields and orchards cannot: their
// ground is farmland. The Builder works from the building's edge, so the site's work area is the host's footprint.
const tilesOf=(b,registry)=>b.tiles??buildingTiles(b,definitionFor(b,registry));
const pavable=(b,registry)=>buildingIsComplete(b)&&!isPavementSite(b)&&!definitionFor(b,registry).crop;
export function pavementHost(buildings,site,registry){if(!isPavementSite(site))return null;return buildings.find(b=>b!==site&&pavable(b,registry)&&tilesOf(b,registry).some(t=>t.x===site.x&&t.y===site.y))??null;}
export function pavementWorkArea(buildings,site,registry){const host=pavementHost(buildings,site,registry),b=host??site,d=definitionFor(b,registry);return {x:b.x,y:b.y,width:d.width,height:d.height,host};}
// Valid ground: open, no tree/deposit/stone, no other site (a pavement blueprint counts as already ordered); or the floor of a finished building.
export function pavementPlan({map,tiles,resources,buildings,pathWear,inventory,registry}){
  const occupied=new Map();for(const b of buildings)for(const tile of tilesOf(b,registry)){const key=tileKey(tile),other=occupied.get(key);if(!other||isPavementSite(b)||!pavable(b,registry)&&!isPavementSite(other))occupied.set(key,b);}
  const fresh=[],paved=[],invalid=[],seen=new Set();
  for(const tile of tiles){const key=tileKey(tile);if(seen.has(key))continue;seen.add(key);
    if(tile.x<0||tile.y<0||tile.y>=map.length||tile.x>=map[0].length){invalid.push(tile);continue;}
    const site=occupied.get(key);
    if(pathWear?.isPaved(tile)||site&&isPavementSite(site)){paved.push(tile);continue;}
    if(site&&pavable(site,registry)&&!resources.has(key)){fresh.push(tile);continue;}
    if(map[tile.y][tile.x]!==0||resources.has(key)||site){invalid.push(tile);continue;}
    fresh.push(tile);
  }
  const cost=fresh.length?{stone:pavementCost(fresh.length)}:{};
  let error=null;
  if(!fresh.length)error=t(paved.length?'pavement.nothingNew':'pavement.noValid');
  else if(fresh.length>PAVEMENT.maxOrderTiles)error=t('pavement.tooLarge',{count:PAVEMENT.maxOrderTiles});
  else if(!inventory.canAfford(cost))error=t('pavement.noStone',{cost:cost.stone});
  return {fresh,paved,invalid,cost,error};
}
// One order: alternating paid (1 Stone) and joint (free) 1×1 sites, reserved through the ordinary construction materials.
export function placePavement(options){
  const plan=pavementPlan(options);if(plan.error)return plan;
  const {buildings,registry}=options,construction=options.inventory.storage?.scene.constructionSystem,materials=construction?.materials.enabled?construction.materials:null;
  if(!materials&&!options.inventory.pay(plan.cost,{source:'Stone Pavement Construction'}))return {...plan,error:t('pavement.noStone',{cost:plan.cost.stone})};
  const paid=registry.require('stone_pavement'),joint=registry.require('stone_pavement_joint'),created=[];
  let id=Math.max(buildings.reduce((n,b)=>Math.max(n,b.id),0)+1,construction?.nextId??1);
  for(const [index,tile]of plan.fresh.entries()){
    const definition=index%2===0?paid:joint,building={...tile,id:id++,type:definition.id,definition,tiles:[{...tile}]};
    if(materials&&!materials.prepare(building)){for(const prepared of created)materials.discardPrepared(prepared);return {...plan,error:t('pavement.noStone',{cost:plan.cost.stone})};}
    created.push(building);
  }
  for(const building of created)buildings.push(building);
  return {...plan,buildings:created};
}
