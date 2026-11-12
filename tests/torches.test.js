import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { LightFuelSystem,validLightFuelState } from '../src/systems/LightFuelSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { TORCHES } from '../src/data/torches.js';
import { PITCH_RECIPES } from '../src/data/production.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { gridToWorld } from '../src/game/isometric.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

function world(){
  const s=workerScene(undefined,{logistics:true,workplaces:true});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);
  s.dayNight=new DayNightSystem(s);s.lightFuel=new LightFuelSystem(s);s.eventFeed={pushed:[],push(key,text){this.pushed.push({key,text});return true;}};
  const place=(type,x,y)=>{const d=s.objectRegistry.require(type);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);
    const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;};
  const store=()=>[...s.foodStorage.locations.values()].find(l=>s.foodStorage.isStock(l));
  // Moves the clock forward to a part of the day (the next day if it has passed) and lets the places react.
  const at=fraction=>{const g=s.gameTime,target=g.dayDuration*fraction;g.update(target>g.elapsed?target-g.elapsed:g.dayDuration-g.elapsed+target);s.lightFuel.update();};
  return {s,f:s.lightFuel,place,store,at};
}

test('Pitch Kiln: 2 Wood → 1 Pitch and 1 Wood + 1 Pitch → 3 Torches; Torches first while below 20 and Pitch is at hand', () => {
  assert.deepEqual(PITCH_RECIPES.pitch.input,{wood:4});assert.deepEqual(PITCH_RECIPES.pitch.output,{pitch:2});assert.equal(PITCH_RECIPES.pitch.duration,15000);
  assert.deepEqual(PITCH_RECIPES.torches.input,{wood:2,pitch:2});assert.deepEqual(PITCH_RECIPES.torches.output,{torch:6});assert.equal(PITCH_RECIPES.torches.duration,10000);
  const kiln=objectRegistry.require('pitch_kiln');assert.deepEqual([kiln.width,kiln.height,kiln.buildingCategory],[2,2,'industry']);assert.deepEqual(kiln.cost,{wood:8,stone:4});
  assert.equal(kiln.workplace.profession,'pitch_maker');assert.equal(kiln.workplace.capacity,1,'tabulka-budov-1: one Pitch Maker');
  const {s,place,store}=world(),b=place('pitch_kiln',60,60),record=s.foodProduction.records.get(b.id);
  s.foodProduction.chooseRecipes();assert.equal(record.recipe,'pitch','no Pitch yet: make Pitch');
  store().stock.pitch=2;s.foodProduction.chooseRecipes();assert.equal(record.recipe,'torches','Pitch at hand and few Torches: make Torches');
  store().stock.torch=TORCHES.torchTarget;s.foodProduction.chooseRecipes();assert.equal(record.recipe,'pitch','enough Torches: back to Pitch');
});

test('a light place burns only with fuel: it takes a night\'s fuel at dusk, stays dark without it, and goes out in the morning', () => {
  const {s,f,place,at}=world(),post=place('torch_post',60,60),brazier=place('brazier',64,60),dark=place('torch_post',68,60);
  assert.ok(s.foodStorage.locations.has(`fuel-${post.id}`));assert.deepEqual(s.foodStorage.locations.get(`fuel-${brazier.id}`).allowed,['wood'],'the Brazier burns Wood');
  s.foodStorage.deposit(`fuel-${post.id}`,'torch',2);s.foodStorage.deposit(`fuel-${brazier.id}`,'wood',1);
  at(.3);assert.equal(f.isLit(post),false,'not by day');
  at(s.dayNight.nightStart()-.05);assert.equal(f.isLit(post),true);assert.equal(f.isLit(brazier),true);assert.equal(f.isLit(dark),false,'no fuel, no light');
  assert.equal(f.stock(post),1,'one Torch a night');assert.equal(f.stock(brazier),0,'one Wood a night');
  assert.match(s.eventFeed.pushed.at(-1).text,/1 light has no fuel/);
  at(s.dayNight.nightStart()+.05);assert.equal(f.stock(post),1,'only once a night');
  at(.02);assert.equal(f.isLit(post),true,'still burning at dawn');at(.3);assert.equal(f.isLit(post),false,'out in the morning');
  assert.ok(f.isLit(s.buildings.find(b=>b.type==='starter_stockpile')),'a place without fuel needs none');
});

