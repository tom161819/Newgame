import test from 'node:test';
import assert from 'node:assert/strict';
import { GameTimeSystem,DAY_DURATION } from '../src/systems/GameTimeSystem.js';
import { RegenerationSystem } from '../src/systems/RegenerationSystem.js';
import { ProductionSystem } from '../src/systems/ProductionSystem.js';
import { EquipmentSystem } from '../src/systems/EquipmentSystem.js';
import { TreasureSystem } from '../src/systems/TreasureSystem.js';
import { CombatSystem,createCombatStats } from '../src/systems/CombatSystem.js';
import { recalculateStats } from '../src/systems/UnitStats.js';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { Inventory } from '../src/game/inventory.js';
import { findPath } from '../src/game/pathfinding.js';

const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const unit=(id,x=0,y=0)=>({...createCombatStats(objectRegistry.require(id)),id,definition:objectRegistry.require(id),position:{x:x+.5,y:y+.5},tile:{x,y}});

test('days last exactly 120 seconds, pause freezes time and every crossed boundary emits once in order',()=>{
  const time=new GameTimeSystem(),events=[];time.onNewDay(day=>events.push([day,time.elapsed]));
  assert.equal(DAY_DURATION,120000);assert.equal(time.label,'Day 1 | 02:00 / 02:00');
  time.update(119999);assert.equal(time.day,1);assert.equal(time.label,'Day 1 | 00:01 / 02:00');
  time.setPaused(true);assert.equal(time.update(50000),0);assert.equal(time.day,1);time.setPaused(false);
  time.update(1);assert.equal(time.day,2);assert.deepEqual(events,[[2,0]]);time.update(245000);
  assert.equal(time.day,4);assert.equal(time.elapsed,5000);assert.deepEqual(events,[[2,0],[3,0],[4,0]]);assert.equal(time.totalElapsed,365000);
  time.update(0);assert.equal(events.length,3);
});

test('FPS and a pause at a day boundary do not duplicate days or advance through the pause',()=>{
  for(const fps of [20,30,60,144]){
    const time=new GameTimeSystem();let events=0;time.onNewDay(()=>events++);
    let elapsed=0;while(elapsed<360123){const delta=Math.min(1000/fps,360123-elapsed);time.update(delta);elapsed+=delta;}
    assert.equal(time.day,4);assert.equal(events,3);assert.ok(Math.abs(time.elapsed-123)<.001);
  }
  const time=new GameTimeSystem();time.onNewDay(()=>time.setPaused(true));
  assert.equal(time.update(240000),120000);assert.equal(time.day,2);assert.equal(time.totalElapsed,120000);
});

test('regeneration restores one HP per five seconds in every living state and never revives or exceeds max',()=>{
  const regen=new RegenerationSystem();
  for(const state of ['ground','onTower','onWall','mounted','fighting']){
    const king=unit('king');king.state=state;king.currentHP=85;regen.update(5000,[king]);close(king.currentHP,86);
    regen.update(100000,[king]);assert.equal(king.currentHP,100);regen.update(100000,[king]);assert.equal(king.currentHP,100);
  }
  const dead=unit('king');dead.isAlive=false;dead.currentHP=0;regen.update(100000,[dead]);assert.equal(dead.currentHP,0);
  const deer=unit('deer');deer.currentHP=20;regen.update(10000,[deer]);assert.equal(deer.currentHP,20);
});

test('regeneration during DPS combat is FPS independent and covers the time after the attacker dies',()=>{
  for(const delta of [1000/20,1000/60,1000/144,10000]){
    const king=unit('king'),boar=unit('wild_boar',1,0),regen=new RegenerationSystem();
    const combat=new CombatSystem({regenerationRate:u=>regen.rateFor(u)});combat.startAttack(king,boar);combat.startAttack(boar,king);
    let elapsed=0;while(elapsed<10000){const slice=Math.min(delta,10000-elapsed),covered=combat.update(slice);regen.update(slice,[king,boar],covered);elapsed+=slice;}
    assert.equal(boar.isAlive,false);close(king.currentHP,46);
  }
});

test('daily production comes from definitions, counts all castles once and does not backpay new castles',()=>{
  const time=new GameTimeSystem(),inventory=new Inventory(),buildings=[],castle=objectRegistry.require('castle'),reports=[];
  const production=new ProductionSystem(time,inventory,()=>buildings,(day,totals)=>reports.push([day,totals.gold]));
  assert.equal(inventory.count('gold'),0);time.update(DAY_DURATION);assert.equal(inventory.count('gold'),0);
  buildings.push({type:'castle',definition:castle});time.update(DAY_DURATION);assert.equal(inventory.count('gold'),5);
  production.processDay(3);assert.equal(inventory.count('gold'),5);
  buildings.push({type:'castle',definition:castle},{type:'castle',definition:castle});assert.equal(inventory.count('gold'),5);
  time.update(DAY_DURATION);assert.equal(inventory.count('gold'),20);assert.deepEqual(production.dailyIncome(),{gold:15});
  assert.deepEqual(reports,[[3,5],[4,15]]);production.destroy();time.update(DAY_DURATION);assert.equal(inventory.count('gold'),20);
});

