// World Lab (plan g-world-lab): try world codes with the game's own generator, check them, keep favourites in the page
// database and propose the default settings for the mechanics chat ("převzít svět").
import '../styles.css';
import './world-lab.css';
import { trackTopbarHeight } from '../lib/topbarHeight.js';
import {
  WORLD_GENERATOR_VERSION, WORLD_SETTINGS, WORLD_PRESETS, DEFAULT_WORLD_LEVELS, applyPresets, presetsFromLevels, randomSeed,
  readCode, makeCode, worldFor, checks, readFavourite, defaultsProposal, slug, PLAYER_START, COLUMNS, ROWS,
} from './model.js';
import { drawTopDown, drawIso, preload, whenImagesLoad } from './render.js';
import { GROUND_DEFAULTS, GROUND_SETTINGS, ZONE_NAMES, TIMES, SEASONS, WEATHERS } from './ground.js';

const $ = selector => document.querySelector(selector);
const STORAGE = 'asset-studio.world-lab.v1', FAVOURITES = 'worlds', DEFAULTS = 'worldDefaults', SPAN = 28;
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'value') node.value = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
const readDraft = () => { try { return JSON.parse(localStorage.getItem(STORAGE) ?? 'null'); } catch { return null; } };
const saved = readDraft();
const state = {
  levels: Array.isArray(saved?.levels) && saved.levels.length === WORLD_SETTINGS.length ? saved.levels : [...DEFAULT_WORLD_LEVELS],
  seed: Number.isSafeInteger(saved?.seed) ? saved.seed : randomSeed(),
  overlay: 'none', focus: { x: PLAYER_START.x, y: PLAYER_START.y }, world: null, report: null,
  ground: { mode: saved?.ground?.mode === 'tiles' ? 'tiles' : 'continuous', settings: { ...structuredClone(GROUND_DEFAULTS), ...(saved?.ground?.settings ?? {}) } },
  compare: '', worldB: null, reportB: null, favourites: new Map(), proposal: null,
};
const shared = { mode: 'local', db: null, user: null, uid: null, canWrite: null, names: new Map() };
const code = () => makeCode(state.levels, state.seed);
const setStatus = text => { $('#wl-status').textContent = text; };
const showAlert = text => { const el = $('#studio-alert'); el.textContent = text; el.hidden = !text; };

// ---------- generate and draw ----------
let pending = 0;
function regenerate() {
  const id = ++pending;
  try { localStorage.setItem(STORAGE, JSON.stringify({ levels: state.levels, seed: state.seed, ground: state.ground })); } catch { /* memory only */ }
  $('#wl-code').value = code();
  setStatus('Generating…');
  requestAnimationFrame(() => {
    if (id !== pending) return;
    const t = performance.now();
    state.world = worldFor(state.levels, state.seed); state.report = checks(state.world);
    setStatus(`Generated in ${Math.round(performance.now() - t)} ms · generator ${WORLD_GENERATOR_VERSION}`);
    drawAll(); renderChecks(); renderSettings(false);
  });
}
function drawAll() {
  if (!state.world) return;
  const scale = Math.max(3, Math.min(6, Math.floor(($('#wl-map-wrap').clientWidth || 420) / COLUMNS)));
  drawTopDown($('#wl-map'), state.world, { scale, overlay: state.overlay, focus: state.focus, span: SPAN });
  drawIso($('#wl-iso'), state.world, { focus: state.focus, span: SPAN, ground: state.ground });
  if (state.worldB) drawTopDown($('#wl-map-b'), state.worldB, { scale, overlay: state.overlay });
}
whenImagesLoad(() => { if (state.world) drawIso($('#wl-iso'), state.world, { focus: state.focus, span: SPAN }); });

