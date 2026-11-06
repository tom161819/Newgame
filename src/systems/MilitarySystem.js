import { UNIT_TYPES,unitKit,KNIGHT_SPEED } from '../data/military.js';
import { MILITARY_ITEMS } from '../data/militaryEquipment.js';
import { buildingIsComplete } from '../game/buildings.js';
import { recalculateStats } from './UnitStats.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { inAttackRange } from './CombatSystem.js';
import { MILITARY_RULES } from '../data/military.js';

// C08: Soldiers employed in a Barracks are trained into units. Training is paid in Gold, needs the unit's real items
// (Haulers carry them from an Armory to the Barracks kit store) and game time at the Barracks. A trained unit wears
// its items; discharge or death drops them where the unit stands and Haulers return them to an Armory.
export class MilitarySystem {
  constructor(scene){this.scene=scene;this.units=new Map();this.orders=new Map();this.nextOrder=1;}
  get storage(){return this.scene.foodStorage;}
  barracks(id){return this.scene.buildings.find(b=>b.id===id&&b.type==='barracks'&&buildingIsComplete(b))??null;}
  unit(worker){return worker?this.units.get(worker.id)??null:null;}
  order(worker){return [...this.orders.values()].find(o=>o.workerId===worker?.id)??null;}
  ordersAt(barracksId){return [...this.orders.values()].filter(o=>o.barracksId===barracksId).sort((a,b)=>a.id-b.id);}
  // Why a unit type cannot be trained for this Soldier right now, or null.
  blocker(worker,type){
    const spec=UNIT_TYPES[type];if(!spec)return 'unknown';
    if(spec.mount==='horse'&&!this.scene.stables?.freeHorse())return 'horse';
    if(!worker?.isAlive||worker.profession!=='soldier'||!this.barracks(worker.assignedWorkplaceId))return 'notSoldier';
    if(this.unit(worker))return 'trained';if(this.order(worker))return 'training';
    if((worker.skills.combat?.level??1)<spec.requiredCombatLevel)return 'skill';
    if(this.scene.inventory.count('gold')<spec.goldCost)return 'gold';
    return null;
  }
  // Items still missing for every waiting order at a Barracks, after what lies in its kit store or is on the way.
  kitNeeds(barracksId){const need={};for(const o of this.ordersAt(barracksId))if(o.state==='supplying')for(const[id,n]of Object.entries(unitKit(o.type)))need[id]=(need[id]??0)+n;return need;}
  missing(barracksId,resource){const kit=this.storage?.locations.get(`kit-${barracksId}`);if(!kit)return 0;return Math.max(0,(this.kitNeeds(barracksId)[resource]??0)-(kit.stock[resource]??0)-this.storage.incoming(kit.id,resource));}
  // Armory stock that could still go to this order (shown as available kits in the panel).
  available(resource){return this.storage?.available(resource)??0;}
  train(worker,type){
    const reason=this.blocker(worker,type);if(reason)return reason;const spec=UNIT_TYPES[type],id=this.nextOrder++;
    if(!this.scene.inventory.spend('gold',spec.goldCost,{source:'Military Training',id:`military-training:${id}`,entityId:worker.id}))return 'gold';
    this.orders.set(id,{id,workerId:worker.id,barracksId:worker.assignedWorkplaceId,type,state:'supplying',workDone:0,required:spec.trainingTime,items:{}});
    if(spec.mount==='horse')this.scene.stables.reserveHorse(worker.id);
    this.scene.updateInventory?.();return null;
  }
  cancel(orderId){
    const order=this.orders.get(orderId);if(!order)return false;this.orders.delete(orderId);if(UNIT_TYPES[order.type].mount)this.scene.stables?.returnHorse(order.workerId);
    const kit=`kit-${order.barracksId}`;for(const[id,n]of Object.entries(order.items))if(!this.storage.deposit(kit,id,n))this.storage.spill(id,n,this.tileOf(order.barracksId));
    this.scene.inventory.add('gold',UNIT_TYPES[order.type].goldCost,{source:'Military Training Refund',type:'refund',id:`military-refund:${order.id}`,entityId:order.workerId});
    this.scene.updateInventory?.();return true;
  }
  tileOf(barracksId){const b=this.barracks(barracksId)??this.scene.buildings.find(b=>b.id===barracksId);return b?{x:b.x-1,y:b.y}:this.scene.character.tile;}
  apply(worker){
    const unit=this.unit(worker);if(!unit){delete worker.statModifiers.military;delete worker.statModifiers.militaryEquipment;recalculateStats(worker);if(worker.definition?.gameplay?.movementSpeed)worker.speed=worker.definition.gameplay.movementSpeed;return;}
    const items={};for(const id of Object.values(unit.equipment)){const item=MILITARY_ITEMS[id],mods=item.modifiers??this.scene.objectRegistry.require(item.modifiersFrom).equipment.modifiers;for(const[k,v]of Object.entries(mods))items[k]=(items[k]??0)+v;}
    worker.statModifiers.militaryEquipment=items;worker.statModifiers.military={...UNIT_TYPES[unit.type].modifiers};recalculateStats(worker);
    worker.speed=(worker.definition?.gameplay?.movementSpeed??worker.speed)*(UNIT_TYPES[unit.type].mount?KNIGHT_SPEED:1);
  }
  // Discharge or death: the unit's items fall where it stands; Haulers carry them back to an Armory.
  release(worker,{dead=false}={}){
    const unit=this.unit(worker);const order=this.order(worker);if(order)this.cancel(order.id);if(!unit)return false;
    if(UNIT_TYPES[unit.type].mount)this.scene.stables?.returnHorse(worker.id,worker.tile);
    this.units.delete(worker.id);const at=this.scene.gameTime?.totalElapsed??0;
    for(const[slot,id]of Object.entries(unit.equipment)){this.storage.spill(id,1,worker.tile);this.scene.resourceLedger?.income(id,1,'Recovered Equipment',{id:`military-return:${worker.id}:${slot}:${at}`,entityId:worker.id});}
    if(!dead)this.apply(worker);else{delete worker.statModifiers.military;delete worker.statModifiers.militaryEquipment;}
    this.scene.updateInventory?.();return true;
  }
  // A threat: a living animal fighting one of our people (a resident or the king) near this unit's Barracks, in sight.
  threat(worker){
    const home=this.barracks(worker.assignedWorkplaceId);if(!home)return null;let best=null,bestDistance=Infinity;
    for(const animal of this.scene.animalSystem?.animals.values()??[]){
      const victim=animal.retaliationTarget;if(!animal.isAlive||!victim?.isAlive||!(victim===this.scene.character||this.scene.workerSystem.workers.has(victim.id)&&victim.isSubject!==false))continue;
      if(this.scene.fog&&!this.scene.fog.isVisibleObject(animal))continue;
      if(Math.hypot(animal.position.x-home.x,animal.position.y-home.y)>MILITARY_RULES.guardRadius)continue;
      const d=Math.hypot(animal.position.x-worker.position.x,animal.position.y-worker.position.y);if(d<bestDistance){best=animal;bestDistance=d;}
    }
    return best;
  }
  // Soldier behaviour on top of patrolling. Returns true when it took over this frame.
  updateSoldier(worker,delta){
    const order=this.order(worker),combat=this.scene.combat,unit=this.unit(worker);
    if(order?.state==='training'){combat.stopAttack(worker);worker.workState='Working';worker.workMessage='Training';
      if(!this.scene.workplaceSystem.atWorkplace(worker)&&!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){worker.aiCooldown=1000;worker.moveTo(this.scene.workplaceSystem.goals(worker));}return true;}
    if(!unit||worker.commandState?.state==='Holding')return false;
    const target=combat.attacks.get(worker)?.isAlive&&combat.attacks.get(worker).definition?combat.attacks.get(worker):this.threat(worker);if(!target)return false;
    worker.workState='Working';worker.workMessage='Defending the kingdom';
    const ranged=worker.attackRange>1,ready=!worker.nextTile&&(ranged?inAttackRange(worker,target,this.scene.map)&&combat.canTarget(worker,target):canInteractAdjacent(this.scene.map,worker,target));
    if(ready){worker.path=[];combat.startAttack(worker,target);const dx=target.position.x-worker.position.x,dy=target.position.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};return true;}
    if(!ranged)combat.stopAttack(worker);
    worker.militaryRetarget=(worker.militaryRetarget??0)-delta;
    if(worker.militaryRetarget<=0){worker.militaryRetarget=MILITARY_RULES.retarget;worker.moveTo(adjacentTiles(target,this.scene.map));}
    return true;
  }
  wageBonus(worker){const unit=this.unit(worker);return unit?UNIT_TYPES[unit.type].wageBonus:0;}
  // Logistics catalog: equipment from Armory stock to the kit store, and leftovers back.
  candidates(){
    const storage=this.storage,tasks=[];if(!storage)return tasks;const stores=[...storage.locations.values()].filter(l=>storage.isStock(l));
    for(const kit of [...storage.locations.values()].filter(l=>l.kind==='kit')){
      const need=this.kitNeeds(kit.buildingId);
      for(const resource of kit.allowed){const missing=this.missing(kit.buildingId,resource);
        if(missing>0)for(const source of stores)if(storage.free(source.id,resource)>0)tasks.push({priority:20,sourceId:source.id,destinationId:kit.id,resource,amount:missing});
        const surplus=storage.free(kit.id,resource)-(need[resource]??0);
        if(surplus>0)for(const destination of stores)if(destination.allowed.includes(resource)&&storage.room(destination.id,resource)>0)tasks.push({priority:40,sourceId:kit.id,destinationId:destination.id,resource,amount:surplus});
      }
    }
    return tasks;
  }
  update(delta){
    if(this.scene.gameOver||this.scene.gameTime?.paused||!this.storage)return;
    // A unit moved out of its Barracks (new job, Unemployed) hands its gear back: it drops where the resident stands.
    for(const workerId of [...this.units.keys()]){const w=this.scene.workerSystem.workers.get(workerId);if(!w?.isAlive)this.units.delete(workerId);else if(w.profession!=='soldier'||!this.barracks(w.assignedWorkplaceId))this.release(w);}
    for(const order of [...this.orders.values()].sort((a,b)=>a.id-b.id)){
      const worker=this.scene.workerSystem.workers.get(order.workerId);
      if(!worker?.isAlive||worker.assignedWorkplaceId!==order.barracksId||!this.barracks(order.barracksId)){this.cancel(order.id);continue;}
      if(order.state==='supplying'){const kit=unitKit(order.type);if(this.storage.withdrawBatch(`kit-${order.barracksId}`,kit)){order.items=kit;order.state='training';}else continue;}
      if(!this.scene.workplaceSystem.atWorkplace(worker))continue;
      order.workDone=Math.min(order.required,order.workDone+Math.max(0,delta)*(this.scene.workplaceSystem.workFactor?.(worker)??1));
      if(order.workDone>=order.required)this.finish(order,worker);
    }
  }
  finish(order,worker){
    this.orders.delete(order.id);const equipment={...UNIT_TYPES[order.type].equipment};if(UNIT_TYPES[order.type].mount)this.scene.stables?.mountRider(worker.id);this.units.set(worker.id,{type:order.type,equipment});
    for(const[id,n]of Object.entries(order.items))this.scene.resourceLedger?.expense(id,n,'Military Equipment',{id:`military-equip:${order.id}:${id}`,entityId:worker.id});
    this.apply(worker);worker.currentHP=worker.maxHP;this.scene.activities?.emit('unitTrained',{actor:worker,objectType:order.type,quantity:1});this.scene.updateInventory?.();
  }
  exportState(){return {units:[...this.units].map(([workerId,u])=>({workerId,type:u.type,equipment:{...u.equipment}})),orders:[...this.orders.values()].map(o=>structuredClone(o)),nextOrder:this.nextOrder};}
  importState(data){
    this.units=new Map((data?.units??[]).map(u=>[u.workerId,{type:u.type,equipment:{...u.equipment}}]));
    this.orders=new Map((data?.orders??[]).map(o=>[o.id,structuredClone(o)]));this.nextOrder=data?.nextOrder??1;
  }
}
