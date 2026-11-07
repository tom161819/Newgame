import { captureMapKnowledge } from '../src/game/mapMemoryObjects.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { MapMemory } from '../src/systems/MapMemory.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { serializeGameState,validateGameState,saveSchemaStatus,IncompatibleSaveError,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { saveRecordStatus,incompatibleSaveMessage } from '../src/ui/SaveLoadMenu.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { PauseManager } from '../src/systems/PauseManager.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { Inventory } from '../src/game/inventory.js';
import { PlayerController } from '../src/game/PlayerController.js';
import { AnimalSystem } from '../src/systems/AnimalSystem.js';
import { DropSystem } from '../src/systems/DropSystem.js';
import { TreasureSystem } from '../src/systems/TreasureSystem.js';
import { EquipmentSystem } from '../src/systems/EquipmentSystem.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { ProductionSystem } from '../src/systems/ProductionSystem.js';
import { FoodSystem } from '../src/systems/FoodSystem.js';
import { CombatSystem } from '../src/systems/CombatSystem.js';
import { PathWearSystem } from '../src/systems/PathWearSystem.js';
import { ExperienceSystem } from '../src/systems/ExperienceSystem.js';
import { GameActivityBus } from '../src/systems/GameActivityBus.js';
import { ResourceSpawner } from '../src/game/stones.js';
import { placeBuilding } from '../src/game/buildings.js';
import { wallIndex,connectionsFor } from '../src/game/walls.js';
import { tileCenter } from '../src/game/map.js';

function view(id,p){
  const data={objectId:id,definition:objectRegistry.require(id)};
  return {...p,depth:p.y,visible:true,setData(k,v){data[k]=v;return this;},getData(k){return data[k];},
    setPosition(x,y){Object.assign(this,{x,y});return this;},setDepth(depth){this.depth=depth;return this;},
    setVisible(value){this.visible=value;return this;},animate(){},setMounted(){},setOpened(){},destroy(){}};
}
function scene(terrain=Array.from({length:100},()=>Array(100).fill(0))){
  const s={objectRegistry,terrainGrid:terrain.map(r=>[...r]),map:terrain.map(r=>[...r]),inventory:new Inventory(),
    resources:new Map(),resourceOccupancy:new Map(),buildings:[],towerViews:new Map(),
    marker:{visible:false,setVisible(v){this.visible=v;}},showMarker(){this.marker.visible=true;},setStatus(){},updateBuildingUI(){},
    updateInventory(){},updateTimeDisplay(){},refreshVisibility(){},reservedTiles(){return [];},
    assets:{createView:view},animations:[],tweens:{add(config){const tween={...config,elapsed:0};s.animations.push(tween);return tween;}},
    addResource(d,tile){const v=view(d.id,tileCenter(tile));v.setData('tile',{...tile}).setData('object',{type:d.id,definition:d,x:tile.x,y:tile.y,tiles:[{...tile}]});this.resources.set(`${tile.x},${tile.y}`,v);this.resourceOccupancy.set(`${tile.x},${tile.y}`,`${tile.x},${tile.y}`);},
    createBuildingView(d,b){return view(d.id,tileCenter(b));},
    refreshWallConnections(){this.wallMap=wallIndex(this.buildings);for(const b of this.wallMap.values())b.connections=connectionsFor(this.wallMap,b);},
    settingsPanel:{settings:{fogOfWar:true,explorationMode:true},applySettings(settings){this.settings={...settings};}},fog:{setEnabled(){}},
    worldCamera:{following:false},cameras:{main:{zoom:.8,scrollX:3000,scrollY:2000,width:1000,height:640,
      setZoom(z){this.zoom=z;return this;},centerOn(x,y){this.scrollX=x-this.width/2;this.scrollY=y-this.height/2;return this;},preRender(){}}},
  };
  s.player=view('king',tileCenter({x:50,y:50}));s.character=new PlayerController(s,s.player,{x:50,y:50});
  s.fog=new FogOfWarSystem(s.character,true);s.mapMemory=new MapMemory(s.fog);
  s.gameTime=new GameTimeSystem();s.foodSystem=new FoodSystem(s.inventory,objectRegistry.require('meat'),()=>{},{time:s.gameTime});
  s.pathWear=new PathWearSystem({map:s.map,terrain:s.terrainGrid,time:s.gameTime});
  s.activities=new GameActivityBus();s.experienceSystem=new ExperienceSystem(s.activities);
  s.equipment=new EquipmentSystem(s.character,objectRegistry,s.inventory);s.production=new ProductionSystem(s.gameTime,s.inventory,()=>s.buildings);
  s.animalSystem=new AnimalSystem(s);s.dropSystem=new DropSystem(s);s.treasureSystem=new TreasureSystem(s);
  s.huntingSystem={target:null,repath:0};s.mountSystem={target:null,repath:0};s.combat=new CombatSystem();
  s.resourceSpawners=[new ResourceSpawner({map:s.map,resources:s.resourceOccupancy,getCount:()=>s.resources.size,getOrigins:()=>[s.character.tile],getReserved:()=>[],spawn:tile=>s.addResource(objectRegistry.require('stone'),tile)})];
  captureMapKnowledge(s);
  return s;
}
function fixture(){
  const s=scene();s.terrainGrid[2][2]=1;s.map[2][2]=1;s.inventory.add('stone',40);s.inventory.add('gold',71);s.inventory.add('meat',8);
  for(const type of ['basic_sword','basic_armor']){s.inventory.add(type);s.equipment.equip(type);}
  for(const [type,x,y]of [['castle',20,20],['tower',30,30],['wall',40,40],['wall',41,40]]){
    const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:[],inventory:s.inventory,buildings:s.buildings,definition:objectRegistry.require(type)});assert.ifError(result.error);
  }
  s.refreshWallConnections();s.addResource(objectRegistry.require('stone'),{x:60,y:60});
  const deer=s.animalSystem.create(objectRegistry.require('deer'),{x:54,y:50});deer.currentHP=19;deer.moveTo([{x:56,y:53}]);deer.update(130);
  s.animalSystem.create(objectRegistry.require('horse'),{x:50,y:51});
  s.dropSystem.create('meat',{x:57,y:50},15);const chest=s.treasureSystem.create({x:65,y:65});chest.opened=true;chest.looted=true;
  s.character.currentHP=62.75;s.character.command({kind:'move',goal:{x:60,y:60},pickupKey:'60,60'});s.character.update(90);
  s.gameTime.update(445000);s.foodSystem.elapsed=32123.45;s.resourceSpawners[0].elapsed=18456.78;
  captureMapKnowledge(s);
  return s;
}
function restore(data){const s=scene(data.terrain);loadGameState(s,data);return s;}
const cameraLabel={textContent:''};
// Loader má jediný DOM výstup; herní modely zůstávají skutečné.
globalThis.document={querySelector:()=>cameraLabel};

