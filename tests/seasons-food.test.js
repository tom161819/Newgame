import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { calendar,SEASONS,SEASON_GROWTH,WEATHER_GROWTH,WEATHER_PROBABILITIES } from '../src/data/seasons.js';
import { SeasonSystem } from '../src/systems/SeasonSystem.js';
import { GameTimeSystem } from '../src/systems/GameTimeSystem.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
function scene(seconds=120,{migration=false}={}){const s=workerScene(undefined,{construction:true,foodProduction:true,seasons:true,gameSettings:{dayLengthSeconds:seconds}});s.seasons.random=()=>0;s.seasons.weather='Sunny';if(!migration)s.workerSystem.unsubscribe();return s;}
function building(s,type,x,y){const definition=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,definition);s.inventory.add('stone',definition.cost.stone);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(definition,result.building));return result.building;}
function stock(s,items){let b=s.buildings.find(b=>b.type==='granary')??building(s,'granary',48,45);for(const [id,n]of Object.entries(items))assert.equal(s.foodStorage.deposit(`granary-${b.id}`,id,n),true);return b;}
function until(s,predicate,max=15000){let elapsed=0;while(!predicate()&&elapsed<max){s.tick(25);elapsed+=25;}assert.ok(predicate(),`Condition not reached at ${elapsed}`);return elapsed;}

