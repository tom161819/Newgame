import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { DIAGNOSTICS,INPUT_SOURCES,COMPLETION_SOURCES } from '../data/diagnostics.js';

// Lasting problems that block work or production, each identified by (entity, reason). A problem is reported once
// it has lasted DIAGNOSTICS.persistence, repeated at most every DIAGNOSTICS.reminder while it lasts, and dropped as
// soon as it is gone. Checked a few times per game second from the actual construction, production and storage
// state, never per unit or per frame. Nothing is saved: after Load a problem must last again before it is shown.
export class ProductionDiagnostics {
  constructor(scene){this.scene=scene;this.issues=new Map();this.listeners=new Set();this.nextCheck=0;this.revision=0;this.completionNotices=new Map();this.unsubscribe=scene.activities?.on(event=>{if(event.type==='buildingCompleted')this.completed(event.objectIds??[]);});}
  completed(ids){
    for(const id of ids){
      const building=this.scene.buildings.find(b=>b.id===id),producer=building&&COMPLETION_SOURCES[building.type];
      if(!producer||!buildingIsComplete(building)||this.hasBuilding(producer))continue;
      // One piece of advice per missing link, even when several workers or
      // several new buildings complete the same chain.
      const key=`chain:${building.type}:${producer}`;if(this.completionNotices.has(key))continue;
      const issue={key,entityId:id,reason:'missingChainSource',category:'production',params:{producer},lastNotified:this.scene.gameTime.totalElapsed,dismissed:false,informational:true};
      this.completionNotices.set(key,issue);this.scene.activities?.emit('productionIssue',{reason:issue.reason,category:issue.category,objectIds:[id],params:{producer},informational:true});this.changed();
    }
    this.resolveCompletionNotices();
  }
  resolveCompletionNotices(){
    let changed=false;for(const [key,issue]of this.completionNotices){
      if(this.hasBuilding(issue.params.producer)||!this.scene.buildings.some(b=>b.id===issue.entityId&&buildingIsComplete(b))){this.completionNotices.delete(key);changed=true;}
    }if(changed)this.changed();
  }
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){this.revision++;for(const listener of this.listeners)listener();}
  residents(profession){return this.scene.workerSystem.liveSubjects().filter(w=>w.profession===profession&&(!w.commandState||w.commandState.state==='Working'));}
  hasBuilding(type){return this.scene.buildings.some(b=>b.type===type&&buildingIsComplete(b));}
  // Construction: a supplied site nobody can build, because the kingdom has no Builder.
  constructionIssues(){
    const c=this.scene.constructionSystem;if(!c)return [];
    const found=[],builders=this.residents('builder').length;
    for(const site of c.sites.values()){
      if(site.unverified||!c.materials.ready(site)||site.construction.assignedBuilders.length)continue;
      if(buildingDefinition(site).crop){
        const home=this.scene.buildings.find(b=>b.id===site.farmId),farmers=home&&this.residents('farmer').some(w=>w.assignedWorkplaceId===home.id);
        if(!home||!farmers)found.push({entityId:site.id,reason:home?'noFarmer':'noFarm',category:'construction',params:{}});
      }else if(!builders)found.push({entityId:site.id,reason:'noBuilder',category:'construction',params:{}});
    }
    return found;
  }
  // Production: a staffed building switched on that lacks an input, with the nearest cause that can be checked.
  // Intentionally paused production, unstaffed buildings and inputs on their way or still growing are not problems.
  productionIssue(record){
    const s=this.scene,building=s.buildings.find(b=>b.id===record.buildingId);if(!building||!record.auto||record.cycle||!buildingIsComplete(building))return null;
    const recipe=buildingDefinition(building).recipe&&s.foodProduction?.recipe(building);if(!recipe||!s.workplaceSystem.employees(building).some(w=>!w.commandState||w.commandState.state==='Working'))return null;
    const input=s.foodStorage.locations.get(`input-${building.id}`);if(!input)return null;
    for(const [resource,need]of Object.entries(recipe.input)){
      const missing=need-(input.stock[resource]??0)-s.foodStorage.incoming(input.id,resource);if(missing<=0)continue;
      if(s.foodStorage.available(resource)>=missing){if(!this.residents('hauler').length)return {reason:'noHauler',params:{resource}};continue;}
      const source=INPUT_SOURCES[resource];if(!source)return {reason:'noInput',params:{resource}};
      if(!this.hasBuilding(source.building))return {reason:'noProducer',params:{resource,producer:source.building}};
      if(source.field&&!this.hasBuilding(source.field))return {reason:'noField',params:{resource,producer:source.field}};
      if(!s.buildings.some(b=>b.type===source.building&&s.workplaceSystem.employees(b).some(w=>!w.commandState||w.commandState.state==='Working')))return {reason:'noProducerWorkers',params:{resource,profession:source.profession}};
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
    this.resolveCompletionNotices();const seen=new Set();let changed=false;
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
  active(){const blocking=[...this.issues.values()].filter(issue=>issue.lastNotified!=null&&!issue.dismissed),entities=new Set(blocking.map(i=>i.entityId));return [...blocking,...[...this.completionNotices.values()].filter(i=>!i.dismissed&&!entities.has(i.entityId))].sort((a,b)=>a.lastNotified-b.lastNotified||a.key.localeCompare(b.key));}
  dismiss(key){const issue=this.issues.get(key)??this.completionNotices.get(key);if(issue&&!issue.dismissed){issue.dismissed=true;this.changed();}}
  destroy(){this.unsubscribe?.();this.listeners.clear();this.issues.clear();this.completionNotices.clear();}
}
