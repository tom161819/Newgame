import { TIPS,TIP_PARK_DAYS } from '../data/tips.js';

// m-tipy-mimo-listu (report 0.83.0 point 2): which tip is in the bubble. At most one tip at a time; a tip that comes up
// while another is shown waits in a queue (first come, first shown) and is shown later if it still holds. A tip with
// no reaction for TIP_PARK_DAYS game days is folded into the Notices bar ("parked"); from there it can be opened again.
// Pure state with explicit game times (ms of game time), no DOM: TutorialGuide draws it.
export class TipQueue {
  constructor({seen=[],tips=TIPS}={}){this.tips=tips;this.seen=new Set(seen);this.current=null;this.shownAt=0;this.waiting=[];this.parked=new Map();}
  byId(id){return this.tips.find(tip=>tip.id===id)??null;}
  // Called a few times per second with the tips that hold now. Returns the tip that just opened, or null.
  next(holds,now=0){
    for(const tip of this.tips)if(!this.seen.has(tip.id)&&!this.parked.has(tip.id)&&!this.waiting.includes(tip.id)&&tip.id!==this.current?.id&&holds(tip.id))this.waiting.push(tip.id);
    if(this.current)return null;
    while(this.waiting.length){
      const id=this.waiting.shift();
      // A queued tip whose moment has passed is not shown now; it stays unseen and comes again next time.
      if(this.seen.has(id)||this.parked.has(id)||!holds(id))continue;
      return this.open(this.byId(id),now);
    }
    return null;
  }
  open(tip,now=0){if(!tip)return null;this.current=tip;this.shownAt=now;return tip;}
  // True when the shown tip has waited a game day without a reaction (the pointer over it holds it).
  due(now=0,dayMs=1,{held=false}={}){return !!this.current&&!held&&now-this.shownAt>=TIP_PARK_DAYS*dayMs;}
  // "Got it" / "More" (seen) or the switch turned off (not seen).
  close(seen=true){const tip=this.current;if(!tip)return null;if(seen)this.seen.add(tip.id);this.current=null;return tip;}
  // Folds the shown tip into the Notices bar: it counts as seen (it never pops up again by itself).
  park(now=0){const tip=this.current;if(!tip)return null;this.seen.add(tip.id);this.parked.set(tip.id,now);this.current=null;return tip;}
  // A parked tip opened from the Notices bar; a tip shown at that moment is parked in its place.
  reopen(id,now=0){if(!this.parked.has(id))return false;if(this.current)this.park(now);this.parked.delete(id);this.open(this.byId(id),now);return true;}
  // A parked tip closed in the Notices bar.
  drop(id){return this.parked.delete(id);}
  parkedList(){return [...this.parked].map(([id,at])=>({id,at})).sort((a,b)=>a.at-b.at||a.id.localeCompare(b.id));}
}
