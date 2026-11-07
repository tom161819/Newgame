import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { demand,price,priceTable,merchantTypical,MERCHANT_TYPES,BASE_PRICES,PRICE_MODEL } from '../src/data/trade.js';
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

test('F2 demand factor stays within 0.75–1.35 and names its reasons', () => {
  for(const r of Object.keys(BASE_PRICES))for(const k of [0,1,10,50,500,null])for(const m of [0,3,30,300,null]){
    const d=demand({resource:r,kingdomStock:k,merchantStock:m,merchantTypical:m===null?null:10});
    assert.ok(d.factor>=PRICE_MODEL.min&&d.factor<=PRICE_MODEL.max,`${r} ${k} ${m}: ${d.factor}`);
    for(const reason of d.reasons)assert.ok(['kingdomLow','kingdomHigh','merchantLow','merchantHigh'].includes(reason.id));
  }
  assert.deepEqual(demand({resource:'wood'}),{factor:1,reasons:[]},'no context, no change');
  assert.deepEqual(demand({resource:'wood',kingdomStock:PRICE_MODEL.defaultReference}).reasons,[],'the reference amount is the normal price');
});

test('F2 scarce goods cost more, plenty costs less, and buying is always dearer than selling', () => {
  const scarce=demand({resource:'wheat',kingdomStock:0,merchantStock:0,merchantTypical:20}),plenty=demand({resource:'wheat',kingdomStock:400,merchantStock:60,merchantTypical:20});
  assert.ok(scarce.factor>1&&plenty.factor<1);assert.deepEqual(scarce.reasons.map(r=>r.id),['kingdomLow','merchantLow']);assert.deepEqual(plenty.reasons.map(r=>r.id),['kingdomHigh','merchantHigh']);
  for(const r of Object.keys(BASE_PRICES)){
    assert.ok(price(r,'buy',scarce)>=price(r,'buy',plenty)&&price(r,'sell',scarce)>=price(r,'sell',plenty),r);
    for(const factor of [PRICE_MODEL.min,1,PRICE_MODEL.max])assert.ok(price(r,'buy',{factor})>price(r,'sell',{factor}),`${r} at ${factor}`);
  }
  const {s}=world();const rows=priceTable(s.objectRegistry,r=>s.trade.marketContext(r));
  for(const row of rows){assert.ok(row.buy>row.sell);assert.equal(row.buy,s.trade.unitPrice(row.resource,'buy'));assert.ok(Number.isFinite(row.factor)&&Array.isArray(row.reasons));}
});

test('F2 no instant arbitrage: buying and selling straight back never earns Gold', () => {
  for(const [type] of Object.entries(MERCHANT_TYPES))for(const r of Object.keys(BASE_PRICES)){
    const typical=merchantTypical(type,r);
    for(const k of [0,5,20,100])for(const m of [0,5,20,80])for(const n of [1,5,20]){
      const at=(kingdomStock,merchantStock)=>demand({resource:r,kingdomStock,merchantStock,merchantTypical:typical});
      if(m>=n)assert.ok(price(r,'sell',at(k+n,m-n))<=price(r,'buy',at(k,m)),`buy back ${type} ${r} ${k}/${m}/${n}`);
      if(k>=n)assert.ok(price(r,'buy',at(k-n,m+n))>=price(r,'sell',at(k,m)),`sell back ${type} ${r} ${k}/${m}/${n}`);
    }
  }
});

test('F2 statistics: each hand-over is recorded once, with totals, top goods, recent trades and price history', () => {
  const {s,c,run}=world();assert.equal(s.trade.summary().transactions,0);
  const o=s.trade.place('sell','wood',20).order,unit=o.price;run(()=>o.status==='Completed');s.trade.update();
  const sum=s.trade.summary();assert.equal(sum.sold,20*unit);assert.equal(sum.bought,0);assert.equal(sum.balance,20*unit);assert.ok(sum.transactions>=1);
  assert.equal(sum.top[0].resource,'wood');assert.equal(sum.top[0].sold,20);assert.equal(sum.recent.reduce((n,r)=>n+r.quantity,0),20);assert.ok(sum.recent.every(r=>r.side==='sell'&&r.price===unit));
  assert.equal(s.trade.stats.history.wood.at(-1).sell,unit);assert.equal(c.gold,200-20*unit);
  s.trade.recordOffers(c);assert.ok(s.trade.stats.history.wheat.at(-1).buy>s.trade.stats.history.wheat.at(-1).sell,'offers on arrival');
});

test('F2 price history keeps only the last 20 days and recent trades are capped', () => {
  const {s}=world({wood:0});let day=1;s.trade.today=()=>day;
  for(;day<=30;day++){s.trade.history('wood',{sell:3});s.trade.record('buy','wheat',1,2);}
  day=30;assert.equal(s.trade.stats.history.wood.length,PRICE_MODEL.historyDays);assert.equal(s.trade.stats.history.wood[0].day,30-PRICE_MODEL.historyDays+1);
  assert.equal(s.trade.stats.recent.length,PRICE_MODEL.recentTrades);assert.equal(s.trade.stats.recent[0].day,30);
  day=60;s.trade.history('apple',{sell:2});assert.equal(s.trade.stats.history.wood,undefined,'old goods drop out');
});

test('F2 statistics survive a save and broken statistics are rejected', () => {
  const {s,c,run}=world();const o=s.trade.place('sell','wood',10).order;run(()=>o.status==='Completed');s.trade.recordOffers(c);
  const saved=validateGameState(serializeGameState(s));assert.deepEqual(saved.trade.stats,s.trade.stats);
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.caravans=new CaravanSystem(r);r.trade=new TradeSystem(r);loadGameState(r,saved);
  assert.deepEqual(r.trade.summary(),s.trade.summary());
  const broken=structuredClone(serializeGameState(s));broken.trade.stats.recent[0].side='steal';assert.throws(()=>validateGameState(broken));
  const missing=structuredClone(serializeGameState(s));delete missing.trade.stats;assert.throws(()=>validateGameState(missing));
  const future=structuredClone(serializeGameState(s));future.trade.stats.history.wood[0].day=9999;assert.throws(()=>validateGameState(future));
});
