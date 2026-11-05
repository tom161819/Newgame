import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { DIAGNOSTICS,INPUT_SOURCES } from '../data/diagnostics.js';

// Lasting problems that block work or production, each identified by (entity, reason). A problem is reported once
// it has lasted DIAGNOSTICS.persistence, repeated at most every DIAGNOSTICS.reminder while it lasts, and dropped as
// soon as it is gone. Checked a few times per game second from the actual construction, production and storage
// state, never per unit or per frame. Nothing is saved: after Load a problem must last again before it is shown.
export class ProductionDiagnostics {
  constructor(scene){this.scene=scene;this.issues=new Map();this.listeners=new Set();this.nextCheck=0;this.revision=0;}
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){this.revision++;for(const listener of this.listeners)listener();}
  residents(profession){return this.scene.workerSystem.liveSubjects().filter(w=>w.profession===profession);}
  hasBuilding(type){return this.scene.buildings.some(b=>b.type===type&&buildingIsComplete(b));}
  // Construction: a supplied site nobody can build, because the kingdom has no Builder.
  constructionIssues(){
    const c=this.scene.constructionSystem;if(!c)return [];
    if(this.residents('builder').length)return [];
    return [...c.sites.values()].filter(site=>!site.unverified&&c.materials.ready(site)&&!site.construction.assignedBuilders.length)
      .map(site=>({entityId:site.id,reason:'noBuilder',category:'construction',params:{}}));
  }
  // Production: a staffed building switched on that lacks an input, with the nearest cause that can be checked.
  // Intentionally paused production, unstaffed buildings and inputs on their way or still growing are not problems.
  productionIssue(record){
    const s=this.scene,building=s.buildings.find(b=>b.id===record.buildingId);if(!building||!record.auto||record.cycle||!buildingIsComplete(building))return null;
    const recipe=buildingDefinition(building).recipe;if(!recipe||!s.workplaceSystem.employees(building).length)return null;
    const input=s.foodStorage.locations.get(`input-${building.id}`);if(!input)return null;
    for(const [resource,need]of Object.entries(recipe.input)){
      const missing=need-(input.stock[resource]??0)-s.foodStorage.incoming(input.id,resource);if(missing<=0)continue;
      if(s.foodStorage.available(resource)>=missing){if(!this.residents('hauler').length)return {reason:'noHauler',params:{resource}};continue;}
      const source=INPUT_SOURCES[resource];if(!source)return {reason:'noInput',params:{resource}};
      if(!this.hasBuilding(source.building))return {reason:'noProducer',params:{resource,producer:source.building}};
      if(source.field&&!this.hasBuilding(source.field))return {reason:'noField',params:{resource,producer:source.field}};
      if(!s.buildings.some(b=>b.type===source.building&&s.workplaceSystem.employees(b).length))return {reason:'noProducerWorkers',params:{resource,profession:source.profession}};
      // Producers exist and work: the input is on its way (crops growing, a season, a long trip). Not a problem.
    }
    return null;
  }
  detect(){
    const found=this.constructionIssues();
    for(const record of this.scene.foodProduction?.records.values()??[]){const issue=this.productionIssue(record);if(issue)found.push({entityId:record.buildingId,category:'production',...issue});}
    return found;
  }
  update(){
    const time=this.scene.gameTime;if(!time||time.paused||this.scene.gameOver)return;const now=time.totalElapsed;if(now<this.nextCheck)return;this.nextCheck=now+DIAGNOSTICS.checkInterval;
    const seen=new Set();let changed=false;
    for(const found of this.detect()){
      // One current reason per entity: a new reason replaces the old one.
      const key=`${found.entityId}:${found.reason}`;seen.add(key);let issue=this.issues.get(key);
      if(!issue){issue={...found,key,firstSeen:now,lastNotified:null,dismissed:false};this.issues.set(key,issue);}
      issue.params=found.params;
      const due=issue.lastNotified==null?now-issue.firstSeen>=DIAGNOSTICS.persistence:now-issue.lastNotified>=DIAGNOSTICS.reminder;
      if(due){issue.lastNotified=now;issue.dismissed=false;issue.reminders=(issue.reminders??0)+1;this.scene.activities?.emit('productionIssue',{reason:issue.reason,category:issue.category,objectIds:[issue.entityId],params:{...issue.params}});changed=true;}
    }
    for(const key of [...this.issues.keys()])if(!seen.has(key)){const issue=this.issues.get(key);this.issues.delete(key);if(issue.lastNotified!=null)changed=true;}
    if(changed)this.changed();
  }
  // Reported and not dismissed since its last reminder.
  active(){return [...this.issues.values()].filter(issue=>issue.lastNotified!=null&&!issue.dismissed).sort((a,b)=>a.lastNotified-b.lastNotified||a.key.localeCompare(b.key));}
  dismiss(key){const issue=this.issues.get(key);if(issue&&!issue.dismissed){issue.dismissed=true;this.changed();}}
  destroy(){this.listeners.clear();this.issues.clear();}
}
