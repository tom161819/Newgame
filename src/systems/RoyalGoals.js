import { buildingIsComplete } from '../game/buildingState.js';
import { ROYAL_GOALS, ROYAL_GOALS_ACTIVE, ROYAL_GOALS_CHECK_MS, RETIRED_ROYAL_GOALS } from '../data/royalGoals.js';

const typeOf=building=>building.type??building.definition?.id;
// The world figures a goal is measured against. Buildings, residents and gold come from the world itself; finished
// production cycles are counted by the system (and saved) because the world keeps no history of them.
export function goalWorld(scene,produced={}){
  const built={};for(const b of scene.buildings??[])if(buildingIsComplete(b)){const type=typeOf(b);built[type]=(built[type]??0)+1;}
  return {built,population:scene.workerSystem?.liveSubjects?.()?.length??0,gold:scene.inventory?.count?.('gold')??0,produced};
}
export function goalValue(goal,world){
  if(goal.kind==='buildings')return world.built[goal.building]??0;
  if(goal.kind==='population')return world.population;
  if(goal.kind==='produced')return world.produced[goal.building]??0;
  if(goal.kind==='gold')return Math.floor(world.gold);
  return 0;
}
export class RoyalGoals {
  constructor(scene,{goals=ROYAL_GOALS,active=ROYAL_GOALS_ACTIVE}={}){
    this.scene=scene;this.goals=goals;this.activeCount=active;this.done=new Set();this.produced={};this.wait=0;this.listeners=new Set();this.revision=0;
    this.off=scene.activities?.on?.(event=>{if(event.type==='foodProduced'&&event.objectType){this.produced[event.objectType]=(this.produced[event.objectType]??0)+1;}})??(()=>{});
  }
  on(listener){this.listeners.add(listener);return ()=>this.listeners.delete(listener);}
  emit(type,detail){for(const l of [...this.listeners])l(type,detail);}
  active(){return this.goals.filter(g=>!this.done.has(g.id)).slice(0,this.activeCount);}
  progress(){const world=goalWorld(this.scene,this.produced);return this.active().map(goal=>({goal,value:Math.min(goal.target,goalValue(goal,world))}));}
  get allDone(){return this.goals.every(g=>this.done.has(g.id));}
  update(delta=0){this.wait-=delta;if(this.wait>0)return [];this.wait=ROYAL_GOALS_CHECK_MS;return this.check();}
  // Finishes every active goal that is met. A goal pays once: it is marked done before the reward goes in.
  check(){
    const finished=[],silent=this.silent;this.silent=false;let more=true;
    while(more){
      more=false;const world=goalWorld(this.scene,this.produced);
      for(const goal of this.active()){
        if(goalValue(goal,world)<goal.target)continue;
        this.done.add(goal.id);this.revision++;if(silent){more=true;continue;}
        for(const [resource,amount] of Object.entries(goal.reward??{}))this.scene.inventory?.add?.(resource,amount,{source:'Royal Task',id:`royal-goal:${goal.id}:${resource}`});
        finished.push(goal);this.emit('completed',goal);more=true;
      }
    }
    if(finished.length||silent){this.scene.updateInventory?.();this.emit('changed');}
    return finished;
  }
  exportState(){return {done:this.goals.filter(g=>this.done.has(g.id)).map(g=>g.id),produced:{...this.produced}};}
  // A save from before E4 marks the tasks it already meets as done, without rewards, on the first check.
  importState(data){this.silent=data===undefined;this.done=new Set((data?.done??[]).filter(id=>this.goals.some(g=>g.id===id)));this.produced={...(data?.produced??{})};this.wait=0;this.revision++;this.emit('changed');}
  destroy(){this.off?.();this.listeners.clear();}
}
export function validRoyalGoalState(data,goals=ROYAL_GOALS){
  if(!data||typeof data!=='object'||Array.isArray(data))return false;
  const ids=new Set([...goals.map(g=>g.id),...RETIRED_ROYAL_GOALS]);
  if(!Array.isArray(data.done)||new Set(data.done).size!==data.done.length||!data.done.every(id=>ids.has(id)))return false;
  if(!data.produced||typeof data.produced!=='object'||Array.isArray(data.produced))return false;
  return Object.values(data.produced).every(n=>Number.isSafeInteger(n)&&n>=0);
}
