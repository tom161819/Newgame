import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { WORKPLACES } from '../data/workplaces.js';
import { tileKey } from '../game/stones.js';

export class WorkplaceSystem {
  constructor(scene){
    this.scene=scene;this.records=new Map();this.listeners=new Set();
    this.unsubscribe=scene.workerSystem.jobs.onChange(worker=>{if(worker.assignedWorkplaceId!=null)this.detach(worker);});
  }
  requiresWorkplace(profession){return Object.values(WORKPLACES).some(w=>w.profession===profession);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(buildingId=null){for(const listener of this.listeners)listener(buildingId);}
  register(building){
    const spec=buildingDefinition(building).workplace;if(!spec||!buildingIsComplete(building))return null;
    if(!this.records.has(building.id)){this.records.set(building.id,{buildingId:building.id,capacity:spec.capacity,workerIds:[],delivered:{}});this.changed(building.id);}
    return this.records.get(building.id);
  }
  building(worker){return this.scene.buildings.find(b=>b.id===worker?.assignedWorkplaceId&&buildingIsComplete(b)&&buildingDefinition(b).workplace)??null;}
  goals(worker){const building=this.building(worker);return building?towerNeighbors(building).filter(t=>this.scene.map[t.y]?.[t.x]===0):[];}
  atWorkplace(worker){return !worker.nextTile&&!worker.path.length&&this.goals(worker).some(t=>tileKey(t)===tileKey(worker.tile));}
  employees(building){return (this.register(building)?.workerIds??[]).map(id=>this.scene.workerSystem.workers.get(id)).filter(w=>w?.isAlive&&w.isSubject!==false);}
  predictedWage(worker,profession){return this.scene.wageSystem.dailyWage({...worker,profession});}
  autoEmploy(building){
    const spec=buildingDefinition(building).workplace,record=this.register(building);if(!spec||!record)return;
    const candidates=this.scene.workerSystem.liveSubjects().filter(w=>w.profession==='idle'&&w.assignedWorkplaceId==null&&!w.arriving&&!w.cargo&&!w.workTask)
      .sort((a,b)=>(b.skills[spec.skill]?.level??1)-(a.skills[spec.skill]?.level??1)||a.id.localeCompare(b.id,undefined,{numeric:true}));
    for(const worker of candidates){if(record.workerIds.length>=spec.capacity)break;if(this.scene.workerSystem.ai.route(worker,towerNeighbors(building)))this.assign(building,worker);}
  }
  assign(building,worker){
    if(!worker?.isAlive||worker.isSubject===false||this.scene.gameOver||!this.scene.buildings.includes(building)||!this.scene.workerSystem.workers.has(worker.id))return false;
    const spec=buildingDefinition(building).workplace,record=this.register(building);if(!spec||!record)return false;
    if(worker.assignedWorkplaceId===building.id)return true;if(record.workerIds.length>=spec.capacity)return false;
    this.detach(worker);this.scene.workerSystem.jobs.assign(worker,spec.profession);
    worker.assignedWorkplaceId=building.id;worker.workplaceReached=false;worker.arriving=false;worker.workState='Going to Workplace';worker.aiCooldown=0;record.workerIds.push(worker.id);this.changed(building.id);return true;
  }
  detach(worker){
    this.scene.workerSystem.ai.cancel(worker);
    const changed=[];for(const record of this.records.values()){const before=record.workerIds.length;record.workerIds=record.workerIds.filter(id=>id!==worker.id);if(before!==record.workerIds.length)changed.push(record.buildingId);}
    this.dropCargo(worker);worker.assignedWorkplaceId=null;worker.workplaceReached=false;for(const id of changed)this.changed(id);
  }
  remove(worker){this.detach(worker);if(worker.isAlive)this.scene.workerSystem.jobs.assign(worker,'idle');}
  dropCargo(worker){
    if(worker.cargo)this.scene.dropSystem.create(worker.cargo.resource,{x:Math.floor(worker.position.x),y:Math.floor(worker.position.y)},worker.cargo.amount,null,
      {siteId:worker.cargo.siteId??null,haulEligible:!worker.cargo.transportCancelled,rewardRemaining:(worker.pendingWorkRewards??[]).filter(e=>e.type==='dropCollected').reduce((n,e)=>n+(e.contributionRatio??1),0),rewardUnits:(worker.pendingWorkRewards??[]).filter(e=>e.type==='resourceCollected'&&e.objectType==='stone').reduce((n,e)=>n+(e.quantity??1)*(e.contributionRatio??1),0)});
    worker.cargo=null;worker.pendingWorkRewards=[];
  }
  carryCollection(worker,{resource,amount,event}){
    if(!this.building(worker))return false;
    worker.cargo={resource,amount};worker.pendingWorkRewards??=[];worker.pendingWorkRewards.push(event);return true;
  }
  deferReward(worker,event){if(worker.profession!=='hunter'||!this.building(worker))return false;(worker.pendingWorkRewards??=[]).push(event);return true;}
  deliver(worker){
    if(!worker.cargo||!this.atWorkplace(worker))return false;
    if(this.scene.foodStorage?.manages(worker.cargo.resource))return false;
    const record=this.records.get(worker.assignedWorkplaceId),cargo=worker.cargo,rewards=worker.pendingWorkRewards??[];
    // Náklad je odstraněn před událostmi: další snímek nebo save nemůže zásilku zopakovat.
    worker.cargo=null;worker.pendingWorkRewards=[];record.delivered[cargo.resource]=(record.delivered[cargo.resource]??0)+cargo.amount;
    this.scene.inventory.add(cargo.resource,cargo.amount,{track:false});for(const event of rewards){const {type,...data}=event;this.scene.activities.emit(type,{...data,actor:worker});}
    this.scene.updateInventory();return true;
  }
  summary(building){
    const workers=this.employees(building),record=this.register(building),spec=buildingDefinition(building).workplace;
    return {count:workers.length,capacity:spec.capacity,wages:workers.reduce((sum,w)=>sum+this.scene.wageSystem.dailyWage(w),0),
      averageSkill:workers.length?workers.reduce((sum,w)=>sum+w.skills[spec.skill].level,0)/workers.length:0,delivered:record.delivered};
  }
  exportState(){return {records:structuredClone([...this.records.values()])};}
  importState(data){
    if(data){this.records=new Map(data.records.map(record=>[record.buildingId,structuredClone(record)]));this.changed();return;}
    for(const worker of this.scene.workerSystem.liveWorkers())if(worker.profession!=='idle'&&!this.building(worker))this.remove(worker);
  }
  destroy(){this.unsubscribe();this.listeners.clear();this.records.clear();}
}
