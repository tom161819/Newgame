import { LOGISTICS_RULES,IDLE_STONE,carryCapacity } from '../data/logistics.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';

// Derived catalog only: physical ownership stays in storage, drops and cargo.
export class LogisticsTaskManager {
  constructor(scene){this.scene=scene;this.catalog=[];this.nextRefresh=0;this.failedRoutes=new Map();this.producerWaits=new Map();}
  get storage(){return this.scene.foodStorage;}
  update(){
    const now=this.scene.gameTime.totalElapsed;if(now<this.nextRefresh)return;
    this.nextRefresh=now+LOGISTICS_RULES.planningInterval;this.catalog=[];
    for(const [key,expires]of this.failedRoutes)if(expires<=now)this.failedRoutes.delete(key);
    for(const key of this.producerWaits.keys())if(!this.scene.foodProduction.records.has(Number(key.split(':')[0])))this.producerWaits.delete(key);
    const storage=this.storage,stores=[...storage.locations.values()].filter(l=>storage.isStock(l));
    this.catalog.push(...(this.scene.constructionSystem?.materials.candidates()??[]));
    for(const record of this.scene.foodProduction.records.values()){
      const building=this.scene.foodProduction.building(record.buildingId);if(!building)continue;
      const recipe=buildingDefinition(building).recipe,input=storage.locations.get(`input-${building.id}`);
      if(record.auto&&!record.cycle&&input&&!this.scene.foodProduction.inputShortage(building)){
        for(const [resource,needed]of Object.entries(recipe.input)){const missing=needed-(input.stock[resource]??0)-storage.incoming(input.id,resource);
          if(missing>0)for(const source of stores)if(storage.free(source.id,resource)>0)this.catalog.push({priority:20,sourceId:source.id,destinationId:input.id,resource,amount:missing});}
      }
      const [outputResource]=Object.entries(recipe.output)[0],output=storage.locations.get(`output-${building.id}`),available=storage.free(output.id,outputResource);
      if(available>0){
        const cap=storage.reservations.get(record.outputReservation);
        for(const destination of stores)if(destination.allowed.includes(outputResource)&&(cap?destination.id===cap.locationId:storage.room(destination.id)>0))this.catalog.push({priority:30,sourceId:output.id,destinationId:destination.id,resource:outputResource,amount:available,capacityReservation:cap?.id,outputBuildingId:building.id});
      }
    }
    // One-way consolidation only: never shuttle goods between dedicated stores.
    for(const source of stores.filter(l=>l.kind==='fallback'))for(const [resource]of Object.entries(source.stock))if(storage.free(source.id,resource)>0)
      for(const destination of stores.filter(l=>l.kind==='storage'&&l.allowed.includes(resource)&&storage.room(l.id)>0))this.catalog.push({priority:40,sourceId:source.id,destinationId:destination.id,resource,amount:storage.free(source.id,resource)});
    for(const drop of this.scene.dropSystem.drops.values())if(storage.manages(drop.resource)&&this.scene.character.order?.dropId!==drop.id){
      if(drop.siteId!=null&&this.scene.constructionSystem?.materials.site(drop.siteId))continue;
      const edible=this.scene.objectRegistry.require(drop.resource).edible||drop.resource==='meat';
      for(const destination of stores)if(destination.allowed.includes(drop.resource)&&storage.room(destination.id)>0)this.catalog.push({priority:edible&&this.scene.foodSystem.shortage?10:35,sourceDropId:drop.id,destinationId:destination.id,resource:drop.resource,amount:drop.amount});
    }
  }
  // Haulers serve the whole kingdom without a workplace. A Builder calls this with
  // constructionOnly when no Hauler is free, reusing the same bookings.
  freeHauler(){return this.scene.workerSystem.liveWorkers().some(w=>w.profession==='hauler'&&!w.arriving&&!w.workTask&&!w.cargo&&!['Fleeing','Recovering'].includes(w.workState));}
  updateWorker(worker,{constructionOnly=false}={}){
    if(worker.workTask||worker.cargo||worker.aiCooldown>0)return false;
    worker.aiCooldown=LOGISTICS_RULES.planningInterval;worker.workState='Waiting';worker.workMessage='Waiting for transport';this.update();
    const storage=this.storage,cap=carryCapacity(worker),score=task=>{
      const source=task.sourceDropId?this.scene.dropSystem.drops.get(task.sourceDropId)?.tile:storage.locations.get(task.sourceId),target=storage.locations.get(task.destinationId);
      return source&&target?Math.hypot(worker.position.x-source.x,worker.position.y-source.y)+Math.hypot(source.x-target.x,source.y-target.y):Infinity;
    };
    const candidates=this.catalog.filter(task=>!constructionOnly||task.siteId!=null).map(task=>({task,score:score(task)})).filter(t=>Number.isFinite(t.score)).sort((a,b)=>a.task.priority-b.task.priority||a.score-b.score);
    let attempts=0;
    for(const {task}of candidates){
      const destination=storage.locations.get(task.destinationId),drop=task.sourceDropId&&this.scene.dropSystem.drops.get(task.sourceDropId),existingCap=storage.reservations.get(task.capacityReservation);
      const allocation=task.allocationId&&storage.reservations.get(task.allocationId),available=task.allocationId?(allocation?.owner===`site-${task.siteId}`?allocation.amount:0):drop?.amount??storage.free(task.sourceId,task.resource),room=existingCap?.amount??storage.room(task.destinationId);
      let missing=task.amount;if(destination?.kind==='input'){const b=this.scene.buildings.find(b=>b.id===destination.buildingId),recipe=b&&buildingDefinition(b).recipe;if(!b||this.scene.foodProduction.inputShortage(b))continue;missing=(recipe?.input[task.resource]??0)-(destination.stock[task.resource]??0)-storage.incoming(destination.id,task.resource);}
      const amount=Math.min(cap,available,room,missing);if(amount<=0||!destination||drop&&!this.scene.workerSystem.reservations.available(`drop:${drop.id}`,worker.id))continue;
      const routeKey=`${worker.id}:${task.sourceDropId??task.sourceId}:${task.destinationId}`;
      if(this.failedRoutes.has(routeKey))continue;
      if(++attempts>8)break;
      if(!storage.route(worker,[destination])){this.failedRoutes.set(routeKey,this.scene.gameTime.totalElapsed+2000);continue;}
      const options={...task,hauling:worker.profession==='hauler'},success=drop?this.scene.foodProduction.moveGround(worker,drop,destination.id,amount,options):this.scene.foodProduction.move(worker,task.sourceId,destination.id,task.resource,amount,options);
      if(success)return true;this.failedRoutes.set(routeKey,this.scene.gameTime.totalElapsed+2000);
    }
    return false;
  }
  // Hauler loop: real transport first; when idle, loose stones near the Castle.
  updateHauler(worker,delta){
    if(worker.workTask?.kind==='mine'){this.collectStone(worker,delta);return;}
    if(worker.workTask||worker.cargo||worker.aiCooldown>0)return;
    if(!this.updateWorker(worker))this.startStone(worker);
  }
  castleCentre(){
    const castle=this.scene.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b));if(!castle)return null;
    const d=buildingDefinition(castle);return {x:castle.x+(d.width-1)/2,y:castle.y+(d.height-1)/2};
  }
  looseStones(worker){
    const settings=worker.stoneCollection,centre=this.castleCentre();if(!settings?.enabled||!centre)return [];
    const reservations=this.scene.workerSystem.reservations,king=this.scene.character.order?.pickupKey;
    return [...this.scene.resources.entries()].filter(([key,view])=>{
      const tile=view.getData('tile');
      return view.getData('objectId')==='stone'&&key!==king&&reservations.available(`resource:${key}`,worker.id)&&Math.hypot(tile.x-centre.x,tile.y-centre.y)<=settings.radius;
    });
  }
  startStone(worker){
    const settings=worker.stoneCollection;if(!settings?.enabled)return false;
    if(!this.castleCentre()){worker.workMessage='No Castle: loose stone collection paused';return false;}
    if(!this.storage.findDestination(worker,'stone',1)){worker.workMessage='No storage room for loose stone';return false;}
    const near=this.looseStones(worker).map(([key,view])=>({key,tile:view.getData('tile')})).sort((a,b)=>Math.hypot(a.tile.x-worker.position.x,a.tile.y-worker.position.y)-Math.hypot(b.tile.x-worker.position.x,b.tile.y-worker.position.y)).slice(0,IDLE_STONE.candidates);
    if(!near.length)return false;
    const ai=this.scene.workerSystem.ai,route=ai.route(worker,near.map(s=>s.tile));if(!route)return false;
    const target=near.find(s=>tileKey(s.tile)===tileKey(route.destination));if(!target)return false;
    if(!ai.reserve(worker,`resource:${target.key}`,{kind:'mine',targetId:target.key,idleStone:true},route))return false;
    worker.workMessage='Collecting loose stone';return true;
  }
  collectStone(worker,delta){
    const task=worker.workTask,ai=this.scene.workerSystem.ai,view=this.scene.resources.get(task.targetId),centre=this.castleCentre(),settings=worker.stoneCollection;
    const tile=view?.getData('tile');
    if(!view||!settings?.enabled||!centre||Math.hypot(tile.x-centre.x,tile.y-centre.y)>settings.radius||this.scene.character.order?.pickupKey===task.targetId){ai.cancel(worker);worker.workState='Searching for Work';return;}
    // A real transport task takes over before the stone is picked up.
    if(worker.aiCooldown<=0&&!ai.atGoal(worker,task.goal)){
      const saved={task,path:worker.path,state:worker.workState,message:worker.workMessage};worker.workTask=null;
      if(this.updateWorker(worker)){this.scene.workerSystem.reservations.release(task.reservation,worker.id);return;}
      Object.assign(worker,{workTask:saved.task,path:saved.path,workState:saved.state,workMessage:saved.message});
    }
    if(!ai.ensureRoute(worker,task.goal))return;
    worker.workState='Working';worker.workMessage='Picking up loose stone';task.progressMs+=delta;
    if(task.progressMs>=IDLE_STONE.pickupDuration){this.scene.collectResource(task.targetId,worker.tile,worker);ai.cancel(worker);worker.workState='Searching for Work';}
  }
  waitForHauler(building,kind){
    const record=this.scene.foodProduction.records.get(building.id),now=this.scene.gameTime.totalElapsed,key=`${building.id}:${kind}`;
    let wait=this.producerWaits.get(key);if(!wait||wait.cycle!==record.nextCycle){wait={cycle:record.nextCycle,since:now,checkedAt:-Infinity,available:false};this.producerWaits.set(key,wait);}
    if(now-wait.since>=3000)return false;
    if(now-wait.checkedAt>=500){
      wait.checkedAt=now;const location=this.storage.locations.get(`${kind}-${building.id}`);
      wait.available=this.scene.workerSystem.liveWorkers().filter(w=>w.profession==='hauler'&&!w.arriving).slice(0,6).some(w=>!!this.storage.route(w,[location]));
    }return wait.available;
  }
  destroy(){this.catalog=[];this.failedRoutes.clear();this.producerWaits.clear();}
}
