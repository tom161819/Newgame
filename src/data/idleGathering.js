import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
// idleStepTiles: idle routes up to this length are shuffles between waiting spots and wear no path.
export const IDLE_GATHERING=Object.freeze({minimumMargin:2,maximumMargin:4,localRadius:3,retryMs:1500,dwellMs:2500,idleStepTiles:10});
// Higher-priority work, cargo, commands and job-specific tending/seating run before this fallback.
// A Builder's assigned workshop wins over the Castle; Haulers never acquire a workplace slot.
export function idleHomes(scene,worker,{workplaceOnly=false}={}){
  const workplace=scene.workplaceSystem?.building(worker);
  // #118: a Builder with a place in a Builder's Workshop waits there.
  const workshop=worker.profession==='builder'?scene.builderWorkshops?.workshopFor(worker):null;if(workshop)return [{building:workshop,kind:'workplace'}];
  if(worker.profession==='builder'&&workplace&&buildingDefinition(workplace).workplace?.profession==='builder')return [{building:workplace,kind:'workplace'}];
  if(workplaceOnly||workplace||!['idle','hauler'].includes(worker.profession))return [];
  return scene.buildings.filter(b=>b.type==='castle'&&buildingIsComplete(b)).map(building=>({building,kind:'castle'}));
}
export function syncWorkerUniform(scene,worker){
  if(worker.profession==='idle'){worker.displayProfession='idle';return;}
  const home=scene.workplaceSystem?.building(worker),requiresHome=scene.workplaceSystem?.requiresWorkplace(worker.profession);
  if(requiresHome&&!home&&!(worker.profession==='miner'&&(worker.manualRockId!=null||worker.cargo?.rockId!=null||worker.displayProfession==='miner'&&worker.commandState?.state!=='Working'))){worker.displayProfession='idle';return;}
  if(worker.displayProfession===worker.profession||!worker.isAlive||worker.commandState?.state!=='Working')return;
  if(home){if(worker.workplaceReached)worker.displayProfession=worker.profession;return;}
  // Global jobs change at their first real task goal, or the Hauler's Castle gathering point.
  const task=worker.workTask,atGoal=task?.goal&&!worker.nextTile&&!worker.path.length&&worker.tile.x===task.goal.x&&worker.tile.y===task.goal.y;
  if(atGoal&&['hauler','builder'].includes(worker.profession)||worker.profession==='hauler'&&(scene.workerSystem.gather?.atHome(worker)||scene.vehicles?.held(worker)))worker.displayProfession=worker.profession;
}
