// m-drevorubci-stromy (playtest 0.83.0 #1): a Lumberjack Hut with nothing to fell says so in Notices, automatic
// employment does not fill it, surplus Woodcutters leave after a day, felled trees get saplings, young trees near a hut
// grow faster, the first Granary and Lumberjack Hut are built first, the hut window shows young trees and when the
// next one is mature, and the Dev tool has a saved "Forest and wood" group.
import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { treeState,FORESTRY } from '../src/data/naturalResources.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { EmploymentSystem } from '../src/systems/EmploymentSystem.js';
import { DIAGNOSTICS } from '../src/data/diagnostics.js';
import { CONSTRUCTION_RULES } from '../src/data/construction.js';
import { noticeText } from '../src/ui/noticeText.js';
import { setLanguage } from '../src/i18n/index.js';
import { DEV_FOREST_KEYS,DEV_BALANCE_KEYS,devDefault,devRange,loadDevBalance,setDevFactor,devFactor,resetDevBalance,devBalanceChanged,exportDevBalance,importDevBalance,validDevBalanceState,devTreeWood,devChopDuration } from '../src/data/devBalance.js';
import { forestOverview } from '../src/systems/DevTools.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { carryCapacity } from '../src/data/logistics.js';

globalThis.document??={querySelector:()=>({textContent:''})};
const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const fresh=()=>loadDevBalance(memory());
function fixture(options={}){
  const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,...options});s.workerSystem.unsubscribe();s.events=new EventEmitter();
  s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.foodIssues=()=>[];return s;
}
function hut(s,anchor={x:44,y:43}){const d=s.objectRegistry.require('lumberjack_hut');s.inventory.add('wood',6);const r=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));return r.building;}
function tree(s,tile,stage=3,growthDays=0){const n=treeState(`tree-${s.naturalResources.nextId++}`,{stage,growthDays});n.ageCheckpoint=s.naturalResources.ageClock;n.growthCheckpoint=s.naturalResources.growthClock;s.addResource(s.objectRegistry.require('oak_tree'),tile,n);return s.naturalResources.byId.get(n.id);}
function until(s,condition,limit=65000){for(let elapsed=0;elapsed<limit&&!condition();elapsed+=50)s.tick(50);assert.ok(condition(),'the action did not finish');}
const advance=(s,ms)=>{for(let t=0;t<ms;t+=DIAGNOSTICS.checkInterval){s.gameTime.totalElapsed+=DIAGNOSTICS.checkInterval;s.diagnostics.update();}};

test('1: a hut with no mature tree on the known map gets one notice (once), with the hut as its camera target; a mature tree ends it',()=>{
  fresh();const s=fixture(),b=hut(s);const young=tree(s,{x:49,y:45},2,0);
  advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);
  let rows=s.diagnostics.active().filter(i=>i.reason==='noMatureTrees');assert.equal(rows.length,1);assert.equal(rows[0].entityId,b.id);assert.equal(rows[0].category,'production');
  setLanguage('cs',{persist:false});assert.equal(noticeText(s,rows[0]),'Dřevorubecká chata nemá co kácet – na známé mapě nejsou vzrostlé stromy.');
  setLanguage('en',{persist:false});assert.equal(noticeText(s,rows[0]),'The Lumberjack Hut has nothing to fell – there are no mature trees on the known map.');
  advance(s,s.gameTime.dayDuration*2);assert.equal(s.diagnostics.active().filter(i=>i.reason==='noMatureTrees').length,1,'one row, not repeated');assert.equal(s.diagnostics.active().find(i=>i.reason==='noMatureTrees').count,1);
  young.natural.stage=3;advance(s,DIAGNOSTICS.checkInterval);assert.equal(s.diagnostics.active().filter(i=>i.reason==='noMatureTrees').length,0,'gone once a tree in range is mature');
});

test('2: automatic employment sends nobody to a hut with nothing to fell and no more Woodcutters than mature trees',()=>{
  fresh();const s=fixture();s.employment=new EmploymentSystem(s);const b=hut(s);
  const people=[0,1,2].map(i=>s.workerSystem.create({x:40+i,y:50}));s.employment.request();s.employment.update();
  assert.equal(s.workplaceSystem.employees(b).length,0,'no tree to fell: the hut takes nobody');
  tree(s,{x:49,y:45});s.employment.request();s.employment.update();assert.equal(s.workplaceSystem.employees(b).length,1,'one mature tree, one Woodcutter');
  // tabulka-budov-1 (owner table 9 Nov 2026): a Lumberjack Hut has a single seat, however many trees stand around it.
  tree(s,{x:49,y:42});tree(s,{x:47,y:48});tree(s,{x:50,y:48});s.employment.request();s.employment.update();assert.equal(s.workplaceSystem.employees(b).length,1,'the seat limit is 1');
  assert.equal(people.filter(w=>w.profession==='woodcutter').length,1);
});

