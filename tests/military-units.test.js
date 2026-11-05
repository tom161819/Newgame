import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { UNIT_TYPES,UNIT_TYPE_IDS,unitKit } from '../src/data/military.js';
import { totalXPForLevel,getXPRequired } from '../src/data/experience.js';
import { WageSystem } from '../src/systems/WageSystem.js';
import { hasLineOfSight } from '../src/game/lineOfSight.js';
import { inAttackRange } from '../src/systems/CombatSystem.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function soldier(s,barracks,tile,combatLevel=1){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(barracks,w),true);assert.equal(w.profession,'soldier');const c=w.skills.combat;Object.assign(c,{level:combatLevel,currentXP:0,totalXP:totalXPForLevel(combatLevel),xpToNextLevel:getXPRequired(combatLevel)});return w;}
function hauler(s,tile){const w=s.workerSystem.create(tile);s.workerSystem.jobs.assign(w,'hauler');return w;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
// A kingdom with an Armory holding items, a Barracks with Soldiers, two Haulers and Gold.
function kingdom(items={sword:4,bow:2,armor:2}){
  const s=scene(),armory=building(s,'armory',60,44),barracks=building(s,'barracks',50,50);
  for(const [id,n]of Object.entries(items))assert.equal(s.foodStorage.deposit(`armory-${armory.id}`,id,n),true);
  hauler(s,{x:56,y:48});hauler(s,{x:57,y:48});s.inventory.add('gold',200);return {s,armory,barracks};
}
const armoryStock=(s,armory)=>s.foodStorage.locations.get(`armory-${armory.id}`).stock;

test('four unit types from central data: Soldier and Swordsman differ, the Archer shoots from range, the Knight stays locked',()=>{
  assert.deepEqual(UNIT_TYPE_IDS,['soldier','swordsman','archer','knight']);
  const {soldier:a,swordsman:b,archer:c,knight:k}=UNIT_TYPES;
  assert.deepEqual([a.equipment,b.equipment,c.equipment,k.equipment],[{weapon:'sword'},{weapon:'sword'},{weapon:'bow'},{weapon:'sword',armor:'armor'}]);
  assert.ok(b.modifiers.maxHP>a.modifiers.maxHP&&b.modifiers.armor>0&&b.trainingTime>a.trainingTime&&b.goldCost>a.goldCost&&b.requiredCombatLevel>a.requiredCombatLevel,'the Swordsman is the stronger, dearer infantry');
  assert.equal(c.modifiers.attackRange,5);assert.equal(k.lockedUntil,'stables');assert.equal(k.mount,'horse');
  assert.deepEqual(unitKit('knight'),{sword:1,armor:1});
  const {s,barracks}=kingdom(),w=soldier(s,barracks,{x:50,y:54},9);
  assert.equal(s.military.blocker(w,'knight'),'locked');assert.equal(s.military.train(w,'knight'),'locked');assert.equal(s.military.orders.size,0);
  assert.equal(s.military.blocker(w,'swordsman'),null);
  const novice=soldier(s,barracks,{x:51,y:54},1);assert.equal(s.military.blocker(novice,'swordsman'),'skill');
  const civilian=s.workerSystem.create({x:52,y:54});assert.equal(s.military.blocker(civilian,'soldier'),'notSoldier');
});

test('training takes Gold, the exact items carried from the Armory by Haulers and game time; Save/Load mid-way keeps everything once',()=>{
  let {s,armory,barracks}=kingdom();const a=soldier(s,barracks,{x:50,y:54}),b=soldier(s,barracks,{x:51,y:54},3),c=soldier(s,barracks,{x:52,y:54});
  const gold=s.inventory.count('gold');
  for(const [w,type]of [[a,'soldier'],[b,'swordsman'],[c,'archer']])assert.equal(s.military.train(w,type),null);
  assert.equal(s.inventory.count('gold'),gold-5-12-8);assert.equal(s.military.train(a,'archer'),'training','one order per Soldier');
  until(s,()=>[...s.military.orders.values()].every(o=>o.state==='training'));
  assert.deepEqual({...armoryStock(s,armory)},{sword:2,armor:2,bow:1},'exactly one item per order left the Armory');
  const saved=validateGameState(serializeGameState(s)),restored=scene(false);loadGameState(restored,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(restored)),saved);s=restored;
  until(s,()=>s.military.units.size===3);
  const unit=id=>s.workerSystem.workers.get(id);
  assert.deepEqual([a,b,c].map(w=>s.military.units.get(w.id).type),['soldier','swordsman','archer']);
  assert.deepEqual([unit(a.id),unit(b.id),unit(c.id)].map(w=>[w.maxHP,Math.round(w.attackDPS*100)/100,w.armor,w.attackRange]),[[80,12,0,1],[120,15,15,1],[70,8.4,0,6]]);
  const receipts=[...s.resourceLedger.history,s.resourceLedger.current].flatMap(d=>d.transactions).filter(t=>t.source==='Military Equipment');
  assert.deepEqual(receipts.map(t=>[t.resource,t.quantity]).sort(),[['bow',1],['sword',1],['sword',1]]);
  assert.equal(s.foodStorage.used(s.foodStorage.locations.get(`kit-${barracks.id}`)),0,'nothing left in the kit store');
  const wages=new WageSystem(s),plain=soldier(s,s.buildings.find(x=>x.type==='barracks'),{x:53,y:54},3);assert.equal(wages.dailyWage(unit(b.id))-wages.dailyWage(plain),UNIT_TYPES.swordsman.wageBonus,'a trained unit earns its type’s extra wage');
});

