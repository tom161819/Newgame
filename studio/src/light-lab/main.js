// Light Lab (plan m-osvetleni-noc, step 1): night as a light map on a piece of the map with the game's own buildings
// and villagers (public/assets, read only). The owner places torches, lanterns, campfires, braziers, forges and house
// windows with the mouse, scrubs the time of day and tunes each light type and the night itself. "Propose as default"
// writes `lightingProposal/default` to the Studio page database; Export gives art/lighting/light-lab-default.json,
// which the game takes into src/data/lighting.js in step 2. The renderer is lightmap.js, written for the game too.
import '../styles.css';
import '../world-lab/world-lab.css';
import '../fire-lab/fire-lab.css';
import './light-lab.css';
import { trackTopbarHeight } from '../lib/topbarHeight.js';
import { objectDefinitions } from '../../../src/data/objects/index.js';
import { APPROVED_VILLAGER_ART } from '../../../src/data/objects/approvedArt.js';
import {
  LIGHT_TYPES, TYPE_LABELS, TYPE_PARAMS, GLOBAL_PARAMS, DEFAULT_TYPES, DEFAULT_GLOBAL, defaultLightSettings, readLightSettings,
  resolveLights, directionalShade, shadowFor, LightMap, drawShadedImage, drawShadow, flicker, switchOn,
} from './lightmap.js';
import {
  SPAN, TILE_W, TILE_H, gridToWorld, SCENE_BUILDINGS, SCENE_PEOPLE, buildingSources, SEASONS, nightStartOf, darknessFor, partOf,
  clockOf, bedtimeOf, activeSources, newSource, readSources, PROPOSALS, PROPOSAL_ID, EXPORT_FILE, proposalDoc, exportFile,
} from './model.js';

const $ = s => document.querySelector(s);
function h(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (k === 'value') n.value = v; else if (k === 'checked') n.checked = !!v; else n.setAttribute(k, v === true ? '' : v); }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}
const showAlert = text => { const el = $('#studio-alert'); el.textContent = text; el.hidden = !text; };
const STORAGE = 'asset-studio.light-lab.v1';

// ---------- game art ----------
const assetUrls = import.meta.glob('../../../public/assets/{buildings/*/*,characters/villagers/*.facing-*,terrain/grass/lush/*}.{png,svg}', { eager: true, query: '?url', import: 'default' });
const urlFor = path => assetUrls[`../../../public${path}`] ?? null;
const images = new Map();
function image(path) {
  if (!path) return null;
  let e = images.get(path);
  if (!e) { const url = urlFor(path), img = new Image(); e = { img, ready: false }; if (url) { img.onload = () => { e.ready = true; }; img.src = url; } images.set(path, e); }
  return e.ready ? e.img : null;
}
const definitions = new Map(objectDefinitions.filter(d => d.category === 'building').map(d => [d.id, d]));
const GRASS = [0, 1, 2].map(i => `/assets/terrain/grass/lush/grass-ground-lush.v1.tile-${i}.png`);

// ---------- state ----------
let draft = null; try { draft = JSON.parse(localStorage.getItem(STORAGE) ?? 'null'); } catch { draft = null; }
const defaultHouses = () => SCENE_BUILDINGS.map((b, index) => ({ b, index })).filter(({ b }) => definitions.get(b.id)?.housing).map(({ index }, i) => ({ index, home: i === 0 || i === 1, bedtime: i === 0 ? 0.03 : 0.09 }));
const defaultSources = () => buildingSources(SCENE_BUILDINGS, definitions);
const defaultPeople = () => SCENE_PEOPLE.map(p => ({ ...p, ...gridToWorld(p.x, p.y) }));
const state = {
  settings: readLightSettings(draft?.settings ?? defaultLightSettings()).settings,
  sources: readSources(draft?.sources) ?? defaultSources(),
  people: Array.isArray(draft?.people) && draft.people.length === SCENE_PEOPLE.length && draft.people.every(p => Number.isFinite(p?.x) && Number.isFinite(p?.y)) ? draft.people.map((p, i) => ({ ...SCENE_PEOPLE[i], x: p.x, y: p.y })) : defaultPeople(),
  houses: Array.isArray(draft?.houses) ? defaultHouses().map(d => ({ ...d, ...(draft.houses.find(x => x?.index === d.index) ?? {}) })) : defaultHouses(),
  fraction: Number.isFinite(draft?.fraction) ? draft.fraction : 0.9, season: SEASONS.includes(draft?.season) ? draft.season : 'Summer',
  zoom: [1, 2].includes(draft?.zoom) ? draft.zoom : 1, type: LIGHT_TYPES.includes(draft?.type) ? draft.type : 'torch',
  markers: draft?.markers ?? true, playing: false, selected: null, pan: { x: 0, y: 0 }, proposal: null,
};
const keep = () => { try { localStorage.setItem(STORAGE, JSON.stringify({ settings: state.settings, sources: state.sources, people: state.people.map(p => ({ x: p.x, y: p.y })), houses: state.houses, fraction: state.fraction, season: state.season, zoom: state.zoom, type: state.type, markers: state.markers })); } catch { /* storage may be unavailable */ } };

