import test from 'node:test';
import assert from 'node:assert/strict';
import { readPresets, savePreset, deletePreset, readLast, writeLast, activeGroundLook, defaultEditorState, editorWorldCode, normalizeRecord, PRESETS_KEY, LAST_KEY } from '../src/data/worldEditorStore.js';
import { GROUND_LOOK_SETTINGS, GAME_GROUND_SETTINGS, defaultGroundLook, validateGroundLook, groundLookDiff, setGroundOverride, groundOverride, groundSettings } from '../src/data/groundLook.js';
import { decodeWorldCode, encodeWorldCode, defaultWorldLevels, WORLD_SETTINGS, WORLD_GENERATOR_VERSION } from '../src/data/worldCode.js';
import groundStyle from '../src/data/groundStyle.json' with { type: 'json' };
import { workerScene } from './helpers/workerScene.js';
import { serializeGameState, validateGameState, SAVE_VERSION } from '../src/systems/GameStateSerializer.js';

const memoryStorage = ({ full = false } = {}) => { const data = new Map(); return { data, getItem: k => data.has(k) ? data.get(k) : null, setItem: (k, v) => { if (full) { const e = new Error('full'); e.name = 'QuotaExceededError'; throw e; } data.set(k, String(v)); }, removeItem: k => data.delete(k) }; };
const blocked = { getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } };

test('world editor: save, load and delete a named preset (mock localStorage)', () => {
  const storage = memoryStorage(), state = { levels: [2, 7, 5, 5, 0, 0, 5, 5, 8, 5, 5, 5], seed: 12345, ground: { reedBeds: 2, flowersSmall: 0.1 } };
  assert.deepEqual(readPresets(storage), []);
  const saved = savePreset(storage, '  River land  ', state, new Date('2026-11-08T10:00:00Z'));
  assert.equal(saved.ok, true);
  const [p] = readPresets(storage);
  assert.equal(p.name, 'River land'); assert.deepEqual(p.levels, state.levels); assert.equal(p.seed, 12345); assert.deepEqual(p.ground, { reedBeds: 2, flowersSmall: 0.1 }); assert.equal(p.at, '2026-11-08T10:00:00.000Z');
  assert.equal(editorWorldCode(p), encodeWorldCode({ levels: state.levels, seed: 12345 }));
  savePreset(storage, 'Second', { ...state, seed: 1 }); savePreset(storage, 'River land', { ...state, seed: 99 });
  assert.deepEqual(readPresets(storage).map(x => [x.name, x.seed]), [['River land', 99], ['Second', 1]], 'same name replaces, newest first');
  assert.equal(savePreset(storage, '   ', state).reason, 'name');
  assert.equal(deletePreset(storage, 'River land').ok, true); assert.deepEqual(readPresets(storage).map(x => x.name), ['Second']);
  // Last used settings and the ground look new games take.
  assert.equal(readLast(storage), null); assert.equal(activeGroundLook(storage), null);
  assert.equal(writeLast(storage, state).ok, true); assert.deepEqual(readLast(storage).levels, state.levels); assert.deepEqual(activeGroundLook(storage), { reedBeds: 2, flowersSmall: 0.1 });
  // A ground equal to the game look is stored as null (no override).
  writeLast(storage, { ...state, ground: defaultGroundLook() }); assert.equal(readLast(storage).ground, null);
});

test('world editor: storage full or blocked is reported, never thrown', () => {
  const state = defaultEditorState(5);
  assert.deepEqual(savePreset(memoryStorage({ full: true }), 'A', state), { ok: false, reason: 'full' });
  assert.deepEqual(writeLast(memoryStorage({ full: true }), state), { ok: false, reason: 'full' });
  assert.deepEqual(savePreset(blocked, 'A', state), { ok: false, reason: 'unavailable' });
  assert.deepEqual(writeLast(null, state), { ok: false, reason: 'unavailable' });
  assert.deepEqual(readPresets(blocked), []); assert.equal(readLast(blocked), null);
});

test('world editor: Default gives the default world code and the game ground look', () => {
  const state = defaultEditorState(parseInt('7KQ9X2', 36));
  assert.deepEqual(state.levels, defaultWorldLevels()); assert.equal(state.ground, null);
  assert.equal(editorWorldCode(state), `MKW${WORLD_GENERATOR_VERSION}-155515555555-7KQ9X2`);
  const look = defaultGroundLook();
  for (const s of GROUND_LOOK_SETTINGS) assert.equal(look[s.key], groundStyle.settings[s.key] ?? GAME_GROUND_SETTINGS[s.key], s.key);
  assert.equal(groundLookDiff(look), null, 'the default look is no override');
  assert.equal(GROUND_LOOK_SETTINGS.some(s => s.key.startsWith('fish')), false, 'fish sliders are not offered (the game has its own FishShadows)');
});

