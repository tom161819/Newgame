import { t,onLanguageChange } from '../i18n/index.js';
import { DEV_BALANCE_KEYS,DEV_BALANCE_RANGE,DEV_UNLOCK,loadDevBalance,devMode,setDevMode,devFactor,setDevFactor,resetDevBalance,devBalanceValues,devBalanceJSON } from '../data/devBalance.js';
import { FOOD_ECONOMY_DAYS } from '../data/seasons.js';
import { FrameProfiler,PROFILER_RULES } from '../systems/FrameProfiler.js';

// m-jidlo-balanc: the hidden Dev mode switch (5 clicks on the version line in Settings) and the Balance panel with the
// multipliers of src/data/devBalance.js. Built here (no index.html markup), invisible unless Dev mode is on.
const el=(doc,tag,props={},children=[])=>{const e=doc.createElement(tag);Object.assign(e,props);for(const c of children)e.append(c);return e;};
export function devBalanceOverview(scene){
  const p=scene.policy,food=p?.food?.()??null,gold=p?.balance?.()??null,fs=scene.foodSystem,day=fs?.time?.day??1;
  const history=fs?.history??[],eaten=history.length?history.reduce((n,r)=>n+r.consumed,0)/Math.min(day,FOOD_ECONOMY_DAYS):0;
  const wood=scene.resourceLedger?.summary?.('wood'),workers=scene.workerSystem?.liveSubjects?.()??[];
  return {foodIn:food?.production??0,foodOut:eaten,foodStock:fs?.availablePortions??0,woodIn:wood?.income??0,woodOut:wood?.expenses??0,
    gold:gold?.total??0,taxes:gold?.taxes??0,wages:gold?.wages??0,happiness:scene.needs?.summary?.()?.happiness??null,idle:workers.filter(w=>w.profession==='idle').length,residents:workers.length};
}
export class DevBalancePanel {
  constructor(scene,{storage,document:doc=globalThis.document}={}){
    this.scene=scene;this.doc=doc;this.clicks=[];this.controller=new AbortController();loadDevBalance(storage);
    if(!doc?.querySelector)return;const options={signal:this.controller.signal},heading=doc.querySelector('#settings-panel [data-i18n="dev.title"]');
    this.toggle=el(doc,'input',{type:'checkbox',id:'dev-mode-toggle'});this.toggle.setAttribute('role','switch');
    this.open=el(doc,'button',{type:'button',id:'dev-balance-open'});
    this.row=el(doc,'div',{id:'dev-mode-row',className:'setting-row dev-mode-row'},[el(doc,'label',{htmlFor:'dev-mode-toggle'}),this.toggle,this.open]);
    heading?.after(this.row);
    this.panel=el(doc,'aside',{id:'dev-balance-panel',className:'dev-balance-panel',hidden:true});this.panel.setAttribute('aria-labelledby','dev-balance-title');
    this.title=el(doc,'h2',{id:'dev-balance-title'});this.close=el(doc,'button',{type:'button',id:'dev-balance-close',textContent:'×'});
    this.sliders=new Map();const list=el(doc,'div',{className:'dev-balance-sliders'});
    for(const key of DEV_BALANCE_KEYS){
      const input=el(doc,'input',{type:'range',min:String(DEV_BALANCE_RANGE.min),max:String(DEV_BALANCE_RANGE.max),step:String(DEV_BALANCE_RANGE.step),id:`dev-balance-${key}`});input.dataset.devKey=key;
      const out=el(doc,'output',{htmlFor:input.id}),label=el(doc,'label',{htmlFor:input.id});
      input.addEventListener('input',()=>{setDevFactor(key,+input.value);this.render();},options);
      list.append(el(doc,'div',{className:'dev-balance-row'},[label,out,input]));this.sliders.set(key,{input,out,label});
    }
    this.overview=el(doc,'pre',{id:'dev-balance-overview',className:'dev-balance-overview'});
    this.reset=el(doc,'button',{type:'button',id:'dev-balance-reset'});this.copy=el(doc,'button',{type:'button',id:'dev-balance-copy'});this.status=el(doc,'span',{id:'dev-balance-status',className:'dev-balance-status'});this.status.setAttribute('role','status');
    // performance-1: the frame profiler (Dev mode only; F8 or this button). Its table is a fixed overlay over the map.
    this.profileButton=el(doc,'button',{type:'button',id:'dev-profiler-toggle'});this.profileButton.setAttribute('aria-pressed','false');
    this.profileOut=el(doc,'pre',{id:'dev-profiler',className:'dev-profiler',hidden:true});this.profileOut.setAttribute('role','status');
    this.profiler=scene?.game?new FrameProfiler(scene.game,{scene:()=>this.scene}):null;
    this.panel.append(el(doc,'div',{className:'settings-heading'},[this.title,this.close]),list,this.overview,el(doc,'div',{className:'dev-balance-actions'},[this.reset,this.copy,this.profileButton,this.status]));
    doc.body?.append(this.profileOut);
    this.profileButton.addEventListener('click',()=>this.setProfiling(!this.profiler?.enabled),options);
    doc.defaultView?.addEventListener('keydown',e=>{if(e.key==='F8'&&!e.repeat&&devMode()){e.preventDefault();this.setProfiling(!this.profiler?.enabled);}},options);
    doc.body?.append(this.panel);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    // Unlock: DEV_UNLOCK.clicks clicks on the version line within DEV_UNLOCK.unlockMs reveal the switch.
    doc.querySelector('#settings-panel .settings-version')?.addEventListener('click',()=>{const now=Date.now();this.clicks=[...this.clicks.filter(c=>now-c<DEV_UNLOCK.unlockMs),now];if(this.clicks.length>=DEV_UNLOCK.clicks){this.clicks=[];this.unlocked=true;this.render();}},options);
    this.toggle.addEventListener('change',()=>{setDevMode(this.toggle.checked);if(!devMode())this.panel.hidden=true;this.render();},options);
    this.open.addEventListener('click',()=>{this.panel.hidden=!this.panel.hidden;this.render();},options);
    this.close.addEventListener('click',()=>{this.panel.hidden=true;},options);
    this.reset.addEventListener('click',()=>{resetDevBalance();this.render();},options);
    this.copy.addEventListener('click',()=>this.copyValues(),options);
    this.unlocked=devMode();this.unsubscribeLanguage=onLanguageChange(()=>this.render());this.render();
    this.timer=setInterval(()=>{if(!this.panel.hidden)this.renderOverview();},1000);
  }
  setProfiling(on){
    if(!this.profiler)return false;on=on===true&&devMode();this.profiler.setEnabled(on);clearInterval(this.profileTimer);this.profileTimer=null;
    this.profileOut.hidden=!on;this.profileButton.setAttribute('aria-pressed',String(on));if(!on)this.profileOut.textContent='';
    if(on)this.profileTimer=setInterval(()=>{this.profileOut.textContent=this.profiler.text();},PROFILER_RULES.refreshMs);
    return on;
  }
  async copyValues(){
    const text=devBalanceJSON();this.lastCopied=text;
    try{await globalThis.navigator?.clipboard?.writeText(text);this.status.textContent=t('dev.balance.copied');}catch{this.status.textContent=t('dev.balance.copyFailed');}
  }
  render(){
    if(!this.row)return;const on=devMode();
    this.row.hidden=!(this.unlocked||on);this.toggle.checked=on;this.open.hidden=!on;if(!on){this.panel.hidden=true;if(this.profiler?.enabled)this.setProfiling(false);}
    this.row.querySelector('label').textContent=t('dev.mode');this.open.textContent=t('dev.balance.open');this.title.textContent=t('dev.balance.title');
    this.close.setAttribute('aria-label',t('dev.balance.close'));this.reset.textContent=t('dev.balance.reset');this.copy.textContent=t('dev.balance.copy');if(this.profileButton){this.profileButton.textContent=t('dev.profiler.toggle');this.profileButton.title=t('dev.profiler.hint');}
    const values=devBalanceValues();for(const [key,{input,out,label}]of this.sliders){input.value=String(values[key]);out.textContent=`${values[key].toFixed(2)}×`;label.textContent=t(`dev.balance.key.${key}`);}
    this.renderOverview();
  }
  renderOverview(){
    if(!this.overview)return;const o=devBalanceOverview(this.scene),f=n=>(Math.round(n*10)/10).toFixed(1);
    this.overview.textContent=t('dev.balance.overview',{foodIn:f(o.foodIn),foodOut:f(o.foodOut),foodNet:f(o.foodIn-o.foodOut),foodStock:Math.floor(o.foodStock),woodIn:f(o.woodIn),woodOut:f(o.woodOut),gold:f(o.gold),taxes:f(o.taxes),wages:f(o.wages),happiness:o.happiness??'—',idle:o.idle,residents:o.residents,consumption:devFactor('consumption').toFixed(2)});
  }
  destroy(){this.controller.abort();clearInterval(this.timer);clearInterval(this.profileTimer);this.profiler?.destroy();this.profileOut?.remove();this.unsubscribeLanguage?.();this.row?.remove();this.panel?.remove();}
}
