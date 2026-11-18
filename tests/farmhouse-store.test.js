import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { serializeGameState,validateGameState,saveSchemaStatus,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { FARMHOUSE_STORE } from '../src/data/farming.js';
import { stockLocationId } from '../src/data/logistics.js';
import { resourceGroup } from '../src/data/resourceGroups.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
globalThis.document={querySelector:()=>({textContent:''})};

// farmhouse-store (owner 8 Nov 2026): Wheat and Flour live in Farmhouse stores; the Granary keeps the other food.
function world({haulers=0}={}){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`;
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  const workers=[];for(let i=0;i<haulers;i++){const w=s.workerSystem.create({x:50+i,y:46});assert.equal(s.workerSystem.jobs.assign(w,'hauler'),true);w.stoneCollection={enabled:false,radius:80};workers.push(w);}
  const run=(until,max=240000,step=()=>{})=>{let n=0;while(!until()&&n<max){s.tick(50);step();n+=50;}assert.ok(until(),`not reached in ${n} ms: ${JSON.stringify(s.workerSystem.liveWorkers().map(w=>[w.profession,w.workMessage,w.workTask?.kind,w.cargo]))}`);};
  const store=b=>s.foodStorage.locations.get(`farmhouse-${b.id}`);
  return {s,starter,place,run,store,workers};
}
const snapshot=s=>validateGameState(serializeGameState(s));

test('a Farmhouse has a 200-unit store for Wheat and Flour only; the Granary no longer takes either',()=>{
  const d=objectRegistry.require('farmhouse');assert.deepEqual(d.storage,{capacity:200,resources:['wheat','flour','flax']});assert.equal(FARMHOUSE_STORE.capacity,200);
  assert.deepEqual(objectRegistry.require('granary').storage.resources,['meat','bread','apple','fish']);
  assert.equal(stockLocationId({id:7,type:'farmhouse'}),'farmhouse-7');assert.equal(resourceGroup(objectRegistry.require('wheat'),objectRegistry),'foodRaw');assert.equal(resourceGroup(objectRegistry.require('flour'),objectRegistry),'foodRaw');
  const {s,place,store}=world(),farm=place('farmhouse',44,40),granary=place('granary',58,40),l=store(farm);
  assert.equal(l.kind,'storage');assert.equal(s.foodStorage.isStock(l),true);assert.equal(l.capacity,200);
  assert.equal(s.foodStorage.deposit(`granary-${granary.id}`,'wheat',1),false);assert.equal(s.foodStorage.deposit(`granary-${granary.id}`,'flour',1),false);
  assert.equal(s.foodStorage.deposit(l.id,'apple',1),false,'a Farmhouse keeps no other food');assert.equal(s.foodStorage.deposit(l.id,'wheat',150),true);assert.equal(s.foodStorage.deposit(l.id,'flour',50),true);assert.equal(s.foodStorage.room(l.id,'wheat'),0);
  assert.equal(s.inventory.count('wheat'),150,'Farmhouse stock counts as kingdom stock');snapshot(s);
});

test('a Farmer carries the harvest to the Farmhouse store; while no Farmhouse has room it goes to the Starter Stockpile',()=>{
  for(const full of [false,true]){
    const {s,starter,place,run,store}=world(),farm=place('farmhouse',44,40),granary=place('granary',58,40),field=place('wheat_field',44,45),f=s.workerSystem.create({x:43,y:40});
    assert.equal(s.workplaceSystem.assign(farm,f),true);if(full)assert.equal(s.foodStorage.deposit(store(farm).id,'flour',FARMHOUSE_STORE.capacity),true);
    s.gameTime.update(240000);run(()=>(s.foodStorage.locations.get(full?starter:store(farm).id).stock.wheat??0)===10);
    assert.equal(s.foodStorage.locations.get(`granary-${granary.id}`).stock.wheat,undefined,'never into the Granary');
    if(!full)assert.equal(s.foodStorage.locations.get(starter).stock.wheat,undefined);
    assert.equal(s.farmingSystem.records.get(field.id).cycle,1);snapshot(s);
  }
});

test('Haulers run the Farmhouse → Mill → Farmhouse → Bakery chain; Bread goes to the Granary',()=>{
  const {s,place,run,store}=world({haulers:2}),farm=place('farmhouse',44,40),granary=place('granary',44,52),mill=place('mill',52,40),bakery=place('bakery',58,40);
  const miller=s.workerSystem.create({x:52,y:43}),baker=s.workerSystem.create({x:58,y:43});assert.equal(s.workplaceSystem.assign(mill,miller),true);assert.equal(s.workplaceSystem.assign(bakery,baker),true);
  assert.equal(s.foodStorage.deposit(store(farm).id,'wheat',8),true);
  // m-palivo-vyroba: the oven burns 1 Wood a batch.
  s.foodStorage.deposit(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`,'wood',10);
  const seen={wheatFromFarm:false,flourToFarm:false,flourFromFarm:false};
  const step=()=>{for(const w of s.workerSystem.liveWorkers()){const t=w.workTask;if(w.profession!=='hauler'||!t)continue;
    if(t.resource==='wheat'&&t.sourceId===store(farm).id&&t.destinationId===`input-${mill.id}`)seen.wheatFromFarm=true;
    if(t.resource==='flour'&&t.sourceId===`output-${mill.id}`&&t.destinationId===store(farm).id)seen.flourToFarm=true;
    if(t.resource==='flour'&&t.sourceId===store(farm).id&&t.destinationId===`input-${bakery.id}`)seen.flourFromFarm=true;}
    const g=s.foodStorage.locations.get(`granary-${granary.id}`).stock;assert.ok(!g.wheat&&!g.flour,'the Granary never holds grain');};
  run(()=>(s.foodStorage.locations.get(`granary-${granary.id}`).stock.bread??0)>=8,400000,step);
  assert.deepEqual(seen,{wheatFromFarm:true,flourToFarm:true,flourFromFarm:true});assert.equal(miller.workTask?.kind==='foodPickup',false);snapshot(s);
});

