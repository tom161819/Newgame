import { tileKey } from '../game/stones.js';
import { carryCapacity } from '../data/logistics.js';

export class KingLogisticsSystem {
  constructor(scene){this.scene=scene;this.nextId=1;this.task=null;scene.character.cargo=null;scene.character.pendingWorkRewards=[];}
  get actor(){return this.scene.character;}
  get storage(){return this.scene.foodStorage;}
  room(resource){const cargo=this.actor.cargo;return !this.storage.manages(resource)||cargo&&cargo.resource!==resource?0:Math.max(0,carryCapacity(this.actor)-(cargo?.amount??0));}
  receive({resource,amount,event}){
    if(!Number.isSafeInteger(amount)||amount<=0||this.room(resource)<amount)return false;
    this.cancel();const actor=this.actor;if(actor.cargo)actor.cargo.amount+=amount;else actor.cargo={resource,amount};
    if(event)actor.pendingWorkRewards.push(event);this.startDelivery();return true;
  }
  cancel(){if(!this.task)return;this.storage.release(this.task.capacityReservation);this.task=null;this.actor.stopForBuilding();}
  startDelivery(buildingId=null){
    const actor=this.actor,cargo=actor.cargo;if(!cargo)return false;this.cancel();
    const route=buildingId==null?this.storage.findDestination(actor,cargo.resource,cargo.amount,{partial:true}):this.storage.route(actor,[...this.storage.locations.values()].filter(l=>l.buildingId===buildingId&&this.storage.isStock(l)&&l.allowed.includes(cargo.resource)&&this.storage.room(l.id)>0));
    if(!route){this.scene.setStatus('Cargo is preserved. No reachable storage has free capacity.');return false;}
    const amount=Math.min(cargo.amount,this.storage.room(route.location.id)),id=`king-transfer-${this.nextId++}`,capacityReservation=this.storage.reserve('capacity',route.location.id,cargo.resource,amount,id);if(!capacityReservation)return false;
    this.task={id,kind:'deposit',destinationId:route.location.id,resource:cargo.resource,amount,capacityReservation,goal:{...route.destination},retryAt:0};
    if(!actor.command({kind:'move',goal:route.destination,silent:true})){this.cancel();return false;}
    this.scene.worldCamera?.follow?.();this.scene.setStatus(`King carrying ${cargo.amount} ${cargo.resource} to storage.`);return true;
  }
  update(){
    const task=this.task,actor=this.actor;if(!task||this.scene.gameOver||this.scene.gameTime.paused)return;
    const location=this.storage.locations.get(task.destinationId);if(!location||!this.storage.reservations.has(task.capacityReservation)){this.cancel();return;}
    if(actor.state!=='ground'||actor.nextTile||actor.path.length)return;
    if(!this.storage.atLocation(actor,location.id)){
      if(this.scene.gameTime.totalElapsed<task.retryAt)return;task.retryAt=this.scene.gameTime.totalElapsed+500;const route=this.storage.route(actor,[location]);
      if(route){task.goal={...route.destination};actor.command({kind:'move',goal:route.destination,silent:true});}return;
    }
    if(!actor.cargo||actor.cargo.resource!==task.resource||actor.cargo.amount<task.amount){this.cancel();return;}
    if(!this.storage.put(task.capacityReservation,task.amount,{transportCancelled:actor.cargo.transportCancelled}))return;
    actor.cargo.amount-=task.amount;this.task=null;
    if(!actor.cargo.amount){actor.cargo=null;const events=actor.pendingWorkRewards;actor.pendingWorkRewards=[];for(const event of events){const{type,...data}=event;this.scene.activities.emit(type,{...data,actor});}}
    this.scene.updateInventory();if(actor.cargo)this.startDelivery();else this.scene.setStatus('Cargo delivered to storage.');
  }
  exportState(){return{nextId:this.nextId,task:structuredClone(this.task)};}
  importState(data){this.nextId=data?.nextId??1;this.task=structuredClone(data?.task??null);}
  destroy(){this.cancel();}
}
