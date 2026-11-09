import { devFactor } from '../data/devBalance.js';
import { DAY_DURATION } from './GameTimeSystem.js';
import { EDIBLE_RESOURCES,FOOD_ECONOMY_DAYS,HUNGRY_WORK_MULTIPLIER } from '../data/seasons.js';
import { MEAL_VARIETY } from '../data/policy.js';
import { t } from '../i18n/index.js';

// One meal scheduler serves standalone models and the scene's central game clock.
export class FoodSystem {
  constructor(inventory,_definition,onChange=()=>{},{time=null,scene=null,subscribe=false}={}){
    Object.assign(this,{inventory,onChange,time,scene});this.variety=true;this.residents=new Map();this.history=[];this.productionEvents=new Set();this.lastProcessedDay=time?.day??1;this.syncResidents();
    if(subscribe){this.unsubscribe=time.onAdvance(delta=>this.advance(delta));this.unsubscribeDay=time.onNewDay(day=>{this.lastProcessedDay=day;this.trimHistory();});}
  }
  get dayDuration(){return this.time?.dayDuration??DAY_DURATION;}
  units(){return[this.scene?.character??{id:'king',isAlive:true},...(this.scene?.workerSystem?.liveWorkers()??[]).filter(w=>w.isSubject!==false)];}
  syncResidents(){for(const u of this.units())if(u.isAlive&&!this.residents.has(u.id))this.residents.set(u.id,{id:u.id,progress:0,hungry:false,compensation:0,meals:{}});}
  get elapsed(){return(this.residents.get('king')?.progress??0)*this.dayDuration/2;}
  set elapsed(value){this.residents.set('king',{id:'king',progress:value/(this.dayDuration/2),hungry:false,compensation:0,meals:this.residents.get('king')?.meals??{}});}
  get remainingSeconds(){return Math.ceil((this.dayDuration/2-this.elapsed)/1000);}
  // m-jidlo-balanc: portions a day at the current rations (Normal 0.8 since then), so the HUD days and the Policy balance match what is eaten.
  portionsPerDay(u){return u.id==='king'?2:(this.scene?.policy?.portions?.()??1)*devFactor('consumption');}
  get dailyConsumption(){return Math.round(this.units().reduce((n,u)=>n+(u.isAlive?this.portionsPerDay(u):0),0)*100)/100;}
  get availablePortions(){return EDIBLE_RESOURCES.reduce((n,id)=>n+this.inventory.count(id),0);}
  get hungryCount(){return this.units().filter(u=>u.isAlive&&this.residents.get(u.id)?.hungry).length;}
  get shortage(){return this.hungryCount>0||this.availablePortions<this.dailyConsumption;}
  workMultiplier(actor){return actor.id!=='king'&&this.residents.get(actor.id)?.hungry?HUNGRY_WORK_MULTIPLIER:1;}
  bucket(){const day=this.time?.day??this.lastProcessedDay;let record=this.history.find(r=>r.day===day);if(!record){record={day,produced:0,consumed:0};this.history.push(record);}return record;}
  trimHistory(){const day=this.time?.day??this.lastProcessedDay;this.history=this.history.filter(r=>r.day>day-FOOD_ECONOMY_DAYS);}
  // Policy v2 P3: a resident takes the available kind he ate longest ago (never eaten first, then the food order), so
  // the kinds alternate; the day each kind was last eaten is kept for meal variety (it raises the Food need, #68). Deterministic.
  eat(actor=this.scene?.character??{id:'king'},{source=null}={}){
    if(!this.residents.has(actor.id))this.syncResidents();
    const record=this.residents.get(actor.id),last=record?.meals??{},day=this.time?.day??this.lastProcessedDay;
    const order=EDIBLE_RESOURCES.map((id,i)=>({id,i,day:this.variety?last[id]??-Infinity:0})).sort((a,b)=>a.day-b.day||a.i-b.i);
    for(const {id}of order)if(this.inventory.count(id)>0&&this.inventory.spend(id,1,{source:source??(actor.id==='king'?'King Consumption':'Villager Consumption'),entityId:actor.id})){this.bucket().consumed++;this.lastMeal=id;if(record){record.meals={...last,[id]:day};}return true;}
    return false;
  }
  // Kinds of food a resident ate within the last MEAL_VARIETY.days days (today included).
  recentKinds(id){const day=this.time?.day??this.lastProcessedDay,meals=this.residents.get(id)?.meals??{};return EDIBLE_RESOURCES.filter(k=>meals[k]!==undefined&&day-meals[k]<MEAL_VARIETY.days);}
  // A hungry resident eats as soon as any food reaches a store, so a delivery to an empty kingdom can be eaten in the
  // same frame and the stock in the top bar never rises (owner report 0.85.0: "the Fisher brought fish but nothing was
  // added"). That is the intended food rule; the notice below says where the food went.
  recover(){
    if(this.time?.paused||this.scene?.gameOver)return false;let changed=false;const eaten={};
    for(const u of this.units())if(u.isAlive){const record=this.residents.get(u.id);if(record?.hungry&&this.eat(u)){record.hungry=false;changed=true;eaten[this.lastMeal]=(eaten[this.lastMeal]??0)+1;}}
    if(changed){this.onChange();this.reportHungryMeals(eaten);}return changed;
  }
  // ryby-nepricteny: one notice a game day when hungry residents ate food the moment it arrived.
  reportHungryMeals(eaten){
    const feed=this.scene?.eventFeed,entries=Object.entries(eaten).filter(([id,n])=>id&&n>0);if(!feed?.push||!entries.length)return;
    const registry=this.scene.objectRegistry,items=entries.map(([id,n])=>`${registry?.get?.(id)?.name??id} ${n}`).join(', ');
    feed.push(`hungry-ate:${this.time?.day??this.lastProcessedDay}`,t('food.hungryAte',{items}));
  }
  advance(delta){
    if(!Number.isFinite(delta)||delta<=0||this.scene?.gameOver||this.time?.paused)return;
    this.syncResidents();let changed=this.recover();
    for(const u of this.units())if(u.isAlive){
      const record=this.residents.get(u.id),rate=this.portionsPerDay(u)/this.dayDuration,corrected=delta*rate-record.compensation,total=record.progress+corrected;
      record.compensation=(total-record.progress)-corrected;record.progress=total;
      while(record.progress>=1-1e-10){record.progress=Math.max(0,record.progress-1);record.hungry=!this.eat(u);changed=true;}
    }
    if(changed)this.onChange();
  }
  update(delta){if(this.unsubscribe)this.recover();else this.advance(delta);}
  recordProduction(resource,amount,eventId){
    if(!EDIBLE_RESOURCES.includes(resource)||!Number.isSafeInteger(amount)||amount<=0||!eventId||this.productionEvents.has(eventId))return;
    this.productionEvents.add(eventId);this.bucket().produced+=amount;this.trimHistory();
    if(resource==='meat')this.scene?.resourceLedger?.income(resource,amount,'Hunting',{id:`hunting:${eventId}`,entityId:eventId,type:'production'});
    if(resource==='fish')this.scene?.resourceLedger?.income(resource,amount,'Fishing',{id:`fishing:${eventId}`,entityId:eventId,type:'production'});
  }
  overview(){const day=this.time?.day??this.lastProcessedDay;this.trimHistory();return{storage:this.availablePortions,daily:this.dailyConsumption,production:this.history.reduce((n,r)=>n+r.produced,0)/Math.min(day,FOOD_ECONOMY_DAYS),days:this.dailyConsumption?this.availablePortions/this.dailyConsumption:0,unfed:this.hungryCount};}
  exportState(){this.syncResidents();return{elapsed:this.elapsed,residents:structuredClone([...this.residents.values()]),history:structuredClone(this.history),productionEvents:[...this.productionEvents],lastProcessedDay:this.time?.day??this.lastProcessedDay};}
  importState(data){
    this.residents=new Map((data.residents??[{id:'king',progress:data.elapsed/60000,hungry:false,compensation:0}]).map(r=>[r.id,{meals:{},...structuredClone(r)}]));
    this.history=structuredClone(data.history??[]);this.productionEvents=new Set(data.productionEvents??[]);this.lastProcessedDay=data.lastProcessedDay??this.time?.day??1;this.syncResidents();
  }
  destroy(){this.unsubscribe?.();this.unsubscribeDay?.();this.residents.clear();}
}
