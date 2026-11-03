import test from 'node:test';
import assert from 'node:assert/strict';
import { gameSettings,DEFAULT_GAME_SETTINGS,resourceSpawnSettings } from '../src/systems/GameSettings.js';
import { createCombatStats,recalculateStats } from '../src/systems/UnitStats.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { workerScene } from './helpers/workerScene.js';
import { generateResourcePositions,ResourceSpawner,tileKey } from '../src/game/stones.js';
import { reachableTiles } from '../src/game/pathfinding.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

test('new game settings use central defaults and reject unsupported values',()=>{
  assert.deepEqual(gameSettings(),DEFAULT_GAME_SETTINGS);assert.ok(Object.isFrozen(gameSettings()));
  for(const input of [{difficulty:'bad'},{wildlifePopulation:'bad'},{treasureCount:11},{treasureCount:.5},{initialStoneCount:101},{initialStoneCount:3}])assert.throws(()=>gameSettings(input));
});
test('difficulty changes king and huntable base HP/DPS once, then equipment applies above it; horse and armor stay unchanged',()=>{
  for(const [difficulty,hp,dps,animal]of [['easy',150,18.75,.75],['normal',100,15,1],['hard',80,12.75,1.3]]){
    const settings=gameSettings({difficulty}),king=createCombatStats(objectRegistry.require('king'),settings);
    assert.equal(king.maxHP,hp);assert.equal(king.attackDPS,dps);assert.equal(king.hpRegenPerSecond,.2);assert.equal(king.armor,0);
    king.statModifiers.weapon={attackMultiplier:2};recalculateStats(king);recalculateStats(king);assert.equal(king.attackDPS,dps*2);assert.equal(king.baseStats.attackDPS,dps);
    for(const type of ['rabbit','deer','wild_boar','horse']){const d=objectRegistry.require(type),a=createCombatStats(d,settings),m=type==='horse'?1:animal;assert.equal(a.maxHP,d.stats.maxHP*m);assert.equal(a.attackDPS,d.stats.attackDPS*m);assert.equal(a.armor,d.stats.armor);}
  }
  assert.equal(objectRegistry.require('king').stats.maxHP,100);
});
test('rare/normal/abundant spawn exactly 3/9/24 reachable non-overlapping animals plus one unchanged horse',()=>{
  for(const [wildlifePopulation,count]of [['rare',3],['normal',9],['abundant',24]]){
    const s=workerScene(undefined,{gameSettings:gameSettings({wildlifePopulation})}),start=s.character.tile;s.addResource(objectRegistry.require('stone'),{x:2,y:2});s.map[1][1]=1;
    s.animalSystem.spawn(start);const all=[...s.animalSystem.animals.values()];assert.equal(all.filter(a=>a.definition.gameplay.huntable).length,count);assert.equal(all.filter(a=>a.type==='horse').length,1);
    assert.equal(new Set(all.map(a=>tileKey(a.tile))).size,all.length);for(const a of all){assert.notEqual(tileKey(a.tile),tileKey(start));assert.notEqual(tileKey(a.tile),'2,2');assert.equal(s.map[a.tile.y][a.tile.x],0);}
  }
});
test('zero through ten chests have unique reachable positions, independent rolled contents and single-use contents',()=>{
  for(const treasureCount of [0,1,10]){
    const s=workerScene(undefined,{gameSettings:gameSettings({treasureCount})});let n=0;s.treasureSystem.random=()=>((n++*37)%101)/101;s.treasureSystem.spawn(s.character.tile);
    const chests=[...s.treasureSystem.chests.values()];assert.equal(chests.length,treasureCount);assert.equal(new Set(chests.map(c=>c.id)).size,treasureCount);assert.equal(new Set(chests.map(c=>tileKey(c.tile))).size,treasureCount);
    const reachable=new Set(reachableTiles(s.map,[s.character.tile]).map(tileKey));
    for(const c of chests){assert.ok(c.contents.gold>=50&&c.contents.gold<=100);assert.deepEqual(c.contents.equipment,['basic_sword','basic_armor']);assert.ok([{x:c.x-1,y:c.y},{x:c.x+1,y:c.y},{x:c.x,y:c.y-1},{x:c.x,y:c.y+1}].some(t=>reachable.has(tileKey(t))));}
    if(treasureCount>1){assert.notEqual(chests[0].contents,chests[1].contents);assert.ok(new Set(chests.map(c=>c.contents.gold)).size>1);}
    if(chests.length){const c=chests[0];s.character.tile={x:c.x-1,y:c.y};c.opened=true;assert.equal(s.treasureSystem.takeAll(c.id),true);const gold=s.inventory.count('gold');assert.equal(s.treasureSystem.takeAll(c.id),false);assert.equal(s.inventory.count('gold'),gold);}
  }
});
test('initial stone slider covers 0/30/100 and its raised capacity pauses and resumes the original 20-second spawner',()=>{
  for(const count of [0,30,100]){
    const settings=gameSettings({initialStoneCount:count}),s=workerScene(undefined,{gameSettings:settings}),d=objectRegistry.require('stone'),spawnSettings=resourceSpawnSettings(d,settings);
    for(const t of generateResourcePositions(s.map,s.character.tile,count))s.addResource(d,t);assert.equal(s.resources.size,count);assert.equal(spawnSettings.max,Math.max(80,count));
    const spawner=new ResourceSpawner({map:s.map,resources:s.resourceOccupancy,definition:d,spawnSettings,getOrigins:()=>[s.character.tile],getReserved:()=>s.reservedTiles(),getCount:()=>s.resources.size,spawn:t=>s.addResource(d,t)});
    spawner.update(19999);assert.equal(s.resources.size,count);spawner.update(1);assert.equal(s.resources.size,count===100?100:count+1);
    if(count===100){const key=s.resources.keys().next().value;s.resources.delete(key);s.resourceOccupancy.delete(key);spawner.update(20000);assert.equal(s.resources.size,100);}
  }
});
test('repeated save/load preserves settings, damaged health, bonuses, exact objects and spawn timer without multiplying difficulty again',()=>{
  const settings=gameSettings({difficulty:'hard',wildlifePopulation:'abundant',treasureCount:10,initialStoneCount:100});let s=workerScene(undefined,{gameSettings:settings});s.animalSystem.spawn(s.character.tile);s.treasureSystem.spawn(s.character.tile);s.character.currentHP=42.5;
  s.inventory.add('basic_sword');s.equipment.equip('basic_sword');s.resourceSpawners[0].elapsed=12345;
  const original=validateGameState(serializeGameState(s));
  for(let i=0;i<3;i++){const r=workerScene();loadGameState(r,serializeGameState(s));s=r;assert.deepEqual(serializeGameState(s),original);assert.equal(s.character.maxHP,80);assert.equal(s.character.attackDPS,25.5);assert.equal(s.character.currentHP,42.5);assert.equal(s.resourceSpawners[0].spawnSettings.max,100);}
  const bad=structuredClone(original);bad.gameSettings.difficulty='invalid';assert.throws(()=>validateGameState(bad));
});
test('legacy saves default to Normal without respawning objects or changing existing saved statistics',()=>{
  const s=workerScene();s.animalSystem.create(objectRegistry.require('rabbit'),{x:3,y:3});const data=serializeGameState(s);delete data.gameSettings;
  const r=workerScene();loadGameState(r,data);assert.deepEqual(r.gameSettings,{...DEFAULT_GAME_SETTINGS,fogOfWar:false});assert.equal(r.animalSystem.animals.size,1);assert.equal(r.treasureSystem.chests.size,0);assert.equal(r.resources.size,0);assert.equal(r.character.maxHP,100);
});
