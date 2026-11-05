import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { buildingTiles } from '../src/game/buildings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { FARMING_RULES } from '../src/data/farming.js';
globalThis.document={querySelector:()=>({textContent:''})};
function scene(options={}){return workerScene(undefined,{construction:true,farming:true,seasons:true,gameSettings:gameSettings({dayLengthSeconds:240,wildlifeRespawn:'off',autoEmployment:false}),...options});}
function building(s,type,x,y){const d=s.objectRegistry.require(type),b={id:Math.max(0,...s.buildings.map(b=>b.id))+1,type,definition:d,x,y,tiles:buildingTiles({x,y},d)};s.buildings.push(b);for(const t of b.tiles)s.map[t.y][t.x]=d.walkable?0:1;s.towerViews.set(b.id,s.createBuildingView(d,b));return b;}
function fixture(options={}){const s=scene(options),home=building(s,'farmhouse',45,40),field=building(s,'wheat_field',53,40),orchard=building(s,'orchard',53,46);s.farmingSystem.growthModifier=()=>0;return {s,home,field,orchard};}
function farmer(s,home,tile={x:42,y:41}){const w=s.workerSystem.create(tile);assert.ok(s.workplaceSystem.assign(home,w));return w;}
function until(s,p,max=30000){for(let t=0;t<max&&!p();t+=25)s.tick(25);assert.ok(p(),'condition not reached');}
const tending=s=>[...s.workerSystem.reservations.owners.keys()].filter(k=>k.startsWith('farm-tend:'));

