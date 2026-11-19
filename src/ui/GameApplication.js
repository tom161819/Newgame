import { sandboxSettings,SANDBOX_LANDS } from '../game/sandboxMode.js';
import { zoneStart,homeAfterZone,buryFallen,nextMap } from '../game/zoneMode.js';
import { recordSaveFailure } from '../systems/saveFailure.js';
import { saveRecordStatus } from './SaveLoadMenu.js';
import { SaveGameManager } from '../systems/SaveGameManager.js';
import { serializeGameState,validateGameState } from '../systems/GameStateSerializer.js';
import { SaveLoadMenu } from './SaveLoadMenu.js';
import { NewGameSetup } from './NewGameSetup.js';
import { WorldEditor } from './WorldEditor.js';
import { NEW_GAME_DEFAULTS,gameSettings } from '../systems/GameSettings.js';
import { encodeWorldCode } from '../data/worldCode.js';
import { setGroundOverride } from '../data/groundLook.js';
import { activeGroundLook } from '../data/worldEditorStore.js';
import { ChangelogPanel } from './ChangelogPanel.js';
import { VersionArchivePanel } from './VersionArchivePanel.js';
import { gameVersion,releases } from 'virtual:game-release';
import { AutosaveService,readAutosaveSettings,saveAutosaveSettings,AUTOSAVE_INTERVALS } from '../systems/AutosaveService.js';
import { t,language,LANGUAGES,initLanguage,setLanguage,onLanguageChange } from '../i18n/index.js';
import { Telemetry } from '../systems/Telemetry.js';
import { ReportDialog } from './ReportDialog.js';

