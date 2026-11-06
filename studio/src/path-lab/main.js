// Path Lab (#115): an editable test map for trodden paths. Current (N12) is the production renderer; the
// Experimental V2 renderer arrives with #116, and until then its controls say so instead of pretending to work.
import '../styles.css';
import './path-lab.css';
import { WearMap, LAB_SIZE, SEASONS, SCENARIOS, History, strokeLine, scenarioMap, exportLab, importLab } from './model.js';
import { PARAMS, PRESETS, RENDERERS, defaultConfig, clampParam } from './params.js';
import { renderScene, drawOverlay, sceneBounds } from './scene.js';
import { currentPathRenderer } from './current.js';
import { tileCenter } from '../../../src/game/isometric.js';

const urls = import.meta.glob('../../../public/assets/terrain/{grass/lush,grass/seasons,path_wear/earth}/*.png', { eager: true, query: '?url', import: 'default' });
const pick = pattern => Object.entries(urls).filter(([path]) => pattern.test(path)).sort(([a], [b]) => a.localeCompare(b)).map(([, url]) => url);
const SOURCES = { Summer: pick(/grass-ground-lush\.v1\.tile-\d\.png$/), Spring: pick(/season-ground-spring/), Autumn: pick(/season-ground-autumn/), Winter: pick(/season-ground-snow/) };
const EARTH = [null, ...[1, 2, 3].map(level => pick(new RegExp(`worn-path-earth\\.v1\\.tile-${level}\\.png$`))[0])];
const STORAGE = 'asset-studio.path-lab.v1';
const BRUSHES = [{ id: 0, label: 'Grass / Erase' }, { id: 1, label: 'Wear 1' }, { id: 2, label: 'Wear 2' }, { id: 3, label: 'Wear 3' }];
const SIZES = [1, 2, 3, 5];
const $ = selector => document.querySelector(selector);
const loadImage = src => new Promise(resolve => { if (!src) return resolve(null); const image = new Image(); image.onload = () => resolve(image); image.onerror = () => resolve(null); image.src = src; });

const state = { map: scenarioMap('path-to-area'), season: 'Summer', renderer: 'current', preset: 'current', seed: 1, config: defaultConfig(), brush: 2, size: 1, view: { x: 0, y: 0, scale: 1 }, overlays: { grid: false, levels: false, centerline: false }, name: 'Untitled' };
let history = new History(state.map), images = null, scene = null;
const offscreen = document.createElement('canvas'), view = $('#lab-view'), ctx = view.getContext('2d');
const renderers = { current: currentPathRenderer };
const setStatus = text => { $('#lab-status').textContent = text; };

function readLink() {
  const params = new URLSearchParams(location.hash.slice(1));
  if (SCENARIOS.some(s => s.id === params.get('scenario'))) { state.map = scenarioMap(params.get('scenario')); history = new History(state.map); }
  if (SEASONS.includes(params.get('season'))) state.season = params.get('season');
  if (PRESETS.some(p => p.id === params.get('preset'))) applyPreset(params.get('preset'), false);
}
function link(scenario = null) { const params = new URLSearchParams({ season: state.season, preset: state.preset }); if (scenario) params.set('scenario', scenario); return `${location.href.split('#')[0]}#${params}`; }

function repaint() {
  scene = renderScene(offscreen, { map: state.map, season: state.season, images, renderer: RENDERERS[state.renderer] ? state.renderer : 'current', renderers });
  draw();
  $('#lab-undo').disabled = !history.canUndo; $('#lab-redo').disabled = !history.canRedo;
}
function draw() {
  const ratio = devicePixelRatio || 1, rect = view.getBoundingClientRect();
  view.width = Math.round(rect.width * ratio); view.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, rect.width, rect.height);
  ctx.save(); ctx.translate(state.view.x, state.view.y); ctx.scale(state.view.scale, state.view.scale); ctx.imageSmoothingEnabled = state.view.scale < 1;
  ctx.drawImage(offscreen, 0, 0);
  drawOverlay(ctx, { map: state.map, bounds: scene.bounds, paths: scene.paths, ...state.overlays, scale: state.view.scale });
  ctx.restore();
}
function fit() {
  const rect = view.getBoundingClientRect(), bounds = sceneBounds(state.map.size), scale = Math.min(rect.width / bounds.width, rect.height / bounds.height) * 0.96;
  state.view = { scale, x: (rect.width - bounds.width * scale) / 2, y: (rect.height - bounds.height * scale) / 2 }; draw();
}
function zoomAt(factor, cx, cy) { const v = state.view, scale = Math.min(6, Math.max(0.25, v.scale * factor)); v.x = cx - (cx - v.x) * scale / v.scale; v.y = cy - (cy - v.y) * scale / v.scale; v.scale = scale; draw(); }

