import './styles.css';
import { loadStudioData } from './data.js';
import { buildCatalog, filterCatalog, CATEGORIES } from './lib/specs.js';
import { STATUSES, STATUS_LABELS, readLocal, writeLocal, reviewState, updateLocal, discardLocal, buildExportManifest, pendingChanges } from './lib/approvals.js';
import { TIMES, timePreset } from './lib/lighting.js';
import { heightInPixels, projectPoint } from './lib/projection.js';
import { renderModel, spriteMetadata, rendererAvailable } from './render/spriteRenderer.js';
import { drawConnection, previewFrame, resolveStages } from './generators/ground.js';
import { BACKGROUNDS, drawBackground, drawGrid, drawFootprint, drawHuman, drawBounds, drawSprite, applyTimeOfDay, drawFlames, drawTestMap } from './render/compositor.js';

const REPOSITORY = 'https://github.com/tom161819/Newgame';
const UI_KEY = 'asset-studio.ui.v1';
const data = loadStudioData();
const { style, generators } = data;
const catalog = buildCatalog(data);
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const glReady = rendererAvailable();

const state = {
  view: 'assets', source: 'all', category: 'all', query: '',
  selected: catalog.studio[0]?.id ?? catalog.game[0]?.id, tab: 'compare',
  zoom: 1.5, background: 'grass', grid: true, footprint: true, bounds: true, human: true, gamePixels: false, time: 'day', sceneZoom: 1.25,
  local: readLocal(storage),
};
try { Object.assign(state, pickUi(JSON.parse(storage?.getItem(UI_KEY) ?? '{}'))); } catch { /* keep defaults */ }
function pickUi(saved) {
  const out = {};
  for (const key of ['source', 'category', 'tab', 'background', 'time']) if (typeof saved[key] === 'string') out[key] = saved[key];
  for (const key of ['zoom', 'sceneZoom']) if (Number.isFinite(saved[key])) out[key] = saved[key];
  for (const key of ['grid', 'footprint', 'bounds', 'human', 'gamePixels']) if (typeof saved[key] === 'boolean') out[key] = saved[key];
  return out;
}
function saveUi() {
  try { storage?.setItem(UI_KEY, JSON.stringify(Object.fromEntries(['source', 'category', 'tab', 'background', 'time', 'zoom', 'sceneZoom', 'grid', 'footprint', 'bounds', 'human', 'gamePixels'].map(k => [k, state[k]])))); } catch { /* optional */ }
}

// ---------- helpers ----------
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else if (key === 'text') node.textContent = value;
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}
const $ = selector => document.querySelector(selector);
const repoLink = (path, label = path) => h('a', { href: `${REPOSITORY}/blob/main/${path}`, target: '_blank', rel: 'noopener noreferrer', class: 'mono' }, label);
const assetHash = id => id.replace(':', '-');
const findAsset = id => catalog.all.find(item => item.id === id);
const pill = (status, label = STATUS_LABELS[status] ?? status) => h('span', { class: `pill ${status}` }, label);

function download(name, blob) {
  const url = URL.createObjectURL(blob), link = h('a', { href: url, download: name });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- sprite rendering ----------
const spriteCache = new Map();
function spriteFor(asset, variant, scale = 1) {
  const key = `${variant.id}:${variant.hash}:${scale}`;
  if (!spriteCache.has(key)) {
    const generator = generators[asset.generator];
    if (generator.kind === 'surface') spriteCache.set(key, generator.paint(variant.spec, { footprint: asset.footprint, style, scale }));
    else spriteCache.set(key, renderModel(generator.build(variant.spec, { footprint: asset.footprint, style }), { style, footprint: asset.footprint, scale }));
  }
  return spriteCache.get(key);
}
function preferredVariant(asset) {
  const chosen = asset.variants.find(variant => reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }).preferred);
  return chosen ?? asset.variants[0];
}
function assetStatus(asset) {
  const states = asset.variants.map(variant => reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }));
  const status = states.some(s => s.effective.status === 'approved' && !s.outdated) ? 'approved' : states.some(s => s.effective.status === 'review') ? 'review' : 'draft';
  return { status, local: states.some(s => s.hasLocalChange) };
}

