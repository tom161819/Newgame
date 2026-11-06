import { buildingDefinition,buildingIsComplete,towerNeighbors } from '../game/buildings.js';
import { findPathToAny } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
export const BUILDER_WITHOUT_WORKSHOP=.5;
// Derived base association only: Builders remain global workers and share a workshop.
// No employee slots, permanent buff, extra scheduler, or persisted idle reservations.
export class BuilderWorkshopBases {
  constructor(construction){this.construction=construction;this.scene=construction.scene;this.cache=new Map();}
  bases(){return this.scene.buildings.filter(b=>buildingDefinition(b).builderBase&&buildingIsComplete(b)&&!b.demolition);}
  home(worker){
    if(!worker?.isAlive||worker.isSubject===false||worker.profession!=='builder'){this.cache.delete(worker?.id);return null;}
    const s=this.scene,bases=this.bases(),revision=`${this.construction.revision}:${s.naturalResources?.topologyRevision??0}:${s.buildings.length}`,now=s.gameTime.totalElapsed,old=this.cache.get(worker.id),previous=bases.find(b=>b.id===old?.id);
    if(old?.revision===revision&&(previous||now<old.retryAt))return previous??null;
    const start=worker.nextTile??worker.tile,goals=new Map(),map=s.map;
    // Keep an accessible base stable while the worker travels to a distant site.
    if(previous){const route=findPathToAny(map,start,towerNeighbors(previous).filter(t=>map[t.y]?.[t.x]===0));if(route){this.cache.set(worker.id,{id:previous.id,revision,retryAt:now+2000});return previous;}}
    for(const b of bases)for(const tile of towerNeighbors(b))if(map[tile.y]?.[tile.x]===0)goals.set(tileKey(tile),b);
    const route=goals.size?findPathToAny(map,start,[...goals.keys()].map(k=>{const[x,y]=k.split(',').map(Number);return{x,y};})):null,base=route&&goals.get(tileKey(route.destination));
    this.cache.set(worker.id,{id:base?.id??null,revision,retryAt:now+2000});return base??null;
  }
  factor(worker){return this.home(worker)?1:BUILDER_WITHOUT_WORKSHOP;}
  homes(worker){const building=this.home(worker);return building?[{building,kind:'workplace'}]:[];}
  users(building){return this.scene.workerSystem.liveSubjects().filter(w=>this.home(w)?.id===building.id);}
}
