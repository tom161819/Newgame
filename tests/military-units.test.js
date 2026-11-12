import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { UNIT_TYPES,UNIT_TYPE_IDS,unitKit,RECRUIT } from '../src/data/military.js';
import { totalXPForLevel,getXPRequired } from '../src/data/experience.js';
import { WageSystem } from '../src/systems/WageSystem.js';
import { BASE_DAILY_WAGES } from '../src/data/economy.js';
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

test('four unit types from central data: Soldier and Swordsman differ, the Archer shoots from range, the Knight needs a horse from the Stables',()=>{
  assert.deepEqual(UNIT_TYPE_IDS,['soldier','swordsman','archer','knight']);
  const {soldier:a,swordsman:b,archer:c,knight:k}=UNIT_TYPES;
  assert.deepEqual([a.equipment,b.equipment,c.equipment,k.equipment],[{weapon:'sword'},{weapon:'sword'},{weapon:'bow'},{weapon:'sword',armor:'armor'}]);
  assert.ok(b.modifiers.maxHP>a.modifiers.maxHP&&b.modifiers.armor>0&&b.trainingTime>a.trainingTime&&b.goldCost>a.goldCost&&b.requiredCombatLevel>a.requiredCombatLevel,'the Swordsman is the stronger, dearer infantry');
  assert.equal(c.modifiers.attackRange,5);assert.equal(k.mount,'horse');
  assert.deepEqual(unitKit('knight'),{sword:1,armor:1});
  const {s,barracks}=kingdom(),w=soldier(s,barracks,{x:50,y:54},9);
  assert.equal(s.military.blocker(w,'knight'),'horse');assert.equal(s.military.train(w,'knight'),'horse');assert.equal(s.military.orders.size,0);
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
  const wages=new WageSystem(s),plain=soldier(s,s.buildings.find(x=>x.type==='barracks'),{x:53,y:54},3);assert.equal(wages.dailyWage(unit(b.id)),BASE_DAILY_WAGES.soldier+UNIT_TYPES.swordsman.wageBonus,'a trained unit earns the Soldier wage and its type’s extra wage');assert.equal(wages.dailyWage(plain),BASE_DAILY_WAGES.recruit,'kasarna-branci: an untrained Recruit earns the Recruit wage');
});

