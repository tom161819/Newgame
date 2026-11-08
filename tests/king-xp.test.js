// m-kral-odmeny-xp (owner request 39): Royal tasks give the King skill points; the King spends them on his ordinary
// skills (one point = one level) or on Leadership (work speed in his sight) and Stewardship (tax yield).
import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { PolicySystem } from '../src/systems/PolicySystem.js';
import { RoyalGoals } from '../src/systems/RoyalGoals.js';
import { KingSkills,validKingSkillState } from '../src/systems/KingSkills.js';
import { KING_SKILLS } from '../src/data/kingSkills.js';
import { ROYAL_GOALS } from '../src/data/royalGoals.js';
import { getXPRequired,totalXPForLevel } from '../src/data/experience.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import en from '../src/i18n/en.js';
import cs from '../src/i18n/cs.js';
import { t,setLanguage } from '../src/i18n/index.js';

globalThis.document??={querySelector:()=>({textContent:''})};

function world({residents=0}={}){
  const s=workerScene(undefined,{gameSettings:gameSettings()});s.policy=new PolicySystem(s);
  s.feed=[];s.eventFeed={push:(key,text)=>s.feed.push([key,text])};
  s.royalGoals=new RoyalGoals(s);s.kingSkills=new KingSkills(s,s.royalGoals);
  s.buildings.push({id:900,type:'castle',x:10,y:10,tiles:[]});
  for(let i=0;i<residents;i++)s.workerSystem.create({x:40+i,y:40});
  return s;
}
const houses=s=>{for(let i=0;i<3;i++)s.buildings.push({id:800+i,type:'house',x:20+i*3,y:20,tiles:[]});};

test('goal data: every Royal task gives 1–3 skill points; texts exist in both languages',()=>{
  for(const g of ROYAL_GOALS)assert.ok(Number.isInteger(g.skillPoints)&&g.skillPoints>=1&&g.skillPoints<=3,g.id);
  for(const key of ['kingSkills.earned','kingSkills.title','kingSkills.points','kingSkills.leadership','kingSkills.stewardship','kingSkills.leadershipTip','kingSkills.stewardshipTip','kingSkills.skillTip','kingSkills.combatTip','goals.res.points'])assert.ok(en[key]&&cs[key],key);
  assert.deepEqual(Object.keys(KING_SKILLS),['leadership','stewardship']);assert.equal(KING_SKILLS.leadership.maxLevel,5);assert.equal(KING_SKILLS.stewardship.maxLevel,5);
  assert.equal(KING_SKILLS.leadership.workBonusPerLevel,.03);assert.equal(KING_SKILLS.stewardship.taxBonusPerLevel,.04);
});

test('a completed Royal task adds its points and a feed line',()=>{
  const s=world();houses(s);assert.equal(s.kingSkills.points,0);
  assert.deepEqual(s.royalGoals.check().map(g=>g.id),['houses3']);
  assert.equal(s.kingSkills.points,ROYAL_GOALS.find(g=>g.id==='houses3').skillPoints);
  assert.equal(s.feed.length,1);assert.equal(s.feed[0][1],'The King earned 1 skill point.');
  s.royalGoals.check();assert.equal(s.kingSkills.points,1,'paid once');
  s.kingSkills.award(2,'test');assert.equal(s.feed.at(-1)[1],'The King earned 2 skill points.');
  assert.equal(t('kingSkills.earned',{count:2}),'The King earned 2 skill points.');
  setLanguage('cs');try{assert.equal(t('kingSkills.earned',{count:2}),'Král získal 2 body dovedností.');}finally{setLanguage('en');}
  // A pre-feature save marking met goals silently gives no points.
  const old=world();houses(old);old.royalGoals.importState(undefined);old.royalGoals.check();assert.equal(old.kingSkills.points,0);
});

test('spending a point raises the skill one level and removes the point; max level and no points refuse',()=>{
  const s=world(),k=s.kingSkills,c=s.character;k.award(3);
  s.skillSystem.addXP(c,'combat',30);const before={...c.skills.combat};
  assert.equal(k.spend('combat'),true);assert.equal(k.points,2);
  assert.equal(c.skills.combat.level,before.level+1);assert.equal(c.skills.combat.currentXP,before.currentXP,'gathered XP kept');
  assert.equal(c.skills.combat.xpToNextLevel,getXPRequired(before.level+1));assert.equal(c.skills.combat.totalXP,totalXPForLevel(before.level+1)+before.currentXP);
  assert.equal(k.spend('leadership'),true);assert.equal(k.levels.leadership,1);assert.equal(k.points,1);
  assert.equal(k.spend('nonsense'),false);assert.equal(k.points,1);
  c.skills.mining.level=c.skills.mining.maxLevel;assert.equal(k.spend('mining'),false,'ordinary skill at max');
  k.levels.stewardship=5;assert.equal(k.spend('stewardship'),false,'royal skill at max');
  assert.equal(k.spend('woodcutting'),true);assert.equal(k.points,0);assert.equal(k.spend('woodcutting'),false,'no points left');
});