test('JSON roundtrip restores full model, exact in-flight movement, equipment, terrain, buildings, drops and timers',()=>{
  const original=fixture(),data=validateGameState(JSON.parse(JSON.stringify(serializeGameState(original)))),restored=restore(data);
  assert.deepEqual(serializeGameState(restored),data);assert.equal(restored.character.attackDPS,30);assert.equal(restored.character.armor,30);
  assert.equal(restored.map[20][20],1);assert.equal(restored.map[31][31],1);assert.equal(restored.map[2][2],1);
  assert.equal(restored.buildings.find(b=>b.x===40).connections.E,true);
  const position={...restored.character.position};restored.character.update(100);assert.notDeepEqual(restored.character.position,position);
  assert.equal(restored.treasureSystem.chests.values().next().value.looted,true);
  const gold=restored.inventory.count('gold');restored.production.processDay(data.time.day);assert.equal(restored.inventory.count('gold'),gold);
  restored.gameTime.update(35000);assert.equal(restored.inventory.count('gold'),gold+5);assert.equal(restored.gameTime.day,5);
  const count=restored.resources.size;restored.resourceSpawners[0].update(1543.22);assert.equal(restored.resources.size,count+1);
});

test('mounted save restores the same horse id and base statistics without applying equipment twice',()=>{
  const s=fixture(),horse=[...s.animalSystem.animals.values()].find(a=>a.type==='horse');horse.mounted=true;
  s.character.mountedHorse=horse;s.character.speed=7;const data=serializeGameState(s),r=restore(data);
  assert.equal(r.character.mountedHorse,r.animalSystem.animals.get(horse.id));assert.equal(r.character.speed,7);
  r.equipment.equip('basic_sword');assert.equal(r.character.attackDPS,30);assert.equal(r.character.baseStats.attackDPS,15);
  assert.deepEqual(serializeGameState(r),data);
});

