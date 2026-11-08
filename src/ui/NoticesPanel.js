import { WIKI_NOTICE_TOPICS } from '../data/wiki.js';
import { wikiInfoButton } from './WikiPanel.js';
import { hireUnemployed } from './jobChange.js';
import { t } from '../i18n/index.js';
import { NOTICE_CATEGORIES } from '../data/diagnostics.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { element } from './objectLabels.js';
import { noticeText } from './noticeText.js';

const MUTED_KEY='newgame.notices.muted';
const readMuted=()=>{try{const list=JSON.parse(localStorage.getItem(MUTED_KEY)??'[]');return new Set(Array.isArray(list)?list.filter(c=>NOTICE_CATEGORIES.includes(c)):[]);}catch{return new Set();}};
// Right-bottom notices: lasting production and work problems. Each can be dismissed (until its next reminder) and
// whole categories can be muted. Clicking one opens the building's panel when the building is in sight.
const NOTICE_HIRES=Object.freeze({noBuilder:'builder',waitingMaterial:'hauler'});
export class NoticesPanel {
  constructor(scene){
    this.scene=scene;this.panel=document.querySelector('#notices-panel');this.list=document.querySelector('#notices-list');this.filters=document.querySelector('#notices-filters');this.muted=readMuted();
    this.controller=new AbortController();const options={signal:this.controller.signal};
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.panel.addEventListener('click',event=>{
      const dismiss=event.target.closest('[data-dismiss-notice]')?.dataset.dismissNotice;if(dismiss){scene.diagnostics.dismiss(dismiss);return;}
      const category=event.target.closest('[data-notice-category]')?.dataset.noticeCategory;if(category){if(this.muted.has(category))this.muted.delete(category);else this.muted.add(category);try{localStorage.setItem(MUTED_KEY,JSON.stringify([...this.muted]));}catch{/* still works without storage */}this.render();return;}
      const action=event.target.closest('[data-notice-action]')?.dataset.noticeAction;if(action){if(!hireUnemployed(scene,action))scene.populationSidebar?.setOpen(true);scene.diagnostics.recheck?.();return;}
      const target=event.target.closest('[data-notice-entity]');if(target?.dataset.noticeReason==='noBuilder'&&scene.employmentPanel){scene.employmentPanel.open();return;}const open=target?.dataset.noticeEntity;if(open)this.openEntity(Number(open));
    },options);
    // Request 28: a right click collapses the card (PanelDismiss); a click on its title opens it again. Page only.
    this.title=document.querySelector('#notices-title');this.title?.addEventListener('click',()=>this.setCollapsed(!this.collapsed),options);this.setCollapsed(false);
    this.unsubscribe=scene.diagnostics.onChange(()=>this.render());this.render();
  }
  setCollapsed(value){this.collapsed=!!value;this.panel.classList.toggle('collapsed',this.collapsed);this.title?.setAttribute('aria-expanded',String(!this.collapsed));}
  text(issue){return noticeText(this.scene,issue);}
  openEntity(id){
    const s=this.scene,building=s.buildings.find(b=>b.id===id);if(!building||!s.fog.isVisibleObject(building))return;
    if(!buildingIsComplete(building))s.constructionUI?.open(building);else if(buildingDefinition(building).workplace)s.workplacePanel.open(building);
  }
  render(){
    const visible=this.scene.diagnostics.active().filter(issue=>!this.muted.has(issue.category));
    this.filters.replaceChildren(...NOTICE_CATEGORIES.map(category=>{const button=element('button','notice-filter',t(`notice.category.${category}`));button.type='button';button.dataset.noticeCategory=category;button.setAttribute('aria-pressed',String(!this.muted.has(category)));return button;}));
    this.list.replaceChildren(...visible.map(issue=>{
      const row=element('li',`notice notice-${issue.category}`),open=element('button','notice-text',this.text(issue)),close=element('button','notice-dismiss','×');
      open.type=close.type='button';open.dataset.noticeEntity=issue.entityId;open.dataset.noticeReason=issue.reason;close.dataset.dismissNotice=issue.key;close.setAttribute('aria-label',t('notice.dismiss'));row.dataset.noticeKey=issue.key;
      // A notice that one more Builder or Hauler fixes offers that hire right in the row.
      const hire=NOTICE_HIRES[issue.reason];if(hire){const button=element('button','notice-action',t(`notice.hire.${hire}`));button.type='button';button.dataset.noticeAction=hire;row.append(open,button,close);}else row.append(open,close);
      // m-wiki-napoveda: a notice with a Wiki topic has a small "i" that opens it.
      const topic=WIKI_NOTICE_TOPICS[issue.reason];if(topic)close.before(wikiInfoButton(this.scene,topic));return row;
    }));
    // The panel stays visible while categories are muted so they can be switched back on.
    this.panel.hidden=!visible.length&&!this.muted.size;
  }
  destroy(){this.controller.abort();this.unsubscribe();}
}
