import { element } from './objectLabels.js';

export function formatPlayTime(ms){const seconds=Math.floor(ms/1000);return `${Math.floor(seconds/3600)}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;}
export class SaveLoadMenu {
  constructor(app){
    this.app=app;this.dialog=document.querySelector('#save-load-dialog');this.list=document.querySelector('#save-list');this.confirmation=document.querySelector('#save-confirm');
    document.querySelector('#close-save-load').addEventListener('click',()=>this.close());
    this.dialog.addEventListener('cancel',e=>{e.preventDefault();if(!this.busy)this.close();});
    document.querySelector('#new-save-form').addEventListener('submit',event=>{event.preventDefault();this.run(()=>this.save());});
    this.list.addEventListener('click',event=>{const button=event.target.closest('[data-action]');if(button)this.run(()=>this.action(button.dataset.action,button.dataset.id));});
    document.querySelector('#confirm-save-yes').addEventListener('click',()=>this.answer(true));
    document.querySelector('#confirm-save-no').addEventListener('click',()=>this.answer(false));
    this.confirmation.addEventListener('cancel',event=>{event.preventDefault();this.answer(false);});
  }
  error(message=''){document.querySelector('#save-error').textContent=message;document.querySelector('#save-notice').textContent='';}
  async open(mode){
    this.mode=mode;this.error();document.querySelector('#save-load-title').textContent=mode==='save'?'Save Game':'Load Game';
    document.querySelector('#new-save-form').hidden=mode!=='save';
    document.querySelector('#save-name').value=`Království — Day ${this.app.scene?.gameTime.day??1}`;
    this.dialog.showModal();await this.run(()=>this.refresh());
  }
  async run(operation){
    if(this.busy)return;this.busy=true;this.dialog.setAttribute('aria-busy','true');
    try{await operation();}catch(error){this.error(error.message||'Uložení nebo načtení selhalo.');}
    finally{this.busy=false;this.dialog.removeAttribute('aria-busy');}
  }
  async refresh(){
    const records=await this.app.saves.list();
    const rows=records.map(save=>{
      const row=element('article','save-row'),info=element('div','save-description');
      const validDate=value=>{const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString('cs-CZ'):'Neznámé datum';};
      info.append(element('h3','',save.name||'Uložená hra'),element('p','',`Day ${save.day??'?'} · Hráno ${formatPlayTime(save.playTime??0)}`),
        element('small','',`Uloženo: ${validDate(save.updatedAt)} · Vytvořeno: ${validDate(save.createdAt)}`));
      const actions=element('div','save-actions');
      for(const [action,label]of [['load','Load'],...(this.mode==='save'?[['overwrite','Přepsat']]:[]),['delete','Delete']]){
        const button=element('button','',label);button.type='button';button.dataset.action=action;button.dataset.id=save.id;actions.append(button);
      }
      row.append(info,actions);return row;
    });
    this.list.replaceChildren(...(rows.length?rows:[element('p','empty-saves','No saved games')]));
  }
  confirm(message){document.querySelector('#save-confirm-text').textContent=message;this.confirmation.showModal();return new Promise(resolve=>{this.confirmResolve=resolve;});}
  answer(value){this.confirmation.close();this.confirmResolve?.(value);this.confirmResolve=null;}
  async action(action,id){
    this.error();
    if(action==='delete'){
      if(!await this.confirm('Opravdu odstranit tuto uloženou hru?'))return;
      await this.app.saves.delete(id);await this.refresh();
    }else if(action==='overwrite'){
      if(!await this.confirm('Přepsat tuto uloženou hru současným stavem?'))return;
      const old=await this.app.saves.get(id);await this.save(id,old.name);
    }else if(action==='load'){
      const record=await this.app.saves.get(id);await this.app.load(record?.state);this.dialog.close();
    }
  }
  async save(id=null,name=null){
    this.error();
    const state=this.app.snapshot();
    await this.app.saves.save({id,name:name??document.querySelector('#save-name').value,state});
    document.querySelector('#save-notice').textContent='Game saved successfully.';this.app.notify('Game saved successfully.');await this.refresh();
  }
  close(){if(this.busy)return;this.dialog.close();if(this.app.scene)this.app.showPause();}
}
