import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { DomesticAnimalSystem } from '../src/systems/DomesticAnimalSystem.js';
import { RATS,CATS,ratLevel } from '../src/data/domesticAnimals.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

function world({wheat=0}={}){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.domestic=new DomesticAnimalSystem(s,{random:()=>.5});
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`,feed=[];s.eventFeed={push:(key,text)=>{feed.push(text);return true;}};
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  const granary=place('granary',58,40),store=[...s.foodStorage.locations.values()].find(l=>l.buildingId===granary.id);
  if(wheat)assert.equal(s.foodStorage.deposit(store.id,'wheat',wheat),true);
  const days=n=>{for(let i=0;i<n*10;i++){s.gameTime.update(s.gameTime.dayDuration/10);s.domestic.update(s.gameTime.dayDuration/10);}};
  return {s,d:s.domestic,granary,store,place,days,feed,starter};
}

test('rats: a full Granary without a cat has Many after about 5 days and an Infestation after about 10; an empty store loses them', () => {
  const {d,store,days,feed}=world({wheat:0});const full=world({wheat:0});
  full.s.foodStorage.deposit(full.store.id,'wheat',Math.min(full.store.capacity,full.s.foodStorage.room(full.store.id,'wheat')));
  full.days(4);assert.equal(ratLevel(full.d.ratsAt(full.store.id)),'few');full.days(2);assert.equal(ratLevel(full.d.ratsAt(full.store.id)),'many');
  full.days(5);assert.equal(ratLevel(full.d.ratsAt(full.store.id)),'infestation');assert.ok(full.feed.some(t=>/Rats in the Granary/.test(t))&&full.feed.some(t=>/infested/.test(t)));
  days(3);assert.equal(d.ratsAt(store.id),0,'no food, no rats');void feed;
});

test('rats eat 1 / 3 / 6 % of the food a day, grain first, never reserved food and never below zero', () => {
  const {s,d,store,days}=world({wheat:100});s.foodStorage.deposit(store.id,'bread',50);
  d.rats.set(store.id,80);const before=s.foodStorage.used(store),loss=d.lossPerDay(store.id);assert.equal(Math.round(loss),Math.round(150*RATS.loss.infestation));
  days(1);const eaten=before-s.foodStorage.used(store);assert.ok(Math.abs(eaten-loss)<=2,`ate ${eaten}, expected about ${loss}`);assert.equal(s.foodStorage.locations.get(store.id).stock.bread,50,'grain first');
  const r=s.foodStorage.reserve('stock',store.id,'wheat',s.foodStorage.free(store.id,'wheat'),'test');void r;days(5);
  assert.equal(s.foodStorage.reserved(store.id,'wheat'),s.foodStorage.locations.get(store.id).stock.wheat??0,'reserved grain untouched');assert.ok(Object.values(s.foodStorage.locations.get(store.id).stock).every(v=>v>=0));
});

test('cats: one clears a normal store (−25 a day), a big store needs two; a cat at home gives +3 happiness', () => {
  const {s,d,store,granary,place,days}=world({wheat:100});d.rats.set(store.id,60);
  const need=d.catsNeeded(granary.id),cat=d.newCat({x:granary.x,y:granary.y+2});assert.equal(d.assign(cat.id,granary.id),true);
  days(1);if(need===1)assert.ok(Math.abs(d.ratsAt(store.id)-35)<1,`${d.ratsAt(store.id)}`);else assert.ok(d.ratsAt(store.id)>60,'one cat only halves the growth in a big store');
  if(need>1){const second=d.newCat({x:granary.x,y:granary.y+2});d.assign(second.id,granary.id);days(1);assert.ok(d.ratsAt(store.id)<60);}
  days(4);assert.equal(d.ratsAt(store.id),0);
  const house=place('house',36,58),pet=d.newCat({x:36,y:60});assert.equal(d.assign(pet.id,house.id),true);assert.equal(d.catAtHome(house),true);
  const other=d.newCat({x:36,y:60});assert.equal(d.assign(other.id,house.id),false,'one cat per house');assert.equal(CATS.homeHappiness,3);
});

test('strays come about every 4 days (2 with Many rats), stay 2 days and leave; Take in always works and can be reassigned', () => {
  const {s,d,store,granary,days,feed}=world({wheat:50});
  days(4.5);const stray=[...d.cats.values()].find(c=>c.state==='stray');assert.ok(stray,'a stray arrived');assert.ok(feed.some(t=>/stray cat/.test(t)));
  const dist=Math.hypot(stray.home.x-50.5,stray.home.y-50.5);assert.ok(dist>=CATS.stray.distance[0]-1&&dist<=CATS.stray.distance[1]+1);
  days(2.2);assert.equal(stray.leaving,true,'leaves after 2 days');
  const {d:d2,store:s2,granary:g2,days:days2}=world({wheat:50});d2.rats.set(s2.id,50);days2(2.5);const second=[...d2.cats.values()].find(c=>c.state==='stray');assert.ok(second,'sooner with rats');
  assert.equal(d2.assign(second.id,g2.id),true);assert.equal(second.state,'home');days2(3);assert.equal(second.leaving,false,'a taken-in cat stays');void s;void store;void granary;
});

test('a caravan cat costs 30 Gold and walks to its new home; kittens come every 10 days near houses, up to the cap', () => {
  const {s,d,granary,place,days}=world({wheat:20});s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);place('warehouse',64,40);place('marketplace',44,48);
  assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  s.inventory.add('gold',100);d.updateCaravan();d.caravanCats.count=1;const gold=s.inventory.count('gold'),merchant=s.caravans.active.gold;
  const r=d.buyCat(granary.id);assert.equal(r.ok,true);assert.equal(s.inventory.count('gold'),gold-CATS.price);assert.equal(s.caravans.active.gold,merchant+CATS.price);assert.equal(d.catsForSale(),0);
  assert.equal(d.buyCat(granary.id).error,'noCat');
  place('house',60,44);const mother=r.cat,cap=d.cap();d.nextStrayAt=Infinity;d.random=()=>.3;days(10.5);
  const kittens=[...d.cats.values()].filter(c=>c.state==='kitten');assert.equal(kittens.length,1,'a roll under the 50 % chance: a kitten');assert.equal(kittens[0].motherId,mother.id);
  for(let i=0;i<10;i++)days(10);assert.ok(d.cats.size<=cap,`${d.cats.size} cats, cap ${cap}`);
});

test('domestic animals survive a save; broken states are rejected', () => {
  const {s,d,store,granary}=world({wheat:60});d.rats.set(store.id,42.5);const cat=d.newCat({x:granary.x,y:granary.y+2});d.assign(cat.id,granary.id);d.newCat({x:30,y:30,leaveAt:500000,home:{x:30,y:30}});
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.domestic.cats.length,2);assert.equal(saved.domestic.rats[store.id],42.5);
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.domestic=new DomesticAnimalSystem(r);loadGameState(r,saved);
  assert.equal(r.domestic.ratsAt(store.id),42.5);assert.equal(r.domestic.cats.get(cat.id).buildingId,granary.id);
  const bad=structuredClone(serializeGameState(s));bad.domestic.cats[0].buildingId=9999;assert.throws(()=>validateGameState(bad));
  const many=structuredClone(serializeGameState(s));many.domestic.rats[store.id]=150;assert.throws(()=>validateGameState(many));
});
