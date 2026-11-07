// #98 Workplace porches (owner's choice 7 Nov: (a) a separate object on free tiles in front of the building; the
// building keeps its size). Approved Studio art #114 (workplace-porch, trade-porch, profession-porch). `origin` is the
// sprite's footprint centre (the art's `origin`), `seats` are [x, z] in tiles from that centre along the 2×1 strip.
export const PORCH_ART=Object.freeze({
  'trade-porch-mill':Object.freeze({"sprite":"/assets/decorations/porches/trade-porch-mill.v1.png","artSource":"art/sprites/trade-porch/trade-porch-mill.v1.json","origin":{"x":0.49495,"y":0.62857},"visualHeight":68,"seats":[[-0.4,0.02],[-0.1,0.02]]}),
  'trade-porch-bakery':Object.freeze({"sprite":"/assets/decorations/porches/trade-porch-bakery.v1.png","artSource":"art/sprites/trade-porch/trade-porch-bakery.v1.json","origin":{"x":0.49495,"y":0.6338},"visualHeight":69,"seats":[[-0.35,0.22],[0.05,0.22]]}),
  'trade-porch-quarry':Object.freeze({"sprite":"/assets/decorations/porches/trade-porch-quarry.v1.png","artSource":"art/sprites/trade-porch/trade-porch-quarry.v1.json","origin":{"x":0.49495,"y":0.4902},"visualHeight":49,"seats":[[-0.55,0.05],[-0.25,0.1],[0.05,0.05]]}),
  'trade-porch-smelter':Object.freeze({"sprite":"/assets/decorations/porches/trade-porch-smelter.v1.png","artSource":"art/sprites/trade-porch/trade-porch-smelter.v1.json","origin":{"x":0.49495,"y":0.4902},"visualHeight":49,"seats":[[-0.45,0.02]]}),
  'profession-porch-woodcutter':Object.freeze({"sprite":"/assets/decorations/porches/profession-porch-woodcutter.v1.png","artSource":"art/sprites/profession-porch/profession-porch-woodcutter.v1.json","origin":{"x":0.49495,"y":0.4902},"visualHeight":49,"seats":[[-0.6,0.15],[-0.05,0.18],[0.25,0.15]]}),
  'profession-porch-farmer':Object.freeze({"sprite":"/assets/decorations/porches/profession-porch-farmer.v1.png","artSource":"art/sprites/profession-porch/profession-porch-farmer.v1.json","origin":{"x":0.49495,"y":0.4902},"visualHeight":49,"seats":[[-0.55,0.12],[-0.05,0.14]]}),
  'profession-porch-smith':Object.freeze({"sprite":"/assets/decorations/porches/profession-porch-smith.v1.png","artSource":"art/sprites/profession-porch/profession-porch-smith.v1.json","origin":{"x":0.49495,"y":0.4902},"visualHeight":49,"seats":[[-0.6,0.15],[-0.3,0.2]]}),
  'profession-porch-hunter':Object.freeze({"sprite":"/assets/decorations/porches/profession-porch-hunter.v1.png","artSource":"art/sprites/profession-porch/profession-porch-hunter.v1.json","origin":{"x":0.49495,"y":0.68675},"visualHeight":81,"seats":[[-0.48,0.15],[-0.22,0.15]]}),
  'workplace-porch-veranda':Object.freeze({"sprite":"/assets/decorations/porches/workplace-porch-veranda.v1.png","artSource":"art/sprites/workplace-porch/workplace-porch-veranda.v1.json","origin":{"x":0.49495,"y":0.62319},"visualHeight":67,"seats":[[-0.3,0.02],[0.0,0.02]]}),
});
// Which porch stands in front of which workplace; any other workplace gets the shared veranda. The Barracks has none
// (soldiers stand guard). The Mill, Bakery, Quarry/Iron Mine and Smelter use the trade porches; the Lumberjack, Farmhouse,
// smiths and Hunting Lodge the profession porches.
export const BUILDING_PORCHES=Object.freeze({
  mill:'trade-porch-mill',bakery:'trade-porch-bakery',quarry:'trade-porch-quarry',iron_mine:'trade-porch-quarry',smelter:'trade-porch-smelter',
  lumberjack_hut:'profession-porch-woodcutter',farmhouse:'profession-porch-farmer',swordsmith:'profession-porch-smith',armorer:'profession-porch-smith',
  hunting_lodge:'profession-porch-hunter',
});
export const PORCH_DEFAULT='workplace-porch-veranda';
export const PORCH_RULES=Object.freeze({excluded:Object.freeze(['barracks']),checkMs:2000});
export const porchId=variant=>`porch_${variant.replace(/-/g,'_')}`;
export const porchVariant=type=>PORCH_RULES.excluded.includes(type)?null:BUILDING_PORCHES[type]??PORCH_DEFAULT;
