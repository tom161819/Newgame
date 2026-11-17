import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { totalXPForLevel,getXPRequired } from '../src/data/experience.js';
import { STABLE_RULES } from '../src/data/stables.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;}
const horse=(s,tile)=>s.animalSystem.create(s.objectRegistry.require('horse'),tile);
function stablehand(s,stables,tile){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(stables,w),true);assert.equal(w.profession,'stablehand');return w;}
function until(s,p,max=200000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}

test('Stables: 6×8 (owner 14 Nov 2026), 20 Wood (owner price 0.49), one Stablehand (tabulka-budov-1), room for 4 tamed horses; six wild horses at a new game',()=>{
  const s=workerScene(),d=s.objectRegistry.require('stables');
  assert.deepEqual([d.width,d.height,d.cost,d.workplace.capacity,d.workplace.profession,d.horseCapacity],[6,8,{wood:20},1,'stablehand',4]);
  assert.equal(s.objectRegistry.require('horse').gameplay.initialCount,STABLE_RULES.wildHorses);
});

test('Stablehands tame wild horses on their own and lead them into the paddock; never the same horse twice; Save/Load mid-taming',()=>{
  // tabulka-budov-1: one Stablehand a Stables by default; two seats here test that two never take the same horse.
  objectRegistry.configureWorkplaces({version:1,workplaces:{stables:{capacity:2}}});try{
  let s=scene();const st=building(s,'stables',50,50),a=stablehand(s,st,{x:49,y:56}),b=stablehand(s,st,{x:51,y:58});
  const h1=horse(s,{x:60,y:56}),h2=horse(s,{x:62,y:58});
  until(s,()=>s.stables.jobs.size===2&&[...s.stables.jobs.values()].some(j=>j.phase==='taming'));
  assert.notEqual(s.stables.jobs.get(a.id).horseId,s.stables.jobs.get(b.id).horseId,'each Stablehand has his own horse');
  const saved=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)),saved);s=r;
  until(s,()=>s.stables.horses.size===2);
  for(const id of [h1.id,h2.id]){const animal=s.animalSystem.animals.get(id),t=animal.tile;assert.ok(t.x>=st.x&&t.x<st.x+6&&t.y>=st.y+3&&t.y<st.y+8,'inside the paddock, in front of the stable');assert.equal(s.stables.tamed(animal),true);}
  assert.ok(s.workerSystem.workers.get(a.id).experience.totalXP>=0);
  const later=[...s.animalSystem.animals.values()].map(x=>({...x.tile}));s.tick(5000);assert.deepEqual([...s.animalSystem.animals.values()].map(x=>({...x.tile})),later,'stabled horses stay in the paddock');
  }finally{objectRegistry.configureWorkplaces({version:1,workplaces:{}});}
});

test('a full Stables stops taming; the place is reserved when a job starts',()=>{
  const s=scene(),st=building(s,'stables',50,50),w=stablehand(s,st,{x:49,y:56});
  for(let i=0;i<4;i++){const h=horse(s,{x:40+i*2,y:60});s.stables.horses.set(h.id,{state:'stabled',stableId:st.id});s.stables.place(h.id);}
  horse(s,{x:60,y:56});until(s,()=>w.workMessage==='The Stables are full');assert.equal(s.stables.jobs.size,0);assert.equal(s.stables.room(st.id),0);
  const [first]=s.stables.horses.keys();s.stables.horses.delete(first);until(s,()=>s.stables.jobs.size===1);assert.equal(s.stables.room(st.id),0,'the last place is taken by the started job');
});

test('the King tames a wild horse by riding it 25 s and leaves it in Stables with room; tamed horses cannot be ridden off',()=>{
  const s=scene(),st=building(s,'stables',50,50),h=horse(s,{x:49,y:56});
  h.mounted=true;s.character.mountedHorse=h;s.stables.update(STABLE_RULES.kingTameMs-1);assert.equal(h.kingTamed,undefined);s.stables.update(2);assert.equal(h.kingTamed,true);
  s.character.tile={x:49,y:55};h.mounted=false;s.character.mountedHorse=null;assert.equal(s.stables.onDismount(h),true);assert.equal(s.stables.tamed(h),true);
  assert.equal(s.mountSystem?.command?.(h)??false,false);
  const far=horse(s,{x:80,y:80});far.kingTamed=true;s.character.tile={x:80,y:79};assert.equal(s.stables.onDismount(far),false,'too far from Stables: it stays outside');
});

