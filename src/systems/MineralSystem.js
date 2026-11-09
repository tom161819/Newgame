import { MINERAL_DEPOSITS,START_QUARRY,resourceBlocks,depositFamily } from '../data/minerals.js';
import { reachableTiles } from '../game/pathfinding.js';
import { buildingTiles,buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { clearsObstacles } from '../data/rockMining.js';
import { depletableMine } from '../game/depletedMine.js';

const width=o=>o.width??o.definition.width,height=o=>o.height??o.definition.height;
export const rectanglesOverlap=(a,b)=>a.x<b.x+width(b)&&a.x+width(a)>b.x&&a.y<b.y+height(b)&&a.y+height(a)>b.y;
export const footprintDistance=(a,b)=>Math.hypot(Math.max(0,a.x-b.x-width(b)+1,b.x-a.x-width(a)+1),Math.max(0,a.y-b.y-height(b)+1,b.y-a.y-height(a)+1));

export class MineralSystem {
  constructor(scene,natural){Object.assign(this,{scene,natural});this.accessCache=new Map();}
  deposits(){return [...this.natural.byId.values()].filter(o=>o.definition.deposit);}
  // World v2: `weight(anchor)` 0–1 makes deposits more likely in stony country (generator 2's stone weights).
  generate(random=Math.random,weight=null){
    const s=this.scene,protectedTiles=this.natural.reserved(),start=s.character.tile;let added=0;
    for(const [type,rule]of Object.entries(MINERAL_DEPOSITS))for(let count=0,attempt=0;count<rule.count&&attempt<5000;attempt++){
      const anchor={x:2+Math.floor(random()*95),y:2+Math.floor(random()*95)},definition=s.objectRegistry.require(type),tiles=buildingTiles(anchor,definition);
      if(Math.hypot(anchor.x-start.x,anchor.y-start.y)<=9||weight&&random()>weight(anchor)||!tiles.every(t=>s.map[t.y]?.[t.x]===0&&!s.isFordTile?.(t)&&!s.resourceOccupancy.has(tileKey(t))&&!protectedTiles.has(tileKey(t))))continue;
      const before=reachableTiles(s.map,this.natural.origins()).length;for(const t of tiles)s.map[t.y][t.x]=1;const after=reachableTiles(s.map,this.natural.origins()).length;for(const t of tiles)s.map[t.y][t.x]=0;if(after!==before-tiles.length)continue;
      const max=rule.min+Math.floor(random()*(rule.max-rule.min+1)),state={id:`deposit-${this.natural.nextDepositId++}`,kind:'deposit',remaining:max,max,boundBuildingId:null};s.addResource(definition,anchor,state);count++;added++;
    }
    return added;
  }
  // m-kamenolom-u-hradu: the centre the start rules measure from (the Castle, else the King's tile).
  startCentre(){
    const s=this.scene,castle=s.buildings.find(b=>b.type==='castle');if(castle){const d=buildingDefinition(castle);return {x:castle.x+d.width/2,y:castle.y+d.height/2};}
    const t=s.character.tile;return {x:t.x+.5,y:t.y+.5};
  }
  // A Quarry anchor over the Stone Deposit at `anchor` (placed or not) that the placement rules accept at the start: the
  // other footprint tiles are open, off fords, free of resources and units, clear of the starting buildings and the King,
  // and blocking it cuts nothing off the map while a work position stays reachable. Null when there is none.
  startQuarrySite(anchor,{free=this.startFree(),before=null}={}){
    const s=this.scene,q=s.objectRegistry.require('quarry'),dep=s.objectRegistry.require('stone_deposit'),depositTiles=buildingTiles(anchor,dep),depositKeys=new Set(depositTiles.map(tileKey));
    const starts=s.buildings.filter(b=>START_QUARRY.keepClearOf.includes(b.type)).map(b=>({x:b.x,y:b.y,definition:buildingDefinition(b)})),king=s.character.tile,origins=this.natural.origins();
    const options=[];for(let dy=1-q.height;dy<dep.height;dy++)for(let dx=1-q.width;dx<dep.width;dx++)options.push({x:anchor.x+dx,y:anchor.y+dy});
    // A footprint that covers the whole deposit first (the obvious spot), then the corner overlaps; ties by position.
    const covered=o=>depositTiles.filter(t=>t.x>=o.x&&t.x<o.x+q.width&&t.y>=o.y&&t.y<o.y+q.height).length;options.sort((a,b)=>covered(b)-covered(a)||a.y-b.y||a.x-b.x);
    for(const site of options){
      const tiles=buildingTiles(site,q);
      if(!tiles.every(t=>depositKeys.has(tileKey(t))||free(t)))continue;
      if(tiles.some(t=>t.x===king.x&&t.y===king.y)||starts.some(b=>footprintDistance({...site,definition:q},b)<START_QUARRY.clearance||footprintDistance({...anchor,definition:dep},b)<START_QUARRY.clearance))continue;
      const blocked=[...new Map([...tiles,...depositTiles].map(t=>[tileKey(t),t])).values()].filter(t=>s.map[t.y][t.x]===0);
      before??=reachableTiles(s.map,origins).length;for(const t of blocked)s.map[t.y][t.x]=1;const after=reachableTiles(s.map,origins);for(const t of blocked)s.map[t.y][t.x]=0;
      if(after.length!==before-blocked.length)continue;
      const reachable=new Set(after.map(tileKey));if(!towerNeighbors({...site,definition:q}).some(t=>reachable.has(tileKey(t))))continue;
      return site;
    }
    return null;
  }
  startFree(){
    const s=this.scene,protectedTiles=this.natural.reserved();
    return t=>t.x>=1&&t.y>=1&&t.x<s.map[0].length-1&&t.y<s.map.length-1&&s.map[t.y]?.[t.x]===0&&!s.isFordTile?.(t)&&!s.resourceOccupancy.has(tileKey(t))&&!protectedTiles.has(tileKey(t));
  }
  // New Game only, after generate(): keeps the world as it is when a Stone Deposit already qualifies, otherwise adds one
  // (a random qualifying spot from its own stream, so the other deposits and the iron stay where they were).
  ensureStartQuarry(random=Math.random){
    const centre=this.startCentre(),{min,max}=START_QUARRY,inRange=a=>{const d=Math.hypot(a.x+1-centre.x,a.y+1-centre.y);return d>=min&&d<=max;};
    const existing=this.deposits().find(d=>d.type==='stone_deposit'&&inRange(d)&&d.natural.remaining>0&&d.natural.boundBuildingId==null&&this.startQuarrySite(d));
    if(existing)return {deposit:existing,added:false};
    const s=this.scene,definition=s.objectRegistry.require('stone_deposit'),free=this.startFree(),candidates=[];
    for(let y=Math.floor(centre.y-max-1);y<=centre.y+max;y++)for(let x=Math.floor(centre.x-max-1);x<=centre.x+max;x++){const a={x,y};if(inRange(a)&&buildingTiles(a,definition).every(free))candidates.push(a);}
    for(let i=candidates.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
    const before=reachableTiles(s.map,this.natural.origins()).length;
    for(const anchor of candidates){
      if(!this.startQuarrySite(anchor,{free,before}))continue;
      const rule=MINERAL_DEPOSITS.stone_deposit,amount=rule.min+Math.floor(random()*(rule.max-rule.min+1)),state={id:`deposit-${this.natural.nextDepositId++}`,kind:'deposit',remaining:amount,max:amount,boundBuildingId:null};
      s.addResource(definition,anchor,state);return {deposit:this.natural.byId.get(state.id),added:true};
    }
    return {deposit:null,added:false};
  }
  candidates(definition,anchor){
    const footprint={...anchor,definition},spec=definition.mining;if(!spec)return[];
    return this.deposits().filter(d=>depositFamily(d.type)===spec.depositType&&(spec.overlap?rectanglesOverlap(footprint,d):footprintDistance(footprint,d)<=spec.range)).sort((a,b)=>footprintDistance(footprint,a)-footprintDistance(footprint,b)||a.natural.id.localeCompare(b.natural.id,undefined,{numeric:true}));
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
    const s=this.scene,view=s.resources.get(s.resourceOccupancy.get(tileKey(tile))),object=view?.getData('object');
    // m-oznacovani-tezby (56): a wall, tower or gate plan may cover a rock outcrop or a tree; both get marked for removal.
    if(clearsObstacles(definition)){if(s.terrainGrid[tile.y]?.[tile.x]===1)return !object;if(object?.definition.tree&&object.natural?.stage>0&&s.terrainGrid[tile.y]?.[tile.x]===0)return true;}
    if(!object||s.terrainGrid[tile.y]?.[tile.x]!==0)return false;
    if(object.definition.tree&&object.natural.stage===0)return![...s.dropSystem.drops.values()].some(d=>tileKey(d.tile)===tileKey(tile));
    return !!definition.mining?.overlap&&depositFamily(object.type)===definition.mining.depositType&&object.natural.remaining>0&&object.natural.boundBuildingId==null;
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
  // m-vytezeny-dul-ctverecky (64): a mine whose bound deposit reached 0 becomes depleted once its last load is on the
  // pile (no resident of it carries or brings mined goods). Called every simulation step; also turns a loaded save
  // with an exhausted deposit into a depleted mine. Returns the buildings that changed.
  updateDepletion(){
    const s=this.scene,changed=[];
    for(const b of s.buildings){
      if(b.depleted||!depletableMine(b)||!buildingIsComplete(b)||b.unverified)continue;
      const d=this.natural.byId.get(b.depositId);if(!d||d.natural.remaining>0||d.natural.boundBuildingId!==b.id)continue;
      if((s.workplaceSystem?.employees(b)??[]).some(w=>w.cargo||['foodPickup','foodDeliver'].includes(w.workTask?.kind)))continue;
      this.deplete(b);changed.push(b);
    }
    return changed;
  }
  // The workers leave: the same profession in another building with a free seat, else Unemployed (automatic
  // employment may then place them by its usual rules). Nobody is held back, so this is not a manual dismissal.
  deplete(building){
    const s=this.scene,ws=s.workplaceSystem;building.depleted=true;
    for(const worker of [...(ws?.employees(building)??[])]){ws.detach(worker);if(!ws.assignFree(worker))ws.remove(worker);}
    const view=s.towerViews?.get(building.id);view?.paint?.(building);
    ws?.changed(building.id);s.employment?.request();
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
