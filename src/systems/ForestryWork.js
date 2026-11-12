import { devProduction,devFactor,devTreeWood,devChopDuration } from '../data/devBalance.js';
import { FORESTRY } from '../data/naturalResources.js';
import { calendar } from '../data/seasons.js';
import { buildingIsComplete } from '../game/buildingState.js';
import { dataName } from '../i18n/names.js';
import { WORK_RULES } from '../data/jobs.js';
import { tileKey } from '../game/stones.js';
import { carryCapacity } from '../data/logistics.js';
import { CLEARING } from '../data/rockMining.js';
import { t } from '../i18n/index.js';
import { VISIBILITY } from './FogOfWarSystem.js';

// How long (game ms) a hut's sorted tree list is kept, how many of the nearest free trees a search routes to, and from
// what distance (tiles) the hut is told to be far from the forest.
const FORESTRY_SEARCH_MS=1000,FORESTRY_CANDIDATES=24;
export const FORESTRY_FAR_TILES=40;

// One job provider for the existing WorkerAI; trees, seats, cargo and stock
// remain owned by the original natural/workplace/transport systems.
export class ForestryWork {
  constructor(scene,natural){Object.assign(this,{scene,natural});}
  workplace(worker){const b=this.scene.workplaceSystem?.building(worker);return b?.type==='lumberjack_hut'?b:null;}
  // m-drevorubci-stromy: the working radius with the Dev tool's Woodcutter radius factor; finished huts (growth boost).
  radius(building){return(building.definition?.workRadius??this.scene.objectRegistry?.get?.(building.type)?.workRadius??0)*devFactor('woodRadius');}
  inRadius(building,tile){return Math.hypot(tile.x-building.x-.5,tile.y-building.y-.5)<=this.radius(building);}
  huts(){return this.scene.buildings.filter(b=>b.type==='lumberjack_hut'&&!b.unverified&&!b.demolition&&buildingIsComplete(b));}
  trees(building){return[...this.natural.byId.values()].filter(t=>t.definition.tree&&this.inRadius(building,t));}
  // m-drevorubec-dosah (owner, 12 Nov): Woodcutters fell mature trees anywhere on the known map, nearest to the hut
  // first; the working radius only boosts growth now. The sorted list is kept for a second of game time per hut (it is
  // asked by every searching Woodcutter, the employment and the diagnostics).
  eligible(building){
    if(!building)return[];const now=this.scene.gameTime?.totalElapsed??0,cache=this.eligibleCache??=new Map(),had=cache.get(building.id);
    if(had&&now>=had.at&&now-had.at<FORESTRY_SEARCH_MS&&had.count===this.natural.byId.size)return had.list.filter(t=>t.natural.stage===3);
    const fog=this.scene.fog,cx=building.x+.5,cy=building.y+.5;
    // Trees inside the old working radius count as before; further ones only on explored ground (nobody is sent into the unknown).
    const known=t=>this.inRadius(building,t)||!fog?.displayState||fog.displayState(t)!==VISIBILITY.UNEXPLORED;
    const list=[...this.natural.byId.values()].filter(t=>t.definition.tree&&t.natural.stage===3&&known(t)).map(t=>({t,d:Math.hypot(t.x-cx,t.y-cy)})).sort((a,b)=>a.d-b.d||a.t.y-b.t.y||a.t.x-b.t.x).map(e=>e.t);
    cache.set(building.id,{at:now,count:this.natural.byId.size,list});return list;
  }
  // Distance (tiles) from the hut to its nearest mature tree, or null.
  nearestDistance(building){const t=this.eligible(building)[0];return t?Math.hypot(t.x-building.x-.5,t.y-building.y-.5):null;}
  slot(goal){return`natural-slot:${tileKey(goal)}`;}
  release(worker){
    const task=worker.workTask;if(task?.kind!=='chopTree')return;const object=this.natural.byId.get(task.targetId);if(object){this.scene.workerSystem.reservations.release(this.natural.reservation(object),worker.id);this.natural.view(object)?.showWork?.();}
    this.scene.workerSystem.reservations.release(this.slot(task.goal),worker.id);this.scene.foodStorage?.release(task.capacityReservation);
  }
  wait(worker,message){worker.workState='Waiting';worker.workMessage=message;worker.aiCooldown=WORK_RULES.searchInterval;}
  update(worker,delta){
    const s=this.scene,system=s.workerSystem,building=this.workplace(worker);if(!building){this.wait(worker,'Waiting for Lumberjack Hut');return;}
    let task=worker.workTask;
    if(!task){
      if(worker.aiCooldown>0)return;worker.aiCooldown=WORK_RULES.searchInterval;
      // m-oznacovani-tezby (51): marked trees and bushes come first, wherever they are (no working radius).
      const marked=this.markedTargets(worker),markedRoute=marked.length?system.ai.route(worker,marked.flatMap(c=>c.goals)):null,pick=markedRoute&&marked.find(c=>c.goals.some(g=>tileKey(g)===tileKey(markedRoute.destination)));
      if(pick){if(pick.tree?.natural.stage===3)this.beginChop(worker,pick.tree,markedRoute);else this.beginClear(worker,pick,markedRoute);}
      else{const candidates=this.eligible(building).filter(t=>system.reservations.available(this.natural.reservation(t),worker.id)).slice(0,FORESTRY_CANDIDATES);if(!candidates.length){this.wait(worker,'No mature trees in working radius');return;}
      const choices=candidates.map(tree=>({tree,goals:this.natural.goals(tree).filter(goal=>system.reservations.available(this.slot(goal),worker.id))})),route=system.ai.route(worker,choices.flatMap(c=>c.goals));if(!route){this.wait(worker,'No reachable mature tree');return;}
      const object=choices.find(c=>c.goals.some(t=>tileKey(t)===tileKey(route.destination)))?.tree;if(!object)return;
      this.beginChop(worker,object,route);}
      task=worker.workTask;if(!task)return;
    }
    if(task.kind==='clearMark'){this.clear(worker,task,delta);return;}
    this.chop(worker,task,building,delta);
  }
  markedTargets(worker){
    const s=this.scene,system=s.workerSystem,rocks=this.natural.miningWork.rocks,list=[];
    for(const m of rocks.trees.values()){const tree=this.natural.byId.get(m.id),id=`tree:${m.id}`;if(!(tree?.natural.stage>0)||!system.reservations.available(this.natural.reservation(tree),worker.id)||!system.reservations.available(`clear:${id}`,worker.id))continue;list.push({id,tree,goals:this.natural.goals(tree)});}
    for(const m of rocks.bushes.values()){const [x,y]=m.id.split(',').map(Number),id=`bush:${m.id}`;if(!system.reservations.available(`clear:${id}`,worker.id))continue;list.push({id,goals:[{x,y},{x:x-1,y},{x:x+1,y},{x,y:y-1},{x,y:y+1}].filter(p=>s.map[p.y]?.[p.x]===0)});}
    return list.map(c=>({...c,goals:c.goals.filter(g=>system.reservations.available(this.slot(g),worker.id))})).filter(c=>c.goals.length);
  }
  beginClear(worker,pick,route){
    const system=this.scene.workerSystem,reservation=`clear:${pick.id}`,slot=this.slot(route.destination);
    if(!system.reservations.reserve(reservation,worker.id))return false;if(!system.reservations.reserve(slot,worker.id)){system.reservations.release(reservation,worker.id);return false;}
    worker.workTask={kind:'clearMark',targetId:pick.id,reservation,goal:{...route.destination},progressMs:0};worker.path=route.path;worker.workState='Traveling to Target';worker.workMessage=t('clearing.travelling');return true;
  }
  // A marked bush or sapling: short work, no yield.
  clear(worker,task,delta){
    const s=this.scene,system=s.workerSystem,rocks=this.natural.miningWork.rocks,split=task.targetId.indexOf(':'),kind=task.targetId.slice(0,split),id=task.targetId.slice(split+1),tree=kind==='tree'?this.natural.byId.get(id):null;
    const valid=kind==='tree'?rocks.trees.has(id)&&tree?.natural.stage>0&&tree.natural.stage<3:rocks.bushes.has(id)&&!!s.bushes?.has(id);
    if(!valid||s.map[task.goal.y]?.[task.goal.x]!==0||system.reservations.owners.get(task.reservation)!==worker.id){system.ai.cancel(worker);this.wait(worker,t('clearing.gone'));worker.aiCooldown=0;return;}
    if(worker.nextTile||worker.path.length)return;
    if(!system.ai.atGoal(worker,task.goal)){system.ai.cancel(worker);this.wait(worker,'Waiting for a reachable work position');return;}
    const duration=kind==='tree'?CLEARING.saplingMs:CLEARING.bushMs;worker.workState='Working';worker.workMessage=t('clearing.progress',{percent:Math.floor(task.progressMs/duration*100)});
    task.progressMs=Math.min(duration,task.progressMs+delta*s.skillSystem.workEfficiency(worker,'woodcutting')*(s.workplaceSystem.workFactor?.(worker)??1));if(task.progressMs+1e-7<duration)return;
    rocks.cleared(task.targetId);system.ai.cancel(worker);worker.workState='Searching for Target';worker.aiCooldown=0;
  }
  beginChop(worker,object,route){
    const s=this.scene,system=s.workerSystem;let task;
    // m-drevorubci-stromy: with the Dev tool's Wood per tree above one load, he carries one load; the rest stays on the
    // ground for the Haulers.
    const amount=Math.min(devTreeWood(object.definition.tree),carryCapacity(worker,'wood')),pile=s.foodStorage?.pileFor(this.workplace(worker));if(pile&&s.foodStorage.room(pile.id,'wood')<amount){this.wait(worker,'Output pile full');return;}
    // m-sklady-materialu-koncept (49): timber goes on the pile by the hut; Haulers take it to a store.
    const output=pile?{location:pile}:s.foodStorage?.findDestination(worker,'wood',amount);if(!output){this.wait(worker,'Waiting for reachable timber storage capacity');return;}
    const transferId=`food-transfer-${s.foodProduction.nextTransfer++}`,capacityReservation=s.foodStorage.reserve('capacity',output.location.id,'wood',amount,transferId);if(!capacityReservation)return;
    const reservation=this.natural.reservation(object),slot=this.slot(route.destination);
    if(!system.reservations.reserve(reservation,worker.id)||!system.reservations.reserve(slot,worker.id)){system.reservations.release(reservation,worker.id);s.foodStorage.release(capacityReservation);return;}
    worker.workTask=task={kind:'chopTree',targetId:object.natural.id,reservation,goal:{...route.destination},progressMs:0,transferId,capacityReservation,destinationId:output.location.id,amount};worker.path=route.path;worker.workState='Traveling to Target';worker.workMessage=`Travelling to ${dataName(object.definition)}`;
  }
  chop(worker,task,building,delta){
    const s=this.scene,system=s.workerSystem;
    if(task?.kind!=='chopTree')return;const object=this.natural.byId.get(task.targetId);
    if(!object||object.natural.stage!==3||s.map[task.goal.y]?.[task.goal.x]!==0||system.reservations.owners.get(task.reservation)!==worker.id||!s.foodStorage.reservations.has(task.capacityReservation)){system.ai.cancel(worker);this.wait(worker,'Waiting for a valid tree and storage reservation');return;}
    if(worker.nextTile||worker.path.length)return;
    if(!system.ai.atGoal(worker,task.goal)){system.ai.cancel(worker);this.wait(worker,'Waiting for a reachable work position');return;}
    worker.workState='Working';worker.workMessage=`Chopping ${dataName(object.definition)} ${Math.floor(object.natural.workDone/devChopDuration(object.definition.tree)*100)}%`;
    if(!this.natural.work(object,worker,delta*(s.workplaceSystem.workFactor?.(worker)??1)*devProduction('woodcutter')))return;
    const record=s.workplaceSystem.records.get(building.id),day=s.gameTime.day,stats=record.forestry??{harvested:0,day,producedToday:0};if(stats.day!==day){stats.day=day;stats.producedToday=0;}const felled=devTreeWood(object.definition.tree);stats.harvested+=felled;stats.producedToday+=felled;record.forestry=stats;
    system.reservations.release(this.slot(task.goal),worker.id);worker.workTask=null;const woodAt=tile=>[...s.dropSystem.drops.values()].find(d=>d.resource==='wood'&&d.siteId==null&&d.tile.x===tile.x&&d.tile.y===tile.y),drop=woodAt(object)??woodAt(worker.tile),pickup=drop&&system.ai.route(worker,[drop.tile]);
    if(!drop||!pickup||!system.reservations.reserve(`drop:${drop.id}`,worker.id)){s.foodStorage.release(task.capacityReservation);this.wait(worker,'Timber preserved on the ground');return;}
    if(!s.foodProduction.setTask(worker,'foodPickup',pickup,{transferId:task.transferId,capacityReservation:task.capacityReservation,destinationId:task.destinationId,sourceDropId:drop.id,resource:'wood',amount:task.amount,naturalHarvest:true})){system.reservations.release(`drop:${drop.id}`,worker.id);s.foodStorage.release(task.capacityReservation);this.wait(worker,'Timber preserved on the ground');}
  }
  summary(building){
    const s=this.scene,stats=s.workplaceSystem.records.get(building.id)?.forestry,known=!!s.fog?.enabled,trees=known?[...s.mapMemory.objects.values()].filter(e=>e.kind==='resource'&&s.objectRegistry.get(e.type)?.tree&&e.visual.stage===3&&this.inRadius(building,e)).length:this.eligible(building).length;
    // m-drevorubci-stromy: young trees (saplings and young trees) and when the next one is mature. With fog only trees on
    // explored ground count (the Woodcutters know their forest; nothing beyond the map the player has seen).
    const seen=t=>!known||s.fog.isInSightTile(t)||!!s.fog.explored?.[t.y*s.fog.width+t.x],growing=this.trees(building).filter(t=>t.natural.stage<3&&seen(t));
    return{known,trees,harvested:stats?.harvested??0,today:stats?.day===s.gameTime.day?stats.producedToday:0,young:growing.filter(t=>t.natural.stage>0).length,nextDays:(d=>d==null?null:Math.round(d*10)/10)(this.nextMatureDays(building,growing))};
  }
  // Game days until the first of `growing` (stumps and young trees) is mature: the remaining stage days at today's and the
  // coming seasons' growth (seasons calendar, Winter 0), the Dev tool's forest growth and the hut boost. Null when none
  // grows within 120 days. Ignores a delayed last step (a tree waits while a unit or timber stands on its tile).
  nextMatureDays(building,growing=this.trees(building).filter(t=>t.natural.stage<3)){
    if(!growing.length)return null;const s=this.scene,time=s.gameTime,seasons=s.seasons,boost=buildingIsComplete(building)&&!building.unverified?devFactor('hutGrowthBoost'):1;
    // Growth not yet flushed (the clock already holds season and forest growth; the hut boost is applied at the flush).
    const left=t=>{const n=t.natural;let days=FORESTRY.stageDays[n.stage]-n.growthDays-Math.max(0,this.natural.growthClock-n.growthCheckpoint)*boost;for(let st=n.stage+1;st<3;st++)days+=FORESTRY.stageDays[st];return Math.max(0,days);};
    let need=Math.min(...growing.map(left));if(need<=1e-9)return 0;
    const season=day=>seasons?.enabled?calendar(day).season:seasons?.season??null,rate=day=>(season(day)?FORESTRY.seasonGrowth[season(day)]:1)*devFactor('forestGrowth')*boost;
    let day=seasons?.cycleDay??time?.day??1,part=time?1-(seasons?.cycleElapsed??time.elapsed)/time.dayDuration:1,days=0;
    for(let i=0;i<120;i++){const f=rate(day);if(f>0&&f*part>=need)return days+need/f;need-=f*part;days+=part;part=1;day++;}
    return null;
  }
}