test('equipment recomputes from slots without stacking, preserves base stats and restores them when removed',()=>{
  const king=unit('king'),inventory=new Inventory(),system=new EquipmentSystem(king,objectRegistry,inventory);
  assert.equal(system.equip('basic_sword'),false);inventory.add('basic_sword');inventory.add('basic_armor');
  assert.equal(system.equip('basic_sword'),true);assert.equal(king.attackDPS,30);assert.equal(king.baseStats.attackDPS,15);
  for(let i=0;i<10;i++)system.equip('basic_sword');assert.equal(king.attackDPS,30);
  system.equip('basic_armor');assert.equal(king.armor,30);assert.equal(king.baseStats.armor,0);
  const boar=unit('wild_boar',1,0),combat=new CombatSystem();combat.startAttack(boar,king);combat.update(1000);close(king.currentHP,91.6);
  combat.startAttack(king,boar);combat.update(1000);close(boar.currentHP,40);close(king.currentHP,83.2);
  system.unequip('weapon');assert.equal(king.attackDPS,15);system.unequip('armor');assert.equal(king.armor,0);
  king.statModifiers.future={armor:200};recalculateStats(king);assert.equal(king.armor,90);
});

function treasureScene(random=()=>.5){
  const inventory=new Inventory(),king=unit('king',1,1);king.state='ground';
  const scene={objectRegistry,inventory,character:king,map:Array.from({length:20},()=>Array(20).fill(0)),resourceOccupancy:new Map(),reservedTiles:()=>[king.tile],
    assets:{createView(_id,p){return {...p,depth:p.y,visible:true,setData(){},setVisible(v){this.visible=v;},open(done){done();},destroy(){}};}}};
  scene.equipment=new EquipmentSystem(king,objectRegistry,inventory);
  let ready=0;const system=new TreasureSystem(scene,{random,onReady:()=>ready++});return {scene,system,ready:()=>ready};
}

test('one chest spawns on a unique free reachable tile and its content is generated once',()=>{
  const {scene,system}=treasureScene();scene.map[5][5]=1;scene.resourceOccupancy.set('6,6','stone');system.spawn(scene.character.tile);
  assert.equal(system.chests.size,1);const chest=[...system.chests.values()][0];assert.notDeepEqual(chest.tile,scene.character.tile);
  assert.notEqual(`${chest.x},${chest.y}`,'5,5');assert.notEqual(`${chest.x},${chest.y}`,'6,6');assert.equal(scene.map[chest.y][chest.x],1);
  const neighbors=[{x:chest.x+1,y:chest.y},{x:chest.x-1,y:chest.y},{x:chest.x,y:chest.y+1},{x:chest.x,y:chest.y-1}];
  assert.ok(neighbors.some(goal=>findPath(scene.map,scene.character.tile,goal)!==null));
  assert.ok(chest.contents.gold>=50&&chest.contents.gold<=100);assert.deepEqual(chest.contents.equipment,['basic_sword','basic_armor']);
});

test('treasure must be approached, opens before take-all and cannot grant its fixed contents twice',()=>{
  const {scene,system,ready}=treasureScene(),chest=system.create({x:8,y:8}),contents=structuredClone(chest.contents);
  assert.equal(system.requestOpen(chest),false);assert.equal(system.takeAll(chest.id),false);
  scene.character.tile={x:7,y:8};scene.character.position={x:7.5,y:8.5};assert.equal(system.requestOpen(chest),true);
  system.update({x:0,y:0,right:10000,bottom:10000},null);assert.equal(ready(),1);assert.deepEqual(chest.contents,contents);
  assert.equal(scene.inventory.count('gold'),0);assert.equal(system.takeAll(chest.id),true);
  assert.equal(scene.inventory.count('gold'),contents.gold);assert.equal(scene.inventory.count('basic_sword'),1);assert.equal(scene.character.attackDPS,30);assert.equal(scene.character.armor,30);
  assert.equal(system.takeAll(chest.id),false);system.requestOpen(chest);system.update({x:0,y:0,right:10000,bottom:10000},null);
  assert.equal(system.takeAll(chest.id),false);assert.equal(scene.inventory.count('gold'),contents.gold);assert.deepEqual(chest.contents,contents);assert.equal(scene.map[8][8],1);
});

test('registry validates daily production and equipment references before mutating a batch',()=>{
  const registry=new ObjectRegistry(objectRegistry.all()),d=structuredClone(registry.require('castle'));
  assert.throws(()=>registry.register({...d,id:'invalid_producer',production:{resource:'missing',amount:5,interval:'day'}}),/neznámá surovina/);
  assert.equal(registry.get('invalid_producer'),null);
  const chest=structuredClone(registry.require('treasure_chest'));chest.id='invalid_chest';chest.treasure.equipment=['missing_item'];
  assert.throws(()=>registry.register(chest),/neznámé vybavení/);assert.equal(registry.get('invalid_chest'),null);
});
