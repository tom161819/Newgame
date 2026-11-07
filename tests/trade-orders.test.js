import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { price } from '../src/data/trade.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

function world({haulers=2,wood=40,gold=0}={}){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  place('warehouse',58,40);const market=place('marketplace',44,48);
  if(wood)s.foodStorage.deposit(starter,'wood',wood);if(gold)s.inventory.add('gold',gold);
  for(let i=0;i<haulers;i++){const w=s.workerSystem.create({x:50+i,y:46});assert.equal(s.workerSystem.jobs.assign(w,'hauler'),true);}
  assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  const c=s.caravans.active;c.stock={wheat:30,wood:10};c.gold=200;
  const run=(until,max=180000)=>{let n=0;while(!until()&&n<max){s.tick(50);s.trade.update();n+=50;}assert.ok(until(),`not reached in ${n} ms`);};
  return {s,c,market,starter,run};
}
const quantity=(s,id)=>[...s.foodStorage.locations.values()].reduce((n,l)=>n+(l.stock[id]??0),0)+s.workerSystem.liveWorkers().reduce((n,w)=>n+(w.cargo?.resource===id?w.cargo.amount:0),0);

test('the Marketplace has its own goods space that is never a store for other goods', () => {
  const {s,market}=world({haulers:0});const l=s.foodStorage.locations.get(`market-${market.id}`);
  assert.equal(l.kind,'market');assert.equal(l.capacity,80);assert.equal(s.foodStorage.isStock(l),false);assert.ok(l.allowed.includes('wood')&&l.allowed.includes('sword'));
  assert.equal(validateGameState(serializeGameState(s)).trade.orders.length,0);
});

test('selling: Haulers carry the goods; Gold arrives only when the caravan takes them, unit by unit and once', () => {
  const {s,c,market,run}=world();const total=quantity(s,'wood'),before=s.inventory.count('gold');
  const result=s.trade.place('sell','wood',20);assert.equal(result.ok,true,JSON.stringify(result.errors));const o=result.order,unit=o.price;assert.equal(unit,s.trade.unitPrice('wood','sell'),'the live price is agreed and kept');
  assert.equal(s.inventory.count('gold'),before,'no Gold before delivery');
  run(()=>s.foodStorage.locations.get(`market-${market.id}`).stock.wood>0||o.delivered>0);
  run(()=>o.status==='Completed');
  assert.equal(o.delivered,20);assert.equal(s.inventory.count('gold'),before+20*unit);assert.equal(c.gold,200-20*unit);assert.equal(c.stock.wood,30);
  assert.equal(quantity(s,'wood'),total-20,'exactly 20 Wood left the kingdom');s.trade.update();assert.equal(s.inventory.count('gold'),before+20*unit,'never paid twice');
  assert.equal(s.caravans.deliveryPending(c),false);
});

test('buying: paid per unloaded unit, stored only after Haulers bring it to a store', () => {
  const {s,c,market,run}=world({gold:100});const unit=price('wheat','buy');assert.equal(s.foodStorage.available('wheat'),0);
  const result=s.trade.place('buy','wheat',10);assert.equal(result.ok,true,JSON.stringify(result.errors));
  s.trade.update();const l=s.foodStorage.locations.get(`market-${market.id}`);
  assert.equal(l.stock.wheat,10,'unloaded onto the Marketplace');assert.equal(s.inventory.count('gold'),100-10*unit);assert.equal(c.stock.wheat,20);assert.equal(c.gold,200+10*unit);
  assert.equal(s.foodStorage.available('wheat'),0,'not in the stores yet');assert.equal(result.order.status,'Completed');
  run(()=>s.foodStorage.available('wheat')===10);assert.equal(l.stock.wheat??0,0);
});

test('orders are refused with the brief’s errors', () => {
  const {s,c}=world({haulers:0,gold:20});
  const errors=(...a)=>s.trade.quote(...a).errors;
  assert.ok(errors('buy','wheat',10).includes('notEnoughGold'));
  assert.ok(errors('buy','bread',1).includes('merchantOutOfStock'));
  assert.ok(errors('sell','iron',1).includes('notEnoughResources'));
  c.gold=5;assert.ok(errors('sell','wood',10).includes('merchantGold'));c.gold=200;
  s.inventory.add('gold',480);assert.equal(errors('sell','wood',10).includes('treasuryFull'),false,'gold has no limit since 0.51');
  assert.ok(errors('sell','wood',0).includes('quantity'));
  s.inventory.pay({gold:450});assert.equal(s.trade.place('sell','wood',5).ok,true);assert.ok(errors('buy','wood',1).includes('otherSide'));
  s.caravans.leave();assert.ok(errors('sell','wood',1).includes('noCaravan'));
});

test('a caravan waits at most a quarter day for a running sale; on leaving the rest is cancelled and nothing is lost', () => {
  const {s,c,market,run}=world({haulers:1});const total=quantity(s,'wood'),gold=s.inventory.count('gold');
  const {order}=s.trade.place('sell','wood',30);run(()=>order.status==='Transporting'&&s.foodStorage.locations.get(`market-${market.id}`).stock.wood>0||order.delivered>0,60000);
  assert.equal(s.caravans.deliveryPending(c),true);
  s.caravans.leave();assert.ok(['Cancelled','PartiallyCompleted'].includes(order.status));
  const sold=order.delivered;run(()=>!(s.foodStorage.locations.get(`market-${market.id}`).stock.wood>0)&&!s.workerSystem.liveWorkers().some(w=>w.cargo),120000);
  assert.equal(quantity(s,'wood'),total-sold,'unsold goods are back in the stores');assert.equal(s.inventory.count('gold'),gold+sold*order.price);
});

test('Save/Load in the middle of a sale continues without paying or carrying twice', () => {
  const {s,c,run}=world();const total=quantity(s,'wood');
  const {order}=s.trade.place('sell','wood',20);run(()=>s.workerSystem.liveWorkers().some(w=>w.cargo?.resource==='wood'));
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.trade.orders[0].status,order.status);
  const bad=structuredClone(saved);bad.trade.orders[0].delivered=99;assert.throws(()=>validateGameState(bad));
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.caravans=new CaravanSystem(r);r.trade=new TradeSystem(r);loadGameState(r,saved);
  assert.deepEqual(serializeGameState(r).trade,saved.trade);const gold=r.inventory.count('gold'),o=r.trade.orders[0];
  let n=0;while(o.status!=='Completed'&&n<180000){r.tick(50);r.trade.update();n+=50;}
  assert.equal(o.status,'Completed');assert.equal(r.inventory.count('gold'),gold+(20-saved.trade.orders[0].delivered)*o.price);assert.equal(quantity(r,'wood'),total-20);
});
