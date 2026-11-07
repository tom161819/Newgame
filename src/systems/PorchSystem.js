import { PORCH_ART,PORCH_RULES,porchId,porchVariant } from '../data/porches.js';
import { buildingDefinition,buildingIsComplete } from '../game/buildings.js';
import { gridToWorld } from '../game/isometric.js';
import { tileKey } from '../game/stones.js';

// #98 Idle workers sit on a porch in front of their workplace. The owner chose (a): the porch is a separate object on
// two free tiles right in front of the building (the building keeps its footprint). A porch is a 2×1 strip: along the
// building's front-left side (a row below it) or, mirrored, along the front-right side (a column beside it); the back
// sides are the fallback. Porch tiles stay walkable and are not saved: the porches follow from the completed
// workplaces and move (or disappear) when a tile is no longer free, e.g. when something is built there.
// A worker of that workplace who is Waiting (nothing to do: no input, storage full, no target) with no task, cargo or
// route walks to a free seat and sits; any work, rest, order or move gets him up again. Seat positions come from the
// Studio art (`seats`). More idle workers than seats stand beside the porch as before.
export class PorchSystem {
  constructor(scene){this.scene=scene;this.porches=new Map();this.views=new Map();this.seats=new Map();this.checkIn=0;}
  registry(){return this.scene.objectRegistry;}
  workplaces(){return (this.scene.buildings??[]).filter(b=>buildingIsComplete(b)&&buildingDefinition(b).workplace&&porchVariant(b.type));}
  free(tile,taken){
    const s=this.scene,key=tileKey(tile);
    if(s.map[tile.y]?.[tile.x]!==0||s.resourceOccupancy?.has(key)||taken.has(key))return false;
    return !(s.buildings??[]).some(b=>b.tiles?.some(t=>t.x===tile.x&&t.y===tile.y));
  }
  // Candidate strips in order: front-left row, front-right column (mirrored), back-left column, back-right row.
  candidates(b){
    const d=buildingDefinition(b),w=d.width,h=d.height,out=[];
    const mid=(from,len)=>Array.from({length:Math.max(0,len-1)},(_,i)=>from+i).sort((a,c)=>Math.abs(a-(from+(len-2)/2))-Math.abs(c-(from+(len-2)/2)));
    for(const x of mid(b.x,w))out.push({x,y:b.y+h,flip:false});
    for(const y of mid(b.y,h))out.push({x:b.x+w,y,flip:true});
    for(const y of mid(b.y,h))out.push({x:b.x-1,y,flip:true});
    for(const x of mid(b.x,w))out.push({x,y:b.y-1,flip:false});
    return out;
  }
  tiles(p){return p.flip?[{x:p.x,y:p.y},{x:p.x,y:p.y+1}]:[{x:p.x,y:p.y},{x:p.x+1,y:p.y}];}
  place(b,taken){
    const variant=porchVariant(b.type);
    for(const c of this.candidates(b))if(this.tiles(c).every(t=>this.free(t,taken)))return {buildingId:b.id,variant,x:c.x,y:c.y,flip:c.flip};
    return null;
  }
  valid(p,taken){return this.tiles(p).every(t=>this.free(t,taken));}
  // Centre of the strip and the seats in tile coordinates (floats).
  center(p){return p.flip?{x:p.x+.5,y:p.y+1}:{x:p.x+1,y:p.y+.5};}
  seatPoints(p){const c=this.center(p);return PORCH_ART[p.variant].seats.map(([sx,sz])=>p.flip?{x:c.x+sz,y:c.y+sx}:{x:c.x+sx,y:c.y+sz});}
  // Keeps one porch per completed workplace; a porch whose tiles are taken moves.
  refresh(){
    const keep=new Map(),taken=new Set(),list=this.workplaces();
    for(const b of list){const old=this.porches.get(b.id);if(old&&old.variant===porchVariant(b.type)&&this.valid(old,taken)){keep.set(b.id,old);for(const t of this.tiles(old))taken.add(tileKey(t));}}
    for(const b of list){if(keep.has(b.id))continue;const p=this.place(b,taken);if(p){keep.set(b.id,p);for(const t of this.tiles(p))taken.add(tileKey(t));}}
    for(const [id,p] of this.porches)if(keep.get(id)!==p){this.removeView(id);this.vacate(id);}
    this.porches=keep;for(const [id,p] of keep)if(!this.views.has(id))this.addView(id,p);
  }
  addView(id,p){
    const s=this.scene;if(!s.add||!s.textures)return;const key=s.assets?.key?.(porchId(p.variant));if(!key||!s.textures.exists(key))return;
    const art=PORCH_ART[p.variant],c=this.center(p),w=gridToWorld(c.x,c.y);
    const image=s.add.image(w.x,w.y,key).setOrigin(p.flip?1-art.origin.x:art.origin.x,art.origin.y).setFlipX(p.flip).setDepth(w.y-6);
    this.views.set(id,image);
  }
  removeView(id){this.views.get(id)?.destroy?.();this.views.delete(id);}
  vacate(buildingId){const seats=this.seats.get(buildingId);if(!seats)return;for(const workerId of seats)if(workerId!=null){const w=this.scene.workerSystem?.workers.get(workerId);if(w)this.stand(w);}this.seats.delete(buildingId);}
  porchOf(worker){return worker.assignedWorkplaceId!=null?this.porches.get(worker.assignedWorkplaceId)??null:null;}
  // Nothing to do at the workplace: no task, cargo, route, rest or order.
  idle(worker){
    return worker.isAlive&&worker.workState==='Waiting'&&worker.assignedWorkplaceId!=null&&worker.workplaceReached&&!worker.workTask&&!worker.cargo&&!worker.restPhase
      &&(!worker.commandState||worker.commandState.state==='Working')&&worker.profession!=='soldier'&&!worker.arriving;
  }
  // Called after the worker's AI step.
  check(worker){
    if(!this.idle(worker)){if(worker.porchSeat)this.stand(worker);return;}
    const p=this.porchOf(worker);if(!p){if(worker.porchSeat)this.stand(worker);return;}
    let seat=worker.porchSeat;
    if(!seat||seat.buildingId!==p.buildingId){
      if(seat)this.stand(worker);
      const seats=this.seats.get(p.buildingId)??Array(PORCH_ART[p.variant].seats.length).fill(null);this.seats.set(p.buildingId,seats);
      const index=seats.indexOf(null);if(index<0)return;seats[index]=worker.id;seat=worker.porchSeat={buildingId:p.buildingId,index};
    }
    const point=this.seatPoints(p)[seat.index],tile={x:Math.floor(point.x),y:Math.floor(point.y)};
    if(worker.seated)return;
    if(worker.nextTile||worker.path.length)return;
    // Two seats can share one tile: the worker only has to stand on the seat's tile or next to it (his tile stays his
    // logical place; the figure is drawn on the seat).
    if(Math.max(Math.abs(worker.tile.x-tile.x),Math.abs(worker.tile.y-tile.y))>1){
      const goals=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const t={x:tile.x+dx,y:tile.y+dy};if(this.scene.map[t.y]?.[t.x]===0)goals.push(t);}
      // Prefer tiles next to the building, so the worker still counts as at his workplace (a Farmer waiting at the
      // farmhouse would otherwise walk back and forth).
      const near=new Set((this.scene.workplaceSystem?.goals?.(worker)??[]).map(tileKey)),best=goals.filter(t=>near.has(tileKey(t)));
      if(!worker.moveTo(best.length?best:goals))this.stand(worker);return;
    }
    worker.position={x:point.x,y:point.y};worker.direction={x:1,y:1};worker.seated=true;
  }
  stand(worker){
    const seat=worker.porchSeat;if(seat){const seats=this.seats.get(seat.buildingId);if(seats&&seats[seat.index]===worker.id)seats[seat.index]=null;}
    if(worker.seated&&!worker.nextTile)worker.position={x:worker.tile.x+.5,y:worker.tile.y+.5};
    worker.porchSeat=null;worker.seated=false;
  }
  seatedAt(buildingId){return (this.seats.get(buildingId)??[]).filter(id=>id!=null&&this.scene.workerSystem?.workers.get(id)?.seated).length;}
  update(delta){this.checkIn-=delta;if(this.checkIn>0)return;this.checkIn=PORCH_RULES.checkMs;this.refresh();}
  destroy(){for(const id of [...this.views.keys()])this.removeView(id);this.porches.clear();this.seats.clear();}
}
