import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CaravanSystem } from '../src/systems/CaravanSystem.js';
import { TradeSystem } from '../src/systems/TradeSystem.js';
import { DomesticAnimalSystem } from '../src/systems/DomesticAnimalSystem.js';
import { RATS,CATS,ratLevel,RAT_BUILDINGS,CAT_SIZE,catScale,tameChance } from '../src/data/domesticAnimals.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

function world({wheat=0}={}){
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings()});s.domestic=new DomesticAnimalSystem(s,{random:()=>.5});
  const starter=`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`,feed=[];s.eventFeed={push:(key,text)=>{feed.push(text);return true;}};
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);s.foodStorage.deposit(starter,'stone',d.cost.stone??0);s.foodStorage.deposit(starter,'wood',d.cost.wood??0);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;};
  const granary=place('granary',58,40),store=[...s.foodStorage.locations.values()].find(l=>l.buildingId===granary.id);
  // farmhouse-store: the Granary no longer takes Wheat, so its food stock in these fixtures is Apples.
  if(wheat)assert.equal(s.foodStorage.deposit(store.id,'apple',wheat),true);
  const days=n=>{for(let i=0;i<n*10;i++){s.gameTime.update(s.gameTime.dayDuration/10);s.domestic.update(s.gameTime.dayDuration/10);}};
  return {s,d:s.domestic,granary,store,place,days,feed,starter};
}

test('rats: a full Granary without a cat has Many after about 5 days and an Infestation after about 10; an empty store loses them', () => {
  const {d,store,days,feed}=world({wheat:0});const full=world({wheat:0});
  full.s.foodStorage.deposit(full.store.id,'apple',Math.min(full.store.capacity,full.s.foodStorage.room(full.store.id,'apple')));
  full.days(4);assert.equal(ratLevel(full.d.ratsAt(full.store.id)),'few');full.days(2);assert.equal(ratLevel(full.d.ratsAt(full.store.id)),'many');
  full.days(5);assert.equal(ratLevel(full.d.ratsAt(full.store.id)),'infestation');assert.ok(full.feed.some(t=>/Rats in the Granary/.test(t))&&full.feed.some(t=>/infested/.test(t)));
  days(3);assert.equal(d.ratsAt(store.id),0,'no food, no rats');void feed;
});

