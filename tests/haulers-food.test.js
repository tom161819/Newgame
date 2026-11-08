import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { carryCapacity } from '../src/data/logistics.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { candidateGroups,worksWithoutBuilding } from '../src/ui/workplaceCandidates.js';
import { populationSummary,populationDetails } from '../src/ui/populationData.js';
import { WORKPLACES } from '../src/data/workplaces.js';
globalThis.document??={querySelector:()=>({textContent:''})};

// m-nosici-trakar-pracoviste (owner 62, 65 from the 0.50 playtest).
const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}
function hauler(s,tile,vehicle=null){
  const h=s.workerSystem.create(tile);s.workerSystem.jobs.assign(h,'hauler');h.stoneCollection={enabled:false,radius:80};
  // The horse itself is covered in horse-wagon.test.js; here the wagon only needs to be usable.
  if(vehicle){if(vehicle==='horse_wagon')s.vehicles.usable=()=>true;s.vehicles.create(vehicle,{x:tile.x+1,y:tile.y});until(s,()=>s.vehicles.held(h));}
  return h;
}
// Every distinct cargo the Hauler picks up while the scene runs.
function loads(s,h,ms){const seen=[];let last=null;for(let t=0;t<ms;t+=50){s.tick(50);const c=h.cargo?`${h.cargo.resource}:${h.cargo.amount}`:null;if(c&&c!==last)seen.push(c);last=c;}return seen;}

test('a Hauler with a Wheelbarrow or Horse Wagon carries a full load of food into the Granary; by hand as before',()=>{
  for(const [vehicle,factor]of [[null,1],['wheelbarrow',5],['horse_wagon',10]]){
    const s=scene(),granary=building(s,'granary',44,44),h=hauler(s,{x:50,y:50},vehicle),stockpile=s.buildings.find(b=>b.type==='starter_stockpile');
    assert.equal(carryCapacity(h,'wheat'),40*factor);
    s.foodStorage.deposit(`stockpile-${stockpile.id}`,'wheat',Math.min(250,s.foodStorage.locations.get(`stockpile-${stockpile.id}`).capacity));
    const amount=s.foodStorage.locations.get(`stockpile-${stockpile.id}`).stock.wheat;
    until(s,()=>h.cargo?.resource==='wheat');assert.equal(h.cargo.amount,Math.min(amount,40*factor),`${vehicle??'hands'}: one trip takes the full load`);
    until(s,()=>(s.foodStorage.locations.get(`granary-${granary.id}`).stock.wheat??0)===amount);
  }
});

test('a Hauler with a Wheelbarrow fills a Mill with whole batches in one trip; by hand he still brings one batch',()=>{
  for(const vehicle of ['wheelbarrow','horse_wagon',null]){
    const s=scene(),granary=building(s,'granary',44,44),mill=building(s,'mill',54,44),miller=s.workerSystem.create({x:55,y:50});assert.equal(s.workplaceSystem.assign(mill,miller),true);
    const h=hauler(s,{x:50,y:50},vehicle);s.foodStorage.deposit(`granary-${granary.id}`,'wheat',100);
    const wheat=loads(s,h,120000).filter(l=>l.startsWith('wheat:')).map(l=>Number(l.split(':')[1]));assert.ok(wheat.length,'the Hauler supplies the Mill');
    if(vehicle){assert.equal(wheat[0],20,`${vehicle}: the first trip fills the 20-unit input buffer (5 batches of 4 Wheat)`);assert.ok(wheat.every(n=>n>4||n===wheat.at(-1)),'later trips top it up, never one batch at a time');}
    else assert.ok(wheat.every(n=>n===4),'by hand: one batch (4 Wheat) per trip, as before');
    // Mid-trip and full-buffer states save and load.
    const saved=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)),saved);
  }
});

test('non-food workshops keep one batch per trip, even for a Hauler with a Wheelbarrow',()=>{
  const s=scene(),shop=building(s,'wheelwright_workshop',54,44),fp=s.foodProduction;
  assert.deepEqual([fp.inputTarget(shop,'wood',{bulk:true}),fp.inputTarget(shop,'iron',{bulk:true})],[10,2]);
  const mill=building(s,'mill',44,54);assert.deepEqual([fp.inputTarget(mill,'wheat'),fp.inputTarget(mill,'wheat',{bulk:true})],[4,20]);
  const bakery=building(s,'bakery',60,54);assert.equal(fp.inputTarget(bakery,'flour',{bulk:true}),20);
});

const person=(id,profession,{workplace=null,level=1}={})=>({id,profession,assignedWorkplaceId:workplace,naturalTalent:'hunting',isAlive:true,isSubject:true,skills:{milling:{level,totalXP:0}},experience:{level:1}});
test('Haulers and Builders are never "without a workplace": the picker lists them as already working, last',()=>{
  const people=[person('worker-1','idle'),person('worker-2','hauler',{level:9}),person('worker-3','builder',{level:8}),person('worker-4','miller'),person('worker-5','baker',{workplace:7}),person('worker-6','woodcutter')];
  const groups=candidateGroups(people,WORKPLACES.mill);
  assert.deepEqual(groups.profession.map(w=>w.id),['worker-4']);
  assert.deepEqual(groups.free.map(w=>w.id),['worker-1','worker-6'],'Unemployed and a Woodcutter without a hut');
  assert.deepEqual(groups.employed.map(w=>w.id),['worker-2','worker-3','worker-5'],'Hauler and Builder with the people working in buildings');
  assert.deepEqual(people.map(worksWithoutBuilding),[false,true,true,false,false,false]);
  // Counters: Haulers and Builders count as employed; only Unemployed residents are unemployed.
  assert.deepEqual([populationSummary(people).employed,populationSummary(people).unemployed],[5,1]);
});

test('the Population panel names the workplace of a Hauler and a Builder instead of "Not assigned"',()=>{
  const s=scene(),h=hauler(s,{x:50,y:50}),b=s.workerSystem.create({x:52,y:50});s.workerSystem.jobs.assign(b,'builder');
  assert.equal(populationDetails(s,h).workplace,'whole kingdom');assert.equal(populationDetails(s,b).workplace,'whole kingdom');
});
