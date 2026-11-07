import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { EMPLOYMENT_PRESETS,EMPLOYMENT_PROFESSIONS,PRIORITY_RANGE,presetOf } from '../data/employment.js';

// Automatic employment: fills free workplace seats with available Unemployed residents only. Seats are filled by
// profession priority (5 → 1); within one priority the building with the fewest staff goes first, then by building id; for each seat the best resident is chosen across the whole
// kingdom: a natural talent for the skill first, then skill level, XP in the skill, overall level, stable id.
// Employed residents are never moved. Someone the player made Unemployed by hand stays so until assigned by hand.
export const compareForSkill=skill=>(a,b)=>Number(b.naturalTalent===skill)-Number(a.naturalTalent===skill)
  ||(b.skills?.[skill]?.level??1)-(a.skills?.[skill]?.level??1)||(b.skills?.[skill]?.totalXP??0)-(a.skills?.[skill]?.totalXP??0)
  ||(b.experience?.level??1)-(a.experience?.level??1)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true});

export class EmploymentSystem {
  constructor(scene,{enabled=true,state=null}={}){
    this.scene=scene;this.enabled=state?.enabled??enabled;this.priorities={...EMPLOYMENT_PRESETS.balanced,...(state?.priorities??{})};this.held=new Set(state?.held??[]);this.blockedBuildings=new Set(state?.blockedBuildings??[]);this.blockedTypes=new Set(state?.blockedTypes??[]);
    this.listeners=new Set();this.dirty=true;this.running=false;
    this.unsubscribe=scene.workplaceSystem.onChange(()=>this.request());this.worldChanged=()=>this.request();scene.events?.on('buildings:changed',this.worldChanged);
  }
  get preset(){return presetOf(this.priorities);}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const listener of this.listeners)listener();}
  // Events only mark the plan as due; it runs once in the next update, never inside the event that asked for it.
  request(){this.pruneExclusions();this.dirty=true;}
  workplace(building){return !!building&&this.scene.buildings.includes(building)&&buildingIsComplete(building)&&!building.unverified&&!!buildingDefinition(building).workplace;}
  blockReason(building){return this.blockedTypes.has(building?.type)?'type':this.blockedBuildings.has(building?.id)?'local':null;}
  // m-zamestnani-2 (35, owner 7 Nov 2026): switching employment off empties the building at once, also while its
  // workers are in the middle of a task (the task is cancelled, cargo is dropped, a production cycle stays with the
  // building). They become Unemployed and automatic employment may place them elsewhere.
  dismiss(buildings){for(const building of buildings)for(const worker of [...(this.scene.workplaceSystem?.employees(building)??[])])this.scene.workplaceSystem.remove(worker);}
  setBuildingDisabled(building,disabled){
    if(!this.workplace(building)||typeof disabled!=='boolean')return false;
    if(disabled){this.blockedBuildings.add(building.id);this.dismiss([building]);}else this.blockedBuildings.delete(building.id);this.request();this.changed();return true;
  }
  setTypeDisabled(building,disabled){
    if(!this.workplace(building)||typeof disabled!=='boolean')return false;
    if(disabled){this.blockedTypes.add(building.type);this.dismiss(this.scene.buildings.filter(x=>x.type===building.type));}else this.blockedTypes.delete(building.type);this.request();this.changed();return true;
  }
  pruneExclusions(){
    if(!this.blockedBuildings.size)return;const valid=new Set(this.scene.buildings.filter(b=>buildingIsComplete(b)&&!b.unverified&&buildingDefinition(b).workplace).map(b=>b.id));for(const id of this.blockedBuildings)if(!valid.has(id))this.blockedBuildings.delete(id);
  }
  setEnabled(value){this.enabled=!!value;this.request();this.changed();}
  setPriority(profession,value){
    if(!EMPLOYMENT_PROFESSIONS.includes(profession)||!Number.isInteger(value)||value<PRIORITY_RANGE.min||value>PRIORITY_RANGE.max)return false;
    this.priorities[profession]=value;this.request();this.changed();return true;
  }
  applyPreset(id){if(!EMPLOYMENT_PRESETS[id])return false;this.priorities={...EMPLOYMENT_PRESETS[id]};this.request();this.changed();return true;}
  // Manual orders win: a resident removed or made Unemployed by hand is left alone; a manual assignment clears that.
  hold(worker){if(worker)this.held.add(worker.id);}
  release(worker){if(worker)this.held.delete(worker.id);}
  available(worker){return (!worker.commandState||worker.commandState.state==='Working')&&worker.isAlive&&worker.isSubject!==false&&worker.profession==='idle'&&worker.assignedWorkplaceId==null&&!worker.arriving&&!worker.cargo&&!worker.workTask&&!worker.leaving&&!this.held.has(worker.id);}
  seats(){
    const s=this.scene,seats=[];
    for(const building of [...s.buildings].sort((a,b)=>a.id-b.id)){
      const spec=buildingDefinition(building).workplace;if(!spec||!buildingIsComplete(building)||building.unverified||this.blockReason(building))continue;
      const production=s.foodProduction?.records.get(building.id);if(production&&!production.auto)continue;
      const record=s.workplaceSystem.register(building);if(!record)continue;
      for(let i=record.workerIds.length;i<spec.capacity;i++)seats.push({building,spec,priority:this.priorities[spec.profession]??PRIORITY_RANGE.default});
    }
    return seats.sort((a,b)=>b.priority-a.priority||a.building.id-b.building.id);
  }
  // Within one priority the best pairing across all its open seats goes first: each building offers its best
  // reachable candidate and the strongest match (talent, skill level, XP, overall level) wins, ties by building id.
  // So a talented Miner reaches the Quarry even when the Lumberjack Hut was built earlier.
  run(){
    if(!this.enabled||this.running||this.scene.gameOver)return 0;this.running=true;let hired=0;
    try{
      const pool=this.scene.workerSystem.liveSubjects().filter(w=>this.available(w)),seats=this.seats(),reach=new Map();
      const reachable=(worker,building)=>{const key=`${worker.id}:${building.id}`;if(!reach.has(key))reach.set(key,!!this.scene.workerSystem.ai.route(worker,towerNeighbors(building)));return reach.get(key);};
      const stronger=(a,b)=>{for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]>b[i];return false;};
      const strength=(worker,skill)=>[Number(worker.naturalTalent===skill),worker.skills?.[skill]?.level??1,worker.skills?.[skill]?.totalXP??0,worker.experience?.level??1];
      for(const priority of [...new Set(seats.map(seat=>seat.priority))]){
        const open=new Map();for(const seat of seats)if(seat.priority===priority)open.set(seat.building.id,{...seat,count:(open.get(seat.building.id)?.count??0)+1});
        while(pool.length&&open.size){
          // Same priority: the emptiest building first (0 staff before 1, 1 before 2…), so new residents spread over
          // the Quarry and the Hunting Lodge instead of all filling one; then the strongest match as before.
          let best=null;const staffed=building=>this.scene.workplaceSystem.register(building)?.workerIds.length??0;
          for(const seat of open.values()){
            const worker=pool.filter(w=>reachable(w,seat.building)).sort(compareForSkill(seat.spec.skill))[0];if(!worker)continue;
            const key=[-staffed(seat.building),...strength(worker,seat.spec.skill)],wins=!best||stronger(key,best.key);
            if(wins)best={seat,worker,key};
          }
          if(!best)break;
          if(this.scene.workplaceSystem.assign(best.seat.building,best.worker)){pool.splice(pool.indexOf(best.worker),1);hired++;}else pool.splice(pool.indexOf(best.worker),1);
          if(--best.seat.count<=0)open.delete(best.seat.building.id);
        }
      }
    }finally{this.running=false;}
    return hired;
  }
  update(){if(this.dirty&&this.enabled&&!this.scene.gameTime?.paused){this.dirty=false;this.run();}}
  importState(data){this.enabled=data?.enabled??this.enabled;this.priorities={...EMPLOYMENT_PRESETS.balanced,...(data?.priorities??{})};this.held=new Set(data?.held??[]);this.blockedBuildings=new Set(data?.blockedBuildings??[]);this.blockedTypes=new Set(data?.blockedTypes??[]);this.request();this.changed();}
  exportState(){this.pruneExclusions();return {blockedBuildings:[...this.blockedBuildings].sort((a,b)=>a-b),blockedTypes:[...this.blockedTypes].sort(),enabled:this.enabled,priorities:{...this.priorities},held:[...this.held].sort()};}
  destroy(){this.unsubscribe();this.scene.events?.off('buildings:changed',this.worldChanged);this.listeners.clear();}
}
