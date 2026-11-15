import { buildingIsComplete } from '../game/buildingState.js';
import { GETTING_STARTED_STEPS } from '../data/gettingStarted.js';
import { isWaterGround } from '../data/worldTerrain.js';

const typeOf=building=>building.type??building.definition?.id;
// The tile check behind the 'water' task: a river or pond tile the player has seen (always true with the fog off).
export function waterFound(scene){
  const grid=scene?.groundGrid,fog=scene?.fog;if(!grid)return false;
  for(let y=0;y<grid.length;y++)for(let x=0;x<grid[y].length;x++)if(isWaterGround(grid[y][x])&&(!fog?.enabled||(fog.displayState?.({x,y})??1)>=1))return true;
  return false;
}
// Progress is derived from the world every time, never saved. `world` is the scene (or, as before, a list of buildings).
// Owner 15 Nov 2026: besides buildings a task can ask for a profession, a selected king or found water. Those three
// latch in `scene.guideFlags` for the session and also count as done once a later task is done, so a loaded game
// never falls back to them.
export function gettingStartedProgress(world,steps=GETTING_STARTED_STEPS){
  const scene=Array.isArray(world)?{buildings:world}:world??{},complete=new Set();for(const b of scene.buildings??[])if(buildingIsComplete(b))complete.add(typeOf(b));
  const flags=scene.guideFlags??{},people=scene.workerSystem?.liveSubjects?.()??[];
  const own=step=>{
    switch(step.kind??'build'){
      case 'build':return complete.has(step.building??step.buildingId);
      case 'job':return people.some(w=>w.profession===step.job);
      case 'king':return !!flags.king||!!scene.unitSelection?.king;
      case 'water':return !!flags.water||waterFound(scene);
      default:return false;
    }
  };
  const base=steps.map(own),list=steps.map((step,i)=>({...step,buildingId:step.building??step.buildingId,done:base[i]||((step.kind??'build')!=='build'&&base.some((d,j)=>j>i&&d&&(steps[j].kind??'build')==='build'))}));
  const current=list.find(step=>!step.done)?.id??null;
  return {steps:list,current,doneCount:list.filter(s=>s.done).length,total:list.length,allDone:current===null};
}
// Data check used by tests and the registry: every build task names an existing building, a building never needs a
// completed building that only a later task builds, and every other task has a known kind.
export function gettingStartedProblems(registry,steps=GETTING_STARTED_STEPS,jobs=null){
  const problems=[],earlier=new Set(),ids=new Set();
  for(const step of steps){
    if(ids.has(step.id))problems.push(`duplicate step ${step.id}`);ids.add(step.id);
    const kind=step.kind??'build';
    if(kind==='job'){if(jobs&&!jobs[step.job])problems.push(`${step.id}: unknown job ${step.job}`);continue;}
    if(kind!=='build'){if(!['king','water'].includes(kind))problems.push(`${step.id}: unknown kind ${kind}`);continue;}
    const id=step.building??step.buildingId,definition=registry.get(id);
    if(!definition||definition.category!=='building')problems.push(`${step.id}: unknown building ${id}`);
    else for(const required of [...(definition.requiresCompletedBuildings??[]),...(definition.recommendsCompletedBuildings??[])])if(!earlier.has(required))problems.push(`${step.id}: needs ${required} before it`);
    earlier.add(id);
  }
  return problems;
}
