import { MEMORY_BRIGHTNESS,clampMemoryBrightness } from '../systems/FogOfWarSystem.js';
const STORAGE_KEY='newgame.settings';
export function readSettings(storage){
  try{const data=JSON.parse(storage.getItem(STORAGE_KEY)??'{}');return {fogOfWar:data?.fogOfWar===true,explorationMode:data?.explorationMode!==false,pathWearDebug:data?.pathWearDebug===true,memoryBrightness:clampMemoryBrightness(data?.memoryBrightness??MEMORY_BRIGHTNESS.default)};}
  catch{return {fogOfWar:false,explorationMode:true,pathWearDebug:false,memoryBrightness:MEMORY_BRIGHTNESS.default};}
}
export function saveSettings(storage,settings){
  try{const data=JSON.parse(storage.getItem(STORAGE_KEY)??'{}');storage.setItem(STORAGE_KEY,JSON.stringify({...data,...settings}));}
  catch{/* Hra funguje i při zakázaném úložišti. */}
}
export class SettingsPanel {
  constructor(onChange,onOpenChange=()=>{},{seasons,onSeasonsChange}={}){
    this.seasons=seasons;this.seasonToggle=document.querySelector('#seasons-toggle');this.syncSeasons();
    this.onOpenChange=onOpenChange;
    this.button=document.querySelector('#settings-button');this.panel=document.querySelector('#settings-panel');
    this.toggle=document.querySelector('#fog-toggle');this.explorationToggle=document.querySelector('#exploration-toggle');this.controller=new AbortController();const options={signal:this.controller.signal};
    this.pathToggle=document.querySelector('#path-wear-toggle');
    this.brightness=document.querySelector('#memory-brightness');this.brightnessValue=document.querySelector('#memory-brightness-value');
    let storage;try{storage=window.localStorage;}catch{}
    this.settings=readSettings(storage);this.toggle.checked=this.settings.fogOfWar;this.explorationToggle.checked=this.settings.explorationMode;this.pathToggle.checked=this.settings.pathWearDebug;this.syncBrightness();this.setOpen(false);
    this.button.addEventListener('click',()=>this.setOpen(!this.open),options);
    document.querySelector('#close-settings').addEventListener('click',()=>this.setOpen(false),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.toggle.addEventListener('change',()=>{this.settings.fogOfWar=this.toggle.checked;saveSettings(storage,this.settings);onChange(this.settings);},options);
    this.explorationToggle.addEventListener('change',()=>{this.settings.explorationMode=this.explorationToggle.checked;saveSettings(storage,this.settings);onChange(this.settings);},options);
    this.pathToggle.addEventListener('change',()=>{this.settings.pathWearDebug=this.pathToggle.checked;saveSettings(storage,this.settings);onChange(this.settings);},options);
    // Live while dragging; stored in this browser only, never in a save (#129).
    const setBrightness=value=>{this.settings.memoryBrightness=clampMemoryBrightness(value);this.syncBrightness();saveSettings(storage,{memoryBrightness:this.settings.memoryBrightness});onChange(this.settings);};
    this.brightness?.addEventListener('input',()=>setBrightness(Number(this.brightness.value)/100),options);
    document.querySelector('#memory-brightness-reset')?.addEventListener('click',()=>setBrightness(MEMORY_BRIGHTNESS.default),options);
    this.seasonToggle.addEventListener('change',()=>{onSeasonsChange?.(this.seasonToggle.checked);this.syncSeasons();},options);
  }
  syncBrightness(){const b=this.settings.memoryBrightness;if(this.brightness){this.brightness.min=String(MEMORY_BRIGHTNESS.min*100);this.brightness.max=String(MEMORY_BRIGHTNESS.max*100);this.brightness.step=String(MEMORY_BRIGHTNESS.step*100);this.brightness.value=String(Math.round(b*100));}if(this.brightnessValue)this.brightnessValue.textContent=`${Math.round(b*100)} %`;}
  syncSeasons(){this.seasonToggle.checked=this.seasons?.enabled??true;}
  applySettings(settings){const {memoryBrightness:_,...game}=settings;this.settings={pathWearDebug:false,explorationMode:true,...game,memoryBrightness:this.settings.memoryBrightness};this.toggle.checked=this.settings.fogOfWar;this.explorationToggle.checked=this.settings.explorationMode;this.pathToggle.checked=this.settings.pathWearDebug;let storage;try{storage=window.localStorage;}catch{}saveSettings(storage,this.settings);}
  setOpen(value){const previous=this.open;this.open=value;this.panel.classList.toggle('open',value);this.panel.inert=!value;this.panel.setAttribute('aria-hidden',String(!value));this.button.setAttribute('aria-expanded',String(value));if(previous!==undefined&&previous!==value)this.onOpenChange(value);}
  destroy(){this.controller.abort();this.setOpen(false);}
}
