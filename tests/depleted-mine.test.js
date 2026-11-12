import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { DemolitionSystem,demolitionRefund } from '../src/systems/DemolitionSystem.js';
import { finishDemolition } from '../src/game/buildingRemoval.js';
import { ProductionDiagnostics } from '../src/systems/ProductionDiagnostics.js';
import { DIAGNOSTICS } from '../src/data/diagnostics.js';
import { staffingStatus } from '../src/systems/StaffingStatus.js';
import { noticeText } from '../src/ui/noticeText.js';
import { buildingName,DEPLETED_TINT } from '../src/game/depletedMine.js';
import { footprintShown,applyFootprint,selectedBuildingIds } from '../src/game/footprintHighlight.js';
import { SpriteBuildingView } from '../src/systems/SpriteViews.js';
import { setLanguage } from '../src/i18n/index.js';

// m-vytezeny-dul-ctverecky (owner requests 63, 64).
globalThis.document??={querySelector:()=>({textContent:''})};
function fixture(starter=true){const s=workerScene(undefined,{naturalResources:true,construction:true,logistics:true,starter});s.workerSystem.unsubscribe();return s;}
function deposit(s,type,tile,remaining){const n={id:`deposit-${s.naturalResources.nextDepositId++}`,kind:'deposit',remaining,max:60,boundBuildingId:null};s.addResource(s.objectRegistry.require(type),tile,n);return s.naturalResources.byId.get(n.id);}
function building(s,type,anchor){const d=s.objectRegistry.require(type);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);const b=result.building;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;}
function free(s){for(let y=46;y<56;y++)for(let x=38;x<45;x++)if(s.map[y][x]===0&&!s.reservedTiles().some(t=>t.x===x&&t.y===y)&&!s.workerSystem.liveWorkers().some(w=>w.tile.x===x&&w.tile.y===y))return {x,y};throw Error('No free tile');}
function miner(s,b){const w=s.workerSystem.create(free(s));assert.ok(s.workplaceSystem.assign(b,w));return w;}
function hauler(s){const w=s.workerSystem.create(free(s));assert.ok(s.workerSystem.jobs.assign(w,'hauler'));w.stoneCollection={...w.stoneCollection,enabled:false};return w;}
function until(s,condition,limit=120000){for(let elapsed=0;elapsed<limit&&!condition();elapsed+=50)s.tick(50);assert.ok(condition(),JSON.stringify(s.workerSystem.liveWorkers().map(w=>({id:w.id,profession:w.profession,task:w.workTask?.kind,cargo:w.cargo,message:w.workMessage}))));}
// Two Iron Mines: A runs out, B has one free seat left.
function mines(){
  const s=fixture(),da=deposit(s,'iron_deposit',{x:51,y:44},1),a=building(s,'iron_mine',{x:50,y:43}),db=deposit(s,'iron_deposit',{x:60,y:52},60),b=building(s,'iron_mine',{x:59,y:51});
  const crew=[miner(s,a),miner(s,a),miner(s,a)],other=[miner(s,b),miner(s,b)];
  return {s,a,b,da,db,crew,other,carrier:hauler(s)};
}

test('an exhausted Iron Mine becomes a Depleted Iron Mine: no workers or production, Miners go to a free Miner seat elsewhere or become Unemployed',()=>{
  const {s,a,b,da,crew}=mines();
  until(s,()=>a.depleted===true);
  assert.equal(da.natural.remaining,0);assert.deepEqual(s.workplaceSystem.records.get(a.id).workerIds,[],'nobody works in the depleted mine');
  const moved=crew.filter(w=>w.assignedWorkplaceId===b.id),idle=crew.filter(w=>w.assignedWorkplaceId==null);
  assert.equal(moved.length,1,'one Miner takes the last free seat of the other Iron Mine');assert.equal(moved[0].profession,'miner');
  assert.equal(idle.length,2);assert.ok(idle.every(w=>w.profession==='idle'),'the rest are Unemployed');assert.equal(s.workplaceSystem.employees(b).length,3);
  // No seats: neither by hand nor for a new Miner, and no missing-worker sign.
  const extra=s.workerSystem.create(free(s));assert.equal(s.workplaceSystem.assign(a,extra),false);s.workerSystem.jobs.assign(extra,'miner');assert.equal(s.workplaceSystem.assignFree(extra),null);
  assert.equal(staffingStatus(s,a),null);
  // No production: the one unit mined stays the only Ore ever made from the mine, and the Hauler empties its pile.
  until(s,()=>s.inventory.count('iron_ore')>=1&&!(s.foodStorage.locations.get(`pile-${a.id}`).stock.iron_ore>0));
  const ore=s.inventory.count('iron_ore')+(s.foodStorage.locations.get(`pile-${b.id}`).stock.iron_ore??0);s.simulate(20000);
  assert.ok(s.foodStorage.locations.has(`pile-${a.id}`),'the output pile stays with the depleted mine');assert.equal(da.natural.remaining,0);
  assert.ok(s.workplaceSystem.records.get(a.id).workerIds.length===0);assert.ok(ore>=1);
  setLanguage('en',{persist:false});assert.equal(buildingName(a),'Depleted Iron Mine');assert.equal(buildingName(b),'Iron Mine');
  setLanguage('cs',{persist:false});try{assert.equal(buildingName(a),'Vytěžený důl');assert.equal(buildingName({...a,type:'quarry',quarryMode:'finite'}),'Vytěžený lom');}finally{setLanguage('en',{persist:false});}
  assert.equal(buildingName({...a,type:'quarry',quarryMode:'finite'}),'Depleted Quarry');
});

