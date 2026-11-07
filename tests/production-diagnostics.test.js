import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { DIAGNOSTICS } from '../src/data/diagnostics.js';

globalThis.document??={querySelector:()=>({textContent:''})};

function scene(){const s=workerScene(undefined,{construction:true,foodProduction:true});s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.foodIssues=()=>[];/* no food stores here; the food notice has its own test */s.log=[];s.activities.on(e=>{if(e.type==='productionIssue')s.log.push(e);});return s;}
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

test('two waiting sites without a Builder make one kingdom notice that counts them; 120 buildings are checked cheaply',()=>{
  const s=scene();for(let i=0;i<2;i++)building(s,'tower',60+i*4,50,{blueprint:true});advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
  assert.equal(s.diagnostics.active().length,1);assert.equal(s.diagnostics.active()[0].params.count,2);
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
 const mill=building(s,'mill',60,45,{blueprint:true});advance(s,DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),[],'a planned Mill is enough – no advice to build one');
 mill.construction.state='complete';s.constructionSystem.sites.delete(mill.id);s.activities.emit('buildingCompleted',{objectIds:[mill.id]});assert.equal(s.diagnostics.active().some(i=>i.params.producer==='mill'),false);
 const next=building(s,'bakery',54,52);s.activities.emit('buildingCompleted',{objectIds:[next.id]});assert.equal(s.log.filter(i=>i.params.producer==='mill').length,1);
 s.diagnostics.destroy();s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.foodIssues=()=>[];advance(s,DIAGNOSTICS.reminder*2);assert.deepEqual(reasons(s),[],'loading existing complete buildings emits no completion event');
});
test('C04 actual blockers take precedence over structural advice without duplicating the panel row',()=>{
 const s=scene(),mill=building(s,'mill',54,45);s.activities.emit('buildingCompleted',{objectIds:[mill.id]});employ(s,mill,'miller');advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
 assert.equal(s.diagnostics.active().length,1);assert.equal(s.diagnostics.active()[0].reason,'noProducer');s.foodProduction.records.get(mill.id).auto=false;advance(s,DIAGNOSTICS.checkInterval);assert.deepEqual(reasons(s),['missingChainSource']);
});

test('no Builder: one kingdom notice even before any materials arrive, gone with a Builder, back when all Builders strike; a click opens Employments',()=>{
  const s=scene();const site=building(s,'tower',60,50,{blueprint:true});building(s,'tower',64,50,{blueprint:true});
  // Physical delivery: nobody has brought the materials yet (no Haulers, no Builders).
  s.constructionSystem.materials.ready=()=>false;assert.equal(s.constructionSystem.materials.ready(site),false);
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);const notices=s.diagnostics.active().filter(i=>i.reason==='noBuilder');
  assert.equal(notices.length,1,'one notice for the kingdom');assert.equal(notices[0].params.count,2);
  const builder=employ(s,null,'builder');advance(s,DIAGNOSTICS.checkInterval);assert.ok(!reasons(s).includes('noBuilder'),'a Builder is available');
  s.needs.records.set(builder.id,{...(s.needs.records.get(builder.id)??{food:100,rest:100}),strike:true});advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);assert.ok(reasons(s).includes('noBuilder'),'every Builder strikes');
  s.needs.records.get(builder.id).strike=false;advance(s,DIAGNOSTICS.checkInterval);assert.ok(!reasons(s).includes('noBuilder'));
});

// Owner points 14–15 on a small hand-made kingdom (only what the checks read).
function mini({buildings=[],trees=[],locations=[],workers=[],registry}={}){
  const feed=[],byId=new Map(trees.map((t,i)=>[`tree-${i}`,{x:t.x,y:t.y,definition:{tree:{}},natural:{stage:t.stage??3}}]));
  const st={physicalMaterials:true,locations:new Map(locations.map(l=>[l.id,{stock:{},allowed:[],capacity:0,...l}])),isStock:l=>l.kind==='storage'||l.kind==='fallback',
    used:l=>Object.values(l.stock).reduce((n,v)=>n+v,0),room(id){const l=this.locations.get(id);return Math.max(0,l.capacity-this.used(l));}};
  const s={buildings,naturalResources:{byId},foodStorage:st,gameTime:{totalElapsed:0,paused:false},eventFeed:{push:(key,text)=>{feed.push({key,text});return true;}},
    workerSystem:{liveSubjects:()=>workers},objectRegistry:registry,activities:null,needs:null};
  s.diagnostics=new ProductionDiagnostics(s);s.feed=feed;return s;
}
test('a quarry or mine with its deposit used up and a lumberjack hut with no trees left get one notice each (feed once), gone when it comes back',()=>{
  const objectRegistry=null;
  const quarry={id:1,type:'quarry',x:10,y:10,quarryMode:'finite',depositId:'d1'},hut={id:2,type:'lumberjack_hut',x:40,y:40},legacy={id:3,type:'quarry',x:60,y:60,quarryMode:'legacy'};
  const s=mini({buildings:[quarry,hut,legacy],trees:[{x:80,y:80}],registry:objectRegistry});s.naturalResources.byId.set('d1',{natural:{remaining:0}});
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
  const depleted=s.diagnostics.active().filter(i=>i.reason==='depleted').map(i=>[i.entityId,i.params.resource]);assert.deepEqual(depleted.sort(),[[1,'stone'],[2,'wood']]);
  assert.equal(s.feed.length,2,'one feed line each');advance(s,DIAGNOSTICS.reminder*3);assert.equal(s.feed.length,2,'no spam');
  assert.match(s.feed.map(f=>f.text).join(' | '),/Quarry has run out of stone/i);assert.equal(s.diagnostics.buildingIssue(1).reason,'depleted');
  s.naturalResources.byId.get('d1').natural.remaining=5;s.naturalResources.byId.set('young',{x:41,y:41,definition:{tree:{}},natural:{stage:0}});advance(s,DIAGNOSTICS.checkInterval);
  assert.equal(s.diagnostics.active().filter(i=>i.reason==='depleted').length,0,'gone: stone again, a young tree will grow');
});

