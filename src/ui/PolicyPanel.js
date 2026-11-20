import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { RATIONS,taxHappiness } from '../data/policy.js';
import { createPolicySlider } from './PolicySliders.js';

// #103: the Kingdom policy section of the Castle panel (tax rate and food rations with their effects).
export class PolicyPanel {
  // `root` is the Kingdom policy section: the Castle panel's (default) or the Kingdom Policy card's copy. Parts are found by
  // data-policy roles inside it, so both show the same policy with the same code; only the Castle's sliders keep the old ids.
  constructor(scene,{root=document.querySelector('section.kingdom-policy'),ids=true}={}){
    this.root=root;const $=role=>root?.querySelector(`[data-policy="${role}"]`)??null;this.$=$;
    this.scene=scene;this.controller=new AbortController();const taxSlot=$('tax-slot'),rationSlot=$('rations-slot');
    if(!taxSlot||!rationSlot||!scene.policy)return;const options={signal:this.controller.signal};
    // Owner request (7 Nov): sliders with level icons instead of the two selects (see PolicySliders.js).
    this.sliders=[createPolicySlider(scene,'tax',{id:ids?'policy-tax':null}),createPolicySlider(scene,'rations',{id:ids?'policy-rations':null})];taxSlot.replaceChildren(this.sliders[0].root);rationSlot.replaceChildren(this.sliders[1].root);
    this.tax=this.sliders[0].input;this.rations=this.sliders[1].input;
    $('cancel')?.addEventListener('click',()=>scene.policy.cancel(),options);
    $('feast')?.addEventListener('click',()=>{if(scene.policy.holdFeast())scene.updateInventory?.();this.render();},options);
    this.unsubscribe=scene.policy.onChange(()=>this.render());this.render();
    // The overview follows the day (income, food, Happiness): refreshed every second while the Castle panel is open.
    this.timer=setInterval(()=>{if(!this.tax.closest('[hidden]'))this.render();},1000);
  }
  signed(n){return `${n>0?'+':n<0?'−':''}${Math.abs(n)}`;}
  money(n){const v=Math.round(n*100)/100;return `${v>0?'+':v<0?'−':''}${Math.abs(v).toFixed(2)}`;}
  render(){
    if(!this.tax)return;const p=this.scene.policy;
    for(const slider of this.sliders??[])slider.render();
    // Owner 19 Nov 2026: the line follows the slider – the chosen rate (in force from tomorrow when it is pending).
    const residents=p.residents().length,rate=p.pending?.tax??p.tax,ration=RATIONS[p.rations],later=rate!==p.tax;
    this.$('tax-effect').textContent=t(later?'policy.taxEffectTomorrow':'policy.taxEffect',{each:rate.toFixed(2),total:p.dailyTaxes(rate).toFixed(2),count:residents,happiness:this.signed(Math.round(taxHappiness(rate)))});
    this.$('rations-effect').textContent=t('policy.rationsEffect',{portions:ration.portions,base:ration.food});
    // Policy v2 P1: what changes tomorrow, the daily balance, the Happiness forecast and the strike risk.
    const pending=this.$('pending');if(!pending)return;pending.hidden=!p.pending;
    if(p.pending){const changes=[];if(p.pending.tax!==p.tax)changes.push(t('policy.pendingTax',{tax:p.pending.tax.toFixed(2)}));if(p.pending.rations!==p.rations)changes.push(t('policy.pendingRations',{rations:t(`policy.rations.${p.pending.rations}`)}));this.$('pending-text').textContent=t('policy.fromTomorrow',{changes:changes.join(', ')});}
    const b=p.balance();this.$('gold').textContent=t('policy.goldBalance',{castle:this.money(b.castle),taxes:this.money(b.taxes),trade:this.money(b.trade),wages:this.money(-b.wages),total:this.money(b.total)})+(b.nextTotal!==null&&b.nextTotal!==b.total?` ${t('policy.goldTomorrow',{total:this.money(b.nextTotal)})}`:'');
    const f=p.food();this.$('food').textContent=f?t('policy.foodBalance',{produced:f.production.toFixed(1),eaten:f.consumption.toFixed(1),net:this.money(f.net).replace(/\.(\d)\d$/,'.$1'),days:Number.isFinite(f.days)?Math.floor(f.days):'∞'}):'';
    const summary=this.scene.needs?.summary?.(),now=summary?.happiness;
    const target=p.pending?p.target(p.pending):p.target(),change=target-p.happiness(),days=Math.ceil(Math.abs(change)/5-1e-9)+(p.pending?1:0);
    this.$('happiness').textContent=now==null?t('policy.happinessNone'):Math.abs(change)<.5?t('policy.happinessSteady',{now}):t('policy.happinessForecast',{now,next:Math.max(0,Math.min(100,Math.round(now+change))),days});
    // Policy v2 P3: the Feast button with its cost, or why it cannot be held now.
    const feast=p.feastStatus(),button=this.$('feast');if(button){button.disabled=!feast.ok;this.$('feast-status').textContent=p.feastBonus()?t('policy.feastRunning',{days:p.feastDaysLeft().toFixed(1)}):feast.ok?t('policy.feastCost',feast.cost):t(`policy.feastNo.${feast.reason}`,{days:feast.days??0,count:feast.days??0,...feast.cost});}
    const risk=this.$('risk');risk.hidden=!summary?.atRisk;if(summary?.atRisk)risk.textContent=t('policy.risk',{count:summary.atRisk});
  }
  destroy(){this.controller.abort();this.unsubscribe?.();clearInterval(this.timer);for(const slider of this.sliders??[])slider.destroy();}
}
