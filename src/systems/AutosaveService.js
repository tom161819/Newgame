// Autosave: one fixed slot written through the existing SaveGameManager.
// It counts only real active play (GameScene calls update after its pause and
// hidden-tab checks), never runs two writes at once, writes only a validated
// snapshot and keeps the previous Autosave whenever a write fails.
export const AUTOSAVE_ID='autosave',AUTOSAVE_NAME='Autosave';
export const AUTOSAVE_INTERVALS=Object.freeze([60000,120000,300000,600000]);
export const AUTOSAVE_DEFAULTS=Object.freeze({enabled:true,intervalMs:300000});
const STORAGE_KEY='newgame.autosave';

export function readAutosaveSettings(storage){
  try{const data=JSON.parse(storage?.getItem(STORAGE_KEY)??'{}');return {enabled:data?.enabled!==false,intervalMs:AUTOSAVE_INTERVALS.includes(data?.intervalMs)?data.intervalMs:AUTOSAVE_DEFAULTS.intervalMs};}
  catch{return {...AUTOSAVE_DEFAULTS};}
}
export function saveAutosaveSettings(storage,settings){try{storage?.setItem(STORAGE_KEY,JSON.stringify({enabled:settings.enabled,intervalMs:settings.intervalMs}));}catch{/* Autosave still works for this session. */}}

export class AutosaveService {
  constructor({saves,snapshot,onStatus=()=>{},settings=AUTOSAVE_DEFAULTS}){
    Object.assign(this,{saves,snapshot,onStatus});this.configure(settings);
    this.elapsed=0;this.pending=null;this.lastSuccess=null;this.lastPlayTime=null;this.failing=false;
  }
  configure({enabled,intervalMs}){this.enabled=enabled!==false;this.intervalMs=AUTOSAVE_INTERVALS.includes(intervalMs)?intervalMs:AUTOSAVE_DEFAULTS.intervalMs;this.elapsed=Math.min(this.elapsed??0,this.intervalMs);}
  // A new or loaded game starts its own interval; a write still in flight finishes on its own.
  reset(){this.elapsed=0;this.lastPlayTime=null;}
  get saving(){return !!this.pending;}
  update(deltaMs){
    if(!this.enabled||this.pending||!(deltaMs>0))return;
    this.elapsed+=deltaMs;if(this.elapsed>=this.intervalMs)this.run();
  }
  run(){
    if(this.pending)return this.pending;
    this.elapsed=0;let state;
    try{state=this.snapshot();}catch(error){this.fail(error);return Promise.resolve(false);}
    if(state?.time?.totalElapsed===this.lastPlayTime)return Promise.resolve(false);
    this.pending=this.saves.save({id:AUTOSAVE_ID,name:AUTOSAVE_NAME,state,create:true})
      .then(record=>{this.lastPlayTime=state.time.totalElapsed;this.lastSuccess={at:record.updatedAt,day:record.day};const recovered=this.failing;this.failing=false;this.onStatus({type:'saved',...this.lastSuccess,recovered});return true;})
      .catch(error=>{this.fail(error);return false;})
      .finally(()=>{this.pending=null;});
    return this.pending;
  }
  // Reported once per failure streak; the next success clears it.
  fail(error){const first=!this.failing;this.failing=true;this.onStatus({type:'failed',message:error?.message||'Autosave failed.',first,lastSuccess:this.lastSuccess});}
}
