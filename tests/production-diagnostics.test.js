import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { DIAGNOSTICS } from '../src/data/diagnostics.js';

globalThis.document??={querySelector:()=>({textContent:''})};

function scene(){const s=workerScene(undefined,{construction:true,foodProduction:true});s.diagnostics=new ProductionDiagnostics(s);s.log=[];s.activities.on(e=>{if(e.type==='productionIssue')s.log.push(e);});return s;}
function building(s,type,x,y,{blueprint=false}={}){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const[id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);if(blueprint)s.constructionSystem.plan(r.building);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;}
function employ(s,home,profession,x=53){const w=s.workerSystem.create({x,y:44});if(home)assert.equal(s.workplaceSystem.assign(home,w),true);else s.workerSystem.jobs.assign(w,profession);return w;}
// Advance game time only through the diagnostics' own clock, without simulating the whole kingdom.
const advance=(s,ms)=>{for(let t=0;t<ms;t+=DIAGNOSTICS.checkInterval){s.gameTime.totalElapsed+=DIAGNOSTICS.checkInterval;s.diagnostics.update();}};
const reasons=s=>s.diagnostics.active().map(i=>i.reason);

test('a supplied site with no Builder is reported after it lasts, repeated at most every 30 s, gone once a Builder exists',()=>{
  const s=scene(),site=building(s,'tower',60,50,{blueprint:true});assert.equal(s.constructionSystem.materials.ready(site),true);
  advance(s,DIAGNOSTICS.persistence-DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),[],'not before it has lasted');
  advance(s,DIAGNOSTICS.checkInterval*2);assert.deepEqual(reasons(s),['noBuilder']);assert.equal(s.log.length,1);
  advance(s,DIAGNOSTICS.reminder-DIAGNOSTICS.checkInterval*2);assert.equal(s.log.length,1,'no repeat within 30 s');
  advance(s,DIAGNOSTICS.checkInterval*2);assert.equal(s.log.length,2,'one reminder after 30 s');
  s.diagnostics.dismiss(s.diagnostics.active()[0].key);assert.deepEqual(reasons(s),[],'dismissed until the next reminder');
  employ(s,null,'builder');advance(s,DIAGNOSTICS.checkInterval);assert.equal(s.diagnostics.issues.size,0,'resolved');
  advance(s,DIAGNOSTICS.reminder*2);assert.equal(s.log.length,2,'nothing more once resolved');
});

test('a problem solved before it lasts is never reported',()=>{
  const s=scene();building(s,'tower',60,50,{blueprint:true});advance(s,DIAGNOSTICS.persistence/2);employ(s,null,'builder');advance(s,DIAGNOSTICS.persistence*3);assert.equal(s.log.length,0);
});

test('a Mill without Wheat names the nearest real cause; paused, unstaffed or stocked mills raise nothing',()=>{
  const s=scene(),mill=building(s,'mill',54,45);employ(s,mill,'miller');
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.deepEqual(s.diagnostics.active().map(i=>[i.reason,i.params.producer]),[['noProducer','farmhouse']]);
  const farmhouse=building(s,'farmhouse',40,45);advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),['noField']);
  building(s,'wheat_field',40,52);advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),['noProducerWorkers']);
  employ(s,farmhouse,'farmer',42);advance(s,DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),[],'farmers at work: waiting for the harvest is not a problem');
  // Wheat already in storage but nobody to carry it: that, not the farm, is the cause.
  s.foodProduction.records.get(mill.id).auto=true;const granary=building(s,'granary',48,52);s.foodStorage.locations.get(`granary-${granary.id}`).stock.wheat=8;
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),['noHauler']);
  employ(s,null,'hauler',44);advance(s,DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),[]);
  s.foodStorage.locations.get(`granary-${granary.id}`).stock.wheat=0;s.foodProduction.records.get(mill.id).auto=false;advance(s,DIAGNOSTICS.persistence*2);assert.deepEqual(reasons(s),[],'switched off on purpose');
  const empty=building(s,'mill',60,45);advance(s,DIAGNOSTICS.persistence*2);assert.equal(s.diagnostics.active().some(i=>i.entityId===empty.id),false,'an unstaffed mill is not told to produce');
});

test('two identical buildings keep separate issues; 120 buildings are checked cheaply',()=>{
  const s=scene();for(let i=0;i<2;i++)building(s,'tower',60+i*4,50,{blueprint:true});advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
  assert.equal(new Set(s.diagnostics.active().map(i=>i.key)).size,2);
  for(let i=0;i<118;i++)building(s,'wall',5+(i%40)*2,5+Math.floor(i/40)*2,{blueprint:true});
  const started=performance.now();advance(s,DIAGNOSTICS.checkInterval*50);const perCheck=(performance.now()-started)/50;
  assert.ok(perCheck<20,`one check of 120 sites took ${perCheck.toFixed(2)} ms`);
});


