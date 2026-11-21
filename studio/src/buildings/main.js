// Buildings in game (#91, plan g-studio-ceny-budov): every building the game offers with its price from the game's code,
// and price proposals kept in the Studio page's shared database (`prices/<buildingId>`). Outside Claude (no page
// database) proposals stay in this browser and can be handed over with Copy prices JSON.
import '../styles.css';
import './buildings.css';
import {
  PRICES, priceDocId, gameBuildings, priceDiff, setAmount, addResource, removeResource, costErrorText,
  proposalDoc, proposalsFrom, proposalsJson, formatCost, sameCost,
} from '../lib/buildingPrices.js';
import pkg from '../../../package.json';

const specModules = import.meta.glob('../../../art/assets/*/*/asset.json', { eager: true, import: 'default' });
const gameSprites = import.meta.glob('../../../public/assets/buildings/**/*.{png,svg,webp}', { eager: true, query: '?url', import: 'default' });
const STORAGE = 'asset-studio.prices.v1';
const $ = selector => document.querySelector(selector);

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat()) if (child != null && child !== false) node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  return node;
}

const table = gameBuildings({ specs: Object.values(specModules) });
const buildings = new Map(table.categories.flatMap(c => c.buildings).map(b => [b.id, b]));
const names = Object.fromEntries(table.resources.map(r => [r.id, r.name]));
const resourceIds = new Set(table.resources.map(r => r.id));
const state = { proposals: new Map(), editing: null, draft: null, note: '', error: '', flash: null, search: '', onlyChanged: false };
const shared = { mode: 'local', db: null, user: null, uid: null, canWrite: null, names: new Map() };
const readOnly = () => shared.mode === 'shared' && shared.canWrite === false;

const spriteUrl = building => {
  if (!building.sprite) return null;
  return gameSprites[`../../../public${building.sprite.startsWith('/') ? '' : '/'}${building.sprite}`] ?? null;
};
const who = id => !id ? '' : id === shared.uid ? 'you' : shared.names.get(id) || 'a reviewer';
const when = at => { const d = new Date(at); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); };
const showAlert = message => { const alert = $('#studio-alert'); alert.textContent = message; alert.hidden = !message; };

// ---------- local fallback ----------
function readLocal() {
  try { const docs = JSON.parse(globalThis.localStorage?.getItem(STORAGE) ?? '[]'); return Array.isArray(docs) ? docs : []; } catch { return []; }
}
function writeLocal(docs) {
  try { globalThis.localStorage?.setItem(STORAGE, JSON.stringify(docs)); } catch { showAlert('This browser does not keep the proposal; use Copy prices JSON before leaving.'); }
}
function loadLocal() { state.proposals = proposalsFrom(readLocal(), table); }

// ---------- saving ----------
async function saveProposal(buildingId, cost, note) {
  const building = buildings.get(buildingId);
  if (sameCost(building.cost, cost)) { await discard(buildingId); return 'Same as the game price: nothing waits for Claude.'; }
  const doc = proposalDoc(buildingId, cost, { by: shared.uid, note });
  if (shared.mode === 'shared') {
    try { await shared.db.doc(`${PRICES}/${priceDocId(buildingId)}`).set(doc); }
    catch (error) {
      if (error?.code === 'invalid_argument' || error?.code === 'permission_denied') { shared.canWrite = false; render(); throw new Error('Saving needs Contributor access to the Studio page.'); }
      throw new Error(`The proposal was not saved (${error?.code ?? 'unavailable'}). Try again.`);
    }
    state.proposals.set(buildingId, { ...proposalsFrom([doc], table).get(buildingId) });
    return 'Saved. Write „převzít ceny“ in the MK chat Mechaniky to apply it to the game.';
  }
  writeLocal([...readLocal().filter(d => d?.buildingId !== buildingId), doc]);
  loadLocal();
  return 'Saved in this browser only. Use Copy prices JSON and hand it to Claude.';
}
async function discard(buildingId) {
  if (shared.mode === 'shared') {
    if (!state.proposals.has(buildingId)) return;
    try { await shared.db.doc(`${PRICES}/${state.proposals.get(buildingId).docId ?? priceDocId(buildingId)}`).delete(); }
    catch (error) { throw new Error(`The proposal was not removed (${error?.code ?? 'unavailable'}).`); }
    state.proposals.delete(buildingId);
    return;
  }
  writeLocal(readLocal().filter(d => d?.buildingId !== buildingId));
  loadLocal();
}

// ---------- editing ----------
function startEdit(buildingId) {
  const building = buildings.get(buildingId), proposal = state.proposals.get(buildingId);
  state.editing = buildingId;
  state.draft = { ...(proposal && !proposal.unchanged ? proposal.cost : building.cost) };
  state.note = proposal?.note ?? '';
  state.error = '';
  state.flash = null;
  render();
  document.querySelector(`.bg-row[data-building="${buildingId}"] .bg-editor input`)?.focus();
}
function tryDraft(change) {
  try { state.draft = change(state.draft); state.error = ''; return true; }
  catch (error) { state.error = costErrorText(error, names); return false; }
}

