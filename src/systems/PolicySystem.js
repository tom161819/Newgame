import { TAX_RATES,RATIONS,DEFAULT_POLICY } from '../data/policy.js';

// #103: tax rate and food rations. Taxes are collected at the start of each day from the permanent residents (Gold,
// ledger source "Taxes"); rations scale how often residents (not the King) eat; both add to every resident's Happiness.
export class PolicySystem {
  constructor(scene){
    this.scene=scene;this.tax=DEFAULT_POLICY.tax;this.rations=DEFAULT_POLICY.rations;this.lastTaxDay=scene.gameTime?.day??1;this.listeners=new Set();
    this.unsubscribe=scene.gameTime?.onNewDay?.(day=>this.collect(day));
  }
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const listener of this.listeners)listener();}
  set(kind,value){
    if(kind==='tax'&&Object.hasOwn(TAX_RATES,value))this.tax=value;else if(kind==='rations'&&Object.hasOwn(RATIONS,value))this.rations=value;else return false;
    this.scene.needs?.refresh?.();this.changed();return true;
  }
  residents(){return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.isAlive&&w.isSubject!==false);}
  portions(){return RATIONS[this.rations].portions;}
  happiness(){return TAX_RATES[this.tax].happiness+RATIONS[this.rations].happiness;}
  dailyTaxes(){return Math.round(this.residents().length*TAX_RATES[this.tax].perResident*100)/100;}
  collect(day){
    if(day<=this.lastTaxDay)return 0;this.lastTaxDay=day;
    const castle=this.scene.buildings?.some(b=>b.type==='castle'&&(!b.construction||b.construction.state==='complete'));const amount=castle?this.dailyTaxes():0;
    if(amount>0)this.scene.inventory.add('gold',amount,{source:'Taxes',id:`taxes:${day}`,type:'production'});
    return amount;
  }
  exportState(){return {tax:this.tax,rations:this.rations,lastTaxDay:this.lastTaxDay};}
  importState(state){if(!state)return;this.tax=state.tax;this.rations=state.rations;this.lastTaxDay=state.lastTaxDay;this.changed();}
  destroy(){this.unsubscribe?.();this.listeners.clear();}
}