// ---------- controls ----------
function settingRow(setting, i) {
  const value = state.levels[i];
  const input = h('input', { type: 'range', min: 0, max: setting.max, step: 1, value, 'data-setting': setting.key, 'aria-label': setting.name, oninput: e => { state.levels[i] = Number(e.target.value); out.textContent = describe(setting, state.levels[i]); scheduleRegenerate(); } });
  const out = h('output', {}, describe(setting, value));
  return h('label', { class: 'wl-setting' + (value !== DEFAULT_WORLD_LEVELS[i] ? ' changed' : '') }, h('span', { class: 'wl-setting-name' }, setting.name, h('b', {}, ` ${value}`)), input, out);
}
const describe = (setting, level) => setting.describe ? setting.describe(level) : String(level);
let timer = null;
function scheduleRegenerate() { clearTimeout(timer); timer = setTimeout(regenerate, 120); $('#wl-code').value = code(); }
function renderSettings(full = true) {
  const presets = presetsFromLevels(state.levels);
  const group = (name, label) => h('label', { class: 'wl-field' }, h('span', {}, label), h('select', { 'data-preset': name, onchange: e => { state.levels = applyPresets(state.levels, { [name]: e.target.value }); renderSettings(); scheduleRegenerate(); } },
    ...Object.keys(WORLD_PRESETS[name]).map(k => h('option', { value: k, selected: presets[name] === k }, k[0].toUpperCase() + k.slice(1))), presets[name] === 'custom' ? h('option', { value: 'custom', selected: true, disabled: true }, 'Custom') : null));
  $('#wl-presets').replaceChildren(group('water', 'Water'), group('desert', 'Desert'), group('forest', 'Forest'));
  if (full) $('#wl-settings').replaceChildren(...WORLD_SETTINGS.map(settingRow));
  else for (const [i, s] of WORLD_SETTINGS.entries()) { const row = $(`#wl-settings [data-setting="${s.key}"]`)?.closest('.wl-setting'); if (row) { row.classList.toggle('changed', state.levels[i] !== DEFAULT_WORLD_LEVELS[i]); row.querySelector('b').textContent = ` ${state.levels[i]}`; } }
  $('#wl-seed').value = state.seed.toString(36).toUpperCase();
}
function applyCode(text, { quiet = false } = {}) {
  const parsed = readCode(text);
  if (!parsed.ok) { if (!quiet) setStatus(parsed.message); $('#wl-code').setAttribute('aria-invalid', 'true'); return false; }
  $('#wl-code').removeAttribute('aria-invalid');
  state.levels = parsed.levels; state.seed = parsed.seed; renderSettings(); regenerate(); return true;
}

// ---------- checks ----------
const pct = v => `${v.toFixed(1)} %`;
function checkList(report) {
  const s = report.start, row = (label, value, ok = true) => h('div', { class: 'wl-check' + (ok ? '' : ' bad') }, h('span', {}, label), h('strong', {}, value));
  return [
    row('Water', pct(report.waterPercent)), row('Fords', `${report.fordTiles} tiles`), row('Lakes', String(report.lakes)), row('Tributary', report.tributary ? 'yes' : 'no'),
    row('Desert', pct(report.desertPercent)), row('Rock tiles', String(report.rocks)), row('Bushes · reeds', `${report.bushes} · ${report.reeds}`),
    row('Reachable from the castle', pct(report.reachablePercent), report.reachablePercent >= 99),
    h('h4', {}, `Start (radius ${s.radius})`),
    row('Grass', `${s.grass} (need ${s.needGrass})`, s.grass >= s.needGrass), row('Water distance', `${Number.isFinite(s.water) ? s.water.toFixed(1) : '—'} (max ${s.needWater})`, Number.isFinite(s.water) ? s.water <= s.needWater : state.levels[0] === 0),
    row('Forest cover', `${s.forest} tiles`, s.forest >= 40), row('Stony ground', `${s.stone} tiles`, s.stone >= 15), row('Fair-start attempt', String(s.attempt), s.ok),
    report.warnings.length ? h('ul', { class: 'wl-warnings' }, report.warnings.map(w => h('li', {}, w))) : h('p', { class: 'wl-ok' }, 'No warnings.'),
  ];
}
function renderChecks() {
  $('#wl-checks').replaceChildren(...checkList(state.report));
  const z = state.report.zones, total = Object.values(z).reduce((a, b) => a + b, 0) || 1;
  $('#wl-zones').replaceChildren(...Object.entries(z).map(([k, v]) => h('span', { class: `wl-zone z-${k.toLowerCase()}` }, `${k.toLowerCase().replace('_', ' ')} ${Math.round(100 * v / total)} %`)));
  if (state.reportB) $('#wl-checks-b').replaceChildren(...checkList(state.reportB));
}