function editor(building) {
  const draft = state.draft, entries = Object.entries(draft), missing = table.resources.filter(r => !(r.id in draft));
  const errorLine = h('p', { class: 'review-error bg-error', role: 'alert' }, state.error);
  errorLine.hidden = !state.error;
  const amount = h('input', { type: 'number', min: 1, step: 1, value: 1, class: 'bg-amount', 'aria-label': 'Amount of the new resource' });
  const select = h('select', { class: 'bg-select', 'aria-label': 'Resource to add' }, missing.map(r => h('option', { value: r.id }, r.name)));
  const diff = priceDiff(building.cost, draft);
  return h('form', { class: 'bg-editor', onsubmit: async event => {
    event.preventDefault();
    for (const input of event.currentTarget.querySelectorAll('input[data-resource]')) if (!tryDraft(cost => setAmount(cost, input.dataset.resource, input.value))) { render(); return; }
    try {
      const message = await saveProposal(building.id, state.draft, state.note);
      state.editing = null; state.flash = { id: building.id, message };
    } catch (error) { state.error = error.message; }
    render();
  } },
    h('h4', {}, `New price of ${building.name}`),
    entries.length ? null : h('p', { class: 'bg-meta' }, 'Free in the game today. Add a resource to give it a price.'),
    h('ul', { class: 'bg-lines' }, entries.map(([id, n]) => h('li', { class: `bg-line ${diff.find(d => d.resource === id)?.kind ?? ''}` },
      h('label', { for: `bg-${building.id}-${id}` }, names[id] ?? id),
      h('input', { id: `bg-${building.id}-${id}`, type: 'number', min: 1, step: 1, value: n, 'data-resource': id, oninput: event => { tryDraft(cost => setAmount(cost, id, event.target.value)); errorLine.textContent = state.error; errorLine.hidden = !state.error; } }),
      h('button', { type: 'button', class: 'button ghost bg-remove', 'aria-label': `Remove ${names[id] ?? id}`, title: entries.length <= 1 ? 'A building must cost at least one resource' : `Remove ${names[id] ?? id}`, disabled: entries.length <= 1, onclick: () => { tryDraft(cost => removeResource(cost, id)); render(); } }, '✕')))),
    missing.length ? h('div', { class: 'bg-add' }, select, amount, h('button', { type: 'button', class: 'button', onclick: () => { tryDraft(cost => addResource(cost, select.value, amount.value, resourceIds)); render(); } }, '+ Add resource')) : null,
    h('label', { class: 'bg-note' }, h('span', {}, 'Note (optional)'), h('input', { type: 'text', maxlength: 500, value: state.note, placeholder: 'Why this price', oninput: event => { state.note = event.target.value; } })),
    errorLine,
    h('div', { class: 'bg-actions' },
      h('button', { type: 'submit', class: 'button primary' }, 'Save price change'),
      h('button', { type: 'button', class: 'button ghost', onclick: () => { state.editing = null; state.error = ''; render(); } }, 'Cancel')));
}

function priceView(building, proposal) {
  if (!proposal || proposal.unchanged) return h('ul', { class: 'bg-cost' }, Object.keys(building.cost).length ? Object.entries(building.cost).map(([id, n]) => h('li', {}, `${names[id] ?? id} × ${n}`)) : h('li', { class: 'free' }, 'Free'));
  return h('div', { class: 'bg-proposal' },
    h('ul', { class: 'bg-cost diff' }, priceDiff(building.cost, proposal.cost).map(d => h('li', { class: d.kind },
      d.kind === 'changed' ? `${names[d.resource] ?? d.resource} ${d.from} → ${d.to}` : d.kind === 'added' ? `+ ${names[d.resource] ?? d.resource} × ${d.to}` : `${names[d.resource] ?? d.resource} × ${d.from ?? d.to}`))),
    h('p', { class: 'bg-meta' }, `Game: ${formatCost(building.cost, names)}. Proposed${proposal.by ? ` by ${who(proposal.by)}` : ''}${proposal.at ? ` · ${when(proposal.at)}` : ''}`, proposal.note ? h('span', { class: 'bg-note-text' }, ` — „${proposal.note}“`) : null));
}

