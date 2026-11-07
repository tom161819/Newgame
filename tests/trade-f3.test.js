import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { autoRule,AUTO_TRADE } from '../src/data/trade.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

function world({wood=40,gold=0}={}){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  place('warehouse',58,40);const market=place('marketplace',44,48);
  if(wood)s.foodStorage.deposit(starter,'wood',wood);if(gold)s.inventory.add('gold',gold);
  for(let i=0;i<2;i++){const w=s.workerSystem.create({x:50+i,y:46});assert.equal(s.workerSystem.jobs.assign(w,'hauler'),true);}
  assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  const c=s.caravans.active;c.stock={wheat:30,wood:10};c.gold=200;
  const run=(until,max=180000)=>{let n=0;while(!until()&&n<max){s.tick(50);s.trade.update();n+=50;}assert.ok(until(),`not reached in ${n} ms`);};
  return {s,c,market,starter,run};
}
const auto=s=>s.trade.orders.filter(o=>o.auto);

test('F3 rules: one rule per good, whole numbers, a buy target not below its trigger', () => {
  assert.equal(autoRule({mode:'buy',below:20,upTo:10,maxPrice:5}).error,'upTo');assert.equal(autoRule({mode:'sell',keep:-1,minPrice:2}).error,'keep');assert.equal(autoRule({mode:'sell',keep:5,minPrice:0}).error,'minPrice');
  assert.equal(autoRule({mode:'swap'}).error,'mode');assert.deepEqual(autoRule({mode:'sell',keep:'7',minPrice:2,extra:1}).rule,{mode:'sell',keep:7,minPrice:2});
  const {s}=world();assert.deepEqual(s.trade.auto,{enabled:false,budget:AUTO_TRADE.defaultBudget,rules:{},visit:null},'off by default');
  assert.equal(s.trade.setAutoRule('wood',{mode:'sell',keep:10,minPrice:1}).ok,true);assert.equal(s.trade.setAutoRule('wood',{mode:'buy',below:5,upTo:9,maxPrice:9}).ok,true);
  assert.deepEqual(Object.keys(s.trade.auto.rules),['wood']);assert.equal(s.trade.auto.rules.wood.mode,'buy','a good cannot both buy and sell automatically');
  assert.equal(s.trade.setAutoRule('gold',{mode:'sell',keep:0,minPrice:1}).error,'resource');assert.equal(s.trade.setAutoRule('wood',null).ok,true);assert.deepEqual(s.trade.auto.rules,{});
  assert.equal(s.trade.setAutoBudget(-1),false);assert.equal(s.trade.setAutoBudget(250),true);assert.equal(s.trade.auto.budget,250);
});

test('F3 nothing is traded while automatic trade is off or no rule fits the price', () => {
  const {s}=world();s.trade.setAutoRule('wood',{mode:'sell',keep:0,minPrice:1});s.trade.update();assert.equal(s.trade.orders.length,0,'off');
  s.trade.setAutoEnabled(true);s.trade.setAutoRule('wood',{mode:'sell',keep:0,minPrice:99});s.trade.update();assert.equal(s.trade.orders.length,0,'price too low');
  s.trade.setAutoRule('wood',null);s.trade.setAutoRule('wheat',{mode:'buy',below:20,upTo:25,maxPrice:1});s.trade.update();assert.equal(s.trade.orders.length,0,'price too high');
});

