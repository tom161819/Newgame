import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding } from '../src/game/buildings.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { MountSystem } from '../src/systems/MountSystem.js';
import { serializeGameState,validateGameState,SAVE_VERSION } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
import { WILDLIFE_BUILDING_MARGIN } from '../src/systems/WildlifeClearance.js';

globalThis.document={querySelector:()=>({textContent:''})};
const scene=()=>workerScene(undefined,{gameSettings:gameSettings({fogOfWar:false})});
function building(s,x=50,y=50,type='tower'){const d=s.objectRegistry.require(type);for(const [id,n]of Object.entries(d.cost))s.inventory.add(id,n);const r=placeBuilding({map:s.map,anchor:{x,y},resources:s.resourceOccupancy,reservedTiles:s.reservedTiles(),inventory:s.inventory,buildings:s.buildings,definition:d});assert.ifError(r.error);s.towerViews.set(r.building.id,s.createBuildingView(d,r.building));s.animalSystem.clearance.refresh();return r.building;}
function animal(s,x=48,y=50,type='rabbit'){return s.animalSystem.create(s.objectRegistry.require(type),{x,y});}
function random(s,values=[.6,.5,.5]){let n=0;s.animalSystem.random=()=>values[n++%values.length];}

test('audit regression: a rabbit no longer wanders onto the tile immediately beside an existing tower',()=>{
 const s=scene();building(s);const a=animal(s);a.wanderWait=0;random(s);s.animalSystem.update(1000);assert.equal(WILDLIFE_BUILDING_MARGIN,1);assert.deepEqual(a.tile,{x:48,y:50});assert.equal(a.nextTile,undefined);assert.equal(a.path.length,0);assert.equal(s.map[50][49],0,'ordinary worker/king ground is not blocked');
});

test('both destination and complete path avoid the immediate ring, including diagonal corners and a one-tile corridor',()=>{
 const s=scene();building(s,50,50);building(s,50,53);const c=s.animalSystem.clearance,a=animal(s,47,52),before=s.map.map(r=>[...r]);
 assert.equal(c.route(a,{x:49,y:49}),null,'diagonal corner belongs to the margin');const route=c.route(a,{x:54,y:52});assert.ok(route);assert.ok(route.path.length>7,'go around the narrow gap');assert.ok(route.path.every(t=>c.isClear(t)));assert.deepEqual(s.map,before);
});

test('a new building invalidates the remaining wander path without teleporting or stepping into its margin',()=>{
 const s=scene(),a=animal(s,46,50);a.wanderWait=0;random(s,[.99,.5,.5]);s.animalSystem.update(100);assert.deepEqual(a.nextTile,{x:47,y:50});assert.ok(a.position.x>46.5&&a.position.x<47.5);building(s,49,50);
 const before={...a.position};s.animalSystem.update(50);assert.ok(a.position.x>=before.x);assert.ok(a.position.x-before.x<.1,'no snap');
 for(let i=0;i<50;i++){s.animalSystem.update(50);assert.ok(s.animalSystem.clearance.isClear(a.tile));assert.notEqual(a.nextTile?.x,48);}
 assert.deepEqual(a.tile,{x:47,y:50});
});

test('an idle animal in a newly placed margin retreats to clear terrain and resumes ordinary wandering',()=>{
 const s=scene(),a=animal(s,49,50);building(s);a.wanderWait=0;random(s);for(let i=0;i<80;i++)s.animalSystem.update(50);assert.ok(s.animalSystem.clearance.isClear(a.tile));assert.equal(a.isAlive,true);assert.equal(a.retaliationTarget,undefined);
});

test('retaliation and the interactive horse retain their original movement and mounting',()=>{
 const s=scene();building(s);const horse=animal(s,48,50,'horse');horse.wanderWait=0;random(s);s.animalSystem.update(1000);assert.deepEqual(horse.tile,{x:49,y:50},'royal horse is not forbidden from approaching structures');
 const king=s.character;king.tile={x:48,y:50};king.position={x:48.5,y:50.5};king.nextTile=null;king.path=[];const mount=new MountSystem(s);assert.equal(mount.mount(horse),true);assert.equal(mount.dismount(),true);
 const boar=animal(s,48,52,'wild_boar');s.animalSystem.onAttacked(boar,king);s.animalSystem.update(100);assert.equal(boar.retaliationTarget,king);assert.ok(s.combat.attacks.has(boar)||boar.path.length||boar.nextTile,'combat uses its own approach route');
});

test('initial wildlife and respawns avoid structures, keep requested counts, and do not reveal fog',()=>{
 const s=scene();building(s,50,50);s.animalSystem.spawn(s.character.tile);assert.equal([...s.animalSystem.animals.values()].filter(a=>a.definition.gameplay.huntable).length,9);
 for(const a of s.animalSystem.animals.values())if(a.definition.gameplay.huntable)assert.ok(s.animalSystem.clearance.isClear(a.tile));
 for(const a of [...s.animalSystem.animals.values()])if(a.type==='rabbit')s.animalSystem.remove(a);s.fog.setEnabled(true);const before=s.fog.explored.slice();s.wildlifeRespawn.random=()=>.5;assert.equal(s.wildlifeRespawn.spawnOne(),true);assert.deepEqual(s.fog.explored,before);for(const a of s.animalSystem.animals.values())if(a.definition.gameplay.huntable)assert.ok(s.animalSystem.clearance.isClear(a.tile));
});

test('current-schema Save/Load restores a safe in-flight route exactly; no persisted clearance model or schema bump',()=>{
 const s=scene();building(s);const a=animal(s,46,50);a.wanderWait=0;random(s,[.5,.99,.5]);s.animalSystem.update(120);assert.ok(a.nextTile);const state=serializeGameState(s);validateGameState(state);assert.equal(state.saveVersion,SAVE_VERSION);assert.equal('wildlifeClearance' in state,false);
 const loaded=scene();loadGameState(loaded,state);assert.deepEqual(serializeGameState(loaded),state);const copy=loaded.animalSystem.animals.get(a.id);loaded.animalSystem.update(50);assert.ok(copy.isAlive);assert.ok(loaded.animalSystem.clearance.isClear(copy.nextTile??copy.tile));
});

test('200 idle animals reuse the same mask; building removal invalidates it once and reopens its margin',()=>{
 const s=scene(),b=building(s);for(let i=0;i<200;i++){const a=animal(s,5+i%20,5+Math.floor(i/20));a.wanderWait=1e8;}const c=s.animalSystem.clearance,revision=c.revision,started=performance.now();for(let i=0;i<100;i++)s.animalSystem.update(16);const elapsed=performance.now()-started;assert.equal(c.revision,revision);assert.ok(elapsed<1500,`200 animals / 100 frames: ${elapsed.toFixed(1)} ms`);
 assert.equal(c.isClear({x:49,y:50}),false);s.buildings.splice(s.buildings.indexOf(b),1);s.animalSystem.update(16);assert.equal(c.revision,revision+1);assert.equal(c.isClear({x:49,y:50}),true);
});


test('a cramped world with no safe wildlife ring still spawns its interactive horse on ordinary free terrain',()=>{
 const s=scene();s.map=Array.from({length:3},()=>Array(3).fill(0));building(s,1,1);s.animalSystem.spawn({x:0,y:0});assert.equal([...s.animalSystem.animals.values()].filter(a=>a.definition.gameplay.huntable).length,0);assert.equal([...s.animalSystem.animals.values()].filter(a=>a.type==='horse').length,1);
});
