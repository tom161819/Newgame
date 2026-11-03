import test from 'node:test';
import assert from 'node:assert/strict';
import { ExperienceSystem } from '../src/systems/ExperienceSystem.js';
import { GameActivityBus } from '../src/systems/GameActivityBus.js';
import { getXPRequired,totalXPForLevel,createExperience } from '../src/data/experience.js';
import { CombatSystem,createCombatStats } from '../src/systems/CombatSystem.js';
import { DropSystem } from '../src/systems/DropSystem.js';
import { Inventory } from '../src/game/inventory.js';
import { objectRegistry,ObjectRegistry } from '../src/systems/ObjectRegistry.js';

const unit=(type='king',id=type,x=0)=>({id,type,definition:objectRegistry.require(type),...createCombatStats(objectRegistry.require(type)),
  tile:{x,y:0},position:{x:x+.5,y:.5},state:'ground',experience:createExperience(objectRegistry.require(type))});
function setup(){const bus=new GameActivityBus();return {bus,xp:new ExperienceSystem(bus)};}

test('curve matches requested examples, increases every level and all humans start at level one',()=>{
  for(const [level,required]of [[1,100],[2,139],[10,739],[25,3244],[49,10996]])assert.equal(getXPRequired(level),required);
  for(let level=2;level<50;level++)assert.ok(getXPRequired(level)>getXPRequired(level-1));
  assert.equal(totalXPForLevel(50),198156);const {xp}=setup(),king=unit();
  assert.deepEqual(xp.getLevelProgress(king),{level:1,currentXP:0,totalXP:0,xpToNextLevel:100,maxLevel:50,enabled:true,gainMultiplier:1,modifiers:{},ratio:0});
  assert.equal(xp.addXP(unit('deer'),100),0);
});

test('overflow carries across multiple levels, caps at 50, emits each level once and never changes combat stats',()=>{
  const {xp}=setup(),king=unit(),stats={hp:king.maxHP,dps:king.attackDPS,armor:king.armor},levels=[];xp.on('levelUp',(_unit,level)=>levels.push(level));
  xp.addXP(king,99);assert.equal(king.experience.level,1);xp.addXP(king,2);assert.equal(king.experience.level,2);assert.equal(king.experience.currentXP,1);assert.equal(king.experience.totalXP,101);
  xp.addXP(king,totalXPForLevel(11)+5-101);assert.equal(king.experience.level,11);assert.equal(king.experience.currentXP,5);
  xp.addXP(king,1e9);assert.equal(king.experience.level,50);assert.equal(king.experience.currentXP,0);assert.equal(king.experience.totalXP,198156);assert.equal(king.experience.xpToNextLevel,0);
  assert.equal(xp.addXP(king,100),0);assert.equal(xp.getLevelProgress(king).ratio,1);assert.deepEqual(levels,Array.from({length:49},(_,i)=>i+2));
  assert.deepEqual({hp:king.maxHP,dps:king.attackDPS,armor:king.armor},stats);
});

test('central completion rewards are individual, quantity-aware for new walls and replay-safe',()=>{
  const {bus,xp}=setup(),king=unit(),peasant=unit('king','peasant');
  const stone=bus.emit('resourceCollected',{actor:king,objectType:'stone'});assert.equal(king.experience.totalXP,3);assert.equal(peasant.experience.totalXP,0);
  bus.emit(stone.type,{actor:peasant,objectType:'stone'},stone.id);assert.equal(peasant.experience.totalXP,0);
  bus.emit('buildingCompleted',{actor:king,objectType:'wall',quantity:3});bus.emit('buildingCompleted',{actor:king,objectType:'tower',quantity:1});bus.emit('buildingCompleted',{actor:king,objectType:'castle',quantity:1});
  assert.equal(king.experience.totalXP,54);
  for(const type of ['walking','click','regeneration','dailyGold','buildCancelled','buildFailed'])bus.emit(type,{actor:king,objectType:'castle',quantity:10});assert.equal(king.experience.totalXP,54);
  bus.emit('animalKilled',{actor:peasant,objectType:'wild_boar'});assert.equal(peasant.experience.totalXP,35);assert.equal(king.experience.totalXP,54);
  assert.equal(xp.addXP(king,-1),0);assert.equal(xp.addXP(king,NaN),0);
});