// ---------- library ----------
function renderLibrary() {
  const sources = [['all', 'All'], ['studio', 'Studio'], ['game', 'In game']];
  $('#library-source').replaceChildren(...sources.map(([id, label]) => h('button', { type: 'button', 'aria-pressed': String(state.source === id), onclick: () => { state.source = id; saveUi(); renderLibrary(); } }, label)));
  const counts = Object.fromEntries(CATEGORIES.map(c => [c.id, filterCatalog(catalog.all, { category: c.id, source: state.source }).length]));
  const chips = [{ id: 'all', label: 'All' }, ...CATEGORIES].map(c => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.category === c.id), onclick: () => { state.category = c.id; saveUi(); renderLibrary(); } },
    c.label, c.id === 'all' ? null : h('span', { class: 'count' }, counts[c.id])));
  $('#library-categories').replaceChildren(...chips);
  const items = filterCatalog(catalog.all, { category: state.category, source: state.source, query: state.query });
  const list = $('#library-list');
  if (!items.length) { list.replaceChildren(h('li', { class: 'empty' }, 'No assets match this filter.')); return; }
  const groups = [['studio', 'Studio assets'], ['game', 'Current game sprites']];
  list.replaceChildren(...groups.flatMap(([source, label]) => {
    const group = items.filter(item => item.source === source);
    if (!group.length) return [];
    return [h('li', { class: 'library-group' }, label), ...group.map(item => h('li', {}, libraryItem(item)))];
  }));
}
function libraryItem(item) {
  const thumb = h('span', { class: 'thumb' });
  if (item.source === 'game') { if (item.sprite) thumb.append(h('img', { src: item.sprite, alt: '' })); }
  else if (glReady) {
    try {
      const sprite = spriteFor(item, preferredVariant(item), 1), c = h('canvas', { width: 84, height: 84 });
      const ctx = c.getContext('2d'), k = Math.min(78 / sprite.width, 78 / sprite.height);
      ctx.drawImage(sprite.canvas, (84 - sprite.width * k) / 2, (84 - sprite.height * k) / 2, sprite.width * k, sprite.height * k);
      thumb.append(c);
    } catch { /* thumbnail is optional */ }
  }
  const status = item.source === 'game' ? h('span', { class: 'pill game' }, 'In game') : (() => {
    const s = assetStatus(item); return h('span', { class: 'review-line' }, pill(s.status), s.local ? h('span', { class: 'pill local', title: 'Changed in this browser, not committed' }, 'local') : null);
  })();
  return h('button', { type: 'button', class: 'library-item', 'aria-current': String(state.selected === item.id && state.view === 'assets'), onclick: () => select(item.id) },
    thumb, h('span', { class: 'label' }, h('span', { class: 'name' }, item.name), h('span', { class: 'meta' }, `${item.id} · ${item.footprint.width}×${item.footprint.height}`)), status);
}
function select(id) {
  state.view = 'assets'; state.selected = id;
  if (location.hash !== `#${assetHash(id)}`) history.replaceState(null, '', `#${assetHash(id)}`);
  renderAll();
  $('#main').focus({ preventScroll: true });
}

// ---------- workspace ----------
function renderAll() {
  $('#nav-assets').setAttribute('aria-current', state.view === 'assets' ? 'page' : 'false');
  $('#nav-style').setAttribute('aria-current', state.view === 'style' ? 'page' : 'false');
  renderLibrary(); renderSummary();
  const main = $('#main');
  stopAnimation();
  if (state.view === 'style') { main.replaceChildren(...styleGuideView()); paintVisible(); return; }
  const asset = findAsset(state.selected);
  if (!asset) { main.replaceChildren(h('p', { class: 'empty' }, 'Select an asset in the library.')); return; }
  main.replaceChildren(...(asset.source === 'game' ? gameAssetView(asset) : studioAssetView(asset)));
  paintVisible();
}

function assetHeader(asset, extra) {
  const category = CATEGORIES.find(c => c.id === asset.category)?.label ?? asset.category;
  return h('div', { class: 'asset-head' },
    h('div', {}, h('span', { class: 'eyebrow' }, `${category} · ${asset.source === 'game' ? 'current game' : 'studio asset'}`), h('h1', {}, asset.name), h('p', {}, asset.description ?? '')),
    extra);
}

function studioAssetView(asset) {
  const status = assetStatus(asset);
  const tabs = [['compare', 'Compare variants'], ['scene', 'Scene & lighting'], ['details', 'Spec & files']];
  const tabBar = h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([id, label]) => h('button', { type: 'button', role: 'tab', id: `tab-${id}`, 'aria-selected': String(state.tab === id), onclick: () => { state.tab = id; saveUi(); renderAll(); } }, label)));
  const body = state.tab === 'scene' ? sceneView(asset) : state.tab === 'details' ? detailsView(asset) : compareView(asset);
  return [assetHeader(asset, h('div', { class: 'review-line' }, pill(status.status), status.local ? h('span', { class: 'pill local' }, 'local changes') : null)), tabBar, ...body];
}

function toolbar(controls) { return h('div', { class: 'toolbar', role: 'toolbar', 'aria-label': 'View options' }, controls); }
function segmented(label, options, value, onChange, className = '') {
  return h('div', { class: 'tool' }, h('span', {}, label), h('div', { class: `segmented ${className}`, role: 'group', 'aria-label': label },
    options.map(([id, text]) => h('button', { type: 'button', 'aria-pressed': String(value === id), 'data-value': id, onclick: () => onChange(id) }, text))));
}
function checkbox(label, key, id) {
  return h('label', { class: 'check', for: id }, h('input', { type: 'checkbox', id, checked: state[key], onchange: event => { state[key] = event.target.checked; saveUi(); paintVisible(); } }), label);
}
function zoomControl(key, id, min, max, step) {
  const output = h('output', { for: id }, `${state[key]}×`);
  return h('label', { class: 'tool', for: id }, 'Zoom', h('input', { type: 'range', id, min, max, step, value: state[key], oninput: event => { state[key] = Number(event.target.value); output.textContent = `${state[key]}×`; saveUi(); paintVisible(); } }), output);
}
const timeOptions = TIMES.map(t => [t, style.timeOfDay[t].label]);
const setTime = time => { state.time = time; saveUi(); renderAll(); };