test('world editor: the world code follows every slider', () => {
  for (const [i, s] of WORLD_SETTINGS.entries()) for (const level of [0, s.max]) {
    const levels = defaultWorldLevels(); levels[i] = level;
    const code = editorWorldCode({ levels, seed: 777 }), decoded = decodeWorldCode(code);
    assert.deepEqual(decoded.levels, levels, `${s.key}=${level}`); assert.equal(decoded.seed, 777);
    assert.equal(code.split('-')[1][i], String(level));
  }
});

test('world editor: a corrupt storage record is ignored', () => {
  const storage = memoryStorage();
  storage.data.set(PRESETS_KEY, '{not json'); assert.deepEqual(readPresets(storage), []);
  storage.data.set(PRESETS_KEY, JSON.stringify({ name: 'x' })); assert.deepEqual(readPresets(storage), []);
  storage.data.set(PRESETS_KEY, JSON.stringify([
    { name: 'Good', levels: defaultWorldLevels(), seed: 3, ground: null },
    { name: 'Bad levels', levels: [9, 9], seed: 3 },
    { name: 'Bad seed', levels: defaultWorldLevels(), seed: -1 },
    { name: 'Bad ground', levels: defaultWorldLevels(), seed: 3, ground: { reedBeds: 99 } },
    { name: '', levels: defaultWorldLevels(), seed: 3 },
    null, 'text',
  ]));
  assert.deepEqual(readPresets(storage).map(p => p.name), ['Good']);
  savePreset(storage, 'New', defaultEditorState(4)); assert.deepEqual(readPresets(storage).map(p => p.name), ['New', 'Good'], 'saving drops the broken entries');
  storage.data.set(LAST_KEY, JSON.stringify({ levels: defaultWorldLevels(), seed: 3, ground: { unknownKey: 1 } })); assert.equal(readLast(storage), null); assert.equal(activeGroundLook(storage), null);
  assert.equal(normalizeRecord([1, 2]), null);
});

test('world editor: ground look validation and the game override', () => {
  assert.deepEqual(validateGroundLook({ reedBeds: 1.5, duckFamilies: 4 }), { reedBeds: 1.5, duckFamilies: 4 });
  for (const bad of [null, [], 'x', { reedBeds: 3 }, { reedBeds: -1 }, { reedBeds: '1' }, { reedBeds: NaN }, { duckFamilies: 2.5 }, { fishAmount: 1 }, { zoneColors: ['#000000'] }, { nope: 1 }]) assert.throws(() => validateGroundLook(bad), String(JSON.stringify(bad)));
  try {
    assert.equal(groundSettings(), GAME_GROUND_SETTINGS);
    setGroundOverride({ reedBeds: 2, flow: GAME_GROUND_SETTINGS.flow });
    assert.deepEqual(groundOverride(), { reedBeds: 2 }); assert.equal(groundSettings().reedBeds, 2); assert.equal(groundSettings().patchSize, GAME_GROUND_SETTINGS.patchSize);
    setGroundOverride({ reedBeds: 99 }); assert.equal(groundOverride(), null, 'an invalid look is no override');
  } finally { setGroundOverride(null); }
});

test('world editor: the ground look is an optional, validated save field (no SAVE_VERSION bump of its own)', () => {
  assert.equal(SAVE_VERSION, 63);
  const scene = workerScene();
  try {
    const plain = validateGameState(serializeGameState(scene)); assert.equal('groundLook' in plain, false, 'no override, no field');
    setGroundOverride({ reedBeds: 1.8, patchSize: 30 });
    const saved = validateGameState(serializeGameState(scene)); assert.deepEqual(saved.groundLook, { reedBeds: 1.8, patchSize: 30 });
    assert.deepEqual(validateGameState(JSON.parse(JSON.stringify(saved))).groundLook, { reedBeds: 1.8, patchSize: 30 }, 'round trip');
    for (const bad of [{ reedBeds: 50 }, { nope: 1 }, 'text', []]) assert.throws(() => validateGameState({ ...saved, groundLook: bad }), JSON.stringify(bad));
  } finally { setGroundOverride(null); }
});