test('2: a Woodcutter without a tree to fell leaves after about a game day (a held mature tree keeps him); off = nobody moves',()=>{
  // tabulka-budov-1: with one seat a hut keeps its Woodcutter while one mature tree stands in range, even one taken by the King.
  fresh();const s=fixture();s.employment=new EmploymentSystem(s);const b=hut(s),held=tree(s,{x:49,y:45});
  s.workerSystem.reservations.reserve(s.naturalResources.reservation(held),'king');
  const w=s.workerSystem.create({x:40,y:50});assert.equal(s.workplaceSystem.assign(b,w),true);
  const run=(sc,ms)=>{for(let t=0;t<ms;t+=250){sc.tick(250);sc.employment.update();}},day=s.gameTime.dayDuration;
  run(s,day*1.5);assert.equal(s.workplaceSystem.employees(b).length,1,'the one mature tree (held by the King) still counts');
  const bare=fixture();bare.employment=new EmploymentSystem(bare);const bb=hut(bare),bw=bare.workerSystem.create({x:40,y:50});assert.equal(bare.workplaceSystem.assign(bb,bw),true);
  run(bare,day*.5);assert.equal(bare.workplaceSystem.employees(bb).length,1,'not within half a day');assert.equal(bw.workState,'Waiting');
  run(bare,day*.7);assert.equal(bare.workplaceSystem.employees(bb).length,0,'the surplus Woodcutter left');assert.equal(bw.profession,'idle','free for other work');
  run(bare,day*2);assert.equal(bare.workplaceSystem.employees(bb).length,0,'automatic employment does not send him back');
  const off=fixture();off.employment=new EmploymentSystem(off,{enabled:false});const ob=hut(off),ow=off.workerSystem.create({x:40,y:50});off.workplaceSystem.assign(ob,ow);
  for(let t=0;t<day*1.5;t+=250){off.tick(250);off.employment.update();}assert.equal(ow.assignedWorkplaceId,ob.id,'automatic employment off: nobody is moved');
});

test('3: a Woodcutter plants a sapling with the Dev chance (never the King, never on a marked tree); young trees in a hut radius grow ×1.5',()=>{
  try{
    fresh();setDevFactor('saplingChance',1);let s=fixture();const b=hut(s),t=tree(s,{x:49,y:45}),w=s.workerSystem.create({x:42,y:46});s.workplaceSystem.assign(b,w);
    until(s,()=>t.natural.cycle===1);assert.equal(t.natural.stage,1,'planted: a sapling at once');assert.equal(s.map[45][49],0,'a sapling does not block');
    s=fixture();const k=tree(s,{x:46,y:40});s.naturalResources.beginKingChop(k);until(s,()=>k.natural.cycle===1);assert.equal(k.natural.stage,0,'the King leaves a stump');
    s=fixture();const b2=hut(s),m=tree(s,{x:49,y:45}),w2=s.workerSystem.create({x:42,y:46});s.naturalResources.miningWork.rocks.trees.set(m.natural.id,{id:m.natural.id});s.workplaceSystem.assign(b2,w2);until(s,()=>m.natural.cycle===1);assert.equal(m.natural.stage,0,'a tree marked for removal gets no sapling');
    setDevFactor('saplingChance',0);s=fixture();const b3=hut(s),n=tree(s,{x:49,y:45}),w3=s.workerSystem.create({x:42,y:46});s.workplaceSystem.assign(b3,w3);until(s,()=>n.natural.cycle===1);assert.equal(n.natural.stage,0,'chance 0: a stump');
    // Growth: the same stump inside and outside the radius (18 tiles).
    fresh();s=fixture();hut(s);const near=tree(s,{x:50,y:44},0),far=tree(s,{x:80,y:80},0),d=s.gameTime.dayDuration;
    s.gameTime.update(d/1.5+10);s.naturalResources.flushGrowth();assert.equal(near.natural.stage,1,'near the hut: 1 day of growth in 2/3 of a day');assert.equal(far.natural.stage,0);
    setDevFactor('hutGrowthBoost',1);setDevFactor('forestGrowth',2);s=fixture();const plain=tree(s,{x:80,y:80},0);s.gameTime.update(d/2+10);s.naturalResources.flushGrowth();assert.equal(plain.natural.stage,1,'forest growth ×2');
    assert.equal(FORESTRY.saplingChance,.5);assert.equal(FORESTRY.hutGrowthBoost,1.5);
  }finally{fresh();}
});

