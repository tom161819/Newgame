import { JOBS } from '../data/jobs.js';
import { BASE_DAILY_WAGES,WAGE_LEVEL_INTERVAL } from '../data/economy.js';

export class WageSystem {
  constructor(scene,{onPayroll=()=>{}}={}){
    this.scene=scene;this.onPayroll=onPayroll;this.lastProcessedDay=scene.gameTime.day;
    this.accruals=new Map();this.arrears=[];
    this.unsubscribeAdvance=scene.gameTime.onAdvance(delta=>this.accrue(delta));
    // ProductionSystem je registrován před výplatou: příjem nového dne je již dostupný.
    this.unsubscribeDay=scene.gameTime.onNewDay(day=>this.processDay(day));
  }
  dailyWage(worker){
    const base=BASE_DAILY_WAGES[worker.profession]??0;if(!worker.isAlive||worker.isSubject===false||!base)return 0;
    return base+Math.floor(((worker.skills[JOBS[worker.profession].skill]?.level??1)-1)/WAGE_LEVEL_INTERVAL);
  }
  accrue(delta){
    for(const worker of this.scene.workerSystem.liveWorkers()){
      const rate=this.dailyWage(worker);if(!rate)continue;
      const cost=this.accruals.get(worker.id)??{rateMilliseconds:0,compensation:0};
      // Kahanův součet omezuje chybu při sčítání tisíců krátkých snímků. Zaokrouhluje pouze UI.
      const value=rate*delta-cost.compensation,total=cost.rateMilliseconds+value;
      cost.compensation=(total-cost.rateMilliseconds)-value;cost.rateMilliseconds=total;this.accruals.set(worker.id,cost);
    }
  }
  processDay(day){
    if(day<=this.lastProcessedDay)return false;
    for(const [workerId,cost]of this.accruals)if(cost.rateMilliseconds>0)this.arrears.push({workerId,day:day-1,amount:cost.rateMilliseconds/this.scene.gameTime.dayDuration});
    this.accruals.clear();this.lastProcessedDay=day;
    this.arrears.sort((a,b)=>a.day-b.day||a.workerId.localeCompare(b.workerId,undefined,{numeric:true}));
    for(const debt of this.arrears){
      const paid=Math.min(debt.amount,this.scene.inventory.count('gold'));
      if(paid>0&&this.scene.inventory.spend('gold',paid))debt.amount-=paid;
    }
    this.arrears=this.arrears.filter(debt=>debt.amount>0);this.onPayroll({day,unpaid:this.totalUnpaid()});return true;
  }
  unpaid(worker){return this.arrears.filter(d=>d.workerId===worker.id).reduce((sum,d)=>sum+d.amount,0);}
  totalUnpaid(){return this.arrears.reduce((sum,d)=>sum+d.amount,0);}
  accrued(worker){return (this.accruals.get(worker.id)?.rateMilliseconds??0)/this.scene.gameTime.dayDuration;}
  overview(){
    const income=this.scene.production.dailyIncome().gold??0,wages=this.scene.workerSystem.liveWorkers().reduce((sum,w)=>sum+this.dailyWage(w),0);
    return {gold:this.scene.inventory.count('gold'),income,wages,balance:income-wages,unpaid:this.totalUnpaid()};
  }
  exportState(){return {lastProcessedDay:this.lastProcessedDay,accruals:structuredClone(Object.fromEntries(this.accruals)),arrears:structuredClone(this.arrears)};}
  importState(data){this.lastProcessedDay=data?.lastProcessedDay??this.scene.gameTime.day;this.accruals=new Map(Object.entries(data?.accruals??{}));this.arrears=structuredClone(data?.arrears??[]);}
  destroy(){this.unsubscribeAdvance();this.unsubscribeDay();}
}
