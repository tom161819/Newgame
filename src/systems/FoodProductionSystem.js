import { FOOD_RULES } from '../data/foodProduction.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { advanceConstruction } from './ConstructionProgress.js';
import { tileKey } from '../game/stones.js';
import { carryCapacity } from '../data/logistics.js';

const first=object=>Object.entries(object)[0];
export class FoodProductionSystem {
  constructor(scene){this.scene=scene;this.records=new Map();this.nextTransfer=1;for(const b of scene.buildings)this.register(b);}
  get storage(){return this.scene.foodStorage;}
  building(id){return this.scene.buildings.find(b=>b.id===id&&buildingIsComplete(b)&&buildingDefinition(b).recipe)??null;}
  register(building){
    if(!buildingIsComplete(building)||!buildingDefinition(building).recipe)return;
    this.storage.register(building);
    if(!this.records.has(building.id))this.records.set(building.id,{buildingId:building.id,auto:true,nextCycle:1,cycle:null,outputReservation:null,completed:0});
  }
  cancelWorker(worker){
    const task=worker.workTask;if(!['foodPickup','foodDeliver','produce','harvest'].includes(task?.kind))return;
    if(task.hauling&&task.kind==='foodDeliver'&&worker.cargo)worker.cargo.transportCancelled=true;
    if(task.stockReservation)this.storage.release(task.stockReservation);
    const capacity=this.storage.reservations.get(task.capacityReservation);
    if(capacity?.owner===task.transferId||task.kind==='harvest')this.storage.release(task.capacityReservation);
  }
  setTask(worker,kind,route,data={}){
    const id=data.transferId??`food-transfer-${this.nextTransfer++}`,reservation=kind==='produce'?`production-slot:${tileKey(route.destination)}`:`food-task:${id}`;
    if(!this.scene.workerSystem.reservations.reserve(reservation,worker.id))return false;
    worker.workTask={...data,kind,goal:{...route.destination},progressMs:0,reservation,transferId:id};worker.path=route.path;
    worker.workState=kind==='produce'?'Working':'Traveling to Target';worker.workMessage=kind==='produce'?'Producing food':'Transporting food';return true;
  }
  move(worker,sourceId,destinationId,resource,amount,{capacityReservation=null,outputBuildingId=null,hauling=false}={}){
    const source=this.storage.locations.get(sourceId),destination=this.storage.locations.get(destinationId);if(!source||!destination)return false;
    if(sourceId===destinationId||amount>carryCapacity(worker))return false;
    const route=this.storage.route(worker,[source]);if(!route)return false;
    const transferId=`food-transfer-${this.nextTransfer++}`;
    const stockReservation=this.storage.reserve('stock',sourceId,resource,amount,transferId);if(!stockReservation)return false;
    const capacity=capacityReservation??this.storage.reserve('capacity',destinationId,resource,amount,transferId);
    if(!capacity){this.storage.release(stockReservation);return false;}
    if(!this.setTask(worker,'foodPickup',route,{transferId,sourceId,destinationId,resource,amount,stockReservation,capacityReservation:capacity,outputBuildingId,...(hauling?{hauling:true}: {})})){
      this.storage.release(stockReservation);if(!capacityReservation)this.storage.release(capacity);return false;
    }
    return true;
  }
  source(task){
    if(!task.sourceDropId)return this.storage.locations.get(task.sourceId);
    const drop=this.scene.dropSystem.drops.get(task.sourceDropId);return drop?{id:drop.id,kind:'ground',...drop.tile,width:1,height:1}:null;
  }
  moveGround(worker,drop,destinationId,amount,{hauling=true}={}){
    if(amount>carryCapacity(worker)||amount>drop.amount||this.scene.character.order?.dropId===drop.id)return false;
    const source=this.source({sourceDropId:drop.id}),route=source&&this.storage.route(worker,[source]);if(!route)return false;
    const reservation=`drop:${drop.id}`;if(!this.scene.workerSystem.reservations.reserve(reservation,worker.id))return false;
    const transferId=`food-transfer-${this.nextTransfer++}`,capacityReservation=this.storage.reserve('capacity',destinationId,drop.resource,amount,transferId);
    if(!capacityReservation||!this.setTask(worker,'foodPickup',route,{transferId,sourceDropId:drop.id,destinationId,resource:drop.resource,amount,capacityReservation,hauling})){
      this.storage.release(capacityReservation);this.scene.workerSystem.reservations.release(reservation,worker.id);return false;
    }
    return true;
  }
  prepareHarvest(worker,building,task){
    const crop=buildingDefinition(building).crop,route=this.storage.findDestination(worker,crop.resource,crop.yield);if(!route)return false;
    const transferId=`food-transfer-${this.nextTransfer++}`,capacityReservation=this.storage.reserve('capacity',route.location.id,crop.resource,crop.yield,transferId);if(!capacityReservation)return false;
    task.destinationId=route.location.id;task.capacityReservation=capacityReservation;task.transferId=transferId;return true;
  }
  harvest({worker,resource,amount}){
    worker.cargo={resource,amount};this.startDelivery(worker);
  }
  startDelivery(worker){
    const cargo=worker.cargo;if(!cargo)return false;
    const route=this.storage.findDestination(worker,cargo.resource,cargo.amount,{partial:true});if(!route){worker.workState='Waiting';worker.workMessage='Waiting for reachable food storage capacity';worker.aiCooldown=FOOD_RULES.searchInterval;return false;}
    const amount=Math.min(cargo.amount,this.storage.room(route.location.id),carryCapacity(worker)),transferId=`food-transfer-${this.nextTransfer++}`;
    const capacityReservation=this.storage.reserve('capacity',route.location.id,cargo.resource,amount,transferId);if(!capacityReservation)return false;
    if(!this.setTask(worker,'foodDeliver',route,{transferId,destinationId:route.location.id,resource:cargo.resource,amount,capacityReservation})){this.storage.release(capacityReservation);return false;}
    return true;
  }
  handles(worker){return ['foodPickup','foodDeliver'].includes(worker.workTask?.kind)||!!worker.cargo&&this.storage.manages(worker.cargo.resource);}
  handleTransport(worker){
    if(!this.handles(worker))return false;
    const task=worker.workTask;
    if(!['foodPickup','foodDeliver'].includes(task?.kind)){
      if(worker.aiCooldown<=0)this.startDelivery(worker);return true;
    }
    const id=task.kind==='foodPickup'?task.sourceId:task.destinationId,location=task.kind==='foodPickup'?this.source(task):this.storage.locations.get(id);
    if(!location||!this.storage.locations.has(task.destinationId)||!this.storage.reservations.has(task.capacityReservation)||task.kind==='foodPickup'&&task.stockReservation&&!this.storage.reservations.has(task.stockReservation)){
      this.scene.workerSystem.ai.cancel(worker);return true;
    }
    worker.workState=task.kind==='foodPickup'?'Traveling to Target':'Returning';worker.workMessage=`${task.kind==='foodPickup'?'Collecting':'Carrying'} ${worker.cargo?.amount??task.amount} ${task.resource}`;
    const atSource=task.sourceDropId&&task.kind==='foodPickup'?this.scene.workerSystem.ai.atGoal(worker,location):this.storage.atLocation(worker,id);
    if(!atSource&&!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){
      worker.aiCooldown=FOOD_RULES.searchInterval;const route=this.storage.route(worker,[location]);if(route){task.goal={...route.destination};worker.path=route.path;}
      else{worker.workState='Waiting';worker.workMessage='Food transport route is blocked';}
    }
    return true;
  }
  updateWorker(worker){
    const building=this.scene.workplaceSystem.building(worker),record=building&&this.records.get(building.id);
    if(!record){worker.workState='Waiting';worker.workMessage='Waiting for production workplace';return;}
    const recipe=buildingDefinition(building).recipe,outputId=`output-${building.id}`,inputId=`input-${building.id}`;
    if(worker.workTask?.kind==='produce'){
      if(!record.auto){this.scene.workerSystem.ai.cancel(worker);worker.workState='Waiting';worker.workMessage='Auto Production OFF';return;}
      if(!this.scene.workplaceSystem.atWorkplace(worker)&&!worker.nextTile&&!worker.path.length)worker.moveTo(this.scene.workplaceSystem.goals(worker));
      worker.workState='Working';worker.workMessage=`Producing ${first(recipe.output)[0]}`;return;
    }
    if(worker.workTask||worker.aiCooldown>0)return;
    worker.aiCooldown=FOOD_RULES.searchInterval;
    const [outputResource,outputAmount]=first(recipe.output),outputAvailable=this.storage.free(outputId,outputResource);
    if(outputAvailable){
      let cap=this.storage.reservations.get(record.outputReservation),destination=cap&&this.storage.locations.get(cap.locationId);
      if(!destination){const route=this.storage.findDestination(worker,outputResource,Math.min(outputAvailable,FOOD_RULES.carryCapacity));if(route)destination=route.location;}
      if(destination&&this.move(worker,outputId,destination.id,outputResource,Math.min(outputAvailable,FOOD_RULES.carryCapacity),{capacityReservation:cap?.id,outputBuildingId:building.id}))return;
    }
    if(!record.auto){worker.workState='Waiting';worker.workMessage='Auto Production OFF';return;}
    const [resource,needed]=first(recipe.input),input=this.storage.locations.get(inputId),incoming=[...this.scene.workerSystem.liveWorkers()].reduce((n,w)=>n+(w.workTask?.destinationId===inputId?w.workTask.amount:0),0);
    if(!record.cycle&&(input.stock[resource]??0)+incoming<needed){
      const source=this.storage.findSource(worker,resource),destinationRoute=this.storage.route(worker,[input]);
      if(source&&destinationRoute){const amount=Math.min(needed-(input.stock[resource]??0)-incoming,this.storage.free(source.location.id,resource),FOOD_RULES.carryCapacity);
        if(amount>0&&this.move(worker,source.location.id,inputId,resource,amount))return;}
      worker.workState='Waiting';worker.workMessage=`Waiting for ${resource}`;return;
    }
    if(!record.cycle&&(input.stock[resource]??0)<needed){worker.workState='Waiting';worker.workMessage=`Waiting for delivered ${resource}`;return;}
    if(!record.cycle&&!this.storage.findDestination(worker,outputResource,outputAmount)){worker.workState='Waiting';worker.workMessage='Food storage is full or unreachable';return;}
    const route=this.storage.route(worker,[input]);
    if(route&&this.setTask(worker,'produce',route,{targetId:building.id})){worker.workState='Working';worker.workMessage=`Producing ${outputResource}`;}
  }
  transfer(worker){
    const task=worker.workTask;if(!['foodPickup','foodDeliver'].includes(task?.kind))return;
    if(task.kind==='foodPickup'){
      const source=this.source(task),atSource=task.sourceDropId?source&&this.scene.workerSystem.ai.atGoal(worker,source):this.storage.atLocation(worker,task.sourceId);
      if(!atSource)return;
      if(task.waitingRoute&&worker.aiCooldown>0)return;
      const destination=this.storage.locations.get(task.destinationId),route=destination&&this.storage.route(worker,[destination]);
      if(!route){task.waitingRoute=true;worker.aiCooldown=FOOD_RULES.searchInterval;worker.workState='Waiting';worker.workMessage='Destination is unreachable; input remains reserved at source';return;}
      task.waitingRoute=false;
      const capacityBefore=this.storage.reservations.get(task.capacityReservation);if(!capacityBefore){this.scene.workerSystem.ai.cancel(worker);return;}
      const drop=task.sourceDropId&&this.scene.dropSystem.drops.get(task.sourceDropId);
      if(task.sourceDropId&&(!this.scene.workerSystem.reservations.available(`drop:${task.sourceDropId}`,worker.id)||this.scene.character.order?.dropId===task.sourceDropId)){this.scene.workerSystem.ai.cancel(worker);return;}
      const cargo=drop?this.scene.dropSystem.takeForTransport(drop.id,task.amount):this.storage.take(task.stockReservation);if(!cargo){this.scene.workerSystem.ai.cancel(worker);return;}
      if(task.sourceDropId)this.scene.workerSystem.reservations.release(`drop:${task.sourceDropId}`,worker.id);
      worker.cargo=cargo;const capacity=this.storage.reservations.get(task.capacityReservation);if(capacity)capacity.owner=task.transferId;
      if(task.outputBuildingId){const record=this.records.get(task.outputBuildingId);if(record?.outputReservation===task.capacityReservation)record.outputReservation=null;}
      task.kind='foodDeliver';task.goal={...route.destination};worker.path=route.path;
      if(task.hauling){task.loadedDistance=0;task.loadedPosition={...worker.position};}return;
    }
    if(!worker.cargo){this.scene.workerSystem.ai.cancel(worker);return;}
    if(!this.storage.atLocation(worker,task.destinationId))return;
    const capacity=this.storage.reservations.get(task.capacityReservation),destination=this.storage.locations.get(task.destinationId);
    if(!capacity||!destination){this.scene.workerSystem.ai.cancel(worker);return;}
    const amount=Math.min(worker.cargo.amount,capacity.amount);
    if(!this.storage.put(task.capacityReservation,amount,{transportCancelled:worker.cargo.transportCancelled})){worker.workState='Waiting';worker.workMessage='Waiting for storage capacity';return;}
    const resource=worker.cargo.resource,haulReward=task.hauling&&worker.profession==='hauler'&&!worker.cargo.transportCancelled&&Number.isFinite(task.loadedDistance);worker.cargo.amount-=amount;
    if(this.storage.isStock(destination)){
      const workplace=this.scene.workplaceSystem.records.get(worker.assignedWorkplaceId);if(workplace)workplace.delivered[resource]=(workplace.delivered[resource]??0)+amount;
    }
    if(!worker.cargo.amount){
      worker.cargo=null;const rewards=worker.pendingWorkRewards??[];worker.pendingWorkRewards=[];
      if(this.storage.isStock(destination))for(const event of rewards){const {type,...data}=event;this.scene.activities.emit(type,{...data,actor:worker});}
    }
    if(haulReward)this.scene.activities.emit('transportDelivered',{actor:worker,objectType:'hauler',quantity:amount,distance:task.loadedDistance},`haul-receipt-${task.transferId}`);
    this.scene.workerSystem.ai.cancel(worker);worker.workState='Searching for Work';this.scene.updateInventory();
  }
  update(delta){
    if(this.scene.gameOver||this.scene.gameTime.paused)return;
    for(const worker of this.scene.workerSystem.liveWorkers()){
      const task=worker.workTask;if(task?.hauling&&task.kind==='foodDeliver'&&task.loadedPosition){task.loadedDistance+=Math.hypot(worker.position.x-task.loadedPosition.x,worker.position.y-task.loadedPosition.y);task.loadedPosition={...worker.position};}
      this.transfer(worker);
    }
    for(const record of [...this.records.values()]){
      const building=this.building(record.buildingId);if(!building){this.remove(record);continue;}
      if(!record.auto)continue;
      const recipe=buildingDefinition(building).recipe,workers=this.scene.workplaceSystem.employees(building).filter(w=>w.workTask?.kind==='produce'&&this.scene.workplaceSystem.atWorkplace(w));
      if(!workers.length)continue;
      if(!record.cycle){
        const [inputResource,inputAmount]=first(recipe.input),[outputResource,outputAmount]=first(recipe.output),inputId=`input-${building.id}`;
        if(this.storage.free(inputId,inputResource)<inputAmount||this.storage.used(this.storage.locations.get(`output-${building.id}`)))continue;
        const destination=this.storage.findDestination(workers[0],outputResource,outputAmount);if(!destination)continue;
        const id=`food-cycle-${building.id}-${record.nextCycle++}`,capacity=this.storage.reserve('capacity',destination.location.id,outputResource,outputAmount,id);if(!capacity)continue;
        if(!this.storage.withdraw(inputId,inputResource,inputAmount)){this.storage.release(capacity);continue;}
        record.cycle={id,requiredWork:recipe.duration,workDone:0,progress:0,state:'building',contributions:{},inputs:{...recipe.input},outputReservation:capacity,startedAt:this.scene.gameTime.totalElapsed};
      }
      const cycle=record.cycle,participants=workers.map(w=>({id:w.id,speed:this.scene.skillSystem.workEfficiency(w,recipe.skill),available:Math.min(delta,w.availableWorkMs??0,Math.max(0,this.scene.gameTime.totalElapsed-cycle.startedAt))}));
      if(advanceConstruction({construction:cycle},participants,delta))this.finish(record,building);
    }
    for(const location of [...this.storage.locations.values()])if(location.buildingId!=null&&!this.scene.buildings.some(b=>b.id===location.buildingId)){
      for(const worker of this.scene.workerSystem.liveWorkers())if(worker.assignedWorkplaceId===location.buildingId)this.scene.workplaceSystem.remove(worker);
      this.scene.workplaceSystem.records.delete(location.buildingId);
      this.storage.removeBuilding({id:location.buildingId,x:location.x,y:location.y});
      for(const record of this.records.values()){
        if(record.cycle&&!this.storage.reservations.has(record.cycle.outputReservation))record.cycle.outputReservation=null;
        if(record.outputReservation&&!this.storage.reservations.has(record.outputReservation))record.outputReservation=null;
      }
      for(const w of this.scene.workerSystem.liveWorkers())if(['foodPickup','foodDeliver','harvest'].includes(w.workTask?.kind)&&!this.storage.reservations.has(w.workTask.capacityReservation))this.scene.workerSystem.ai.cancel(w);
    }
  }
  finish(record,building){
    const cycle=record.cycle;if(!cycle||cycle.workDone<cycle.requiredWork)return false;
    const recipe=buildingDefinition(building).recipe,[resource,amount]=first(recipe.output);
    if(!this.storage.deposit(`output-${building.id}`,resource,amount))return false;
    record.cycle=null;record.outputReservation=cycle.outputReservation;record.completed++;
    this.scene.foodSystem?.recordProduction(resource,amount,cycle.id);
    const contributors=Object.entries(cycle.contributions),total=contributors.reduce((n,[,work])=>n+work,0);let allocated=0;
    for(let i=0;i<contributors.length;i++){const[id,work]=contributors[i],ratio=i===contributors.length-1?1-allocated:work/total;allocated+=ratio;const worker=this.scene.workerSystem.workers.get(id);
      if(worker?.isAlive)this.scene.activities.emit('foodProduced',{actor:worker,objectType:building.type,contributionRatio:ratio,quantity:1},`${cycle.id}-${id}`);}
    for(const worker of this.scene.workplaceSystem.employees(building))if(worker.workTask?.kind==='produce')this.scene.workerSystem.ai.cancel(worker);
    this.scene.updateInventory();return true;
  }
  remove(record){
    for(const worker of this.scene.workerSystem.liveWorkers())if(worker.assignedWorkplaceId===record.buildingId)this.scene.workplaceSystem.remove(worker);
    this.scene.workplaceSystem.records.delete(record.buildingId);
    const cycle=record.cycle;if(cycle){const input=this.storage.locations.get(`input-${record.buildingId}`);if(input)for(const [resource,amount]of Object.entries(cycle.inputs))this.storage.spill(resource,amount,{x:input.x-1,y:input.y});this.storage.release(cycle.outputReservation);}
    this.storage.release(record.outputReservation);this.records.delete(record.buildingId);
  }
  toggle(buildingId,value){const record=this.records.get(buildingId);if(record)record.auto=!!value;}
  exportState(){return {records:structuredClone([...this.records.values()]),nextTransfer:this.nextTransfer};}
  importState(data){if(data){this.records=new Map(data.records.map(r=>[r.buildingId,structuredClone(r)]));this.nextTransfer=data.nextTransfer;}else for(const b of this.scene.buildings)this.register(b);}
  destroy(){this.records.clear();}
}
