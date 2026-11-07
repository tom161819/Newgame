import './styles.css';
import { trackTopbarHeight } from './lib/topbarHeight.js';
import { UI_PRESETS } from '../../art/ui/presets.js';
import { loadStudioData } from './data.js';
import { buildCatalog, filterCatalog, CATEGORIES } from './lib/specs.js';
import { STATUS_LABELS, readLocal, writeLocal, reviewState, reviewSummary, updateLocal, discardLocal, buildExportManifest, pendingChanges, gameArtSources, inGame } from './lib/approvals.js';
import { REVIEWS, PREFERRED, layerFromDocs, docWrites, reviewerIds } from './lib/sharedReview.js';
import { withApprovedArt, APPROVED_VILLAGER_ART } from '../../src/data/objects/approvedArt.js';
import { TIMES, timePreset } from './lib/lighting.js';
import { heightInPixels, projectPoint } from './lib/projection.js';
import { renderModel, spriteMetadata, rendererAvailable } from './render/spriteRenderer.js';
import { drawConnection, previewFrame, resolveStages } from './generators/ground.js';
import { seasonBlend } from './lib/surface.js';
import { BACKGROUNDS, drawBackground, drawGrid, drawFootprint, drawHuman, drawBounds, drawSprite, applyTimeOfDay, drawFlames, drawTestMap } from './render/compositor.js';

const UI_KEY = 'asset-studio.ui.v1';
const data = loadStudioData();
const { style, generators } = data;
const catalog = buildCatalog(data);
const storage = (() => { try { return window.localStorage; } catch { return null; } })();
const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const glReady = rendererAvailable();

const state = {
  view: 'assets', source: 'all', category: 'all', query: '', review: 'all',
  selected: catalog.studio[0]?.id ?? catalog.game[0]?.id, tab: 'compare',
  zoom: 1.5, background: 'grass', grid: true, footprint: true, bounds: true, human: true, gamePixels: false, time: 'day', sceneZoom: 1.25,
  local: readLocal(storage),
};
// Shared review: in the Studio page published in Claude, decisions live in the page's database for every reviewer.
// Elsewhere (npm run studio, tests) the Studio keeps the local-only review in this browser, as before.
const shared = { mode: 'local', db: null, user: null, uid: null, canWrite: null, names: new Map(), downloads: null, writes: Promise.resolve() };
const sharedMode = () => shared.mode === 'shared';
try { Object.assign(state, pickUi(JSON.parse(storage?.getItem(UI_KEY) ?? '{}'))); } catch { /* keep defaults */ }
function pickUi(saved) {
  const out = {};
  for (const key of ['source', 'category', 'tab', 'background', 'time']) if (typeof saved[key] === 'string') out[key] = saved[key];
  if (['all', 'pending'].includes(saved.review)) out.review = saved.review;
  for (const key of ['zoom', 'sceneZoom']) if (Number.isFinite(saved[key])) out[key] = saved[key];
  for (const key of ['grid', 'footprint', 'bounds', 'human', 'gamePixels']) if (typeof saved[key] === 'boolean') out[key] = saved[key];
  return out;
}
function saveUi() {
  try { storage?.setItem(UI_KEY, JSON.stringify(Object.fromEntries(['source', 'review', 'category', 'tab', 'background', 'time', 'zoom', 'sceneZoom', 'grid', 'footprint', 'bounds', 'human', 'gamePixels'].map(k => [k, state[k]])))); } catch { /* optional */ }
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
// Repository paths are shown as text: the Studio has no repository host to link to.
const repoLink = (path, label = path) => h('code', { class: 'mono', title: 'Path in the game repository' }, label);
const reviewerName = id => (id && shared.names.get(id)) || (id && id === shared.uid ? 'you' : id ? 'a reviewer' : '');
const assetHash = id => id.replace(':', '-');
const findAsset = id => catalog.all.find(item => item.id === id);
const pill = (status, label = STATUS_LABELS[status] ?? status) => h('span', { class: `pill ${status}` }, label);

function download(name, blob) {
  // A page in Claude cannot start downloads itself: it offers the file and the viewer confirms the save.
  if (shared.downloads) {
    shared.downloads.save({ filename: name, data: blob }).catch(error => { if (error?.code !== 'declined') showAlert(`${name} could not be saved here (${error?.code ?? 'unavailable'}).`); });
    return;
  }
  const url = URL.createObjectURL(blob), link = h('a', { href: url, download: name });
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- sprite rendering ----------
const spriteCache = new Map();
// Blender pilot (#149): variants with `baked` are pre-rendered (scripts/blender-bake.mjs). The Studio shows the
// committed PNG (2× file for scales ≥ 2) with its sidecar anchor, so cards, scenes and the time-of-day preview work
// exactly as for live recipes; only the lighting is baked into the image like every exported sprite.
const bakedImages = new Map();
const bakedSources = variant => {
  const one = variant.paths.sprite, two = one.replace(/\.png$/, '.x2.png');
  return { one: data.exportedSprites[one], two: data.exportedSprites[two], meta: data.exportedMeta[variant.paths.spriteMeta] };
};
function preloadBaked() {
  const urls = catalog.studio.flatMap(asset => asset.variants.filter(v => v.baked)).flatMap(v => { const s = bakedSources(v); return [s.one, s.two].filter(Boolean); });
  return Promise.all(urls.map(url => new Promise(resolve => { const img = new Image(); img.onload = () => { bakedImages.set(url, img); resolve(); }; img.onerror = () => resolve(); img.src = url; })));
}
function bakedSprite(asset, variant, scale) {
  const { one, two, meta } = bakedSources(variant), useTwo = scale >= 2 && two && meta?.x2 && bakedImages.has(two);
  const img = bakedImages.get(useTwo ? two : one), from = useTwo ? 2 : 1, k = scale / from;
  const anchor0 = useTwo ? meta.x2.anchor : meta?.anchor ?? { x: 0, y: 0 };
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round((img?.naturalWidth ?? 1) * k)); canvas.height = Math.max(1, Math.round((img?.naturalHeight ?? 1) * k));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  if (img) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return { canvas, front: null, still: null, rotor: null, width: canvas.width, height: canvas.height, anchor: { x: Math.round(anchor0.x * k), y: Math.round(anchor0.y * k) }, platform: null, lights: [], scale, footprint: asset.footprint, modelHeight: meta?.modelHeight ?? 1, baked: { renderer: variant.baked.renderer, missing: !img, outdated: meta?.specHash !== variant.hash, render: meta?.render ?? null } };
}
function spriteFor(asset, variant, scale = 1) {
  const key = `${variant.id}:${variant.hash}:${scale}`;
  if (!spriteCache.has(key)) {
    const generator = generators[asset.generator];
    if (variant.baked) spriteCache.set(key, bakedSprite(asset, variant, scale));
    else if (generator.kind === 'surface' || generator.kind === 'icon') spriteCache.set(key, generator.paint(variant.spec, { footprint: asset.footprint, style, scale }));
    else spriteCache.set(key, renderModel(generator.build(variant.spec, { footprint: asset.footprint, style }), { style, footprint: asset.footprint, scale }));
  }
  return spriteCache.get(key);
}
function preferredVariant(asset) {
  const chosen = asset.variants.find(variant => reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }).preferred);
  return chosen ?? asset.variants[0];
}
// #127 Needs review: the variants of a studio asset that still wait for approval (local edits included).
const review = asset => reviewSummary({ repo: data.approvals, local: state.local, asset });
const pendingMode = () => state.review === 'pending';
// #212 review filters over the same catalog: Waiting for My Review (pending), Revision Requested, Approved, In Game.
let artSources = null;
const sourcesInGame = () => artSources ??= gameArtSources({ definitions: data.gameDefinitions.map(withApprovedArt), villagerArt: APPROVED_VILLAGER_ART });
const variantStates = asset => asset.variants.map(variant => ({ variant, state: reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }) }));
const REVIEW_FILTERS = {
  pending: item => review(item).pending.length > 0,
  revision: item => variantStates(item).some(({ state: s }) => s.revisionRequested),
  approved: item => variantStates(item).some(({ state: s }) => s.effective.status === 'approved' && !s.outdated),
  ingame: item => item.variants.some(variant => inGame(variant.paths, sourcesInGame())),
};
const reviewFilterOn = () => state.review !== 'all' && !!REVIEW_FILTERS[state.review];
const libraryFilter = extra => ({ source: state.source, pendingOnly: reviewFilterOn(), isPending: item => (REVIEW_FILTERS[state.review] ?? REVIEW_FILTERS.pending)(item), ...extra });
function assetStatus(asset) {
  const states = asset.variants.map(variant => reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }));
  const status = states.some(s => s.effective.status === 'approved' && !s.outdated) ? 'approved' : states.some(s => s.effective.status === 'review') ? 'review' : 'draft';
  return { status, local: states.some(s => s.hasLocalChange) };
}

