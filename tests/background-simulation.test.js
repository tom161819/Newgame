import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { BackgroundSimulation } from '../src/systems/BackgroundSimulation.js';
import { BACKGROUND_SIMULATION } from '../src/data/backgroundSimulation.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { readSettings } from '../src/ui/SettingsPanel.js';
globalThis.document={querySelector:()=>({textContent:''})};

// A small working kingdom: a Warehouse and a Marketplace under construction need builders and haulers, a caravan waits
// at the Marketplace and an order sells Wood, so work, hauling, trade and meals all run.
function kingdom(){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  place('warehouse',58,40);place('marketplace',44,48);s.foodStorage.deposit(starter,'wood',60);s.foodStorage.deposit(starter,'apple',40);
  for(let i=0;i<4;i++){const w=s.workerSystem.create({x:50+i,y:46});assert.equal(s.workerSystem.jobs.assign(w,i<2?'hauler':'builder'),true);}
  assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  const c=s.caravans.active;c.stock={wheat:30,wood:10};c.gold=200;assert.equal(s.trade.place('sell','wood',20).ok,true);
  const tick=s.tick;s.tick=d=>{tick(d);s.trade.update();};
  return s;
}
function clock(){let t=1000;const now=()=>t;now.advance=ms=>{t+=ms;};return now;}
const state=s=>{const v=validateGameState(serializeGameState(s));return {time:v.time,inventory:v.inventory,workers:v.workers,buildings:v.buildings,trade:v.trade.orders,caravan:v.caravans};};

test('#60 OFF: a hidden tab pauses the game; nothing is caught up', () => {
  const s=kingdom(),now=clock(),bg=new BackgroundSimulation(s,{now}),before=s.gameTime.totalElapsed;
  bg.hide();now.advance(60000);assert.equal(bg.show(),0);assert.equal(bg.running,false);bg.runAll();assert.equal(s.gameTime.totalElapsed,before);
  assert.equal(readSettings(undefined).runInBackground,false,'off by default');
});

test('#60 ON: 60 s and 300 s in a hidden tab are simulated once with the authoritative step', () => {
  for(const away of [60000,300000]){
    const s=kingdom(),now=clock(),bg=new BackgroundSimulation(s,{now,enabled:true}),before=s.gameTime.totalElapsed;let finished=null;bg.onFinish=r=>{finished=r;};
    bg.hide();now.advance(away);assert.equal(bg.show(),away);assert.equal(bg.running,true);bg.runAll();
    assert.equal(s.gameTime.totalElapsed-before,away,'game time follows the real time away');assert.equal(finished.simulated,away);assert.equal(finished.skipped,0);
    assert.equal(finished.gameMs,away);assert.equal(finished.days,Math.floor((before+away)/s.gameTime.dayDuration)-Math.floor(before/s.gameTime.dayDuration));
    assert.equal(bg.show(),0,'the same absence is never counted twice');
  }
});

test('#60 catch-up gives the same kingdom as playing in the foreground with the same steps', () => {
  // The same seed for both games (wandering and caravan routes use Math.random).
  const random=Math.random,seeded=()=>{let x=42;return ()=>{x=(x*1664525+1013904223)%4294967296;return x/4294967296;};};
  try{
    Math.random=seeded();const a=kingdom();Math.random=seeded();const b=kingdom();assert.deepEqual(state(a),state(b),'identical starting worlds');
    Math.random=seeded();for(let ms=0;ms<300000;ms+=BACKGROUND_SIMULATION.stepMs)a.tick(BACKGROUND_SIMULATION.stepMs);
    Math.random=seeded();const now=clock(),bg=new BackgroundSimulation(b,{now,enabled:true});bg.hide();now.advance(300000);bg.show();bg.runAll();
    assert.deepEqual(state(b),state(a));
    assert.ok(a.trade.orders[0].delivered>0,'hauling and trade really happened');
  }finally{Math.random=random;}
});

