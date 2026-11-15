import { TELEMETRY,telemetryHost } from '../data/telemetry.js';

// Owner 15 Nov: anonymous play statistics (GoatCounter). One page view per visit (unique players), then events:
// a new or loaded game, the first time this visit reaches a day milestone, and minutes of unpaused play.
export class Telemetry {
  constructor({storage=null,version='',hostname=globalThis.location?.hostname,send=null,config=TELEMETRY}={}){
    this.storage=storage;this.version=version;this.config=config;this.hostname=hostname;this.sendFn=send;
    this.days=new Set();this.minutes=new Set();this.playMs=0;this.last=null;this.visited=false;
  }
  get available(){return !!this.config.goatcounter&&telemetryHost(this.hostname,this.config.hosts);}
  get optedOut(){try{return this.storage?.getItem(this.config.storageKey)==='off';}catch{return false;}}
  setOptOut(off){try{off?this.storage?.setItem(this.config.storageKey,'off'):this.storage?.removeItem(this.config.storageKey);}catch{/* private mode: the choice lasts this visit */}this.offNow=off;}
  get enabled(){return this.available&&!(this.offNow??this.optedOut);}
  url(path,event){
    const q=new URLSearchParams({p:path,t:`Medieval Kingdom ${this.version}`,rnd:String(Math.random()).slice(2,10)});if(event)q.set('e','true');
    return`https://${this.config.goatcounter}.goatcounter.com/count?${q}`;
  }
  send(path,event=true){
    if(!this.enabled)return false;const url=this.url(path,event);
    if(this.sendFn)this.sendFn(url);else try{const img=new Image();img.referrerPolicy='no-referrer';img.src=url;}catch{/* best effort */}
    return true;
  }
  visit(){if(this.visited)return false;this.visited=true;return this.send(`/play/${this.version}`,false);}
  gameStarted(loaded){this.days.clear();return this.send(loaded?'/game/load':'/game/new');}
  // Called about once a second while a game exists.
  tick(day,running,now=Date.now()){
    if(this.last!==null&&running)this.playMs+=Math.min(5000,Math.max(0,now-this.last));this.last=now;
    for(const m of this.config.dayMilestones)if(day>=m&&!this.days.has(m)){this.days.add(m);this.send(`/day/${m}`);}
    const minutes=this.playMs/60000;for(const m of this.config.minuteMilestones)if(minutes>=m&&!this.minutes.has(m)){this.minutes.add(m);this.send(`/time/${m}min`);}
  }
}
