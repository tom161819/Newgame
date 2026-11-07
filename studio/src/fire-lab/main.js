// Fire Lab (owner, 7 Nov 2026): put a building from the Studio's exported sprites on the ground, set it on fire and
// tune flames, smoke, embers, glow and charring. Settings can be saved to the page database and one can be proposed
// for the game; Claude takes the proposal over on „revize“ and builds the game's fire effect from it.
import '../styles.css';
import '../world-lab/world-lab.css';
import './fire-lab.css';
import { trackTopbarHeight } from '../lib/topbarHeight.js';
import { PARAMS, DEFAULTS, PRESETS, Fire, drawSmoke, drawFlames, drawGlow } from './fire.js';

const $ = s => document.querySelector(s);
const SAVED = 'fireSettings', PROPOSAL = 'fireProposal', STORAGE = 'asset-studio.fire-lab.v1';
function h(tag, attrs = {}, ...children) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs ?? {})) { if (v == null || v === false) continue; if (k === 'class') n.className = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else if (k === 'value') n.value = v; else n.setAttribute(k, v === true ? '' : v); }
  for (const c of children.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return n;
}
// Exported sprites: newest version of each building variant (and the decorations that are small houses).
const metas = import.meta.glob('../../../art/sprites/*/*.json', { eager: true, import: 'default' });
const pngs = import.meta.glob('../../../art/sprites/*/*.png', { eager: true, query: '?url', import: 'default' });
const latest = new Map();
for (const [path, meta] of Object.entries(metas)) {
  if (meta?.category !== 'buildings' || !meta.variantId) continue;
  const prev = latest.get(meta.variantId); if (prev && prev.meta.version >= meta.version) continue;
  const png = path.replace(/\.json$/, '.png'); if (pngs[png]) latest.set(meta.variantId, { meta, url: pngs[png] });
}
const buildings = [...latest.values()].sort((a, b) => a.meta.name.localeCompare(b.meta.name));
let draft = null; try { draft = JSON.parse(localStorage.getItem(STORAGE) ?? 'null'); } catch { draft = null; }
const state = { params: { ...DEFAULTS, ...(draft?.params ?? {}) }, building: draft?.building ?? (buildings.find(b => /house/.test(b.meta.variantId)) ?? buildings[0])?.meta.variantId, scene: draft?.scene ?? 'Night', zoom: draft?.zoom ?? 2, spots: [], saved: new Map(), proposal: null };
const keep = () => { try { localStorage.setItem(STORAGE, JSON.stringify({ params: state.params, building: state.building, scene: state.scene, zoom: state.zoom })); } catch { /* storage may be unavailable */ } };
const fire = new Fire(state.params);
let image = null, roof = [], char = null;
const canvas = $('#fl-canvas'), ctx = canvas.getContext('2d');

// ---------- building ----------
function loadBuilding() {
  const b = buildings.find(x => x.meta.variantId === state.building) ?? buildings[0]; if (!b) return;
  const img = new Image(); img.onload = () => { image = { img, meta: b.meta }; roof = roofLine(img); char = document.createElement('canvas'); char.width = img.width; char.height = img.height; state.spots = []; applySpots(); }; img.src = b.url;
}
// The top edge of the sprite (first opaque pixel per column) – where a roof catches fire.
function roofLine(img) {
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, img.width, img.height).data, out = [];
  for (let x = 0; x < img.width; x++) for (let y = 0; y < img.height; y++) if (d[(y * img.width + x) * 4 + 3] > 200) { out.push({ x, y }); break; }
  return out;
}
function applySpots() {
  let spots = state.spots;
  if (!spots.length && roof.length) {
    const n = Math.round(state.params.spots), lo = roof[0].x, hi = roof.at(-1).x;
    spots = Array.from({ length: n }, (_, i) => { const x = lo + (hi - lo) * (0.15 + 0.7 * (n === 1 ? 0.5 : i / (n - 1))), top = roof.find(q => q.x >= Math.round(x)) ?? roof[0]; return { x: top.x, y: top.y + 7 }; });
    const mid = (lo + hi) / 2; spots.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid)); // the fire starts in the middle and spreads out
  }
  fire.setSpots(spots);
}

