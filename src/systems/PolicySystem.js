import { TAX_RATES,RATIONS,DEFAULT_POLICY,POLICY_RULES } from '../data/policy.js';

// #103: tax rate and food rations. Taxes are collected at the start of each day from the permanent residents (Gold,
// ledger source "Taxes"); rations scale how often residents (not the King) eat; both add to every resident's Happiness.
// Policy v2 P1: a choice in the Castle panel is pending until the next morning (applied before the taxes are
// collected), so switching around dawn cannot dodge taxes; the Happiness effect then moves 5 points a day to its target.
export class PolicySystem {
  constructor(scene){
    this.scene=scene;this.tax=DEFAULT_POLICY.tax;this.rations=DEFAULT_POLICY.rations;this.pending=null;this.effect=this.target();this.lastTaxDay=scene.gameTime?.day??1;this.listeners=new Set();
    this.unsubscribe=scene.gameTime?.onNewDay?.(day=>this.collect(day));
    this.unsubscribeAdvance=scene.gameTime?.onAdvance?.(delta=>this.advance(delta));
  }
  onChange(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  changed(){for(const listener of this.listeners)listener();}
  // A choice waits for the next morning; choosing the policy in force again cancels the wait.
  set(kind,value){
    if(!(kind==='tax'&&Object.hasOwn(TAX_RATES,value)||kind==='rations'&&Object.hasOwn(RATIONS,value)))return false;
    const next={tax:this.pending?.tax??this.tax,rations:this.pending?.rations??this.rations,[kind]:value};
    this.pending=next.tax===this.tax&&next.rations===this.rations?null:next;this.changed();return true;
  }
  cancel(){if(!this.pending)return false;this.pending=null;this.changed();return true;}
  // The morning: the pending policy takes effect (its Happiness effect then moves towards the new target).
  apply(){if(!this.pending)return false;this.tax=this.pending.tax;this.rations=this.pending.rations;this.pending=null;this.scene.needs?.refresh?.();this.changed();return true;}
  advance(delta){
    const day=this.scene.gameTime?.dayDuration;if(!(delta>0)||!day)return;const target=this.target();if(this.effect===target)return;
    const step=POLICY_RULES.effectPerDay*delta/day;this.effect=this.effect<target?Math.min(target,this.effect+step):Math.max(target,this.effect-step);
  }
  target(policy=this){return TAX_RATES[policy.tax].happiness+RATIONS[policy.rations].happiness;}
  // Days until the Happiness effect reaches its target (for the panel).
  daysToTarget(){return Math.abs(this.target()-this.effect)/POLICY_RULES.effectPerDay;}
  residents(){return (this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>w.isAlive&&w.isSubject!==false);}
  portions(){return RATIONS[this.rations].portions;}
  // The Happiness effect in force now (whole points shown, the exact value used).
  happiness(){return this.effect;}
  dailyTaxes(tax=this.tax){return Math.round(this.residents().length*TAX_RATES[tax].perResident*100)/100;}
  collect(day){
    if(day<=this.lastTaxDay)return 0;this.lastTaxDay=day;this.apply();
    const castle=this.scene.buildings?.some(b=>b.type==='castle'&&(!b.construction||b.construction.state==='complete'));const amount=castle?this.dailyTaxes():0;
    if(amount>0)this.scene.inventory.add('gold',amount,{source:'Taxes',id:`taxes:${day}`,type:'production'});
    return amount;
  }
  // Gold per day: Castle income, taxes and the average trade result of the last days, minus wages.
  balance(){
    const s=this.scene,castle=s.production?.dailyIncome?.().gold??0,wages=(s.workerSystem?.liveWorkers?.()??[]).reduce((n,w)=>n+(s.wageSystem?.dailyWage?.(w)??0),0);
    const days=(s.resourceLedger?.history??[]).slice(-POLICY_RULES.tradeAverageDays),trade=days.length?days.reduce((n,d)=>{const g=d.totals?.gold;return n+(g?.incomeBySource?.['Trade Sale']??0)-(g?.expensesBySource?.['Trade Purchase']??0);},0)/days.length:0;
    const taxes=this.dailyTaxes(),next=this.pending?this.dailyTaxes(this.pending.tax):null;
    return {castle,taxes,nextTaxes:next,trade,wages,total:castle+taxes+trade-wages,nextTotal:next===null?null:castle+next+trade-wages};
  }
  // Food per day (production − consumption from the food history) and how many days the stock lasts at these rations.
  food(){const o=this.scene.foodSystem?.overview?.();if(!o)return null;return {production:o.production,consumption:o.daily,net:o.production-o.daily,days:o.days};}
  exportState(){return {tax:this.tax,rations:this.rations,lastTaxDay:this.lastTaxDay,pending:this.pending?{...this.pending}:null,effect:this.effect};}
  importState(state){if(!state)return;this.tax=state.tax;this.rations=state.rations;this.lastTaxDay=state.lastTaxDay;this.pending=state.pending?{...state.pending}:null;this.effect=state.effect;this.changed();}
  destroy(){this.unsubscribe?.();this.unsubscribeAdvance?.();this.listeners.clear();}
}
