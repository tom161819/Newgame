// World Lab model (plan g-world-lab, zadani-svet-v2.md step 1b). The Lab never has its own generator: it imports the
// game's generator and world-code module from src/ (read only), so a code shows exactly the world the game makes.
import { generateWorld, fairStartReport } from '../../../src/game/worldGeneration.js';
import { worldStreams } from '../../../src/game/seededRandom.js';
import { reachableTiles } from '../../../src/game/pathfinding.js';
import { mapFromWorld } from '../../../src/game/worldGeneration.js';
import { COLUMNS, ROWS, PLAYER_START } from '../../../src/game/config.js';
import { GROUND, GRASS_ZONE, WORLD_GENERATION, isWaterGround, isRiverGround } from '../../../src/data/worldTerrain.js';
import {
  WORLD_GENERATOR_VERSION, WORLD_SETTINGS, WORLD_PRESETS, DEFAULT_WORLD_LEVELS, encodeWorldCode, decodeWorldCode,
  randomSeed, applyPresets, presetsFromLevels, WorldCodeError,
} from '../../../src/data/worldCode.js';

export { WORLD_GENERATOR_VERSION, WORLD_SETTINGS, WORLD_PRESETS, DEFAULT_WORLD_LEVELS, applyPresets, presetsFromLevels, randomSeed, COLUMNS, ROWS, PLAYER_START, GROUND, GRASS_ZONE };

// Parse a code typed or pasted by the owner: { ok, code, levels, seed } or { ok: false, reason, message, generator }.
export function readCode(text) {
  try {
    const { generator, levels, seed } = decodeWorldCode(text);
    return { ok: true, generator, levels, seed, code: encodeWorldCode({ generator, levels, seed }) };
  } catch (error) {
    if (!(error instanceof WorldCodeError)) throw error;
    const generator = Number(String(text).trim().toUpperCase().match(/^MKW(\d+)-/)?.[1]) || null;
    return { ok: false, reason: error.reason, message: error.message, generator };
  }
}
export const makeCode = (levels, seed) => encodeWorldCode({ levels, seed });

// The same world the game builds for a new game with this code (generateWorld with the code's seeded streams).
export function worldFor(levels, seed) {
  const world = generateWorld(Math.random, { levels, streams: worldStreams(seed) });
  return { ...world, map: mapFromWorld(world.terrain, world.ground), levels: [...levels], seed };
}

// Checks shown in the Lab's panel. Trees, stones and ore are placed when a game starts (resource spawners); the Lab
// reports the generator's forest and stone weights near the castle instead of exact counts.
export function checks(world) {
  const F = WORLD_GENERATION.fairStart, start = { x: PLAYER_START.x + 0.5, y: PLAYER_START.y + 0.5 };
  let water = 0, fordTiles = 0, rocks = 0, desert = 0, open = 0, forestNear = 0, stoneNear = 0, grassNear = 0;
  const zones = Object.fromEntries(Object.keys(GRASS_ZONE).map(k => [k, 0]));
  const zoneName = Object.fromEntries(Object.entries(GRASS_ZONE).map(([k, v]) => [v, k]));
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLUMNS; x++) {
    const g = world.ground[y][x], rock = world.terrain[y][x] === 1, i = y * COLUMNS + x, d = Math.hypot(x + 0.5 - start.x, y + 0.5 - start.y);
    if (isWaterGround(g)) water++;
    if (g === GROUND.FORD) fordTiles++;
    if (g === GROUND.DESERT) desert++;
    if (rock) rocks++;
    if (world.map[y][x] !== 1 && world.map[y][x] !== 2) open++;
    if (g === GROUND.GRASS && !rock) zones[zoneName[world.zones[y][x]]]++;
    if (d <= F.radius) {
      if (g === GROUND.GRASS && !rock) grassNear++;
      if ((world.forestWeight?.[i] ?? 0) >= 0.5) forestNear++;
      if ((world.stoneWeight?.[i] ?? 0) >= 0.5) stoneNear++;
    }
  }
  const reachable = reachableTiles(world.map, [PLAYER_START]).length;
  const report = world.summary?.fairStart ?? fairStartReport(world);
  const total = COLUMNS * ROWS, warnings = [];
  if (!report.ok) warnings.push('The fair start failed after every attempt (grass or water near the castle).');
  if (reachable / Math.max(1, open) < 0.99) warnings.push(`Only ${Math.round(100 * reachable / Math.max(1, open))} % of open ground is reachable from the castle.`);
  if (forestNear < 40) warnings.push('Little forest near the castle.');
  if (stoneNear < 15) warnings.push('Few stony tiles near the castle.');
  return {
    waterPercent: 100 * water / total, fords: world.summary?.fords ?? 0, fordTiles, rocks, desertPercent: 100 * desert / total,
    lakes: world.summary?.lakes ?? 0, tributary: !!world.summary?.tributary,
    reachablePercent: 100 * reachable / Math.max(1, open),
    start: { grass: grassNear, water: report.water, forest: forestNear, stone: stoneNear, attempt: report.attempt ?? 1, ok: report.ok, radius: F.radius, needGrass: F.grass, needWater: F.waterDistance },
    zones, bushes: world.bushes.size, reeds: world.reeds.size, warnings,
  };
}

