// Building art approved by the developer in Asset Studio (art/approvals.json).
// Values come from each export's metadata: origin = baseOrigin (the game anchors
// buildings at the footprint's front corner), visualHeight and gameLights.
// tests/asset-studio.test.js checks that files and numbers match the export.
// The procedural renderer stays as the fallback if an image cannot load.
export const APPROVED_BUILDING_ART=Object.freeze({
  // Owner 9 Nov 2026 ("proč není ve hře úprava dočasného skladiště?"): approved 7 Nov (plan g-docasny-sklad), wired in now.
  starter_stockpile:{"sprite":"/assets/buildings/starter_stockpile/starter-stockpile-tarp-camp.v1.png","artSource":"art/sprites/starter-stockpile/starter-stockpile-tarp-camp.v1.json","origin":{"x":0.49618,"y":0.97561},"visualHeight":80,"lights":[{"type":"torch","x":-46.4,"y":-55.89,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  house:{"sprite":"/assets/buildings/house/house-timber.v3.png","artSource":"art/sprites/house/house-timber.v3.json","origin":{"x":0.49618,"y":0.98601},"visualHeight":141},
  swordsmith:{"sprite":"/assets/buildings/swordsmith/swordsmith-stone.v1.png","artSource":"art/sprites/swordsmith/swordsmith-stone.v1.json","origin":{"x":0.49618,"y":0.98473},"visualHeight":129,"lights":[{"type":"brazier","x":6.4,"y":-34.09,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},
  farmhouse:{"sprite":"/assets/buildings/farmhouse/farmstead-thatched.v2.png","artSource":"art/sprites/farmstead/farmstead-thatched.v2.json","origin":{"x":0.49744,"y":0.98765},"visualHeight":160,"lights":[{"type":"torch","x":-14.11,"y":-95.82,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  granary:{"sprite":"/assets/buildings/granary/granary-store-raised.v1.png","artSource":"art/sprites/granary-store/granary-store-raised.v1.json","origin":{"x":0.49744,"y":0.98817},"visualHeight":167},
  bakery:{"sprite":"/assets/buildings/bakery/bakery-house-yard-oven.v3.png","artSource":"art/sprites/bakery-house/bakery-house-yard-oven.v3.json","origin":{"x":0.59509,"y":0.98639},"visualHeight":145,"lights":[{"type":"brazier","x":16.61,"y":-36.77,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},
  mill:{"sprite":"/assets/buildings/mill/windmill-tower.v1.png","artSource":"art/sprites/windmill/windmill-tower.v1.json","origin":{"x":0.49618,"y":0.9845},"visualHeight":127,"rotor":{"still":"/assets/buildings/mill/windmill-tower.v1.still.png","sprite":"/assets/buildings/mill/windmill-tower.v1.rotor.png","pivot":{"x":0,"y":-86},"origin":{"x":0.49618,"y":0.31783}}},
  warehouse:{"sprite":"/assets/buildings/warehouse/warehouse-store-stone.v1.png","artSource":"art/sprites/warehouse-store/warehouse-store-stone.v1.json","origin":{"x":0.49744,"y":0.98802},"visualHeight":165},
  hunting_lodge:{"sprite":"/assets/buildings/hunting_lodge/hunting-lodge-log.v1.png","artSource":"art/sprites/hunting-lodge/hunting-lodge-log.v1.json","origin":{"x":0.49618,"y":0.98425},"visualHeight":125},
  lumberjack_hut:{"sprite":"/assets/buildings/lumberjack_hut/lumber-camp-hut.v1.png","artSource":"art/sprites/lumber-camp/lumber-camp-hut.v1.json","origin":{"x":0.49618,"y":0.98319},"visualHeight":117},
  quarry:{"sprite":"/assets/buildings/quarry/quarry-pit.v1.png","artSource":"art/sprites/quarry/quarry-pit.v1.json","origin":{"x":0.49744,"y":0.98551},"visualHeight":136},
  builder_workshop:{"sprite":"/assets/buildings/builder_workshop/builders-workshop-material-yard.v4.png","artSource":"art/sprites/builders-workshop/builders-workshop-material-yard.v4.json","origin":{"x":0.49744,"y":0.98361},"visualHeight":120},
  smelter:{"sprite":"/assets/buildings/smelter/smelter-bloomery.v1.png","artSource":"art/sprites/smelter/smelter-bloomery.v1.json","origin":{"x":0.49744,"y":0.98413},"visualHeight":124,"lights":[{"type":"brazier","x":0,"y":-31.68,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},

  iron_mine:{"sprite":"/assets/buildings/iron_mine/iron-mine-adit.v2.png","artSource":"art/sprites/iron-mine/iron-mine-adit.v2.json","origin":{"x":0.49744,"y":0.98333},"visualHeight":118,"lights":[{"type":"torch","x":-1.71,"y":-60.61,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  barracks:{"sprite":"/assets/buildings/barracks/barracks-hall-stone.v1.png","artSource":"art/sprites/barracks-hall/barracks-hall-stone.v1.json","origin":{"x":0.49744,"y":0.9878},"visualHeight":162},
  marketplace:{"sprite":"/assets/buildings/marketplace/marketplace-square.v1.png","artSource":"art/sprites/marketplace/marketplace-square.v1.json","origin":{"x":0.49744,"y":0.98276},"visualHeight":114},
  wheelwright_workshop:{"sprite":"/assets/buildings/wheelwright_workshop/wheelwright-yard-shed.v2.png","artSource":"art/sprites/wheelwright-yard/wheelwright-yard-shed.v2.json","origin":{"x":0.47549,"y":0.98437},"visualHeight":126,"lights":[{"type":"torch","x":23.04,"y":-84.25,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  // m-svet-vzhled-2 (32): the stilt hut with the net loft (v2, 2 × 2 like the game); no lights, no seasonal exports.
  fisherman_hut:{"sprite":"/assets/buildings/fisherman_hut/fisherman-hut-stilt-net-loft.v2.png","artSource":"art/sprites/fisherman-hut/fisherman-hut-stilt-net-loft.v2.json","origin":{"x":0.49618,"y":0.984},"visualHeight":123},
});

// The merchant caravan styles (plain, striped, house, pair) are generated with the other approved art of plan
// m-nasadit-schvalenou-grafiku: APPROVED_DEPLOY_ART.caravan in approvedDeployArt.js.

// Approved tree art by growth look and season (origin = the studio anchor, the
// tile centre where trees stand). TreeView picks one per stage, season and tile;
// stumps and saplings, and young oaks in autumn and winter, stay procedural.
export const APPROVED_TREE_ART=Object.freeze({
  oak_tree:{mature:{sprite:'/assets/resources/oak_tree/art/oak-tree-mature.v1.png',artSource:'art/sprites/oak-tree/oak-tree-mature.v1.json',origin:{"x":0.4125,"y":0.85}},broad:{sprite:'/assets/resources/oak_tree/art/oak-tree-broad.v1.png',artSource:'art/sprites/oak-tree/oak-tree-broad.v1.json',origin:{"x":0.42308,"y":0.82692}},young:{sprite:'/assets/resources/oak_tree/art/oak-tree-young.v1.png',artSource:'art/sprites/oak-tree/oak-tree-young.v1.json',origin:{"x":0.49254,"y":0.77215}},spring:{sprite:'/assets/resources/oak_tree/art/oak-seasons-spring.v1.png',artSource:'art/sprites/oak-seasons/oak-seasons-spring.v1.json',origin:{"x":0.4125,"y":0.85}},autumn:{sprite:'/assets/resources/oak_tree/art/oak-seasons-autumn.v1.png',artSource:'art/sprites/oak-seasons/oak-seasons-autumn.v1.json',origin:{"x":0.4125,"y":0.85}},winter:{sprite:'/assets/resources/oak_tree/art/oak-seasons-winter.v1.png',artSource:'art/sprites/oak-seasons/oak-seasons-winter.v1.json',origin:{"x":0.3908,"y":0.84483}}},
  pine_tree:{mature:{sprite:'/assets/resources/pine_tree/art/pine-tree-mature.v1.png',artSource:'art/sprites/pine-tree/pine-tree-mature.v1.json',origin:{"x":0.44595,"y":0.87838}},young:{sprite:'/assets/resources/pine_tree/art/pine-tree-young.v1.png',artSource:'art/sprites/pine-tree/pine-tree-young.v1.json',origin:{"x":0.49254,"y":0.80645}},winter:{sprite:'/assets/resources/pine_tree/art/pine-seasons-winter.v1.png',artSource:'art/sprites/pine-seasons/pine-seasons-winter.v1.json',origin:{"x":0.44595,"y":0.87919}}},
});

// Approved scaffold art by construction stage (drawn for a 2 × 2 site, scaled to
// the site's width, anchored at the front corner like buildings). Wooden
// buildings show the timber-frame variant in the middle stage.
export const APPROVED_SCAFFOLD_ART=Object.freeze({
  low:{sprite:'/assets/buildings/scaffold/scaffold-low.v1.png',artSource:'art/sprites/scaffold/scaffold-low.v1.json',origin:{"x":0.47101,"y":0.98261},visualHeight:113},
  mid:{sprite:'/assets/buildings/scaffold/scaffold-mid.v1.png',artSource:'art/sprites/scaffold/scaffold-mid.v1.json',origin:{"x":0.44218,"y":0.9863},visualHeight:144},
  high:{sprite:'/assets/buildings/scaffold/scaffold-high.v1.png',artSource:'art/sprites/scaffold/scaffold-high.v1.json',origin:{"x":0.41667,"y":0.98876},visualHeight:176},
  timber:{sprite:'/assets/buildings/scaffold/scaffold-timber.v1.png',artSource:'art/sprites/scaffold/scaffold-timber.v1.json',origin:{"x":0.44218,"y":0.98639},visualHeight:145},
});
// Approved wall kit for the connected 1 × 1 wall: one block at the wall-walk
// height and one parapet per open side (N = grid y−1, E = x+1, S = y+1, W = x−1),
// all anchored at the tile's front corner like buildings.
export const APPROVED_WALL_ART=Object.freeze({
  block:{sprite:'/assets/buildings/wall/kit/wall-kit-block.v1.png',artSource:'art/sprites/wall-kit/wall-kit-block.v1.json',origin:{"x":0.38824,"y":0.98058}},
  N:{sprite:'/assets/buildings/wall/kit/wall-kit-parapet-n.v1.png',artSource:'art/sprites/wall-kit/wall-kit-parapet-n.v1.json',origin:{"x":0.38372,"y":0.98261}},
  E:{sprite:'/assets/buildings/wall/kit/wall-kit-parapet-e.v1.png',artSource:'art/sprites/wall-kit/wall-kit-parapet-e.v1.json',origin:{"x":0.38372,"y":0.9802}},
  S:{sprite:'/assets/buildings/wall/kit/wall-kit-parapet-s.v1.png',artSource:'art/sprites/wall-kit/wall-kit-parapet-s.v1.json',origin:{"x":0.49254,"y":0.9802}},
  W:{sprite:'/assets/buildings/wall/kit/wall-kit-parapet-w.v1.png',artSource:'art/sprites/wall-kit/wall-kit-parapet-w.v1.json',origin:{"x":0.49254,"y":0.98261}},
});
export const TIMBER_SCAFFOLD_BUILDINGS=Object.freeze(['farmhouse','granary','hunting_lodge','lumberjack_hut','fisherman_hut']);

// Approved villager looks (art/sprites/<profession>/<variant>.v1.facing-<k>.png,
// eight walking directions, origin = the studio anchor at the figure's feet).
// Studio facing k: 0 faces the viewer (game SE), then turns towards screen right.
// walk: <base>.walk.png, 8 rows (facing k) x 3 columns (idle, stride-a, stride-b) on one feet anchor; walking plays
// WALK_CYCLE at fps, standing shows the idle column.
export const APPROVED_VILLAGER_ART=Object.freeze({
  'villager-male':{base:'/assets/characters/villagers/villager-male.v1',artSource:'art/sprites/villager/villager-male.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x":0.49254,"y":0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'villager-female':{base:'/assets/characters/villagers/villager-female.v1',artSource:'art/sprites/villager/villager-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'woodcutter-male':{base:'/assets/characters/villagers/woodcutter-male.v1',artSource:'art/sprites/woodcutter/woodcutter-male.v1.json',walk:{frameWidth:67,frameHeight:66,origin:{"x":0.49254,"y":0.72727},fps:6},origins:[{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.72308}]},
  'woodcutter-female':{base:'/assets/characters/villagers/woodcutter-female.v1',artSource:'art/sprites/woodcutter/woodcutter-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'miner-male':{base:'/assets/characters/villagers/miner-male.v1',artSource:'art/sprites/miner/miner-male.v1.json',walk:{frameWidth:67,frameHeight:64,origin:{"x":0.49254,"y":0.71875},fps:6},origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'miner-female':{base:'/assets/characters/villagers/miner-female.v1',artSource:'art/sprites/miner/miner-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'hunter-male':{base:'/assets/characters/villagers/hunter-male.v1',artSource:'art/sprites/hunter/hunter-male.v1.json',walk:{frameWidth:67,frameHeight:64,origin:{"x":0.49254,"y":0.71875},fps:6},origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'hunter-female':{base:'/assets/characters/villagers/hunter-female.v1',artSource:'art/sprites/hunter/hunter-female.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x":0.49254,"y":0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.71429}]},
  'builder-male':{base:'/assets/characters/villagers/builder-male.v1',artSource:'art/sprites/builder/builder-male.v1.json',walk:{frameWidth:67,frameHeight:64,origin:{"x":0.49254,"y":0.71875},fps:6},origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'builder-female':{base:'/assets/characters/villagers/builder-female.v1',artSource:'art/sprites/builder/builder-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'farmer-male':{base:'/assets/characters/villagers/farmer-male.v1',artSource:'art/sprites/farmer/farmer-male.v1.json',walk:{frameWidth:67,frameHeight:76,origin:{"x":0.49254,"y":0.76316},fps:6},origins:[{"x":0.49254,"y":0.74648},{"x":0.49254,"y":0.75676},{"x":0.49254,"y":0.76316},{"x":0.49254,"y":0.76316},{"x":0.49254,"y":0.75676},{"x":0.49254,"y":0.74286},{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.73529}]},
  'farmer-female':{base:'/assets/characters/villagers/farmer-female.v1',artSource:'art/sprites/farmer/farmer-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'miller-male':{base:'/assets/characters/villagers/miller-male.v1',artSource:'art/sprites/miller/miller-male.v1.json',walk:{frameWidth:67,frameHeight:64,origin:{"x":0.49254,"y":0.71875},fps:6},origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'miller-female':{base:'/assets/characters/villagers/miller-female.v1',artSource:'art/sprites/miller/miller-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'baker-male':{base:'/assets/characters/villagers/baker-male.v1',artSource:'art/sprites/baker/baker-male.v1.json',walk:{frameWidth:67,frameHeight:71,origin:{"x":0.49254,"y":0.74648},fps:6},origins:[{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.73913},{"x":0.49254,"y":0.74286},{"x":0.49254,"y":0.74648},{"x":0.49254,"y":0.73529},{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.73134}]},
  'baker-female':{base:'/assets/characters/villagers/baker-female.v1',artSource:'art/sprites/baker/baker-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'hauler-male':{base:'/assets/characters/villagers/hauler-male.v1',artSource:'art/sprites/hauler/hauler-male.v1.json',walk:{frameWidth:67,frameHeight:66,origin:{"x":0.49254,"y":0.72727},fps:6},origins:[{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.72308}]},
  'hauler-female':{base:'/assets/characters/villagers/hauler-female.v1',artSource:'art/sprites/hauler/hauler-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x":0.49254,"y":0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'soldier-male':{base:'/assets/characters/villagers/soldier-male.v1',artSource:'art/sprites/soldier/soldier-male.v1.json',walk:{frameWidth:67,frameHeight:81,origin:{"x":0.49254,"y":0.77778},fps:6},origins:[{"x":0.49254,"y":0.75676},{"x":0.49254,"y":0.77215},{"x":0.49254,"y":0.77778},{"x":0.49254,"y":0.775},{"x":0.49254,"y":0.76623},{"x":0.49254,"y":0.75342},{"x":0.49254,"y":0.74648},{"x":0.49254,"y":0.74648}]},
});
export const WALK_COLUMNS=Object.freeze(['idle','stride-a','stride-b']);
export const WALK_CYCLE=Object.freeze([0,1,0,2]);
// The walk-sheet frame for a facing and the time spent walking (ms); standing is the idle column.
export function walkFrame(k,walkedMs,fps,moving){return k*WALK_COLUMNS.length+(moving?WALK_CYCLE[Math.floor(walkedMs*fps/1000)%WALK_CYCLE.length]:0);}
export const walkKey=look=>`villager-walk:${look}`;
// A look whose walk sheet has loaded walks frame by frame; without one (missing or failed file) it keeps the facing image.
export function hasWalk(scene,look){return !!APPROVED_VILLAGER_ART[look]?.walk&&!!scene?.textures?.exists?.(walkKey(look));}
export const FACING_INDEX=Object.freeze({SE:0,E:1,NE:2,N:3,NW:4,W:5,SW:6,S:7});
// Profession -> look per sex. Soldiers have one approved look; smelter operators
// wear the miner's leather apron until they get their own design.
export const PROFESSION_LOOKS=Object.freeze({
  idle:{male:'villager-male',female:'villager-female'},woodcutter:{male:'woodcutter-male',female:'woodcutter-female'},
  miner:{male:'miner-male',female:'miner-female'},hunter:{male:'hunter-male',female:'hunter-female'},
  builder:{male:'builder-male',female:'builder-female'},farmer:{male:'farmer-male',female:'farmer-female'},
  miller:{male:'miller-male',female:'miller-female'},baker:{male:'baker-male',female:'baker-female'},
  hauler:{male:'hauler-male',female:'hauler-female'},soldier:{male:'soldier-male',female:'soldier-male'},
  smelter_operator:{male:'miner-male',female:'miner-female'},
  // Day and night N2: Pitch Makers wear the woodcutter's look until they get their own design.
  pitch_maker:{male:'woodcutter-male',female:'woodcutter-female'},
});
// Villagers carry Czech given names; the game stores no sex, so the look follows the name.
const FEMALE_NAMES=new Set(['Anna','Eliška','Marie','Tereza','Klára']);
export function villagerSex(name=''){const first=String(name).split(' ')[0];return FEMALE_NAMES.has(first)||/a$/i.test(first)?'female':'male';}

export function withApprovedArt(definition){
  const building=APPROVED_BUILDING_ART[definition.id],tree=APPROVED_TREE_ART[definition.id];
  // m-svet-vzhled-2 (35): Studio exports are drawn at game scale (scale 1), so a placeholder's displayWidth/Height
  // must not stretch them (the Marketplace and Smelter PNGs were pulled up off their footprint).
  if(building){const {displayWidth,displayHeight,...visual}=definition.visual??{},rest={...definition,...structuredClone(building),renderMode:'sprite'};
    if(definition.visual)rest.visual=visual;return rest;}
  if(tree)return{...definition,artSprites:structuredClone(tree)};
  return definition;
}