test('central calendar advances four five-day seasons, then a new year, with one weather choice per actual day and no load roll',()=>{
  for(const seconds of [60,120,240]){
    const time=new GameTimeSystem(seconds*1000);let rolls=0;const seasons=new SeasonSystem(time,{random:()=>{rolls++;return 0;}});
    assert.deepEqual(seasons.calendar,{season:'Spring',year:1,dayOfYear:1,dayInSeason:1});for(let i=0;i<20;i++){assert.equal(seasons.season,SEASONS[Math.floor(i/5)]);assert.equal(seasons.calendar.dayInSeason,i%5+1);time.update(seconds*1000);}
    assert.deepEqual(seasons.calendar,{season:'Spring',year:2,dayOfYear:1,dayInSeason:1});assert.equal(rolls,21);seasons.processDay(time.day);assert.equal(rolls,21);const saved=seasons.exportState();seasons.importState(saved);assert.equal(rolls,21);time.setPaused(true);time.update(999999);assert.deepEqual(seasons.exportState(),saved);
  }
  assert.equal(calendar(40).season,'Winter');assert.equal(calendar(41).year,3);
});
test('seasonal weather distributions sum to one, vary by season, and multiply growth without reviving winter',()=>{
  const s=scene();for(let i=0;i<4;i++){
    if(i)s.gameTime.update(5*s.gameTime.dayDuration);assert.equal(s.seasons.season,SEASONS[i]);near(Object.values(WEATHER_PROBABILITIES[s.seasons.season]).reduce((n,v)=>n+v,0),1);
    for(const [weather,multiplier]of Object.entries(WEATHER_GROWTH)){s.seasons.weather=weather;near(s.seasons.growthMultiplier(),SEASON_GROWTH[s.seasons.season]*multiplier);assert.ok(s.seasons.growthMultiplier()>=0);if(i===3)assert.equal(s.seasons.growthMultiplier(),0);}
  }
  assert.notDeepEqual(WEATHER_PROBABILITIES.Spring,WEATHER_PROBABILITIES.Summer);const probe=scene();probe.gameTime.update(5*probe.gameTime.dayDuration);probe.seasons.random=()=>.99;assert.equal(probe.seasons.rollWeather(),'Drought');probe.gameTime.update(10*probe.gameTime.dayDuration);assert.equal(probe.seasons.rollWeather(),'Frost');
});
test('orchards blossom during spring, develop ripe fruit only in summer/autumn and retain progress through winter without automatic yield',()=>{
  const s=scene(),plot=building(s,'orchard',44,50),f=s.farmingSystem;stock(s,{apple:100});s.gameTime.update(5*s.gameTime.dayDuration);const record=f.sync(plot);assert.equal(s.seasons.season,'Summer');assert.equal(record.growthDays,1);assert.equal(f.ripe(plot),false);
  s.gameTime.update(s.gameTime.dayDuration);near(f.sync(plot).growthDays,2.43);assert.equal(record.stage,2);s.gameTime.update(s.gameTime.dayDuration);assert.equal(record.stage,3);assert.equal(f.ripe(plot),true);assert.equal(s.inventory.count('apple'),86);
  s.gameTime.update(8*s.gameTime.dayDuration);assert.equal(s.seasons.season,'Winter');assert.equal(record.stage,0);assert.equal(record.growthDays,3);assert.equal(f.ripe(plot),false);const before=s.inventory.count('apple');s.gameTime.update(5*s.gameTime.dayDuration);assert.equal(record.growthDays,3);assert.equal(s.inventory.count('apple'),before-10);assert.equal(s.seasons.season,'Spring');assert.equal(record.stage,1);assert.equal(record.cycle,0);
});
test('winter freezes unfinished wheat exactly and the next spring resumes stored progress; no season deletes stored harvests',()=>{
  const s=scene();stock(s,{apple:150});s.gameTime.update(14*s.gameTime.dayDuration);const wheat=building(s,'wheat_field',44,50);s.gameTime.update(s.gameTime.dayDuration);const record=s.farmingSystem.sync(wheat);near(record.growthDays,1.1);assert.equal(s.seasons.season,'Winter');const before=s.inventory.count('apple');s.gameTime.update(5*s.gameTime.dayDuration);near(record.growthDays,1.1);assert.equal(s.inventory.count('apple'),before-10);s.gameTime.update(s.gameTime.dayDuration*.1);near(s.farmingSystem.sync(wheat).growthDays,1.232);
});
test('growth uses active game days and weather, not frames or farming levels, across 30 and 144 FPS',()=>{
  const results=[];for(const fps of [30,144]){const s=scene(60),wheat=building(s,'wheat_field',44,50);s.seasons.weather='Drought';s.seasons.random=()=>.92;for(let i=0;i<fps*30;i++)s.gameTime.update(1000/fps);results.push(s.farmingSystem.sync(wheat).growthDays);}
  near(results[0],.39);near(results[0],results[1]);
});
test('daily consumption is exactly two king portions plus one per living subject at every configured day length and frame rate',()=>{
  for(const seconds of [60,120,240])for(const fps of [20,60,144]){
    const s=scene(seconds);stock(s,{apple:40});const a=s.workerSystem.create({x:43,y:43}),b=s.workerSystem.create({x:44,y:43}),dead=s.workerSystem.create({x:45,y:43}),traveler=s.workerSystem.create({x:46,y:43});dead.isAlive=false;dead.currentHP=0;s.workerSystem.onDeath(dead);traveler.isSubject=false;
    assert.equal(s.foodSystem.dailyConsumption,4);for(let i=0;i<seconds*fps;i++)s.gameTime.update(1000/fps);assert.equal(s.inventory.count('apple'),36);assert.equal(s.foodSystem.hungryCount,0);near(s.foodSystem.residents.get(a.id).progress,0);near(s.foodSystem.residents.get(b.id).progress,0);
    s.foodSystem.update(seconds*1000);assert.equal(s.inventory.count('apple'),36,'Scene update must not run a second consumption clock');
  }
});
test('Apple then Bread then Meat supply meals from free stored stock, excluding Wheat/Flour, cargo, ground drops and reservations',()=>{
  const s=scene(),granary=stock(s,{apple:3,bread:2,meat:2,wheat:8,flour:8}),id=`granary-${granary.id}`,r=s.foodStorage.reserve('stock',id,'apple',3,'test-reservation');s.dropSystem.create('bread',{x:41,y:40},10);
  assert.equal(s.foodSystem.availablePortions,4);s.gameTime.update(60000);assert.equal(s.foodStorage.locations.get(id).stock.bread,1);assert.equal(s.foodStorage.locations.get(id).stock.apple,3);s.foodStorage.release(r);s.gameTime.update(60000);assert.equal(s.inventory.count('apple'),2);assert.equal(s.inventory.count('meat'),2);assert.equal(s.inventory.count('wheat'),8);assert.equal(s.inventory.count('flour'),8);assert.equal(s.dropSystem.drops.size,1);
});
test('missing meals slow only hungry subjects by twenty percent, lower attractiveness, and recover when actual food becomes available',()=>{
  const s=scene(),w=s.workerSystem.create({x:43,y:43});s.skillSystem.addXP(w,'mining',100);s.gameTime.update(120000);assert.equal(s.foodSystem.hungryCount,2);near(s.skillSystem.workEfficiency(w,'mining'),1.01*.8);near(s.skillSystem.efficiency(w,'mining'),1.01);assert.equal(s.foodSystem.workMultiplier(s.character),1);assert.equal(s.attractiveness.value,60);assert.equal(s.attractiveness.shouldSettle(()=>.7),false);
  const hp=s.character.currentHP;s.character.currentHP=50;s.regeneration.update(1000,[s.character]);near(s.character.currentHP,50.2);s.character.currentHP=hp;
  stock(s,{apple:12});s.foodSystem.update(0);assert.equal(s.foodSystem.hungryCount,0);assert.equal(s.inventory.count('apple'),10);near(s.skillSystem.workEfficiency(w,'mining'),1.01);assert.equal(s.attractiveness.value,100);assert.equal(s.attractiveness.shouldSettle(()=>.99),true);assert.equal(w.isAlive,true);assert.equal(w.profession,'idle');
});
test('hungry miners physically take twenty-five percent longer for the same work without changing movement speed or production quantity',()=>{
  const durations=[];for(const hungry of [false,true]){const s=scene(),quarry=building(s,'quarry',44,45),w=s.workerSystem.create({x:43,y:45});s.workplaceSystem.assign(quarry,w);if(hungry)s.gameTime.update(120000);else stock(s,{apple:20});s.addResource(s.objectRegistry.require('stone'),{x:43,y:46});until(s,()=>w.workTask?.kind==='mine'&&w.workTask.progressMs>0);const start=s.gameTime.totalElapsed,progress=w.workTask.progressMs;until(s,()=>w.cargo?.resource==='stone');durations.push(s.gameTime.totalElapsed-start+progress/(hungry?.8:1));assert.equal(w.cargo.amount,1);assert.equal(w.speed,s.objectRegistry.require('peasant').gameplay.movementSpeed);}
  near(durations[1]/durations[0],1.25);
});
test('food shortage modifies the existing daily settlement decision without another migration loop',()=>{
  const s=scene(60,{migration:true});s.attractiveness.shouldSettle=()=>false;s.gameTime.update(60000);assert.equal(s.workerSystem.liveWorkers().length,0);s.attractiveness.shouldSettle=()=>true;s.gameTime.update(60000);assert.equal(s.workerSystem.liveWorkers().length,1);assert.equal(s.workerSystem.lastMigrationDay,3);
});
test('food economy counts recent real edible output once and estimates supply from current available stocks only',()=>{
  const s=scene(),w=s.workerSystem.create({x:43,y:43});stock(s,{apple:30,bread:10,meat:5,wheat:40,flour:20});s.foodSystem.recordProduction('apple',6,'harvest-1');s.foodSystem.recordProduction('bread',4,'bread-1');s.foodSystem.recordProduction('bread',4,'bread-1');s.foodSystem.recordProduction('wheat',8,'wheat-1');const economy=s.foodSystem.overview();assert.equal(economy.storage,45);assert.equal(economy.daily,3);assert.equal(economy.days,15);assert.equal(economy.production,10);assert.equal(economy.unfed,0);
});
test('Save/Load preserves winter, weather, meal fractions, hungry residents, growth, stocks and food history without another meal or transition',()=>{
  const s=scene();stock(s,{apple:10});const w=s.workerSystem.create({x:43,y:43}),plot=building(s,'wheat_field',44,50);s.gameTime.update(15*s.gameTime.dayDuration+12345);assert.equal(s.seasons.season,'Winter');assert.equal(s.foodSystem.hungryCount,2);const data=validateGameState(serializeGameState(s)),r=scene();loadGameState(r,data);assert.deepEqual(serializeGameState(r),data);assert.equal(r.seasons.weather,s.seasons.weather);assert.equal(r.foodSystem.workMultiplier(r.workerSystem.workers.get(w.id)),.8);const growth=r.farmingSystem.sync(r.buildings.find(b=>b.id===plot.id)).growthDays;r.gameTime.update(5000);assert.equal(r.farmingSystem.sync(r.buildings.find(b=>b.id===plot.id)).growthDays,growth);assert.equal(r.inventory.count('apple'),0);assert.equal(r.gameTime.day,s.gameTime.day);
  for(const change of [x=>x.seasons.season='Summer',x=>x.seasons.dayOfYear++,x=>x.seasons.weather='Snowstorm',x=>x.food.residents[0].progress=1,x=>x.food.residents.push(x.food.residents[0]),x=>x.food.residents[0].hungry='yes',x=>x.food.history=[{day:x.time.day,produced:0,consumed:-1}]]){const bad=structuredClone(data);change(bad);assert.throws(()=>validateGameState(bad));}
});
test('legacy schema4 migrates the old single food phase once and initializes seasonal defaults without charging meals or rerolling skills',()=>{
  const old=workerScene(undefined,{construction:true,foodProduction:true}),w=old.workerSystem.create({x:43,y:43});stock(old,{apple:45});const saved=serializeGameState(old);saved.saveVersion=4;saved.food={elapsed:32123.45};const r=scene();loadGameState(r,saved);assert.equal(r.seasons.season,'Spring');assert.equal(r.seasons.weather,'Sunny');assert.equal(r.inventory.count('apple'),45);near(r.foodSystem.elapsed,32123.45);assert.equal(r.foodSystem.hungryCount,0);assert.deepEqual(r.workerSystem.workers.get(w.id).skills,w.skills);assert.equal(r.foodSystem.residents.get(w.id).progress,0);validateGameState(serializeGameState(r));
});

