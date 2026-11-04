import { FORESTRY,treeBlocks,treeState } from '../data/naturalResources.js';
import { reachableTiles,findPathToAny } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
import { buildingIsComplete,buildingDefinition } from '../game/buildings.js';
import { ForestryWork } from './ForestryWork.js';
import { MineralSystem } from './MineralSystem.js';
import { resourceBlocks } from '../data/minerals.js';
import { MiningWork } from './MiningWork.js';

export class NaturalResourcesSystem {
  constructor(scene){
    this.scene=scene;this.nextId=1;this.nextDepositId=1;this.growthClock=0;this.ageClock=0;this.refreshElapsed=0;this.byId=new Map();this.kingTask=null;this.topologyRevision=0;
    this.unsubscribe=scene.gameTime.onAdvance(delta=>this.advance(delta));
    this.forestry=new ForestryWork(scene,this);
    this.miningWork=new MiningWork(scene,this);
    this.mining=new MineralSystem(scene,this);Object.defineProperty(scene.resourceOccupancy,'naturalContext',{value:this,configurable:true});this.worldChanged=()=>{this.topologyRevision++;this.mining.reconcile();};scene.events?.on('buildings:changed',this.worldChanged);
    for(const view of scene.resources.values())this.register(view.getData('object'));
  }
  register(object){if(object?.natural){this.byId.set(object.natural.id,object);this.topologyRevision++;}}
  view(object){return this.scene.resources.get(tileKey(object));}
  growthModifier(){return this.scene.seasons?FORESTRY.seasonGrowth[this.scene.seasons.season]:1;}
  reserved(){const reserved=new Set([...this.scene.reservedTiles().map(tileKey),...[...(this.scene.dropSystem?.drops.values()??[])].map(d=>tileKey(d.tile))]);for(const key of this.scene.workerSystem.reservations.owners.keys())if(key.startsWith('natural-slot:'))reserved.add(key.slice('natural-slot:'.length));return reserved;}
  updateWorker(worker,delta){this.forestry.update(worker,delta);}
  releaseWorker(worker){this.forestry.release(worker);this.miningWork.release(worker);}
  origins(){return this.scene.resourceOrigins?.()??[this.scene.character.nextTile??this.scene.character.tile];}
  blockedByBuilding(object){return this.scene.buildings.some(b=>b.tiles.some(t=>t.x===object.x&&t.y===object.y)&&(!buildingDefinition(b).walkable||!buildingIsComplete(b)));}
  occupiedByBuilding(object){return this.scene.buildings.some(b=>b.tiles.some(t=>t.x===object.x&&t.y===object.y));}
  refreshMap(object){
    this.mining.restoreTiles(object.tiles);
  }
  preservesRoutes(tile){
    const s=this.scene,origins=this.origins(),before=reachableTiles(s.map,origins).length,old=s.map[tile.y][tile.x];if(old!==0)return false;s.map[tile.y][tile.x]=1;
    const after=reachableTiles(s.map,origins).length;s.map[tile.y][tile.x]=old;return after===before-1;
  }
  generate(random=Math.random,count=FORESTRY.initialTrees){
    const s=this.scene,start=s.character.tile,reserved=this.reserved(),possible=reachableTiles(s.map,[start]).filter(t=>t.x>1&&t.y>1&&t.x<98&&t.y<98&&Math.hypot(t.x-start.x,t.y-start.y)>FORESTRY.protectedRadius&&!reserved.has(tileKey(t))&&!s.resourceOccupancy.has(tileKey(t)));
    if(!possible.length)return 0;const reachable=new Set(possible.map(tileKey)),centers=Array.from({length:FORESTRY.clusters},()=>possible[Math.floor(random()*possible.length)]);let added=0;
    for(let attempt=0;attempt<count*80&&added<count;attempt++){
      const center=centers[attempt%centers.length],radius=Math.sqrt(random())*(5+random()*5),angle=random()*Math.PI*2,tile={x:Math.round(center.x+Math.cos(angle)*radius),y:Math.round(center.y+Math.sin(angle)*radius)},key=tileKey(tile);
      if(!reachable.has(key)||s.map[tile.y]?.[tile.x]!==0||tile.x<2||tile.y<2||tile.x>97||tile.y>97||reserved.has(key)||s.resourceOccupancy.has(key)||Math.hypot(tile.x-start.x,tile.y-start.y)<=FORESTRY.protectedRadius)continue;
      const stage=random()<.6?3:random()<.8?2:1;if(stage===3&&!this.preservesRoutes(tile))continue;
      const growthDays=stage<3?random()*FORESTRY.stageDays[stage]:0,state=treeState(`tree-${this.nextId++}`,{stage,growthDays,ageDays:stage===3?8+random()*20:(stage===1?1:4)+growthDays});state.growthCheckpoint=this.growthClock;state.ageCheckpoint=this.ageClock;
      s.addResource(s.objectRegistry.require(random()<.6?'oak_tree':'pine_tree'),tile,state);added++;
    }
    return added;
  }
  advance(delta){
    this.ageClock+=delta/this.scene.gameTime.dayDuration;this.growthClock+=delta/this.scene.gameTime.dayDuration*this.growthModifier();this.refreshElapsed+=delta;
    if(this.refreshElapsed+1e-7>=FORESTRY.refreshInterval){this.refreshElapsed=Math.max(0,this.refreshElapsed-FORESTRY.refreshInterval*Math.floor((this.refreshElapsed+1e-7)/FORESTRY.refreshInterval));this.flushGrowth();}
  }
  flushGrowth(){
    const reserved=this.reserved();
    for(const object of this.byId.values()){
      if(!object.definition.tree)continue;
      const n=object.natural;n.ageDays+=Math.max(0,this.ageClock-n.ageCheckpoint);n.ageCheckpoint=this.ageClock;const growth=Math.max(0,this.growthClock-n.growthCheckpoint);n.growthCheckpoint=this.growthClock;
      if(n.stage===3||this.occupiedByBuilding(object))continue;n.growthDays+=growth;
      while(n.stage<3&&n.growthDays+1e-9>=FORESTRY.stageDays[n.stage]){
        if(this.growthModifier()===0)break;
        if(n.stage===2&&(reserved.has(tileKey(object))||this.scene.map[object.y][object.x]!==0||!this.preservesRoutes(object))){n.growthDays=FORESTRY.stageDays[n.stage];break;}
        n.growthDays=Math.max(0,n.growthDays-FORESTRY.stageDays[n.stage]);n.stage++;if(n.stage===3)n.growthDays=0;this.refreshMap(object);this.view(object)?.setNaturalState?.(object);
      }
    }
  }
  refreshSeason(){const season=this.scene.seasons?.season??'Spring';if(season===this.visualSeason)return;this.visualSeason=season;for(const object of this.byId.values())this.view(object)?.setSeason?.(season);}
  goals(object){return[{x:object.x-1,y:object.y},{x:object.x+1,y:object.y},{x:object.x,y:object.y-1},{x:object.x,y:object.y+1}].filter(t=>this.scene.map[t.y]?.[t.x]===0);}
  reservation(object){return`natural:${object.natural.id}`;}
  cancelKing(){if(!this.kingTask)return;const object=this.byId.get(this.kingTask.treeId);if(object){this.scene.workerSystem.reservations.release(this.reservation(object),'king');this.view(object)?.showWork?.();}this.kingTask=null;}
  beginKingChop(object){
    const s=this.scene,actor=s.character;if(!object?.definition.tree||object.natural?.stage!==3||!actor.isAlive||actor.transitioning||!s.fog.isVisibleObject(object))return false;
    if(actor.mountedHorse&&!s.mountSystem.dismount())return false;
    const route=findPathToAny(s.map,actor.nextTile??actor.tile,this.goals(object),s.pathWear?.routingOptions(actor));
    if(!route){s.setStatus('No reachable place to chop this tree.');return false;}
    const key=this.reservation(object);if(!s.workerSystem.reservations.available(key,'king')){s.setStatus('This tree is already reserved.');return false;}
    this.cancelKing();s.constructionSystem?.stopKing();s.kingLogistics?.cancel();s.huntingSystem.cancel();s.mountSystem.cancel();s.treasureSystem.cancelRequest();
    if(!actor.command({kind:'move',goal:route.destination,silent:true}))return false;
    if(!s.workerSystem.reservations.reserve(key,'king'))return false;this.kingTask={treeId:object.natural.id,goal:{...route.destination},arrived:false};s.worldCamera?.follow?.();s.setStatus('King travelling to chop the tree.');return true;
  }
  updateKing(delta){
    const task=this.kingTask;if(!task)return;const s=this.scene,actor=s.character,object=this.byId.get(task.treeId);
    if(!object||object.natural.stage!==3||!actor.isAlive||actor.mountedHorse||s.workerSystem.reservations.owners.get(this.reservation(object))!=='king'){this.cancelKing();return;}
    if(actor.state!=='ground'||actor.nextTile||actor.path.length)return;
    if(actor.tile.x!==task.goal.x||actor.tile.y!==task.goal.y){this.cancelKing();return;}
    if(!task.arrived){task.arrived=true;return;}
    actor.direction={x:Math.sign(object.x-actor.tile.x),y:Math.sign(object.y-actor.tile.y)};
    this.work(object,actor,delta);
  }
  work(object,actor,delta){
    if(!Number.isFinite(delta)||delta<=0||this.scene.gameTime.paused||this.scene.gameOver||actor.mountedHorse)return false;
    const n=object.natural,rule=object.definition.tree;if(n.stage!==3||!actor.isAlive||actor.nextTile||actor.path.length||!this.goals(object).some(t=>t.x===actor.tile.x&&t.y===actor.tile.y)||this.scene.workerSystem.reservations.owners.get(this.reservation(object))!==actor.id)return false;
    n.workDone=Math.min(rule.chopDuration,n.workDone+delta*this.scene.skillSystem.workEfficiency(actor,'woodcutting'));this.view(object)?.showWork?.(n.workDone/rule.chopDuration);if(n.workDone+1e-7<rule.chopDuration)return false;
    // Commit the stump before drops/XP: another actor, frame or load cannot repeat a harvest.
    n.stage=0;n.growthDays=0;n.growthCheckpoint=this.growthClock;n.workDone=0;n.cycle++;this.refreshMap(object);this.view(object)?.setNaturalState?.(object);this.scene.workerSystem.reservations.release(this.reservation(object),actor.id);if(actor.id==='king')this.kingTask=null;
    this.scene.dropSystem.create('wood',{x:object.x,y:object.y},rule.wood,null,{rewardRemaining:0,rewardUnits:0});
    this.scene.activities.emit('treeChopped',{actor,objectType:object.type,quantity:1,objectIds:[n.id]},`tree:${n.id}:${n.cycle}`);this.scene.setStatus(`${rule.wood} Wood lies beside the stump. Carry it to storage.`);return true;
  }
  exportState(){this.flushGrowth();return{nextId:this.nextId,nextDepositId:this.nextDepositId,growthClock:this.growthClock,ageClock:this.ageClock,refreshElapsed:this.refreshElapsed,kingTask:structuredClone(this.kingTask)};}
  importState(data){this.cancelKing();Object.assign(this,structuredClone(data));if(this.kingTask){const object=this.byId.get(this.kingTask.treeId);this.scene.workerSystem.reservations.reserve(this.reservation(object),'king');}this.refreshSeason();}
  destroy(){this.cancelKing();this.unsubscribe();this.scene.events?.off('buildings:changed',this.worldChanged);if(this.scene.resourceOccupancy.naturalContext===this)delete this.scene.resourceOccupancy.naturalContext;this.byId.clear();}
}
