// Guide page (owner 15 Nov 2026): pure helpers for the start guide, Getting started tasks and tips the owner edits in the
// Studio. The game's own data (src/data/guide.js) is the base; a draft is a full copy saved in the Studio database
// (`guide/draft`). Claude applies a submitted draft to src/data/guide.js ("převzít průvodce").
export const GUIDE_DOC = 'guide/draft';
export const TASK_KINDS = Object.freeze(['build', 'job', 'king', 'water']);
const clean = text => ({ cs: String(text?.cs ?? '').trim(), en: String(text?.en ?? '').trim() });
const slug = (value, taken) => { let base = String(value || 'item').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 30) || 'item', id = base, n = 2; while (taken.has(id)) id = `${base}_${n++}`; return id; };

// A plain, editable copy of the game's guide. Event tips without own text take the game's i18n text.
export function draftFromGame(guide, i18n = { cs: {}, en: {} }) {
  return {
    intro: guide.intro.map(step => ({ id: step.id, check: step.check, target: step.target, text: clean(step.text) })),
    tasks: guide.tasks.map(task => ({ id: task.id, kind: task.kind, ...(task.building ? { building: task.building } : {}), ...(task.job ? { job: task.job } : {}), title: clean(task.title), why: clean(task.why) })),
    tips: guide.tips.map(tip => ({ id: tip.id, kind: tip.kind, ...(tip.target !== undefined ? { target: tip.target } : {}), ...(tip.wiki ? { wiki: tip.wiki } : {}), text: tip.text ? clean(tip.text) : { cs: i18n.cs[`tips.${tip.id}`] ?? '', en: i18n.en[`tips.${tip.id}`] ?? '' } })),
    tipGap: guide.tipGap,
  };
}
// The parts that matter for the game (ids, kinds, order, texts, gap); used to tell "same as the game".
export const draftKey = draft => JSON.stringify({ intro: draft.intro, tasks: draft.tasks, tips: draft.tips, tipGap: Number(draft.tipGap) });

export function move(list, index, delta) { const next = [...list], to = index + delta; if (to < 0 || to >= next.length) return next; [next[index], next[to]] = [next[to], next[index]]; return next; }
export function addTask(draft, { kind = 'build', building = '', job = '' } = {}) {
  const taken = new Set(draft.tasks.map(t => t.id)), id = slug(kind === 'build' ? building : kind === 'job' ? job : kind, taken);
  return { ...draft, tasks: [...draft.tasks, { id, kind, ...(kind === 'build' ? { building } : {}), ...(kind === 'job' ? { job } : {}), title: { cs: '', en: '' }, why: { cs: '', en: '' } }] };
}
export function addTip(draft, cs = '') {
  const taken = new Set(draft.tips.map(t => t.id)), id = slug(cs.split(/\s+/).slice(0, 3).join(' ') || 'tip', taken);
  const tip = { id, kind: 'sequence', text: { cs, en: '' } }, lastSequence = draft.tips.map(t => t.kind).lastIndexOf('sequence');
  const tips = [...draft.tips]; tips.splice(lastSequence + 1, 0, tip); return { ...draft, tips };
}

// Problems that stop a submit: empty Czech texts, a build task without a building, a job task without a job.
export function draftProblems(draft, { buildings = new Set(), jobs = new Set() } = {}) {
  const out = [];
  for (const step of draft.intro) if (!step.text.cs) out.push(`Start arrow "${step.id}" has no Czech text.`);
  for (const task of draft.tasks) {
    if (!TASK_KINDS.includes(task.kind)) out.push(`Task "${task.id}" has an unknown kind.`);
    if (task.kind === 'build' && !buildings.has(task.building)) out.push(`Task "${task.id}" needs a building.`);
    if (task.kind === 'job' && !jobs.has(task.job)) out.push(`Task "${task.id}" needs a job.`);
    if (!task.title.cs) out.push(`Task "${task.id}" has no Czech title.`);
  }
  for (const tip of draft.tips) if (!tip.text.cs) out.push(`Tip "${tip.id}" has no Czech text.`);
  if (!(Number(draft.tipGap) >= 10 && Number(draft.tipGap) <= 3600)) out.push('The gap between tips must be 10–3600 seconds.');
  return out;
}
