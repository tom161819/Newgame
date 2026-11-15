import { dataName } from '../i18n/names.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { buildingHP,repairPlan } from '../game/buildingHealth.js';
import { advanceConstruction } from './ConstructionProgress.js';

// m-budovy-hp (owner 15 Nov 2026): a damaged building is repaired by Builders. The repair is ordered by itself once the
// building is no longer burning and the stores hold half the price of what is missing (paid when the job starts). It
// uses the construction system's Builder AI, side reservations and shared work like a demolition; hit points come back
// with the work done. A job is a record on the building (`building.repair`), saved with it.
export const REPAIR_CHECK_MS=1000;
export class RepairSystem {
  constructor(scene){this.scene=scene;this.jobs=new Map();this.checkIn=0;}
  target(id){return this.scene.buildings.find(b=>b.id===id);}
  damaged(b){const s=buildingHP(b);return !!s&&s.hp<s.max;}
  eligible(b){return !!b&&this.scene.buildings.includes(b)&&buildingIsComplete(b)&&!b.demolition&&!b.unverified&&!this.scene.nightThreats?.burning?.(b)&&this.damaged(b);}
  // Orders a repair when the stores can pay; returns the job or null.
  request(b){
    if(this.jobs.has(b?.id)||!this.eligible(b)||this.scene.gameOver)return null;const plan=repairPlan(b);if(!plan)return null;
    if(!this.scene.inventory.pay(plan.cost,{source:`${dataName(buildingDefinition(b))} Repair`,entityId:b.id}))return null;
    const record={state:'planned',requiredWork:plan.work,workDone:0,progress:0,contributions:{},assignedBuilders:[],cost:plan.cost,startHp:plan.startHp};
    b.repair=record;this.jobs.set(b.id,record);this.scene.constructionSystem.revision++;return record;
  }
  site(id){const b=this.target(id),record=this.jobs.get(id);return b&&record?{...b,repair:true,construction:record}:null;}
  sites(){return [...this.jobs.keys()].map(id=>this.site(id)).filter(Boolean);}
  canWork(site,actor){const b=this.target(site?.id);return !!actor&&actor.isAlive&&actor.id!=='king'&&actor.profession==='builder'&&(!actor.commandState||actor.commandState.state==='Working')&&!!b&&!b.demolition&&!this.scene.nightThreats?.burning?.(b)&&site.construction.workDone<site.construction.requiredWork;}
  releaseWorkers(id){const record=this.jobs.get(id);for(const workerId of [...(record?.assignedBuilders??[])]){const w=this.scene.workerSystem.workers.get(workerId);if(w)this.scene.workerSystem.ai.cancel(w);}}
  // A job stops without a refund (the materials went into the work) when the building is gone, burning or demolished.
  cancel(id){if(!this.jobs.has(id))return false;this.releaseWorkers(id);const b=this.target(id);if(b)delete b.repair;this.jobs.delete(id);this.scene.constructionSystem.revision++;return true;}
  applyHP(b,record){const max=buildingHP(b)?.max;if(!max)return;const hp=Math.min(max,record.startHp+(max-record.startHp)*record.workDone/record.requiredWork);if(hp>=max-1e-6)delete b.hp;else b.hp=Math.round(hp*100)/100;}
  update(delta){
    if(delta<=0||this.scene.gameOver||this.scene.gameTime.paused)return;const system=this.scene.constructionSystem;
    this.checkIn-=delta;if(this.checkIn<=0){this.checkIn=REPAIR_CHECK_MS;for(const b of this.scene.buildings)if(!this.jobs.has(b.id)&&this.eligible(b))this.request(b);}
    for(const [id,record]of [...this.jobs]){
      const b=this.target(id);if(!b||!buildingIsComplete(b)||b.demolition||this.scene.nightThreats?.burning?.(b)){this.cancel(id);continue;}
      const site=this.site(id),participants=[];
      for(const workerId of [...record.assignedBuilders]){
        const actor=system.actor(workerId),assignment=system.assignments.get(workerId);
        if(!this.canWork(site,actor)){if(actor)this.scene.workerSystem.ai.cancel(actor);continue;}
        if(assignment&&system.atSite(actor,assignment)){actor.workState='Working';actor.workMessage=`Repairing ${dataName(buildingDefinition(b))}`;participants.push({id:workerId,speed:system.workSpeed(site,actor),available:Math.min(delta,actor.availableWorkMs??0)});}
      }
      const done=record.workDone>=record.requiredWork||advanceConstruction(site,participants,delta);this.applyHP(b,record);
      if(done){this.releaseWorkers(id);delete b.hp;delete b.repair;this.jobs.delete(id);system.revision++;}
    }
  }
  rebuild(){this.jobs=new Map(this.scene.buildings.filter(b=>b.repair).map(b=>[b.id,b.repair]));}
  destroy(){this.jobs.clear();}
}
