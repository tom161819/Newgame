import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { RATIONS,taxHappiness,rationFoodBase } from '../data/policy.js';
import { NEEDS } from '../data/needs.js';
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
    $('feast')?.addEventListener('click',()=>{if(scene.policy.holdFeast())scene.updateInventory?.();this.render();},options);
    this.unsubscribe=scene.policy.onChange(()=>this.render());this.render();
    // The overview follows the day (income, food, Happiness): refreshed every second while the Castle panel is open.
    this.timer=setInterval(()=>{if(!this.tax.closest('[hidden]'))this.render();},1000);
  }
  signed(n){return `${n>0?'+':n<0?'−':''}${Math.abs(n)}`;}
  money(n){const v=Math.round(n*100)/100;return `${v>0?'+':v<0?'−':''}${Math.abs(v).toFixed(2)}`;}
  // Owner 20 Nov 2026 (87): under each slider only what it does a day and its Happiness; the overview has three folding
  // blocks (Gold, Food, Happiness), each with its total first and its parts below; a fold is remembered.
  rows(role,list){const ul=this.$(`${role}-rows`);if(!ul)return;const key=JSON.stringify(list);if(ul.dataset.key===key)return;ul.dataset.key=key;
    ul.replaceChildren(...list.map(([label,value,tone])=>{const li=element('li','');const a=element('span','',label),b=element('span','policy-row-value',value);if(tone)li.dataset.tone=tone;li.append(a,b);return li;}));}
  tone(n){return n>1e-9?'positive':n<-1e-9?'negative':'neutral';}
  render(){
    if(!this.tax)return;const p=this.scene.policy;
    for(const slider of this.sliders??[])slider.render();
    const rationsHappiness=Math.round((rationFoodBase(p.rations)-RATIONS.normal.food)*NEEDS.weights.food);
    this.$('tax-effect').textContent=t('policy.taxLine',{total:p.dailyTaxes().toFixed(2),happiness:this.signed(Math.round(taxHappiness(p.tax)))});
    const eaten=this.scene.foodSystem?.dailyConsumption??p.residents().length*p.portions();
    this.$('rations-effect').textContent=t('policy.rationsLine',{portions:(Math.round(eaten*10)/10).toString(),happiness:this.signed(rationsHappiness)});
    const b=p.balance(),gold=this.$('gold');if(gold){gold.textContent=this.money(b.total);gold.dataset.tone=this.tone(b.total);
      this.rows('gold',[[t('policy.row.castle'),this.money(b.castle),this.tone(b.castle)],[t('policy.row.taxes'),this.money(b.taxes),this.tone(b.taxes)],[t('policy.row.trade'),this.money(b.trade),this.tone(b.trade)],[t('policy.row.wages'),this.money(-b.wages),this.tone(-b.wages)]]);}
    const f=p.food(),food=this.$('food');if(food){if(f){const net=Math.round(f.net*10)/10;food.textContent=`${net>0?'+':net<0?'−':''}${Math.abs(net).toFixed(1)}`;food.dataset.tone=this.tone(net);
      this.rows('food',[[t('policy.row.produced'),`+${f.production.toFixed(1)}`,'positive'],[t('policy.row.eaten'),`−${f.consumption.toFixed(1)}`,'negative'],[t('policy.row.days'),Number.isFinite(f.days)?t('policy.row.daysValue',{days:Math.floor(f.days),count:Math.floor(f.days)}):'∞','']]);}else{food.textContent='';this.rows('food',[]);}}
    const summary=this.scene.needs?.summary?.(),now=summary?.happiness,box=this.$('happiness');
    if(box){if(now==null){box.textContent=t('policy.happinessNone');this.rows('happiness',[]);}else{
      const change=p.target()-p.happiness(),days=Math.ceil(Math.abs(change)/5-1e-9),next=Math.max(0,Math.min(100,Math.round(now+change)));box.textContent=String(now);box.dataset.tone=now>=60?'positive':now<40?'negative':'neutral';
      const list=[[t('policy.row.taxEffect'),this.signed(Math.round(p.happiness())),this.tone(p.happiness())],[t('policy.row.rationsEffect'),this.signed(rationsHappiness),this.tone(rationsHappiness)]];
      if(p.feastBonus())list.push([t('policy.row.feast'),this.signed(p.feastBonus()),'positive']);
      list.push([t('policy.row.forecast'),Math.abs(change)<.5?t('policy.row.steady'):t('policy.row.forecastValue',{next,days,count:days}),'']);this.rows('happiness',list);}}
    // Policy v2 P3: the Feast button with its cost, or why it cannot be held now.
    const feast=p.feastStatus(),button=this.$('feast');if(button){button.disabled=!feast.ok;this.$('feast-status').textContent=p.feastBonus()?t('policy.feastRunning',{days:p.feastDaysLeft().toFixed(1)}):feast.ok?t('policy.feastCost',feast.cost):t(`policy.feastNo.${feast.reason}`,{days:feast.days??0,count:feast.days??0,...feast.cost});}
    const risk=this.$('risk');if(risk){risk.hidden=!summary?.atRisk;if(summary?.atRisk)risk.textContent=t('policy.risk',{count:summary.atRisk});}
  }
  destroy(){this.controller.abort();this.unsubscribe?.();clearInterval(this.timer);for(const slider of this.sliders??[])slider.destroy();}
}
