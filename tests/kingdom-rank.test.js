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
  assert.equal(rank.rank,'settlement');assert.equal(rank.nextRank,'village');assert.equal(rank.total,5);assert.equal(rank.met,2);assert.equal(rank.ready,false);
  assert.equal(countedBuildings(few),3,'paving is not counted');
  const many=[...few,building('material_yard'),...Array.from({length:4},()=>building('house'))];
  rank=kingdomRank(many,{happiness:70,foodDays:10});assert.equal(rank.met,5);assert.equal(rank.ready,true);
  // Level 2 → 3: no conditions yet.
  rank=kingdomRank([building('castle',{level:2})],{});assert.equal(rank.rank,'village');assert.equal(rank.total,0);
  setLanguage('cs');assert.equal(kingdomRankLabel(kingdomRank(few,{happiness:80,foodDays:4})),'Úroveň království: Osada · 2/5');
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
