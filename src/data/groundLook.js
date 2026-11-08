// Ground look override (plan m-world-editor-obrazovka): the World Editor lets a player change the continuous ground's
// look (patches, zone transitions, plants, stones, river look). The game's approved look stays src/data/groundStyle.json
// (owned by the Grafika chat); this module only lays the player's changes over it. continuousGround.js takes its
// settings as a parameter, so the game's painters ask groundSettings() instead of reading the JSON directly.
import groundStyle from './groundStyle.json' with { type: 'json' };
import { GROUND_DEFAULTS, GROUND_SETTINGS } from '../render/continuousGround.js';

// Fish are the game's own FishShadows (they do not read the ground settings), so their sliders are left out.
const NOT_IN_GAME = new Set(['fishAmount', 'fishSize', 'fishOpacity']);
export const GROUND_LOOK_SETTINGS = Object.freeze(GROUND_SETTINGS.filter(s => !NOT_IN_GAME.has(s.key)).map(s => Object.freeze({ ...s })));
const WHOLE = new Set(['duckFamilies', 'flowerContrast', 'flowerAreaScale']);
const BY_KEY = new Map(GROUND_LOOK_SETTINGS.map(s => [s.key, s]));
// What the game paints without an override.
export const GAME_GROUND_SETTINGS = Object.freeze({ ...GROUND_DEFAULTS, ...groundStyle.settings });
export const defaultGroundLook = () => Object.fromEntries(GROUND_LOOK_SETTINGS.map(s => [s.key, GAME_GROUND_SETTINGS[s.key]]));

// Strict check (saves): a plain object with only known keys, each a finite number in the slider's range
// (duck families, flower contrast and flower area scale whole numbers). Returns a clean copy; throws on anything else.
export function validateGroundLook(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid ground look');
  const out = {};
  for (const [key, value] of Object.entries(input)) {
    const def = BY_KEY.get(key);
    if (!def || typeof value !== 'number' || !Number.isFinite(value) || value < def.min - 1e-9 || value > def.max + 1e-9) throw new Error('Invalid ground look');
    if (WHOLE.has(key) && !Number.isInteger(value)) throw new Error('Invalid ground look');
    out[key] = value;
  }
  return out;
}
export function sanitizeGroundLook(input) { try { return validateGroundLook(input); } catch { return null; } }
// Only the values that differ from the game's look; null when nothing differs.
export function groundLookDiff(look) {
  const clean = sanitizeGroundLook(look); if (!clean) return null;
  const diff = Object.fromEntries(Object.entries(clean).filter(([k, v]) => Math.abs(v - GAME_GROUND_SETTINGS[k]) > 1e-9));
  return Object.keys(diff).length ? diff : null;
}

let override = null, merged = GAME_GROUND_SETTINGS;
// Set for the game being started or loaded (null = the game's own look). Invalid input counts as null.
export function setGroundOverride(look) {
  override = groundLookDiff(look);
  merged = override ? Object.freeze({ ...GAME_GROUND_SETTINGS, ...override }) : GAME_GROUND_SETTINGS;
  return override;
}
export const groundOverride = () => override ? { ...override } : null;
// The settings the game paints with (same object until the override changes).
export const groundSettings = () => merged;