// ---------- compare (A/B) ----------
function setCompare(text) {
  state.compare = text.trim();
  const box = $('#wl-compare');
  if (!state.compare) { state.worldB = null; state.reportB = null; box.hidden = true; return; }
  const parsed = readCode(state.compare);
  if (!parsed.ok) { setStatus(`Compare: ${parsed.message}`); state.worldB = null; box.hidden = true; return; }
  state.worldB = worldFor(parsed.levels, parsed.seed); state.reportB = checks(state.worldB);
  box.hidden = false; $('#wl-compare-code').textContent = parsed.code; drawAll(); renderChecks();
}

// ---------- favourites and default proposal ----------
const who = id => id === shared.uid ? 'you' : shared.names.get(id) || 'a reviewer';
function readLocalFavourites() { try { return JSON.parse(localStorage.getItem(`${STORAGE}.favourites`) ?? '[]'); } catch { return []; } }
function loadFavourites(docs) { state.favourites = new Map(docs.map(readFavourite).filter(f => f?.id).map(f => [f.id, f])); renderFavourites(); }
async function saveFavourite() {
  const name = $('#wl-fav-name').value.trim() || code(), note = $('#wl-fav-note').value.trim(), id = `${slug(name)}-${state.seed.toString(36)}`;
  const data = { code: code(), name, note, at: new Date().toISOString(), ...(shared.uid ? { by: shared.uid } : {}) };
  try {
    if (shared.mode === 'shared') await shared.db.doc(`${FAVOURITES}/${id}`).set(data);
    else { const list = readLocalFavourites().filter(f => f.id !== id); list.push({ id, ...data }); localStorage.setItem(`${STORAGE}.favourites`, JSON.stringify(list)); loadFavourites(list); }
    setStatus(`Saved „${name}“ to favourites`); $('#wl-fav-name').value = ''; $('#wl-fav-note').value = '';
  } catch (error) { showAlert(error?.code === 'permission_denied' || error?.code === 'invalid_argument' ? 'Saving needs Contributor access to the Studio page.' : `Not saved (${error?.code ?? 'unavailable'}).`); }
}
async function deleteFavourite(id) {
  try {
    if (shared.mode === 'shared') await shared.db.doc(`${FAVOURITES}/${id}`).delete();
    else { const list = readLocalFavourites().filter(f => f.id !== id); localStorage.setItem(`${STORAGE}.favourites`, JSON.stringify(list)); loadFavourites(list); }
  } catch (error) { showAlert(`Not deleted (${error?.code ?? 'unavailable'}).`); }
}
function renderFavourites() {
  const list = [...state.favourites.values()].sort((a, b) => b.at.localeCompare(a.at));
  $('#wl-favourites').replaceChildren(...(list.length ? list.map(f => h('li', { class: 'wl-fav', 'data-id': f.id },
    h('div', {}, h('strong', {}, f.name), f.oldGenerator ? h('span', { class: 'pill outdated' }, 'old generator') : !f.valid ? h('span', { class: 'pill outdated' }, 'invalid') : null,
      h('code', {}, f.code), f.note ? h('p', {}, f.note) : null, h('small', {}, `${f.by ? who(f.by) : 'this browser'}${f.at ? ` · ${f.at.slice(0, 10)}` : ''}`)),
    h('div', { class: 'wl-fav-actions' }, h('button', { type: 'button', class: 'button', disabled: !f.valid, onclick: () => applyCode(f.code) }, 'Open'), h('button', { type: 'button', class: 'button', disabled: !f.valid, onclick: () => { $('#wl-compare-input').value = f.code; setCompare(f.code); } }, 'Compare'),
      h('button', { type: 'button', class: 'button ghost', disabled: shared.canWrite === false, onclick: () => deleteFavourite(f.id) }, 'Delete'))))
    : [h('li', { class: 'empty' }, 'No favourite worlds yet.')]));
}
async function proposeDefault() {
  let data;
  try { data = defaultsProposal(state.levels, { by: shared.uid, note: $('#wl-default-note').value.trim() }); } catch { return; }
  try {
    if (shared.mode === 'shared') await shared.db.doc(`${DEFAULTS}/proposal`).set(data);
    else localStorage.setItem(`${STORAGE}.proposal`, JSON.stringify(data));
    state.proposal = data; renderSummary(); setStatus('Proposed as the default world settings.');
  } catch (error) { showAlert(error?.code === 'permission_denied' || error?.code === 'invalid_argument' ? 'Proposing needs Contributor access to the Studio page.' : `Not saved (${error?.code ?? 'unavailable'}).`); }
}
function renderSummary() {
  const p = state.proposal;
  $('#wl-summary').textContent = p ? `World defaults waiting for Claude (${p.levels.join('')}) — write „převzít svět“ in the MK chat Mechaniky.` : `Game defaults ${DEFAULT_WORLD_LEVELS.join('')} · generator ${WORLD_GENERATOR_VERSION}`;
}

