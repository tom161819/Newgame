import { t } from '../i18n/index.js';
import { buildingDefinition,buildingIsComplete,placementError,buildingTiles,planTowerExit } from './buildings.js';
import { tileKey } from './stones.js';

export const WALL_DIRECTIONS=Object.freeze([{name:'N',x:0,y:-1},{name:'E',x:1,y:0},{name:'S',x:0,y:1},{name:'W',x:-1,y:0}]);
export const isWall=building=>buildingDefinition(building).navigation?.walkableTop===true;
// #97: the wall walk is reached only at a Gate or where a wall touches a Tower (its stair).
export const isWallAccess=(building,buildings)=>isWall(building)&&(buildingDefinition(building).navigation?.access===true||buildings.some(b=>(b.type==='tower'||b.type==='gate')&&buildingIsComplete(b)&&b.tiles?.some(t=>Math.abs(t.x-building.x)+Math.abs(t.y-building.y)===1)));
export const wallIndex=(buildings,includeUnfinished=false)=>new Map(buildings.filter(b=>isWall(b)&&(includeUnfinished||buildingIsComplete(b))).map(b=>[tileKey(b),b]));

// m-hradby-8-smeru (owner 14 Nov 2026): a dragged wall line goes in eight directions. Straight along the tile rows as
// before; when the drag is closer to a diagonal (more than 26.6° off a row), the line runs diagonally.
// m-hradby-diagonala (owner 14–15 Nov 2026, point 41): a diagonal line is only the diagonal tiles – no steps. The
// tiles touch at their corners; each is drawn as a diagonal piece, so the run is one straight wall. Nobody slips
// between them (a unit never cuts a corner between two blocked tiles) and the wall walk continues across the corner.
export function wallLine(start,end){
  const dx=end.x-start.x,dy=end.y-start.y,ax=Math.abs(dx),ay=Math.abs(dy),tiles=[];
  if(Math.min(ax,ay)*2>Math.max(ax,ay)){
    const n=Math.round((ax+ay)/2),sx=Math.sign(dx),sy=Math.sign(dy);
    for(let i=0;i<=n;i++)tiles.push({x:start.x+i*sx,y:start.y+i*sy});
    return tiles;
  }
  const horizontal=ax>=ay,length=horizontal?ax:ay,step=Math.sign(horizontal?dx:dy);
  for(let i=0;i<=length;i++)tiles.push({x:start.x+(horizontal?i*step:0),y:start.y+(horizontal?0:i*step)});
  return tiles;
}
export const WALL_DIAGONALS=Object.freeze([{name:'SE',x:1,y:1},{name:'NW',x:-1,y:-1},{name:'NE',x:1,y:-1},{name:'SW',x:-1,y:1}]);
// How a wall tile joins a diagonal run (owner 15 Nov 2026: smooth joints, merlons only on the outer edges).
// A diagonal link is a wall on a corner neighbour with both tiles between free (otherwise the corner is already filled).
// - {diagonal:'se'|'ne'}: a tile in the middle of a run – nothing beside it, links on two opposite corners.
// - {elbow:'NE'|'SE'|'SW'|'NW'}: one link – the block with half a band towards that corner (end of a run, at a straight
//   wall or free).
// - null: a plain block (no link, or a shape the pieces do not cover: two links that are not a straight run).
// `solid`: keys of other fortification tiles (towers, the castle) that count as walls beside it.
export function wallShape(index,building,solid=null){
  const at=(dx,dy)=>tileKey({x:building.x+dx,y:building.y+dy}),has=(dx,dy)=>index.has(at(dx,dy))||!!solid?.has(at(dx,dy));
  const beside=WALL_DIRECTIONS.filter(d=>has(d.x,d.y)),links=WALL_DIAGONALS.filter(d=>index.has(at(d.x,d.y))&&!has(d.x,0)&&!has(0,d.y));
  if(!beside.length&&links.length===2&&links[0].x===-links[1].x&&links[0].y===-links[1].y)return {diagonal:links[0].x===links[0].y?'se':'ne'};
  // m-hradby-diagonala v5: an elbow also says whether the sides across from the band are open (the mitre is cut there).
  if(links.length===1){const d=links[0],open=(dx,dy)=>!has(dx,dy)?1:0;return {elbow:`${d.name}-${open(0,-d.y)}${open(-d.x,0)}`};}
  return null;
}
// Owner 20 Nov 2026: the two sides of a block beside the corner its diagonal band leaves through ('NW-10' → N, W).
export const bandSides=elbow=>elbow?String(elbow).split('-')[0].split('').filter(c=>'NESW'.includes(c)):[];
export const diagonalRun=(index,building,solid=null)=>wallShape(index,building,solid)?.diagonal??null;

