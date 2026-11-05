import { STABLE_RULES } from '../data/stables.js';
import { t } from '../i18n/index.js';
import { buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { adjacentTiles,canInteractAdjacent } from '../game/interaction.js';
import { tileKey } from '../game/stones.js';
import { tileCenter } from '../game/isometric.js';

// S12 phase C: tamed horses belong to Stables. Stablehands tame wild horses on their own whenever a Stables has room
// (the place is reserved when the job starts, so two people never take the last place or the same horse), then lead
// the horse into the paddock. The King tames a wild horse by riding it for 25 s; dismounting beside Stables with room
// puts it inside. A tamed horse is never hunted, never duplicated and stays a real animal.
export class StableSystem {
  constructor(scene){this.scene=scene;this.horses=new Map();this.jobs=new Map();}
  stables(){return this.scene.buildings.filter(b=>b.type==='stables'&&buildingIsComplete(b));}
  stable(id){return this.stables().find(b=>b.id===id)??null;}
  horse(id){return this.scene.animalSystem.animals.get(id)??null;}
  tamed(animal){return this.horses.has(animal?.id);}
  stabledIn(stableId){return [...this.horses.entries()].filter(([,h])=>h.stableId===stableId);}
  used(stableId){return this.stabledIn(stableId).length+[...this.jobs.values()].filter(j=>j.stableId===stableId).length;}
  room(stableId){const b=this.stable(stableId);return b?Math.max(0,b.definition.horseCapacity-this.used(stableId)):0;}
  freeStable(near){return this.stables().filter(b=>this.room(b.id)>0).sort((a,b)=>Math.hypot(a.x-near.x,a.y-near.y)-Math.hypot(b.x-near.x,b.y-near.y))[0]??null;}
  wild(animal){return animal?.type==='horse'&&animal.isAlive&&animal.active&&!animal.mounted&&!this.tamed(animal)&&![...this.jobs.values()].some(j=>j.horseId===animal.id);}
  summary(stableId){return {horses:this.stabledIn(stableId).map(([id,h])=>({id,state:h.state,hp:this.horse(id)?.currentHP??0})),capacity:this.stable(stableId)?.definition.horseCapacity??0,taming:[...this.jobs.values()].filter(j=>j.stableId===stableId).length};}
  // A paddock spot inside the Stables footprint for each stabled horse.
  paddock(b,index){const spots=[[3,1],[3,3],[1,3],[4,2]],[dx,dy]=spots[index%spots.length];return {x:b.x+dx+.5,y:b.y+dy+.5};}
  place(id){
    const h=this.horses.get(id),b=h&&this.stable(h.stableId),a=this.horse(id);if(!b||!a)return;
    const index=this.stabledIn(b.id).findIndex(([hid])=>hid===id),p=this.paddock(b,index);
    const tile={x:Math.floor(p.x),y:Math.floor(p.y)},point=tileCenter(tile);a.path=[];a.nextTile=null;a.walking=false;a.position={x:p.x,y:p.y};a.tile=tile;
    a.view?.setPosition?.(point.x,point.y)?.setDepth?.(point.y+(a.definition.depth?.offset??0));
  }
  // Stablehand: pick a wild horse in sight, walk to it, tame it, lead it home. Returns true while working.
  updateWorker(worker,delta){
    const home=this.scene.workplaceSystem.building(worker);if(!home||home.type!=='stables'){this.cancel(worker);return false;}
    let job=this.jobs.get(worker.id);
    if(!job){
      if(this.room(home.id)<=0){worker.workState='Waiting';worker.workMessage='The Stables are full';return true;}
      const fog=this.scene.fog,horse=[...this.scene.animalSystem.animals.values()].filter(a=>this.wild(a)&&(!fog?.enabled||fog.isVisibleObject(a))&&Math.hypot(a.position.x-home.x,a.position.y-home.y)<=STABLE_RULES.searchRadius)
        .sort((a,b)=>Math.hypot(a.position.x-worker.position.x,a.position.y-worker.position.y)-Math.hypot(b.position.x-worker.position.x,b.position.y-worker.position.y))[0];
      if(!horse){worker.workState='Waiting';worker.workMessage='No wild horse in sight';return true;}
      job={horseId:horse.id,stableId:home.id,phase:'approach',progress:0};this.jobs.set(worker.id,job);
    }
    const horse=this.horse(job.horseId);if(!horse?.isAlive||horse.mounted){this.cancel(worker);return true;}
    if(job.phase==='approach'){
      worker.workState='Traveling to Target';worker.workMessage='Approaching a wild horse';
      if(!worker.nextTile&&canInteractAdjacent(this.scene.map,worker,horse)){job.phase='taming';horse.path=[];horse.wanderWait=STABLE_RULES.stablehandTameMs;}
      else if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=700;if(!worker.moveTo(adjacentTiles(horse,this.scene.map)))this.cancel(worker);}
      return true;
    }
    if(job.phase==='taming'){
      worker.workState='Working';worker.workMessage='Taming a horse';horse.path=[];horse.wanderWait=Math.max(horse.wanderWait??0,1000);
      job.progress+=delta*(this.scene.skillSystem?.workEfficiency(worker,'hunting')??1);
      if(job.progress>=STABLE_RULES.stablehandTameMs){job.phase='leading';this.scene.activities?.emit('horseTamed',{actor:worker,objectType:'horse',quantity:1});}
      return true;
    }
    // Leading: the horse follows a step behind; at the Stables it goes into the paddock.
    worker.workState='Working';worker.workMessage='Leading a horse to the Stables';
    const b=this.stable(job.stableId);if(!b){this.cancel(worker);return true;}
    const goals=towerNeighbors(b).filter(t=>this.scene.map[t.y]?.[t.x]===0),here=goals.some(t=>tileKey(t)===tileKey(worker.tile))&&!worker.nextTile&&!worker.path.length;
    if(here){this.jobs.delete(worker.id);this.horses.set(horse.id,{state:'stabled',stableId:b.id});this.place(horse.id);worker.workState='Searching for Work';worker.aiCooldown=0;return true;}
    if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=700;if(!worker.moveTo(goals))this.cancel(worker);}
    if(!horse.nextTile&&!horse.path.length&&Math.hypot(horse.position.x-worker.position.x,horse.position.y-worker.position.y)>1.6)horse.moveTo?.(adjacentTiles(worker,this.scene.map));
    return true;
  }
  cancel(worker){const job=this.jobs.get(worker.id);if(!job)return;this.jobs.delete(worker.id);const h=this.horse(job.horseId);if(h){h.wanderWait=0;h.path=[];}}
  // King: 25 s on a wild horse tames it; dismounting near Stables with room puts it inside.
  updateKing(delta){
    const king=this.scene.character,horse=king.mountedHorse;if(!horse||this.tamed(horse))return;
    horse.rideMs=(horse.rideMs??0)+delta;
    if(horse.rideMs>=STABLE_RULES.kingTameMs&&!horse.kingTamed){horse.kingTamed=true;this.scene.setStatus?.(t('stables.kingTamed'));}
  }
  onDismount(horse){
    if(!horse?.kingTamed||this.tamed(horse))return false;const king=this.scene.character,b=this.freeStable(king.tile);
    if(!b||Math.min(...towerNeighbors(b).map(t=>Math.hypot(t.x-king.tile.x,t.y-king.tile.y)))>STABLE_RULES.kingStableReach)return false;
    this.horses.set(horse.id,{state:'stabled',stableId:b.id});this.place(horse.id);return true;
  }
  update(delta){
    if(this.scene.gameTime?.paused)return;this.updateKing(delta);
    for(const [id,h]of [...this.horses]){const a=this.horse(id);if(!a?.isAlive||!this.stable(h.stableId)){this.horses.delete(id);if(a){a.path=[];a.wanderWait=0;}}}
    for(const j of this.jobs.values())if(j.phase==='leading'){const h=this.horse(j.horseId);if(h?.isAlive)h.update?.(delta);}
    for(const [workerId]of [...this.jobs]){const w=this.scene.workerSystem.workers.get(workerId);if(!w?.isAlive||w.profession!=='stablehand')this.cancel({id:workerId});}
  }
  // AnimalSystem skips its own wandering for tamed horses (they stand in the paddock) and for one being led.
  holds(animal){return this.tamed(animal)||[...this.jobs.values()].some(j=>j.horseId===animal.id&&j.phase!=='approach');}
  exportState(){return {horses:[...this.horses].map(([id,h])=>({id,...h})),jobs:[...this.jobs].map(([workerId,j])=>({workerId,...j})),ridden:this.scene.character?.mountedHorse?.kingTamed?this.scene.character.mountedHorse.id:null};}
  importState(data){
    this.horses=new Map((data?.horses??[]).map(({id,...h})=>[id,h]));this.jobs=new Map((data?.jobs??[]).map(({workerId,...j})=>[workerId,j]));
    if(data?.ridden){const a=this.horse(data.ridden);if(a){a.kingTamed=true;a.rideMs=STABLE_RULES.kingTameMs;}}
    for(const id of this.horses.keys())this.place(id);
  }
}
