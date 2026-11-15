// Guide page (owner 15 Nov 2026): the start arrows, the Getting started tasks and the tips of the game, editable by the
// owner. The base is the game's src/data/guide.js; the edited copy lives in the Studio database (`guide/draft`) so
// everyone with the page sees it. "Send to Claude" marks it submitted; Claude applies it ("převzít průvodce").
// Outside Claude (no page database) the draft stays in this browser.
import '../styles.css';
import './guide.css';
import { GUIDE } from '../../../src/data/guide.js';
import { JOBS } from '../../../src/data/jobs.js';
import { objectDefinitions } from '../../../src/data/objects/index.js';
import cs from '../../../src/i18n/cs.js';
import en from '../../../src/i18n/en.js';
import { GUIDE_DOC, draftFromGame, draftKey, move, addTask, addTip, draftProblems } from '../lib/guideDraft.js';
import pkg from '../../../package.json';

const STORAGE = 'asset-studio.guide.v1';
const $ = selector => document.querySelector(selector);
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

const game = draftFromGame(GUIDE, { cs, en });
const buildingList = objectDefinitions.filter(d => d.category === 'building').map(d => ({ id: d.id, name: cs[`object.${d.id}.name`] || d.name })).sort((a, b) => a.name.localeCompare(b.name, 'cs'));
const buildingName = id => buildingList.find(b => b.id === id)?.name ?? id;
const jobList = Object.entries(JOBS).filter(([id]) => id !== 'idle').map(([id, job]) => ({ id, name: cs[`job.${id}`] || job.name }));
const jobName = id => jobList.find(j => j.id === id)?.name ?? id;
const state = { draft: structuredClone(game), status: null, by: null, at: null, version: null };
const shared = { mode: 'local', db: null, uid: null, canWrite: null };
const showAlert = message => { const alert = $('#studio-alert'); alert.textContent = message; alert.hidden = !message; };
const same = () => draftKey(state.draft) === draftKey(game);
const when = at => { const d = new Date(at); return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }); };

// ---------- saving ----------
let saveTimer = null;
// Typing (quiet) keeps the fields in place and only updates the status line; other edits draw the lists again.
function changed(next, { now = false, quiet = false } = {}) {
  state.draft = next; if (state.status === 'submitted') state.status = 'draft';
  if (quiet) renderStatus(); else render(); clearTimeout(saveTimer); saveTimer = setTimeout(save, now ? 0 : 600);
}
async function save(status = state.status === 'submitted' ? 'submitted' : 'draft') {
  const doc = { ...structuredClone(state.draft), status: same() ? 'same' : status, by: shared.uid, at: new Date().toISOString(), gameVersion: pkg.version };
  if (shared.mode === 'shared') {
    try { await shared.db.doc(GUIDE_DOC).set(doc); state.status = doc.status; state.at = doc.at; }
    catch (error) { showAlert(error?.code === 'permission-denied' ? 'Saving needs Contributor access to this page.' : `Not saved (${error?.code ?? error?.message ?? 'error'}). Try again.`); }
  } else { try { localStorage.setItem(STORAGE, JSON.stringify(doc)); state.status = doc.status; state.at = doc.at; } catch { showAlert('This browser does not keep the draft.'); } }
  renderStatus();
}
async function submit() {
  const problems = draftProblems(state.draft, { buildings: new Set(buildingList.map(b => b.id)), jobs: new Set(jobList.map(j => j.id)) });
  if (problems.length) { showAlert(problems.join(' ')); return; }
  if (same()) { showAlert('Nothing to send: this is the version in the game.'); return; }
  showAlert(''); clearTimeout(saveTimer); await save('submitted');
}
function reset() { if (same()) return; if (!confirm('Throw away the edits and go back to the version in the game?')) return; changed(structuredClone(game), { now: true }); }

