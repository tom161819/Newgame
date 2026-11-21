import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { BuildingUnlockManager,buildingUnlockStatus } from '../src/systems/BuildingUnlockManager.js';
import { BUILDING_UNLOCK_LEVEL,kingdomLevel,kingdomRank,countedBuildings } from '../src/data/kingdomRank.js';
import { castleUpgradePlan } from '../src/game/castleUpgrade.js';
import { kingdomRankLabel,kingdomRankTip } from '../src/ui/KingdomRankDisplay.js';
import { setLanguage } from '../src/i18n/index.js';

const done=(type,extra={})=>({type,...extra});
const building=(type,extra={})=>({type,construction:{state:'complete'},...extra});

test('m-uroven-kralovstvi: every buildable building has an unlock level 1–4; the owner\'s table',()=>{
  for(const d of objectRegistry.all().filter(d=>d.category==='building'&&d.buildable!==false))assert.ok([1,2,3,4].includes(BUILDING_UNLOCK_LEVEL[d.id]),d.id);
  assert.equal(BUILDING_UNLOCK_LEVEL.tower,2);assert.equal(BUILDING_UNLOCK_LEVEL.wall,3);assert.equal(BUILDING_UNLOCK_LEVEL.armory,4);assert.equal(BUILDING_UNLOCK_LEVEL.granary,1);
});
test('the kingdom level is the highest standing Castle level; a Castle being built does not count',()=>{
  assert.equal(kingdomLevel([]),1);
  assert.equal(kingdomLevel([building('castle',{level:3})]),3);
  assert.equal(kingdomLevel([{type:'castle',level:2,construction:{state:'building'}}]),1);
});
test('the rank shows the conditions for the next one: Granary, Material Yard, Happiness 70, food for 10 days, 8 buildings',()=>{
  const few=[building('castle',{level:1}),building('granary'),building('house'),building('stone_pavement')];
  let rank=kingdomRank(few,{happiness:80,foodDays:4});
  assert.equal(rank.rank,'settlement');assert.equal(rank.nextRank,'village');assert.equal(rank.total,6);assert.equal(rank.met,2);assert.equal(rank.ready,false);
  assert.equal(countedBuildings(few),2,'the Castle and paving are not counted');
  const many=[...few,building('material_yard'),...Array.from({length:5},()=>building('house'))];
  rank=kingdomRank(many,{happiness:70,foodDays:10,population:19});assert.equal(rank.met,5);assert.equal(rank.ready,false,'needs 20 residents');
  rank=kingdomRank(many,{happiness:70,foodDays:10,population:20});assert.equal(rank.met,6);assert.equal(rank.ready,true);
  // Owner 21 Nov 2026 – level 2 → 3: 2 Farmhouses, 8 fields (wheat, flax and orchards together), food for 10 days,
  // 20 buildings, Village Green, Marketplace (and 50 residents). Soldiers only for level 4: the Barracks unlock at 3.
  const town=[building('castle',{level:2}),building('farmhouse'),building('village_green'),building('marketplace'),...Array.from({length:4},()=>building('wheat_field')),building('flax_field'),building('flax_field'),building('orchard'),building('orchard'),...Array.from({length:8},()=>building('house'))];
  const stats={population:50,foodDays:10,soldiers:0};
  rank=kingdomRank(town,stats);assert.equal(rank.rank,'village');assert.equal(rank.total,7);assert.equal(rank.ready,false);
  assert.deepEqual(rank.items.filter(i=>!i.ok).map(i=>[i.id,i.current,i.target]),[['farmhouses',1,2],['buildings',19,20]]);
  rank=kingdomRank([...town,building('farmhouse')],stats);assert.equal(rank.ready,true);
  assert.equal(kingdomRank([...town.filter(b=>b.type!=='orchard'),building('farmhouse'),building('house'),building('house')],stats).ready,false,'6 fields are not enough');
  // Level 3 → 4: closed walls around at least half of the buildings, 40 soldiers (and 80 residents).
  const castle3=[building('castle',{level:3})];
  assert.equal(kingdomRank(castle3,{population:80,soldiers:40,walled:49}).ready,false);
  assert.deepEqual(kingdomRank(castle3,{population:80,soldiers:40,walled:50}).items.map(i=>i.id),['walled','soldiers','population']);
  assert.equal(kingdomRank(castle3,{population:80,soldiers:40,walled:50}).ready,true);
  setLanguage('cs');assert.equal(kingdomRankLabel(kingdomRank(few,{happiness:80,foodDays:4})),'Úroveň království: Osada · 2/6');
  assert.match(kingdomRankTip(kingdomRank(few,{happiness:80,foodDays:4})),/✗ Jídlo na 4 \/ 10 dní/);setLanguage('en');
});
test('buildings above the Castle level are locked in the game (kingdomRanks); pure placement checks are not',()=>{
  const world={objectRegistry,buildings:[building('castle',{level:1})],events:new EventEmitter(),kingdomRanks:true},manager=new BuildingUnlockManager(world);
  assert.equal(manager.status(objectRegistry.require('house')).unlocked,true);
  const tower=manager.status(objectRegistry.require('tower'));assert.equal(tower.unlocked,false);assert.equal(tower.level,2);assert.match(tower.description,/Castle level 2/);
  world.buildings[0].level=2;manager.refresh();assert.equal(manager.status(objectRegistry.require('tower')).unlocked,true);assert.equal(manager.status(objectRegistry.require('wall')).unlocked,false);
  assert.equal(buildingUnlockStatus(objectRegistry.require('armory'),[],objectRegistry).unlocked,true);
  world.sandbox=true;assert.equal(manager.status(objectRegistry.require('armory')).unlocked,true);manager.destroy();
});
test('the Castle upgrade to level 2 waits for the rank conditions',()=>{
  const castle=building('castle',{level:1,id:1,x:5,y:5,tiles:[]});
  const scene={kingdomRanks:true,buildings:[castle],objectRegistry,inventory:{canAfford:()=>true},foodSystem:{dailyConsumption:10,availablePortions:20}};
  const plan=castleUpgradePlan(scene,castle);assert.equal(plan.blocked,true);assert.equal(plan.next,2);assert.match(plan.error,/Village/);
});
test('the Castle level caps the population: 20 at level 1, 50 at level 2, 100 at level 3, none at level 4',async()=>{
  const { WorkerSystem } = await import('../src/systems/WorkerSystem.js');
  const cap=(level,houses)=>WorkerSystem.prototype.capacity.call({scene:{kingdomRanks:true,objectRegistry,buildings:[building('castle',{level}),...Array.from({length:houses},()=>building('house'))]},housingCapacity(){return 200;}});
  assert.equal(cap(1,0),20);assert.equal(cap(2,0),50);assert.equal(cap(3,0),100);assert.equal(cap(4,0),200);
  assert.equal(WorkerSystem.prototype.capacity.call({scene:{buildings:[]},housingCapacity(){return 200;}}),200,'no ranks (tests, sandbox scenes): no cap');
});
test('rank numbers: soldiers in the army and the share of buildings inside closed walls (Towers and Gates close the ring)', async () => {
  const { kingdomRankStats }=await import('../src/game/kingdomRankState.js');
  const map=Array.from({length:30},()=>Array(30).fill(0)),buildings=[];let id=1;
  const put=(type,x,y)=>{const b={id:id++,type,x,y,tiles:[{x,y}],definition:{id:type,width:1,height:1,navigation:type==='wall'?{walkableTop:true}:undefined}};buildings.push(b);return b;};
  for(let x=10;x<=18;x++){put('wall',x,10);put(x===14?'gate':'wall',x,18);}for(let y=11;y<=17;y++){put(y===14?'tower':'wall',10,y);put('wall',18,y);}
  put('house',12,12);put('house',15,15);put('house',3,3);put('house',25,25);put('house',4,25);
  const residents=[{profession:'soldier'},{profession:'soldier'},{profession:'farmer'}];
  const scene={map,buildings,workerSystem:{liveSubjects:()=>residents}};
  let stats=kingdomRankStats(scene);assert.equal(stats.soldiers,2);assert.equal(stats.walled,40,'2 of 5 houses inside; wall pieces are not counted');
  put('house',13,16);stats=kingdomRankStats({...scene,buildings:[...buildings]});assert.equal(stats.walled,50);
  stats=kingdomRankStats({...scene,buildings:buildings.filter(b=>!(b.type==='gate'))});assert.equal(stats.walled,0,'a gap opens the ring');
});
