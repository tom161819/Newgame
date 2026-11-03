const STORAGE_KEY='newgame.settings';
export function readSettings(storage){
  try{const data=JSON.parse(storage.getItem(STORAGE_KEY)??'{}');return {fogOfWar:data?.fogOfWar===true,pathWearDebug:data?.pathWearDebug===true};}
  catch{return {fogOfWar:false,pathWearDebug:false};}
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
    this.toggle=document.querySelector('#fog-toggle');this.controller=new AbortController();const options={signal:this.controller.signal};
    this.pathToggle=document.querySelector('#path-wear-toggle');
    let storage;try{storage=window.localStorage;}catch{}
    this.settings=readSettings(storage);this.toggle.checked=this.settings.fogOfWar;this.pathToggle.checked=this.settings.pathWearDebug;this.setOpen(false);
    this.button.addEventListener('click',()=>this.setOpen(!this.open),options);
    document.querySelector('#close-settings').addEventListener('click',()=>this.setOpen(false),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.toggle.addEventListener('change',()=>{this.settings.fogOfWar=this.toggle.checked;saveSettings(storage,this.settings);onChange(this.settings);},options);
    this.pathToggle.addEventListener('change',()=>{this.settings.pathWearDebug=this.pathToggle.checked;saveSettings(storage,this.settings);onChange(this.settings);},options);
    this.seasonToggle.addEventListener('change',()=>{onSeasonsChange?.(this.seasonToggle.checked);this.syncSeasons();},options);
  }
  syncSeasons(){this.seasonToggle.checked=this.seasons?.enabled??true;}
  applySettings(settings){this.settings={pathWearDebug:false,...settings};this.toggle.checked=this.settings.fogOfWar;this.pathToggle.checked=this.settings.pathWearDebug;let storage;try{storage=window.localStorage;}catch{}saveSettings(storage,this.settings);}
  setOpen(value){const previous=this.open;this.open=value;this.panel.classList.toggle('open',value);this.panel.inert=!value;this.panel.setAttribute('aria-hidden',String(!value));this.button.setAttribute('aria-expanded',String(value));if(previous!==undefined&&previous!==value)this.onOpenChange(value);}
  destroy(){this.controller.abort();this.setOpen(false);}
}
