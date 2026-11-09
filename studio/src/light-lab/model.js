// Light Lab model: the test scene (a piece of map with the game's buildings and villagers), its light sources, the
// time of day with the game's own day parts, house windows (lit only while someone is home and awake) and the
// default proposal. No DOM here, so the unit tests can use it.
import { DAY_NIGHT, darknessAt, dayPart } from '../../../src/data/dayNight.js';
import { LIGHT_SCHEMA, LIGHT_TYPES, DEFAULT_TYPES, hash01, smoothstep, normalizeLightSettings, lightingFile } from './lightmap.js';

export const SPAN = 12; // tiles on each side of the scene
export const TILE_W = 64, TILE_H = 32;
// World px of a grid point in the Lab's own scene (origin at the top corner of tile 0,0).
export const gridToWorld = (x, y) => ({ x: (x - y) * TILE_W / 2, y: (x + y) * TILE_H / 2 });
export const worldToGrid = (x, y) => { const a = x / (TILE_W / 2), b = y / (TILE_H / 2); return { x: (a + b) / 2, y: (b - a) / 2 }; };

// Buildings of the scene: game ids at grid positions; `light` maps the game's light types to the Lab's.
export const SCENE_BUILDINGS = Object.freeze([
  { id: 'house', x: 1, y: 2 }, { id: 'house', x: 6, y: 1 }, { id: 'smelter', x: 1, y: 7 }, { id: 'bakery', x: 7, y: 7 },
  { id: 'well', x: 5, y: 5 }, { id: 'torch_post', x: 4, y: 4 }, { id: 'brazier', x: 9, y: 4 }, { id: 'campfire', x: 5, y: 10 },
]);
export const SCENE_PEOPLE = Object.freeze([
  { look: 'villager-male', x: 4.4, y: 5.4, facing: 7 }, { look: 'villager-female', x: 6.4, y: 6.1, facing: 6 },
  { look: 'baker-male', x: 8.2, y: 9.6, facing: 5 }, { look: 'miner-male', x: 3.7, y: 9.4, facing: 0 },
  { look: 'woodcutter-female', x: 9.4, y: 6.4, facing: 7 }, { look: 'soldier-male', x: 6.2, y: 10.6, facing: 3 },
]);
const FORGES = new Set(['smelter', 'swordsmith', 'armorer', 'bakery']);
export function labType(buildingId, gameType) {
  if (FORGES.has(buildingId)) return 'forge';
  return LIGHT_TYPES.includes(gameType) ? gameType : 'torch';
}

// Light sources of the scene's buildings, from the game's own definitions (definition.lights, offsets from the
// building's base corner) plus one window per house (the game's houseWindows: base.y − visualHeight × 0.35).
export function buildingSources(placed, definitions) {
  const out = []; let seed = 1;
  placed.forEach((b, index) => {
    const d = definitions.get(b.id); if (!d) return;
    const base = gridToWorld(b.x + d.width, b.y + d.height), centre = gridToWorld(b.x + d.width / 2, b.y + d.height / 2);
    // The ground under a light: a post on a one-tile place stands in its middle; a light on a larger building hangs
    // on its front wall, whose foot runs up from the base corner at the 2:1 slope.
    const groundY = lx => d.width === 1 && d.height === 1 ? centre.y : Math.max(centre.y, base.y - Math.abs(lx) / 2 - 2);
    for (const l of d.lights ?? []) {
      if (l.type === 'window' && d.housing) continue;
      const y = groundY(l.x);
      out.push({ id: `b${index}-${out.length}`, type: labType(b.id, l.type), x: base.x + l.x, y, lamp: Math.max(4, y - (base.y + l.y)), seed: seed++, building: index });
    }
    if (d.housing) { const y = groundY(0); out.push({ id: `b${index}-window`, type: 'window', x: base.x, y, lamp: Math.max(4, y - (base.y - (d.visualHeight ?? 80) * 0.35)), seed: seed++, building: index, house: index }); }
  });
  return out;
}

// ---------- time of day ----------
export const SEASONS = Object.freeze(Object.keys(DAY_NIGHT.nightStart));
export const nightStartOf = season => DAY_NIGHT.nightStart[season] ?? DAY_NIGHT.nightStart.Summer;
// The game's darkness (linear through dusk and dawn) eased, so dusk and dawn change smoothly at both ends.
export const darknessFor = (fraction, nightStart) => smoothstep(0, 1, darknessAt(fraction, nightStart));
export const partOf = (fraction, nightStart) => dayPart(fraction, nightStart);
export function clockOf(fraction) { const m = Math.round(((fraction % 1) + 1) % 1 * 24 * 60); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
// When a house goes to bed: the game spreads bedtimes over 8 % of the day after night starts (DAY_NIGHT.houseWindows).
export const bedtimeOf = (nightStart, house) => Math.min(0.995, nightStart + (house.bedtime ?? DAY_NIGHT.houseWindows.bedtimeSpread * hash01(house.index + 7)));
// A window glows (0 … 1) from early dusk while someone is home and still awake; it fades in and out over a moment.
export function windowGlow(fraction, nightStart, house) {
  if (!house?.home) return 0;
  const from = nightStart - DAY_NIGHT.duskLength, bed = bedtimeOf(nightStart, house);
  if (fraction < from) return 0;
  return smoothstep(from, from + DAY_NIGHT.duskLength * 0.5, fraction) * (1 - smoothstep(bed - 0.004, bed + 0.004, fraction));
}

// Sources with their current `on` (windows by occupancy and bedtime; everything else 1).
export function activeSources(sources, houses, fraction, nightStart) {
  return sources.map(s => s.type === 'window' && s.house != null ? { ...s, on: windowGlow(fraction, nightStart, houses.find(h => h.index === s.house)) } : s);
}
export function newSource(type, x, y, sources) {
  const seed = 100 + sources.reduce((m, s) => Math.max(m, s.seed ?? 0), 0) + 1;
  return { id: `s${seed}`, type, x: Math.round(x), y: Math.round(y), lamp: DEFAULT_TYPES[type]?.lamp ?? 40, seed };
}
// Saved scene (local draft) read back: only well-formed sources survive.
export function readSources(list) {
  if (!Array.isArray(list)) return null;
  return list.filter(s => s && LIGHT_TYPES.includes(s.type) && Number.isFinite(s.x) && Number.isFinite(s.y)).map(s => ({ id: String(s.id ?? `s${s.seed}`), type: s.type, x: s.x, y: s.y, lamp: Number.isFinite(s.lamp) ? s.lamp : DEFAULT_TYPES[s.type].lamp, seed: Number.isFinite(s.seed) ? s.seed : 1, ...(Number.isInteger(s.building) ? { building: s.building } : {}), ...(Number.isInteger(s.house) ? { house: s.house } : {}) }));
}

// ---------- proposal ----------
export const PROPOSALS = 'lightingProposal', PROPOSAL_ID = 'default', EXPORT_FILE = 'light-lab-default.json';
// The page-database document of "Propose as default" (`lightingProposal/default`).
export function proposalDoc(settings, { by = null, note = '', at = new Date().toISOString() } = {}) {
  return { schema: LIGHT_SCHEMA, settings: normalizeLightSettings(settings), by: by ?? null, note: String(note ?? '').slice(0, 500), at };
}
export const exportFile = (settings, meta) => lightingFile(settings, meta);
