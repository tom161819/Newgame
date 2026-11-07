import test from 'node:test';
import assert from 'node:assert/strict';
import { workerScene } from './helpers/workerScene.js';
import { gameSettings,DEFAULT_GAME_SETTINGS,NEW_GAME_DEFAULTS,STARTING_RESOURCES,STARTING_RESOURCE_CAPACITY,resourceSpawnSettings } from '../src/systems/GameSettings.js';
import { GOLD_LIMIT } from '../src/data/economy.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { serializeGameState,validateGameState } from '../src/systems/GameStateSerializer.js';
import { loadGameState } from '../src/systems/GameStateLoader.js';
globalThis.document={querySelector:()=>({textContent:''})};

// N04 (#35): starting physical resources under Starting Gold, placed once in the Starter Stockpile.
const scene=settings=>workerScene(undefined,{construction:true,logistics:true,gameSettings:gameSettings(settings)});
const starter=s=>s.foodStorage.locations.get(`stockpile-${s.buildings.find(b=>b.type==='starter_stockpile').id}`);
const total=(s,id)=>s.foodStorage.resourceBreakdown().find(r=>r.resource===id)?.total??0;

test('defaults add nothing: the start economy and the empty Starter Stockpile stay as before',()=>{
  assert.deepEqual(Object.keys(STARTING_RESOURCES),['startingStone','startingWood','startingIronOre','startingBread']);
  for(const key of Object.keys(STARTING_RESOURCES))assert.equal(DEFAULT_GAME_SETTINGS[key],0);
  assert.equal(STARTING_RESOURCE_CAPACITY,160,'owner request 7 Nov 2026: the Starter Stockpile holds 160');
  const s=scene();assert.deepEqual(starter(s).stock,{});for(const id of Object.values(STARTING_RESOURCES))assert.equal(total(s,id),0);
});
test('settings accept 5-unit steps up to a combined 160 and reject anything else',()=>{
  assert.equal(gameSettings({startingStone:10,startingWood:15,startingIronOre:5,startingBread:10}).startingBread,10);
  assert.equal(gameSettings({startingStone:160}).startingStone,160);
  assert.equal(gameSettings({startingStone:40,startingWood:40,startingIronOre:40,startingBread:40}).startingBread,40);
  for(const bad of [{startingStone:-5},{startingWood:3},{startingIronOre:165},{startingBread:'10'},{startingStone:100,startingWood:65},{startingStone:40,startingWood:40,startingIronOre:40,startingBread:45}])assert.throws(()=>gameSettings(bad),JSON.stringify(bad));
});
test('the New Game Setup proposes a built Castle, 500 Gold, 40 Stone, 60 Wood, 40 Bread and no Iron Ore (owner 7 Nov 2026: basic buildings are wooden)',()=>{
  assert.equal(NEW_GAME_DEFAULTS.startingCastle,true);assert.equal(NEW_GAME_DEFAULTS.startingGold,500);assert.equal(GOLD_LIMIT,Infinity,'gold has no limit since 0.51');
  assert.deepEqual(Object.keys(STARTING_RESOURCES).map(key=>NEW_GAME_DEFAULTS[key]),[40,60,0,40]);
  assert.doesNotThrow(()=>gameSettings(NEW_GAME_DEFAULTS));
  const s=scene(NEW_GAME_DEFAULTS);assert.ok(s.buildings.some(b=>b.type==='castle'),'one built Castle');
  const stock=x=>Object.fromEntries(Object.entries(starter(x).stock).filter(([,n])=>n>0));assert.deepEqual(stock(s),{stone:40,wood:60,bread:40});assert.equal(s.foodStorage.room(starter(s).id),20,'140 of 160');
  const off=scene({...NEW_GAME_DEFAULTS,startingCastle:false});assert.equal(off.buildings.some(b=>b.type==='castle'),false,'the Castle can be switched off');
  assert.deepEqual(stock(off),{stone:40,wood:60,bread:40});
});
test('chosen goods are deposited physically exactly once and are separate from Initial Stones on the map',()=>{
  const settings={startingStone:10,startingWood:15,startingIronOre:5,startingBread:10,initialStoneCount:55},s=scene(settings);
  assert.deepEqual(starter(s).stock,{stone:10,wood:15,iron_ore:5,bread:10});assert.equal(s.foodStorage.room(starter(s).id),STARTING_RESOURCE_CAPACITY-40);
  for(const [key,id]of Object.entries(STARTING_RESOURCES))assert.equal(total(s,id),settings[key],id);
  assert.equal(s.inventory.count('stone'),10);assert.equal(s.foodStorage.reservations.size,0);
  const stone=objectRegistry.require('stone');assert.equal(resourceSpawnSettings(stone,gameSettings(settings)).initial,55,'loose map stones follow initialStoneCount only');
  assert.equal(resourceSpawnSettings(stone,gameSettings({...settings,startingStone:0})).initial,55);
  s.simulate(5000);assert.deepEqual(starter(s).stock,{stone:10,wood:15,iron_ore:5,bread:10},'no later re-deposit');
});
test('current-schema Save/Load keeps the settings and the stock without depositing again',()=>{
  const s=scene({startingStone:20,startingBread:20}),data=serializeGameState(s);validateGameState(data);
  assert.equal(data.gameSettings.startingStone,20);
  const r=workerScene(undefined,{construction:true,logistics:true,starter:false,gameSettings:gameSettings(data.gameSettings)});loadGameState(r,data);
  assert.deepEqual(starter(r).stock,{stone:20,bread:20});assert.equal(total(r,'stone'),20);assert.deepEqual(serializeGameState(r),data);
  const bad=structuredClone(data);bad.gameSettings.startingWood=125;assert.throws(()=>validateGameState(bad),'a save whose start settings overflow the stockpile is rejected');
});
test('a new game with the same settings starts its own stockpile from scratch',()=>{
  const a=scene({startingWood:20}),b=scene({startingWood:20});assert.deepEqual(starter(a).stock,{wood:20});assert.deepEqual(starter(b).stock,{wood:20});
});
