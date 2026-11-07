import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { DomesticAnimalSystem } from '../src/systems/DomesticAnimalSystem.js';
import { DOGS,tameChance } from '../src/data/domesticAnimals.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

function world(random=()=>.5){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.domestic=new DomesticAnimalSystem(s,{random});s.eventFeed={push:()=>true};
  const hunter=(x,level=1)=>{const w=s.workerSystem.create({x,y:46});w.profession='hunter';s.skillSystem?.initialize?.(w);if(w.skills?.hunting)w.skills.hunting.level=level;return w;};
  const tick=(ms,step=200)=>{for(let t=0;t<ms;t+=step){s.gameTime.update(step);s.domestic.update(step);}};
  return {s,d:s.domestic,hunter,tick};
}

test('taming chance: 20 % + 8 % per hunting level, at most 90 %', () => {
  assert.equal(Math.round(tameChance(1)*100),28);assert.equal(Math.round(tameChance(5)*100),60);assert.equal(tameChance(9),.9);assert.equal(tameChance(20),.9);
});

test('a stray dog: one try – it runs to the chosen Hunter; success makes it his dog, failure sends it away', () => {
  const {d,hunter,tick}=world(()=>.1),h=hunter(50,1),dog=d.newDog({x:58,y:46,state:'stray',home:{x:58,y:46},leaveAt:1e12});
  assert.equal(d.startTaming(dog.id,h.id),true);tick(10000);assert.equal(dog.state,'owned','.1 < 28 %: tamed');assert.equal(d.dogOf(h),dog);assert.equal(dog.tried,true);
  const other=world(()=>.95),h2=other.hunter(50,9),stray=other.d.newDog({x:56,y:46,state:'stray',home:{x:56,y:46},leaveAt:1e12});
  other.d.startTaming(stray.id,h2.id);other.tick(10000);assert.equal(stray.leaving,true,'.95 > 90 %: it runs off');assert.equal(other.d.startTaming(stray.id,h2.id),false,'no second try');
  assert.equal(d.startTaming(dog.id,h.id),false,'an owned dog cannot be tamed again');
});

test('with its dog close a Hunter runs 30 % faster, hits 50 % harder and finds game within 8 tiles of the dog', () => {
  const {d,hunter,tick}=world(),h=hunter(50),dog=d.newDog({x:50,y:46.5,state:'owned',hunterId:h.id});
  tick(200);assert.equal(h.speedFactor,DOGS.huntSpeed);assert.equal(h.damageFactor,DOGS.huntDamage);
  assert.equal(d.tracks(h,{x:dog.x+7,y:dog.y}),true);assert.equal(d.tracks(h,{x:dog.x+9,y:dog.y}),false);
  const other=hunter(60);tick(200);assert.equal(other.speedFactor,1,'no dog, no bonus');
});

test('a boar bites the dog first; at 0 HP the dog is injured, goes home, heals in a day and never dies', () => {
  const {s,d,hunter,tick}=world(),h=hunter(50),dog=d.newDog({x:50,y:46.5,state:'owned',hunterId:h.id});tick(200);
  const boar={id:'animal-x'};s.animalSystem.animals.set(boar.id,boar);
  const shield=d.shield(h,boar);assert.ok(shield,'the dog guards its Hunter');assert.equal(d.shield(h,{id:'someone'}),null,'only against animals');
  shield.absorb(DOGS.maxHP+5);assert.equal(dog.hp,0);assert.ok(dog.injuredUntil!=null);assert.equal(d.shield(h,boar),null,'an injured dog does not guard');s.animalSystem.animals.delete(boar.id);tick(200);assert.equal(h.speedFactor,1);
  tick(s.gameTime.dayDuration+1000,1000);assert.equal(dog.injuredUntil,null);assert.equal(dog.hp,DOGS.maxHP);assert.ok(d.dogs.has(dog.id));
});

test('a caravan dog costs 120 Gold and needs a Hunter without a dog; a dog whose Hunter quits waits to be reassigned', () => {
  const {s,d,hunter,tick}=world(()=>.2);s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);
  const place=(type,x,y)=>{const def=s.objectRegistry.require(type),starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;s.foodStorage.deposit(starter,'stone',def.cost.stone??0);s.foodStorage.deposit(starter,'wood',def.cost.wood??0);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:def});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(def,r.building));s.foodStorage.register(r.building);return r.building;};
  place('warehouse',58,40);place('marketplace',44,48);assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  tick(200);const forSale=d.dogForSale();assert.ok(forSale,'.2 < 1/3: the caravan has a dog');
  assert.equal(d.buyDog('nobody').error,'hunter');const h=hunter(50);s.inventory.add('gold',200);const gold=s.inventory.count('gold'),merchant=s.caravans.active.gold;
  const r=d.buyDog(h.id);assert.equal(r.ok,true);assert.equal(s.inventory.count('gold'),gold-DOGS.price);assert.equal(s.caravans.active.gold,merchant+DOGS.price);assert.equal(d.dogOf(h),r.dog);assert.equal(d.dogForSale(),null);
  h.profession='hauler';tick(200);assert.equal(r.dog.state,'unassigned');assert.equal(r.dog.hunterId,null);
  const h2=hunter(52);assert.equal(d.assignDog(r.dog.id,h2.id),true);assert.equal(d.dogOf(h2),r.dog);
});

test('dogs survive a save; two dogs for one Hunter are rejected', () => {
  const {s,d,hunter}=world(),h=hunter(50),dog=d.newDog({x:50,y:46.5,state:'owned',hunterId:h.id,hp:30});d.newDog({x:60,y:50,state:'stray',home:{x:60,y:50},leaveAt:9e5});
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.domestic.dogs.length,2);
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.domestic=new DomesticAnimalSystem(r);loadGameState(r,saved);
  assert.equal(r.domestic.dogs.get(dog.id).hunterId,h.id);assert.equal(r.domestic.dogs.get(dog.id).hp,30);
  const bad=structuredClone(serializeGameState(s));bad.domestic.dogs[1].state='owned';bad.domestic.dogs[1].hunterId=h.id;assert.throws(()=>validateGameState(bad));
});
