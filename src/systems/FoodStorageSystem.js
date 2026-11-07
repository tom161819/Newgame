import { removeBuildingShell } from '../game/buildingRemoval.js';
import { tradeableResources } from '../data/trade.js';
import { GRANARY_GROUP_CAPACITY,granaryGroup,granaryUsage } from '../data/granaryCapacity.js';
import { FOOD_RESOURCE_IDS,FOOD_RULES } from '../data/foodProduction.js';
import { recipeResources } from '../data/production.js';
import { PLAYER_START } from '../game/config.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { findPathToAny } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
import { physicalResources,materialResources,storageResources,stockLocationId,equipmentResources } from '../data/logistics.js';

const sum=values=>Object.values(values).reduce((a,b)=>a+b,0);
const positive=n=>Number.isSafeInteger(n)&&n>0;
export class FoodStorageSystem {
  constructor(scene,{physicalMaterials=false}={}){
    this.scene=scene;this.physicalMaterials=physicalMaterials;this.locations=new Map();this.reservations=new Map();this.nextReservation=1;this.revision=0;this.listeners=new Set();
    this.locations.set('food-camp',{id:'food-camp',kind:'fallback',buildingId:null,x:PLAYER_START.x,y:PLAYER_START.y,width:1,height:1,capacity:FOOD_RULES.fallbackCapacity,allowed:[...FOOD_RESOURCE_IDS],stock:{},legacyOverflow:0});
    const legacy=Object.fromEntries([...scene.inventory.resources].filter(([id])=>this.manages(id)));
    this.migrateInventory(legacy);scene.inventory.useStorage(this);
    for(const building of scene.buildings)this.register(building);
  }
  manages(resource){return this.physicalMaterials?resource!=='gold'&&this.scene.objectRegistry.get(resource)?.category==='resource'&&this.scene.objectRegistry.get(resource).collectible:FOOD_RESOURCE_IDS.includes(resource);}
  resourceIds(){return this.physicalMaterials?physicalResources(this.scene.objectRegistry):[...FOOD_RESOURCE_IDS];}
  reservedTiles(){return [...this.locations.values()].filter(l=>l.kind==='fallback'&&l.buildingId==null).map(l=>({x:l.x,y:l.y}));}
  changed(){for(const l of this.locations.values())l.legacyOverflow=this.groups(l.id)?Object.values(this.groups(l.id)).reduce((n,g)=>n+Math.max(0,g.used-g.capacity),0):Math.max(0,this.used(l)-l.capacity);this.revision++;for(const listener of this.listeners)listener();}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  register(building){
    if(!buildingIsComplete(building))return;
    const d=buildingDefinition(building),base={buildingId:building.id,x:building.x,y:building.y,width:d.width,height:d.height,stock:{},legacyOverflow:0};
    const add=(id,kind,capacity,allowed)=>{if(!this.locations.has(id)){this.locations.set(id,{...base,id,kind,capacity,allowed:[...allowed],stock:{}});this.changed();}};
    if(d.storage&&(this.physicalMaterials||!d.storage.accepts)){
      add(stockLocationId(building),d.starter?'fallback':'storage',d.storage.capacity,storageResources(d,this.scene.objectRegistry));
      if(d.starter){const camp=this.locations.get('food-camp');if(camp&&!this.used(camp)&&!this.incoming(camp.id)){this.locations.delete(camp.id);this.changed();}}
    }
    // Trade F1.3: the Marketplace's goods space. Kind 'market' is never a store (isStock), so only trade tasks use it.
    if(d.trade&&this.physicalMaterials)add(`market-${building.id}`,'market',d.trade.capacity,tradeableResources(this.scene.objectRegistry).map(r=>r.id));
    if(d.recipe){add(`input-${building.id}`,'input',d.bufferCapacity,recipeResources(d,'input'));add(`output-${building.id}`,'output',d.bufferCapacity,recipeResources(d,'output'));}
    // C08: a Barracks keeps the Bows, Swords and Armor Haulers bring for the units it trains.
    if(d.kit)add(`kit-${building.id}`,'kit',d.kit.capacity,equipmentResources(this.scene.objectRegistry));
    // Day and night N2: a light place's fuel store (Torches or Wood for one or two nights).
    if(d.fuel&&this.physicalMaterials)add(`fuel-${building.id}`,'fuel',d.fuel.capacity,[d.fuel.resource]);
  }
  isStock(location){return location.kind==='storage'||location.kind==='fallback';}
  used(location){return sum(location.stock);}
  reserved(locationId,resource){return [...this.reservations.values()].filter(r=>r.kind==='stock'&&r.locationId===locationId&&r.resource===resource).reduce((n,r)=>n+r.amount,0);}
  incoming(locationId,resource=null){return [...this.reservations.values()].filter(r=>r.kind==='capacity'&&r.locationId===locationId&&(resource==null||r.resource===resource)).reduce((n,r)=>n+r.amount,0);}
  free(locationId,resource){const l=this.locations.get(locationId);return l?Math.max(0,(l.stock[resource]??0)-this.reserved(locationId,resource)):0;}
  groups(locationId){
    const l=this.locations.get(locationId);if(!l||l.kind!=='storage'||!this.scene.buildings.some(b=>b.id===l.buildingId&&b.type==='granary'))return null;
    const used=granaryUsage(l.stock,this.scene.objectRegistry),incoming={raw:0,food:0};
    for(const r of this.reservations.values())if(r.kind==='capacity'&&r.locationId===locationId){const group=granaryGroup(r.resource,this.scene.objectRegistry);if(group)incoming[group]+=r.amount;}
    return Object.fromEntries(Object.entries(GRANARY_GROUP_CAPACITY).map(([group,capacity])=>[group,{capacity,used:used[group],incoming:incoming[group],free:Math.max(0,capacity-used[group]-incoming[group])}]));
  }
  storedRoom(location,resource){const groups=this.groups(location.id);if(!groups)return Math.max(0,location.capacity-this.used(location));const group=granaryGroup(resource,this.scene.objectRegistry);return group?Math.max(0,groups[group].capacity-groups[group].used):0;}
  room(locationId,resource=null){
    const l=this.locations.get(locationId);if(!l)return 0;const groups=this.groups(locationId);
    if(!groups)return Math.max(0,l.capacity-this.used(l)-this.incoming(locationId));
    if(resource==null)return Object.values(groups).reduce((n,g)=>n+g.free,0);
    const group=granaryGroup(resource,this.scene.objectRegistry);return group?groups[group].free:0;
  }
  available(resource){return [...this.locations.values()].filter(l=>this.isStock(l)).reduce((n,l)=>n+this.free(l.id,resource),0);}
  inventorySummary(){const result={};for(const id of this.resourceIds())if([...this.locations.values()].some(l=>this.isStock(l)&&(l.stock[id]??0)>0))result[id]=this.available(id);return result;}
  resourceBreakdown(){
    const rows=new Map(this.resourceIds().map(resource=>[resource,{resource,freeStored:0,reservedStored:0,carried:0,sites:0,buffers:0,ground:0}]));
    for(const location of this.locations.values())for(const [resource,amount]of Object.entries(location.stock)){
      const row=rows.get(resource);if(!row)continue;
      if(this.isStock(location)){const reserved=this.reserved(location.id,resource);row.reservedStored+=reserved;row.freeStored+=amount-reserved;}
      else if(location.kind==='site')row.sites+=amount;else row.buffers+=amount;
    }
    for(const actor of [this.scene.character,...(this.scene.workerSystem?.liveWorkers()??[])])if(actor.cargo&&rows.has(actor.cargo.resource))rows.get(actor.cargo.resource).carried+=actor.cargo.amount;
    for(const drop of this.scene.dropSystem.drops.values())if(rows.has(drop.resource))rows.get(drop.resource).ground+=drop.amount;
    // Inputs of a reversible active recipe still belong to the kingdom. They
    // leave ownership only when that cycle succeeds, not on buffer withdrawal.
    for(const record of this.scene.foodProduction?.records.values()??[])for(const [resource,amount]of Object.entries(record.cycle?.inputs??{}))if(rows.has(resource))rows.get(resource).buffers+=amount;
    for(const view of this.scene.resources.values()){const row=rows.get(view.getData('objectId'));if(row)row.ground+=view.getData('object')?.amount??1;}
    return [...rows.values()].map(row=>({...row,total:row.freeStored+row.reservedStored+row.carried+row.sites+row.buffers+row.ground}));
  }
  goals(location){
    if(location.kind==='ground')return this.scene.map[location.y]?.[location.x]===0?[{x:location.x,y:location.y}]:[];
    const tiles=[];for(let dx=0;dx<location.width;dx++)tiles.push({x:location.x+dx,y:location.y-1},{x:location.x+dx,y:location.y+location.height});
    for(let dy=0;dy<location.height;dy++)tiles.push({x:location.x-1,y:location.y+dy},{x:location.x+location.width,y:location.y+dy});
    if(location.kind==='fallback')tiles.push({x:location.x,y:location.y});
    return tiles.filter(t=>this.scene.map[t.y]?.[t.x]===0);
  }
  route(actor,locations){
    const goals=new Map();for(const location of locations)for(const tile of this.goals(location))goals.set(tileKey(tile),location);
    const map=this.scene.workerSystem?.workers.has(actor.id)?this.scene.workerSystem.navigationMap(actor):this.scene.map;
    const route=findPathToAny(map,actor.nextTile??actor.tile,[...goals.keys()].map(key=>{const[x,y]=key.split(',').map(Number);return{x,y};}),this.scene.pathWear?.routingOptions(actor));
    return route?{...route,location:goals.get(tileKey(route.destination))}:null;
  }
  findDestination(actor,resource,amount,{partial=false}={}){
    const granaries=[...this.locations.values()].filter(l=>l.kind==='storage'&&l.allowed.includes(resource));
    const withRoom=granaries.filter(l=>this.room(l.id,resource)>=(partial?1:amount)),route=this.route(actor,withRoom);
    if(route)return route;
    // A reachable full granary stops production rather than creating extra camp capacity.
    if(!this.physicalMaterials&&granaries.length&&this.route(actor,granaries))return null;
    return this.route(actor,[...this.locations.values()].filter(l=>l.kind==='fallback'&&l.allowed.includes(resource)&&this.room(l.id,resource)>=(partial?1:amount)));
  }
  findSource(actor,resource){return this.route(actor,[...this.locations.values()].filter(l=>this.isStock(l)&&this.free(l.id,resource)>0));}
  atLocation(actor,id){const l=this.locations.get(id);return !!l&&!actor.nextTile&&!actor.path.length&&this.goals(l).some(t=>tileKey(t)===tileKey(actor.tile));}
  reserve(kind,locationId,resource,amount,owner){
    const l=this.locations.get(locationId);if(!['stock','capacity'].includes(kind)||!l||!positive(amount)||!l.allowed.includes(resource)||!owner)return null;
    if((kind==='stock'?this.free(locationId,resource):this.room(locationId,resource))<amount)return null;
    const id=`food-reservation-${this.nextReservation++}`;this.reservations.set(id,{id,kind,locationId,resource,amount,owner});this.changed();return id;
  }
  release(id){if(this.reservations.delete(id))this.changed();}
  releaseOwner(owner){for(const r of [...this.reservations.values()])if(r.owner===owner)this.release(r.id);}
  splitStock(id,amount,owner){
    const r=this.reservations.get(id);if(!r||r.kind!=='stock'||!positive(amount)||amount>r.amount)return null;
    if(amount===r.amount){r.owner=owner;this.changed();return id;}
    r.amount-=amount;const next=`food-reservation-${this.nextReservation++}`;this.reservations.set(next,{...r,id:next,amount,owner});this.changed();return next;
  }
  consumeHaulExclusion(location,resource,amount){
    const excluded=Math.min(amount,location.haulExcluded?.[resource]??0);if(!excluded)return false;
    location.haulExcluded[resource]-=excluded;if(!location.haulExcluded[resource])delete location.haulExcluded[resource];
    if(!Object.keys(location.haulExcluded).length)delete location.haulExcluded;return true;
  }
  take(id){
    const r=this.reservations.get(id),l=r&&this.locations.get(r.locationId);if(!l||r.kind!=='stock'||(l.stock[r.resource]??0)<r.amount)return null;
    const cargo={resource:r.resource,amount:r.amount,...(r.siteId!=null?{siteId:r.siteId}:{})};if(this.consumeHaulExclusion(l,r.resource,r.amount))cargo.transportCancelled=true;
    l.stock[r.resource]-=r.amount;if(!l.stock[r.resource])delete l.stock[r.resource];this.reservations.delete(id);this.changed();return cargo;
  }
  put(id,amount,{transportCancelled=false}={}){
    const r=this.reservations.get(id),l=r&&this.locations.get(r.locationId);
    if(!l||r.kind!=='capacity'||!positive(amount)||amount>r.amount||this.storedRoom(l,r.resource)<amount)return false;
    l.stock[r.resource]=(l.stock[r.resource]??0)+amount;if(transportCancelled){l.haulExcluded??={};l.haulExcluded[r.resource]=(l.haulExcluded[r.resource]??0)+amount;}
    r.amount-=amount;if(!r.amount)this.reservations.delete(id);this.changed();return true;
  }
  withdraw(locationId,resource,amount){
    const l=this.locations.get(locationId);if(!l||!positive(amount)||this.free(locationId,resource)<amount)return false;
    this.consumeHaulExclusion(l,resource,amount);l.stock[resource]-=amount;if(!l.stock[resource])delete l.stock[resource];this.changed();return true;
  }
  withdrawBatch(locationId,inputs){
    const location=this.locations.get(locationId),entries=Object.entries(inputs);
    if(!location||!entries.length||entries.some(([resource,amount])=>!positive(amount)||this.free(locationId,resource)<amount))return false;
    for(const [resource,amount]of entries){this.consumeHaulExclusion(location,resource,amount);location.stock[resource]-=amount;if(!location.stock[resource])delete location.stock[resource];}
    this.changed();return true;
  }
  deposit(locationId,resource,amount){
    const l=this.locations.get(locationId);if(!l||!positive(amount)||!l.allowed.includes(resource)||this.room(locationId,resource)<amount)return false;
    l.stock[resource]=(l.stock[resource]??0)+amount;this.changed();return true;
  }
  spend(resource,amount){
    if(!Number.isSafeInteger(amount)||amount<0||this.available(resource)<amount)return false;
    for(const l of this.locations.values())if(this.isStock(l)&&amount){const take=Math.min(this.free(l.id,resource),amount);if(take){this.withdraw(l.id,resource,take);amount-=take;}}
    return true;
  }
  addToInventory(resource,amount){
    if(!Number.isSafeInteger(amount)||amount<0)throw new RangeError('Invalid food amount.');
    const actor=this.scene.character;let remaining=amount;
    while(remaining){const route=this.findDestination(actor,resource,remaining,{partial:true});if(!route)break;const n=Math.min(remaining,this.room(route.location.id,resource));if(!this.deposit(route.location.id,resource,n))break;remaining-=n;}
    if(remaining)this.spill(resource,remaining,actor.tile);
    return amount-remaining;
  }
  spill(resource,amount,origin){
    if(!amount)return;
    for(let radius=0;radius<=12;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
      const tile={x:origin.x+dx,y:origin.y+dy};if(this.scene.map[tile.y]?.[tile.x]===0){this.scene.dropSystem.create(resource,tile,amount,null,{rewardRemaining:0,rewardUnits:0,haulEligible:false});return;}
    }
    throw new Error('No safe ground tile for preserved food.');
  }
  // The starter store has its own removal rules; this never demolishes an ordinary building.
  starterRemovalStatus(building){
    const s=this.scene;
    if(!building||building.type!=='starter_stockpile'||!s.buildings.includes(building)||!buildingIsComplete(building))return 'unavailable';
    if(!s.buildings.some(b=>b.type==='warehouse'&&buildingIsComplete(b)))return 'warehouse';
    const locations=[...this.locations.values()].filter(l=>l.buildingId===building.id),ids=new Set(locations.map(l=>l.id));
    if(!locations.length||locations.some(l=>this.used(l)>0))return 'stock';
    if([...this.reservations.values()].some(r=>ids.has(r.locationId)))return 'busy';
    const tasks=[s.kingLogistics?.task,...(s.workerSystem?.liveWorkers()??[]).map(w=>w.workTask)];
    if(tasks.some(t=>t&&(ids.has(t.sourceId)||ids.has(t.destinationId))))return 'busy';
    if(s.gameOver||s.fog&&!s.fog.isVisibleObject(building))return 'unavailable';
    return null;
  }
  dismantleStarter(building){
    const reason=this.starterRemovalStatus(building);if(reason)return {removed:false,reason};
    const s=this.scene;
    // Recheck and remove synchronously: there is no async gap for new stock or an in-flight booking.
    this.removeBuilding(building);const tiles=removeBuildingShell(s,building,{maximumWear:true});
    s.events?.emit('buildings:changed');s.updateInventory?.();
    return {removed:true,tiles};
  }
  removeBuilding(building){
    for(const l of [...this.locations.values()])if(l.buildingId===building.id){for(const [resource,amount]of Object.entries(l.stock))this.spill(resource,amount,{x:building.x-1,y:building.y});
      for(const r of [...this.reservations.values()])if(r.locationId===l.id)this.release(r.id);this.locations.delete(l.id);this.changed();}
  }
  safeLegacyPosition(){
    const origin=this.scene.character.tile;for(let radius=0;radius<100;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){const tile={x:origin.x+dx,y:origin.y+dy};if(this.scene.map[tile.y]?.[tile.x]===0)return tile;}throw new Error('No safe location for preserved legacy stock.');
  }
  migrateMaterials(inventory,{ensure=false}={}){
    const allowed=materialResources(this.scene.objectRegistry);if(!ensure&&!allowed.some(id=>inventory[id]>0))return;
    let location=this.locations.get('legacy-materials');if(!location){location={id:'legacy-materials',kind:'fallback',buildingId:null,...this.safeLegacyPosition(),width:1,height:1,capacity:40,allowed,stock:{},legacyOverflow:0};this.locations.set(location.id,location);}
    for(const id of allowed)if(inventory[id]>0)location.stock[id]=(location.stock[id]??0)+inventory[id];
  }
  migrateInventory(inventory){const camp=this.locations.get('food-camp');if(camp){for(const id of FOOD_RESOURCE_IDS)if(inventory[id]>0)camp.stock[id]=(camp.stock[id]??0)+inventory[id];camp.legacyOverflow=Math.max(0,this.used(camp)-camp.capacity);}if(this.physicalMaterials)this.migrateMaterials(inventory);}
  exportState(){return {...(this.physicalMaterials?{physicalMaterials:true}:{}),locations:structuredClone([...this.locations.values()]),reservations:structuredClone([...this.reservations.values()]),nextReservation:this.nextReservation};}
  importState(data,legacyInventory={}){
    this.reservations.clear();if(data){this.locations=new Map(data.locations.map(l=>[l.id,structuredClone(l)]));this.reservations=new Map(data.reservations.map(r=>[r.id,structuredClone(r)]));this.nextReservation=data.nextReservation;}
    else{for(const l of this.locations.values())l.stock={};this.migrateInventory(legacyInventory);}
    if(this.physicalMaterials){
      if(!data?.physicalMaterials)this.migrateMaterials(data?legacyInventory:{},{ensure:true});
      for(const l of this.locations.values())if(l.kind==='fallback'&&l.buildingId==null&&!this.goals(l).length){Object.assign(l,this.safeLegacyPosition());
        for(const worker of this.scene.workerSystem?.liveWorkers()??[])if([worker.workTask?.sourceId,worker.workTask?.destinationId].includes(l.id))this.scene.workerSystem.ai.cancel(worker);
      }
    }
    this.scene.inventory.useStorage(this);
    this.changed();
  }
  destroy(){this.listeners.clear();this.reservations.clear();this.locations.clear();}
}
