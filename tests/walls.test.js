import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { Inventory } from '../src/game/inventory.js';
import { buildingTiles,placeBuilding,towerTop } from '../src/game/buildings.js';
import { wallLine,placeWallLine,wallLinePlan,wallIndex,connectionsFor,findRoofPath,planRoofExit } from '../src/game/walls.js';
import { PlayerController } from '../src/game/PlayerController.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { tileCenter } from '../src/game/map.js';

const wall=objectRegistry.require('wall');
const map=()=>Array.from({length:20},()=>Array(20).fill(0));
const makeWall=(x,y,id)=>({id,x,y,type:'wall',definition:wall,tiles:[{x,y}]});
// #97: the wall walk is reached only at a Gate or beside a Tower.
const gate=objectRegistry.require('wall_gate'),makeGate=(x,y,id)=>({id,x,y,type:'wall_gate',definition:gate,tiles:[{x,y}]});

test('castle costs twenty stones (owner price 0.49), blocks exactly 3x3, and uses a 75% sight bonus',()=>{
  const castle=objectRegistry.require('castle'),world=map(),inventory=new Inventory(),buildings=[];
  inventory.add('stone',20);
  const result=placeBuilding({map:world,anchor:{x:4,y:5},resources:new Map(),inventory,buildings,definition:castle});
  assert.ok(result.building);assert.equal(inventory.count('stone'),0);assert.equal(result.building.tiles.length,9);
  assert.deepEqual(result.building.tiles,buildingTiles({x:4,y:5},castle));
  assert.equal(world.flat().filter(Boolean).length,9);
  const king={definition:objectRegistry.require('king'),state:'onTower',position:{x:1.5,y:1.5},currentTower:result.building};
  assert.equal(new FogOfWarSystem(king,true).size,35);
});

test('wall dragging snaps to the dominant logical axis in either direction',()=>{
  assert.deepEqual(wallLine({x:5,y:5},{x:2,y:6}),[{x:5,y:5},{x:4,y:5},{x:3,y:5},{x:2,y:5}]);
  assert.deepEqual(wallLine({x:2,y:2},{x:3,y:5}),[{x:2,y:2},{x:2,y:3},{x:2,y:4},{x:2,y:5}]);
  assert.deepEqual(wallLine({x:1,y:1},{x:1,y:1}),[{x:1,y:1}]);
  // m-hradby-diagonala (point 41): a diagonal drag gives only the diagonal tiles (no steps), in all four directions.
  assert.deepEqual(wallLine({x:2,y:2},{x:4,y:4}),[{x:2,y:2},{x:3,y:3},{x:4,y:4}]);
  assert.deepEqual(wallLine({x:5,y:5},{x:3,y:7}),[{x:5,y:5},{x:4,y:6},{x:3,y:7}]);
  for(const end of [{x:9,y:9},{x:1,y:9},{x:9,y:1},{x:1,y:1},{x:9,y:8},{x:2,y:8}]){const line=wallLine({x:5,y:5},end);for(let i=1;i<line.length;i++){assert.equal(Math.abs(line[i].x-line[i-1].x),1);assert.equal(Math.abs(line[i].y-line[i-1].y),1,'neighbouring pieces touch at a corner');}assert.equal(new Set(line.map(t=>`${t.x},${t.y}`)).size,line.length);}
  assert.deepEqual(wallLine({x:5,y:5},{x:9,y:6}).at(-1),{x:9,y:5},'a shallow drag stays straight');
});

test('a complete wall line is validated and paid atomically; existing segments are not paid again',()=>{
  const world=map(),inventory=new Inventory(),buildings=[],tiles=wallLine({x:2,y:2},{x:6,y:2});inventory.add('stone',4);
  const options={map:world,inventory,buildings,tiles,definition:wall,resources:new Map(),reservedTiles:[]};
  assert.ok(placeWallLine(options).error);assert.equal(buildings.length,0);assert.equal(inventory.count('stone'),4);assert.equal(world.flat().filter(Boolean).length,0);
  inventory.add('stone');const result=placeWallLine(options);
  assert.equal(result.buildings.length,5);assert.equal(inventory.count('stone'),0);assert.equal(world.flat().filter(Boolean).length,5);
  inventory.add('stone',2);const extension=placeWallLine({...options,tiles:wallLine({x:4,y:2},{x:8,y:2})});
  assert.equal(extension.buildings.length,2);assert.equal(buildings.length,7);assert.equal(inventory.count('stone'),0);
  assert.equal(new Set(buildings.map(b=>b.id)).size,7);
});