// ---------- library ----------
function renderLibrary() {
  const sources = [['all', 'All'], ['studio', 'Studio'], ['game', 'In game']];
  $('#library-source').replaceChildren(...sources.map(([id, label]) => h('button', { type: 'button', 'aria-pressed': String(state.source === id), onclick: () => { state.source = id; saveUi(); renderLibrary(); } }, label)));
  const count = id => filterCatalog(catalog.all, { pendingOnly: true, isPending: REVIEW_FILTERS[id] }).length;
  const reviewFilters = [['all', 'All', null, ''], ['pending', 'Waiting for my review', count('pending'), 'Designs with a variant you have not decided on for its current version'], ['revision', 'Revision requested', count('revision'), 'Waiting for Claude to deliver a new version'], ['approved', 'Approved', count('approved'), 'An approved variant for the current version'], ['ingame', 'In game', count('ingame'), 'The game uses exactly this exported version']];
  $('#library-review').replaceChildren(...reviewFilters.map(([id, label, n, title]) => h('button', { type: 'button', 'data-review': id, 'aria-pressed': String(state.review === id), title, onclick: () => { state.review = id; saveUi(); renderAll(); } }, label, n === null ? null : h('span', { class: 'count' }, String(n)))));
  const counts = Object.fromEntries(CATEGORIES.map(c => [c.id, filterCatalog(catalog.all, libraryFilter({ category: c.id })).length]));
  const chips = [{ id: 'all', label: 'All' }, ...CATEGORIES].map(c => h('button', { type: 'button', class: 'chip', 'aria-pressed': String(state.category === c.id), onclick: () => { state.category = c.id; saveUi(); renderLibrary(); } },
    c.label, c.id === 'all' ? null : h('span', { class: 'count' }, counts[c.id])));
  $('#library-categories').replaceChildren(...chips);
  const items = filterCatalog(catalog.all, libraryFilter({ category: state.category, query: state.query }));
  const list = $('#library-list'), scrollTop = list.scrollTop;
  if (!items.length) { list.replaceChildren(h('li', { class: 'empty' }, state.review === 'pending' ? 'Nothing here waits for your review: every studio design in this filter is decided for its current version, and current game sprites are hidden.' : reviewFilterOn() ? 'No designs in this review state.' : 'No assets match this filter.')); return; }
  const groups = [['studio', 'Studio assets'], ['game', 'Current game sprites']];
  list.replaceChildren(...groups.flatMap(([source, label]) => {
    const group = items.filter(item => item.source === source);
    if (!group.length) return [];
    return [h('li', { class: 'library-group' }, label), ...group.map(item => h('li', {}, libraryItem(item)))];
  }));
  list.scrollTop = scrollTop;
}
// Scroll the library list (only the list, not the page) so the selected design is visible.
function revealSelected() {
  const list = $('#library-list'), item = list.querySelector('.library-item[aria-current="true"]');
  if (!item) return;
  const top = item.getBoundingClientRect().top - list.getBoundingClientRect().top + list.scrollTop, bottom = top + item.offsetHeight;
  if (top < list.scrollTop) list.scrollTop = top - 8;
  else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight + 8;
}
// Wide layout: after choosing a design, bring the top of the preview into view if the page was scrolled past it.
function revealWorkspace() {
  if (!matchMedia('(min-width: 821px)').matches) return;
  const main = $('#main'), bar = document.querySelector('.topbar')?.getBoundingClientRect().bottom ?? 0;
  if (main.getBoundingClientRect().top < bar) window.scrollTo({ top: window.scrollY + main.getBoundingClientRect().top - bar });
}
function libraryItem(item) {
  const thumb = h('span', { class: 'thumb' });
  if (item.source === 'game') { if (item.sprite) thumb.append(h('img', { src: item.sprite, alt: '' })); }
  else if (glReady) {
    try {
      const sprite = isIconSet(item) ? { canvas: spriteFor(item, preferredVariant(item), 2).icons.at(-1).canvas, width: 80, height: 80 } : spriteFor(item, preferredVariant(item), 1), c = h('canvas', { width: 84, height: 84 });
      const ctx = c.getContext('2d'), k = Math.min(78 / sprite.width, 78 / sprite.height);
      ctx.drawImage(sprite.canvas, (84 - sprite.width * k) / 2, (84 - sprite.height * k) / 2, sprite.width * k, sprite.height * k);
      thumb.append(c);
    } catch { /* thumbnail is optional */ }
  }
  const status = item.source === 'game' ? h('span', { class: 'pill game' }, 'In game') : (() => {
    const s = assetStatus(item), r = review(item), mixed = r.pending.length && r.approved;
    return h('span', { class: 'review-line' }, mixed ? h('span', { class: 'pill review', title: `${r.approved} approved, ${r.pending.length} still waiting` }, `${r.pending.length} of ${r.total} to review`) : pill(s.status), s.local ? h('span', { class: 'pill local', title: 'Changed in this browser, not committed' }, 'local') : null);
  })();
  return h('button', { type: 'button', class: 'library-item', 'aria-current': String(state.selected === item.id && state.view === 'assets'), onclick: () => select(item.id) },
    thumb, h('span', { class: 'label' }, h('span', { class: 'name' }, item.name), h('span', { class: 'meta' }, `${item.id} · ${item.footprint.width}×${item.footprint.height}`)), status);
}
function select(id) {
  state.view = 'assets'; state.selected = id;
  if (location.hash !== `#${assetHash(id)}`) history.replaceState(null, '', `#${assetHash(id)}`);
  renderAll();
  $('#main').focus({ preventScroll: true });
  revealSelected(); revealWorkspace();
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
  const iconSet = isIconSet(asset);
  const tabs = [['compare', 'Compare variants'], ...(iconSet ? [] : [['scene', 'Scene & lighting']]), ...(walks(asset) ? [['walk', 'Walk cycle']] : []), ['details', 'Spec & files']];
  const tabBar = h('div', { class: 'tabs', role: 'tablist' }, tabs.map(([id, label]) => h('button', { type: 'button', role: 'tab', id: `tab-${id}`, 'aria-selected': String(state.tab === id), onclick: () => { state.tab = id; saveUi(); renderAll(); } }, label)));
  const body = state.tab === 'scene' && !iconSet ? sceneView(asset) : state.tab === 'details' ? detailsView(asset) : state.tab === 'walk' && walks(asset) ? walkView(asset) : compareView(asset);
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

const isIconSet = asset => generators[asset.generator]?.kind === 'icon';
function compareView(asset) {
  if (isIconSet(asset)) return [h('p', { class: 'review-note' }, 'Each card shows the set on the panels of the four UI Lab styles: at 22 px (the size of the resource icons in the top bar), at 40 px (1×) and at 2×.'),
    h('section', { class: 'variants', 'aria-label': 'Variants' }, (pendingMode() && review(asset).pending.length ? asset.variants.filter(v => review(asset).pending.includes(v.id)) : asset.variants).map(variant => variantCard(asset, variant)))];
  const controls = toolbar([
    zoomControl('zoom', 'compare-zoom', 0.5, 4, 0.25),
    segmented('Background', BACKGROUNDS.map(b => [b.id, b.label]), state.background, id => { state.background = id; saveUi(); renderAll(); }),
    segmented('Time', timeOptions, state.time, setTime),
    h('div', { class: 'tool' }, checkbox('Tile grid', 'grid', 'show-grid'), checkbox('Footprint', 'footprint', 'show-footprint'), checkbox('Bounds', 'bounds', 'show-bounds'), checkbox('Human', 'human', 'show-human'), checkbox('Game pixels', 'gamePixels', 'show-pixels')),
  ]);
  if (!glReady) return [controls, h('p', { class: 'empty' }, 'WebGL is unavailable in this browser, so 3D recipes cannot be rendered.')];
  // Needs review: only the variants that still wait; the approved ones are a click away.
  const pending = pendingMode() ? review(asset).pending : null, shown = pending?.length ? asset.variants.filter(v => pending.includes(v.id)) : asset.variants;
  const hidden = asset.variants.length - shown.length, note = hidden ? h('p', { class: 'review-note' }, `${hidden} approved variant${hidden === 1 ? '' : 's'} hidden by Needs review. `, h('button', { type: 'button', class: 'link', id: 'show-all-variants', onclick: () => { state.review = 'all'; saveUi(); renderAll(); } }, 'Show all variants')) : null;
  return [controls, ...(note ? [note] : []), h('section', { class: 'variants', 'aria-label': 'Variants' }, shown.map(variant => variantCard(asset, variant)))];
}

// Confirmation under a card after a decision (cards are rebuilt on every render, so it lives outside them).
const savedFlash = new Map();
function variantCard(asset, variant) {
  const review = reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant });
  const chosen = review.preferred && review.effective.status === 'approved' && !review.outdated;
  const setAside = review.effective.status === 'rejected' && review.effective.note === NOT_CHOSEN;
  const othersWaiting = asset.variants.filter(v => v.id !== variant.id && reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant: v }).awaitsOwner).length;
  const base = spriteFor(asset, variant, 1), height = heightInPixels(base.modelHeight);
  const iconSet = isIconSet(asset);
  const canvas = h('canvas', { class: `variant-canvas${iconSet ? ' icon-canvas' : ''}`, 'data-variant': variant.id, role: 'img', 'aria-label': iconSet ? `${variant.name} on the four UI styles at 22 px, 1× and 2×` : `${variant.name} rendered at ${state.zoom}× on ${state.background}` });
  canvas._paint = () => (iconSet ? paintIconSet(canvas, asset, variant) : paintVariant(canvas, asset, variant));
  // #212 decisions on this exact version: Approve, Request revision (needs a comment), Reject; Back to review undoes.
  const comment = h('textarea', { id: `note-${variant.id}`, placeholder: 'Comment for this version (required for Request revision)', 'aria-label': `Comment on ${variant.name} v${variant.version}` });
  const error = h('p', { class: 'review-error', role: 'alert', hidden: true });
  const key = `${asset.id}/${variant.id}`;
  // Request revision with an empty comment only points at the comment box; the hint disappears as soon as there is text.
  const send = h('button', { type: 'button', class: 'button send-rework', disabled: true, onclick: () => decide('revision-requested') }, 'Send for rework');
  comment.addEventListener('input', () => { const empty = !comment.value.trim(); send.disabled = empty || readOnly; if (!empty) error.hidden = true; });
  const decide = status => {
    const text = comment.value.trim();
    if (status === 'revision-requested' && !text) { error.textContent = 'Write what should change, then press Send for rework.'; error.hidden = false; comment.focus(); return; }
    savedFlash.set(key, { status, at: Date.now() });
    changeReview(asset, variant, { status, ...(text ? { comment: text } : {}) });
  };
  const DECISIONS = [['approved', 'Approve'], ['revision-requested', 'Request revision'], ['rejected', 'Reject'], ['review', 'Back to review']];
  const readOnly = sharedMode() && shared.canWrite === false;
  const statusButtons = h('div', { class: 'segmented status decisions', role: 'group', 'aria-label': `Decision on ${variant.name}` },
    DECISIONS.map(([status, label]) => h('button', { type: 'button', 'data-status': status, 'aria-pressed': String(review.effective.status === status && !review.outdated), disabled: readOnly, onclick: () => decide(status) }, label)));
  if (readOnly) comment.disabled = true;
  const flash = savedFlash.get(key), fresh = flash && Date.now() - flash.at < 120000;
  const saved = fresh ? h('p', { class: 'review-saved', role: 'status' }, flash.status === 'revision-requested'
    ? (sharedMode() ? 'Saved: sent for rework. Write „spustit revizi“ in the MK chat and Claude starts on it.' : 'Saved in this browser: sent for rework. Hand the review over to Claude to start on it.')
    : flash.status === 'chosen' ? 'Saved: chosen for the game (approved and ★). The other variants that waited are set aside as not chosen.'
    : `Saved: ${STATUS_LABELS[flash.status] ?? flash.status}.`) : null;
  const note = h('div', { class: 'review-comment' }, comment, h('div', { class: 'review-send' }, send, h('span', { class: 'sub' }, 'Writes the comment and asks for a new version.')), error, saved);
  const record = review.effective, entries = [...(record.history ?? []).map(h2 => ({ kind: 'version', ...h2 })), ...(record.comments ?? []).map(c => ({ kind: 'comment', ...c }))].sort((a, b) => a.version - b.version || String(a.at).localeCompare(String(b.at)));
  const history = entries.length ? h('details', { class: 'review-history' }, h('summary', {}, `History (${entries.length})`), h('ol', {}, entries.map(e => h('li', {}, e.kind === 'version' ? `v${e.version} · ${STATUS_LABELS[e.status] ?? e.status} · #${e.specHash}` : `v${e.version} comment${e.by ? ` by ${reviewerName(e.by)}` : ''}: “${e.text}”`, e.at ? h('time', { datetime: e.at }, ` ${e.at.slice(0, 10)}`) : null)))) : null;
  const live = inGame(variant.paths, sourcesInGame());
  const repoLabel = review.committed ? `Repository: ${STATUS_LABELS[review.repoStatus]} v${review.committed.version}` : 'Repository: not reviewed';
  return h('article', { class: `variant-card${review.preferred ? ' preferred' : ''}`, 'data-variant': variant.id },
    h('header', {}, h('div', {}, h('h3', {}, variant.name), h('span', { class: 'sub' }, `${variant.id} · v${variant.version} · #${variant.hash}`)), h('span', { class: 'pills' }, pill(review.outdated ? 'outdated' : review.effective.status, review.outdated ? 'Outdated' : undefined), live ? h('span', { class: 'pill ingame', title: 'The game uses exactly this exported version' }, 'In game') : null)),
    canvas,
    iconSet ? h('dl', { class: 'facts' },
      h('dt', {}, 'Icons'), h('dd', {}, base.icons.map(i => i.name).join(' · ')),
      h('dt', {}, 'Size'), h('dd', {}, '40 × 40 px at 1×, 80 × 80 at 2×, and SVG (like the resource icons, shown at 22 px in the top bar)')) : h('dl', { class: 'facts' },
      h('dt', {}, 'Sprite'), h('dd', {}, `${base.width} × ${base.height} px at 1×`),
      h('dt', {}, 'Footprint'), h('dd', {}, `${asset.footprint.width} × ${asset.footprint.height} tiles (${asset.footprint.width * 64} px wide)`),
      h('dt', {}, 'Height'), h('dd', {}, `${base.modelHeight.toFixed(2)} units · ${Math.round(height)} px above ground`),
      h('dt', {}, 'Anchor'), h('dd', {}, `${base.anchor.x}, ${base.anchor.y} px (origin ${(base.anchor.x / base.width).toFixed(3)}, ${(base.anchor.y / base.height).toFixed(3)})`),
      h('dt', {}, 'Lights'), h('dd', {}, base.lights.length ? base.lights.map(l => l.type).join(', ') : 'none')),
    variant.notes ? h('p', { class: 'variant-notes' }, variant.notes) : null,
    base.baked ? h('p', { class: 'variant-notes baked-note' }, base.baked.missing ? `Not baked yet: run npm run blender:bake -- ${asset.id}.` : `Pre-rendered in Blender ${base.baked.render?.blender ?? ''} (${base.baked.render?.engine ?? 'Cycles'}, ${base.baked.render?.samples ?? '?'} samples, ${base.baked.render?.seconds ?? '?'} s). Day, dusk and night are applied on top like for every sprite.${base.baked.outdated ? ' The spec changed since this render: bake again.' : ''}`) : null,
    h('div', { class: 'review' },
      h('div', { class: 'review-line' }, h('span', {}, repoLabel), review.pending ? pendingPill(review.pending) : null, review.outdated ? h('span', { class: 'pill outdated', title: 'The spec changed after this review' }, 'Outdated') : null),
      h('div', { class: 'review-row' }, statusButtons, h('button', { type: 'button', class: 'star', 'aria-pressed': String(review.preferred), disabled: readOnly, onclick: () => changeReview(asset, variant, { preferred: !review.preferred }) }, review.preferred ? '★ Preferred' : '☆ Prefer')),
      // One click for "this one goes into the game": approve + ★; the asset's other undecided variants stop waiting.
      h('div', { class: 'choose-row' },
        chosen ? h('span', { class: 'pill chosen', title: 'Approved and ★ preferred: this variant goes into the game' }, '✓ Chosen for the game') : null,
        chosen && othersWaiting ? h('button', { type: 'button', class: 'button choose-for-game', disabled: readOnly, title: 'This variant is already chosen; set the other variants still waiting for review aside as not chosen.', onclick: () => { savedFlash.set(key, { status: 'chosen', at: Date.now() }); chooseForGame(asset, variant); } }, `Set aside the other ${othersWaiting}`)
          : chosen ? null
          : h('button', { type: 'button', class: 'button choose-for-game', disabled: readOnly, title: 'Approve this variant and make it the one the game uses (★). The other variants still waiting for review are set aside as not chosen.', onclick: () => { savedFlash.set(key, { status: 'chosen', at: Date.now() }); chooseForGame(asset, variant); } }, 'Choose for the game'),
        setAside ? h('span', { class: 'sub alt-note' }, 'Not chosen: another variant goes into the game. Approve it later if you change your mind.') : null),
      readOnly ? h('p', { class: 'feedback' }, 'You can view this review. Deciding needs Contributor access to the Studio page.') : null,
      note, history,
      h('div', { class: 'card-actions' },
        h('button', { type: 'button', class: 'button', onclick: () => exportPng(asset, variant) }, 'Download PNG'),
        h('button', { type: 'button', class: 'button ghost', onclick: () => exportMeta(asset, variant) }, 'Download metadata'))));
}

