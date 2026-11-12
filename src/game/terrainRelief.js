// Terrain height in the game (plan m-teren-vyska, steps 2–3, first part): the hills of the current world and what
// they mean for play. The height map itself comes from terrainHeight.js (the algorithm the World Lab shows); it follows
// from the world's ground and seed alone, so it is worked out again at every start and load and is not saved.
// This first part keeps the map flat on screen (hills read through slope shading); lifting the ground and everything
// on it is the next part.
import { computeHeights, tileHeight, tileSlope, cornerShade, BUILD_MAX_SLOPE, DEFAULT_HEIGHT_LEVELS } from './terrainHeight.js';
import { worldRandom } from './seededRandom.js';

export const RELIEF_RULES = Object.freeze({
  // Walking uphill: speed × 1 / (1 + climbSlowdown × climb), climb in height units per tile; never below climbMinFactor.
  climbSlowdown: 0.25, climbMinFactor: 0.5,
  // Sight from a hilltop: + sightPerUnit tiles for every unit above the mean height within sightSurroundRadius tiles.
  sightPerUnit: 1, sightBonusMax: 6, sightSurroundRadius: 10,
  // Buildings need corners within buildMaxSlope units; fields and orchards take steeper ground; one-tile pieces
  // (walls, torches, wells) follow the terrain.
  buildMaxSlope: BUILD_MAX_SLOPE, cropMaxSlope: 3,
  // Slope shading on the ground: light from the screen's upper left.
  shadeStrength: 2.4, shadeMax: 0.4,
});

let current = null;
// The world's relief: { map, width, height, tiles (mean height per tile), slopes, sight (bonus tiles per tile), shade (per corner) }.
export function buildRelief(ground, seed, levels = DEFAULT_HEIGHT_LEVELS) {
  // One stream name for every world (the Lab adds the fair-start attempt; a loaded game does not know it).
  const map = computeHeights({ ground, random: worldRandom(seed, 'height'), levels }), W = map.width, H = map.height;
  const tiles = new Float32Array(W * H), slopes = new Float32Array(W * H), sight = new Uint8Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { tiles[y * W + x] = tileHeight(map, x, y); slopes[y * W + x] = tileSlope(map, x, y); }
  // Mean height of the surroundings by a summed-area table.
  const S = new Float64Array((W + 1) * (H + 1));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) S[(y + 1) * (W + 1) + x + 1] = tiles[y * W + x] + S[y * (W + 1) + x + 1] + S[(y + 1) * (W + 1) + x] - S[y * (W + 1) + x];
  const R = RELIEF_RULES.sightSurroundRadius;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const x0 = Math.max(0, x - R), y0 = Math.max(0, y - R), x1 = Math.min(W, x + R + 1), y1 = Math.min(H, y + R + 1);
    const mean = (S[y1 * (W + 1) + x1] - S[y0 * (W + 1) + x1] - S[y1 * (W + 1) + x0] + S[y0 * (W + 1) + x0]) / ((x1 - x0) * (y1 - y0));
    sight[y * W + x] = Math.max(0, Math.min(RELIEF_RULES.sightBonusMax, Math.round((tiles[y * W + x] - mean) * RELIEF_RULES.sightPerUnit)));
  }
  return { map, width: W, height: H, tiles, slopes, sight, shade: cornerShade(map) };
}
export function setRelief(relief) { current = relief ?? null; return current; }
export const currentRelief = () => current;

const at = (relief, array, x, y) => x >= 0 && y >= 0 && x < relief.width && y < relief.height ? array[y * relief.width + x] : 0;
export const reliefHeight = (relief, tile) => relief ? at(relief, relief.tiles, tile.x, tile.y) : 0;
export const reliefSlope = (relief, tile) => relief ? at(relief, relief.slopes, tile.x, tile.y) : 0;
export const sightBonus = (relief, center) => relief ? at(relief, relief.sight, Math.floor(center.x), Math.floor(center.y)) : 0;
// Speed factor for a step from tile `from` to tile `to` (1 on the flat and downhill).
export function climbFactor(relief, from, to) {
  if (!relief) return 1;
  const rise = reliefHeight(relief, to) - reliefHeight(relief, from); if (rise <= 0) return 1;
  const distance = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  return Math.max(RELIEF_RULES.climbMinFactor, 1 / (1 + RELIEF_RULES.climbSlowdown * rise / distance));
}
// Why a building cannot stand on these tiles, or null.
export function tooSteep(relief, tiles, definition) {
  if (!relief || (definition.width ?? 1) * (definition.height ?? 1) <= 1) return false;
  const limit = definition.crop ? RELIEF_RULES.cropMaxSlope : RELIEF_RULES.buildMaxSlope;
  return tiles.some(tile => reliefSlope(relief, tile) > limit);
}
