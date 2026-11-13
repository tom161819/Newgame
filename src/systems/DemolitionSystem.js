import { dataName } from '../i18n/names.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { CONSTRUCTION_RULES } from '../data/construction.js';
import { advanceConstruction } from './ConstructionProgress.js';

import { buildingDemolitionRefund } from '../data/demolition.js';
export { demolitionRefund } from '../data/demolition.js';
// Uses ConstructionSystem's existing BuilderAI, perimeter reservations and physical work allocation.
// The completion callback must reconcile the real building lifecycle atomically before returning true.
export class DemolitionSystem {
  constructor(scene,{complete}={}){
    if(typeof complete!=='function')throw new TypeError('Demolition requires an atomic building completion callback.');
    this.scene=scene;this.complete=complete;this.jobs=new Map();
  }
  target(id){return this.scene.buildings.find(b=>b.id===id);}
  eligible(building){
    if(!building||!this.scene.buildings.includes(building)||!buildingIsComplete(building)||['castle','starter_stockpile'].includes(building.type))return false;
    const d=buildingDefinition(building);return (d.buildable||d.id==='burnt_ruins'/* owner 13 Nov 2026: builders clear burnt ruins */)&&!d.pavement;
  }
  roofBlocked(building){const king=this.scene.character;return buildingDefinition(building).interactions?.includes('enter')&&(king.state!=='ground'||king.transitioning);}
  request(building){
    if(!this.eligible(building)||this.scene.gameOver||this.jobs.has(building.id)||this.scene.fog&&!this.scene.fog.isVisibleObject(building)||this.roofBlocked(building))return false;
    const d=buildingDefinition(building),record={state:'planned',requiredWork:d.constructionTime??CONSTRUCTION_RULES.defaultTime,workDone:0,progress:0,contributions:{},assignedBuilders:[],refund:buildingDemolitionRefund(building,d)};
    building.demolition=record;this.jobs.set(building.id,record);this.scene.constructionSystem.revision++;return true;
  }
  site(id){const building=this.target(id),record=this.jobs.get(id);return building&&record?{...building,demolition:true,construction:record}:null;}
  sites(){return [...this.jobs.keys()].map(id=>this.site(id)).filter(Boolean);}
  canWork(site,actor){return !!actor&&actor.isAlive&&actor.id!=='king'&&actor.profession==='builder'&&(!actor.commandState||actor.commandState.state==='Working')&&this.eligible(this.target(site.id))&&!this.roofBlocked(this.target(site.id))&&site.construction.workDone<site.construction.requiredWork;}
  releaseWorkers(id){
    const record=this.jobs.get(id);for(const workerId of [...(record?.assignedBuilders??[])]){const worker=this.scene.workerSystem.workers.get(workerId);if(worker)this.scene.workerSystem.ai.cancel(worker);}
  }
  cancel(id){
    if(!this.jobs.has(id))return false;this.releaseWorkers(id);const building=this.target(id);if(building)delete building.demolition;
    this.jobs.delete(id);this.scene.constructionSystem.revision++;return true;
  }
  update(delta){
    if(delta<=0||this.scene.gameOver||this.scene.gameTime.paused)return;
    const system=this.scene.constructionSystem;
    for(const [id,record]of [...this.jobs]){
      const building=this.target(id);if(!this.eligible(building)){this.cancel(id);continue;}
      if(this.roofBlocked(building))continue;
      const site=this.site(id),participants=[];
      for(const workerId of [...record.assignedBuilders]){
        const actor=system.actor(workerId),assignment=system.assignments.get(workerId);
        if(!this.canWork(site,actor)){if(actor)this.scene.workerSystem.ai.cancel(actor);continue;}
        if(assignment&&system.atSite(actor,assignment)){actor.workState='Working';actor.workMessage=`Dismantling ${dataName(buildingDefinition(building))}`;participants.push({id:workerId,speed:system.workSpeed(site,actor),available:Math.min(delta,actor.availableWorkMs??0)});}
      }
      if(record.workDone>=record.requiredWork||advanceConstruction(site,participants,delta)){
        this.releaseWorkers(id);
        if(this.complete(building,structuredClone(record.refund))){this.jobs.delete(id);delete building.demolition;system.revision++;}
      }
    }
  }
  rebuild(){this.jobs=new Map(this.scene.buildings.filter(b=>b.demolition).map(b=>[b.id,b.demolition]));}
  destroy(){for(const id of [...this.jobs.keys()])this.cancel(id);}
}