function compareView(asset) {
  const controls = toolbar([
    zoomControl('zoom', 'compare-zoom', 0.5, 4, 0.25),
    segmented('Background', BACKGROUNDS.map(b => [b.id, b.label]), state.background, id => { state.background = id; saveUi(); renderAll(); }),
    segmented('Time', timeOptions, state.time, setTime),
    h('div', { class: 'tool' }, checkbox('Tile grid', 'grid', 'show-grid'), checkbox('Footprint', 'footprint', 'show-footprint'), checkbox('Bounds', 'bounds', 'show-bounds'), checkbox('Human', 'human', 'show-human'), checkbox('Game pixels', 'gamePixels', 'show-pixels')),
  ]);
  if (!glReady) return [controls, h('p', { class: 'empty' }, 'WebGL is unavailable in this browser, so 3D recipes cannot be rendered.')];
  return [controls, h('section', { class: 'variants', 'aria-label': 'Variants' }, asset.variants.map(variant => variantCard(asset, variant)))];
}

function variantCard(asset, variant) {
  const review = reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant });
  const base = spriteFor(asset, variant, 1), height = heightInPixels(base.modelHeight);
  const canvas = h('canvas', { class: 'variant-canvas', 'data-variant': variant.id, role: 'img', 'aria-label': `${variant.name} rendered at ${state.zoom}× on ${state.background}` });
  canvas._paint = () => paintVariant(canvas, asset, variant);
  const statusButtons = h('div', { class: 'segmented status', role: 'group', 'aria-label': `Status of ${variant.name}` },
    STATUSES.map(status => h('button', { type: 'button', 'data-status': status, 'aria-pressed': String(review.effective.status === status), onclick: () => changeReview(asset, variant, { status }) }, STATUS_LABELS[status])));
  const note = h('textarea', { id: `note-${variant.id}`, placeholder: 'Review note (optional)', 'aria-label': `Note for ${variant.name}`, onchange: event => changeReview(asset, variant, { note: event.target.value }) });
  note.value = review.effective.note ?? '';
  const repoLabel = review.committed ? `Repository: ${STATUS_LABELS[review.repoStatus]} v${review.committed.version}` : 'Repository: not reviewed';
  return h('article', { class: `variant-card${review.preferred ? ' preferred' : ''}`, 'data-variant': variant.id },
    h('header', {}, h('div', {}, h('h3', {}, variant.name), h('span', { class: 'sub' }, `${variant.id} · v${variant.version} · #${variant.hash}`)), pill(review.effective.status)),
    canvas,
    h('dl', { class: 'facts' },
      h('dt', {}, 'Sprite'), h('dd', {}, `${base.width} × ${base.height} px at 1×`),
      h('dt', {}, 'Footprint'), h('dd', {}, `${asset.footprint.width} × ${asset.footprint.height} tiles (${asset.footprint.width * 64} px wide)`),
      h('dt', {}, 'Height'), h('dd', {}, `${base.modelHeight.toFixed(2)} units · ${Math.round(height)} px above ground`),
      h('dt', {}, 'Anchor'), h('dd', {}, `${base.anchor.x}, ${base.anchor.y} px (origin ${(base.anchor.x / base.width).toFixed(3)}, ${(base.anchor.y / base.height).toFixed(3)})`),
      h('dt', {}, 'Lights'), h('dd', {}, base.lights.length ? base.lights.map(l => l.type).join(', ') : 'none')),
    variant.notes ? h('p', { class: 'variant-notes' }, variant.notes) : null,
    h('div', { class: 'review' },
      h('div', { class: 'review-line' }, h('span', {}, repoLabel), review.pending ? h('span', { class: 'pill local', title: 'Stored in this browser only' }, `Local: ${STATUS_LABELS[review.pending.status]}`) : null, review.outdated ? h('span', { class: 'pill outdated', title: 'The spec changed after this review' }, 'Outdated') : null),
      h('div', { class: 'review-row' }, statusButtons, h('button', { type: 'button', class: 'star', 'aria-pressed': String(review.preferred), onclick: () => changeReview(asset, variant, { preferred: !review.preferred }) }, review.preferred ? '★ Preferred' : '☆ Prefer')),
      note,
      h('div', { class: 'card-actions' },
        h('button', { type: 'button', class: 'button', onclick: () => exportPng(asset, variant) }, 'Download PNG'),
        h('button', { type: 'button', class: 'button ghost', onclick: () => exportMeta(asset, variant) }, 'Download metadata'))));
}

