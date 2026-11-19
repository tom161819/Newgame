import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { ObjectRegistry,objectRegistry } from '../src/systems/ObjectRegistry.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { MOVEMENT_SPEED_SCALE as S } from '../src/data/movement.js';
globalThis.document={querySelector:()=>({textContent:''})};
// These logistics tests use a Stone Tower and a Warehouse as plain 10-Stone sites; their arithmetic is about bookings and
// deliveries, not about price, so they keep that fixed price whatever the owner sets in the game (0.49 price sync).
// m-sklady-materialu-koncept: stone and wood live in a Material Yard (placed at 49,45 so the 4×2 yard leaves 53,45 free).
const REGISTRY=new ObjectRegistry(objectRegistry.all().map(d=>d.id==='tower'||d.id==='material_yard'?{...d,cost:{stone:10}}:d));
const scene=()=>{const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.objectRegistry=REGISTRY;return s;};
const starter=s=>`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;
function site(s,type,x,y){s.inventory.add('stone',80);s.inventory.add('wood',80);const d=s.objectRegistry.require(type);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.buildings.flatMap(b=>b.tiles),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(result.error);s.constructionSystem.plan(result.building);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
const inside=(b,w)=>b.tiles.some(t=>t.x===w.tile.x&&t.y===w.tile.y);
function walk(s,ws,p,max=120000){let n=0;while(!p()&&n<max){s.tick(25);n+=25;}assert.ok(p(),JSON.stringify(ws.map(w=>({t:w.tile,c:w.commandState,p:w.path.length}))));}

// Owner 19 Nov 2026 (76): people under a blueprint walk on and keep off it; soldiers holding there stand beside it.
test('a soldier holding a place under a new blueprint moves his hold beside it and keeps holding there',()=>{
  const s=scene(),w=s.workerSystem.create({x:40,y:45});s.workerSystem.commands.move([w],{x:52,y:45});walk(s,[w],()=>w.commandState?.state==='Holding');
  const b=site(s,'smelter',51,44);assert.ok(inside(b,w));walk(s,[w],()=>!inside(b,w)&&w.commandState.state==='Holding');
  assert.equal(Math.max(...b.tiles.map(t=>Math.max(Math.abs(t.x-w.tile.x),Math.abs(t.y-w.tile.y))))<=3+2,true);assert.deepEqual(w.commandState.goal,w.tile);
  assert.equal(s.constructionSystem.occupied(b),false);s.tick(5000);assert.equal(inside(b,w),false);
});
test('a group holding under a blueprint spreads to distinct free tiles round it',()=>{
  const s=scene(),ws=[0,1,2,3,4].map(i=>s.workerSystem.create({x:40,y:43+i}));s.workerSystem.commands.move(ws,{x:52,y:45});walk(s,ws,()=>ws.every(w=>w.commandState?.state==='Holding'));
  const xs=ws.map(w=>w.tile.x),ys=ws.map(w=>w.tile.y),b=site(s,'material_yard',Math.min(...xs),Math.min(...ys));const under=ws.filter(w=>inside(b,w));assert.ok(under.length>=2);
  walk(s,ws,()=>ws.every(w=>!inside(b,w)&&w.commandState.state==='Holding'));assert.equal(new Set(ws.map(w=>`${w.tile.x},${w.tile.y}`)).size,ws.length);assert.equal(s.constructionSystem.occupied(b),false);
});
test('a resident walking across a new blueprint goes on to his target round it',()=>{
  const s=scene(),w=s.workerSystem.create({x:40,y:45});s.workerSystem.commands.move([w],{x:72,y:45});walk(s,[w],()=>w.tile.x>=52);
  const b=site(s,'smelter',w.tile.x-1,w.tile.y-1);assert.ok(inside(b,w));walk(s,[w],()=>w.commandState?.state==='Holding');assert.deepEqual(w.tile,{x:72,y:45});
});
