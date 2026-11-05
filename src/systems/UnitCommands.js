import { findPathToAny,canStep } from '../game/pathfinding.js';
import { knownMap } from '../game/knownMap.js';
import { tileKey } from '../game/stones.js';
import { t } from '../i18n/index.js';

export const workingCommand=()=>({state:'Working',goal:null});
export const commanded=worker=>worker.commandState?.state==='MovingToHold'||worker.commandState?.state==='Holding';

// Owns only manual orders. Work, cargo, workplaces and reservations retain their
// existing owners; cancellation uses the same transaction paths as job changes.
export class UnitCommands {
  constructor(system){this.system=system;this.scene=system.scene;}
  owns(worker){return !!worker?.isAlive&&worker.isSubject!==false&&this.system.workers.get(worker.id)===worker&&!worker.leaving;}
  selectable(worker){return this.owns(worker)&&this.scene.fog.isVisibleObject(worker);}
  interrupt(worker){
    this.system.ai.cancel(worker);worker.arriving=false;worker.commandRetry=0;worker.commandWait=0;
    // Complete the already reserved half-step; never snap a moving cargo owner.
    worker.path=[];worker.workplaceReached=false;
  }
  hold(worker){
    if(!this.owns(worker))return false;this.interrupt(worker);
    worker.commandState={state:'Holding',goal:null};worker.workState='Holding';worker.workMessage='';return true;
  }
  resume(worker){
    if(!this.owns(worker))return false;worker.path=[];worker.commandState=workingCommand();worker.commandRetry=0;worker.commandWait=0;
    worker.workplaceReached=false;worker.aiCooldown=0;worker.workState=worker.profession==='idle'?'Idle':'Searching for Work';worker.workMessage='';this.scene.employment?.request();return true;
  }
  navigation(worker,base=knownMap(this.scene),departing=new Set()){
    const map=base.map(row=>[...row]);
    const units=[this.scene.character,...(this.scene.animalSystem?.animals.values()??[]),...this.system.liveWorkers()];
    for(const unit of units)if(unit!==worker&&!departing.has(unit.id)&&unit.isAlive&&!unit.mounted&&this.scene.fog.isVisibleObject(unit))for(const tile of unit.reservedTiles())if(map[tile.y]?.[tile.x]!==undefined)map[tile.y][tile.x]=1;
    const start=worker.nextTile??worker.tile;map[start.y][start.x]=0;return map;
  }
  move(workers,target){
    if(this.scene.gameOver||this.scene.gameTime.paused)return 0;
    const base=knownMap(this.scene);if(base[target.y]?.[target.x]!==0)return 0;
    const selected=[...new Set(workers)].filter(w=>this.selectable(w)).sort((a,b)=>a.id.localeCompare(b.id,undefined,{numeric:true}));
    const selectedIds=new Set(selected.map(w=>w.id)),used=new Set();
    for(const w of this.system.liveWorkers())if(!selectedIds.has(w.id)&&commanded(w)&&w.commandState.goal)used.add(tileKey(w.commandState.goal));
    // Deterministic rings keep the formation near the click, including map edges.
    const slots=[];const limit=Math.max(base.length,base[0].length);
    for(let r=0;r<limit&&slots.length<selected.length*4+16;r++)for(let y=Math.max(0,target.y-r);y<=Math.min(base.length-1,target.y+r);y++)for(let x=Math.max(0,target.x-r);x<=Math.min(base[0].length-1,target.x+r);x++){
      if(Math.max(Math.abs(x-target.x),Math.abs(y-target.y))===r&&base[y][x]===0&&!used.has(`${x},${y}`))slots.push({x,y});
    }
    let accepted=0;
    for(const worker of selected){
      const nav=this.navigation(worker,base,selectedIds),start=worker.nextTile??worker.tile;
      let route,goal;
      for(const slot of slots){if(used.has(tileKey(slot))||nav[slot.y][slot.x]!==0)continue;route=findPathToAny(nav,start,[slot]);if(route){goal=slot;break;}}
      if(!route)continue;
      this.interrupt(worker);worker.commandState={state:'MovingToHold',goal:{...goal}};worker.path=route.path;worker.workState='MovingToHold';used.add(tileKey(goal));accepted++;
    }
    return accepted;
  }
  canStep(worker,tile){
    // Only the next physical step consults reality: hidden obstacles cannot
    // affect acceptance or the planned formation at command time.
    if(canStep(this.system.navigationMap(worker),worker.tile,tile))return true;
    worker.path=[];worker.commandWait=1000;return false;
  }
  update(worker,delta){
    if(!commanded(worker))return false;
    const command=worker.commandState;
    worker.workState=command.state;worker.workMessage='';worker.commandWait=Math.max(0,(worker.commandWait??0)-delta);
    if(command.state==='MovingToHold'&&!worker.nextTile&&!worker.path.length){
      if(tileKey(worker.tile)===tileKey(command.goal)){command.state='Holding';worker.workState='Holding';}
      else if(!worker.commandWait){
        // Bound replans when a newly discovered wall or another unit blocks us.
        if((worker.commandRetry??0)>=3){this.hold(worker);this.scene.setStatus(t('command.blocked'));}
        else{worker.commandRetry=(worker.commandRetry??0)+1;worker.commandWait=1000;const route=findPathToAny(this.navigation(worker),worker.tile,[command.goal]);if(route)worker.path=route.path;}
      }
    }
    const before=tileKey(worker.tile);worker.update(delta);if(before!==tileKey(worker.tile))worker.commandRetry=0;return true;
  }
}
