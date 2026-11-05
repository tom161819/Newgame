import { PATH_WEAR,wearLevel } from '../data/pathWear.js';
import { PAVEMENT } from '../data/pavement.js';

export class PathWearSystem {
  constructor({map,terrain,time,isGrass=null}){
    Object.assign(this,{map,terrain,time});this.width=map[0].length;this.height=map.length;const size=this.width*this.height;
    this.scores=new Float64Array(size);this.paved=new Uint8Array(size);this.pavedCount=0;this.levels=new Uint8Array(size);this.lastPassDays=new Uint32Array(size);
    this.active=new Set();this.listeners=new Set();this.revision=0;this.levelRevision=0;this.highestLevel=0;this.lastDecayDay=time.day;
    this.grassTest=isGrass??(tile=>this.terrain[tile.y]?.[tile.x]===0);
    this.unsubscribe=time.onNewDay(day=>this.onNewDay(day));
  }
  index(tile){return tile.y*this.width+tile.x;}
  isGrass(tile){return Number.isInteger(tile.x)&&Number.isInteger(tile.y)&&this.map[tile.y]?.[tile.x]===0&&this.grassTest(tile);}
  affects(actor){return (actor.definition?.gameplay?.tramplesTerrain??actor.definition?.category==='character')&&(actor.state==null||actor.state==='ground');}
  level(tile){return this.isGrass(tile)?this.levels[this.index(tile)]:0;}
  // S11: Stone Pavement is a permanent surface on this same layer. It replaces (never adds to) the trodden-path bonus
  // and speeds every walker on the ground, ridden horses included; wear stays stored underneath for later removal.
  isPaved(tile){return Number.isInteger(tile.x)&&Number.isInteger(tile.y)&&tile.x>=0&&tile.y>=0&&tile.x<this.width&&tile.y<this.height&&this.paved[this.index(tile)]===1;}
  setPaved(tile,value){const i=this.index(tile),next=value?1:0;if(this.paved[i]===next)return false;this.paved[i]=next;this.pavedCount+=next?1:-1;this.revision++;this.levelRevision++;for(const listener of this.listeners)listener(tile);return true;}
  speedMultiplier(actor,tile){if(this.isPaved(tile)&&(actor.state==null||actor.state==='ground'||actor.mountedHorse))return PAVEMENT.speedMultiplier;return this.affects(actor)?PATH_WEAR.speedMultipliers[this.level(tile)]:1;}
  routingOptions(actor){const ground=actor.state&&actor.state!=='ground'?{definition:actor.definition,state:'ground'}:actor;return {speedMultiplier:tile=>this.speedMultiplier(ground,tile),maxSpeed:Math.max(PATH_WEAR.speedMultipliers[this.highestLevel],this.pavedCount?PAVEMENT.speedMultiplier:1)};}
  enter(actor,tile){
    if(!this.affects(actor)||!this.isGrass(tile))return;
    const i=this.index(tile);this.scores[i]=Math.min(Number.MAX_SAFE_INTEGER,this.scores[i]+(actor.mountedHorse?2:1));
    this.lastPassDays[i]=this.time.day;this.active.add(i);this.revision++;this.refreshLevel(i);
  }
  subscribe(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  refreshLevel(i){
    const level=wearLevel(this.scores[i]);if(this.levels[i]===level)return;
    this.levels[i]=level;this.highestLevel=Math.max(this.highestLevel,level);this.levelRevision++;
    const tile={x:i%this.width,y:Math.floor(i/this.width)};for(const listener of this.listeners)listener(tile);
  }
  onNewDay(day){
    if(day<=this.lastDecayDay)return;
    for(let cycle=this.lastDecayDay+1;cycle<=day;cycle++)for(const i of this.active){
      if(cycle-this.lastPassDays[i]<PATH_WEAR.recoveryDelayDays)continue;
      this.scores[i]=Math.max(0,this.scores[i]-PATH_WEAR.recoveryPerDay);this.revision++;this.refreshLevel(i);
      if(!this.scores[i])this.active.delete(i);
    }
    this.lastDecayDay=day;
  }
  exportState(){const paved=[];for(let i=0;i<this.paved.length;i++)if(this.paved[i])paved.push(i);return {scores:Array.from(this.scores),levels:Array.from(this.levels),lastPassDays:Array.from(this.lastPassDays),lastDecayDay:this.lastDecayDay,paved};}
  importState(data){
    this.scores.fill(0);this.levels.fill(0);this.lastPassDays.fill(0);this.paved.fill(0);this.pavedCount=0;this.active.clear();this.highestLevel=0;
    if(data){this.scores.set(data.scores);this.levels.set(data.levels);this.lastPassDays.set(data.lastPassDays);this.lastDecayDay=data.lastDecayDay;for(const i of data.paved??[]){this.paved[i]=1;this.pavedCount++;}}
    else this.lastDecayDay=this.time.day;
    for(let i=0;i<this.scores.length;i++)if(this.scores[i]){this.active.add(i);this.highestLevel=Math.max(this.highestLevel,this.levels[i]);}
    this.revision++;this.levelRevision++;
  }
  destroy(){this.unsubscribe();this.listeners.clear();}
}
