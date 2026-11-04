import { MINERAL_DEPOSITS,resourceBlocks } from '../data/minerals.js';
import { reachableTiles } from '../game/pathfinding.js';
import { buildingTiles,buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';

const width=o=>o.width??o.definition.width,height=o=>o.height??o.definition.height;
export const rectanglesOverlap=(a,b)=>a.x<b.x+width(b)&&a.x+width(a)>b.x&&a.y<b.y+height(b)&&a.y+height(a)>b.y;
export const footprintDistance=(a,b)=>Math.hypot(Math.max(0,a.x-b.x-width(b)+1,b.x-a.x-width(a)+1),Math.max(0,a.y-b.y-height(b)+1,b.y-a.y-height(a)+1));

export class MineralSystem {
  constructor(scene,natural){Object.assign(this,{scene,natural});this.accessCache=new Map();}
  deposits(){return [...this.natural.byId.values()].filter(o=>o.definition.deposit);}
  generate(random=Math.random){
    const s=this.scene,protectedTiles=this.natural.reserved(),start=s.character.tile;let added=0;
    for(const [type,rule]of Object.entries(MINERAL_DEPOSITS))for(let count=0,attempt=0;count<rule.count&&attempt<5000;attempt++){
      const anchor={x:2+Math.floor(random()*95),y:2+Math.floor(random()*95)},definition=s.objectRegistry.require(type),tiles=buildingTiles(anchor,definition);
      if(Math.hypot(anchor.x-start.x,anchor.y-start.y)<=9||!tiles.every(t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy.has(tileKey(t))&&!protectedTiles.has(tileKey(t))))continue;
      const before=reachableTiles(s.map,this.natural.origins()).length;for(const t of tiles)s.map[t.y][t.x]=1;const after=reachableTiles(s.map,this.natural.origins()).length;for(const t of tiles)s.map[t.y][t.x]=0;if(after!==before-tiles.length)continue;
      const max=rule.min+Math.floor(random()*(rule.max-rule.min+1)),state={id:`deposit-${this.natural.nextDepositId++}`,kind:'deposit',remaining:max,max,boundBuildingId:null};s.addResource(definition,anchor,state);count++;added++;
    }
    return added;
  }
  candidates(definition,anchor){
    const footprint={...anchor,definition},spec=definition.mining;if(!spec)return[];
    return this.deposits().filter(d=>d.type===spec.depositType&&(spec.overlap?rectanglesOverlap(footprint,d):footprintDistance(footprint,d)<=spec.range)).sort((a,b)=>footprintDistance(footprint,a)-footprintDistance(footprint,b)||a.natural.id.localeCompare(b.natural.id,undefined,{numeric:true}));
  }
  select(definition,anchor){const candidates=this.candidates(definition,anchor);return definition.mining.overlap?candidates[0]??null:candidates.find(d=>d.natural.remaining>0&&d.natural.boundBuildingId==null&&this.scene.fog.isVisibleObject(d))??null;}
  placementError(definition,anchor){
    if(!definition.mining)return null;const candidates=this.candidates(definition,anchor),deposit=this.select(definition,anchor);
    if(!deposit)return definition.mining.overlap?'Quarry must overlap a finite Stone Deposit.':'Iron Mine requires an available visible Iron Deposit within four tiles.';
    if(deposit.natural.remaining===0)return 'Deposit Depleted';
    if(deposit.natural.boundBuildingId!=null)return 'This deposit is already assigned to another building.';
    if(!this.scene.fog.isVisibleObject(deposit))return 'Explore the deposit before placing this building.';
    return null;
  }
  canBuildOver(definition,tile){
    const s=this.scene,view=s.resources.get(s.resourceOccupancy.get(tileKey(tile))),object=view?.getData('object');if(!object||s.terrainGrid[tile.y]?.[tile.x]!==0)return false;
    if(object.definition.tree&&object.natural.stage===0)return![...s.dropSystem.drops.values()].some(d=>tileKey(d.tile)===tileKey(tile));
    return !!definition.mining?.overlap&&object.type===definition.mining.depositType&&object.natural.remaining>0&&object.natural.boundBuildingId==null;
  }
  accessError(map,definition,anchor){
    if(!definition.mining)return null;const deposit=this.select(definition,anchor);if(!deposit)return this.placementError(definition,anchor);
    const origins=this.natural.origins(),key=[definition.id,anchor.x,anchor.y,deposit.natural.id,this.natural.topologyRevision,origins.map(tileKey).join(';')].join('|');if(this.accessCache.has(key))return this.accessCache.get(key);
    const future=map.map(row=>[...row]),building={...anchor,definition};for(const t of buildingTiles(anchor,definition))future[t.y][t.x]=1;const reachable=new Set(reachableTiles(future,origins).map(tileKey)),hasAccess=object=>towerNeighbors(object).some(t=>future[t.y]?.[t.x]===0&&reachable.has(tileKey(t)));
    const error=hasAccess(building)&&(definition.mining.overlap||hasAccess(deposit))?null:definition.mining.overlap?'Quarry needs a reachable external work position.':'Iron Mine needs reachable building and deposit work positions.';
    if(this.accessCache.size>100)this.accessCache.clear();this.accessCache.set(key,error);return error;
  }
  bind(building){
    if(!building.definition.mining)return;const deposit=this.select(building.definition,building);if(!deposit)throw new Error('Missing validated finite deposit.');building.depositId=deposit.natural.id;if(building.type==='quarry')building.quarryMode='finite';deposit.natural.boundBuildingId=building.id;
  }
  registerBuilding(building){if(building.type==='quarry'&&building.quarryMode===undefined)building.quarryMode=buildingIsComplete(building)?'legacy':'unbound';}
  summary(building){
    if(building.quarryMode==='legacy')return 'Legacy Quarry · collects existing loose Stone';
    const d=this.natural.byId.get(building.depositId);if(!d)return 'No assigned finite deposit · production inactive';
    if(this.scene.fog.isVisibleObject(d))return d.natural.remaining===0?'Deposit Depleted':`${d.definition.name}: ${d.natural.remaining} / ${d.natural.max} ${this.scene.objectRegistry.require(d.definition.deposit.resource).name}`;
    const known=this.scene.mapMemory.objects.get(`resource:${d.x},${d.y}`);return known?.visual.depleted?'Last observed: Deposit Depleted':'Assigned finite deposit · outside sight';
  }
  reconcile(){
    for(const object of this.deposits()){const n=object.natural,b=this.scene.buildings.find(b=>b.id===n.boundBuildingId);if(n.boundBuildingId!=null&&(!b||b.depositId!==n.id)){n.boundBuildingId=null;this.restoreTiles(object.tiles);}}
  }
  restoreTiles(tiles){
    const s=this.scene;for(const tile of tiles){const object=s.resources.get(s.resourceOccupancy.get(tileKey(tile)))?.getData('object'),solid=s.buildings.some(b=>b.tiles.some(t=>t.x===tile.x&&t.y===tile.y)&&(!buildingDefinition(b).walkable||!buildingIsComplete(b)));s.map[tile.y][tile.x]=s.terrainGrid[tile.y][tile.x]||solid||object&&resourceBlocks(object)?1:0;}this.natural.topologyRevision++;s.terrain?.invalidateArea(tiles);
  }
}
