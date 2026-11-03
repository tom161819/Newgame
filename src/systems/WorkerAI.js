import { findPathToAny } from '../game/pathfinding.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { tileKey } from '../game/stones.js';
import { JOBS,WORK_RULES,POPULATION } from '../data/jobs.js';

export class WorkerAI {
  constructor(system){this.system=system;this.scene=system.scene;}
  cancel(worker){
    const task=worker.workTask,animal=(task?.kind==='hunt'?this.scene.animalSystem.animals.get(task.targetId):null)??this.scene.combat.attacks.get(worker);
    if(animal?.retaliationTarget===worker)this.scene.animalSystem.stopRetaliation(animal);
    this.scene.combat.stopAttack(worker);this.system.reservations.releaseActor(worker.id);worker.workTask=null;worker.path=[];worker.aiCooldown=0;worker.workMessage='';
  }
  origin(worker){return this.system.origin(worker);}
  withinRange(worker,tile){const origin=this.origin(worker);return Math.max(Math.abs(tile.x-origin.x),Math.abs(tile.y-origin.y))<=WORK_RULES.workRadius;}
  reserve(worker,key,task,route){
    if(!this.system.reservations.reserve(key,worker.id))return false;
    worker.workTask={...task,reservation:key,goal:{...route.destination},progressMs:0};worker.path=route.path;worker.workState='Moving to Target';worker.workMessage=task.kind==='mine'?'Travelling to stone':task.kind==='hunt'?'Following game':'Collecting meat';return true;
  }
  update(worker,delta){
    if(!worker.isAlive)return;
    worker.aiCooldown-=delta;
    if(worker.arriving){this.arrival(worker);worker.update(delta);return;}
    if((worker.profession==='hunter'&&worker.currentHP<worker.maxHP*WORK_RULES.fleeRatio)||['Fleeing','Recovering'].includes(worker.workState)){
      this.recover(worker);worker.update(delta);return;
    }
    if(worker.profession==='idle'){this.idle(worker);worker.update(delta);return;}
    const job=JOBS[worker.profession];
    if(job.requiresWorkplace&&!worker.assignedWorkplaceId){worker.workState='Waiting';worker.workMessage='Waiting for workplace';worker.update(delta);return;}
    if(worker.profession==='miner')this.miner(worker,delta);
    else if(worker.profession==='hunter')this.hunter(worker,delta);
    else if(worker.profession==='builder'){
      // Budovy jsou dosud okamžité. Staveniště dodá až skutečný construction provider.
      worker.workState='Waiting';worker.workMessage='Waiting for construction';
      this.system.jobs.constructionProvider?.updateWorker?.(worker,delta);
    }else{worker.workState='Waiting';worker.workMessage=worker.profession==='soldier'?'Standing guard':'Waiting for workplace';}
    worker.update(delta);
  }
  arrival(worker){
    if(worker.nextTile||worker.path.length)return;
    if(this.system.homeGoals().some(t=>tileKey(t)===tileKey(worker.tile))){worker.arriving=false;worker.workState='Idle';worker.aiCooldown=1000;return;}
    if(worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(this.system.homeGoals());}
  }
  idle(worker){
    worker.workState='Idle';worker.workMessage='Unemployed';if(worker.nextTile||worker.path.length||worker.aiCooldown>0)return;
    worker.aiCooldown=2500+Math.random()*3000;const origin=this.origin(worker),r=POPULATION.wanderRadius;
    const tile={x:Math.round(origin.x)+Math.floor(Math.random()*(r*2+1))-r,y:Math.round(origin.y)+Math.floor(Math.random()*(r*2+1))-r};
    if(this.scene.map[tile.y]?.[tile.x]===0)worker.moveTo([tile]);
  }
  recover(worker){
    if(!['Fleeing','Recovering'].includes(worker.workState)){this.cancel(worker);worker.workState='Fleeing';worker.aiCooldown=0;}
    if(worker.workState==='Fleeing'){
      worker.workMessage='Returning to safety';
      if(!worker.nextTile&&!worker.path.length){
        if(this.system.homeGoals().some(t=>tileKey(t)===tileKey(worker.tile)))worker.workState='Recovering';
        else if(worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(this.system.homeGoals());}
      }
    }
    if(worker.workState==='Recovering'){
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
      const route=findPathToAny(this.scene.map,worker.nextTile??worker.tile,candidates.map(([,view])=>view.getData('tile')));
      if(!route){worker.workState='Waiting';worker.workMessage='No reachable stone';return;}
      const target=candidates.find(([,v])=>tileKey(v.getData('tile'))===tileKey(route.destination));
      this.reserve(worker,`resource:${target[0]}`,{kind:'mine',targetId:target[0]},route);task=worker.workTask;
    }
    if(!task)return;
    const view=this.scene.resources.get(task.targetId);
    if(!view||this.scene.character.order?.pickupKey===task.targetId){this.cancel(worker);return;}
    if(!this.ensureRoute(worker,task.goal))return;
    worker.workState='Working';worker.workMessage='Mining stone';task.progressMs+=delta*this.scene.skillSystem.efficiency(worker,'mining');
    if(task.progressMs>=WORK_RULES.miningDuration){this.scene.collectResource(task.targetId,worker.tile,worker);this.cancel(worker);worker.workState='Searching for Work';}
  }
  hunter(worker,_delta){
    let task=worker.workTask;
    if(!task){if(worker.aiCooldown>0)return;worker.aiCooldown=WORK_RULES.searchInterval;worker.workState='Searching for Work';
      const drops=[...this.scene.dropSystem.drops.values()].filter(d=>d.resource==='meat'&&this.withinRange(worker,d.tile)
        &&this.system.reservations.available(`drop:${d.id}`,worker.id)&&this.scene.character.order?.dropId!==d.id);
      const dropRoute=findPathToAny(this.scene.map,worker.nextTile??worker.tile,drops.map(d=>d.tile));
      if(dropRoute){const drop=drops.find(d=>tileKey(d.tile)===tileKey(dropRoute.destination));this.reserve(worker,`drop:${drop.id}`,{kind:'collectMeat',targetId:drop.id},dropRoute);}
      else{
        const animals=[...this.scene.animalSystem.animals.values()].filter(a=>a.isAlive&&a.definition.gameplay.huntable&&this.withinRange(worker,a.tile)
          &&this.system.reservations.available(`animal:${a.id}`,worker.id)&&this.scene.huntingSystem.target!==a);
        const goals=new Map();for(const animal of animals)for(const tile of adjacentTiles(animal,this.scene.map))if(this.scene.map[tile.y]?.[tile.x]===0)goals.set(tileKey(tile),{tile,animal});
        const route=findPathToAny(this.scene.map,worker.nextTile??worker.tile,[...goals.values()].map(p=>p.tile));
        if(route){const a=goals.get(tileKey(route.destination)).animal;this.reserve(worker,`animal:${a.id}`,{kind:'hunt',targetId:a.id},route);}
        else{worker.workState='Waiting';worker.workMessage='No reachable game or meat';return;}
      }
      task=worker.workTask;
    }
    if(!task)return;
    if(task.kind==='collectMeat'){
      const drop=this.scene.dropSystem.drops.get(task.targetId);
      if(!drop||this.scene.character.order?.dropId===task.targetId){this.cancel(worker);return;}
      if(this.ensureRoute(worker,drop.tile)){this.scene.dropSystem.collect(drop.id,worker.tile,worker);this.cancel(worker);worker.workState='Searching for Work';}return;
    }
    const animal=this.scene.animalSystem.animals.get(task.targetId);
    if(!animal?.isAlive||this.scene.huntingSystem.target===animal){this.cancel(worker);return;}
    if(!worker.nextTile&&canInteractAdjacent(this.scene.map,worker,animal)){
      worker.path=[];worker.workState='Working';worker.workMessage=`Hunting ${animal.definition.name}`;
      const dx=animal.position.x-worker.position.x,dy=animal.position.y-worker.position.y,n=Math.hypot(dx,dy);if(n)worker.direction={x:dx/n,y:dy/n};
      this.scene.combat.startAttack(worker,animal);
    }else{
      this.scene.combat.stopAttack(worker);worker.workState='Moving to Target';worker.workMessage='Following game';
      if(worker.aiCooldown<=0){worker.aiCooldown=WORK_RULES.searchInterval;if(!worker.moveTo(adjacentTiles(animal,this.scene.map)))this.cancel(worker);}
    }
  }
  animalDied(animal,killer,drop){
    for(const worker of this.system.liveWorkers())if(worker.workTask?.kind==='hunt'&&worker.workTask.targetId===animal.id){
      this.cancel(worker);
      if(killer===worker&&drop){const route=findPathToAny(this.scene.map,worker.nextTile??worker.tile,[drop.tile]);if(route)this.reserve(worker,`drop:${drop.id}`,{kind:'collectMeat',targetId:drop.id},route);}
    }
  }
}