export class GameApplication {
  constructor(game){
    let storage;try{storage=window.localStorage;}catch{}
    // The language is chosen before any screen renders; both pickers stay in sync.
    initLanguage(storage);this.languageSelects=[...document.querySelectorAll('[data-language-select]')];
    for(const select of this.languageSelects){select.replaceChildren(...Object.entries(LANGUAGES).map(([id,{label}])=>{const option=document.createElement('option');option.value=id;option.textContent=label;return option;}));select.value=language();select.addEventListener('change',()=>setLanguage(select.value,{storage}));}
    this.storage=storage;this.game=game;this.scene=null;this.gameVersion=gameVersion;this.saves=new SaveGameManager();this.saveMenu=new SaveLoadMenu(this);
    // Owner 15 Nov: anonymous play statistics and "Report a problem" (GitHub Pages build only, see data/telemetry.js).
    this.telemetry=new Telemetry({storage,version:gameVersion});this.telemetry.visit();
    this.report=new ReportDialog({storage,version:gameVersion,telemetry:this.telemetry,context:()=>({day:this.scene?.gameTime?.day??'—',population:this.scene?.workerSystem?.liveSubjects?.().length??'—',language:language(),screen:`${innerWidth}×${innerHeight}`})});
    setInterval(()=>{const scene=this.scene;if(scene?.gameTime)this.telemetry.tick(scene.gameTime.day,!scene.pauseManager?.paused&&!document.hidden);},1000);
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
    this.setup=new NewGameSetup({onStart:settings=>{this.pendingGettingStarted=true;this.start(null,settings);},onBack:()=>{this.setup.close();this.showMainMenu();}});
    document.querySelector('#new-game').addEventListener('click',()=>{this.main.hidden=true;this.setup.open();});
    // World Editor (m-world-editor-obrazovka): a full screen from the main menu or from New Game → Custom settings → World.
    // Start game uses the editor's world code (with the New Game setup's other choices when it was opened from there).
    this.worldEditor=new WorldEditor({storage,
      onStart:world=>{const code=encodeWorldCode(world);this.worldEditor.close();this.pendingGettingStarted=true;
        if(this.editorFrom==='setup'){this.setup.world={levels:[...world.levels],seed:world.seed};this.setup.writeCode();this.start(null,this.setup.value());}
        else this.start(null,gameSettings({...NEW_GAME_DEFAULTS,worldCode:code}));},
      onBack:world=>{if(this.editorFrom==='setup'){this.setup.world={levels:[...world.levels],seed:world.seed};this.setup.writeCode();this.setup.root.hidden=false;document.querySelector('#setup-open-editor')?.focus();}else this.showMainMenu();}});
    document.querySelector('#main-world-editor')?.addEventListener('click',()=>{this.editorFrom='main';this.main.hidden=true;this.worldEditor.open();});
    // Owner 16 Nov 2026: the Test map – a sandbox to try battles and buildings (sandboxMode.js).
    document.querySelector('#main-test-map')?.addEventListener('click',()=>this.chooseTestLand());
    document.querySelector('#setup-open-editor')?.addEventListener('click',()=>{this.editorFrom='setup';this.setup.root.hidden=true;this.worldEditor.open(this.setup.world);});
    document.querySelector('#main-load-game').addEventListener('click',()=>this.openSaves('load'));
    // E2 (report 0.48.0): Continue loads the newest compatible save straight away.
    document.querySelector('#continue-game')?.addEventListener('click',async()=>{const record=await this.latestSave();if(record)await this.load(record.state);});
    document.querySelector('#resume-game').addEventListener('click',()=>this.resume());
    for(const button of document.querySelectorAll('[data-game-menu]'))button.addEventListener('click',()=>{
      const action=button.dataset.gameMenu;if(action==='main')this.returnToMain();else this.openSaves(action);
    });
    this.pauseDialog.addEventListener('cancel',event=>{event.preventDefault();this.resume();});
    document.querySelector('#copy-world-code')?.addEventListener('click',event=>{const code=this.scene?.gameSettings?.worldCode;if(!code)return;navigator.clipboard?.writeText(code).then(()=>{event.target.textContent=t('pause.copied');},()=>{}).catch(()=>{});const range=document.createRange();range.selectNodeContents(document.querySelector('#pause-world-code'));getSelection()?.removeAllRanges();getSelection()?.addRange(range);});
    document.addEventListener('keydown',event=>{
      if(event.code!=='Escape'||event.repeat||document.querySelector('dialog[open]')||!this.scene||this.scene.gameOver)return;
      event.preventDefault();
      if(this.scene.rockMiningTool?.enabled)this.scene.rockMiningTool.close();
      else if(this.scene.buildMode)this.scene.cancelBuilding();
      else if(this.scene.unitSelection?.ids.size){this.scene.unitSelection.clear();this.scene.armyPanel?.clearPick?.();}
      else if(this.scene.armyPanel?.panel&&!this.scene.armyPanel.panel.hidden)this.scene.armyPanel.toggle(false);
      else if(this.scene.buildingBar&&!this.scene.buildingBar.panel.hidden)this.scene.buildingBar.close();
      else if(this.scene.settingsPanel.open)this.scene.settingsPanel.setOpen(false);
      else if(this.scene.populationSidebar?.open)this.scene.populationSidebar.setOpen(false);
      else this.showPause();
    });
  }
  async latestSave(){try{return (await this.saves.list()).find(r=>saveRecordStatus(r).compatible&&r.state)??null;}catch{return null;}}
  async refreshContinue(){const button=document.querySelector('#continue-game');if(!button)return;const record=await this.latestSave();button.hidden=!record;if(record)button.title=t('menu.continueTitle',{name:record.name||t('saves.unnamed')});}
  showMainMenu(){this.refreshContinue();this.scene=null;this.main.hidden=false;document.body.classList.remove('in-game');document.querySelector('main').inert=true;document.querySelector('#new-game').disabled=false;document.querySelector('#main-load-game').disabled=false;const editorButton=document.querySelector('#main-world-editor');if(editorButton)editorButton.disabled=false;const testButton=document.querySelector('#main-test-map');if(testButton)testButton.disabled=false;this.worldEditor?.close();document.querySelector('#new-game').focus();
    if(this.pendingSetup){this.pendingSetup=false;this.main.hidden=true;this.setup.open();}}
  // Opens Game Setup from anywhere. A running game is stopped first; nothing is saved or deleted.
  openNewGameSetup(){
    this.pauseDialog.close();
    if(this.scene){this.pendingSetup=true;this.returnToMain();return;}
    this.main.hidden=true;this.setup.open();
  }
  // Getting started opens once for a New Game started from the setup (onStart); loads and scripted restarts never open it.
  start(state=null,settings,zone=null,sandbox=false){
    // The ground look: a loaded game keeps the one in its save; a new game takes this browser's World Editor look.
    setGroundOverride(state?state.groundLook??null:zone?zone.home.groundLook??null:activeGroundLook(this.storage));
    this.archive.close(false);
    this.changelog.close(false);
    this.setup.close();
    this.pauseDialog.close();this.main.hidden=true;document.body.classList.add('in-game');document.querySelector('main').inert=false;
    this.startedFromSave=!!state||!!zone;
    this.game.scene.stop('MainMenu');this.game.scene.stop('Game');this.scene=null;this.game.scene.start('Game',{state,settings,zone,sandbox});
  }
  startTestMap(land='home'){this.pendingGettingStarted=false;this.start(null,sandboxSettings(land),null,land==='home'?true:land);}
  // Owner 17 Nov 2026: the Test map asks which land – the home map with the Castle or a land the scouts find.
  chooseTestLand(){
    let dialog=document.querySelector('#test-map-lands');
    if(!dialog){dialog=document.createElement('dialog');dialog.id='test-map-lands';dialog.className='test-map-lands';document.body.append(dialog);}
    const title=document.createElement('h2');title.textContent=t('sandbox.chooseLand');
    const list=document.createElement('div');list.className='test-map-land-list';
    for(const land of SANDBOX_LANDS){const b=document.createElement('button');b.type='button';b.dataset.land=land;b.textContent=t(`sandbox.land.${land}`);b.addEventListener('click',()=>{dialog.close();this.startTestMap(land);});list.append(b);}
    const cancel=document.createElement('button');cancel.type='button';cancel.className='test-map-cancel';cancel.textContent=t('sandbox.cancel');cancel.addEventListener('click',()=>dialog.close());
    dialog.replaceChildren(title,list,cancel);dialog.showModal?.();return dialog;
  }
  // m-mapa-kraje (owner 16 Nov 2026): switch to the scouting party – home is kept as a saved state, the zone map starts.
  enterZone(){
    if(!this.scene||this.scene.zone)return false;let home;try{home=this.snapshot();}catch(error){this.notify(error.message);return false;}
    const start=zoneStart(home);if(!start){this.notify(t('zone.notThere'));return false;}
    this.start(null,start.settings,start.zone);return true;
  }
  // m-mapa-kraje: into an abandoned mine (its inside is a map of its own) and back out to the land.
  enterMine(){const scene=this.scene;if(!scene?.zone||scene.zone.dungeon)return false;const next=nextMap(scene,{dungeon:true});this.start(null,next.settings,next.zone);return true;}
  leaveMine(){const scene=this.scene;if(!scene?.zone?.dungeon)return false;const next=nextMap(scene,{dungeon:false});this.start(null,next.settings,next.zone);return true;}
  // Back home: the saved home state with the party on its way back.
  leaveZone(next=null){
    const scene=this.scene;if(!scene?.zone)return false;const {home,fallen}=homeAfterZone(scene,{next});let state,checked=true;
    try{state=validateGameState(home);}catch(error){console.error('Zone return check failed:',error);checked=false;state=validateGameState(scene.zone.home);}
    this.pendingFallen=checked?fallen:[];this.start(state);if(fallen.length)this.notify(t('zone.fallen',{count:fallen.length}));return true;
  }
  onGameReady(scene){this.scene=scene;if(this.pendingFallen?.length){buryFallen(scene,this.pendingFallen);}this.pendingFallen=null;this.telemetry.gameStarted(this.startedFromSave);
    // Developer console (trade F1.2): mkDev.summonCaravan() brings the next caravan now when a Marketplace is finished.
    try{globalThis.mkDev={summonCaravan:()=>this.scene?.caravans?.summon()??false,fillChildren:count=>{this.scene?.childrenSystem?.setDev(count);return !!this.scene?.childrenSystem;},setPathRenderer:style=>this.scene?.terrain?.setPathStyle(style)??false,setShoreStyle:style=>this.scene?.terrain?.setShoreStyle(style)??false,setGroundStyle:style=>this.scene?.terrain?.setGroundStyle(style)??false,pathStats:()=>this.scene?.terrain?.v2?.stats,scene:()=>this.scene};}catch{/* no global object */}
    this.autosave.reset();if(this.pendingGettingStarted){this.pendingGettingStarted=false;if(!scene.tutorial?.start())scene.gettingStarted?.show();}else scene.tutorial?.resume();}
  labelAutosaveIntervals(){for(const option of document.querySelectorAll('#autosave-interval option'))option.textContent=t('autosave.interval',{count:Number(option.value)/60000});}
  // A language switch re-renders the texts built in code; static markup is handled by applyTranslations.
  relabel(){for(const select of this.languageSelects)select.value=language();this.labelAutosaveIntervals();this.autosaveStatus(this.autosaveFailure);this.setup?.refresh();this.worldEditor?.relabel();this.saveMenu.relabel();this.changelog?.relabel?.();this.archive?.relabel?.();this.scene?.relabelUI?.();}
  // The last successful Autosave stays visible; a failure is announced once per streak.
  autosaveStatus(status=null){
    const output=document.querySelector('#autosave-status');if(!output)return;
    const time=at=>{const date=new Date(at);return Number.isFinite(date.getTime())?date.toLocaleTimeString(language()==='cs'?'cs-CZ':'en-GB'):'—';};
    const last=this.autosave.lastSuccess,base=!this.autosave.enabled?t('autosave.off'):last?t('autosave.last',{time:time(last.at),day:last.day}):t('autosave.none');
    if(status?.type==='failed'&&this.autosave.enabled){this.autosaveFailure={...status,first:false};output.textContent=`${t('autosave.failed',{message:status.message})} ${last?t('autosave.kept',{time:time(last.at)}):''}`.trim();output.classList.add('failed');if(status.first)this.notify(t('autosave.failedNotice'));return;}
    if(status?.type==='saved')this.autosaveFailure=null;output.classList.remove('failed');output.textContent=base;if(status?.recovered)this.notify(t('autosave.recovered'));
  }
  async load(input){let state;try{state=validateGameState(input);}catch(error){if(error?.savePart)recordSaveFailure('load',input,error);throw error;}this.start(state);}
  snapshot(){if(!this.scene||this.scene.gameOver)throw new Error(t('app.startFirst'));
    // m-mapa-kraje: in a zone, saving keeps home (with the party in the zone); the zone itself is not kept yet.
    if(this.scene.zone)return validateGameState(structuredClone(this.scene.zone.home));
    if(this.scene.sandbox)throw new Error(t('sandbox.noSave'));
    // m-ulozeni-brod: a state that fails the check is a bug in the running game, not a damaged save – say so and keep playing.
    // m-ukladani-chyba: a passing state (someone mid-step) gets up to 3 more tries, each after one short simulation step.
    let error;for(let attempt=0;attempt<4;attempt++){
      if(attempt)this.scene.simulationStep?.(50);const state=serializeGameState(this.scene);
      try{return validateGameState(state);}catch(e){error=e;if(attempt===3)recordSaveFailure('save',state,e);}
    }
    console.error('Save check failed:',error);throw new Error(t('saves.saveFailedPart',{part:error?.savePart??'?'}));}
  showPause(){
    if(!this.scene||this.scene.gameOver)return;
    this.scene.pauseManager.set('menu',true);this.scene.settingsPanel.setOpen(false);
    // World v2: the code of this world, to share or replay it.
    const code=this.scene.gameSettings?.worldCode??'';document.querySelector('#pause-world-code').textContent=code||'—';const copy=document.querySelector('#copy-world-code');copy.hidden=!code;copy.textContent=t('pause.copyWorldCode');
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
