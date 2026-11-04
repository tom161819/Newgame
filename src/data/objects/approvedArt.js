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

export function withApprovedArt(definition){
  const art=APPROVED_BUILDING_ART[definition.id];
  return art?{...definition,...structuredClone(art),renderMode:'sprite'}:definition;
}
