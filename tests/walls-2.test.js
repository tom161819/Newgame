import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,placementError,wallsReplacedBy,buildingTiles } from '../src/game/buildings.js';
import { placeWallLine,wallIndex,gateAxis,gateAxisLocked,turnGate,isWallAccess,wallLayout } from '../src/game/walls.js';
import { replaceWalls } from '../src/game/wallReplacement.js';
import { ObjectRegistry,objectRegistry } from '../src/systems/ObjectRegistry.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
// m-staveni-zdi-studna (59, 61): repeat placement of walls, a Gate or Tower over a wall, Gate rotation, a Well anywhere.
globalThis.document??={querySelector:()=>({textContent:''})};
const scene=()=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.workerSystem.unsubscribe();return s;};
const row=(x,y,n)=>Array.from({length:n},(_,i)=>({x:x+i,y}));
function walls(s,tiles,{planned=true}={}){
  const d=s.objectRegistry.require('wall');ensureBuildingPrerequisites(s,d);s.inventory.add('stone',tiles.length);
  const result=placeWallLine({map:s.map,tiles,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),buildings:s.buildings,definition:d,inventory:s.inventory});assert.ifError(result.error);
  for(const b of result.buildings){if(planned)s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(d,b));}s.refreshWallConnections();return result.buildings;
}
function place(s,type,anchor,extra={}){
  const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const result=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,replaceWalls:(w,b)=>replaceWalls(s,w,b),...extra});
  if(!result.error){s.constructionSystem.plan(result.building);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));}return result;
}
const err=(s,type,anchor)=>placementError(s.map,anchor,s.resourceOccupancy,s.reservedTiles(),s.objectRegistry.require(type),s.buildings);
const stone=s=>s.inventory.count('stone')+[...s.dropSystem.drops.values()].filter(d=>d.resource==='stone').reduce((n,d)=>n+d.amount,0);

test('Stone Wall, Tower and Gate keep their placement tool; replacesWall is validated',()=>{
  for(const id of ['wall','tower','gate'])assert.equal(objectRegistry.require(id).repeatPlacement,true,id);
  assert.deepEqual(objectRegistry.buildables().filter(d=>d.replacesWall).map(d=>d.id).sort(),['gate','tower']);
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  assert.throws(()=>registry.register({...base,id:'bad_replace',replacesWall:'yes'}),/hradby/);
});

test('m-brana-2x2: a 2 × 2 Gate replaces two planned wall segments: their sites are cancelled with refunds and the walls join its sides',()=>{
  const s=scene(),line=walls(s,row(60,50,5)),before=stone(s);
  assert.equal(err(s,'gate',{x:62,y:49}),null,'planned walls do not block a Gate');
  assert.ok(err(s,'house',{x:62,y:49}),'other buildings are still blocked by a wall');
  const result=place(s,'gate',{x:62,y:49});assert.ifError(result.error);
  assert.deepEqual(result.replaced.map(b=>b.x).sort(),[62,63]);for(const b of result.replaced){assert.equal(s.buildings.includes(b),false);assert.equal(s.constructionSystem.sites.has(b.id),false);}
  assert.equal(stone(s),before+2,'the unstarted segments return their booked stone');assert.deepEqual(result.refund,{},'no demolition refund for a plan');
  const gate=result.building,index=wallIndex(s.buildings,true);assert.equal(gateAxis(index,gate),'x','the Gate follows the east–west wall');
  assert.deepEqual(s.buildings.filter(b=>b.type==='wall'&&b.y===50).map(b=>b.x).sort(),[60,61,64]);void line;
  assert.match(err(s,'gate',{x:62,y:49}),/./,'a Gate never replaces a Gate');
  validateGameState(serializeGameState(s));
});

test('a Tower replaces finished wall segments and gives back the demolition refund (half, rounded down)',()=>{
  const s=scene(),line=walls(s,row(60,50,6),{planned:false});s.refreshWallConnections();
  for(const b of line)assert.equal(s.map[50][b.x],1);const before=stone(s);
  const result=place(s,'tower',{x:62,y:49});assert.ifError(result.error);
  assert.deepEqual(result.replaced.map(b=>b.x).sort(),[62,63]);assert.deepEqual(result.refund,{stone:1},'2 stone paid, half back');
  assert.equal(stone(s),before+1);assert.equal(s.buildings.filter(b=>b.type==='wall').length,4);
  for(const t of result.building.tiles)assert.equal(s.map[t.y][t.x],1);
  assert.ok(s.buildings.every(b=>b===result.building||!b.tiles.some(t=>result.building.tiles.some(p=>p.x===t.x&&p.y===t.y))),'nothing else stands under the Tower');
  // A single 1-stone segment refunds nothing (floor of 0.5); a priced one refunds half.
  const g=place(s,'gate',{x:64,y:49});assert.ifError(g.error);assert.deepEqual(g.refund,{stone:1},'two 1-stone segments: half of 2');
  const priced=s.buildings.find(b=>b.type==='wall'&&b.x===60);priced.construction={state:'complete',investedMaterials:{stone:4}};
  const direct=replaceWalls(s,[priced],{x:60,y:50,tiles:[{x:60,y:50}]})();assert.deepEqual(direct,{stone:2});
  validateGameState(serializeGameState(s));
});

