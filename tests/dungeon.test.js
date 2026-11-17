import test from 'node:test';
import assert from 'node:assert/strict';
import { shapeZoneWorld } from '../src/game/zoneFeatures.js';
import { dungeonShapes } from '../src/game/DungeonView.js';

const world=()=>({terrain:Array.from({length:100},()=>Array(100).fill(0)),ground:Array.from({length:100},()=>Array(100).fill(0)),bushes:new Map(),reeds:new Set(),natureGroups:[]});
const rng=s=>()=>(s=(s*16807)%2147483647)/2147483647;
const reach=(t,from)=>{const seen=new Set([`${from.x},${from.y}`]),q=[from];while(q.length){const p=q.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(t[y]?.[x]===0&&!seen.has(k)){seen.add(k);q.push({x,y});}}}return seen;};

test('inside the mine: winding tunnels reach every cavern and chest, now narrow, now wide', () => {
  for(const seed of [3,11,29,57]){const w=world(),f=shapeZoneWorld(w,{type:'mine',id:'n',dungeon:true},rng(seed)),open=reach(w.terrain,f.entrance);
    for(const r of f.rooms)assert.ok(open.has(`${r.x},${r.y}`),`seed ${seed}: cavern ${r.x},${r.y} reachable`);
    for(const c of f.chests)assert.ok(open.has(`${c.tile.x},${c.tile.y}`),`seed ${seed}: chest reachable`);
    // across the tunnels the width varies: count the open run lengths along rows outside the caverns
    const runs=new Set();for(let y=2;y<98;y++){let n=0;for(let x=0;x<100;x++){if(w.terrain[y][x]===0)n++;else{if(n&&f.rooms.every(r=>Math.hypot(r.x-(x-n/2),r.y-y)>r.r+2))runs.add(Math.min(n,6));n=0;}}}
    assert.ok([...runs].some(n=>n<=2)&&[...runs].some(n=>n>=4),`seed ${seed}: narrow and wide places ${[...runs]}`);
    assert.ok(w.ground.flat().every(g=>g===6),'no rocky ground decor inside the mine');}
});

test('the rock view: walls show faces only towards a passage, the rest of the rock stays black', () => {
  // a 6×6 block of rock with one open tile at 2,2
  const wall=(x,y)=>!(x===2&&y===2),{tiles,height}=dungeonShapes((x,y)=>x<0||y<0||x>5||y>5||wall(x,y),6),at=(x,y)=>tiles.find(t=>t.x===x&&t.y===y);
  assert.deepEqual(at(1,2).faces,['east']);assert.deepEqual(at(2,1).faces,['south']);
  assert.deepEqual(at(3,2).faces,[]);assert.deepEqual(at(3,2).lip,['west']);
  assert.equal(at(5,5).edge,false,'far rock is not an edge');assert.ok(at(1,1).edge);
  assert.ok(height(3,3)<15,'the wall in front of the passage stays low');assert.ok(height(2,2)>25,'the wall behind it stands tall');
});

test('rounded caves: jutting rock corners are shaved, pocket corners filled; pillars show their rocky top', () => {
  // rock everywhere except a 4×4 room at 2..5 with a single pillar at 3,3
  const wall=(x,y)=>!(x>=2&&x<=5&&y>=2&&y<=5)||(x===3&&y===3),{tiles,shift,isIsland}=dungeonShapes((x,y)=>x<0||y<0||x>7||y>7||wall(x,y),8);
  assert.ok(isIsland(3,3)&&!isIsland(0,0));assert.ok(tiles.find(t=>t.x===3&&t.y===3).island);
  const moved=[[2,2],[6,2],[2,6],[6,6]].filter(([x,y])=>{const p=shift(x,y);return p.x!==x||p.y!==y;});
  assert.ok(moved.length>=3,'most room corners are rounded, now and then one stays sharp');
  const c=shift(2,2);assert.ok(c.x>=2&&c.y>=2,'a pocket corner moves into the room');
});
