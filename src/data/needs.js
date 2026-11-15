// S13 (#58) Villager Needs & Happiness. Values are 0–100; rates are per game day (they follow the Game Setup day length).
export const NEEDS=Object.freeze({
  weights:Object.freeze({food:.35,rest:.25,housing:.25,safety:.15}),
  // Food follows only the existing daily meal: a resident without a missed meal recovers, a hungry one declines.
  // m-hlad-nasledky (owner 14 Nov 2026): a resident without food loses more Happiness the longer it lasts – after the
  // first full day `perDay` points for every further day, at most `max`. So about 3 days of hunger bring a strike and
  // about a week makes the resident leave (DISCONTENT); the kingdom's Happiness and with it new arrivals fall too.
  food:Object.freeze({recoverPerDay:100,declinePerDay:50,low:20,starving:Object.freeze({afterDays:1,perDay:12,max:50})}),
  // Active work tires; waiting and idling restore. The daily rest at home (phase B) replaces the idle recovery.
  rest:Object.freeze({drainPerDay:30,recoverPerDay:60,low:20}),
  safety:Object.freeze({base:45,castle:{bonus:25,range:12},tower:{bonus:15,range:10},guard:{bonus:10,range:10},attack:{penalty:30,days:1},
    // Owner 15 Nov 2026: one soldier at home per `perResidents` residents gives the full garrison bonus; fewer give less.
    garrison:{bonus:15,perResidents:5}}),
  unpaid:Object.freeze({perGold:5,max:30}),
  // Work speed of every task (phase C): FinalWorkSpeed = base × skill × hunger × mood.work. Walking and combat are not affected.
  moods:Object.freeze([{id:'happy',min:70,work:1.1},{id:'neutral',min:40,work:1},{id:'unhappy',min:25,work:.8},{id:'critical',min:0,work:.8}]),
  activeStates:Object.freeze(['Working','Traveling to Target','Searching for Target','Going to Workplace','Returning to Workplace','Patrolling','Fleeing','MovingToHold']),
  updateMs:1000,
});
// #58 phase B daily life: the last quarter of every game day is rest time (it follows the Game Setup day length).
// A resident finishes the task in hand, takes no new one, walks home and rests; a very tired one rests early. Rest ends
// when rest time is over and Rest is back at `rested`. Recovery depends on where the resident sleeps.
export const DAILY_REST=Object.freeze({
  startFraction:.75,tiredBelow:20,rested:60,
  recoverPerDay:Object.freeze({house:400,settlement:300,homeless:150}),
  exempt:Object.freeze(['soldier']),
});
export const starvingPenalty=days=>{const r=NEEDS.food.starving;return Math.round(Math.min(r.max,Math.max(0,(days??0)-r.afterDays)*r.perDay));};
export const clampNeed=value=>Math.max(0,Math.min(100,value));
// Kingdom Happiness (average of residents) as a modifier of the existing Kingdom Attractiveness (#58 phase C).
export const HAPPINESS_ATTRACTIVENESS=Object.freeze([{min:75,value:15},{min:50,value:0},{min:30,value:-20},{min:0,value:-45}]);
export const attractivenessFor=happiness=>happiness==null?0:HAPPINESS_ATTRACTIVENESS.find(r=>happiness>=r.min).value;
export const moodFor=happiness=>NEEDS.moods.find(m=>happiness>=m.min)??NEEDS.moods.at(-1);
// Weighted Happiness minus the separate unpaid-wage penalty (counted once), rounded to 0–100.
export function happinessOf({food,rest,housing,safety},unpaidPenalty=0){
  const w=NEEDS.weights;return Math.round(clampNeed(food*w.food+rest*w.rest+housing*w.housing+safety*w.safety-unpaidPenalty));
}
// The biggest single loss of Happiness, or null when nothing is notably wrong.
export function mainProblem(needs,unpaidPenalty=0,policyLoss=0){
  const losses=Object.entries(NEEDS.weights).map(([id,weight])=>({id,loss:weight*(100-needs[id]),value:needs[id]}));
  if(unpaidPenalty>0)losses.push({id:'wages',loss:unpaidPenalty,value:0});
  // Policy v2 P2: the kingdom policy (taxes and its situation penalties) can be the biggest loss.
  if(policyLoss>0)losses.push({id:'policy',loss:policyLoss,value:0});
  const worst=losses.filter(l=>['wages','policy'].includes(l.id)||l.value<70).sort((a,b)=>b.loss-a.loss)[0];return worst?worst.id:null;
}

// #58 phase C2 (S13 §8–9): strikes and emigration. m-prichody-odchody (owner 14 Nov 2026): residents strike and leave
// sooner – a strike below 35 (was 25), leaving below 25 for two days (was 15 for three).
export const DISCONTENT=Object.freeze({strikeBelow:35,strikeDays:2,strikeEndsAt:50,emigrateBelow:25,emigrateDays:2,retryMs:5000});
