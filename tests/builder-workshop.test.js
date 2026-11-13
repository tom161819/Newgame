import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { BuilderWorkshopSystem } from '../src/systems/BuilderWorkshopSystem.js';
import { BUILDER_WORKSHOP } from '../src/data/builderWorkshop.js';
import { idleHomes } from '../src/data/idleGathering.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} !== ${b}`);
function scene(){const s=workerScene(undefined,{construction:true});s.builderWorkshops=new BuilderWorkshopSystem(s);s.eventFeed={pushed:[],push(key,text){this.pushed.push({key,text});return true;}};return s;}
// A finished workshop: placed, then its construction completed as a fixture.
function workshop(s,x,y,{finished=true}={}){
  const d=objectRegistry.require('builder_workshop');for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);
  const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:[],inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(r.error);
  if(finished)delete r.building.construction;else r.building.construction={state:'planned',workDone:0};
  assert.equal(buildingIsComplete(r.building),finished);return r.building;
}
function builder(s,x=40,y=40){const w=s.workerSystem.create({x,y});s.workerSystem.jobs.assign(w,'builder');return w;}
function tower(s){const d=objectRegistry.require('tower');Object.entries(d.cost).forEach(([r,k])=>s.inventory.add(r,k));const r=placeBuilding({map:s.map,anchor:{x:70,y:70},resources:s.resourceOccupancy,reservedTiles:[],inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(r.error);return r.building;}

test("#118 Builder's Workshop is a 3x3 industry building available from the start with the approved art (GPT wooden workshop since 13 Nov 2026)",()=>{
  const d=objectRegistry.require('builder_workshop');
  assert.deepEqual([d.width,d.height,d.buildingCategory,d.buildable],[3,3,'industry',true]);
  assert.deepEqual(d.cost,{wood:20});assert.equal(d.builderWorkshop.capacity,4);assert.equal(d.requiresCompletedBuildings,undefined);
  assert.equal(d.renderMode,'sprite');assert.equal(d.sprite,'/assets/buildings/builder_workshop/builders-workshop-gpt-wood-0.v1.png');
  assert.equal(d.workplace,undefined,'not a workplace: Builders never need it to work');
});

test('Builders without a workshop place work at half speed; one workshop serves four, the fifth stays slow',()=>{
  const s=scene(),site=tower(s),builders=[1,2,3,4,5].map(i=>builder(s,40+i,40));
  const base=s.skillSystem.workEfficiency(builders[0],s.constructionSystem.workSkill(site));
  near(s.constructionSystem.workSpeed(site,builders[0]),base*BUILDER_WORKSHOP.unservedSpeed);
  assert.equal(s.eventFeed.pushed.length,1,'one notice when a Builder works without a workshop');
  s.constructionSystem.workSpeed(site,builders[1]);assert.equal(s.eventFeed.pushed.length,1,'never repeated');
  const unfinished=workshop(s,20,20,{finished:false});
  assert.equal(s.builderWorkshops.workshopFor(builders[0]),null,'a workshop under construction serves nobody');
  const shop=workshop(s,30,30);
  assert.equal(s.builderWorkshops.served(shop).length,4);assert.equal(s.builderWorkshops.served(unfinished).length,0);
  for(const w of builders.slice(0,4)){assert.equal(s.builderWorkshops.workshopFor(w),shop);near(s.constructionSystem.workSpeed(site,w),base);}
  assert.equal(s.builderWorkshops.workshopFor(builders[4]),null);near(s.constructionSystem.workSpeed(site,builders[4]),base*.5);
  // The King and other professions are never slowed.
  assert.equal(s.builderWorkshops.factor(s.character),1);const miner=s.workerSystem.create({x:45,y:45});s.workerSystem.jobs.assign(miner,'miner');assert.equal(s.builderWorkshops.factor(miner),1);
  const second=workshop(s,60,30);assert.equal(s.builderWorkshops.workshopFor(builders[4]),second,'a second workshop takes the fifth');
  s.buildings.splice(s.buildings.indexOf(shop),1);
  assert.equal(s.builderWorkshops.served(second).length,4,'after a workshop is gone the others are reassigned');
  assert.equal(s.builderWorkshops.summary().served,4);assert.equal(s.builderWorkshops.summary().builders,5);
});

test('an idle Builder with a place waits at his workshop; without one he keeps waiting where he is',()=>{
  const s=scene(),a=builder(s),b=builder(s,41,40);
  assert.deepEqual(idleHomes(s,a,{workplaceOnly:true}),[]);
  const shop=workshop(s,30,30);s.builderWorkshops.capacity=()=>1;s.builderWorkshops.key=null;
  assert.deepEqual(idleHomes(s,a,{workplaceOnly:true}),[{building:shop,kind:'workplace'}]);
  assert.deepEqual(idleHomes(s,b,{workplaceOnly:true}),[]);
  // In the simulation the idle Builder walks next to the workshop.
  for(let i=0;i<400&&!s.workerSystem.gather.atHome?.(a);i++)s.tick(100);
  const d=Math.max(Math.max(shop.x-a.tile.x,a.tile.x-(shop.x+2),0),Math.max(shop.y-a.tile.y,a.tile.y-(shop.y+2),0));
  assert.ok(d>=1&&d<=5,`waits next to the workshop (${JSON.stringify(a.tile)})`);
});

test('the workshop is saved like any building and the assignment is derived again after loading',()=>{
  const s=scene(),w=builder(s),shop=workshop(s,30,30);assert.equal(s.builderWorkshops.workshopFor(w),shop);
  const data=validateGameState(JSON.parse(JSON.stringify(serializeGameState(s))));
  assert.ok(data.buildings.some(b=>b.type==='builder_workshop'));
  const r=workerScene(data.terrain,{construction:true});loadGameState(r,data);r.builderWorkshops=new BuilderWorkshopSystem(r);
  const loaded=[...r.workerSystem.workers.values()].find(x=>x.id===w.id);
  assert.equal(r.builderWorkshops.workshopFor(loaded)?.type,'builder_workshop');
});
