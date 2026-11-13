import { reachableTiles } from '../game/pathfinding.js';
import { HAUL_URGENT,matchesHaulPriority } from '../data/logistics.js';
import { LOGISTICS_RULES,IDLE_STONE,carryCapacity } from '../data/logistics.js';
import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';

// Derived catalog only: physical ownership stays in storage, drops and cargo.
export class LogisticsTaskManager {
  constructor(scene){this.scene=scene;this.catalog=[];this.nextRefresh=0;this.failedRoutes=new Map();this.producerWaits=new Map();this.stoneAreaCache=null;}
  get storage(){return this.scene.foodStorage;}
  update(){
    const now=this.scene.gameTime.totalElapsed;if(now<this.nextRefresh)return;
    this.nextRefresh=now+LOGISTICS_RULES.planningInterval;this.catalog=[];
    for(const [key,expires]of this.failedRoutes)if(expires<=now)this.failedRoutes.delete(key);
    for(const key of this.producerWaits.keys())if(!this.scene.foodProduction.records.has(Number(key.split(':')[0])))this.producerWaits.delete(key);
    const storage=this.storage,stores=[...storage.locations.values()].filter(l=>storage.isStock(l));
    this.catalog.push(...(this.scene.constructionSystem?.materials.candidates()??[]),...(this.scene.military?.candidates()??[]),...(this.scene.trade?.candidates()??[]),...(this.scene.lightFuel?.candidates()??[]));
    for(const record of this.scene.foodProduction.records.values()){
      const building=this.scene.foodProduction.building(record.buildingId);if(!building||buildingDefinition(building).selfSupplied)continue;
      const recipe=this.scene.foodProduction.recipe(building),input=storage.locations.get(`input-${building.id}`);
      // m-nosici-trakar-pracoviste (62): the catalog offers the vehicle target; updateWorker trims it per carrier.
      if(record.auto&&input&&!this.scene.foodProduction.inputShortage(building)){
        for(const resource of Object.keys(recipe.input)){const missing=this.scene.foodProduction.inputTarget(building,resource,{bulk:true})-(input.stock[resource]??0)-storage.incoming(input.id,resource);
          if(missing>0)for(const source of stores)if(storage.free(source.id,resource)>0)this.catalog.push({priority:20,sourceId:source.id,destinationId:input.id,resource,amount:missing});}
      }
      // Every product lying in the output buffer is offered, also one of a recipe the workshop has switched away from.
      const [current]=Object.entries(recipe.output)[0],output=storage.locations.get(`output-${building.id}`);
      for(const outputResource of this.scene.foodProduction.outputResources(output.id,current)){
        const available=storage.free(output.id,outputResource),held=storage.reservations.get(record.outputReservation),cap=held?.resource===outputResource?held:null;
        for(const destination of stores)if(destination.allowed.includes(outputResource)&&(cap?destination.id===cap.locationId:storage.room(destination.id,outputResource)>0))this.catalog.push({priority:30,sourceId:output.id,destinationId:destination.id,resource:outputResource,amount:available,capacityReservation:cap?.id,outputBuildingId:building.id});
      }
    }
    // m-sklady-materialu-koncept (49): empty producer piles into the nearest Material Yard; the Starter Stockpile
    // (or any other store taking the good) only while no yard has room.
    for(const pile of storage.locations.values())if(pile.kind==='pile')for(const resource of Object.keys(pile.stock)){const amount=storage.free(pile.id,resource);if(amount>0)
      for(const destination of stores)if(destination.allowed.includes(resource)&&storage.room(destination.id,resource)>0)this.catalog.push({priority:destination.kind==='storage'?30:32,sourceId:pile.id,destinationId:destination.id,resource,amount,pile:true});}
    // One-way consolidation only: never shuttle goods between dedicated stores.
    for(const source of stores.filter(l=>l.kind==='fallback'))for(const [resource]of Object.entries(source.stock))if(storage.free(source.id,resource)>0)
      for(const destination of stores.filter(l=>l.kind==='storage'&&l.allowed.includes(resource)&&storage.room(l.id,resource)>0))this.catalog.push({priority:40,sourceId:source.id,destinationId:destination.id,resource,amount:storage.free(source.id,resource)});
    for(const drop of this.scene.dropSystem.drops.values())if(storage.manages(drop.resource)&&this.scene.character.order?.dropId!==drop.id){
      if(drop.siteId!=null&&this.scene.constructionSystem?.materials.site(drop.siteId))continue;
      const edible=this.scene.objectRegistry.require(drop.resource).edible||drop.resource==='meat';
      for(const destination of stores)if(destination.allowed.includes(drop.resource)&&storage.room(destination.id,drop.resource)>0)this.catalog.push({priority:edible&&this.scene.foodSystem.shortage?10:35,sourceDropId:drop.id,destinationId:destination.id,resource:drop.resource,amount:drop.amount});
    }
  }
  // Haulers serve the whole kingdom without a workplace. A Builder calls this with
  // constructionOnly when no Hauler is free, reusing the same bookings.
  freeHauler(){return this.scene.workerSystem.liveWorkers().some(w=>(!w.commandState||w.commandState.state==='Working')&&w.profession==='hauler'&&!w.arriving&&!w.restPhase&&!w.workTask&&!w.cargo&&!['Fleeing','Recovering'].includes(w.workState));}
  // Day and night N2: `fuelOnly` (a Pitch Maker or a soldier tending torches) takes only light-fuel deliveries, `near`
  // keeps them within a range of a point.
  updateWorker(worker,{constructionOnly=false,fuelOnly=false,near=null}={}){
    if(worker.workTask||worker.cargo||worker.aiCooldown>0)return false;
    worker.aiCooldown=LOGISTICS_RULES.planningInterval;worker.workState='Waiting';worker.workMessage='Waiting for transport';this.update();
    const storage=this.storage,cap=resource=>carryCapacity(worker,resource),score=task=>{
      const source=task.sourceDropId?this.scene.dropSystem.drops.get(task.sourceDropId)?.tile:storage.locations.get(task.sourceId),target=storage.locations.get(task.destinationId);
      return source&&target?Math.hypot(worker.position.x-source.x,worker.position.y-source.y)+Math.hypot(source.x-target.x,source.y-target.y):Infinity;
    };
    const inRange=task=>{if(!near)return true;const d=storage.locations.get(task.destinationId);return !!d&&Math.hypot(d.x-near.x,d.y-near.y)<=near.range;};
    const candidates=this.catalog.filter(task=>(!constructionOnly||task.siteId!=null)&&(!fuelOnly||task.fuel)&&inRange(task)).map(task=>({task,score:score(task)})).filter(t=>Number.isFinite(t.score));
    // m-nosic-priorita: the Hauler's own choice first (urgent food for the hungry before everything), then the shared order.
    const want=worker.haulPriority,rank=task=>task.priority<=HAUL_URGENT?0:matchesHaulPriority(task,want)?1:2;
    candidates.sort((a,b)=>rank(a.task)-rank(b.task)||(rank(a.task)===1?0:a.task.priority-b.task.priority)||a.score-b.score);
    let attempts=0;
    for(const {task}of candidates){
      const destination=storage.locations.get(task.destinationId),drop=task.sourceDropId&&this.scene.dropSystem.drops.get(task.sourceDropId),existingCap=storage.reservations.get(task.capacityReservation);
      const allocation=task.allocationId&&storage.reservations.get(task.allocationId),available=task.allocationId?(allocation?.owner===`site-${task.siteId}`?allocation.amount:0):drop?.amount??storage.free(task.sourceId,task.resource),room=existingCap?.amount??storage.room(task.destinationId,task.resource);
      let missing=task.amount;if(destination?.kind==='input'){const b=this.scene.buildings.find(b=>b.id===destination.buildingId),recipe=b&&this.scene.foodProduction.recipe(b);if(!b||this.scene.foodProduction.inputShortage(b))continue;missing=(recipe?this.scene.foodProduction.inputTarget(b,task.resource,{bulk:this.scene.foodProduction.bulkCarrier(worker)}):0)-(destination.stock[task.resource]??0)-storage.incoming(destination.id,task.resource);}
      if(destination?.kind==='kit')missing=this.scene.military?.missing(destination.buildingId,task.resource)??0;
      const amount=Math.min(cap(task.resource),available,room,missing);if(amount<=0||!destination||drop&&!this.scene.workerSystem.reservations.available(`drop:${drop.id}`,worker.id))continue;
      const routeKey=`${worker.id}:${task.sourceDropId??task.sourceId}:${task.destinationId}`;
      if(this.failedRoutes.has(routeKey))continue;
      if(++attempts>8)break;
      if(!storage.route(worker,[destination])){this.failedRoutes.set(routeKey,this.scene.gameTime.totalElapsed+2000);continue;}
      const options={...task,hauling:worker.profession==='hauler'},success=drop?this.scene.foodProduction.moveGround(worker,drop,destination.id,amount,options):this.scene.foodProduction.move(worker,task.sourceId,destination.id,task.resource,amount,options);
      if(success)return true;this.failedRoutes.set(routeKey,this.scene.gameTime.totalElapsed+2000);
    }
    return false;
  }
  // Hauler loop: real transport first; idle collection uses reachable kingdom hubs.
  updateHauler(worker,delta){
    if(worker.workTask?.kind==='mine'){this.collectStone(worker,delta);return;}
    if(worker.workTask||worker.cargo||worker.aiCooldown>0)return;
    if(!this.updateWorker(worker))this.startStone(worker);
  }
  castleCentre(){
    const castle=this.scene.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b));if(!castle)return null;
    const d=buildingDefinition(castle);return {x:castle.x+(d.width-1)/2,y:castle.y+(d.height-1)/2};
  }
  stoneAreas(worker){
    const now=this.scene.gameTime.totalElapsed,revision=`${this.scene.constructionSystem?.revision??0}:${this.storage.locations.size}`;
    let cache=this.stoneAreaCache;
    if(!cache||now>=cache.expires||cache.revision!==revision){
      const areas=[],centre=b=>{const d=buildingDefinition(b);return {x:b.x+(d.width-1)/2,y:b.y+(d.height-1)/2};};
      for(const b of this.scene.buildings)if(b.type==='castle'&&buildingIsComplete(b))areas.push({id:`castle-${b.id}`,kind:'castle',...centre(b),goals:towerNeighbors(b).filter(t=>this.scene.map[t.y]?.[t.x]===0)});
      for(const location of this.storage.locations.values())if(this.storage.isStock(location)&&location.allowed.includes('stone'))areas.push({id:location.id,kind:'storage',x:location.x+(location.width-1)/2,y:location.y+(location.height-1)/2,goals:this.storage.goals(location)});
      // Sites extend the collection area, not the material ownership rules:
      // fresh loose stone still goes to normal storage before any site booking.
      for(const site of this.scene.constructionSystem?.sites.values()??[])if(!site.unverified&&(site.materialSupply?.required?.stone??buildingDefinition(site).cost.stone??0)>0){const location=this.storage.locations.get(`site-${site.id}`);if(location)areas.push({id:location.id,kind:'site',...centre(site),goals:this.storage.goals(location)});}
      cache=this.stoneAreaCache={expires:now+LOGISTICS_RULES.planningInterval,revision,areas,regions:new Map()};
    }
    const start=worker.nextTile??worker.tile,key=tileKey(start);let region=cache.regions.get(key);
    if(!region){
      // Share physical connectivity among Haulers in the same component for
      // this planning interval, rather than pathfinding to every centre/unit.
      const tiles=reachableTiles(this.scene.map,[start]);region=new Set(tiles.map(tileKey));for(const tile of tiles)cache.regions.set(tileKey(tile),region);
    }
    return cache.areas.filter(area=>area.goals.some(t=>region.has(tileKey(t))));
  }
  stoneInRange(worker,tile,areas=this.stoneAreas(worker)){
    const settings=worker.stoneCollection;return !!settings?.enabled&&areas.some(area=>Math.hypot(tile.x-area.x,tile.y-area.y)<=settings.radius);
  }
  looseStones(worker){
    const settings=worker.stoneCollection;if(!settings?.enabled)return [];const areas=this.stoneAreas(worker);if(!areas.length)return [];
    const reservations=this.scene.workerSystem.reservations,king=this.scene.character.order?.pickupKey;
    return [...this.scene.resources.entries()].filter(([key,view])=>view.getData('objectId')==='stone'&&key!==king&&reservations.available(`resource:${key}`,worker.id)&&this.stoneInRange(worker,view.getData('tile'),areas));
  }
  startStone(worker){
    const settings=worker.stoneCollection;if(!settings?.enabled)return false;
    if(!this.stoneAreas(worker).length){worker.workMessage='No reachable collection area';return false;}
    if(!this.storage.findDestination(worker,'stone',1)){worker.workMessage='No storage room for loose stone';return false;}
    const near=this.looseStones(worker).map(([key,view])=>({key,tile:view.getData('tile')})).sort((a,b)=>Math.hypot(a.tile.x-worker.position.x,a.tile.y-worker.position.y)-Math.hypot(b.tile.x-worker.position.x,b.tile.y-worker.position.y)).slice(0,IDLE_STONE.candidates);
    if(!near.length)return false;
    const ai=this.scene.workerSystem.ai,route=ai.route(worker,near.map(s=>s.tile));if(!route)return false;
    const target=near.find(s=>tileKey(s.tile)===tileKey(route.destination));if(!target)return false;
    if(!ai.reserve(worker,`resource:${target.key}`,{kind:'mine',targetId:target.key,idleStone:true},route))return false;
    worker.workMessage='Collecting loose stone';return true;
  }
  collectStone(worker,delta){
    const task=worker.workTask,ai=this.scene.workerSystem.ai,view=this.scene.resources.get(task.targetId),settings=worker.stoneCollection;
    const tile=view?.getData('tile');
    if(!view||!settings?.enabled||!this.stoneInRange(worker,tile)||this.scene.character.order?.pickupKey===task.targetId){ai.cancel(worker);worker.workState='Searching for Work';return;}
    // A real transport task takes over before the stone is picked up.
    if(worker.aiCooldown<=0){
      const saved={task,path:worker.path,state:worker.workState,message:worker.workMessage};worker.workTask=null;
      if(this.updateWorker(worker)){this.scene.workerSystem.reservations.release(task.reservation,worker.id);return;}
      Object.assign(worker,{workTask:saved.task,path:saved.path,workState:saved.state,workMessage:saved.message});
    }
    if(!ai.ensureRoute(worker,task.goal))return;
    worker.workState='Working';worker.workMessage='Picking up loose stone';task.progressMs+=delta;
    if(task.progressMs>=IDLE_STONE.pickupDuration){this.scene.collectResource(task.targetId,worker.tile,worker);ai.cancel(worker);worker.workState='Searching for Work';}
  }
  waitForHauler(building,kind){
    if(buildingDefinition(building).selfSupplied)return false;
    const record=this.scene.foodProduction.records.get(building.id),now=this.scene.gameTime.totalElapsed,key=`${building.id}:${kind}`;
    let wait=this.producerWaits.get(key);if(!wait||wait.cycle!==record.nextCycle){wait={cycle:record.nextCycle,since:now,checkedAt:-Infinity,available:false};this.producerWaits.set(key,wait);}
    if(now-wait.since>=3000)return false;
    if(now-wait.checkedAt>=500){
      wait.checkedAt=now;const location=this.storage.locations.get(`${kind}-${building.id}`);
      wait.available=this.scene.workerSystem.liveWorkers().filter(w=>(!w.commandState||w.commandState.state==='Working')&&w.profession==='hauler'&&!w.arriving&&!w.restPhase).slice(0,6).some(w=>!!this.storage.route(w,[location]));
    }return wait.available;
  }
  destroy(){this.stoneAreaCache=null;this.catalog=[];this.failedRoutes.clear();this.producerWaits.clear();}
}
