import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { placementError } from '../src/game/buildings.js';
import { NightThreatSystem,validNightThreatState,hasLocalWood } from '../src/systems/NightThreatSystem.js';
import { DayNightSystem } from '../src/systems/DayNightSystem.js';
import { LightFuelSystem } from '../src/systems/LightFuelSystem.js';
import { gameSettings } from '../src/systems/GameSettings.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
globalThis.document??={querySelector:()=>({textContent:''})};

function world(settings){
  const s=workerScene(undefined,{logistics:true,workplaces:true});for(const a of [...s.animalSystem.animals.values()])s.animalSystem.remove?.(a);
  s.bushes=new Map([['50,50',0]]);s.dayNight=new DayNightSystem(s);s.lightFuel=new LightFuelSystem(s);s.nightThreats=new NightThreatSystem(s,settings);
  const at=fraction=>{const g=s.gameTime,target=g.dayDuration*fraction;g.update(target>g.elapsed?target-g.elapsed:g.dayDuration-g.elapsed+target);s.nightThreats.update();};
  const error=(x,y)=>placementError(s.map,{x,y},{has:k=>s.resourceOccupancy.has(k),naturalContext:{mining:{placementError:()=>null,accessError:()=>null,canBuildOver:()=>false},scene:s}},[],s.objectRegistry.require('campfire'),s.buildings);
  return {s,n:s.nightThreats,at,error};
}

test('night threats are on by default; the New Game setup and Settings switch each one off', () => {
  assert.deepEqual(new NightThreatSystem({}).enabled,{wolves:true,thieves:true,fires:true});
  const settings=gameSettings({nightWolves:false});assert.equal(settings.nightWolves,false);assert.throws(()=>gameSettings({nightFires:'yes'}));
  const {n}=world(settings);assert.equal(n.enabled.wolves,false);n.setEnabled('fires',false);assert.deepEqual(n.enabled,{wolves:false,thieves:true,fires:false});
});

test('a campfire costs nothing from the stores but needs a tree or a bush within 6 tiles', () => {
  const {s,error}=world();assert.deepEqual(s.objectRegistry.require('campfire').cost,{});
  assert.equal(hasLocalWood(s,{x:54,y:50}),true);assert.equal(error(54,50),null);
  assert.equal(hasLocalWood(s,{x:70,y:70}),false);assert.match(error(70,70),/6/);
});

test('a campfire burns one night (at once if made at night), lies as ashes for a day and then goes', () => {
  const {s,n,at}=world();const soldier=s.workerSystem.create({x:52,y:51});
  at(.3);const fire=n.makeCampfire(soldier);assert.ok(fire,'made next to the soldier');assert.equal(s.lightFuel.isLit(fire),false,'by day it waits for the evening');
  at(s.dayNight.nightStart()+.02);assert.equal(s.lightFuel.isLit(fire),true,'burns at night');
  at(.3);assert.equal(s.lightFuel.isLit(fire),false);assert.equal(n.campfireAshes(fire),true,'ashes in the morning');
  at(.3);assert.equal(s.buildings.includes(fire),false,'gone a day later');
  at(s.dayNight.nightStart()+.05);const late=n.makeCampfire(soldier);assert.equal(s.lightFuel.isLit(late),true,'made at night: burns at once');
  s.bushes.clear();const far=s.workerSystem.create({x:80,y:80});assert.equal(n.makeCampfire(far),null,'no local wood');
});

test('save: threat switches and campfires (schema 57)', () => {
  const {s,n,at}=world();n.setEnabled('thieves',false);at(s.dayNight.nightStart()+.02);const fire=n.makeCampfire(s.workerSystem.create({x:52,y:51}));
  const state=validateGameState(serializeGameState(s));assert.deepEqual(state.nightThreats.enabled,{wolves:true,thieves:false,fires:true});assert.deepEqual(state.nightThreats.campfires.map(c=>c.id),[fire.id]);
  assert.equal(validNightThreatState({enabled:{wolves:true,thieves:true},campfires:[]},new Set()),false);
  const r=new NightThreatSystem({});r.importState(state.nightThreats);assert.equal(r.enabled.thieves,false);assert.equal(r.campfireBurning(fire),true);
});
