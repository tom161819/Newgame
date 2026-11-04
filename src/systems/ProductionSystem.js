import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';

export class ProductionSystem {
  constructor(time,inventory,getBuildings,onIncome=()=>{}){
    Object.assign(this,{time,inventory,getBuildings,onIncome});this.lastProcessedDay=time.day;
    this.unsubscribe=time.onNewDay(day=>this.processDay(day));
  }
  dailyIncome(){
    const totals={};
    for(const building of this.getBuildings()){
      if(!buildingIsComplete(building))continue;
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
    for(const [index,building]of this.getBuildings().entries()){
      const p=buildingDefinition(building).production;if(!buildingIsComplete(building)||p?.interval!=='day')continue;
      this.inventory.add(p.resource,p.amount,{source:building.type==='castle'?'Castle Income':`${buildingDefinition(building).name} Income`,id:`daily-income:${building.id??index}:${day}:${p.resource}`,entityId:building.id??null,type:'production'});
    }
    if(Object.keys(totals).length)this.onIncome(day,totals);
    return totals;
  }
  destroy(){this.unsubscribe();}
}