test('legacy out-of-season orchard harvesting releases its saved crop and storage reservations without losing growth or duplicating fruit',()=>{
  const old=workerScene(undefined,{construction:true,foodProduction:true}),home=building(old,'farmhouse',44,45),orchard=building(old,'orchard',44,50),w=old.workerSystem.create({x:43,y:45});old.gameTime.update(360000);old.workplaceSystem.assign(home,w);until(old,()=>w.workTask?.kind==='harvest'&&w.workTask.progressMs>=1000);const data=serializeGameState(old);data.saveVersion=4;data.food={elapsed:0};const r=scene();loadGameState(r,data);const record=r.farmingSystem.records.get(orchard.id);assert.equal(record.growthDays,3);assert.equal(record.stage,1);assert.equal(record.reservedBy,null);assert.equal(r.workerSystem.workers.get(w.id).workTask,null);assert.equal(r.foodStorage.reservations.size,0);assert.equal(r.inventory.count('apple'),0);validateGameState(serializeGameState(r));
});
test('pause freezes food and hunger recovery even if stock is replenished; resuming feeds each missed resident once',()=>{
  const s=scene();s.gameTime.update(120000);assert.equal(s.foodSystem.hungryCount,1);stock(s,{apple:10});s.gameTime.setPaused(true);s.foodSystem.update(999999);s.gameTime.update(999999);assert.equal(s.inventory.count('apple'),10);assert.equal(s.foodSystem.hungryCount,1);s.gameTime.setPaused(false);s.foodSystem.update(0);assert.equal(s.inventory.count('apple'),9);assert.equal(s.foodSystem.hungryCount,0);s.foodSystem.update(0);assert.equal(s.inventory.count('apple'),9);
});