// ---------- shared database ----------
async function connectShared() {
  const claude = window.claude;
  if (typeof claude?.use !== 'function') return;
  const [db, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('user').catch(() => null)]);
  if (!db) return;
  shared.db = db; shared.user = user;
  shared.uid = user ? await user.id().catch(() => null) : null;
  shared.canWrite = user ? await Promise.resolve(user.can?.('data.write')).catch(() => null) ?? null : null;
  if (shared.canWrite === false) for (const b of document.querySelectorAll('[data-needs-write]')) b.disabled = true;
  db.collection(FAVOURITES).onSnapshot(snap => { shared.mode = 'shared'; loadFavourites(snap.docs.filter(d => d.exists).map(d => ({ id: d.id, data: d.data() }))); resolveNames(); },
    error => { if (error?.code !== 'revoked') showAlert(`Favourites stopped updating (${error?.code ?? 'unavailable'}). Reload the page.`); });
  db.collection(DEFAULTS).onSnapshot(snap => { shared.mode = 'shared'; const doc = snap.docs.find(d => d.exists && d.id === 'proposal'); state.proposal = doc ? doc.data() : null; renderSummary(); }, () => {});
}
async function resolveNames() {
  if (!shared.user?.profiles) return;
  const ids = [...new Set([...state.favourites.values()].map(f => f.by).filter(id => id && id !== shared.uid && !shared.names.has(id)))];
  if (!ids.length) return;
  try { const p = await shared.user.profiles(ids); for (const id of ids) if (p?.[id]?.name) shared.names.set(id, p[id].name); renderFavourites(); } catch { /* optional */ }
}

