import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { EmploymentSystem } from '../src/systems/EmploymentSystem.js';
import { recommendedHaulers,wantedBuilders } from '../src/data/employment.js';
import { NEEDS,starvingPenalty,happinessOf } from '../src/data/needs.js';

test('m-nosici-auto: recommended Haulers = 1 for every 10 residents; Builders follow the sites and the workshop places', () => {
  assert.deepEqual([4,10,14,15,20,40,100].map(recommendedHaulers),[1,1,1,2,2,4,10]);
  assert.equal(wantedBuilders(5,0),0,'no workshop: nobody joins');assert.equal(wantedBuilders(0,4),1);assert.equal(wantedBuilders(3,4),2);assert.equal(wantedBuilders(20,4),4);assert.equal(wantedBuilders(20,8),8);
});

test('m-nosici-auto: automatic employment keeps the wanted number of Haulers; the owner can set his own number', () => {
  const s=workerScene(undefined,{workplaces:true});s.events=new EventEmitter();s.employment=new EmploymentSystem(s);
  const people=Array.from({length:12},(_,i)=>s.workerSystem.create({x:40+i,y:50}));const haulers=()=>people.filter(w=>w.profession==='hauler').length;
  assert.equal(s.employment.haulerTarget(),1);s.employment.run();assert.equal(haulers(),1);
  assert.equal(s.employment.setHaulers(3),true);s.employment.run();assert.equal(haulers(),3);
  assert.equal(s.employment.setHaulers(1),true);assert.equal(haulers(),1,'a lower number lets the surplus go at once');
  assert.equal(s.employment.setHaulers(-1),false);assert.equal(s.employment.setHaulers(1.5),false);
  assert.equal(s.employment.exportState().haulers,1);assert.equal(s.employment.setHaulers(null),true);assert.equal('haulers' in s.employment.exportState(),false,'recommended is not saved');
  const off=workerScene(undefined,{workplaces:true});off.events=new EventEmitter();off.employment=new EmploymentSystem(off,{enabled:false});const w=off.workerSystem.create({x:40,y:50});off.employment.run();assert.equal(w.profession,'idle','OFF hires nobody');
});

test('m-hlad-nasledky: hunger costs more Happiness the longer it lasts', () => {
  assert.equal(starvingPenalty(0),0);assert.equal(starvingPenalty(1),0);assert.equal(starvingPenalty(2),12);assert.equal(starvingPenalty(3),24);assert.equal(starvingPenalty(10),NEEDS.food.starving.max);
  const fed={food:70,rest:95,housing:100,safety:70},unfed={...fed,food:0};
  assert.ok(happinessOf(unfed,starvingPenalty(1))>=45,'the first day: only the Food need');assert.ok(happinessOf(unfed,starvingPenalty(4))<25,'after 4 days: a strike');assert.ok(happinessOf(unfed,starvingPenalty(5))<15,'after 5 days: leaving');
});

test('m-trosky-znovu: Burnt Ruins can be built again as the burnt building for its full price', async () => {
  const { rebuildRuin }=await import('../src/game/ruinRebuild.js');const { NightThreatSystem }=await import('../src/systems/NightThreatSystem.js');const { buildingTiles }=await import('../src/game/buildings.js');
  const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true});s.events=new EventEmitter();const n=new NightThreatSystem(s);s.nightThreats=n;
  const d=s.objectRegistry.require('house'),house={id:900,type:'house',definition:d,x:60,y:60,tiles:buildingTiles({x:60,y:60},d)};for(const tl of house.tiles)s.map[tl.y][tl.x]=1;s.buildings.push(house);
  n.burnDown(house);const ruin=s.buildings.find(b=>b.type==='burnt_ruins');assert.ok(ruin);assert.equal(ruin.burntFrom,'house');
  for(const [r,amount] of Object.entries(d.cost))s.inventory.remove?.(r,s.inventory.count(r));
  if(!s.inventory.canAfford(d.cost)){const poor=rebuildRuin(s,ruin);assert.ok(poor.error);assert.ok(s.buildings.includes(ruin),'nothing changes without the materials');}
  for(const [r,amount] of Object.entries(d.cost))s.inventory.add(r,amount);const before={...Object.fromEntries(Object.keys(d.cost).map(r=>[r,s.inventory.count(r)]))};
  const result=rebuildRuin(s,ruin);assert.ifError(result.error);assert.equal(s.buildings.includes(ruin),false);assert.equal(result.building.type,'house');assert.deepEqual({x:result.building.x,y:result.building.y},{x:60,y:60});
  assert.ok(result.building.construction&&result.building.construction.state!=='complete','a building site, Builders build it');
  assert.ok(rebuildRuin(s,result.building).error,'only ruins');
});
