import { NEEDS,DAILY_REST,DISCONTENT,clampNeed,moodFor,happinessOf,mainProblem,attractivenessFor } from '../data/needs.js';
import { POPULATION } from '../data/jobs.js';
import { buildingIsComplete } from '../game/buildings.js';

// S13 (#58) phases A and B: every permanent resident has Food, Rest, Housing and Safety, a weighted Happiness, a mood and a
// main problem. Updated from the central Game Time at most once per second (also off camera and under Fog of War);
// the mood scales work speed and Kingdom Happiness feeds Kingdom Attractiveness (phase C); strikes and emigration follow.
const order=id=>Number(String(id).replace(/\D+/g,''))||0;
export class NeedsSystem {
  constructor(scene,{subscribe=true}={}){
    this.scene=scene;this.records=new Map();this.assignments=new Map();this.pending=0;this.revision=0;this.work=new Map();
    if(subscribe&&scene.gameTime?.onAdvance)this.unsubscribe=scene.gameTime.onAdvance(delta=>this.advance(delta));
    if(subscribe&&scene.gameTime?.onDayClosed)this.unsubscribeDay=scene.gameTime.onDayClosed(()=>this.closeDay());
  }
  residents(){return (this.scene.workerSystem?.liveWorkers()??[]).filter(w=>w.isAlive&&w.isSubject!==false);}
  record(worker){let r=this.records.get(worker.id);if(!r){r={id:worker.id,food:100,rest:100,hp:worker.currentHP,attackedAt:null,lowDays:0,criticalDays:0,strike:false,leaving:false};this.records.set(worker.id,r);}return r;}
  advance(delta){if(!Number.isFinite(delta)||delta<=0)return;this.pending+=delta;if(this.pending<NEEDS.updateMs)return;const step=this.pending;this.pending=0;this.step(step);}
  step(ms){
    const day=this.scene.gameTime?.dayDuration??120000,fraction=ms/day,now=this.scene.gameTime?.totalElapsed??0,live=new Set(),homes=this.homes();
    for(const worker of this.residents()){
      live.add(worker.id);const r=this.record(worker),hungry=!!this.scene.foodSystem?.residents?.get(worker.id)?.hungry;
      r.food=clampNeed(r.food+(hungry?-NEEDS.food.declinePerDay:NEEDS.food.recoverPerDay)*fraction);
      // Phase B: resting at home recovers fastest, in the settlement's base places a little slower, without a home slowly.
      const rate=worker.workState==='Resting'?DAILY_REST.recoverPerDay[homes.get(worker.id)?.kind??'homeless']:NEEDS.activeStates.includes(worker.workState)?-NEEDS.rest.drainPerDay:NEEDS.rest.recoverPerDay;
      r.rest=clampNeed(r.rest+rate*fraction);
      if(Number.isFinite(worker.currentHP)&&worker.currentHP<r.hp)r.attackedAt=now;r.hp=worker.currentHP;
    }
    for(const id of [...this.records.keys()])if(!live.has(id))this.records.delete(id);
    this.revision++;this.refresh();
    // #58 C2: a strike ends as soon as Happiness is back at 45.
    for(const worker of this.residents()){const r=this.records.get(worker.id);if(r?.strike&&this.status(worker,homes).happiness>=DISCONTENT.strikeEndsAt){r.strike=false;r.lowDays=0;this.scene.eventFeed?.push(`strike-end:${worker.id}:${now}`,`${worker.name}: back to work after the strike.`);}}
  }
  // #58 C2, at the end of each day: count whole days of low Happiness; start strikes and emigration.
  closeDay(){
    let changed=false;const homes=this.homes();
    for(const worker of this.residents()){
      const r=this.record(worker),h=this.status(worker,homes).happiness;
      r.lowDays=h<DISCONTENT.strikeBelow?r.lowDays+1:0;r.criticalDays=h<DISCONTENT.emigrateBelow?r.criticalDays+1:0;
      if(!r.strike&&!r.leaving&&r.lowDays>=DISCONTENT.strikeDays){r.strike=true;changed=true;this.scene.eventFeed?.push(`strike:${worker.id}:${this.scene.gameTime?.day}`,`${worker.name} is on strike: Happiness has been below ${DISCONTENT.strikeBelow} for ${DISCONTENT.strikeDays} days.`,{important:true});}
      if(!r.leaving&&r.criticalDays>=DISCONTENT.emigrateDays){r.leaving=true;r.strike=false;changed=true;this.scene.eventFeed?.push(`leaving:${worker.id}`,`${worker.name} is leaving the kingdom.`,{important:true});}
    }
    if(changed){this.revision++;this.refresh();}
  }
  // Phase C: derived once per update, never saved: the mood's work factor per resident and Kingdom Happiness in attractiveness.
  refresh(){const homes=this.homes(),list=[];this.work=new Map();for(const w of this.residents()){const s=this.status(w,homes);if(!s)continue;this.work.set(w.id,s.workModifier);list.push(s.happiness);}
    const happiness=list.length?Math.round(list.reduce((n,v)=>n+v,0)/list.length):null;this.scene.attractiveness?.modifiers?.set('happiness',attractivenessFor(happiness));}
  workModifier(worker){return this.work.get(worker?.id)??1;}
  // #58 phase B: stored home assignments. A resident keeps a valid home. Residents in the settlement's base places move
  // into free House seats (oldest first); everyone else gets a free House seat, then a free base place, otherwise no home.
  // Deterministic and idempotent, so it may run on every update, before saving and after loading.
  homes(){
    const registry=this.scene.objectRegistry,residents=this.residents().sort((a,b)=>order(a.id)-order(b.id));
    const houses=(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&registry?.get?.(b.type)?.housing).sort((a,b)=>a.id-b.id);
    const capacity=new Map(houses.map(h=>[h.id,registry.get(h.type).housing.capacity??POPULATION.houseCapacity])),used=new Map(),next=new Map();
    const take=id=>used.set(id,(used.get(id)??0)+1),free=()=>houses.find(h=>(used.get(h.id)??0)<capacity.get(h.id));let base=0;
    for(const w of residents){const a=this.assignments.get(w.id);if(!a)continue;
      if(a.kind==='house'&&capacity.has(a.buildingId)&&(used.get(a.buildingId)??0)<capacity.get(a.buildingId)){take(a.buildingId);next.set(w.id,{kind:'house',buildingId:a.buildingId});}
      else if(a.kind==='settlement'&&base<POPULATION.maximum){base++;next.set(w.id,{kind:'settlement'});}
    }
    for(const w of residents){const a=next.get(w.id);if(a?.kind==='house')continue;const house=free();
      if(house){if(a)base--;take(house.id);next.set(w.id,{kind:'house',buildingId:house.id});}
      else if(!a&&base<POPULATION.maximum){base++;next.set(w.id,{kind:'settlement'});}
    }
    this.assignments=next;return new Map([...next].map(([id,a])=>[id,{...a}]));
  }
  homeOf(worker){return this.homes().get(worker?.id)??null;}
  // Safety and the reasons behind it (shown as the tooltip of the Safety bar).
  safetyDetail(worker,record){
    const s=NEEDS.safety,p=worker.position??{x:worker.tile?.x??0,y:worker.tile?.y??0},near=(b,range)=>{const d=b.definition??this.scene.objectRegistry?.get?.(b.type)??{width:1,height:1};return Math.hypot(b.x+d.width/2-p.x,b.y+d.height/2-p.y)<=range;};
    const done=(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)),factors=[['base',s.base]];
    if(done.some(b=>b.type==='castle'&&near(b,s.castle.range)))factors.push(['castle',s.castle.bonus]);
    if(done.some(b=>b.type==='tower'&&near(b,s.tower.range)))factors.push(['tower',s.tower.bonus]);
    if(done.some(b=>b.type==='barracks'&&near(b,s.guard.range))||this.residents().some(o=>o!==worker&&o.profession==='soldier'&&Math.hypot(o.position.x-p.x,o.position.y-p.y)<=s.guard.range))factors.push(['guard',s.guard.bonus]);
    if(record?.attackedAt!=null){const day=this.scene.gameTime?.dayDuration??120000,age=(this.scene.gameTime?.totalElapsed??0)-record.attackedAt,left=1-age/(s.attack.days*day);if(left>0)factors.push(['attack',-Math.round(s.attack.penalty*left)]);}
    return {value:Math.round(clampNeed(factors.reduce((n,[,v])=>n+v,0))),factors};
  }
  safety(worker,record){return this.safetyDetail(worker,record).value;}
  unpaidPenalty(worker){const gold=this.scene.wageSystem?.unpaid?.(worker)??0;return Math.min(NEEDS.unpaid.max,Math.round(gold*NEEDS.unpaid.perGold));}
  // Everything shown for one resident, derived from the stored state (never from the frame rate).
  status(worker,homes=this.homes()){
    // Only permanent residents: the King keeps his own HP and meals, visitors have no needs.
    if(!worker?.isAlive||worker.isSubject===false||this.scene.workerSystem?.workers.get(worker.id)!==worker)return null;
    const r=this.records.get(worker.id)??{food:100,rest:100,attackedAt:null},home=homes.get(worker.id)??null,safety=this.safetyDetail(worker,r),needs={food:Math.round(r.food),rest:Math.round(r.rest),housing:home?100:0,safety:safety.value};
    // #103: taxes and rations move Happiness (bonus or penalty), kept apart from the unpaid-wage penalty.
    const penalty=this.unpaidPenalty(worker),policy=this.scene.policy?.happiness?.()??0,happiness=happinessOf(needs,penalty-policy),mood=moodFor(happiness);
    return {...needs,safetyFactors:safety.factors,happiness,mood:mood.id,workModifier:mood.work,unpaidPenalty:penalty,policy,policyTarget:this.scene.policy?.target?.()??0,strike:!!r.strike,leaving:!!r.leaving,lowDays:r.lowDays??0,criticalDays:r.criticalDays??0,mainProblem:mainProblem(needs,penalty),home,hungry:needs.food<NEEDS.food.low,tired:needs.rest<NEEDS.rest.low,homeless:!home};
  }
  summary(){
    const homes=this.homes(),list=this.residents().map(w=>this.status(w,homes));
    if(!list.length)return {population:0,happiness:null,hungry:0,tired:0,homeless:0,striking:0,leaving:0,atRisk:0};
    return {population:list.length,happiness:Math.round(list.reduce((n,s)=>n+s.happiness,0)/list.length),hungry:list.filter(s=>s.hungry).length,tired:list.filter(s=>s.tired).length,homeless:list.filter(s=>s.homeless).length,striking:list.filter(s=>s.strike).length,leaving:list.filter(s=>s.leaving).length,atRisk:list.filter(s=>s.mood==='critical'||s.criticalDays>0).length};
  }
  get kingdomHappiness(){return this.summary().happiness;}
  // Only living residents are saved: a record of someone who died or left since the last update is dropped here.
  exportState(){const live=new Set(this.residents().map(w=>w.id)),homes=this.homes();return {pending:this.pending,
    homes:[...homes].sort(([a],[b])=>order(a)-order(b)).map(([id,h])=>({id,kind:h.kind,...(h.kind==='house'?{buildingId:h.buildingId}:{})})),records:[...this.records.values()].filter(r=>live.has(r.id)).sort((a,b)=>order(a.id)-order(b.id)).map(r=>({id:r.id,food:r.food,rest:r.rest,hp:r.hp,attackedAt:r.attackedAt,lowDays:r.lowDays??0,criticalDays:r.criticalDays??0,strike:!!r.strike,leaving:!!r.leaving}))};}
  importState(data){this.pending=data?.pending??0;this.records=new Map((data?.records??[]).map(r=>[r.id,{...r}]));
    this.assignments=new Map((data?.homes??[]).map(h=>[h.id,h.kind==='house'?{kind:'house',buildingId:h.buildingId}:{kind:'settlement'}]));this.revision++;this.refresh();}
  destroy(){this.unsubscribe?.();this.unsubscribeDay?.();this.records.clear();this.assignments.clear();this.work.clear();this.scene.attractiveness?.modifiers?.delete('happiness');}
}