test('an obstacle, animal reservation or pickup anywhere on the line prevents every segment',()=>{
  for(const obstruction of ['wall','animal','resource']){
    const world=map(),inventory=new Inventory(),buildings=[],resources=new Map(),reservedTiles=[];inventory.add('stone',20);
    if(obstruction==='wall')world[3][5]=1;
    if(obstruction==='animal')reservedTiles.push({x:5,y:3});
    if(obstruction==='resource')resources.set('5,3','pickup');
    const options={map:world,inventory,buildings,resources,reservedTiles,tiles:wallLine({x:3,y:3},{x:8,y:3}),definition:wall};
    assert.ok(wallLinePlan(options).error);assert.ok(placeWallLine(options).error);assert.equal(buildings.length,0);assert.equal(inventory.count('stone'),20);
    assert.equal(world[3][3],0);assert.equal(world[3][8],0);
  }
});

test('connection masks cover ends, straight lines, corners, T junctions and crosses',()=>{
  const center=makeWall(5,5,1),north=makeWall(5,4,2),east=makeWall(6,5,3),south=makeWall(5,6,4),west=makeWall(4,5,5);
  assert.deepEqual(connectionsFor(wallIndex([center,north]),center),{N:true,E:false,S:false,W:false});
  assert.deepEqual(connectionsFor(wallIndex([center,north,south]),center),{N:true,E:false,S:true,W:false});
  assert.deepEqual(connectionsFor(wallIndex([center,north,east]),center),{N:true,E:true,S:false,W:false});
  assert.deepEqual(connectionsFor(wallIndex([center,north,east,south]),center),{N:true,E:true,S:true,W:false});
  assert.deepEqual(connectionsFor(wallIndex([center,north,east,south,west]),center),{N:true,E:true,S:true,W:true});
});

test('roof navigation joins shared edges and corners and finds an exit beyond a surrounded central segment',()=>{
  // m-hradby-diagonala: two wall tiles that touch at a corner are one wall (a diagonal run); the walk crosses the corner.
  const a=makeWall(2,2,1),diagonal=makeWall(3,3,2),far=makeWall(5,4,4);assert.deepEqual(findRoofPath([a,diagonal],a,diagonal).map(b=>b.id),[2]);assert.equal(findRoofPath([a,diagonal,far],a,far),null);
  const bridge=makeWall(3,2,3);assert.equal(findRoofPath([a,bridge,diagonal],a,diagonal).length,1);
  const world=map(),buildings=[];
  for(let y=4;y<=6;y++)for(let x=4;x<=6;x++){const g=x===6&&y===6;buildings.push((g?makeGate:makeWall)(x,y,buildings.length+1));world[y][x]=g?0:1;}
  const center=buildings.find(b=>b.x===5&&b.y===5),route=planRoofExit(world,buildings,center,{kind:'move',goal:{x:0,y:0}});
  assert.ok(route);assert.ok(route.roofPath.length>0);assert.equal(world[route.exit.y][route.exit.x],0);
  assert.equal(route.wall.type,'wall_gate','the only way down is the Gate, even though other segments are nearer the goal');
  assert.equal(planRoofExit(world,buildings.filter(b=>b.type==='wall'),center,{kind:'move',goal:{x:0,y:0}}),null,'without a Gate or Tower there is no way down');
});

test('king climbs, walks continuously on joined walls, retargets without jumping and descends before ground movement',()=>{
  const buildings=Array.from({length:5},(_,i)=>(i===0?makeGate:makeWall)(4+i,4,i+1)),world=map();for(const b of buildings)world[b.y][b.x]=b.type==='wall_gate'?0:1;
  const sprite={...tileCenter({x:0,y:0}),setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(n){this.depth=n;return this;}},animations=[];
  const scene={map:world,buildings,wallMap:wallIndex(buildings),marker:{visible:false,setVisible(v){this.visible=v;}},
    setStatus(){},showMarker(){this.marker.visible=true;},updateBuildingUI(){},tweens:{add(tween){animations.push(tween);}}};
  const c=new PlayerController(scene,sprite,{x:0,y:0});
  const complete=()=>{const a=animations.shift();assert.ok(a);sprite.setPosition(a.x,a.y);a.onComplete();};
  c.command({kind:'enter',tower:buildings[0]});c.update(20000);assert.equal(c.state,'enteringTower');complete();assert.equal(c.state,'onWall');
  assert.deepEqual({x:sprite.x,y:sprite.y},towerTop(buildings[0]));
  c.command({kind:'enter',tower:buildings[4]});c.update(100);assert.equal(c.state,'onWall');assert.equal(c.walking,true);
  const before={...c.position},next={...c.nextTile};c.command({kind:'enter',tower:buildings[0]});
  assert.deepEqual(c.position,before);assert.deepEqual(c.nextTile,next);c.update(20000);
  assert.deepEqual(c.tile,{x:4,y:4});assert.equal(c.walking,false);
  c.command({kind:'enter',tower:buildings[4]});c.update(20000);assert.deepEqual(c.tile,{x:8,y:4});assert.equal(c.currentTower.id,5);
  c.command({kind:'move',goal:{x:1,y:1}});c.update(20000);assert.equal(c.state,'exitingTower');assert.notDeepEqual(c.tile,{x:1,y:1});
  complete();c.update(20000);assert.equal(c.state,'ground');assert.deepEqual(c.tile,{x:1,y:1});assert.equal(world[c.tile.y][c.tile.x],0);
});