test('Haulers get refill jobs for every place below its store size; Pitch Makers and soldiers with Tend torches take only those', () => {
  const {s,f,place,store}=world(),post=place('torch_post',60,60);store().stock.torch=10;
  const jobs=f.candidates();assert.equal(jobs.length,1);assert.deepEqual([jobs[0].destinationId,jobs[0].resource,jobs[0].amount,jobs[0].priority,jobs[0].fuel],[`fuel-${post.id}`,'torch',2,TORCHES.refillPriority,true]);
  s.foodStorage.deposit(`fuel-${post.id}`,'torch',2);assert.equal(f.candidates().length,0,'full');
  // A soldier tends only when the box is ticked and he is on patrol; a Pitch Maker only after midday without a free Hauler.
  const soldier=s.workerSystem.create({x:59,y:62});Object.assign(soldier,{profession:'soldier',workState:'Patrolling'});let called=0;s.logisticsTasks={updateWorker:()=>{called++;return true;},freeHauler:()=>false};
  s.foodStorage.withdraw(`fuel-${post.id}`,'torch',2);f.help(soldier);assert.equal(called,0,'box not ticked');
  soldier.tendTorches=true;f.help(soldier);assert.equal(called,1);
  const maker=s.workerSystem.create({x:58,y:62});Object.assign(maker,{profession:'pitch_maker',workState:'Waiting'});s.gameTime.elapsed=s.gameTime.dayDuration*.3;f.help(maker);assert.equal(called,1,'before midday the Haulers have time');
  s.gameTime.elapsed=s.gameTime.dayDuration*.55;maker.fuelCheckAt=null;f.help(maker);assert.equal(called,2);
});

test('soldiers on the night watch take a Torch at dusk: full sight and light around them; tower holders give sight only with someone on watch', () => {
  const {s,f,place,store,at}=world(),soldier=s.workerSystem.create({x:30,y:30});soldier.profession='soldier';store().stock.torch=3;
  at(s.dayNight.nightStart()-.05);assert.equal(f.carries(soldier),true);assert.equal(store().stock.torch,2,'one Torch taken');
  at(.95);const lights=s.dayNight.lights();assert.equal(s.dayNight.sightFactor(soldier.position,lights),1,'sees fully with a torch');
  assert.equal(s.dayNight.darkAt({x:31,y:31}),false,'his torch lights a house nearby');
  const tower=place('tower',70,70);s.foodStorage.deposit(`fuel-${tower.id}`,'torch',4);at(.3);at(s.dayNight.nightStart()-.05);assert.equal(f.isLit(tower),true);
  const lightAt={type:'torch',...gridToWorld(71,71),radius:102.4,buildingId:tower.id},grid=s.dayNight;s.lightSources={lights:()=>[lightAt]};
  const watched=()=>grid.lights().filter(l=>Math.hypot(l.x-71,l.y-71)<1).length;s.character.position={x:5,y:5};for(const w of s.workerSystem.liveSubjects())w.position={x:1,y:90};
  assert.equal(watched(),0,'nobody on the tower: no sight from its holders');
  s.character.position={x:71,y:72};assert.equal(watched(),1,'the King on watch: its holders give sight');
});

test('a house without a burning light within 6 tiles is dark at night: Safety −30, not by day', () => {
  const {s,place}=world(),house=place('house',60,60);s.workerSystem.create({x:62,y:66});s.workerSystem.create({x:63,y:66});const homes=s.needs.homes();
  const resident=s.workerSystem.liveSubjects().find(w=>homes.get(w.id)?.buildingId===house.id);
  s.gameTime.update(s.gameTime.dayDuration*.95);let st=s.needs.status(resident);assert.deepEqual(st.safetyFactors.find(([k])=>k==='dark'),['dark',-TORCHES.darkHouse.penalty]);
  s.lightSources={lights:()=>[]};s.lightFuel.hands.add('x');s.gameTime.update(s.gameTime.dayDuration*.35);st=s.needs.status(resident);assert.equal(st.safetyFactors.some(([k])=>k==='dark'),false,'by day');
});

