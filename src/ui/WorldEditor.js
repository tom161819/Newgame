// World Editor (plan m-world-editor-obrazovka, owner 8 Nov 2026): a full screen from the main menu (and from New Game →
// Custom settings → World) with every World Lab option the game uses: the 12 generator settings (they make the world
// code) and the ground look (patches, zone transitions, plants, stones, river look; an override over groundStyle.json).
// Left: option tabs; right: the whole map from above and an isometric close-up painted with the game's own continuous
// ground engine; bottom: world code, New seed, Copy world code, Default, Start game, Back. Presets and the last used
// settings live in this browser (worldEditorStore.js); a storage failure shows a message and nothing else stops.
import { COLUMNS, ROWS, PLAYER_START } from '../game/config.js';
import { GROUND } from '../data/worldTerrain.js';
import { BUSH_TYPES } from '../data/worldTerrain.js';
import { decorations as DECORATION_DEFS } from '../data/objects/decorations.js';
import { WORLD_SETTINGS, decodeWorldCode, randomSeed, defaultWorldLevels } from '../data/worldCode.js';
import { GROUND_LOOK_SETTINGS, GAME_GROUND_SETTINGS, defaultGroundLook, groundLookDiff } from '../data/groundLook.js';
import { paintContinuousGround, makeWaterField, plantsFor, waterObjectsFor, drawPlant, yearOf, SEASONS } from '../render/continuousGround.js';
import { readPresets, savePreset, deletePreset, readLast, writeLast, editorWorldCode, NAME_MAX } from '../data/worldEditorStore.js';
import { previewWorld, previewPixels, describe } from './WorldGenerator.js';
import { t } from '../i18n/index.js';

const GEN = key => WORLD_SETTINGS.findIndex(s => s.key === key);
const LOOK = group => GROUND_LOOK_SETTINGS.filter(s => (s.group ?? 'ground') === group).map(s => s.key);
export const EDITOR_TABS = Object.freeze([
  { id: 'water', gen: ['rivers', 'riverWidth', 'meanders', 'fords', 'lakes', 'sandyBanks', 'bankVegetation'] },
  { id: 'land', gen: ['desert', 'forest', 'rocks', 'bushes', 'grassScale'] },
  { id: 'ground', look: LOOK('ground') },
  { id: 'plants', look: LOOK('plants') },
  { id: 'stones', look: LOOK('stones') },
  { id: 'river', look: [...LOOK('water'), ...LOOK('waterObjects'), ...LOOK('life')] },
  { id: 'preview', season: true },
  { id: 'saved', presets: true },
]);
const LOOK_BY_KEY = new Map(GROUND_LOOK_SETTINGS.map(s => [s.key, s]));
const fullLook = diff => ({ ...defaultGroundLook(), ...(diff ?? {}) });
const decimals = step => (String(step).split('.')[1] ?? '').length;

