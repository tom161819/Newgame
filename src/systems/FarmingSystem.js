import { devFactor } from '../data/devBalance.js';
import { reconcileFarmPlots,farmPlots,FARM_PLOT_CAPACITY } from '../data/farmPlots.js';
import { dataName } from '../i18n/names.js';
import { FARMING_RULES } from '../data/farming.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { WORK_RULES } from '../data/jobs.js';
import { seasonalCropStage } from '../data/seasons.js';

export class FarmingSystem {
  constructor(scene,{growthModifier=()=>1,onHarvest=null}={}) {
    Object.assign(this,{scene,growthModifier,onHarvest});
    this.clocks=Object.fromEntries(Object.keys(FARMING_RULES.crops).map(id=>[id,0]));
    this.records=new Map();this.refreshElapsed=0;this.tending=new Map();this.establishChecks=new Map();this.knownFarmIds=new Set();
    this.worldChanged=()=>this.reconcilePlots();scene.events?.on('buildings:changed',this.worldChanged);this.reconcilePlots();
    this.unsubscribe=scene.gameTime.onAdvance(delta=>this.advanceGrowth(delta));
    if(scene.seasons){this.unsubscribeBefore=scene.seasons.onBeforeChange(()=>this.refreshSeason());this.unsubscribeSeason=scene.seasons.onChange(()=>this.refreshSeason());}
    for(const building of scene.buildings)this.register(building);
  }
  register(building) {
    if(!this.scene.restoringFarmPlots&&(building.type==='farmhouse'||buildingDefinition(building).crop&&building.farmId===undefined))this.reconcilePlots();
    if(!buildingDefinition(building).crop||!buildingIsComplete(building))return null;
    if(!this.records.has(building.id))this.records.set(building.id,{buildingId:building.id,growthDays:0,lastClock:this.clocks[building.type],stage:0,cycle:0,reservedBy:null});
    return this.records.get(building.id);
  }
  plots(farm){return farmPlots(farm,this.scene.buildings,buildingDefinition);}
  plotSummary(farm){return {count:this.plots(farm).length,capacity:FARM_PLOT_CAPACITY};}
  reconcilePlots(){
    if(this.scene.restoringFarmPlots)return;
    const farms=new Set(this.scene.buildings.filter(b=>b.type==='farmhouse').map(b=>b.id));
    for(const id of this.knownFarmIds)if(!farms.has(id)){
      const workplaces=this.scene.workplaceSystem,record=workplaces?.records.get(id);
      for(const workerId of [...(record?.workerIds??[])]){const worker=this.scene.workerSystem.workers.get(workerId);if(worker){this.scene.employment?.hold(worker);workplaces.remove(worker);}}
      workplaces?.records.delete(id);workplaces?.changed(id);
    }
    this.knownFarmIds=farms;
    reconcileFarmPlots(this.scene.buildings,buildingDefinition);
    for(const worker of this.scene.workerSystem?.liveWorkers()??[]){
      const task=worker.workTask;if(task?.kind==='build'&&!this.scene.constructionSystem?.canWork(this.scene.buildings.find(b=>b.id===task.targetId),worker))this.scene.workerSystem.ai.cancel(worker);if(task?.kind==='harvest'&&!this.inRange(worker,this.building(task.targetId)))this.scene.workerSystem.ai.cancel(worker);
      const tending=this.tending.get(worker.id);if(tending&&!this.inRange(worker,this.building(tending.targetId)))this.stopTending(worker,{stop:true});
    }
    for(const id of this.records.keys())if(!this.building(id))this.records.delete(id);
    this.scene.farmConnections?.refresh();
  }
  building(id){return this.scene.buildings.find(b=>b.id===id&&buildingIsComplete(b)&&buildingDefinition(b).crop)??null;}
  sync(building) {
    const record=this.register(building);if(!record)return null;
    const spec=buildingDefinition(building).crop,previous=record.stage;
    const ceiling=building.type==='orchard'&&this.scene.seasons?.season==='Spring'?spec.growthDays/3:spec.growthDays;
    record.growthDays=Math.max(record.growthDays,Math.min(ceiling,record.growthDays+Math.max(0,this.clocks[building.type]-record.lastClock)));
    if(spec.growthDays-record.growthDays<1e-8)record.growthDays=spec.growthDays;
    record.lastClock=this.clocks[building.type];record.stage=seasonalCropStage(building.type,record.growthDays,spec.growthDays,this.scene.seasons?.season);
    if(previous!==record.stage)this.paint(building,record);
    return record;
  }
  paint(building,record=this.records.get(building.id)){const view=this.scene.towerViews.get(building.id);view?.setSeason?.(this.scene.seasons?.season??'Spring');view?.setGrowth?.(record.stage);}
  refreshSeason(){for(const record of this.records.values()){const building=this.building(record.buildingId);if(building){this.sync(building);this.paint(building,record);}}}
  advanceGrowth(delta) {
    if(this.scene.gameOver)return;
    for(const id of Object.keys(this.clocks)){
      const multiplier=this.growthModifier(id,this.scene.gameTime)*FARMING_RULES.growthRate*devFactor('farming')*devFactor('growth');
      if(Number.isFinite(multiplier))this.clocks[id]+=delta/this.scene.gameTime.dayDuration*Math.max(0,multiplier);
    }
    this.refreshElapsed+=delta;
    if(this.refreshElapsed>=FARMING_RULES.refreshInterval){this.refreshElapsed%=FARMING_RULES.refreshInterval;for(const record of this.records.values()){const building=this.building(record.buildingId);if(building)this.sync(building);}}
  }
  ripe(building){const record=this.sync(building);return record&&record.growthDays>=buildingDefinition(building).crop.growthDays&&(this.scene.seasons?.canHarvest(building.type)??true);}
  inRange(worker,building) {
    const home=this.scene.workplaceSystem?.building(worker);if(home?.type!=='farmhouse'||!building||building.farmId!==home.id)return false;
    const origin={x:home.x+buildingDefinition(home).width/2,y:home.y+buildingDefinition(home).height/2};
    return Math.max(Math.abs(building.x+buildingDefinition(building).width/2-origin.x),Math.abs(building.y+buildingDefinition(building).height/2-origin.y))<=buildingDefinition(home).workRadius;
  }
  release(worker) {
    this.establishChecks.delete(worker.id);
    this.stopTending(worker);
    if(worker.workTask?.kind!=='harvest')return;
    const record=this.records.get(worker.workTask.targetId);if(record?.reservedBy===worker.id)record.reservedBy=null;
  }
  activeSeason(){return ['Spring','Summer','Autumn'].includes(this.scene.seasons?.season??'Summer');}
  stopTending(worker,{stop=false}={}){
    const state=this.tending.get(worker.id);if(!state)return;
    this.scene.workerSystem.reservations.release(state.reservation,worker.id);this.tending.delete(worker.id);
    if(stop)worker.path=[]; // Finish a reserved half-step normally; never move the unit directly.
  }
  waitAtHome(worker){
    worker.workState='Waiting';worker.workMessage='Waiting at farmhouse';
    if(!worker.nextTile&&!worker.path.length&&!this.scene.workplaceSystem.atWorkplace(worker)){worker.aiCooldown=WORK_RULES.searchInterval;worker.moveTo(this.scene.workplaceSystem.goals(worker));}
  }
  tend(worker){
    const now=this.scene.gameTime.totalElapsed,ai=this.scene.workerSystem.ai,rules=FARMING_RULES.tending;let state=this.tending.get(worker.id),previous=state?.goal;
    if(!this.activeSeason()){this.stopTending(worker,{stop:true});this.waitAtHome(worker);return;}
    if(state){
      const plot=this.building(state.targetId);
      if(!plot||!this.inRange(worker,plot)||this.scene.map[state.goal.y]?.[state.goal.x]!==0||now>=state.travelDeadline&&!ai.atGoal(worker,state.goal)){this.stopTending(worker,{stop:true});state=null;}
      else if(ai.atGoal(worker,state.goal)){
        state.until??=now+rules.poseDuration;if(now<state.until){worker.workState='Working';worker.workMessage='Tending crops';return;}
        this.stopTending(worker);state=null;
      }else{worker.workState='Traveling to Target';worker.workMessage='Walking to tend crops';if(!worker.nextTile&&!worker.path.length&&!worker.moveTo([state.goal])){this.stopTending(worker);state=null;}else return;}
    }
    const goals=new Map(),plots=this.scene.buildings.filter(b=>buildingDefinition(b).crop&&buildingIsComplete(b)&&this.inRange(worker,b)).sort((a,b)=>Math.hypot(a.x-worker.tile.x,a.y-worker.tile.y)-Math.hypot(b.x-worker.tile.x,b.y-worker.tile.y)||a.id-b.id).slice(0,rules.maxPlots);
    for(const plot of plots){const d=buildingDefinition(plot),tiles=[];
      for(let x=plot.x;x<plot.x+d.width;x++)tiles.push({x,y:plot.y-1},{x,y:plot.y+d.height});
      for(let y=plot.y;y<plot.y+d.height;y++)tiles.push({x:plot.x-1,y},{x:plot.x+d.width,y});
      for(const tile of tiles){const key=tileKey(tile);if(this.scene.map[tile.y]?.[tile.x]===0&&key!==tileKey(worker.tile)&&(!previous||key!==tileKey(previous))&&this.scene.workerSystem.reservations.available(`farm-tend:${key}`,worker.id))goals.set(key,{tile,plot});}
    }
    const route=goals.size?ai.route(worker,[...goals.values()].map(g=>g.tile)):null;
    if(!route){this.waitAtHome(worker);return;}
    const chosen=goals.get(tileKey(route.destination)),reservation=`farm-tend:${tileKey(route.destination)}`;
    if(!this.scene.workerSystem.reservations.reserve(reservation,worker.id)){this.waitAtHome(worker);return;}
    this.tending.set(worker.id,{targetId:chosen.plot.id,goal:{...route.destination},reservation,nextHarvestCheck:now+rules.harvestCheck,travelDeadline:now+rules.travelTimeout});worker.path=route.path;worker.workState='Traveling to Target';worker.workMessage='Walking to tend crops';
  }
  harvestPlan(worker){
    const goals=new Map();
    for(const building of this.scene.buildings)if(buildingDefinition(building).crop&&buildingIsComplete(building)&&this.inRange(worker,building)&&this.ripe(building)){
      const record=this.records.get(building.id);if(record.reservedBy&&record.reservedBy!==worker.id)continue;
      for(const tile of building.tiles)if(this.scene.map[tile.y]?.[tile.x]===0)goals.set(tileKey(tile),{tile,building});
    }
    const route=goals.size?this.scene.workerSystem.ai.route(worker,[...goals.values()].map(g=>g.tile)):null;
    return route?{route,building:goals.get(tileKey(route.destination)).building}:null;
  }
  tryEstablish(worker){
    const system=this.scene.constructionSystem;
    if(!system||![...system.sites.values()].some(site=>!site.unverified&&system.canWork(site,worker)&&system.materials.ready(site)))return false;
    this.stopTending(worker,{stop:true});worker.aiCooldown=0;system.builderAI.updateWorker(worker);return worker.workTask?.kind==='build';
  }
  updateWorker(worker) {
    const ai=this.scene.workerSystem.ai;
    let task=worker.workTask,plan=null;
    if(task?.kind==='build'){
      const now=this.scene.gameTime.totalElapsed;
      if(now>=(this.establishChecks.get(worker.id)??0)){
        this.establishChecks.set(worker.id,now+FARMING_RULES.tending.harvestCheck);plan=this.harvestPlan(worker);
        const crop=plan&&buildingDefinition(plan.building).crop,room=plan&&(!this.scene.foodProduction||this.scene.foodStorage.findDestination(worker,crop.resource,crop.yield));
        if(room){ai.cancel(worker);task=null;worker.aiCooldown=0;}else plan=null;
      }
      if(task){this.scene.constructionSystem.builderAI.updateWorker(worker);return;}
    }
    if(!task){
      const tending=this.tending.get(worker.id),now=this.scene.gameTime.totalElapsed;
      if(tending){if(now<tending.nextHarvestCheck){this.tend(worker);return;}tending.nextHarvestCheck=now+FARMING_RULES.tending.harvestCheck;worker.aiCooldown=0;}
      if(worker.aiCooldown>0)return;
      worker.aiCooldown=WORK_RULES.searchInterval;
      plan??=this.harvestPlan(worker);
      if(!plan){if(!this.tryEstablish(worker))this.tend(worker);return;}
      this.stopTending(worker,{stop:true});
      const {route,building}=plan,record=this.records.get(building.id);
      if(!ai.reserve(worker,`crop:${building.id}`,{kind:'harvest',targetId:building.id,cycle:record.cycle,startedAt:this.scene.gameTime.totalElapsed},route))return;
      if(this.scene.foodProduction&&!this.scene.foodProduction.prepareHarvest(worker,building,worker.workTask)){ai.cancel(worker);worker.workState='Waiting';worker.workMessage='Food storage is full or unreachable';worker.aiCooldown=WORK_RULES.searchInterval;return;}
      record.reservedBy=worker.id;task=worker.workTask;
    }
    const building=this.building(task.targetId),record=this.records.get(task.targetId);
    if(!building||!this.inRange(worker,building)||!this.ripe(building)||record.reservedBy!==worker.id||record.cycle!==task.cycle){ai.cancel(worker);return;}
    if(ai.atGoal(worker,task.goal)){worker.workState='Working';worker.workMessage=`Harvesting ${dataName(buildingDefinition(building))}`;}
    else{worker.workState='Traveling to Target';worker.workMessage=`Walking to ${dataName(buildingDefinition(building))}`;ai.ensureRoute(worker,task.goal);}
  }
  update(delta) {
    if(this.scene.gameOver||this.scene.gameTime.paused)return;
    for(const worker of this.scene.workerSystem.liveWorkers()){
      const tending=this.tending.get(worker.id);
      if(tending&&(!this.activeSeason()||worker.profession!=='farmer'||worker.workTask||worker.cargo||worker.commandState&&worker.commandState.state!=='Working'||!this.building(tending.targetId)||!this.inRange(worker,this.building(tending.targetId))))this.stopTending(worker,{stop:worker.profession==='farmer'&&!worker.workTask&&!worker.cargo&&(!worker.commandState||worker.commandState.state==='Working')});
      const task=worker.workTask;if(worker.profession!=='farmer'||task?.kind!=='harvest')continue;
      const building=this.building(task.targetId),record=this.records.get(task.targetId);
      if(!building||record?.reservedBy!==worker.id||record.cycle!==task.cycle||!this.inRange(worker,building)||!this.scene.workerSystem.ai.atGoal(worker,task.goal))continue;
      const available=Math.min(delta,worker.availableWorkMs??0,Math.max(0,this.scene.gameTime.totalElapsed-task.startedAt));
      task.progressMs+=available*this.scene.skillSystem.workEfficiency(worker,'farming')*(this.scene.workplaceSystem.workFactor?.(worker)??1);
      worker.workState='Working';worker.workMessage=`Harvesting ${dataName(buildingDefinition(building))}`;
      if(task.progressMs>=buildingDefinition(building).crop.workDuration)this.harvest(worker,building,record);
    }
  }
  harvest(worker,building,record) {
    const task=worker.workTask;
    if(this.scene.gameOver||this.scene.gameTime.paused||this.building(building?.id)!==building||worker.profession!=='farmer'||!worker.isAlive||task?.kind!=='harvest'||task.cycle!==record.cycle||record.reservedBy!==worker.id
      ||!this.inRange(worker,building)||!this.scene.workerSystem.ai.atGoal(worker,task.goal)||task.progressMs<buildingDefinition(building).crop.workDuration||!this.ripe(building))return false;
    const spec=buildingDefinition(building).crop,cycle=record.cycle;
    record.cycle++;record.growthDays=0;record.stage=0;record.lastClock=this.clocks[building.type];record.reservedBy=null;
    this.scene.workerSystem.ai.cancel(worker);worker.workState='Searching for Work';
    const result={worker,building,resource:spec.resource,amount:spec.yield,cycle};
    if(this.onHarvest)this.onHarvest(result);else this.scene.inventory.add(spec.resource,spec.yield,{track:false});
    this.scene.foodSystem?.recordProduction(spec.resource,spec.yield,`harvest-${building.id}-${cycle}`);
    this.scene.activities.emit('cropHarvested',{actor:worker,objectType:building.type,quantity:1,objectId:building.id,cycle},`harvest-${building.id}-${cycle}`);
    this.paint(building,record);this.scene.updateInventory();return true;
  }
  exportState(){for(const record of this.records.values()){const building=this.building(record.buildingId);if(building)this.sync(building);}return {clocks:{...this.clocks},refreshElapsed:this.refreshElapsed,records:structuredClone([...this.records.values()])};}
  importState(data){
    this.knownFarmIds=new Set(this.scene.buildings.filter(b=>b.type==='farmhouse').map(b=>b.id));
    for(const worker of this.scene.workerSystem.liveWorkers())this.stopTending(worker);
    if(data){this.clocks={...data.clocks};this.refreshElapsed=data.refreshElapsed;this.records=new Map(data.records.map(r=>[r.buildingId,structuredClone(r)]));}
    else for(const building of this.scene.buildings)this.register(building);
    for(const record of this.records.values()){const building=this.building(record.buildingId);if(building)this.paint(building,record);}
  }
  destroy(){this.scene.events?.off('buildings:changed',this.worldChanged);this.unsubscribe();this.unsubscribeBefore?.();this.unsubscribeSeason?.();this.records.clear();for(const worker of this.scene.workerSystem.liveWorkers())this.stopTending(worker);this.tending.clear();this.establishChecks.clear();}
}
