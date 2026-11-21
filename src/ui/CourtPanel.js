import { t } from '../i18n/index.js';
import { cornerStack } from './EventFeed.js';
import { GameTip,tipRow } from './KingdomOverview.js';
import { COURT } from '../data/court.js';
import { playChime } from './sound.js';

// m-pribeh-vlci-ujezd F1: the King's trust in the HUD ("King's trust 40 · Calm", the bands in the hover text) and a
// folding card with the orders from court: what to hand over, days left, what it brings or costs, and a button.
export function courtTrustLabel(court){return t('court.trust.label',{trust:court.trust,band:t(`court.band.${court.band}`)});}
export function courtTrustTip(court){
  const b=COURT.bands,rows=[['favour',`${b.favour}–100`],['calm',`${b.calm}–${b.favour-1}`],['suspicion',`${b.suspicion}–${b.calm-1}`],['displeasure',`${b.displeasure}–${b.suspicion-1}`],['wrath',`0–${b.displeasure-1}`]];
  const lines=[t('court.trust.tip')];for(const [id,range] of rows)lines.push(tipRow(`${id===court.band?'▶ ':''}${t(`court.band.${id}`)} (${range})`,t(`court.band.${id}.effect`)));
  if(court.countdownDay!=null)lines.push(t('court.countdown',{days:Math.max(0,court.countdownDay-court.day)}));
  return lines.join('\n');
}
export function orderDaysText(court,order){const left=order.due-court.day;return left>=0?t('court.order.days',{days:left}):t('court.order.late',{days:Math.max(0,order.grace-court.day)});}
export function orderStakes(order){
  const parts=[t('court.order.gain',{n:COURT.met[order.kind]})];if(order.reward)parts.push(t('goals.res.gold',{n:order.reward}));
  const loss=COURT.failed[order.kind];if(loss)parts.push(t('court.order.loss',{n:loss}));return parts.join(' · ');
}
export class CourtPanel {
  constructor(scene,court,{document:doc=globalThis.document}={}){
    this.scene=scene;this.court=court;this.doc=doc;this.signature='';this.next=0;
    this.hud=doc?.querySelector?.('#court-trust')??null;
    if(this.hud){this.abort=new AbortController();this.tip=new GameTip(doc,[this.hud],{signal:this.abort.signal});}
    this.root=doc.createElement('details');this.root.id='court-orders';this.root.className='royal-goals court-orders';this.root.open=true;
    this.summary=doc.createElement('summary');this.list=doc.createElement('ol');this.list.className='royal-goals-list';this.root.append(this.summary,this.list);
    cornerStack(doc)?.prepend(this.root);
    this.click=event=>{const b=event.target?.closest?.('button[data-court]');if(!b||b.disabled)return;event.preventDefault?.();
      const done=b.dataset.court==='atone'?this.court.atone():this.court.fulfil(Number(b.dataset.court));if(done)playChime('goal');this.render(true);};
    this.root.addEventListener('click',this.click);
    this.off=court.on(type=>{if(type==='order'||type==='failed'||type==='expedition'){this.root.open=true;this.root.classList.remove('goal-flash');void this.root.offsetWidth;this.root.classList.add('goal-flash');}this.render(true);});
    this.render(true);
  }
  update(){const now=globalThis.performance?.now?.()??Date.now();if(now<this.next)return;this.next=now+500;this.render();}
  render(force=false){
    const c=this.court,shown=c.active&&!this.scene.tutorial?.active;
    if(this.hud){this.hud.hidden=!c.active;if(c.active){const label=courtTrustLabel(c),tip=courtTrustTip(c);if(this.hud.textContent!==label)this.hud.textContent=label;
      if(this.hud.dataset.tip!==tip){this.hud.dataset.tip=tip;this.hud.setAttribute('aria-label',label);this.tip?.refresh();}this.hud.dataset.band=c.band;}}
    const signature=JSON.stringify([shown,c.revision,c.day,c.trust,c.orders.map(o=>[o.id,c.canFulfil(o)]),c.canAtone(),!!c.expedition]);
    if(!force&&signature===this.signature)return;this.signature=signature;
    this.root.hidden=!shown||(!c.orders.length&&c.countdownDay==null&&!c.expedition&&c.seq===0);
    this.summary.textContent=`${t('court.title')} · ${c.orders.length}`;
    const items=[],el=(tag,cls,text)=>{const e=this.doc.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;};
    if(c.expedition)items.push(el('li','royal-goal court-alert',t('court.expedition.on')));
    else if(c.countdownDay!=null){const li=el('li','royal-goal court-alert');li.append(el('strong','',t('court.countdown',{days:Math.max(0,c.countdownDay-c.day)})));
      const b=el('button','court-button',t('court.atone',{gold:c.atonementCost()}));b.type='button';b.dataset.court='atone';b.disabled=!c.canAtone();li.append(b);items.push(li);}
    for(const order of c.orders){
      const li=el('li','royal-goal court-order');li.dataset.order=String(order.id);if(c.day>order.due)li.classList.add('court-late');
      const b=el('button','court-button',t('court.order.hand'));b.type='button';b.dataset.court=String(order.id);b.disabled=!c.canFulfil(order);
      li.append(el('strong','',c.orderText(order)),el('span','royal-goal-count',orderDaysText(c,order)),el('small','',orderStakes(order)),b);items.push(li);
    }
    if(!items.length)items.push(el('li','royal-goal all-done',t('court.none',{days:Math.max(0,c.nextOrderDay-c.day)})));
    this.list.replaceChildren(...items);
  }
  relabel(){this.render(true);}
  destroy(){this.off?.();this.abort?.abort();this.tip?.destroy();this.root.removeEventListener('click',this.click);this.root.remove();}
}
