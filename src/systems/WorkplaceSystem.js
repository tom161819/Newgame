import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { WORKPLACES,staffingOutput,staffingWorkFactor } from '../data/workplaces.js';
import { canInteractAdjacent } from '../game/interaction.js';
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
  present(building){
    return this.employees(building).filter(worker=>{
      if(worker.nextTile||worker.path.length||worker.cargo||worker.leaving||worker.commandState&&worker.commandState.state!=='Working')return false;
      if(this.atWorkplace(worker))return true;
      const farming=this.scene.farmingSystem,tending=farming?.tending?.get(worker.id);
      if(tending&&farming.inRange(worker,farming.building(tending.targetId))&&this.scene.workerSystem.ai.atGoal(worker,tending.goal))return true;
      const stableJob=this.scene.stables?.jobs.get(worker.id),horse=stableJob&&this.scene.stables.horse(stableJob.horseId);
      if(stableJob?.phase==='taming'&&horse?.isAlive&&canInteractAdjacent(this.scene.map,worker,horse))return true;
      const task=worker.workTask;
      return ['mineDeposit','chopTree','clearMark','harvest','build','mine','mineDrop','collectMeat','fish'].includes(task?.kind)&&this.scene.workerSystem.ai.atGoal(worker,task.goal);
    });
  }
  staffing(building){const spec=buildingDefinition(building).workplace,present=this.present(building).length;return {present,output:staffingOutput(spec,present),missing:Math.max(0,spec.capacity-present),factor:staffingWorkFactor(spec,present)};}
  workFactor(worker){const home=this.building(worker);return home?this.staffing(home).factor:1;}
  reconcileDefinitions(){
    for(const building of this.scene.buildings){
      const definition=this.scene.objectRegistry.get(building.type);if(!definition?.workplace)continue;
      building.definition=definition;const record=this.records.get(building.id);if(!record)continue;
      const excess=this.employees(building).slice(definition.workplace.capacity);record.capacity=definition.workplace.capacity;
      for(const worker of excess){this.scene.employment?.hold(worker);this.scene.stables?.cancel(worker);this.scene.military?.release(worker);this.remove(worker);}
      this.changed(building.id);
    }
    this.scene.employment?.request();
  }
  predictedWage(worker,profession){return this.scene.wageSystem.dailyWage({...worker,profession});}
  autoEmploy(building){
    const spec=buildingDefinition(building).workplace,record=this.register(building);if(!spec||!record)return;
    const candidates=this.scene.workerSystem.liveSubjects().filter(w=>w.profession==='idle'&&w.assignedWorkplaceId==null&&!w.arriving&&!w.cargo&&!w.workTask)
      .sort((a,b)=>(b.skills[spec.skill]?.level??1)-(a.skills[spec.skill]?.level??1)||a.id.localeCompare(b.id,undefined,{numeric:true}));
    for(const worker of candidates){if(record.workerIds.length>=spec.capacity)break;if(this.scene.workerSystem.ai.route(worker,towerNeighbors(building)))this.assign(building,worker);}
  }
  // After a manual profession change: a free seat of that profession, the emptiest building first, then the nearest
  // reachable one. Returns the building, or null when no building of the profession has room (the resident then stays
  // without a workplace). Professions without buildings (Hauler, Builder, Unemployed) are left alone.
  hasWorkplaces(profession){return this.scene.objectRegistry?.buildables?.().some(d=>d.workplace?.profession===profession)??false;}
  assignFree(worker){
    const profession=worker?.profession;if(!worker?.isAlive||!profession||profession==='idle'||worker.assignedWorkplaceId!=null)return null;
    const p=worker.position??{x:(worker.tile?.x??0)+.5,y:(worker.tile?.y??0)+.5},options=[];
    for(const building of this.scene.buildings){
      const spec=buildingDefinition(building).workplace;if(spec?.profession!==profession||!buildingIsComplete(building)||building.unverified||building.depleted||this.scene.employment?.blockReason(building))continue;
      const record=this.register(building);if(!record||record.workerIds.length>=spec.capacity)continue;
      const d=buildingDefinition(building);options.push({building,staff:record.workerIds.length,distance:Math.hypot(building.x+d.width/2-p.x,building.y+d.height/2-p.y)});
    }
    options.sort((a,b)=>a.staff-b.staff||a.distance-b.distance||a.building.id-b.building.id);
    for(const o of options)if(this.scene.workerSystem.ai.route(worker,towerNeighbors(o.building))&&this.assign(o.building,worker))return o.building;
    return null;
  }
  assign(building,worker){
    if(!worker?.isAlive||worker.isSubject===false||this.scene.gameOver||!this.scene.buildings.includes(building)||!this.scene.workerSystem.workers.has(worker.id))return false;
    const spec=buildingDefinition(building).workplace,record=this.register(building);if(!spec||!record)return false;
    if(worker.assignedWorkplaceId===building.id)return true;// m-vytezeny-dul-ctverecky (64): a depleted mine takes nobody, with or without automatic employment.
    if(building.depleted||this.scene.employment?.blockReason(building)||record.workerIds.length>=spec.capacity)return false;
    this.detach(worker);worker.displayProfession='idle';this.scene.workerSystem.jobs.assign(worker,spec.profession);
    worker.assignedWorkplaceId=building.id;worker.workplaceReached=false;worker.arriving=false;worker.workState='Going to Workplace';worker.aiCooldown=0;record.workerIds.push(worker.id);this.changed(building.id);return true;
  }
  detach(worker){
    worker.manualRockId=null;worker.clearingLoan=false;
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
    // A Hauler has no workplace: a picked-up loose stone becomes physical cargo for storage.
    if(worker?.profession==='hauler'&&worker.assignedWorkplaceId==null&&this.scene.foodStorage?.manages(resource)&&!worker.cargo){worker.cargo={resource,amount};return true;}
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
    return {...this.staffing(building),count:workers.length,capacity:spec.capacity,wages:workers.reduce((sum,w)=>sum+this.scene.wageSystem.dailyWage(w),0),
      averageSkill:workers.length?workers.reduce((sum,w)=>sum+w.skills[spec.skill].level,0)/workers.length:0,delivered:record.delivered};
  }
  exportState(){return {records:structuredClone([...this.records.values()])};}
  importState(data){
    if(data){this.records=new Map(data.records.map(record=>[record.buildingId,structuredClone(record)]));this.changed();return;}
    for(const worker of this.scene.workerSystem.liveWorkers())if(worker.profession!=='idle'&&!this.building(worker))this.remove(worker);
  }
  destroy(){this.unsubscribe();this.listeners.clear();this.records.clear();}
}
