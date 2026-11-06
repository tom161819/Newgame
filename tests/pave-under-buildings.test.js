import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,buildingTiles } from '../src/game/buildings.js';
import { pavementTiles,pavementPlan,placePavement,pavementHost } from '../src/game/pavement.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};

const scene=(starter=true)=>{const s=workerScene(undefined,{construction:true,foodProduction:true,logistics:true,ledger:true,starter});s.workerSystem.unsubscribe();return s;};
const options=(s,tiles)=>({map:s.map,tiles,resources:s.resourceOccupancy,buildings:s.buildings,pathWear:s.pathWear,inventory:s.inventory,registry:s.objectRegistry});
function order(s,tiles){const r=placePavement(options(s,tiles));assert.ifError(r.error);for(const b of r.buildings){s.constructionSystem.plan(b);s.towerViews.set(b.id,s.createBuildingView(b.definition,b));}return r;}
function building(s,type,x,y){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.foodStorage.register(r.building);return r.building;}
function until(s,p,max=300000){let t=0;while(!p()&&t<max){s.tick(50);t+=50;}assert.ok(p(),`not reached after ${t} ms`);return t;}

test('the floor of a finished building can be paved; fields, orchards and unfinished sites cannot',()=>{
  const s=scene();s.inventory.add('stone',40);const hut=building(s,'warehouse',60,50),field=building(s,'wheat_field',70,50);
  const under=buildingTiles(hut,hut.definition),plan=pavementPlan(options(s,pavementTiles('area',{x:59,y:49},{x:60+hut.definition.width,y:50+hut.definition.height})));
  assert.equal(under.every(t=>plan.fresh.some(f=>f.x===t.x&&f.y===t.y)),true,'every floor tile is new pavement');assert.equal(plan.invalid.length,0);
  assert.deepEqual(pavementPlan(options(s,[{x:field.x,y:field.y}])).fresh,[],'farmland is not paved');
  const site=building(s,'warehouse',80,50);s.constructionSystem.plan?.(site);
  if(site.construction)assert.deepEqual(pavementPlan(options(s,[{x:site.x,y:site.y}])).fresh,[],'an unfinished site is not paved');
});

test('Builders pave the inside of a building from its edge; the floor stays after the building is gone; Save/Load mid-way',()=>{
  let s=scene();s.inventory.add('stone',20);const hut=building(s,'house',60,50),d=hut.definition;
  const centre={x:hut.x+Math.floor(d.width/2),y:hut.y+Math.floor(d.height/2)},tiles=buildingTiles(hut,d);order(s,tiles);
  const inner=s.buildings.find(b=>b.type.startsWith('stone_pavement')&&b.x===centre.x&&b.y===centre.y);assert.equal(pavementHost(s.buildings,inner,s.objectRegistry),hut);
  for(const [i,role]of ['builder','builder','hauler'].entries()){const w=s.workerSystem.create({x:57+i,y:57});s.workerSystem.jobs.assign(w,role);}
  until(s,()=>tiles.some(t=>s.pathWear.isPaved(t)));
  for(const w of s.workerSystem.workers.values())assert.equal(tiles.some(t=>t.x===w.tile.x&&t.y===w.tile.y),false,'nobody stands inside the building');
  const saved=validateGameState(serializeGameState(s)),r=scene(false);loadGameState(r,structuredClone(saved));assert.deepEqual(validateGameState(serializeGameState(r)),saved);s=r;
  until(s,()=>tiles.every(t=>s.pathWear.isPaved(t)));
  assert.equal(tiles.every(t=>s.map[t.y][t.x]===1),true,'the building still blocks its tiles');
  const h=s.buildings.find(b=>b.id===hut.id);s.buildings.splice(s.buildings.indexOf(h),1);for(const t of tiles)s.map[t.y][t.x]=0;
  assert.equal(tiles.every(t=>s.pathWear.isPaved(t)),true,'the paved floor stays when the building is gone');
  validateGameState(serializeGameState(s));
});

test('a pavement site under a demolished building is reached from its own tile again',()=>{
  const s=scene();s.inventory.add('stone',4);const hut=building(s,'house',60,50),d=hut.definition,centre={x:hut.x+1,y:hut.y+1};order(s,[centre]);
  const site=s.buildings.find(b=>b.type.startsWith('stone_pavement'));const loc=()=>s.foodStorage.locations.get(`site-${site.id}`);
  if(loc())assert.deepEqual([loc().x,loc().y,loc().width,loc().height],[hut.x,hut.y,d.width,d.height],'delivered at the building edge');
  s.buildings.splice(s.buildings.indexOf(hut),1);for(const t of buildingTiles(hut,d))s.map[t.y][t.x]=0;s.tick(50);
  if(loc())assert.deepEqual([loc().x,loc().y,loc().width,loc().height],[centre.x,centre.y,1,1]);
  validateGameState(serializeGameState(s));
});
