import { WIKI_NOTICE_TOPICS } from '../data/wiki.js';
import { wikiInfoButton } from './WikiPanel.js';
import { hireUnemployed } from './jobChange.js';
import { t } from '../i18n/index.js';
import { NOTICE_CATEGORIES } from '../data/diagnostics.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { element } from './objectLabels.js';
import { noticeText } from './noticeText.js';
import { NOTICE_BAR,NoticeBarState,readCollapsed,writeCollapsed,mergeNotices } from './noticeBar.js';

const MUTED_KEY='newgame.notices.muted';
const readMuted=()=>{try{const list=JSON.parse(localStorage.getItem(MUTED_KEY)??'[]');return new Set(Array.isArray(list)?list.filter(c=>NOTICE_CATEGORIES.includes(c)):[]);}catch{return new Set();}};
// Right-bottom notices: lasting production and work problems. Each can be dismissed (until its next reminder) and
// whole categories can be muted. Clicking one opens the building's panel when the building is in sight.
const NOTICE_HIRES=Object.freeze({noBuilder:'builder',waitingMaterial:'hauler',pileNoHauler:'hauler'});
export class NoticesPanel {
  constructor(scene){
    this.scene=scene;this.panel=document.querySelector('#notices-panel');this.list=document.querySelector('#notices-list');this.filters=document.querySelector('#notices-filters');this.muted=readMuted();
    this.controller=new AbortController();const options={signal:this.controller.signal};
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.panel.addEventListener('click',event=>{
      // m-tipy-mimo-listu: a tip folded into the bar opens again on a click; its × drops it.
      const dropTip=event.target.closest('[data-dismiss-tip]')?.dataset.dismissTip;if(dropTip){scene.tutorial?.dropTip?.(dropTip);return;}
      const tip=event.target.closest('[data-notice-tip]')?.dataset.noticeTip;if(tip){scene.tutorial?.reopenTip?.(tip);return;}
      // m-drobnosti-083: a merged row closes all its notices.
      const dismiss=event.target.closest('[data-dismiss-notice]')?.dataset.dismissNotice;if(dismiss){for(const key of dismiss.split(' '))scene.diagnostics.dismiss(key);return;}
      const category=event.target.closest('[data-notice-category]')?.dataset.noticeCategory;if(category){if(this.muted.has(category))this.muted.delete(category);else this.muted.add(category);try{localStorage.setItem(MUTED_KEY,JSON.stringify([...this.muted]));}catch{/* still works without storage */}this.render();return;}
      const action=event.target.closest('[data-notice-action]')?.dataset.noticeAction;if(action){if(!hireUnemployed(scene,action))scene.populationSidebar?.setOpen(true);scene.diagnostics.recheck?.();return;}
      const target=event.target.closest('[data-notice-entity]');if(target?.dataset.noticeReason==='noBuilder'&&scene.employmentPanel){scene.employmentPanel.open();return;}const open=target?.dataset.noticeEntity;if(open)this.openEntity(Number(open));
    },options);
    // Request 28: a right click collapses the card (PanelDismiss); a click on its title opens it again. Page only.
    // m-notice-bar-zasunuti (owner point 80): collapsed, the bar slides away to the right edge (CSS, ~0.3 s) and leaves
    // a tab with an arrow and "!" for unread notices; a new notice slides out one message for 4 s. Remembered in the
    // browser. The fold button in the header slides it away.
    this.title=document.querySelector('#notices-title');this.title?.addEventListener('click',()=>this.setCollapsed(!this.collapsed),options);
    this.bar=new NoticeBarState({collapsed:readCollapsed()});this.timer=null;this.clearTimer=null;
    this.toggle=element('button','notices-toggle');this.toggle.type='button';this.toggle.id='notices-toggle';this.toggle.addEventListener('click',()=>this.setCollapsed(true),options);
    this.tab=element('button','notices-tab');this.tab.type='button';this.tab.id='notices-tab';this.tab.addEventListener('click',()=>this.setCollapsed(false),options);
    // The one message of a peek: a click opens it like a row (the panel's click handler reads its data).
    this.peek=element('button','notices-peek');this.peek.type='button';this.peek.id='notices-peek';this.peek.hidden=true;
    this.title?.before(this.toggle);this.panel.prepend(this.tab);this.panel.append(this.peek);
    this.panel.addEventListener('pointerenter',()=>this.bar.hover(true,this.now()),options);
    this.panel.addEventListener('pointerleave',()=>{this.bar.hover(false,this.now());this.schedule();},options);
    // The side tabs (Policy / Population / Employments) are placed in JS on resize; the edge tab follows after them.
    globalThis.addEventListener?.('resize',()=>requestAnimationFrame(()=>this.placeTab()),options);
    this.setCollapsed(this.bar.collapsed,{persist:false});
    this.unsubscribe=scene.diagnostics.onChange(()=>this.render());this.render();
  }
  now(){return globalThis.performance?.now?.()??Date.now();}
  setCollapsed(value,{persist=true}={}){
    this.collapsed=this.bar.setCollapsed(value);this.panel.classList.toggle('collapsed',this.collapsed);this.title?.setAttribute('aria-expanded',String(!this.collapsed));
    if(persist)writeCollapsed(this.collapsed);this.drawPeek();this.drawToggle();this.placeTab();
  }
  // Slid away, the tab's right side sits at the game view's right edge (not past it: the panel border is counted) –
  // unless a side tab (Policy / Population / Employments, fixed at the right edge) is at the same height: then it sits
  // just left of the side tabs so neither covers the other (small window heights). Peeking it stays next to the peek.
  placeTab(){
    const tab=this.tab,stack=this.panel.parentElement;if(!stack||tab.hidden||this.panel.hidden||!this.collapsed){tab.style.removeProperty('--notices-tab-shift');return;}
    const panel=this.panel.getBoundingClientRect(),view=(this.panel.closest('.viewport')??stack).getBoundingClientRect();if(!panel.height)return;
    // Slid away the panel's left side is at the corner stack's right + 12 px (the CSS translate); the tab's right side
    // is the panel's padding edge minus the shift.
    const base=stack.getBoundingClientRect().right+12+this.panel.clientLeft,top=panel.top+this.panel.clientTop,height=tab.offsetHeight||30,width=tab.offsetWidth||28,gap=4;
    let right=Math.min(base,view.right);
    const sides=[...document.querySelectorAll('.population-tab')].map(el=>el.getBoundingClientRect()).filter(r=>r.width&&r.height).sort((a,b)=>b.left-a.left);
    for(const r of sides)if(r.top<top+height+gap&&r.bottom>top-gap&&r.left<right+gap&&r.right>right-width-gap)right=r.left-gap;
    tab.style.setProperty('--notices-tab-shift',`${Math.round(base-right)}px`);
  }
  drawToggle(){
    const unread=this.bar.unread,alert=this.bar.alert;
    this.toggle.textContent='▸';const fold=t('notice.collapse');this.toggle.title=fold;this.toggle.setAttribute('aria-label',fold);this.toggle.setAttribute('aria-expanded',String(!this.collapsed));
    this.tab.replaceChildren(element('span','notices-tab-arrow','◂'));this.tab.classList.toggle('has-unread',alert);this.tab.hidden=!this.collapsed;this.tab.setAttribute('aria-expanded',String(!this.collapsed));
    if(alert)this.tab.append(element('span','notices-alert','!'),element('span','notices-unread',unread>9?'9+':String(unread)));
    const label=alert?`${t('notice.expand')} – ${t('notice.unread',{count:unread})}`:t('notice.expand');this.tab.title=label;this.tab.setAttribute('aria-label',label);
  }
  // The peek: the bar out to one message; after it ends the bar slides back and the text is cleared once it is away.
  drawPeek(){
    const peek=this.collapsed?this.bar.peek:null;clearTimeout(this.clearTimer);this.panel.classList.toggle('peeking',!!peek);
    if(peek){
      const issue=peek.issue;this.peek.replaceChildren(element('span','notices-peek-text',this.text(issue)));if(peek.more>0)this.peek.append(element('span','notices-more',t('notice.more',{count:peek.more})));
      this.peek.dataset.noticeEntity=issue.entityId;this.peek.dataset.noticeReason=issue.reason;if(issue.tip)this.peek.dataset.noticeTip=issue.tip;else delete this.peek.dataset.noticeTip;this.peek.dataset.severity=issue.severity??'warning';this.peek.hidden=false;this.schedule();
    }else if(!this.peek.hidden)this.clearTimer=setTimeout(()=>{this.peek.hidden=true;this.peek.replaceChildren();},this.collapsed?NOTICE_BAR.slideMs:0);
    this.placeTab();
  }
  // Page timers (UI only, not game time): the peek ends after its time unless the pointer holds it.
  schedule(){
    clearTimeout(this.timer);const peek=this.bar.peek;if(!peek||!this.collapsed)return;
    this.timer=setTimeout(()=>{if(this.bar.expire(this.now()))this.drawPeek();else this.schedule();},Math.max(50,peek.until-this.now()+10));
  }
  text(issue){return issue.tip?`${t('tips.label')}: ${issue.text}`:noticeText(this.scene,issue);}
  openEntity(id){
    const s=this.scene,building=s.buildings.find(b=>b.id===id);if(!building||!s.fog.isVisibleObject(building))return;
    if(!buildingIsComplete(building))s.constructionUI?.open(building);else if(buildingDefinition(building).workplace)s.workplacePanel.open(building);
  }
  render(){
    const visible=this.scene.diagnostics.active().filter(issue=>!this.muted.has(issue.category)),tips=this.scene.tutorial?.parkedTips?.()??[];
    this.filters.replaceChildren(...NOTICE_CATEGORIES.map(category=>{const button=element('button','notice-filter',t(`notice.category.${category}`));button.type='button';button.dataset.noticeCategory=category;button.setAttribute('aria-pressed',String(!this.muted.has(category)));return button;}));
    this.list.replaceChildren(...mergeNotices(visible,issue=>this.text(issue)).map(({issue,text,keys,count:merged})=>{
      const row=element('li',`notice notice-${issue.category}`),open=element('button','notice-text',text),close=element('button','notice-dismiss','×');
      // m-drobnosti-083: the same text for several buildings is one row "×2"; request 72: a notice that kept coming back
      // stays one row with a count.
      if(merged>1){const count=element('span','notice-count notice-merged',t('notice.merged',{count:merged}));count.title=t('notice.mergedTip',{count:merged});open.append(' ',count);}
      else if((issue.count??1)>1){const count=element('span','notice-count',t('notice.repeated',{count:issue.count}));count.title=t('notice.repeatedTip',{count:issue.count});open.append(' ',count);}
      open.type=close.type='button';open.dataset.noticeEntity=issue.entityId;open.dataset.noticeReason=issue.reason;close.dataset.dismissNotice=keys.join(' ');close.setAttribute('aria-label',t('notice.dismiss'));row.dataset.noticeKey=issue.key;
      // A notice that one more Builder or Hauler fixes offers that hire right in the row.
      const hire=NOTICE_HIRES[issue.reason];if(hire){const button=element('button','notice-action',t(`notice.hire.${hire}`));button.type='button';button.dataset.noticeAction=hire;row.append(open,button,close);}else row.append(open,close);
      // m-wiki-napoveda: a notice with a Wiki topic has a small "i" that opens it.
      const topic=WIKI_NOTICE_TOPICS[issue.reason];if(topic)close.before(wikiInfoButton(this.scene,topic));return row;
    }),...tips.map(tip=>{
      const row=element('li','notice notice-tip'),open=element('button','notice-text',this.text(tip)),close=element('button','notice-dismiss','×');
      open.type=close.type='button';open.dataset.noticeTip=tip.tip;open.title=t('tips.reopen');close.dataset.dismissTip=tip.tip;close.setAttribute('aria-label',t('notice.dismiss'));row.dataset.noticeKey=tip.key;row.append(open,close);return row;
    }));
    // The panel stays visible while categories are muted so they can be switched back on.
    if(this.bar.observe([...visible,...tips],this.now()))this.drawPeek();this.drawToggle();
    // Slid away, the tab stays while it has unread notices (or a peek is out).
    this.panel.hidden=!visible.length&&!tips.length&&!this.muted.size&&!this.bar.alert&&!this.bar.peek;this.placeTab();
  }
  destroy(){clearTimeout(this.timer);clearTimeout(this.clearTimer);this.controller.abort();this.unsubscribe();}
}