test('rooftop route and a partially completed climb retain building references and continue instead of teleporting',()=>{
  const s=fixture(),wall=s.buildings.find(b=>b.type==='wall');
  s.character.state='onWall';s.character.currentTower=wall;s.character.tile={x:wall.x,y:wall.y};s.character.position={x:wall.x+.8,y:wall.y+.5};
  s.character.nextTile={x:41,y:40};s.character.path=[];s.character.order=null;
  s.character.roofContinuation={order:{kind:'move',goal:{x:45,y:45}},path:[{x:42,y:41}],destination:{x:45,y:45},exit:{x:41,y:41}};
  const r=restore(serializeGameState(s));assert.equal(r.character.currentTower,r.buildings.find(b=>b.id===wall.id));assert.deepEqual(r.character.roofContinuation.order.goal,{x:45,y:45});
  s.character.state='enteringTower';s.character.transitionTween={duration:900,elapsed:425};s.character.roofContinuation=null;
  const data=serializeGameState(s),climb=restore(data);assert.equal(climb.character.state,'enteringTower');assert.equal(climb.animations[0].duration,475);
  assert.deepEqual({x:climb.player.x,y:climb.player.y},{x:data.player.render.x,y:data.player.render.y});
  climb.animations[0].onComplete();assert.equal(climb.character.state,'onWall');assert.equal(climb.character.currentTower.id,wall.id);
});

test('combat targets and fixed unopened treasure contents survive restoration without random regeneration',()=>{
  const s=fixture(),deer=[...s.animalSystem.animals.values()][0];s.huntingSystem.target=deer;deer.retaliationTarget=s.character;
  s.combat.startAttack(s.character,deer);s.combat.startAttack(deer,s.character);const chest=[...s.treasureSystem.chests.values()][0];chest.opened=false;chest.looted=false;
  const r=scene(s.terrainGrid);r.treasureSystem.random=()=>{throw new Error('Treasure rerolled');};loadGameState(r,serializeGameState(s));
  const restoredDeer=r.animalSystem.animals.get(deer.id);assert.equal(r.combat.attacks.get(r.character),restoredDeer);assert.equal(restoredDeer.retaliationTarget,r.character);
  assert.equal(r.huntingSystem.target,restoredDeer);assert.deepEqual([...r.treasureSystem.chests.values()][0].contents,chest.contents);
});

test('corrupt versions, coordinates, references, overlaps, HP, equipment and clock are rejected before mutation',()=>{
  const original=serializeGameState(fixture());
  for(const corrupt of [s=>s.saveVersion=999,s=>s.terrain.pop(),s=>s.player.tile.x=-1,s=>s.player.currentHP=200,
    s=>s.player.horseId='missing',s=>s.animals.push(s.animals[0]),s=>{s.buildings[1].x=20;s.buildings[1].y=20;},
    s=>s.equipment.weapon='basic_armor',s=>s.inventory.basic_sword=0,s=>s.time.elapsed=120000,
    s=>s.time.totalElapsed=0,s=>s.spawners[0].elapsed=-1,s=>s.chests[0].contents.gold=101,
    s=>s.commands.attacks=[['king','missing']],s=>s.player.order={kind:'openChest',chestId:'missing'}]){
    const data=structuredClone(original);corrupt(data);const target=scene();assert.throws(()=>loadGameState(target,data));assert.equal(target.buildings.length,0);assert.equal(target.inventory.count('gold'),0);
  }
});

test('alpha saves load only the current schema; older or newer versions are reported as incompatible without mutation',()=>{
  const original=serializeGameState(fixture());assert.equal(original.saveVersion,SAVE_VERSION);
  assert.deepEqual(saveSchemaStatus(original),{compatible:true,savedVersion:SAVE_VERSION,currentVersion:SAVE_VERSION});
  for(const version of [1,SAVE_VERSION-1,SAVE_VERSION+1]){
    const data=structuredClone(original);data.saveVersion=version;const before=structuredClone(data),target=scene(),empty=serializeGameState(target);
    assert.deepEqual(saveSchemaStatus(data),{compatible:false,savedVersion:version,currentVersion:SAVE_VERSION});
    assert.throws(()=>validateGameState(data),error=>error instanceof IncompatibleSaveError&&error.savedVersion===version&&error.currentVersion===SAVE_VERSION&&error.message.includes(`schema ${version}`));
    assert.throws(()=>loadGameState(target,data),IncompatibleSaveError);
    assert.deepEqual(data,before,'the stored save is never converted');assert.deepEqual(serializeGameState(target),empty,'the running world is unchanged');
  }
  for(const version of [undefined,null,'12',12.5]){
    const data=structuredClone(original);data.saveVersion=version;
    assert.throws(()=>validateGameState(data),error=>!(error instanceof IncompatibleSaveError)&&/damaged|poškozená/.test(error.message));
  }
  assert.throws(()=>validateGameState(null),error=>!(error instanceof IncompatibleSaveError));
});

