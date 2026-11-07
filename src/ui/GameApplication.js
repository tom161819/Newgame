import { SaveGameManager } from '../systems/SaveGameManager.js';
import { serializeGameState,validateGameState } from '../systems/GameStateSerializer.js';
import { SaveLoadMenu } from './SaveLoadMenu.js';
import { NewGameSetup } from './NewGameSetup.js';
import { ChangelogPanel } from './ChangelogPanel.js';
import { VersionArchivePanel } from './VersionArchivePanel.js';
import { gameVersion,releases } from 'virtual:game-release';
import { AutosaveService,readAutosaveSettings,saveAutosaveSettings,AUTOSAVE_INTERVALS } from '../systems/AutosaveService.js';
import { t,language,LANGUAGES,initLanguage,setLanguage,onLanguageChange } from '../i18n/index.js';

export class GameApplication {
  constructor(game){
    let storage;try{storage=window.localStorage;}catch{}
    // The language is chosen before any screen renders; both pickers stay in sync.
    initLanguage(storage);this.languageSelects=[...document.querySelectorAll('[data-language-select]')];
    for(const select of this.languageSelects){select.replaceChildren(...Object.entries(LANGUAGES).map(([id,{label}])=>{const option=document.createElement('option');option.value=id;option.textContent=label;return option;}));select.value=language();select.addEventListener('change',()=>setLanguage(select.value,{storage}));}
    this.game=game;this.scene=null;this.gameVersion=gameVersion;this.saves=new SaveGameManager();this.saveMenu=new SaveLoadMenu(this);
    this.autosave=new AutosaveService({saves:this.saves,snapshot:()=>this.snapshot(),settings:readAutosaveSettings(storage),onStatus:status=>this.autosaveStatus(status)});
    const autosaveToggle=document.querySelector('#autosave-toggle'),autosaveInterval=document.querySelector('#autosave-interval');
    if(autosaveToggle&&autosaveInterval){
      autosaveToggle.checked=this.autosave.enabled;autosaveInterval.value=String(this.autosave.intervalMs);autosaveInterval.disabled=!this.autosave.enabled;
      const apply=()=>{this.autosave.configure({enabled:autosaveToggle.checked,intervalMs:Number(autosaveInterval.value)});autosaveInterval.disabled=!this.autosave.enabled;saveAutosaveSettings(storage,this.autosave);this.autosaveStatus();};
      autosaveToggle.addEventListener('change',apply);autosaveInterval.addEventListener('change',apply);this.autosaveStatus();
    }
    this.labelAutosaveIntervals();onLanguageChange(()=>this.relabel());
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
      if(this.scene.rockMiningTool?.enabled)this.scene.rockMiningTool.close();
      else if(this.scene.buildMode)this.scene.cancelBuilding();
      else if(this.scene.unitSelection?.ids.size)this.scene.unitSelection.clear();
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
    // A new game from the setup opens Getting started once; a loaded game never does.
    this.pendingGettingStarted=!state;
    this.archive.close(false);
    this.changelog.close(false);
    this.setup.close();
    this.pauseDialog.close();this.main.hidden=true;document.body.classList.add('in-game');document.querySelector('main').inert=false;
    this.game.scene.stop('MainMenu');this.game.scene.stop('Game');this.scene=null;this.game.scene.start('Game',{state,settings});
  }
  onGameReady(scene){this.scene=scene;
    // Developer console (trade F1.2): mkDev.summonCaravan() brings the next caravan now when a Marketplace is finished.
    try{globalThis.mkDev={summonCaravan:()=>this.scene?.caravans?.summon()??false};}catch{/* no global object */}
    this.autosave.reset();if(this.pendingGettingStarted){this.pendingGettingStarted=false;scene.gettingStarted?.show();}}
  labelAutosaveIntervals(){for(const option of document.querySelectorAll('#autosave-interval option'))option.textContent=t('autosave.interval',{count:Number(option.value)/60000});}
  // A language switch re-renders the texts built in code; static markup is handled by applyTranslations.
  relabel(){for(const select of this.languageSelects)select.value=language();this.labelAutosaveIntervals();this.autosaveStatus(this.autosaveFailure);this.setup?.refresh();this.saveMenu.relabel();this.changelog?.relabel?.();this.archive?.relabel?.();this.scene?.relabelUI?.();}
  // The last successful Autosave stays visible; a failure is announced once per streak.
  autosaveStatus(status=null){
    const output=document.querySelector('#autosave-status');if(!output)return;
    const time=at=>{const date=new Date(at);return Number.isFinite(date.getTime())?date.toLocaleTimeString(language()==='cs'?'cs-CZ':'en-GB'):'—';};
    const last=this.autosave.lastSuccess,base=!this.autosave.enabled?t('autosave.off'):last?t('autosave.last',{time:time(last.at),day:last.day}):t('autosave.none');
    if(status?.type==='failed'&&this.autosave.enabled){this.autosaveFailure={...status,first:false};output.textContent=`${t('autosave.failed',{message:status.message})} ${last?t('autosave.kept',{time:time(last.at)}):''}`.trim();output.classList.add('failed');if(status.first)this.notify(t('autosave.failedNotice'));return;}
    if(status?.type==='saved')this.autosaveFailure=null;output.classList.remove('failed');output.textContent=base;if(status?.recovered)this.notify(t('autosave.recovered'));
  }
  async load(input){const state=validateGameState(input);this.start(state);}
  snapshot(){if(!this.scene||this.scene.gameOver)throw new Error(t('app.startFirst'));return validateGameState(serializeGameState(this.scene));}
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
