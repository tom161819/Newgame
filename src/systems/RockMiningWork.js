import { ROCK_MINING as RULES } from '../data/rockMining.js';
import { tileKey } from '../game/stones.js';
import { carryCapacity } from '../data/logistics.js';
import { t } from '../i18n/index.js';

// An optional finite target provider for MiningWork, not another worker scheduler.
export class RockMiningWork {
  constructor(scene){this.scene=scene;this.records=new Map();}
  eligible(worker){return worker?.isAlive&&worker.isSubject!==false&&worker.profession==='miner'&&worker.assignedWorkplaceId==null&&!worker.arriving;}
  visible(tile){return this.scene.fog.isVisibleTile(tile);}
  mark(tile,enabled=true){
    const s=this.scene,id=tileKey(tile);if(s.gameOver||s.gameTime.paused||!this.visible(tile)||s.terrainGrid[tile.y]?.[tile.x]!==1)return false;
    let r=this.records.get(id);if(!r){if(!enabled)return false;r={id,tile:{...tile},marked:true,produced:0,workDone:0,dropId:null,outputTile:null};this.records.set(id,r);}r.marked=enabled;
    if(!enabled)for(const w of s.workerSystem.liveWorkers())if(w.manualRockId===id){if(w.workTask?.kind==='mineRock')s.workerSystem.ai.cancel(w);w.manualRockId=null;}
    return true;
  }
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
      const choices=[...this.records.values()].filter(r=>r.marked&&(![...system.liveWorkers()].some(w=>w!==worker&&w.manualRockId===r.id)));
      for(const r of choices){const drop=s.dropSystem.drops.get(r.dropId),goals=r.produced===RULES.yield?(drop?[drop.tile]:[]):this.goals(r,worker),route=system.ai.route(worker,goals);if(route){record=r;break;}if(r.produced===RULES.yield&&!drop){r.marked=false;}}
      if(!record){this.wait(worker,'rock.noWork');return true;}worker.manualRockId=record.id;
    }
    const drop=s.dropSystem.drops.get(record.dropId);
    if(record.produced===RULES.yield){
      if(worker.workTask?.kind==='mineRock')system.ai.cancel(worker);
      if(!drop){record.marked=false;worker.manualRockId=null;worker.aiCooldown=0;return true;}
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
    worker.workState='Working';worker.workMessage=t('rock.progress',{count:record.produced,total:RULES.yield});worker.displayProfession='miner';
    record.workDone=Math.min(RULES.duration,record.workDone+Math.min(delta,worker.availableWorkMs??delta)*s.skillSystem.workEfficiency(worker,'mining'));
    if(record.workDone+1e-7<RULES.duration)return true;
    record.workDone=0;record.produced++;
    record.outputTile??={...task.goal};const output=s.dropSystem.create('stone',record.outputTile,1,null,{rewardRemaining:0,rewardUnits:0});record.dropId=output.id;
    s.resourceLedger?.income('stone',1,'Manual Rock Mining',{id:`rock:${record.id}:${record.produced}`,entityId:record.id,type:'production'});
    s.activities.emit('manualRockMined',{actor:worker,objectType:'rock_outcrop',quantity:1,objectId:record.id},`rock:${record.id}:${record.produced}`);
    if(record.produced===RULES.yield){s.terrainGrid[record.tile.y][record.tile.x]=0;s.naturalResources.mining.restoreTiles([record.tile]);s.terrain?.invalidateArea([record.tile]);system.ai.cancel(worker);worker.manualRockId=record.id;worker.aiCooldown=0;}
    return true;
  }
  exportState(){return {records:structuredClone([...this.records.values()])};}
  importState(state){this.records=new Map(state.records.map(r=>[r.id,structuredClone(r)]));}
}
