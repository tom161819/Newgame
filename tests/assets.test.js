import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectRegistry, objectRegistry } from '../src/systems/ObjectRegistry.js';
import { AssetManager, assetURL } from '../src/systems/AssetManager.js';
import { Inventory } from '../src/game/inventory.js';
import { placeBuilding, buildingTiles, towerNeighbors } from '../src/game/buildings.js';
import { ResourceSpawner, resourceCandidates, generateResourcePositions, tileKey } from '../src/game/stones.js';

const definition = (id, changes = {}) => ({ ...structuredClone(objectRegistry.require('stone')), id, ...changes });

test('registry exposes the existing game objects, categories and buildable menu', () => {
  assert.equal(objectRegistry.all().length, 48);
  assert.deepEqual(objectRegistry.buildables().map(d => d.id), ['tower','castle','wall','quarry','hunting_lodge','barracks','farmhouse','wheat_field','orchard','mill','bakery','granary','warehouse','lumberjack_hut','iron_mine','smelter']);
  assert.deepEqual(objectRegistry.byCategory('terrain').map(d => d.id), ['grass','dirt','grass_normal','grass_trampled_1','grass_trampled_2','grass_trampled_3']);
  assert.equal(objectRegistry.forGallery('all').length, 48);
  assert.equal(objectRegistry.forGallery('resource')[0].id, 'stone');
  assert.equal(objectRegistry.require('tower').cost.stone, 10);
  assert.equal(objectRegistry.get('missing'), null);
  assert.throws(() => objectRegistry.require('missing'), /Neznámý objekt/);
});

test('invalid or duplicate batches are rejected without partial registration', () => {
  const registry = new ObjectRegistry([definition('ore')]);
  assert.throws(() => registry.registerAll([definition('wood'), definition('ore')]), /Duplicitní/);
  assert.equal(registry.get('wood'), null);
  const invalid = [
    { name: '' }, { sprite: '/assets/../private.png' }, { sprite: 'https://example.com/a.png' },
    { width: 0 }, { height: 1.5 }, { walkable: 'true' }, { category: 'unknown' },
    { cost: {stone:-1} }, { interactions: ['collect','collect'] }, { buildable:true },
    { origin: {x:2,y:1} }, { origin: null }, { depth: false }, { visual: {displayWidth:-5} },
    { spritesheet:null }, { spawn:null }, { animations:null }, { consumption:{amount:1,interval:0} },
    { category:'animal',collectible:false }, { spawn: {initial:10,max:5,interval:20000} },
    { animations: {mode:'spritesheet',clips:[]} },
  ];
  for (const changes of invalid) {
    assert.throws(() => registry.register(definition('invalid', changes)), TypeError);
    assert.equal(registry.get('invalid'), null);
  }
});

test('definitions cannot be mutated behind game systems; subscribers can detach', () => {
  const original = definition('ore'), registry = new ObjectRegistry([original]);
  original.spawn.max = 1000;
  assert.equal(registry.require('ore').spawn.max, 80);
  assert.throws(() => { registry.require('ore').spawn.max = 4; }, TypeError);
  let changes = 0;
  const unsubscribe = registry.subscribe(() => changes++);
  registry.register(definition('wood'));unsubscribe();registry.register(definition('iron'));
  assert.equal(changes, 1);
});

test('a building added only as data uses its footprint, cost and navigation settings', () => {
  const registry = new ObjectRegistry(objectRegistry.all());
  const extra = registry.register({ ...structuredClone(registry.require('tower')),
    id:'test_lodge',width:3,height:1,cost:{stone:12},interactions:[],renderMode:'sprite',
  });
  assert.deepEqual(registry.buildables().map(d => d.id), ['tower','castle','wall','quarry','hunting_lodge','barracks','farmhouse','wheat_field','orchard','mill','bakery','granary','warehouse','lumberjack_hut','iron_mine','smelter','test_lodge']);
  const map = Array.from({length:8},()=>Array(8).fill(0)), inventory = new Inventory(), buildings = [];
  inventory.add('stone',11);
  const options = {map,inventory,buildings,resources:new Map(),anchor:{x:2,y:3},definition:extra};
  assert.ok(placeBuilding(options).error);
  assert.equal(inventory.count('stone'),11);assert.equal(buildings.length,0);
  inventory.add('stone',2);
  const {building} = placeBuilding(options);
  assert.equal(inventory.count('stone'),1);
  assert.deepEqual(building.tiles,[{x:2,y:3},{x:3,y:3},{x:4,y:3}]);
  assert.deepEqual(buildingTiles(building,extra),building.tiles);
  assert.equal(towerNeighbors(building).length,8);
  for(const tile of building.tiles)assert.equal(map[tile.y][tile.x],1);
  assert.ok(placeBuilding(options).error);
});