// ---------- controls ----------
const fmt = (p, v) => `${p.step < 1 ? Number(v).toFixed(2) : v}${p.unit ? ' ' + p.unit : ''}`;
function paramControl(p, value, set) {
  if (p.kind === 'color') return h('label', { class: 'fl-param' }, h('span', {}, p.label), h('output', {}, value), h('input', { type: 'color', value, 'aria-label': p.label, 'data-param': p.key, oninput: e => { set(e.target.value); e.target.previousSibling.textContent = e.target.value; } }));
  if (p.kind === 'bool') return h('label', { class: 'fl-param ll-bool' }, h('input', { type: 'checkbox', checked: value, 'data-param': p.key, onchange: e => set(e.target.checked) }), h('span', {}, p.label));
  if (p.kind === 'enum') return h('label', { class: 'fl-param' }, h('span', {}, p.label), h('output', {}), h('select', { 'aria-label': p.label, 'data-param': p.key, onchange: e => set(p.values.find(v => String(v) === e.target.value)) }, ...p.values.map(v => h('option', { value: String(v), selected: v === value || null }, typeof v === 'number' ? `${v * 100} %` : v[0].toUpperCase() + v.slice(1)))));
  const out = h('output', {}, fmt(p, value));
  return h('label', { class: 'fl-param' }, h('span', {}, p.label), out, h('input', { type: 'range', min: p.min, max: p.max, step: p.step, value, 'aria-label': p.label, 'data-param': p.key, oninput: e => { const v = Number(e.target.value); out.textContent = fmt(p, v); set(v); } }), p.hint ? h('small', {}, p.hint) : null);
}
function renderTypes() {
  $('#ll-types').replaceChildren(...LIGHT_TYPES.map(t => h('button', { type: 'button', class: `button${state.type === t ? ' primary' : ''}`, 'data-type': t, 'aria-pressed': String(state.type === t), onclick: () => { state.type = t; if (state.selected && sourceById(state.selected)?.type !== t) state.selected = null; renderTypes(); renderTypeParams(); keep(); } },
    h('span', { class: 'll-swatch', style: `background:${state.settings.types[t].color}` }), TYPE_LABELS[t])));
}
function renderTypeParams() {
  $('#ll-type-title').textContent = TYPE_LABELS[state.type];
  const t = state.settings.types[state.type];
  $('#ll-type-params').replaceChildren(...TYPE_PARAMS.filter(p => !p.hidden).map(p => paramControl(p, t[p.key], v => { t[p.key] = v; if (p.key === 'color') renderTypes(); keep(); })));
}
function renderGlobal() {
  const g = state.settings.global;
  $('#ll-global').replaceChildren(...GLOBAL_PARAMS.filter(p => p.key !== 'quality').map(p => paramControl(p, g[p.key], v => { g[p.key] = v; keep(); })));
  renderQuality();
}
function renderQuality() {
  $('#ll-quality').replaceChildren(...['simple', 'full'].map(q => h('button', { type: 'button', class: `button${state.settings.global.quality === q ? ' primary' : ''}`, 'data-quality': q, 'aria-pressed': String(state.settings.global.quality === q), onclick: () => { state.settings.global.quality = q; renderQuality(); keep(); } }, q === 'simple' ? 'Simple' : 'Full')));
}
function renderSeasons() {
  $('#ll-seasons').replaceChildren(...SEASONS.map(s => h('button', { type: 'button', class: `button${state.season === s ? ' primary' : ''}`, onclick: () => { state.season = s; renderSeasons(); renderHouses(); renderTime(); keep(); } }, s)));
}
function renderHouses() {
  $('#ll-houses').replaceChildren(...state.houses.map((house, i) => {
    const out = h('output', {});
    const update = () => { out.textContent = `bed ${clockOf(bedtimeOf(nightStartOf(state.season), house))}`; };
    update();
    return h('div', { class: 'll-house', 'data-house': house.index },
      h('label', { class: 'll-check' }, h('input', { type: 'checkbox', checked: house.home, onchange: e => { house.home = e.target.checked; keep(); } }), `House ${i + 1}: someone home`), out,
      h('input', { type: 'range', min: 0, max: 0.17, step: 0.005, value: house.bedtime, 'aria-label': `House ${i + 1} bedtime`, oninput: e => { house.bedtime = Number(e.target.value); update(); keep(); } }),
      h('small', {}, 'Goes to bed (after night starts)'));
  }));
}
function renderZoom() {
  $('#ll-zoom').replaceChildren(...[1, 2].map(z => h('button', { type: 'button', 'aria-pressed': String(state.zoom === z), onclick: () => { state.zoom = z; renderZoom(); keep(); } }, `${z}×`)));
}
function renderTime() {
  const ns = nightStartOf(state.season), part = partOf(state.fraction, ns);
  $('#ll-time').value = state.fraction; $('#ll-clock').textContent = clockOf(state.fraction);
  $('#ll-part').textContent = `${part[0].toUpperCase() + part.slice(1)} · darkness ${(darknessFor(state.fraction, ns) * 100).toFixed(0)} %`;
}
$('#ll-time').addEventListener('input', e => { state.fraction = Number(e.target.value); renderTime(); keep(); });
$('#ll-play').addEventListener('click', e => { state.playing = !state.playing; e.target.textContent = state.playing ? 'Pause' : 'Play'; e.target.setAttribute('aria-pressed', String(state.playing)); });
$('#ll-markers').checked = state.markers;
$('#ll-markers').addEventListener('change', e => { state.markers = e.target.checked; keep(); });
$('#ll-reset-scene').addEventListener('click', () => { state.sources = defaultSources(); state.people = defaultPeople(); state.houses = defaultHouses(); state.selected = null; state.pan = { x: 0, y: 0 }; renderHouses(); updateRemove(); keep(); });
$('#ll-type-defaults').addEventListener('click', () => { state.settings.types[state.type] = { ...DEFAULT_TYPES[state.type] }; renderTypes(); renderTypeParams(); keep(); });
$('#ll-defaults').addEventListener('click', () => { state.settings = defaultLightSettings(); renderTypes(); renderTypeParams(); renderGlobal(); keep(); });
$('#ll-remove').addEventListener('click', () => { if (state.selected) removeSource(state.selected); });
const sourceById = id => state.sources.find(s => s.id === id);
function removeSource(id) { state.sources = state.sources.filter(s => s.id !== id); if (state.selected === id) state.selected = null; updateRemove(); keep(); }
const updateRemove = () => { $('#ll-remove').disabled = !state.selected; };

