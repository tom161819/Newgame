// UI Lab (Studio): restyle and rearrange the game's real interface. The preview is a snapshot of the game screen and
// its windows (art/ui/snapshots, `npm run ui:capture`) in an iframe with the game's own CSS, the theme layer
// (art/ui/ui-theme.css) and the shared applyUiConfig (art/ui/uiConfig.js) that the game uses too. Designs are kept in
// the Studio page's database (`ui/<id>`); the one marked for the game is taken over by the Mechaniky chat („převzít UI“).
import '../styles.css';
import { trackTopbarHeight } from '../lib/topbarHeight.js';
import './ui-lab.css';
import {
  normalizeUiConfig, applyUiConfig, sectionsOf, FONTS, TEXTURES, FRAMES, SHADOWS, HEADINGS, POINTERS, COLOR_TOKENS, LAYOUT, PANELS,
} from '../../../art/ui/uiConfig.js';
import { UI_PRESETS } from '../../../art/ui/presets.js';
import gameConfig from '../../../art/ui/ui-config.json';
import gameCss from '../../../src/style.css?inline';
import ledgerCss from '../../../src/ui/resourceLedger.css?inline';
import themeCss from '../../../art/ui/ui-theme.css?inline';
import figtreeCss from '@fontsource-variable/figtree/index.css?inline';
import serifCss from '@fontsource-variable/source-serif-4/index.css?inline';
import cinzelCss from '@fontsource-variable/cinzel/index.css?inline';
import garamondCss from '@fontsource-variable/eb-garamond/index.css?inline';
import fellCss from '@fontsource/im-fell-english/index.css?inline';
import screenHtml from '../../../art/ui/snapshots/screen.html?raw';
import snapshots from '../../../art/ui/snapshots/panels.json';
import backgroundUrl from '../../../art/ui/snapshots/background.png?url';

const imageUrls = import.meta.glob('../../../art/ui/snapshots/img/*', { eager: true, query: '?url', import: 'default' });
const STORAGE = 'asset-studio.ui-lab.v1', COLLECTION = 'ui', W = 1440, H = 900;
const $ = selector => document.querySelector(selector);
const clone = value => JSON.parse(JSON.stringify(value));
const abs = url => new URL(url, location.href).href;

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

// ---------- state ----------
const readDraft = () => { try { const raw = localStorage.getItem(STORAGE); return raw ? JSON.parse(raw) : null; } catch { return null; } };
const state = {
  config: normalizeUiConfig(readDraft() ?? gameConfig).config,
  tab: 'style', window: '', original: false, docking: true, drag: null, designs: new Map(),
};
const shared = { mode: 'local', db: null, uid: null, canWrite: null, user: null, names: new Map() };
const readOnly = () => shared.mode === 'shared' && shared.canWrite === false;
function setStatus(text) { $('#ul-status').textContent = text; }
function showAlert(text) { const a = $('#studio-alert'); a.textContent = text; a.hidden = !text; }
function changed({ controls = true } = {}) {
  try { localStorage.setItem(STORAGE, JSON.stringify(state.config)); } catch { /* the draft lives in memory only */ }
  applyToFrame();
  if (controls) renderControls();
  renderSummary();
}

// ---------- preview frame ----------
const frame = $('#ul-frame'), overlay = $('#ul-overlay');
const resolveImages = html => html.replace(/__UI_IMG__\/([\w.]+)/g, (_, name) => abs(imageUrls[`../../../art/ui/snapshots/img/${name}`] ?? ''));
const FRAME_CSS = `
  #game { background: #3d5a2a url("${abs(backgroundUrl)}") center / cover no-repeat; }
  *, *::before, *::after { transition: none !important; animation: none !important; }
  html, body { overflow: hidden; }
  body { width: ${W}px; height: ${H}px; }
  .minimap img { position:absolute; left:50%; top:50%; width:var(--minimap-size) !important; height:var(--minimap-size) !important; margin:calc(var(--minimap-size) / -2) 0 0 calc(var(--minimap-size) / -2); transform:scaleY(.5) rotate(45deg); image-rendering:pixelated; border:1px solid #b99a53; }`;
