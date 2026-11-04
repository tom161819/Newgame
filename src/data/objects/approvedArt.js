// Building art approved by the developer in Asset Studio (art/approvals.json).
// Values come from each export's metadata: origin = baseOrigin (the game anchors
// buildings at the footprint's front corner), visualHeight and gameLights.
// tests/asset-studio.test.js checks that files and numbers match the export.
// The procedural renderer stays as the fallback if an image cannot load.
export const APPROVED_BUILDING_ART=Object.freeze({
  farmhouse:{"sprite":"/assets/buildings/farmhouse/farmstead-thatched.v1.png","artSource":"art/sprites/farmstead/farmstead-thatched.v1.json","origin":{"x":0.49618,"y":0.98462},"visualHeight":128},
  granary:{"sprite":"/assets/buildings/granary/granary-store-raised.v1.png","artSource":"art/sprites/granary-store/granary-store-raised.v1.json","origin":{"x":0.49744,"y":0.98817},"visualHeight":167},
  bakery:{"sprite":"/assets/buildings/bakery/bakery-house-yard-oven.v1.png","artSource":"art/sprites/bakery-house/bakery-house-yard-oven.v1.json","origin":{"x":0.49618,"y":0.98551},"visualHeight":136},
  mill:{"sprite":"/assets/buildings/mill/windmill-tower.v1.png","artSource":"art/sprites/windmill/windmill-tower.v1.json","origin":{"x":0.49618,"y":0.9845},"visualHeight":127},
  warehouse:{"sprite":"/assets/buildings/warehouse/warehouse-store-stone.v1.png","artSource":"art/sprites/warehouse-store/warehouse-store-stone.v1.json","origin":{"x":0.49744,"y":0.98802},"visualHeight":165},
  hunting_lodge:{"sprite":"/assets/buildings/hunting_lodge/hunting-lodge-log.v1.png","artSource":"art/sprites/hunting-lodge/hunting-lodge-log.v1.json","origin":{"x":0.49618,"y":0.98425},"visualHeight":125},
  lumberjack_hut:{"sprite":"/assets/buildings/lumberjack_hut/lumber-camp-hut.v1.png","artSource":"art/sprites/lumber-camp/lumber-camp-hut.v1.json","origin":{"x":0.49618,"y":0.98319},"visualHeight":117},
  quarry:{"sprite":"/assets/buildings/quarry/quarry-pit.v1.png","artSource":"art/sprites/quarry/quarry-pit.v1.json","origin":{"x":0.49744,"y":0.98551},"visualHeight":136},
  smelter:{"sprite":"/assets/buildings/smelter/smelter-bloomery.v1.png","artSource":"art/sprites/smelter/smelter-bloomery.v1.json","origin":{"x":0.49744,"y":0.98413},"visualHeight":124,"lights":[{"type":"brazier","x":0,"y":-31.68,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},
});

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
export const TIMBER_SCAFFOLD_BUILDINGS=Object.freeze(['farmhouse','granary','hunting_lodge','lumberjack_hut']);

// Approved villager looks (art/sprites/<profession>/<variant>.v1.facing-<k>.png,
// eight walking directions, origin = the studio anchor at the figure's feet).
// Studio facing k: 0 faces the viewer (game SE), then turns towards screen right.
export const APPROVED_VILLAGER_ART=Object.freeze({
  'villager-male':{base:'/assets/characters/villagers/villager-male.v1',artSource:'art/sprites/villager/villager-male.v1.json',origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'villager-female':{base:'/assets/characters/villagers/villager-female.v1',artSource:'art/sprites/villager/villager-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'woodcutter-male':{base:'/assets/characters/villagers/woodcutter-male.v1',artSource:'art/sprites/woodcutter/woodcutter-male.v1.json',origins:[{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.72308}]},
  'woodcutter-female':{base:'/assets/characters/villagers/woodcutter-female.v1',artSource:'art/sprites/woodcutter/woodcutter-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'miner-male':{base:'/assets/characters/villagers/miner-male.v1',artSource:'art/sprites/miner/miner-male.v1.json',origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'miner-female':{base:'/assets/characters/villagers/miner-female.v1',artSource:'art/sprites/miner/miner-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'hunter-male':{base:'/assets/characters/villagers/hunter-male.v1',artSource:'art/sprites/hunter/hunter-male.v1.json',origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'hunter-female':{base:'/assets/characters/villagers/hunter-female.v1',artSource:'art/sprites/hunter/hunter-female.v1.json',origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.71429}]},
  'builder-male':{base:'/assets/characters/villagers/builder-male.v1',artSource:'art/sprites/builder/builder-male.v1.json',origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'builder-female':{base:'/assets/characters/villagers/builder-female.v1',artSource:'art/sprites/builder/builder-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'farmer-male':{base:'/assets/characters/villagers/farmer-male.v1',artSource:'art/sprites/farmer/farmer-male.v1.json',origins:[{"x":0.49254,"y":0.74648},{"x":0.49254,"y":0.75676},{"x":0.49254,"y":0.76316},{"x":0.49254,"y":0.76316},{"x":0.49254,"y":0.75676},{"x":0.49254,"y":0.74286},{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.73529}]},
  'farmer-female':{base:'/assets/characters/villagers/farmer-female.v1',artSource:'art/sprites/farmer/farmer-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'miller-male':{base:'/assets/characters/villagers/miller-male.v1',artSource:'art/sprites/miller/miller-male.v1.json',origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'miller-female':{base:'/assets/characters/villagers/miller-female.v1',artSource:'art/sprites/miller/miller-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'baker-male':{base:'/assets/characters/villagers/baker-male.v1',artSource:'art/sprites/baker/baker-male.v1.json',origins:[{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.73913},{"x":0.49254,"y":0.74286},{"x":0.49254,"y":0.74648},{"x":0.49254,"y":0.73529},{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.73134}]},
  'baker-female':{base:'/assets/characters/villagers/baker-female.v1',artSource:'art/sprites/baker/baker-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'hauler-male':{base:'/assets/characters/villagers/hauler-male.v1',artSource:'art/sprites/hauler/hauler-male.v1.json',origins:[{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.72308}]},
  'hauler-female':{base:'/assets/characters/villagers/hauler-female.v1',artSource:'art/sprites/hauler/hauler-female.v1.json',origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'soldier-male':{base:'/assets/characters/villagers/soldier-male.v1',artSource:'art/sprites/soldier/soldier-male.v1.json',origins:[{"x":0.49254,"y":0.75676},{"x":0.49254,"y":0.77215},{"x":0.49254,"y":0.77778},{"x":0.49254,"y":0.775},{"x":0.49254,"y":0.76623},{"x":0.49254,"y":0.75342},{"x":0.49254,"y":0.74648},{"x":0.49254,"y":0.74648}]},
});
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
});
// Villagers carry Czech given names; the game stores no sex, so the look follows the name.
const FEMALE_NAMES=new Set(['Anna','Eliška','Marie','Tereza','Klára']);
export function villagerSex(name=''){const first=String(name).split(' ')[0];return FEMALE_NAMES.has(first)||/a$/i.test(first)?'female':'male';}

export function withApprovedArt(definition){
  const building=APPROVED_BUILDING_ART[definition.id],tree=APPROVED_TREE_ART[definition.id];
  if(building)return{...definition,...structuredClone(building),renderMode:'sprite'};
  if(tree)return{...definition,artSprites:structuredClone(tree)};
  return definition;
}
