import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { DIAGNOSTICS,INPUT_SOURCES,COMPLETION_SOURCES,GATHER_OUTPUTS,DEPLETION_SOURCES,STORAGE_WAIT_MESSAGES } from '../data/diagnostics.js';
import { storageResources } from '../data/logistics.js';
import { noticeText } from '../ui/noticeText.js';

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
  // Builders who can build now: on their job (no Move/Hold order), not striking and not leaving the kingdom. Builders
  // without a Builder's Workshop place count (they only work slower – that has its own notice).
  availableBuilders(){const needs=this.scene.needs?.records;return this.residents('builder').filter(w=>{const r=needs?.get?.(w.id);return !r?.strike&&!r?.leaving;}).length;}
  // Construction: one kingdom notice while any construction waits and no Builder can build it. It no longer waits for
  // the materials: with physical delivery a site never gets its materials when nobody delivers them, so the old
  // check (supplied sites only, C04) never fired in a new game. Fields wait for their Farmer instead.
  constructionIssues(){
    const c=this.scene.constructionSystem;if(!c)return [];
    const found=[],builders=this.availableBuilders(),waiting=[];
    for(const site of c.sites.values()){
      if(site.unverified||site.demolition||site.construction.assignedBuilders.length)continue;
      if(buildingDefinition(site).crop){
        if(!c.materials.ready(site))continue;
        const home=this.scene.buildings.find(b=>b.id===site.farmId),farmers=home&&this.residents('farmer').some(w=>w.assignedWorkplaceId===home.id);
        if(!home||!farmers)found.push({entityId:site.id,reason:home?'noFarmer':'noFarm',category:'construction',params:{}});
      }else waiting.push(site);
    }
    if(!builders&&waiting.length){const first=waiting.reduce((a,b)=>a.id<=b.id?a:b);found.push({entityId:first.id,reason:'noBuilder',category:'construction',params:{count:waiting.length}});}
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
  // Owner points 14–15: a quarry, mine or lumberjack hut with nothing left to take in range. Quarries and mines are
  // bound to one finite deposit; a lumberjack hut counts every tree (also young ones) in its working radius, so it is
  // only "out of wood" when nothing will grow back there. Gone as soon as something appears again or the building goes.
  depletionIssues(){
    const s=this.scene,natural=s.naturalResources,found=[];if(!natural&&!s.fishing)return found;
    for(const b of s.buildings){
      if(!natural||!buildingIsComplete(b)||b.unverified||!DEPLETION_SOURCES[b.type])continue;let empty=false;
      if(b.type==='lumberjack_hut'){const c={x:b.x+.5,y:b.y+.5},r=buildingDefinition(b).workRadius??0;empty=![...natural.byId.values()].some(t=>t.definition?.tree&&Math.hypot(t.x-c.x,t.y-c.y)<=r);}
      else if(b.quarryMode!=='legacy'&&b.quarryMode!=='unbound'){const d=b.depositId!=null?natural.byId.get(b.depositId):null;empty=!!d&&d.natural.remaining===0;}
      if(empty)found.push({entityId:b.id,reason:'depleted',category:'production',params:{resource:GATHER_OUTPUTS[b.type],source:DEPLETION_SOURCES[b.type]},feed:true});
    }
    // A Fisherman's Hut may stand anywhere (0.32.0): one with no reachable shore at all has nothing to do.
    for(const b of s.buildings)if(b.type==='fisherman_hut'&&buildingIsComplete(b)&&!b.unverified&&s.fishing&&!s.fishing.spots(b).length)found.push({entityId:b.id,reason:'noWater',category:'production',params:{}});
    return found;
  }
  // Goods that want a store: in production output buffers, or held by residents who wait for storage room.
  storageHelper(resource){const r=this.scene.objectRegistry;return r?.buildables?.().find(d=>d.storage&&!d.starter&&storageResources(d,r).includes(resource))?.id??null;}
  hasRoom(resource){const st=this.scene.foodStorage;if(!st)return true;for(const l of st.locations.values())if(st.isStock(l)&&l.allowed.includes(resource)&&st.room(l.id,resource)>0)return true;return false;}
  storageIssues(){
    const s=this.scene,st=s.foodStorage;if(!st||!st.physicalMaterials&&!s.constructionSystem?.materials?.enabled)return [];
    const found=[],pending=new Map(),blocked=new Map(),add=(map,resource,id)=>{if(!map.has(resource))map.set(resource,new Set());if(id!=null)map.get(resource).add(id);};
    for(const l of st.locations.values())if(l.kind==='output')for(const [resource,n]of Object.entries(l.stock))if(n>0){add(pending,resource,null);if(st.room(l.id)<=0)add(blocked,resource,l.buildingId);}
    for(const w of s.workerSystem?.liveSubjects?.()??[]){
      if(!STORAGE_WAIT_MESSAGES.includes(w.workMessage))continue;const b=s.buildings.find(x=>x.id===w.assignedWorkplaceId),resource=w.cargo?.resource??GATHER_OUTPUTS[b?.type];
      if(resource){add(pending,resource,null);add(blocked,resource,b?.id??null);}
    }
    const full=[...pending.keys()].filter(resource=>!this.hasRoom(resource)).sort();if(!full.length)return found;
    const groups=new Map();for(const resource of full){const helper=this.storageHelper(resource)??'warehouse';if(!groups.has(helper))groups.set(helper,[]);groups.get(helper).push(resource);}
    found.push({entityId:0,reason:'storageFull',category:'production',params:{groups:[...groups].map(([helper,resources])=>({helper,resources}))},feed:true});
    const stuck=new Set();for(const resource of full)for(const id of blocked.get(resource)??[])stuck.add(id);
    for(const id of stuck)found.push({entityId:id,reason:'outputFull',category:'production',params:{}});
    return found;
  }
  // The current issue of one building (for its panel and the icon over it), most important first.
  buildingIssue(id){let best=null;for(const issue of this.issues.values())if(issue.entityId===id&&issue.lastNotified!=null&&(!best||issue.reason!=='outputFull'))best=issue;return best;}
  detect(){
    const found=[...this.constructionIssues(),...this.depletionIssues(),...this.storageIssues()];
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
      if(due){if(issue.lastNotified==null&&found.feed)this.scene.eventFeed?.push?.(`notice:${key}:${issue.firstSeen}`,noticeText(this.scene,issue));issue.lastNotified=now;issue.dismissed=false;issue.reminders=(issue.reminders??0)+1;this.scene.activities?.emit('productionIssue',{reason:issue.reason,category:issue.category,objectIds:[issue.entityId],params:{...issue.params}});changed=true;}
    }
    for(const key of [...this.issues.keys()])if(!seen.has(key)){const issue=this.issues.get(key);this.issues.delete(key);if(issue.lastNotified!=null)changed=true;}
    if(changed)this.changed();
  }
  // Reported and not dismissed since its last reminder.
  active(){const blocking=[...this.issues.values()].filter(issue=>issue.lastNotified!=null&&!issue.dismissed),entities=new Set(blocking.map(i=>i.entityId));return [...blocking,...[...this.completionNotices.values()].filter(i=>!i.dismissed&&!entities.has(i.entityId))].sort((a,b)=>a.lastNotified-b.lastNotified||a.key.localeCompare(b.key));}
  dismiss(key){const issue=this.issues.get(key)??this.completionNotices.get(key);if(issue&&!issue.dismissed){issue.dismissed=true;this.changed();}}
  destroy(){this.unsubscribe?.();this.listeners.clear();this.issues.clear();this.completionNotices.clear();}
}