test('the King standing on a finished segment blocks its replacement; without a replacer a wall still blocks',()=>{
  const s=scene(),line=walls(s,row(60,50,3),{planned:false});
  s.character.state='onWall';s.character.currentTower=line[1];
  const king=placementError(s.map,{x:61,y:50},{has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}},s.reservedTiles(),s.objectRegistry.require('wall_gate'),s.buildings);
  assert.ok(king,'the King is on that segment');
  s.character.state='ground';s.character.currentTower=null;
  const d=s.objectRegistry.require('wall_gate');s.inventory.add('stone',5);
  assert.ok(placeBuilding({map:s.map,anchor:{x:61,y:50},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d}).error,'no replacer, no replacement');
  assert.equal(wallsReplacedBy(s.buildings,buildingTiles({x:61,y:50},d),d).length,1);
  assert.deepEqual(wallsReplacedBy(s.buildings,buildingTiles({x:61,y:50},s.objectRegistry.require('house')),s.objectRegistry.require('house')),[]);
});

test('R turns a lone Gate; on a wall run the wall decides; the axis is saved',()=>{
  const s=scene();walls(s,row(60,50,3),{planned:false});
  const index=wallIndex(s.buildings,true),gd=s.objectRegistry.require('gate'),at=(x,y)=>({x,y,definition:gd});
  assert.deepEqual(turnGate(index,at(70,70),'y'),{axis:'x',locked:false});assert.deepEqual(turnGate(index,at(70,70),'x'),{axis:'y',locked:false});
  assert.deepEqual(turnGate(index,at(63,49),'y'),{axis:'y',locked:true},'east–west wall beside the Gate');
  // Owner 20 Nov 2026: a wall running past a side (parallel to it) does not decide; one leading away from the side does.
  assert.equal(gateAxisLocked(index,at(61,51)),false,'the east–west run passes along the north side');
  assert.equal(gateAxisLocked(index,at(60,51)),false,'nor when it ends past the corner');
  const tee=wallIndex([...s.buildings,{type:'wall',x:61,y:49,id:-1,construction:{state:'complete'}}],true);
  assert.equal(gateAxis(tee,at(63,49)),'x');
  const lone=place(s,'gate',{x:70,y:70},{fields:{gateAxis:'x'}});assert.ifError(lone.error);
  assert.equal(lone.building.gateAxis,'x');assert.equal(gateAxis(wallIndex(s.buildings,true),lone.building),'x');
  assert.equal(gateAxis(wallIndex(s.buildings,true),{x:80,y:80}),'y','older Gates without an axis keep the old look');
  const state=validateGameState(serializeGameState(s));assert.equal(state.buildings.find(b=>b.id===lone.building.id).gateAxis,'x');
  const r=workerScene(state.terrain,{construction:true,foodProduction:true,logistics:true,starter:false});loadGameState(r,structuredClone(state));
  assert.equal(r.buildings.find(b=>b.id===lone.building.id).gateAxis,'x');
  for(const mutate of [x=>{x.buildings.find(b=>b.id===lone.building.id).gateAxis='z';},x=>{x.buildings.find(b=>b.type==='wall').gateAxis='x';}]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));}
});

test('m-brana-2x2: walls touching a finished Gate are where the King climbs; the old 1 × 1 Gate still loads',()=>{
  const s=scene(),line=walls(s,row(60,50,5),{planned:false});s.refreshWallConnections?.();
  const g=place(s,'gate',{x:62,y:49});assert.ifError(g.error);g.building.construction.state='complete';g.building.construction.workDone=g.building.construction.requiredWork;
  const beside=s.buildings.find(b=>b.type==='wall'&&b.x===61);assert.equal(isWallAccess(beside,s.buildings),true);
  assert.equal(isWallAccess(s.buildings.find(b=>b.type==='wall'&&b.x===60),s.buildings),false,'a wall away from the Gate is not');void line;
  assert.equal(objectRegistry.require('wall_gate').buildable,false,'the 1 × 1 Gate is no longer built');
});

test('a Well may stand anywhere buildable: far from every house and on a worn path; its housing bonus is unchanged',()=>{
  const s=scene(),def=s.objectRegistry.require('well');ensureBuildingPrerequisites(s,def);
  const context={has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}};
  const at=(x,y)=>placementError(s.map,{x,y},context,[],def,s.buildings);
  const house=s.buildings.find(b=>b.type==='house');assert.ok(Math.hypot(90-house.x,90-house.y)>20);assert.equal(at(90,90),null,'far from every house');
  s.pathWear.levels[s.pathWear.index({x:88,y:88})]=3;s.pathWear.setPaved({x:86,y:86},true);assert.equal(at(88,88),null);assert.equal(at(86,86),null);
  assert.ok(placementError(s.map,{x:88,y:88},context,[],s.objectRegistry.require('swing_tree'),s.buildings),'other decorations still avoid paths');
});

test('a wall meeting a finished Gate on its wall side runs into it; on the passage side it keeps its end',()=>{
  const s=scene();walls(s,row(60,50,2),{planned:false});walls(s,[{x:64,y:50},{x:62,y:52}],{planned:false});
  const gate=place(s,'gate',{x:62,y:50},{fields:{gateAxis:'x'}});assert.ifError(gate.error);gate.building.construction.state='complete';
  const links=b=>wallLayout(s.buildings).walls.find(w=>w.building.x===b.x&&w.building.y===b.y).connections;
  assert.equal(links({x:61,y:50}).E,true,'west wall joins the Gate');assert.equal(links({x:64,y:50}).W,true,'east wall joins the Gate');
  assert.equal(links({x:62,y:52}).N,false,'a wall at the gateway keeps its end');
});