// ---------- map interaction ----------
function focusFromMap(event, canvas) {
  const r = canvas.getBoundingClientRect(), x = Math.floor((event.clientX - r.left) / r.width * COLUMNS), y = Math.floor((event.clientY - r.top) / r.height * ROWS);
  state.focus = { x: Math.max(SPAN / 2, Math.min(COLUMNS - SPAN / 2, x)), y: Math.max(SPAN / 2, Math.min(ROWS - SPAN / 2, y)) }; drawAll();
}
let dragMap = false;
$('#wl-map').addEventListener('pointerdown', e => { dragMap = true; e.target.setPointerCapture(e.pointerId); focusFromMap(e, e.target); });
$('#wl-map').addEventListener('pointermove', e => { if (dragMap) focusFromMap(e, e.target); });
$('#wl-map').addEventListener('pointerup', () => { dragMap = false; });
let dragIso = null;
$('#wl-iso').addEventListener('pointerdown', e => { dragIso = { x: e.clientX, y: e.clientY, focus: { ...state.focus } }; e.target.setPointerCapture(e.pointerId); });
$('#wl-iso').addEventListener('pointermove', e => {
  if (!dragIso) return;
  const r = e.target.getBoundingClientRect(), k = e.target.width / r.width, dx = (e.clientX - dragIso.x) * k / 32, dy = (e.clientY - dragIso.y) * k / 16;
  state.focus = { x: Math.max(SPAN / 2, Math.min(COLUMNS - SPAN / 2, Math.round(dragIso.focus.x - (dx + dy) / 2))), y: Math.max(SPAN / 2, Math.min(ROWS - SPAN / 2, Math.round(dragIso.focus.y - (dy - dx) / 2))) }; drawAll();
});
$('#wl-iso').addEventListener('pointerup', () => { dragIso = null; });

