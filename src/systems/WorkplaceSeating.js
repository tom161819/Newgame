import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { tileKey } from '../game/stones.js';
import { findPathToAny } from '../game/pathfinding.js';
import { WORKPLACE_SEATS as RULES } from '../data/workplaceSeats.js';
import { WorkplacePorchRenderer } from '../ui/WorkplacePorchRenderer.js';
const same=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y;
export class WorkplaceSeating {
  constructor(system){this.system=system;this.scene=system.scene;this.claims=new Map();this.retry=new Map();this.anchorCache=new Map();this.renderer=new WorkplacePorchRenderer(this.scene);}
  complete(home){return buildingIsComplete(home)&&!home.demolition;}
  revision(){const s=this.scene;return `${s.constructionSystem?.revision??0}:${s.naturalResources?.topologyRevision??0}:${s.buildings.length}:${s.pathWear?.pavedCount??0}`;}
  invalidate(){this.anchorCache.clear();this.doorsKey=null;}
  doors(){const key=this.revision();if(this.doorsKey!==key){this.doorsKey=key;this.doorCache=new Set(this.scene.buildings.flatMap(b=>[...b.tiles,...towerNeighbors(b)]).map(tileKey));}return this.doorCache;}
  open(tile,worker=null){const s=this.scene,key=tileKey(tile);return s.map[tile.y]?.[tile.x]===0&&!s.resourceOccupancy.has(key)&&!s.pathWear?.isPaved(tile)&&!this.doors().has(key)&&(!worker||this.system.reservations.available(`idle-anchor:${key}`,worker.id))&&![...(s.vehicles?.vehicles.values()??[])].some(v=>v.x===tile.x&&v.y===tile.y);}
  anchors(home){
    const d=buildingDefinition(home),key=`${home.id}:${d.workplace?.capacity}:${this.revision()}`,old=this.anchorCache.get(home.id);if(old?.key===key)return old.tiles;
    const candidates=[];for(let row=0;row<2;row++)for(let x=home.x-1;x<=home.x+d.width;x++){const tile={x,y:home.y+d.height+1+row};if(this.open(tile))candidates.push(tile);}
    candidates.sort((a,b)=>a.y-b.y||Math.abs(a.x-home.x-d.width*.65)-Math.abs(b.x-home.x-d.width*.65)||a.x-b.x);const tiles=candidates.slice(0,d.workplace?.capacity??0);this.anchorCache.set(home.id,{key,tiles});return tiles;
  }
  eligible(worker){
    const s=this.scene,home=s.workplaceSystem?.building(worker);
    if(!worker.isAlive||worker.leaving||worker.isSubject===false||worker.arriving||worker.commandState?.state!=='Working'||worker.workTask||worker.cargo||!home||!this.complete(home)||!worker.workplaceReached||worker.workState!=='Waiting'||s.farmingSystem?.tending.has(worker.id)||s.stables?.jobs.has(worker.id))return null;
    if([...s.combat.attacks].some(([a,b])=>a===worker||b===worker))return null;return home;
  }
  release(worker,{stop=false}={}){
    const claim=this.claims.get(worker.id);if(worker.view?.scene)worker.view.setSeated?.(false);this.retry.delete(worker.id);if(!claim)return;
    this.system.reservations.release(`seat:${claim.homeId}:${tileKey(claim.goal)}`,worker.id);this.system.reservations.release(`idle-anchor:${tileKey(claim.goal)}`,worker.id);this.claims.delete(worker.id);if(stop&&same(worker.path.at(-1),claim.goal))worker.path=[];
  }
  update(worker){
    const home=this.eligible(worker);if(!home){this.release(worker);return;}
    const now=this.scene.gameTime.totalElapsed;let claim=this.claims.get(worker.id);
    if(claim&&(claim.homeId!==home.id||!this.open(claim.goal,worker)||!this.anchors(home).some(t=>same(t,claim.goal))||now>claim.deadline&&!claim.seated)){this.release(worker,{stop:true});this.retry.set(worker.id,now+RULES.retryMs);claim=null;}
    if(claim){
      if(worker.nextTile||worker.path.length){worker.view?.setSeated?.(false);return;}
      if(same(worker.tile,claim.goal)){claim.seated=true;worker.view?.setSeated?.(true);return;}
      this.release(worker);this.retry.set(worker.id,now+RULES.retryMs);return;
    }
    if(now<(this.retry.get(worker.id)??0))return;
    if(this.budgetAt!==now){this.budgetAt=now;this.budget=RULES.plansPerFrame;}if(!this.budget)return;this.budget--;
    const occupied=new Set([this.scene.character,...this.system.liveWorkers(),...(this.scene.animalSystem?.animals.values()??[])].filter(a=>a!==worker&&a.isAlive&&!a.mounted).flatMap(a=>a.reservedTiles()).map(tileKey));
    this.retry.set(worker.id,now+RULES.retryMs);const goals=this.anchors(home).filter(t=>this.open(t,worker)&&!occupied.has(tileKey(t))),route=goals.length?findPathToAny(this.system.navigationMap(worker),worker.nextTile??worker.tile,goals,this.scene.pathWear?.routingOptions(worker)):null;if(!route)return;
    const goal=route.destination,seatKey=`seat:${home.id}:${tileKey(goal)}`,idleKey=`idle-anchor:${tileKey(goal)}`;
    this.system.gather?.release(worker);if(!this.system.reservations.reserve(idleKey,worker.id))return;if(!this.system.reservations.reserve(seatKey,worker.id)){this.system.reservations.release(idleKey,worker.id);return;}
    this.claims.set(worker.id,{homeId:home.id,goal:{...goal},seated:false,deadline:now+RULES.travelMs});worker.path=route.path;
  }
  render(){this.renderer.update(this);}
  destroy(){for(const w of this.system.workers.values())this.release(w);this.claims.clear();this.retry.clear();this.anchorCache.clear();this.renderer.destroy();}
}
