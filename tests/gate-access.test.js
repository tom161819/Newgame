import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { placeBuilding,buildingIsComplete,buildingTiles,towerTop } from '../src/game/buildings.js';
import { findPathToAny } from '../src/game/pathfinding.js';
import { findRoofPath,planGroundRoofEntry,planRoofExit,roofIndex } from '../src/game/walls.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
const key=t=>`${t.x},${t.y}`;
function until(s,p,max=90000){for(let time=0;time<max&&!p();time+=25)s.tick(25);assert.ok(p());}
function scene(terrain,starter=true){return workerScene(terrain,{construction:true,logistics:true,starter});}
function add(s,type,x,y){const d=s.objectRegistry.require(type);if(buildingTiles({x,y},d).some(t=>s.reservedTiles().some(r=>key(r)===key(t)))){assert.ok(s.character.command({kind:'move',goal:{x:40,y:40}}));until(s,()=>!s.character.path.length&&!s.character.nextTile);}for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(r.error);s.constructionSystem.plan(r.building);return r.building;}
function build(s,b){assert.ok(s.kingLogistics.startMaterials(b));until(s,()=>s.constructionSystem.materials.ready(b));assert.ok(s.constructionSystem.commandKing(b));until(s,()=>buildingIsComplete(b));}
function completed(s,type,x,y){const b=add(s,type,x,y);build(s,b);return b;}

for(const axis of ['x','y'])test(`gate ${axis} opens only its completed middle passage in both directions and preserves it on current Load`,()=>{
 const terrain=Array.from({length:100},()=>Array(100).fill(0));for(let i=0;i<100;i++)terrain[axis==='y'?50:i][axis==='x'?50:i]=1;
 const anchor=axis==='y'?{x:49,y:50}:{x:50,y:49};for(const t of buildingTiles(anchor,objectRegistry.require(`gate_${axis}`)))terrain[t.y][t.x]=0;
 const s=scene(terrain),gate=add(s,`gate_${axis}`,anchor.x,anchor.y),middle={x:50,y:50},start=axis==='y'?{x:50,y:48}:{x:48,y:50},end=axis==='y'?{x:50,y:52}:{x:52,y:50};
 assert.equal(findPathToAny(s.map,start,[end]),null);assert.equal(s.map[middle.y][middle.x],1);build(s,gate);
 for(const [from,to]of [[start,end],[end,start]]){const route=findPathToAny(s.map,from,[to]);assert.ok(route);assert.ok(route.path.some(t=>key(t)===key(middle)));}
 for(const tile of gate.tiles)assert.equal(s.map[tile.y][tile.x],key(tile)===key(middle)?0:1);
 const saved=validateGameState(serializeGameState(s)),r=scene(saved.terrain,false);loadGameState(r,structuredClone(saved));assert.equal(saved.saveVersion,SAVE_VERSION);assert.deepEqual(serializeGameState(r),saved);assert.ok(findPathToAny(r.map,start,[end]));
});

test('only a reachable completed tower or gate provides entry and exit; disconnected and unfinished accesses do not',()=>{
 const s=scene(),wall=completed(s,'wall',52,50),other=completed(s,'wall',70,50);
 assert.equal(planGroundRoofEntry(s.map,s.buildings,s.character.tile,wall),null);assert.equal(planRoofExit(s.map,s.buildings,wall,{kind:'move',goal:{x:45,y:45}}),null);assert.equal(s.character.command({kind:'enter',tower:wall}),false);
 const gate=add(s,'gate_y',49,50);assert.equal(planGroundRoofEntry(s.map,s.buildings,s.character.tile,wall),null);build(s,gate);
 const entry=planGroundRoofEntry(s.map,s.buildings,{x:45,y:45},wall);assert.equal(entry.access.id,gate.id);assert.equal(planGroundRoofEntry(s.map,s.buildings,{x:45,y:45},other),null);
 const exit=planRoofExit(s.map,s.buildings,wall,{kind:'move',goal:{x:45,y:45}});assert.equal(exit.accessId,gate.id);assert.deepEqual(exit.roofPath.at(-1),roofIndex(s.buildings).get(key(gate)));
});

test('roof routes join gate cells, corners and T branches through edges, and a tower connects its two sides',()=>{
 const s=scene(),gate=completed(s,'gate_y',49,50),left=completed(s,'wall',48,50),right=completed(s,'wall',52,50),north=completed(s,'wall',50,49),diagonal=completed(s,'wall',54,51);
 assert.equal(findRoofPath(s.buildings,left,right).length,4);assert.ok(findRoofPath(s.buildings,left,north));assert.equal(findRoofPath(s.buildings,right,diagonal),null);
 const tower=completed(s,'tower',53,49);assert.ok(findRoofPath(s.buildings,right,diagonal));assert.equal(new Set(roofIndex(s.buildings).keys()).size,11);assert.ok(findRoofPath(s.buildings,gate,tower));
});

test('ground-to-wall uses real gate stairs, keeps the pending target through mid-climb Load and descends through an access',()=>{
 const s=scene(),gate=completed(s,'gate_y',49,50),wall=completed(s,'wall',52,50);
 assert.equal(s.character.command({kind:'enter',tower:wall}),true);until(s,()=>s.character.state==='enteringTower');assert.equal(s.character.currentTower.id,gate.id);assert.equal(s.character.roofOrder.tower.id,wall.id);
 s.character.transitionTween.elapsed=350;const saved=validateGameState(serializeGameState(s)),r=scene(saved.terrain,false);loadGameState(r,structuredClone(saved));assert.equal(r.character.roofOrder.tower.id,wall.id);assert.equal(r.character.transitionTween.duration,550);const climb=r.animations.at(-1);r.player.setPosition(climb.x,climb.y);climb.onComplete();until(r,()=>r.character.state==='onWall'&&key(r.character.tile)===key(wall));assert.equal(r.character.roofOrder,null);
 assert.deepEqual(r.character.reservedTiles(),[],'ground traffic can pass below a roof actor');const target={x:45,y:45};assert.ok(r.character.command({kind:'move',goal:target}));until(r,()=>r.character.state==='exitingTower');assert.equal(r.character.currentTower.id,gate.id);const descent=r.animations.at(-1);r.player.setPosition(descent.x,descent.y);descent.onComplete();until(r,()=>r.character.state==='ground'&&key(r.character.tile)===key(target));validateGameState(serializeGameState(r));
});

test('registry rejects invalid gate geometry instead of introducing an unrestricted walkable footprint',()=>{
 const base=structuredClone(objectRegistry.require('gate_y'));
 for(const patch of [{width:2},{height:3},{navigation:{walkableTop:true,roofAccess:true,gateAxis:'z'}},{navigation:{walkableTop:true,gateAxis:'y'}}])assert.throws(()=>new ObjectRegistry([{...base,...patch,id:'bad_gate'}]));
});
