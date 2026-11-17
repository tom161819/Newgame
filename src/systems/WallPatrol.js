import { buildingIsComplete,towerTop,buildingDepth,buildingDefinition } from '../game/buildings.js';
import { wallIndex,isWallAccess,isWall } from '../game/walls.js';
import { tileKey } from '../game/stones.js';
import { tileCenter,gridToWorld } from '../game/isometric.js';
import { towerNeighbors } from '../game/buildings.js';
import { t } from '../i18n/index.js';

// m-hlidka-hradby (owner, 12 Nov): "Patrol – walls". A soldier climbs to the wall walk at a wall touching a Tower or a
// Gate, walks the finished walls from stop to stop (walls beside Towers and Gates) and waits 5–15 s at each, looking
// out (+3 sight; an Archer +2 range). Several soldiers spread over the stops. Only soldiers walk on walls.
export const WALL_PATROL=Object.freeze({pause:Object.freeze([5000,15000]),sight:3,archerRange:2,retry:2000});

// Where the men stand on a platform, in tiles from its middle.
export const PLATFORM_SLOTS=Object.freeze([{x:0,y:0},{x:-.32,y:.32},{x:.32,y:-.32},{x:.3,y:.3}]);
export const wallStops=(buildings,walls=wallIndex(buildings))=>[...walls.values()].filter(w=>isWallAccess(w,buildings));
export const canPatrolWalls=buildings=>wallStops(buildings).length>0;
// Walls reachable from `start` over joined wall tiles, as a path of tiles to `goal` (breadth first).
export function wallRoute(walls,start,goal){
  const key=tileKey,prev=new Map([[key(start),null]]),queue=[start];
  while(queue.length){const at=queue.shift();if(key(at)===key(goal))break;
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:at.x+dx,y:at.y+dy},k=key(n);if(!walls.has(k)||prev.has(k))continue;prev.set(k,at);queue.push(n);}}
  if(!prev.has(key(goal)))return null;const path=[];for(let at=goal;at&&key(at)!==key(start);at=prev.get(key(at)))path.unshift({x:at.x,y:at.y});return path;
}
// m-vojaci-na-hradby (owner 14 Nov 2026, point 36): a post. Selected soldiers sent (right click) to a Stone Wall, a
// Tower or a Gate climb up and stand there until another order: on the wall piece itself (several soldiers take the
// pieces next to it), on the Tower's platform, or on the walls beside the Gate.
export function postTiles(buildings,target,count,takenSlots=new Set()){
  const walls=wallIndex(buildings),out=[];
  // Owner 15 Nov 2026 (65): a Gate has a platform too (like a Tower), so soldiers can stand on it.
  // Owner 17 Nov 2026: up to four men stand on a platform (the others take the walls beside it).
  if(['tower','gate','wall_gate'].includes(target.type)&&buildingIsComplete(target))for(let slot=0;slot<PLATFORM_SLOTS.length&&out.length<count;slot++)if(!takenSlots.has(slot))out.push({x:target.x,y:target.y,tower:target.id,slot});
  const starts=isWall(target)?[target]:[...walls.values()].filter(w=>target.tiles?.some(t=>Math.abs(t.x-w.x)+Math.abs(t.y-w.y)===1));
  const seen=new Set(),queue=[];for(const w of starts)if(walls.has(tileKey(w))&&!seen.has(tileKey(w))){seen.add(tileKey(w));queue.push(w);}
  for(let i=0;i<queue.length&&out.length<count;i++){const at=queue[i];out.push({x:at.x,y:at.y});
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n=walls.get(tileKey({x:at.x+dx,y:at.y+dy}));if(n&&!seen.has(tileKey(n))){seen.add(tileKey(n));queue.push(n);}}}
  return out.slice(0,count);
}
export class WallPatrol {
  constructor(scene){this.scene=scene;}
  walls(){return wallIndex(this.scene.buildings);}
  // Start or stop the order for a soldier.
  set(worker,on){
    if(on){if(worker.wallPatrol?.onWall)this.leave(worker);worker.wallPatrol={phase:'toWall',...(on.x!==undefined?{post:{x:on.x,y:on.y,...(on.tower?{tower:on.tower,...(on.slot?{slot:on.slot}:{})}:{})}}:{})};return true;}
    if(worker.wallPatrol?.onWall)this.leave(worker);delete worker.wallPatrol;return true;
  }
  // Sends soldiers to a wall piece, Tower or Gate; returns how many got a post.
  post(workers,target){
    const soldiers=workers.filter(w=>w.profession==='soldier'&&w.isAlive),taken=new Set((this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>!soldiers.includes(w)&&w.wallPatrol?.post?.tower===target.id).map(w=>w.wallPatrol.post.slot??0)),tiles=postTiles(this.scene.buildings,target,soldiers.length,taken);
    soldiers.slice(0,tiles.length).forEach((w,i)=>{delete w.huntWolfId;this.scene.workerSystem.commands?.resume?.(w);this.set(w,tiles[i]);});return Math.min(soldiers.length,tiles.length);
  }
  leave(worker){const p=worker.wallPatrol,ground=p?.ground??worker.wallGround??worker.tile;delete worker.wallGround;worker.onWall=null;worker.path=[];worker.nextTile=null;worker.tile={...ground};worker.position={x:ground.x+.5,y:ground.y+.5};if(p){p.onWall=false;p.phase='toWall';}}
  update(worker,delta){
    const s=this.scene,p=worker.wallPatrol,walls=this.walls(),stops=wallStops(s.buildings,walls);p.lastTick=s.gameTime?.totalElapsed??0;
    if(p.post?.tower){
      // On a Tower: walk to its foot, climb, stand on the platform.
      const tower=s.buildings.find(b=>b.id===p.post.tower&&buildingIsComplete(b));if(!tower){if(p.onWall)this.leave(worker);delete p.post;return true;}
      worker.workState='Patrolling';worker.workMessage=t('army.order.postActive');if(p.onWall)return true;
      const goals=towerNeighbors(tower).filter(g=>s.map[g.y]?.[g.x]===0);
      if(goals.some(g=>g.x===worker.tile.x&&g.y===worker.tile.y)&&!worker.nextTile){const d=buildingDefinition(tower);p.onWall=true;p.ground={...worker.tile};worker.wallGround={...worker.tile};worker.onWall=tower;worker.path=[];worker.tile={x:tower.x,y:tower.y};const o=PLATFORM_SLOTS[p.post.slot??0]??PLATFORM_SLOTS[0];worker.position={x:tower.x+d.width/2+o.x,y:tower.y+d.height/2+o.y};p.phase='post';return true;}
      if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=WALL_PATROL.retry;worker.moveTo(goals);}return true;
    }
    if(p.post&&!walls.has(tileKey(p.post)))delete p.post;
    if(!stops.length&&!(p.post&&walls.has(tileKey(p.post)))){if(p.onWall)this.leave(worker);worker.workState='Waiting';worker.workMessage=t('army.wallsNone');return false;}
    worker.workState='Patrolling';worker.workMessage=t(p.post?'army.order.postActive':'army.order.wallsActive');
    if(!p.onWall){
      // Walk to the ground beside the nearest stop, then climb.
      // With a post: only stops joined to it over the wall walk, the nearest to the post first.
      // Owner 15 Nov 2026 (65): a soldier sent to a wall piece may also climb at that piece itself (the King still needs a Tower or a Gate).
      const own=p.post?walls.get(tileKey(p.post)):null,usable=p.post?[...stops.filter(st=>tileKey(st)===tileKey(p.post)||wallRoute(walls,st,p.post)),...(own&&!stops.includes(own)?[own]:[])]:stops,from=p.post??worker.tile;
      if(p.post&&!usable.length){worker.workState='Waiting';worker.workMessage=t('army.postNoWay');return true;}
      const near=[...usable].sort((a,b)=>Math.hypot(a.x-from.x,a.y-from.y)-Math.hypot(b.x-from.x,b.y-from.y));
      for(const stop of near.slice(0,4)){const goals=towerNeighbors(stop).filter(g=>s.map[g.y]?.[g.x]===0);
        if(goals.some(g=>g.x===worker.tile.x&&g.y===worker.tile.y)&&!worker.nextTile){p.onWall=true;p.ground={...worker.tile};worker.wallGround={...worker.tile};p.at={x:stop.x,y:stop.y};worker.onWall=stop;worker.path=[];worker.tile={x:stop.x,y:stop.y};worker.position={x:stop.x+.5,y:stop.y+.5};p.phase='pause';p.until=(s.gameTime?.totalElapsed??0)+WALL_PATROL.pause[0];return true;}
        if(!worker.nextTile&&!worker.path.length&&(worker.aiCooldown??0)<=0){worker.aiCooldown=WALL_PATROL.retry;if(worker.moveTo(goals))return true;}else if(worker.path.length||worker.nextTile)return true;}
      return true;
    }
    worker.onWall=walls.get(tileKey(worker.nextTile??worker.tile))??worker.onWall;
    if(worker.nextTile||worker.path.length)return true;
    const now=s.gameTime?.totalElapsed??0;
    if(p.post){if(tileKey(worker.tile)===tileKey(p.post)){p.phase='post';return true;}const route=wallRoute(walls,worker.tile,p.post);if(route){p.target={x:p.post.x,y:p.post.y};worker.path=route;p.phase='walk';}else this.leave(worker);return true;}
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
