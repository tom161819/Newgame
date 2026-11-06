// S13 (#58) Villager Needs & Happiness. Values are 0–100; rates are per game day (they follow the Game Setup day length).
export const NEEDS=Object.freeze({
  weights:Object.freeze({food:.35,rest:.25,housing:.25,safety:.15}),
  // Food follows only the existing daily meal: a resident without a missed meal recovers, a hungry one declines.
  food:Object.freeze({recoverPerDay:100,declinePerDay:50,low:20}),
  // Active work tires; waiting and idling restore. The daily rest at home (phase B) replaces the idle recovery.
  rest:Object.freeze({drainPerDay:30,recoverPerDay:60,low:20}),
  safety:Object.freeze({base:45,castle:{bonus:25,range:12},tower:{bonus:15,range:10},guard:{bonus:10,range:10},attack:{penalty:30,days:1}}),
  unpaid:Object.freeze({perGold:5,max:30}),
  // Phase C applies the work modifiers; phase A only measures and shows them.
  moods:Object.freeze([{id:'happy',min:70,work:1.1},{id:'neutral',min:40,work:1},{id:'unhappy',min:25,work:.8},{id:'critical',min:0,work:.8}]),
  activeStates:Object.freeze(['Working','Traveling to Target','Searching for Target','Going to Workplace','Returning to Workplace','Patrolling','Fleeing','MovingToHold']),
  updateMs:1000,
});
export const clampNeed=value=>Math.max(0,Math.min(100,value));
export const moodFor=happiness=>NEEDS.moods.find(m=>happiness>=m.min)??NEEDS.moods.at(-1);
// Weighted Happiness minus the separate unpaid-wage penalty (counted once), rounded to 0–100.
export function happinessOf({food,rest,housing,safety},unpaidPenalty=0){
  const w=NEEDS.weights;return Math.round(clampNeed(food*w.food+rest*w.rest+housing*w.housing+safety*w.safety-unpaidPenalty));
}
// The biggest single loss of Happiness, or null when nothing is notably wrong.
export function mainProblem(needs,unpaidPenalty=0){
  const losses=Object.entries(NEEDS.weights).map(([id,weight])=>({id,loss:weight*(100-needs[id]),value:needs[id]}));
  if(unpaidPenalty>0)losses.push({id:'wages',loss:unpaidPenalty,value:0});
  const worst=losses.filter(l=>l.id==='wages'||l.value<70).sort((a,b)=>b.loss-a.loss)[0];return worst?worst.id:null;
}
