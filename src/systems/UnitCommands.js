import { findPathToAny,canStep } from '../game/pathfinding.js';
import { knownMap } from '../game/knownMap.js';
import { tileKey } from '../game/stones.js';
import { t } from '../i18n/index.js';
import { formationTiles,assignFormation } from '../game/formations.js';
import { directionName } from '../game/directions.js';

const FACE_VECTORS=Object.freeze(Object.fromEntries(['E','SE','S','SW','W','NW','N','NE'].map((name,i)=>[name,{x:Math.cos(i*Math.PI/4),y:Math.sin(i*Math.PI/4)}])));
const LANE_STEP=4,LANE_MAX=5,LANE_SPREAD=1.6;
export const workingCommand=()=>({state:'Working',goal:null});
export const commanded=worker=>worker.commandState?.state==='MovingToHold'||worker.commandState?.state==='Holding';

// Owns only manual orders. Work, cargo, workplaces and reservations retain their
// existing owners; cancellation uses the same transaction paths as job changes.
export class UnitCommands {
  constructor(system){this.system=system;this.scene=system.scene;}
  owns(worker){return !!worker?.isAlive&&worker.isSubject!==false&&this.system.workers.get(worker.id)===worker&&!worker.leaving;}
  selectable(worker){return this.owns(worker)&&worker.sleepingIn==null&&this.scene.fog.isVisibleObject(worker);}
  interrupt(worker){
    this.system.ai.cancel(worker);worker.manualRockId=null;worker.arriving=false;worker.commandRetry=0;worker.commandWait=0;
    // Complete the already reserved half-step; never snap a moving cargo owner.
    worker.path=[];worker.workplaceReached=false;
  }
  hold(worker){
    if(!this.owns(worker))return false;this.interrupt(worker);
    worker.commandState={state:'Holding',goal:null};worker.workState='Holding';worker.workMessage='';return true;
  }
  resume(worker){
    if(!this.owns(worker))return false;this.system.gather?.release(worker);worker.path=[];worker.commandState=workingCommand();worker.commandRetry=0;worker.commandWait=0;
    worker.workplaceReached=false;worker.aiCooldown=0;worker.workState=worker.profession==='idle'?'Idle':'Searching for Work';worker.workMessage='';this.scene.employment?.request();return true;
  }
  navigation(worker,base=knownMap(this.scene),departing=new Set()){
    const map=base.map(row=>[...row]);
    const units=[this.scene.character,...(this.scene.animalSystem?.animals.values()??[]),...this.system.liveWorkers()];
    for(const unit of units)if(unit!==worker&&!departing.has(unit.id)&&unit.isAlive&&!unit.mounted&&this.scene.fog.isVisibleObject(unit))for(const tile of unit.reservedTiles())if(map[tile.y]?.[tile.x]!==undefined)map[tile.y][tile.x]=1;
    const start=worker.nextTile??worker.tile;map[start.y][start.x]=0;return map;
  }
  // options.formation (formations.js) and options.facing (a tile vector) put the men on the formation's places, turned
  // to the facing; without them (or 'loose') they keep their place in the group as before.
  move(workers,target,options={}){
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
    // Owner 16 Nov 2026: a group keeps together – each keeps his place in the group (offsets from its middle, squeezed
    // to two tiles), and they all walk at the pace of the slowest.
    const mid={x:selected.reduce((n,w)=>n+w.tile.x,0)/Math.max(1,selected.length),y:selected.reduce((n,w)=>n+w.tile.y,0)/Math.max(1,selected.length)};
    const spread=Math.max(1,...selected.map(w=>Math.max(Math.abs(w.tile.x-mid.x),Math.abs(w.tile.y-mid.y)))),squeeze=Math.min(1,2/spread);
    const dir=(()=>{const dx=target.x-mid.x,dy=target.y-mid.y,n=Math.hypot(dx,dy);return n?{x:dx/n,y:dy/n}:{x:0,y:0};})();
    const pace=Math.min(...selected.map(w=>(w.speed??1)*(w.speedFactor??1)));
    // The leader route: from the walkable tile nearest the group's middle to the click.
    const facing=options.facing&&Math.hypot(options.facing.x,options.facing.y)>0?options.facing:(dir.x||dir.y?dir:{x:1,y:0});
    const places=options.formation&&options.formation!=='loose'&&selected.length>1?assignFormation(selected,formationTiles(options.formation,selected.length,target,facing,(x,y)=>base[y]?.[x]===0&&!used.has(`${x},${y}`)),facing):null;
    const face=options.facing||places?directionName(facing):null;
    let lead=null;if(selected.length>2){const m={x:Math.round(mid.x),y:Math.round(mid.y)},from=selected.map(w=>w.tile).sort((a,b)=>Math.hypot(a.x-m.x,a.y-m.y)-Math.hypot(b.x-m.x,b.y-m.y))[0];lead=findPathToAny(base,from,[target])?.path??null;if(lead&&lead.length<8)lead=null;}
    for(const worker of selected){
      const nav=this.navigation(worker,base,selectedIds),start=worker.nextTile??worker.tile;
      // Combat 16 Nov 2026: archers stay two tiles behind the group, armoured melee one tile ahead of it.
      const along=worker.attackRange>1?-2:(worker.armor??0)>0?1:0;
      const want={x:target.x+(worker.tile.x-mid.x)*squeeze+dir.x*along,y:target.y+(worker.tile.y-mid.y)*squeeze+dir.y*along};
      const place=places?.get(worker),order=place?[place,...[...slots].sort((a,b)=>Math.hypot(a.x-place.x,a.y-place.y)-Math.hypot(b.x-place.x,b.y-place.y))]:selected.length>1?[...slots].sort((a,b)=>Math.hypot(a.x-want.x,a.y-want.y)-Math.hypot(b.x-want.x,b.y-want.y)):slots;
      let route,goal;
      for(const slot of order){if(used.has(tileKey(slot))||nav[slot.y][slot.x]!==0)continue;route=findPathToAny(nav,start,[slot]);if(route){goal=slot;break;}}
      worker.groupPace=selected.length>1&&worker.speed>0?Math.min(1,pace/((worker.speed??1)*(worker.speedFactor??1))):1;
      if(!route)continue;
      // Owner 16 Nov 2026: not one long file – a group marches in lanes beside each other along one leader route,
      // each lane shifted by the soldier's place in the formation (its slot's offset from the click).
      if(lead&&selected.length>2){const lanes=this.laneRoute(nav,start,lead,{x:goal.x-target.x,y:goal.y-target.y},goal);if(lanes)route=lanes;}
      this.interrupt(worker);worker.commandState={state:'MovingToHold',goal:{x:goal.x,y:goal.y}};worker.holdFace=face;worker.path=route.path;worker.workState='MovingToHold';used.add(tileKey(goal));accepted++;
    }
    return accepted;
  }
  // Waypoints every few tiles of the leader route shifted by the lane offset (snapped to a walkable tile), joined by
  // short searches. null when a piece cannot be found (the plain route is used then).
  laneRoute(nav,start,lead,offset,goal){
    const lane={x:Math.max(-LANE_MAX,Math.min(LANE_MAX,Math.round(offset.x*LANE_SPREAD))),y:Math.max(-LANE_MAX,Math.min(LANE_MAX,Math.round(offset.y*LANE_SPREAD)))},points=[];
    for(let i=LANE_STEP;i<lead.length-LANE_STEP;i+=LANE_STEP){const p={x:lead[i].x+lane.x,y:lead[i].y+lane.y},q=this.nearestOpen(nav,p);if(q)points.push(q);}
    points.push(goal);const path=[];let at=start;
    for(const point of points){if(point.x===at.x&&point.y===at.y)continue;const piece=findPathToAny(nav,at,[point]);if(!piece)return null;path.push(...piece.path);at=point;if(path.length>lead.length*2+40)return null;}
    return path.length?{path}:null;
  }
  nearestOpen(nav,p){for(let r=0;r<=2;r++)for(let y=p.y-r;y<=p.y+r;y++)for(let x=p.x-r;x<=p.x+r;x++)if(Math.max(Math.abs(x-p.x),Math.abs(y-p.y))===r&&nav[y]?.[x]===0)return {x,y};return null;}
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
      if(tileKey(worker.tile)===tileKey(command.goal)){command.state='Holding';worker.workState='Holding';// The facing of a formation is a look, not saved state (the save keeps goal and state only).
        if(worker.holdFace&&worker.view){const v=FACE_VECTORS[worker.holdFace];if(v)worker.direction={...v};worker.view.facing=worker.holdFace;worker.view.paint?.();worker.view.applyArt?.();}}
      else if(!worker.commandWait){
        // Bound replans when a newly discovered wall or another unit blocks us.
        if((worker.commandRetry??0)>=5){this.hold(worker);this.scene.setStatus(t('command.blocked'));}
        else{worker.commandRetry=(worker.commandRetry??0)+1;worker.commandWait=1000;const route=findPathToAny(this.navigation(worker),worker.tile,[command.goal]);if(route)worker.path=route.path;}
      }
    }
    const before=tileKey(worker.tile);worker.update(delta);if(before!==tileKey(worker.tile))worker.commandRetry=0;return true;
  }
}
