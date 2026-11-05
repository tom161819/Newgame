import { element } from './objectLabels.js';
import { IncompatibleSaveError,saveSchemaStatus } from '../systems/GameStateSerializer.js';
import { exportSaveFile,parseSaveFile,saveFileName,SAVE_FILE_MAX_BYTES } from '../systems/SaveTransfer.js';

// Saves record their schema twice (record and state); either identifies an incompatible slot without loading it.
export function saveRecordStatus(record){return saveSchemaStatus({saveVersion:record?.state?.saveVersion??record?.saveVersion});}
export function incompatibleSaveMessage(name,status){
  return `"${name||'Saved game'}" uses save schema ${status.savedVersion??'unknown'}. This alpha build loads only schema ${status.currentVersion}, so older saves cannot be continued. The save stays stored until you delete it. Start a new game instead?`;
}
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
    this.fileInput=document.querySelector('#import-save-file');
    document.querySelector('#import-save').addEventListener('click',()=>{if(!this.busy)this.fileInput.click();});
    this.fileInput.addEventListener('change',()=>{const file=this.fileInput.files?.[0];this.fileInput.value='';if(file)this.run(()=>this.importFile(file));});
  }
  notice(message){document.querySelector('#save-notice').textContent=message;}
  // Download: the stored slot as one JSON file; nothing is uploaded anywhere.
  async download(id){
    const record=await this.app.saves.get(id);if(!record)throw new Error('Uložená pozice již neexistuje.');
    const blob=new Blob([exportSaveFile(record,{gameVersion:this.app.gameVersion??null})],{type:'application/json'}),url=URL.createObjectURL(blob),link=document.createElement('a');
    link.href=url;link.download=saveFileName(record);document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),0);
    this.notice(`Save file "${link.download}" downloaded.`);
  }
  // Import: validated completely before storing; a new slot, or the same slot only after confirmation.
  async importFile(file){
    this.error();
    if(file.size>SAVE_FILE_MAX_BYTES)throw new Error(`The file is larger than ${SAVE_FILE_MAX_BYTES/1024/1024} MB and was not imported.`);
    let imported;try{imported=parseSaveFile(await file.text(),{size:file.size});}
    catch(error){if(error instanceof IncompatibleSaveError)throw new Error(`Incompatible save file: schema ${error.savedVersion??'unknown'} cannot be imported by schema ${error.currentVersion}. Nothing was changed.`);throw error;}
    const existing=imported.id?await this.app.saves.get(imported.id):null;
    const replace=existing?await this.confirm(`"${existing.name}" already exists on this device. Replace it with the imported file? Choose "Keep both" to import it as a new save.`,{yes:'Replace',no:'Keep both'}):false;
    const record=await this.app.saves.save(replace?{id:imported.id,name:imported.name,state:imported.state}:{id:existing?null:imported.id,name:imported.name,state:imported.state,create:!existing});
    this.notice(`Imported "${record.name}" (Day ${record.day}). Load it from the list.`);await this.refresh();
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
      const status=saveRecordStatus(save);
      if(!status.compatible){row.classList.add('incompatible');info.append(element('p','save-warning',`Incompatible save · schema ${status.savedVersion??'unknown'}, current ${status.currentVersion}`));}
      const actions=element('div','save-actions');
      for(const [action,label]of [['load','Load'],...(this.mode==='save'?[['overwrite','Přepsat']]:[]),...(status.compatible?[['download','Download Save']]:[]),['delete','Delete']]){
        const button=element('button','',label);button.type='button';button.dataset.action=action;button.dataset.id=save.id;actions.append(button);
      }
      row.append(info,actions);return row;
    });
    this.list.replaceChildren(...(rows.length?rows:[element('p','empty-saves','No saved games')]));
  }
  confirm(message,{yes='Potvrdit',no='Zrušit'}={}){
    document.querySelector('#save-confirm-text').textContent=message;document.querySelector('#confirm-save-yes').textContent=yes;document.querySelector('#confirm-save-no').textContent=no;
    this.confirmation.showModal();return new Promise(resolve=>{this.confirmResolve=resolve;});
  }
  // Never deletes or converts the slot. The player chooses a new game or returns to the list.
  async incompatible(record,status){
    this.error(`Incompatible save: schema ${status.savedVersion??'unknown'} cannot be loaded by schema ${status.currentVersion}.`);
    if(!await this.confirm(incompatibleSaveMessage(record?.name,status),{yes:'Start New Game',no:'Back'}))return;
    this.dialog.close();this.app.openNewGameSetup();
  }
  answer(value){this.confirmation.close();this.confirmResolve?.(value);this.confirmResolve=null;}
  async action(action,id){
    this.error();
    if(action==='delete'){
      if(!await this.confirm('Opravdu odstranit tuto uloženou hru?'))return;
      await this.app.saves.delete(id);await this.refresh();
    }else if(action==='overwrite'){
      if(!await this.confirm('Přepsat tuto uloženou hru současným stavem?'))return;
      const old=await this.app.saves.get(id);await this.save(id,old.name);
    }else if(action==='download'){await this.download(id);
    }else if(action==='load'){
      const record=await this.app.saves.get(id),status=saveRecordStatus(record);
      if(!status.compatible&&status.savedVersion!==null){await this.incompatible(record,status);return;}
      try{await this.app.load(record?.state);}
      catch(error){if(error instanceof IncompatibleSaveError){await this.incompatible(record,saveSchemaStatus(record?.state));return;}throw error;}
      this.dialog.close();
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