test('4: the first Granary, then the first Lumberjack Hut, are built and supplied before a nearer site',()=>{
  fresh();const s=fixture(),place=(type,anchor)=>{const d=s.objectRegistry.require(type);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true});assert.ifError(r.error);s.constructionSystem.plan(r.building);return r.building;};
  const lodge=place('hunting_lodge',{x:44,y:44}),far=place('lumberjack_hut',{x:62,y:56}),second=place('lumberjack_hut',{x:66,y:40});
  const c=s.constructionSystem;assert.deepEqual(CONSTRUCTION_RULES.firstPriority,['granary','lumberjack_hut']);
  assert.equal(c.priorityRank(far),1);assert.equal(c.priorityRank(second),2,'only the first hut');assert.equal(c.priorityRank(lodge),2);
  assert.ok(c.materials.priority(far.id)<c.materials.priority(lodge.id),'its materials are carried first');
  for(const site of [lodge,far,second]){const loc=s.foodStorage.locations.get(`site-${site.id}`)??c.materials.location(site);Object.assign(loc.stock,site.materialSupply.required);}
  const builder=s.workerSystem.create({x:43,y:47});s.workerSystem.jobs.assign(builder,'builder');s.simulate(2000);
  assert.equal(builder.workTask?.targetId,far.id,'the Builder walks past the nearer Hunting Lodge to the first Lumberjack Hut');
  until(s,()=>far.construction.state==='complete',120000);assert.equal(c.priorityRank(second),2,'a finished hut: no more priority');
  const granary=place('granary',{x:50,y:60});assert.equal(c.priorityRank(granary),0,'the Granary first');
});

test('5: the hut window counts young trees and says when the next one is mature (seasons, hut boost, Dev growth)',()=>{
  try{
    fresh();const s=fixture(),b=hut(s);tree(s,{x:49,y:45},3);tree(s,{x:50,y:46},1,0);tree(s,{x:51,y:47},2,2);tree(s,{x:52,y:40},0);tree(s,{x:80,y:80},2,3.9);
    let sum=s.naturalResources.forestry.summary(b);assert.equal(sum.trees,1);assert.equal(sum.young,2,'the sapling and the young tree (not the stump, not outside the radius)');
    assert.ok(Math.abs(sum.nextDays-2/1.5)<.11,`young tree: 2 of 4 days left at ×1.5 (${sum.nextDays})`);
    setDevFactor('forestGrowth',2);sum=s.naturalResources.forestry.summary(b);assert.ok(Math.abs(sum.nextDays-2/3)<.11,'forest growth ×2 halves it');
    fresh();const e=fixture(),h=hut(e);assert.equal(e.naturalResources.forestry.summary(h).nextDays,null,'nothing grows');
    // Winter: growth waits for spring.
    const w=fixture({seasons:true}),wh=hut(w);w.gameTime.update(w.gameTime.dayDuration*15);assert.equal(w.seasons.season,'Winter');tree(w,{x:49,y:45},2,3.9);
    const days=w.naturalResources.forestry.summary(wh).nextDays;assert.ok(days>4&&days<6.2,`waits for spring (${days})`);
  }finally{fresh();}
});

