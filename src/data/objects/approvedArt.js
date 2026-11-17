import { SOLDIER_ANIM_LOOKS } from '../soldierAnimArt.js';
// Building art approved by the developer in Asset Studio (art/approvals.json).
// Values come from each export's metadata: origin = baseOrigin (the game anchors
// buildings at the footprint's front corner), visualHeight and gameLights.
// tests/asset-studio.test.js checks that files and numbers match the export.
// The procedural renderer stays as the fallback if an image cannot load.
export const APPROVED_BUILDING_ART=Object.freeze({
  // Owner 14 Nov 2026 (Mechaniky chat): renders of the Well (1 × 1) and the new Fountain (2 × 2), the dirt patch cut away.
  well:{"sprite":"/assets/buildings/well/well-render-0.v2.png","artSource":"art/sprites/well/well-render-0.v2.json","origin":{"x":0.49315,"y":0.97647},"visualHeight":83},
  fountain:{"sprite":"/assets/buildings/fountain/fountain-render-0.v2.png","artSource":"art/sprites/fountain/fountain-render-0.v2.json","origin":{"x":0.5,"y":0.98824},"visualHeight":84},
  // Owner 9 Nov 2026 ("proč není ve hře úprava dočasného skladiště?"): approved 7 Nov (plan g-docasny-sklad), wired in now.
  starter_stockpile:{"sprite":"/assets/buildings/starter_stockpile/starter-stockpile-tarp-camp.v1.png","artSource":"art/sprites/starter-stockpile/starter-stockpile-tarp-camp.v1.json","origin":{"x":0.49618,"y":0.97561},"visualHeight":80,"lights":[{"type":"torch","x":-46.4,"y":-55.89,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  // Owner 13 Nov 2026: four GPT cottage looks; each new House takes the next look (placeBuilding, building.look).
  house:{"sprite":"/assets/buildings/house/house-gpt-bench-0.v1.png","artSource":"art/sprites/house/house-gpt-bench-0.v1.json","origin":{"x":0.48889,"y":0.94079},"visualHeight":143,"artSprites":{"bench":{"sprite":"/assets/buildings/house/house-gpt-bench-0.v1.png","artSource":"art/sprites/house/house-gpt-bench-0.v1.json","origin":{"x":0.48889,"y":0.94079},"visualHeight":143},"woodshed":{"sprite":"/assets/buildings/house/house-gpt-woodshed-0.v1.png","artSource":"art/sprites/house/house-gpt-woodshed-0.v1.json","origin":{"x":0.45139,"y":0.97351},"visualHeight":147},"porch":{"sprite":"/assets/buildings/house/house-gpt-porch-0.v1.png","artSource":"art/sprites/house/house-gpt-porch-0.v1.json","origin":{"x":0.5,"y":0.94737},"visualHeight":144},"garden":{"sprite":"/assets/buildings/house/house-gpt-garden-0.v1.png","artSource":"art/sprites/house/house-gpt-garden-0.v1.json","origin":{"x":0.45139,"y":0.95425},"visualHeight":146}},"artLooks":["bench","woodshed","porch","garden"]},
  swordsmith:{"sprite":"/assets/buildings/swordsmith/swordsmith-stone.v1.png","artSource":"art/sprites/swordsmith/swordsmith-stone.v1.json","origin":{"x":0.49618,"y":0.98473},"visualHeight":129,"lights":[{"type":"brazier","x":6.4,"y":-34.09,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},
  // Owner 13 Nov 2026: the GPT farmstead with its fenced yard on 4 × 4; a 3 × 3 Farmhouse of an older save shows it at 3/4.
  farmhouse:{"sprite":"/assets/buildings/farmhouse/farmstead-gpt-0.v1.png","artSource":"art/sprites/farmstead/farmstead-gpt-0.v1.json","origin":{"x":0.53704,"y":0.98739},"visualHeight":235,"lights":[{"type":"torch","x":-38,"y":-136,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":0.9}],"legacyVisual":{"displayWidth":202,"displayHeight":178}},
  // Owner 13 Nov 2026: the GPT pantry, wooden material (a stone one is in the Studio for a later material choice).
  granary:{"sprite":"/assets/buildings/granary/granary-store-gpt-wood-0.v1.png","artSource":"art/sprites/granary-store/granary-store-gpt-wood-0.v1.json","origin":{"x":0.54651,"y":0.93407},"visualHeight":170,"lights":[{"type":"torch","x":-81,"y":-86,"color":"#ffb25a","radius":96,"intensity":0.9,"flicker":{"amplitude":0.12,"speed":7},"flameSize":0.6}]},
  // Owner 13 Nov 2026: the approved GPT bakery (0° view; the game has no view rotation yet).
  bakery:{"sprite":"/assets/buildings/bakery/bakery-house-gpt-0.v1.png","artSource":"art/sprites/bakery-house/bakery-house-gpt-0.v1.json","origin":{"x":0.44571,"y":0.92262},"visualHeight":155,"lights":[{"type":"brazier","x":42.95,"y":-32.48,"color":"#ff9d4a","radius":140.8,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.2}]},
  // Owner 13 Nov 2026: the approved GPT stone mill; sails cut out as a turning layer, body behind them filled from the 90° view.
  mill:{"sprite":"/assets/buildings/mill/windmill-gpt-0.v1.png","artSource":"art/sprites/windmill/windmill-gpt-0.v1.json","origin":{"x":0.5,"y":0.97817},"visualHeight":224,"rotor":{"still":"/assets/buildings/mill/windmill-gpt-0.v1.still.png","sprite":"/assets/buildings/mill/windmill-gpt-0.v1.rotor.png","pivot":{"x":-27,"y":-150},"origin":{"x":0.5,"y":0.5}}},
  warehouse:{"sprite":"/assets/buildings/warehouse/warehouse-store-stone.v1.png","artSource":"art/sprites/warehouse-store/warehouse-store-stone.v1.json","origin":{"x":0.49744,"y":0.98802},"visualHeight":165},
  // Owner 13 Nov 2026: the approved GPT hunting hut with the dog kennel (0° view).
  // Owner 15 Nov 2026 ("všechny nové grafiky jsou approved, nasaď je do hry"): the shingled cabin render on 3 × 3.
  hunting_lodge:{"sprite":"/assets/buildings/hunting_lodge/hunting-lodge-render-0.v1.png","artSource":"art/sprites/hunting-lodge/hunting-lodge-render-0.v1.json","origin":{"x":0.49735,"y":0.98361},"visualHeight":180,"lights":[{"type":"torch","x":-90,"y":-99,"color":"#ffb25a","radius":90,"intensity":0.85,"flicker":{"amplitude":0.1,"speed":6},"flameSize":0.5}],"legacyVisual":{"displayWidth":126,"displayHeight":122}},
  // Owner 13 Nov 2026: the approved GPT logger's cabin (0° view).
  // Owner 14 Nov 2026: the approved render of the logger's cabin with a saw yard on 4 × 2; a 2 × 2 hut of an older save shows it at 2/3.
  lumberjack_hut:{"sprite":"/assets/buildings/lumberjack_hut/lumber-camp-yard-0.v1.png","artSource":"art/sprites/lumber-camp/lumber-camp-yard-0.v1.json","origin":{"x":0.67708,"y":0.98026},"visualHeight":149,"lights":[{"type":"torch","x":-60,"y":-84,"color":"#ffb25a","radius":90,"intensity":0.85,"flicker":{"amplitude":0.1,"speed":6},"flameSize":0.5}],"legacyVisual":{"displayWidth":128,"displayHeight":101}},
  quarry:{"sprite":"/assets/buildings/quarry/quarry-pit.v1.png","artSource":"art/sprites/quarry/quarry-pit.v1.json","origin":{"x":0.49744,"y":0.98551},"visualHeight":136},
  // Owner 13 Nov 2026: the GPT builder's workshop, wooden material (stone one in the Studio for a later material choice).
  builder_workshop:{"sprite":"/assets/buildings/builder_workshop/builders-workshop-gpt-wood-0.v1.png","artSource":"art/sprites/builders-workshop/builders-workshop-gpt-wood-0.v1.json","origin":{"x":0.49744,"y":0.97093},"visualHeight":167,"lights":[{"type":"torch","x":-71,"y":-82,"color":"#ffb25a","radius":96,"intensity":0.9,"flicker":{"amplitude":0.12,"speed":7},"flameSize":0.6}]},
  smelter:{"sprite":"/assets/buildings/smelter/smelter-bloomery.v1.png","artSource":"art/sprites/smelter/smelter-bloomery.v1.json","origin":{"x":0.49744,"y":0.98413},"visualHeight":124,"lights":[{"type":"brazier","x":0,"y":-31.68,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},

  iron_mine:{"sprite":"/assets/buildings/iron_mine/iron-mine-adit.v2.png","artSource":"art/sprites/iron-mine/iron-mine-adit.v2.json","origin":{"x":0.49744,"y":0.98333},"visualHeight":118,"lights":[{"type":"torch","x":-1.71,"y":-60.61,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  // Owner 13 Nov 2026: the GPT stone barracks on 4 × 5; a 3 × 3 barracks of an older save shows it at 0.7.
  barracks:{"sprite":"/assets/buildings/barracks/barracks-hall-gpt-0.v1.png","artSource":"art/sprites/barracks-hall/barracks-hall-gpt-0.v1.json","origin":{"x":0.59155,"y":0.99355},"visualHeight":308,"lights":[{"type":"torch","x":-97,"y":-120,"color":"#ffb25a","radius":102,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":0.7},{"type":"torch","x":-36,"y":-101,"color":"#ffb25a","radius":102,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":0.7}],"legacyVisual":{"displayWidth":199,"displayHeight":217}},
  // Owner 13 Nov 2026: the GPT market square on 4 × 4; a 3 × 3 market of an older save shows it at 3/4.
  marketplace:{"sprite":"/assets/buildings/marketplace/marketplace-gpt-0.v1.png","artSource":"art/sprites/marketplace/marketplace-gpt-0.v1.json","origin":{"x":0.5,"y":0.97765},"visualHeight":175,"legacyVisual":{"displayWidth":196,"displayHeight":134}},
  wheelwright_workshop:{"sprite":"/assets/buildings/wheelwright_workshop/wheelwright-yard-shed.v2.png","artSource":"art/sprites/wheelwright-yard/wheelwright-yard-shed.v2.json","origin":{"x":0.47549,"y":0.98437},"visualHeight":126,"lights":[{"type":"torch","x":23.04,"y":-84.25,"color":"#ffb25a","radius":102.4,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":1}]},
  // Owner 13 Nov 2026: the approved GPT pitch works on 3 × 3; a 2 × 2 kiln of an older save shows it at 2/3.
  // Owner 14 Nov 2026: the approved render of the stone pitch works with a tiled roof (3 × 3); a 2 × 2 kiln of an older save shows it at 2/3.
  pitch_kiln:{"sprite":"/assets/buildings/pitch_kiln/pitch-kiln-render-0.v1.png","artSource":"art/sprites/pitch-kiln/pitch-kiln-render-0.v1.json","origin":{"x":0.49738,"y":0.98065},"visualHeight":152,"lights":[{"type":"torch","x":-73,"y":-92,"color":"#ffb25a","radius":90,"intensity":0.85,"flicker":{"amplitude":0.1,"speed":6},"flameSize":0.5},{"type":"brazier","x":46,"y":-43,"color":"#ff9d4a","radius":110,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":0.9}],"legacyVisual":{"displayWidth":127,"displayHeight":103}},
  // Owner 13 Nov 2026: the approved GPT fishing hut on 3 × 3; a 2 × 2 hut of an older save shows it at 2/3.
  // Owner 14 Nov 2026: the approved render of the shingled hut on stilts (3 × 3); a 2 × 2 hut of an older save shows it at 2/3.
  fisherman_hut:{"sprite":"/assets/buildings/fisherman_hut/fisherman-hut-render-0.v1.png","artSource":"art/sprites/fisherman-hut/fisherman-hut-render-0.v1.json","origin":{"x":0.49738,"y":0.98225},"visualHeight":166,"lights":[{"type":"torch","x":-62,"y":-108,"color":"#ffb25a","radius":90,"intensity":0.85,"flicker":{"amplitude":0.1,"speed":6},"flameSize":0.5}],"legacyVisual":{"displayWidth":127,"displayHeight":113}},
  // Owner 13 Nov 2026: the approved GPT armory (0° view, v2 with the whole roof).
  armory:{"sprite":"/assets/buildings/armory/armory-gpt-0.v2.png","artSource":"art/sprites/armory/armory-gpt-0.v2.json","origin":{"x":0.54545,"y":0.80892},"visualHeight":127},
  // Owner 14 Nov 2026: the approved thatched Stables with a paddock on 6 × 8; 5 × 5 Stables of an older save show it at 5/7.
  stables:{"sprite":"/assets/buildings/stables/stables-gpt-0.v1.png","artSource":"art/sprites/stables/stables-gpt-0.v1.json","origin":{"x":0.41425,"y":0.98701},"visualHeight":304,"lights":[{"type":"torch","x":53,"y":-210,"color":"#ffb25a","radius":100,"intensity":0.95,"flicker":{"amplitude":0.12,"speed":7},"flameSize":0.7}],"legacyVisual":{"displayWidth":321,"displayHeight":220}},
});

// The merchant caravan styles (plain, striped, house, pair) are generated with the other approved art of plan
// m-nasadit-schvalenou-grafiku: APPROVED_DEPLOY_ART.caravan in approvedDeployArt.js.

// m-duby-vitr, m-smrky (15 Nov 2026): oaks and spruces are drawn from the sheets of src/data/objects/treeWind.js
// (scripts/tree-wind.py; frame 0 = the approved picture, `sources` name the Studio exports). No tree uses single images.
export const APPROVED_TREE_ART=Object.freeze({});

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
  // g-smolarna-vzhled / g-vojaci-grafika (owner 13 Nov: "i úkoly z grafiky"): approved Studio looks of the Pitch Maker
  // and the four ranks, deployed now (Knights have no walk sheet: they turn between eight still images).
  'pitch-maker-male':{base:'/assets/characters/villagers/pitch-maker-male.v1',artSource:'art/sprites/pitch-maker/pitch-maker-male.v1.json',walk:{frameWidth:67,frameHeight:64,origin:{"x": 0.49254, "y": 0.71875},fps:6},origins:[{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.71875}]},
  'pitch-maker-female':{base:'/assets/characters/villagers/pitch-maker-female.v1',artSource:'art/sprites/pitch-maker/pitch-maker-female.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x": 0.49254, "y": 0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.7},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'military-soldier-man':{base:'/assets/characters/villagers/military-soldier-man.v1',artSource:'art/sprites/military-soldier/military-soldier-man.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x": 0.49254, "y": 0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'military-soldier-woman':{base:'/assets/characters/villagers/military-soldier-woman.v1',artSource:'art/sprites/military-soldier/military-soldier-woman.v1.json',walk:{frameWidth:67,frameHeight:61,origin:{"x": 0.49254, "y": 0.70492},fps:6},origins:[{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492}]},
  'military-soldier-kettle':{base:'/assets/characters/villagers/military-soldier-kettle.v1',artSource:'art/sprites/military-soldier/military-soldier-kettle.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x": 0.49254, "y": 0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'military-archer-hood':{base:'/assets/characters/villagers/military-archer-hood.v1',artSource:'art/sprites/military-archer/military-archer-hood.v1.json',walk:{frameWidth:67,frameHeight:66,origin:{"x": 0.49254, "y": 0.72727},fps:6},origins:[{"x":0.49254,"y":0.72727},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71875},{"x":0.49254,"y":0.72308}]},
  'military-archer-woman':{base:'/assets/characters/villagers/military-archer-woman.v1',artSource:'art/sprites/military-archer/military-archer-woman.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x": 0.49254, "y": 0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70492},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.71429}]},
  'military-archer-royal':{base:'/assets/characters/villagers/military-archer-royal.v1',artSource:'art/sprites/military-archer/military-archer-royal.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x": 0.49254, "y": 0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'military-swordsman-kite':{base:'/assets/characters/villagers/military-swordsman-kite.v1',artSource:'art/sprites/military-swordsman/military-swordsman-kite.v1.json',walk:{frameWidth:67,frameHeight:63,origin:{"x": 0.49254, "y": 0.71429},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'military-swordsman-woman':{base:'/assets/characters/villagers/military-swordsman-woman.v1',artSource:'art/sprites/military-swordsman/military-swordsman-woman.v1.json',walk:{frameWidth:67,frameHeight:62,origin:{"x": 0.49254, "y": 0.70968},fps:6},origins:[{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968},{"x":0.49254,"y":0.70968}]},
  'military-swordsman-greatsword':{base:'/assets/characters/villagers/military-swordsman-greatsword.v1',artSource:'art/sprites/military-swordsman/military-swordsman-greatsword.v1.json',walk:{frameWidth:67,frameHeight:70,origin:{"x": 0.49254, "y": 0.74286},fps:6},origins:[{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.73134},{"x":0.49254,"y":0.74286},{"x":0.49254,"y":0.73913},{"x":0.49254,"y":0.72308},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429},{"x":0.49254,"y":0.71429}]},
  'military-knight-blue':{base:'/assets/characters/villagers/military-knight-blue.v1',artSource:'art/sprites/military-knight/military-knight-blue.v1.json',origins:[{"x":0.39286,"y":0.77778},{"x":0.44595,"y":0.77778},{"x":0.49254,"y":0.77778},{"x":0.49254,"y":0.77778},{"x":0.53425,"y":0.77778},{"x":0.49254,"y":0.775},{"x":0.49254,"y":0.775},{"x":0.44595,"y":0.775}]},
  'military-knight-red':{base:'/assets/characters/villagers/military-knight-red.v1',artSource:'art/sprites/military-knight/military-knight-red.v1.json',origins:[{"x":0.39286,"y":0.8125},{"x":0.44595,"y":0.82},{"x":0.49254,"y":0.82},{"x":0.49254,"y":0.80851},{"x":0.53425,"y":0.7907},{"x":0.49254,"y":0.77778},{"x":0.49254,"y":0.78049},{"x":0.43421,"y":0.79545}]},
  'military-knight-woman':{base:'/assets/characters/villagers/military-knight-woman.v1',artSource:'art/sprites/military-knight/military-knight-woman.v1.json',origins:[{"x":0.39286,"y":0.775},{"x":0.44595,"y":0.77778},{"x":0.49254,"y":0.77778},{"x":0.49254,"y":0.77778},{"x":0.53425,"y":0.775},{"x":0.49254,"y":0.775},{"x":0.49254,"y":0.775},{"x":0.44595,"y":0.775}]},
});
export const WALK_COLUMNS=Object.freeze(['idle','stride-a','stride-b']);
export const WALK_CYCLE=Object.freeze([0,1,0,2]);
// The walk-sheet frame for a facing and the time spent walking (ms); standing is the idle column.
export function walkFrame(k,walkedMs,fps,moving){return k*WALK_COLUMNS.length+(moving?WALK_CYCLE[Math.floor(walkedMs*fps/1000)%WALK_CYCLE.length]:0);}
// Owner 17 Nov 2026: a standing soldier now and then makes a small move (shifts his weight, looks aside, shifts his
// weapon, straightens up) at his own random times, so fifty standing men do not stand frozen alike. Returns the
// idle column; state keeps {wait, left, col} per figure. Owner 17 Nov (later): half as often again – waits of 1.7–7 s.
export function soldierIdle(anim,state,delta,random=Math.random){
  const extra=(anim.idles??[]).filter(c=>c!==anim.idle);if(!extra.length)return anim.idle;
  if(state.wait==null)state.wait=1000+random()*4700;
  if(state.left>0){state.left-=delta;if(state.left>0)return state.col;state.wait=1700+random()*5300;}
  state.wait-=delta;if(state.wait>0)return anim.idle;
  state.col=extra[Math.floor(random()*extra.length)];state.left=900+random()*1800;return state.col;
}
// m-vojaci-3d: the frame of an animated soldier sheet: attacking, walking or standing.
export function soldierFrame(anim,k,{walkedMs=0,walkFps=10,moving=false,attackMs=0,attacking=false,idleCol=anim.idle}={}){
  const col=attacking?anim.attack[Math.floor(attackMs*anim.attackFps/1000)%anim.attack.length]:moving?anim.walk[Math.floor(walkedMs*walkFps/1000)%anim.walk.length]:idleCol;return k*anim.columns+col;}
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
  pitch_maker:{male:'pitch-maker-male',female:'pitch-maker-female'},
});
// Villagers carry Czech given names; the game stores no sex, so the look follows the name.
const FEMALE_NAMES=new Set(['Anna','Eliška','Marie','Tereza','Klára']);
// g-vojaci-grafika: each rank has its approved looks (a woman's look for women, the others for men, picked per
// soldier so a squad does not look cloned). Recruits keep the plain soldier look.
export const MILITARY_LOOKS=Object.freeze({soldier:Object.freeze({male:['military-soldier-man','military-soldier-kettle'],female:['military-soldier-woman']}),
  archer:Object.freeze({male:['military-archer-hood','military-archer-royal'],female:['military-archer-woman']}),
  swordsman:Object.freeze({male:['military-swordsman-kite','military-swordsman-greatsword'],female:['military-swordsman-woman']}),
  knight:Object.freeze({male:['military-knight-blue','military-knight-red'],female:['military-knight-woman']})});
// m-vojaci-3d (owner 16 Nov 2026): the four ranks wear the owner's rigged 3D soldiers, rendered with walk, attack and
// fall animations (SOLDIER_ANIM_ART); the earlier painted looks stay only as data for the Studio.
export function militaryLook(type,sex,id=''){if(SOLDIER_ANIM_LOOKS[type])return SOLDIER_ANIM_LOOKS[type];const list=MILITARY_LOOKS[type]?.[sex];if(!list)return null;let h=0;for(const c of String(id))h=(h*31+c.charCodeAt(0))>>>0;return list[h%list.length];}
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