test('trade finds Farmhouse stock: Wheat sold from a Farmhouse, bought Flour stored in a Farmhouse and never in the Granary',()=>{
  const {s,place,run,store}=world({haulers:2}),farm=place('farmhouse',44,40),granary=place('granary',58,46);place('warehouse',58,40);const market=place('marketplace',44,48);
  s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);assert.equal(s.foodStorage.deposit(store(farm).id,'wheat',20),true);s.inventory.add('gold',200);
  assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  const c=s.caravans.active;c.stock={flour:30};c.gold=200;
  assert.ok(s.trade.storeRoom('flour')>=FARMHOUSE_STORE.capacity-20,'Farmhouse room counts for bought grain');
  const sale=s.trade.place('sell','wheat',10);assert.equal(sale.ok,true,JSON.stringify(sale.errors));run(()=>sale.order.status==='Completed',180000,()=>s.trade.update());// A second Hauler may already be on the way with a spare load; it is brought back to a store.
  run(()=>s.workerSystem.liveWorkers().every(w=>!w.cargo&&!w.workTask)&&!(s.foodStorage.locations.get(`market-${market.id}`).stock.wheat>0),60000,()=>s.trade.update());assert.equal(store(farm).stock.wheat,10);assert.equal(sale.order.delivered,10,'the Wheat came from the Farmhouse store');
  const buy=s.trade.place('buy','flour',10);assert.equal(buy.ok,true,JSON.stringify(buy.errors));run(()=>s.foodStorage.available('flour')===10,180000,()=>s.trade.update());
  assert.equal(s.foodStorage.locations.get(`granary-${granary.id}`).stock.flour,undefined);assert.ok((store(farm).stock.flour??0)+(s.foodStorage.locations.get(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`).stock.flour??0)===10);snapshot(s);
});

test('Farmhouse stores survive Save/Load in save schema 61; forged grain in a Granary or an overfull Farmhouse is rejected',()=>{
  assert.equal(SAVE_VERSION,65);assert.equal(saveSchemaStatus({saveVersion:61}).compatible,false,'alpha policy: schema 61 saves are refused');
  const {s,place,store}=world(),farm=place('farmhouse',44,40),granary=place('granary',58,40);s.foodStorage.deposit(store(farm).id,'wheat',30);s.foodStorage.deposit(store(farm).id,'flour',12);s.foodStorage.deposit(`granary-${granary.id}`,'bread',5);
  const saved=snapshot(s),r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});loadGameState(r,structuredClone(saved));
  assert.deepEqual(serializeGameState(r),saved);assert.deepEqual(r.foodStorage.locations.get(`farmhouse-${farm.id}`).stock,{wheat:30,flour:12});assert.equal(r.inventory.count('wheat'),30);
  for(const [where,stock] of [[`granary-${granary.id}`,{bread:5,wheat:1}],[`farmhouse-${farm.id}`,{wheat:201,flour:12}],[`farmhouse-${farm.id}`,{wheat:30,flour:12,apple:1}]]){
    const bad=structuredClone(saved);bad.foodStorage.locations.find(l=>l.id===where).stock=stock;assert.throws(()=>validateGameState(bad));}
  const missing=structuredClone(saved);missing.foodStorage.locations=missing.foodStorage.locations.filter(l=>l.id!==`farmhouse-${farm.id}`);assert.throws(()=>validateGameState(missing),'a Farmhouse without its store is not a valid save');
});
