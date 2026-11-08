import { TAX_RATES,RATIONS,DEFAULT_POLICY,POLICY_RULES,FEAST } from '../data/policy.js';
import { t } from '../i18n/index.js';

// #103: tax rate and food rations. Taxes are collected at the start of each day from the permanent residents (Gold,
// ledger source "Taxes"); rations scale how often residents (not the King) eat; both add to every resident's Happiness.
// Policy v2 P1: a choice in the Castle panel is pending until the next morning (applied before the taxes are
// collected), so switching around dawn cannot dodge taxes; the Happiness effect then moves 5 points a day to its target.
export class PolicySystem {
  constructor(scene){
    this.scene=scene;this.tax=DEFAULT_POLICY.tax;this.rations=DEFAULT_POLICY.rations;this.pending=null;this.effect=this.target();this.feastUntil=null;this.lastFeastAt=null;this.lastTaxDay=scene.gameTime?.day??1;this.listeners=new Set();
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
  foodCap(){return RATIONS[this.rations].foodCap;}
  // Policy v2 P2: situation penalties of one resident, each with its reason (shown in the Happiness tooltip).
  contextPenalties(worker,{hungry=false}={}){
    const s=this.scene,c=POLICY_RULES.context,out=[];
    if(this.tax!=='none'&&(s.wageSystem?.unpaid?.(worker)??0)>0)out.push({id:'taxedUnpaid',value:c.taxedUnpaid});
    // Generous rations promised, but no meal for this resident: the penalty, and the well-fed bonus does not count.
    if(this.rations==='generous'&&s.foodSystem?.residents?.get(worker.id)?.hungry)out.push({id:'promisedFood',value:c.promisedFood+Math.max(0,Math.min(RATIONS.generous.happiness,this.effect-TAX_RATES[this.tax].happiness))});
    if(hungry&&c.hungryTaxRates.includes(this.tax))out.push({id:'hungryTaxes',value:c.hungryTaxes});
    return out;
  }
  // The Happiness effect in force now (whole points shown, the exact value used).
  happiness(){return this.effect;}
  dailyTaxes(tax=this.tax){return Math.round(this.residents().length*TAX_RATES[tax].perResident*(this.scene.kingSkills?.taxMultiplier?.()??1)*100)/100;}
  collect(day){
    if(day<=this.lastTaxDay)return 0;this.lastTaxDay=day;this.apply();
    const castle=this.scene.buildings?.some(b=>b.type==='castle'&&(!b.construction||b.construction.state==='complete'));const amount=castle?this.dailyTaxes():0;
    if(amount>0)this.scene.inventory.add('gold',amount,{source:'Taxes',id:`taxes:${day}`,type:'production'});
    return amount;
  }
  // Policy v2 P3: the Feast. One portion of food (eaten like a meal, so it counts for variety) and one Gold per resident;
  // +15 Happiness for every resident for 2 days; again 5 days after the last one began.
  now(){return this.scene.gameTime?.totalElapsed??0;}
  feastCost(){const n=this.residents().length;return {food:Math.ceil(n*FEAST.foodPerResident),gold:Math.ceil(n*FEAST.goldPerResident),residents:n};}
  feastStatus(){
    const day=this.scene.gameTime?.dayDuration??120000,cost=this.feastCost(),wait=this.lastFeastAt===null?0:this.lastFeastAt+FEAST.cooldownDays*day-this.now();
    if(wait>0)return {ok:false,reason:'cooldown',days:Math.ceil(wait/day),cost};
    if(!cost.residents)return {ok:false,reason:'noResidents',cost};
    if((this.scene.foodSystem?.availablePortions??0)<cost.food)return {ok:false,reason:'food',cost};
    if(this.scene.inventory.count('gold')<cost.gold)return {ok:false,reason:'gold',cost};
    return {ok:true,cost};
  }
  holdFeast(){
    const status=this.feastStatus();if(!status.ok)return false;const s=this.scene,day=s.gameTime?.dayDuration??120000;
    for(const w of this.residents())for(let i=0;i<FEAST.foodPerResident;i++)s.foodSystem?.eat?.(w,{source:'Feast'});
    s.inventory.spend('gold',status.cost.gold,{source:'Feast',type:'consumption'});
    this.lastFeastAt=this.now();this.feastUntil=this.now()+FEAST.days*day;
    s.eventFeed?.push?.(`feast:${this.lastFeastAt}`,t('policy.feastNotice'),{important:true});s.needs?.refresh?.();this.changed();return true;
  }
  feastBonus(){return this.feastUntil!==null&&this.now()<this.feastUntil?FEAST.happiness:0;}
  feastDaysLeft(){return this.feastBonus()?(this.feastUntil-this.now())/(this.scene.gameTime?.dayDuration??120000):0;}
  // Gold per day: Castle income, taxes and the average trade result of the last days, minus wages.
  balance(){
    const s=this.scene,castle=s.production?.dailyIncome?.().gold??0,wages=(s.workerSystem?.liveWorkers?.()??[]).reduce((n,w)=>n+(s.wageSystem?.dailyWage?.(w)??0),0);
    const days=(s.resourceLedger?.history??[]).slice(-POLICY_RULES.tradeAverageDays),trade=days.length?days.reduce((n,d)=>{const g=d.totals?.gold;return n+(g?.incomeBySource?.['Trade Sale']??0)-(g?.expensesBySource?.['Trade Purchase']??0);},0)/days.length:0;
    const taxes=this.dailyTaxes(),next=this.pending?this.dailyTaxes(this.pending.tax):null;
    return {castle,taxes,nextTaxes:next,trade,wages,total:castle+taxes+trade-wages,nextTotal:next===null?null:castle+next+trade-wages};
  }
  // Food per day (production − consumption from the food history) and how many days the stock lasts at these rations.
  food(){const o=this.scene.foodSystem?.overview?.();if(!o)return null;return {production:o.production,consumption:o.daily,net:o.production-o.daily,days:o.days};}
  exportState(){return {tax:this.tax,rations:this.rations,lastTaxDay:this.lastTaxDay,pending:this.pending?{...this.pending}:null,effect:this.effect,feastUntil:this.feastUntil,lastFeastAt:this.lastFeastAt};}
  importState(state){if(!state)return;this.tax=state.tax;this.rations=state.rations;this.lastTaxDay=state.lastTaxDay;this.pending=state.pending?{...state.pending}:null;this.effect=state.effect;this.feastUntil=state.feastUntil;this.lastFeastAt=state.lastFeastAt;this.changed();}
  destroy(){this.unsubscribe?.();this.unsubscribeAdvance?.();this.listeners.clear();}
}