// A decision not in the repository yet: shared (waiting for Claude) or local to this browser.
function pendingPill(record) {
  const status = STATUS_LABELS[record.status] ?? record.status;
  if (!sharedMode()) return h('span', { class: 'pill local', title: 'Stored in this browser only' }, `Local: ${status}`);
  const by = record.decidedBy ? ` · ${reviewerName(record.decidedBy)}` : '';
  return h('span', { class: 'pill local shared', title: 'Saved in the shared Studio; Claude takes it over into the repository at the start of the next chat' }, `Shared: ${status}${by}`);
}

// UI icon sets: one row per UI Lab style (its panel colour and text), icons at the top-bar size (22 px) and at 1×, then 2×.
function paintIconSet(canvas, asset, variant) {
  const generator = generators[asset.generator], list = generator.icons(variant.spec), dpr = Math.min(2, window.devicePixelRatio || 1);
  const n = list.length, rowH = 58, head = 22, big = 80, cssH = head + UI_PRESETS.length * rowH + big + 26;
  if (canvas.style.height !== `${cssH}px`) canvas.style.height = `${cssH}px`;
  const width = Math.round(canvas.clientWidth * dpr), height = Math.round(cssH * dpr);
  if (!width) return;
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
  const cssW = width / dpr, label = 118, small = 22, gapS = 8, mid = 40, gapM = 10, x22 = label, x40 = label + n * (small + gapS) + 12;
  ctx.font = '600 11px system-ui, sans-serif'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#6f6a5c';
  ctx.fillText('22 px', x22, head / 2); ctx.fillText(`1× · ${list.map(i => i.name).join(' → ')}`, x40, head / 2);
  UI_PRESETS.forEach((preset, row) => {
    const y = head + row * rowH, t = preset.tokens;
    ctx.fillStyle = t.panel; ctx.fillRect(0, y, cssW, rowH);
    ctx.fillStyle = t.line; ctx.fillRect(0, y + rowH - 1, cssW, 1);
    ctx.fillStyle = t.ink; ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText(preset.name.replace(/ \(current\)$/, ''), 10, y + rowH / 2, label - 16);
    list.forEach((icon, i) => {
      ctx.save(); ctx.translate(x22 + i * (small + gapS), y + (rowH - small) / 2); generator.drawIcon(ctx, icon.shapes, style, small, icon.fit); ctx.restore();
      ctx.save(); ctx.translate(x40 + i * (mid + gapM), y + (rowH - mid) / 2); generator.drawIcon(ctx, icon.shapes, style, mid, icon.fit); ctx.restore();
    });
  });
  const y = head + UI_PRESETS.length * rowH + 8, t = UI_PRESETS[0].tokens;
  ctx.fillStyle = t.panelRaised; ctx.fillRect(0, y - 8, cssW, big + 26);
  ctx.fillStyle = t.muted; ctx.font = '600 11px system-ui, sans-serif'; ctx.fillText('2×', 10, y + big / 2);
  list.forEach((icon, i) => { ctx.save(); ctx.translate(40 + i * (big + 8), y); generator.drawIcon(ctx, icon.shapes, style, big, icon.fit); ctx.restore(); });
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

// ---------- walk cycle (V03 animation) ----------
// Figures walk in three poses per direction: standing, right foot forward (stride +1) and left foot forward (−1),
// played standing → right → standing → left. Mounted figures and fixed-direction sheets do not walk.
const WALK_FRAMES = [['idle', 0], ['stride-a', 1], ['stride-b', -1]], WALK_CYCLE = ['idle', 'stride-a', 'idle', 'stride-b'], WALK_FPS = 6;
const walkCache = new Map();
const walksVariant = variant => !variant.spec.mount && variant.spec.facing === undefined;
const walks = asset => asset.generator === 'figure' && asset.variants.some(walksVariant);
function walkFrame(asset, variant, facing, stride, scale = 1) {
  const key = `${variant.id}:${variant.hash}:${facing}:${stride}:${scale}`;
  if (!walkCache.has(key)) walkCache.set(key, renderModel(generators.figure.build({ ...variant.spec, facing, stride }, { footprint: asset.footprint, style }), { style, footprint: asset.footprint, scale }));
  return walkCache.get(key);
}
// One sheet per variant: rows = facings 0–7, columns = idle, stride-a, stride-b. Every cell shares one anchor (the
// feet), so the game swaps frames without moving the figure.
function walkSheet(asset, variant, scale = 1) {
  const frames = Array.from({ length: 8 }, (_, k) => WALK_FRAMES.map(([, stride]) => walkFrame(asset, variant, k, stride, scale)));
  const all = frames.flat(), ax = Math.max(...all.map(f => f.anchor.x)), ay = Math.max(...all.map(f => f.anchor.y));
  const fw = ax + Math.max(...all.map(f => f.width - f.anchor.x)), fh = ay + Math.max(...all.map(f => f.height - f.anchor.y));
  const canvas = document.createElement('canvas');
  canvas.width = fw * WALK_FRAMES.length; canvas.height = fh * 8;
  const ctx = canvas.getContext('2d');
  frames.forEach((row, k) => row.forEach((f, i) => ctx.drawImage(f.canvas, i * fw + ax - f.anchor.x, k * fh + ay - f.anchor.y)));
  return { canvas, frameWidth: fw, frameHeight: fh, anchor: { x: ax, y: ay } };
}
function walkMeta(sheet) {
  return { frameWidth: sheet.frameWidth, frameHeight: sheet.frameHeight, anchor: sheet.anchor, origin: { x: +(sheet.anchor.x / sheet.frameWidth).toFixed(5), y: +(sheet.anchor.y / sheet.frameHeight).toFixed(5) }, columns: WALK_FRAMES.map(([id]) => id), rows: 'facing 0–7 (0 faces the viewer, then turning to screen right)', cycle: WALK_CYCLE, fps: WALK_FPS };
}
function walkView(asset) {
  const controls = toolbar([zoomControl('zoom', 'walk-zoom', 0.5, 4, 0.25), segmented('Background', BACKGROUNDS.map(b => [b.id, b.label]), state.background, id => { state.background = id; saveUi(); renderAll(); })]);
  if (!glReady) return [controls, h('p', { class: 'empty' }, 'WebGL is unavailable in this browser, so 3D recipes cannot be rendered.')];
  const cards = asset.variants.filter(walksVariant).map(variant => {
    const canvas = h('canvas', { class: 'walk-canvas', 'data-variant': variant.id, role: 'img', 'aria-label': `${variant.name} walking in eight directions` });
    canvas._paint = seconds => paintWalk(canvas, asset, variant, seconds);
    return h('article', { class: 'variant-card walk-card', 'data-variant': variant.id }, h('header', {}, h('div', {}, h('h3', {}, variant.name), h('span', { class: 'sub' }, `${variant.id} · v${variant.version}`)), h('span', { class: 'pills' }, pill(reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant }).effective.status))), canvas);
  });
  return [controls, h('p', { class: 'review-note' }, `Walk cycle: standing → right foot forward → standing → left foot forward at ${WALK_FPS} frames per second, in all eight directions. Approved figures are exported with a walk sheet (`, h('code', { class: 'mono' }, '<variant>.v<N>.walk.png'), '): 8 rows (directions) × 3 frames, one shared anchor at the feet.'), h('section', { class: 'variants walk-list', 'aria-label': 'Walk cycles' }, cards)];
}
function paintWalk(canvas, asset, variant, seconds = performance.now() / 1000) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), width = Math.round(canvas.clientWidth * dpr), height = Math.round(canvas.clientHeight * dpr);
  if (!width || !height) return;
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  const ctx = canvas.getContext('2d'), zoom = state.zoom * dpr, renderScale = Math.min(4, Math.max(1, Math.ceil(zoom))), display = zoom / renderScale;
  const frame = reducedMotion ? 'idle' : WALK_CYCLE[Math.floor(seconds * WALK_FPS) % WALK_CYCLE.length], stride = WALK_FRAMES.find(([id]) => id === frame)[1];
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, state.background, { width, height, origin: { x: width / 2, y: height - 20 * dpr }, zoom, footprint: asset.footprint, dark: state.background === 'dark' });
  for (let k = 0; k < 8; k++) {
    const sprite = walkFrame(asset, variant, k, stride, renderScale), x = Math.round(width * (k + 0.5) / 8), y = Math.round(height - 14 * dpr);
    drawSprite(ctx, sprite, x, y, display, true);
  }
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
// Proposed season change: global progress runs left to right through the
// variants in `transition.order`; each tile blends in at its own moment
// (seasonBlend), as the game would do over the first part of a season.
const transitionCache = new Map();
function transitionStep(asset, size, gx, gy) {
  const steps = asset.transition.order.length - 1, P = gx / (size - 1) * steps, from = Math.min(steps - 1, Math.floor(P));
  return { from, blend: seasonBlend(P - from, gx, gy, { seed: 7 }), nearest: Math.round(P) };
}
function transitionGround(asset, size) {
  const order = asset.transition.order.map(id => asset.variants.find(v => v.id === id)), sprites = order.map(v => spriteFor(asset, v, 2));
  const frame = (i, gx, gy) => sprites[i].tiles[previewFrame(order[i].spec, { width: size, height: size }, gx, gy).frame];
  return { groundTile: (gx, gy) => {
    const key = `${asset.id}:${order.map(v => v.hash).join(',')}:${gx},${gy}`;
    if (!transitionCache.has(key)) {
      const { from, blend } = transitionStep(asset, size, gx, gy), a = frame(from, gx, gy), canvas = document.createElement('canvas');
      canvas.width = a.width; canvas.height = a.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(a, 0, 0); ctx.globalAlpha = blend; ctx.drawImage(frame(from + 1, gx, gy), 0, 0);
      transitionCache.set(key, canvas);
    }
    return transitionCache.get(key);
  } };
}
function surfaceGround(asset, size) {
  if (asset.transition) return transitionGround(asset, size);
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
    if (asset.transition) for (const [gx, gy] of [[1, 1], [3, 0], [5, 1], [7, 0], [9, 1], [11, 0], [2, 10], [6, 10], [10, 10]]) {
      const ids = asset.transition.trees[transitionStep(asset, 12, gx, gy).nearest] ?? [];
      for (const id of ids.filter((_, i) => i === (gx + gy) % 2)) {
        const tree = catalog.studio.find(a => id.startsWith(`${a.id}-`)), variant = tree?.variants.find(v => v.id === id);
        if (variant) items.push({ sprite: spriteFor(tree, variant, 2), footprint: tree.footprint, gx, gy });
      }
    }
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
      ['Status', h('span', { class: 'review-line' }, pill(review.effective.status), review.pending ? h('span', { class: 'pill local' }, sharedMode() ? 'shared, waiting for Claude' : 'local, not committed') : h('span', {}, 'from repository'), review.outdated ? h('span', { class: 'pill outdated' }, 'Outdated') : null)],
      ['Approved at', review.effective.approvedAt ?? '—'], ['Sprite file', spriteInfo],
    ]), h('pre', { class: 'json' }, JSON.stringify(variant.spec, null, 2)));
  });
  return [h('div', { class: 'details-grid' },
    h('section', { class: 'panel' }, h('h2', {}, 'Asset'), rows([
      ['ID', h('span', { class: 'mono' }, asset.id)], ['Name', asset.name], ['Category', asset.category],
      ['Footprint', `${asset.footprint.width} × ${asset.footprint.height} tiles`], ['Generator', `${generator.label} v${generator.version}`],
      ['Style guide', `${style.name} v${style.version}`], ['Replaces in game', asset.gameObjectId ? h('span', { class: 'mono' }, asset.gameObjectId) : asset.plannedGameObjectId ? h('span', {}, h('span', { class: 'mono' }, asset.plannedGameObjectId), ' (planned, not in the game yet)') : '—'],
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
    style.military ? h('section', { class: 'panel' }, h('h2', {}, 'Military'), h('ul', { class: 'rules' }, h('li', {}, style.military.rule))) : null,
    style.seasons ? h('section', { class: 'panel' }, h('h2', {}, 'Seasons'), h('ul', { class: 'rules' }, ['rule', 'transition'].map(key => h('li', {}, style.seasons[key])))) : null,
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
// "Choose for the game": this variant approved + ★ in one step; the asset's other variants still waiting for review
// (draft, review, or outdated) are set aside as rejected with a fixed note, so the owner need not reject them one by one.
// Variants sent for rework keep their request; later versions or new variants wait again as usual.
const NOT_CHOSEN = 'Not chosen: another variant was chosen for the game.';
function chooseForGame(asset, variant) {
  const before = state.local, by = sharedMode() ? shared.uid ?? undefined : undefined;
  const own = reviewState({ repo: data.approvals, local: state.local, assetId: asset.id, variant });
  let next = updateLocal(state.local, { assetId: asset.id, variant, status: 'approved', preferred: true, by, ...(own.effective.note === NOT_CHOSEN ? { note: '' } : {}) });
  for (const other of asset.variants) {
    if (other.id === variant.id) continue;
    const s = reviewState({ repo: data.approvals, local: next, assetId: asset.id, variant: other });
    if (s.awaitsOwner) next = updateLocal(next, { assetId: asset.id, variant: other, status: 'rejected', note: NOT_CHOSEN, by });
  }
  state.local = next;
  if (sharedMode()) saveShared(docWrites(before, next, { by: shared.uid }));
  else if (!writeLocal(storage, state.local)) showAlert('This browser blocks local storage, so review changes last only until the page is closed. Export them before leaving.');
  renderAll();
}
function changeReview(asset, variant, change) {
  const before = state.local, by = sharedMode() ? shared.uid ?? undefined : undefined;
  let next = updateLocal(state.local, { assetId: asset.id, variant, ...change, by });
  if (change.status === 'approved' && !reviewState({ repo: data.approvals, local: next, assetId: asset.id, variant }).preferred && !asset.variants.some(v => v.id !== variant.id && reviewState({ repo: data.approvals, local: next, assetId: asset.id, variant: v }).preferred)) {
    next = updateLocal(next, { assetId: asset.id, variant, preferred: true });
  }
  state.local = next;
  if (sharedMode()) saveShared(docWrites(before, next, { by: shared.uid }));
  else if (!writeLocal(storage, state.local)) showAlert('This browser blocks local storage, so review changes last only until the page is closed. Export them before leaving.');
  renderAll();
}
// Writes go one at a time, in order; the database snapshot then confirms them (or restores the stored state).
function saveShared(writes) {
  shared.writes = shared.writes.then(async () => {
    for (const write of writes) {
      const ref = shared.db.doc(write.path);
      try { if (write.data) await ref.set(write.data); else await ref.delete(); }
      catch (error) {
        if (error?.code === 'invalid_argument' && shared.canWrite !== true) { shared.canWrite = false; showAlert('Your decisions cannot be saved: deciding needs Contributor access to the Studio page.'); renderAll(); return; }
        showAlert(`A review decision could not be saved (${error?.code ?? 'unavailable'}). The Studio shows what is stored.`);
      }
    }
  });
}
function renderSummary() {
  const changes = pendingChanges({ repo: data.approvals, local: state.local, catalog: catalog.studio }), n = changes.length;
  const text = sharedMode()
    ? (n ? h('span', {}, h('strong', {}, `${n} decision${n === 1 ? '' : 's'}`), ' waiting for Claude — write „spustit revizi“ in the MK chat to start') : 'Every decision is in the repository')
    : (n ? h('span', {}, h('strong', {}, `${n} local change${n === 1 ? '' : 's'}`), ' not in the repository') : 'Review matches the repository');
  $('#review-summary').replaceChildren(text);
  $('#open-export').textContent = sharedMode() ? 'Review hand-over' : 'Export review';
}
function exportManifest() { return buildExportManifest({ repo: data.approvals, local: state.local, catalog: catalog.studio }); }
function openExport() {
  const changes = pendingChanges({ repo: data.approvals, local: state.local, catalog: catalog.studio });
  const none = sharedMode() ? 'Nothing is waiting: every shared decision is already in the repository.' : 'No local changes. The file below equals the committed manifest.';
  $('#export-changes').replaceChildren(...(changes.length ? changes.map(c => h('li', {}, c.preferred ? `${c.variantId}: preferred variant of ${c.assetId}` : `${c.variantId}: ${STATUS_LABELS[c.from]} → ${STATUS_LABELS[c.to]}`)) : [h('li', {}, none)]));
  $('#export-json').value = `${JSON.stringify(exportManifest(), null, 2)}\n`;
  $('#export-feedback').textContent = ''; $('#discard-hint').textContent = ''; discardArmed = false;
  $('#export-title').textContent = sharedMode() ? 'Review hand-over' : 'Export review';
  $('#export-lede').textContent = sharedMode()
    ? 'Decisions are saved for every reviewer as soon as you click. At the start of the next chat Claude reads them, writes them into art/approvals.json in the game repository, exports approved sprites and turns revision requests into tasks. Nothing else is needed from you.'
    : 'Local review decisions live only in this browser. To make them permanent, give the file below to Claude (paste it into a chat or attach it), who replaces art/approvals.json in the game repository.';
  $('#export-steps').hidden = sharedMode();
  $('#export-download').hidden = !shared.downloads && sharedMode();
  $('.danger-zone').hidden = sharedMode();
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
  $('#export-download').addEventListener('click', () => { download('approvals.json', new Blob([$('#export-json').value], { type: 'application/json' })); $('#export-feedback').textContent = shared.downloads ? 'Confirm the save to download approvals.json.' : 'Download started. If nothing happens, use Copy JSON.'; });
  $('#discard-local').addEventListener('click', () => {
    if (sharedMode()) return;
    if (!discardArmed) { discardArmed = true; $('#discard-hint').textContent = 'Click again to discard every local review decision. The repository is not affected.'; return; }
    state.local = discardLocal(state.local); writeLocal(storage, state.local); discardArmed = false;
    $('#export-dialog').close(); renderAll();
  });
}

// ---------- shared review (Studio page in Claude) ----------
// Lights up only when the page runs in Claude with its database; the local review stays the fallback.
async function connectShared() {
  const claude = window.claude;
  if (typeof claude?.use !== 'function') return;
  claude.use('downloads').then(downloads => { shared.downloads = downloads ?? null; }).catch(() => {});
  const [db, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('user').catch(() => null)]);
  if (!db) return;
  shared.db = db; shared.user = user;
  shared.uid = user ? await user.id().catch(() => null) : null;
  shared.canWrite = user ? await Promise.resolve(user.can?.('data.write')).catch(() => null) ?? null : null;
  let reviews = null, preferred = null, first = true;
  const waiting = setTimeout(() => showAlert('The shared review cannot be reached yet; the Studio shows the repository state until it answers.'), 10000);
  const apply = () => {
    if (!reviews || !preferred) return;
    clearTimeout(waiting);
    if (first) { first = false; if ($('#studio-alert').textContent.startsWith('The shared review cannot')) showAlert(''); }
    shared.mode = 'shared';
    state.local = layerFromDocs(reviews, preferred);
    resolveNames();
    renderAll();
  };
  const failed = error => { clearTimeout(waiting); if (error?.code !== 'revoked') showAlert(`The shared review stopped updating (${error?.code ?? 'unavailable'}). Reload the page to reconnect.`); };
  db.collection(REVIEWS).onSnapshot(snap => { reviews = snap.docs.filter(d => d.exists).map(d => d.data()); apply(); }, failed);
  db.collection(PREFERRED).onSnapshot(snap => { preferred = snap.docs.filter(d => d.exists).map(d => d.data()); apply(); }, failed);
}
// Names are resolved from reviewer ids each time; only ids are ever stored.
async function resolveNames() {
  if (!shared.user?.profiles) return;
  const ids = reviewerIds(state.local).filter(id => !shared.names.has(id));
  if (!ids.length) return;
  try {
    const profiles = await shared.user.profiles(ids);
    let changed = false;
    for (const id of ids) { const name = profiles?.[id]?.name || ''; if (name) { shared.names.set(id, id === shared.uid ? `${name} (you)` : name); changed = true; } }
    if (changed) renderAll();
  } catch { /* names are optional */ }
}

// ---------- export of sprites ----------
function exportSprite(assetId, variantId, { facings = false } = {}) {
  const asset = findAsset(assetId), variant = asset?.variants?.find(v => v.id === variantId);
  if (!variant) throw new RangeError(`Unknown variant ${assetId}/${variantId}`);
  const sprite = spriteFor(asset, variant, 1);
  // A baked sprite is already in the repository with its own metadata; exporting hands those over unchanged.
  if (variant.baked) return { baked: true, facingPngs: [], png: sprite.canvas.toDataURL('image/png'), front: null, still: null, rotor: null, sheet: null, tiles: [], meta: structuredClone(data.exportedMeta[variant.paths.spriteMeta] ?? null), paths: { ...variant.paths, spriteTiles: [] } };
  const meta = spriteMetadata({ asset, variant, style, sprite, generator: generators[asset.generator] });
  // Figures can also be rendered in the eight walking directions (facing 0–7, 0 = towards the viewer).
  const turned = facings && asset.generator === 'figure' && variant.spec.facing === undefined ? Array.from({ length: 8 }, (_, k) => renderModel(generators.figure.build({ ...variant.spec, facing: k }, { footprint: asset.footprint, style }), { style, footprint: asset.footprint, scale: 1 })) : [];
  if (turned.length) meta.facings = turned.map((s, k) => ({ facing: k, width: s.width, height: s.height, anchor: s.anchor, origin: { x: +(s.anchor.x / s.width).toFixed(5), y: +(s.anchor.y / s.height).toFixed(5) } }));
  const walk = turned.length && walksVariant(variant) ? walkSheet(asset, variant, 1) : null;
  if (walk) meta.walk = walkMeta(walk);
  // UI icon sets: every level on its own, as SVG and as PNG at 1× and 2×.
  const iconFiles = [], iconTexts = [];
  if (sprite.icons) {
    const generator = generators[asset.generator], twice = spriteFor(asset, variant, 2), base = variant.paths.spriteIconBase;
    meta.icons = generator.icons(variant.spec).map((icon, i) => {
      const files = { svg: `${base}${icon.level}.svg`, png: `${base}${icon.level}.png`, png2x: `${base}${icon.level}@2x.png` };
      iconTexts.push({ path: files.svg, text: `${generator.toSvg(icon.shapes, style, icon.fit)}\n` });
      iconFiles.push({ path: files.png, png: sprite.icons[i].canvas.toDataURL('image/png') }, { path: files.png2x, png: twice.icons[i].canvas.toDataURL('image/png') });
      return { level: icon.level, name: icon.name, size: 40, ...files };
    });
  }
  return { iconFiles, iconTexts, walk: walk?.canvas.toDataURL('image/png') ?? null, facingPngs: turned.map(s => s.canvas.toDataURL('image/png')), png: sprite.canvas.toDataURL('image/png'), front: sprite.front?.toDataURL('image/png') ?? null, still: sprite.still?.toDataURL('image/png') ?? null, rotor: sprite.rotor?.toDataURL('image/png') ?? null, sheet: sprite.sheet?.toDataURL('image/png') ?? null, tiles: sprite.tiles?.map(tile => tile.toDataURL('image/png')) ?? [], meta, paths: { ...variant.paths, spriteTiles: (sprite.tiles ?? []).map((_, i) => `${variant.paths.spriteTileBase}${i}.png`), ...(walk ? { spriteWalk: variant.paths.sprite.replace(/\.png$/, '.walk.png') } : {}) } };
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
  if (!reducedMotion && (state.time !== 'day' || state.tab === 'walk') && state.view === 'assets') startAnimation();
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
  revealSelected();
}
trackTopbarHeight();
$('#library-search').addEventListener('input', event => { state.query = event.target.value; renderLibrary(); });
window.addEventListener('hashchange', route);
let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => paintVisible(), 120); });
bindExport();
connectShared().catch(() => {});
if (!glReady) showAlert('WebGL is not available, so studio recipes cannot be rendered. Current game sprites are still listed.');
// Baked (Blender) sprites load as images first, so every view can draw them synchronously.
preloadBaked().then(() => {
route();

// Automation hook used by scripts/studio-smoke.mjs and scripts/studio-export.mjs.
window.assetStudio = Object.freeze({
  ready: true,
  assets: () => catalog.studio.map(a => ({ id: a.id, category: a.category, variants: a.variants.map(v => ({ id: v.id, version: v.version, hash: v.hash, paths: v.paths })) })),
  gameAssets: () => catalog.game.map(a => a.id),
  exportSprite,
  exportManifest,
  local: () => structuredClone(state.local),
  reviewMode: () => shared.mode,
  sceneLights: () => structuredClone(lastSceneLights),
});
});
