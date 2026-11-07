import { DAILY_REST } from '../data/needs.js';
import { WORK_RULES } from '../data/jobs.js';
import { buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';

// #58 phase B – daily life. In the last quarter of every game day a permanent resident finishes the task in hand
// (no task, reservation or cargo is ever cut off), takes no new one, walks to his home and rests there. A resident whose
// Rest falls below `tiredBelow` does the same earlier. Rest ends when rest time is over and Rest is back at `rested`;
// the resident then simply carries on with his job from where he is (no teleporting). Soldiers keep their guard,
// manual orders (Move, Hold) take priority, and fleeing or recovering hunters are handled before rest.
// Where he rests: next to his House, next to the Castle for the settlement's base places, otherwise where he stands.
export const isRestTime=gameTime=>!!gameTime&&gameTime.elapsed>=gameTime.dayDuration*DAILY_REST.startFraction;
export const RESTING_STATES=Object.freeze(['Going Home','Resting']);

export class DailyRest {
  constructor(system){this.system=system;this.scene=system.scene;}
  rest(worker){return this.scene.needs?.records.get(worker.id)?.rest??100;}
  eligible(worker){
    return !!this.scene.needs&&worker.isAlive&&worker.isSubject!==false&&!worker.arriving&&this.system.workers.get(worker.id)===worker
      &&(!worker.commandState||worker.commandState.state==='Working')&&!DAILY_REST.exempt.includes(worker.profession);
  }
  wants(worker){return isRestTime(this.scene.gameTime)||this.rest(worker)<DAILY_REST.tiredBelow;}
  // A task in hand, cargo or a Stablehand's taming job is finished first; the resident picks no new work meanwhile.
  busy(worker){return !!(worker.workTask||worker.cargo||this.scene.stables?.jobs?.has(worker.id));}
  done(worker){return !isRestTime(this.scene.gameTime)&&this.rest(worker)>=DAILY_REST.rested;}
  // Returns true while the resident goes home or rests; WorkerAI then skips his job for this frame.
  update(worker){
    if(!this.eligible(worker)){if(worker.restPhase)this.stop(worker);return false;}
    if(!worker.restPhase){
      if(!this.wants(worker)||this.busy(worker))return false;
      this.start(worker);
    }
    // Something outside the routine (a delivery the resident had to finish) took him away: walk home again.
    if(worker.restPhase==='resting'&&(worker.nextTile||worker.path.length))worker.restPhase='going';
    // Children D1: the evening on the Village Green is over – walk home for the rest of the night.
    if(worker.restPhase==='resting'&&worker.greenSeat&&!this.scene.childrenSystem?.eveningSeat?.(worker)){worker.greenSeat=false;worker.restPhase='going';}
    if(this.done(worker)){this.stop(worker);return false;}
    const home=this.scene.needs.homeOf(worker),kind=home?.kind??'homeless';
    if(worker.restPhase==='going')this.goHome(worker,kind);
    if(worker.restPhase==='resting'){
      worker.workState='Resting';
      worker.workMessage=worker.greenSeat?'Sitting on the Village Green':kind==='house'?'Resting at home':kind==='settlement'&&this.castle()?'Resting near the Castle':kind==='settlement'?'Resting at the camp':'Resting outdoors (no home)';
    }
    return true;
  }
  start(worker){
    this.system.gather?.release(worker,{stop:true});
    worker.path=[];worker.restPhase='going';worker.aiCooldown=0;
  }
  stop(worker){
    worker.restPhase=null;worker.greenSeat=false;worker.aiCooldown=0;
    if(RESTING_STATES.includes(worker.workState)){worker.workState=worker.profession==='idle'?'Idle':'Searching for Target';worker.workMessage='';}
  }
  castle(){return this.scene.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b))??null;}
  goals(kind,worker){
    // Children D1: early in the evening a few neighbours (during a Feast everyone) sit on the Village Green first.
    const seat=this.scene.childrenSystem?.eveningSeat?.(worker);worker.greenSeat=!!seat;if(seat)return [seat];
    const home=kind==='house'?this.scene.buildings.find(b=>b.id===this.scene.needs.homeOf(worker)?.buildingId):kind==='settlement'?this.castle():null;
    return home?towerNeighbors(home).filter(t=>this.scene.map[t.y]?.[t.x]===0):[];
  }
  goHome(worker,kind){
    const goals=this.goals(kind,worker);
    worker.workState='Going Home';
    worker.workMessage=worker.greenSeat?'Going to the Village Green':kind==='house'?'Going home to rest':kind==='settlement'&&goals.length?'Going to the Castle to rest':'Looking for a place to rest';
    if(worker.nextTile||worker.path.length)return;
    // No home, or the home cannot be reached: rest where he stands.
    if(!goals.length||goals.some(t=>tileKey(t)===tileKey(worker.tile))){worker.restPhase='resting';return;}
    if(worker.aiCooldown>0)return;
    worker.aiCooldown=WORK_RULES.searchInterval;
    if(!worker.moveTo(goals))worker.restPhase='resting';
  }
}