export function connectionsFor(index,building){
  return Object.fromEntries(WALL_DIRECTIONS.map(d=>[d.name,index.has(tileKey({x:building.x+d.x,y:building.y+d.y}))]));
}
// m-staveni-zdi-studna (59): a wall run on one axis turns a Gate along it ('x': joined E/W, drawn flipped; 'y': joined N/S).
// A Gate with no such run (alone, at a corner or a crossing) keeps its stored gateAxis, chosen with R while placing.
export function gateAxis(index,building){
  // m-brana-2x2: a 2 × 2 Gate looks at the walls along its four sides.
  const size=(building.definition??buildingDefinition(building))?.width??1;
  // Owner 20 Nov 2026: only a wall that leads away from a side joins there; a wall running past the side (parallel to it)
  // does not turn the Gate.
  if(size>1){const has=(x,y)=>index.has(tileKey({x,y})),x0=building.x,y0=building.y;let ew=false,ns=false;
    const joinsX=(x,y,away)=>has(x,y)&&(has(x+away,y)||!has(x,y-1)&&!has(x,y+1)),joinsY=(x,y,away)=>has(x,y)&&(has(x,y+away)||!has(x-1,y)&&!has(x+1,y));
    for(let i=0;i<size;i++){if(joinsX(x0-1,y0+i,-1)||joinsX(x0+size,y0+i,1))ew=true;if(joinsY(x0+i,y0-1,-1)||joinsY(x0+i,y0+size,1))ns=true;}
    if(ew&&!ns)return 'x';if(ns&&!ew)return 'y';return building.gateAxis==='x'?'x':'y';}
  const n=connectionsFor(index,building),ew=n.E||n.W,ns=n.N||n.S;
  if(ew&&!ns)return 'x';if(ns&&!ew)return 'y';return building.gateAxis==='x'?'x':'y';
}
export const gateAxisLocked=(index,building)=>{const a=gateAxis(index,{...building,gateAxis:'x'}),b=gateAxis(index,{...building,gateAxis:'y'});return a===b;};
// R while placing: turns the pending axis unless the wall run under the cursor decides it (then it stays and locked is true).
export function turnGate(index,anchor,axis){return anchor&&gateAxisLocked(index,anchor)?{axis:axis==='x'?'x':'y',locked:true}:{axis:axis==='x'?'y':'x',locked:false};}
export function wallLinePlan({map,tiles,resources,reservedTiles=[],buildings,definition,inventory}){
  const existing=wallIndex(buildings,true),fresh=tiles.filter(tile=>!existing.has(tileKey(tile)));
  if(!fresh.length)return {error:t('status.wallExists'),tiles:[],cost:{}};
  for(const tile of fresh){const error=placementError(map,tile,resources,reservedTiles,definition,buildings);if(error)return {error,tiles:fresh,cost:{}};}
  const cost=Object.fromEntries(Object.entries(definition.cost).map(([id,amount])=>[id,amount*fresh.length]));
  if(!inventory.canAfford(cost))return {error:t('status.wallNoFunds'),tiles:fresh,cost};
  return {tiles:fresh,cost,error:null};
}
export function placeWallLine(options){
  const plan=wallLinePlan(options);if(plan.error)return plan;
  const construction=options.inventory.storage?.scene.constructionSystem,materials=options.reserveMaterials&&construction?.materials.enabled?construction.materials:null;
  if(!materials&&!options.inventory.pay(plan.cost))return {...plan,error:t('status.wallNoFunds')};
  const {buildings,map,definition}=options,created=[];
  let id=Math.max(buildings.reduce((n,b)=>Math.max(n,b.id),0)+1,materials?construction.nextId:1);
  for(const tile of plan.tiles){
    const building={...tile,id:id++,type:definition.id,definition,tiles:buildingTiles(tile,definition)};
    if(materials&&!materials.prepare(building)){for(const prepared of created)materials.discardPrepared(prepared);return {...plan,error:t('status.wallNoFunds')};}created.push(building);
  }
  // provisional: segments outside sight claim no tiles until each one is seen (ConstructionSystem.verifyProvisional).
  for(const building of created){if(options.provisional)building.unverified=true;else map[building.y][building.x]=definition.walkable?0:1;buildings.push(building);}
  return {...plan,buildings:created};
}

