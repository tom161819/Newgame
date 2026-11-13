import { t } from '../i18n/index.js';
import { NEW_GAME_DEFAULTS,gameSettings,STARTING_RESOURCES,STARTING_RESOURCE_CAPACITY,startingResourceTotal } from '../systems/GameSettings.js';
import { WorldGenerator } from './WorldGenerator.js';
import { encodeWorldCode,decodeWorldCode,defaultWorldLevels,randomSeed,applyPresets,presetsFromLevels } from '../data/worldCode.js';
import { readLast } from '../data/worldEditorStore.js';

// Quick starts (values for the form; anything not listed keeps the New Game default). Starting resources stay within
// the Starter Stockpile's 300 units.
export const SETUP_PRESETS=Object.freeze({
  calm:Object.freeze({difficulty:'easy',nightWolves:false,nightThieves:false,nightFires:false,startingWood:100,startingStone:40,startingBread:160}),
  normal:Object.freeze({}),
  challenge:Object.freeze({difficulty:'hard',startingWood:40,startingStone:20,startingBread:120}),
});
export class NewGameSetup {
  constructor({onStart,onBack}){
    this.root=document.querySelector('#game-setup');this.form=document.querySelector('#game-setup-form');
    this.form.addEventListener('submit',event=>{event.preventDefault();if(!this.worldValid()){this.codeInput.focus();return;}onStart(this.value());});
    // World v2: the world code (seed + world settings) and the simple Water / Desert / Forest choices.
    this.codeInput=document.querySelector('#setup-world-code');this.codeError=document.querySelector('#setup-world-error');
    this.codeInput.addEventListener('input',()=>this.readCode());
    document.querySelector('#setup-new-seed').addEventListener('click',()=>{this.world.seed=randomSeed();this.writeCode();});
    document.querySelector('#setup-copy-code').addEventListener('click',()=>{const code=this.codeInput.value.trim();if(code)navigator.clipboard?.writeText(code).catch(()=>{});this.codeInput.select();});
    for(const name of ['worldWater','worldDesert','worldForest'])this.form.elements[name].addEventListener('change',()=>{const e=this.form.elements;this.world.levels=applyPresets(this.world.levels,{water:e.worldWater.value,desert:e.worldDesert.value,forest:e.worldForest.value});this.writeCode();});
    // World generator (bod 1): sliders per world setting + map preview; it only edits this.world, the code follows.
    const genHost=document.querySelector('#world-generator');
    if(genHost){this.generator=new WorldGenerator(genHost,{size:()=>Number(this.form.elements.mapSize?.value??100),get:()=>this.world,set:world=>{this.world=world;this.writeCode();}});document.querySelector('#setup-generator').addEventListener('toggle',event=>{if(event.target.open)this.generator.refresh();});}
    document.querySelector('#setup-back').addEventListener('click',onBack);
    document.querySelector('#setup-reset').addEventListener('click',()=>{this.offeredLevels=null;this.showEditorNote();this.reset();});
    // E2 (report 0.48.0): three quick starts and Start at the top; the full form folds under Custom settings, which
    // stays open once a player opened it (remembered in this browser).
    this.custom=document.querySelector('#setup-custom');
    this.custom?.addEventListener('toggle',()=>{try{localStorage.setItem('newgame.setupCustom',this.custom.open?'open':'closed');}catch{/* still toggles */}});
    for(const button of this.root.querySelectorAll('[data-setup-preset]'))button.addEventListener('click',()=>this.applyPreset(button.dataset.setupPreset));
    // The Starter Stockpile holds STARTING_RESOURCE_CAPACITY (300) units: a slider that would overflow it is held at the remaining room.
    this.form.addEventListener('input',event=>{const key=event.target?.name;if(key==='mapSize')this.generator?.refresh();if(Object.hasOwn(STARTING_RESOURCES,key)){const e=this.form.elements,others=Object.keys(STARTING_RESOURCES).filter(k=>k!==key).reduce((n,k)=>n+Number(e[k].value),0);if(Number(e[key].value)+others>STARTING_RESOURCE_CAPACITY)e[key].value=String(STARTING_RESOURCE_CAPACITY-others);}this.refresh();});
  }
  value(){const e=this.form.elements;return gameSettings({difficulty:e.difficulty.value,wildlifePopulation:['rare','normal','abundant'][Number(e.wildlifePopulation.value)],treasureCount:Number(e.treasureCount.value),initialStoneCount:Number(e.initialStoneCount.value),fogOfWar:e.fogOfWar.checked,explorationMode:e.explorationMode.checked,seasonsEnabled:e.seasonsEnabled.checked,autoEmployment:e.autoEmployment.checked,nightWolves:e.nightWolves?.checked??true,nightThieves:e.nightThieves?.checked??true,nightFires:e.nightFires?.checked??true,startingCastle:e.startingCastle.checked,startingGarrison:e.startingGarrison?.checked??true,dayLengthSeconds:Number(e.dayLengthSeconds.value),wildlifeRespawn:e.wildlifeRespawn.value,startingGold:Number(e.startingGold.value),...Object.fromEntries(Object.keys(STARTING_RESOURCES).map(k=>[k,Number(e[k].value)])),worldCode:this.worldCode(),mapSize:Number(e.mapSize?.value??100)});}
  // The code to start with: the typed one when valid, a fresh random seed when the field is empty.
  worldCode(){const text=this.codeInput?.value.trim().toUpperCase()??'';if(!text)return null;try{decodeWorldCode(text);return text;}catch{return null;}}
  worldValid(){const text=this.codeInput.value.trim();if(!text)return true;try{decodeWorldCode(text);return true;}catch{return false;}}
  writeCode(){this.codeInput.value=encodeWorldCode({levels:this.world.levels,seed:this.world.seed});this.showError(null);this.syncPresets();this.refresh();this.generator?.refresh();}
  readCode(){
    const text=this.codeInput.value.trim();if(!text){this.showError(null);this.refresh();return;}
    try{const {levels,seed}=decodeWorldCode(text);this.world={levels,seed};this.showError(null);this.syncPresets();this.generator?.refresh();}
    catch(error){this.showError(error.reason==='generator'?t('setup.worldCodeGenerator',{message:error.message}):t('setup.worldCodeInvalid'));}
    this.refresh();
  }
  showError(text){this.codeError.hidden=!text;this.codeError.textContent=text??'';this.codeInput.setAttribute('aria-invalid',String(!!text));}
  syncPresets(){const p=presetsFromLevels(this.world.levels),e=this.form.elements;for(const [name,key]of [['worldWater','water'],['worldDesert','desert'],['worldForest','forest']]){e[name].value=p[key];e[name].querySelector('option[value="custom"]').hidden=p[key]!=='custom';}}
  reset(){this.world={levels:[...(this.offeredLevels??defaultWorldLevels())],seed:randomSeed()};if(this.codeInput)this.writeCode();const s=NEW_GAME_DEFAULTS;for(const k of ['difficulty','treasureCount','initialStoneCount','dayLengthSeconds','wildlifeRespawn','startingGold',...Object.keys(STARTING_RESOURCES)])this.form.elements[k].value=s[k];for(const k of ['fogOfWar','explorationMode','seasonsEnabled','startingCastle','startingGarrison','autoEmployment','nightWolves','nightThieves','nightFires'])if(this.form.elements[k])this.form.elements[k].checked=s[k];this.form.elements.wildlifePopulation.value=1;if(this.form.elements.mapSize)this.form.elements.mapSize.value=String(s.mapSize);this.refresh();}
  applyPreset(id){
    const p=SETUP_PRESETS[id];if(!p)return;this.reset();const e=this.form.elements;
    for(const [k,v] of Object.entries(p))if(e[k]){if(typeof v==='boolean')e[k].checked=v;else e[k].value=v;}
    for(const b of this.root.querySelectorAll('[data-setup-preset]'))b.setAttribute('aria-checked',String(b.dataset.setupPreset===id));this.refresh();
  }
  // World Editor: New Game offers the levels last used in the editor (in this browser), with a fresh seed.
  showEditorNote(){const note=document.querySelector('#setup-editor-note');if(note)note.hidden=!this.offeredLevels;}
  open(){let storage=null;try{storage=localStorage;}catch{/* no storage */}this.offeredLevels=readLast(storage)?.levels??null;this.showEditorNote();this.reset();for(const b of this.root.querySelectorAll('[data-setup-preset]'))b.setAttribute('aria-checked',String(b.dataset.setupPreset==='normal'));if(this.custom){let saved=null;try{saved=localStorage.getItem('newgame.setupCustom');}catch{/* closed */}this.custom.open=saved==='open';}this.root.querySelector('.setup-advanced').open=false;this.root.hidden=false;(this.custom&&!this.custom.open?this.root.querySelector('.setup-start-top'):this.form.elements.difficulty)?.focus();}
  close(){this.root.hidden=true;}
  refresh(){const s=this.value(),wildlife=t(`setup.wildlife.${s.wildlifePopulation}`,{count:3*Math.round({rare:1,normal:3,abundant:8}[s.wildlifePopulation]*(s.mapSize/100)**2)}),on=v=>t(v?'state.on':'state.off');this.root.querySelector('[data-setup-output="wildlife"]').textContent=wildlife;for(const k of ['treasureCount','initialStoneCount','startingGold',...Object.keys(STARTING_RESOURCES)])this.root.querySelector(`[data-setup-output="${k}"]`).textContent=s[k];this.root.querySelector('#setup-resources-total').textContent=`${startingResourceTotal(s)} / ${STARTING_RESOURCE_CAPACITY}`;
    const stockpile=startingResourceTotal(s)?t('setup.summary.stockpile',{list:Object.entries(STARTING_RESOURCES).filter(([k])=>s[k]).map(([k,id])=>`${s[k]} ${t(`resource.${id}`)}`).join(', ')}):null;
    {const note=document.querySelector('#setup-map-size-note');if(note)note.hidden=s.mapSize<=100;}
    document.querySelector('#setup-summary').textContent=[t(`difficulty.${s.difficulty}`).toUpperCase(),wildlife,t('setup.summary.chests',{count:s.treasureCount}),t('setup.summary.stones',{count:s.initialStoneCount}),`${t('setup.fog')} ${on(s.fogOfWar)}`,`${t('setup.exploration')} ${on(s.explorationMode)}`,`${t('setup.seasons')} ${on(s.seasonsEnabled)}`,t('setup.summary.castle',{state:on(s.startingCastle)}),t('setup.summary.day',{seconds:s.dayLengthSeconds}),t('setup.summary.respawn',{mode:t(`setup.respawn.${s.wildlifeRespawn}`).split(' · ')[0]}),t('setup.summary.gold',{count:s.startingGold}),stockpile,s.mapSize!==100?t('setup.summary.mapSize',{size:s.mapSize}):null].filter(Boolean).join(' · ');
  }
}
