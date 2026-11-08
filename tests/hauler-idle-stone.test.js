import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { IDLE_STONE } from '../src/data/logistics.js';
globalThis.document={querySelector:()=>({textContent:''})};

// N03 (#34) and AUD63 (#93): physical loose-stone collection around reachable hubs.
const settings=()=>gameSettings({startingCastle:true});
const scene=()=>workerScene(undefined,{construction:true,logistics:true,gameSettings:settings()});
const castle=s=>s.buildings.find(b=>b.type==='castle');
const centre=s=>s.logisticsTasks.castleCentre();
const snapshot=s=>validateGameState(serializeGameState(s));
function restore(data){const s=workerScene(undefined,{construction:true,logistics:true,starter:false,gameSettings:settings()});loadGameState(s,data);return s;}
function until(s,p,max=60000){let n=0;while(!p()&&n<max){s.tick(25);n+=25;}assert.ok(p(),`Condition not reached (${n}ms): ${JSON.stringify(s.workerSystem.liveWorkers().map(w=>({id:w.id,profession:w.profession,state:w.workState,message:w.workMessage,cargo:w.cargo,task:w.workTask})))}`);}
function stone(s,dx,dy){const c=centre(s),tile={x:Math.round(c.x+dx),y:Math.round(c.y+dy)};s.addResource(s.objectRegistry.require('stone'),tile);return tile;}
const loose=s=>[...s.resources.values()].filter(v=>v.getData('objectId')==='stone').length;
const stored=s=>[...s.foodStorage.locations.values()].reduce((n,l)=>n+(l.stock.stone??0),0);
function hauler(s,tile={x:46,y:52}){const w=s.workerSystem.create(tile);assert.equal(s.workerSystem.jobs.assign(w,'hauler'),true);return w;}
function building(s,type,x,y,blueprint=false){const definition=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,definition);if(!blueprint)Object.entries(definition.cost).forEach(([r,k])=>s.inventory.add(r,k));const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition,reserveMaterials:blueprint});assert.ifError(result.error);if(blueprint)s.constructionSystem.plan(result.building);s.towerViews.set(result.building.id,s.createBuildingView(definition,result.building));return result.building;}