// ---------- controls ----------
function renderParams() {
  const box = $('#fl-params'); box.replaceChildren();
  for (const p of PARAMS) {
    const out = h('output', {}, fmt(p, state.params[p.key]));
    const input = h('input', { type: 'range', min: p.min, max: p.max, step: p.step, value: state.params[p.key], 'aria-label': p.label, oninput: e => { state.params[p.key] = Number(e.target.value); out.textContent = fmt(p, state.params[p.key]); fire.p = { ...state.params }; if (p.key === 'spots') applySpots(); keep(); } });
    box.append(h('label', { class: 'fl-param' }, h('span', {}, p.label), out, input, p.hint ? h('small', {}, p.hint) : null));
  }
}
const fmt = (p, v) => `${p.step < 1 ? Number(v).toFixed(2) : v}${p.unit ? ' ' + p.unit : ''}`;
function renderPresets() {
  $('#fl-presets').replaceChildren(...Object.entries(PRESETS).map(([name, values]) => h('button', { type: 'button', class: 'button', onclick: () => { state.params = { ...DEFAULTS, ...values }; fire.p = { ...state.params }; renderParams(); applySpots(); keep(); } }, name)));
  $('#fl-scene').replaceChildren(...['Day', 'Dusk', 'Night'].map(s => h('button', { type: 'button', class: `button${state.scene === s ? ' primary' : ''}`, onclick: () => { state.scene = s; renderPresets(); keep(); } }, s)),
    ...[1, 2, 3].map(z => h('button', { type: 'button', class: `button${state.zoom === z ? ' primary' : ''}`, onclick: () => { state.zoom = z; renderPresets(); keep(); } }, `${z}×`)));
}
$('#fl-building').replaceChildren(...buildings.map(b => h('option', { value: b.meta.variantId, selected: b.meta.variantId === state.building }, `${b.meta.name} (v${b.meta.version})`)));
$('#fl-building').addEventListener('change', e => { state.building = e.target.value; keep(); loadBuilding(); });
$('#fl-ignite').addEventListener('click', () => { applySpots(); fire.ignite(); });
$('#fl-douse').addEventListener('click', () => fire.douse());
$('#fl-reset').addEventListener('click', () => { fire.lit = false; fire.flames = []; fire.smoke = []; fire.embers = []; fire.age = 0; state.spots = []; if (char) char.getContext('2d').clearRect(0, 0, char.width, char.height); applySpots(); });
$('#fl-defaults').addEventListener('click', () => { state.params = { ...DEFAULTS }; fire.p = { ...DEFAULTS }; renderParams(); applySpots(); keep(); });
$('#fl-copy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(JSON.stringify(state.params)); flash('Parameters copied.'); } catch { flash('Copy is not available here.'); } });
let layout = { ox: 0, oy: 0, k: 2 };
canvas.addEventListener('pointerdown', e => {
  if (!image) return; const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left - layout.ox) / layout.k, y = (e.clientY - r.top - layout.oy) / layout.k;
  if (e.shiftKey) { if (!state.spots.length) return; let best = 0; state.spots.forEach((s, i) => { if (Math.hypot(s.x - x, s.y - y) < Math.hypot(state.spots[best].x - x, state.spots[best].y - y)) best = i; }); state.spots.splice(best, 1); }
  else { if (x < 0 || y < 0 || x > image.img.width || y > image.img.height) return; state.spots.push({ x, y }); if (!fire.lit) fire.ignite(); }
  applySpots();
});

// ---------- drawing ----------
function frame(dt) {
  const dpr = window.devicePixelRatio || 1, w = canvas.clientWidth, hgt = canvas.clientHeight;
  if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(hgt * dpr)) { canvas.width = Math.round(w * dpr); canvas.height = Math.round(hgt * dpr); }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.imageSmoothingEnabled = state.zoom < 2;
  fire.step(Math.min(dt, 0.05));
  ctx.fillStyle = '#5f7d3c'; ctx.fillRect(0, 0, w, hgt);
  // Grass tiles in the isometric grid for scale.
  ctx.strokeStyle = 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; const k = state.zoom, tw = 64 * k, th = 32 * k;
  for (let i = -20; i < 20; i++) { ctx.beginPath(); ctx.moveTo(w / 2 + i * tw / 2 - 40 * tw, hgt * 0.6 + i * th / 2 + 20 * th); ctx.lineTo(w / 2 + i * tw / 2 + 40 * tw, hgt * 0.6 + i * th / 2 - 20 * th); ctx.stroke(); ctx.beginPath(); ctx.moveTo(w / 2 + i * tw / 2 - 40 * tw, hgt * 0.6 - i * th / 2 - 20 * th); ctx.lineTo(w / 2 + i * tw / 2 + 40 * tw, hgt * 0.6 - i * th / 2 + 20 * th); ctx.stroke(); }
  if (image) {
    const m = image.meta, ox = Math.round(w / 2 - m.anchor.x * k), oy = Math.round(hgt * 0.6 - m.anchor.y * k); layout = { ox, oy, k };
    // Charring grows where the fire burns.
    if (fire.lit && char) { const g = char.getContext('2d'); g.globalCompositeOperation = 'source-over'; for (const s of fire.activeSpots()) { const r = 14 + fire.p.flameWidth; const gr = g.createRadialGradient(s.x, s.y + 6, 0, s.x, s.y + 6, r); gr.addColorStop(0, `rgba(20,14,10,${0.02 * fire.p.char * fire.strength()})`); gr.addColorStop(1, 'rgba(20,14,10,0)'); g.fillStyle = gr; g.fillRect(s.x - r, s.y + 6 - r, r * 2, r * 2); } g.globalCompositeOperation = 'destination-in'; g.drawImage(image.img, 0, 0); }
    ctx.drawImage(image.img, ox, oy, image.img.width * k, image.img.height * k);
    if (char) ctx.drawImage(char, ox, oy, char.width * k, char.height * k);
    const dark = { Day: 0, Dusk: 0.35, Night: 0.62 }[state.scene];
    if (dark) { ctx.fillStyle = `rgba(14,20,40,${dark})`; ctx.fillRect(0, 0, w, hgt); }
    drawGlow(ctx, fire, ox, oy, k, 90 + 120 * fire.p.glow * (state.scene === 'Day' ? 0.4 : 1));
    drawSmoke(ctx, fire, ox, oy, k);
    drawFlames(ctx, fire, ox, oy, k);
    if (!fire.lit && !fire.flames.length) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.font = '13px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Press Ignite or click the roof', w / 2, hgt * 0.6 + 60); }
  }
}
let last = performance.now();
function loop(now) { frame((now - last) / 1000); last = now; requestAnimationFrame(loop); }