// Screen point → lab tile (inverse of the game's 64 × 32 projection, offset by the scene bounds).
function tileAt(clientX, clientY) {
  const rect = view.getBoundingClientRect(), v = state.view, wx = (clientX - rect.left - v.x) / v.scale + scene.bounds.left, wy = (clientY - rect.top - v.y) / v.scale + scene.bounds.top;
  const h = (wx - centerOrigin.x) / 32, k = (wy - centerOrigin.y) / 16;
  return { x: Math.round((h + k) / 2), y: Math.round((k - h) / 2) };
}
let centerOrigin = null;

function bindCanvas() {
  let painting = null, panning = null;
  view.addEventListener('contextmenu', e => e.preventDefault());
  view.addEventListener('pointerdown', e => {
    view.setPointerCapture(e.pointerId);
    if (e.button === 2 || e.button === 1 || e.shiftKey) { panning = { x: e.clientX, y: e.clientY }; return; }
    const tile = tileAt(e.clientX, e.clientY); painting = tile; strokeLine(state.map, tile, tile, state.brush, state.size); repaint();
  });
  view.addEventListener('pointermove', e => {
    if (panning) { state.view.x += e.clientX - panning.x; state.view.y += e.clientY - panning.y; panning = { x: e.clientX, y: e.clientY }; draw(); return; }
    if (!painting) return; const tile = tileAt(e.clientX, e.clientY); if (tile.x === painting.x && tile.y === painting.y) return;
    strokeLine(state.map, painting, tile, state.brush, state.size); painting = tile; repaint();
  });
  const end = () => { if (painting && history.commit(state.map)) setStatus(`Painted · ${state.map.count()} worn tiles`); painting = null; panning = null; repaint(); };
  view.addEventListener('pointerup', end); view.addEventListener('pointercancel', end);
  view.addEventListener('wheel', e => { e.preventDefault(); const rect = view.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.15 : 1 / 1.15, e.clientX - rect.left, e.clientY - rect.top); }, { passive: false });
  addEventListener('resize', draw);
  addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? redo : undo)(); } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); } });
}
function undo() { const map = history.undo(); if (map) { state.map = map; repaint(); setStatus('Undone'); } }
function redo() { const map = history.redo(); if (map) { state.map = map; repaint(); setStatus('Redone'); } }
function loadMap(map, message) { state.map = map; history.commit(map); repaint(); setStatus(message); }