function paintVariant(canvas, asset, variant, seconds = performance.now() / 1000) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'), zoom = state.zoom * dpr;
  const renderScale = state.gamePixels ? 1 : Math.min(4, Math.max(1, Math.ceil(zoom)));
  const sprite = spriteFor(asset, variant, renderScale), base = spriteFor(asset, variant, 1), display = zoom / renderScale;
  const humanSpace = state.human ? 30 * zoom : 0;
  const origin = { x: Math.round((width - humanSpace - sprite.width * display) / 2 + sprite.anchor.x * display), y: Math.round(Math.max(sprite.anchor.y * display + 18 * dpr, (height - sprite.height * display) / 2 + sprite.anchor.y * display)) };
  const view = { width, height, origin, zoom, footprint: asset.footprint, dark: state.background === 'dark' };
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, state.background, view);
  if (state.grid) drawGrid(ctx, view);
  if (state.footprint) drawFootprint(ctx, view);
  drawSprite(ctx, sprite, origin.x, origin.y, display, !state.gamePixels);
  if (state.human) {
    const p = projectPoint([asset.footprint.width / 2 + 0.45, 0, -0.2], zoom);
    drawHuman(ctx, origin.x + p.x, origin.y + p.y, zoom, style, state.background === 'dark' ? '#d8dcd4' : '#262b28');
  }
  const preset = timePreset(style, state.time);
  const lights = sprite.lights.map((l, i) => ({ ...l, x: origin.x + (l.x - sprite.anchor.x) * display, y: origin.y + (l.y - sprite.anchor.y) * display, radius: l.radius * display, seed: i + 1 }));
  applyTimeOfDay(ctx, { width, height, preset, lights, seconds, animate: !reducedMotion });
  drawFlames(ctx, { lights, zoom, seconds, animate: !reducedMotion, style });
  if (state.bounds) drawBounds(ctx, { x: origin.x - sprite.anchor.x * display, y: origin.y - sprite.anchor.y * display, width: sprite.width * display, height: sprite.height * display, label: `${base.width}×${base.height} px`, dark: state.background === 'dark' || state.time === 'night' });
}

function sceneView(asset) {
  const canvas = h('canvas', { class: 'scene-canvas', id: 'scene-canvas', role: 'img', 'aria-label': `Test map with ${asset.name} at ${state.time}` });
  canvas._paint = seconds => paintScene(canvas, asset, seconds);
  const controls = toolbar([
    zoomControl('sceneZoom', 'scene-zoom', 0.5, 2, 0.25),
    segmented('Time', timeOptions, state.time, setTime),
    segmented('Ground', [['grass', 'Grass'], ['dirt', 'Dirt']], state.background === 'dirt' ? 'dirt' : 'grass', id => { state.background = id; saveUi(); renderAll(); }),
  ]);
  return [controls, h('div', { class: 'scene-wrap' }, canvas, h('div', { class: 'scene-legend' },
    h('span', {}, 'Every variant of this asset in a row on 64 × 32 px tiles.'),
    h('span', {}, `Torch posts and ${style.scale.humanHeight}-unit human figures show scale and night lighting.`),
    h('span', {}, 'Sprites keep daylight shading; dusk and night come from one light map.')))];
}

// Ground recipes cover the whole test map: grass variants side by side in
// bands, or one band per path variant with a path that wears in and grows over.
function surfaceGround(asset, size) {
  const sprites = asset.variants.map(v => spriteFor(asset, v, 2)), band = Math.ceil(size / sprites.length);
  const pick = n => Math.min(sprites.length - 1, Math.floor(n / band));
  if (asset.variants[0].spec.mode === 'grass') {
    return { groundTile: (gx, gy) => { const i = pick(gx); return sprites[i].tiles[previewFrame(asset.variants[i].spec, { width: size, height: size }, gx, gy).frame]; } };
  }
  const level = (gx, gy) => {
    const i = pick(gy), ramp = [0, ...(asset.variants[i].spec.preview ?? [1, 2, 3, 3, 2, 1]), 0];
    return gy === i * band + Math.floor(band / 2) ? ramp[gx % ramp.length] : 0;
  };
  return {
    groundTile: (gx, gy) => sprites[pick(gy)].tiles[level(gx, gy)],
    afterGround: (centre, ctx, zoom) => {
      for (let gy = 0; gy < size; gy++) for (let gx = 0; gx < size; gx++) {
        const here = level(gx, gy); if (!here) continue;
        const stages = resolveStages(asset.variants[pick(gy)].spec, style);
        for (const dx of [-1, 1]) {
          const other = gx + dx >= 0 && gx + dx < size ? level(gx + dx, gy) : 0;
          if (other) drawConnection(ctx, centre(gx, gy), [dx, 0], { ...stages[here - 1], width: Math.min(stages[here - 1].width, stages[other - 1].width) }, zoom);
        }
      }
    },
  };
}
function sceneItems(asset) {
  const items = [];
  if (generators[asset.generator].kind === 'surface') {
    const torch = catalog.studio.find(a => a.id === 'torch-post');
    if (torch) for (const [gx, gy] of [[2, 1], [8, 6], [4, 9]]) items.push({ sprite: spriteFor(torch, preferredVariant(torch), 2), footprint: torch.footprint, gx, gy });
    for (let i = 0; i < 4; i++) items.push({ human: true, style, footprint: { width: 1, height: 1 }, gx: 1 + i * 3, gy: 4 + (i % 2) * 3 });
    return { items, size: 12, ground: surfaceGround(asset, 12) };
  }
  let gx = 1;
  const main = asset.variants.map(variant => ({ asset, variant }));
  const torch = catalog.studio.find(a => a.id === 'torch-post');
  const context = asset.id === 'torch-post' ? catalog.studio.filter(a => a.id !== 'torch-post').map(a => ({ asset: a, variant: preferredVariant(a) })) : [];
  for (const entry of [...main, ...context]) {
    items.push({ sprite: spriteFor(entry.asset, entry.variant, 2), footprint: entry.asset.footprint, gx, gy: 3, label: entry.variant.name });
    gx += entry.asset.footprint.width + 1;
  }
  if (torch && asset.id !== 'torch-post') {
    const variant = preferredVariant(torch);
    for (let i = 0; i < main.length; i++) items.push({ sprite: spriteFor(torch, variant, 2), footprint: torch.footprint, gx: 1 + i * (asset.footprint.width + 1) + asset.footprint.width, gy: 3 + asset.footprint.height + 1 });
  }
  for (let i = 0; i < 3; i++) items.push({ human: true, style, footprint: { width: 1, height: 1 }, gx: 2 + i * 3, gy: 3 + asset.footprint.height + 2 });
  return { items, size: Math.max(10, gx + 1) };
}