test('save list status reads the stored schema and offers a new game without deleting the slot',()=>{
  const state=serializeGameState(fixture());
  assert.equal(saveRecordStatus({saveVersion:SAVE_VERSION,state}).compatible,true);
  const old={id:'a',name:'Old kingdom',saveVersion:SAVE_VERSION-1,state:{...state,saveVersion:SAVE_VERSION-1}},status=saveRecordStatus(old);
  assert.deepEqual(status,{compatible:false,savedVersion:SAVE_VERSION-1,currentVersion:SAVE_VERSION});
  assert.equal(saveRecordStatus({saveVersion:SAVE_VERSION-1}).savedVersion,SAVE_VERSION-1,'record metadata is enough to flag a slot');
  assert.equal(saveRecordStatus({}).savedVersion,null);
  const message=incompatibleSaveMessage(old.name,status);
  assert.match(message,new RegExp(`"Old kingdom" uses save schema ${SAVE_VERSION-1}`));assert.match(message,new RegExp(`loads only schema ${SAVE_VERSION}`));
  assert.match(message,/stays stored until you delete it/);assert.match(message,/Start a new game instead\?/);
});

test('central pause retains independent menu/settings reasons and resumes only after both close',()=>{
  const calls=[],manager=new PauseManager({setPaused:value=>calls.push(value)});
  manager.set('settings',true);manager.set('menu',true);manager.set('settings',false);assert.equal(manager.paused,true);
  manager.set('menu',false);assert.equal(manager.paused,false);assert.deepEqual(calls,[true,true,true,false]);
});

test('wear scores, levels and last passage survive world save/load; old saves default to untouched grass',()=>{
  const s=fixture();for(let i=0;i<16;i++)s.pathWear.enter(s.character,{x:55,y:55});
  const data=serializeGameState(s),r=restore(data);assert.deepEqual(r.pathWear.exportState(),s.pathWear.exportState());assert.equal(r.pathWear.level({x:55,y:55}),3);
  for(const corrupt of [s=>s.pathWear.scores.pop(),s=>s.pathWear.levels[5555]=1,s=>s.pathWear.lastPassDays[5555]=999,s=>s.pathWear.lastDecayDay=999]){
    const bad=structuredClone(data);corrupt(bad);assert.throws(()=>validateGameState(bad));
  }
  const legacy=structuredClone(data);delete legacy.pathWear;delete legacy.settings.pathWearDebug;
  const old=restore(legacy);assert.ok(old.pathWear.scores.every(n=>n===0));assert.equal(old.gameTime.day,data.time.day);
});

test('individual XP and processed events roundtrip; older saves get level one and malformed XP is rejected',()=>{
  const s=fixture();s.experienceSystem.addXP(s.character,101);const event=s.activities.emit('resourceCollected',{actor:s.character,objectType:'stone'});
  const data=serializeGameState(s),r=restore(data);assert.deepEqual(r.character.experience,s.character.experience);assert.deepEqual(r.experienceSystem.exportState(),s.experienceSystem.exportState());
  r.activities.emit(event.type,{actor:r.character,objectType:'stone'},event.id);assert.equal(r.character.experience.totalXP,104);
  for(const corrupt of [s=>s.player.experience.level=51,s=>s.player.experience.totalXP=999,s=>s.player.experience.currentXP=139,s=>s.player.experience.modifiers.invalid=-1,
    s=>s.experienceSystem.processedEventIds.push(s.experienceSystem.processedEventIds[0]),s=>s.experienceSystem.nextEventId=1]){
    const bad=structuredClone(data);corrupt(bad);assert.throws(()=>validateGameState(bad));
  }
  const legacy=structuredClone(data);delete legacy.player.experience;delete legacy.experienceSystem;const old=restore(legacy);
  assert.equal(old.character.experience.level,1);assert.equal(old.character.experience.totalXP,0);assert.equal(old.experienceSystem.exportState().processedEventIds.length,0);
});
