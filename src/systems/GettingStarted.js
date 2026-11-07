import { buildingIsComplete } from '../game/buildingState.js';
import { GETTING_STARTED_STEPS } from '../data/gettingStarted.js';

const typeOf=building=>building.type??building.definition?.id;
// Progress is derived from the world every time, never saved: an older save with these buildings shows them ticked.
export function gettingStartedProgress(buildings,steps=GETTING_STARTED_STEPS){
  const complete=new Set();for(const b of buildings??[])if(buildingIsComplete(b))complete.add(typeOf(b));
  const list=steps.map(step=>({...step,done:complete.has(step.buildingId)}));
  const current=list.find(step=>!step.done)?.id??null;
  return {steps:list,current,doneCount:list.filter(s=>s.done).length,total:list.length,allDone:current===null};
}
// Data check used by tests and the registry: every step names an existing building, and a building a step asks for never
// needs a completed building that only a later step builds.
export function gettingStartedProblems(registry,steps=GETTING_STARTED_STEPS){
  const problems=[],earlier=new Set(),ids=new Set();
  for(const step of steps){
    if(ids.has(step.id))problems.push(`duplicate step ${step.id}`);ids.add(step.id);
    const definition=registry.get(step.buildingId);
    if(!definition||definition.category!=='building')problems.push(`${step.id}: unknown building ${step.buildingId}`);
    else for(const required of definition.requiresCompletedBuildings??[])if(!earlier.has(required))problems.push(`${step.id}: needs ${required} before it`);
    earlier.add(step.buildingId);
  }
  return problems;
}
