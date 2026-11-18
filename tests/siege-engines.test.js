import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { CATAPULT,WAGON_SUPPLY } from '../src/data/military.js';
import { buildingHP } from '../src/game/buildingHealth.js';
import { markEnemyBuilding } from '../src/systems/SiegeSystem.js';
import { spawnSandboxUnits } from '../src/game/sandboxMode.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
const wall=(s,x,y)=>{const d=s.objectRegistry.require('wall'),b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'wall',definition:d,x,y,tiles:[{x,y}]};s.buildings.push(b);s.map[y][x]=1;s.towerViews.set(b.id,s.createBuildingView(d,b));markEnemyBuilding(s,b);return b;};
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}

// Battle test 18 Nov 2026, point 6 (owner: "udělej všechny návrhy"): soldiers no longer pull enemy buildings down by
// themselves; a wall is hit on an order (or broken through to an enemy behind it).
test('a melee soldier near an enemy wall fights the enemy soldier; the wall he leaves alone until he is ordered',()=>{
  const s=workerScene(undefined,{foodProduction:true}),b=wall(s,60,50);
  spawnSandboxUnits(s,'swordsman',{x:60,y:53},1);const w=s.workerSystem.liveWorkers().find(w=>w.profession==='soldier');
  const raider=s.animalSystem.create(s.objectRegistry.require('raider'),{x:63,y:53});
  for(let i=0;i<20;i++)s.tick(50);assert.equal(s.combat.attacks.get(w)?.id??w.huntWolfId,raider.id,'the enemy soldier comes first');
  until(s,()=>!raider.isAlive,120000);
  s.simulate(6000);assert.equal(w.siegeTargetId,undefined,'he does not pull the wall down by himself');assert.equal(buildingHP(b).hp,200);
  assert.equal(s.military.siege.order([w],b),1);until(s,()=>!s.buildings.includes(b),120000);
});

test('owner 18 Nov 2026: a Catapult site turns into a Catapult; a Recruit trains as its crew, fetches it and bombards an enemy wall',()=>{
  const s=scene(),barracks=building(s,'barracks',50,50);s.inventory.add('gold',100);
  const d=s.objectRegistry.require('catapult_site'),site={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'catapult_site',definition:d,x:44,y:58,tiles:[{x:44,y:58},{x:45,y:58},{x:44,y:59},{x:45,y:59}]};s.buildings.push(site);for(const p of site.tiles)s.map[p.y][p.x]=1;
  const w=s.workerSystem.create({x:52,y:56});assert.equal(s.workplaceSystem.assign(barracks,w),true);
  assert.equal(s.military.blocker(w,'catapult'),'vehicle_catapult');
  s.tick(50);const v=[...s.vehicles.vehicles.values()].find(v=>v.type==='catapult');assert.ok(v,'the finished site is a Catapult now');assert.equal(s.buildings.includes(site),false);
  assert.equal(s.military.blocker(w,'catapult'),null);assert.equal(s.military.train(w,'catapult'),null);assert.equal(v.state,'reserved');assert.equal(v.crew,true);
  until(s,()=>s.military.unit(w)?.type==='catapult');until(s,()=>v.state==='inUse');
  const target=wall(s,v.x+8,v.y);v.ammo=3;s.simulate(8000);assert.equal(v.ammo,3,'with no enemy about it does not shoot by itself');assert.equal(s.military.siege.order([w],target),1);
  until(s,()=>(buildingHP(target)?.hp??200)<200,60000);assert.equal(v.ammo,2,'one Stone a throw');assert.equal(buildingHP(target).hp,200-CATAPULT.damage);
  const saved=validateGameState(serializeGameState(s)),restored=scene(false);loadGameState(restored,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(restored)),saved,'crew vehicles survive Save/Load');
  until(s,()=>!s.buildings.includes(target),60000);assert.equal(v.ammo,1,'two Stones bring a wall down');const next=wall(s,v.x+8,v.y+1);s.military.siege.order([w],next);
  until(s,()=>v.ammo===0,60000);for(let i=0;i<200;i++)s.tick(50);assert.equal(w.workMessage,'Out of stones');assert.equal(w.emptyTold,true,'the player was told once');
  s.military.release(w);assert.equal(v.state,'parked');assert.equal(v.crew,undefined);
});