// ---------- view ----------
const canvas = $('#ll-canvas'), ctx = canvas.getContext('2d');
const scratch = document.createElement('canvas'), lightMap = new LightMap();
let view = { x: 0, y: 0, zoom: 1 }, cssW = 0, cssH = 0;
const sceneCentre = gridToWorld(SPAN / 2, SPAN / 2);
const toScreen = (x, y) => [(x - view.x) * view.zoom, (y - view.y) * view.zoom];
const toWorld = (sx, sy) => [view.x + sx / view.zoom, view.y + sy / view.zoom];

// Ground: the game's lush grass tiles, cached once all three are loaded.
let groundCache = null;
function ground() {
  if (groundCache) return groundCache;
  const tiles = GRASS.map(image); if (tiles.some(t => !t)) return null;
  const c = document.createElement('canvas'); c.width = SPAN * TILE_W; c.height = SPAN * TILE_H + TILE_H; const g = c.getContext('2d');
  for (let y = 0; y < SPAN; y++) for (let x = 0; x < SPAN; x++) {
    const p = gridToWorld(x + 0.5, y + 0.5), img = tiles[(x * 7 + y * 13) % 3];
    g.drawImage(img, p.x + SPAN * TILE_W / 2 - img.width / 2, p.y - img.height / 2);
  }
  return (groundCache = c);
}

