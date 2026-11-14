// S11 Stone Pavement: one tunable place for the surface layer and its building tools.
export const PAVEMENT=Object.freeze({
  speedMultiplier:1.25,   // beats the best trodden path (+15 %); never added to it
  tilesPerStone:2,        // 1 Stone for every 2 new tiles of one order, rounded up
  workPerTile:2000,       // ms of active Builder work per tile
  modes:Object.freeze(['single','line','area','remove']),defaultMode:'area',
  maxOrderTiles:400,
});
export const pavementCost=count=>Math.ceil(count/PAVEMENT.tilesPerStone);