// ---------- isometric close-up: the game's continuous ground engine over a span × span window ----------
const LAND = { [GROUND.BEACH]: 6, [GROUND.DESERT]: 7, [GROUND.MUD]: 8, [GROUND.SHORE_ROCKS]: 9 };
const DEPTH = { [GROUND.FORD]: 0.15, [GROUND.SHALLOW]: 0.5, [GROUND.DEEP]: 1 };
const decoration = new Map(DECORATION_DEFS.map(d => [d.id, d])), images = new Map();
function sprite(id, onload) {
  const path = decoration.get(id)?.sprite; if (!path) return null;
  let entry = images.get(path);
  if (!entry) { const img = new Image(); entry = { img, ready: false }; img.onload = () => { entry.ready = true; onload?.(); }; img.src = `${import.meta.env?.BASE_URL ?? '/'}${path.replace(/^\//, '')}`; images.set(path, entry); }
  return entry.ready ? entry.img : null;
}
export function drawIsoPreview(canvas, world, { focus, span = 18, settings, seed = 0, onImage }) {
  const W = 64, H = 32, headroom = 48;
  const x0 = Math.max(0, Math.min(COLUMNS - span, Math.round(focus.x - span / 2))), y0 = Math.max(0, Math.min(ROWS - span, Math.round(focus.y - span / 2)));
  canvas.width = span * W; canvas.height = span * H + headroom + 8;
  const ctx = canvas.getContext('2d', { willReadFrequently: true }); ctx.fillStyle = '#1d2418'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const cell = (x, y) => world.ground[Math.max(0, Math.min(ROWS - 1, y))]?.[Math.max(0, Math.min(COLUMNS - 1, x))];
  const isGrass = (x, y) => { const g = cell(x, y); return g === GROUND.GRASS || LAND[g] !== undefined; };
  const zoneAt = (x, y) => { const g = cell(x, y); return g === GROUND.GRASS ? world.zones[Math.max(0, Math.min(ROWS - 1, y))]?.[Math.max(0, Math.min(COLUMNS - 1, x))] ?? 0 : LAND[g] ?? 0; };
  const depthAt = (x, y) => DEPTH[cell(x, y)] ?? -1, inWorld = (x, y) => x >= 0 && y >= 0 && x < COLUMNS && y < ROWS;
  const toWorld = (px, py) => { const a = (px - canvas.width / 2) / (W / 2), b = (py - headroom) / (H / 2); return [x0 + (a + b) / 2, y0 + (b - a) / 2]; };
  const screen = (fx, fy) => [(fx - x0 - (fy - y0)) * (W / 2) + canvas.width / 2, (fx - x0 + (fy - y0)) * (H / 2) + headroom];
  const field = makeWaterField({ x0, y0, span, depthAt, settings });
  paintContinuousGround(ctx, { width: canvas.width, height: canvas.height, toWorld, isGrass, zoneAt, depthAt, inWorld, field, settings });
  const season = SEASONS.find(([id]) => yearOf(id) === settings.year)?.[0] ?? 'summer', objects = [];
  const free = (fx, fy) => world.terrain[Math.floor(fy)]?.[Math.floor(fx)] !== 1 && !world.bushes?.has?.(`${Math.floor(fx)},${Math.floor(fy)}`);
  for (const p of waterObjectsFor({ x0, y0, span, field, depthAt, settings })) { const [sx, sy] = screen(p.fx, p.fy); if (p.flat) drawPlant(ctx, p, sx, sy, season); else objects.push({ plant: p, d: p.fx + p.fy, sx, sy }); }
  for (const p of plantsFor({ x0, y0, span, isGrass, zoneAt, depthAt, field, settings, seed })) if (free(p.fx, p.fy)) { const [sx, sy] = screen(p.fx, p.fy); objects.push({ plant: p, d: p.fx + p.fy, sx, sy }); }
  for (let y = y0; y < y0 + span; y++) for (let x = x0; x < x0 + span; x++) {
    const id = world.terrain[y][x] === 1 ? 'rock_outcrop' : world.bushes?.has?.(`${x},${y}`) ? BUSH_TYPES[world.bushes.get(`${x},${y}`)] ?? BUSH_TYPES[0] : null;
    if (id) { const [sx, sy] = screen(x, y); objects.push({ id, d: x + y + 1, sx, sy: sy + H / 2 }); }
  }
  for (const o of objects.sort((a, b) => a.d - b.d)) {
    if (o.plant) { drawPlant(ctx, o.plant, o.sx, o.sy, season); continue; }
    const img = sprite(o.id, onImage), def = decoration.get(o.id);
    if (img) ctx.drawImage(img, o.sx - img.width * (def.origin?.x ?? 0.5), o.sy - img.height * (def.origin?.y ?? 0.5));
    else { ctx.fillStyle = o.id === 'rock_outcrop' ? '#5c584c' : '#2c5424'; ctx.beginPath(); ctx.ellipse(o.sx, o.sy - 8, 22, 12, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (PLAYER_START.x >= x0 && PLAYER_START.x < x0 + span && PLAYER_START.y >= y0 && PLAYER_START.y < y0 + span) {
    const [sx, sy] = screen(PLAYER_START.x, PLAYER_START.y); ctx.strokeStyle = '#ffdf8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + W / 2, sy + H / 2); ctx.lineTo(sx, sy + H); ctx.lineTo(sx - W / 2, sy + H / 2); ctx.closePath(); ctx.stroke();
  }
  return { x0, y0, span };
}

// The close-up starts on the river bank nearest the castle (the ground look shows best there), else on the castle.
function bankNear(world) {
  for (let r = 0; r < 40; r++) for (let y = PLAYER_START.y - r; y <= PLAYER_START.y + r; y++) for (let x = PLAYER_START.x - r; x <= PLAYER_START.x + r; x++) {
    if (Math.max(Math.abs(x - PLAYER_START.x), Math.abs(y - PLAYER_START.y)) !== r) continue;
    if (DEPTH[world.ground[y]?.[x]] !== undefined) return { x, y };
  }
  return { ...PLAYER_START };
}
const el = (tag, attrs = {}, ...kids) => { const e = document.createElement(tag); for (const [k, v] of Object.entries(attrs)) { if (k === 'text') e.textContent = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); } e.append(...kids.filter(Boolean)); return e; };

export class WorldEditor {
  // storage: localStorage (or null); onStart({levels, seed}); onBack({levels, seed}).
  constructor({ storage, onStart, onBack }) {
    this.storage = storage; this.onStart = onStart; this.onBack = onBack;
    this.root = document.querySelector('#world-editor'); this.tab = 'water'; this.season = 'summer'; this.focus = { ...PLAYER_START };
    this.tabs = this.root.querySelector('.we-tabs'); this.panel = this.root.querySelector('.we-panel');
    this.map = this.root.querySelector('#we-map'); this.iso = this.root.querySelector('#we-iso');
    this.code = this.root.querySelector('#we-code'); this.codeError = this.root.querySelector('#we-code-error'); this.status = this.root.querySelector('#we-status');
    this.code.addEventListener('input', () => this.readCode());
    this.root.querySelector('#we-new-seed').addEventListener('click', () => { this.state.seed = randomSeed(); this.changed(); });
    this.root.querySelector('#we-copy').addEventListener('click', () => { const code = this.code.value.trim(); navigator.clipboard?.writeText(code).then(() => this.say(t('editor.copied')), () => {}).catch(() => {}); this.code.select(); });
    this.root.querySelector('#we-start').addEventListener('click', () => { if (this.codeError.hidden === false) return; this.persist(true); this.onStart({ levels: [...this.state.levels], seed: this.state.seed }); });
    this.root.querySelector('#we-back').addEventListener('click', () => { this.persist(true); this.close(); this.onBack({ levels: [...this.state.levels], seed: this.state.seed }); });
    const confirm = this.root.querySelector('.we-confirm');
    this.root.querySelector('#we-default').addEventListener('click', () => { confirm.hidden = false; this.root.querySelector('#we-default-yes').focus(); });
    this.root.querySelector('#we-default-no').addEventListener('click', () => { confirm.hidden = true; });
    this.root.querySelector('#we-default-yes').addEventListener('click', () => { confirm.hidden = true; this.resetAll(); this.say(t('editor.defaultDone')); });
    this.map.addEventListener('click', event => { const r = this.map.getBoundingClientRect(); this.focusAuto = false; this.focus = { x: Math.floor((event.clientX - r.left) / r.width * COLUMNS), y: Math.floor((event.clientY - r.top) / r.height * ROWS) }; this.draw(); });
    this.root.addEventListener('keydown', event => { if (event.key === 'Escape' && !this.root.hidden) { event.stopPropagation(); this.root.querySelector('#we-back').click(); } });
    this.state = { levels: defaultWorldLevels(), seed: randomSeed(), ground: defaultGroundLook() };
  }
  // world: {levels, seed} to edit (from New Game), else the last used settings, else the defaults with a new seed.
  open(world = null) {
    const last = readLast(this.storage);
    this.state = { levels: [...(world?.levels ?? last?.levels ?? defaultWorldLevels())], seed: world?.seed ?? last?.seed ?? randomSeed(), ground: fullLook(last?.ground) };
    this.root.querySelector('.we-confirm').hidden = true; this.say(''); this.focusAuto = true;
    this.root.hidden = false; this.renderTabs(); this.changed({ persist: false }); this.tabs.querySelector('[aria-selected="true"]')?.focus();
  }
  close() { this.root.hidden = true; clearTimeout(this.timer); }
  relabel() { if (!this.root.hidden) { this.renderTabs(); this.writeCode(); } }
  say(text) { this.status.textContent = text; }
  storageMessage(result) { if (!result.ok) this.say(t(`editor.storage.${result.reason}`)); return result.ok; }
  record() { return { levels: this.state.levels, seed: this.state.seed, ground: groundLookDiff(this.state.ground) }; }
  persist(now = false) {
    clearTimeout(this.saveTimer);
    const run = () => { const result = writeLast(this.storage, this.record()); if (!result.ok && !this.warned) { this.warned = true; this.storageMessage(result); } };
    if (now) run(); else this.saveTimer = setTimeout(run, 300);
  }
  resetAll() { this.state = { levels: defaultWorldLevels(), seed: this.state.seed, ground: defaultGroundLook() }; this.season = 'summer'; this.renderPanel(); this.changed(); }
  resetTab(tab) {
    const defaults = defaultWorldLevels(), look = defaultGroundLook();
    for (const key of tab.gen ?? []) this.state.levels[GEN(key)] = defaults[GEN(key)];
    for (const key of tab.look ?? []) this.state.ground[key] = look[key];
    if (tab.season) this.season = 'summer';
    this.renderPanel(); this.changed();
  }
  changed({ persist = true } = {}) { this.writeCode(); clearTimeout(this.timer); this.timer = setTimeout(() => this.draw(), 140); if (persist) this.persist(); }
  writeCode() { this.code.value = editorWorldCode(this.state); this.codeError.hidden = true; this.code.setAttribute('aria-invalid', 'false'); }
  readCode() {
    try { const { levels, seed } = decodeWorldCode(this.code.value); this.state.levels = levels; this.state.seed = seed; this.codeError.hidden = true; this.code.setAttribute('aria-invalid', 'false'); this.renderPanel(); clearTimeout(this.timer); this.timer = setTimeout(() => this.draw(), 140); this.persist(); }
    catch (error) { this.codeError.hidden = false; this.codeError.textContent = error.reason === 'generator' ? error.message : t('setup.worldCodeInvalid'); this.code.setAttribute('aria-invalid', 'true'); }
  }
  renderTabs() {
    this.tabs.replaceChildren(...EDITOR_TABS.map(tab => el('button', { type: 'button', role: 'tab', id: `we-tab-${tab.id}`, 'data-tab': tab.id, 'aria-selected': String(tab.id === this.tab), 'aria-controls': 'we-panel', text: t(`editor.tab.${tab.id}`), onclick: () => { this.tab = tab.id; this.renderTabs(); } })));
    this.renderPanel();
  }
  renderPanel() {
    const tab = EDITOR_TABS.find(x => x.id === this.tab);
    const head = el('div', { class: 'we-panel-head' }, el('h2', { text: t(`editor.tab.${tab.id}`) }),
      tab.presets ? null : el('button', { type: 'button', class: 'we-reset-tab', 'data-reset-tab': tab.id, title: t('editor.resetTab'), 'aria-label': t('editor.resetTab'), text: '↺', onclick: () => this.resetTab(tab) }));
    const rows = [];
    for (const key of tab.gen ?? []) {
      const i = GEN(key), s = WORLD_SETTINGS[i], out = el('output', { text: describe(s, this.state.levels[i]) });
      const input = el('input', { type: 'range', min: 0, max: s.max, step: 1, name: `we-${key}`, value: this.state.levels[i], oninput: e => { this.state.levels[i] = Number(e.target.value); out.textContent = describe(s, this.state.levels[i]); this.changed(); } });
      rows.push(el('label', { class: 'we-row' }, el('span', { text: t(`setup.gen.${key}`) }), out, input));
    }
    for (const key of tab.look ?? []) {
      const s = LOOK_BY_KEY.get(key), d = decimals(s.step), out = el('output', { text: Number(this.state.ground[key]).toFixed(d) });
      const input = el('input', { type: 'range', min: s.min, max: s.max, step: s.step, name: `we-${key}`, value: this.state.ground[key], oninput: e => { this.state.ground[key] = Number(e.target.value); out.textContent = Number(e.target.value).toFixed(d); this.changed(); } });
      rows.push(el('label', { class: 'we-row' }, el('span', { text: t(`editor.look.${key}`) }), out, input));
    }
    if (tab.look) rows.push(el('p', { class: 'we-help', text: t('editor.lookHelp') }));
    if (tab.season) {
      rows.push(el('p', { class: 'we-help', text: t('editor.seasonHelp') }), el('div', { class: 'we-seasons', role: 'group', 'aria-label': t('editor.tab.preview') }, ...SEASONS.map(([id]) => el('button', { type: 'button', 'data-season': id, 'aria-pressed': String(this.season === id), text: t(`season.${id[0].toUpperCase()}${id.slice(1)}`), onclick: () => { this.season = id; this.renderPanel(); this.draw(); } }))));
    }
    if (tab.presets) rows.push(...this.presetRows());
    this.panel.replaceChildren(head, ...rows);
  }
  presetRows() {
    const name = el('input', { type: 'text', id: 'we-preset-name', maxlength: NAME_MAX, placeholder: t('editor.presetName'), 'aria-label': t('editor.presetName') });
    const save = el('button', { type: 'button', id: 'we-preset-save', text: t('editor.presetSave'), onclick: () => {
      const result = savePreset(this.storage, name.value, this.record());
      if (result.ok) { this.say(t('editor.presetSaved', { name: name.value.trim() })); this.renderPanel(); } else this.say(t(result.reason === 'name' ? 'editor.presetNameMissing' : result.reason === 'many' ? 'editor.presetTooMany' : `editor.storage.${result.reason}`));
    } });
    const presets = readPresets(this.storage);
    const list = el('ul', { class: 'we-presets' }, ...(presets.length ? presets.map(p => el('li', { 'data-preset': p.name }, el('span', { class: 'we-preset-name', text: p.name }), el('code', { text: editorWorldCode(p) }),
      el('button', { type: 'button', 'data-preset-load': p.name, text: t('editor.presetLoad'), onclick: () => { this.state = { levels: [...p.levels], seed: p.seed, ground: fullLook(p.ground) }; this.say(t('editor.presetLoaded', { name: p.name })); this.changed(); } }),
      el('button', { type: 'button', 'data-preset-delete': p.name, text: t('editor.presetDelete'), onclick: () => { const result = deletePreset(this.storage, p.name); if (this.storageMessage(result)) { this.say(t('editor.presetDeleted', { name: p.name })); this.renderPanel(); } } })))
      : [el('li', { class: 'empty', text: t('editor.presetNone') })]));
    return [el('p', { class: 'we-help', text: t('editor.presetHelp') }), el('div', { class: 'we-preset-form' }, name, save), list];
  }
  previewSettings() { return { ...GAME_GROUND_SETTINGS, ...this.state.ground, year: yearOf(this.season), season: this.season }; }
  draw() {
    if (this.root.hidden) return;
    const started = performance.now(), world = previewWorld(this.state.levels, this.state.seed); this.lastWorld = world;
    if (this.focusAuto) this.focus = bankNear(world);
    const scale = 4, small = document.createElement('canvas'); small.width = COLUMNS; small.height = ROWS;
    small.getContext('2d').putImageData(new ImageData(previewPixels(world), COLUMNS, ROWS), 0, 0);
    this.map.width = COLUMNS * scale; this.map.height = ROWS * scale;
    const ctx = this.map.getContext('2d'); ctx.imageSmoothingEnabled = false; ctx.drawImage(small, 0, 0, COLUMNS * scale, ROWS * scale);
    ctx.fillStyle = '#b3261e'; ctx.fillRect((PLAYER_START.x - 1) * scale, (PLAYER_START.y - 1) * scale, 3 * scale, 3 * scale);
    const view = drawIsoPreview(this.iso, world, { focus: this.focus, settings: this.previewSettings(), seed: this.state.seed, onImage: () => { clearTimeout(this.imageTimer); this.imageTimer = setTimeout(() => this.draw(), 60); } });
    ctx.strokeStyle = 'rgb(255 255 255 / .9)'; ctx.lineWidth = 2; ctx.strokeRect(view.x0 * scale, view.y0 * scale, view.span * scale, view.span * scale);
    this.lastMs = performance.now() - started; this.root.dataset.drawn = String((Number(this.root.dataset.drawn) || 0) + 1);
  }
}
