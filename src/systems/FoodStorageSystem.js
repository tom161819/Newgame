import { FOOD_RESOURCE_IDS,FOOD_RULES } from '../data/foodProduction.js';
import { PLAYER_START } from '../game/config.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { findPathToAny } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';

const sum=values=>Object.values(values).reduce((a,b)=>a+b,0);
const positive=n=>Number.isSafeInteger(n)&&n>0;
export class FoodStorageSystem {
  constructor(scene){
    this.scene=scene;this.locations=new Map();this.reservations=new Map();this.nextReservation=1;this.revision=0;this.listeners=new Set();
    this.locations.set('food-camp',{id:'food-camp',kind:'fallback',buildingId:null,x:PLAYER_START.x,y:PLAYER_START.y,width:1,height:1,capacity:FOOD_RULES.fallbackCapacity,allowed:[...FOOD_RESOURCE_IDS],stock:{},legacyOverflow:0});
    const legacy=Object.fromEntries([...scene.inventory.resources].filter(([id])=>this.manages(id)));
    this.migrateInventory(legacy);scene.inventory.useStorage(this);
    for(const building of scene.buildings)this.register(building);
  }
  manages(resource){return FOOD_RESOURCE_IDS.includes(resource);}
  changed(){for(const l of this.locations.values())l.legacyOverflow=Math.max(0,this.used(l)-l.capacity);this.revision++;for(const listener of this.listeners)listener();}
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  register(building){
    if(!buildingIsComplete(building))return;
    const d=buildingDefinition(building),base={buildingId:building.id,x:building.x,y:building.y,width:d.width,height:d.height,stock:{},legacyOverflow:0};
    const add=(id,kind,capacity,allowed)=>{if(!this.locations.has(id)){this.locations.set(id,{...base,id,kind,capacity,allowed:[...allowed],stock:{}});this.changed();}};
    if(d.storage)add(`granary-${building.id}`,'storage',d.storage.capacity,d.storage.resources);
    if(d.recipe){add(`input-${building.id}`,'input',d.bufferCapacity,Object.keys(d.recipe.input));add(`output-${building.id}`,'output',d.bufferCapacity,Object.keys(d.recipe.output));}
  }
  isStock(location){return location.kind==='storage'||location.kind==='fallback';}
  used(location){return sum(location.stock);}
  reserved(locationId,resource){return [...this.reservations.values()].filter(r=>r.kind==='stock'&&r.locationId===locationId&&r.resource===resource).reduce((n,r)=>n+r.amount,0);}
  incoming(locationId){return [...this.reservations.values()].filter(r=>r.kind==='capacity'&&r.locationId===locationId).reduce((n,r)=>n+r.amount,0);}
  free(locationId,resource){const l=this.locations.get(locationId);return l?Math.max(0,(l.stock[resource]??0)-this.reserved(locationId,resource)):0;}
  room(locationId){const l=this.locations.get(locationId);return l?Math.max(0,l.capacity-this.used(l)-this.incoming(locationId)):0;}
  available(resource){return [...this.locations.values()].filter(l=>this.isStock(l)).reduce((n,l)=>n+this.free(l.id,resource),0);}
  inventorySummary(){const result={};for(const id of FOOD_RESOURCE_IDS)if([...this.locations.values()].some(l=>this.isStock(l)&&(l.stock[id]??0)>0))result[id]=this.available(id);return result;}
  goals(location){
    const tiles=[];for(let dx=0;dx<location.width;dx++)tiles.push({x:location.x+dx,y:location.y-1},{x:location.x+dx,y:location.y+location.height});
    for(let dy=0;dy<location.height;dy++)tiles.push({x:location.x-1,y:location.y+dy},{x:location.x+location.width,y:location.y+dy});
    if(location.kind==='fallback')tiles.push({x:location.x,y:location.y});
    return tiles.filter(t=>this.scene.map[t.y]?.[t.x]===0);
  }
  route(actor,locations){
    const goals=new Map();for(const location of locations)for(const tile of this.goals(location))goals.set(tileKey(tile),location);
    const map=this.scene.workerSystem?.workers.has(actor.id)?this.scene.workerSystem.navigationMap(actor):this.scene.map;
    const route=findPathToAny(map,actor.nextTile??actor.tile,[...goals.keys()].map(key=>{const[x,y]=key.split(',').map(Number);return{x,y};}));
    return route?{...route,location:goals.get(tileKey(route.destination))}:null;
  }
  findDestination(actor,resource,amount,{partial=false}={}){
    const granaries=[...this.locations.values()].filter(l=>l.kind==='storage'&&l.allowed.includes(resource));
    const withRoom=granaries.filter(l=>this.room(l.id)>=(partial?1:amount)),route=this.route(actor,withRoom);
    if(route)return route;
    // A reachable full granary stops production rather than creating extra camp capacity.
    if(granaries.length&&this.route(actor,granaries))return null;
    const camp=this.locations.get('food-camp');return camp?.allowed.includes(resource)&&this.room(camp.id)>=(partial?1:amount)?this.route(actor,[camp]):null;
  }
  findSource(actor,resource){return this.route(actor,[...this.locations.values()].filter(l=>this.isStock(l)&&this.free(l.id,resource)>0));}
  atLocation(actor,id){const l=this.locations.get(id);return !!l&&!actor.nextTile&&!actor.path.length&&this.goals(l).some(t=>tileKey(t)===tileKey(actor.tile));}
  reserve(kind,locationId,resource,amount,owner){
    const l=this.locations.get(locationId);if(!['stock','capacity'].includes(kind)||!l||!positive(amount)||!l.allowed.includes(resource)||!owner)return null;
    if((kind==='stock'?this.free(locationId,resource):this.room(locationId))<amount)return null;
    const id=`food-reservation-${this.nextReservation++}`;this.reservations.set(id,{id,kind,locationId,resource,amount,owner});this.changed();return id;
  }
  release(id){if(this.reservations.delete(id))this.changed();}
  releaseOwner(owner){for(const r of [...this.reservations.values()])if(r.owner===owner)this.release(r.id);}
  take(id){
    const r=this.reservations.get(id),l=r&&this.locations.get(r.locationId);if(!l||r.kind!=='stock'||(l.stock[r.resource]??0)<r.amount)return null;
    const cargo={resource:r.resource,amount:r.amount};l.stock[r.resource]-=r.amount;if(!l.stock[r.resource])delete l.stock[r.resource];this.reservations.delete(id);this.changed();return cargo;
  }
  put(id,amount){
    const r=this.reservations.get(id),l=r&&this.locations.get(r.locationId);
    if(!l||r.kind!=='capacity'||!positive(amount)||amount>r.amount||this.used(l)+amount>l.capacity)return false;
    l.stock[r.resource]=(l.stock[r.resource]??0)+amount;r.amount-=amount;if(!r.amount)this.reservations.delete(id);this.changed();return true;
  }
  withdraw(locationId,resource,amount){
    const l=this.locations.get(locationId);if(!l||!positive(amount)||this.free(locationId,resource)<amount)return false;
    l.stock[resource]-=amount;if(!l.stock[resource])delete l.stock[resource];this.changed();return true;
  }
  deposit(locationId,resource,amount){
    const l=this.locations.get(locationId);if(!l||!positive(amount)||!l.allowed.includes(resource)||this.room(locationId)<amount)return false;
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
    while(remaining){const route=this.findDestination(actor,resource,remaining,{partial:true});if(!route)break;const n=Math.min(remaining,this.room(route.location.id));if(!this.deposit(route.location.id,resource,n))break;remaining-=n;}
    if(remaining)this.spill(resource,remaining,actor.tile);
    return amount-remaining;
  }
  spill(resource,amount,origin){
    if(!amount)return;
    for(let radius=0;radius<=12;radius++)for(let dy=-radius;dy<=radius;dy++)for(let dx=-radius;dx<=radius;dx++){
      const tile={x:origin.x+dx,y:origin.y+dy};if(this.scene.map[tile.y]?.[tile.x]===0){this.scene.dropSystem.create(resource,tile,amount,null,{rewardRemaining:0});return;}
    }
    throw new Error('No safe ground tile for preserved food.');
  }
  removeBuilding(building){
    for(const l of [...this.locations.values()])if(l.buildingId===building.id){for(const [resource,amount]of Object.entries(l.stock))this.spill(resource,amount,{x:building.x-1,y:building.y});
      for(const r of [...this.reservations.values()])if(r.locationId===l.id)this.release(r.id);this.locations.delete(l.id);this.changed();}
  }
  migrateInventory(inventory){const camp=this.locations.get('food-camp');for(const id of FOOD_RESOURCE_IDS)if(inventory[id]>0)camp.stock[id]=(camp.stock[id]??0)+inventory[id];camp.legacyOverflow=Math.max(0,this.used(camp)-camp.capacity);}
  exportState(){return {locations:structuredClone([...this.locations.values()]),reservations:structuredClone([...this.reservations.values()]),nextReservation:this.nextReservation};}
  importState(data,legacyInventory={}){
    this.reservations.clear();if(data){this.locations=new Map(data.locations.map(l=>[l.id,structuredClone(l)]));this.reservations=new Map(data.reservations.map(r=>[r.id,structuredClone(r)]));this.nextReservation=data.nextReservation;}
    else{for(const l of this.locations.values())l.stock={};this.migrateInventory(legacyInventory);}
    this.changed();
  }
  destroy(){this.listeners.clear();this.reservations.clear();this.locations.clear();}
}
