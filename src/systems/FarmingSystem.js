import { FARMING_RULES,cropStage } from '../data/farming.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { WORK_RULES } from '../data/jobs.js';

export class FarmingSystem {
  constructor(scene,{growthModifier=()=>1,onHarvest=null}={}) {
    Object.assign(this,{scene,growthModifier,onHarvest});
    this.clocks=Object.fromEntries(Object.keys(FARMING_RULES.crops).map(id=>[id,0]));
    this.records=new Map();this.refreshElapsed=0;
    this.unsubscribe=scene.gameTime.onAdvance(delta=>this.advanceGrowth(delta));
    for(const building of scene.buildings)this.register(building);
  }
  register(building) {
    if(!buildingDefinition(building).crop||!buildingIsComplete(building))return null;
    if(!this.records.has(building.id))this.records.set(building.id,{buildingId:building.id,growthDays:0,lastClock:this.clocks[building.type],stage:0,cycle:0,reservedBy:null});
    return this.records.get(building.id);
  }
  building(id){return this.scene.buildings.find(b=>b.id===id&&buildingIsComplete(b)&&buildingDefinition(b).crop)??null;}
  sync(building) {
    const record=this.register(building);if(!record)return null;
    const spec=buildingDefinition(building).crop,previous=record.stage;
    record.growthDays=Math.min(spec.growthDays,record.growthDays+Math.max(0,this.clocks[building.type]-record.lastClock));
    if(spec.growthDays-record.growthDays<1e-8)record.growthDays=spec.growthDays;
    record.lastClock=this.clocks[building.type];record.stage=cropStage(record.growthDays,spec.growthDays);
    if(previous!==record.stage)this.paint(building,record);
    return record;
  }
  paint(building,record=this.records.get(building.id)){this.scene.towerViews.get(building.id)?.setGrowth?.(record.stage);}
  advanceGrowth(delta) {
    if(this.scene.gameOver)return;
    for(const id of Object.keys(this.clocks)){
      const multiplier=this.growthModifier(id,this.scene.gameTime);
      if(Number.isFinite(multiplier))this.clocks[id]+=delta/this.scene.gameTime.dayDuration*Math.max(0,multiplier);
    }
    this.refreshElapsed+=delta;
    if(this.refreshElapsed>=FARMING_RULES.refreshInterval){this.refreshElapsed%=FARMING_RULES.refreshInterval;for(const record of this.records.values()){const building=this.building(record.buildingId);if(building)this.sync(building);}}
  }
  ripe(building){const record=this.sync(building);return record&&record.growthDays>=buildingDefinition(building).crop.growthDays;}
  inRange(worker,building) {
    const home=this.scene.workplaceSystem?.building(worker);if(home?.type!=='farmhouse')return false;
    const origin={x:home.x+buildingDefinition(home).width/2,y:home.y+buildingDefinition(home).height/2};
    return Math.max(Math.abs(building.x+buildingDefinition(building).width/2-origin.x),Math.abs(building.y+buildingDefinition(building).height/2-origin.y))<=buildingDefinition(home).workRadius;
  }
  release(worker) {
    if(worker.workTask?.kind!=='harvest')return;
    const record=this.records.get(worker.workTask.targetId);if(record?.reservedBy===worker.id)record.reservedBy=null;
  }
  updateWorker(worker) {
    const ai=this.scene.workerSystem.ai;
    let task=worker.workTask;
    if(!task){
      if(worker.aiCooldown>0)return;
      worker.aiCooldown=WORK_RULES.searchInterval;
      const goals=new Map();
      for(const building of this.scene.buildings)if(buildingDefinition(building).crop&&buildingIsComplete(building)&&this.inRange(worker,building)&&this.ripe(building)){
        const record=this.records.get(building.id);
        if(record.reservedBy&&record.reservedBy!==worker.id)continue;
        for(const tile of building.tiles)if(this.scene.map[tile.y]?.[tile.x]===0)goals.set(tileKey(tile),{tile,building});
      }
      const route=ai.route(worker,[...goals.values()].map(g=>g.tile));
      if(!route){worker.workState='Waiting';worker.workMessage='No reachable ripe crops within 15 tiles';return;}
      const building=goals.get(tileKey(route.destination)).building,record=this.records.get(building.id);
      if(!ai.reserve(worker,`crop:${building.id}`,{kind:'harvest',targetId:building.id,cycle:record.cycle,startedAt:this.scene.gameTime.totalElapsed},route))return;
      record.reservedBy=worker.id;task=worker.workTask;
    }
    const building=this.building(task.targetId),record=this.records.get(task.targetId);
    if(!building||!this.inRange(worker,building)||!this.ripe(building)||record.reservedBy!==worker.id||record.cycle!==task.cycle){ai.cancel(worker);return;}
    if(ai.atGoal(worker,task.goal)){worker.workState='Working';worker.workMessage=`Harvesting ${buildingDefinition(building).name}`;}
    else{worker.workState='Traveling to Target';worker.workMessage=`Walking to ${buildingDefinition(building).name}`;ai.ensureRoute(worker,task.goal);}
  }
  update(delta) {
    if(this.scene.gameOver||this.scene.gameTime.paused)return;
    for(const worker of this.scene.workerSystem.liveWorkers()){
      const task=worker.workTask;if(worker.profession!=='farmer'||task?.kind!=='harvest')continue;
      const building=this.building(task.targetId),record=this.records.get(task.targetId);
      if(!building||record?.reservedBy!==worker.id||record.cycle!==task.cycle||!this.inRange(worker,building)||!this.scene.workerSystem.ai.atGoal(worker,task.goal))continue;
      const available=Math.min(delta,worker.availableWorkMs??0,Math.max(0,this.scene.gameTime.totalElapsed-task.startedAt));
      task.progressMs+=available*this.scene.skillSystem.efficiency(worker,'farming');
      worker.workState='Working';worker.workMessage=`Harvesting ${buildingDefinition(building).name}`;
      if(task.progressMs>=buildingDefinition(building).crop.workDuration)this.harvest(worker,building,record);
    }
  }
  harvest(worker,building,record) {
    const task=worker.workTask;
    if(this.scene.gameOver||this.scene.gameTime.paused||this.building(building?.id)!==building||worker.profession!=='farmer'||!worker.isAlive||task?.kind!=='harvest'||task.cycle!==record.cycle||record.reservedBy!==worker.id
      ||!this.scene.workerSystem.ai.atGoal(worker,task.goal)||task.progressMs<buildingDefinition(building).crop.workDuration||!this.ripe(building))return false;
    const spec=buildingDefinition(building).crop,cycle=record.cycle;
    record.cycle++;record.growthDays=0;record.stage=0;record.lastClock=this.clocks[building.type];record.reservedBy=null;
    this.scene.workerSystem.ai.cancel(worker);worker.workState='Searching for Work';
    const result={worker,building,resource:spec.resource,amount:spec.yield,cycle};
    if(this.onHarvest)this.onHarvest(result);else this.scene.inventory.add(spec.resource,spec.yield);
    this.scene.activities.emit('cropHarvested',{actor:worker,objectType:building.type,quantity:1,objectId:building.id,cycle},`harvest-${building.id}-${cycle}`);
    this.paint(building,record);this.scene.updateInventory();return true;
  }
  exportState(){for(const record of this.records.values()){const building=this.building(record.buildingId);if(building)this.sync(building);}return {clocks:{...this.clocks},refreshElapsed:this.refreshElapsed,records:structuredClone([...this.records.values()])};}
  importState(data){
    if(data){this.clocks={...data.clocks};this.refreshElapsed=data.refreshElapsed;this.records=new Map(data.records.map(r=>[r.buildingId,structuredClone(r)]));}
    else for(const building of this.scene.buildings)this.register(building);
    for(const record of this.records.values()){const building=this.building(record.buildingId);if(building)this.paint(building,record);}
  }
  destroy(){this.unsubscribe();this.records.clear();}
}