// ---------- boot ----------
$('#wl-code').addEventListener('change', e => applyCode(e.target.value));
$('#wl-apply').addEventListener('click', () => applyCode($('#wl-code').value));
$('#wl-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(code()); setStatus(`Copied ${code()}`); } catch { $('#wl-code').select(); setStatus('Select and copy the code'); } });
$('#wl-random').addEventListener('click', () => { state.seed = randomSeed(); renderSettings(false); regenerate(); });
$('#wl-seed').addEventListener('change', e => { const v = parseInt(e.target.value.trim(), 36); if (Number.isSafeInteger(v) && v >= 0 && v <= 36 ** 8 - 1) { state.seed = v; regenerate(); } else setStatus('The seed is 1–8 letters or digits (base 36).'); });
$('#wl-reset').addEventListener('click', () => { state.levels = [...DEFAULT_WORLD_LEVELS]; renderSettings(); regenerate(); });
$('#wl-overlay').addEventListener('change', e => { state.overlay = e.target.value; drawAll(); });
$('#wl-compare-input').addEventListener('change', e => setCompare(e.target.value));
$('#wl-compare-close').addEventListener('click', () => { $('#wl-compare-input').value = ''; setCompare(''); });
$('#wl-fav-save').addEventListener('click', saveFavourite);
$('#wl-propose').addEventListener('click', proposeDefault);
$('#wl-center').addEventListener('click', () => { state.focus = { x: PLAYER_START.x, y: PLAYER_START.y }; drawAll(); });
window.addEventListener('resize', () => drawAll());
try { state.proposal = JSON.parse(localStorage.getItem(`${STORAGE}.proposal`) ?? 'null'); } catch { state.proposal = null; }
window.worldLab = {
  ready: false,
  code, levels: () => [...state.levels], seed: () => state.seed, report: () => state.report, reportB: () => state.reportB,
  applyCode, setLevel: (key, level) => { const i = WORLD_SETTINGS.findIndex(s => s.key === key); state.levels[i] = level; renderSettings(); regenerate(); },
  favourites: () => [...state.favourites.values()], proposal: () => state.proposal, focus: () => ({ ...state.focus }),
};
trackTopbarHeight();
preload();
renderSettings(); renderSummary(); loadFavourites(readLocalFavourites());
regenerate();
connectShared();
const readyCheck = setInterval(() => { if (state.world) { window.worldLab.ready = true; clearInterval(readyCheck); } }, 50);

// ---------- continuous ground (plan g-souvisla-zeme) ----------
function saveGround() { try { localStorage.setItem(STORAGE, JSON.stringify({ levels: state.levels, seed: state.seed, ground: state.ground })); } catch { /* memory only */ } }
let groundTimer = null;
function renderGround() {
  for (const b of document.querySelectorAll('#wl-ground [data-ground]')) b.setAttribute('aria-pressed', String(b.dataset.ground === state.ground.mode));
  const box = $('#wl-ground-settings'), redraw = () => { saveGround(); clearTimeout(groundTimer); groundTimer = setTimeout(drawAll, 90); };
  const seg = (label, list, key) => h('div', { class: 'wl-seg' }, h('span', {}, label), h('div', { class: 'segmented', role: 'group', 'aria-label': label }, list.map(([id, text]) => h('button', { type: 'button', 'aria-pressed': String(state.ground.settings[key] === id), onclick: () => { state.ground.settings[key] = id; saveGround(); renderGround(); drawAll(); } }, text))));
  const scene = h('div', { class: 'wl-ground-scene' }, seg('Time of day', TIMES, 'time'), seg('Season', SEASONS, 'season'), seg('Weather', WEATHERS, 'weather'));
  const colours = h('div', { class: 'wl-ground-colours' }, h('span', {}, 'Grass shades'), ZONE_NAMES.map((name, i) => h('label', { class: 'wl-colour' }, h('input', { type: 'color', value: state.ground.settings.zoneColors[i], 'aria-label': name, oninput: e => { state.ground.settings.zoneColors = state.ground.settings.zoneColors.map((c, j) => j === i ? e.target.value : c); redraw(); } }), name)));
  scene.hidden = false;
  const sliders = GROUND_SETTINGS.map(s => {
    const out = h('output', {}, String(state.ground.settings[s.key]));
    const input = h('input', { type: 'range', min: s.min, max: s.max, step: s.step, value: state.ground.settings[s.key], 'aria-label': s.label, oninput: e => { state.ground.settings[s.key] = +e.target.value; out.textContent = e.target.value; redraw(); } });
    return h('label', { class: 'wl-setting' }, h('span', {}, s.label), input, out);
  });
  const plants = sliders.filter((_, i) => GROUND_SETTINGS[i].group === 'plants'), ground = sliders.filter((_, i) => GROUND_SETTINGS[i].group !== 'plants');
  box.replaceChildren(scene, ...(state.ground.mode === 'continuous' ? [colours, h('div', { class: 'wl-ground-grid' }, h('h5', {}, 'Ground'), ground), h('div', { class: 'wl-ground-grid' }, h('h5', {}, 'Plants'), plants)] : []));
}
for (const b of document.querySelectorAll('#wl-ground [data-ground]')) b.addEventListener('click', () => { state.ground.mode = b.dataset.ground; saveGround(); renderGround(); drawAll(); });
$('#wl-ground-reset').addEventListener('click', () => { state.ground.settings = structuredClone(GROUND_DEFAULTS); saveGround(); renderGround(); drawAll(); });
$('#wl-ground-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(JSON.stringify(state.ground.settings)); $('#wl-ground-status').textContent = 'Copied.'; } catch { $('#wl-ground-status').textContent = JSON.stringify(state.ground.settings); } });
$('#wl-ground-propose').addEventListener('click', async () => {
  const status = $('#wl-ground-status');
  if (shared.mode !== 'shared') { status.textContent = 'Saved in this browser only (shared database unavailable).'; return; }
  try { await shared.db.doc('groundProposal/default').set({ settings: state.ground.settings, by: shared.uid ?? '', at: new Date().toISOString() }); status.textContent = 'Proposed – write „převzít zemi“ in the MK chat.'; }
  catch (error) { status.textContent = `Could not save: ${error?.message ?? error}`; }
});
renderGround();
window.worldLab = Object.assign(window.worldLab ?? {}, { ground: () => structuredClone(state.ground) });