function roofTree(buildings,start){
  const index=wallIndex(buildings),first=tileKey(start),parents=new Map(),distances=new Map(),queue=[];
  if(index.has(first)){parents.set(first,null);distances.set(first,0);queue.push(first);}
  for(let i=0;i<queue.length;i++){
    const key=queue[i],building=index.get(key);if(!building)continue;
    // m-hradby-diagonala: the wall walk also continues across the corner of two diagonal wall tiles.
    for(const d of [...WALL_DIRECTIONS,...WALL_DIAGONALS]){const next=tileKey({x:building.x+d.x,y:building.y+d.y});
      if(index.has(next)&&!parents.has(next)){parents.set(next,key);distances.set(next,distances.get(key)+1);queue.push(next);}
    }
  }
  return {index,parents,distances};
}
function reconstruct(tree,end){
  const result=[];for(let key=tileKey(end);tree.parents.get(key)!==null;key=tree.parents.get(key))result.push(tree.index.get(key));
  return result.reverse();
}
// Access points of the wall network a segment belongs to (for climbing up from the ground).
export function wallAccessPoints(buildings,wall){return connectedWalls(buildings,wall).filter(w=>isWallAccess(w,buildings));}
export function connectedWalls(buildings,start){const tree=roofTree(buildings,start);return [...tree.parents.keys()].map(key=>tree.index.get(key)).filter(Boolean);}
export function findRoofPath(buildings,start,end){
  if(!isWall(start)||!isWall(end))return null;
  const tree=roofTree(buildings,start);return tree.parents.has(tileKey(end))?reconstruct(tree,end):null;
}
export function planRoofExit(map,buildings,start,order,options){
  const tree=roofTree(buildings,start);let best=null;
  for(const [key,roofCost]of tree.distances){
    const wall=tree.index.get(key);if(!isWallAccess(wall,buildings))continue;const route=planTowerExit(map,wall,order,options);if(!route)continue;
    const totalCost=roofCost+route.cost;
    if(!best||totalCost<best.totalCost)best={...route,totalCost,wall,roofPath:reconstruct(tree,wall)};
  }
  return best;
}

// m-hradby-diagonala: links and shape of every wall tile. Finished walls take both from finished walls only (the wall
// walk); a wall under construction takes its shape from the whole planned line, so the site already shows its diagonal
// piece (owner's handover 19 Nov 2026: sites were drawn as blocks). Towers, gates and the castle beside a wall keep it a block.
export function wallLayout(buildings){
  const finished=wallIndex(buildings),planned=wallIndex(buildings,true),key=tileKey;
  const solid=new Set();for(const b of buildings)if(['tower','gate','castle'].includes(b.type)&&!finished.has(key(b)))for(const tile of b.tiles??[])solid.add(key(tile));
  // Owner 20 Nov 2026: a wall that meets a Gate on one of its wall sides runs into it (no end merlons sticking out there);
  // a wall at a Tower runs into it on every side, so no merlons stand in front of the tower doors.
  const gateSide=new Map();for(const b of buildings){const sides=b.type==='tower'?'NESW':b.type==='gate'?(b.gateAxis==='x'?'EW':'NS'):null;if(sides&&buildingIsComplete(b))for(const tile of b.tiles??buildingTiles(b,buildingDefinition(b)))gateSide.set(key(tile),sides);}
  const joined=building=>{const links=connectionsFor(finished,building);for(const d of WALL_DIRECTIONS)if(!links[d.name]&&gateSide.get(key({x:building.x+d.x,y:building.y+d.y}))?.includes(d.name))links[d.name]=true;return links;};
  // Owner 20 Nov 2026 ("mezera u věže"): the Tripo Tower and Gate stand a little inside their tiles, so a wall that runs
  // into one gets a short stub on that side (FortificationView) and no strip of grass shows at the joint.
  const into=building=>WALL_DIRECTIONS.filter(d=>gateSide.get(key({x:building.x+d.x,y:building.y+d.y}))?.includes(d.name)).map(d=>d.name);
  const walls=[...planned.values()].map(building=>({building,into:finished.get(key(building))===building?into(building):[],connections:joined(building),shape:building.type==='wall'?wallShape(finished.get(key(building))===building?finished:planned,building,solid):null}));
  return {finished,walls};
}