test('without the items nothing is trained; cancelling refunds Gold and returns delivered items; death drops the gear for Haulers',()=>{
  const {s,armory,barracks}=kingdom({sword:1,bow:1});const a=soldier(s,barracks,{x:50,y:54}),b=soldier(s,barracks,{x:51,y:54}),c=soldier(s,barracks,{x:52,y:54});
  assert.equal(s.military.train(a,'soldier'),null);assert.equal(s.military.train(b,'archer'),null);
  // m-vojaci-chyba: with the only Bow promised to b, c cannot order an Archer – the button says why instead of waiting.
  const before=s.inventory.count('gold');assert.equal(s.military.train(c,'archer'),'kit');assert.deepEqual(s.military.kitShortage('archer'),{bow:1});assert.equal(s.inventory.count('gold'),before);assert.equal(s.military.order(c),null);
  const gold=s.inventory.count('gold');assert.equal(s.military.cancel(s.military.order(b).id),true);assert.equal(s.inventory.count('gold'),gold+8);
  until(s,()=>s.military.order(a)?.state==='training');
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

// m-vojaci-chyba (owner point 87): a new game can train a Soldier once the kingdom has a Barracks, an Armory and a Sword,
// and every missing piece is named.
test('m-vojaci-chyba: from the start the lock names what is missing – Armory, then the Sword – and a Soldier trains once they exist',()=>{
  const s=scene(),barracks=building(s,'barracks',50,50);s.inventory.add('gold',100);const w=soldier(s,barracks,{x:50,y:54});hauler(s,{x:56,y:48});
  assert.equal(s.objectRegistry.require('barracks').requiresCompletedBuildings?.length??0,0,'the Barracks is unlocked at the start');
  assert.equal(s.military.blocker(w,'soldier'),'armory');assert.equal(s.military.train(w,'soldier'),'armory');assert.equal(s.military.orders.size,0);
  const armory=building(s,'armory',60,44);assert.equal(s.military.blocker(w,'soldier'),'kit');assert.deepEqual(s.military.kitShortage('soldier'),{sword:1});
  s.foodStorage.deposit(`armory-${armory.id}`,'sword',1);assert.equal(s.military.blocker(w,'soldier'),null);
  const gold=s.inventory.count('gold');s.inventory.spend('gold',gold);assert.equal(s.military.blocker(w,'soldier'),'gold');s.inventory.add('gold',gold);
  assert.equal(s.military.train(w,'soldier'),null);until(s,()=>s.military.units.get(w.id)?.type==='soldier');
});

test('kasarna-branci: a Barracks takes 12; everyone hired is a Recruit with basic combat stats who defends, then trains into a unit and keeps the seat',()=>{
  const {s,barracks}=kingdom();assert.equal(s.objectRegistry.require('barracks').workplace.capacity,12);
  const plain=s.workerSystem.create({x:58,y:58}),baseHP=plain.maxHP;
  const recruits=Array.from({length:12},(_,i)=>soldier(s,barracks,{x:46+i,y:54},3));
  assert.equal(s.workplaceSystem.assign(barracks,plain),false,'the thirteenth is refused');
  s.tick(50);const a=recruits[0];
  assert.ok(s.military.isRecruit(a)&&!s.military.unit(a));assert.equal(a.maxHP,baseHP+RECRUIT.modifiers.maxHP,'a Recruit has the basic combat bonus');assert.equal(plain.maxHP,baseHP);
  assert.equal(s.military.wageProfession(a),'recruit');assert.equal(s.military.wageProfession(plain),plain.profession);
  // A Recruit defends a resident attacked near the Barracks.
  const villager=s.workerSystem.create({x:54,y:56}),boar=s.animalSystem.create(s.objectRegistry.require('wild_boar'),{x:55,y:56});
  s.animalSystem.onAttacked(boar,villager);assert.equal(s.military.threat(a),boar);until(s,()=>!boar.isAlive,120000);
  // With a Sword in the Armory the Recruit trains into a Soldier and stays in his seat.
  assert.equal(s.military.blocker(a,'soldier'),null);s.military.train(a,'soldier');until(s,()=>s.military.units.has(a.id));
  assert.ok(!s.military.isRecruit(a));assert.equal(a.assignedWorkplaceId,barracks.id);assert.equal(s.workplaceSystem.summary(barracks).count,12);
  assert.equal(a.maxHP,baseHP+UNIT_TYPES.soldier.modifiers.maxHP+(a.statModifiers.militaryEquipment.maxHP??0),'the unit wears its type’s stats, not the Recruit’s on top');
  // Leaving the Barracks takes the Recruit stats away again.
  const b=recruits[1];s.workplaceSystem.remove(b);s.tick(50);assert.equal(b.profession,'idle');assert.equal(b.maxHP,baseHP);assert.ok(!s.military.isRecruit(b));
  // Save/Load: nothing extra is saved; Recruits are Recruits again after the load.
  const loaded=scene(false);loadGameState(loaded,validateGameState(serializeGameState(s)));loaded.tick(50);
  const c=loaded.workerSystem.workers.get(recruits[2].id);assert.ok(loaded.military.isRecruit(c));assert.equal(c.maxHP,baseHP+RECRUIT.modifiers.maxHP);
  assert.ok(loaded.military.units.has(a.id));
});

test('m-zalozka-vojsko: soldiers on Patrol walk a round of the settlement spread along it; a Guard stands and is listed as Guard; Shift adds to the choice', async () => {
  const { armyRows,armyPick } = await import('../src/ui/ArmyPanel.js');const { PATROL } = await import('../src/data/military.js');
  const {s,barracks}=kingdom();assert.ok(s.buildings.filter(b=>b.construction==null||b.construction.state==='complete').length>=PATROL.minBuildings);
  const route=s.military.patrolRoute();assert.ok(route.length>=4,'a round exists');assert.equal(s.military.patrolRoute(),route,'kept until the buildings change');
  for(const p of route)assert.equal(s.map[p.y][p.x],0,'waypoints are walkable');
  const a=soldier(s,barracks,{x:50,y:54}),b=soldier(s,barracks,{x:51,y:54}),c=soldier(s,barracks,{x:52,y:54});
  const first=[a,b,c].map(w=>s.military.nextPatrolPoint(w));assert.equal(new Set(first.map(p=>`${p.x},${p.y}`)).size,3,'each starts at a point of his own');
  const index=a.patrolIndex;assert.deepEqual(s.military.nextPatrolPoint(a),route[(index+1)%route.length],'then the next point in order');
  until(s,()=>a.workMessage==='Patrolling the settlement'&&(a.path.length>0||a.nextTile),60000);
  // Guard: the existing hold command; the list shows the order.
  assert.equal(s.workerSystem.commands.hold(b),true);let rows=armyRows(s);
  assert.equal(rows.length,3+0+[...s.military.units.keys()].filter(id=>![a.id,b.id,c.id].includes(id)).length);
  assert.equal(rows.find(r=>r.id===b.id).order,'guard');assert.equal(rows.find(r=>r.id===a.id).order,'patrol');assert.ok(rows.every(r=>r.rank&&r.maxHp>0&&typeof r.state==='string'));
  for(let i=0;i<40;i++)s.tick(50);const tile={...b.tile};for(let i=0;i<200;i++)s.tick(50);assert.deepEqual(b.tile,tile,'the Guard stays (after finishing the step he was on)');
  s.workerSystem.commands.resume(b);assert.equal(armyRows(s).find(r=>r.id===b.id).order,'patrol');
  // Choosing: a click takes one, Shift + click adds and removes.
  let picked=armyPick(new Set(),a.id,false);picked=armyPick(picked,b.id,true);assert.deepEqual([...picked],[a.id,b.id]);picked=armyPick(picked,a.id,true);assert.deepEqual([...picked],[b.id]);assert.deepEqual([...armyPick(picked,c.id,false)],[c.id]);
});

test('army squads (owner, 12 Nov): chosen soldiers make a squad, a squad chooses all its soldiers, dissolving frees them, a soldier is in one squad at most; squads survive a save', async () => {
  const { squads,makeSquad,dissolveSquad,squadMembers } = await import('../src/ui/armySquads.js');const { armyRows } = await import('../src/ui/ArmyPanel.js');
  const {s,barracks}=kingdom(),[a,b,c,d]=[0,1,2,3].map(i=>soldier(s,barracks,{x:50+i,y:54}));
  assert.equal(makeSquad(s,[a]),null,'one soldier is no squad');
  assert.equal(makeSquad(s,[a,b,c]),1);assert.deepEqual(squads(s).map(g=>[g.id,g.members.length]),[[1,3]]);assert.equal(armyRows(s).find(r=>r.id===a.id).squad,1);
  assert.equal(makeSquad(s,[c,d]),2,'the next free number');assert.deepEqual(squadMembers(s,1).map(w=>w.id).sort(),[a.id,b.id].sort(),'c moved to the new squad');
  // Save and load keep the numbers.
  const loaded=scene(false);loadGameState(loaded,validateGameState(serializeGameState(s)));assert.deepEqual(squads(loaded).map(g=>[g.id,g.members.map(w=>w.id).sort()]),[[1,[a.id,b.id].sort()],[2,[c.id,d.id].sort()]]);
  // A squad left with one soldier ends; dissolving frees everyone; a soldier who leaves the army leaves the squad.
  assert.equal(makeSquad(s,[a,d]),3);assert.deepEqual(squads(s).map(g=>g.id),[3],'squads 1 and 2 kept one soldier each – gone');assert.equal(b.squad,undefined);assert.equal(c.squad,undefined);
  assert.equal(dissolveSquad(s,3),2);assert.deepEqual(squads(s).map(g=>g.id),[]);
  makeSquad(s,[a,b]);s.workplaceSystem.remove(a);s.tick(50);assert.equal(a.profession==='soldier',false);squads(s);assert.equal(a.squad,undefined);
  assert.doesNotThrow(()=>validateGameState(serializeGameState(s)));
});
test('m-kasarna-limit-zamestnani: a Barracks hires 4 automatically by default; the chosen number is saved', async () => {
  const { barracksAutoHire,BARRACKS_AUTO_HIRE_DEFAULT } = await import('../src/data/military.js');
  assert.equal(BARRACKS_AUTO_HIRE_DEFAULT,4);assert.equal(barracksAutoHire({},12),4);assert.equal(barracksAutoHire({autoHire:9},12),9);assert.equal(barracksAutoHire({autoHire:20},12),12);
  const {s,barracks}=kingdom();barracks.autoHire=7;const data=validateGameState(serializeGameState(s));assert.equal(data.buildings.find(b=>b.id===barracks.id).autoHire,7);
  const bad=structuredClone(data);bad.buildings.find(b=>b.id===barracks.id).autoHire=13;assert.throws(()=>validateGameState(bad));
  const { EmploymentSystem } = await import('../src/systems/EmploymentSystem.js');
  if(s.employment){barracks.autoHire=2;const open=s.employment.seats().filter(x=>x.building.id===barracks.id).length;assert.ok(open<=2,'no more than the limit');}
});
