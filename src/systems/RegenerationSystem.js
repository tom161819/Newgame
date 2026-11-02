export class RegenerationSystem {
  rateFor(unit){return unit.isAlive?Math.max(0,unit.hpRegenPerSecond??0):0;}
  update(delta,units,covered=new Map()){
    if(!Number.isFinite(delta)||delta<=0)return 0;
    let healed=0;
    for(const unit of units){
      const time=Math.max(0,delta-(covered.get(unit)??0))/1000,rate=this.rateFor(unit);
      if(!unit.isAlive||!rate||!time)continue;
      const amount=Math.min(Math.max(0,unit.maxHP-unit.currentHP),rate*time);
      unit.currentHP=Math.min(unit.maxHP,unit.currentHP+amount);healed+=amount;
    }
    return healed;
  }
}
