import { buildingIsComplete,entryTiles,buildingDefinition } from './buildings.js';
import { isWall } from './walls.js';
import { tileKey } from './stones.js';
import { canStep } from './pathfinding.js';

// Owner 17 Nov 2026: the walls, Towers and Gates form one raised network. Along it a soldier walks from wall to wall,
// onto a Tower or a Gate touching a wall, and from a Tower or a Gate onto one touching it. From the ground he gets up
// (and down) only at a Tower's door (`entryTiles`, the side the Tower faces) or inside a Gate's passage – never
// straight onto a wall.
export const PLATFORM_TYPES=Object.freeze(['tower','gate','wall_gate']);
export const isPlatform=building=>PLATFORM_TYPES.includes(building?.type);
const STEPS=[[1,0],[-1,0],[0,1],[0,-1]];

// Raised tiles of every finished wall and platform, by tile key.
export function elevatedIndex(buildings){
  const index=new Map();
  for(const b of buildings)if((isPlatform(b)||isWall(b))&&buildingIsComplete(b))for(const t of b.tiles??[{x:b.x,y:b.y}])index.set(tileKey(t),b);
  return index;
}
// Breadth first over the raised tiles from `sources`: distance and previous tile of each one reached.
function spread(index,sources){
  const dist=new Map(),prev=new Map(),queue=[];
  for(const t of sources){const k=tileKey(t);if(index.has(k)&&!dist.has(k)){dist.set(k,0);prev.set(k,null);queue.push({x:t.x,y:t.y});}}
  for(let i=0;i<queue.length;i++){const at=queue[i],d=dist.get(tileKey(at));
    for(const [dx,dy] of STEPS){const n={x:at.x+dx,y:at.y+dy},k=tileKey(n);if(!index.has(k)||dist.has(k))continue;dist.set(k,d+1);prev.set(k,at);queue.push(n);}}
  return {dist,prev};
}
// The raised route from `start` to the nearest of `goals` (tiles after start), or null.
export function elevatedRoute(index,start,goals){
  if(goals.some(g=>tileKey(g)===tileKey(start)))return [];
  const {dist,prev}=spread(index,[start]),best=goals.filter(g=>dist.has(tileKey(g))).sort((a,b)=>dist.get(tileKey(a))-dist.get(tileKey(b)))[0];
  if(!best)return null;
  const path=[];for(let at=best;at&&tileKey(at)!==tileKey(start);at=prev.get(tileKey(at)))path.unshift({x:at.x,y:at.y});return path;
}
// Where a platform is climbed from the ground tile `ground`: the platform tile beside it (for a Gate the tile itself).
function topFor(platform,ground){
  const tiles=platform.tiles??[{x:platform.x,y:platform.y}];
  return tiles.find(t=>t.x===ground.x&&t.y===ground.y)??tiles.find(t=>Math.abs(t.x-ground.x)+Math.abs(t.y-ground.y)===1)??null;
}
// Every way up: {platform, ground, top} for each finished Tower and Gate.
export function entrances(buildings,map){
  const out=[];
  for(const b of buildings)if(isPlatform(b)&&buildingIsComplete(b))for(const g of entryTiles(b)){if(map?.[g.y]?.[g.x]!==0)continue;const top=topFor(b,g);if(top)out.push({platform:b,ground:{x:g.x,y:g.y},top});}
  return out;
}
// Walking distances over the ground from `start` (8 directions, diagonals only where canStep allows); stops once all
// `goals` (tile keys) are settled.
export function groundDistances(map,start,goals=null){
  const dist=new Map([[tileKey(start),0]]),heap=[[0,start.x,start.y]],left=goals?new Set(goals):null;
  const push=e=>{heap.push(e);let i=heap.length-1;while(i>0){const p=(i-1)>>1;if(heap[p][0]<=heap[i][0])break;[heap[p],heap[i]]=[heap[i],heap[p]];i=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let i=0;for(;;){const l=2*i+1,r=l+1;let m=i;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===i)break;[heap[m],heap[i]]=[heap[i],heap[m]];i=m;}}return top;};
  const steps=[[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]];
  while(heap.length){
    const [d,x,y]=pop(),k=`${x},${y}`;if(d>dist.get(k))continue;
    if(left){left.delete(k);if(!left.size)break;}
    for(const [dx,dy,c] of steps){const n={x:x+dx,y:y+dy};if(map[n.y]?.[n.x]!==0||!canStep(map,{x,y},n))continue;const nd=d+c,nk=tileKey(n);if(nd<(dist.get(nk)??Infinity)){dist.set(nk,nd);push([nd,n.x,n.y]);}}
  }
  return dist;
}
// The best way from the ground tile `from` up to any of the raised `targets`: the walk to an entrance plus the walk
// along the walls, counted together (so nobody runs to a far stair when a near one leads there too).
export function planAscent(map,buildings,from,targets,index=elevatedIndex(buildings)){
  const up=spread(index,targets).dist;if(!up.size)return null;
  const ways=entrances(buildings,map).filter(e=>up.has(tileKey(e.top)));if(!ways.length)return null;
  const ground=groundDistances(map,from,ways.map(e=>tileKey(e.ground)));let best=null;
  for(const e of ways){const g=ground.get(tileKey(e.ground));if(g===undefined)continue;const cost=g+up.get(tileKey(e.top));if(!best||cost<best.cost)best={...e,cost};}
  return best;
}
// The nearest way down from a raised tile: the raised route to an entrance's top tile and the ground tile to step onto.
export function planDescent(map,buildings,from,index=elevatedIndex(buildings),near=null){
  const {dist,prev}=spread(index,[from]),ways=entrances(buildings,map).filter(e=>dist.has(tileKey(e.top)));if(!ways.length)return null;
  // With `near` (where he is going next), the way down closest to it counts too.
  const score=e=>dist.get(tileKey(e.top))+(near?Math.hypot(e.ground.x-near.x,e.ground.y-near.y):0);
  const best=ways.sort((a,b)=>score(a)-score(b))[0],route=[];
  for(let at=best.top;at&&tileKey(at)!==tileKey(from);at=prev.get(tileKey(at)))route.unshift({x:at.x,y:at.y});
  return {...best,route};
}
// The platform tiles a post on a Tower or Gate stands on.
export const platformTiles=building=>(building.tiles??[{x:building.x,y:building.y}]).map(t=>({x:t.x,y:t.y}));
export const platformCenter=building=>{const d=buildingDefinition(building);return {x:building.x+d.width/2,y:building.y+d.height/2};};
