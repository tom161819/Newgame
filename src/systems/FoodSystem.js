import { DAY_DURATION } from './GameTimeSystem.js';
import { EDIBLE_RESOURCES,FOOD_ECONOMY_DAYS,HUNGRY_WORK_MULTIPLIER } from '../data/seasons.js';

// One meal scheduler serves standalone models and the scene's central game clock.
export class FoodSystem {
  constructor(inventory,_definition,onChange=()=>{},{time=null,scene=null,subscribe=false}={}){
    Object.assign(this,{inventory,onChange,time,scene});this.residents=new Map();this.history=[];this.productionEvents=new Set();this.lastProcessedDay=time?.day??1;this.syncResidents();
    if(subscribe){this.unsubscribe=time.onAdvance(delta=>this.advance(delta));this.unsubscribeDay=time.onNewDay(day=>{this.lastProcessedDay=day;this.trimHistory();});}
  }
  get dayDuration(){return this.time?.dayDuration??DAY_DURATION;}
  units(){return[this.scene?.character??{id:'king',isAlive:true},...(this.scene?.workerSystem?.liveWorkers()??[]).filter(w=>w.isSubject!==false)];}
  syncResidents(){for(const u of this.units())if(u.isAlive&&!this.residents.has(u.id))this.residents.set(u.id,{id:u.id,progress:0,hungry:false,compensation:0});}
  get elapsed(){return(this.residents.get('king')?.progress??0)*this.dayDuration/2;}
  set elapsed(value){this.residents.set('king',{id:'king',progress:value/(this.dayDuration/2),hungry:false,compensation:0});}
  get remainingSeconds(){return Math.ceil((this.dayDuration/2-this.elapsed)/1000);}
  get dailyConsumption(){return this.units().reduce((n,u)=>n+(u.isAlive?(u.id==='king'?2:1):0),0);}
  get availablePortions(){return EDIBLE_RESOURCES.reduce((n,id)=>n+this.inventory.count(id),0);}
  get hungryCount(){return this.units().filter(u=>u.isAlive&&this.residents.get(u.id)?.hungry).length;}
  get shortage(){return this.hungryCount>0||this.availablePortions<this.dailyConsumption;}
  workMultiplier(actor){return actor.id!=='king'&&this.residents.get(actor.id)?.hungry?HUNGRY_WORK_MULTIPLIER:1;}
  bucket(){const day=this.time?.day??this.lastProcessedDay;let record=this.history.find(r=>r.day===day);if(!record){record={day,produced:0,consumed:0};this.history.push(record);}return record;}
  trimHistory(){const day=this.time?.day??this.lastProcessedDay;this.history=this.history.filter(r=>r.day>day-FOOD_ECONOMY_DAYS);}
  eat(actor=this.scene?.character??{id:'king'}){for(const id of EDIBLE_RESOURCES)if(this.inventory.count(id)>0&&this.inventory.spend(id,1,{source:actor.id==='king'?'King Consumption':'Villager Consumption',entityId:actor.id})){this.bucket().consumed++;return true;}return false;}
  recover(){if(this.time?.paused||this.scene?.gameOver)return false;let changed=false;for(const u of this.units())if(u.isAlive){const record=this.residents.get(u.id);if(record?.hungry&&this.eat(u)){record.hungry=false;changed=true;}}if(changed)this.onChange();return changed;}
  advance(delta){
    if(!Number.isFinite(delta)||delta<=0||this.scene?.gameOver||this.time?.paused)return;
    this.syncResidents();let changed=this.recover();
    for(const u of this.units())if(u.isAlive){
      const record=this.residents.get(u.id),rate=(u.id==='king'?2:(this.scene?.policy?.portions?.()??1))/this.dayDuration,corrected=delta*rate-record.compensation,total=record.progress+corrected;
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
  }
  overview(){const day=this.time?.day??this.lastProcessedDay;this.trimHistory();return{storage:this.availablePortions,daily:this.dailyConsumption,production:this.history.reduce((n,r)=>n+r.produced,0)/Math.min(day,FOOD_ECONOMY_DAYS),days:this.dailyConsumption?this.availablePortions/this.dailyConsumption:0,unfed:this.hungryCount};}
  exportState(){this.syncResidents();return{elapsed:this.elapsed,residents:structuredClone([...this.residents.values()]),history:structuredClone(this.history),productionEvents:[...this.productionEvents],lastProcessedDay:this.time?.day??this.lastProcessedDay};}
  importState(data){
    this.residents=new Map((data.residents??[{id:'king',progress:data.elapsed/60000,hungry:false,compensation:0}]).map(r=>[r.id,structuredClone(r)]));
    this.history=structuredClone(data.history??[]);this.productionEvents=new Set(data.productionEvents??[]);this.lastProcessedDay=data.lastProcessedDay??this.time?.day??1;this.syncResidents();
  }
  destroy(){this.unsubscribe?.();this.unsubscribeDay?.();this.residents.clear();}
}