test('Leadership speeds up residents only within the King\'s sight, never the King',()=>{
  const s=world({residents:2}),[near,far]=s.workerSystem.liveWorkers(),c=s.character;
  near.position={x:c.position.x+2,y:c.position.y};far.position={x:c.position.x+60,y:c.position.y};
  const nearBase=s.skillSystem.workEfficiency(near,'mining'),farBase=s.skillSystem.workEfficiency(far,'mining'),kingBase=s.skillSystem.workEfficiency(c,'mining');
  s.kingSkills.award(2);s.kingSkills.spend('leadership');s.kingSkills.spend('leadership');s.kingSkills.sight=null;
  assert.ok(Math.abs(s.skillSystem.workEfficiency(near,'mining')-nearBase*1.06)<1e-9,'+3 % per level');
  assert.equal(s.skillSystem.workEfficiency(far,'mining'),farBase,'outside sight');
  assert.equal(s.skillSystem.workEfficiency(c,'mining'),kingBase,'the King himself');
  c.isAlive=false;s.kingSkills.sight=null;assert.equal(s.skillSystem.workEfficiency(near,'mining'),nearBase,'a dead King leads no one');
});

test('Stewardship raises the tax yield by 4 % a level',()=>{
  const s=world({residents:10}),people=s.policy.residents().length,base=s.policy.dailyTaxes();
  assert.equal(base,Math.round(people*.5*100)/100);
  s.kingSkills.award(5);for(let i=0;i<5;i++)assert.ok(s.kingSkills.spend('stewardship'));
  assert.equal(s.policy.dailyTaxes(),Math.round(people*.5*1.2*100)/100);
  assert.equal(s.policy.target(),0,'Happiness of the tax rate unchanged');
  const gold=s.inventory.count('gold'),castle=s.production.dailyIncome().gold??0;s.gameTime.update(s.gameTime.dayDuration);
  assert.ok(Math.abs(s.inventory.count('gold')-(gold+castle+Math.round(people*.5*1.2*100)/100))<1e-9);
});

test('Save/Load keeps unspent points, royal levels and bought King skill levels; bad saves are rejected',()=>{
  // Points are capped by what the finished tasks gave (here 1+1+1+2 = 5).
  const s=world();
  s.royalGoals.importState({done:['houses3','pop10','bread','pop20'],produced:{}});s.kingSkills.points=5;
  s.kingSkills.spend('leadership');s.kingSkills.spend('stewardship');s.kingSkills.spend('combat');
  const combat=s.character.skills.combat.level;
  const saved=validateGameState(serializeGameState(s));assert.deepEqual(saved.kingSkills,{points:2,leadership:1,stewardship:1});
  const r=workerScene(saved.terrain,{starter:false,gameSettings:gameSettings()});r.policy=new PolicySystem(r);r.royalGoals=new RoyalGoals(r);r.kingSkills=new KingSkills(r,r.royalGoals);
  loadGameState(r,saved);assert.deepEqual(r.kingSkills.exportState(),saved.kingSkills);assert.equal(r.character.skills.combat.level,combat);
  for(const corrupt of [k=>k.points=-1,k=>k.points=1.5,k=>k.leadership=6,k=>k.stewardship='2',k=>k.extra=1,k=>delete k.points,k=>k.points=100]){const bad=structuredClone(saved);corrupt(bad.kingSkills);assert.throws(()=>validateGameState(bad),JSON.stringify(bad.kingSkills));}
  const none=structuredClone(saved);none.royalGoals.done=[];assert.throws(()=>validateGameState(none),'points without finished tasks');
  const old=structuredClone(saved);delete old.kingSkills;assert.ok(validateGameState(old),'the field is optional');
  const o=workerScene(old.terrain,{starter:false,gameSettings:gameSettings()});o.royalGoals=new RoyalGoals(o);o.kingSkills=new KingSkills(o,o.royalGoals);loadGameState(o,old);assert.deepEqual(o.kingSkills.exportState(),{points:0,leadership:0,stewardship:0});
  assert.equal(validKingSkillState({points:0,leadership:0,stewardship:0}),true);assert.equal(validKingSkillState(null),false);assert.equal(validKingSkillState([]),false);
});
