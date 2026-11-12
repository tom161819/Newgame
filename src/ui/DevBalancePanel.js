import { downloadSaveFailure } from '../systems/saveFailure.js';
import { t,onLanguageChange } from '../i18n/index.js';
import { DEV_MAIN_KEYS,DEV_ADVANCED_KEYS,DEV_FOREST_KEYS,DEV_LOOK_KEYS,devRange,DEV_QUICK,loadDevBalance,devMode,setDevMode,setDevFactor,resetDevBalance,devBalanceValues,devBalanceJSON,devBalanceChanged,devTooltipDelay,setDevTooltipDelay,onDevBalanceChange } from '../data/devBalance.js';
import { BUILDING_TOOLTIP } from '../data/buildingTooltip.js';
import { FrameProfiler,PROFILER_RULES } from '../systems/FrameProfiler.js';
import { arrivalForecast,economyOverview,forestOverview,addDevGold,addDevResources,advanceDevDay,summonDevCaravan,addDevResident } from '../systems/DevTools.js';

// m-91-asset-library-dev (owner point 88): the Dev tool. An icon right under the Settings icon opens a pop-up menu
// (click again or Esc closes): the coefficients of src/data/devBalance.js (saved in the save), the arrival forecast,
// an economy overview, quick actions, the building tooltip delay and the frame profiler (F8). "Show Dev tool" in
// Settings hides the icon (alpha default ON; replaces the 0.78 hidden 5-click unlock). Built here, no index.html markup.
const el=(doc,tag,props={},children=[])=>{const e=doc.createElement(tag);Object.assign(e,props);for(const c of children)e.append(c);return e;};
export const DEV_ACTIONS=Object.freeze(['gold','resources','day','caravan','resident','saveDump']);
export class DevBalancePanel {
  constructor(scene,{storage,document:doc=globalThis.document}={}){
    this.scene=scene;this.doc=doc;this.controller=new AbortController();loadDevBalance(storage);
    if(!doc?.querySelector)return;const options={signal:this.controller.signal},heading=doc.querySelector('#settings-panel [data-i18n="dev.title"]');
    // Settings: "Show Dev tool" (a browser preference).
    this.toggle=el(doc,'input',{type:'checkbox',id:'dev-mode-toggle'});this.toggle.setAttribute('role','switch');
    this.row=el(doc,'div',{id:'dev-mode-row',className:'setting-row dev-mode-row'},[el(doc,'label',{htmlFor:'dev-mode-toggle'}),this.toggle]);
    heading?.after(this.row);
    // The icon (a wrench) with a dot while any coefficient differs from ×1. FREE_REGIONS.devTool can place it freely.
    // The icon (a wrench, index.html so the UI config's free placement FREE_REGIONS.devTool reaches it) with a dot while
    // any coefficient differs from ×1. Created here when the markup has none (node tests).
    this.settingsButton=doc.querySelector('#settings-button');this.button=doc.querySelector('#dev-tool-button');
    if(!this.button){this.button=el(doc,'button',{type:'button',id:'dev-tool-button',className:'dev-tool-button'});this.button.setAttribute('aria-controls','dev-balance-panel');this.button.setAttribute('aria-expanded','false');
      this.button.append(el(doc,'span',{className:'dev-tool-dot',hidden:true}));this.createdButton=true;
      this.settingsButton?.after?this.settingsButton.after(this.button):doc.body?.append(this.button);}
    this.dot=this.button.querySelector('.dev-tool-dot')??this.button.children?.find?.(c=>c.className==='dev-tool-dot');
    this.panel=el(doc,'aside',{id:'dev-balance-panel',className:'dev-balance-panel',hidden:true});this.panel.setAttribute('aria-labelledby','dev-balance-title');
    this.title=el(doc,'h2',{id:'dev-balance-title'});this.close=el(doc,'button',{type:'button',id:'dev-balance-close',textContent:'×'});
    this.sliders=new Map();
    const slider=key=>{
      const r=devRange(key),input=el(doc,'input',{type:'range',min:String(r.min),max:String(r.max),step:String(r.step),id:`dev-balance-${key}`});input.dataset.devKey=key;
      const out=el(doc,'output',{htmlFor:input.id}),label=el(doc,'label',{htmlFor:input.id});
      input.addEventListener('input',()=>setDevFactor(key,+input.value),options);this.sliders.set(key,{input,out,label});
      return el(doc,'div',{className:'dev-balance-row'},[label,out,input]);
    };
    // Arrival first, with the forecast next to it.
    this.forecast=el(doc,'p',{id:'dev-arrival-forecast',className:'dev-arrival-forecast'});this.forecast.setAttribute('role','status');
    const arrival=el(doc,'div',{className:'dev-balance-arrival'},[slider('immigration'),this.forecast]);
    const list=el(doc,'div',{className:'dev-balance-sliders'},DEV_MAIN_KEYS.filter(k=>k!=='immigration').map(slider));
    this.advancedSummary=el(doc,'summary');this.advanced=el(doc,'details',{id:'dev-balance-advanced',className:'dev-balance-advanced'},[this.advancedSummary,...DEV_ADVANCED_KEYS.map(slider)]);
    // m-drevorubci-stromy: "Forest and wood" (saved and reset like the others).
    this.forestSummary=el(doc,'summary');this.forest=el(doc,'details',{id:'dev-balance-forest',className:'dev-balance-advanced dev-balance-forest'},[this.forestSummary,...DEV_FOREST_KEYS.map(slider)]);
    // m-plynule-prechody: "World look" – the season change (days, steps).
    this.lookSummary=el(doc,'summary');this.look=el(doc,'details',{id:'dev-balance-look',className:'dev-balance-advanced dev-balance-look'},[this.lookSummary,...DEV_LOOK_KEYS.map(slider)]);
    // Economy overview (read only).
    this.overviewHeading=el(doc,'h3',{className:'dev-balance-subheading'});this.overview=el(doc,'div',{id:'dev-balance-overview',className:'dev-balance-overview'});
    // Quick actions.
    this.actionsHeading=el(doc,'h3',{className:'dev-balance-subheading'});this.actionButtons=new Map();
    const quick=el(doc,'div',{className:'dev-balance-quick'},DEV_ACTIONS.map(id=>{const b=el(doc,'button',{type:'button',id:`dev-action-${id}`});b.dataset.devAction=id;b.addEventListener('click',()=>this.action(id),options);this.actionButtons.set(id,b);return b;}));
    // m-budovy-tooltip (86): the building tooltip delay (0.2–2 s).
    const range=BUILDING_TOOLTIP.devDelay;this.tooltipHeading=el(doc,'h3',{className:'dev-balance-subheading'});
    this.tooltipDelay=el(doc,'input',{type:'range',min:String(range.min),max:String(range.max),step:String(range.step),id:'dev-tooltip-delay'});
    this.tooltipOut=el(doc,'output',{htmlFor:'dev-tooltip-delay'});this.tooltipLabel=el(doc,'label',{htmlFor:'dev-tooltip-delay'});
    this.tooltipDelay.addEventListener('input',()=>setDevTooltipDelay(+this.tooltipDelay.value),options);
    const tooltipSection=el(doc,'div',{className:'dev-balance-tooltip'},[this.tooltipHeading,el(doc,'div',{className:'dev-balance-row'},[this.tooltipLabel,this.tooltipOut,this.tooltipDelay])]);
    this.reset=el(doc,'button',{type:'button',id:'dev-balance-reset'});this.copy=el(doc,'button',{type:'button',id:'dev-balance-copy'});this.status=el(doc,'span',{id:'dev-balance-status',className:'dev-balance-status'});this.status.setAttribute('role','status');
    // performance-1: the frame profiler (F8 or this button). Its table is a fixed overlay over the map.
    this.profileButton=el(doc,'button',{type:'button',id:'dev-profiler-toggle'});this.profileButton.setAttribute('aria-pressed','false');
    this.profileOut=el(doc,'pre',{id:'dev-profiler',className:'dev-profiler',hidden:true});this.profileOut.setAttribute('role','status');
    this.profiler=scene?.game?new FrameProfiler(scene.game,{scene:()=>this.scene}):null;
    this.panel.append(el(doc,'div',{className:'settings-heading'},[this.title,this.close]),arrival,list,this.advanced,this.forest,this.look,this.overviewHeading,this.overview,this.actionsHeading,quick,tooltipSection,el(doc,'div',{className:'dev-balance-actions'},[this.reset,this.copy,this.profileButton,this.status]));
    doc.body?.append(this.profileOut);doc.body?.append(this.panel);
    this.profileButton.addEventListener('click',()=>this.setProfiling(!this.profiler?.enabled),options);
    const view=doc.defaultView;
    view?.addEventListener('keydown',e=>{if(e.key==='F8'&&!e.repeat&&devMode()){e.preventDefault();this.setProfiling(!this.profiler?.enabled);}},options);
    // Esc closes the menu before the game's own Escape (Game Menu) sees it.
    view?.addEventListener('keydown',e=>{if(e.key==='Escape'&&!this.panel.hidden&&!doc.querySelector('dialog[open]')){e.preventDefault();e.stopImmediatePropagation?.();this.setOpen(false);}},{...options,capture:true});
    view?.addEventListener('resize',()=>this.position(),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.toggle.addEventListener('change',()=>setDevMode(this.toggle.checked),options);
    this.button.addEventListener('click',()=>this.setOpen(this.panel.hidden),options);
    this.close.addEventListener('click',()=>this.setOpen(false),options);
    this.reset.addEventListener('click',()=>{resetDevBalance();this.status.textContent=t('dev.tool.resetDone');},options);
    this.copy.addEventListener('click',()=>this.copyValues(),options);
    this.unsubscribeLanguage=onLanguageChange(()=>this.render());this.unsubscribeValues=onDevBalanceChange(()=>this.render());this.render();this.position();
    this.timer=setInterval(()=>{this.position();if(!this.panel.hidden)this.renderLive();},1000);
  }
  get open(){return !!this.panel&&!this.panel.hidden;}
  setOpen(on){if(!this.panel)return false;this.panel.hidden=!(on&&devMode());this.button.setAttribute('aria-expanded',String(!this.panel.hidden));if(!this.panel.hidden){this.position();this.renderLive();}return !this.panel.hidden;}
  // Right under the Settings icon (wherever the layout or free placement puts it), unless the icon itself is placed freely.
  position(){
    const b=this.button,s=this.settingsButton;if(!b?.getBoundingClientRect||!s?.getBoundingClientRect)return;
    const view=this.doc.defaultView,free=b.hasAttribute?.('data-ui-free'),r=s.getBoundingClientRect();
    if(!free&&r.width){b.style.left=`${Math.round(r.left+(r.width-b.offsetWidth)/2)}px`;b.style.top=`${Math.round(r.bottom+8)}px`;b.style.right='auto';}
    const ir=b.getBoundingClientRect();if(!ir.width||!view)return;const left=ir.left+ir.width/2<view.innerWidth/2,p=this.panel.style;
    const top=Math.max(8,Math.min(Math.round(ir.top-60),Math.round(view.innerHeight*.3)));p.top=`${top}px`;p.maxHeight=`${Math.max(160,view.innerHeight-top-12)}px`;
    if(left){p.left=`${Math.round(ir.right+8)}px`;p.right='auto';}else{p.right=`${Math.round(view.innerWidth-ir.left+8)}px`;p.left='auto';}
  }
  // A quick action: what it did goes to the status line (a limit says so).
  action(id){
    const s=this.scene;let message;
    if(id==='gold'){const n=addDevGold(s);message=n>0?t('dev.action.goldDone',{amount:Math.round(n)}):t('dev.action.limit');}
    else if(id==='resources'){const n=Object.values(addDevResources(s)).reduce((a,b)=>a+b,0);message=n>0?t('dev.action.resourcesDone',{amount:n}):t('dev.action.noRoom');}
    else if(id==='day')message=advanceDevDay(s)>0?t('dev.action.dayDone'):t('dev.action.failed');
    else if(id==='caravan')message=summonDevCaravan(s)?t('dev.action.caravanDone'):t('dev.action.noCaravan');
    else if(id==='saveDump')message=downloadSaveFailure()?t('dev.action.saveDumpDone'):t('dev.action.noSaveDump');
    else if(id==='resident')message=addDevResident(s)?t('dev.action.residentDone'):t('dev.action.noBed');
    this.status.textContent=message;this.renderLive();return message;
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
    this.toggle.checked=on;this.button.hidden=!on;if(!on){this.setOpen(false);if(this.profiler?.enabled)this.setProfiling(false);}
    this.row.querySelector('label').textContent=t('dev.mode');this.button.title=t('dev.tool.open');this.button.setAttribute('aria-label',t('dev.tool.open'));this.title.textContent=t('dev.tool.title');
    const changed=devBalanceChanged();this.dot.hidden=!changed;this.button.classList?.toggle?.('dev-tool-changed',changed);
    this.close.setAttribute('aria-label',t('dev.balance.close'));this.reset.textContent=t('dev.balance.reset');this.copy.textContent=t('dev.balance.copy');if(this.profileButton){this.profileButton.textContent=t('dev.profiler.toggle');this.profileButton.title=t('dev.profiler.hint');}
    this.advancedSummary.textContent=t('dev.tool.advanced');this.forestSummary.textContent=t('dev.tool.forest');this.lookSummary.textContent=t('dev.tool.look');this.overviewHeading.textContent=t('dev.tool.overview');this.actionsHeading.textContent=t('dev.tool.actions');
    for(const [id,b]of this.actionButtons)b.textContent=t(`dev.action.${id}`,{gold:DEV_QUICK.gold,amount:DEV_QUICK.resources});
    const values=devBalanceValues();for(const [key,{input,out,label}]of this.sliders){input.value=String(values[key]);out.textContent=key==='saplingChance'?`${Math.round(values[key]*100)} %`:key==='seasonDays'?t('dev.balance.days',{days:values[key]}):key==='seasonSteps'?String(values[key]):`×${values[key].toFixed(2)}`;label.textContent=t(`dev.balance.key.${key}`);}
    const delay=devTooltipDelay();this.tooltipDelay.value=String(delay);this.tooltipOut.textContent=t('dev.tooltip.value',{seconds:delay.toFixed(1)});this.tooltipLabel.textContent=t('dev.tooltip.delay');this.tooltipHeading.textContent=t('dev.tooltip.title');
    this.renderLive();
  }
  renderLive(){
    if(!this.forecast)return;const s=this.scene;
    if(s?.workerSystem){const f=arrivalForecast(s),limits=f.limits.map(l=>t(`dev.arrival.limit.${l.id}`,{percent:l.percent??0,beds:f.freeBeds}));
      this.forecast.textContent=`${t('dev.arrival.next',{hours:f.hours.toFixed(1),perDay:(Math.round(f.perDay*100)/100).toString()})} · ${limits.length?t('dev.arrival.limits',{list:limits.join(', ')}):t('dev.arrival.noLimit',{beds:f.freeBeds})}`;}
    else this.forecast.textContent='';
    this.renderOverview();
  }
  renderOverview(){
    if(!this.overview||!this.scene?.workerSystem){this.overview?.replaceChildren?.();return;}const doc=this.doc,o=economyOverview(this.scene),f=n=>(Math.round(n*10)/10).toString();
    const name=id=>this.scene.objectRegistry?.get?.(id)?.name??id,cell=v=>`+${f(v.income)} / −${f(v.expenses)}`;
    const head=el(doc,'tr',{},[el(doc,'th'),el(doc,'th',{textContent:o.day?t('dev.overview.lastDay',{day:o.day}):t('dev.overview.noDay')}),el(doc,'th',{textContent:o.days?t('dev.overview.average',{days:o.days}):'—'})]);
    const rows=[o.gold,...o.food,...o.materials].map(r=>el(doc,'tr',{},[el(doc,'th',{textContent:name(r.resource)}),el(doc,'td',{textContent:cell(r.last)}),el(doc,'td',{textContent:cell(r.average)})]));
    this.overview.replaceChildren(el(doc,'table',{},[el(doc,'tbody',{},[head,...rows])]),el(doc,'p',{textContent:t('dev.overview.people',{happiness:o.happiness??'—',unemployed:o.unemployed,residents:o.residents,beds:o.freeBeds})}),this.forestLine());
  }
  // m-drevorubci-stromy: mature / young trees in the Lumberjack Huts' radii and Wood a day (ledger, Ø of the closed days).
  forestLine(){const f=forestOverview(this.scene);return el(this.doc,'p',{id:'dev-forest-overview',textContent:t('dev.overview.forest',{huts:f.huts,mature:f.mature,young:f.young,wood:(Math.round(f.woodPerDay*10)/10).toString()})});}
  destroy(){this.controller.abort();clearInterval(this.timer);clearInterval(this.profileTimer);this.profiler?.destroy();this.profileOut?.remove();this.unsubscribeLanguage?.();this.unsubscribeValues?.();this.row?.remove();if(this.createdButton)this.button?.remove();else{this.button.hidden=true;this.dot.hidden=true;}this.panel?.remove();}
}
