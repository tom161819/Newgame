export const DAY_DURATION=120000;

export class GameTimeSystem {
  constructor(){this.day=1;this.elapsed=0;this.totalElapsed=0;this.paused=false;this.listeners=new Set();this.advanceListeners=new Set();}
  onAdvance(listener){this.advanceListeners.add(listener);return()=>this.advanceListeners.delete(listener);}
  onNewDay(listener){this.listeners.add(listener);return()=>this.listeners.delete(listener);}
  setPaused(value){this.paused=!!value;}
  exportState(){return {day:this.day,elapsed:this.elapsed,totalElapsed:this.totalElapsed};}
  importState(data){Object.assign(this,data);}
  update(delta){
    if(this.paused||!Number.isFinite(delta)||delta<=0)return 0;
    let remaining=delta;
    while(remaining>0&&!this.paused){
      const step=Math.min(remaining,DAY_DURATION-this.elapsed);
      for(const listener of this.advanceListeners)listener(step,this.day);
      this.elapsed+=step;this.totalElapsed+=step;remaining-=step;
      if(this.elapsed>=DAY_DURATION-1e-7){
        this.elapsed=0;this.day++;
        for(const listener of this.listeners)listener(this.day);
      }
    }
    return delta-remaining;
  }
  get remainingSeconds(){return Math.ceil((DAY_DURATION-this.elapsed)/1000);}
  get label(){
    const format=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
    return `Day ${this.day} | ${format(this.remainingSeconds)} / ${format(DAY_DURATION/1000)}`;
  }
  destroy(){this.listeners.clear();this.advanceListeners.clear();}
}
