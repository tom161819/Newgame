import test from 'node:test';
import assert from 'node:assert/strict';
import { ObjectRegistry, objectRegistry } from '../src/systems/ObjectRegistry.js';
import { AssetManager, assetURL } from '../src/systems/AssetManager.js';
import { Inventory } from '../src/game/inventory.js';
import { placeBuilding, buildingTiles, towerNeighbors } from '../src/game/buildings.js';
import { ResourceSpawner, resourceCandidates, generateResourcePositions, tileKey } from '../src/game/stones.js';

const definition = (id, changes = {}) => ({ ...structuredClone(objectRegistry.require('stone')), id, ...changes });

test('registry exposes the existing game objects, categories and buildable menu', () => {
  assert.equal(objectRegistry.all().length, 104); // +1: Fountain (owner 14 Nov 2026) // +1: Gate 2×2 (m-brana-2x2) // +2: Large Stone and Iron Deposits (velke-prirodni-objekty) // +1: Material Yard (m-sklady-materialu-koncept) // -1 in 0.51.0: Iron Bar merged into Iron // +1 in 0.46.0: Burnt Ruins (N3) // +1 in 0.44.0: Wolf (N3) // +1 in 0.43.0: Campfire (N3) // +4 in 0.42.0: Pitch, Torch, Pitch Kiln, Torch Post (N2) // +9 in 0.40.0: workplace porches (#98) // +3 in 0.39.0: Swing Tree, Haystack, Well (children D2) // +1 in 0.29.0: Village Green (children D1) // +3 in 0.24.0: ford, mud and pebbly banks (World v2) // +1 in 0.16.0: trodden grass (wear level 1, #116) // +2 in 0.15.0: Fisherman's Hut and Fish // +8 in 0.14.0 (#100): four ground types and four bushes
  assert.deepEqual(objectRegistry.buildables().map(d => d.id), ['tower','castle','wall','gate','builder_workshop','quarry','hunting_lodge','fisherman_hut','barracks','farmhouse','wheat_field','orchard','mill','bakery','granary','warehouse','material_yard','marketplace','house','village_green','swing_tree','haystack','well','fountain','stone_pavement','stables','wheelwright_workshop','lumberjack_hut','iron_mine','brazier','torch_post','campfire','smelter','pitch_kiln','bowyer','swordsmith','armorer','armory']);
  assert.deepEqual(objectRegistry.byCategory('terrain').map(d => d.id), ['grass','dirt','grass_normal','grass_trodden','grass_trampled_1','grass_trampled_2','grass_trampled_3','beach_sand','desert_sand','shallow_water','deep_water','ford_shallows','mud_bank','shore_rocks']);
  assert.equal(objectRegistry.forGallery('all').length, 104);
  assert.equal(objectRegistry.forGallery('resource')[0].id, 'stone');
  assert.equal(objectRegistry.require('tower').cost.stone, 20);
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
  assert.deepEqual(registry.buildables().map(d => d.id), ['tower','castle','wall','gate','builder_workshop','quarry','hunting_lodge','fisherman_hut','barracks','farmhouse','wheat_field','orchard','mill','bakery','granary','warehouse','material_yard','marketplace','house','village_green','swing_tree','haystack','well','fountain','stone_pavement','stables','wheelwright_workshop','lumberjack_hut','iron_mine','brazier','torch_post','campfire','smelter','pitch_kiln','bowyer','swordsmith','armorer','armory','test_lodge']);
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
  // 65 registered objects (the Marketplace from 0.9.5, the Gate from 0.11.1) + the animated test object, plus the tower's front layer, the four approved grass tiles
  // the nine approved tree looks (six oak, three pine) and twelve seasonal grass tiles (spring, autumn, winter).
  // #100 (0.14.0): +8 objects (four ground types, four bushes) and four tiles for each ground type: 94 + 8 + 16.
  // #118 (0.14.1): +1 Builder's Workshop.
  // Fishing R1 (0.15.0): +2 (Fisherman's Hut, Fish).
  assert.equal(manager.queue(),178);assert.equal(manager.queue(),0); // +1: Village Green render // +7: oak renders, 12 views instead of 5 looks (m-duby, 15 Nov 2026); +4: the four House looks (owner 13 Nov 2026)
  assert.equal(calls.length,178); // +1: Village Green render // +7: oak renders (m-duby) // +4: the four Castle levels // +1: Fountain // +2: large deposits (the deposit SVG of their family, no new file) // +1: Material Yard icon // -1: Iron Bar merged into Iron (0.51.0) // +1: Burnt Ruins (0.46.0) // +1: Wolf (0.44.0) // +1: Campfire icon (0.43.0) // +4: N2 icons and sprites (0.42.0) // +9: porch sprites (0.40.0) // +3: Swing Tree, Haystack and Well icons (0.39.0) // +1: the castle keep front layer (0.38.2) // +1: the Village Green sprite (children D1) // +15: three World v2 ground types, a main sprite and four variants each // +2: the Mill still body and sails layers (#99)
  assert.ok(calls.some(c=>c[2].endsWith('.webp')));
  assert.deepEqual(calls.find(c=>c[0]==='sheet'),['sheet','asset:animated:main','/Newgame/assets/resources/stone/stone.png',{frameWidth:32,frameHeight:48}]);
});

test('terrain tiles may list interchangeable sprite variants that load as extra layers; grass and the #100 ground types use them', () => {
  assert.deepEqual(objectRegistry.all().filter(d=>d.spriteVariants).map(d=>d.id),['grass_normal','beach_sand','desert_sand','shallow_water','deep_water','ford_shallows','mud_bank','shore_rocks'],'grass and the ground types are wired in');
  const grass=objectRegistry.require('grass_normal'),registry=new ObjectRegistry(objectRegistry.all().filter(d=>d.id!=='grass_normal'));
  registry.register({...grass,seasonVariants:undefined,spriteVariants:['/assets/terrain/path_wear/a.png','/assets/terrain/path_wear/b.png']});
  const calls=[],scene={load:{on(){},image(...args){calls.push(args);},spritesheet(){}},textures:{exists:()=>false}};
  new AssetManager(scene,registry,{baseURL:'/Newgame/'}).queue([registry.require('grass_normal')]);
  assert.deepEqual(calls.map(c=>c[0]),['asset:grass_normal:main','asset:grass_normal:variant-0','asset:grass_normal:variant-1']);
  assert.throws(()=>new ObjectRegistry([...objectRegistry.all().filter(d=>d.id!=='grass_normal'),{...grass,spriteVariants:['../x.png']}]),/varianty terénní/);
  assert.throws(()=>new ObjectRegistry([...objectRegistry.all().filter(d=>d.id!=='tower'),{...objectRegistry.require('tower'),spriteVariants:['/assets/a.png']}]),/varianty terénní/);
  assert.deepEqual(Object.keys(grass.seasonVariants).sort(),['Autumn','Spring','Winter'],'approved seasonal grass (summer = the lush set)');
  assert.throws(()=>new ObjectRegistry([...objectRegistry.all().filter(d=>d.id!=='grass_normal'),{...grass,seasonVariants:{Monsoon:['/assets/a.png']}}]),/sezónní varianty/);
});