// ---------- shared database ----------
const shared = { db: null, user: null, uid: null, mode: 'local' };
function flash(text) { $('#fl-summary').textContent = text; clearTimeout(flash.t); flash.t = setTimeout(renderSummary, 2500); }
function renderSummary() { $('#fl-summary').textContent = state.proposal ? `Fire proposal waiting for Claude (${state.proposal.name ?? 'unnamed'}) — write „revize“ in the MK chat Grafika.` : `${buildings.length} buildings · tune and propose the game's fire`; }
function renderSaved() {
  $('#fl-saved').replaceChildren(...[...state.saved.entries()].map(([id, d]) => h('li', {}, h('button', { type: 'button', class: 'link', onclick: () => { state.params = { ...DEFAULTS, ...d.params }; fire.p = { ...state.params }; renderParams(); applySpots(); keep(); } }, d.name || id),
    h('button', { type: 'button', class: 'link', 'data-needs-write': true, onclick: async () => { if (shared.db) await shared.db.doc(`${SAVED}/${id}`).delete(); else { state.saved.delete(id); renderSaved(); } } }, 'Delete'))));
}
$('#fl-save').addEventListener('click', async () => {
  const name = $('#fl-name').value.trim() || `Fire ${state.saved.size + 1}`, id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `fire-${Date.now()}`;
  const data = { name, params: { ...state.params }, building: state.building, at: new Date().toISOString(), by: shared.uid ?? null };
  if (shared.db) await shared.db.doc(`${SAVED}/${id}`).set(data).catch(err => flash(`Not saved (${err?.code ?? 'error'}).`)); else { state.saved.set(id, data); renderSaved(); }
  flash(`Saved „${name}“.`);
});
$('#fl-propose').addEventListener('click', async () => {
  const data = { name: $('#fl-name').value.trim() || 'Fire Lab proposal', params: { ...state.params }, building: state.building, at: new Date().toISOString(), by: shared.uid ?? null };
  if (shared.db) await shared.db.doc(`${PROPOSAL}/proposal`).set(data).catch(err => flash(`Not saved (${err?.code ?? 'error'}).`)); else { state.proposal = data; }
  renderSummary();
});
async function connectShared() {
  const claude = window.claude; if (typeof claude?.use !== 'function') return;
  const [db, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('user').catch(() => null)]); if (!db) return;
  shared.db = db; shared.user = user; shared.uid = user ? await user.id().catch(() => null) : null;
  const canWrite = user ? await Promise.resolve(user.can?.('data.write')).catch(() => null) : null;
  if (canWrite === false) for (const b of document.querySelectorAll('[data-needs-write]')) b.disabled = true;
  db.collection(SAVED).onSnapshot(snap => { state.saved = new Map(snap.docs.filter(d => d.exists).map(d => [d.id, d.data()])); renderSaved(); }, () => {});
  db.collection(PROPOSAL).onSnapshot(snap => { const d = snap.docs.find(x => x.exists && x.id === 'proposal'); state.proposal = d ? d.data() : null; renderSummary(); }, () => {});
}

trackTopbarHeight();
renderParams(); renderPresets(); renderSaved(); renderSummary(); loadBuilding(); connectShared();
requestAnimationFrame(loop);
setTimeout(() => { if (!fire.lit) fire.ignite(); }, 400);
window.fireLab = { state, fire, ready: true };