// ---------- rendering ----------
const changedItem = (list, item) => { const base = game[list].find(x => x.id === item.id); return !base || JSON.stringify(base) !== JSON.stringify(item); };
function textFields(item, field, onChange, { area = true } = {}) {
  const make = lang => { const attrs = { value: item[field][lang], oninput: e => onChange(lang, e.target.value), placeholder: lang === 'en' ? 'English (optional)' : '' }; return h('label', {}, lang.toUpperCase(), area ? h('textarea', attrs) : h('input', { type: 'text', ...attrs })); };
  return [make('cs'), make('en')];
}
function controls(list, index, { removable = true } = {}) {
  // The lists are read when clicked, not when drawn: typing changes the draft without drawing again.
  const items = () => state.draft[list];
  return h('div', { class: 'gd-actions' },
    h('button', { type: 'button', class: 'button', title: 'Move up', disabled: index === 0, onclick: () => changed({ ...state.draft, [list]: move(items(), index, -1) }) }, '↑'),
    h('button', { type: 'button', class: 'button', title: 'Move down', disabled: index === items().length - 1, onclick: () => changed({ ...state.draft, [list]: move(items(), index, 1) }) }, '↓'),
    removable ? h('button', { type: 'button', class: 'button', title: 'Remove', onclick: () => changed({ ...state.draft, [list]: items().filter((_, i) => i !== index) }) }, '✕') : null);
}
const update = (list, index, patch, options) => changed({ ...state.draft, [list]: state.draft[list].map((item, i) => i === index ? { ...item, ...patch } : item) }, options);
const setText = (list, index, field) => (lang, value) => update(list, index, { [field]: { ...state.draft[list][index][field], [lang]: value } }, { quiet: true });
function renderIntro() {
  $('#gd-intro').replaceChildren(...state.draft.intro.map((step, i) => h('li', { class: `gd-item${changedItem('intro', step) ? ' changed' : ''}` }, h('span', { class: 'gd-num' }, i + 1),
    h('div', { class: 'gd-fields' }, h('span', { class: 'meta' }, step.check === 'wiki' ? 'Arrow at the Wiki button – goes away when the Wiki is opened' : 'Arrow at the Getting started panel – goes away with “Got it”'), ...textFields(step, 'text', setText('intro', i))),
    controls('intro', i, { removable: false }))));
}
function renderTasks() {
  $('#gd-tasks').replaceChildren(...state.draft.tasks.map((task, i) => {
    const what = task.kind === 'build'
      ? h('select', { onchange: e => update('tasks', i, { building: e.target.value }) }, ...buildingList.map(b => h('option', { value: b.id, selected: b.id === task.building }, b.name)))
      : task.kind === 'job' ? h('select', { onchange: e => update('tasks', i, { job: e.target.value }) }, ...jobList.map(j => h('option', { value: j.id, selected: j.id === task.job }, j.name)))
        : null;
    const meta = { build: 'Done when this building is finished:', job: 'Done when a resident has this job:', king: 'Done when the king is selected', water: 'Done when a river or pond is explored' }[task.kind];
    return h('li', { class: `gd-item${changedItem('tasks', task) ? ' changed' : ''}` }, h('span', { class: 'gd-num' }, i + 1),
      h('div', { class: 'gd-fields' }, h('span', { class: 'meta' }, meta, ' ', what),
        ...textFields(task, 'title', setText('tasks', i, 'title'), { area: false }).map((l, n) => { l.firstChild.textContent = n ? 'EN' : 'CS'; return l; }),
        h('span', { class: 'meta' }, 'Why (small line under the task):'), ...textFields(task, 'why', setText('tasks', i, 'why'), { area: false })),
      controls('tasks', i));
  }));
}
function renderTips() {
  $('#gd-gap').value = state.draft.tipGap;
  $('#gd-tips').replaceChildren(...state.draft.tips.map((tip, i) => h('li', { class: `gd-item${changedItem('tips', tip) ? ' changed' : ''}` }, h('span', { class: 'gd-num' }, i + 1),
    h('div', { class: 'gd-fields' }, h('span', { class: 'meta' }, tip.kind === 'sequence' ? 'In order' : `When it happens (${tip.id}) – the game decides when; you can change the text`),
      ...textFields(tip, 'text', setText('tips', i, 'text'))),
    controls('tips', i, { removable: tip.kind === 'sequence' }))));
}
function render() { renderIntro(); renderTasks(); renderTips(); renderStatus(); }
function renderStatus() {
  const status = same() ? 'Same as the game.' : state.status === 'submitted' ? `Sent to Claude ${when(state.at)} – write „převzít průvodce“ in the chat.` : 'Edited – not sent yet.';
  $('#gd-summary').textContent = status;
  $('#gd-mode').textContent = shared.mode === 'shared' ? 'Edits are shared with everyone who can open this page.' : 'This page is not running in Claude: edits stay in this browser.';
  $('#gd-submit').disabled = same() || state.status === 'submitted';
}