// Everything that stands on the ground, sorted back to front.
function drawables() {
  const out = [];
  SCENE_BUILDINGS.forEach((b, index) => {
    const d = definitions.get(b.id); if (!d) return;
    const img = image(d.sprite); if (!img) return;
    const base = gridToWorld(b.x + d.width, b.y + d.height), centre = gridToWorld(b.x + d.width / 2, b.y + d.height / 2);
    let w = img.naturalWidth || img.width, hh = img.naturalHeight || img.height, ox = d.origin?.x ?? 0.5, oy = d.origin?.y ?? 0.9, at = base;
    if (d.renderMode === 'procedural') { const ratio = hh && w ? hh / w : 1; w = TILE_W * d.width; hh = w * ratio; at = gridToWorld(b.x + 0.5, b.y + 0.5); at = { x: at.x, y: at.y + (b.id === 'campfire' ? 8 : 10) }; }
    out.push({ kind: 'building', index, img, x: at.x - w * ox, y: at.y - hh * oy, w, h: hh, sort: base.y, ground: centre, height: d.visualHeight ?? hh });
  });
  state.people.forEach((p, i) => {
    const art = APPROVED_VILLAGER_ART[p.look]; if (!art) return;
    const img = image(`${art.base}.facing-${p.facing}.png`); if (!img) return;
    const o = art.origins?.[p.facing] ?? art.walk?.origin ?? { x: 0.5, y: 0.8 };
    out.push({ kind: 'person', index: i, img, x: p.x - img.width * o.x, y: p.y - img.height * o.y, w: img.width, h: img.height, sort: p.y, ground: { x: p.x, y: p.y }, height: img.height * o.y });
  });
  return out.sort((a, b) => a.sort - b.sort);
}

