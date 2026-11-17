import { DAILY_REST } from '../data/needs.js';
import { DAY_NIGHT } from '../data/dayNight.js';
import { WORK_RULES } from '../data/jobs.js';
import { buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';

// #58 phase B – daily life. In the last quarter of every game day a permanent resident finishes the task in hand
// (no task, reservation or cargo is ever cut off), takes no new one, walks to his home and rests there. A resident whose
// Rest falls below `tiredBelow` does the same earlier. Rest ends when rest time is over and Rest is back at `rested`;
// the resident then simply carries on with his job from where he is (no teleporting). Soldiers keep their guard,
// manual orders (Move, Hold) take priority, and fleeing or recovering hunters are handled before rest.
// Where he rests: next to his House, next to the Castle for the settlement's base places, otherwise where he stands.
// Day and night N1: sleep starts with the night (DayNightSystem sets `restStartFraction` on the game time); without it
// the old fixed start (75 % of the day) applies.
export const restStart=gameTime=>gameTime?.restStartFraction?.()??DAILY_REST.startFraction;
export const isRestTime=gameTime=>!!gameTime&&gameTime.elapsed>=gameTime.dayDuration*restStart(gameTime);
// Soldiers keep the night watch and sleep in the first third of the day instead (only with the day/night cycle).
// m-vojaci-chyba (owner point 87): not on day 1 – they have stood no night watch yet. A new game starts at the dawn of
// day 1, so the starting garrison used to walk into the Castle at once and sleep there, hidden, for the first third of
// the day: "they are in the population but I can't find them".
export const isSoldierRestTime=gameTime=>!!gameTime?.restStartFraction&&(gameTime.day??2)>1&&gameTime.elapsed>=gameTime.dayDuration*DAY_NIGHT.soldierRest.from&&gameTime.elapsed<gameTime.dayDuration*DAY_NIGHT.soldierRest.to;
export const RESTING_STATES=Object.freeze(['Going Home','Resting']);

export class DailyRest {
  constructor(system){this.system=system;this.scene=system.scene;}
  rest(worker){return this.scene.needs?.records.get(worker.id)?.rest??100;}
  eligible(worker){
    return !!this.scene.needs&&worker.isAlive&&worker.isSubject!==false&&!worker.arriving&&this.system.workers.get(worker.id)===worker
      &&(!worker.commandState||worker.commandState.state==='Working')&&/* owner 17 Nov 2026: a soldier on a wall order keeps it, like a manual order */!worker.wallPatrol&&(!DAILY_REST.exempt.includes(worker.profession)||this.nightWatch(worker));
  }
  // A soldier on the night watch (day/night cycle on) rests in the first third of the day, never at night.
  nightWatch(worker){return worker.profession==='soldier'&&!!this.scene.gameTime?.restStartFraction;}
  wants(worker){if(this.nightWatch(worker))return isSoldierRestTime(this.scene.gameTime);return isRestTime(this.scene.gameTime)||this.rest(worker)<DAILY_REST.tiredBelow;}
  // A task in hand, cargo or a Stablehand's taming job is finished first; the resident picks no new work meanwhile.
  busy(worker){return !!(worker.workTask||worker.cargo||this.scene.stables?.jobs?.has(worker.id));}
  done(worker){if(this.nightWatch(worker))return !isSoldierRestTime(this.scene.gameTime);return !isRestTime(this.scene.gameTime)&&this.rest(worker)>=DAILY_REST.rested;}
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
    if(worker.restPhase==='going'){worker.sleepingIn=null;this.goHome(worker,kind);}
    if(worker.restPhase==='resting'){
      // m-obyvatele-jmena-spanek-pohyb (42): at the door of his House (or of the Castle) he sleeps inside, hidden.
      const shelter=this.shelter(worker,kind),inside=!!shelter&&!worker.nextTile&&!worker.path.length&&towerNeighbors(shelter).some(t=>t.x===worker.tile.x&&t.y===worker.tile.y);
      worker.sleepingIn=inside?shelter.id:null;worker.workState='Resting';
      worker.workMessage=inside?(shelter.type==='castle'?'Sleeping in the Castle':'Sleeping at home'):worker.greenSeat?'Sitting on the Village Green':kind==='house'?'Resting at home':kind==='settlement'&&this.castle()?'Resting near the Castle':kind==='settlement'?'Resting at the camp':'Resting outdoors (no home)';
    }
    return true;
  }
  start(worker){
    this.system.gather?.release(worker,{stop:true});
    worker.path=[];worker.restPhase='going';worker.aiCooldown=0;
  }
  stop(worker){
    worker.restPhase=null;worker.sleepingIn=null;worker.greenSeat=false;worker.aiCooldown=0;
    if(RESTING_STATES.includes(worker.workState)){worker.workState=worker.profession==='idle'?'Idle':'Searching for Target';worker.workMessage='';}
  }
  // (42) The building a resting resident sleeps in: his completed House, the Castle for the settlement's base places;
  // none on the Village Green or while it burns (sleepers come out of a burning house).
  shelter(worker,kind){
    if(worker.greenSeat)return null;
    const homeId=kind==='house'?this.scene.needs.homeOf(worker)?.buildingId:null,b=kind==='house'?this.scene.buildings.find(x=>x.id===homeId):kind==='settlement'?this.castle():null;
    return b&&buildingIsComplete(b)&&!this.scene.nightThreats?.burning?.(b)?b:null;
  }
  castle(){return this.scene.buildings.find(b=>b.type==='castle'&&buildingIsComplete(b))??null;}
  goals(kind,worker){
    // Children D1: early in the evening a few neighbours (during a Feast everyone) sit on the Village Green first.
    const seat=this.scene.childrenSystem?.eveningSeat?.(worker);worker.greenSeat=!!seat;if(seat)return [seat];
    const homeId=kind==='house'?this.scene.needs.homeOf(worker)?.buildingId:null,home=kind==='house'?this.scene.buildings.find(b=>b.id===homeId):kind==='settlement'?this.castle():null;
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
