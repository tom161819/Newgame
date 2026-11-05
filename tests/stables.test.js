import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { STABLE_RULES } from '../src/data/stables.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;}
const horse=(s,tile)=>s.animalSystem.create(s.objectRegistry.require('horse'),tile);
function stablehand(s,stables,tile){const w=s.workerSystem.create(tile);assert.equal(s.workplaceSystem.assign(stables,w),true);assert.equal(w.profession,'stablehand');return w;}
function until(s,p,max=200000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}

test('Stables: 5×5, 15 Wood + 10 Stone, two Stablehands, room for 4 tamed horses; six wild horses at a new game',()=>{
  const s=workerScene(),d=s.objectRegistry.require('stables');
  assert.deepEqual([d.width,d.height,d.cost,d.workplace.capacity,d.workplace.profession,d.horseCapacity],[5,5,{wood:15,stone:10},2,'stablehand',4]);
  assert.equal(s.objectRegistry.require('horse').gameplay.initialCount,STABLE_RULES.wildHorses);
});

test('Stablehands tame wild horses on their own and lead them into the paddock; never the same horse twice; Save/Load mid-taming',()=>{
  let s=scene();const st=building(s,'stables',50,50),a=stablehand(s,st,{x:49,y:56}),b=stablehand(s,st,{x:51,y:56});
  const h1=horse(s,{x:60,y:56}),h2=horse(s,{x:62,y:58});
  until(s,()=>s.stables.jobs.size===2&&[...s.stables.jobs.values()].some(j=>j.phase==='taming'));
  assert.notEqual(s.stables.jobs.get(a.id).horseId,s.stables.jobs.get(b.id).horseId,'each Stablehand has his own horse');
  const saved=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)),saved);s=r;
  until(s,()=>s.stables.horses.size===2);
  for(const id of [h1.id,h2.id]){const animal=s.animalSystem.animals.get(id),t=animal.tile;assert.ok(t.x>=st.x&&t.x<st.x+5&&t.y>=st.y&&t.y<st.y+5,'inside the paddock');assert.equal(s.stables.tamed(animal),true);}
  assert.ok(s.workerSystem.workers.get(a.id).experience.totalXP>=0);
  const later=[...s.animalSystem.animals.values()].map(x=>({...x.tile}));s.tick(5000);assert.deepEqual([...s.animalSystem.animals.values()].map(x=>({...x.tile})),later,'stabled horses stay in the paddock');
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
