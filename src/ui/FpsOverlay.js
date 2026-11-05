import { t } from '../i18n/index.js';
// NEW16 developer interface. Per-browser options (localStorage), never part of a save.
const STORAGE_KEY='newgame.dev';
export const DEV_DEFAULTS=Object.freeze({showFps:false});
export const FRAME_RULES=Object.freeze({windowMs:5000,stutterMs:50,refreshMs:250,capacity:1024});
export function readDevSettings(storage){try{const d=JSON.parse(storage?.getItem(STORAGE_KEY)??'{}');return {showFps:d?.showFps===true};}catch{return {...DEV_DEFAULTS};}}
export function saveDevSettings(storage,settings){try{const d=JSON.parse(storage?.getItem(STORAGE_KEY)??'{}');storage.setItem(STORAGE_KEY,JSON.stringify({...d,...settings}));}catch{/* The game also runs without storage. */}}

// Ring buffer of frame end times and durations: no allocation per frame.
export class FrameStats {
  constructor(capacity=FRAME_RULES.capacity){this.at=new Float64Array(capacity);this.ms=new Float32Array(capacity);this.head=0;this.size=0;this.last=null;}
  reset(){this.head=0;this.size=0;this.last=null;}
  frame(now){if(this.last!==null){const i=(this.head+this.size)%this.at.length;this.at[i]=now;this.ms[i]=now-this.last;if(this.size<this.at.length)this.size++;else this.head=(this.head+1)%this.at.length;}this.last=now;}
  summary(now,{windowMs=FRAME_RULES.windowMs,stutterMs=FRAME_RULES.stutterMs}={}){
    while(this.size&&this.at[this.head]<now-windowMs){this.head=(this.head+1)%this.at.length;this.size--;}
    let second=0,worst=0,stutters=0;
    for(let k=0;k<this.size;k++){const i=(this.head+k)%this.at.length,ms=this.ms[i];if(this.at[i]>=now-1000)second++;if(ms>worst)worst=ms;if(ms>stutterMs)stutters++;}
    return {fps:second,worstMs:Math.round(worst),stutters};
  }
}

export class FpsOverlay {
  constructor(game,{storage,document:doc=globalThis.document,now=()=>performance.now(),camera=()=>null}={}){
    this.game=game;this.storage=storage;this.now=now;this.camera=camera;this.stats=new FrameStats();this.nextRefresh=0;this.text='';
    this.element=doc.querySelector('#fps-overlay');this.toggle=doc.querySelector('#dev-fps-toggle');
    this.settings=readDevSettings(storage);this.controller=new AbortController();const options={signal:this.controller.signal};
    this.onFrame=()=>this.frame();
    this.toggle?.addEventListener('change',()=>this.setEnabled(this.toggle.checked),options);
    doc.defaultView?.addEventListener('keydown',e=>{if(e.key==='F3'&&!e.repeat){e.preventDefault();this.setEnabled(!this.settings.showFps);}},options);
    this.setEnabled(this.settings.showFps,false);
  }
  get enabled(){return this.settings.showFps;}
  setEnabled(value,persist=true){
    const on=value===true;this.settings.showFps=on;if(this.toggle)this.toggle.checked=on;if(persist)saveDevSettings(this.storage,this.settings);
    // Off costs nothing: no listener on the game loop and a hidden element.
    this.game.events.off('postrender',this.onFrame);this.stats.reset();this.nextRefresh=0;
    if(on)this.game.events.on('postrender',this.onFrame);
    if(this.element){this.element.hidden=!on;if(!on){this.element.textContent='';this.text='';}}
  }
  frame(){
    const now=this.now();this.stats.frame(now);if(now<this.nextRefresh||!this.element)return;this.nextRefresh=now+FRAME_RULES.refreshMs;
    const s=this.stats.summary(now),renderer=this.game.renderer?.type===2?'WebGL':'Canvas',zoom=this.camera()?.zoom;
    const text=t('dev.fpsOverlay',{fps:s.fps,worst:s.worstMs,stutters:s.stutters,renderer,zoom:Number.isFinite(zoom)?zoom.toFixed(2):'—'});
    if(text!==this.text){this.text=text;this.element.textContent=text;}
  }
  destroy(){this.controller.abort();this.game.events.off('postrender',this.onFrame);if(this.element)this.element.hidden=true;}
}
