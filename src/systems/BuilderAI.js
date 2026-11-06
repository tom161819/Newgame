import { t } from '../i18n/index.js';
import { dataName } from '../i18n/names.js';
import { findPathToAny } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
import { CONSTRUCTION_RULES } from '../data/construction.js';
import { towerNeighbors } from '../game/buildings.js';

export class BuilderAI {
  constructor(construction){this.construction=construction;this.blocked=new Map();}
  releaseWorker(worker){this.construction.release(worker);}
  // With no site ready to build and no free Hauler, a Builder fetches site
  // materials through the shared logistics bookings instead of waiting.
  carryMaterials(worker){
    const logistics=this.construction.scene.logisticsTasks;if(!logistics||!this.construction.materials.enabled||logistics.freeHauler())return false;
    const cooldown=worker.aiCooldown;worker.aiCooldown=0;
    if(logistics.updateWorker(worker,{constructionOnly:true}))return true;
    worker.aiCooldown=cooldown;worker.workState='Waiting';worker.workMessage='Waiting for construction';return false;
  }
  updateWorker(worker){
    const system=this.construction,scene=system.scene;
    if(worker.workTask){
      const site=system.sites.get(worker.workTask.targetId),assignment=system.assignments.get(worker.id);
      if(!site||!assignment){scene.workerSystem.ai.cancel(worker);return;}
      if(system.atSite(worker,assignment)){worker.workState='Working';worker.workMessage=`Building ${dataName(site.definition)}`;return;}
      worker.workState='Traveling to Target';worker.workMessage=`Travelling to ${dataName(site.definition)}`;
      if(!worker.nextTile&&!worker.path.length&&worker.aiCooldown<=0){
        worker.aiCooldown=CONSTRUCTION_RULES.retryInterval;
        if(assignment.checkedRevision!==system.revision){
          assignment.checkedRevision=system.revision;
          if(!findPathToAny(scene.map,worker.tile,[assignment.goal])){scene.workerSystem.ai.cancel(worker);worker.aiCooldown=0;return;}
        }
        worker.moveTo([assignment.goal]);
      }return;
    }
    worker.workState='Waiting';worker.workMessage='Waiting for construction';if(worker.aiCooldown>0)return;worker.aiCooldown=CONSTRUCTION_RULES.retryInterval;
    const choices=new Map(),start=worker.nextTile??worker.tile;
    for(const site of system.sites.values()){
      if(!system.materials.ready(site))continue;
      if(site.construction.assignedBuilders.length>=CONSTRUCTION_RULES.maximumBuilders||this.blocked.get(`${worker.id}:${site.id}`)===system.revision)continue;
      const goals=system.goals(site,worker);if(!goals.length){
        if(!towerNeighbors(system.materials.area?.(site).host??site).some(t=>scene.map[t.y]?.[t.x]===0)){this.blocked.set(`${worker.id}:${site.id}`,system.revision);site.unreachableReason=t('status.siteNoAccess');}
        continue;
      }
      for(const goal of goals)choices.set(tileKey(goal),{goal,site});
    }
    const route=findPathToAny(scene.workerSystem.navigationMap(worker),start,[...choices.values()].map(c=>c.goal),scene.pathWear?.routingOptions(worker));
    if(!route){
      for(const site of new Set([...choices.values()].map(c=>c.site)))if(!findPathToAny(scene.map,start,system.goals(site,worker))){this.blocked.set(`${worker.id}:${site.id}`,system.revision);site.unreachableReason=t('status.siteUnreachableSome');}
      this.carryMaterials(worker);return;
    }
    const {site}=choices.get(tileKey(route.destination));if(system.reserve(site,worker,route.destination)){
      worker.path=route.path;worker.workState='Traveling to Target';worker.workMessage=`Travelling to ${dataName(site.definition)}`;site.unreachableReason='';
    }
  }
}
