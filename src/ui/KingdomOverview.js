import { t } from '../i18n/index.js';
import { moodFor,NEEDS } from '../data/needs.js';
import { element } from './objectLabels.js';
import { placeBottomLeft,fromDom,readBarCollapsed,writeBarCollapsed } from './hudLayout.js';

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
  // m-prehled-procenta-tooltip: what stands behind the percentages (for the explanations on hover).
  const w=NEEDS.weights,part=key=>statuses.length?statuses.reduce((n,s)=>n+(s[key]??0),0)/statuses.length*w[key]:0,parts={food:part('food'),rest:part('rest'),housing:part('housing'),safety:part('safety')};
  const weighted=parts.food+parts.rest+parts.housing+parts.safety,count=test=>statuses.filter(test).length;
  const detail={parts:Object.fromEntries(Object.entries(parts).map(([k,v])=>[k,Math.round(v)])),other:happiness==null?0:Math.round(happiness-weighted),
    hungry:count(s=>s.food<NEEDS.food.low),tired:count(s=>s.rest<NEEDS.rest.low),housed:count(s=>s.housing>=100),unhoused:count(s=>s.housing<100),unsafe:count(s=>s.safety<50),residents:statuses.length,
    seats:scene.workplaceSystem?.employees?(scene.buildings??[]).reduce((n,b)=>{const spec=scene.objectRegistry?.get?.(b.type)?.workplace;if(!spec||b.construction&&b.construction.state!=='complete')return n;return n+Math.max(0,(spec.capacity??0)-scene.workplaceSystem.employees(b).length);},0):0};
  return {detail,population:residents.length,capacity:workers?.capacity?.()??residents.length,unemployed:residents.filter(w=>w.profession==='idle').length,
    happiness,mood:happiness==null?null:moodFor(happiness).id,food:avg('food'),rest:avg('rest'),housing:avg('housing'),safety:avg('safety'),
    attractiveness:attraction?Math.round(attraction.value):null,factors,settleBlock:attraction?.blockReason?.()??null};
}
// m-prehled-kralovstvi-pozice (plan point 81, owner 9 Nov): the overview is no longer a popup under the top bar but a
// permanent bar in the bottom-left corner of the map (#kingdom-bar), always in the same place, never over the camera
// chips, Notices, minimap, side buttons or the open building strip (hudLayout.placeBottomLeft). It folds to a one-line
// strip (kept in this browser); the summary chips in the top bar toggle it. Values as before (kingdomOverview()).
// m-prehled-procenta-tooltip (owner, 12 Nov): for every value of the overview, what it is and how it is worked out
// (with the current numbers), what moves it now, and at most one tip – the lines of its hover text.
export function overviewExplain(o){
  const d=o.detail,sign=v=>v>0?`+${v}`:String(v),lines={};if(!d)return lines;
  const worst=Object.entries(NEEDS.weights).map(([k,weight])=>({k,loss:weight*(100-(o[k]??100))})).sort((a,b)=>b.loss-a.loss)[0];
  lines.residents=[t('explain.residents',{count:o.population,capacity:o.capacity}),o.population>=o.capacity?t('explain.tip.capacity'):null];
  lines.unemployed=[t('explain.unemployed',{count:o.unemployed,seats:d.seats}),o.unemployed>3?t('explain.tip.unemployed'):null];
  if(o.happiness!=null){
    lines.happiness=[t('explain.happiness',{value:o.happiness,count:d.residents}),t('explain.happinessParts',{food:d.parts.food,rest:d.parts.rest,housing:d.parts.housing,safety:d.parts.safety,other:sign(d.other)}),t('explain.happinessWeights'),
      worst&&worst.loss>=5?t(`explain.tip.${worst.k}`,{count:worst.k==='housing'?d.unhoused:worst.k==='food'?d.hungry:worst.k==='rest'?d.tired:d.unsafe}):null];
    lines.food=[t('explain.food',{value:o.food}),t('explain.foodNow',{hungry:d.hungry,count:d.residents}),d.hungry||o.food<70?t('explain.tip.food',{count:d.hungry}):null];
    lines.rest=[t('explain.rest',{value:o.rest}),t('explain.restNow',{tired:d.tired,housed:d.housed,unhoused:d.unhoused}),o.rest<70?t('explain.tip.rest',{count:d.tired}):null];
    lines.housing=[t('explain.housing',{value:o.housing,housed:d.housed,count:d.residents}),d.unhoused?t('explain.tip.housing',{count:d.unhoused}):null];
    lines.safety=[t('explain.safety',{value:o.safety}),t('explain.safetyRule',{base:NEEDS.safety.base,castle:NEEDS.safety.castle.bonus,tower:NEEDS.safety.tower.bonus,guard:NEEDS.safety.guard.bonus,attack:NEEDS.safety.attack.penalty}),o.safety<70?t('explain.tip.safety',{count:d.unsafe}):null];
  }
  for(const k of Object.keys(lines))lines[k]=lines[k].filter(Boolean);
  return lines;
}
export const KINGDOM_BAR_AVOID='.inventory,.camera-controls,#notices-panel,#event-feed,#minimap,#unit-command-bar,#settings-button,#dev-tool-button,.population-tab,.buildings-panel';
export function kingdomBarSummary(o){return [t('overview.population',{count:o.population,capacity:o.capacity}),o.happiness==null?t('overview.moodNone'):t('overview.mood',{value:o.happiness})].join(' · ');}
export class KingdomOverview {
  constructor(scene,{document:doc=globalThis.document,storage=globalThis.localStorage}={}){
    this.scene=scene;this.storage=storage;this.root=doc.querySelector('#kingdom-overview');this.bar=doc.querySelector('#kingdom-bar');this.next=0;this.nextPlace=0;
    if(!this.root)return;this.abort=new AbortController();const options={signal:this.abort.signal};
    this.root.addEventListener('click',()=>this.setCollapsed(!this.collapsed),options);
    this.root.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();this.setCollapsed(!this.collapsed);}},options);
    if(this.bar){
      this.body=doc.querySelector('#kingdom-bar-body');this.toggle=doc.querySelector('#kingdom-bar-toggle');this.summary=doc.querySelector('#kingdom-bar-summary');
      this.toggle?.addEventListener('click',()=>this.setCollapsed(!this.collapsed),options);
      // Clicks on the bar stay off the map (no King walking there).
      for(const type of ['pointerdown','mousedown','mouseup','click','wheel'])this.bar.addEventListener(type,event=>event.stopPropagation(),options);
      globalThis.addEventListener?.('resize',()=>this.place(),options);doc.addEventListener('hud-layout',()=>this.place(),options);
      this.bar.hidden=false;
    }
    this.setCollapsed(readBarCollapsed(storage),{persist:false});
  }
  setCollapsed(value,{persist=true}={}){
    this.collapsed=!!value;if(persist)writeBarCollapsed(this.collapsed,this.storage);
    this.root?.setAttribute('aria-expanded',String(!this.collapsed));
    if(this.bar){this.bar.classList.toggle('collapsed',this.collapsed);this.toggle?.setAttribute('aria-expanded',String(!this.collapsed));if(this.body)this.body.hidden=this.collapsed;}
    this.render();this.place();
  }
  update(){const now=globalThis.performance?.now?.()??Date.now();if(now>=this.nextPlace){this.nextPlace=now+200;this.place();}if(now<this.next)return;this.next=now+500;this.render();}
  // Keeps the bar in the corner, clear of what else is there now (the building strip, a moved Notices bar, …).
  place(){
    const bar=this.bar,view=bar?.parentElement?.getBoundingClientRect?.();if(!bar||bar.hidden||!view?.width)return;
    const doc=bar.ownerDocument,obstacles=[...doc.querySelectorAll(KINGDOM_BAR_AVOID)].filter(el=>!el.hidden&&!bar.contains(el)&&el.getClientRects().length).map(el=>fromDom(el.getBoundingClientRect())).filter(r=>r.right>view.left&&r.left<view.right&&r.bottom>view.top&&r.top<view.bottom);
    const box=placeBottomLeft({view:fromDom(view),size:{width:bar.offsetWidth,height:bar.offsetHeight},obstacles,margin:20});// 20: the map reaches the window edge (9 Nov 2026)
    const left=`${Math.round(box.left-view.left)}px`,bottom=`${Math.round(view.bottom-box.bottom)}px`;
    if(bar.style.left!==left)bar.style.left=left;if(bar.style.bottom!==bottom)bar.style.bottom=bottom;
  }
  render(){
    if(!this.root)return;const o=kingdomOverview(this.scene),doc=this.root.ownerDocument;
    const set=(id,text,tn)=>{const el=doc.querySelector(id);if(!el)return;if(el.textContent!==text)el.textContent=text;el.dataset.tone=tn??'';};
    set('#overview-population',t('overview.population',{count:o.population,capacity:o.capacity}),o.population>=o.capacity?'warn':'');
    set('#overview-unemployed',t('overview.unemployed',{count:o.unemployed}),o.unemployed>0?'warn':'');
    set('#overview-mood',o.happiness==null?t('overview.moodNone'):t('overview.mood',{value:o.happiness}),tone(o.happiness));
    {const lines=overviewExplain(o);for(const [id,k] of [['#overview-population','residents'],['#overview-unemployed','unemployed'],['#overview-mood','happiness']]){const el=doc.querySelector(id),text=lines[k]?.join('\n')??'';if(el&&el.title!==text&&!el.matches?.(':hover'))el.title=text;}}
    if(!this.bar)return;const label=t(this.collapsed?'overview.expand':'overview.collapse');
    if(this.toggle&&this.toggle.title!==label){this.toggle.title=label;this.root.title=label;}
    if(this.summary){const text=kingdomBarSummary(o);if(this.summary.textContent!==text)this.summary.textContent=text;this.summary.dataset.tone=tone(o.happiness);}
    if(this.collapsed||!this.body)return;
    const row=(label,value,tn,title)=>{const r=element('div','overview-row');r.dataset.tone=tn??'';if(title)r.title=title;r.append(element('span','',label),element('strong','',value));return r;};
    const pct=v=>v==null?'—':`${v} %`;
    const why=overviewExplain(o),tip=k=>why[k]?.join('\n')||undefined;
    const rows=[row(t('overview.bar.residents'),`${o.population} / ${o.capacity}`,o.population>=o.capacity?'warn':'',tip('residents')??t('overview.residents')),row(t('overview.unemployedLabel'),String(o.unemployed),o.unemployed?'warn':'',tip('unemployed')),
      ...['happiness','food','rest','housing','safety'].map(k=>row(t(`overview.need.${k}`),pct(o[k]),tone(o[k]),tip(k))),
      row(t('overview.moodLabel'),o.mood?t(`needs.mood.${o.mood}`):'—',tone(o.happiness))];
    if(o.attractiveness!=null){
      const factors=o.factors.map(([id,v])=>`${t(`overview.factor.${id}`)} ${v>0?`+${v}`:v}`).join('\n');
      rows.push(row(t('overview.bar.attractiveness'),`${o.attractiveness} %`,tone(o.attractiveness),[t('overview.attractiveness'),t('overview.attractivenessValue'),factors].filter(Boolean).join('\n')));
      if(o.settleBlock)rows.push(element('p','overview-block',t(`overview.settleBlock.${o.settleBlock}`)));
    }
    // Rebuilt only when a value changed, so the 0.5 s refresh does not wake the UI config observer for nothing.
    const key=rows.map(r=>`${r.textContent}|${r.dataset?.tone??''}|${r.title??''}`).join('#');if(key===this.drawn)return;this.drawn=key;
    // m-prehled-tooltip-mizi (owner 14 Nov 2026): the browser hides a hover text whenever its element is replaced or its
    // `title` changes, so with a percentage moving every half second the explanation could not be read. While the
    // pointer is over the list, the rows stay and only their values change; the hover text is renewed afterwards.
    const old=[...this.body.children];
    if(this.body.matches?.(':hover')&&old.length===rows.length&&old.every((r,i)=>r.tagName===rows[i].tagName)){
      old.forEach((r,i)=>{const next=rows[i];r.dataset.tone=next.dataset.tone??'';if(r.children.length&&r.children.length===next.children.length)[...r.children].forEach((c,j)=>{const text=next.children[j].textContent;if(c.textContent!==text)c.textContent=text;});else if(r.textContent!==next.textContent)r.textContent=next.textContent;});
      this.drawn=null;return;
    }
    this.body.replaceChildren(...rows);
  }
  destroy(){this.abort?.abort();if(this.bar){this.bar.hidden=true;this.body?.replaceChildren();this.drawn=null;}}
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
