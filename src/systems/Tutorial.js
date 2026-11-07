import { TUTORIAL_STEPS } from '../data/tutorial.js';
import { buildingIsComplete } from '../game/buildingState.js';

// Which steps are done, from the world and the player's settings. `seen` holds the UI-only steps finished this session
// (the king step) or remembered in the browser (the speed step); a world with any building has passed the king step.
export function tutorialProgress(scene,{seen=new Set(),skipped=new Set()}={}){
  const buildings=scene.buildings??[],types=new Set(buildings.map(b=>b.type)),built=new Set(buildings.filter(b=>buildingIsComplete(b)).map(b=>b.type));
  const people=scene.workerSystem?.liveSubjects?.()??[];
  const marked=[...(scene.naturalResources?.mining?.rocks?.records?.values?.()??[])].some(r=>r.marked||r.produced>0);
  const player=buildings.some(b=>!['castle','starter_stockpile'].includes(b.type));
  const done=step=>{
    if(skipped.has(step.id))return true;
    switch(step.check){
      case 'seen':return seen.has(step.id)||player;
      case 'builder':return people.some(w=>w.profession==='builder');
      case 'planned':return step.buildingIds.every(id=>types.has(id));
      case 'built':return step.buildingIds.every(id=>built.has(id));
      case 'stone':return marked||step.buildingIds.some(id=>types.has(id));
      case 'speed':return seen.has(step.id)||(scene.gameSpeed??1)>1;
      default:return false;
    }
  };
  const steps=TUTORIAL_STEPS.map(step=>({...step,done:done(step)})),current=steps.find(s=>!s.done)??null;
  return {steps,current,doneCount:steps.filter(s=>s.done).length,total:steps.length,allDone:!current};
}
