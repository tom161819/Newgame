import { t } from '../i18n/index.js';
import { UNIT_TYPES,CATAPULT,WAGON_SUPPLY,vehicleUnit } from '../data/military.js';
import { EDIBLE_RESOURCES } from '../data/seasons.js';
import { buildingDefinition,buildingIsComplete,placeBuilding } from '../game/buildings.js';
import { removeBuildingShell } from '../game/buildingRemoval.js';
import { damageBuilding } from '../game/buildingHealth.js';
import { gridToWorld } from '../game/isometric.js';
import { isWalkable } from '../game/map.js';
import { siegeable } from './SiegeSystem.js';

// Owner 18 Nov 2026: siege engines and army supply.
// - Catapult: Builders build it on a site beside a Builder's Workshop (catapult_site); finished, it stands there as a
//   vehicle. A Recruit trained as its crew in a Barracks walks to it and rolls it. It throws Stones at enemy buildings
//   (CATAPULT), never at people; Stones come from a store it stands next to or from a Military Wagon.
// - Military Wagon: a Recruit with a Horse Wagon (and its horse). Beside a store it loads Stone, food and Torches
//   (WAGON_SUPPLY.load); in the field it fills the Catapults near it with Stones, and the soldiers near it eat from it and
//   take their night Torches from it.
// The crew's vehicle: `operatorId` is the soldier, `crew: true`, state reserved (he is on his way to it) or inUse.
const distanceToBuilding=(p,b)=>{const {width,height}=buildingDefinition(b);const dx=Math.max(b.x-p.x,0,p.x-(b.x+width)),dy=Math.max(b.y-p.y,0,p.y-(b.y+height));return Math.hypot(dx,dy);};
const foodOf=supplies=>EDIBLE_RESOURCES.reduce((n,id)=>n+(supplies?.[id]??0),0);
export const supplyAmount=(supplies,kind)=>kind==='food'?foodOf(supplies):supplies?.[kind]??0;

