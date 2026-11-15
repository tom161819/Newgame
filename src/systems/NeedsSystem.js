import { castleLevel,castleRules } from '../data/castle.js';
import { enclosure,ENCLOSURE } from '../game/enclosure.js';
import { HEATING } from '../data/heating.js';
import { TORCHES } from '../data/torches.js';
import { CATS ,HOUSE_RATS} from '../data/domesticAnimals.js';
import { NEEDS,DAILY_REST,DISCONTENT,clampNeed,moodFor,happinessOf,mainProblem,attractivenessFor,starvingPenalty } from '../data/needs.js';
import { foodNeedTarget } from '../data/policy.js';
import { POPULATION } from '../data/jobs.js';
import { buildingIsComplete } from '../game/buildings.js';

// S13 (#58) phases A and B: every permanent resident has Food, Rest, Housing and Safety, a weighted Happiness, a mood and a
// main problem. Updated from the central Game Time at most once per second (also off camera and under Fog of War);
// the mood scales work speed and Kingdom Happiness feeds Kingdom Attractiveness (phase C); strikes and emigration follow.
const orders=new Map(),order=id=>{let v=orders.get(id);if(v===undefined){v=Number(String(id).replace(/\D+/g,''))||0;if(orders.size>5000)orders.clear();orders.set(id,v);}return v;};
// Soldiers at home per the soldiers the residents want (1 per NEEDS.safety.garrison.perResidents).
export function garrisonRatio(people){
  const residents=people.filter(w=>w.profession!=='soldier').length,home=people.filter(w=>w.profession==='soldier'&&!w.away).length,wanted=Math.ceil(residents/NEEDS.safety.garrison.perResidents);
  return {residents,home,wanted,ratio:wanted?Math.min(1,home/wanted):1};
}
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
      live.add(worker.id);const r=this.record(worker),target=this.foodDetail(worker).target;
      // #68: the Food need moves towards its target (rations + variety, 0 when hungry) at the usual rates, never jumps.
      r.unfedDays=this.scene.foodSystem?.residents?.get(worker.id)?.hungry?(r.unfedDays??0)+fraction:0;
      r.food=r.food>target?Math.max(target,r.food-NEEDS.food.declinePerDay*fraction):Math.min(target,r.food+NEEDS.food.recoverPerDay*fraction);
      // Phase B: resting at home recovers fastest, in the settlement's base places a little slower, without a home slowly.
      const home=homes.get(worker.id),coldHome=home?.kind==='house'&&this.scene.heating?.isCold?.({id:home.buildingId}),rate=worker.workState==='Resting'?DAILY_REST.recoverPerDay[coldHome?HEATING.coldRestAs:home?.kind??'homeless']:NEEDS.activeStates.includes(worker.workState)?-NEEDS.rest.drainPerDay:NEEDS.rest.recoverPerDay;
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
  // performance-2: the homes follow from the residents, the finished houses and the last assignments only. Asked many
  // times a step (every resting resident, every status), the answer is kept until one of those changes. Callers only
  // read the returned map.
  homes(){
    const registry=this.scene.objectRegistry,residents=this.residents();
    const houses=(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&registry?.get?.(b.type)?.housing);
    const capacity=new Map(houses.map(h=>[h.id,registry.get(h.type).housing.capacity??POPULATION.houseCapacity])),used=new Map(),next=new Map();
    let key='';for(const w of residents)key+=`${w.id},`;key+='|';for(const h of houses)key+=`${h.id}:${capacity.get(h.id)},`;
    if(this.homesCache?.key===key&&this.homesCache.assignments===this.assignments)return this.homesCache.map;
    residents.sort((a,b)=>order(a.id)-order(b.id));houses.sort((a,b)=>a.id-b.id);
    const take=id=>used.set(id,(used.get(id)??0)+1),free=()=>houses.find(h=>(used.get(h.id)??0)<capacity.get(h.id));let base=0;
    for(const w of residents){const a=this.assignments.get(w.id);if(!a)continue;
      if(a.kind==='house'&&capacity.has(a.buildingId)&&(used.get(a.buildingId)??0)<capacity.get(a.buildingId)){take(a.buildingId);next.set(w.id,{kind:'house',buildingId:a.buildingId});}
      else if(a.kind==='settlement'&&base<POPULATION.maximum){base++;next.set(w.id,{kind:'settlement'});}
    }
    for(const w of residents){const a=next.get(w.id);if(a?.kind==='house')continue;const house=free();
      if(house){if(a)base--;take(house.id);next.set(w.id,{kind:'house',buildingId:house.id});}
      else if(!a&&base<POPULATION.maximum){base++;next.set(w.id,{kind:'settlement'});}
    }
    this.assignments=next;const map=new Map([...next].map(([id,a])=>[id,{...a}]));this.homesCache={key,assignments:next,map};return map;
  }
  homeOf(worker){return this.homes().get(worker?.id)??null;}
  // Safety and the reasons behind it (shown as the tooltip of the Safety bar).
  safetyDetail(worker,record,home){
    const s=NEEDS.safety,p=worker.position??{x:worker.tile?.x??0,y:worker.tile?.y??0},near=(b,range)=>{const d=b.definition??this.scene.objectRegistry?.get?.(b.type)??{width:1,height:1};return Math.hypot(b.x+d.width/2-p.x,b.y+d.height/2-p.y)<=range;};
    const done=(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)),factors=[['base',s.base]];
    {const castle=done.filter(b=>b.type==='castle'&&near(b,s.castle.range)).sort((a,b)=>castleLevel(b)-castleLevel(a))[0];if(castle)factors.push(['castle',s.castle.bonus+(castle.level?castleRules(castle).safety:0)]);}
    if(done.some(b=>b.type==='tower'&&near(b,s.tower.range)))factors.push(['tower',s.tower.bonus]);
    if(done.some(b=>b.type==='barracks'&&near(b,s.guard.range))||this.residents().some(o=>o!==worker&&o.profession==='soldier'&&Math.hypot(o.position.x-p.x,o.position.y-p.y)<=s.guard.range))factors.push(['guard',s.guard.bonus]);
    // Owner 15 Nov 2026: the garrison – soldiers at home (not away on an expedition or scouting) against the residents.
    {const g=garrisonRatio(this.residents());if(g.wanted>0)factors.push(['garrison',Math.round(s.garrison.bonus*g.ratio)]);}
    // m-uzavreny-hrad (point 34): closed walls protect who stands, lives or works inside them.
    {const e=enclosure(this.scene);if(e.any){if(home===undefined)home=this.homeOf(worker);const b=id=>id==null?null:(this.scene.buildings??[]).find(x=>x.id===id);
      if(e.inside(p.x,p.y)||e.holds(b(worker.assignedWorkplaceId))||e.holds(b(home?.buildingId)))factors.push(['walls',ENCLOSURE.safetyBonus]);}}
    // Day and night N2: at night a house without a burning light within 6 tiles is dark: −30.
    if(home===undefined&&this.scene.dayNight?.isNight())home=this.homeOf(worker);const house=home?.kind==='house'?(this.scene.buildings??[]).find(b=>b.id===home.buildingId):null;
    if(house&&this.scene.dayNight){const d=house.definition??this.scene.objectRegistry?.get?.(house.type)??{width:2,height:2};if(this.scene.dayNight.darkAt({x:house.x+d.width/2,y:house.y+d.height/2}))factors.push(['dark',-TORCHES.darkHouse.penalty]);}
    if(record?.attackedAt!=null){const day=this.scene.gameTime?.dayDuration??120000,age=(this.scene.gameTime?.totalElapsed??0)-record.attackedAt,left=1-age/(s.attack.days*day);if(left>0)factors.push(['attack',-Math.round(s.attack.penalty*left)]);}
    return {value:Math.round(clampNeed(factors.reduce((n,[,v])=>n+v,0))),factors};
  }
  // #68: the Food need target of one resident: rations base + 5 % per kind of food eaten in the last 3 days (max 100),
  // 0 for a resident who got no food. Without a policy system the rations are Normal.
  foodDetail(worker){const f=this.scene.foodSystem;return foodNeedTarget(this.scene.policy?.rations??'normal',f?.recentKinds?.(worker.id)?.length??0,!!f?.residents?.get(worker.id)?.hungry);}
  safety(worker,record){return this.safetyDetail(worker,record).value;}
  unpaidPenalty(worker){const gold=this.scene.wageSystem?.unpaid?.(worker)??0;return Math.min(NEEDS.unpaid.max,Math.round(gold*NEEDS.unpaid.perGold));}
  // Everything shown for one resident, derived from the stored state (never from the frame rate).
  status(worker,homes=this.homes()){
    // Only permanent residents: the King keeps his own HP and meals, visitors have no needs.
    if(!worker?.isAlive||worker.isSubject===false||this.scene.workerSystem?.workers.get(worker.id)!==worker)return null;
    const r=this.records.get(worker.id)??{food:100,rest:100,attackedAt:null},home=homes.get(worker.id)??null,safety=this.safetyDetail(worker,r,home),needs={food:Math.round(r.food),rest:Math.round(r.rest),housing:home?100:0,safety:safety.value};
    // #103: taxes and rations move Happiness (bonus or penalty), kept apart from the unpaid-wage penalty.
    // Policy v2 P2: situation penalties (unpaid but taxed, promised food missing, taxed while hungry) act at once.
    const penalty=this.unpaidPenalty(worker),policy=this.scene.policy?.happiness?.()??0,context=this.scene.policy?.contextPenalties?.(worker,{hungry:needs.food<NEEDS.food.low})??[],contextTotal=context.reduce((n,c)=>n+c.value,0);
    // Policy v2 P3: a running Feast adds to Happiness at once (#68: meal variety acts through the Food need).
    const feast=this.scene.policy?.feastBonus?.()??0,food=this.foodDetail(worker),starving=starvingPenalty(r.unfedDays);
    // Domestic animals Z1: a cat living in the resident's house.
    const house=home?.kind==='house'?this.scene.buildings?.find(b=>b.id===home.buildingId):null,cat=(this.scene.domestic?.catAtHome?.(house)?CATS.homeHappiness:0)+(this.scene.domestic?.houseHasRats?.(house)?HOUSE_RATS.happiness:0);
    // Children D1: a Village Green within reach of the house (+4) and, for a family house, a place for the children (+2).
    // Children D2: a Swing Tree (+1) and a Well (+1) nearby; all of it together is capped at +8 (`surroundingsCapped`).
    const around=this.scene.childrenSystem?.surroundings?.(house,homes)??{green:0,family:0,swing:0,well:0,fountain:0,total:0,capped:0},green=around.green,greenFamily=around.family,swing=around.swing,well=around.well,fountain=around.fountain??0;
    // m-topeni-domu: a warm House in autumn and winter (+), a cold one (−).
    const heat=this.scene.heating?.happiness?.(house??(home?.kind==='settlement'?this.scene.heating?.castle?.():null))??0;
    const happiness=happinessOf(needs,penalty-policy+contextTotal-feast-cat-around.total-heat+starving),mood=moodFor(happiness);
    return {...needs,safetyFactors:safety.factors,happiness,mood:mood.id,workModifier:mood.work,unpaidPenalty:penalty,starving,unfedDays:r.unfedDays??0,policy,policyTarget:this.scene.policy?.target?.()??0,policyContext:context,foodRations:this.scene.policy?.rations??'normal',foodBase:food.base,foodKinds:food.kinds,foodVariety:food.variety,foodTarget:food.target,foodUnfed:food.hungry,feast,heat,cat,green,greenFamily,swing,well,fountain,surroundingsCapped:around.capped,feastDaysLeft:this.scene.policy?.feastDaysLeft?.()??0,strike:!!r.strike,leaving:!!r.leaving,lowDays:r.lowDays??0,criticalDays:r.criticalDays??0,mainProblem:mainProblem(needs,penalty,Math.max(0,-policy)+contextTotal),home,hungry:needs.food<NEEDS.food.low,tired:needs.rest<NEEDS.rest.low,homeless:!home};
  }
  summary(){
    const homes=this.homes(),list=this.residents().map(w=>this.status(w,homes));
    if(!list.length)return {population:0,happiness:null,hungry:0,tired:0,homeless:0,striking:0,leaving:0,atRisk:0};
    return {population:list.length,happiness:Math.round(list.reduce((n,s)=>n+s.happiness,0)/list.length),hungry:list.filter(s=>s.hungry).length,tired:list.filter(s=>s.tired).length,homeless:list.filter(s=>s.homeless).length,striking:list.filter(s=>s.strike).length,leaving:list.filter(s=>s.leaving).length,atRisk:list.filter(s=>s.mood==='critical'||s.criticalDays>0).length};
  }
  get kingdomHappiness(){return this.summary().happiness;}
  // Only living residents are saved: a record of someone who died or left since the last update is dropped here.
  exportState(){const live=new Set(this.residents().map(w=>w.id)),homes=this.homes();return {pending:this.pending,
    homes:[...homes].sort(([a],[b])=>order(a)-order(b)).map(([id,h])=>({id,kind:h.kind,...(h.kind==='house'?{buildingId:h.buildingId}:{})})),records:[...this.records.values()].filter(r=>live.has(r.id)).sort((a,b)=>order(a.id)-order(b.id)).map(r=>({id:r.id,food:r.food,rest:r.rest,hp:r.hp,attackedAt:r.attackedAt,lowDays:r.lowDays??0,criticalDays:r.criticalDays??0,strike:!!r.strike,leaving:!!r.leaving,...(r.unfedDays>0?{unfedDays:r.unfedDays}:{})}))};}
  importState(data){this.pending=data?.pending??0;this.records=new Map((data?.records??[]).map(r=>[r.id,{...r}]));
    this.assignments=new Map((data?.homes??[]).map(h=>[h.id,h.kind==='house'?{kind:'house',buildingId:h.buildingId}:{kind:'settlement'}]));this.revision++;this.refresh();}
  destroy(){this.unsubscribe?.();this.unsubscribeDay?.();this.records.clear();this.assignments.clear();this.work.clear();this.scene.attractiveness?.modifiers?.delete('happiness');}
}
