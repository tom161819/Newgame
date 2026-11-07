// #100 World generation: the ground type of every tile and the rules for rivers, lakes, the desert and bushes.
// The ground layer is separate from the rock layer (terrainGrid: 0 = open, 1 = rock outcrop) and never changes
// during a game. Water blocks walking and building but not sight or arrows; sand can be built on and walked on
// but nothing grows on it (no trees, no fields). A ford is a sandbar across the river.
// World v2 (generator 2): FORD 5 = a stony shallow crossing (walkable at ×0.6, never built on, part of the river),
// MUD 6 = a muddy bank and SHORE_ROCKS 7 = a pebbly bank (walkable, buildable, nothing grows).
export const GROUND=Object.freeze({GRASS:0,BEACH:1,DESERT:2,SHALLOW:3,DEEP:4,FORD:5,MUD:6,SHORE_ROCKS:7});
export const GROUND_CODES=Object.freeze(Object.values(GROUND));
// Object definitions that carry each ground's tiles (src/data/objects/terrain.js).
export const GROUND_TERRAIN_IDS=Object.freeze(['grass_normal','beach_sand','desert_sand','shallow_water','deep_water','ford_shallows','mud_bank','shore_rocks']);
// Map cell for water: like 1 it blocks walking and building (every walkable check asks for 0), but it is
// transparent for line of sight, so archers can shoot across a river.
export const WATER_CELL=2;
export const isWaterGround=code=>code===GROUND.SHALLOW||code===GROUND.DEEP;
export const isSandGround=code=>code===GROUND.BEACH||code===GROUND.DESERT;
// A ford belongs to the river (one water body for fishing) but can be walked; nothing is built or placed on it.
export const isFordGround=code=>code===GROUND.FORD;
export const isRiverGround=code=>isWaterGround(code)||code===GROUND.FORD;
export const FORD_SPEED=.6;
// Fields and trees need grass; buildings, paving, stones and deposits may stand on sand.
export const isFertileGround=code=>(code??GROUND.GRASS)===GROUND.GRASS;

export const WORLD_GENERATION=Object.freeze({
  // No water, desert or bush closer than this to the start (castle, stockpile and the first houses).
  startClear:13,bushClear:5,
  river:{width:[2.2,3.2],shallow:1.25,beach:[.6,2.1],fordSpacing:[18,26],fordHalfWidth:1.6,
    amplitude:[4,8],wavelength:[55,95],ripple:[.8,1.8],rippleWavelength:[18,30]},
  lake:{radius:[3.6,5.4],startDistance:24,riverDistance:9},
  desert:{radius:[11,15],startDistance:34,riverDistance:5,scrub:24},
  bushes:{clusters:26,perCluster:[5,12],spread:3.2},
  // World v2, generator 2 (zadani-svet-v2.md, step 2a). Widths are full widths in tiles at the default level.
  river2:{width:[3.5,5],widthWavelength:13,pool:[1,1.5],poolShare:.22,fordWidth:3,fordHalfWidth:1.6,fordSpacing:[18,26],shallowRim:1.1},
  tributary:{width:[2,3],fordSpacing:[13,19],fordHalfWidth:1.4,amplitude:[2,5]},
  banks:{segment:[6,18],beachShare:.3,innerBendBonus:.25,weights:{grass:.4,mud:.33,rocks:.27},beach:[.8,2.2],mud:[.7,1.6],rocks:[.6,1.4],reeds:.75},
  // Bank vegetation: clusters along the water, density changing by stretch; a path to the water every `access` tiles.
  bankVegetation:{stretch:[8,20],dense:.35,bushes:.18,access:12,accessHalfWidth:1.3},
  // Grass zones (all fertile GRASS for the game): moisture from water + noise, a variation noise for flowers,
  // the forest noise for forest floor and rock nearness for stony grass.
  grass:{moistureReach:16,noiseScale:22,variationScale:9,forestScale:16},
  forest:{scale:16,threshold:.5,dryCut:.25},
  rocks:{scale:14,desertRim:6},
  // A fair start within `radius` of the castle: trees, loose stones, grass tiles and water within `waterDistance`.
  fairStart:{radius:20,trees:25,stones:10,grass:250,waterDistance:30,attempts:20},
});
// Grass zones (layer grassZone; digits in saves). Order matters for the save format.
export const GRASS_ZONE=Object.freeze({MEADOW:0,LUSH:1,DRY:2,FOREST_FLOOR:3,FLOWERS:4,STONY:5});
export const GRASS_ZONE_CODES=Object.freeze(Object.values(GRASS_ZONE));

// Bush decorations (src/data/objects/decorations.js); scrub grows only on the desert.
export const BUSH_TYPES=Object.freeze(['bush_meadow','bush_berry','bush_flowering','bush_scrub']);
export const GRASS_BUSHES=Object.freeze([[0,.5],[1,.25],[2,.25]]);