test('6: Dev tool "Forest and wood": ranges, defaults, chop time, wood per tree, radius; saved only when changed and validated',()=>{
  try{
    fresh();assert.deepEqual(DEV_FOREST_KEYS,['forestGrowth','saplingChance','hutGrowthBoost','woodRadius','chopTime','woodYield']);assert.ok(DEV_FOREST_KEYS.every(k=>DEV_BALANCE_KEYS.includes(k)));
    assert.deepEqual([devRange('forestGrowth'),devRange('saplingChance'),devRange('hutGrowthBoost'),devRange('woodRadius'),devRange('chopTime'),devRange('woodYield')].map(r=>[r.min,r.max]),[[.25,4],[0,1],[1,3],[.5,2],[.25,4],[.5,3]]);
    assert.equal(devFactor('saplingChance'),.5);assert.equal(devFactor('hutGrowthBoost'),1.5);assert.equal(devBalanceChanged(),false);assert.equal(exportDevBalance(),null,'defaults are not saved');
    assert.equal(setDevFactor('saplingChance',2),1);assert.equal(setDevFactor('saplingChance',-1),0);assert.equal(setDevFactor('hutGrowthBoost',.5),1);assert.equal(setDevFactor('woodRadius',3),2);assert.equal(setDevFactor('woodYield',5),3);
    assert.equal(devBalanceChanged(),true);resetDevBalance();assert.ok(DEV_FOREST_KEYS.every(k=>devFactor(k)===devDefault(k)));
    const rule=FORESTRY.trees.oak_tree;setDevFactor('chopTime',.5);setDevFactor('woodYield',2);assert.equal(devChopDuration(rule),3500);assert.equal(devTreeWood(rule),12);setDevFactor('woodYield',.5);assert.equal(devTreeWood(rule),3);
    const s=fixture(),b=hut(s);const far=tree(s,{x:44+25,y:44});assert.equal(s.naturalResources.forestry.inRadius(b,far),false,'25 tiles: outside 18');assert.equal(s.naturalResources.forestry.eligible(b).length,1,'m-drevorubec-dosah: felled all the same');setDevFactor('woodRadius',1.5);assert.equal(s.naturalResources.forestry.inRadius(b,far),true,'×1.5 = 27 tiles');
    // A real felling at ×2 wood and ×0.5 time.
    resetDevBalance();setDevFactor('woodYield',2);setDevFactor('chopTime',.5);const r=fixture(),rb=hut(r),rt=tree(r,{x:49,y:45}),w=r.workerSystem.create({x:42,y:46});r.workplaceSystem.assign(rb,w);
    until(r,()=>rt.natural.workDone>0);const start=r.gameTime.totalElapsed;until(r,()=>rt.natural.cycle===1);assert.ok(r.gameTime.totalElapsed-start<=3600,'chopped in ~3.5 s');
    assert.equal([...r.dropSystem.drops.values()].find(d=>d.resource==='wood').amount,12);assert.equal(w.workTask?.amount??8,Math.min(12,carryCapacity(w,'wood')),'he carries one load (8), the rest stays for the Haulers');
    // Save: only changed keys, strict ranges; a felling task with the save's own wood amount validates.
    const saved=validateGameState(serializeGameState(r));assert.deepEqual(saved.devBalance,{chopTime:.5,woodYield:2});
    for(const bad of [{saplingChance:1.2},{hutGrowthBoost:.5},{woodRadius:.25},{woodYield:3.5},{saplingChance:.33}])assert.equal(validDevBalanceState(bad),false,JSON.stringify(bad));
    assert.equal(validDevBalanceState({saplingChance:0}),true);assert.equal(validDevBalanceState({saplingChance:.5}),true,'the default itself is a valid value');
    resetDevBalance();loadGameState(r,saved);assert.equal(devFactor('woodYield'),2);assert.equal(devFactor('chopTime'),.5);assert.deepEqual(serializeGameState(r).devBalance,{chopTime:.5,woodYield:2});
    // Forest growth ×4 and chopping ×4 over two days: the save still validates (growth clock and partial chopping bounds).
    resetDevBalance();setDevFactor('forestGrowth',4);setDevFactor('chopTime',4);const g=fixture({seasons:true}),gt=tree(g,{x:46,y:40});g.naturalResources.beginKingChop(gt);g.simulate(2000);until(g,()=>gt.natural.workDone>8000,40000);g.gameTime.update(g.gameTime.dayDuration*2);
    assert.ok(g.naturalResources.growthClock>g.naturalResources.ageClock*1.25);assert.doesNotThrow(()=>validateGameState(serializeGameState(g)));
    importDevBalance({saplingChance:0});assert.equal(devFactor('saplingChance'),0);assert.equal(devFactor('hutGrowthBoost'),1.5,'others at their defaults');
  }finally{fresh();}
});

test('6: the economy overview counts mature and young trees in hut radii (each once) and Wood a day',()=>{
  fresh();const s=fixture(),a=hut(s),b=hut(s,{x:50,y:43});tree(s,{x:49,y:47},3);tree(s,{x:47,y:48},1);tree(s,{x:46,y:49},2);tree(s,{x:45,y:40},0);tree(s,{x:90,y:90},3);
  s.resourceLedger={history:[{day:1,totals:{wood:{income:12,expenses:0}}},{day:2,totals:{wood:{income:18,expenses:3}}}]};
  assert.deepEqual(forestOverview(s),{huts:2,mature:1,young:2,woodPerDay:15});void a;void b;void gameSettings;
});

test('m-drevorubec-dosah: a Woodcutter fells a tree 40 tiles from the hut and brings the wood; an unexplored far tree is left alone; a far forest is told',()=>{
  fresh();const s=fixture(),b=hut(s),far=tree(s,{x:44+40,y:46});
  assert.equal(s.naturalResources.forestry.inRadius(b,far),false);assert.equal(Math.round(s.naturalResources.forestry.nearestDistance(b)),40);
  const w=s.workerSystem.create({x:46,y:46});assert.equal(s.workplaceSystem.assign(b,w),true);
  until(s,()=>w.workTask?.kind==='chopTree',60000);until(s,()=>far.natural.stage===0,600000);
  // The notice for a far forest.
  const t2=tree(s,{x:44+45,y:50});advance(s,DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval);const row=s.diagnostics.active().find(i=>i.reason==='treesFar');assert.ok(row);assert.equal(row.entityId,b.id);
  setLanguage('en',{persist:false});assert.match(noticeText(s,row),/far from the forest \(4\d tiles\)/);
  // Unexplored ground beyond the radius does not count.
  s.fog.setEnabled(true);s.gameTime.totalElapsed+=5000;assert.equal(s.naturalResources.forestry.eligible(b).includes(t2),false);
});
