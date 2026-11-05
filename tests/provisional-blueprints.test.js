import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding,buildingIsComplete } from '../src/game/buildings.js';
import { isProvisional,knownPlacementError,knownContext } from '../src/game/provisionalSites.js';
import { placeWallLine } from '../src/game/walls.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { t } from '../src/i18n/index.js';

globalThis.document??={querySelector:()=>({textContent:''})};

// The king stands at the map centre with Fog of War on; x≥70 is never seen until he walks there.
function scene(terrain,options={}){
  const s=workerScene(terrain,{construction:true,...options});s.fog.setEnabled(true);s.fog.update();s.log=[];s.activities.on(e=>s.log.push(e));s.statuses=[];s.setStatus=text=>s.statuses.push(text);return s;
}
function place(s,type,anchor){
  const d=s.objectRegistry.require(type);s.inventory.add('stone',d.cost.stone);
  const provisional=isProvisional(s.fog,[anchor]),known=provisional?knownPlacementError(s,anchor,d):null;if(known)return {error:known};
  const r=placeBuilding({map:s.map,anchor,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d,reserveMaterials:true,provisional});
  if(r.building)s.constructionSystem.plan(r.building);return r;
}
// Someone now sees the site (any sight source would do).
const reveal=(s,site)=>{s.fog.registerSource('scout',()=>({center:{x:site.x+.5,y:site.y+.5},radius:4}));};
const hiddenRock=()=>{const terrain=Array.from({length:100},()=>Array(100).fill(0));terrain[50][80]=1;return terrain;};

test('outside sight only known ground decides: a hidden rock or stone neither blocks nor colours the placement',()=>{
  const s=scene(hiddenRock()),d=s.objectRegistry.require('wall');
  assert.equal(s.fog.isVisibleTile({x:80,y:50}),false);assert.equal(isProvisional(s.fog,[{x:80,y:50}]),true);
  assert.equal(knownPlacementError(s,{x:80,y:50},d),null,'the hidden rock is not revealed');
  s.addResource(s.objectRegistry.require('stone'),{x:81,y:50});assert.equal(knownPlacementError(s,{x:81,y:50},d),null,'nor a hidden stone');
  // Remembered ground is known.
  s.fog.explored[50*100+80]=1;assert.notEqual(knownPlacementError(s,{x:80,y:50},d),null);
});

test('a provisional blueprint claims no tiles and gets no work until its site is seen',()=>{
  const s=scene(),r=place(s,'wall',{x:80,y:50}),site=r.building;
  assert.equal(site.unverified,true);assert.equal(s.map[50][80],0,'the hidden ground is left as it is');
  const w=s.workerSystem.create({x:79,y:52});s.workerSystem.jobs.assign(w,'builder');s.simulate(30000);
  assert.equal(site.construction.workDone,0);assert.equal(site.unverified,true);
  reveal(s,site);s.tick(50);
  assert.equal(site.unverified,undefined);assert.equal(s.map[50][80],1,'verified: the site now claims its tile');
  s.simulate(30000);assert.equal(buildingIsComplete(site),true);assert.equal(s.log.filter(e=>e.type==='constructionCancelled').length,0);
});

test('a hidden obstacle found at the site cancels the whole order once, returns the materials and leaves the map untouched',()=>{
  const s=scene(hiddenRock()),before=s.inventory.count('stone'),r=place(s,'wall',{x:80,y:50}),site=r.building;
  assert.ok(site,'placed despite the hidden rock');assert.equal(s.inventory.count('stone'),before,'the wall stone is reserved, not lost');
  reveal(s,site);s.tick(50);s.tick(50);
  assert.equal(s.buildings.includes(site),false);assert.equal(s.constructionSystem.sites.has(site.id),false);
  assert.equal(s.map[50][80],1,'the real rock stays a rock');assert.equal(s.inventory.count('stone'),before+site.definition.cost.stone,'all materials back');
  const events=s.log.filter(e=>e.type==='constructionCancelled');assert.equal(events.length,1);assert.deepEqual([events[0].reason,events[0].objectType,events[0].objectIds],['obstacle','wall',[site.id]]);
  assert.equal(s.statuses.at(-1),t('status.obstacleFound',{name:site.definition.name}));
  assert.deepEqual(validateGameState(serializeGameState(s)),serializeGameState(s));
});

test('a provisional site survives Save/Load in the current schema without claiming hidden ground',()=>{
  const s=scene(hiddenRock()),site=place(s,'wall',{x:80,y:50}).building,state=serializeGameState(s);
  assert.equal(state.buildings.find(b=>b.id===site.id).unverified,true);assert.deepEqual(validateGameState(state),state);
  const bad=structuredClone(state);bad.buildings.find(b=>b.id===site.id).construction.state='building';assert.throws(()=>validateGameState(bad));
  const loaded=scene(state.terrain,{starter:false});loadGameState(loaded,structuredClone(state));loaded.fog.setEnabled(true);const restored=loaded.buildings.find(b=>b.id===site.id);
  assert.equal(restored.unverified,true);assert.equal(loaded.map[50][80],1,'the rock under it is still the real rock');
  reveal(loaded,restored);loaded.tick(50);assert.equal(loaded.buildings.includes(restored),false);assert.equal(loaded.log.filter(e=>e.type==='constructionCancelled').length,1);
});

test('a wall line reaching outside sight: every segment is provisional and checked on its own when seen',()=>{
  const s=scene(hiddenRock()),d=s.objectRegistry.require('wall'),tiles=[{x:78,y:50},{x:79,y:50},{x:80,y:50},{x:81,y:50}];s.inventory.add('stone',d.cost.stone*tiles.length);
  const r=placeWallLine({map:s.map,tiles,resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),buildings:s.buildings,definition:d,inventory:s.inventory,reserveMaterials:true,...knownContext(s),provisional:true});
  assert.equal(r.error,null);assert.equal(r.buildings.length,4);for(const b of r.buildings){assert.equal(b.unverified,true);s.constructionSystem.plan(b);}
  assert.deepEqual(tiles.map(t=>s.map[t.y][t.x]),[0,0,1,0],'only the real rock is solid');
  s.fog.registerSource('scout',()=>({center:{x:79.5,y:50.5},radius:4}));s.tick(50);
  assert.deepEqual(r.buildings.map(b=>s.buildings.includes(b)),[true,true,false,true]);assert.ok(r.buildings.filter(b=>s.buildings.includes(b)).every(b=>!b.unverified));
  assert.deepEqual(tiles.map(t=>s.map[t.y][t.x]),[1,1,1,1]);assert.equal(s.log.filter(e=>e.type==='constructionCancelled').length,1);
});