let originals = new Map(), dispose = null;
function frameDoc() { return frame.contentDocument; }
function buildFrame() {
  const fonts = [figtreeCss, serifCss, cinzelCss, garamondCss, fellCss].join('\n');
  frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><base href="${abs('./')}"><style>${fonts}</style><style>${gameCss}</style><style>${ledgerCss}</style><style>${themeCss}</style><style>${FRAME_CSS}</style></head>${resolveImages(screenHtml)}</html>`;
}
frame.addEventListener('load', () => {
  const doc = frameDoc();
  originals = new Map(Object.keys(PANELS).map(id => [id, doc.getElementById(id)?.cloneNode(true)]).filter(([, el]) => el));
  dispose = null;
  showWindow(state.window);
  fitStage();
  window.uiLab.ready = true;
});

function applyToFrame() {
  const doc = frameDoc();
  if (!doc?.body) return;
  dispose?.(); dispose = null;
  if (!state.original) dispose = applyUiConfig(doc, state.config, { observe: false });
  requestAnimationFrame(renderOverlay);
}

// g-e3-tutorial-vzhled: the tutorial is not part of the captured snapshot, so the Lab draws a sample with the game's own
// classes (bubble with Show me / Skip, pointer at the Buildings tab, an off-screen pointer at the edge, the tick, a tip,
// the speed buttons and the Royal tasks card). The style and the Pointer choice apply to it like to the real game.
const TUTORIAL_DEMO = 'tutorial';
function tutorialDemo(doc) {
  const el = (tag, cls, text) => { const e = doc.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; e.dataset.ulDemo = ''; return e; };
  const at = (e, css) => { Object.assign(e.style, css); doc.body.append(e); return e; };
  const button = (cls, text) => { const b = el('button', cls, text); b.type = 'button'; return b; };
  const bubble = (count, text, actions, tip = false) => { const b = el('div', `tutorial-bubble${tip ? ' is-tip' : ''}`); b.append(el('small', 'tutorial-count', count), el('p', 'tutorial-text', text)); const a = el('div', 'tutorial-actions'); a.append(...actions); b.append(a, button('tutorial-close', '×')); return b; };
  const tab = doc.getElementById('buildings-tab')?.getBoundingClientRect() ?? { left: 40, top: 840, width: 110, height: 40 };
  const cx = tab.left + tab.width / 2;
  // A map step (place the Granary on a green spot) and a bar step (pointer above the Buildings tab).
  at(bubble('Step 3 of 10', 'Build a Granary: food needs a dry store or it spoils.', [button('tutorial-skip', 'Skip'), button('tutorial-show', 'Show me')]), { left: '200px', top: '400px', width: '300px' });
  at(el('div', 'tutorial-arrow'), { left: '560px', top: '450px', transform: 'translate(-50%,-50%) rotate(0deg)', animation: 'none' });
  at(el('div', 'tutorial-arrow'), { left: `${cx + 120}px`, top: `${tab.top - 34}px`, transform: 'translate(-50%,-50%) rotate(90deg)', animation: 'none' });
  at(el('div', 'tutorial-arrow offscreen'), { left: '1410px', top: '420px', transform: 'translate(-50%,-50%) rotate(0deg)', animation: 'none' });
  at(el('div', 'tutorial-done', '✓'), { left: '720px', top: '300px' });
  at(bubble('Tip', 'Night is coming: Torches and a Campfire keep wolves away from the houses.', [button('tutorial-skip', 'No more tips'), button('tutorial-next', 'Got it')], true), { left: '470px', top: '150px', width: '300px' });
  const speed = el('div', 'speed-controls'); speed.append(...[[0, '‖'], [1, '1×'], [2, '2×'], [3, '3×']].map(([n, t]) => { const b = button('speed-button', t); b.dataset.speed = String(n); b.setAttribute('aria-pressed', String(n === 1)); return b; }));
  const wrap = el('div', ''); wrap.append(speed); at(wrap, { position: 'fixed', left: '840px', top: '150px', padding: '6px 8px', background: 'var(--glass)', border: 'var(--ui-border,1px) solid var(--line-soft)', borderRadius: 'var(--ui-radius,8px)' });
  const goals = el('details', 'royal-goals'); goals.open = true; goals.append(el('summary', '', 'Royal tasks · 1 / 8'));
  const list = el('ol', 'royal-goals-list');
  for (const [name, n, max, reward] of [['Build 3 houses', 2, 3, '20 gold'], ['Reach 10 residents', 6, 10, '20 wood'], ['Bake the first bread', 0, 1, '30 gold']]) {
    const li = el('li', 'royal-goal'), bar = el('progress'); bar.max = max; bar.value = n;
    li.append(el('strong', '', name), el('span', 'royal-goal-count', `${n} / ${max}`), bar, el('small', '', `Reward: ${reward}`)); list.append(li);
  }
  goals.append(list); at(goals, { position: 'fixed', right: '90px', top: '420px', margin: '0' });
}

// Windows open in the preview with the content the game showed when it was captured.
function showWindow(id) {
  const doc = frameDoc();
  if (!doc?.body) return;
  dispose?.(); dispose = null;
  for (const d of doc.querySelectorAll('dialog[open]')) d.close();
  for (const [pid, original] of originals) { const el = doc.getElementById(pid); if (el) el.replaceWith(original.cloneNode(true)); }
  state.window = id;
  $('#ul-window').value = id;
  for (const el of doc.querySelectorAll('[data-ul-demo]')) el.remove();
  if (id === TUTORIAL_DEMO) tutorialDemo(doc);
  if (id) {
    const snap = snapshots.panels.find(p => p.id === id);
    let el = doc.getElementById(id);
    if (snap && el) {
      const tpl = doc.createElement('template');
      tpl.innerHTML = resolveImages(snap.html);
      const filled = tpl.content.firstElementChild;
      el.replaceWith(filled); el = filled;
    }
    if (el) {
      el.removeAttribute('hidden'); el.setAttribute('aria-hidden', 'false');
      if (el.tagName === 'DIALOG') { el.removeAttribute('open'); if (el.classList.contains('docked-panel')) el.show(); else el.showModal(); }
      else el.classList.add('open');
      if (id === 'buildings-panel') doc.getElementById('buildings-tab')?.setAttribute('aria-expanded', 'true');
    }
  }
  applyToFrame();
  if (state.tab === 'windows') renderControls();
}

function scale() { return $('#ul-stage').clientWidth / W; }
function fitStage() {
  const s = scale();
  frame.style.transform = `scale(${s})`;
  $('#ul-stage').style.height = `${Math.round(H * s)}px`;
  renderOverlay();
}
new ResizeObserver(fitStage).observe($('#ul-stage'));

// ---------- docking by drag ----------
// Each draggable part of the screen, where its handle sits, and the spots it can dock to (frame pixels).
function regions(doc) {
  const rect = sel => { const el = doc.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? r : null; };
  const vp = rect('.viewport') ?? { left: 12, top: 40, right: W - 12, bottom: H - 60, width: W - 24, height: H - 100 };
  const main = rect('main') ?? { left: 12, top: 8, right: W - 12, bottom: H - 10, width: W - 24, height: H - 18 };
  const box = (x, y, w, hgt) => ({ x, y, w, h: hgt });
  const corner = (c, w, hgt) => box(c.endsWith('left') ? vp.left + 10 : vp.right - w - 10, c.startsWith('top') ? vp.top + 10 : vp.bottom - hgt - 10, w, hgt);
  const dialogOpen = doc.querySelector('.game-dialog[open]:not(.docked-panel)');
  return [
    { key: 'hud', label: 'Resource bar', el: rect('.inventory'), zones: { top: box(vp.left + 8, vp.top + 8, vp.width - 16, 46), bottom: box(vp.left + 8, vp.bottom - 54, vp.width - 16, 46) } },
    { key: 'buildingsBar', label: 'Buildings bar', el: rect('.buildings-bar'), zones: { top: box(main.left, main.top + 2, main.width, 44), bottom: box(main.left, main.bottom - 46, main.width, 44) } },
    { key: 'settings', label: 'Settings tab', el: rect('.settings-button'), zones: { left: box(0, H * 0.28, 56, H * 0.34), right: box(W - 56, H * 0.28, 56, H * 0.34) } },
    { key: 'population', label: 'Population tab', el: rect('.population-tab'), zones: { left: box(0, H * 0.28, 56, H * 0.34), right: box(W - 56, H * 0.28, 56, H * 0.34) } },
    { key: 'cornerStack', label: 'Notices · events · minimap', el: rect('.corner-stack .minimap') ?? rect('.corner-stack'), zones: Object.fromEntries(['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(c => [c, corner(c, 300, 170)])) },
    { key: 'camera', label: 'Camera chips', el: rect('.camera-controls'), zones: Object.fromEntries(['top-left', 'bottom-left', 'bottom-right'].map(c => [c, corner(c, 260, 40)])) },
    ...(dialogOpen ? [{ key: 'dialogs', label: 'Window', el: dialogOpen.getBoundingClientRect(), zones: { left: box(16, 60, 640, H - 120), center: box(W / 2 - 320, 60, 640, H - 120), right: box(W - 656, 60, 640, H - 120) } }] : []),
    ...(doc.querySelector('#unit-dialog[open]') ? [{ key: 'unitPanel', label: 'Unit panel', el: rect('#unit-dialog'), zones: { left: box(16, 144, 340, 420), right: box(W - 356, 144, 340, 420) } }] : []),
  ];
}
function renderOverlay() {
  const doc = frameDoc();
  overlay.replaceChildren();
  if (!doc?.body || !state.docking || state.original || readOnly()) return;
  const s = scale(), list = regions(doc);
  const px = r => ({ left: `${r.x * s}px`, top: `${r.y * s}px`, width: `${r.w * s}px`, height: `${r.h * s}px` });
  if (state.drag) {
    const region = list.find(r => r.key === state.drag.key);
    for (const [value, zone] of Object.entries(region?.zones ?? {})) {
      const z = h('div', { class: `ul-zone${state.config.layout[region.key] === value ? ' current' : ''}${state.drag.over === value ? ' over' : ''}`, 'data-zone': value }, h('span', {}, LAYOUT[region.key].values[value]));
      Object.assign(z.style, px(zone));
      overlay.append(z);
    }
  }
  for (const region of list) {
    if (!region.el) continue;
    const handle = h('button', { type: 'button', class: `ul-handle${state.drag?.key === region.key ? ' dragging' : ''}`, 'data-region': region.key, title: `Drag to dock: ${region.label}` }, '⠿ ', region.label);
    handle.style.left = `${Math.max(0, Math.min(W - 150, region.el.left + 4)) * s}px`;
    handle.style.top = `${Math.max(0, Math.min(H - 24, region.el.top + 4)) * s}px`;
    handle.addEventListener('pointerdown', event => startDrag(event, region.key));
    overlay.append(handle);
  }
}
function zoneAt(clientX, clientY) {
  // Zones ignore the pointer (so the drag is not interrupted); find the one under it by its box.
  const el = [...overlay.querySelectorAll('.ul-zone')].reverse().find(z => { const r = z.getBoundingClientRect(); return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom; });
  return el?.dataset.zone ?? null;
}
function startDrag(event, key) {
  event.preventDefault();
  state.drag = { key, over: null };
  overlay.classList.add('dragging');
  renderOverlay();
  const move = e => { const over = zoneAt(e.clientX, e.clientY); if (over !== state.drag.over) { state.drag.over = over; for (const z of overlay.querySelectorAll('.ul-zone')) z.classList.toggle('over', z.dataset.zone === over); } };
  const up = e => {
    window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
    const over = zoneAt(e.clientX, e.clientY), region = state.drag.key;
    state.drag = null; overlay.classList.remove('dragging');
    if (over && state.config.layout[region] !== over) { state.config.layout[region] = over; setStatus(`${LAYOUT[region].label}: ${LAYOUT[region].values[over]}`); changed(); }
    else renderOverlay();
  };
  window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
}

// ---------- controls ----------
function renderControls() {
  for (const tab of document.querySelectorAll('.ul-tabs [role="tab"]')) tab.setAttribute('aria-selected', String(tab.dataset.tab === state.tab));
  const view = { style: styleView, layout: layoutView, windows: windowsView, designs: designsView }[state.tab]();
  $('#ul-panel').replaceChildren(...view);
}
const field = (label, control, hint) => h('label', { class: 'ul-field' }, h('span', {}, label), control, hint ? h('small', {}, hint) : null);
const select = (options, value, onchange, attrs = {}) => h('select', { ...attrs, onchange: e => onchange(e.target.value) }, Object.entries(options).map(([v, l]) => { const o = h('option', { value: v }, typeof l === 'string' ? l : l.label); o.selected = v === String(value); return o; }));
const range = (min, max, step, value, onchange, attrs = {}) => h('input', { type: 'range', min, max, step, value: String(value), ...attrs, oninput: e => onchange(Number(e.target.value)) });
const toHex = value => { if (/^#[0-9a-f]{6}$/i.test(value)) return value; if (/^#[0-9a-f]{3}$/i.test(value)) return `#${[...value.slice(1)].map(c => c + c).join('')}`; const m = value.match(/[\d.]+/g); return m ? `#${m.slice(0, 3).map(n => Math.round(Number(n)).toString(16).padStart(2, '0')).join('')}` : '#000000'; };

function styleView() {
  const t = state.config.tokens, set = (key, value) => { t[key] = value; state.config.style = state.config.style.endsWith('-custom') ? state.config.style : `${state.config.style}-custom`.slice(0, 40); changed({ controls: false }); };
  const presets = h('div', { class: 'ul-presets' }, UI_PRESETS.map(p => h('button', { type: 'button', class: `ul-preset${state.config.style.replace(/-custom$/, '') === p.style ? ' active' : ''}`, 'data-preset': p.style, onclick: () => loadPreset(p.style) },
    h('span', { class: 'ul-swatches', 'aria-hidden': 'true' }, ['panel', 'panelRaised', 'accent', 'ink'].map(k => { const s = h('i'); s.style.background = p.tokens[k]; return s; })),
    h('strong', {}, p.name), h('small', {}, `${FONTS[p.tokens.fontDisplay].label.split(' (')[0]} · ${TEXTURES[p.tokens.texture]} · ${FRAMES[p.tokens.frame]}`))));
  const colors = h('div', { class: 'ul-colors' }, COLOR_TOKENS.map(([key, label]) => {
    const text = h('input', { type: 'text', value: t[key], 'aria-label': `${label} (CSS colour)`, onchange: e => { const { config, problems } = normalizeUiConfig({ ...state.config, tokens: { ...t, [key]: e.target.value } }); if (problems.length) { e.target.value = t[key]; setStatus(`${label}: not a colour`); return; } set(key, config.tokens[key]); picker.value = toHex(config.tokens[key]); } });
    const picker = h('input', { type: 'color', value: toHex(t[key]), 'aria-label': label, oninput: e => { text.value = e.target.value; set(key, e.target.value); } });
    return h('div', { class: 'ul-color' }, picker, h('span', {}, label), text);
  }));
  return [
    h('h3', {}, 'Styles'), presets,
    field('Design name', h('input', { type: 'text', maxlength: 60, value: state.config.name, oninput: e => { state.config.name = e.target.value; changed({ controls: false }); } })),
    h('h3', {}, 'Type'),
    field('Text font', select(FONTS, t.fontUi, v => set('fontUi', v))),
    field('Heading font', select(FONTS, t.fontDisplay, v => set('fontDisplay', v))),
    field(`Text size ${Math.round(t.fontScale * 100)} %`, range(0.8, 1.4, 0.05, t.fontScale, v => { set('fontScale', v); renderControls(); })),
    field('Headings', select(HEADINGS, t.headings, v => set('headings', v))),
    h('h3', {}, 'Tutorial and tips'),
    field('Pointer', select(POINTERS, t.pointer ?? 'arrow', v => set('pointer', v)), 'Window → Tutorial shows the bubble, arrow, tick, speed buttons and Royal tasks.'),
    h('h3', {}, 'Frames and surfaces'),
    field('Texture', select(TEXTURES, t.texture, v => set('texture', v))),
    field('Frame', select(FRAMES, t.frame, v => set('frame', v))),
    field('Shadow', select(SHADOWS, t.shadow, v => set('shadow', v))),
    field(`Corner radius ${t.radius} px`, range(0, 24, 1, t.radius, v => { set('radius', v); renderControls(); })),
    field(`Frame line ${t.borderWidth} px`, range(0, 4, 1, t.borderWidth, v => { set('borderWidth', v); renderControls(); })),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: t.light, onchange: e => set('light', e.target.checked) }), ' Light style (dark text on light panels)'),
    h('h3', {}, 'Colours'), colors,
  ];
}
function loadPreset(id) {
  const preset = UI_PRESETS.find(p => p.style === id);
  if (!preset) return;
  state.config = normalizeUiConfig({ ...clone(preset), panels: state.config.panels }).config;
  setStatus(`Style: ${preset.name} (look and layout)`);
  changed();
}

