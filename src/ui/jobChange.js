import { JOBS } from '../data/jobs.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';

// A manual profession change, the same from the resident's panel and from the Population list: Unemployed holds the
// resident out of auto-employment, any other profession releases them and they take a free seat of that profession
// (the emptiest building first, then the nearest – WorkplaceSystem.assignFree, 0.30.0 point 16).
export function changeProfession(scene,worker,profession){
  if(!worker?.isAlive||!JOBS[profession])return false;
  if(profession==='idle')scene.employment?.hold(worker);else scene.employment?.release(worker);
  scene.workerSystem.jobs.assign(worker,profession);scene.workplaceSystem?.assignFree?.(worker);return true;
}
// Free seats per profession in finished, open workplaces. Professions without any workplace building (Hauler,
// Builder…) get null: they need no seat.
export function freeSeats(scene){
  const seats=new Map(),workplaces=scene.workplaceSystem;
  for(const building of scene.buildings??[]){
    const spec=buildingDefinition(building).workplace;if(!spec?.profession||!buildingIsComplete(building)||building.unverified||scene.employment?.blockReason?.(building))continue;
    const staff=workplaces?.register(building)?.workerIds.length??0;seats.set(spec.profession,(seats.get(spec.profession)??0)+Math.max(0,spec.capacity-staff));
  }
  return seats;
}
// The choices of the quick job menu for one resident, in the order of the Employments window (JOBS order).
export function jobChoices(scene,worker){
  const seats=freeSeats(scene),hasWorkplaces=profession=>scene.workplaceSystem?.hasWorkplaces?.(profession)??false;
  return Object.entries(JOBS).filter(([id])=>id!=='idle').map(([id,job])=>{
    const needsSeat=hasWorkplaces(id),free=needsSeat?seats.get(id)??0:null;
    return {id,name:job.name,color:job.portraitColor,free,full:needsSeat&&free===0,current:worker?.profession===id};
  });
}
