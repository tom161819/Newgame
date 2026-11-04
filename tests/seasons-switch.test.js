import test from 'node:test';
import assert from 'node:assert/strict';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { SeasonSystem } from '../src/systems/SeasonSystem.js';
import { gameSettings,DEFAULT_GAME_SETTINGS } from '../src/systems/GameSettings.js';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const system=(options={})=>{const time=new GameTimeSystem(60000),seasons=new SeasonSystem(time,{random:()=>0,...options});return {time,seasons};};
const scene=({enabled=true,starter=true}={})=>{const s=workerScene(undefined,{construction:true,logistics:true,seasons:true,starter,gameSettings:gameSettings({seasonsEnabled:enabled,dayLengthSeconds:60,wildlifeRespawn:'off'})});s.workerSystem.unsubscribe();s.seasons.random=()=>0;s.seasons.weather='Sunny';return s;};
function completed(s,type,x,y){const d=s.objectRegistry.require(type);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function farm(s){completed(s,'granary',50,45);completed(s,'farmhouse',44,45);return {wheat:completed(s,'wheat_field',44,50),orchard:completed(s,'orchard',49,50)};}

test('Seasons defaults ON; an OFF new game starts effective Summer with an untouched remembered Spring',()=>{
  assert.equal(DEFAULT_GAME_SETTINGS.seasonsEnabled,true);for(const bad of [0,1,'false',null])assert.throws(()=>gameSettings({seasonsEnabled:bad}));
  const {time,seasons}=system({enabled:false});assert.equal(seasons.season,'Summer');assert.equal(seasons.calendar.season,'Spring');assert.match(seasons.label,/Summer \(Seasons OFF\)/);time.update(9*60000+12345);assert.equal(time.day,10);assert.equal(seasons.cycleDay,1);assert.equal(seasons.cycleElapsed,0);assert.equal(seasons.canHarvest('orchard'),true);
});
test('OFF remembers a partial autumn day exactly; ON resumes it after ten ordinary days without catching up',()=>{
  const {time,seasons}=system();time.update(12*60000+23001);assert.equal(seasons.calendar.season,'Autumn');assert.equal(seasons.calendar.dayInSeason,3);const remembered=[seasons.cycleDay,seasons.cycleElapsed,seasons.cycleCompensation];
  seasons.setEnabled(false);time.update(10*60000+11777);assert.deepEqual([seasons.cycleDay,seasons.cycleElapsed,seasons.cycleCompensation],remembered);assert.equal(seasons.season,'Summer');
  seasons.setEnabled(true);assert.deepEqual([seasons.cycleDay,seasons.cycleElapsed,seasons.cycleCompensation],remembered);time.update(60000-23001);assert.equal(seasons.calendar.dayInSeason,4);assert.equal(seasons.cycleElapsed,0);assert.equal(time.day,24);
});
test('weather keeps one daily roll, uses Summer probabilities while OFF and does not reroll on toggles or load',()=>{
  let rolls=0;const {time,seasons}=system({random:()=>{rolls++;return .99;}});time.update(15*60000+123);assert.equal(seasons.weather,'Frost');const n=rolls;
  seasons.setEnabled(false);assert.equal(seasons.weather,'Frost');assert.equal(rolls,n);time.update(60000);assert.equal(seasons.weather,'Drought');assert.equal(rolls,n+1);
  for(let i=0;i<10;i++){seasons.setEnabled(true);seasons.setEnabled(false);}assert.equal(rolls,n+1);const saved=seasons.exportState();seasons.importState(saved);assert.equal(rolls,n+1);seasons.setEnabled(true);time.update(60000);assert.equal(seasons.weather,'Frost');assert.equal(rolls,n+2);
});
test('a restored constructor can use stored weather without drawing another random value',()=>{
  const {seasons}=system({initialWeather:'Rainy',random:()=>{throw Error('Unexpected load weather roll');}});assert.equal(seasons.weather,'Rainy');
});
test('season boundaries split a resumed offset day exactly, independent of FPS and large time steps',()=>{
  const results=[];
  for(const fps of [1,30,144,0]){
    const {time,seasons}=system();let growth=0;time.onAdvance(delta=>{growth+=delta/60000*seasons.growthMultiplier();});
    time.update(15*60000+23456);seasons.setEnabled(false);time.update(10*60000+9876);seasons.setEnabled(true);growth=0;
    const duration=6*60000+12345,step=fps?1000/fps:duration,frames=Math.floor(duration/step);for(let frame=0;frame<frames;frame++)time.update(step);time.update(duration-frames*step);
    results.push({growth,day:seasons.cycleDay,elapsed:seasons.cycleElapsed});
  }
  for(const result of results.slice(1)){near(result.growth,results[0].growth);assert.equal(result.day,results[0].day);near(result.elapsed,results[0].elapsed);}
});
test('pause freezes ordinary time and the remembered cycle, including across repeated ON/OFF toggles',()=>{
  const {time,seasons}=system();time.update(71234);const original=[seasons.cycleDay,seasons.cycleElapsed];time.setPaused(true);seasons.setEnabled(false);time.update(900000);seasons.setEnabled(true);time.update(900000);assert.deepEqual([seasons.cycleDay,seasons.cycleElapsed],original);assert.equal(time.totalElapsed,71234);
  assert.equal(seasons.setEnabled(true),false);assert.throws(()=>seasons.setEnabled('off'));seasons.destroy();assert.equal(time.boundaries.size,0);
});
test('switching Winter OFF resumes biological growth and orchard fruit without resetting stored crop progress or granting harvests',()=>{
  const s=scene();s.gameTime.update(15*60000+12345);const {wheat,orchard}=farm(s);assert.equal(s.seasons.season,'Winter');const w=s.farmingSystem.sync(wheat).growthDays,o=s.farmingSystem.sync(orchard).growthDays;
  s.seasons.setEnabled(false);assert.equal(s.farmingSystem.records.get(wheat.id).growthDays,w);assert.equal(s.farmingSystem.records.get(orchard.id).growthDays,o);assert.equal(s.seasons.canHarvest('orchard'),true);s.gameTime.update(60000);assert.ok(s.farmingSystem.sync(orchard).growthDays>o);assert.ok(s.farmingSystem.sync(wheat).growthDays>w);assert.equal(s.inventory.count('apple'),0);assert.equal(s.inventory.count('wheat'),0);
  s.seasons.setEnabled(true);const frozen=s.farmingSystem.sync(orchard).growthDays;s.gameTime.update(60000);assert.equal(s.farmingSystem.sync(orchard).growthDays,frozen);assert.equal(s.farmingSystem.records.get(orchard.id).stage,0);assert.equal(s.seasons.canHarvest('orchard'),false);
});
test('permanent Summer supports actual farmer harvesting and physical delivery of both wheat and fruit during remembered Winter',()=>{
  const s=scene();s.gameTime.update(15*60000);const {wheat,orchard}=farm(s),home=s.buildings.find(b=>b.type==='farmhouse');s.seasons.setEnabled(false);s.gameTime.update(3*60000);assert.equal(s.farmingSystem.ripe(wheat),true);assert.equal(s.farmingSystem.ripe(orchard),true);assert.equal(s.inventory.count('apple'),0);assert.equal(s.inventory.count('wheat'),0);
  const worker=s.workerSystem.create({x:43,y:45});assert.equal(s.workplaceSystem.assign(home,worker),true);let elapsed=0;while(s.inventory.count('apple')===0&&elapsed<90000){s.tick(25);elapsed+=25;}
  assert.ok(s.inventory.count('apple')>0);assert.equal(s.inventory.count('wheat'),8);assert.equal(s.farmingSystem.records.get(wheat.id).cycle,1);assert.equal(s.farmingSystem.records.get(orchard.id).cycle,1);assert.equal(worker.skills.farming.totalXP,18);assert.equal(s.seasons.calendar.season,'Winter');assert.equal(s.seasons.season,'Summer');validateGameState(serializeGameState(s));
});
test('active-time, wages and daily income continue once per game day while the seasonal clock is stopped',()=>{
  const s=scene({enabled:false});completed(s,'castle',56,45);s.inventory.add('apple',20);let days=0;s.gameTime.onNewDay(()=>days++);s.gameTime.update(3*60000+12000);assert.equal(days,3);assert.equal(s.inventory.count('gold'),15);assert.equal(s.seasons.cycleDay,1);assert.equal(s.seasons.lastProcessedDay,4);assert.equal(s.wageSystem.lastProcessedDay,4);near(s.foodSystem.residents.get('king').progress,.4);
});
test('Save/Load preserves OFF, effective Summer, exact remembered winter progress and crop clocks without duplicate consumption',()=>{
  const s=scene();farm(s);s.gameTime.update(15*60000+23456);s.seasons.setEnabled(false);s.gameTime.update(10*60000+9876);const saved=validateGameState(serializeGameState(s));assert.equal(saved.saveVersion,SAVE_VERSION);assert.equal(saved.gameSettings.seasonsEnabled,false);assert.equal(saved.seasons.season,'Summer');assert.equal(saved.seasons.rememberedSeason,'Winter');
  const r=scene({starter:false});loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);assert.equal(r.seasons.season,'Summer');s.seasons.setEnabled(true);r.seasons.setEnabled(true);s.gameTime.update(87654);r.gameTime.update(87654);assert.deepEqual(serializeGameState(r),serializeGameState(s));
});
test('new saves reject inconsistent settings, forged remembered calendars, missing cycle data and clocks ahead of game time',()=>{
  const s=scene();s.gameTime.update(15*60000+23456);s.seasons.setEnabled(false);const saved=serializeGameState(s);
  for(const mutate of [x=>x.gameSettings.seasonsEnabled=true,x=>x.seasons.rememberedSeason='Spring',x=>x.seasons.season='Winter',x=>delete x.seasons.enabled,x=>delete x.seasons.cycleElapsed,x=>x.seasons.cycleDay=100,x=>x.seasons.cycleElapsed=60000,x=>x.seasons.year=999]){const bad=structuredClone(saved);mutate(bad);assert.throws(()=>validateGameState(bad));}
});
test('resuming remembered Winter cancels a partial summer fruit harvest and its reservations; retry grants one real harvest',()=>{
  const s=scene();s.gameTime.update(15*60000);completed(s,'granary',50,45);const home=completed(s,'farmhouse',44,45),orchard=completed(s,'orchard',49,50);s.seasons.setEnabled(false);s.gameTime.update(3*60000);const worker=s.workerSystem.create({x:43,y:45});s.workplaceSystem.assign(home,worker);
  let elapsed=0;while(!(worker.workTask?.kind==='harvest'&&worker.workTask.progressMs>=1000)&&elapsed<60000){s.tick(25);elapsed+=25;}assert.equal(worker.workTask?.kind,'harvest');assert.equal(s.farmingSystem.records.get(orchard.id).reservedBy,worker.id);
  s.seasons.setEnabled(true);s.tick(25);assert.equal(worker.workTask,null);assert.equal(s.farmingSystem.records.get(orchard.id).reservedBy,null);assert.equal(s.foodStorage.reservations.size,0);assert.equal(worker.skills.farming.totalXP,0);assert.equal(s.inventory.count('apple'),0);validateGameState(serializeGameState(s));
  s.seasons.setEnabled(false);elapsed=0;while(s.inventory.count('apple')===0&&elapsed<60000){s.tick(25);elapsed+=25;}assert.ok(s.inventory.count('apple')>0);assert.equal(s.farmingSystem.records.get(orchard.id).cycle,1);assert.equal(worker.skills.farming.totalXP,10);validateGameState(serializeGameState(s));
});
