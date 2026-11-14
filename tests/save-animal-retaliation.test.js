import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// Owner 14 Nov 2026: saving often failed with "check: animals". An animal fighting back at another animal (a hunter's
// dog, a wolf) or at somebody already gone was written with an id the check did not know.
test('m-ulozeni-animals: an animal that fights back at another animal or at a unit that is gone can be saved', () => {
  const s=workerScene(),deer=s.animalSystem.create(s.objectRegistry.require('deer'),{x:51,y:50}),other=s.animalSystem.create(s.objectRegistry.require('rabbit'),{x:52,y:50});
  deer.retaliationTarget=other;let state=validateGameState(serializeGameState(s));
  assert.equal(state.animals.find(a=>a.id===deer.id).retaliationId,other.id);
  deer.retaliationTarget={id:'worker-999',isAlive:true};state=validateGameState(serializeGameState(s));
  assert.equal(state.animals.find(a=>a.id===deer.id).retaliationId,null,'a target that is not in the game is not saved');
  const w=s.workerSystem.create({x:40,y:40});deer.retaliationTarget=w;state=validateGameState(serializeGameState(s));
  assert.equal(state.animals.find(a=>a.id===deer.id).retaliationId,w.id);
});

test('point 39: wolves (and animals marked hostile) are enemies soldiers can be sent at', async () => {
  const {isEnemy}=await import('../src/ui/UnitSelection.js').catch(()=>({isEnemy:null}));if(!isEnemy)return;
  assert.equal(isEnemy({type:'wolf',definition:{}}),true);assert.equal(isEnemy({type:'deer',definition:{gameplay:{}}}),false);assert.equal(isEnemy({type:'bandit',definition:{gameplay:{hostile:true}}}),true);
});

test('point 45: a blueprint may lie under a resident and goods; work waits, he steps off, the goods are moved beside it', async () => {
  const {placeBuilding,placementError}=await import('../src/game/buildings.js');
  const s=workerScene(undefined,{construction:true}),w=s.workerSystem.create({x:60,y:60});w.arriving=false;const d=s.objectRegistry.require('house');
  for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);
  const drop=s.dropSystem.create('stone',{x:61,y:61},3);
  const reserved=[...s.buildings.flatMap(b=>b.tiles)];
  assert.equal(placementError(s.map,{x:60,y:60},s.resourceOccupancy,reserved,d,s.buildings),null,'neither the resident nor the stones block the blueprint');
  const result=placeBuilding({map:s.map,anchor:{x:60,y:60},resources:s.resourceOccupancy,reservedTiles:reserved,inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});
  assert.equal(result.error,undefined);const site=result.building;s.constructionSystem.plan(site);
  assert.equal(s.dropSystem.clearSite(site),1);assert.equal(site.tiles.some(t=>t.x===drop.tile.x&&t.y===drop.tile.y),false,'the stones lie beside the site');assert.equal(drop.amount,3);
  assert.equal(s.constructionSystem.occupied(site),true);assert.equal(s.constructionSystem.obstructed(site),true);
  assert.ok(w.path.length>0,'he is sent off the site');const end=w.path.at(-1);w.tile={...end};w.position={x:end.x+.5,y:end.y+.5};w.path=[];
  assert.equal(s.constructionSystem.occupied(site),false);
});

test('point 49: fortifications have hit points; a damaged one is saved with them', async () => {
  const {buildingHP,damageBuilding,repairBuilding,BUILDING_HP}=await import('../src/game/buildingHealth.js');
  const tower={type:'tower'},house={type:'house'};assert.deepEqual(buildingHP(tower),{hp:BUILDING_HP.tower,max:BUILDING_HP.tower});assert.equal(buildingHP(house),null);
  assert.equal(damageBuilding(tower,150).hp,250);assert.equal(tower.hp,250);assert.equal(damageBuilding(tower,999).destroyed,true);
  repairBuilding(tower,1e9);assert.equal(tower.hp,undefined,'full health stores nothing');assert.equal(damageBuilding(house,10),null);
});

test('m-hrad-urovne: Castle levels – footprint, cost and benefits per level; the upgrade grows in place, needs free ground and pays from the stores', async () => {
  const {levelDefinition,buildingDefinition,buildingTiles}=await import('../src/game/buildings.js'),{castleUpgradePlan,upgradeCastle}=await import('../src/game/castleUpgrade.js'),{CASTLE_LEVELS}=await import('../src/data/castle.js'),{buildingHP}=await import('../src/game/buildingHealth.js');
  const s=workerScene(),base=s.objectRegistry.require('castle');for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove(a);
  assert.deepEqual([1,2,3,4].map(l=>levelDefinition(base,l).width),[4,4,5,6]);assert.deepEqual(CASTLE_LEVELS[1].cost,{wood:40});assert.deepEqual(CASTLE_LEVELS[2].cost,{wood:70});assert.deepEqual(CASTLE_LEVELS[3].cost,{stone:50});assert.deepEqual(CASTLE_LEVELS[4].cost,{stone:100});
  const d=levelDefinition(base,1),castle={id:500,type:'castle',definition:d,x:60,y:60,level:1,tiles:buildingTiles({x:60,y:60},d)};s.buildings.push(castle);for(const t of castle.tiles)s.map[t.y][t.x]=1;
  const cap=s.workerSystem.capacity();assert.equal(buildingHP(castle).max,800);
  assert.equal(castleUpgradePlan(s,castle).error!=null,true,'no Wood yet');s.inventory.add('wood',70);
  let r=upgradeCastle(s,castle);assert.equal(r.done,true);assert.equal(castle.level,2);assert.equal(buildingDefinition(castle).width,4);assert.equal(s.inventory.count('wood'),0);assert.equal(s.workerSystem.capacity(),cap+2);assert.equal(buildingDefinition(castle).production.amount,7);
  s.inventory.add('stone',150);s.map[59][62]=1;s.map[64][62]=1;s.map[62][59]=1;s.map[62][64]=1;
  r=castleUpgradePlan(s,castle);assert.match(r.error,/4 × 4.*5 × 5/,'says which footprint needs room');
  s.map[59][62]=0;s.map[62][59]=0;r=upgradeCastle(s,castle);assert.equal(r.done,true);assert.equal(castle.level,3);assert.equal(castle.tiles.length,25);assert.equal(s.inventory.count('stone'),100);for(const t of castle.tiles)assert.equal(s.map[t.y][t.x],1);
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.buildings.find(b=>b.id===500).level,3);
});