// ---------- adding ----------
$('#gd-task-building').replaceChildren(...buildingList.map(b => h('option', { value: b.id }, b.name)));
$('#gd-task-job').replaceChildren(...jobList.map(j => h('option', { value: j.id }, j.name)));
$('#gd-task-kind').addEventListener('change', e => { $('#gd-task-building').hidden = e.target.value !== 'build'; $('#gd-task-job').hidden = e.target.value !== 'job'; });
$('#gd-add-task').addEventListener('click', () => {
  const kind = $('#gd-task-kind').value, building = $('#gd-task-building').value, job = $('#gd-task-job').value;
  const next = addTask(state.draft, { kind, building, job }), task = next.tasks.at(-1);
  task.title.cs = kind === 'build' ? `Postav: ${buildingName(building)}` : kind === 'job' ? `Přiděl práci: ${jobName(job)}` : kind === 'king' ? 'Vyber krále' : 'Najdi vodu';
  changed(next);
});
$('#gd-add-tip').addEventListener('click', () => { const text = $('#gd-new-tip').value.trim(); if (!text) return; $('#gd-new-tip').value = ''; changed(addTip(state.draft, text)); });
$('#gd-gap').addEventListener('change', e => changed({ ...state.draft, tipGap: Number(e.target.value) }));
$('#gd-submit').addEventListener('click', submit);
$('#gd-reset').addEventListener('click', reset);

// ---------- loading ----------
function adopt(doc) {
  if (!doc?.intro || !doc?.tasks || !doc?.tips) return;
  state.draft = { intro: doc.intro, tasks: doc.tasks, tips: doc.tips, tipGap: doc.tipGap ?? game.tipGap };
  state.status = doc.status; state.at = doc.at; state.by = doc.by;
}
try { adopt(JSON.parse(localStorage.getItem(STORAGE) ?? 'null')); } catch { /* nothing kept */ }
async function connectShared() {
  const claude = window.claude; if (typeof claude?.use !== 'function') return;
  const [db, user] = await Promise.all([claude.use('db').catch(() => null), claude.use('user').catch(() => null)]);
  if (!db) return;
  shared.db = db; shared.uid = user ? await user.id().catch(() => null) : null;
  db.doc(GUIDE_DOC).onSnapshot(snap => {
    shared.mode = 'shared';
    if (snap.exists) { const doc = snap.data(); if (doc.at !== state.at) adopt(doc); } else { state.draft = structuredClone(game); state.status = null; }
    if (!document.activeElement?.closest?.('.gd-list')) render();
  }, error => { if (error?.code !== 'revoked') showAlert(`The guide stopped updating (${error?.code ?? 'unavailable'}). Reload the page.`); });
}
$('#gd-version').textContent = `From the game's code · game v${pkg.version} · ${game.tasks.length} tasks · ${game.tips.length} tips`;
render();
connectShared();
window.guideStudio = { draft: () => structuredClone(state.draft), game: () => structuredClone(game), mode: () => shared.mode };