test('#60 the absence is capped at 15 minutes and the rest is reported, not faked', () => {
  const s=kingdom(),now=clock(),bg=new BackgroundSimulation(s,{now,enabled:true,rules:{...BACKGROUND_SIMULATION,maxAbsenceMs:120000}}),before=s.gameTime.totalElapsed;let report;bg.onFinish=r=>{report=r;};
  bg.hide();now.advance(200000);assert.equal(bg.show(),120000);bg.runAll();
  assert.equal(s.gameTime.totalElapsed-before,120000);assert.equal(report.away,200000);assert.equal(report.skipped,80000);
  assert.equal(BACKGROUND_SIMULATION.maxAbsenceMs,15*60*1000,'the default limit is 15 minutes');
});

test('#60 quick tab switching, a pause and a hide during the catch-up never double or lose time', () => {
  const s=kingdom(),now=clock(),bg=new BackgroundSimulation(s,{now,enabled:true,rules:{...BACKGROUND_SIMULATION,frameBudgetMs:0}}),before=s.gameTime.totalElapsed;
  bg.hide();bg.hide();now.advance(10000);bg.show();bg.show();assert.equal(bg.pending,10000);
  bg.step();assert.ok(bg.pending<10000&&bg.running,'a small batch per frame');
  bg.hide();now.advance(5000);bg.show();assert.equal(bg.session.queued,15000,'a second absence joins the running catch-up');
  s.gameTime.setPaused(true);const held=bg.pending;bg.step();assert.equal(bg.pending,held,'paused: nothing runs');s.gameTime.setPaused(false);
  bg.runAll();assert.equal(s.gameTime.totalElapsed-before,15000);
  s.gameTime.setPaused(true);bg.hide();now.advance(30000);assert.equal(bg.show(),0,'a paused game stays paused while hidden');s.gameTime.setPaused(false);
  bg.hide();now.advance(-500);assert.equal(bg.show(),0,'a clock going backwards adds nothing');
});

test('#60 Game Over during the catch-up stops it', () => {
  const s=kingdom(),now=clock(),bg=new BackgroundSimulation(s,{now,enabled:true});let report;bg.onFinish=r=>{report=r;};
  const tick=s.tick,start=s.gameTime.totalElapsed;s.tick=d=>{tick(d);if(s.gameTime.totalElapsed-start>=30000)s.gameOver=true;};
  bg.hide();now.advance(300000);bg.show();bg.runAll();
  assert.equal(report.gameOver,true);assert.equal(s.gameTime.totalElapsed-start,30000,'no simulation after the King fell');assert.equal(bg.running,false);
});

test('#60 the summary comes from real changes and collects the feed events of the absence', () => {
  const s=kingdom(),now=clock(),pushed=[];s.eventFeed={push:(key,text,options)=>{pushed.push(text);return true;}};
  const bg=new BackgroundSimulation(s,{now,enabled:true});let report;bg.onFinish=r=>{report=r;};
  const gold=s.inventory.count('gold'),apples=s.inventory.count('apple');
  bg.hide();now.advance(300000);bg.show();s.eventFeed.push('test:1','The test event',{important:true});bg.runAll();
  const change=id=>report.changes.find(c=>c.resource===id)?.amount??0;
  assert.equal(change('gold'),Math.round(s.inventory.count('gold')-gold));assert.equal(change('apple'),Math.round(s.inventory.count('apple')-apples));
  assert.deepEqual(report.events[0],{text:'The test event',important:true});s.eventFeed.push('after','Later');assert.equal(report.events.length,1,'recording stops after the catch-up');
});

test('#60 Save/Load: the setting is not in a save and a loaded game does not catch up the time it was closed', () => {
  const s=kingdom();s.settingsPanel={settings:{fogOfWar:false,explorationMode:true,pathWearDebug:false,runInBackground:true,memoryBrightness:.3},applySettings(){}};
  const saved=validateGameState(serializeGameState(s));assert.equal('runInBackground' in saved.settings,false);
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.caravans=new CaravanSystem(r);r.trade=new TradeSystem(r);loadGameState(r,saved);
  const bg=new BackgroundSimulation(r,{enabled:true});assert.equal(bg.running,false);assert.equal(bg.show(),0,'nothing to catch up after loading');
});
