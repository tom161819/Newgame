import test from 'node:test';
import assert from 'node:assert/strict';
import { gameSettings,DEFAULT_GAME_SETTINGS,WILDLIFE_INTERVALS } from '../src/systems/GameSettings.js';
import { workerScene } from './helpers/workerScene.js';
import { createStartingCastle } from '../src/systems/WorldGenerationConfig.js';
import { createMap } from '../src/game/map.js';
import { tileKey } from '../src/game/stones.js';
import { buildingIsComplete,approachTower } from '../src/game/buildings.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { FogOfWarSystem } from '../src/systems/FogOfWarSystem.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { ConstructionSystem } from '../src/systems/ConstructionSystem.js';
globalThis.document={querySelector:()=>({textContent:''})};
const configured=options=>workerScene(undefined,{gameSettings:gameSettings(options)});
const counts=s=>Object.fromEntries(['rabbit','deer','wild_boar'].map(type=>[type,[...s.animalSystem.animals.values()].filter(a=>a.type===type).length]));
const remove=(s,type,n=1)=>{for(const a of [...s.animalSystem.animals.values()].filter(a=>a.type===type).slice(0,n))s.animalSystem.remove(a);};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);

test('advanced central defaults validate all fields, including the four starting resources, and reject malformed day, toggle, gold and respawn settings',()=>{
  assert.deepEqual(DEFAULT_GAME_SETTINGS,{difficulty:'normal',wildlifePopulation:'normal',treasureCount:1,initialStoneCount:30,fogOfWar:true,explorationMode:true,seasonsEnabled:true,startingCastle:false,dayLengthSeconds:120,wildlifeRespawn:'normal',startingGold:0,startingStone:0,startingWood:0,startingIronOre:0,startingBread:0,autoEmployment:true,worldCode:null,nightWolves:true,nightThieves:true,nightFires:true,winterHeating:true,startingGarrison:false,mapSize:100});
  for(const bad of [null,[],42,{worldCode:'MKW5-1-1'},{worldCode:'mkw5-155515555555-abc'},{worldCode:'MKW0-155515555555-ABC'},{fogOfWar:'true'},{autoEmployment:'yes'},{startingCastle:1},{startingGarrison:'yes'},{dayLengthSeconds:0},{dayLengthSeconds:90},{wildlifeRespawn:'bad'},{startingGold:-25},{startingGold:501},{startingGold:1},{mapSize:120},{mapSize:'200'}])assert.throws(()=>gameSettings(bad));
  assert.doesNotThrow(()=>gameSettings({startingGold:500,dayLengthSeconds:240,wildlifeRespawn:'off',startingCastle:true,fogOfWar:false,worldCode:'MKW5-155515555555-7KQ9X2'}));
  // m-kamenolom-u-hradu: a saved game keeps the code of the generator it was made with (New Game refuses old codes elsewhere).
  assert.equal(gameSettings({worldCode:'MKW2-155515555555-7KQ9X2'}).worldCode,'MKW2-155515555555-7KQ9X2');
});
test('starting castle is one finished reachable level 1 building (4x4, m-hrad-urovne) for free across random maps and has existing production and roof interactions',()=>{
  for(let seed=1;seed<=15;seed++){
    let n=seed;const terrain=createMap(()=>((n=Math.imul(n,1664525)+1013904223>>>0)/2**32)),s=workerScene(terrain,{gameSettings:gameSettings({startingCastle:true})});
    s.character.tile={x:50,y:50};s.character.position={x:50.5,y:50.5};const before=s.inventory.exportState(),b=createStartingCastle(s,s.character.tile);
    assert.equal(s.buildings.length,1);assert.equal(b.type,'castle');assert.equal(b.tiles.length,16);assert.equal(b.level,1);assert.ok(buildingIsComplete(b));assert.equal(b.construction,undefined);assert.deepEqual(s.inventory.exportState(),before);
    assert.ok(approachTower(s.map,s.character.tile,b));assert.equal(b.definition.interactions.includes('enter'),false,'the hall has no platform to climb');for(const t of b.tiles)assert.equal(s.map[t.y][t.x],1);
    assert.equal(s.production.dailyIncome().gold,5);s.gameTime.update(s.gameTime.dayDuration);assert.equal(s.inventory.count('gold'),5);
  }
  const s=configured({startingCastle:false});assert.equal(createStartingCastle(s,s.character.tile),null);assert.equal(s.buildings.length,0);
});
test('60/120/240-second days pay the same daily income and pro-rated wages with one event per day independent of FPS',()=>{
  for(const seconds of [60,120,240])for(const fps of [30,60,144]){
    const s=configured({dayLengthSeconds:seconds,startingCastle:true}),w=s.workerSystem.create({x:42,y:42});s.workerSystem.jobs.assign(w,'miner');createStartingCastle(s,s.character.tile);s.inventory.add('gold',10);let events=0;s.gameTime.onNewDay(()=>events++);
    for(let i=0;i<seconds*fps;i++)s.gameTime.update(1000/fps);
    assert.equal(s.gameTime.day,2);assert.equal(events,1);near(s.inventory.count('gold'),14);near(s.wageSystem.accrued(w),0);assert.equal(s.wageSystem.totalUnpaid(),0);
    s.gameTime.update(seconds*500);near(s.wageSystem.accrued(w),.5);s.workerSystem.jobs.assign(w,'soldier');s.gameTime.update(seconds*500);near(s.inventory.count('gold'),17.5);assert.equal(events,2);
  }
});
test('fast days scale daily food consumption while stone spawns keep their original seconds-based interval',()=>{
  const s=configured({dayLengthSeconds:60});s.inventory.add('meat',4);const tile={x:5,y:5};for(let i=0;i<30;i++)s.pathWear.enter(s.character,tile);
  for(let day=0;day<3;day++){s.gameTime.update(60000);s.foodSystem.update(60000);s.resourceSpawners[0].update(60000);}
  assert.equal(s.gameTime.day,4);assert.equal(s.resources.size,9);assert.equal(s.inventory.count('meat'),0);assert.equal(s.pathWear.scores[505],25);
  const t=new GameTimeSystem(60000);let calls=0;t.onNewDay(()=>calls++);t.update(180001);assert.equal(calls,3);assert.equal(t.elapsed,1);t.setPaused(true);t.update(60000);assert.equal(calls,3);assert.equal(t.label,'Day 4');
});
test('respawn Off/Slow/Normal/Fast uses active milliseconds, fills one missing species per attempt and never exceeds the wildlife target',()=>{
  for(const wildlifeRespawn of ['off','slow','normal','fast']){
    const s=configured({wildlifePopulation:'normal',wildlifeRespawn,difficulty:'hard'});s.animalSystem.spawn(s.character.tile);remove(s,'rabbit',2);remove(s,'deer');const interval=WILDLIFE_INTERVALS[wildlifeRespawn];
    if(!interval){s.wildlifeRespawn.update(1000000);assert.deepEqual(counts(s),{rabbit:1,deer:2,wild_boar:3});continue;}
    s.wildlifeRespawn.update(interval-1);assert.deepEqual(counts(s),{rabbit:1,deer:2,wild_boar:3});s.wildlifeRespawn.update(1);assert.deepEqual(counts(s),{rabbit:2,deer:2,wild_boar:3});
    s.wildlifeRespawn.update(interval*10);assert.deepEqual(counts(s),{rabbit:3,deer:3,wild_boar:3});assert.equal(s.animalSystem.animals.size,15);
    const rabbit=[...s.animalSystem.animals.values()].filter(a=>a.type==='rabbit').at(-1);assert.equal(rabbit.maxHP,19.5);assert.equal(rabbit.attackDPS,1.3);assert.equal(rabbit.active,true);
  }
});
test('respawn prefers outside king sight, avoids buildings, resources and reserved actors, and requires a reachable free tile',()=>{
  const s=configured({wildlifePopulation:'rare',wildlifeRespawn:'fast',startingCastle:true});createStartingCastle(s,s.character.tile);s.animalSystem.spawn(s.character.tile);remove(s,'rabbit');const before=new Set(s.reservedTiles().map(tileKey));s.addResource(objectRegistry.require('stone'),{x:0,y:0});s.wildlifeRespawn.random=()=>0;
  const id=s.animalSystem.nextId;assert.equal(s.wildlifeRespawn.spawnOne(),true);const a=s.animalSystem.animals.get(`animal-${id}`);assert.equal(a.type,'rabbit');assert.equal(s.map[a.tile.y][a.tile.x],0);assert.equal(s.resourceOccupancy.has(tileKey(a.tile)),false);assert.equal(before.has(tileKey(a.tile)),false);assert.equal(new FogOfWarSystem(s.character,true).isVisibleTile(a.tile),false);
  const blocked=Array.from({length:100},()=>Array(100).fill(1));blocked[40][40]=0;const b=workerScene(blocked,{gameSettings:gameSettings({wildlifeRespawn:'fast'})});assert.equal(b.wildlifeRespawn.spawnOne(),false);
});
test('respawn pauses with game pause/death and falls back to a safe visible cell only when the entire reachable map is in sight',()=>{
  const terrain=Array.from({length:100},()=>Array(100).fill(1));for(let y=38;y<=42;y++)for(let x=38;x<=42;x++)terrain[y][x]=0;
  const s=workerScene(terrain,{gameSettings:gameSettings({wildlifePopulation:'rare',wildlifeRespawn:'fast'})});s.wildlifeRespawn.update(29999);s.gameTime.setPaused(true);s.wildlifeRespawn.update(100000);assert.equal(s.animalSystem.animals.size,0);assert.equal(s.wildlifeRespawn.elapsed,29999);s.gameTime.setPaused(false);s.gameOver=true;s.wildlifeRespawn.update(100000);assert.equal(s.wildlifeRespawn.elapsed,29999);s.gameOver=false;s.wildlifeRespawn.update(1);assert.equal(s.animalSystem.animals.size,1);assert.equal(new FogOfWarSystem(s.character,true).isVisibleTile([...s.animalSystem.animals.values()][0].tile),true);
});
test('current-schema roundtrip restores advanced settings, partial long day and respawn, castle/gold/wages without repeating creation or bonuses',()=>{
  const s=configured({difficulty:'easy',startingCastle:true,startingGold:500,dayLengthSeconds:240,wildlifeRespawn:'fast',fogOfWar:false});s.inventory.add('gold',500);createStartingCastle(s,s.character.tile);s.constructionSystem=new ConstructionSystem(s);s.animalSystem.spawn(s.character.tile);remove(s,'deer');s.gameTime.update(180000);s.wildlifeRespawn.update(29876);s.character.currentHP=87.5;
  const data=validateGameState(serializeGameState(s));assert.equal(data.saveVersion,SAVE_VERSION);
  for(let i=0;i<3;i++){const r=configured({});r.constructionSystem=new ConstructionSystem(r);loadGameState(r,data);assert.deepEqual(serializeGameState(r),data);assert.equal(r.gameTime.dayDuration,240000);assert.equal(r.wildlifeRespawn.elapsed,29876);assert.equal(r.buildings.length,1);assert.equal(r.inventory.count('gold'),500);assert.equal(r.character.maxHP,150);assert.equal(r.character.currentHP,87.5);r.wildlifeRespawn.update(124);assert.equal(r.animalSystem.animals.size,15);}
  for(const mutate of [x=>x.wildlifeRespawn.elapsed=30000,x=>x.gameSettings.dayLengthSeconds=90,x=>x.time.elapsed=240000]){const bad=structuredClone(data);mutate(bad);assert.throws(()=>validateGameState(bad));}
});