function row(building) {
  const proposal = state.proposals.get(building.id), changed = proposal && !proposal.unchanged, url = spriteUrl(building);
  return h('article', { class: `bg-row${changed ? ' changed' : ''}${state.editing === building.id ? ' editing' : ''}`, 'data-building': building.id },
    h('div', { class: 'bg-thumb' }, url ? h('img', { src: url, alt: '', loading: 'lazy' }) : h('span', { class: 'bg-thumb-none', 'aria-hidden': 'true' }, '▦')),
    h('div', { class: 'bg-name' }, h('strong', {}, building.name), h('span', { class: 'sub' }, h('code', { class: 'mono' }, building.id), ` · ${building.footprint.width}×${building.footprint.height}`, building.studioAsset ? [' · ', h('a', { href: `./index.html#${building.studioAsset}` }, 'Studio asset')] : null)),
    priceView(building, proposal),
    h('div', { class: 'bg-row-actions' },
      changed ? h('span', { class: 'pill local shared' }, 'Waiting for Claude') : null,
      h('button', { type: 'button', class: 'button', disabled: readOnly(), title: readOnly() ? 'Changing prices needs Contributor access' : null, onclick: () => startEdit(building.id) }, changed ? 'Edit proposal' : 'Edit price'),
      proposal && !readOnly() ? h('button', { type: 'button', class: 'button ghost', onclick: async () => { try { await discard(building.id); state.flash = { id: building.id, message: 'Proposal discarded; the game price stays.' }; } catch (error) { showAlert(error.message); } render(); } }, 'Discard') : null),
    state.flash?.id === building.id ? h('p', { class: 'review-saved bg-flash' }, state.flash.message) : null,
    state.editing === building.id ? editor(building) : null);
}

function render() {
  const query = state.search.trim().toLowerCase();
  const visible = b => (!query || b.name.toLowerCase().includes(query) || b.id.includes(query)) && (!state.onlyChanged || (state.proposals.get(b.id) && !state.proposals.get(b.id).unchanged));
  const sections = table.categories.map(c => ({ ...c, list: c.buildings.filter(visible) })).filter(c => c.list.length);
  $('#bg-table').replaceChildren(...(sections.length ? sections.map(c => h('section', { class: 'bg-category' }, h('h2', {}, h('span', { 'aria-hidden': 'true' }, `${c.icon} `), c.name, h('span', { class: 'count' }, ` ${c.list.length}`)), ...c.list.map(row))) : [h('p', { class: 'empty' }, 'No building matches.')]));
  const waiting = [...state.proposals.values()].filter(p => !p.unchanged).length;
  $('#bg-summary').textContent = waiting
    ? `${waiting} price change${waiting === 1 ? '' : 's'} waiting for Claude — write „převzít ceny“ in the MK chat Mechaniky.`
    : 'No price changes waiting.';
  $('#bg-mode').textContent = shared.mode === 'shared'
    ? (readOnly() ? 'You can view prices here; changing them needs Contributor access to this page.' : 'Proposals are shared with everyone who can open this page.')
    : 'This page is not running in Claude: proposals stay in this browser. Copy prices JSON hands them over.';
}

// ---------- shared database (Studio page in Claude) ----------
async function connectShared() {
  const claude = window.claude;
  if (typeof claude?.use !== 'function') return;
  const [db, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('user').catch(() => null)]);
  if (!db) return;
  shared.db = db; shared.user = user;
  shared.uid = user ? await user.id().catch(() => null) : null;
  shared.canWrite = user ? await Promise.resolve(user.can?.('data.write')).catch(() => null) ?? null : null;
  db.collection(PRICES).onSnapshot(snap => {
    shared.mode = 'shared';
    state.proposals = proposalsFrom(snap.docs.filter(d => d.exists).map(d => ({ id: d.id, data: d.data() })), table);
    resolveNames();
    render();
  }, error => { if (error?.code !== 'revoked') showAlert(`Price proposals stopped updating (${error?.code ?? 'unavailable'}). Reload the page to reconnect.`); });
}
async function resolveNames() {
  if (!shared.user?.profiles) return;
  const ids = [...new Set([...state.proposals.values()].map(p => p.by).filter(id => id && id !== shared.uid && !shared.names.has(id)))];
  if (!ids.length) return;
  try {
    const profiles = await shared.user.profiles(ids);
    for (const id of ids) if (profiles?.[id]?.name) shared.names.set(id, profiles[id].name);
    render();
  } catch { /* names are optional */ }
}

// ---------- boot ----------
$('#bg-version').textContent = `Prices from the game's code · game v${pkg.version} · ${table.count} buildings`;
$('#bg-search').addEventListener('input', event => { state.search = event.target.value; render(); });
$('#bg-only-changed').addEventListener('change', event => { state.onlyChanged = event.target.checked; render(); });
$('#bg-copy').addEventListener('click', async () => {
  const text = JSON.stringify(proposalsJson(state.proposals), null, 2);
  try { await navigator.clipboard.writeText(text); $('#bg-copy').textContent = 'Copied'; setTimeout(() => { $('#bg-copy').textContent = 'Copy prices JSON'; }, 1500); }
  catch { showAlert(`Copying is blocked here. Prices JSON: ${text}`); }
});
loadLocal();
render();
connectShared();
window.buildingsStudio = {
  mode: () => shared.mode,
  table: () => structuredClone(table),
  proposals: () => proposalsJson(state.proposals),
};
