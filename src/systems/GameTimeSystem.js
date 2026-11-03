import { DEFAULT_GAME_SETTINGS } from './GameSettings.js';
export const DAY_DURATION=DEFAULT_GAME_SETTINGS.dayLengthSeconds*1000;

export class GameTimeSystem {
  constructor(dayDuration=DAY_DURATION){if(!Number.isFinite(dayDuration)||dayDuration<=0)throw new Error('Neplatná délka dne.');this.dayDuration=dayDuration;this.day=1;this.elapsed=0;this.totalElapsed=0;this.compensation=0;this.paused=false;this.listeners=new Set();this.advanceListeners=new Set();}
  onAdvance(listener){this.advanceListeners.add(listener);return()=>this.advanceListeners.delete(listener);}
  onNewDay(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  setPaused(value){this.paused=!!value;}
  exportState(){return {day:this.day,elapsed:this.elapsed,totalElapsed:this.totalElapsed,compensation:this.compensation};}
  importState(data){for(const k of ['day','elapsed','totalElapsed'])this[k]=data[k];this.compensation=data.compensation??0;}
  update(delta){
    if(this.paused||!Number.isFinite(delta)||delta<=0)return 0;
    let remaining=delta;
    while(remaining>0&&!this.paused){
      const step=Math.min(remaining,this.dayDuration-this.elapsed);
      for(const listener of this.advanceListeners)listener(step,this.day);
      // Kahanův součet drží přesnou hranici i při dlouhém dni a 144 FPS.
      const corrected=step-this.compensation,total=this.elapsed+corrected;
      this.compensation=(total-this.elapsed)-corrected;this.elapsed=total;remaining-=step;
      if(this.elapsed>=this.dayDuration-1e-7){
        this.elapsed=0;this.compensation=0;this.day++;
        this.totalElapsed=(this.day-1)*this.dayDuration;
        for(const listener of this.listeners)listener(this.day);
      }
      this.totalElapsed=(this.day-1)*this.dayDuration+this.elapsed;
    }
    return delta-remaining;
  }
  get remainingSeconds(){return Math.ceil((this.dayDuration-this.elapsed)/1000);}
  get label(){
    const format=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
    return `Day ${this.day} | ${format(this.remainingSeconds)} / ${format(this.dayDuration/1000)}`;
  }
  destroy(){this.listeners.clear();this.advanceListeners.clear();}
}
