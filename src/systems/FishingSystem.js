import { devProduction } from '../data/devBalance.js';
import { t } from '../i18n/index.js';
import { FISHING,stockCapacity,stockFactor,stockState } from '../data/fishing.js';
import { WORK_RULES } from '../data/jobs.js';
import { GROUND,isWaterGround,isRiverGround } from '../data/worldTerrain.js';
import { buildingDefinition,buildingIsComplete,towerNeighbors,buildingTiles } from '../game/buildings.js';

const SIDES=[[1,0],[-1,0],[0,1],[0,-1]];
// Fishing R1: water bodies and their fish stocks, Fishers' trips to the shore and the catch statistics per hut.
// Water bodies come from the ground layer (#100) by flood fill; their ids follow the scan order, so the same map always
// gives the same ids and the stocks can be saved by id.
// m-ulozeni-brod: a ford fishes like shallow water – shared with the save check so both agree.
export function fishingGround(g){return g===GROUND.FORD?GROUND.SHALLOW:g;}
export class FishingSystem {
  constructor(scene){
    this.scene=scene;this.nextCatch=1;this.catches=new Map();this.warned=new Set();
    this.computeBodies();this.stocks=new Map(this.bodies.map(b=>[b.id,b.capacity]));
    this.unsubscribe=scene.gameTime?.onNewDay?.(()=>this.newDay());
  }
  computeBodies(){const water=waterBodies(this.scene.groundGrid);this.width=water.width;this.bodyIds=water.ids;this.bodies=water.bodies;}
  bodyAt(x,y){return x>=0&&y>=0&&x<this.width?this.bodyIds[y*this.width+x]??-1:-1;}
  capacity(id){return this.bodies[id]?.capacity??0;}
  ratio(id){const c=this.capacity(id);return c?(this.stocks.get(id)??0)/c:0;}
  state(id){return stockState(this.ratio(id));}
  // Owner request (7 Nov): the hut may stand anywhere. Its Fishers use the nearest reachable shore tiles – walkable
  // tiles beside water, by walking distance from the hut – with no fixed radius, so a hut far from water simply
  // catches less (longer walks). Distances come from one breadth-first search over the walkable map per hut, cached
  // until the map changes (buildings, cleared resources) or a few game seconds pass.
  shoreKey(){return `${this.scene.naturalResources?.topologyRevision??0}:${this.scene.buildings?.length??0}`;}
  isShore(x,y){
    if(this.scene.map[y]?.[x]!==0)return null;let best=null;
    for(const [dx,dy]of SIDES){let g=this.scene.groundGrid?.[y+dy]?.[x+dx];if(!isRiverGround(g))continue;g=fishingGround(g);if(!best||g===GROUND.DEEP)best={ground:g,body:this.bodyAt(x+dx,y+dy)};}
    return best;
  }
  // Walking distance (tiles, 4-neighbour steps) from the given start tiles to every reachable shore tile, nearest first.
  shoreFrom(starts,skip=null){
    const map=this.scene.map,rows=map.length,cols=map[0]?.length??0,dist=new Int32Array(rows*cols).fill(-1),queue=[],out=[];
    for(const t of starts)if(map[t.y]?.[t.x]===0&&dist[t.y*cols+t.x]<0){dist[t.y*cols+t.x]=0;queue.push(t.x,t.y);}
    for(let i=0;i<queue.length;i+=2){
      const x=queue[i],y=queue[i+1],d=dist[y*cols+x],shore=skip?.(x,y)?null:this.isShore(x,y);if(shore)out.push({tile:{x,y},body:shore.body,depth:shore.ground,distance:d});
      for(const [dx,dy]of SIDES){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows||dist[ny*cols+nx]>=0||map[ny][nx]!==0)continue;dist[ny*cols+nx]=d+1;queue.push(nx,ny);}
    }
    return out;
  }
  spots(hut){
    const key=this.shoreKey(),now=this.scene.gameTime?.totalElapsed??0;this.spotCache??=new Map();const cached=this.spotCache.get(hut.id);
    if(cached&&cached.key===key&&now<cached.until)return cached.spots;
    const d=buildingDefinition(hut),inside=(x,y)=>x>=hut.x&&x<hut.x+d.width&&y>=hut.y&&y<hut.y+d.height,spots=this.shoreFrom(towerNeighbors(hut),inside);
    this.spotCache.set(hut.id,{key,until:now+FISHING.spotCacheMs,spots});return spots;
  }
  // For the placement preview: walking distance from a planned hut to the nearest shore, or null.
  previewDistance(anchor,definition){const tiles=new Set(buildingTiles(anchor,definition).map(t=>`${t.x},${t.y}`)),near=this.shoreFrom(towerNeighbors({...anchor,definition}),(x,y)=>tiles.has(`${x},${y}`));return near.length?near[0].distance+1:null;}
  distance(hut){const first=this.spots(hut)[0];return first?first.distance+1:null;}
  // The water body a hut actually fishes in: the most common one among its nearest shore spots (for the panel).
  hutBody(hut){const counts=new Map();for(const p of this.spots(hut).slice(0,FISHING.nearestSpots))counts.set(p.body,(counts.get(p.body)??0)+1);return [...counts].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0]?.[0]??-1;}
  slot(tile){return `natural-slot:${tile.x},${tile.y}`;}
  wait(worker,message){worker.workState='Waiting';worker.workMessage=message;worker.aiCooldown=WORK_RULES.searchInterval;}
  release(worker){const task=worker.workTask;if(task?.kind!=='fish')return;this.scene.workerSystem.reservations.release(task.reservation,worker.id);}
  modifier(depth){const s=this.scene.seasons;return (FISHING.depth[depth]??1)*(s?FISHING.season[s.season]??1:1)*(s?FISHING.weather[s.weather]??1:1);}
  update(worker,delta){
    if(!Number.isFinite(delta)||delta<=0||this.scene.gameTime.paused||this.scene.gameOver||!worker.isAlive)return;
    const s=this.scene,system=s.workerSystem,home=s.workplaceSystem.building(worker);
    if(!home||!buildingDefinition(home).fishing){this.wait(worker,'Waiting for workplace');return;}
    let task=worker.workTask;
    if(!task){
      if(worker.aiCooldown>0)return;
      // The nearest few free spots on water that is not overfished; the path search then picks the closest of them.
      const all=this.spots(home),open=all.filter(p=>this.ratio(p.body)>=FISHING.stock.overfished&&system.reservations.available(this.slot(p.tile),worker.id)).slice(0,FISHING.nearestSpots);
      if(!open.length){this.wait(worker,all.some(p=>this.ratio(p.body)>=FISHING.stock.overfished)?'No free fishing spot':all.length?'Overfished':'No reachable fishing spot');return;}
      const route=system.ai.route(worker,open.map(p=>p.tile));if(!route){this.wait(worker,'No reachable fishing spot');return;}
      const spot=open.find(p=>p.tile.x===route.destination.x&&p.tile.y===route.destination.y)??open[0],reservation=this.slot(spot.tile);
      if(!system.reservations.reserve(reservation,worker.id))return;
      worker.workTask=task={kind:'fish',targetId:home.id,goal:{...spot.tile},reservation,progressMs:0,caught:0,fraction:0,bodyId:spot.body,depth:spot.depth};
      worker.path=route.path;worker.workState='Traveling to Target';worker.workMessage='Walking to the shore';
    }
    if(task.kind!=='fish')return;
    if(worker.nextTile||worker.path.length)return;
    if(!system.ai.atGoal(worker,task.goal)||s.map[task.goal.y]?.[task.goal.x]!==0){system.ai.cancel(worker);this.wait(worker,'No reachable fishing spot');return;}
    const factor=stockFactor(this.ratio(task.bodyId)),maxTrip=s.gameTime.dayDuration*FISHING.maxTripDays;
    if(factor===0){if(task.caught)this.finish(worker,task);else{system.ai.cancel(worker);this.wait(worker,'Overfished');}return;}
    worker.workState='Working';
    const rate=FISHING.perDay/s.gameTime.dayDuration*this.modifier(task.depth)*factor*(this.ratio(task.bodyId)>=FISHING.stock.full?FISHING.plentiful:1)*s.skillSystem.workEfficiency(worker,'fishing')*(s.workplaceSystem.workFactor?.(worker)??1)*devProduction('fisher');
    task.progressMs=Math.min(maxTrip,task.progressMs+delta);task.fraction+=delta*rate;
    while(task.fraction>=1&&task.caught<FISHING.basket){task.fraction-=1;task.caught++;this.take(task.bodyId,home);s.activities?.emit('fishCaught',{actor:worker,objectType:'fish',quantity:1},`fish:${this.nextCatch++}`);}
    worker.workMessage=`Fishing ${task.caught}/${FISHING.basket}`;
    if(task.caught>=FISHING.basket||task.progressMs>=maxTrip&&task.caught>0)this.finish(worker,task);
    else if(task.progressMs>=maxTrip){system.ai.cancel(worker);this.wait(worker,'No fish biting');}
  }
  // The full basket becomes cargo; the food transport takes it to a Granary on the next frame.
  finish(worker,task){
    const s=this.scene;s.workerSystem.reservations.release(task.reservation,worker.id);worker.workTask=null;worker.cargo={resource:'fish',amount:task.caught};
    s.foodSystem?.recordProduction?.('fish',task.caught,`fishing:${worker.id}:${this.nextCatch}`);worker.workState='Returning';worker.workMessage='Carrying the catch';
  }
  take(bodyId,hut){
    this.stocks.set(bodyId,Math.max(0,(this.stocks.get(bodyId)??0)-1));
    const record=this.catches.get(hut.id)??{today:0,yesterday:0};record.today++;this.catches.set(hut.id,record);
    if(this.state(bodyId)==='overfished'&&!this.warned.has(bodyId)){this.warned.add(bodyId);this.scene.eventFeed?.push?.(`overfished:${bodyId}:${this.scene.gameTime.day}`,t('fishing.overfishedNotice'),{important:true});}
  }
  newDay(){
    const winter=this.scene.seasons?.season==='Winter';
    for(const body of this.bodies){const stock=this.stocks.get(body.id)??0,missing=body.capacity-stock;this.stocks.set(body.id,Math.min(body.capacity,stock+missing*FISHING.stock.regenPerDay*(winter?FISHING.stock.winterRegen:1)));if(this.ratio(body.id)>=FISHING.stock.full)this.warned.delete(body.id);}
    for(const record of this.catches.values()){record.yesterday=record.today;record.today=0;}
  }
  summary(hut){
    const body=this.hutBody(hut),record=this.catches.get(hut.id)??{today:0,yesterday:0};
    if(body<0)return t('fishing.noWater');
    return t('fishing.water',{distance:this.distance(hut)})+' · '+t('fishing.summary',{state:t(`fishing.state.${this.state(body)}`),stock:Math.floor(this.stocks.get(body)??0),capacity:this.capacity(body),today:record.today,yesterday:record.yesterday,season:Math.round(this.modifier(GROUND.DEEP)/FISHING.depth[GROUND.DEEP]*100)});
  }
  exportState(){return {version:1,nextCatch:this.nextCatch,stocks:[...this.stocks].map(([id,n])=>[id,Math.round(n*1000)/1000]),warned:[...this.warned],catches:[...this.catches].map(([id,r])=>[id,r.today,r.yesterday])};}
  importState(state){
    if(!state)return;this.nextCatch=state.nextCatch;for(const [id,n]of state.stocks)this.stocks.set(id,n);this.warned=new Set(state.warned);
    this.catches=new Map(state.catches.map(([id,today,yesterday])=>[id,{today,yesterday}]));
  }
  destroy(){this.unsubscribe?.();}
}
// Connected water bodies (4-neighbours) of a ground grid: tile ids and per-body capacity.
export function waterBodies(ground){
  const rows=ground?.length??0,columns=ground?.[0]?.length??0,ids=new Int32Array(rows*columns).fill(-1),bodies=[];
  for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){
    // World v2: fords belong to their river, so a river with fords stays one water body.
    if(!isRiverGround(ground[y][x])||ids[y*columns+x]>=0)continue;
    const id=bodies.length,stack=[[x,y]];let tiles=0;ids[y*columns+x]=id;
    while(stack.length){const [cx,cy]=stack.pop();tiles++;for(const [dx,dy]of SIDES){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=columns||ny>=rows||ids[ny*columns+nx]>=0||!isRiverGround(ground[ny][nx]))continue;ids[ny*columns+nx]=id;stack.push([nx,ny]);}}
    bodies.push({id,tiles,capacity:stockCapacity(tiles)});
  }
  return {width:columns,ids,bodies};
}
// Save validation (called from GameStateSerializer with the validated ground and buildings).
export function validateFishingState(state,{bodies,buildingIds,check,integer,number}){
  check(state&&state.version===1);integer(state.nextCatch,1);
  check(Array.isArray(state.stocks)&&state.stocks.length===bodies.length);
  state.stocks.forEach(([id,n],i)=>{check(id===i);number(n,0,bodies[i].capacity);});
  check(Array.isArray(state.warned)&&state.warned.every(id=>Number.isInteger(id)&&id>=0&&id<bodies.length)&&new Set(state.warned).size===state.warned.length);
  check(Array.isArray(state.catches)&&new Set(state.catches.map(r=>r[0])).size===state.catches.length);
  for(const r of state.catches){check(Array.isArray(r)&&r.length===3&&buildingIds.has(r[0]));integer(r[1],0);integer(r[2],0);}
}
export function isFishingHut(building){return !!buildingDefinition(building).fishing&&buildingIsComplete(building);}
