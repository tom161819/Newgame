// World Editor storage (plan m-world-editor-obrazovka): named presets and the last used settings, in this browser's
// localStorage only. A record is {levels, seed, ground}; ground holds only the ground-look values that differ from the
// game's look (null = game look). Broken or foreign records are skipped, never thrown; writes report 'full' or
// 'unavailable' instead of throwing, so the editor and the game keep working without storage.
import { validLevels, defaultWorldLevels, encodeWorldCode, randomSeed, WORLD_SEED_MAX, fullLevels } from './worldCode.js';
import { groundLookDiff, sanitizeGroundLook } from './groundLook.js';

export const PRESETS_KEY = 'newgame.worldEditor.presets', LAST_KEY = 'newgame.worldEditor.last';
export const MAX_PRESETS = 30, NAME_MAX = 40;

export const defaultEditorState = (seed = randomSeed()) => ({ levels: defaultWorldLevels(), seed, ground: null });
export const editorWorldCode = state => encodeWorldCode({ levels: state.levels, seed: state.seed });

// A valid record, or null.
export function normalizeRecord(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  // Generator 6 added four terrain settings: a preset saved before (12 levels) is kept with the default terrain.
  const levels = validLevels(input.levels) ? input.levels : validLevels(input.levels, 5) ? fullLevels(input.levels) : null;
  if (!levels || !Number.isSafeInteger(input.seed) || input.seed < 0 || input.seed > WORLD_SEED_MAX) return null;
  if (input.ground != null && !sanitizeGroundLook(input.ground)) return null;
  return { levels: [...levels], seed: input.seed, ground: input.ground == null ? null : groundLookDiff(input.ground) };
}
function normalizePreset(input) {
  const record = normalizeRecord(input), name = typeof input?.name === 'string' ? input.name.trim().slice(0, NAME_MAX) : '';
  return record && name ? { name, ...record, at: typeof input.at === 'string' ? input.at : '' } : null;
}

const errorReason = error => error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014 ? 'full' : 'unavailable';
function read(storage, key) { try { const text = storage?.getItem(key); return text ? JSON.parse(text) : null; } catch { return null; } }
function write(storage, key, value) {
  if (!storage) return { ok: false, reason: 'unavailable' };
  try { storage.setItem(key, JSON.stringify(value)); return { ok: true }; } catch (error) { return { ok: false, reason: errorReason(error) }; }
}

export function readPresets(storage) {
  const list = read(storage, PRESETS_KEY), seen = new Set();
  return (Array.isArray(list) ? list : []).map(normalizePreset).filter(p => p && !seen.has(p.name) && seen.add(p.name));
}
// Saving under an existing name replaces it. Returns {ok, presets} or {ok:false, reason: 'name'|'many'|'full'|'unavailable'}.
export function savePreset(storage, name, state, now = new Date()) {
  const clean = String(name ?? '').trim().slice(0, NAME_MAX), record = normalizeRecord(state);
  if (!clean || !record) return { ok: false, reason: 'name' };
  const others = readPresets(storage).filter(p => p.name !== clean);
  if (others.length >= MAX_PRESETS) return { ok: false, reason: 'many' };
  const presets = [{ name: clean, ...record, at: now.toISOString() }, ...others];
  const result = write(storage, PRESETS_KEY, presets);
  return result.ok ? { ok: true, presets } : result;
}
export function deletePreset(storage, name) {
  const presets = readPresets(storage).filter(p => p.name !== name), result = write(storage, PRESETS_KEY, presets);
  return result.ok ? { ok: true, presets } : result;
}
export const readLast = storage => normalizeRecord(read(storage, LAST_KEY));
export function writeLast(storage, state) { const record = normalizeRecord(state); return record ? write(storage, LAST_KEY, record) : { ok: false, reason: 'name' }; }
// The ground look new games in this browser start with (null = the game's own look).
export const activeGroundLook = storage => readLast(storage)?.ground ?? null;
