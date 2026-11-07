import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { placeBuilding } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { PATH_WEAR } from '../src/data/pathWear.js';
globalThis.document={querySelector:()=>({textContent:''})};
const scene=(options={})=>workerScene(undefined,{construction:true,foodProduction:true,logistics:true,gameSettings:gameSettings(),...options});
const starter=s=>s.buildings.find(b=>b.type==='starter_stockpile');
const location=s=>s.foodStorage.locations.get(`stockpile-${starter(s).id}`);
function add(s,type,x=42,y=42){const definition=s.objectRegistry.require(type);for(const [r,n]of Object.entries(definition.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(definition,result.building));return result.building;}
function until(s,p,max=90000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p());}
function empty(s){const l=location(s);for(const r of Object.keys(l.stock))l.stock[r]=0;s.foodStorage.changed();}
test('only an empty, idle, visible Starter Stockpile after a completed Warehouse is removable',()=>{
 const s=scene(),b=starter(s);assert.equal(s.foodStorage.starterRemovalStatus(b),'warehouse');const wh=add(s,'warehouse');
 s.foodStorage.deposit(location(s).id,'wood',2);assert.equal(s.foodStorage.dismantleStarter(b).removed,false);assert.ok(s.buildings.includes(b));empty(s);
 assert.equal(s.foodStorage.starterRemovalStatus(b),null);assert.equal(s.foodStorage.dismantleStarter(wh).removed,false);assert.equal(s.foodStorage.dismantleStarter({...b}).removed,false);
 const cap=s.foodStorage.reserve('capacity',location(s).id,'wood',1,'test');assert.equal(s.foodStorage.starterRemovalStatus(b),'busy');s.foodStorage.release(cap);
 s.kingLogistics.task={sourceId:location(s).id};assert.equal(s.foodStorage.starterRemovalStatus(b),'busy');s.kingLogistics.task=null;
 s.fog.setEnabled(true);s.character.position={x:85.5,y:85.5};s.fog.update();assert.equal(s.foodStorage.starterRemovalStatus(b),'unavailable');
});
test('removal clears the real footprint once, leaves ordinary maximum wear, decays and survives current Save/Load',()=>{
 const s=scene(),b=starter(s);add(s,'warehouse');empty(s);const tiles=b.tiles.map(t=>({...t})),id=location(s).id,day=s.gameTime.day;
 assert.equal(s.foodStorage.dismantleStarter(b).removed,true);assert.equal(s.foodStorage.locations.has(id),false);assert.equal(s.buildings.includes(b),false);
 for(const tile of tiles){assert.equal(s.map[tile.y][tile.x],0);assert.equal(s.pathWear.level(tile),4);assert.equal(s.pathWear.lastPassDays[s.pathWear.index(tile)],day);}
 assert.equal(s.foodStorage.dismantleStarter(b).removed,false);const state=validateGameState(serializeGameState(s)),r=scene({starter:false});loadGameState(r,state);
 assert.equal(starter(r),undefined);assert.equal(r.foodStorage.locations.has(id),false);for(const tile of tiles)assert.equal(r.pathWear.level(tile),4);
 r.pathWear.onNewDay(day+PATH_WEAR.recoveryDelayDays+10);for(const tile of tiles)assert.equal(r.pathWear.level(tile),0);
 validateGameState(serializeGameState(s));
});
test('existing Haulers drain portable stock physically and in-flight source references prevent early dismantle',()=>{
 const s=scene(),b=starter(s),wh=add(s,'warehouse'),id=location(s).id;empty(s);s.foodStorage.deposit(id,'wood',6);
 const w=s.workerSystem.create({x:48,y:42});s.workerSystem.jobs.assign(w,'hauler');until(s,()=>w.workTask?.sourceId===id);assert.equal(s.foodStorage.dismantleStarter(b).removed,false);
 until(s,()=>w.cargo?.resource==='wood');assert.equal(s.foodStorage.used(location(s)),0);assert.equal(s.foodStorage.starterRemovalStatus(b),'busy');
 const mid=validateGameState(serializeGameState(s)),r=scene({starter:false});loadGameState(r,mid);assert.equal(r.foodStorage.starterRemovalStatus(starter(r)),'busy');
 until(r,()=>r.foodStorage.locations.get(`warehouse-${wh.id}`).stock.wood===6);assert.equal(r.foodStorage.starterRemovalStatus(starter(r)),null);assert.equal(r.foodStorage.dismantleStarter(starter(r)).removed,true);assert.equal(r.inventory.count('wood'),6);validateGameState(serializeGameState(r));
});
test('no Hauler, a full or inaccessible Warehouse, and incompatible food preserve stock and prevent removal',()=>{
 for(const blocked of ['no-hauler','full','inaccessible','food']){const s=scene(),b=starter(s),wh=add(s,'warehouse'),id=location(s).id;empty(s);const resource=blocked==='food'?'apple':'wood';s.foodStorage.deposit(id,resource,3);
 if(blocked==='full')s.foodStorage.deposit(`warehouse-${wh.id}`,'stone',200);
 if(blocked==='inaccessible')for(let y=wh.y-1;y<=wh.y+3;y++)for(let x=wh.x-1;x<=wh.x+3;x++)s.map[y][x]=1;
 if(blocked!=='no-hauler'){const w=s.workerSystem.create({x:48,y:42});s.workerSystem.jobs.assign(w,'hauler');}
 s.simulate(5000);assert.equal(s.foodStorage.locations.get(id).stock[resource],3);assert.equal(s.foodStorage.dismantleStarter(b).removed,false);assert.equal(s.foodStorage.reservations.size,0);
 }
});