function layoutView() {
  return [
    h('p', { class: 'ul-hint' }, 'Drag a handle in the preview onto a highlighted spot, or choose here.'),
    ...Object.entries(LAYOUT).map(([key, { label, values }]) => field(label, select(values, state.config.layout[key], v => { state.config.layout[key] = v; changed({ controls: false }); }, { 'data-layout': key }))),
  ];
}

function windowsView() {
  const id = state.window, doc = frameDoc(), el = id && doc?.getElementById(id);
  const picker = field('Window', select({ '': 'Choose a window…', ...Object.fromEntries(windowIds().map(w => [w, PANELS[w]])) }, id, v => showWindow(v)));
  if (!el) return [h('p', { class: 'ul-hint' }, 'Pick a window to reorder its sections, hide what you do not need and change its text size and font.'), picker];
  const settings = state.config.panels[id] ?? {}, save = next => { const clean = { ...settings, ...next }; for (const k of Object.keys(clean)) if (clean[k] === undefined || (Array.isArray(clean[k]) && !clean[k].length)) delete clean[k]; if (Object.keys(clean).length) state.config.panels[id] = clean; else delete state.config.panels[id]; changed(); };
  // Sections in the order the config shows them.
  const sections = sectionsOf(el), keys = sections.map(s => s.key), order = [...(settings.order ?? []).filter(k => keys.includes(k)), ...keys.filter(k => !(settings.order ?? []).includes(k))];
  const hidden = new Set(settings.hidden ?? []), label = key => sections.find(s => s.key === key)?.label ?? key;
  const move = (key, to) => { const next = order.filter(k => k !== key); next.splice(Math.max(0, Math.min(next.length, to)), 0, key); save({ order: next }); };
  let dragged = null;
  const list = h('ol', { class: 'ul-sections', 'aria-label': `Sections of ${PANELS[id]}` }, order.map((key, i) => h('li', {
    class: `ul-section${hidden.has(key) ? ' is-hidden' : ''}`, draggable: 'true', 'data-section': key,
    ondragstart: e => { dragged = key; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', key); },
    ondragover: e => { e.preventDefault(); e.currentTarget.classList.add('drop'); },
    ondragleave: e => e.currentTarget.classList.remove('drop'),
    ondrop: e => { e.preventDefault(); if (dragged && dragged !== key) move(dragged, order.filter(k => k !== dragged).indexOf(key)); },
  }, h('span', { class: 'ul-grip', 'aria-hidden': 'true' }, '⠿'), h('span', { class: 'ul-section-label' }, label(key), h('small', {}, key)),
    h('button', { type: 'button', class: 'button ghost', 'aria-label': `Move ${label(key)} up`, disabled: i === 0, onclick: () => move(key, i - 1) }, '↑'),
    h('button', { type: 'button', class: 'button ghost', 'aria-label': `Move ${label(key)} down`, disabled: i === order.length - 1, onclick: () => move(key, i + 1) }, '↓'),
    h('label', { class: 'check', title: 'Show this section' }, h('input', { type: 'checkbox', checked: !hidden.has(key), 'aria-label': `Show ${label(key)}`, onchange: e => { const next = new Set(hidden); if (e.target.checked) next.delete(key); else next.add(key); save({ hidden: [...next] }); } })))));
  return [picker, h('h3', {}, PANELS[id]), h('p', { class: 'ul-hint' }, 'Drag sections (or use the arrows) to change their order; untick to hide.'), list,
    field(`Text size ${Math.round((settings.textScale ?? 1) * 100)} %`, range(0.8, 1.5, 0.05, settings.textScale ?? 1, v => save({ textScale: v === 1 ? undefined : v }))),
    field('Font', select({ '': 'Same as the style', ...FONTS }, settings.font ?? '', v => save({ font: v || undefined }))),
    h('button', { type: 'button', class: 'button', onclick: () => { delete state.config.panels[id]; changed(); } }, 'Reset this window')];
}
const windowIds = () => [...new Set([...snapshots.panels.map(p => p.id), 'notices-panel'])].filter(id => PANELS[id]);

// ---------- designs: saved in the page database, one marked for the game ----------
const slug = name => (name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'design').slice(0, 60);
function designsView() {
  const designs = [...state.designs.values()].sort((a, b) => (b.at ?? '').localeCompare(a.at ?? ''));
  const json = h('textarea', { rows: 8, spellcheck: 'false', 'aria-label': 'Design JSON' }, JSON.stringify(state.config, null, 2));
  return [
    h('p', { class: 'ul-hint' }, shared.mode === 'shared' ? 'Designs are shared with everyone who can open this page. Mark one „For the game“, then write „převzít UI“ in the MK chat Mechaniky.' : 'This page is not running in Claude: designs stay in this browser. Copy the JSON to hand a design over.'),
    h('div', { class: 'ul-actions' },
      h('button', { type: 'button', class: 'button primary', disabled: readOnly(), onclick: () => saveDesign(false) }, 'Save design'),
      h('button', { type: 'button', class: 'button', disabled: readOnly(), onclick: () => saveDesign(true) }, 'Save and use in game'),
      h('button', { type: 'button', class: 'button ghost', onclick: () => { state.config = normalizeUiConfig(gameConfig).config; setStatus('Back to the look the game uses now'); changed(); } }, 'Game’s current look')),
    h('h3', {}, 'Saved designs'),
    designs.length ? h('ul', { class: 'ul-designs' }, designs.map(d => h('li', { class: d.forGame ? 'for-game' : '', 'data-design': d.id },
      h('div', {}, h('strong', {}, d.config.name), h('small', {}, [d.forGame ? 'For the game · ' : '', d.by ? `${who(d.by)} · ` : '', d.at ? new Date(d.at).toLocaleString() : ''].join(''))),
      h('button', { type: 'button', class: 'button', onclick: () => { state.config = clone(d.config); setStatus(`Loaded „${d.config.name}“`); changed(); } }, 'Load'),
      h('button', { type: 'button', class: 'button ghost', disabled: readOnly() || d.forGame, onclick: () => markForGame(d.id) }, 'Use in game'),
      h('button', { type: 'button', class: 'button ghost', disabled: readOnly(), 'aria-label': `Delete ${d.config.name}`, onclick: () => deleteDesign(d.id) }, '✕')))) : h('p', { class: 'empty' }, 'No saved design yet.'),
    h('h3', {}, 'JSON'), json,
    h('div', { class: 'ul-actions' },
      h('button', { type: 'button', class: 'button', onclick: async () => { try { await navigator.clipboard.writeText(JSON.stringify(state.config, null, 2)); setStatus('Copied'); } catch { json.select(); setStatus('Copy blocked: the JSON is selected, press Ctrl+C'); } } }, 'Copy JSON'),
      h('button', { type: 'button', class: 'button', onclick: () => { let parsed; try { parsed = JSON.parse(json.value); } catch { setStatus('Not JSON'); return; } const { config, problems } = normalizeUiConfig(parsed); state.config = config; setStatus(problems.length ? `Imported; ignored: ${problems.slice(0, 3).join(', ')}` : 'Imported'); changed(); } }, 'Import JSON')),
  ];
}
const who = id => id === shared.uid ? 'you' : shared.names.get(id) || 'a reviewer';
function readLocalDesigns() { try { return JSON.parse(localStorage.getItem(`${STORAGE}.designs`) ?? '[]'); } catch { return []; } }
function writeLocalDesigns(list) { try { localStorage.setItem(`${STORAGE}.designs`, JSON.stringify(list)); } catch { setStatus('This browser does not keep designs; copy the JSON.'); } }
function loadDesigns(docs) {
  state.designs = new Map();
  for (const doc of docs) {
    const data = doc.data ?? doc;
    if (!data?.config) continue;
    const { config } = normalizeUiConfig(data.config);
    state.designs.set(doc.id ?? data.id, { id: doc.id ?? data.id, config, by: typeof data.by === 'string' ? data.by : null, at: typeof data.at === 'string' ? data.at : '', forGame: data.forGame === true });
  }
}
async function writeDesign(id, data) {
  if (shared.mode === 'shared') await shared.db.doc(`${COLLECTION}/${id}`).set(data);
  else { writeLocalDesigns([...readLocalDesigns().filter(d => d.id !== id), { id, ...data }]); loadDesigns(readLocalDesigns()); }
}
async function saveDesign(forGame) {
  const id = slug(state.config.name), data = { config: clone(state.config), ...(shared.uid ? { by: shared.uid } : {}), at: new Date().toISOString(), forGame };
  try {
    if (forGame) for (const d of state.designs.values()) if (d.forGame && d.id !== id) await writeDesign(d.id, { config: d.config, ...(d.by ? { by: d.by } : {}), at: d.at, forGame: false });
    await writeDesign(id, data);
    state.designs.set(id, { id, ...data });
    setStatus(forGame ? `Saved „${state.config.name}“ for the game. Write „převzít UI“ in the MK chat Mechaniky.` : `Saved „${state.config.name}“`);
  } catch (error) { showAlert(error?.code === 'invalid_argument' || error?.code === 'permission_denied' ? 'Saving needs Contributor access to the Studio page.' : `Not saved (${error?.code ?? 'unavailable'}).`); }
  renderControls(); renderSummary();
}
async function markForGame(id) {
  const target = state.designs.get(id);
  if (!target) return;
  try {
    for (const d of state.designs.values()) if (d.forGame && d.id !== id) await writeDesign(d.id, { config: d.config, ...(d.by ? { by: d.by } : {}), at: d.at, forGame: false });
    await writeDesign(id, { config: target.config, ...(target.by ? { by: target.by } : {}), at: target.at, forGame: true });
    for (const d of state.designs.values()) d.forGame = d.id === id;
    setStatus(`„${target.config.name}“ is marked for the game`);
  } catch (error) { showAlert(`Not saved (${error?.code ?? 'unavailable'}).`); }
  renderControls(); renderSummary();
}
async function deleteDesign(id) {
  try {
    if (shared.mode === 'shared') await shared.db.doc(`${COLLECTION}/${id}`).delete();
    else writeLocalDesigns(readLocalDesigns().filter(d => d.id !== id));
    state.designs.delete(id);
  } catch (error) { showAlert(`Not deleted (${error?.code ?? 'unavailable'}).`); }
  renderControls(); renderSummary();
}
function renderSummary() {
  const forGame = [...state.designs.values()].find(d => d.forGame);
  $('#ul-summary').textContent = forGame ? `„${forGame.config.name}“ waits for the game — write „převzít UI“ in the MK chat Mechaniky.` : `Game uses „${normalizeUiConfig(gameConfig).config.name}“.`;
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
  db.collection(COLLECTION).onSnapshot(snap => {
    shared.mode = 'shared';
    loadDesigns(snap.docs.filter(d => d.exists).map(d => ({ id: d.id, data: d.data() })));
    resolveNames();
    if (state.tab === 'designs') renderControls();
    renderSummary(); renderOverlay();
  }, error => { if (error?.code !== 'revoked') showAlert(`Designs stopped updating (${error?.code ?? 'unavailable'}). Reload the page.`); });
}
async function resolveNames() {
  if (!shared.user?.profiles) return;
  const ids = [...new Set([...state.designs.values()].map(d => d.by).filter(id => id && id !== shared.uid && !shared.names.has(id)))];
  if (!ids.length) return;
  try { const p = await shared.user.profiles(ids); for (const id of ids) if (p?.[id]?.name) shared.names.set(id, p[id].name); if (state.tab === 'designs') renderControls(); } catch { /* optional */ }
}

// ---------- boot ----------
for (const tab of document.querySelectorAll('.ul-tabs [role="tab"]')) tab.addEventListener('click', () => { state.tab = tab.dataset.tab; renderControls(); });
for (const id of windowIds()) $('#ul-window').append(h('option', { value: id }, PANELS[id]));
$('#ul-window').append(h('option', { value: TUTORIAL_DEMO }, 'Tutorial, tips, speed and Royal tasks'));
$('#ul-window').addEventListener('change', e => showWindow(e.target.value));
$('#ul-original').addEventListener('change', e => { state.original = e.target.checked; applyToFrame(); });
$('#ul-docking').addEventListener('change', e => { state.docking = e.target.checked; renderOverlay(); });
$('#ul-sub').textContent = `The game's real interface · captured ${new Date(snapshots.capturedAt).toLocaleDateString()} · ${snapshots.panels.length} windows`;
window.uiLab = {
  ready: false,
  config: () => clone(state.config),
  frameDoc,
  showWindow,
  loadPreset,
  setLayout: (key, value) => { state.config.layout[key] = value; changed(); },
  designs: () => [...state.designs.values()].map(d => ({ id: d.id, name: d.config.name, forGame: d.forGame })),
};
loadDesigns(readLocalDesigns());
renderControls();
renderSummary();
buildFrame();
connectShared();
trackTopbarHeight();
