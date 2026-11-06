import { NEEDS,clampNeed,moodFor,happinessOf,mainProblem,attractivenessFor } from '../data/needs.js';
import { POPULATION } from '../data/jobs.js';
import { buildingIsComplete } from '../game/buildings.js';

// S13 (#58) phase A: every permanent resident has Food, Rest, Housing and Safety, a weighted Happiness, a mood and a
// main problem. Updated from the central Game Time at most once per second (also off camera and under Fog of War);
// the mood scales work speed and Kingdom Happiness feeds Kingdom Attractiveness (phase C); strikes and emigration follow.
const order=id=>Number(String(id).replace(/\D+/g,''))||0;
export class NeedsSystem {
  constructor(scene,{subscribe=true}={}){
    this.scene=scene;this.records=new Map();this.pending=0;this.revision=0;this.work=new Map();
    if(subscribe&&scene.gameTime?.onAdvance)this.unsubscribe=scene.gameTime.onAdvance(delta=>this.advance(delta));
  }
  residents(){return (this.scene.workerSystem?.liveWorkers()??[]).filter(w=>w.isAlive&&w.isSubject!==false);}
  record(worker){let r=this.records.get(worker.id);if(!r){r={id:worker.id,food:100,rest:100,hp:worker.currentHP,attackedAt:null};this.records.set(worker.id,r);}return r;}
  advance(delta){if(!Number.isFinite(delta)||delta<=0)return;this.pending+=delta;if(this.pending<NEEDS.updateMs)return;const step=this.pending;this.pending=0;this.step(step);}
  step(ms){
    const day=this.scene.gameTime?.dayDuration??120000,fraction=ms/day,now=this.scene.gameTime?.totalElapsed??0,live=new Set();
    for(const worker of this.residents()){
      live.add(worker.id);const r=this.record(worker),hungry=!!this.scene.foodSystem?.residents?.get(worker.id)?.hungry;
      r.food=clampNeed(r.food+(hungry?-NEEDS.food.declinePerDay:NEEDS.food.recoverPerDay)*fraction);
      r.rest=clampNeed(r.rest+(NEEDS.activeStates.includes(worker.workState)?-NEEDS.rest.drainPerDay:NEEDS.rest.recoverPerDay)*fraction);
      if(Number.isFinite(worker.currentHP)&&worker.currentHP<r.hp)r.attackedAt=now;r.hp=worker.currentHP;
    }
    for(const id of [...this.records.keys()])if(!live.has(id))this.records.delete(id);
    this.revision++;this.refresh();
  }
  // Phase C: derived once per update, never saved: the mood's work factor per resident and Kingdom Happiness in attractiveness.
  refresh(){const homes=this.homes(),list=[];this.work=new Map();for(const w of this.residents()){const s=this.status(w,homes);if(!s)continue;this.work.set(w.id,s.workModifier);list.push(s.happiness);}
    const happiness=list.length?Math.round(list.reduce((n,v)=>n+v,0)/list.length):null;this.scene.attractiveness?.modifiers?.set('happiness',attractivenessFor(happiness));}
  workModifier(worker){return this.work.get(worker?.id)??1;}
  // Residents fill the settlement's base places first, then completed Houses (5 each), in arrival order. Phase B stores homes.
  homes(){
    const residents=this.residents().sort((a,b)=>order(a.id)-order(b.id)),houses=(this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&this.scene.objectRegistry?.get?.(b.type)?.housing).sort((a,b)=>a.id-b.id),homes=new Map();
    let i=0;for(;i<Math.min(POPULATION.maximum,residents.length);i++)homes.set(residents[i].id,{kind:'settlement'});
    for(const house of houses)for(let seat=0;seat<(this.scene.objectRegistry.get(house.type).housing.capacity??POPULATION.houseCapacity)&&i<residents.length;seat++,i++)homes.set(residents[i].id,{kind:'house',buildingId:house.id});
    return homes;
  }
  safety(worker,record){
    const s=NEEDS.safety,p=worker.position??{x:worker.tile?.x??0,y:worker.tile?.y??0},near=(b,range)=>{const d=b.definition??this.scene.objectRegistry?.get?.(b.type)??{width:1,height:1};return Math.hypot(b.x+d.width/2-p.x,b.y+d.height/2-p.y)<=range;};
    const done=(this.scene.buildings??[]).filter(b=>buildingIsComplete(b));let value=s.base;
    if(done.some(b=>b.type==='castle'&&near(b,s.castle.range)))value+=s.castle.bonus;
    if(done.some(b=>b.type==='tower'&&near(b,s.tower.range)))value+=s.tower.bonus;
    if(done.some(b=>b.type==='barracks'&&near(b,s.guard.range))||this.residents().some(o=>o!==worker&&o.profession==='soldier'&&Math.hypot(o.position.x-p.x,o.position.y-p.y)<=s.guard.range))value+=s.guard.bonus;
    if(record?.attackedAt!=null){const day=this.scene.gameTime?.dayDuration??120000,age=(this.scene.gameTime?.totalElapsed??0)-record.attackedAt,left=1-age/(s.attack.days*day);if(left>0)value-=s.attack.penalty*left;}
    return Math.round(clampNeed(value));
  }
  unpaidPenalty(worker){const gold=this.scene.wageSystem?.unpaid?.(worker)??0;return Math.min(NEEDS.unpaid.max,Math.round(gold*NEEDS.unpaid.perGold));}
  // Everything shown for one resident, derived from the stored state (never from the frame rate).
  status(worker,homes=this.homes()){
    // Only permanent residents: the King keeps his own HP and meals, visitors have no needs.
    if(!worker?.isAlive||worker.isSubject===false||this.scene.workerSystem?.workers.get(worker.id)!==worker)return null;
    const r=this.records.get(worker.id)??{food:100,rest:100,attackedAt:null},home=homes.get(worker.id)??null,needs={food:Math.round(r.food),rest:Math.round(r.rest),housing:home?100:0,safety:this.safety(worker,r)};
    const penalty=this.unpaidPenalty(worker),happiness=happinessOf(needs,penalty),mood=moodFor(happiness);
    return {...needs,happiness,mood:mood.id,workModifier:mood.work,unpaidPenalty:penalty,mainProblem:mainProblem(needs,penalty),home,hungry:needs.food<NEEDS.food.low,tired:needs.rest<NEEDS.rest.low,homeless:!home};
  }
  summary(){
    const homes=this.homes(),list=this.residents().map(w=>this.status(w,homes));
    if(!list.length)return {population:0,happiness:null,hungry:0,tired:0,homeless:0,striking:0,atRisk:0};
    return {population:list.length,happiness:Math.round(list.reduce((n,s)=>n+s.happiness,0)/list.length),hungry:list.filter(s=>s.hungry).length,tired:list.filter(s=>s.tired).length,homeless:list.filter(s=>s.homeless).length,striking:0,atRisk:list.filter(s=>s.mood==='critical').length};
  }
  get kingdomHappiness(){return this.summary().happiness;}
  // Only living residents are saved: a record of someone who died or left since the last update is dropped here.
  exportState(){const live=new Set(this.residents().map(w=>w.id));return {pending:this.pending,records:[...this.records.values()].filter(r=>live.has(r.id)).sort((a,b)=>order(a.id)-order(b.id)).map(r=>({id:r.id,food:r.food,rest:r.rest,hp:r.hp,attackedAt:r.attackedAt}))};}
  importState(data){this.pending=data?.pending??0;this.records=new Map((data?.records??[]).map(r=>[r.id,{...r}]));this.revision++;this.refresh();}
  destroy(){this.unsubscribe?.();this.records.clear();this.work.clear();this.scene.attractiveness?.modifiers?.delete('happiness');}
}
