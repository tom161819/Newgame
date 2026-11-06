import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene,ensureBuildingPrerequisites } from './helpers/workerScene.js';
import { placeBuilding,towerNeighbors } from '../src/game/buildings.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document??={querySelector:()=>({textContent:''})};
function scene(terrain=undefined,starter=true,options={}){const s=workerScene(terrain,{construction:true,foodProduction:true,logistics:true,starter,...options});s.workerSystem.unsubscribe();return s;}
function add(s,type,x=60,y=50){const d=s.objectRegistry.require(type);ensureBuildingPrerequisites(s,d);for(const [r,n]of Object.entries(d.cost))s.inventory.add(r,n);const result=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(result.error);s.towerViews.set(result.building.id,s.createBuildingView(d,result.building));return result.building;}
function employ(s,b,x=40,y=40){const w=s.workerSystem.create({x,y});assert.ok(s.workplaceSystem.assign(b,w));w.view.setSeated=value=>{w.view.seated=value;};return w;}
function until(s,p,max=60000){for(let elapsed=0;elapsed<max&&!p();elapsed+=25)s.tick(25);assert.ok(p());}
const claim=(s,w)=>s.workerSystem.seating.claims.get(w.id),key=t=>`${t.x},${t.y}`;
test('idle workers physically reach distinct seats outside the work entrance and remain seated without oscillation',()=>{
 const s=scene(),home=add(s,'mill'),a=employ(s,home),b=employ(s,home,42,40);until(s,()=>claim(s,a)?.seated&&claim(s,b)?.seated);assert.notEqual(key(a.tile),key(b.tile));const forbidden=new Set(towerNeighbors(home).map(key));assert.equal(forbidden.has(key(a.tile)),false);assert.equal(forbidden.has(key(b.tile)),false);assert.equal(a.view.seated,true);assert.equal(a.workState,'Waiting');const before=[key(a.tile),key(b.tile)];s.simulate(6000);assert.deepEqual([key(a.tile),key(b.tile)],before);assert.ok(claim(s,a).seated&&claim(s,b).seated);validateGameState(serializeGameState(s));
});
test('new production input preempts sitting and uses one real production cycle without losing materials',()=>{
 const s=scene(),home=add(s,'mill'),w=employ(s,home);until(s,()=>claim(s,w)?.seated);const recipe=s.foodProduction.recipe(home),[input,amount]=Object.entries(recipe.input)[0];s.foodStorage.deposit(`input-${home.id}`,input,amount);until(s,()=>w.workTask?.kind==='produce',1000);assert.equal(claim(s,w),undefined);assert.equal(w.view.seated,false);until(s,()=>s.foodProduction.records.get(home.id).completed===1);assert.equal(s.foodStorage.locations.get(`input-${home.id}`).stock[input]??0,0);assert.equal(s.foodProduction.records.get(home.id).completed,1);validateGameState(serializeGameState(s));
});
test('Move/Hold/Resume, job loss and a different workplace release seat reservations immediately',()=>{
 const s=scene(),home=add(s,'mill'),other=add(s,'mill',75,50),w=employ(s,home);until(s,()=>claim(s,w)?.seated);s.workerSystem.commands.hold(w);assert.equal(claim(s,w),undefined);assert.equal(w.view.seated,false);s.simulate(2000);assert.equal(claim(s,w),undefined);s.workerSystem.commands.resume(w);until(s,()=>claim(s,w)?.seated);
 const point={x:45,y:45};assert.equal(s.workerSystem.commands.move([w],point),1);assert.equal(claim(s,w),undefined);until(s,()=>w.commandState.state==='Holding');assert.deepEqual(w.tile,point);s.workerSystem.commands.resume(w);until(s,()=>claim(s,w)?.seated);s.workplaceSystem.assign(other,w);assert.equal(claim(s,w),undefined);until(s,()=>claim(s,w)?.seated);assert.equal(claim(s,w).homeId,other.id);s.workplaceSystem.remove(w);assert.equal(claim(s,w),undefined);assert.equal(w.view.seated,false);assert.equal([...s.workerSystem.reservations.owners.keys()].some(k=>k.startsWith('seat:')),false);
});
test('removing a workplace, blocked or paved seats and combat safely release sitting without changing the logical map',()=>{
 const s=scene(),home=add(s,'mill'),w=employ(s,home);until(s,()=>claim(s,w)?.seated);const before=s.map.map(r=>[...r]);s.combat.attacks.set(w,s.character);s.tick(25);assert.equal(claim(s,w),undefined);assert.equal(w.view.seated,false);s.combat.attacks.delete(w);until(s,()=>claim(s,w)?.seated);
 const anchors=s.workerSystem.seating.anchors(home);for(const tile of anchors)s.pathWear.setPaved(tile,true);s.tick(25);assert.equal(w.view.seated,false);s.buildings.splice(s.buildings.indexOf(home),1);s.workerSystem.buildingsChanged();s.tick(25);assert.equal(claim(s,w),undefined);assert.equal(w.profession,'idle');assert.deepEqual(s.map,before);
});
test('current Save/Load stores no seat leases or pose, rebuilds arrival safely and keeps the same schema',()=>{
 const s=scene(),home=add(s,'mill'),w=employ(s,home);until(s,()=>claim(s,w)?.seated);const state=validateGameState(serializeGameState(s));assert.equal(state.saveVersion,SAVE_VERSION);assert.equal(JSON.stringify(state).includes('seat:'),false);const r=scene(state.terrain,false);loadGameState(r,structuredClone(state));assert.equal(r.workerSystem.seating.claims.size,0);const rw=r.workerSystem.workers.get(w.id);until(r,()=>claim(r,rw)?.seated);assert.equal(claim(r,rw).homeId,home.id);validateGameState(serializeGameState(r));
});
test('unemployed and global Haulers never reserve a workplace seat, and empty workplaces have no ghost occupants',()=>{
 const s=scene(),home=add(s,'mill'),idle=s.workerSystem.create({x:45,y:40}),hauler=s.workerSystem.create({x:47,y:40});s.workerSystem.jobs.assign(hauler,'hauler');hauler.stoneCollection={enabled:false,radius:80};s.simulate(5000);assert.equal(claim(s,idle),undefined);assert.equal(claim(s,hauler),undefined);assert.equal(s.workerSystem.seating.claims.size,0);assert.ok(s.workerSystem.seating.anchors(home).length>0);
});
test('Farmer tending has priority in growing seasons, while Winter waiting can use the own porch',()=>{
 const s=scene(undefined,true,{seasons:true}),home=add(s,'farmhouse',60,50);add(s,'wheat_field',66,50);s.farmingSystem.growthModifier=()=>0;const w=employ(s,home);until(s,()=>s.farmingSystem.tending.has(w.id));s.simulate(3000);assert.equal(claim(s,w),undefined);assert.equal(w.view.seated,false);s.gameTime.update(15*s.gameTime.dayDuration);assert.equal(s.seasons.season,'Winter');until(s,()=>claim(s,w)?.seated);assert.equal(s.farmingSystem.tending.has(w.id),false);assert.equal(claim(s,w).homeId,home.id);validateGameState(serializeGameState(s));
});
test('death releases both derived leases so a replacement employee can reuse the real seat',()=>{
 const s=scene(),home=add(s,'mill'),a=employ(s,home),b=employ(s,home,42,40);until(s,()=>claim(s,a)?.seated&&claim(s,b)?.seated);const old={...claim(s,a).goal};a.currentHP=0;a.isAlive=false;s.workerSystem.onDeath(a);assert.equal(claim(s,a),undefined);assert.equal([...s.workerSystem.reservations.owners.values()].includes(a.id),false);const next=employ(s,home,44,40);until(s,()=>claim(s,next)?.seated);assert.deepEqual(claim(s,next).goal,old);validateGameState(serializeGameState(s));
});
test('fifty workplaces and one hundred employees share bounded planning and never overlap seats',()=>{
 const s=scene(),homes=[],people=[];for(let y=3;y<=43;y+=10)for(let x=3;x<=93;x+=10){const d=s.objectRegistry.require('mill');if(Array.from({length:d.height},(_,dy)=>Array.from({length:d.width},(_,dx)=>s.map[y+dy]?.[x+dx]===0)).flat().some(open=>!open))continue;const home=add(s,'mill',x,y);homes.push(home);people.push(employ(s,home,x,y+d.height),employ(s,home,x+1,y+d.height));}
 assert.equal(homes.length,50);assert.equal(people.length,100);until(s,()=>people.every(w=>claim(s,w)?.seated));assert.equal(new Set(people.map(w=>key(w.tile))).size,100);assert.equal(s.workerSystem.seating.claims.size,100);
 let searches=0;const navigation=s.workerSystem.navigationMap.bind(s.workerSystem);s.workerSystem.navigationMap=w=>{searches++;return navigation(w);};s.simulate(2000);assert.ok(searches<1000,'resting workers retain seats rather than replanning each frame');assert.equal(s.workerSystem.seating.anchorCache.size,50);validateGameState(serializeGameState(s));
});
