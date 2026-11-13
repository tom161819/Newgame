import { HEATING,HEATED,HEATED_BUILDINGS } from '../data/heating.js';
import { calendar,SEASON_DAYS } from '../data/seasons.js';
import { buildingIsComplete, definitionFor } from '../game/buildings.js';
import { t } from '../i18n/index.js';

// m-topeni-domu (plan 37): winter heating of Houses. Every House has a woodpile (`heat-<id>`, kind 'fuel'); Haulers
// fill it in autumn and winter. At the start of each day an occupied House burns its day's Wood: then it is warm for
// the day (Happiness bonus), otherwise cold (penalty, its residents rest as if sleeping in the settlement).
// Saved: which Houses are warm and which cold today, and the switch.
export class HeatingSystem {
  constructor(scene,settings=scene.gameSettings){
    this.scene=scene;this.enabled=settings?.winterHeating!==false;this.status=new Map();this.day=null;this.warned=null;this.listeners=new Set();
    this.unsubscribe=scene.gameTime?.onNewDay?.(day=>this.newDay(day));
  }
  get storage(){return this.scene.foodStorage;}
  onChange(l){this.listeners.add(l);return()=>this.listeners.delete(l);}
  changed(){for(const l of this.listeners)l();}
  setEnabled(value){this.enabled=!!value;if(!this.enabled)this.status.clear();this.changed();}
  // Heating runs only with seasons and the physical stores (older worlds without them have no woodpiles).
  active(){return this.enabled&&this.scene.seasons?.enabled!==false&&!!this.storage?.physicalMaterials;}
  season(day=this.scene.gameTime?.day??1){return calendar(day).season;}
  houses(){return (this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&HEATED_BUILDINGS.includes(b.type));}
  locationId(building){return `heat-${building.id}`;}
  // The woodpile is created when it is first needed (a House that is never heated has none).
  ensurePile(b){
    const id=this.locationId(b),storage=this.storage;if(storage.locations.has(id))return;const d=definitionFor(b,this.scene.objectRegistry);
    storage.locations.set(id,{buildingId:b.id,x:b.x,y:b.y,width:d.width,height:d.height,stock:{},legacyOverflow:0,id,kind:'fuel',capacity:HEATING.capacity,allowed:[HEATING.resource]});storage.changed();
  }
  stock(building){return this.storage?.locations.get(this.locationId(building))?.stock[HEATING.resource]??0;}
  // Wood one House burns on `day` (0 outside autumn and winter).
  need(day=this.scene.gameTime?.day??1,weather=this.scene.seasons?.weather){
    const base=HEATING.perDay[this.season(day)]??0;return base?Math.ceil(base*(HEATING.weather[weather]??1)):0;
  }
  // Who uses each heated building today: residents of a House, the Castle always (the King's seat), soldiers of a Barracks.
  occupied(){
    const out=new Map();for(const h of this.scene.needs?.homes?.()?.values?.()??[])if(h.kind==='house')out.set(h.buildingId,(out.get(h.buildingId)??0)+1);
    for(const b of this.houses()){if(b.type==='castle')out.set(b.id,1);
      if(b.type==='barracks'){const n=(this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.profession==='soldier'&&w.assignedWorkplaceId===b.id).length;if(n)out.set(b.id,n);}}
    return out;
  }
  dayNeed(building,need){return Math.ceil(need*(HEATED[building.type]?.factor??1));}
  newDay(day){
    this.day=day;this.status.clear();
    if(!this.active()){this.changed();return;}
    const need=this.need(day),people=this.occupied(),cold=[];
    if(need>0)for(const b of this.houses()){
      if(!people.get(b.id))continue;const id=this.locationId(b),burn=this.dayNeed(b,need);this.ensurePile(b);
      if(this.stock(b)>=burn&&this.storage.withdraw(id,HEATING.resource,burn)!==false){this.status.set(b.id,'warm');this.scene.resourceLedger?.expense(HEATING.resource,burn,'Heating',{id:`heat:${b.id}:${day}`,entityId:b.id});}
      else{this.status.set(b.id,'cold');cold.push(b);}
    }
    this.notify(day,cold);this.changed();
  }
  notify(day,cold){
    const feed=this.scene.eventFeed,season=this.season(day);if(!feed?.push)return;
    if(cold.length&&season==='Winter')feed.push(`heating-cold-${day}`,t('heating.coldHouses',{count:cold.length}),{target:cold[0]});
    // Once at the start of autumn: the stores hold less Wood than the coming winter needs.
    if(season==='Autumn'&&calendar(day).dayInSeason===1&&this.warned!==day){
      const {stored,needed}=this.winterEstimate();if(needed>0&&stored<needed*HEATING.warnShare){this.warned=day;feed.push(`heating-short-${day}`,t('heating.shortForWinter',{stored,needed}),{important:true});}
    }
  }
  // Wood in the stores and woodpiles against what autumn's rest and the winter will burn in the occupied Houses.
  winterEstimate(){
    const used=this.occupied(),houses=used.size,factors=[...used.keys()].reduce((n,id)=>n+(HEATED[this.houses().find(b=>b.id===id)?.type]?.factor??1),0),day=this.scene.gameTime?.day??1,info=calendar(day);
    const autumnLeft=info.season==='Autumn'?SEASON_DAYS-info.dayInSeason+1:0,winterLeft=info.season==='Winter'?SEASON_DAYS-info.dayInSeason+1:info.season==='Autumn'?SEASON_DAYS:0;
    const needed=factors*(autumnLeft*(HEATING.perDay.Autumn??0)+winterLeft*(HEATING.perDay.Winter??0)),inPiles=this.houses().reduce((n,b)=>n+this.stock(b),0);
    let stored=0;try{stored=this.storage?.available?.(HEATING.resource)??0;}catch{}
    return {houses,needed,stored:Math.floor(stored+inPiles)};
  }
  // Happiness for a resident of `house` today (0 when nothing applies).
  happiness(house){
    const state=house&&this.status.get(house.id);if(!state)return 0;const f=HEATING.seasonEffect[this.season(this.day??undefined)]??0;
    return Math.round((state==='warm'?HEATING.warmBonus:-HEATING.coldPenalty)*f);
  }
  // Residents sleeping in the settlement's base places feel the Castle; soldiers of a cold Barracks fight weaker.
  castle(){return this.houses().find(b=>b.type==='castle')??null;}
  combatFactor(unit){
    if(unit?.profession!=='soldier'||unit.assignedWorkplaceId==null)return 1;return this.status.get(unit.assignedWorkplaceId)==='cold'?HEATING.coldCombat:1;
  }
  isCold(house){return !!house&&this.status.get(house.id)==='cold';}
  isWarm(house){return !!house&&this.status.get(house.id)==='warm';}
  // A resident who waits (no input, nothing to do) carries Wood home himself when his woodpile runs low: heating does
  // not depend on free Haulers alone. Checked every few seconds per resident.
  help(worker){
    if(!worker?.isAlive||worker.isSubject===false||worker.workTask||worker.cargo||worker.restPhase||!['Waiting','Idle'].includes(worker.workState)||(worker.commandState&&worker.commandState.state!=='Working'))return;
    if(!this.active()||!HEATING.fillSeasons.includes(this.season()))return;const now=this.scene.gameTime?.totalElapsed??0;if((worker.heatCheckAt??-Infinity)>now)return;worker.heatCheckAt=now+HEATING.selfFetchCheckMs;
    const home=this.scene.needs?.homes?.()?.get(worker.id);if(home?.kind!=='house')return;const house=this.houses().find(b=>b.id===home.buildingId);if(!house)return;
    this.ensurePile(house);const id=this.locationId(house);if(this.stock(house)+this.storage.incoming(id,HEATING.resource)>=HEATING.selfFetchBelow)return;
    const logistics=this.scene.logisticsTasks;if(!logistics)return;const before={state:worker.workState,message:worker.workMessage,cooldown:worker.aiCooldown};worker.aiCooldown=0;
    if(!logistics.updateWorker(worker,{heatFor:id})){worker.workState=before.state;worker.workMessage=before.message;worker.aiCooldown=before.cooldown;}
  }
  // Haulers' list: in autumn and winter fill every House's woodpile to its size.
  candidates(){
    if(!this.active()||!HEATING.fillSeasons.includes(this.season()))return [];
    const storage=this.storage,stores=[...storage.locations.values()].filter(l=>storage.isStock(l)&&storage.free(l.id,HEATING.resource)>0),out=[];if(!stores.length)return out;
    for(const b of this.houses()){
      const id=this.locationId(b);this.ensurePile(b);
      const missing=HEATING.capacity-this.stock(b)-storage.incoming(id,HEATING.resource);if(missing<=0)continue;
      for(const source of stores)out.push({priority:HEATING.refillPriority,sourceId:source.id,destinationId:id,resource:HEATING.resource,amount:missing,heating:true});
    }
    return out;
  }
  exportState(){
    const pick=v=>[...this.status].filter(([,s])=>s===v).map(([id])=>id).sort((a,b)=>a-b);
    return {enabled:this.enabled,day:this.day,warm:pick('warm'),cold:pick('cold'),...(this.warned!=null?{warned:this.warned}:{})};
  }
  importState(data){
    if(!data)return;this.enabled=data.enabled!==false;this.day=data.day??null;this.warned=data.warned??null;
    this.status=new Map([...(data.warm??[]).map(id=>[id,'warm']),...(data.cold??[]).map(id=>[id,'cold'])]);this.changed();
  }
  destroy(){this.unsubscribe?.();this.listeners.clear();}
}
export function validHeatingState(data,buildingIds){
  const ids=v=>Array.isArray(v)&&v.every(id=>Number.isSafeInteger(id)&&buildingIds.has(id));
  return !!data&&typeof data==='object'&&typeof data.enabled==='boolean'&&(data.day===null||Number.isSafeInteger(data.day))&&ids(data.warm)&&ids(data.cold)&&!data.warm.some(id=>data.cold.includes(id))
    &&(data.warned===undefined||Number.isSafeInteger(data.warned))&&Object.keys(data).every(k=>['enabled','day','warm','cold','warned'].includes(k));
}