test('the last load still reaches the pile before the Miners leave; a Quarry with a finite deposit becomes a Depleted Quarry too',()=>{
  const s=fixture(),d=deposit(s,'stone_deposit',{x:49,y:44},1),q=building(s,'quarry',{x:47,y:43}),w=miner(s,q);assert.equal(q.quarryMode,'finite');
  until(s,()=>d.natural.remaining===0);assert.ok(!q.depleted,'not while the Miner still brings the stone');assert.equal(w.assignedWorkplaceId,q.id);
  until(s,()=>q.depleted===true);assert.equal(s.foodStorage.locations.get(`pile-${q.id}`).stock.stone,1,'the mined stone lies on the pile');
  assert.equal(w.assignedWorkplaceId,null);assert.equal(w.profession,'idle');
  // A legacy Quarry (no finite deposit) never becomes depleted.
  const legacy={id:999,type:'quarry',quarryMode:'legacy',x:0,y:0};assert.equal(buildingName(legacy),'Quarry');
});

test('one notice "The Iron Mine is exhausted" (the existing depletion notice), never repeated, no warning sign over the mine',()=>{
  const {s,a}=mines();setLanguage('en',{persist:false});
  const feed=[];s.eventFeed={push:(key,text)=>{feed.push(text);return true;}};s.diagnostics=new ProductionDiagnostics(s);s.diagnostics.foodIssues=()=>[];s.diagnostics.chainIssues=()=>[];s.diagnostics.storageIssues=()=>[];
  const advance=ms=>{for(let t=0;t<ms;t+=DIAGNOSTICS.checkInterval){s.simulate(DIAGNOSTICS.checkInterval);s.diagnostics.update();}};
  until(s,()=>a.depleted===true);advance(DIAGNOSTICS.persistence+DIAGNOSTICS.checkInterval*2);
  const rows=()=>s.diagnostics.active().filter(i=>i.entityId===a.id);assert.equal(rows().length,1);assert.equal(rows()[0].reason,'depleted');assert.equal(rows()[0].params.exhausted,true);
  assert.equal(noticeText(s,rows()[0]),'The Iron Mine is exhausted.');assert.deepEqual(feed.filter(t=>/exhausted/.test(t)),['The Iron Mine is exhausted.']);
  advance(s.gameTime.dayDuration*2);assert.equal(rows().length,1);assert.equal(rows()[0].count,1,'not repeated');assert.equal(feed.filter(t=>/Iron Mine/.test(t)).length,1);
  setLanguage('cs',{persist:false});try{assert.equal(noticeText(s,rows()[0]),'Železný důl je vytěžen.');}finally{setLanguage('en',{persist:false});}
});

test('a depleted mine can be demolished like any building and returns half its price; the deposit is free again',()=>{
  const {s,a,da}=mines();until(s,()=>a.depleted===true);
  s.demolition=new DemolitionSystem(s,{complete:(b,refund)=>finishDemolition(s,b,refund)});const tick=s.tick;s.tick=delta=>{tick(delta);s.demolition.update(delta);};
  const expected=demolitionRefund(a.definition);assert.deepEqual(expected,{wood:10});assert.ok(s.demolition.eligible(a));assert.ok(s.demolition.request(a));
  const builder=s.workerSystem.create(free(s));s.workerSystem.jobs.assign(builder,'builder');
  const wood=()=>s.inventory.count('wood')+[...s.dropSystem.drops.values()].filter(d=>d.resource==='wood').reduce((n,d)=>n+d.amount,0)+s.workerSystem.liveWorkers().filter(w=>w.cargo?.resource==='wood').reduce((n,w)=>n+w.cargo.amount,0);
  const before=wood();until(s,()=>!s.buildings.includes(a));assert.equal(wood()-before,expected.wood);
  s.naturalResources.mining.reconcile();assert.equal(da.natural.boundBuildingId,null);validateGameState(serializeGameState(s));
});

