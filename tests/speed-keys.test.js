import test from 'node:test';
import assert from 'node:assert/strict';
import { stepSpeed } from '../src/ui/SpeedControls.js';
test('m-klavesy-rychlost: + and − step pause ↔ 1× ↔ 2× ↔ 3× without wrapping', () => {
  assert.equal(stepSpeed(true,2,1),1);assert.equal(stepSpeed(false,1,1),2);assert.equal(stepSpeed(false,3,1),3);
  assert.equal(stepSpeed(false,3,-1),2);assert.equal(stepSpeed(false,1,-1),0);assert.equal(stepSpeed(true,1,-1),0);
});
test('m-sklady-co-patri: a store lists what it takes, also at 0, and names the missing maker', async () => {
  const { storeAccepts } = await import('../src/ui/StoragePanel.js');
  const scene={buildings:[{type:'lumberjack_hut'}]},rows=storeAccepts(scene,{allowed:['pitch','torch'],stock:{torch:3}});
  assert.deepEqual(rows,[{resource:'pitch',count:0,missing:'pitch_kiln'},{resource:'torch',count:3,missing:'pitch_kiln'}]);
  assert.equal(storeAccepts(scene,{allowed:['wood'],stock:{}})[0].missing,null);
});
test('m-okno-budovy-sklad: a building lists its own stores – input and output of a workshop, the pile of a producer', async () => {
  const { ownStoreRows } = await import('../src/ui/WorkplacePanel.js');
  const locs=[{id:'input-5',buildingId:5,kind:'input',capacity:20,allowed:['wheat'],stock:{wheat:4}},{id:'output-5',buildingId:5,kind:'output',capacity:20,allowed:['flour'],stock:{flour:20}},{id:'granary-1',buildingId:1,kind:'storage',capacity:100,allowed:['wheat'],stock:{}}];
  const storage={locations:new Map(locs.map(l=>[l.id,l])),isStock:l=>l.kind==='storage',used:l=>Object.values(l.stock).reduce((a,b)=>a+b,0),incoming:(id,r)=>id==='input-5'&&r==='wheat'?2:0,reserved:()=>0};
  const rows=ownStoreRows({foodStorage:storage},{id:5});
  assert.deepEqual(rows.map(r=>[r.kind,r.used,r.full]),[['input',4,false],['output',20,true]]);assert.deepEqual(rows[0].goods,[{resource:'wheat',amount:4,incoming:2,reserved:0}]);
});
test('m-vez-otaceni: a Tower keeps its facing in the save; a wrong one is refused', async () => {
  const { workerScene } = await import('./helpers/workerScene.js');const { placeBuilding } = await import('../src/game/buildings.js');
  const { serializeGameState,validateGameState } = await import('../src/systems/GameStateSerializer.js');globalThis.document??={querySelector:()=>({textContent:''})};
  const s=workerScene(undefined,{construction:true}),d=s.objectRegistry.require('tower');for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const r=placeBuilding({map:s.map,anchor:{x:60,y:60},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,fields:{facing:3}});assert.ifError(r.error);s.constructionSystem?.plan?.(r.building);
  const data=validateGameState(serializeGameState(s));assert.equal(data.buildings.find(b=>b.id===r.building.id).facing,3);
  const bad=structuredClone(data);bad.buildings.find(b=>b.id===r.building.id).facing=5;assert.throws(()=>validateGameState(bad));
});
test('m-minimapa-loziska: the minimap lists only explored deposits with stone left, free ones marked free', async () => {
  const { minimapDeposits } = await import('../src/ui/Minimap.js');
  const dep=(id,type,x,y,remaining,bound=null)=>({x,y,type,definition:{width:2,height:2},natural:{id,remaining,boundBuildingId:bound}});
  const deposits=[dep('a','stone_deposit',10,10,50),dep('b','stone_deposit_large',20,20,50,7),dep('c','stone_deposit',30,30,0),dep('d','stone_deposit',40,40,50),dep('e','iron_deposit',12,12,40)];
  const explored=new Uint8Array(100*100);for(const d of [deposits[0],deposits[1],deposits[2],deposits[4]])explored[d.y*100+d.x]=1;
  const scene={fog:{enabled:true,width:100,explored,isInSightTile:()=>false},naturalResources:{mining:{deposits:()=>deposits}}};
  assert.deepEqual(minimapDeposits(scene,'stone').map(d=>[d.id,d.free]),[['a',true],['b',false]]);
  assert.deepEqual(minimapDeposits(scene,'iron').map(d=>d.id),['e']);
});