function segmented(root, items, current, onPick) {
  root.replaceChildren(...items.map(item => { const b = document.createElement('button'); b.type = 'button'; b.textContent = item.label; b.dataset.value = String(item.id); b.setAttribute('aria-pressed', String(item.id === current())); if (item.disabled) { b.disabled = true; b.title = item.title ?? ''; } b.addEventListener('click', () => { onPick(item.id); for (const other of root.children) other.setAttribute('aria-pressed', String(other.dataset.value === String(current()))); }); return b; }));
}
function applyPreset(id, render = true) {
  const preset = PRESETS.find(p => p.id === id); state.preset = id; state.renderer = preset.renderer; if (preset.config) state.config = { ...preset.config };
  $('#lab-preset').value = id; $('#lab-preset-note').textContent = preset.renderer !== 'current' && !RENDERERS[preset.renderer] ? `${preset.note} Proposal: its renderer arrives with #116; the map shows Current until then.` : preset.note;
  renderParams(); syncRenderer(); if (render) repaint();
}
function syncRenderer() { for (const b of $('#lab-renderer').children) b.setAttribute('aria-pressed', String(b.dataset.value === state.renderer)); }
function renderParams() {
  const live = RENDERERS.v2; $('#lab-params-note').textContent = live ? 'Changes repaint the Experimental V2 renderer immediately.' : 'Available with V2 (#116). The controls are ready but disabled: the current renderer has no tunable geometry, and nothing is faked.';
  const rows = PARAMS.map(p => {
    const row = document.createElement('div'); row.className = `lab-param${live ? '' : ' v2-only'}`; row.title = p.tip;
    const label = document.createElement('label'); label.htmlFor = `lab-p-${p.key}`; label.textContent = p.label; const range = document.createElement('span'); range.className = 'muted'; range.textContent = `${p.min}–${p.max}${p.unit ? ` ${p.unit}` : ''}`; label.append(range);
    const slider = document.createElement('input'); slider.type = 'range'; slider.id = `lab-p-${p.key}`; Object.assign(slider, { min: p.min, max: p.max, step: p.step, value: state.config[p.key], disabled: !live });
    const number = document.createElement('input'); number.type = 'number'; Object.assign(number, { min: p.min, max: p.max, step: p.step, value: state.config[p.key], disabled: !live }); number.setAttribute('aria-label', `${p.label} value`);
    const reset = document.createElement('button'); reset.type = 'button'; reset.className = 'button ghost'; reset.textContent = '↺'; reset.title = `Reset to ${p.default}`; reset.disabled = !live;
    const set = value => { state.config[p.key] = clampParam(p.key, value); slider.value = number.value = state.config[p.key]; if (live) repaint(); };
    slider.addEventListener('input', () => set(slider.value)); number.addEventListener('change', () => set(number.value)); reset.addEventListener('click', () => set(p.default));
    row.append(label, slider, number, reset); return row;
  });
  const seed = document.createElement('div'); seed.className = `lab-param${live ? '' : ' v2-only'}`; seed.innerHTML = '<label for="lab-seed">Seed <span class="muted">integer</span></label>';
  const seedInput = document.createElement('input'); seedInput.type = 'number'; seedInput.id = 'lab-seed'; seedInput.step = 1; seedInput.value = state.seed; seedInput.disabled = !live; seedInput.addEventListener('change', () => { state.seed = Math.trunc(Number(seedInput.value)) || 1; if (live) repaint(); });
  seed.append(seedInput); $('#lab-params').replaceChildren(...rows, seed); $('#lab-reset-params').disabled = !live;
}

function variants() { try { const data = JSON.parse(localStorage.getItem(STORAGE) ?? '{}'); return data && typeof data === 'object' ? data : {}; } catch { return {}; } }
function storeVariants(data) { try { localStorage.setItem(STORAGE, JSON.stringify(data)); return true; } catch { return false; } }
const current = () => exportLab({ name: state.name, preset: state.preset, seed: state.seed, season: state.season, map: state.map, config: state.config });
function apply(data, message) {
  const lab = importLab(data, { presets: PRESETS, params: PARAMS });
  state.name = lab.name; state.seed = lab.seed; state.season = lab.season; applyPreset(lab.preset, false); state.config = { ...defaultConfig(), ...lab.config };
  segmentedAll(); renderParams(); loadMap(lab.map, message);
}
function renderVariants() {
  const data = variants();
  $('#lab-variants').replaceChildren(...Object.keys(data).sort().map(name => {
    const li = document.createElement('li'), label = document.createElement('span'), load = document.createElement('button'), remove = document.createElement('button');
    label.textContent = name; load.type = remove.type = 'button'; load.className = 'button'; remove.className = 'button ghost'; load.textContent = 'Load'; remove.textContent = 'Delete';
    load.addEventListener('click', () => { try { apply(data[name], `Loaded variant "${name}"`); } catch (error) { setStatus(error.message); } });
    remove.addEventListener('click', () => { const next = variants(); delete next[name]; storeVariants(next); renderVariants(); setStatus(`Deleted "${name}" from this browser`); });
    li.append(label, load, remove); return li;
  }));
}
function segmentedAll() {
  segmented($('#lab-brush'), BRUSHES, () => state.brush, id => { state.brush = id; });
  segmented($('#lab-size'), SIZES.map(s => ({ id: s, label: `${s}×${s}` })), () => state.size, id => { state.size = id; });
  segmented($('#lab-season'), SEASONS.map(s => ({ id: s, label: s })), () => state.season, id => { state.season = id; repaint(); });
  segmented($('#lab-renderer'), [{ id: 'current', label: 'Current (N12)' }, { id: 'v2', label: 'Experimental V2', disabled: !RENDERERS.v2, title: 'Available with V2 (#116)' }], () => state.renderer, id => { state.renderer = id; repaint(); });
}

