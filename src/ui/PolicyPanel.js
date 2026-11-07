import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { TAX_RATES,RATIONS } from '../data/policy.js';

// #103: the Kingdom policy section of the Castle panel (tax rate and food rations with their effects).
export class PolicyPanel {
  constructor(scene){
    this.scene=scene;this.tax=document.querySelector('#policy-tax');this.rations=document.querySelector('#policy-rations');this.controller=new AbortController();
    if(!this.tax||!this.rations)return;const options={signal:this.controller.signal};
    this.tax.addEventListener('change',()=>scene.policy.set('tax',this.tax.value),options);this.rations.addEventListener('change',()=>scene.policy.set('rations',this.rations.value),options);
    document.querySelector('#policy-cancel')?.addEventListener('click',()=>scene.policy.cancel(),options);
    this.unsubscribe=scene.policy.onChange(()=>this.render());this.render();
    // The overview follows the day (income, food, Happiness): refreshed every second while the Castle panel is open.
    this.timer=setInterval(()=>{if(!this.tax.closest('[hidden]'))this.render();},1000);
  }
  signed(n){return `${n>0?'+':n<0?'−':''}${Math.abs(n)}`;}
  money(n){const v=Math.round(n*100)/100;return `${v>0?'+':v<0?'−':''}${Math.abs(v).toFixed(2)}`;}
  render(){
    if(!this.tax)return;const p=this.scene.policy;
    this.tax.replaceChildren(...Object.keys(TAX_RATES).map(id=>{const o=element('option','',t(`policy.tax.${id}`));o.value=id;return o;}));this.tax.value=p.pending?.tax??p.tax;
    this.rations.replaceChildren(...Object.keys(RATIONS).map(id=>{const o=element('option','',t(`policy.rations.${id}`));o.value=id;return o;}));this.rations.value=p.pending?.rations??p.rations;
    const residents=p.residents().length,rate=TAX_RATES[p.tax],ration=RATIONS[p.rations];
    document.querySelector('#policy-tax-effect').textContent=t('policy.taxEffect',{each:rate.perResident.toFixed(2),total:p.dailyTaxes().toFixed(2),count:residents,happiness:this.signed(rate.happiness)});
    document.querySelector('#policy-rations-effect').textContent=t('policy.rationsEffect',{portions:ration.portions,happiness:this.signed(ration.happiness)});
    // Policy v2 P1: what changes tomorrow, the daily balance, the Happiness forecast and the strike risk.
    const pending=document.querySelector('#policy-pending');if(!pending)return;pending.hidden=!p.pending;
    if(p.pending){const changes=[];if(p.pending.tax!==p.tax)changes.push(t('policy.pendingTax',{tax:t(`policy.tax.${p.pending.tax}`)}));if(p.pending.rations!==p.rations)changes.push(t('policy.pendingRations',{rations:t(`policy.rations.${p.pending.rations}`)}));document.querySelector('#policy-pending-text').textContent=t('policy.fromTomorrow',{changes:changes.join(', ')});}
    const b=p.balance();document.querySelector('#policy-gold').textContent=t('policy.goldBalance',{castle:this.money(b.castle),taxes:this.money(b.taxes),trade:this.money(b.trade),wages:this.money(-b.wages),total:this.money(b.total)})+(b.nextTotal!==null&&b.nextTotal!==b.total?` ${t('policy.goldTomorrow',{total:this.money(b.nextTotal)})}`:'');
    const f=p.food();document.querySelector('#policy-food').textContent=f?t('policy.foodBalance',{produced:f.production.toFixed(1),eaten:f.consumption.toFixed(1),net:this.money(f.net).replace(/\.(\d)\d$/,'.$1'),days:Number.isFinite(f.days)?Math.floor(f.days):'∞'}):'';
    const summary=this.scene.needs?.summary?.(),now=summary?.happiness;
    const target=p.pending?p.target(p.pending):p.target(),change=target-p.happiness(),days=Math.ceil(Math.abs(change)/5-1e-9)+(p.pending?1:0);
    document.querySelector('#policy-happiness').textContent=now==null?t('policy.happinessNone'):Math.abs(change)<.5?t('policy.happinessSteady',{now}):t('policy.happinessForecast',{now,next:Math.max(0,Math.min(100,Math.round(now+change))),days});
    const risk=document.querySelector('#policy-risk');risk.hidden=!summary?.atRisk;if(summary?.atRisk)risk.textContent=t('policy.risk',{count:summary.atRisk});
  }
  destroy(){this.controller.abort();this.unsubscribe?.();clearInterval(this.timer);}
}