test('multi-resource payment is atomic', () => {
  const inventory = new Inventory();inventory.add('stone',20);inventory.add('wood',1);
  assert.equal(inventory.pay({stone:10,wood:2}),false);
  assert.equal(inventory.count('stone'),20);assert.equal(inventory.count('wood'),1);
  inventory.add('wood');assert.equal(inventory.pay({stone:10,wood:2}),true);
  assert.equal(inventory.count('stone'),10);assert.equal(inventory.count('wood'),0);
});

test('resource footprints avoid reserved and occupied tiles; each type has its own interval and cap', () => {
  const map = Array.from({length:6},()=>Array(6).fill(0));map[2][2]=1;
  const extra = definition('ore',{width:2,height:1,spawn:{initial:0,max:2,interval:1000}});
  const occupied = new Map([['3,3','3,3']]), reserved=[{x:1,y:1}];
  const candidates = resourceCandidates(map,[{x:0,y:0}],reserved,occupied,extra);
  assert.ok(candidates.length);
  for(const anchor of candidates)for(const tile of buildingTiles(anchor,extra)){
    assert.equal(map[tile.y][tile.x],0);assert.notEqual(tileKey(tile),'3,3');assert.notEqual(tileKey(tile),'1,1');
  }
  const positions=generateResourcePositions(map,{x:0,y:0},20,()=>0.5,occupied,extra);
  const cells=positions.flatMap(p=>buildingTiles(p,extra)).map(tileKey);
  assert.equal(new Set(cells).size,cells.length,'Even resources larger than one tile never overlap.');
  let count=0;
  const spawner = new ResourceSpawner({map,definition:extra,resources:occupied,
    getOrigins:()=>[{x:0,y:0}],getReserved:()=>reserved,getCount:()=>count,spawn:()=>count++,random:()=>0});
  spawner.update(999);assert.equal(count,0);
  spawner.update(1);assert.equal(count,1);
  spawner.update(1000);assert.equal(count,2);
  spawner.update(5000);assert.equal(count,2);
  count--;spawner.update(1000);assert.equal(count,2);
});

test('asset URLs retain the Pages prefix; PNG/WebP/sheets load once per object type', () => {
  assert.equal(assetURL('/assets/test.png','/Newgame/'),'/Newgame/assets/test.png');
  assert.equal(assetURL('/assets/test.webp','/Newgame'),'/Newgame/assets/test.webp');
  const registry = new ObjectRegistry(objectRegistry.all());
  registry.register(definition('animated',{category:'character',collectible:false,spawn:undefined,
    spritesheet:{frameWidth:32,frameHeight:48},renderMode:'sprite',stats:structuredClone(objectRegistry.require('king').stats)}));
  const calls=[], scene={load:{on(){},image(...args){calls.push(['image',...args]);},spritesheet(...args){calls.push(['sheet',...args]);}},textures:{exists:()=>false}};
  const manager = new AssetManager(scene,registry,{baseURL:'/Newgame/'});
  assert.equal(manager.queue(),49);assert.equal(manager.queue(),0);
  assert.equal(calls.length,49);
  assert.ok(calls.some(c=>c[2].endsWith('.webp')));
  assert.deepEqual(calls.find(c=>c[0]==='sheet'),['sheet','asset:animated:main','/Newgame/assets/resources/stone/stone.png',{frameWidth:32,frameHeight:48}]);
});