test('rats eat 1 / 3 / 6 % of the food a day, grain first, never reserved food and never below zero', () => {
  // farmhouse-store: grain lives in a Farmhouse store now; rats there follow the Granary rules.
  const {s,d,place,days:days0}=world({wheat:0}),farm=place('farmhouse',64,40),store=[...s.foodStorage.locations.values()].find(l=>l.buildingId===farm.id&&l.kind==='storage'),days=days0;
  assert.equal(s.foodStorage.deposit(store.id,'wheat',100),true);assert.equal(s.foodStorage.deposit(store.id,'flour',50),true);
  d.rats.set(store.id,80);const before=s.foodStorage.used(store),loss=d.lossPerDay(store.id);assert.equal(Math.round(loss),Math.round(150*RATS.loss.infestation));
  days(1);const eaten=before-s.foodStorage.used(store);assert.ok(Math.abs(eaten-loss)<=2,`ate ${eaten}, expected about ${loss}`);assert.equal(s.foodStorage.locations.get(store.id).stock.flour,50,'grain first');
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

test('the first stray comes on day 1–2 (m-zvirata-2), stays 2 days and leaves; Take in always works and can be reassigned', () => {
  const {s,d,store,granary,days,feed}=world({wheat:50});
  days(1.95);const stray=[...d.cats.values()].find(c=>c.state==='stray');assert.ok(stray,'a stray arrived');assert.ok(feed.some(t=>/stray cat/.test(t)));
  const dist=Math.hypot(stray.home.x-50.5,stray.home.y-50.5);assert.ok(dist>=CATS.stray.distance[0]-1&&dist<=CATS.stray.distance[1]+1);
  days(2.2);assert.equal(stray.leaving,true,'leaves after 2 days');
  // Later strays come about every 8 days (4 with Many rats): none soon after the first left.
  const before=d.seq;days(2);assert.equal([...d.cats.values()].filter(c=>c.state==='stray'&&!c.leaving).length,0,'no new stray right away');void before;
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

test('m-zvirata-2: rats move into a House with no assigned cat within 10 tiles after 2 days; a cat nearby keeps them out',()=>{
  const {d,granary,place,days,feed}=world({wheat:50});
  const far=place('house',granary.x+20,granary.y+14),near=place('house',granary.x+4,granary.y+4);
  days(2.2);assert.equal(d.houseHasRats(far),true);assert.equal(d.houseHasRats(near),true,'no cat anywhere yet');assert.ok(feed.some(t=>/Rats in a House/.test(t)));
  const cat=d.newCat({x:granary.x,y:granary.y+2});assert.equal(d.assign(cat.id,granary.id),true);days(.1);
  assert.equal(d.houseHasRats(near),false,'a cat within 10 tiles');assert.equal(d.houseHasRats(far),true,'too far for the cat');
  const saved=JSON.parse(JSON.stringify(d.exportState()));assert.ok(saved.houseRats&&Object.keys(saved.houseRats).includes(String(far.id)));
});
test('m-zvirata-2: the first stray dog comes on day 2–3',()=>{
  const {d,days}=world({wheat:50});days(1.0);assert.equal([...d.dogs.values()].length,0);days(2.0);assert.ok([...d.dogs.values()].some(g=>g.state==='stray'),'a stray dog by day 3');
});

// m-zvirata-3 (owner 67, 69, 71).
test('m-zvirata-3 (71): rats move into the Mill and the Bakery by their stock and a cat clears them; losses take grain and flour first',()=>{
  const {s,d,place,days}=world({wheat:0});
  const mill=place('mill',64,40),bakery=place('bakery',64,46),input=b=>s.foodStorage.locations.get(`input-${b.id}`),output=b=>s.foodStorage.locations.get(`output-${b.id}`);
  for(const b of [mill,bakery])assert.ok(RAT_BUILDINGS.includes(b.type)&&d.ratBuildings().some(r=>r.id===b.id),`${b.type} is a rat building`);
  assert.equal(s.foodStorage.deposit(input(mill).id,'wheat',20),true);assert.equal(s.foodStorage.deposit(input(bakery).id,'flour',20),true);
  d.random=()=>.99;d.nextStrayAt=Infinity;days(5.5);
  assert.equal(ratLevel(d.buildingRats(mill.id)),'many','a full Mill buffer: Many in about 5 days, as a full Granary');
  assert.equal(ratLevel(d.buildingRats(bakery.id)),'many');assert.ok(input(bakery).stock.flour<20,'rats ate flour');
  s.foodStorage.deposit(output(bakery).id,'bread',10);d.rats.set(output(bakery).id,80);const bread=output(bakery).stock.bread;
  const r=s.foodStorage.reserve('stock',output(bakery).id,'bread',bread,'test');void r;days(2);assert.equal(output(bakery).stock.bread,bread,'reserved bread is never eaten');
  assert.ok(d.status(bakery.id).loss>0);assert.equal(d.status(bakery.id).needed,1);
  const cat=d.newCat({x:bakery.x,y:bakery.y+3});assert.equal(d.canHome(bakery),true);assert.equal(d.assign(cat.id,bakery.id),true);
  for(let i=0;i<6;i++)days(1);assert.equal(d.buildingRats(bakery.id),0,'the cat cleared the Bakery');assert.ok(d.buildingRats(mill.id)>0,'the Mill still has rats');
  assert.deepEqual(RATS.lossOrder.slice(0,2),['wheat','flour']);
});

test('m-zvirata-3 (71): a cat can live at a Farmhouse; rat buildings raise the cat cap; Farmhouse rats follow its own food',()=>{
  const {s,d,place,granary}=world({wheat:0});const cap=d.cap();
  const farm=place('farmhouse',64,40);assert.equal(d.cap(),cap+1,'a Farmhouse raises the cap');
  const mill=place('mill',70,40);assert.equal(d.cap(),cap+2);const bakery=place('bakery',70,46);assert.equal(d.cap(),cap+3);
  assert.ok(d.homes().some(b=>b.id===farm.id)&&d.homes().some(b=>b.id===mill.id)&&d.homes().some(b=>b.id===bakery.id));
  const cat=d.newCat({x:farm.x,y:farm.y+3});assert.equal(d.assign(cat.id,farm.id),true);assert.equal(cat.buildingId,farm.id);
  const second=d.newCat({x:farm.x,y:farm.y+3});assert.equal(d.assign(second.id,farm.id),true,'more than one cat may live at a Farmhouse');
  assert.equal(d.status(farm.id).rats,0,'an empty Farmhouse store, no rats');assert.equal(d.status(farm.id).needed,1);
  // Caravan purchase to a Bakery.
  s.caravans=new CaravanSystem(s);s.trade=new TradeSystem(s);place('warehouse',76,40);place('marketplace',44,48);assert.equal(s.caravans.summon(),true);for(let i=0;i<20000&&s.caravans.active.phase==='arriving';i++)s.caravans.update(100);
  s.inventory.add('gold',100);d.updateCaravan();d.caravanCats.count=1;const r=d.buyCat(bakery.id);assert.equal(r.ok,true);assert.equal(r.cat.buildingId,bakery.id);
  // Reassign from the Granary to the Mill.
  const g=d.newCat({x:granary.x,y:granary.y+2});d.assign(g.id,granary.id);assert.equal(d.assign(g.id,mill.id),true);assert.equal(g.buildingId,mill.id);
});

test('m-zvirata-3 (69, 67): the taming offer says "Chance to tame"; the cat scale comes from data',async()=>{
  const {t,setLanguage}=await import('../src/i18n/index.js');
  setLanguage('en',{persist:false});assert.equal(t('pets.dog.tameOption',{hunter:'Jan',level:3,chance:44}),'Jan · hunting 3 · Chance to tame: 44 %');
  setLanguage('cs',{persist:false});assert.equal(t('pets.dog.tameOption',{hunter:'Jan',level:3,chance:44}),'Jan · lov 3 · Šance na ochočení: 44 %');setLanguage('en',{persist:false});
  assert.equal(Math.round(tameChance(3)*100),44);
  assert.equal(CAT_SIZE.adult,1.5);assert.equal(catScale(),1.5);assert.equal(catScale({young:true}),CAT_SIZE.kitten);assert.ok(Math.abs(catScale({young:true,drawn:false})-CAT_SIZE.kitten*CAT_SIZE.kittenFigure)<1e-9);
  // A tomcat's side view is 26 px wide in the sheet, a hound's 41 px: scaled, the cat stays smaller than the dog.
  assert.ok(26*catScale()<41,'not bigger than a dog');assert.ok(26*catScale()>=36,'about 1.5× the old tomcat');
});

test('m-zvirata-3: rats and a cat at a Bakery survive a save (schema unchanged)',()=>{
  const {s,d,place}=world({wheat:0});const bakery=place('bakery',64,46),farm=place('farmhouse',64,40),input=`input-${bakery.id}`;
  s.foodStorage.deposit(input,'flour',10);d.rats.set(input,40.25);const cat=d.newCat({x:bakery.x,y:bakery.y+3});d.assign(cat.id,bakery.id);const fc=d.newCat({x:farm.x,y:farm.y+3});d.assign(fc.id,farm.id);
  const saved=validateGameState(serializeGameState(s));assert.equal(saved.domestic.rats[input],40.25);
  const r=workerScene(saved.terrain,{construction:true,logistics:true,starter:false,gameSettings:gameSettings()});r.domestic=new DomesticAnimalSystem(r);loadGameState(r,saved);
  assert.equal(r.domestic.ratsAt(input),40.25);assert.equal(r.domestic.cats.get(cat.id).buildingId,bakery.id);assert.equal(r.domestic.cats.get(fc.id).buildingId,farm.id);
  const bad=structuredClone(serializeGameState(s));bad.domestic.cats.find(c=>c.id===cat.id).buildingId=9999;assert.throws(()=>validateGameState(bad));
});

test('farmhouse-store: rats grow in a Farmhouse from its own grain store and a cat living there clears them',()=>{
  const {s,d,place,days,feed}=world({wheat:0}),farm=place('farmhouse',64,40),store=[...s.foodStorage.locations.values()].find(l=>l.buildingId===farm.id&&l.kind==='storage');
  assert.ok(store,'the Farmhouse has its own store');assert.deepEqual(store.allowed,['wheat','flour']);assert.equal(store.capacity,200);
  assert.ok(d.foodLocations().some(l=>l.id===store.id),'a rat location');assert.equal(s.foodStorage.deposit(store.id,'wheat',200),true);
  days(6);assert.ok(['many','infestation'].includes(ratLevel(d.buildingRats(farm.id))),'a full Farmhouse store breeds rats like a full Granary');
  assert.ok(store.stock.wheat<200,'rats ate wheat');assert.ok(feed.some(t=>/Farmhouse/.test(t)),'the rats notice names the Farmhouse');
  const before=d.ratsAt(store.id),cat=d.newCat({x:farm.x,y:farm.y+3});assert.equal(d.assign(cat.id,farm.id),true);assert.equal(d.status(farm.id).needed,1);
  days(1);assert.ok(d.ratsAt(store.id)<before,'the cat catches rats');days(8);assert.equal(ratLevel(d.ratsAt(store.id)),'none','one cat clears a Farmhouse');
});
