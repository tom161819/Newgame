import { carryCapacity } from '../data/logistics.js';

export class KingLogisticsSystem {
  constructor(scene){this.scene=scene;this.nextId=1;this.task=null;this.workflowSiteId=null;this.nextRetry=0;scene.character.cargo=null;scene.character.pendingWorkRewards=[];}
  get actor(){return this.scene.character;}
  get storage(){return this.scene.foodStorage;}
  get materials(){return this.scene.constructionSystem?.materials;}
  room(resource,siteId=null){const cargo=this.actor.cargo;return !this.storage.manages(resource)||cargo&&(cargo.resource!==resource||(cargo.siteId??null)!==(siteId??null))?0:Math.max(0,carryCapacity(this.actor)-(cargo?.amount??0));}
  receive({resource,amount,event,siteId=null}){
    if(!Number.isSafeInteger(amount)||amount<=0||this.room(resource,siteId)<amount)return false;
    this.cancel();const actor=this.actor;if(actor.cargo)actor.cargo.amount+=amount;else actor.cargo={resource,amount,...(siteId!=null?{siteId}:{})};
    if(event)actor.pendingWorkRewards.push(event);this.startDelivery();return true;
  }
  cancel(){
    const task=this.task;if(task){if(task.stockReservation)this.materials?.returnAllocation(task.stockReservation);this.storage.release(task.capacityReservation);if(task.sourceDropId)this.scene.workerSystem.reservations.release(`drop:${task.sourceDropId}`,'king');this.actor.stopForBuilding();}
    this.task=null;this.workflowSiteId=null;this.nextRetry=0;
  }
  move(task,route){this.task=task;if(!this.actor.command({kind:'move',goal:route.destination,silent:true})){this.cancel();return false;}this.scene.worldCamera?.follow?.();return true;}
  startDelivery(buildingId=null,{resumeSiteId=null}={}){
    const actor=this.actor,cargo=actor.cargo;if(!cargo)return false;this.cancel();this.workflowSiteId=resumeSiteId;
    if(cargo.siteId!=null&&!this.materials?.site(cargo.siteId))delete cargo.siteId;
    if(cargo.siteId!=null&&buildingId==null)return this.startSiteDeposit(cargo.siteId);
    const route=buildingId==null?this.storage.findDestination(actor,cargo.resource,cargo.amount,{partial:true}):this.storage.route(actor,[...this.storage.locations.values()].filter(l=>l.buildingId===buildingId&&this.storage.isStock(l)&&l.allowed.includes(cargo.resource)&&this.storage.room(l.id)>0));
    if(!route){this.scene.setStatus('Cargo is preserved. No reachable storage has free capacity.');return false;}
    const amount=Math.min(cargo.amount,this.storage.room(route.location.id)),id=`king-transfer-${this.nextId++}`,capacityReservation=this.storage.reserve('capacity',route.location.id,cargo.resource,amount,id);if(!capacityReservation)return false;
    const task={id,kind:'deposit',destinationId:route.location.id,resource:cargo.resource,amount,capacityReservation,goal:{...route.destination},retryAt:0,...(cargo.siteId!=null?{siteId:cargo.siteId}:{})};
    if(!this.move(task,route))return false;this.scene.setStatus(`King carrying ${cargo.amount} ${cargo.resource} to storage.`);return true;
  }
  startSiteDeposit(siteId){
    const cargo=this.actor.cargo,location=this.storage.locations.get(`site-${siteId}`);if(!cargo||cargo.siteId!==siteId||!location)return false;
    const route=this.storage.route(this.actor,[location]);if(!route)return false;
    const id=`king-transfer-${this.nextId++}`,amount=Math.min(cargo.amount,this.storage.room(location.id)),capacityReservation=this.storage.reserve('capacity',location.id,cargo.resource,amount,id);if(!capacityReservation)return false;
    this.storage.reservations.get(capacityReservation).siteId=siteId;
    return this.move({id,kind:'siteDeposit',siteId,destinationId:location.id,resource:cargo.resource,amount,capacityReservation,goal:{...route.destination},retryAt:0},route);
  }
  startMaterials(building){
    if(!this.materials?.enabled||!this.materials.site(building?.id)||this.actor.transitioning||this.scene.gameOver)return false;
    this.cancel();this.scene.constructionSystem.stopKing();this.actor.stopForBuilding();this.scene.huntingSystem.cancel?.();this.scene.mountSystem.cancel?.();this.scene.treasureSystem.cancelRequest?.();
    this.workflowSiteId=building.id;this.nextRetry=0;this.continueMaterials();return true;
  }
  continueMaterials(){
    const site=this.materials?.site(this.workflowSiteId);if(!site){this.workflowSiteId=null;return false;}
    const actor=this.actor;if(actor.nextTile||actor.path.length||actor.transitioning)return true;
    if(actor.cargo){
      if(actor.cargo.siteId===site.id)return this.startSiteDeposit(site.id);
      const target=site.id;if(this.startDelivery(null,{resumeSiteId:target}))return true;
      if(this.dropCargo({keepWorkflow:true}))return true;
      // The existing movement controller handles a real descent before a full
      // load can safely be set down on ground; no roof-to-ground teleport.
      const goal=this.storage.goals(this.storage.locations.get(`site-${site.id}`))[0];if(goal)actor.command({kind:'move',goal,silent:true});return false;
    }
    if(this.materials.ready(site)){this.workflowSiteId=null;this.scene.setStatus('Materials delivered. Use Build with King to begin construction.');return true;}
    const choices=this.materials.candidates(site.id).sort((a,b)=>{
      const position=t=>t.sourceDropId?this.scene.dropSystem.drops.get(t.sourceDropId)?.tile:this.storage.locations.get(t.sourceId),distance=t=>{const p=position(t);return p?Math.hypot(actor.position.x-p.x,actor.position.y-p.y):Infinity;};return distance(a)-distance(b);
    });
    for(const choice of choices){
      const drop=choice.sourceDropId&&this.scene.dropSystem.drops.get(choice.sourceDropId),source=drop?{...drop.tile,kind:'ground',width:1,height:1}:this.storage.locations.get(choice.sourceId),destination=this.storage.locations.get(choice.destinationId);
      if(!source||!destination||drop&&!this.scene.workerSystem.reservations.available(`drop:${drop.id}`,'king'))continue;
      const route=this.storage.route(actor,[source]);if(!route||!this.storage.route(actor,[destination]))continue;
      const amount=Math.min(20,choice.amount,this.storage.room(destination.id));if(amount<1)continue;
      const id=`king-transfer-${this.nextId++}`,capacityReservation=this.storage.reserve('capacity',destination.id,choice.resource,amount,id);if(!capacityReservation)continue;
      this.storage.reservations.get(capacityReservation).siteId=site.id;
      const stockReservation=drop?null:this.storage.splitStock(choice.allocationId,amount,id);
      if(drop)this.scene.workerSystem.reservations.reserve(`drop:${drop.id}`,'king');
      if(!drop&&!stockReservation){this.storage.release(capacityReservation);continue;}
      return this.move({id,kind:'stockPickup',siteId:site.id,sourceId:choice.sourceId??null,sourceDropId:drop?.id??null,destinationId:destination.id,resource:choice.resource,amount,stockReservation,capacityReservation,goal:{...route.destination},retryAt:0},route);
    }
    this.scene.setStatus('Waiting for reachable construction supplies. Reserved and carried materials are preserved.');return false;
  }
  dropCargo({keepWorkflow=false}={}){
    const actor=this.actor,cargo=actor.cargo;if(!cargo||actor.state!=='ground'||actor.nextTile||this.scene.map[actor.tile.y]?.[actor.tile.x]!==0)return false;
    const workflow=this.workflowSiteId;this.cancel();if(keepWorkflow)this.workflowSiteId=workflow;
    this.scene.dropSystem.create(cargo.resource,actor.tile,cargo.amount,null,{siteId:cargo.siteId??null,haulEligible:!cargo.transportCancelled,rewardRemaining:(actor.pendingWorkRewards??[]).filter(e=>e.type==='dropCollected').reduce((n,e)=>n+(e.contributionRatio??1),0),rewardUnits:(actor.pendingWorkRewards??[]).filter(e=>e.type==='resourceCollected'&&e.objectType==='stone').reduce((n,e)=>n+(e.quantity??1)*(e.contributionRatio??1),0)});
    actor.cargo=null;actor.pendingWorkRewards=[];this.scene.updateInventory();return true;
  }
  source(task){const drop=task.sourceDropId&&this.scene.dropSystem.drops.get(task.sourceDropId);return drop?{...drop.tile,kind:'ground',width:1,height:1}:this.storage.locations.get(task.sourceId);}
  atSource(task){return task.sourceDropId?!this.actor.nextTile&&!this.actor.path.length&&this.actor.tile.x===task.goal.x&&this.actor.tile.y===task.goal.y:this.storage.atLocation(this.actor,task.sourceId);}
  update(){
    const actor=this.actor;if(this.scene.gameOver||this.scene.gameTime.paused)return;
    if(!this.task){if(this.workflowSiteId!=null&&this.scene.gameTime.totalElapsed>=this.nextRetry){this.nextRetry=this.scene.gameTime.totalElapsed+500;this.continueMaterials();}return;}
    const task=this.task,location=task.kind==='stockPickup'?this.source(task):this.storage.locations.get(task.destinationId);
    if(!location||!this.storage.reservations.has(task.capacityReservation)){
      const workflow=this.workflowSiteId;this.cancel();if(this.materials?.site(workflow))this.workflowSiteId=workflow;return;
    }
    if(actor.state!=='ground'||actor.nextTile||actor.path.length)return;
    const arrived=task.kind==='stockPickup'?this.atSource(task):this.storage.atLocation(actor,location.id);
    if(!arrived){
      if(this.scene.gameTime.totalElapsed<task.retryAt)return;task.retryAt=this.scene.gameTime.totalElapsed+500;const route=this.storage.route(actor,[location]);
      if(route){task.goal={...route.destination};actor.command({kind:'move',goal:route.destination,silent:true});}return;
    }
    if(task.kind==='stockPickup'){
      const destination=this.storage.locations.get(task.destinationId),route=destination&&this.storage.route(actor,[destination]);if(!route)return;
      const cargo=task.sourceDropId?this.scene.dropSystem.takeForTransport(task.sourceDropId,task.amount):this.storage.take(task.stockReservation);if(!cargo){const workflow=this.workflowSiteId;this.cancel();this.workflowSiteId=workflow;return;}
      if(task.sourceDropId)this.scene.workerSystem.reservations.release(`drop:${task.sourceDropId}`,'king');
      actor.cargo=cargo;actor.pendingWorkRewards=[];task.kind='siteDeposit';task.goal={...route.destination};actor.command({kind:'move',goal:route.destination,silent:true});return;
    }
    if(!actor.cargo||actor.cargo.resource!==task.resource||actor.cargo.amount<task.amount){this.cancel();return;}
    if(!this.storage.put(task.capacityReservation,task.amount,{transportCancelled:actor.cargo.transportCancelled}))return;
    if(location.kind==='site')this.materials.delivered();
    else if(actor.cargo.siteId!=null)this.materials.restoreAllocation(actor.cargo.siteId,location.id,task.resource,task.amount);
    actor.cargo.amount-=task.amount;this.task=null;
    if(!actor.cargo.amount){actor.cargo=null;const events=actor.pendingWorkRewards;actor.pendingWorkRewards=[];for(const event of events){const{type,...data}=event;this.scene.activities.emit(type,{...data,actor});}}
    this.scene.updateInventory();if(this.workflowSiteId!=null){this.nextRetry=0;return;}
    if(actor.cargo)this.startDelivery();else this.scene.setStatus(location.kind==='site'?'Construction materials delivered.':'Cargo delivered to storage.');
  }
  exportState(){return{nextId:this.nextId,task:structuredClone(this.task),workflowSiteId:this.workflowSiteId,nextRetry:this.nextRetry};}
  importState(data){this.nextId=data?.nextId??1;this.task=structuredClone(data?.task??null);this.workflowSiteId=data?.workflowSiteId??null;this.nextRetry=data?.nextRetry??0;if(this.task?.kind==='stockPickup'&&this.task.sourceDropId)this.scene.workerSystem.reservations.reserve(`drop:${this.task.sourceDropId}`,'king');}
  destroy(){this.cancel();}
}