test('C05 commanded Builders, Haulers and Farmers are not counted as working sources until Resume',()=>{
 const s=scene(),site=building(s,'tower',60,50,{blueprint:true}),builder=employ(s,null,'builder');s.workerSystem.commands.hold(builder);advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.ok(reasons(s).includes('noBuilder'));
 s.workerSystem.commands.resume(builder);advance(s,DIAGNOSTICS.checkInterval);assert.ok(!reasons(s).includes('noBuilder'));
 const mill=building(s,'mill',54,45);employ(s,mill,'miller');const granary=building(s,'granary',48,52);s.foodStorage.locations.get(`granary-${granary.id}`).stock.wheat=8;const hauler=employ(s,null,'hauler',44);s.workerSystem.commands.hold(hauler);
 advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.ok(reasons(s).includes('noHauler'));s.workerSystem.commands.resume(hauler);advance(s,DIAGNOSTICS.checkInterval);assert.ok(!reasons(s).includes('noHauler'));
 s.foodStorage.locations.get(`granary-${granary.id}`).stock.wheat=0;const farm=building(s,'farmhouse',40,45);building(s,'wheat_field',40,52);const farmer=employ(s,farm,'farmer',42);s.workerSystem.commands.hold(farmer);advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.ok(reasons(s).includes('noProducerWorkers'));s.workerSystem.commands.resume(farmer);advance(s,DIAGNOSTICS.checkInterval);assert.ok(!reasons(s).includes('noProducerWorkers'));
 const miller=s.workplaceSystem.employees(mill)[0];s.workerSystem.commands.hold(farmer);s.workerSystem.commands.hold(miller);advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.ok(!s.diagnostics.active().some(i=>i.entityId===mill.id),'a deliberately held production crew raises no production alarm');
});

test('completion advice is immediate despite stock and no staff, deduplicated across workers/buildings and never reminded',()=>{
 const s=scene(),mill=building(s,'mill',54,45);s.foodStorage.locations.get(`input-${mill.id}`).stock.wheat=20;
 s.activities.emit('buildingCompleted',{objectIds:[mill.id]});assert.deepEqual(reasons(s),['missingChainSource']);assert.equal(s.log.length,1);assert.equal(s.log[0].informational,true);
 s.activities.emit('buildingCompleted',{objectIds:[mill.id]});const other=building(s,'mill',60,45);s.activities.emit('buildingCompleted',{objectIds:[other.id]});advance(s,DIAGNOSTICS.reminder*3);assert.equal(s.log.length,1);assert.equal(s.diagnostics.active().length,1);
 s.diagnostics.dismiss(s.diagnostics.active()[0].key);advance(s,DIAGNOSTICS.reminder*3);assert.deepEqual(reasons(s),[]);assert.equal(s.log.length,1);
 building(s,'wheat_field',40,52);advance(s,DIAGNOSTICS.checkInterval);assert.equal(s.diagnostics.completionNotices.size,0);
});
test('Bakery requires a completed Mill; existing predecessors and reloaded buildings do not replay completion advice',()=>{
 const s=scene(),bakery=building(s,'bakery',54,45);s.activities.emit('buildingCompleted',{objectIds:[bakery.id]});assert.deepEqual(s.diagnostics.active()[0].params,{producer:'mill'});
 const mill=building(s,'mill',60,45,{blueprint:true});advance(s,DIAGNOSTICS.checkInterval);assert.equal(reasons(s).length,1);
 mill.construction.state='complete';s.constructionSystem.sites.delete(mill.id);s.activities.emit('buildingCompleted',{objectIds:[mill.id]});assert.equal(s.diagnostics.active().some(i=>i.params.producer==='mill'),false);
 const next=building(s,'bakery',54,52);s.activities.emit('buildingCompleted',{objectIds:[next.id]});assert.equal(s.log.filter(i=>i.params.producer==='mill').length,1);
 s.diagnostics.destroy();s.diagnostics=new ProductionDiagnostics(s);advance(s,DIAGNOSTICS.reminder*2);assert.deepEqual(reasons(s),[],'loading existing complete buildings emits no completion event');
});
test('C04 actual blockers take precedence over structural advice without duplicating the panel row',()=>{
 const s=scene(),mill=building(s,'mill',54,45);s.activities.emit('buildingCompleted',{objectIds:[mill.id]});employ(s,mill,'miller');advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
 assert.equal(s.diagnostics.active().length,1);assert.equal(s.diagnostics.active()[0].reason,'noProducer');s.foodProduction.records.get(mill.id).auto=false;advance(s,DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),['missingChainSource']);
});