test('a new Hauler collects loose stone by default (ON, radius 80 from the Castle) and stores it physically, with a mid-trip save',()=>{
  const s=scene();assert.ok(castle(s)&&buildingIsComplete(castle(s)));const before=loose(s);stone(s,6,4);stone(s,-5,7);
  const h=hauler(s);assert.deepEqual(h.stoneCollection,{enabled:true,radius:IDLE_STONE.defaultRadius});assert.equal(IDLE_STONE.defaultRadius,80);
  let saved=null;until(s,()=>{if(h.cargo?.resource==='stone'&&!saved){saved=serializeGameState(s);validateGameState(saved);}return loose(s)===before&&stored(s)===2&&!h.cargo;});
  assert.ok(saved);const r=restore(saved),rh=r.workerSystem.workers.get(h.id);assert.deepEqual(rh.stoneCollection,h.stoneCollection);until(r,()=>!rh.cargo&&stored(r)>=1);snapshot(r);
});
test('the radius is measured from the Castle: 0 collects nothing, stones outside the radius stay, settings are per unit',()=>{
  const s=scene(),near=stone(s,3,3),far=stone(s,30,0),before=loose(s);
  const a=hauler(s,{x:46,y:52}),b=hauler(s,{x:47,y:53});a.stoneCollection.radius=0;b.stoneCollection.radius=10;
  until(s,()=>stored(s)===1&&!b.cargo&&!b.workTask);s.simulate(8000);
  assert.equal(stored(s),1,'only the stone within 10 tiles');assert.equal(loose(s),before-1);assert.ok(s.resources.has(`${far.x},${far.y}`));assert.equal(s.resources.has(`${near.x},${near.y}`),false);
  assert.equal(a.workTask,null);assert.equal(a.cargo,null);b.stoneCollection.radius=IDLE_STONE.maxRadius;until(s,()=>!s.resources.has(`${far.x},${far.y}`)&&stored(s)===2);snapshot(s);
});
test('switched OFF, a Hauler leaves loose stone alone and drops an unstarted pickup',()=>{
  const s=scene(),tile=stone(s,8,0),h=hauler(s);h.stoneCollection.enabled=false;s.simulate(10000);assert.ok(s.resources.has(`${tile.x},${tile.y}`));assert.equal(h.workTask,null);
  h.stoneCollection.enabled=true;until(s,()=>h.workTask?.kind==='mine');h.stoneCollection.enabled=false;s.tick(25);assert.equal(h.workTask,null);assert.equal(s.workerSystem.reservations.available(`resource:${tile.x},${tile.y}`,'nobody'),true);snapshot(s);
});
test('without a Castle an accessible Starter Stockpile is a collection centre',()=>{
  const s=workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings({startingCastle:false})});s.addResource(s.objectRegistry.require('stone'),{x:50,y:50});
  const h=hauler(s);until(s,()=>stored(s)===1&&!h.cargo);assert.equal(castle(s),undefined);snapshot(s);
});
test('a distant Material Yard expands the per-unit radius and shares connectivity between Haulers',()=>{
  const s=scene(),b=building(s,'material_yard',75,75),a=hauler(s,{x:73,y:74}),h=hauler(s,{x:72,y:74});a.stoneCollection.radius=0;h.stoneCollection.radius=5;
  s.addResource(s.objectRegistry.require('stone'),{x:73,y:75});
  const areas=s.logisticsTasks.stoneAreas(a),cache=s.logisticsTasks.stoneAreaCache;s.logisticsTasks.stoneAreas(h);
  assert.equal(s.logisticsTasks.stoneAreaCache,cache);assert.equal(cache.regions.get('73,74'),cache.regions.get('72,74'));
  assert.ok(areas.some(x=>x.id===`yard-${b.id}`));until(s,()=>stored(s)===1&&!h.cargo);assert.equal(a.workTask,null);snapshot(s);
});
test('an inaccessible Material Yard cannot expand the collection area; connectivity expires after terrain changes',()=>{
  const s=scene(),b=building(s,'material_yard',75,75),h=hauler(s,{x:70,y:74});h.stoneCollection.radius=5;
  const location=s.foodStorage.locations.get(`yard-${b.id}`);assert.ok(s.logisticsTasks.stoneAreas(h).some(a=>a.id===location.id));
  for(const t of s.foodStorage.goals(location))s.map[t.y][t.x]=1;
  s.gameTime.totalElapsed+=501;assert.equal(s.logisticsTasks.stoneAreas(h).some(a=>a.id===location.id),false);
  s.addResource(s.objectRegistry.require('stone'),{x:71,y:75});assert.equal(s.logisticsTasks.startStone(h),false);assert.equal(h.workTask,null);
});
test('a physical construction site extends collection without granting unbooked materials',()=>{
  const s=scene();s.inventory.add('stone',30);const site=building(s,'tower',75,75,true),h=hauler(s,{x:73,y:74});h.stoneCollection.radius=4;
  const location=s.foodStorage.locations.get(`site-${site.id}`),before=structuredClone(location.stock),tile={x:73,y:75};
  s.addResource(s.objectRegistry.require('stone'),tile);assert.ok(s.logisticsTasks.stoneAreas(h).some(a=>a.id===location.id));
  assert.equal(s.logisticsTasks.startStone(h),true);assert.equal(h.workTask.targetId,'73,75');assert.deepEqual(location.stock,before);
  h.stoneCollection.radius=0;s.tick(25);assert.equal(h.workTask,null);assert.equal(s.workerSystem.reservations.available('resource:73,75','other'),true);assert.deepEqual(location.stock,before);h.stoneCollection.radius=4;const total=stored(s);// #58 phase B: the last quarter of each day the Hauler rests near the Castle, so allow a second day.
  until(s,()=>!s.resources.has('73,75')&&!h.cargo&&stored(s)===total+1,240000);assert.equal(s.constructionSystem.materials.ready(site),true);snapshot(s);
});
test('without any reachable material hub idle collection pauses',()=>{
  const s=workerScene(undefined,{construction:true,logistics:true,starter:false,gameSettings:gameSettings({startingCastle:false})}),h=hauler(s);
  s.addResource(s.objectRegistry.require('stone'),{x:50,y:50});s.simulate(1000);assert.equal(h.workTask,null);assert.match(h.workMessage,/No reachable collection area/);
});
test('two Haulers never reserve the same stone; a full store stops new pickups while carried stone is kept',()=>{
  const s=scene();for(let i=0;i<4;i++)stone(s,5+i,6);const a=hauler(s,{x:46,y:52}),b=hauler(s,{x:46,y:54});
  until(s,()=>a.workTask?.kind==='mine'&&b.workTask?.kind==='mine');assert.notEqual(a.workTask.targetId,b.workTask.targetId);
  const fill=[...s.foodStorage.locations.values()].filter(l=>s.foodStorage.isStock(l)&&l.allowed.includes('stone'));
  until(s,()=>stored(s)>=1);for(const l of fill)s.foodStorage.deposit(l.id,'stone',s.foodStorage.room(l.id));const total=stored(s)+[a,b].reduce((n,w)=>n+(w.cargo?.amount??0),0)+loose(s);
  s.simulate(10000);assert.equal(stored(s)+[a,b].reduce((n,w)=>n+(w.cargo?.amount??0),0)+loose(s),total,'no stone lost or duplicated');assert.ok([a,b].every(w=>!w.workTask||w.workTask.kind!=='mine'||w.cargo==null));snapshot(s);
});
test('real construction transport takes priority over loose stone, even on the way to a stone',()=>{
  const s=scene(),warehouse=building(s,'material_yard',58,52);s.foodStorage.deposit(`yard-${warehouse.id}`,'stone',30);stone(s,-25,-20);const h=hauler(s,{x:62,y:57});
  until(s,()=>h.workTask?.kind==='mine');const site=building(s,'tower',62,48,true);
  until(s,()=>h.workTask?.siteId===site.id||h.cargo?.siteId===site.id);assert.equal(s.workerSystem.reservations.owners.has(`resource:${h.workTask?.targetId}`),false);
  until(s,()=>s.constructionSystem.materials.ready(site));snapshot(s);
});
test('a new real delivery preempts an at-goal stone pickup before any material is collected',()=>{
  const s=scene(),warehouse=building(s,'material_yard',58,52);s.foodStorage.deposit(`yard-${warehouse.id}`,'stone',30);const tile=stone(s,6,4),key=`${tile.x},${tile.y}`,h=hauler(s,{x:56,y:56});
  until(s,()=>h.workTask?.kind==='mine'&&s.workerSystem.ai.atGoal(h,h.workTask.goal));
  const site=building(s,'tower',62,48,true);until(s,()=>h.workTask?.siteId===site.id||!s.resources.has(key),1000);
  assert.equal(h.workTask?.siteId,site.id);assert.equal(s.resources.has(key),true);assert.equal(s.workerSystem.reservations.available(`resource:${key}`,'other'),true);snapshot(s);
});
test('map edges and invalid settings: radius beyond the map is fine, saves reject out-of-range radii',()=>{
  const s=scene(),edge={x:98,y:97};s.addResource(s.objectRegistry.require('stone'),edge);const h=hauler(s);assert.ok(Math.hypot(edge.x-centre(s).x,edge.y-centre(s).y)>80,'beyond the default radius');
  s.simulate(8000);assert.ok(s.resources.has(`${edge.x},${edge.y}`));h.stoneCollection.radius=IDLE_STONE.maxRadius;until(s,()=>!s.resources.has(`${edge.x},${edge.y}`),120000);
  const data=serializeGameState(s),bad=structuredClone(data);bad.workers.find(w=>w.id===h.id).stoneCollection.radius=IDLE_STONE.maxRadius+1;assert.throws(()=>validateGameState(bad));
  const none=structuredClone(data);delete none.workers.find(w=>w.id===h.id).stoneCollection;assert.throws(()=>validateGameState(none));validateGameState(data);
});
