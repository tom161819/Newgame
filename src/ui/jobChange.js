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
// m-profese-pocty (point 46): for every profession how many residents have it now and how many the buildings (or the
// wanted number of Haulers, the Builders' Workshops) hold; capacity null = no limit known.
export function jobStats(scene){
  const out=new Map(Object.keys(JOBS).map(id=>[id,{count:0,capacity:null}])),hasWorkplaces=p=>scene.workplaceSystem?.hasWorkplaces?.(p)??false;
  for(const w of scene.workerSystem?.liveSubjects?.()??[])if(out.has(w.profession))out.get(w.profession).count++;
  for(const [id,row]of out)if(hasWorkplaces(id))row.capacity=0;
  for(const building of scene.buildings??[]){const spec=buildingDefinition(building).workplace;if(!spec?.profession||!buildingIsComplete(building)||building.unverified||!out.has(spec.profession))continue;out.get(spec.profession).capacity+=spec.capacity;}
  const e=scene.employment;if(e?.haulerTarget&&out.has('hauler'))out.get('hauler').capacity=e.haulerTarget();if(e?.builderPlaces&&out.has('builder')&&e.builderPlaces()>0)out.get('builder').capacity=e.builderPlaces();
  out.get('idle').capacity=null;return out;
}
export const jobStatLabel=(name,stat)=>stat?`${name} (${stat.count}${stat.capacity==null?'':` / ${stat.capacity}`})`:name;
// m-profese-bez-budovy (point 38): a profession whose buildings have no free seat (or none is built) cannot be picked;
// Builder, Hauler and the other professions without a workplace building always can.
export const jobBlocked=choice=>!!choice.full&&!choice.current;
// The choices of the quick job menu for one resident, in the order of the Employments window (JOBS order).
export function jobChoices(scene,worker){
  const seats=freeSeats(scene),stats=jobStats(scene),hasWorkplaces=profession=>scene.workplaceSystem?.hasWorkplaces?.(profession)??false;
  return Object.entries(JOBS).filter(([id])=>id!=='idle').map(([id,job])=>{
    const needsSeat=hasWorkplaces(id),free=needsSeat?seats.get(id)??0:null;
    return {id,name:job.name,color:job.portraitColor,free,full:needsSeat&&free===0,current:worker?.profession===id,stat:stats.get(id)};
  });
}

// One click from a notice (plan m-e1-stavitele-material): the unemployed resident best at the profession's skill takes
// the job. Returns the resident, or null when nobody is free (the caller then opens the Population list).
export function hireUnemployed(scene,profession){
  const skill=JOBS[profession]?.skill,free=scene.workerSystem.liveSubjects().filter(w=>w.profession==='idle'&&!w.leaving&&!w.arriving&&scene.needs?.records?.get?.(w.id)?.leaving!==true);
  free.sort((a,b)=>(b.skills?.[skill]?.level??1)-(a.skills?.[skill]?.level??1)||String(a.id).localeCompare(String(b.id),undefined,{numeric:true}));
  const worker=free[0];if(!worker)return null;changeProfession(scene,worker,profession);return worker;
}
