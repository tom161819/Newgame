import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,placementError,wallsReplacedBy,buildingTiles } from '../src/game/buildings.js';
import { placeWallLine,wallIndex,gateAxis,gateAxisLocked,turnGate } from '../src/game/walls.js';
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
  for(const id of ['wall','tower','wall_gate'])assert.equal(objectRegistry.require(id).repeatPlacement,true,id);
  assert.deepEqual(objectRegistry.buildables().filter(d=>d.replacesWall).map(d=>d.id).sort(),['tower','wall_gate']);
  const registry=new ObjectRegistry(objectRegistry.all()),base=structuredClone(registry.require('tower'));
  assert.throws(()=>registry.register({...base,id:'bad_replace',replacesWall:'yes'}),/hradby/);
});

test('a Gate replaces a planned wall segment: the site is cancelled with its refund and the joints stay connected',()=>{
  const s=scene(),line=walls(s,row(60,50,5)),middle=line[2],before=stone(s);
  assert.equal(err(s,'wall_gate',{x:62,y:50}),null,'a planned wall does not block a Gate');
  assert.ok(err(s,'house',{x:62,y:50}),'other buildings are still blocked by a wall');
  const result=place(s,'wall_gate',{x:62,y:50});assert.ifError(result.error);
  assert.deepEqual(result.replaced.map(b=>b.id),[middle.id]);assert.equal(s.buildings.includes(middle),false);assert.equal(s.constructionSystem.sites.has(middle.id),false);
  assert.equal(stone(s),before+1,'the unstarted segment returns its booked stone');assert.deepEqual(result.refund,{},'no demolition refund for a plan');
  const gate=result.building,index=wallIndex(s.buildings,true);assert.equal(gateAxis(index,gate),'x','the Gate follows the east–west wall');
  assert.equal(s.buildings.filter(b=>b.type==='wall'&&b.y===50).length,4);
  assert.deepEqual(s.buildings.filter(b=>b.type==='wall'&&(b.x===61||b.x===63)).map(b=>wallIndex(s.buildings,true).has(`${b.x+(b.x===61?1:-1)},50`)),[true,true]);
  assert.match(err(s,'wall_gate',{x:62,y:50}),/./,'a Gate never replaces a Gate');
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
  const g=place(s,'wall_gate',{x:61,y:50});assert.ifError(g.error);assert.deepEqual(g.refund,{});
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

test('R turns a lone Gate; on a wall run the wall decides and R does nothing; the axis is saved',()=>{
  const s=scene();walls(s,row(60,50,3),{planned:false});
  const index=wallIndex(s.buildings,true);
  assert.deepEqual(turnGate(index,{x:70,y:70},'y'),{axis:'x',locked:false});assert.deepEqual(turnGate(index,{x:70,y:70},'x'),{axis:'y',locked:false});
  assert.deepEqual(turnGate(index,{x:61,y:50},'y'),{axis:'y',locked:true},'east–west wall under the cursor');
  assert.equal(gateAxisLocked(index,{x:61,y:51}),true,'a wall to the north decides too');assert.equal(gateAxisLocked(index,{x:62,y:51}),true);
  const lone=place(s,'wall_gate',{x:70,y:70},{fields:{gateAxis:'x'}});assert.ifError(lone.error);
  assert.equal(lone.building.gateAxis,'x');assert.equal(gateAxis(wallIndex(s.buildings,true),lone.building),'x');
  assert.equal(gateAxis(wallIndex(s.buildings,true),{x:80,y:80}),'y','older Gates without an axis keep the old look');
  const state=validateGameState(serializeGameState(s));assert.equal(state.buildings.find(b=>b.id===lone.building.id).gateAxis,'x');
  const r=workerScene(state.terrain,{construction:true,foodProduction:true,logistics:true,starter:false});loadGameState(r,structuredClone(state));
  assert.equal(r.buildings.find(b=>b.id===lone.building.id).gateAxis,'x');
  for(const mutate of [x=>{x.buildings.find(b=>b.id===lone.building.id).gateAxis='z';},x=>{x.buildings.find(b=>b.type==='wall').gateAxis='x';}]){const bad=structuredClone(state);mutate(bad);assert.throws(()=>validateGameState(bad));}
});

test('a Well may stand anywhere buildable: far from every house and on a worn path; its housing bonus is unchanged',()=>{
  const s=scene(),def=s.objectRegistry.require('well');ensureBuildingPrerequisites(s,def);
  const context={has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}};
  const at=(x,y)=>placementError(s.map,{x,y},context,[],def,s.buildings);
  const house=s.buildings.find(b=>b.type==='house');assert.ok(Math.hypot(90-house.x,90-house.y)>20);assert.equal(at(90,90),null,'far from every house');
  s.pathWear.levels[s.pathWear.index({x:88,y:88})]=3;s.pathWear.setPaved({x:86,y:86},true);assert.equal(at(88,88),null);assert.equal(at(86,86),null);
  assert.ok(placementError(s.map,{x:88,y:88},context,[],s.objectRegistry.require('swing_tree'),s.buildings),'other decorations still avoid paths');
});