function paintScene(canvas, asset, seconds = performance.now() / 1000) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
  if (!width || !height || !glReady) return;
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'), zoom = state.sceneZoom * dpr;
  const { items, size, ground } = sceneItems(asset);
  const origin = { x: width / 2, y: height / 2 - size * 16 * zoom + 60 * zoom };
  const placed = drawTestMap(ctx, { width, height, items, zoom, origin, background: state.background === 'dirt' ? 'dirt' : 'grass', size, ...ground });
  const lights = placed.filter(p => p.sprite).flatMap((p, index) => p.sprite.lights.map((l, i) => {
    const display = zoom / p.sprite.scale;
    return { ...l, x: p.x + (l.x - p.sprite.anchor.x) * display, y: p.y + (l.y - p.sprite.anchor.y) * display, radius: l.radius * display, seed: index * 3 + i + 1 };
  }));
  applyTimeOfDay(ctx, { width, height, preset: timePreset(style, state.time), lights, seconds, animate: !reducedMotion });
  drawFlames(ctx, { lights, zoom, seconds, animate: !reducedMotion, style });
  lastSceneLights = lights.map(l => ({ x: l.x, y: l.y, radius: l.radius }));
}
let lastSceneLights = [];

function detailsView(asset) {
  const generator = generators[asset.generator];
  const rows = (pairs) => h('div', { class: 'table-scroll' }, h('table', { class: 'meta-table' }, h('tbody', {}, pairs.map(([k, v]) => h('tr', {}, h('th', { scope: 'row' }, k), h('td', {}, v))))));
  const variantPanels = asset.variants.map(variant => {
    const review = reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant });
    const committed = data.exportedSprites[variant.paths.sprite];
    const meta = data.exportedMeta[variant.paths.spriteMeta];
    const spriteInfo = committed
      ? h('div', { class: 'repo-sprite' }, h('img', { src: committed, alt: `Committed sprite of ${variant.name}` }), h('div', {}, repoLink(variant.paths.sprite), h('br'), meta?.specHash === variant.hash ? 'Matches the current spec.' : h('strong', { style: 'color: var(--danger)' }, 'Spec changed since this export; export again.')))
      : h('p', { class: 'empty' }, `Not exported to the repository yet. Expected at ${variant.paths.sprite}.`);
    return h('section', { class: 'panel' }, h('h2', {}, variant.name), rows([
      ['ID', h('span', { class: 'mono' }, variant.id)], ['Version', `v${variant.version}`], ['Spec hash', h('span', { class: 'mono' }, variant.hash)],
      ['Status', h('span', { class: 'review-line' }, pill(review.effective.status), review.pending ? h('span', { class: 'pill local' }, 'local, not committed') : h('span', {}, 'from repository'), review.outdated ? h('span', { class: 'pill outdated' }, 'Outdated') : null)],
      ['Approved at', review.effective.approvedAt ?? '—'], ['Sprite file', spriteInfo],
    ]), h('pre', { class: 'json' }, JSON.stringify(variant.spec, null, 2)));
  });
  return [h('div', { class: 'details-grid' },
    h('section', { class: 'panel' }, h('h2', {}, 'Asset'), rows([
      ['ID', h('span', { class: 'mono' }, asset.id)], ['Name', asset.name], ['Category', asset.category],
      ['Footprint', `${asset.footprint.width} × ${asset.footprint.height} tiles`], ['Generator', `${generator.label} v${generator.version}`],
      ['Style guide', `${style.name} v${style.version}`], ['Replaces in game', asset.gameObjectId ? h('span', { class: 'mono' }, asset.gameObjectId) : '—'],
      ['Spec file', repoLink(asset.paths.spec)], ['Recipe source', repoLink(asset.paths.generator)], ['Review manifest', repoLink('art/approvals.json')],
    ])),
    h('section', { class: 'panel' }, h('h2', {}, 'Recipe parameters'), rows(generator.params.map(p => [h('span', { class: 'mono' }, p.key), `${p.description}${p.values ? ` (${p.values.join(' | ')})` : ''}${p.unit ? ` [${p.unit}]` : ''}`])))),
  h('div', { class: 'details-grid' }, variantPanels)];
}

