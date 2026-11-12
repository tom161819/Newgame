import { idleHomes,IDLE_GATHERING as RULES } from '../data/idleGathering.js';
import { buildingDefinition,towerNeighbors } from '../game/buildings.js';
import { findPathToAny } from '../game/pathfinding.js';
import { tileKey } from '../game/stones.js';
const same=(a,b)=>a&&b&&a.x===b.x&&a.y===b.y;
const IDLE_MESSAGES=new Set(['Waiting for transport','Waiting near Castle','Waiting near workplace','Walking to Castle','Walking to workplace','Walking nearby']);
const salt=id=>[...String(id)].reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0);
// Derived idle path ownership, using the existing worker reservations and normal movement. Not a job scheduler.
export class IdleGathering {
  constructor(system){this.system=system;this.scene=system.scene;this.claims=new Map();this.nextPlans=new Map();this.draws=new Map();this.budgetAt=null;this.budget=0;}
  key(tile){return `idle-anchor:${tileKey(tile)}`;}
  // A number 0–1 of the worker's own: a hash of the id and a per-worker counter (the same in every run, no shared rhythm).
  chance(worker){const n=(this.draws.get(worker.id)??0)+1;this.draws.set(worker.id,n);let h=(salt(worker.id)^Math.imul(n,2654435761))>>>0;h=Math.imul(h^(h>>>15),2246822519)>>>0;h=(h^(h>>>13))>>>0;return h/4294967296;}
  atHome(worker){const claim=this.claims.get(worker.id);return !!claim&&claim.kind!=='local'&&this.scene.buildings.some(b=>b.id===claim.homeId)&&!worker.nextTile&&!worker.path.length&&same(worker.tile,claim.goal);}
  release(worker,{stop=false}={}){
    const claim=this.claims.get(worker.id);this.nextPlans.delete(worker.id);if(!claim)return;
    this.system.reservations.release(this.key(claim.goal),worker.id);this.claims.delete(worker.id);
    if(stop&&same(worker.path.at(-1),claim.goal))worker.path=[];
  }
  clear(){for(const [id,claim]of this.claims)this.system.reservations.release(this.key(claim.goal),id);this.claims.clear();this.nextPlans.clear();}
  doors(){const key=`${this.scene.constructionSystem?.revision??0}:${this.scene.buildings.length}`;if(key!==this.doorsKey){this.doorsKey=key;this.doorCache=new Set(this.scene.buildings.flatMap(b=>[...b.tiles,...towerNeighbors(b)]).map(tileKey));}return this.doorCache;}
  valid(tile,worker,doors,occupied=null){
    const s=this.scene,key=tileKey(tile);
    if(s.map[tile.y]?.[tile.x]!==0||s.resourceOccupancy.has(key)||s.pathWear?.isPaved(tile)||doors.has(key)||!this.system.reservations.available(this.key(tile),worker.id))return false;
    if([...this.scene.vehicles?.vehicles.values()??[]].some(v=>v.operatorId!==worker.id&&v.x===tile.x&&v.y===tile.y))return false;
    return !occupied?.has(key);
  }
  candidates(home){
    const b=home.building,d=buildingDefinition(b),tiles=[];
    for(let y=b.y-RULES.maximumMargin;y<b.y+d.height+RULES.maximumMargin;y++)for(let x=b.x-RULES.maximumMargin;x<b.x+d.width+RULES.maximumMargin;x++){
      const margin=Math.max(b.x-x,x-(b.x+d.width-1),b.y-y,y-(b.y+d.height-1));if(margin>=RULES.minimumMargin&&margin<=RULES.maximumMargin)tiles.push({x,y});
    }return tiles;
  }
  update(worker,options={}){
    if(!worker.isAlive||worker.isSubject===false||worker.arriving||worker.workTask||worker.cargo||worker.commandState?.state!=='Working'){this.release(worker);return false;}
    const diagnostic=worker.profession==='hauler'&&worker.workMessage&&!IDLE_MESSAGES.has(worker.workMessage)?worker.workMessage:null;
    const message=value=>{worker.workMessage=diagnostic??value;};
    const now=this.scene.gameTime.totalElapsed,homes=idleHomes(this.scene,worker,options),doors=this.doors();let claim=this.claims.get(worker.id);
    if(options.workplaceOnly&&!homes.length){this.release(worker,{stop:true});return false;}
    if(claim&&(!this.valid(claim.goal,worker,doors)||claim.kind!=='local'&&!homes.some(h=>h.building.id===claim.homeId))){this.release(worker,{stop:true});claim=null;}
    worker.workState=worker.profession==='idle'?'Idle':'Waiting';message(claim?.kind==='workplace'?'Waiting near workplace':claim?.kind==='castle'?'Waiting near Castle':worker.profession==='idle'?'Unemployed':'Waiting for transport');
    if(claim){
      if(worker.nextTile||worker.path.length){worker.workState='Traveling to Target';message(claim.kind==='castle'?'Walking to Castle':claim.kind==='workplace'?'Walking to workplace':'Walking nearby');return true;}
      if(same(worker.tile,claim.goal)){
        claim.until??=now+RULES.dwellMinMs+this.chance(worker)*(RULES.dwellMaxMs-RULES.dwellMinMs);
        if(now<claim.until&&(claim.kind!=='local'||!homes.length||now<(this.nextPlans.get(worker.id)??0)))return true;
      }
    }
    // A resident already standing by the Castle with no spot yet (start, load, morning) starts after a wait of their own.
    if(!claim&&!this.nextPlans.has(worker.id)&&worker.profession==='idle'&&homes.some(h=>{const b=h.building,d=buildingDefinition(b);return Math.max(b.x-worker.tile.x,worker.tile.x-(b.x+d.width-1),b.y-worker.tile.y,worker.tile.y-(b.y+d.height-1))<=RULES.maximumMargin+2;})){this.nextPlans.set(worker.id,now+this.chance(worker)*RULES.firstWaitMs);return false;}
    if(now<(this.nextPlans.get(worker.id)??0))return !!claim;
    if(this.budgetAt!==now){this.budgetAt=now;this.budget=6;}if(!this.budget)return !!claim;this.budget--;
    const occupied=new Set([this.scene.character,...(this.scene.animalSystem?.animals.values()??[]),...this.system.liveWorkers()].filter(a=>a!==worker&&a.isAlive&&!a.mounted&&this.scene.stables?.horses.get(a.id)?.state!=='harnessed').flatMap(a=>a.reservedTiles()).map(tileKey));
    this.nextPlans.set(worker.id,now+RULES.retryMs);const goals=new Map(),expired=claim?.until!=null&&now>=claim.until;
    for(const home of homes)for(const tile of this.candidates(home))if(this.valid(tile,worker,doors,occupied)&&(!expired||!same(tile,claim.goal)))goals.set(tileKey(tile),{goal:tile,homeId:home.building.id,kind:home.kind});
    const nav=this.system.navigationMap(worker),start=worker.nextTile??worker.tile,routeFor=goals=>goals.size?findPathToAny(nav,start,[...goals.values()].map(g=>g.goal),this.scene.pathWear?.routingOptions(worker)):null;
    // After a dwell the next spot is one of a few drawn at random (the nearest of those), not the nearest of all.
    let pool=goals;if(expired&&goals.size>RULES.spotChoices){const list=[...goals],picked=new Map();for(let i=0;i<RULES.spotChoices;i++){const [k,v]=list[Math.floor(this.chance(worker)*list.length)];picked.set(k,v);}pool=picked;}
    let route=routeFor(pool)??(pool!==goals?routeFor(goals):null),chosen=route&&goals.get(tileKey(route.destination));
    if(!route){
      if(claim&&!expired&&same(worker.tile,claim.goal))return true;
      const origin=claim?.localOrigin??{...worker.tile},local=new Map();
      for(let dy=-RULES.localRadius;dy<=RULES.localRadius;dy++)for(let dx=-RULES.localRadius;dx<=RULES.localRadius;dx++){
        const tile={x:origin.x+dx,y:origin.y+dy};if(this.valid(tile,worker,doors,occupied)&&(!expired||!same(tile,claim.goal)))local.set(tileKey(tile),{goal:tile,homeId:null,kind:'local',localOrigin:origin});
      }
      route=routeFor(local);chosen=route&&local.get(tileKey(route.destination));
    }
    if(!chosen)return !!claim;
    if(!this.system.reservations.reserve(this.key(chosen.goal),worker.id))return !!claim;
    if(claim&&!same(claim.goal,chosen.goal))this.system.reservations.release(this.key(claim.goal),worker.id);
    this.claims.set(worker.id,{...chosen,until:null});worker.path=route.path;
    // A short step between waiting spots does not wear a path (PathWearSystem.enter); a longer walk to the Castle does.
    worker.idleStep=route.path.length<=RULES.idleStepTiles?route.path:null;
    message(chosen.kind==='castle'?'Waiting near Castle':chosen.kind==='workplace'?'Waiting near workplace':worker.profession==='idle'?'Unemployed':'Waiting for transport');return true;
  }
}
