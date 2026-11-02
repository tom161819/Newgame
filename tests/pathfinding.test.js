import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, findPathToAny, reachableTiles, canStep } from '../src/game/pathfinding.js';
import { grid, COLUMNS, ROWS, PLAYER_START, isWalkable } from '../src/game/map.js';

const costOf = (start, path) => {
  let previous = start, cost = 0;
  for (const step of path) { cost += Math.hypot(step.x-previous.x, step.y-previous.y); previous = step; }
  return cost;
};

function assertValidPath(map, start, path) {
  let previous = start;
  for (const step of path) {
    assert.ok(isWalkable(map, step.x, step.y));
    const dx=step.x-previous.x, dy=step.y-previous.y;
    assert.equal(Math.max(Math.abs(dx),Math.abs(dy)),1);
    if(dx&&dy){assert.equal(map[previous.y][step.x],0);assert.equal(map[step.y][previous.x],0);}
    previous=step;
  }
}

// Nezávislá pomalá Dijkstra pro malé testovací mapy; nepoužívá haldu,
// heuristiku ani pravidlo sousedů z testovaného A*.
function referenceCost(map, start, goal) {
  const width=map[0].length, distances=Array(width*map.length).fill(Infinity), done=new Set();
  distances[start.y*width+start.x]=0;
  while(true){
    let at=-1;
    for(let i=0;i<distances.length;i++)if(!done.has(i)&&(at<0||distances[i]<distances[at]))at=i;
    if(at<0||!Number.isFinite(distances[at]))return Infinity;
    const x=at%width,y=Math.floor(at/width);
    if(x===goal.x&&y===goal.y)return distances[at];
    done.add(at);
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;
      const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=width||ny>=map.length||map[ny][nx]!==0)continue;
      if(dx&&dy&&(map[y][nx]!==0||map[ny][x]!==0))continue;
      const next=ny*width+nx;
      distances[next]=Math.min(distances[next],distances[at]+Math.hypot(dx,dy));
    }
  }
}

test('A* vede přímou diagonálu a počítá její skutečnou délku √2', () => {
  const map=Array.from({length:7},()=>Array(7).fill(0));
  const route=findPathToAny(map,{x:1,y:1},[{x:5,y:5}]);
  assert.deepEqual(route.path,[{x:2,y:2},{x:3,y:3},{x:4,y:4},{x:5,y:5}]);
  assert.ok(Math.abs(route.cost-4*Math.SQRT2)<1e-9);
  assert.equal(findPathToAny(map,{x:1,y:1},[{x:5,y:1}]).cost,4);
});

test('A* najde nejkratší obchůzku překážky bez řezání rohů', () => {
  const map=[[0,1,0],[0,1,0],[0,0,0]],start={x:0,y:0};
  const path=findPath(map,start,{x:2,y:0});
  assert.equal(costOf(start,path),6);assertValidPath(map,start,path);
});

test('diagonálu blokuje i jediný neprůchozí boční soused', () => {
  const start={x:0,y:0},goal={x:1,y:1};
  for(const map of [[[0,1],[0,0]],[[0,0],[1,0]]]){
    assert.equal(canStep(map,start,goal),false);
    const path=findPath(map,start,goal);assert.equal(path.length,2);assert.equal(costOf(start,path),2);
  }
  const pinched=[[0,1],[1,0]];
  assert.equal(findPath(pinched,start,goal),null);
  assert.deepEqual(reachableTiles(pinched,[start]),[start]);
});

test('neprůchozí, nedosažitelný cíl, hranice a nulová cesta', () => {
  const map=[[0,1,0]];
  for(const goal of [{x:1,y:0},{x:2,y:0},{x:-1,y:0},{x:0,y:1}])assert.equal(findPath(map,{x:0,y:0},goal),null);
  assert.deepEqual(findPath(map,{x:0,y:0},{x:0,y:0}),[]);
  assert.equal(findPathToAny(map,{x:0,y:0},[{x:0,y:0}]).cost,0);
  assert.equal(findPathToAny(map,{x:0,y:0},[]),null);
});

test('A* a výběr více cílů odpovídají nezávislé Dijkstře na různých mapách', () => {
  let seed=814;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
  for(let run=0;run<50;run++){
    const map=Array.from({length:7},()=>Array.from({length:8},()=>random()<0.28?1:0));
    const start={x:0,y:0},goals=[{x:7,y:6},{x:6,y:0}];map[0][0]=0;
    for(const goal of goals)map[goal.y][goal.x]=0;
    const expected=Math.min(...goals.map(goal=>referenceCost(map,start,goal)));
    const route=findPathToAny(map,start,goals);
    if(!Number.isFinite(expected))assert.equal(route,null);
    else{
      assert.ok(route);assertValidPath(map,start,route.path);
      assert.ok(Math.abs(route.cost-expected)<1e-8);
      assert.ok(Math.abs(costOf(start,route.path)-expected)<1e-8);
      assert.ok(goals.some(goal=>goal.x===route.destination.x&&goal.y===route.destination.y));
    }
  }
});

test('mapa 100 × 100 zůstává průchodná a cesty jsou platné přes celou mapu', () => {
  assert.equal(grid.length,ROWS);assert.ok(grid.every(row=>row.length===COLUMNS));assert.equal(COLUMNS*ROWS,10000);
  const reachable=reachableTiles(grid,[PLAYER_START]);
  assert.equal(reachable.length,grid.flat().filter(value=>value===0).length);
  for(const goal of reachable.filter((_,i)=>i%251===0)){
    const path=findPath(grid,PLAYER_START,goal);assert.notEqual(path,null);assertValidPath(grid,PLAYER_START,path);
    assert.deepEqual(path.at(-1)??PLAYER_START,goal);
  }
});
