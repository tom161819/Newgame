import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { TAX_RATES,RATIONS } from '../data/policy.js';

// #103: the Kingdom policy section of the Castle panel (tax rate and food rations with their effects).
export class PolicyPanel {
  constructor(scene){
    this.scene=scene;this.tax=document.querySelector('#policy-tax');this.rations=document.querySelector('#policy-rations');this.controller=new AbortController();
    if(!this.tax||!this.rations)return;const options={signal:this.controller.signal};
    this.tax.addEventListener('change',()=>scene.policy.set('tax',this.tax.value),options);this.rations.addEventListener('change',()=>scene.policy.set('rations',this.rations.value),options);
    this.unsubscribe=scene.policy.onChange(()=>this.render());this.render();
  }
  signed(n){return `${n>0?'+':''}${n}`;}
  render(){
    if(!this.tax)return;const p=this.scene.policy;
    this.tax.replaceChildren(...Object.keys(TAX_RATES).map(id=>{const o=element('option','',t(`policy.tax.${id}`));o.value=id;return o;}));this.tax.value=p.tax;
    this.rations.replaceChildren(...Object.keys(RATIONS).map(id=>{const o=element('option','',t(`policy.rations.${id}`));o.value=id;return o;}));this.rations.value=p.rations;
    const residents=p.residents().length,rate=TAX_RATES[p.tax],ration=RATIONS[p.rations];
    document.querySelector('#policy-tax-effect').textContent=t('policy.taxEffect',{each:rate.perResident.toFixed(2),total:p.dailyTaxes().toFixed(2),count:residents,happiness:this.signed(rate.happiness)});
    document.querySelector('#policy-rations-effect').textContent=t('policy.rationsEffect',{portions:ration.portions,happiness:this.signed(ration.happiness)});
  }
  destroy(){this.controller.abort();this.unsubscribe?.();}
}