test('save: which places burn tonight and who carries a torch (schema 56); Tend torches is kept on the soldier', () => {
  const {s,f,place,at}=world(),post=place('torch_post',60,60);s.foodStorage.deposit(`fuel-${post.id}`,'torch',2);at(s.dayNight.nightStart()-.05);
  const soldier=s.workerSystem.create({x:40,y:40});soldier.profession='soldier';soldier.tendTorches=true;
  const state=validateGameState(serializeGameState(s));assert.ok(SAVE_VERSION>=56);assert.deepEqual(state.lightFuel.lit,[post.id]);assert.equal(state.workers.find(w=>w.id===soldier.id).tendTorches,true);
  assert.equal(validLightFuelState({lit:['x'],hands:[],litDay:1,wasDark:true}),false);void f;
});

test('m-smolar-pochodne: the player\'s choice at a Pitch Kiln holds (Torches, Pitch, Automatic) and the Torch target can be set', () => {
  const {s,place,store}=world(),b=place('pitch_kiln',60,60),record=s.foodProduction.records.get(b.id),fp=s.foodProduction;
  assert.equal(fp.recipeMode(b),'auto');store().stock.pitch=2;store().stock.torch=TORCHES.torchTarget;
  fp.chooseRecipes();assert.equal(record.recipe,'pitch');
  assert.equal(fp.setRecipe(b.id,'torches'),true);fp.chooseRecipes();assert.equal(record.recipe,'torches','Torches chosen: made even above the target');assert.equal(fp.recipeMode(b),'torches');
  store().stock.torch=0;assert.equal(fp.setRecipe(b.id,'pitch'),true);fp.chooseRecipes();assert.equal(record.recipe,'pitch','Pitch chosen: no Torches even when none are left');
  assert.equal(fp.setRecipe(b.id,'auto'),true);assert.equal(record.recipe,'torches','Automatic again');
  assert.equal(fp.setTorchTarget(b.id,0),true);assert.equal(record.recipe,'pitch','target 0: Pitch only');assert.equal(fp.setTorchTarget(b.id,61),false);assert.equal(fp.setTorchTarget(b.id,40),true);assert.equal(fp.torchTarget(b),40);assert.equal(record.recipe,'torches');
  assert.equal(fp.setRecipe(b.id,'nonsense'),false);
  const again=fp.exportState();fp.importState(again);assert.equal(fp.recipeMode(b),'auto');assert.equal(fp.torchTarget(b),40,'saved with the record');
});
test('m-ukladani-chyba: the Pitch Kiln keeps its recipes before 0.99.0 for running batches in older saves', async () => {
  const { recipeVariants,RECIPE_HISTORY } = await import('../src/data/production.js');
  assert.deepEqual(recipeVariants('pitch_kiln','pitch',PITCH_RECIPES.pitch).map(v=>[v.input,v.output,v.duration]),[[{wood:4},{pitch:2},15000],[{wood:2},{pitch:1},30000]]);
  assert.deepEqual(recipeVariants('pitch_kiln','torches',PITCH_RECIPES.torches)[1].input,{wood:1,pitch:1});
  assert.ok(RECIPE_HISTORY.mill&&RECIPE_HISTORY.bakery);
});
test('m-smolar-nosi-vyrobky: the Pitch Maker fetches Wood and carries Pitch to the store himself; Haulers get no Pitch Kiln jobs', () => {
  const {s,place,store}=world(),b=place('pitch_kiln',60,60),record=s.foodProduction.records.get(b.id);
  store().stock.wood=(store().stock.wood??0)+20;const w=s.workerSystem.create({x:63,y:63});assert.equal(s.workplaceSystem.assign(b,w),true);
  for(let i=0;i<6000&&!((store().stock.pitch??0)>0);i++)s.tick(50);
  assert.ok((store().stock.pitch??0)>0,'Pitch reached the store without a Hauler');
  store().stock.wood=(store().stock.wood??0)+20;if(s.logisticsTasks){s.logisticsTasks.nextRefresh=0;s.logisticsTasks.update();}const catalog=s.logisticsTasks?.catalog??[];assert.ok(s.logisticsTasks,'logistics on');
  assert.equal(catalog.some(t=>t.outputBuildingId===b.id||String(t.destinationId)===`input-${b.id}`),false,'no Hauler job for the Pitch Kiln');
  void record;
});