test('without the items nothing is trained; cancelling refunds Gold and returns delivered items; death drops the gear for Haulers',()=>{
  const {s,armory,barracks}=kingdom({sword:1});const a=soldier(s,barracks,{x:50,y:54}),b=soldier(s,barracks,{x:51,y:54});
  s.military.train(a,'soldier');s.military.train(b,'archer');
  until(s,()=>s.military.order(a)?.state==='training');s.tick(30000);
  assert.equal(s.military.order(b).state,'supplying','no Bow anywhere: the Archer waits');assert.equal(s.military.units.has(b.id),false);
  const gold=s.inventory.count('gold');assert.equal(s.military.cancel(s.military.order(b).id),true);assert.equal(s.inventory.count('gold'),gold+8);
  until(s,()=>s.military.units.has(a.id));const sword=()=>(armoryStock(s,armory).sword??0)+[...s.dropSystem.drops.values()].filter(d=>d.resource==='sword').reduce((n,d)=>n+d.amount,0)+s.workerSystem.liveWorkers().filter(w=>w.cargo?.resource==='sword').reduce((n,w)=>n+w.cargo.amount,0);
  assert.equal(sword(),0);
  a.currentHP=0;s.combat.handleDeath(a);s.workerSystem.onDeath(a);
  assert.equal(s.military.units.has(a.id),false);assert.equal(sword(),1,'the Sword lies where the Soldier fell');
  until(s,()=>(armoryStock(s,armory).sword??0)===1);
});

test('two Barracks train at the same time without taking each other’s items; Discharge drops the gear',()=>{
  const {s,armory}=kingdom({sword:2}),second=building(s,'barracks',40,50),first=s.buildings.find(b=>b.type==='barracks');
  const a=soldier(s,first,{x:50,y:54}),b=soldier(s,second,{x:40,y:54});s.military.train(a,'soldier');s.military.train(b,'soldier');
  until(s,()=>s.military.units.size===2);assert.equal(armoryStock(s,armory).sword??0,0);
  assert.equal(s.military.release(a),true);assert.equal(s.workerSystem.workers.get(a.id).attackDPS,6,'back to a plain resident');
  until(s,()=>(armoryStock(s,armory).sword??0)===1);
  // A unit moved to another job also hands its gear back.
  s.military.train(b,'soldier');until(s,()=>s.military.units.has(b.id));s.workplaceSystem.remove(b);s.tick(50);
  assert.equal(s.military.units.has(b.id),false);assert.equal(b.attackDPS,6);until(s,()=>(armoryStock(s,armory).sword??0)===2);
});

test('archers need a clear line: trees, walls and rock block the shot; they never shoot unseen game',()=>{
  const map=Array.from({length:20},()=>Array(20).fill(0));
  assert.equal(hasLineOfSight(map,{x:2,y:2},{x:8,y:2}),true);map[2][5]=1;assert.equal(hasLineOfSight(map,{x:2,y:2},{x:8,y:2}),false);
  map[5][5]=1;map[6][6]=0;map[5][6]=1;map[6][5]=1;assert.equal(hasLineOfSight(map,{x:4,y:4},{x:7,y:7}),false,'no slipping between diagonal blockers');
  const archer={position:{x:2.5,y:10.5},attackRange:6},deer={position:{x:7.5,y:10.5}};assert.equal(inAttackRange(archer,deer,map),true);map[10][4]=1;assert.equal(inAttackRange(archer,deer,map),false);
  assert.equal(inAttackRange({...archer,attackRange:1},{position:{x:3.5,y:10.5}},map),true);
});

test('a trained unit defends residents near its Barracks and never targets the people it guards',()=>{
  const {s,barracks}=kingdom();const a=soldier(s,barracks,{x:50,y:54});s.military.train(a,'soldier');until(s,()=>s.military.units.has(a.id));
  const villager=s.workerSystem.create({x:54,y:56}),boar=s.animalSystem.create(s.objectRegistry.require('wild_boar'),{x:55,y:56});
  s.animalSystem.onAttacked(boar,villager);assert.equal(s.military.threat(a),boar);
  until(s,()=>!boar.isAlive,60000);assert.ok(s.workerSystem.workers.get(a.id).experience.totalXP>0||a.skills.combat.totalXP>0,"the unit fought the boar");
  for(const [attacker,target]of s.combat.attacks)assert.ok(!(s.workerSystem.workers.has(attacker.id)&&s.workerSystem.workers.has(target.id)),'never resident on resident');
});

test('100 units train and update cheaply',()=>{
  const s=scene(),barracks=[];for(let i=0;i<20;i++)barracks.push(building(s,'barracks',5+(i%10)*9,10+Math.floor(i/10)*30));
  const armory=building(s,'armory',60,70);s.foodStorage.deposit(`armory-${armory.id}`,'sword',40);s.inventory.add('gold',1000);
  for(const b of barracks)for(let k=0;k<5;k++){const w=s.workerSystem.create({x:b.x+k,y:b.y+4});s.workplaceSystem.assign(b,w);}
  for(const w of s.workerSystem.liveWorkers().slice(0,40))s.military.units.set(w.id,{type:'soldier',equipment:{weapon:'sword'}});
  for(const w of s.workerSystem.liveWorkers().slice(40))s.military.train(w,'soldier');
  const start=performance.now();for(let i=0;i<100;i++){s.military.update(50);s.military.candidates();}const per=(performance.now()-start)/100;
  assert.ok(per<10,`one military update took ${per.toFixed(2)} ms`);
});
