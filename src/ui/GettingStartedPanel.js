import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { gettingStartedProgress } from '../systems/GettingStarted.js';
import { guideText } from '../data/guide.js';
import { language } from '../i18n/index.js';

// Owner request 7 Nov 2026: Getting started, a checklist of the first buildings. A step ticks itself when its building is
// completed. Owner 9 Nov 2026 ("začínáme úkoly → přesuň doprava pod tenhle panel, udělej na to nové zvláštní okno,
// půjde zasunout"): no longer a modal dialog behind the "?" button but its own window docked at the right under the top
// bar. Its heading folds it to a one-line strip (title and progress); the browser remembers the choice.
export const HELP_WINDOW=Object.freeze({storageKey:'newgame.gettingStarted.collapsed',gap:8});
export function readHelpCollapsed(storage=globalThis.localStorage){try{return storage?.getItem(HELP_WINDOW.storageKey)==='1';}catch{return false;}}
export function writeHelpCollapsed(value,storage=globalThis.localStorage){try{storage?.setItem(HELP_WINDOW.storageKey,value?'1':'0');return true;}catch{return false;}}
export class GettingStartedPanel {
  constructor(scene,{storage=globalThis.localStorage}={}){
    this.scene=scene;this.storage=storage;this.dialog=document.querySelector('#help-dialog');this.count=document.querySelector('#help-count');
    this.list=document.querySelector('#help-steps');this.summary=document.querySelector('#help-summary');
    this.controller=new AbortController();const options={signal:this.controller.signal};
    this.dialog.open=!readHelpCollapsed(storage);
    // The summary toggles the <details>; the choice is kept per browser.
    this.dialog.addEventListener('toggle',()=>{writeHelpCollapsed(!this.dialog.open,this.storage);this.place();},options);
    for(const e of ['pointerdown','mousedown','mouseup','wheel'])this.dialog.addEventListener(e,ev=>ev.stopPropagation(),options);
    // Owner 15 Nov 2026: a task opens the place where it is done (the build menu, Population → job, the king).
    this.list.addEventListener('click',event=>{const id=event.target.closest('[data-help-step]')?.dataset.helpStep;if(id)this.showTask(id);},options);
    this.refresh=()=>this.update();scene.events?.on('buildings:changed',this.refresh);
    // Docked just under the top bar, whose height changes with its rows and the "More" details.
    this.place=()=>{const bar=document.querySelector('.inventory'),view=this.dialog.offsetParent;if(!bar||!view)return;
      const top=Math.round(bar.getBoundingClientRect().bottom-view.getBoundingClientRect().top+HELP_WINDOW.gap);
      if(this.dialog.style.top!==`${top}px`)this.dialog.style.top=`${top}px`;};
    if(typeof ResizeObserver!=='undefined'){this.observer=new ResizeObserver(()=>this.place());const bar=document.querySelector('.inventory');if(bar)this.observer.observe(bar);}
    window.addEventListener('resize',this.place,options);
    // Jobs, the selected king and found water are not building events: the list is checked once a second too.
    this.timer=setInterval(()=>this.update(),1000);
    this.dialog.hidden=false;this.update();this.place();
  }
  progress(){
    const s=this.scene,flags=s.guideFlags??={};
    if(s.unitSelection?.king)flags.king=true;
    const progress=gettingStartedProgress(s);if(progress.steps.some(step=>step.kind==='water'&&step.done))flags.water=true;return progress;
  }
  // Owner 15 Nov 2026: when every task is done the panel goes away for the rest of the game.
  update(){const progress=this.progress();const key=JSON.stringify(progress.steps.map(s=>s.done))+language();if(key!==this.lastKey||progress.allDone!==this.lastAllDone){this.lastKey=key;this.render(progress);}this.lastAllDone=progress.allDone;this.dialog.hidden=progress.allDone;return progress;}
  render(progress=this.progress()){
    this.summary.textContent=progress.allDone?t('help.allSet'):t('help.progress',{done:progress.doneCount,total:progress.total});
    this.summary.classList.toggle('help-all-set',progress.allDone);
    this.count.textContent=`${progress.doneCount} / ${progress.total}`;this.dialog.classList.toggle('all-done',progress.allDone);
    this.dialog.title=progress.allDone?t('help.button'):t('help.buttonPending',{done:progress.doneCount,total:progress.total});
    this.list.replaceChildren(...progress.steps.map((step,index)=>{
      const item=element('li',`help-step${step.done?' done':''}${step.id===progress.current?' current':''}`);item.dataset.helpStep=step.id;
      if(step.id===progress.current)item.setAttribute('aria-current','step');
      const button=element('button','help-step-button');button.type='button';if(step.buildingId)button.dataset.helpBuilding=step.buildingId;
      const mark=element('span','help-step-mark',step.done?'✓':String(index+1));mark.setAttribute('aria-hidden','true');
      const text=element('span','help-step-text');text.append(element('strong','',guideText(step.title,language())??t(`help.step.${step.id}`)),element('small','',guideText(step.why,language())??t(`help.step.${step.id}.why`)));
      const state=element('span','help-step-state',t(step.done?'help.done':'help.todo'));
      button.append(mark,text,state);item.append(button);return item;
    }));
  }
  get isOpen(){return this.dialog.open;}
  // Unfolds the window (a new game, the tutorial's "Show me" without a target).
  show(){if(this.scene.gameOver)return;if(!this.dialog.open)this.dialog.open=true;this.update();this.place();}
  open(){this.show();}
  close(){if(this.dialog.open)this.dialog.open=false;}
  // A step opens the Buildings menu on its category with the building in view.
  showBuilding(id){
    const definition=this.scene.objectRegistry.get(id),bar=this.scene.buildingBar;if(!definition||!bar)return;
    bar.selectCategory(definition.buildingCategory??'all');if(bar.panel.hidden)bar.toggle();
    const choice=document.getElementById(`${id}-choice`);choice?.scrollIntoView?.({block:'nearest',inline:'center'});choice?.focus({preventScroll:true});
  }
  showTask(id){
    const s=this.scene,step=this.progress().steps.find(x=>x.id===id);if(!step)return;
    if(step.kind==='job'){s.populationSidebar?.setOpen(true);return;}
    if(step.kind==='king'||step.kind==='water'){s.worldCamera?.selectKing?.();s.worldCamera?.locate?.(s.character??{});return;}
    if(step.buildingId)this.showBuilding(step.buildingId);
  }
  relabel(){this.lastKey=null;this.update();}
  destroy(){clearInterval(this.timer);this.controller.abort();this.observer?.disconnect();this.scene.events?.off('buildings:changed',this.refresh);this.dialog.hidden=true;}
}