test('hunting XP is awarded once at actual death to the completing attacker; no reward for partial damage',()=>{
  for(const [type,reward]of [['rabbit',10],['deer',20],['wild_boar',35]]){
    const {bus}=setup(),hunter=unit('king','hunter'),nearby=unit('king','nearby',5),animal=unit(type,type,1),combat=new CombatSystem();
    combat.on('death',(target,killer)=>bus.emit('animalKilled',{actor:killer,objectType:target.type}));combat.startAttack(hunter,animal);combat.update(100);
    assert.equal(hunter.experience.totalXP,0);assert.ok(animal.currentHP<animal.maxHP);combat.update(10000);
    assert.equal(hunter.experience.totalXP,reward);assert.equal(nearby.experience.totalXP,0);combat.handleDeath(animal,hunter);assert.equal(hunter.experience.totalXP,reward);
  }
  for(const fps of [20,60,144]){
    const a=unit('king','a'),b=unit('king','b'),target=unit('wild_boar','boar',1),combat=new CombatSystem();let credit;
    combat.on('death',(_unit,killer)=>credit=killer.id);combat.startAttack(b,target);combat.startAttack(a,target);
    while(target.isAlive)combat.update(1000/fps);assert.equal(credit,'a');
  }
});

test('one meat package gives two XP regardless of its quantity and a second collection fails without new XP',()=>{
  const {bus}=setup(),king=unit(),scene={activities:bus,inventory:new Inventory(),character:king,objectRegistry,resources:new Map(),resourceOccupancy:new Map(),updateInventory(){},setStatus(){},
    assets:{createView(){return {setData(){},destroy(){}};}}};const drops=new DropSystem(scene);const drop=drops.create('meat',king.tile,15);
  assert.equal(drops.collect(drop.id,king.tile),true);assert.equal(scene.inventory.count('meat'),15);assert.equal(king.experience.totalXP,2);
  assert.equal(drops.collect(drop.id,king.tile),false);assert.equal(king.experience.totalXP,2);
});

test('XP modifiers and replay ledger survive import while duplicate source events remain consumed',()=>{
  const {bus,xp}=setup(),king=unit();xp.setModifier(king,'training',1.2);xp.addXP(king,5);assert.equal(king.experience.totalXP,6);
  const event=bus.emit('animalKilled',{actor:king,objectType:'deer'}),data=JSON.parse(JSON.stringify(xp.exportState())),saved=structuredClone(king.experience);
  const next=setup(),restored=unit();next.xp.importCharacter(restored,saved);next.xp.importState(data);
  next.bus.emit(event.type,{actor:restored,objectType:'deer'},event.id);assert.deepEqual(restored.experience,saved);
  next.bus.emit('resourceCollected',{actor:restored,objectType:'stone'});assert.ok(Math.abs(restored.experience.totalXP-saved.totalXP-3.6)<1e-8);
  assert.throws(()=>xp.setModifier(king,'__proto__',2));assert.throws(()=>xp.setModifier(king,'invalid',-1));
});

test('registry validates experience configuration without giving animals human progression',()=>{
  const definition=structuredClone(objectRegistry.require('king'));
  for(const change of [{initialLevel:0},{initialLevel:51},{maxLevel:51},{maxLevel:0},{gainMultiplier:-1},{enabled:'yes'}]){
    assert.throws(()=>new ObjectRegistry([{...definition,experience:{...definition.experience,...change}}]));
  }
  assert.throws(()=>new ObjectRegistry([{...structuredClone(objectRegistry.require('deer')),experience:definition.experience}]));
});
