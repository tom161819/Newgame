import { t } from '../i18n/index.js';
import { moodFor } from '../data/needs.js';
import { element } from './objectLabels.js';

// Owner request (7 Nov, plan m-horni-lista-prehled): the empty left part of the HUD's second row shows the kingdom at
// a glance – residents / housing room, unemployed, average mood – and on hover, focus or tap a panel with the average
// needs (happiness, food, rest, housing, safety), the mood and the Kingdom Attractiveness with what moves it. Values
// come from the existing systems (NeedsSystem statuses, WorkerSystem, KingdomAttractivenessSystem).
const tone=v=>v==null?'':v>=70?'good':v>=40?'warn':'bad';
export function kingdomOverview(scene){
  const workers=scene.workerSystem,needs=scene.needs,residents=workers?.liveSubjects?.()??[],homes=needs?.homes?.()??new Map();
  const statuses=residents.map(w=>needs?.status?.(w,homes)).filter(Boolean),avg=key=>statuses.length?Math.round(statuses.reduce((n,s)=>n+(s[key]??0),0)/statuses.length):null;
  const attraction=scene.attractiveness,factors=[];
  if(attraction){if(scene.foodSystem?.shortage)factors.push(['food',-40]);for(const [id,v] of attraction.modifiers??[])factors.push([id,v]);}
  const happiness=avg('happiness');
  return {population:residents.length,capacity:workers?.capacity?.()??residents.length,unemployed:residents.filter(w=>w.profession==='idle').length,
    happiness,mood:happiness==null?null:moodFor(happiness).id,food:avg('food'),rest:avg('rest'),housing:avg('housing'),safety:avg('safety'),
    attractiveness:attraction?Math.round(attraction.value):null,factors,settleBlock:attraction?.blockReason?.()??null};
}
export class KingdomOverview {
  constructor(scene,{document:doc=globalThis.document}={}){
    this.scene=scene;this.root=doc.querySelector('#kingdom-overview');this.panel=doc.querySelector('#kingdom-overview-panel');this.next=0;
    if(!this.root)return;this.abort=new AbortController();const options={signal:this.abort.signal},show=()=>{this.render(true);this.panel.hidden=false;},hide=()=>{this.panel.hidden=true;};
    this.root.addEventListener('pointerenter',show,options);this.root.addEventListener('pointerleave',hide,options);this.root.addEventListener('focus',show,options);this.root.addEventListener('blur',hide,options);
    this.root.addEventListener('click',()=>{if(this.panel.hidden)show();else hide();},options);
  }
  update(){const now=globalThis.performance?.now?.()??Date.now();if(now<this.next)return;this.next=now+500;this.render(!this.panel?.hidden);}
  render(withPanel=false){
    if(!this.root)return;const o=kingdomOverview(this.scene),doc=this.root.ownerDocument;
    const set=(id,text,tn)=>{const el=doc.querySelector(id);if(el.textContent!==text)el.textContent=text;el.dataset.tone=tn??'';};
    set('#overview-population',t('overview.population',{count:o.population,capacity:o.capacity}),o.population>=o.capacity?'warn':'');
    set('#overview-unemployed',t('overview.unemployed',{count:o.unemployed}),o.unemployed>0?'warn':'');
    set('#overview-mood',o.happiness==null?t('overview.moodNone'):t('overview.mood',{value:o.happiness}),tone(o.happiness));
    if(!withPanel)return;
    const row=(label,value,tn)=>{const r=element('div','overview-row');r.dataset.tone=tn??'';r.append(element('span','',label),element('strong','',value));return r;};
    const pct=v=>v==null?'—':`${v} %`;
    const rows=[element('h3','',t('overview.title')),
      row(t('overview.residents'),`${o.population} / ${o.capacity}`),row(t('overview.unemployedLabel'),String(o.unemployed),o.unemployed?'warn':''),
      element('h4','',t('overview.needs')),
      ...['happiness','food','rest','housing','safety'].map(k=>row(t(`overview.need.${k}`),pct(o[k]),tone(o[k]))),
      row(t('overview.moodLabel'),o.mood?t(`needs.mood.${o.mood}`):'—',tone(o.happiness))];
    if(o.attractiveness!=null){rows.push(element('h4','',t('overview.attractiveness')),row(t('overview.attractivenessValue'),`${o.attractiveness} %`,tone(o.attractiveness)));
      for(const [id,v] of o.factors)rows.push(row(t(`overview.factor.${id}`),v>0?`+${v}`:String(v),v<0?'bad':'good'));
      if(o.settleBlock)rows.push(element('p','overview-block',t(`overview.settleBlock.${o.settleBlock}`)));}
    this.panel.replaceChildren(...rows);
  }
  destroy(){this.abort?.abort();}
}

// The "?" help button: until the player first opens the help (or for the first 10 minutes of game time) a soft arrow
// under it bobs and glows slowly (CSS, no flashing; static with reduced motion). Once opened it never comes back
// (kept in this browser).
const HELP_SEEN='newgame.helpSeen';
export const helpSeen=(storage=globalThis.localStorage)=>{try{return storage?.getItem(HELP_SEEN)==='1';}catch{return false;}};
export const markHelpSeen=(storage=globalThis.localStorage)=>{try{storage?.setItem(HELP_SEEN,'1');}catch{}};
export class HelpArrow {
  constructor(scene,{document:doc=globalThis.document,storage=globalThis.localStorage,minutes=10}={}){
    this.scene=scene;this.storage=storage;this.limit=minutes*60000;this.arrow=doc.querySelector('#help-arrow');this.button=doc.querySelector('#help-toggle');
    this.abort=new AbortController();this.button?.addEventListener('click',()=>{markHelpSeen(this.storage);this.update();},{signal:this.abort.signal});this.update();
  }
  visible(){return !helpSeen(this.storage)&&!this.button?.hidden&&(this.scene.gameTime?.totalElapsed??0)<this.limit;}
  update(){if(!this.arrow)return;const show=this.visible();if(this.arrow.hidden===show)this.arrow.hidden=!show;}
  destroy(){this.abort.abort();}
}