// Top-down colours, close to the minimap: ground types, then grass zones on grass.
export const GROUND_COLORS = {
  [GROUND.BEACH]: [217, 197, 138], [GROUND.DESERT]: [224, 194, 122], [GROUND.SHALLOW]: [111, 179, 200], [GROUND.DEEP]: [63, 127, 166],
  [GROUND.FORD]: [143, 183, 168], [GROUND.MUD]: [122, 95, 67], [GROUND.SHORE_ROCKS]: [154, 149, 138],
};
export const ZONE_COLORS = {
  [GRASS_ZONE.MEADOW]: [122, 154, 74], [GRASS_ZONE.LUSH]: [86, 136, 58], [GRASS_ZONE.DRY]: [179, 164, 94],
  [GRASS_ZONE.FOREST_FLOOR]: [79, 106, 52], [GRASS_ZONE.FLOWERS]: [143, 168, 90], [GRASS_ZONE.STONY]: [140, 144, 122],
};
export const ROCK_COLOR = [92, 88, 76], BUSH_COLOR = [44, 84, 36], REED_COLOR = [169, 181, 90];
export function tileColor(world, x, y) {
  if (world.terrain[y][x] === 1) return ROCK_COLOR;
  const g = world.ground[y][x];
  if (g === GROUND.GRASS) return ZONE_COLORS[world.zones[y][x]] ?? ZONE_COLORS[0];
  return GROUND_COLORS[g] ?? [255, 0, 255];
}

// A favourite world as stored in the page database (worlds/<id>): untrusted input is checked here.
export function readFavourite(doc) {
  const data = doc?.data ?? doc;
  if (!data || typeof data.code !== 'string') return null;
  const parsed = readCode(data.code);
  return {
    id: String(doc.id ?? data.id ?? ''), code: data.code.trim().toUpperCase().slice(0, 64), name: typeof data.name === 'string' && data.name.trim() ? data.name.trim().slice(0, 60) : data.code,
    note: typeof data.note === 'string' ? data.note.slice(0, 300) : '', by: typeof data.by === 'string' ? data.by : null, at: typeof data.at === 'string' ? data.at : '',
    valid: parsed.ok, oldGenerator: !parsed.ok && parsed.reason === 'generator',
  };
}
// The default proposal (worldDefaults/proposal) has exactly the levels format world:sync accepts.
export function defaultsProposal(levels, { by, note = '' } = {}) {
  if (!Array.isArray(levels) || levels.length !== WORLD_SETTINGS.length || levels.some((l, i) => !Number.isInteger(l) || l < 0 || l > WORLD_SETTINGS[i].max)) throw new RangeError('Invalid levels');
  return { levels: [...levels], ...(by ? { by } : {}), at: new Date().toISOString(), note: String(note).slice(0, 300), generator: WORLD_GENERATOR_VERSION };
}
export const slug = text => String(text).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'world';
export const isRiver = isRiverGround;
