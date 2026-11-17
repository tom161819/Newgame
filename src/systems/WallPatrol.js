import { buildingIsComplete,towerTop,buildingDepth } from '../game/buildings.js';
import { wallIndex,isWallAccess,isWall } from '../game/walls.js';
import { tileKey } from '../game/stones.js';
import { tileCenter,gridToWorld } from '../game/isometric.js';
import { elevatedIndex,elevatedRoute,entrances,planAscent,planDescent,platformTiles,platformCenter } from '../game/wallNetwork.js';
import { t } from '../i18n/index.js';
import { WALL_ARCHER_RANGE } from './CombatSystem.js';

// m-hlidka-hradby (owner, 12 Nov): "Patrol – walls". A soldier climbs to the wall walk at a wall touching a Tower or a
// Gate, walks the finished walls from stop to stop (walls beside Towers and Gates) and waits 5–15 s at each, looking
// out (+3 sight; an Archer +2 range). Several soldiers spread over the stops. Only soldiers walk on walls.
export const WALL_PATROL=Object.freeze({pause:Object.freeze([5000,15000]),sight:3,archerRange:WALL_ARCHER_RANGE,retry:2000});

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
  map(worker){return this.scene.workerSystem?.navigationMap?.(worker)??this.scene.map;}
  // Start or stop the order for a soldier. Stopping brings one up there down by walking to the nearest way down.
  set(worker,on){
    if(on){delete worker.wallDescent?.then;worker.wallPatrol={phase:'toWall',...(on.x!==undefined?{post:{x:on.x,y:on.y,...(on.tower?{tower:on.tower,...(on.slot?{slot:on.slot}:{})}:{})}}:{})};if(worker.onWall){worker.wallPatrol.onWall=true;if(worker.wallDescent){worker.path=[];delete worker.wallDescent;}}return true;}
    delete worker.wallPatrol;if(worker.onWall&&!worker.wallDescent)this.descend(worker);return true;
  }
  // Sends soldiers to a wall piece, Tower or Gate; returns how many got a post.
  post(workers,target){
    const soldiers=workers.filter(w=>w.profession==='soldier'&&w.isAlive),taken=new Set((this.scene.workerSystem?.liveWorkers?.()??[]).filter(w=>!soldiers.includes(w)&&w.wallPatrol?.post?.tower===target.id).map(w=>w.wallPatrol.post.slot??0)),tiles=postTiles(this.scene.buildings,target,soldiers.length,taken);
    soldiers.slice(0,tiles.length).forEach((w,i)=>{delete w.huntWolfId;this.scene.workerSystem.commands?.resume?.(w);this.set(w,tiles[i]);});return Math.min(soldiers.length,tiles.length);
  }
  // At once on the ground (death, rest, a job): at the nearest way down, else where he climbed.
  leave(worker){
    const p=worker.wallPatrol,down=worker.wallDescent?.ground??(worker.onWall?planDescent(this.scene.map,this.scene.buildings,worker.nextTile??worker.tile)?.ground:null),ground=down??p?.ground??worker.wallGround??worker.tile;
    delete worker.wallGround;delete worker.wallDescent;worker.onWall=null;worker.path=[];worker.nextTile=null;worker.tile={...ground};worker.position={x:ground.x+.5,y:ground.y+.5};if(p){p.onWall=false;p.phase='toWall';delete p.climb;}
  }
  // Walks to the nearest way down (Tower door, Gate passage); `then` is the ground route after it.
  descend(worker,then=null,near=null){
    const plan=planDescent(this.scene.map,this.scene.buildings,worker.nextTile??worker.tile,undefined,near);if(!plan){this.leave(worker);if(then)worker.path=then;return null;}
    worker.wallDescent={ground:plan.ground,...(then?{then}:{})};const route=worker.nextTile?plan.route.slice(1):plan.route;worker.path=route;
    if(!worker.nextTile&&!worker.path.length)this.land(worker);return plan;
  }
  // At the foot of the way down: steps onto the ground and goes on with the route he got meanwhile.
  land(worker){
    const d=worker.wallDescent;if(!d)return;const g=d.ground;delete worker.wallDescent;delete worker.wallGround;worker.onWall=null;worker.nextTile=null;worker.tile={...g};worker.position={x:g.x+.5,y:g.y+.5};worker.path=d.then??[];
    const p=worker.wallPatrol;if(p){p.onWall=false;p.phase='toWall';delete p.climb;delete p.ground;}
  }
  climb(worker,way){
    const p=worker.wallPatrol;p.onWall=true;p.ground={...worker.tile};worker.wallGround={...worker.tile};worker.onWall=way.platform;worker.path=[];worker.tile={...way.top};worker.position={x:way.top.x+.5,y:way.top.y+.5};p.phase='walk';delete p.climb;
  }
  // Where the order leads: the post's tiles (a platform's tiles), else the patrol stops.
  targets(p,index){
    const s=this.scene;
    if(p.post?.tower){const t=s.buildings.find(b=>b.id===p.post.tower&&buildingIsComplete(b));if(!t){delete p.post;return this.targets(p,index);}return platformTiles(t);}
    if(p.post){if(!index.has(tileKey(p.post))){delete p.post;return this.targets(p,index);}return [{x:p.post.x,y:p.post.y}];}
    return wallStops(s.buildings).map(w=>({x:w.x,y:w.y}));
  }
  update(worker,delta){
    const s=this.scene,p=worker.wallPatrol;p.lastTick=s.gameTime?.totalElapsed??0;
    if(worker.wallDescent)return true;
    const index=elevatedIndex(s.buildings),targets=this.targets(p,index);
    if(!targets.length){if(worker.onWall)this.descend(worker);worker.workState='Waiting';worker.workMessage=t('army.wallsNone');return !!worker.onWall;}
    worker.workState='Patrolling';worker.workMessage=t(p.post?'army.order.postActive':'army.order.wallsActive');
    if(!worker.onWall&&p.noWay){worker.workState='Waiting';worker.workMessage=t(p.post?'army.postNoWay':'army.wallsNone');}
    if(!worker.onWall){
      // Owner 17 Nov 2026: up only at a Tower door or in a Gate passage, the one with the shortest walk to the goal.
      if(p.climb&&tileKey(worker.tile)===tileKey(p.climb.ground)&&!worker.nextTile){const way=entrances(s.buildings,s.map).find(e=>e.platform.id===p.climb.platform&&tileKey(e.ground)===tileKey(p.climb.ground));if(way){this.climb(worker,way);return true;}delete p.climb;}
      if(worker.nextTile||worker.path.length)return true;
      if((worker.aiCooldown??0)>0)return true;worker.aiCooldown=WALL_PATROL.retry;
      const way=planAscent(this.map(worker),s.buildings,worker.tile,targets,index);
      if(!way){delete p.climb;p.noWay=true;worker.workState='Waiting';worker.workMessage=t(p.post?'army.postNoWay':'army.wallsNone');return true;}
      delete p.noWay;p.climb={platform:way.platform.id,ground:{...way.ground}};
      if(tileKey(worker.tile)===tileKey(way.ground)){this.climb(worker,way);return true;}
      if(!worker.moveTo([way.ground]))delete p.climb;return true;
    }
    worker.onWall=index.get(tileKey(worker.nextTile??worker.tile))??worker.onWall;
    if(worker.nextTile||worker.path.length)return true;
    const now=s.gameTime?.totalElapsed??0;
    if(p.post){
      if(targets.some(g=>tileKey(g)===tileKey(worker.tile))){
        if(p.post.tower&&p.phase!=='post'){const tower=s.buildings.find(b=>b.id===p.post.tower),c=platformCenter(tower),o=PLATFORM_SLOTS[p.post.slot??0]??PLATFORM_SLOTS[0];worker.onWall=tower;worker.position={x:c.x+o.x,y:c.y+o.y};}
        p.phase='post';return true;}
      const route=elevatedRoute(index,worker.tile,targets);if(route){p.target={x:p.post.x,y:p.post.y};worker.path=route;p.phase='walk';}else this.descend(worker);return true;
    }
    if(p.phase==='pause'&&now<p.until)return true;
    // Next stop: the one fewest other wall soldiers head for, then the farthest along the walk (spread out).
    const others=s.workerSystem.liveWorkers().filter(w=>w!==worker&&w.wallPatrol?.target).map(w=>tileKey(w.wallPatrol.target));
    const here=worker.tile,options=targets.filter(st=>tileKey(st)!==tileKey(here)).map(st=>({st,route:elevatedRoute(index,here,[st])})).filter(o=>o.route);
    if(!options.length){p.phase='pause';p.until=now+WALL_PATROL.pause[1];return true;}
    options.sort((a,b)=>others.filter(k=>k===tileKey(a.st)).length-others.filter(k=>k===tileKey(b.st)).length||b.route.length-a.route.length);
    const pick=options[Math.floor((s.nightThreats?.random??Math.random)()*Math.min(2,options.length))]??options[0];
    p.target={x:pick.st.x,y:pick.st.y};worker.path=pick.route;
    const [a,b]=WALL_PATROL.pause;p.until=now+pick.route.length*700+a+Math.random()*(b-a);p.phase='pause';return true;
  }
  // Owner 17 Nov 2026: where the post of a selected soldier is drawn (a ring up on the wall, Tower or Gate, like the
  // goal ring on the ground), in world space; null without a post.
  postPoint(worker){
    const post=worker.wallPatrol?.post;if(!post)return null;const s=this.scene;
    const building=post.tower?s.buildings.find(b=>b.id===post.tower):wallIndex(s.buildings).get(tileKey(post));if(!building)return null;
    let at={x:post.x+.5,y:post.y+.5};if(post.tower){const c=platformCenter(building),o=PLATFORM_SLOTS[post.slot??0]??PLATFORM_SLOTS[0];at={x:c.x+o.x,y:c.y+o.y};}
    const point=gridToWorld(at.x,at.y),center=tileCenter(building),top=towerTop(building);return {x:point.x+top.x-center.x,y:point.y+top.y-center.y};
  }
  // Where a soldier on a wall is drawn: on top of the wall under him.
  place(worker){
    const wall=worker.onWall;if(!wall)return false;const point=gridToWorld(worker.position.x,worker.position.y),center=tileCenter(wall),top=towerTop(wall);
    worker.view.setPosition(point.x+top.x-center.x,point.y+top.y-center.y).setDepth(buildingDepth(wall)+point.y-center.y+.2);return true;
  }
}