// Emissive flames and windows, drawn after the light map so they stay bright.
function drawFlame(s, seconds, darkness) {
  const t = state.settings.types[s.type], on = (s.on ?? 1) * switchOn(darkness, s.seed, state.settings.global);
  const [sx, sy] = toScreen(s.x, s.y - s.lamp), k = view.zoom;
  if (on <= 0.01) return;
  const f = flicker(seconds * 1.6, t.flicker, t.speed, s.seed), { r, g, b } = (({ color }) => ({ r: parseInt(color.slice(1, 3), 16), g: parseInt(color.slice(3, 5), 16), b: parseInt(color.slice(5, 7), 16) }))(t);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if (s.type === 'window') {
    ctx.fillStyle = `rgba(${r},${g},${b},${0.85 * on})`; ctx.fillRect(sx - 3 * k, sy - 3 * k, 6 * k, 6 * k);
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, 12 * k); glow.addColorStop(0, `rgba(${r},${g},${b},${0.35 * on})`); glow.addColorStop(1, `rgba(${r},${g},${b},0)`); ctx.fillStyle = glow; ctx.fillRect(sx - 12 * k, sy - 12 * k, 24 * k, 24 * k);
  } else {
    const size = { torch: 6, lantern: 3.5, campfire: 9, brazier: 8, forge: 5 }[s.type] * k * f;
    const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, size * 2.4); glow.addColorStop(0, `rgba(${r},${g},${b},${0.55 * on})`); glow.addColorStop(1, `rgba(${r},${g},${b},0)`); ctx.fillStyle = glow; ctx.fillRect(sx - size * 2.4, sy - size * 2.4, size * 4.8, size * 4.8);
    if (s.type === 'lantern') { ctx.fillStyle = `rgba(255,236,190,${0.95 * on})`; ctx.fillRect(sx - size * 0.5, sy - size * 0.7, size, size * 1.4); }
    else { const sway = Math.sin(seconds * 9 + s.seed) * size * 0.12; ctx.fillStyle = `rgba(255,170,70,${0.9 * on})`; ctx.beginPath(); ctx.ellipse(sx + sway * 0.5, sy - size * 0.4, size * 0.5, size * 0.95, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = `rgba(255,240,190,${on})`; ctx.beginPath(); ctx.ellipse(sx + sway, sy - size * 0.25, size * 0.24, size * 0.48, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
function drawMarkers() {
  for (const s of state.sources) {
    const [gx, gy] = toScreen(s.x, s.y), [lx, ly] = toScreen(s.x, s.y - s.lamp), sel = s.id === state.selected;
    ctx.save(); ctx.strokeStyle = sel ? '#ffe9a8' : 'rgba(255,255,255,.55)'; ctx.lineWidth = sel ? 2 : 1; ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(lx, ly); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.ellipse(gx, gy, 7 * view.zoom, 3.5 * view.zoom, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = state.settings.types[s.type].color; ctx.beginPath(); ctx.arc(lx, ly, sel ? 5 : 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
}

// ---------- frame ----------
const stats = { fps: 0, frameMs: 0, lightMs: 0, drawn: 0, culled: 0, lights: 0, shaded: 0, shadows: 0 };
let seconds = 0, last = performance.now(), fpsFrames = 0, fpsSince = last;
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now; seconds += dt;
  if (state.playing) { state.fraction = (state.fraction + dt / 60) % 1; renderTime(); }
  const start = performance.now(), dpr = window.devicePixelRatio || 1;
  cssW = canvas.clientWidth; cssH = canvas.clientHeight;
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) { canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr); }
  view = { zoom: state.zoom, x: sceneCentre.x + state.pan.x - cssW / 2 / state.zoom, y: sceneCentre.y + state.pan.y - cssH / 2 / state.zoom - 40 };
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = state.zoom < 2;
  ctx.fillStyle = '#3f5a2c'; ctx.fillRect(0, 0, cssW, cssH);
  const ns = nightStartOf(state.season), darkness = darknessFor(state.fraction, ns), g = state.settings.global;
  const g0 = ground(); if (g0) { const [sx, sy] = toScreen(-SPAN * TILE_W / 2, 0); ctx.drawImage(g0, sx, sy, g0.width * view.zoom, g0.height * view.zoom); }
  const sources = activeSources(state.sources, state.houses, state.fraction, ns), lights = darkness > 0.001 ? resolveLights(sources, state.settings, { darkness, seconds }) : [];
  const items = drawables(); let shaded = 0, shadows = 0;
  if (lights.length) for (const it of items) if (it.kind === 'person') { const sh = shadowFor(it.ground.x, it.ground.y, it.height, lights, g, darkness); if (sh) { const [sx, sy] = toScreen(it.ground.x, it.ground.y); drawShadow(ctx, sh, sx, sy, view.zoom); shadows++; } }
  for (const it of items) {
    const shade = lights.length ? directionalShade(it.ground.x, it.ground.y, it.height, lights, g, darkness) : null; if (shade) shaded++;
    const [sx, sy] = toScreen(it.x, it.y);
    drawShadedImage(ctx, it.img, sx, sy, it.w * view.zoom, it.h * view.zoom, shade, scratch, state.zoom < 2);
  }
  const lightStart = performance.now();
  if (darkness > 0.001) { lightMap.render({ width: cssW, height: cssH, view, lights, darkness, settings: state.settings }); lightMap.drawTo(ctx, cssW, cssH); }
  const lightMs = performance.now() - lightStart;
  if (darkness > 0.001) for (const s of sources) drawFlame(s, seconds, darkness);
  if (state.markers) drawMarkers();
  Object.assign(stats, { frameMs: performance.now() - start, lightMs, drawn: darkness > 0.001 ? lightMap.stats.drawn : 0, culled: darkness > 0.001 ? lightMap.stats.culled : 0, lights: lights.length, shaded, shadows });
  fpsFrames++; if (now - fpsSince >= 500) { stats.fps = fpsFrames * 1000 / (now - fpsSince); fpsFrames = 0; fpsSince = now; $('#ll-fps').textContent = `${stats.fps.toFixed(0)} fps · frame ${stats.frameMs.toFixed(1)} ms · light map ${stats.lightMs.toFixed(2)} ms · ${stats.drawn}/${state.sources.length} lights in view`; }
  requestAnimationFrame(frame);
}

// ---------- mouse ----------
function hitSource(sx, sy) {
  let best = null, bestD = 12;
  for (const s of state.sources) for (const [x, y] of [toScreen(s.x, s.y), toScreen(s.x, s.y - s.lamp)]) { const d = Math.hypot(x - sx, y - sy); if (d < bestD) { bestD = d; best = s; } }
  return best;
}
function hitPerson(sx, sy) {
  for (const it of drawables().reverse()) { if (it.kind !== 'person') continue; const [x, y] = toScreen(it.x, it.y); if (sx >= x + it.w * view.zoom * 0.25 && sx <= x + it.w * view.zoom * 0.75 && sy >= y && sy <= y + it.h * view.zoom) return state.people[it.index]; }
  return null;
}
let drag = null;
const local = e => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
canvas.addEventListener('contextmenu', e => { e.preventDefault(); const [sx, sy] = local(e), s = hitSource(sx, sy); if (s) removeSource(s.id); });
canvas.addEventListener('pointerdown', e => {
  if (e.button === 2) return;
  const [sx, sy] = local(e);
  if (e.shiftKey || e.button === 1) { drag = { kind: 'pan', sx, sy, pan: { ...state.pan } }; }
  else {
    const s = hitSource(sx, sy);
    if (s) { state.selected = s.id; state.type = s.type; renderTypes(); renderTypeParams(); drag = { kind: 'source', s, dx: s.x - toWorld(sx, sy)[0], dy: s.y - toWorld(sx, sy)[1] }; }
    else { const p = hitPerson(sx, sy); if (p) drag = { kind: 'person', p, dx: p.x - toWorld(sx, sy)[0], dy: p.y - toWorld(sx, sy)[1] }; else { const [wx, wy] = toWorld(sx, sy), n = newSource(state.type, wx, wy, state.sources); state.sources.push(n); state.selected = n.id; drag = { kind: 'source', s: n, dx: 0, dy: 0 }; keep(); } }
  }
  updateRemove(); canvas.setPointerCapture(e.pointerId); canvas.classList.add('ll-dragging');
});
canvas.addEventListener('pointermove', e => {
  if (!drag) return; const [sx, sy] = local(e);
  if (drag.kind === 'pan') { state.pan = { x: drag.pan.x - (sx - drag.sx) / view.zoom, y: drag.pan.y - (sy - drag.sy) / view.zoom }; return; }
  const [wx, wy] = toWorld(sx, sy), target = drag.kind === 'source' ? drag.s : drag.p; target.x = Math.round(wx + drag.dx); target.y = Math.round(wy + drag.dy);
});
const endDrag = () => { if (drag && drag.kind !== 'pan') keep(); drag = null; canvas.classList.remove('ll-dragging'); };
canvas.addEventListener('pointerup', endDrag); canvas.addEventListener('pointercancel', endDrag);
window.addEventListener('keydown', e => { if ((e.key === 'Delete' || e.key === 'Backspace') && state.selected && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName ?? '')) removeSource(state.selected); });

// ---------- proposal, export ----------
const shared = { db: null, user: null, uid: null, canWrite: null, downloads: null, mode: 'local' };
function renderSummary() {
  const p = state.proposal;
  $('#ll-summary').textContent = p ? `Lighting proposal waiting for Claude (${p.at?.slice(0, 10) ?? ''}${p.note ? ` · ${p.note}` : ''}) — write „revize“ in the MK chat Grafika.` : `${state.sources.length} light sources · tune the night and propose it for the game`;
  $('#ll-open-proposal').hidden = !p;
}
const fileJson = () => JSON.stringify(exportFile(state.settings, { by: shared.uid, note: $('#ll-note').value.trim() }), null, 2) + '\n';
$('#ll-propose').addEventListener('click', async () => {
  const data = proposalDoc(state.settings, { by: shared.uid, note: $('#ll-note').value.trim() });
  try {
    if (shared.db) await shared.db.doc(`${PROPOSALS}/${PROPOSAL_ID}`).set(data);
    else localStorage.setItem(`${STORAGE}.proposal`, JSON.stringify(data));
    state.proposal = data; renderSummary(); showAlert('');
  } catch (error) { showAlert(error?.code === 'permission_denied' || error?.code === 'invalid_argument' ? 'Proposing needs Contributor access to the Studio page.' : `Not saved (${error?.code ?? 'unavailable'}).`); }
});
$('#ll-export').addEventListener('click', () => {
  const blob = new Blob([fileJson()], { type: 'application/json' });
  if (shared.downloads) { shared.downloads.save({ filename: EXPORT_FILE, data: blob }).catch(error => { if (error?.code !== 'declined') showAlert(`${EXPORT_FILE} could not be saved here (${error?.code ?? 'unavailable'}).`); }); return; }
  const url = URL.createObjectURL(blob), a = h('a', { href: url, download: EXPORT_FILE }); document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#ll-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(fileJson()); $('#ll-summary').textContent = 'Lighting JSON copied.'; setTimeout(renderSummary, 2500); } catch { showAlert('Copy is not available here; use Export JSON.'); } });
$('#ll-open-proposal').addEventListener('click', () => { const r = readLightSettings(state.proposal); if (!r.ok) { showAlert('The proposal could not be read.'); return; } state.settings = r.settings; renderTypes(); renderTypeParams(); renderGlobal(); keep(); });
function readProposal(data) { if (!data) return null; const r = readLightSettings(data); return r.ok ? { ...data, settings: r.settings } : null; }
async function connectShared() {
  const claude = window.claude;
  if (typeof claude?.use !== 'function') { try { state.proposal = readProposal(JSON.parse(localStorage.getItem(`${STORAGE}.proposal`) ?? 'null')); } catch { state.proposal = null; } renderSummary(); return; }
  claude.use('downloads').then(d => { shared.downloads = d ?? null; }).catch(() => {});
  const [db, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('user').catch(() => null)]);
  if (!db) return;
  shared.db = db; shared.user = user; shared.mode = 'shared';
  shared.uid = user ? await user.id().catch(() => null) : null;
  shared.canWrite = user ? await Promise.resolve(user.can?.('data.write')).catch(() => null) ?? null : null;
  if (shared.canWrite === false) for (const b of document.querySelectorAll('[data-needs-write]')) b.disabled = true;
  db.collection(PROPOSALS).onSnapshot(snap => { const doc = snap.docs.find(d => d.exists && d.id === PROPOSAL_ID); state.proposal = doc ? readProposal(doc.data()) : null; renderSummary(); }, () => {});
}

trackTopbarHeight();
renderTypes(); renderTypeParams(); renderGlobal(); renderSeasons(); renderHouses(); renderZoom(); renderTime(); renderSummary(); updateRemove();
connectShared();
requestAnimationFrame(frame);
window.lightLab = {
  ready: true, state, stats,
  settings: () => structuredClone(state.settings), sources: () => state.sources.map(s => ({ ...s })),
  setTime: f => { state.fraction = f; renderTime(); }, darkness: () => darknessFor(state.fraction, nightStartOf(state.season)),
  toScreen: (x, y) => toScreen(x, y), exportJson: () => JSON.parse(fileJson()), defaults: { types: DEFAULT_TYPES, global: DEFAULT_GLOBAL },
  windows: () => activeSources(state.sources, state.houses, state.fraction, nightStartOf(state.season)).filter(s => s.type === 'window').map(s => ({ house: s.house, on: s.on })),
};
