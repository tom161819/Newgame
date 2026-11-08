import { FOOD_OUTLOOK,foodDays } from '../data/foodOutlook.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { DIAGNOSTICS,INPUT_SOURCES,GATHER_OUTPUTS,DEPLETION_SOURCES,STORAGE_WAIT_MESSAGES,CHAIN_ADVICE,noticeRepeatDays } from '../data/diagnostics.js';
import { chainLinks,isRawSource } from '../data/productionChains.js';
import { DAY_DURATION } from './GameTimeSystem.js';
import { storageResources } from '../data/logistics.js';
import { noticeText } from '../ui/noticeText.js';
import { farmReady } from '../data/farmPlots.js';

// Lasting problems that block work or production, each identified by (entity, reason). A problem is reported once
// it has lasted DIAGNOSTICS.persistence, repeated at most once per NOTICE_REPEAT (game days by severity) while it
// lasts, and dropped as soon as it is gone. A problem that comes back within that time returns quietly to its one row
// (count + 1, no feed line, no new event), so a flickering cause does not pile up lines (request 72). Checked a few
// times per game second from the actual construction, production and storage state, never per unit or per frame.
// Nothing is saved: after Load a problem must last again before it is shown.
const minId=list=>list.reduce((a,b)=>a.id<=b.id?a:b).id;
export class ProductionDiagnostics {
  constructor(scene){this.scene=scene;this.issues=new Map();this.memory=new Map();this.listeners=new Set();this.nextCheck=0;this.revision=0;this.unsubscribe=scene.activities?.on(event=>{if(event.type==='buildingCompleted')this.completed(event.objectIds??[]);});}
  dayMs(){return this.scene.gameTime?.dayDuration??DAY_DURATION;}
  repeatMs(reason){return noticeRepeatDays(reason)*this.dayMs();}
  memoryKey(issue){return `${issue.key}:${issue.params?.resource??''}`;}
  // Chain advice is immediate for a building just completed (structural, independent of stock or staff).
  completed(ids){
    const time=this.scene.gameTime;if(!time)return;const now=time.totalElapsed;let changed=false;
    for(const found of this.chainIssues())if(found.objectIds.some(id=>ids.includes(id)))changed=this.observe(this.track(found,now),found,now,{immediate:true})||changed;
    if(changed)this.changed();
  }
  track(found,now){
    // One current reason per entity: a new reason replaces the old one (chain advice has its own key per chain).
    const key=found.key??`${found.entityId}:${found.reason}`;let issue=this.issues.get(key);
    if(!issue){issue={...found,key,firstSeen:now,lastNotified:null,dismissed:false,count:0};this.issues.set(key,issue);}
    issue.params=found.params;issue.entityId=found.entityId;return issue;
  }
  // True when the panel must render again.
  observe(issue,found,now,{immediate=false}={}){
    if(issue.lastNotified==null){
      if(!immediate&&now-issue.firstSeen<DIAGNOSTICS.persistence)return false;
      const past=this.memory.get(this.memoryKey(issue));
      if(past&&now-past.lastNotified<this.repeatMs(issue.reason)){issue.lastNotified=past.lastNotified;issue.dismissed=past.dismissed;issue.count=past.count+1;return true;}
      return this.notify(issue,found,now);
    }
    // Danger (0 days) is never held back between separate events, but a lasting one is not repeated every check.
    if(now-issue.lastNotified<Math.max(this.repeatMs(issue.reason),DIAGNOSTICS.persistence))return false;
    return this.notify(issue,found,now);
  }
  notify(issue,found,now){
    if(!issue.count&&found.feed)this.scene.eventFeed?.push?.(`notice:${issue.key}:${now}`,noticeText(this.scene,issue));
    issue.lastNotified=now;issue.dismissed=false;issue.count=(issue.count??0)+1;
    this.scene.activities?.emit('productionIssue',{reason:issue.reason,category:issue.category,objectIds:[issue.entityId],params:{...issue.params},...(issue.informational?{informational:true}:{})});return true;
  }
  // Request 70: a missing link of a production chain, from the recipes and crops (productionChains.js) – a consumer
  // whose input nobody makes or plans (a Bakery and no Mill), or a raw output nobody uses (Wheat and no Mill). A
  // workshop's unused output (Flour and no Bakery) only counts once some is in the stores. One notice per chain.
  chainDefinitions(){const r=this.scene.objectRegistry;if(!r?.buildables)return [];if(this.chainCache?.registry!==r){const definitions=r.buildables();this.chainCache={registry:r,definitions,links:chainLinks(definitions,CHAIN_ADVICE.resources)};}return this.chainCache.definitions;}
  // Drops chain advice whose link is no longer missing (also called between checks, e.g. by the browser smoke).
  resolveCompletionNotices(){
    const live=new Set(this.chainIssues().map(found=>found.key));let changed=false;
    for(const [key,issue]of [...this.issues])if(issue.informational&&!live.has(key)){this.forget(key,issue);changed=changed||issue.lastNotified!=null;}
    if(changed)this.changed();
  }
  forget(key,issue){
    this.issues.delete(key);if(issue.lastNotified==null)return false;
    // Remembered for the repeat interval: if it comes back soon it returns to the same row, without a new line.
    this.memory.set(this.memoryKey(issue),{lastNotified:issue.lastNotified,count:issue.count,dismissed:issue.dismissed});return true;
  }
  chainIssues(){
    const s=this.scene,definitions=this.chainDefinitions(),found=[];if(!definitions.length||!s.buildings)return found;
    const complete=type=>s.buildings.filter(b=>b.type===type&&!b.unverified&&!b.demolition&&buildingIsComplete(b));
    const add=(key,list,reason,params)=>found.push({key,entityId:minId(list),objectIds:list.map(b=>b.id),reason,category:'production',params,informational:true});
    for(const link of this.chainCache.links){
      if(!link.producers.some(type=>this.hasPlanned(type)))for(const type of link.consumers){const list=complete(type);if(list.length)add(`chain:${type}:${link.resource}`,list,'missingChainSource',{producer:link.producers[0],resource:link.resource});}
      if(link.edible||link.consumers.some(type=>this.hasPlanned(type)))continue;
      const consumer=definitions.find(d=>d.id===link.consumers[0]),output=consumer?.recipe?Object.keys(consumer.recipe.output)[0]:null;
      for(const type of link.producers){const list=complete(type),d=definitions.find(x=>x.id===type);if(list.length&&(isRawSource(d)||(s.inventory?.count?.(link.resource)??0)>0))add(`chain:${type}:${link.resource}:unused`,list,'chainNoConsumer',{resource:link.resource,consumer:link.consumers[0],output});}
    }
    return found;
  }
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){this.revision++;for(const listener of this.listeners)listener();}
  residents(profession){return this.scene.workerSystem.liveSubjects().filter(w=>w.profession===profession&&(!w.commandState||w.commandState.state==='Working'));}
  hasBuilding(type){return this.scene.buildings.some(b=>b.type===type&&buildingIsComplete(b));}
  // Built, under construction or only drawn as a blueprint: advice to "build X" is pointless once X is planned.
  hasPlanned(type){return this.scene.buildings.some(b=>b.type===type&&!b.demolition);}
  // Builders who can build now: on their job (no Move/Hold order), not striking and not leaving the kingdom. Builders
  // without a Builder's Workshop place count (they only work slower – that has its own notice).
  availableBuilders(){const needs=this.scene.needs?.records;return this.residents('builder').filter(w=>{const r=needs?.get?.(w.id);return !r?.strike&&!r?.leaving;}).length;}
  // Construction: one kingdom notice while any construction waits and no Builder can build it. It no longer waits for
  // the materials: with physical delivery a site never gets its materials when nobody delivers them, so the old
  // check (supplied sites only, C04) never fired in a new game. Fields wait for their Farmer instead.
  constructionIssues(){
    const c=this.scene.constructionSystem;if(!c)return [];
    const found=[],builders=this.availableBuilders(),waiting=[],orphans=[];
    for(const site of c.sites.values()){
      if(site.unverified||site.demolition||site.construction.assignedBuilders.length)continue;
      if(buildingDefinition(site).crop){
        if(!c.materials.ready(site))continue;
        const home=this.scene.buildings.find(b=>b.id===site.farmId);
        // A plot of a planned or unfinished Farmhouse is waiting as intended – its panel says so, Notices stay quiet.
        if(!home)orphans.push(site);else if(farmReady(home)&&!this.residents('farmer').some(w=>w.assignedWorkplaceId===home.id))found.push({entityId:site.id,reason:'noFarmer',category:'construction',params:{}});
      }else{
        waiting.push(site);
        // Materials the stores hold but nobody brings (plan m-e1-stavitele-material).
        const now=this.scene.gameTime.totalElapsed;
        if(c.materials.enabled&&!c.materials.ready(site)&&this.materialsInStock(site)){site.materialWaitSince??=now;if(now-site.materialWaitSince>=DIAGNOSTICS.materialWait)found.push({entityId:site.id,reason:'waitingMaterial',category:'construction',params:{}});}
        else delete site.materialWaitSince;
      }
    }
    // One notice for all plots no Farmhouse (built or planned) has room for, pointing at the first one.
    if(orphans.length){const first=orphans.reduce((a,b)=>a.id<=b.id?a:b);found.push({entityId:first.id,reason:'noFarm',category:'construction',params:{count:orphans.length}});}
    if(!builders&&waiting.length){const first=waiting.reduce((a,b)=>a.id<=b.id?a:b);found.push({entityId:first.id,reason:'noBuilder',category:'construction',params:{count:waiting.length}});}
    return found;
  }
  // True when some material a site still needs is lying in the kingdom's stores, free to take.
  materialsInStock(site){
    const st=this.scene.foodStorage,need=site.materialSupply?.required??{},loc=st?.locations.get(`site-${site.id}`);if(!st)return false;
    // Stock booked for this site at placement still in a store, or free stock of a missing material.
    if([...st.reservations.values()].some(r=>r.owner===`site-${site.id}`&&r.kind!=='capacity'&&r.amount>0))return true;
    return Object.entries(need).some(([resource,n])=>n-(loc?.stock?.[resource]??0)-(loc?st.incoming(loc.id,resource):0)>0&&st.available(resource)>0);
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
      if(!this.hasBuilding(source.building))return this.hasPlanned(source.building)?null:{reason:'noProducer',params:{resource,producer:source.building}};
      if(source.field&&!this.hasBuilding(source.field))return this.hasPlanned(source.field)?null:{reason:'noField',params:{resource,producer:source.field}};
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
    // m-sklady-materialu-koncept (49): a full producer pile with no Hauler to empty it stops the producer.
    if(!this.residents('hauler').length)for(const l of st.locations.values())if(l.kind==='pile'&&st.room(l.id)<=0)found.push({entityId:l.buildingId,reason:'pileNoHauler',category:'production',params:{resource:l.allowed[0]}});
    for(const l of st.locations.values())if(l.kind==='output'||l.kind==='pile')for(const [resource,n]of Object.entries(l.stock))if(n>0){add(pending,resource,null);if(st.room(l.id)<=0)add(blocked,resource,l.buildingId);}
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
  buildingIssue(id){let best=null;for(const issue of this.issues.values())if(issue.entityId===id&&issue.lastNotified!=null&&!issue.informational&&(!best||issue.reason!=='outputFull'))best=issue;return best;}
  // Plan m-e1-jidlo-vydrz: the kingdom's edible stores last less than 3 days (one kingdom notice with the days left).
  foodIssues(){const days=foodDays(this.scene.foodSystem);return days<FOOD_OUTLOOK.warnDays?[{entityId:0,reason:'foodLow',category:'production',params:{days:Math.floor(days)},feed:true}]:[];}
  detect(){
    const found=[...this.constructionIssues(),...this.depletionIssues(),...this.storageIssues(),...this.foodIssues(),...this.chainIssues()];
    for(const record of this.scene.foodProduction?.records.values()??[]){const issue=this.productionIssue(record);if(issue)found.push({entityId:record.buildingId,category:'production',...issue});}
    return found;
  }
  update(){
    const time=this.scene.gameTime;if(!time||time.paused||this.scene.gameOver)return;const now=time.totalElapsed;if(now<this.nextCheck)return;this.nextCheck=now+DIAGNOSTICS.checkInterval;
    const seen=new Set();let changed=false;
    for(const found of this.detect()){const issue=this.track(found,now);seen.add(issue.key);changed=this.observe(issue,found,now)||changed;}
    for(const [key,issue]of [...this.issues])if(!seen.has(key)&&this.forget(key,issue))changed=true;
    const keep=CHAIN_ADVICE.repeatDays*this.dayMs();for(const [key,past]of this.memory)if(now-past.lastNotified>=keep)this.memory.delete(key);
    if(changed)this.changed();
  }
  // Reported and not dismissed since its last reminder.
  // Chain advice gives way to an actual blocker of the same building (one row per building).
  active(){const shown=[...this.issues.values()].filter(issue=>issue.lastNotified!=null&&!issue.dismissed),blocking=new Set(shown.filter(i=>!i.informational).map(i=>i.entityId));return shown.filter(i=>!i.informational||!blocking.has(i.entityId)).sort((a,b)=>a.lastNotified-b.lastNotified||a.key.localeCompare(b.key));}
  dismiss(key){const issue=this.issues.get(key);if(issue&&!issue.dismissed){issue.dismissed=true;this.changed();}}
  destroy(){this.unsubscribe?.();this.listeners.clear();this.issues.clear();this.memory.clear();}
}
