import { devProduction } from '../data/devBalance.js';
import { RockMiningWork } from './RockMiningWork.js';
import { WORK_RULES } from '../data/jobs.js';
import { towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';

// A provider of existing WorkerAI tasks, sharing transport and capacity leases.
export class MiningWork {
  constructor(scene,natural){Object.assign(this,{scene,natural});this.rocks=new RockMiningWork(scene);}
  slot(goal){return `natural-slot:${tileKey(goal)}`;}
  release(worker){this.rocks.release(worker);const t=worker.workTask;if(t?.kind!=='mineDeposit')return;this.scene.workerSystem.reservations.release(this.slot(t.goal),worker.id);this.scene.foodStorage.release(t.capacityReservation);}
  wait(worker,message){worker.workState='Waiting';worker.workMessage=message;worker.aiCooldown=WORK_RULES.searchInterval;}
  claims(id){return this.scene.workerSystem.liveWorkers().filter(w=>w.workTask?.kind==='mineDeposit'&&w.workTask.targetId===id).length;}
  update(worker,delta){
    if(!Number.isFinite(delta)||delta<=0||this.scene.gameTime.paused||this.scene.gameOver||!worker.isAlive)return;
    const s=this.scene,system=s.workerSystem,home=s.workplaceSystem.building(worker),rule=home?.definition.mining,object=this.natural.byId.get(home?.depositId);
    if(!rule||!object||object.natural.boundBuildingId!==home.id){this.wait(worker,'Waiting for an assigned finite deposit');return;}
    let task=worker.workTask;
    if(!task){
      if(worker.aiCooldown>0)return;
      if(object.natural.remaining===0){this.wait(worker,'Deposit Depleted');return;}
      if(this.claims(object.natural.id)>=object.natural.remaining){this.wait(worker,'Remaining deposit units are reserved');return;}
      const goals=towerNeighbors(rule.overlap?home:object).filter(t=>s.map[t.y]?.[t.x]===0&&system.reservations.available(this.slot(t),worker.id)),route=system.ai.route(worker,goals);
      if(!route){this.wait(worker,'No reachable deposit work position');return;}
      const pile=s.foodStorage.pileFor(home);if(pile&&s.foodStorage.room(pile.id,rule.resource)<1){if(s.foodProduction?.carryOwnOutput(worker,home))return;this.wait(worker,'Output pile full');return;}
      // m-sklady-materialu-koncept (49): mined units go on the pile by the building; Haulers take them to a store.
      const output=pile?{location:pile}:s.foodStorage.findDestination(worker,rule.resource,1);if(!output){this.wait(worker,'Waiting for reachable storage capacity');return;}
      const transferId=`food-transfer-${s.foodProduction.nextTransfer++}`,capacityReservation=s.foodStorage.reserve('capacity',output.location.id,rule.resource,1,transferId);if(!capacityReservation)return;
      if(!system.reservations.reserve(this.slot(route.destination),worker.id)){s.foodStorage.release(capacityReservation);return;}
      worker.workTask=task={kind:'mineDeposit',targetId:object.natural.id,goal:{...route.destination},reservation:`mineral:${object.natural.id}:${worker.id}`,progressMs:0,transferId,capacityReservation,destinationId:output.location.id,amount:1};system.reservations.reserve(task.reservation,worker.id);worker.path=route.path;worker.workState='Traveling to Target';worker.workMessage='Travelling to deposit';
    }
    if(task.kind!=='mineDeposit')return;
    if(object.natural.remaining===0||s.map[task.goal.y]?.[task.goal.x]!==0||!s.foodStorage.reservations.has(task.capacityReservation)){system.ai.cancel(worker);this.wait(worker,object.natural.remaining===0?'Deposit Depleted':'Waiting for valid access and storage');return;}
    if(worker.nextTile||worker.path.length)return;
    if(!system.ai.atGoal(worker,task.goal)){system.ai.cancel(worker);this.wait(worker,'Waiting for reachable work position');return;}
    worker.workState='Working';worker.workMessage=`Mining ${Math.floor(task.progressMs/rule.duration*100)}%`;task.progressMs=Math.min(rule.duration,task.progressMs+delta*s.skillSystem.workEfficiency(worker,'mining')*(s.workplaceSystem.workFactor?.(worker)??1)*devProduction('mining'));
    if(task.progressMs+1e-7<rule.duration)return;
    // Commit depletion before emitting rewards or creating material.
    object.natural.remaining--;this.natural.view(object)?.setNaturalState?.(object);
    const drop=s.dropSystem.create(rule.resource,worker.tile,1,null,{rewardRemaining:0,rewardUnits:0});
    s.activities.emit('depositMined',{actor:worker,objectType:object.type,quantity:1},`deposit:${object.natural.id}:${object.natural.max-object.natural.remaining}`);
    system.reservations.release(this.slot(task.goal),worker.id);system.reservations.release(task.reservation,worker.id);worker.workTask=null;
    const pickup=system.ai.route(worker,[drop.tile]);
    if(!pickup||!system.reservations.reserve(`drop:${drop.id}`,worker.id)||!s.foodProduction.setTask(worker,'foodPickup',pickup,{transferId:task.transferId,capacityReservation:task.capacityReservation,destinationId:task.destinationId,sourceDropId:drop.id,resource:rule.resource,amount:1,naturalMining:true})){system.reservations.release(`drop:${drop.id}`,worker.id);s.foodStorage.release(task.capacityReservation);this.wait(worker,'Mined material preserved on the ground');}
  }
}
