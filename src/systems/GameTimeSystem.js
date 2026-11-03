import { DEFAULT_GAME_SETTINGS } from './GameSettings.js';
export const DAY_DURATION=DEFAULT_GAME_SETTINGS.dayLengthSeconds*1000;

export class GameTimeSystem {
  constructor(dayDuration=DAY_DURATION){if(!Number.isFinite(dayDuration)||dayDuration<=0)throw new Error('Neplatná délka dne.');this.dayDuration=dayDuration;this.day=1;this.elapsed=0;this.totalElapsed=0;this.compensation=0;this.paused=false;this.listeners=new Set();this.advanceListeners=new Set();this.afterAdvanceListeners=new Set();this.boundaries=new Set();}
  onAdvance(listener){this.advanceListeners.add(listener);return()=>this.advanceListeners.delete(listener);}
  onAfterAdvance(listener){this.afterAdvanceListeners.add(listener);return()=>this.afterAdvanceListeners.delete(listener);}
  addBoundary(provider){this.boundaries.add(provider);return()=>this.boundaries.delete(provider);}
  onNewDay(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  setPaused(value){this.paused=!!value;}
  exportState(){return {day:this.day,elapsed:this.elapsed,totalElapsed:this.totalElapsed,compensation:this.compensation};}
  importState(data){for(const k of ['day','elapsed','totalElapsed'])this[k]=data[k];this.compensation=data.compensation??0;}
  update(delta){
    if(this.paused||!Number.isFinite(delta)||delta<=0)return 0;
    let remaining=delta;
    while(remaining>0&&!this.paused){
      let step=Math.min(remaining,this.dayDuration-this.elapsed);
      for(const boundary of this.boundaries){const limit=boundary();if(!(limit>0))throw new Error('Neplatná časová hranice simulace.');step=Math.min(step,limit);}
      for(const listener of this.advanceListeners)listener(step,this.day);
      // Kahanův součet drží přesnou hranici i při dlouhém dni a 144 FPS.
      const corrected=step-this.compensation,total=this.elapsed+corrected;
      this.compensation=(total-this.elapsed)-corrected;this.elapsed=total;remaining-=step;
      const newDay=this.elapsed>=this.dayDuration-1e-7;
      if(newDay){
        this.elapsed=0;this.compensation=0;this.day++;
      }
      this.totalElapsed=(this.day-1)*this.dayDuration+this.elapsed;
      // Apply the old phase to the entire step, then commit phase changes
      // before income, payroll and the other daily events.
      for(const listener of this.afterAdvanceListeners)listener(step,this.day);
      if(newDay)for(const listener of this.listeners)listener(this.day);
    }
    return delta-remaining;
  }
  get remainingSeconds(){return Math.ceil((this.dayDuration-this.elapsed)/1000);}
  get label(){
    const format=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
    return `Day ${this.day} | ${format(this.remainingSeconds)} / ${format(this.dayDuration/1000)}`;
  }
  destroy(){this.listeners.clear();this.advanceListeners.clear();this.afterAdvanceListeners.clear();this.boundaries.clear();}
}
