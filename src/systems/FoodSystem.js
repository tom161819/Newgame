export class FoodSystem {
  constructor(inventory,definition,onChange=()=>{}) {
    this.inventory=inventory;this.resource=definition.id;this.interval=definition.consumption.interval;
    this.amount=definition.consumption.amount;this.elapsed=0;this.onChange=onChange;
  }
  get remainingSeconds(){return Math.ceil((this.interval-this.elapsed)/1000);}
  get availablePortions(){return this.inventory.count(this.resource)+this.inventory.count('apple');}
  exportState(){return {elapsed:this.elapsed};}
  importState(data){this.elapsed=data.elapsed;}
  update(delta){
    this.elapsed+=Math.max(0,delta);
    const cycles=Math.floor(this.elapsed/this.interval);
    if(!cycles)return;
    this.elapsed-=cycles*this.interval;
    const meat=Math.min(this.inventory.count(this.resource),cycles*this.amount);
    this.inventory.spend(this.resource,meat);
    const apples=Math.min(this.inventory.count('apple'),cycles*this.amount-meat);
    if(apples>0)this.inventory.spend('apple',apples);
    this.onChange();
  }
}