function gameAssetView(asset) {
  const previews = ['bg-checker', 'bg-grass', 'bg-dark'].map((bg, i) => h('figure', {}, h('div', { class: `backdrop ${bg}` }, asset.sprite ? h('img', { src: asset.sprite, alt: `${asset.name} on ${['checker', 'grass', 'dark'][i]}` }) : h('span', { class: 'empty' }, 'No image')),
    h('figcaption', {}, ['Checker', 'Grass', 'Dark'][i])));
  return [assetHeader(asset, h('span', { class: 'pill game' }, 'In game · read only')),
    h('section', { class: 'game-previews', 'aria-label': 'Backgrounds' }, previews),
    h('section', { class: 'panel' }, h('h2', {}, 'Game definition'), h('table', { class: 'meta-table' }, h('tbody', {},
      [['Object id', asset.gameObjectId], ['Category', asset.category], ['Footprint', `${asset.footprint.width} × ${asset.footprint.height} tiles`],
        ['Image', asset.spritePath], ['In-game drawing', asset.renderMode === 'procedural' ? 'Drawn procedurally by the game; the image is the library preview.' : 'Uses this image.'],
        ['Visual height', asset.visualHeight ? `${asset.visualHeight} px` : '—']].map(([k, v]) => h('tr', {}, h('th', { scope: 'row' }, k), h('td', {}, v ?? '—'))))),
    h('p', { class: 'feedback' }, 'Current game art is listed for comparison only. Create a studio asset to replace it.'))];
}

// ---------- style guide ----------
function styleGuideView() {
  const palette = Object.entries(style.palette).map(([name, hex]) => h('div', { class: 'swatch' }, h('span', { style: `background:${hex}` }), h('p', {}, name, h('br'), h('code', {}, hex))));
  const materials = Object.entries(style.materials).map(([id, m]) => {
    const c = h('canvas', { width: 128, height: 128, 'aria-hidden': 'true' });
    if (glReady) {
      try {
        const sprite = renderModel({ primitives: [{ shape: 'box', size: [0.9, 0.9, 0.9], at: [0, 0, 0], material: id }], lights: [], height: 0.9 }, { style, footprint: { width: 1, height: 1 }, scale: 1.4 });
        const ctx = c.getContext('2d'), k = Math.min(120 / sprite.width, 120 / sprite.height);
        ctx.drawImage(sprite.canvas, (128 - sprite.width * k) / 2, (128 - sprite.height * k) / 2, sprite.width * k, sprite.height * k);
      } catch { /* swatch only */ }
    }
    return h('div', { class: 'material' }, c, h('div', {}, h('strong', { class: 'mono' }, id), h('p', {}, m.description)));
  });
  const ruler = h('canvas', { class: 'ruler', role: 'img', 'aria-label': 'Scale ruler: human, door, storey and height ranges in world units and pixels' });
  ruler._paint = () => paintRuler(ruler);
  const p = style.projection;
  return [
    h('div', { class: 'asset-head' }, h('div', {}, h('span', { class: 'eyebrow' }, `Style guide v${style.version} · art/style-guide.json`), h('h1', {}, style.name), h('p', {}, style.summary))),
    h('section', { class: 'panel' }, h('h2', {}, 'Camera and projection'), h('table', { class: 'meta-table' }, h('tbody', {},
      [['Projection', `${p.type}, elevation ${p.elevationDeg}°, azimuth ${p.azimuthDeg}°`], ['Tile', `${p.tileWidth} × ${p.tileHeight} px diamond`], ['Unit', p.unit],
        ['Pixels per unit', `${p.pixelsPerUnit.toFixed(3)} along the ground, ${p.verticalPixelsPerUnit.toFixed(3)} vertically`], ['Axes', p.screenAxes],
        ['Anchor', 'Centre of the footprint on the ground. Phaser origin = anchor ÷ sprite size.']].map(([k, v]) => h('tr', {}, h('th', { scope: 'row' }, k), h('td', {}, v)))))),
    h('section', { class: 'panel' }, h('h2', {}, 'Scale'), ruler),
    h('section', { class: 'panel' }, h('h2', {}, 'Palette'), h('div', { class: 'swatches' }, palette)),
    h('section', { class: 'panel' }, h('h2', {}, 'Materials'), h('div', { class: 'materials' }, materials)),
    h('section', { class: 'panel' }, h('h2', {}, 'Light, shadow and detail'), h('ul', { class: 'rules' },
      h('li', {}, style.light.rule), h('li', {}, style.detail.silhouette), h('li', {}, style.detail.outline), h('li', {}, style.detail.textureScale), h('li', {}, style.detail.colour), h('li', {}, `Smallest readable feature: ${style.detail.minimumFeaturePx} px at 1×.`))),
    style.units ? h('section', { class: 'panel' }, h('h2', {}, 'Figures'), h('ul', { class: 'rules' }, ['rule', 'readability', 'sexes'].map(key => h('li', {}, style.units[key])))) : null,
    style.props ? h('section', { class: 'panel' }, h('h2', {}, 'Props'), h('ul', { class: 'rules' }, h('li', {}, style.props.rule))) : null,
    style.terrain ? h('section', { class: 'panel' }, h('h2', {}, 'Terrain'), h('ul', { class: 'rules' }, ['rule', 'grass', 'paths', 'overgrowth'].map(key => h('li', {}, style.terrain[key])))) : null,
    h('section', { class: 'panel' }, h('h2', {}, 'Time of day'), h('p', { class: 'feedback' }, style.lightingModel), h('div', { class: 'times' },
      TIMES.map(t => h('div', { class: 'time' }, h('span', { style: `background:${style.timeOfDay[t].ambient}` }), h('p', {}, h('strong', {}, style.timeOfDay[t].label), ` · light ×${style.timeOfDay[t].lightScale}`, h('br'), style.timeOfDay[t].description))))),
    h('section', { class: 'panel' }, h('h2', {}, 'Light sources'), h('ul', { class: 'rules' }, Object.entries(style.lightSources).map(([id, l]) => h('li', {}, h('strong', { class: 'mono' }, id), ` ${l.color}, radius ${l.radiusTiles} tiles, intensity ${l.intensity}, flicker ±${l.flicker.amplitude * 100}% at ${l.flicker.speed} Hz-ish`)))),
    h('section', { class: 'panel' }, h('h2', {}, 'Animation'), h('ul', { class: 'rules' }, h('li', {}, `${style.animation.fps} frames per second.`), style.animation.rules.map(rule => h('li', {}, rule)))),
  ];
}

