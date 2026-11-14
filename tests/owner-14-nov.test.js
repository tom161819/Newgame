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

test('m-uzavreny-hrad: ground inside closed walls is found; a gap opens it; Burnt Ruins inside lower the Attractiveness', async () => {
  const { enclosure,ruinsPenalty,ENCLOSURE }=await import('../src/game/enclosure.js');const { KingdomAttractivenessSystem }=await import('../src/systems/KingdomAttractivenessSystem.js');
  const map=Array.from({length:30},()=>Array(30).fill(0)),buildings=[];let id=1;
  const put=(type,x,y,w=1,h=1)=>{const tiles=[];for(let j=0;j<h;j++)for(let i=0;i<w;i++)tiles.push({x:x+i,y:y+j});const b={id:id++,type,x,y,tiles,definition:{id:type,width:w,height:h,navigation:type==='wall'?{walkableTop:true}:undefined}};buildings.push(b);return b;};
  for(let x=10;x<=18;x++){put('wall',x,10);put('wall',x,18);}for(let y=11;y<=17;y++)put('wall',10,y);for(let y=11;y<=16;y++)put('wall',18,y);
  const scene={map,buildings};assert.equal(enclosure(scene).any,false,'one piece is missing: open');assert.equal(enclosure(scene).inside(14,14),false);
  put('wall',18,17);const e=enclosure(scene);assert.equal(e.any,true);assert.equal(e.inside(14.5,14.5),true);assert.equal(e.inside(5,5),false);assert.equal(e.inside(10,10),false,'the wall itself is not inside');
  const house=put('house',12,12,2,2),outside=put('house',2,2,2,2);assert.equal(e.holds(house),true);assert.equal(e.holds(outside),false);
  put('burnt_ruins',14,14,2,2);put('burnt_ruins',3,20,2,2);assert.equal(ruinsPenalty(scene),ENCLOSURE.ruins.each,'only the ruins inside the walls count');
  const a=new KingdomAttractivenessSystem({...scene,foodSystem:{shortage:false}});assert.equal(a.value,100-ENCLOSURE.ruins.each);
  for(let i=0;i<8;i++)put('burnt_ruins',11+i%4,15+Math.floor(i/4));assert.equal(ruinsPenalty(scene),ENCLOSURE.ruins.max);
});

test('m-uzavreny-hrad: who stands, lives or works inside closed walls has more Safety', async () => {
  const { NeedsSystem }=await import('../src/systems/NeedsSystem.js');const { ENCLOSURE }=await import('../src/game/enclosure.js');
  const s=workerScene(undefined,{workplaces:true});const needs=s.needs??new NeedsSystem(s);
  const w=s.workerSystem.create({x:60,y:60}),value=()=>needs.safetyDetail(w,{},null);
  const before=value();assert.equal(before.factors.some(([k])=>k==='walls'),false);
  const d=s.objectRegistry.require('wall'),wall=(x,y)=>s.buildings.push({id:Math.max(0,...s.buildings.map(b=>b.id))+1,type:'wall',definition:d,x,y,tiles:[{x,y}]});
  for(let x=56;x<=64;x++){wall(x,56);wall(x,64);}for(let y=57;y<=63;y++){wall(56,y);wall(64,y);}
  const after=value();assert.deepEqual(after.factors.find(([k])=>k==='walls'),['walls',ENCLOSURE.safetyBonus]);assert.equal(after.value,Math.min(100,before.value+ENCLOSURE.safetyBonus));
});

test('m-parezy-na-ceste: a stump on a worn path rots away after 3 days and comes back when the path fades', async () => {
  const { FORESTRY,stumpGone,treeState }=await import('../src/data/naturalResources.js');
  assert.equal(stumpGone(treeState('tree-1',{stage:0})),false);assert.equal(stumpGone({...treeState('tree-1',{stage:0}),rot:FORESTRY.stumpRotDays}),true);assert.equal(stumpGone({...treeState('tree-1',{stage:3}),rot:FORESTRY.stumpRotDays}),false,'only stumps');
});

test('bod 37: a remembered Stone Wall is dimmed like a Tower – its art pieces and shadows are reached', async () => {
  const { memoryParts }=await import('../src/game/MapMemoryRenderer.js');
  const image=name=>({type:'Image',name}),wall={back:{type:'Graphics'},front:{type:'Graphics'},footprint:{type:'Graphics'},art:{block:image('block'),N:image('n')},shadows:{block:image('shadow')},artShown:{}};
  const found=memoryParts(wall).filter(p=>p.type==='Image').map(p=>p.name).sort();assert.deepEqual(found,['block','n','shadow']);
  assert.equal(memoryParts({art:image('one')}).some(p=>p.name==='one'),false,'only groups of pieces, not a single object called art');
});
