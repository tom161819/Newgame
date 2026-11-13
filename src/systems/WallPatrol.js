import { buildingIsComplete,towerTop,buildingDepth } from '../game/buildings.js';
import { wallIndex,isWallAccess } from '../game/walls.js';
import { tileKey } from '../game/stones.js';
import { tileCenter,gridToWorld } from '../game/isometric.js';
import { towerNeighbors } from '../game/buildings.js';
import { t } from '../i18n/index.js';

// m-hlidka-hradby (owner, 12 Nov): "Patrol – walls". A soldier climbs to the wall walk at a wall touching a Tower or a
// Gate, walks the finished walls from stop to stop (walls beside Towers and Gates) and waits 5–15 s at each, looking
// out (+3 sight; an Archer +2 range). Several soldiers spread over the stops. Only soldiers walk on walls.
export const WALL_PATROL=Object.freeze({pause:Object.freeze([5000,15000]),sight:3,archerRange:2,retry:2000});

export const wallStops=(buildings,walls=wallIndex(buildings))=>[...walls.values()].filter(w=>isWallAccess(w,buildings));
export const canPatrolWalls=buildings=>wallStops(buildings).length>0;
// Walls reachable from `start` over joined wall tiles, as a path of tiles to `goal` (breadth first).
export function wallRoute(walls,start,goal){
  const key=tileKey,prev=new Map([[key(start),null]]),queue=[start];
  while(queue.length){const at=queue.shift();if(key(at)===key(goal))break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:at.x+dx,y:at.y+dy},k=key(n);if(!walls.has(k)||prev.has(k))continue;prev.set(k,at);queue.push(n);}}
  if(!prev.has(key(goal)))return null;const path=[];for(let at=goal;at&&key(at)!==key(start);at=prev.get(key(at)))path.unshift({x:at.x,y:at.y});return path;
}
export class WallPatrol {
  constructor(scene){this.scene=scene;}
  walls(){return wallIndex(this.scene.buildings);}
  // Start or stop the order for a soldier.
  set(worker,on){
    if(on){worker.wallPatrol={phase:'toWall'};return true;}
    if(worker.wallPatrol?.onWall)this.leave(worker);delete worker.wallPatrol;return true;
  }
  leave(worker){const p=worker.wallPatrol,ground=p?.ground??worker.wallGround??worker.tile;delete worker.wallGround;worker.onWall=null;worker.path=[];worker.nextTile=null;worker.tile={...ground};worker.position={x:ground.x+.5,y:ground.y+.5};if(p){p.onWall=false;p.phase='toWall';}}
  update(worker,delta){
    const s=this.scene,p=worker.wallPatrol,walls=this.walls(),stops=wallStops(s.buildings,walls);p.lastTick=s.gameTime?.totalElapsed??0;
    if(!stops.length){if(p.onWall)this.leave(worker);worker.workState='Waiting';worker.workMessage=t('army.wallsNone');return false;}
    worker.workState='Patrolling';worker.workMessage=t('army.order.wallsActive');
    if(!p.onWall){
      // Walk to the ground beside the nearest stop, then climb.
      const near=[...stops].sort((a,b)=>Math.hypot(a.x-worker.tile.x,a.y-worker.tile.y)-Math.hypot(b.x-worker.tile.x,b.y-worker.tile.y));
      for(const stop of near.slice(0,4)){const goals=towerNeighbors(stop).filter(g=>s.map[g.y]?.[g.x]===0);
        if(goals.some(g=>g.x===worker.tile.x&&g.y===worker.tile.y)&&!worker.nextTile){p.onWall=true;p.ground={...worker.tile};worker.wallGround={...worker.tile};p.at={x:stop.x,y:stop.y};worker.onWall=stop;worker.path=[];worker.tile={x:stop.x,y:stop.y};worker.position={x:stop.x+.5,y:stop.y+.5};p.phase='pause';p.until=(s.gameTime?.totalElapsed??0)+WALL_PATROL.pause[0];return true;}
        if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=WALL_PATROL.retry;if(worker.moveTo(goals))return true;}else if(worker.path.length||worker.nextTile)return true;}
      return true;
    }
    worker.onWall=walls.get(tileKey(worker.nextTile??worker.tile))??worker.onWall;
    if(worker.nextTile||worker.path.length)return true;
    const now=s.gameTime?.totalElapsed??0;
    if(p.phase==='pause'&&now<p.until)return true;
    // Next stop: the one fewest other wall soldiers head for, then the farthest along the walk (spread out).
    const others=s.workerSystem.liveWorkers().filter(w=>w!==worker&&w.wallPatrol?.target).map(w=>tileKey(w.wallPatrol.target));
    const here=worker.tile,options=stops.filter(st=>tileKey(st)!==tileKey(here)).map(st=>({st,route:wallRoute(walls,here,st)})).filter(o=>o.route);
    if(!options.length){p.phase='pause';p.until=now+WALL_PATROL.pause[1];return true;}
    options.sort((a,b)=>others.filter(k=>k===tileKey(a.st)).length-others.filter(k=>k===tileKey(b.st)).length||b.route.length-a.route.length);
    const pick=options[Math.floor((s.nightThreats?.random??Math.random)()*Math.min(2,options.length))]??options[0];
    p.target={x:pick.st.x,y:pick.st.y};worker.path=pick.route;p.phase='walk';
    const [a,b]=WALL_PATROL.pause;p.until=now+pick.route.length*700+a+Math.random()*(b-a);p.phase='pause';return true;
  }
  // Where a soldier on a wall is drawn: on top of the wall under him.
  place(worker){
    const wall=worker.onWall;if(!wall)return false;const point=gridToWorld(worker.position.x,worker.position.y),center=tileCenter(wall),top=towerTop(wall);
    worker.view.setPosition(point.x+top.x-center.x,point.y+top.y-center.y).setDepth(buildingDepth(wall)+point.y-center.y+.2);return true;
  }
}
