import { ROCK_MINING as RULES,CLEARING,clearsObstacles } from '../data/rockMining.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { carryCapacity } from '../data/logistics.js';
import { t } from '../i18n/index.js';

// An optional finite target provider for MiningWork, not another worker scheduler.
export class RockMiningWork {
  // m-oznacovani-tezby (51): trees and bushes marked for a Woodcutter (id → {id, planId}); planId: the wall plan that made the mark.
  constructor(scene){this.scene=scene;this.records=new Map();this.trees=new Map();this.bushes=new Map();this.loanRetryAt=0;}
  // m-oznacovani-tezby (56): a Miner lent out by his workplace (clearingLoan) works like a free one until the plan rocks are gone.
  eligible(worker){return worker?.isAlive&&worker.isSubject!==false&&worker.profession==='miner'&&(worker.assignedWorkplaceId==null||worker.clearingLoan===true)&&!worker.arriving;}
  visible(tile){return this.scene.fog.isVisibleTile(tile);}
  mark(tile,enabled=true){
    const s=this.scene,id=tileKey(tile);if(s.gameOver||s.gameTime.paused||!this.visible(tile)||s.terrainGrid[tile.y]?.[tile.x]!==1)return false;
    let r=this.records.get(id);if(!r){if(!enabled)return false;r={id,tile:{...tile},marked:true,produced:0,workDone:0,dropId:null,outputTile:null};this.records.set(id,r);}r.marked=enabled;
    if(!enabled)this.unmark(r);
    return true;
  }
  unmark(r){const s=this.scene;r.marked=false;delete r.planId;for(const w of s.workerSystem.liveWorkers())if(w.manualRockId===r.id){if(w.workTask?.kind==='mineRock')s.workerSystem.ai.cancel(w);w.manualRockId=null;}}
  // m-oznacovani-tezby (51): one tile of the marking tool (its rock, tree and bush); a tile under a wall plan keeps its marks.
  markTile(tile,enabled=true){
    const s=this.scene;if(s.gameOver||s.gameTime.paused||!this.visible(tile)||!enabled&&this.plannedTiles().has(tileKey(tile)))return 0;
    let count=0;if(s.terrainGrid[tile.y]?.[tile.x]===1&&this.mark(tile,enabled))count++;
    const tree=this.treeAt(tile);if(tree&&this.markTree(tree,enabled))count++;
    if(s.bushes?.has(tileKey(tile))&&this.markBush(tile,enabled))count++;
    return count;
  }
  treeAt(tile){const s=this.scene,object=s.resources.get(s.resourceOccupancy.get(tileKey(tile)))?.getData('object');return object?.definition.tree&&object.natural?.stage>0?object:null;}
  markTree(object,enabled=true,planId=null){const id=object.natural.id;if(!enabled){if(!this.trees.delete(id))return false;this.stopClearing(`tree:${id}`);return true;}if(!this.trees.has(id))this.trees.set(id,{id,planId});return true;}
  markBush(tile,enabled=true,planId=null){const id=tileKey(tile);if(!enabled){if(!this.bushes.delete(id))return false;this.stopClearing(`bush:${id}`);return true;}if(!this.bushes.has(id))this.bushes.set(id,{id,planId});return true;}
  stopClearing(markId){const s=this.scene;for(const w of s.workerSystem.liveWorkers())if(w.workTask?.kind==='clearMark'&&w.workTask.targetId===markId)s.workerSystem.ai.cancel(w);}
  // A marked sapling becomes a stump, a marked bush disappears; neither yields anything.
  cleared(markId){
    const s=this.scene,natural=s.naturalResources,split=markId.indexOf(':'),kind=markId.slice(0,split),id=markId.slice(split+1);
    if(kind==='tree'){const object=natural.byId.get(id),n=object?.natural;this.trees.delete(id);if(!n||n.stage===0)return;n.stage=0;n.growthDays=0;n.growthCheckpoint=natural.growthClock;n.workDone=0;n.cycle++;natural.refreshMap(object);natural.view(object)?.setNaturalState?.(object);return;}
    this.bushes.delete(id);if(s.bushes?.delete(id)){const [x,y]=id.split(',').map(Number);natural.topologyRevision++;s.terrain?.invalidateArea?.([{x,y}]);}
  }
  // m-oznacovani-tezby (56): plans of walls, towers and gates; their obstacles block construction until removed.
  plans(){return this.scene.buildings.filter(b=>!b.unverified&&!buildingIsComplete(b)&&clearsObstacles(buildingDefinition(b)));}
  plannedTiles(){return new Set(this.plans().flatMap(b=>b.tiles.map(tileKey)));}
  obstructed(site){if(!site||site.demolition===true||site.unverified||buildingIsComplete(site)||!clearsObstacles(buildingDefinition(site)))return false;const s=this.scene;return site.tiles.some(t=>s.terrainGrid[t.y]?.[t.x]===1||!!this.treeAt(t));}
  markPlan(building){
    const s=this.scene;if(building.unverified||buildingIsComplete(building)||!clearsObstacles(buildingDefinition(building)))return;
    for(const tile of building.tiles){
      const id=tileKey(tile);
      if(s.terrainGrid[tile.y]?.[tile.x]===1){let r=this.records.get(id);if(!r){r={id,tile:{...tile},marked:false,produced:0,workDone:0,dropId:null,outputTile:null};this.records.set(id,r);}if(!r.marked){r.marked=true;r.planId=building.id;}}
      const tree=this.treeAt(tile);if(tree)this.markTree(tree,true,building.id);
      if(s.bushes?.has(id))this.markBush(tile,true,building.id);
    }
  }
  // Only the marks the plan made go; a rock already mined keeps its order until its stones are carried away.
  clearPlan(id){
    for(const r of this.records.values())if(r.planId===id){if(r.produced<RULES.yield)this.unmark(r);else delete r.planId;}
    for(const [key,m]of this.trees)if(m.planId===id){this.trees.delete(key);this.stopClearing(`tree:${key}`);}
    for(const [key,m]of this.bushes)if(m.planId===id){this.bushes.delete(key);this.stopClearing(`bush:${key}`);}
  }
  // A finished wall leaves no bush under it.
  planFinished(site){this.clearPlan(site.id);if(!clearsObstacles(buildingDefinition(site)))return;for(const tile of site.tiles){const id=tileKey(tile);if(this.scene.bushes?.has(id))this.cleared(`bush:${id}`);}}
  reconcile(){
    const s=this.scene,ids=new Set([...this.records.values(),...this.trees.values(),...this.bushes.values()].map(m=>m.planId).filter(id=>id!=null));
    for(const id of ids){const b=s.buildings.find(b=>b.id===id);if(!b||b.unverified||buildingIsComplete(b))this.clearPlan(id);}
    for(const id of [...this.trees.keys()])if(!(s.naturalResources?.byId.get(id)?.natural.stage>0))this.trees.delete(id);
    for(const id of [...this.bushes.keys()])if(!s.bushes?.has(id))this.bushes.delete(id);
    for(const b of this.plans())this.markPlan(b);
  }
  // m-oznacovani-tezby (56): with no free Miner, one employed Miner leaves his workplace for the rocks of wall plans.
  borrow(worker){
    const s=this.scene;if(worker?.profession!=='miner'||worker.assignedWorkplaceId==null||worker.clearingLoan||!worker.isAlive||worker.isSubject===false||worker.arriving||worker.cargo||worker.workTask||s.gameTime.totalElapsed<this.loanRetryAt)return false;
    if(![...this.records.values()].some(r=>r.marked&&r.produced<RULES.yield))return false;
    const planned=this.plannedTiles();if(![...this.records.values()].some(r=>r.marked&&r.produced<RULES.yield&&planned.has(r.id)))return false;
    if(s.workerSystem.liveWorkers().some(w=>w.clearingLoan||w.profession==='miner'&&w.assignedWorkplaceId==null&&w.isSubject!==false))return false;
    s.workerSystem.ai.cancel(worker);worker.clearingLoan=true;worker.manualRockId=null;return true;
  }
  endLoan(worker){worker.clearingLoan=false;worker.manualRockId=null;worker.workplaceReached=false;worker.workState='Going to Workplace';worker.workMessage='';worker.aiCooldown=0;this.loanRetryAt=this.scene.gameTime.totalElapsed+CLEARING.loanRetryMs;}
  key(id){return `rock:${id}`;}
  slot(goal){return `natural-slot:${tileKey(goal)}`;}
  release(worker){const task=worker.workTask;if(task?.kind==='mineRock')this.scene.workerSystem.reservations.release(this.slot(task.goal),worker.id);}
  goals(record,worker){
    const s=this.scene,{x,y}=record.tile;
    return [{x:x-1,y},{x:x+1,y},{x,y:y-1},{x,y:y+1}].filter(p=>s.map[p.y]?.[p.x]===0&&!s.buildings.some(b=>b.tiles.some(q=>tileKey(q)===tileKey(p)))&&s.workerSystem.reservations.available(this.slot(p),worker.id));
  }
  wait(worker,key){worker.workState='Waiting';worker.workMessage=t(key);worker.aiCooldown=RULES.retryMs;}
  update(worker,delta){
    const s=this.scene,system=s.workerSystem;if(!this.eligible(worker))return false;
    if([...s.combat.attacks].some(([actor,target])=>actor===worker||target===worker)){if(worker.workTask?.kind==='mineRock')system.ai.cancel(worker);this.wait(worker,'rock.danger');return true;}
    let record=this.records.get(worker.manualRockId);
    if(!record?.marked){worker.manualRockId=null;record=null;}
    if(worker.cargo||worker.workTask&&worker.workTask.kind!=='mineRock')return true;
    if(worker.aiCooldown>0&&!worker.workTask)return true;
    if(!record){
      // Rocks under wall plans first; a lent Miner takes only those and goes back when none is left.
      const planned=this.plannedTiles(),choices=[...this.records.values()].filter(r=>r.marked&&(!worker.clearingLoan||planned.has(r.id)&&r.produced<RULES.yield)&&(![...system.liveWorkers()].some(w=>w!==worker&&w.manualRockId===r.id))).sort((a,b)=>planned.has(b.id)-planned.has(a.id));
      for(const r of choices){const drop=s.dropSystem.drops.get(r.dropId),goals=r.produced===RULES.yield?(drop?[drop.tile]:[]):this.goals(r,worker),route=system.ai.route(worker,goals);if(route){record=r;break;}if(r.produced===RULES.yield&&!drop){r.marked=false;delete r.planId;}}
      if(!record){if(worker.clearingLoan)this.endLoan(worker);else this.wait(worker,'rock.noWork');return true;}worker.manualRockId=record.id;
    }
    const drop=s.dropSystem.drops.get(record.dropId);
    if(record.produced===RULES.yield){
      if(worker.workTask?.kind==='mineRock')system.ai.cancel(worker);
      if(!drop){record.marked=false;delete record.planId;worker.manualRockId=null;worker.aiCooldown=0;return true;}
      const destination=s.foodStorage.findDestination(worker,'stone',1),route=system.ai.route(worker,[drop.tile]),amount=destination?Math.min(drop.amount,carryCapacity(worker,'stone'),s.foodStorage.room(destination.location.id,'stone')):0;
      if(!destination||!route||!system.reservations.available(`drop:${drop.id}`,worker.id)){this.wait(worker,'rock.noStorage');return true;}
      const transferId=`food-transfer-${s.foodProduction.nextTransfer++}`,capacityReservation=s.foodStorage.reserve('capacity',destination.location.id,'stone',amount,transferId);if(!capacityReservation)return true;
      if(!system.reservations.reserve(`drop:${drop.id}`,worker.id)||!s.foodProduction.setTask(worker,'foodPickup',route,{transferId,capacityReservation,destinationId:destination.location.id,sourceDropId:drop.id,resource:'stone',amount,manualMining:true,rockId:record.id})){system.reservations.release(`drop:${drop.id}`,worker.id);s.foodStorage.release(capacityReservation);}return true;
    }
    let task=worker.workTask;
    if(!task){
      const route=system.ai.route(worker,this.goals(record,worker));if(!route||!system.reservations.reserve(this.key(record.id),worker.id)){this.wait(worker,'rock.noAccess');return true;}
      if(!system.reservations.reserve(this.slot(route.destination),worker.id)){system.reservations.release(this.key(record.id),worker.id);return true;}
      worker.workTask=task={kind:'mineRock',targetId:record.id,reservation:this.key(record.id),goal:{...route.destination},progressMs:0};worker.path=route.path;
    }
    if(!record.marked||s.terrainGrid[record.tile.y]?.[record.tile.x]!==1||!this.goals(record,worker).some(p=>tileKey(p)===tileKey(task.goal))){system.ai.cancel(worker);this.wait(worker,'rock.noAccess');return true;}
    if(worker.nextTile||worker.path.length){worker.workState='Traveling to Target';worker.workMessage=t('rock.travelling');return true;}
    if(!system.ai.atGoal(worker,task.goal)){system.ai.cancel(worker);this.wait(worker,'rock.noAccess');return true;}
    if(record.outputTile&&s.map[record.outputTile.y]?.[record.outputTile.x]!==0&&drop){system.ai.cancel(worker);this.wait(worker,'rock.noAccess');return true;}
    worker.workState='Working';worker.workMessage=t('rock.progress',{count:record.produced,total:RULES.yield});worker.displayProfession='miner';
    record.workDone=Math.min(RULES.duration,record.workDone+Math.min(delta,worker.availableWorkMs??delta)*s.skillSystem.workEfficiency(worker,'mining'));
    if(record.workDone+1e-7<RULES.duration)return true;
    record.workDone=0;record.produced++;
    if(!record.outputTile||s.map[record.outputTile.y]?.[record.outputTile.x]!==0)record.outputTile={...task.goal};const output=s.dropSystem.create('stone',record.outputTile,1,null,{rewardRemaining:0,rewardUnits:0});record.dropId=output.id;
    s.resourceLedger?.income('stone',1,'Manual Rock Mining',{id:`rock:${record.id}:${record.produced}`,entityId:record.id,type:'production'});
    s.activities.emit('manualRockMined',{actor:worker,objectType:'rock_outcrop',quantity:1,objectId:record.id},`rock:${record.id}:${record.produced}`);
    if(record.produced===RULES.yield){s.terrainGrid[record.tile.y][record.tile.x]=0;s.naturalResources.mining.restoreTiles([record.tile]);s.terrain?.invalidateArea([record.tile]);system.ai.cancel(worker);worker.manualRockId=record.id;worker.aiCooldown=0;}
    return true;
  }
  // Tree and bush marks are saved only when there are some (SAVE_VERSION 58 stays: the field is optional).
  exportState(){this.reconcile();const entry=m=>m.planId==null?{id:m.id}:{id:m.id,planId:m.planId};return {records:structuredClone([...this.records.values()]),...(this.trees.size||this.bushes.size?{marks:{trees:[...this.trees.values()].map(entry),bushes:[...this.bushes.values()].map(entry)}}:{})};}
  importState(state){this.records=new Map(state.records.map(r=>[r.id,structuredClone(r)]));const entry=m=>[m.id,{id:m.id,planId:m.planId??null}];this.trees=new Map((state.marks?.trees??[]).map(entry));this.bushes=new Map((state.marks?.bushes??[]).map(entry));}
}