function paintRuler(canvas) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
  if (!width || !height) return;
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d'), z = Math.min(1.6, (height - 40 * dpr) / heightInPixels(5)) , ground = height - 22 * dpr;
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1d2320';
  const muted = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#59625c';
  ctx.strokeStyle = muted; ctx.fillStyle = muted; ctx.font = `${11 * dpr}px ui-monospace, monospace`;
  ctx.beginPath(); ctx.moveTo(10 * dpr, ground); ctx.lineTo(width - 10 * dpr, ground); ctx.stroke();
  for (let u = 0; u <= 5; u++) {
    const y = ground - heightInPixels(u, z);
    ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.moveTo(40 * dpr, y); ctx.lineTo(width - 10 * dpr, y); ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillText(`${u} u · ${Math.round(heightInPixels(u))} px`, 6 * dpr, y - 3 * dpr);
  }
  const bars = [['human', style.scale.humanHeight], ['door', style.scale.doorHeight], ['storey', style.scale.storeyHeight], ...Object.entries(style.scale.ranges).map(([k, r]) => [k, r[1], r[0]])];
  const step = (width - 150 * dpr) / bars.length;
  bars.forEach(([label, top, bottom], i) => {
    const x = 140 * dpr + i * step, y1 = ground - heightInPixels(top, z), y0 = bottom ? ground - heightInPixels(bottom, z) : ground;
    ctx.fillStyle = label === 'human' ? ink : muted; ctx.globalAlpha = bottom ? 0.35 : 0.8;
    ctx.fillRect(x, y1, step * 0.5, (bottom ? y0 : ground) - y1);
    if (bottom) { ctx.globalAlpha = 0.8; ctx.fillRect(x, y0, step * 0.5, ground - y0); }
    ctx.globalAlpha = 1; ctx.fillStyle = ink; ctx.fillText(label, x, ground + 14 * dpr);
  });
}