test('storage full: one notice naming the goods and the store to build; the stuck building gets its own line; gone once there is room',()=>{
  const registry={get:id=>({wood:{name:'Wood'},sword:{name:'Sword'},warehouse:{name:'Warehouse'},armory:{name:'Armory'}})[id]??null,
    buildables:()=>[{id:'warehouse',storage:{accepts:'materials'}},{id:'armory',storage:{accepts:'equipment'}}],require:id=>({id})};
  const s=mini({registry,buildings:[{id:5,type:'lumberjack_hut',x:40,y:40},{id:6,type:'swordsmith',x:50,y:50}],trees:[{x:41,y:41}],
    locations:[{id:'stock-1',kind:'storage',allowed:['wood','stone'],capacity:10,stock:{wood:10}},{id:'stock-2',kind:'storage',allowed:['sword'],capacity:4,stock:{sword:4}},{id:'output-6',kind:'output',buildingId:6,allowed:['sword'],capacity:2,stock:{sword:2}}],
    workers:[{id:'w1',assignedWorkplaceId:5,workMessage:'Waiting for reachable timber storage capacity',cargo:null}]});
  s.diagnostics.storageHelper=resource=>({wood:'warehouse',sword:'armory'})[resource];
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
  const full=s.diagnostics.active().find(i=>i.reason==='storageFull');assert.deepEqual(full.params.groups,[{helper:'armory',resources:['sword']},{helper:'warehouse',resources:['wood']}]);
  assert.deepEqual(s.diagnostics.active().filter(i=>i.reason==='outputFull').map(i=>i.entityId).sort(),[5,6]);
  assert.equal(s.feed.filter(f=>f.key.includes('storageFull')).length,1);
  s.foodStorage.locations.get('stock-1').capacity=50;s.foodStorage.locations.get('stock-2').capacity=50;advance(s,DIAGNOSTICS.checkInterval);
  assert.equal(s.diagnostics.active().length,0,'room again: all gone');
});

test('E1: a site whose booked materials sit in a store gets a waiting-for-material notice; Builders then carry them although a Hauler is free',async()=>{
  const {hireUnemployed}=await import('../src/ui/jobChange.js');
  const s=workerScene(undefined,{construction:true,logistics:true});s.diagnostics=new ProductionDiagnostics(s);
  const d=s.objectRegistry.require('tower');ensureBuildingPrerequisites(s,d);Object.entries(d.cost).forEach(([r,n])=>s.inventory.add(r,n));
  const r=placeBuilding({map:s.map,anchor:{x:56,y:44},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(r.error);s.constructionSystem.plan(r.building);
  const site=r.building;assert.equal(s.constructionSystem.materials.ready(site),false);assert.equal(s.diagnostics.materialsInStock(site),true,'the booked stone is still in the starter stockpile');
  s.diagnostics.constructionIssues();assert.equal(typeof site.materialWaitSince,'number');
  s.gameTime.totalElapsed+=DIAGNOSTICS.materialWait;assert.ok(s.diagnostics.constructionIssues().some(i=>i.reason==='waitingMaterial'&&i.entityId===site.id));
  // Hire from the notice: the unemployed resident with the best skill.
  const a=s.workerSystem.create({x:50,y:44}),b=s.workerSystem.create({x:51,y:44});b.skills.construction.level=4;
  assert.equal(hireUnemployed(s,'builder'),b);assert.equal(b.profession,'builder');assert.equal(hireUnemployed(s,'hauler'),a);assert.equal(hireUnemployed(s,'hauler'),null,'nobody left');
  // The Hauler is free, yet the Builder of a stuck site fetches the stone.
  b.aiCooldown=0;s.constructionSystem.builderAI.carryMaterials(b);assert.ok(b.workTask||b.cargo||b.workMessage!=='Waiting for construction','the Builder took a delivery');
});
