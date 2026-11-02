export class FoodSystem {
  constructor(inventory,definition,onChange=()=>{}) {
    this.inventory=inventory;this.resource=definition.id;this.interval=definition.consumption.interval;
    this.amount=definition.consumption.amount;this.elapsed=0;this.onChange=onChange;
  }
  get remainingSeconds(){return Math.ceil((this.interval-this.elapsed)/1000);}
  update(delta){
    this.elapsed+=Math.max(0,delta);
    const cycles=Math.floor(this.elapsed/this.interval);
    if(!cycles)return;
    this.elapsed-=cycles*this.interval;
    this.inventory.spend(this.resource,Math.min(this.inventory.count(this.resource),cycles*this.amount));
    this.onChange();
  }
}