// ---------- review ----------
function changeReview(asset, variant, change) {
  state.local = updateLocal(state.local, { assetId: asset.id, variant, ...change });
  if (change.status === 'approved' && !reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }).preferred && !asset.variants.some(v => v.id !== variant.id && reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant: v }).preferred)) {
    state.local = updateLocal(state.local, { assetId: asset.id, variant, preferred: true });
  }
  if (!writeLocal(storage, state.local)) showAlert('This browser blocks local storage, so review changes last only until the page is closed. Export them before leaving.');
  renderAll();
}
function renderSummary() {
  const changes = pendingChanges({ repo: data.approvals, local: state.local, catalog: catalog.studio });
  $('#review-summary').replaceChildren(changes.length ? h('span', {}, h('strong', {}, `${changes.length} local change${changes.length === 1 ? '' : 's'}`), ' not in the repository') : 'Review matches the repository');
}
function exportManifest() { return buildExportManifest({ repo: data.approvals, local: state.local, catalog: catalog.studio }); }
function openExport() {
  const changes = pendingChanges({ repo: data.approvals, local: state.local, catalog: catalog.studio });
  $('#export-changes').replaceChildren(...(changes.length ? changes.map(c => h('li', {}, c.preferred ? `${c.variantId}: preferred variant of ${c.assetId}` : `${c.variantId}: ${STATUS_LABELS[c.from]} → ${STATUS_LABELS[c.to]}`)) : [h('li', {}, 'No local changes. The file below equals the committed manifest.')]));
  $('#export-json').value = `${JSON.stringify(exportManifest(), null, 2)}\n`;
  $('#export-feedback').textContent = ''; $('#discard-hint').textContent = ''; discardArmed = false;
  $('#export-github').href = `${REPOSITORY}/edit/main/art/approvals.json`;
  $('#export-dialog').showModal();
}
let discardArmed = false;
function bindExport() {
  $('#open-export').addEventListener('click', openExport);
  $('#export-copy').addEventListener('click', async () => {
    const text = $('#export-json').value;
    try { await navigator.clipboard.writeText(text); $('#export-feedback').textContent = 'Copied to the clipboard.'; }
    catch { $('#export-json').select(); $('#export-feedback').textContent = 'Copy is blocked here. The text is selected; press Ctrl+C or ⌘C.'; }
  });
  $('#export-download').addEventListener('click', () => { download('approvals.json', new Blob([$('#export-json').value], { type: 'application/json' })); $('#export-feedback').textContent = 'Download started. If nothing happens, use Copy JSON.'; });
  $('#discard-local').addEventListener('click', () => {
    if (!discardArmed) { discardArmed = true; $('#discard-hint').textContent = 'Click again to discard every local review decision. The repository is not affected.'; return; }
    state.local = discardLocal(state.local); writeLocal(storage, state.local); discardArmed = false;
    $('#export-dialog').close(); renderAll();
  });
}

// ---------- export of sprites ----------
function exportSprite(assetId, variantId) {
  const asset = findAsset(assetId), variant = asset?.variants?.find(v => v.id === variantId);
  if (!variant) throw new RangeError(`Unknown variant ${assetId}/${variantId}`);
  const sprite = spriteFor(asset, variant, 1);
  const meta = spriteMetadata({ asset, variant, style, sprite, generator: generators[asset.generator] });
  return { png: sprite.canvas.toDataURL('image/png'), front: sprite.front?.toDataURL('image/png') ?? null, sheet: sprite.sheet?.toDataURL('image/png') ?? null, meta, paths: variant.paths };
}
function exportPng(asset, variant) {
  const { png, paths } = exportSprite(asset.id, variant.id);
  fetch(png).then(r => r.blob()).then(blob => download(paths.sprite.split('/').pop(), blob));
}
function exportMeta(asset, variant) {
  const { meta, paths } = exportSprite(asset.id, variant.id);
  download(paths.spriteMeta.split('/').pop(), new Blob([`${JSON.stringify(meta, null, 2)}\n`], { type: 'application/json' }));
}

// ---------- painting & animation ----------
function paintVisible(seconds) {
  for (const canvas of document.querySelectorAll('#main canvas')) canvas._paint?.(seconds);
  if (!reducedMotion && state.time !== 'day' && state.view === 'assets') startAnimation();
}
let frame = null, last = 0;
function startAnimation() {
  if (frame) return;
  const tick = now => {
    frame = requestAnimationFrame(tick);
    if (now - last < 50) return; // ~20 fps is enough for flames
    last = now;
    for (const canvas of document.querySelectorAll('#main canvas')) canvas._paint?.(now / 1000);
  };
  frame = requestAnimationFrame(tick);
}
function stopAnimation() { if (frame) cancelAnimationFrame(frame); frame = null; }
function showAlert(message) { const alert = $('#studio-alert'); alert.textContent = message; alert.hidden = !message; }

// ---------- routing & boot ----------
function route() {
  const hash = location.hash.slice(1);
  if (hash === 'style-guide') state.view = 'style';
  else {
    state.view = 'assets';
    const match = catalog.all.find(item => assetHash(item.id) === hash);
    if (match) state.selected = match.id;
  }
  renderAll();
}
$('#library-search').addEventListener('input', event => { state.query = event.target.value; renderLibrary(); });
window.addEventListener('hashchange', route);
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => paintVisible(), 120); });
bindExport();
if (!glReady) showAlert('WebGL is not available, so studio recipes cannot be rendered. Current game sprites are still listed.');
route();

// Automation hook used by scripts/studio-smoke.mjs and scripts/studio-export.mjs.
window.assetStudio = Object.freeze({
  ready: true,
  assets: () => catalog.studio.map(a => ({ id: a.id, category: a.category, variants: a.variants.map(v => ({ id: v.id, version: v.version, hash: v.hash, paths: v.paths })) })),
  gameAssets: () => catalog.game.map(a => a.id),
  exportSprite,
  exportManifest,
  local: () => structuredClone(state.local),
  sceneLights: () => structuredClone(lastSceneLights),
});