test('Light Cavalry needs a free stabled horse (the Knight walks since p70): reserved for training, ridden afterwards (faster), returned on discharge; Save/Load; a mounted Knight from an older save gives the horse back',()=>{
  let s=scene();const st=building(s,'stables',50,50),barracks=building(s,'barracks',34,46),armory=building(s,'armory',62,40);
  s.foodStorage.register(armory);s.foodStorage.register(barracks);s.foodStorage.deposit(`armory-${armory.id}`,'sword',1);s.inventory.add('gold',100);
  for(const t of [{x:56,y:44},{x:57,y:44}]){const h=s.workerSystem.create(t);s.workerSystem.jobs.assign(h,'hauler');}
  const knight=s.workerSystem.create({x:35,y:52});assert.equal(s.workplaceSystem.assign(barracks,knight),true);Object.assign(knight.skills.combat,{level:4,currentXP:0,totalXP:totalXPForLevel(4),xpToNextLevel:getXPRequired(4)});
  assert.equal(s.military.blocker(knight,'light_cavalry'),'horse','no tamed horse yet');
  const horseAnimal=horse(s,{x:30,y:30});s.stables.horses.set(horseAnimal.id,{state:'stabled',stableId:st.id});s.stables.place(horseAnimal.id);
  assert.equal(s.military.blocker(knight,'light_cavalry'),null);
  assert.equal(s.military.train(knight,'light_cavalry'),null);assert.equal(s.stables.horses.get(horseAnimal.id).state,'reserved');assert.equal(s.stables.freeHorse(),null,'no second rider on the same horse');
  until(s,()=>s.military.units.has(knight.id));assert.equal(s.stables.horses.get(horseAnimal.id).state,'ridden');assert.ok(knight.speed>knight.definition.gameplay.movementSpeed,'a rider is faster');
  const old=serializeGameState(s);old.military.units=old.military.units.map(u=>u.workerId===knight.id?{...u,type:'knight',equipment:{weapon:'sword',armor:'armor'}}:u);
  const before=scene(false);loadGameState(before,validateGameState(old));assert.equal(before.stables.horses.get(horseAnimal.id).state,'stabled','the older Knight gave his horse back');assert.equal(before.workerSystem.workers.get(knight.id).speed,knight.definition.gameplay.movementSpeed);
  const saved=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)),saved);s=r;
  const k=s.workerSystem.workers.get(knight.id);assert.equal(s.military.release(k),true);assert.equal(s.stables.horses.get(horseAnimal.id).state,'stabled','back in the paddock');assert.equal(k.speed,k.definition.gameplay.movementSpeed);
});

test('#163: a blocked way home never loses a tamed horse, and the led horse does not block its Stablehand',()=>{
  const s=scene(),st=building(s,'stables',50,50),w=stablehand(s,st,{x:49,y:56}),h=horse(s,{x:60,y:60});
  until(s,()=>s.stables.jobs.get(w.id)?.phase==='leading');
  const job=s.stables.jobs.get(w.id);
  // The horse one step behind is not an obstacle on the Stablehand's own navigation map.
  const nav=s.workerSystem.navigationMap(w);for(const t of h.reservedTiles())assert.equal(nav[t.y][t.x],s.map[t.y][t.x],'led horse tile stays open for routing');
  // A route that cannot be found keeps the job (and the taming done) and simply retries.
  const moveTo=w.moveTo.bind(w);let refused=0;w.moveTo=goals=>{if(refused<3){refused++;w.path=[];return false;}return moveTo(goals);};w.path=[];w.nextTile=null;w.aiCooldown=0;
  for(let i=0;i<60&&refused<3;i++)s.tick(50);
  assert.equal(refused,3);assert.equal(s.stables.jobs.get(w.id),job,'still the same leading job');assert.equal(job.phase,'leading');
  w.moveTo=moveTo;until(s,()=>s.stables.horses.has(h.id));
});

test('#163: a worker sharing his tile with the King can still find a way (he is never trapped on his own tile)',()=>{
  const s=scene(),w=s.workerSystem.create({x:49,y:56});
  s.character.tile={x:49,y:56};s.character.position={x:49.5,y:56.5};s.character.nextTile=null;
  const nav=s.workerSystem.navigationMap(w);assert.equal(nav[56][49],0,'own tile stays open');
  assert.equal(w.moveTo([{x:55,y:56}]),true,'a route out exists');
  const other=s.workerSystem.create({x:60,y:60});assert.equal(s.workerSystem.navigationMap(other)[56][49],1,'for everyone else the King still blocks that tile');
});
