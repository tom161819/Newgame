import { t } from '../i18n/index.js';
import { element } from './objectLabels.js';
import { gettingStartedProgress } from '../systems/GettingStarted.js';

// Owner request 7 Nov 2026: the "?" button at the right of the HUD opens Getting started, a checklist of the first
// buildings. A step ticks itself when its building is completed. The button carries a dot until every step is done.
// A new game started from the setup opens the panel once (GameApplication); loading a save never does.
export class GettingStartedPanel {
  constructor(scene){
    this.scene=scene;this.dialog=document.querySelector('#help-dialog');this.button=document.querySelector('#help-toggle');
    this.list=document.querySelector('#help-steps');this.summary=document.querySelector('#help-summary');
    this.controller=new AbortController();this.restored=true;const options={signal:this.controller.signal};
    this.button.addEventListener('click',()=>this.show(),options);
    document.querySelector('#close-help').addEventListener('click',()=>this.close(),options);
    this.dialog.addEventListener('cancel',event=>{event.preventDefault();this.close();},options);
    this.dialog.addEventListener('close',()=>this.restore(),options);
    // A click on the backdrop lands on the <dialog> itself, outside its content box.
    this.dialog.addEventListener('click',event=>{if(event.target===this.dialog)this.close();},options);
    this.list.addEventListener('click',event=>{const id=event.target.closest('[data-help-building]')?.dataset.helpBuilding;if(id)this.showBuilding(id);},options);
    this.refresh=()=>this.update();scene.events?.on('buildings:changed',this.refresh);
    this.button.hidden=false;this.update();
  }
  progress(){return gettingStartedProgress(this.scene.buildings);}
  update(){
    const progress=this.progress();
    this.button.classList.toggle('has-alert',!progress.allDone);
    this.button.title=progress.allDone?t('help.button'):t('help.buttonPending',{done:progress.doneCount,total:progress.total});
    if(this.dialog.open)this.render(progress);return progress;
  }
  render(progress=this.progress()){
    this.summary.textContent=progress.allDone?t('help.allSet'):t('help.progress',{done:progress.doneCount,total:progress.total});
    this.summary.classList.toggle('help-all-set',progress.allDone);
    this.list.replaceChildren(...progress.steps.map((step,index)=>{
      const item=element('li',`help-step${step.done?' done':''}${step.id===progress.current?' current':''}`);item.dataset.helpStep=step.id;
      if(step.id===progress.current)item.setAttribute('aria-current','step');
      const button=element('button','help-step-button');button.type='button';button.dataset.helpBuilding=step.buildingId;
      const mark=element('span','help-step-mark',step.done?'✓':String(index+1));mark.setAttribute('aria-hidden','true');
      const text=element('span','help-step-text');text.append(element('strong','',t(`help.step.${step.id}`)),element('small','',t(`help.step.${step.id}.why`)));
      const state=element('span','help-step-state',t(step.done?'help.done':'help.todo'));
      button.append(mark,text,state);item.append(button);return item;
    }));
  }
  get isOpen(){return this.dialog.open;}
  show(){
    if(this.scene.gameOver)return;
    this.render(this.update());if(!this.dialog.open){this.restored=false;this.scene.setGalleryInput(false);this.dialog.showModal();}
    this.dialog.querySelector('[aria-current="step"] button, #close-help')?.focus();
  }
  restore(){if(!this.restored){this.restored=true;this.scene.setGalleryInput(true);}}
  close(){if(this.dialog.open)this.dialog.close();this.restore();}
  // A step opens the Buildings menu on its category with the building in view.
  showBuilding(id){
    const definition=this.scene.objectRegistry.get(id),bar=this.scene.buildingBar;if(!definition||!bar)return;
    this.close();bar.selectCategory(definition.buildingCategory??'all');if(bar.panel.hidden)bar.toggle();
    const choice=document.getElementById(`${id}-choice`);choice?.scrollIntoView?.({block:'nearest',inline:'center'});choice?.focus({preventScroll:true});
  }
  relabel(){this.update();if(this.dialog.open)this.render();}
  destroy(){this.close();this.controller.abort();this.scene.events?.off('buildings:changed',this.refresh);this.button.classList.remove('has-alert');this.button.hidden=true;}
}