test('#97: a Gate is walkable on the ground; a plain wall is climbed via its Gate or a Tower, never directly', () => {
  const buildings=[makeGate(4,4,1),makeWall(5,4,2),makeWall(6,4,3)],world=map();world[4][5]=world[4][6]=1;
  assert.equal(gate.walkable,true);assert.equal(gate.navigation.walkableTop,true);
  const sprite={...tileCenter({x:0,y:0}),setPosition(x,y){this.x=x;this.y=y;return this;},setDepth(n){this.depth=n;return this;}},animations=[],status=[];
  const scene={map:world,buildings,wallMap:wallIndex(buildings),marker:{visible:false,setVisible(v){this.visible=v;}},setStatus(s){status.push(s);},showMarker(){this.marker.visible=true;},updateBuildingUI(){},tweens:{add(t){animations.push(t);}}};
  const c=new PlayerController(scene,sprite,{x:6,y:6});const complete=()=>{const a=animations.shift();assert.ok(a);sprite.setPosition(a.x,a.y);a.onComplete();};
  assert.equal(c.command({kind:'enter',tower:buildings[2]}),true);c.update(20000);complete();assert.equal(c.state,'onWall');
  c.update(20000);assert.deepEqual(c.tile,{x:6,y:4},'climbed at the Gate and walked along the top to the clicked segment');
  const lone=[makeWall(10,10,9)],w2=map();w2[10][10]=1;const s2={...scene,map:w2,buildings:lone,wallMap:wallIndex(lone)};const k=new PlayerController(s2,{...sprite},{x:12,y:12});
  assert.equal(k.command({kind:'enter',tower:lone[0]}),false,'a wall without a Gate or Tower cannot be climbed');
  // A wall touching a Tower is its stair.
  const tower={id:20,x:11,y:9,type:'tower',tiles:[{x:11,y:9},{x:12,y:9},{x:11,y:10},{x:12,y:10}]};assert.equal(k.command({kind:'enter',tower:lone[0]}),false);
  const s3={...s2,buildings:[...lone,tower]};const k3=new PlayerController(s3,{...sprite},{x:12,y:12});assert.equal(k3.command({kind:'enter',tower:lone[0]}),true);
});

test('m-hradby-diagonala: a diagonal run is one wall – its tiles know their run, nobody passes between them, the walk goes on',async()=>{
  const {diagonalRun,wallShape,wallIndex,connectedWalls,findRoofPath}=await import('../src/game/walls.js'),{reachableTiles,findPath}=await import('../src/game/pathfinding.js');
  const wall=objectRegistry.require('wall'),mk=(x,y,id)=>({id,type:'wall',x,y,definition:wall,tiles:[{x,y}]});
  const run=[mk(3,3,1),mk(4,4,2),mk(5,5,3)],straight=[mk(6,5,4),mk(7,5,5)],other=[mk(9,2,6),mk(8,3,7)],buildings=[...run,...straight,...other],index=wallIndex(buildings,true);
  // the middle of a run is a diagonal piece; each end is an elbow towards the run (also at a straight wall)
  assert.deepEqual(wallShape(index,run[1]),{diagonal:'se'});assert.equal(diagonalRun(index,run[1]),'se');
  assert.deepEqual(wallShape(index,run[0]),{elbow:'SE-11'},'a free end: both sides across open');assert.deepEqual(wallShape(index,run[2]),{elbow:'NW-10'},'the end at a straight wall (east of it): that side is joined');
  assert.equal(wallShape(index,straight[1]),null);assert.match(wallShape(index,other[0]).elbow,/^SW-/);assert.match(wallShape(index,other[1]).elbow,/^NE-/);
  assert.deepEqual(wallShape(index,run[1],new Set(['4,3'])),{elbow:'SE-01'},'a tower beside it: the link through that corner is filled');
  // an L corner (the tile between is a wall) is no diagonal link
  const l=wallIndex([mk(1,1,20),mk(2,1,21),mk(2,2,22)],true);assert.equal(wallShape(l,l.get('1,1')),null);
  // a wall from edge to edge of a small map along the diagonal: the two halves are separate
  const size=8,world=Array.from({length:size},()=>Array(size).fill(0));for(let i=0;i<size;i++)world[i][i]=1;
  const reach=reachableTiles(world,[{x:5,y:1}]);assert.ok(reach.length>0&&reach.every(t=>t.x>t.y),'nobody slips through the corners');assert.equal(findPath(world,{x:5,y:1},{x:1,y:5}),null);
  // the wall walk continues across the corners (finished walls)
  const done=buildings.map(b=>({...b,construction:{state:'complete'}}));assert.equal(connectedWalls(done,done[0]).length,5);assert.equal(findRoofPath(done,done[0],done[4]).length,4);
  assert.equal(connectedWalls(done,done[5]).length,2);
});
