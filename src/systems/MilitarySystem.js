import { t } from '../i18n/index.js';
import { towerNeighbors } from '../game/buildings.js';
import { WallPatrol,WALL_PATROL } from './WallPatrol.js';
import { UNIT_TYPES,unitKit,KNIGHT_SPEED,START_GARRISON,RECRUIT } from '../data/military.js';
import { MILITARY_ITEMS } from '../data/militaryEquipment.js';
import { buildingIsComplete } from '../game/buildings.js';
import { recalculateStats } from './UnitStats.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { inAttackRange } from './CombatSystem.js';
import { MILITARY_RULES,PATROL } from '../data/military.js';

// C08: Soldiers employed in a Barracks are trained into units. Training is paid in Gold, needs the unit's real items
// (Haulers carry them from an Armory to the Barracks kit store) and game time at the Barracks. A trained unit wears
// its items; discharge or death drops them where the unit stands and Haulers return them to an Armory.
export class MilitarySystem {
  constructor(scene){this.scene=scene;this.units=new Map();this.orders=new Map();this.nextOrder=1;this.wallPatrol=new WallPatrol(scene);}
  get storage(){return this.scene.foodStorage;}
  barracks(id){return this.scene.buildings.find(b=>b.id===id&&b.type==='barracks'&&buildingIsComplete(b))??null;}
  // m-zalozka-vojsko: the patrol round of the settlement – walkable waypoints on a ring around all finished buildings,
  // in walking order; worked out again when a building is added, finished or removed. Empty for a tiny settlement.
  patrolRoute(){
    const s=this.scene,key=`${s.buildings.length}:${s.constructionSystem?.revision??0}`;if(this.routeKey===key)return this.route;this.routeKey=key;this.route=[];
    const done=s.buildings.filter(b=>buildingIsComplete(b));if(done.length<PATROL.minBuildings)return this.route;
    let x0=Infinity,y0=Infinity,x1=-Infinity,y1=-Infinity;for(const b of done)for(const t of b.tiles??[{x:b.x,y:b.y}]){x0=Math.min(x0,t.x);y0=Math.min(y0,t.y);x1=Math.max(x1,t.x);y1=Math.max(y1,t.y);}
    const H=s.map.length,W=s.map[0].length,m=PATROL.margin;x0=Math.max(0,x0-m);y0=Math.max(0,y0-m);x1=Math.min(W-1,x1+m);y1=Math.min(H-1,y1+m);
    const ring=[];for(let x=x0;x<x1;x+=PATROL.step)ring.push({x,y:y0});for(let y=y0;y<y1;y+=PATROL.step)ring.push({x:x1,y});for(let x=x1;x>x0;x-=PATROL.step)ring.push({x,y:y1});for(let y=y1;y>y0;y-=PATROL.step)ring.push({x:x0,y});
    const free=t=>s.map[t.y]?.[t.x]===0&&!s.resourceOccupancy?.has(`${t.x},${t.y}`),seen=new Set();
    for(const p of ring){let pick=null;for(let r=0;r<=PATROL.reach&&!pick;r++)for(let dy=-r;dy<=r&&!pick;dy++)for(let dx=-r;dx<=r&&!pick;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const t={x:p.x+dx,y:p.y+dy};if(free(t))pick=t;}
      if(pick&&!seen.has(`${pick.x},${pick.y}`)){seen.add(`${pick.x},${pick.y}`);this.route.push(pick);}}
    if(this.route.length<4)this.route=[];return this.route;
  }
  // The next waypoint of a soldier's round: everyone starts at a point of their own (spread by their place among the
  // soldiers) and walks the ring in order.
  nextPatrolPoint(worker){
    const route=this.patrolRoute();if(!route.length)return null;
    if(!Number.isInteger(worker.patrolIndex)||worker.patrolIndex>=route.length){const soldiers=this.scene.workerSystem.liveSubjects().filter(w=>w.profession==='soldier').map(w=>w.id).sort(),at=Math.max(0,soldiers.indexOf(worker.id));worker.patrolIndex=Math.floor(at*route.length/Math.max(1,soldiers.length))%route.length;}
    else worker.patrolIndex=(worker.patrolIndex+1)%route.length;
    return route[worker.patrolIndex];
  }
  unit(worker){return worker?this.units.get(worker.id)??null:null;}
  // kasarna-branci: a Recruit is a living resident with the `soldier` profession who is not a trained unit.
  isRecruit(worker){return !!worker?.isAlive&&worker.profession==='soldier'&&!this.units.has(worker.id);}
  order(worker){return [...this.orders.values()].find(o=>o.workerId===worker?.id)??null;}
  ordersAt(barracksId){return [...this.orders.values()].filter(o=>o.barracksId===barracksId).sort((a,b)=>a.id-b.id);}
  // Why a unit type cannot be trained for this Soldier right now, or null.
  blocker(worker,type){
    const spec=UNIT_TYPES[type];if(!spec)return 'unknown';
    if(spec.mount==='horse'&&!this.scene.stables?.freeHorse())return 'horse';
    if(this.unit(worker))return 'trained';
    if(!this.isRecruit(worker)||!this.barracks(worker.assignedWorkplaceId))return 'notSoldier';if(this.order(worker))return 'training';
    if((worker.skills.combat?.level??1)<spec.requiredCombatLevel)return 'skill';
    return this.supplyBlocker(type);
  }
  // m-vojaci-chyba (owner point 87): what the kingdom lacks for this unit type, whoever trains: an Armory, the unit's
  // items in it (not yet promised to an earlier order) or the Gold. Before, Train was enabled without any of that and
  // the order waited for a Sword that nothing could make, with no word why.
  supplyBlocker(type){
    const spec=UNIT_TYPES[type];if(!spec)return 'unknown';
    if(spec.mount==='horse'&&!this.scene.stables?.freeHorse())return 'horse';
    if(!this.scene.buildings.some(b=>b.type==='armory'&&buildingIsComplete(b)))return 'armory';
    if(Object.keys(this.kitShortage(type)).length)return 'kit';
    if(this.scene.inventory.count('gold')<spec.goldCost)return 'gold';
    return null;
  }
  // Items of one kit that the Armories cannot give now: their free stock minus what waiting orders still need.
  kitShortage(type){
    const out={};for(const[id,n]of Object.entries(unitKit(type))){const promised=this.scene.buildings.filter(b=>b.type==='barracks').reduce((sum,b)=>sum+this.missing(b.id,id),0);const free=this.available(id)-promised;if(free<n)out[id]=n-Math.max(0,free);}
    return out;
  }
  // Items still missing for every waiting order at a Barracks, after what lies in its kit store or is on the way.
  kitNeeds(barracksId){const need={};for(const o of this.ordersAt(barracksId))if(o.state==='supplying')for(const[id,n]of Object.entries(unitKit(o.type)))need[id]=(need[id]??0)+n;return need;}
  missing(barracksId,resource){const kit=this.storage?.locations.get(`kit-${barracksId}`);if(!kit)return 0;return Math.max(0,(this.kitNeeds(barracksId)[resource]??0)-(kit.stock[resource]??0)-this.storage.incoming(kit.id,resource));}
  // Armory stock that could still go to this order (shown as available kits in the panel).
  available(resource){return this.storage?.available(resource)??0;}
  // New game only: the starting garrison (START_GARRISON) joins the first residents, within the population capacity.
  enlistStartingGarrison(random=Math.random){const ws=this.scene.workerSystem,out=[];for(const {type,count} of START_GARRISON)for(let i=0;i<count;i++){if(ws.liveSubjects().length>=ws.capacity())return out;const w=ws.spawnNearStart(random);if(w&&this.enlist(w,type))out.push(w);}ws.updateUI();return out;}
  // New game only: a resident becomes a trained unit with the unit's own equipment (no Armory stock is used).
  // Garrison units (garrison:true) serve the Castle: they need no Barracks and stay soldiers until dismissed.
  enlist(worker,type){
    if(!worker?.isAlive||!UNIT_TYPES[type]||UNIT_TYPES[type].mount)return false;
    if(!this.scene.workerSystem.jobs.assign(worker,'soldier'))return false;
    this.units.set(worker.id,{type,equipment:{...UNIT_TYPES[type].equipment},garrison:true});this.apply(worker);worker.currentHP=worker.maxHP;return true;
  }
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
  // A trained unit wears its type's modifiers and items; a Recruit the RECRUIT modifiers; anyone else neither.
  apply(worker){
    const unit=this.unit(worker);if(!unit){delete worker.statModifiers.militaryEquipment;if(this.isRecruit(worker))worker.statModifiers.military={...RECRUIT.modifiers};else delete worker.statModifiers.military;recalculateStats(worker);if(worker.definition?.gameplay?.movementSpeed)worker.speed=worker.definition.gameplay.movementSpeed;return;}
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
    // m-mapa-kraje: in a scouted land the party guards itself – a soldier helps whoever of it is attacked near him.
    const home=this.barracks(worker.assignedWorkplaceId)??(this.scene.zone?{x:worker.position.x,y:worker.position.y}:null);if(!home)return null;let best=null,bestDistance=Infinity;
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
    // m-mapa-kraje: a scouting party walks to the map edge.
    if(worker.scoutZone!=null&&this.scene.scouting?.updateSoldier(worker))return true;
    // m-karavana-vyslat: escorts walk to the Marketplace while the caravan gathers.
    if(worker.expeditionGather!=null){const m=this.scene.buildings.find(b=>b.id===worker.expeditionGather);if(m){worker.workState='Traveling to Target';worker.workMessage=t('expedition.gathering');
      if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0&&Math.max(Math.abs(worker.tile.x-(m.x+1)),Math.abs(worker.tile.y-(m.y+1)))>4){worker.aiCooldown=1500;worker.moveTo(towerNeighbors(m));}return true;}delete worker.expeditionGather;}
    // m-hlidka-hradby: on the wall walk (or on the way up) the patrol leads; an Archer on a wall shoots threats in range.
    if(worker.wallPatrol){this.wallPatrol??=new WallPatrol(this.scene);if(worker.onWall&&worker.attackRange>1){const target=this.threat(worker);if(target&&inAttackRange(worker,target,this.scene.map)){worker.path=[];combat.startAttack(worker,target);return true;}}
      if(this.wallPatrol.update(worker,delta))return true;}
    // kasarna-branci: Recruits defend near their Barracks too, with their basic stats.
    if(!(unit||this.isRecruit(worker))||worker.commandState?.state==='Holding')return false;
    // m-vlk-zustava: "Hunt the wolf" sends a soldier after a lurking wolf anywhere on the map until it is dead or gone.
    let hunted=null;if(worker.huntWolfId){hunted=this.scene.animalSystem?.animals?.get?.(worker.huntWolfId)??[...(this.scene.animalSystem?.animals?.values?.()??[])].find(a=>a.id===worker.huntWolfId);if(!hunted?.isAlive||hunted.active===false){delete worker.huntWolfId;hunted=null;}}
    const target=combat.attacks.get(worker)?.isAlive&&combat.attacks.get(worker).definition?combat.attacks.get(worker):this.threat(worker)??hunted;if(!target)return false;
    worker.workState='Working';worker.workMessage='Defending the kingdom';
    const ranged=worker.attackRange>1,ready=!worker.nextTile&&(ranged?inAttackRange(worker,target,this.scene.map)&&combat.canTarget(worker,target):canInteractAdjacent(this.scene.map,worker,target));
    if(ready){worker.path=[];combat.startAttack(worker,target);const dx=target.position.x-worker.position.x,dy=target.position.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};return true;}
    if(!ranged)combat.stopAttack(worker);
    worker.militaryRetarget=(worker.militaryRetarget??0)-delta;
    if(worker.militaryRetarget<=0){worker.militaryRetarget=MILITARY_RULES.retarget;worker.moveTo(adjacentTiles(target,this.scene.map));}
    return true;
  }
  // kasarna-branci: the wage table entry for this resident (a Recruit is paid as `recruit`, a trained unit as `soldier`).
  wageProfession(worker){return this.isRecruit(worker)?'recruit':worker?.profession;}
  // Recruit stats follow the job: hired into a Barracks (or given the Soldier job) adds them, a new job removes them.
  syncRecruits(){
    for(const w of this.scene.workerSystem.liveWorkers()){if(this.units.has(w.id))continue;const want=this.isRecruit(w),has=!!w.statModifiers.military;
      if(want!==has||has&&w.statModifiers.military.maxHP!==RECRUIT.modifiers.maxHP)this.apply(w);}
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
    this.syncRecruits();
    for(const workerId of [...this.units.keys()]){const w=this.scene.workerSystem.workers.get(workerId);if(!w?.isAlive)this.units.delete(workerId);else if(w.profession!=='soldier'||(!this.barracks(w.assignedWorkplaceId)&&!this.units.get(workerId).garrison))this.release(w);}
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
  exportState(){return {units:[...this.units].map(([workerId,u])=>({workerId,type:u.type,equipment:{...u.equipment},...(u.garrison?{garrison:true}:{})})),orders:[...this.orders.values()].map(o=>structuredClone(o)),nextOrder:this.nextOrder};}
  importState(data){
    this.units=new Map((data?.units??[]).map(u=>[u.workerId,{type:u.type,equipment:{...u.equipment},...(u.garrison?{garrison:true}:{})}]));
    this.orders=new Map((data?.orders??[]).map(o=>[o.id,structuredClone(o)]));this.nextOrder=data?.nextOrder??1;
  }
}