test('F3 auto sell: only what is above the reserve, once per caravan visit, paid on hand-over', () => {
  const {s,c,run}=world();const before=s.foodStorage.available('wood');s.trade.setAutoEnabled(true);s.trade.setAutoRule('wood',{mode:'sell',keep:10,minPrice:1});
  s.trade.update();const [o]=auto(s);assert.ok(o,'placed');assert.equal(o.side,'sell');assert.equal(o.quantity,Math.min(before-10,Math.floor(c.gold/o.price)));assert.equal(o.price,s.trade.unitPrice('wood','sell')||o.price);
  const gold=s.inventory.count('gold');run(()=>o.status==='Completed');assert.equal(s.inventory.count('gold'),gold+o.quantity*o.price);
  assert.equal(before-o.quantity,10,'the reserve is kept (builders may still use it)');
  s.foodStorage.deposit(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`,'wood',30);s.trade.autoCheckedAt=undefined;s.trade.update();
  assert.equal(auto(s).length,1,'one automatic order per good per visit');assert.deepEqual(s.trade.auto.visit.done,['wood']);
});

test('F3 auto buy: when stock is low, up to the target, within the budget and the maximum price', () => {
  const {s,c,run}=world({gold:300});s.trade.setAutoEnabled(true);s.trade.setAutoBudget(20);s.trade.setAutoRule('wheat',{mode:'buy',below:20,upTo:25,maxPrice:50});
  const unit=s.trade.unitPrice('wheat','buy');s.trade.update();const [o]=auto(s);assert.ok(o);assert.equal(o.side,'buy');assert.equal(o.quantity,Math.min(25,Math.floor(20/unit)));
  assert.equal(s.trade.auto.visit.spent,o.quantity*o.price);assert.ok(s.trade.auto.visit.spent<=20,'never over the budget');
  run(()=>o.status==='Completed');assert.equal(c.stock.wheat,30-o.quantity);
  const {s:t}=world({gold:300});t.trade.setAutoEnabled(true);t.trade.setAutoRule('wheat',{mode:'buy',below:20,upTo:25,maxPrice:50});t.trade.update();
  assert.equal(auto(t)[0].quantity,Math.min(25,Math.floor(AUTO_TRADE.defaultBudget/t.trade.unitPrice('wheat','buy'))));
  const {s:u}=world({gold:300});u.trade.setAutoEnabled(true);u.trade.setAutoRule('wheat',{mode:'buy',below:0,upTo:25,maxPrice:50});u.trade.update();assert.equal(u.trade.orders.length,0,'stock is not below the trigger');
});

test('F3 automatic orders fit before the caravan leaves and stop when it is about to go', () => {
  const {s,c}=world({wood:400});s.trade.setAutoEnabled(true);s.trade.setAutoRule('wood',{mode:'sell',keep:0,minPrice:1});c.gold=5000;
  c.departAt=s.caravans.now+0.02*s.gameTime.dayDuration;const leavesIn=s.caravans.status().active.leavesIn;s.trade.update();
  for(const o of auto(s))assert.ok(s.trade.estimate('sell','wood',o.quantity,c.marketplaceId)<=leavesIn,'deliverable in time');
  const {s:t,c:d}=world();t.trade.setAutoEnabled(true);t.trade.setAutoRule('wood',{mode:'sell',keep:0,minPrice:1});d.waiting=true;t.trade.update();assert.equal(t.trade.orders.length,0,'not while the caravan waits to leave');
});

test('F3 food: selling food below three days of meals for everyone shows a warning', () => {
  const {s,starter}=world();const reserve=s.trade.foodReserve();assert.equal(reserve,(s.workerSystem.liveWorkers().length+1)*2*3);
  s.foodStorage.deposit(starter,'apple',reserve+5);
  assert.ok(s.trade.autoWarning('apple',{mode:'sell',keep:0,minPrice:1}),'selling all apples');
  assert.equal(s.trade.autoWarning('apple',{mode:'sell',keep:reserve,minPrice:1}),null,'keeping enough');
  assert.equal(s.trade.autoWarning('wood',{mode:'sell',keep:0,minPrice:1}),null,'not food');
});

test('F3 rules and the visit survive a save; broken rules are rejected', () => {
  const {s}=world();s.trade.setAutoEnabled(true);s.trade.setAutoRule('wood',{mode:'sell',keep:10,minPrice:1});s.trade.setAutoRule('wheat',{mode:'buy',below:5,upTo:9,maxPrice:9});s.trade.update();
  const saved=validateGameState(serializeGameState(s));assert.deepEqual(saved.trade.auto,s.trade.auto);assert.equal(saved.trade.orders.find(o=>o.auto).auto,true);
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.caravans=new CaravanSystem(r);r.trade=new TradeSystem(r);loadGameState(r,saved);
  assert.deepEqual(r.trade.auto,s.trade.auto);r.trade.update();assert.equal(r.trade.orders.filter(o=>o.auto).length,auto(s).length,'no second order after loading');
  const bad=structuredClone(serializeGameState(s));bad.trade.auto.rules.wheat.upTo=1;assert.throws(()=>validateGameState(bad));
  const both=structuredClone(serializeGameState(s));both.trade.auto.rules.wood.below=3;assert.throws(()=>validateGameState(both));
  const flag=structuredClone(serializeGameState(s));flag.trade.orders[0].auto=false;assert.throws(()=>validateGameState(flag));
});