test('owner 18 Nov 2026: a Military Wagon gives Stones to a Catapult, food and Torches to soldiers near it',()=>{
  const s=workerScene(undefined,{foodProduction:true});
  spawnSandboxUnits(s,'catapult',{x:60,y:60},1);spawnSandboxUnits(s,'military_wagon',{x:62,y:60},1);spawnSandboxUnits(s,'soldier',{x:61,y:62},1);
  const crews=s.workerSystem.liveWorkers(),cat=crews.find(w=>s.military.unit(w)?.type==='catapult'),wag=crews.find(w=>s.military.unit(w)?.type==='military_wagon'),man=crews.find(w=>s.military.unit(w)?.type==='soldier');
  const cv=s.military.engines.vehicleOf(cat),wv=s.military.engines.vehicleOf(wag);cv.ammo=1;const stones=wv.supplies.stone;
  for(let i=0;i<40;i++)s.tick(50);assert.equal(cv.ammo,CATAPULT.ammo);assert.equal(wv.supplies.stone,stones-(CATAPULT.ammo-1));
  assert.equal(s.military.engines.meal(man),'bread');assert.equal(wv.supplies.bread,WAGON_SUPPLY.load.food-1);
  assert.equal(s.military.engines.torch(man),true);assert.equal(wv.supplies.torch,WAGON_SUPPLY.load.torch-1);
  man.position={x:90,y:90};assert.equal(s.military.engines.meal(man),null,'too far from the wagon');
});

test('owner 18 Nov 2026: "make up to X in the stores" stops new batches at the limit',()=>{
  const s=scene(),bakery=building(s,'bakery',50,50),fp=s.foodProduction;fp.register(bakery);
  assert.equal(fp.stockLimit(bakery),null);assert.equal(fp.atStockLimit(bakery),false);
  assert.equal(fp.setStockLimit(bakery.id,5),true);const out=Object.keys(fp.recipe(bakery).output)[0];
  assert.equal(fp.atStockLimit(bakery),fp.stockHeld(out)>=5);s.inventory.add(out,10);assert.equal(fp.atStockLimit(bakery),true);
  assert.equal(fp.setStockLimit(bakery.id,-1),false);assert.equal(fp.setStockLimit(bakery.id,null),true);assert.equal(fp.stockLimit(bakery),null);
  fp.setStockLimit(bakery.id,50);assert.doesNotThrow(()=>validateGameState(serializeGameState(s)));
});

test("owner 18 Nov 2026: the Builder's Workshop orders a Catapult site beside it, built by Builders (free and at once on the Test map)",async()=>{
  const { buildingIsComplete }=await import('../src/game/buildings.js');
  const s=scene(),shop=building(s,'builder_workshop',50,50);s.inventory.add('wood',30);s.inventory.add('iron',6);
  const r=s.military.engines.orderCatapult(shop);assert.ifError(r.error);assert.equal(r.building.type,'catapult_site');assert.equal(buildingIsComplete(r.building),false,'a site for the Builders');
  assert.ok(Math.max(Math.abs(r.building.x-51),Math.abs(r.building.y-51))<=4,'beside the workshop');assert.equal(s.military.engines.sites(shop).length,1);
  const t=workerScene(undefined,{foodProduction:true});t.sandbox=true;const shop2={id:900,type:'builder_workshop',definition:t.objectRegistry.require('builder_workshop'),x:50,y:50,tiles:[]};for(let y=50;y<53;y++)for(let x=50;x<53;x++){shop2.tiles.push({x,y});t.map[y][x]=1;}t.buildings.push(shop2);
  const r2=t.military.engines.orderCatapult(shop2);assert.ifError(r2.error);t.tick(50);assert.ok([...t.vehicles.vehicles.values()].some(v=>v.type==='catapult'),'on the Test map it stands finished');
});

test('siege test: a free Military Wagon drives after a Catapult that ran short of Stones and fills it',()=>{
  const s=workerScene(undefined,{foodProduction:true}),target=wall(s,70,50);target.hp=100000;target.maxHP=100000;
  spawnSandboxUnits(s,'catapult',{x:40,y:50},1);spawnSandboxUnits(s,'military_wagon',{x:38,y:52},1);
  const crew=s.workerSystem.liveWorkers().find(w=>s.military.unit(w)?.type==='catapult'),driver=s.workerSystem.liveWorkers().find(w=>s.military.unit(w)?.type==='military_wagon'),cat=s.military.engines.vehicleOf(crew),wagon=s.military.engines.vehicleOf(driver);
  cat.ammo=2;const stones=wagon.supplies.stone;s.military.siege.order([crew,driver],target);
  until(s,()=>wagon.supplies.stone<stones,120000);assert.ok(Math.hypot(crew.position.x-driver.position.x,crew.position.y-driver.position.y)<=WAGON_SUPPLY.supplyRadius+1,'the Wagon came to the Catapult');assert.ok(cat.ammo>2);
});
