import { buildingDefinition } from '../game/buildings.js';

export class ProductionSystem {
  constructor(time,inventory,getBuildings,onIncome=()=>{}){
    Object.assign(this,{time,inventory,getBuildings,onIncome});this.lastProcessedDay=time.day;
    this.unsubscribe=time.onNewDay(day=>this.processDay(day));
  }
  dailyIncome(){
    const totals={};
    for(const building of this.getBuildings()){
      const production=buildingDefinition(building).production;
      if(production?.interval==='day')totals[production.resource]=(totals[production.resource]??0)+production.amount;
    }
    return totals;
  }
  exportState(){return {lastProcessedDay:this.lastProcessedDay};}
  importState(data){this.lastProcessedDay=data.lastProcessedDay;}
  processDay(day){
    if(day<=this.lastProcessedDay)return {};
    this.lastProcessedDay=day;
    const totals=this.dailyIncome();
    for(const [resource,amount]of Object.entries(totals))this.inventory.add(resource,amount);
    if(Object.keys(totals).length)this.onIncome(day,totals);
    return totals;
  }
  destroy(){this.unsubscribe();}
}
