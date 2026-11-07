// #100 World generation: the ground type of every tile and the rules for rivers, lakes, the desert and bushes.
// The ground layer is separate from the rock layer (terrainGrid: 0 = open, 1 = rock outcrop) and never changes
// during a game. Water blocks walking and building but not sight or arrows; sand can be built on and walked on
// but nothing grows on it (no trees, no fields). A ford is a sandbar across the river.
export const GROUND=Object.freeze({GRASS:0,BEACH:1,DESERT:2,SHALLOW:3,DEEP:4});
export const GROUND_CODES=Object.freeze(Object.values(GROUND));
// Object definitions that carry each ground's tiles (src/data/objects/terrain.js).
export const GROUND_TERRAIN_IDS=Object.freeze(['grass_normal','beach_sand','desert_sand','shallow_water','deep_water']);
// Map cell for water: like 1 it blocks walking and building (every walkable check asks for 0), but it is
// transparent for line of sight, so archers can shoot across a river.
export const WATER_CELL=2;
export const isWaterGround=code=>code===GROUND.SHALLOW||code===GROUND.DEEP;
export const isSandGround=code=>code===GROUND.BEACH||code===GROUND.DESERT;
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
});

// Bush decorations (src/data/objects/decorations.js); scrub grows only on the desert.
export const BUSH_TYPES=Object.freeze(['bush_meadow','bush_berry','bush_flowering','bush_scrub']);
export const GRASS_BUSHES=Object.freeze([[0,.5],[1,.25],[2,.25]]);
