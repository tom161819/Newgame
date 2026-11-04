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
  smelter:{"sprite":"/assets/buildings/smelter/smelter-bloomery.v1.png","artSource":"art/sprites/smelter/smelter-bloomery.v1.json","origin":{"x":0.49744,"y":0.98413},"visualHeight":124,"lights":[{"type":"brazier","x":0,"y":-31.68,"color":"#ff9d4a","radius":134.4,"intensity":1,"flicker":{"amplitude":0.16,"speed":5.5},"flameSize":1.6}]},
});

// Approved tree art by growth look and season (origin = the studio anchor, the
// tile centre where trees stand). TreeView picks one per stage, season and tile;
// stumps and saplings, and young oaks in autumn and winter, stay procedural.
export const APPROVED_TREE_ART=Object.freeze({
  oak_tree:{mature:{sprite:'/assets/resources/oak_tree/art/oak-tree-mature.v1.png',artSource:'art/sprites/oak-tree/oak-tree-mature.v1.json',origin:{"x":0.4125,"y":0.85}},broad:{sprite:'/assets/resources/oak_tree/art/oak-tree-broad.v1.png',artSource:'art/sprites/oak-tree/oak-tree-broad.v1.json',origin:{"x":0.42308,"y":0.82692}},young:{sprite:'/assets/resources/oak_tree/art/oak-tree-young.v1.png',artSource:'art/sprites/oak-tree/oak-tree-young.v1.json',origin:{"x":0.49254,"y":0.77215}},spring:{sprite:'/assets/resources/oak_tree/art/oak-seasons-spring.v1.png',artSource:'art/sprites/oak-seasons/oak-seasons-spring.v1.json',origin:{"x":0.4125,"y":0.85}},autumn:{sprite:'/assets/resources/oak_tree/art/oak-seasons-autumn.v1.png',artSource:'art/sprites/oak-seasons/oak-seasons-autumn.v1.json',origin:{"x":0.4125,"y":0.85}},winter:{sprite:'/assets/resources/oak_tree/art/oak-seasons-winter.v1.png',artSource:'art/sprites/oak-seasons/oak-seasons-winter.v1.json',origin:{"x":0.3908,"y":0.84483}}},
  pine_tree:{mature:{sprite:'/assets/resources/pine_tree/art/pine-tree-mature.v1.png',artSource:'art/sprites/pine-tree/pine-tree-mature.v1.json',origin:{"x":0.44595,"y":0.87838}},young:{sprite:'/assets/resources/pine_tree/art/pine-tree-young.v1.png',artSource:'art/sprites/pine-tree/pine-tree-young.v1.json',origin:{"x":0.49254,"y":0.80645}},winter:{sprite:'/assets/resources/pine_tree/art/pine-seasons-winter.v1.png',artSource:'art/sprites/pine-seasons/pine-seasons-winter.v1.json',origin:{"x":0.44595,"y":0.87919}}},
});

export function withApprovedArt(definition){
  const building=APPROVED_BUILDING_ART[definition.id],tree=APPROVED_TREE_ART[definition.id];
  if(building)return{...definition,...structuredClone(building),renderMode:'sprite'};
  if(tree)return{...definition,artSprites:structuredClone(tree)};
  return definition;
}