export class SiegeEngines {
  constructor(scene){this.scene=scene;}
  get vehicles(){return this.scene.vehicles;}
  get storage(){return this.scene.foodStorage;}
  isCrew(worker){return !!vehicleUnit(this.scene.military?.unit?.(worker)?.type);}
  vehicleOf(worker){return worker&&this.vehicles?[...this.vehicles.vehicles.values()].find(v=>v.crew&&v.operatorId===worker.id)??null:null;}
  crews(type){return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>this.scene.military?.unit?.(w)?.type===type&&this.vehicleOf(w)?.state==='inUse');}
  // A parked vehicle a new crew may take: a Catapult, or a Horse Wagon with its harnessed horse that is not out with
  // scouts or the caravan.
  free(type){
    const s=this.scene,system=this.vehicles;if(!system)return null;
    return [...system.vehicles.values()].find(v=>v.type===type&&v.state==='parked'&&!v.crew&&(type!=='horse_wagon'||system.usable(v))&&!s.scouting?.holds?.(v)&&v.id!==s.trade?.expedition?.state?.wagonId)??null;
  }
  reserve(worker,type){const v=this.free(type);if(!v)return null;v.state='reserved';v.operatorId=worker.id;v.crew=true;if(type==='catapult')v.ammo??=0;else v.supplies??={};this.vehicles.changed();return v;}
  // Discharge, death or a cancelled training: the vehicle stays where it is (or where the crew stood) for the next crew;
  // a Wagon's load and a Catapult's Stones stay on it.
  release(worker){const v=this.vehicleOf(worker);if(!v)return null;if(v.state==='inUse'){v.x=worker.tile.x;v.y=worker.tile.y;}v.state='parked';v.operatorId=null;delete v.crew;this.vehicles.changed();return v;}
  // Builder's Workshop: a Catapult site on free ground beside it, built by Builders like any building.
  orderCatapult(workshop){
    const s=this.scene,d=s.objectRegistry.require('catapult_site');if(!workshop||!buildingIsComplete(workshop))return {error:t('siege.noWorkshop')};
    if(!s.sandbox&&!s.inventory.canAfford?.(d.cost))return {error:t('status.noFunds')};
    const w=buildingDefinition(workshop),reserved=s.placementReserved?.()??[],free={pay:()=>true,canAfford:()=>true,storage:null};
    for(let r=1;r<=8;r++)for(let y=workshop.y-r-1;y<=workshop.y+w.height+r-1;y++)for(let x=workshop.x-r-1;x<=workshop.x+w.width+r-1;x++){
      const ring=Math.max(workshop.x-(x+1),0,x-(workshop.x+w.width-1),workshop.y-(y+1),0,y-(workshop.y+w.height-1));if(ring!==r)continue;
      const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:reserved,inventory:s.sandbox?free:s.inventory,buildings:s.buildings,definition:{...d,buildable:true}/* not in the build menu, but placed here like a building */,reserveMaterials:!s.sandbox,provisional:false});
      if(result.error){if(result.error===t('status.noFunds'))return result;continue;}
      const b=result.building;b.definition=d;if(!s.sandbox)s.constructionSystem?.plan?.(b);s.dropSystem?.clearSite?.(b);s.towerViews?.set(b.id,s.createBuildingView(d,b));s.updateInventory?.();s.events?.emit?.('buildings:changed');
      return {building:b};
    }
    return {error:t('siege.noRoom')};
  }
  sites(workshop=null){return this.scene.buildings.filter(b=>buildingDefinition(b).becomesVehicle&&(!workshop||Math.hypot(b.x-workshop.x,b.y-workshop.y)<14));}
  // A finished site becomes the vehicle on its ground.
  convertFinished(){
    const s=this.scene;if(!this.vehicles)return;
    for(const b of [...s.buildings]){const d=buildingDefinition(b);if(!d.becomesVehicle||!buildingIsComplete(b))continue;
      const tiles=removeBuildingShell(s,b);if(!tiles)continue;const tile=tiles.find(p=>isWalkable(s.map,p.x,p.y)&&this.vehicles.free(p))??tiles[0];
      const v=this.vehicles.create(d.becomesVehicle,tile);if(d.becomesVehicle==='catapult')v.ammo=0;
      s.events?.emit?.('buildings:changed');s.eventFeed?.push?.(`engine:${v.id}`,t('siege.catapultReady'),{target:{x:tile.x,y:tile.y}});s.setStatus?.(t('siege.catapultReady'));}
  }
  // Every frame for a crew (instead of fighting). `move` false while the player holds the unit in place.
  update(worker,delta,{move=true}={}){
    const v=this.vehicleOf(worker),type=this.scene.military?.unit?.(worker)?.type;if(!v){worker.workState='Waiting';worker.workMessage='Without a vehicle';return true;}
    if(v.state==='reserved'){
      if(Math.max(Math.abs(worker.tile.x-v.x),Math.abs(worker.tile.y-v.y))<=1&&!worker.nextTile){worker.path=[];v.state='inUse';this.vehicles.changed();return true;}
      worker.workState='Traveling to Target';worker.workMessage=v.type==='catapult'?'Fetching the Catapult':'Fetching the Wagon';
      if(move&&!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=1000;const goals=[{x:v.x,y:v.y},...[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]].map(([dx,dy])=>({x:v.x+dx,y:v.y+dy}))].filter(p=>isWalkable(this.scene.map,p.x,p.y));worker.moveTo(goals);}
      return true;
    }
    return type==='catapult'?this.catapult(worker,v,delta,move):this.wagon(worker,v,delta);
  }
  // --- Catapult ---
  catapultTarget(worker,v){
    const s=this.scene,ordered=worker.siegeTargetId!=null?s.buildings.find(b=>b.id===worker.siegeTargetId):null;if(ordered&&siegeable(ordered))return ordered;if(worker.siegeTargetId!=null)delete worker.siegeTargetId;
    let best=null,d=Infinity;for(const b of s.buildings){if(!siegeable(b))continue;const e=distanceToBuilding(worker.tile,b);if(e>=CATAPULT.minRange&&e<=CATAPULT.range&&e<d){d=e;best=b;}}return best;
  }
  catapult(worker,v,delta,move){
    const s=this.scene;worker.catapultReload=Math.max(0,(worker.catapultReload??0)-delta);
    this.loadFromStore(worker,v,{stone:CATAPULT.ammo});
    const b=this.catapultTarget(worker,v);if(!b){worker.workState='Waiting';worker.workMessage=v.ammo>0?'Catapult ready':'Out of stones';return true;}
    const e=distanceToBuilding(worker.tile,b),{width,height}=buildingDefinition(b),center={x:b.x+width/2,y:b.y+height/2};
    if(e>CATAPULT.range||e<CATAPULT.minRange){
      // Only an ordered target is approached; one found by itself is shot from where it stands.
      if(move&&worker.siegeTargetId===b.id&&!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=1500;const goals=this.firingTiles(b,worker);if(!goals.length||!worker.moveTo(goals)){delete worker.siegeTargetId;s.setStatus?.(t('siege.noWay',{name:buildingDefinition(b).name}));}}
      worker.workState='Traveling to Target';worker.workMessage='Moving the Catapult';return true;
    }
    if(worker.nextTile)return true;worker.path=[];const dx=center.x-worker.position.x,dy=center.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};
    if(!(v.ammo>0)){worker.workState='Waiting';worker.workMessage='Out of stones';return true;}
    worker.workState='Working';worker.workMessage='Bombarding';
    if(worker.catapultReload>0)return true;
    worker.catapultReload=CATAPULT.reload;v.ammo--;this.vehicles.changed();this.throwStone(worker,center);
    const result=damageBuilding(b,CATAPULT.damage);s.military?.siege?.drawBar?.(b);if(result?.destroyed)s.military.siege.destroy(b);
    return true;
  }
  // Ground from which the building is in range (not too close), nearest to the catapult first.
  firingTiles(b,worker){
    const s=this.scene,out=[],r=CATAPULT.range-1,{width,height}=buildingDefinition(b);
    for(let y=Math.floor(b.y-r);y<=b.y+height+r;y++)for(let x=Math.floor(b.x-r);x<=b.x+width+r;x++){const e=distanceToBuilding({x,y},b);if(e<=r&&e>=CATAPULT.minRange+1&&isWalkable(s.map,x,y))out.push({x,y});}
    return out.sort((a,c)=>Math.hypot(a.x-worker.tile.x,a.y-worker.tile.y)-Math.hypot(c.x-worker.tile.x,c.y-worker.tile.y)).slice(0,40);
  }
  throwStone(worker,center){
    const s=this.scene;if(!s.add?.graphics||!s.tweens?.add)return;const from=gridToWorld(worker.position.x,worker.position.y),to=gridToWorld(center.x,center.y);
    const g=s.add.graphics().setDepth(20001);g.fillStyle(0x6d6a62,1).fillCircle(0,0,4).lineStyle(1,0x2e2c27,1).strokeCircle(0,0,4);g.setPosition(from.x,from.y-30);
    const peak=Math.min(from.y,to.y)-120,state={p:0};s.tweens.add({targets:state,p:1,duration:900,onUpdate:()=>{const p=state.p,x=from.x+(to.x-from.x)*p,y=(1-p)*(1-p)*(from.y-30)+2*(1-p)*p*peak+p*p*(to.y-40);g.setPosition(x,y);},onComplete:()=>g.destroy()});
  }
  // --- Military Wagon ---
  wagon(worker,v,delta){
    worker.wagonWait=(worker.wagonWait??0)-delta;if(worker.wagonWait>0)return this.wagonState(worker,v);worker.wagonWait=WAGON_SUPPLY.every;
    const loaded=this.loadFromStore(worker,v,WAGON_SUPPLY.load);
    // Stones for the Catapults near it.
    for(const crew of this.crews('catapult')){const c=this.vehicleOf(crew);if(!c||Math.hypot(crew.position.x-worker.position.x,crew.position.y-worker.position.y)>WAGON_SUPPLY.supplyRadius)continue;
      const n=Math.min(CATAPULT.ammo-(c.ammo??0),v.supplies?.stone??0);if(n>0){c.ammo=(c.ammo??0)+n;v.supplies.stone-=n;if(!v.supplies.stone)delete v.supplies.stone;this.vehicles.changed();}}
    worker.wagonLoading=loaded;return this.wagonState(worker,v);
  }
  wagonState(worker,v){worker.workState='Waiting';worker.workMessage=worker.wagonLoading?'Loading supplies':'Supplying the army';return true;}
  // Takes from a store within reach up to `targets` ({stone, food, torch}: food is any kind of food). True if it took.
  loadFromStore(worker,v,targets){
    const s=this.scene,storage=this.storage;if(!storage)return false;
    const near=[...storage.locations.values()].filter(l=>storage.isStock(l)&&Math.hypot(Math.max(l.x-worker.tile.x,0,worker.tile.x-(l.x+(l.width??1)-1)),Math.max(l.y-worker.tile.y,0,worker.tile.y-(l.y+(l.height??1)-1)))<=WAGON_SUPPLY.loadRadius);if(!near.length)return false;
    let took=false;
    for(const [kind,target] of Object.entries(targets)){
      const ids=kind==='food'?EDIBLE_RESOURCES:[kind];
      for(const l of near)for(const id of ids){
        const have=kind==='stone'&&v.type==='catapult'?v.ammo??0:supplyAmount(v.supplies,kind),want=target-have;if(want<=0)break;
        const n=Math.min(want,storage.free(l.id,id));if(n<=0||!storage.withdraw(l.id,id,n))continue;took=true;
        if(v.type==='catapult')v.ammo=(v.ammo??0)+n;else{v.supplies??={};v.supplies[id]=(v.supplies[id]??0)+n;}
        s.resourceLedger?.expense?.(id,n,v.type==='catapult'?'Catapult Stones':'Military Wagon',{id:`supply:${v.id}:${id}:${s.gameTime?.totalElapsed??0}`,entityId:worker.id});
      }
    }
    if(took){this.vehicles.changed();s.updateInventory?.();}return took;
  }
  // A Wagon within reach of this soldier that holds this supply.
  nearWagon(actor,kind){
    if(!actor?.position||actor.profession!=='soldier')return null;
    for(const crew of this.crews('military_wagon')){const v=this.vehicleOf(crew);if(supplyAmount(v?.supplies,kind)>0&&Math.hypot(crew.position.x-actor.position.x,crew.position.y-actor.position.y)<=WAGON_SUPPLY.supplyRadius)return v;}
    return null;
  }
  // A meal from a Wagon nearby: the food id eaten, or null.
  meal(actor,order=EDIBLE_RESOURCES){const v=this.nearWagon(actor,'food');if(!v)return null;const id=order.find(k=>(v.supplies[k]??0)>0);if(!id)return null;v.supplies[id]--;if(!v.supplies[id])delete v.supplies[id];this.vehicles.changed();return id;}
  // A Torch from a Wagon nearby (true when one was taken).
  torch(actor){const v=this.nearWagon(actor,'torch');if(!v)return false;v.supplies.torch--;if(!v.supplies.torch)delete v.supplies.torch;this.vehicles.changed();return true;}
  // Test map: a crew put down with its vehicle at once, full of Stones / supplies.
  sandboxCrew(worker,type){
    const spec=UNIT_TYPES[type];if(!spec?.vehicle||!this.vehicles)return null;const v=this.vehicles.create(spec.vehicle,worker.tile);v.state='inUse';v.operatorId=worker.id;v.crew=true;
    if(type==='catapult')v.ammo=CATAPULT.ammo;else v.supplies={stone:WAGON_SUPPLY.load.stone,bread:WAGON_SUPPLY.load.food,torch:WAGON_SUPPLY.load.torch};this.vehicles.changed();return v;
  }
}
