import { t } from '../i18n/index.js';
import { dataName } from '../i18n/names.js';
import { VISIBILITY } from './FogOfWarSystem.js';
const HUNT_CANDIDATES=12;
import { findPathToAny } from '../game/pathfinding.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { tileKey } from '../game/stones.js';
import { JOBS,WORK_RULES,POPULATION } from '../data/jobs.js';
import { WORKPLACE_RULES,HUNTING_RULES } from '../data/workplaces.js';

export class WorkerAI {
  constructor(system){this.system=system;this.scene=system.scene;}
  cancel(worker){
    this.system.gather?.release(worker);
    this.scene.naturalResources?.releaseWorker(worker);
    this.scene.foodProduction?.cancelWorker(worker);
    this.scene.farmingSystem?.release(worker);
    if(['build','dismantle','repair'].includes(worker.workTask?.kind))this.system.jobs.constructionProvider?.releaseWorker?.(worker);
    const task=worker.workTask,animal=(task?.kind==='hunt'?this.scene.animalSystem.animals.get(task.targetId):null)??this.scene.combat.attacks.get(worker);
    if(animal?.retaliationTarget===worker)this.scene.animalSystem.stopRetaliation(animal);
    this.scene.combat.stopAttack(worker);this.system.reservations.releaseActor(worker.id);worker.workTask=null;worker.path=[];worker.aiCooldown=0;worker.workMessage='';
  }
  origin(worker){return this.system.origin(worker);}
  route(worker,goals){return findPathToAny(this.system.navigationMap(worker),worker.nextTile??worker.tile,goals,this.scene.pathWear?.routingOptions(worker));}
  withinRange(worker,tile){const origin=this.origin(worker),radius=worker.profession==='hunter'?HUNTING_RULES.huntRadius:WORK_RULES.workRadius;return Math.max(Math.abs(tile.x-origin.x),Math.abs(tile.y-origin.y))<=radius;}
  // m-drevorubec-dosah, owner 12 Nov: Hunters have no range either – game and meat anywhere on the known map (inside the
  // old radius always, beyond it on explored ground), the nearest HUNT_CANDIDATES to the lodge routed to.
  huntable(worker,tile){if(this.withinRange(worker,tile))return true;const fog=this.scene.fog;return !fog?.displayState||fog.displayState(tile)!==VISIBILITY.UNEXPLORED;}
  nearest(worker,items,tileOf,count=HUNT_CANDIDATES){const o=this.origin(worker);return items.map(item=>({item,d:Math.hypot(tileOf(item).x-o.x,tileOf(item).y-o.y)})).sort((a,b)=>a.d-b.d).slice(0,count).map(e=>e.item);}
  reserve(worker,key,task,route){
    if(!this.system.reservations.reserve(key,worker.id))return false;
    worker.workTask={...task,reservation:key,goal:{...route.destination},progressMs:0};worker.path=route.path;worker.workState=this.scene.workplaceSystem?'Traveling to Target':'Moving to Target';worker.workMessage=['mine','mineDrop'].includes(task.kind)?'Travelling to stone':task.kind==='hunt'?'Following game':'Collecting meat';return true;
  }
  // #98: after the job step an idle worker sits on his workplace's porch (or gets up when there is work again).
  update(worker,delta){
    // m-karavana-vyslat: an escort away with the caravan is off the map until it comes home.
    if(worker.away){worker.workState='Waiting';worker.workMessage=t(worker.scoutZone!=null?'scouting.awayShort':'expedition.awayShort');worker.view?.setVisible?.(false);return;}
    if(this.scene.nightThreats?.firefight(worker,delta)){worker.update(delta);return;}this.step(worker,delta);this.scene.lightFuel?.help(worker);this.scene.heating?.help(worker);this.scene.nightThreats?.pursue(worker);this.scene.porches?.check(worker);}
  step(worker,delta){
    if(!worker.isAlive)return;
    // Point 45: stepping off a new blueprint comes first; the usual work goes on once he is beside it.
    if(worker.steppingAside!=null){const late=(this.scene.gameTime?.totalElapsed??0)>(worker.stepAside??0)+6000;/* safety: never wait on a blocked way for good */if(!late&&(worker.path.length||worker.nextTile)){worker.update(delta);return;}if(late)worker.path=[];worker.steppingAside=null;}
    if(this.system.commands.update(worker,delta)){if(worker.restPhase)this.system.rest?.stop(worker);return;}
    worker.aiCooldown-=delta;
    if(worker.arriving){this.arrival(worker);worker.update(delta);return;}
    // Owner 17 Nov 2026: a soldier on a wall order (post or patrol) keeps it – no resting at home, no walk to the
    // Barracks first; the military order leads every frame.
    if(worker.profession==='soldier'&&worker.wallPatrol&&this.scene.military){if(worker.restPhase)this.system.rest?.stop(worker);if(!this.scene.military.updateSoldier(worker,delta)&&!worker.onWall)this.patrol?.(worker);worker.update(delta);return;}
    // Owner 18 Nov 2026: a soldier on duty (an attack or siege order, a fight, an enemy near; MilitarySystem.onDuty) follows
    // it at once – it used to wait behind the morning rest and the walk to his Barracks, so the men walked off instead.
    if(worker.profession==='soldier'&&this.scene.military?.onDuty?.(worker)){if(worker.restPhase)this.system.rest?.stop(worker);if(this.scene.military.updateSoldier(worker,delta)){worker.update(delta);return;}}
    // Owner 18 Nov 2026: the alarm – a resident with an enemy soldier near runs to shelter and hides (AlarmSystem).
    if(this.scene.alarm?.lead(worker)){worker.update(delta);return;}
    if((worker.profession==='hunter'&&worker.currentHP<worker.maxHP*WORK_RULES.fleeRatio)||['Fleeing','Recovering'].includes(worker.workState)){
      this.recover(worker);worker.update(delta);return;
    }
    if(this.scene.foodProduction?.handleTransport(worker)){worker.update(delta);return;}
    // #58 phase B: rest time (or exhaustion) sends a free resident home before he picks new work.
    if(this.system.rest?.update(worker)){worker.update(delta);return;}
    // #58 phase C2: a striker stays home, an emigrant walks out of the kingdom.
    if(this.system.discontent?.update(worker)){worker.update(delta);return;}
    if(worker.profession==='idle'){this.idle(worker);worker.update(delta);return;}
    // m-oznacovani-tezby (56): borrow lends one employed Miner to the rocks of wall plans when no free Miner exists.
    if(this.scene.naturalResources?.miningWork.rocks.eligible(worker)||this.scene.naturalResources?.miningWork.rocks.borrow(worker)){this.scene.naturalResources.miningWork.rocks.update(worker,delta);worker.update(delta);return;}
    const job=JOBS[worker.profession];
    const workplace=this.scene.workplaceSystem;
    // Combat test 16 Nov 2026: a garrison soldier (a unit with no Barracks seat – the starting garrison, a scouting party)
    // has no workplace but still follows military orders: attack, scouting, the caravan, defending.
    if(worker.profession==='soldier'&&!worker.assignedWorkplaceId&&this.scene.military?.unit?.(worker)){
      if(!this.scene.military.updateSoldier(worker,delta)){if(this.scene.combat.attacks.has(worker)){worker.path=[];worker.workState='Working';worker.workMessage='Defending self';}else{worker.workState='Waiting';worker.workMessage='On guard';}}
      worker.update(delta);return;}
    if((job.requiresWorkplace||workplace?.requiresWorkplace(worker.profession))&&!worker.assignedWorkplaceId){worker.workState='Waiting';worker.workMessage='Waiting for workplace';worker.update(delta);return;}
    if(worker.assignedWorkplaceId&&workplace){
      if(!workplace.building(worker)){workplace.remove(worker);worker.update(delta);return;}
      if(!worker.workplaceReached){this.goToWorkplace(worker);worker.update(delta);return;}
      if(worker.cargo){this.returnToWorkplace(worker);worker.update(delta);return;}
      if(worker.profession==='soldier'){if(!this.scene.military?.updateSoldier(worker,delta))this.patrol(worker);worker.update(delta);return;}
    }
    if(worker.profession==='woodcutter'&&this.scene.naturalResources)this.scene.naturalResources.updateWorker(worker,delta);
    else if(worker.profession==='miner'){
      const home=workplace?.building(worker);
      if(this.scene.naturalResources&&home?.definition.mining&&home.quarryMode!=='legacy')this.scene.naturalResources.miningWork.update(worker,delta);else this.miner(worker,delta);
    }
    else if(worker.profession==='hunter')this.hunter(worker,delta);
    else if(worker.profession==='fisher'&&this.scene.fishing)this.scene.fishing.update(worker,delta);
    else if(worker.profession==='farmer'&&this.scene.farmingSystem)this.scene.farmingSystem.updateWorker(worker,delta);
    else if(job.workplace&&this.scene.workplaceSystem?.building(worker)?.definition.recipe&&this.scene.foodProduction)this.scene.foodProduction.updateWorker(worker);
    else if(worker.profession==='stablehand'&&this.scene.stables){this.scene.stables.updateWorker(worker,delta);}
    else if(worker.profession==='hauler'&&this.scene.logisticsTasks){
      const fetching=this.scene.vehicles?.updateHauler(worker);
      if(!fetching)this.scene.logisticsTasks.updateHauler(worker,delta);
      if(fetching||worker.workTask||worker.cargo)this.system.gather?.release(worker,{stop:!!fetching});else this.system.gather?.update(worker);
    }
    else if(worker.profession==='builder'){
      // Budovy jsou dosud okamžité. Staveniště dodá až skutečný construction provider.
      worker.workState='Waiting';worker.workMessage='Waiting for construction';
      this.system.jobs.constructionProvider?.updateWorker?.(worker,delta);
    }else{worker.workState='Waiting';worker.workMessage=worker.profession==='soldier'?'Standing guard':'Waiting for workplace';}
    worker.update(delta);
  }
  goToWorkplace(worker){
    const workplace=this.scene.workplaceSystem;worker.workState='Going to Workplace';worker.workMessage='Travelling to assigned workplace';
    if(workplace.atWorkplace(worker)){worker.workplaceReached=true;worker.workState='Searching for Target';worker.aiCooldown=0;return;}
    if(!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(workplace.goals(worker));}
  }
  returnToWorkplace(worker){
    const workplace=this.scene.workplaceSystem;worker.workState='Returning to Workplace';worker.workMessage=`Carrying ${worker.cargo.amount} ${worker.cargo.resource}`;
    if(workplace.deliver(worker)){worker.workState='Searching for Target';worker.aiCooldown=0;return;}
    if(!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(workplace.goals(worker));}
  }
  patrol(worker){
    if(this.scene.combat.attacks.has(worker)){worker.path=[];worker.workState='Working';worker.workMessage='Defending self';return;}
    worker.workState='Patrolling';worker.workMessage='Guarding barracks';if(worker.nextTile||worker.path.length||worker.aiCooldown>0)return;
    worker.aiCooldown=WORKPLACE_RULES.patrolWaitMin+Math.random()*(WORKPLACE_RULES.patrolWaitMax-WORKPLACE_RULES.patrolWaitMin);
    // m-zalozka-vojsko: a soldier walks the settlement's round, one waypoint after another; without a round (a tiny
    // settlement) or when the waypoint cannot be reached, he keeps to the Barracks as before.
    const point=worker.profession==='soldier'?this.scene.military?.nextPatrolPoint?.(worker):null;
    if(point){worker.workMessage='Patrolling the settlement';worker.moveTo([point]);if(worker.path.length||worker.nextTile)return;}
    const origin=this.origin(worker),r=WORKPLACE_RULES.patrolRadius,tile={x:Math.round(origin.x)+Math.floor(Math.random()*(r*2+1))-r,y:Math.round(origin.y)+Math.floor(Math.random()*(r*2+1))-r};
    if(this.scene.map[tile.y]?.[tile.x]===0)worker.moveTo([tile]);
  }
  arrival(worker){
    if(worker.nextTile||worker.path.length)return;
    if(this.system.homeGoals().some(t=>tileKey(t)===tileKey(worker.tile))){worker.arriving=false;worker.workState='Idle';worker.aiCooldown=1000;return;}
    if(worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(this.system.homeGoals());}
  }
  idle(worker){
    worker.workState='Idle';worker.workMessage='Unemployed';
    if(this.system.gather){this.system.gather.update(worker);return;}if(worker.nextTile||worker.path.length||worker.aiCooldown>0)return;
    worker.aiCooldown=2500+Math.random()*3000;const origin=worker.tile,r=2;
    const tile={x:Math.round(origin.x)+Math.floor(Math.random()*(r*2+1))-r,y:Math.round(origin.y)+Math.floor(Math.random()*(r*2+1))-r};
    if(this.scene.map[tile.y]?.[tile.x]===0)worker.moveTo([tile]);
  }
  recover(worker){
    if(!['Fleeing','Recovering'].includes(worker.workState)){this.cancel(worker);worker.workState='Fleeing';worker.aiCooldown=0;}
    if(worker.workState==='Fleeing'){
      worker.workMessage='Returning to safety';
      if(!worker.nextTile&&!worker.path.length){
        if(this.system.homeGoals(worker).some(t=>tileKey(t)===tileKey(worker.tile)))worker.workState='Recovering';
        else if(worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(this.system.homeGoals(worker));}
      }
    }
    if(worker.workState==='Recovering'){
      if(worker.cargo)this.scene.workplaceSystem?.deliver(worker);
      worker.workMessage='Recovering HP';
      if(worker.currentHP>=worker.maxHP*WORK_RULES.recoverRatio){worker.workState='Searching for Work';worker.aiCooldown=0;}
    }
  }
  atGoal(worker,goal){return !worker.nextTile&&!worker.path.length&&tileKey(worker.tile)===tileKey(goal);}
  ensureRoute(worker,goal){
    if(this.atGoal(worker,goal))return true;
    if(!worker.nextTile&&!worker.path.length&&!worker.moveTo([goal]))this.cancel(worker);
    return false;
  }
  miner(worker,delta){
    let task=worker.workTask;
    if(!task){
      if(worker.aiCooldown>0)return;worker.aiCooldown=WORK_RULES.searchInterval;worker.workState='Searching for Work';
      const candidates=[...this.scene.resources.entries()].filter(([key,view])=>view.getData('objectId')==='stone'
        &&this.withinRange(worker,view.getData('tile'))&&this.system.reservations.available(`resource:${key}`,worker.id)&&this.scene.character.order?.pickupKey!==key);
      const drops=this.scene.workplaceSystem?[...this.scene.dropSystem.drops.values()].filter(d=>d.siteId==null&&d.resource==='stone'&&this.withinRange(worker,d.tile)&&this.system.reservations.available(`drop:${d.id}`,worker.id)&&this.scene.character.order?.dropId!==d.id):[];
      const route=this.route(worker,[...candidates.map(([,view])=>view.getData('tile')),...drops.map(d=>d.tile)]);
      if(!route){worker.workState='Waiting';worker.workMessage='No reachable stone';return;}
      const target=candidates.find(([,v])=>tileKey(v.getData('tile'))===tileKey(route.destination));
      if(target)this.reserve(worker,`resource:${target[0]}`,{kind:'mine',targetId:target[0]},route);
      else{const drop=drops.find(d=>tileKey(d.tile)===tileKey(route.destination));this.reserve(worker,`drop:${drop.id}`,{kind:'mineDrop',targetId:drop.id},route);}task=worker.workTask;
    }
    if(!task)return;
    const view=task.kind==='mineDrop'?this.scene.dropSystem.drops.get(task.targetId):this.scene.resources.get(task.targetId);
    if(!view||this.scene.character.order?.pickupKey===task.targetId||this.scene.character.order?.dropId===task.targetId){this.cancel(worker);return;}
    if(!this.ensureRoute(worker,task.goal))return;
    worker.workState='Working';worker.workMessage='Mining stone';task.progressMs+=delta*this.scene.skillSystem.workEfficiency(worker,'mining')*(this.scene.workplaceSystem?.workFactor?.(worker)??1);
    if(task.progressMs>=WORK_RULES.miningDuration){if(task.kind==='mineDrop')this.scene.dropSystem.collect(task.targetId,worker.tile,worker);else this.scene.collectResource(task.targetId,worker.tile,worker);this.cancel(worker);worker.workState='Searching for Work';}
  }
  hunter(worker,delta){
    let task=worker.workTask;
    if(!task){if(worker.aiCooldown>0)return;worker.aiCooldown=WORK_RULES.searchInterval;worker.workState='Searching for Work';
      const drops=this.nearest(worker,[...this.scene.dropSystem.drops.values()].filter(d=>d.siteId==null&&d.resource==='meat'&&this.huntable(worker,d.tile)
        &&this.system.reservations.available(`drop:${d.id}`,worker.id)&&this.scene.character.order?.dropId!==d.id),d=>d.tile);
      const dropRoute=this.route(worker,drops.map(d=>d.tile));
      if(dropRoute){const drop=drops.find(d=>tileKey(d.tile)===tileKey(dropRoute.destination));this.reserve(worker,`drop:${drop.id}`,{kind:'collectMeat',targetId:drop.id},dropRoute);}
      else{
        // Z2: game that the Hunter's dog tracks (within 8 tiles of it) can be chosen too.
        const animals=this.nearest(worker,[...this.scene.animalSystem.animals.values()].filter(a=>a.isAlive&&a.definition.gameplay.huntable&&(this.huntable(worker,a.tile)||this.scene.domestic?.tracks?.(worker,a.tile))
          &&this.system.reservations.available(`animal:${a.id}`,worker.id)&&this.scene.huntingSystem.target!==a),a=>a.tile);
        const goals=new Map();for(const animal of animals)for(const tile of adjacentTiles(animal,this.scene.map))if(this.scene.map[tile.y]?.[tile.x]===0)goals.set(tileKey(tile),{tile,animal});
        const route=this.route(worker,[...goals.values()].map(p=>p.tile));
        if(route){const a=goals.get(tileKey(route.destination)).animal;this.reserve(worker,`animal:${a.id}`,{kind:'hunt',targetId:a.id},route);}
        else{worker.workState='Waiting';worker.workMessage='No reachable game or meat';return;}
      }
      task=worker.workTask;
    }
    if(!task)return;
    if(task.kind==='collectMeat'){
      const drop=this.scene.dropSystem.drops.get(task.targetId);
      if(!drop||this.scene.character.order?.dropId===task.targetId){this.cancel(worker);return;}
      if(this.ensureRoute(worker,drop.tile)){
        if(this.scene.workplaceSystem){worker.workState='Working';worker.workMessage='Gathering meat';task.progressMs+=delta*this.scene.skillSystem.workEfficiency(worker,'hunting')*(this.scene.workplaceSystem?.workFactor?.(worker)??1);if(task.progressMs<WORKPLACE_RULES.collectMeatDuration)return;}
        this.scene.dropSystem.collect(drop.id,worker.tile,worker);this.cancel(worker);worker.workState='Searching for Work';}return;
    }
    const animal=this.scene.animalSystem.animals.get(task.targetId);
    if(!animal?.isAlive||this.scene.huntingSystem.target===animal){this.cancel(worker);return;}
    if(!worker.nextTile&&canInteractAdjacent(this.scene.map,worker,animal)){
      worker.path=[];worker.workState='Working';worker.workMessage=`Hunting ${dataName(animal.definition)}`;
      const dx=animal.position.x-worker.position.x,dy=animal.position.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};
      this.scene.combat.startAttack(worker,animal);
    }else{
      this.scene.combat.stopAttack(worker);worker.workState=this.scene.workplaceSystem?'Traveling to Target':'Moving to Target';worker.workMessage='Following game';
      if(worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;if(!worker.moveTo(adjacentTiles(animal,this.scene.map)))this.cancel(worker);}
    }
  }
  animalDied(animal,killer,drop){
    for(const worker of this.system.liveWorkers())if(worker.workTask?.kind==='hunt'&&worker.workTask.targetId===animal.id){
      this.cancel(worker);
      if(killer===worker&&drop){const route=this.route(worker,[drop.tile]);if(route)this.reserve(worker,`drop:${drop.id}`,{kind:'collectMeat',targetId:drop.id},route);}
    }
  }
}