test('Save/Load keeps the depleted state; malformed or impossible depleted fields are rejected',()=>{
  const {s,a,b}=mines();until(s,()=>a.depleted===true);
  const saved=validateGameState(serializeGameState(s)),entry=saved.buildings.find(o=>o.id===a.id);assert.equal(entry.depleted,true);assert.equal(saved.buildings.find(o=>o.id===b.id).depleted,undefined);
  const r=fixture(false);loadGameState(r,saved);assert.deepEqual(serializeGameState(r),saved);const restored=r.buildings.find(o=>o.id===a.id);assert.equal(restored.depleted,true);
  const w=r.workerSystem.create(free(r));assert.equal(r.workplaceSystem.assign(restored,w),false,'still takes nobody after Load');
  for(const change of [x=>{x.buildings.find(o=>o.id===a.id).depleted='yes';},x=>{x.buildings.find(o=>o.id===a.id).depleted=false;},x=>{x.buildings.find(o=>o.id===b.id).depleted=true;},
    x=>{const o=x.buildings.find(o=>o.type==='starter_stockpile');o.depleted=true;},
    x=>{const id=x.workplaces.records.find(r=>r.buildingId===b.id).workerIds.shift();x.workplaces.records.find(r=>r.buildingId===a.id).workerIds.push(id);x.workers.find(o=>o.id===id).assignedWorkplaceId=a.id;}]){
    const bad=structuredClone(saved);change(bad);assert.throws(()=>validateGameState(bad));
  }
  // A save whose mine ran out without the flag (exhausted, idle crew) is turned into a depleted mine by the next step.
  const plain=structuredClone(saved);delete plain.buildings.find(o=>o.id===a.id).depleted;const p=fixture(false);loadGameState(p,validateGameState(plain));
  assert.equal(p.buildings.find(o=>o.id===a.id).depleted,undefined);p.tick(50);assert.equal(p.buildings.find(o=>o.id===a.id).depleted,true);
});

test('the depleted look: the sprite is darkened, a valid placement tint still wins',()=>{
  const tints=[];const part=()=>({setPosition(){return this;},setDepth(){return this;},setTint(v){tints.push(v);return this;},setAlpha(){return this;},clear(){return this;},fillStyle(){return this;},lineStyle(){return this;},fillPoints(){return this;},strokePoints(){return this;},setVisible(v){this.visible=v;return this;},visible:true});
  const view=Object.create(SpriteBuildingView.prototype);Object.assign(view,{manager:{scene:{}},definition:{id:'iron_mine'},preview:false,back:part(),front:part(),rotor:null,footprint:part()});
  const b={id:1,type:'iron_mine',x:10,y:10,definition:{id:'iron_mine',width:3,height:3,visualHeight:100},tiles:[{x:10,y:10}],depleted:true};
  view.paint(b);assert.deepEqual(tints,[DEPLETED_TINT,DEPLETED_TINT]);tints.length=0;view.paint(b,0x71dba6);assert.deepEqual(tints,[0x71dba6,0x71dba6]);tints.length=0;view.paint({...b,depleted:undefined});assert.deepEqual(tints,[null,null]);
});

test('request 63: footprint squares under finished buildings show only while placing a building or for the selected building',()=>{
  // Normal play: hidden under a finished building.
  assert.equal(footprintShown({}),false);
  for(const state of [{buildMode:true},{selected:true},{preview:true},{tinted:true},{complete:false}])assert.equal(footprintShown(state),true,JSON.stringify(state));
  const layer={visible:true,calls:0,setVisible(v){this.visible=v;this.calls++;return this;}};
  assert.equal(applyFootprint({footprint:layer},false),true);assert.equal(layer.visible,false);applyFootprint({footprint:layer},false);assert.equal(layer.calls,1,'no work when unchanged');
  applyFootprint({inner:{footprint:layer}},true);assert.equal(layer.visible,true,'wrapped views (lit, construction) too');assert.equal(applyFootprint({},true),false);
  // Selected: the building clicked last and the one whose panel is open.
  assert.deepEqual([...selectedBuildingIds({demolitionUI:{selectedId:4,buildingId:7,host:{open:true}}})].sort(),[4,7]);
  assert.deepEqual([...selectedBuildingIds({demolitionUI:{selectedId:null,buildingId:7,host:{open:false}}})],[]);assert.deepEqual([...selectedBuildingIds({})],[]);
});