test('Spring, Summer and Autumn farmers travel to crops and visibly tend/reposition without producing goods, growth or XP',()=>{
 for(const day of [1,6,11]){const {s,home}=fixture();s.seasons.cycleDay=day;s.seasons.changed();const w=farmer(s,home);until(s,()=>w.workMessage==='Tending crops');const first={...w.tile};assert.ok(Math.hypot(w.tile.x-home.x,w.tile.y-home.y)>2);assert.equal(w.workTask,null);
  until(s,()=>w.workMessage==='Tending crops'&&(w.tile.x!==first.x||w.tile.y!==first.y));assert.equal(w.experience.totalXP,0);assert.equal(w.skills.farming.totalXP,0);assert.equal(s.inventory.count('wheat'),0);assert.equal(s.inventory.count('apple'),0);assert.ok([...s.farmingSystem.records.values()].every(r=>r.growthDays===0));}
});
test('ripe harvest preempts tending within the bounded check interval and releases the idle destination reservation',()=>{
 const {s,home,field}=fixture(),w=farmer(s,home);until(s,()=>w.workMessage==='Tending crops');s.farmingSystem.records.get(field.id).growthDays=FARMING_RULES.crops.wheat_field.growthDays;
 const before={...w.position};until(s,()=>w.workTask?.kind==='harvest',FARMING_RULES.tending.harvestCheck+50);assert.equal(w.workTask.targetId,field.id);assert.equal(tending(s).length,0);assert.equal(s.farmingSystem.tending.size,0);assert.ok(Math.hypot(w.position.x-before.x,w.position.y-before.y)<2,'no teleport to harvest');until(s,()=>s.inventory.count('wheat')===8);assert.equal(w.skills.farming.totalXP,8);
});
test('Winter and removed or inaccessible plots return farmers to safe farmhouse waiting',()=>{
 for(const mode of ['winter','removed','blocked']){const {s,home,field,orchard}=fixture(),w=farmer(s,home);if(mode!=='blocked')until(s,()=>w.workMessage==='Tending crops');
  if(mode==='winter'){s.seasons.cycleDay=16;s.seasons.changed();}
  else if(mode==='removed'){s.buildings=s.buildings.filter(b=>b!==field&&b!==orchard);s.farmingSystem.records.delete(field.id);s.farmingSystem.records.delete(orchard.id);}
  else for(const b of [field,orchard])for(let y=b.y-1;y<=b.y+3;y++)for(let x=b.x-1;x<=b.x+3;x++)if(x===b.x-1||x===b.x+3||y===b.y-1||y===b.y+3)s.map[y][x]=1;
  until(s,()=>s.workplaceSystem.atWorkplace(w)&&w.workState==='Waiting');assert.equal(tending(s).length,0);assert.equal(w.experience.totalXP,0);}
});
test('several farmers claim different safe destinations; Hold, resume, reassignment and death release idle claims',()=>{
 const {s,home}=fixture(),ws=[41,42,43].map(y=>farmer(s,home,{x:42,y})),seen=new Set();
 for(let t=0;t<18000&&seen.size<3;t+=25){s.tick(25);for(const w of ws)if(w.workMessage==='Tending crops')seen.add(w.id);const goals=[...s.farmingSystem.tending.values()].map(t=>`${t.goal.x},${t.goal.y}`);assert.equal(new Set(goals).size,goals.length);}
 assert.equal(seen.size,3);for(const w of ws)s.workerSystem.commands.hold(w);s.simulate(1500);assert.equal(tending(s).length,0);const tiles=ws.map(w=>({...w.tile}));s.simulate(3000);assert.deepEqual(ws.map(w=>w.tile),tiles);
 s.workerSystem.commands.resume(ws[0]);until(s,()=>s.farmingSystem.tending.has(ws[0].id));s.workplaceSystem.remove(ws[0]);assert.equal(s.farmingSystem.tending.has(ws[0].id),false);
 s.workerSystem.commands.resume(ws[1]);until(s,()=>s.farmingSystem.tending.has(ws[1].id));ws[1].currentHP=0;ws[1].isAlive=false;s.workerSystem.onDeath(ws[1]);assert.equal(tending(s).length,0);
});
test('current-schema in-flight Save/Load keeps the physical walk but rebuilds transient tending without extra ownership or output',()=>{
 const {s,home}=fixture(),w=farmer(s,home);until(s,()=>s.farmingSystem.tending.has(w.id)&&!!w.nextTile);const data=validateGameState(serializeGameState(s));assert.equal(Object.hasOwn(data.farming,'tending'),false);
 const r=scene({starter:false});loadGameState(r,structuredClone(data));assert.deepEqual(serializeGameState(r),data);assert.equal(r.farmingSystem.tending.size,0);r.farmingSystem.growthModifier=()=>0;const rw=r.workerSystem.workers.get(w.id);until(r,()=>rw.workMessage==='Tending crops');assert.equal(rw.experience.totalXP,0);validateGameState(serializeGameState(r));
});
test('real harvest cargo delivery takes precedence over any idle tending and deposits the original yield once',()=>{
 const {s,home,field}=fixture({logistics:true}),w=farmer(s,home);until(s,()=>w.workMessage==='Tending crops');s.farmingSystem.records.get(field.id).growthDays=FARMING_RULES.crops.wheat_field.growthDays;
 until(s,()=>w.cargo?.resource==='wheat');assert.equal(w.cargo.amount,8);assert.equal(s.farmingSystem.tending.has(w.id),false);assert.equal(tending(s).length,0);assert.equal(s.inventory.count('wheat'),0);
 until(s,()=>!w.cargo&&s.inventory.count('wheat')===8);s.simulate(5000);assert.equal(s.inventory.count('wheat'),8);assert.equal(w.skills.farming.totalXP,8);validateGameState(serializeGameState(s));
});
test('steady tending does not pathfind on each frame and a removed destination is released without a repeated search storm',()=>{
 const {s,home,field,orchard}=fixture(),w=farmer(s,home);until(s,()=>w.workMessage==='Tending crops');let routes=0;const route=s.workerSystem.ai.route.bind(s.workerSystem.ai);s.workerSystem.ai.route=(...args)=>{routes++;return route(...args);};
 s.simulate(1000,10);assert.equal(routes,0,'an ongoing pose and empty harvest check need no path search');
 s.buildings=s.buildings.filter(b=>b!==field&&b!==orchard);s.simulate(5000,10);assert.equal(s.farmingSystem.tending.size,0);assert.ok(routes<=1,'absent crops cannot produce repeated tending path searches');
});