function bindPanels() {
  $('#lab-scenarios').replaceChildren(...SCENARIOS.map(s => { const b = document.createElement('button'); b.type = 'button'; b.className = 'button'; b.textContent = s.name; b.dataset.scenario = s.id; if (s.priority) b.dataset.priority = ''; b.addEventListener('click', () => { loadMap(scenarioMap(s.id), `Scenario: ${s.name}`); history = new History(state.map); }); return b; }));
  $('#lab-preset').replaceChildren(...PRESETS.map(p => { const o = document.createElement('option'); o.value = p.id; o.textContent = p.renderer !== 'current' && !RENDERERS[p.renderer] ? `${p.name} (proposal)` : p.name; return o; }));
  $('#lab-preset').addEventListener('change', e => applyPreset(e.target.value));
  for (const key of ['grid', 'levels', 'centerline']) $(`#lab-${key}`).addEventListener('change', e => { state.overlays[key] = e.target.checked; draw(); });
  $('#lab-undo').addEventListener('click', undo); $('#lab-redo').addEventListener('click', redo);
  $('#lab-clear').addEventListener('click', () => loadMap(new WearMap(LAB_SIZE), 'Map reset (parameters kept)'));
  $('#lab-reset-params').addEventListener('click', () => { state.config = defaultConfig(); renderParams(); repaint(); });
  $('#lab-zoom-in').addEventListener('click', () => { const r = view.getBoundingClientRect(); zoomAt(1.25, r.width / 2, r.height / 2); });
  $('#lab-zoom-out').addEventListener('click', () => { const r = view.getBoundingClientRect(); zoomAt(1 / 1.25, r.width / 2, r.height / 2); });
  $('#lab-fit').addEventListener('click', fit);
  $('#lab-save').addEventListener('click', () => { const name = $('#lab-variant-name').value.trim() || `Variant ${Object.keys(variants()).length + 1}`; state.name = name; const data = variants(); data[name] = current(); setStatus(storeVariants(data) ? `Saved "${name}" in this browser (not committed)` : 'This browser blocks local storage: use Export JSON'); renderVariants(); });
  $('#lab-export').addEventListener('click', () => { const json = JSON.stringify(current(), null, 1); $('#lab-json').value = json; const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' })); a.download = `path-lab-${state.name.replace(/[^a-z0-9-]+/gi, '-').toLowerCase()}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000); $('#lab-json-feedback').textContent = 'Exported: downloaded and shown above.'; });
  $('#lab-import').addEventListener('click', () => { try { apply(JSON.parse($('#lab-json').value), 'Imported JSON'); $('#lab-json-feedback').textContent = 'Imported.'; } catch (error) { $('#lab-json-feedback').textContent = `Not imported: ${error.message}`; } });
  $('#lab-link').addEventListener('click', async () => { const url = link(); try { await navigator.clipboard.writeText(url); $('#lab-json-feedback').textContent = 'Link copied (season and preset; paint is not part of a link — export JSON for that).'; } catch { $('#lab-json').value = url; $('#lab-json-feedback').textContent = 'Link shown above.'; } });
}

async function start() {
  const ground = Object.fromEntries(await Promise.all(Object.entries(SOURCES).map(async ([season, list]) => [season, (await Promise.all(list.map(loadImage))).filter(Boolean)])));
  images = { ground, earth: await Promise.all(EARTH.map(loadImage)) };
  centerOrigin = tileCenter({ x: 0, y: 0 });
  segmentedAll(); bindPanels(); bindCanvas(); readLink(); applyPreset(state.preset, false); renderParams(); renderVariants();
  repaint(); fit(); setStatus('Paint with the left button; right-drag or Shift-drag pans, the wheel zooms.');
  // Test hooks (studio smoke).
  window.pathLab = { ready: true, state, scenario: id => { loadMap(scenarioMap(id), id); history = new History(state.map); }, exportJson: () => current(), importJson: data => apply(data, 'Imported'), tileAt, painted: () => state.map.count(), pixel: (x, y) => Array.from(offscreen.getContext('2d').getImageData(x, y, 1, 1).data), sceneSize: () => [offscreen.width, offscreen.height] };
}
start();
