import { SaveGameManager } from '../systems/SaveGameManager.js';
import { serializeGameState,validateGameState } from '../systems/GameStateSerializer.js';
import { SaveLoadMenu } from './SaveLoadMenu.js';
import { NewGameSetup } from './NewGameSetup.js';
import { ChangelogPanel } from './ChangelogPanel.js';
import { VersionArchivePanel } from './VersionArchivePanel.js';
import { gameVersion,releases } from 'virtual:game-release';
import { AutosaveService,readAutosaveSettings,saveAutosaveSettings } from '../systems/AutosaveService.js';

export class GameApplication {
  constructor(game){
    this.game=game;this.scene=null;this.gameVersion=gameVersion;this.saves=new SaveGameManager();this.saveMenu=new SaveLoadMenu(this);
    let storage;try{storage=window.localStorage;}catch{}
    this.autosave=new AutosaveService({saves:this.saves,snapshot:()=>this.snapshot(),settings:readAutosaveSettings(storage),onStatus:status=>this.autosaveStatus(status)});
    const autosaveToggle=document.querySelector('#autosave-toggle'),autosaveInterval=document.querySelector('#autosave-interval');
    if(autosaveToggle&&autosaveInterval){
      autosaveToggle.checked=this.autosave.enabled;autosaveInterval.value=String(this.autosave.intervalMs);autosaveInterval.disabled=!this.autosave.enabled;
      const apply=()=>{this.autosave.configure({enabled:autosaveToggle.checked,intervalMs:Number(autosaveInterval.value)});autosaveInterval.disabled=!this.autosave.enabled;saveAutosaveSettings(storage,this.autosave);this.autosaveStatus();};
      autosaveToggle.addEventListener('change',apply);autosaveInterval.addEventListener('change',apply);this.autosaveStatus();
    }
    this.main=document.querySelector('#main-menu');this.pauseDialog=document.querySelector('#pause-menu');
    this.changelog=new ChangelogPanel({version:gameVersion,releases});
    this.archive=new VersionArchivePanel({catalogURL:`${import.meta.env.BASE_URL}versions/catalog.json`,onChanges:version=>{if(version&&!releases.some(r=>r.version===version))window.open(`${import.meta.env.BASE_URL}?changelog=${encodeURIComponent(version)}`,'_blank','noopener,noreferrer');else this.changelog.open(version);}});
    const requestedChanges=new URLSearchParams(window.location.search).get('changelog');if(releases.some(v=>v.version===requestedChanges))this.changelog.open(requestedChanges);
    this.setup=new NewGameSetup({onStart:settings=>this.start(null,settings),onBack:()=>{this.setup.close();this.showMainMenu();}});
    document.querySelector('#new-game').addEventListener('click',()=>{this.main.hidden=true;this.setup.open();});
    document.querySelector('#main-load-game').addEventListener('click',()=>this.openSaves('load'));
    document.querySelector('#resume-game').addEventListener('click',()=>this.resume());
    for(const button of document.querySelectorAll('[data-game-menu]'))button.addEventListener('click',()=>{
      const action=button.dataset.gameMenu;if(action==='main')this.returnToMain();else this.openSaves(action);
    });
    this.pauseDialog.addEventListener('cancel',event=>{event.preventDefault();this.resume();});
    document.addEventListener('keydown',event=>{
      if(event.code!=='Escape'||event.repeat||document.querySelector('dialog[open]')||!this.scene||this.scene.gameOver)return;
      event.preventDefault();
      if(this.scene.buildMode)this.scene.cancelBuilding();
      else if(this.scene.settingsPanel.open)this.scene.settingsPanel.setOpen(false);
      else if(this.scene.populationSidebar?.open)this.scene.populationSidebar.setOpen(false);
      else this.showPause();
    });
  }
  showMainMenu(){this.scene=null;this.main.hidden=false;document.body.classList.remove('in-game');document.querySelector('main').inert=true;document.querySelector('#new-game').disabled=false;document.querySelector('#main-load-game').disabled=false;document.querySelector('#new-game').focus();
    if(this.pendingSetup){this.pendingSetup=false;this.main.hidden=true;this.setup.open();}}
  // Opens Game Setup from anywhere. A running game is stopped first; nothing is saved or deleted.
  openNewGameSetup(){
    this.pauseDialog.close();
    if(this.scene){this.pendingSetup=true;this.returnToMain();return;}
    this.main.hidden=true;this.setup.open();
  }
  start(state=null,settings){
    this.archive.close(false);
    this.changelog.close(false);
    this.setup.close();
    this.pauseDialog.close();this.main.hidden=true;document.body.classList.add('in-game');document.querySelector('main').inert=false;
    this.game.scene.stop('MainMenu');this.game.scene.stop('Game');this.scene=null;this.game.scene.start('Game',{state,settings});
  }
  onGameReady(scene){this.scene=scene;this.autosave.reset();}
  // The last successful Autosave stays visible; a failure is announced once per streak.
  autosaveStatus(status=null){
    const output=document.querySelector('#autosave-status');if(!output)return;
    const time=at=>{const date=new Date(at);return Number.isFinite(date.getTime())?date.toLocaleTimeString('cs-CZ'):'—';};
    const last=this.autosave.lastSuccess,base=!this.autosave.enabled?'Autosave is off.':last?`Last autosave: ${time(last.at)} · Day ${last.day}`:'No autosave yet in this session.';
    if(status?.type==='failed'){output.textContent=`Autosave failed: ${status.message}. ${last?`The previous autosave (${time(last.at)}) is kept.`:''}`.trim();output.classList.add('failed');if(status.first)this.notify('Autosave failed. Your previous saves are kept.');return;}
    output.classList.remove('failed');output.textContent=base;if(status?.recovered)this.notify('Autosave works again.');
  }
  async load(input){const state=validateGameState(input);this.start(state);}
  snapshot(){if(!this.scene||this.scene.gameOver)throw new Error('Nejprve spusť hru.');return validateGameState(serializeGameState(this.scene));}
  showPause(){
    if(!this.scene||this.scene.gameOver)return;
    this.scene.pauseManager.set('menu',true);this.scene.settingsPanel.setOpen(false);
    if(!this.pauseDialog.open)this.pauseDialog.showModal();document.querySelector('#resume-game').focus();
  }
  resume(){this.pauseDialog.close();this.scene?.pauseManager.set('menu',false);}
  openSaves(mode){
    if(this.scene){this.scene.pauseManager.set('menu',true);this.scene.settingsPanel.setOpen(false);}
    this.pauseDialog.close();this.saveMenu.open(mode);
  }
  returnToMain(){
    this.pauseDialog.close();this.scene?.settingsPanel.setOpen(false);
    this.game.scene.stop('Game');this.scene=null;this.game.scene.start('MainMenu');
  }
  notify(message){
    clearTimeout(this.noticeTimer);const output=document.querySelector('#application-notice');output.textContent=message;output.hidden=false;
    this.noticeTimer=setTimeout(()=>{output.hidden=true;},4000);
  }
}
