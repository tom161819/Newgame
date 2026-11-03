const STORAGE_KEY='newgame.settings';
export function readSettings(storage){
  try{const data=JSON.parse(storage.getItem(STORAGE_KEY)??'{}');return {fogOfWar:data?.fogOfWar===true};}
  catch{return {fogOfWar:false};}
}
export function saveSettings(storage,settings){
  try{const data=JSON.parse(storage.getItem(STORAGE_KEY)??'{}');storage.setItem(STORAGE_KEY,JSON.stringify({...data,...settings}));}
  catch{/* Hra funguje i při zakázaném úložišti. */}
}
export class SettingsPanel {
  constructor(onChange,onOpenChange=()=>{}){
    this.onOpenChange=onOpenChange;
    this.button=document.querySelector('#settings-button');this.panel=document.querySelector('#settings-panel');
    this.toggle=document.querySelector('#fog-toggle');this.controller=new AbortController();const options={signal:this.controller.signal};
    let storage;try{storage=window.localStorage;}catch{}
    this.settings=readSettings(storage);this.toggle.checked=this.settings.fogOfWar;this.setOpen(false);
    this.button.addEventListener('click',()=>this.setOpen(!this.open),options);
    document.querySelector('#close-settings').addEventListener('click',()=>this.setOpen(false),options);
    for(const event of ['pointerdown','mousedown','mouseup','click','wheel'])this.panel.addEventListener(event,e=>e.stopPropagation(),options);
    this.toggle.addEventListener('change',()=>{this.settings.fogOfWar=this.toggle.checked;saveSettings(storage,this.settings);onChange(this.settings);},options);
  }
  applySettings(settings){this.settings={...settings};this.toggle.checked=settings.fogOfWar;let storage;try{storage=window.localStorage;}catch{}saveSettings(storage,this.settings);}
  setOpen(value){const previous=this.open;this.open=value;this.panel.classList.toggle('open',value);this.panel.inert=!value;this.panel.setAttribute('aria-hidden',String(!value));this.button.setAttribute('aria-expanded',String(value));if(previous!==undefined&&previous!==value)this.onOpenChange(value);}
  destroy(){this.controller.abort();this.setOpen(false);}
}
