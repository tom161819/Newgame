// #214 (AR-4 of #210): pure logic shared by the asset-review intake workflow and the CI approval guard.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { GENERATORS } from '../studio/src/generators/index.js';
import { buildCatalog } from '../studio/src/lib/specs.js';

export const OWNER = 'tom161819';
export const DECISIONS = Object.freeze(['approved', 'revision-requested', 'rejected', 'review', 'draft', 'blocked']);

// Current Studio catalog (variant id → {assetId, version, hash}) straight from the repository files.
export function loadCatalog(root) {
  const json = file => JSON.parse(readFileSync(path.join(root, file), 'utf8')), specs = [];
  for (const category of readdirSync(path.join(root, 'art/assets'))) for (const id of readdirSync(path.join(root, 'art/assets', category))) { const file = path.join('art/assets', category, id, 'asset.json'); if (existsSync(path.join(root, file))) specs.push(json(file)); }
  const catalog = buildCatalog({ specs, generators: GENERATORS, style: json('art/style-guide.json') }).studio, variants = new Map();
  for (const asset of catalog) for (const v of asset.variants) variants.set(v.id, { assetId: asset.id, version: v.version, hash: v.hash });
  return variants;
}

// The fenced ```asset-review block written by the Studio's Submit review.
export function parsePayload(body) {
  const match = String(body ?? '').match(/```asset-review\s*\n([\s\S]*?)\n```/);
  if (!match) return { error: 'No ```asset-review block found. Submit the review from the Asset Studio (Submit review).' };
  let data; try { data = JSON.parse(match[1]); } catch (e) { return { error: `The asset-review block is not valid JSON (${e.message}).` }; }
  if (data?.kind !== 'asset-review' || data.schema !== 1 || typeof data.submissionId !== 'string' || !/^ar-\d{12}-[0-9a-f]{8}$/.test(data.submissionId) || !Array.isArray(data.items) || !data.items.length) return { error: 'The asset-review block is incomplete (kind, schema 1, submissionId, items).' };
  for (const [i, item] of data.items.entries()) {
    if (typeof item.assetId !== 'string' || typeof item.variantId !== 'string' || !Number.isInteger(item.version) || !/^[0-9a-f]{8}$/.test(item.specHash ?? '') || !(item.decision === null || DECISIONS.includes(item.decision))) return { error: `Item ${i + 1} is incomplete (assetId, variantId, version, specHash, decision).` };
    if (item.decision === 'revision-requested' && !String(item.comment ?? '').trim()) return { error: `Item ${i + 1} (${item.variantId}) requests a revision without a comment.` };
  }
  return { payload: data };
}

// Each decision against the current main: ok, stale (another version/hash is current now) or unknown variant.
export function checkItems(payload, variants) {
  return payload.items.map(item => {
    const current = variants.get(item.variantId);
    if (!current || current.assetId !== item.assetId) return { ...item, check: 'unknown', note: 'This variant does not exist on main.' };
    if (current.version !== item.version || current.hash !== item.specHash) return { ...item, check: 'stale', note: `Main has v${current.version} #${current.hash}; this decision was made on v${item.version} #${item.specHash}. Review the current version again.` };
    return { ...item, check: 'ok' };
  });
}

// Only an issue the owner opened in the browser (the Studio's pre-filled Submit) can carry decisions. Claude's GitHub
// tools act under the owner's login too, but GitHub marks those issues with performed_via_github_app; an edited review
// block could also have been changed by an agent, so it has to be submitted again.
export function authorProblem(issue, { edited = false } = {}) {
  if (issue?.user?.login !== OWNER) return `opened by ${issue?.user?.login ?? 'unknown'}, not the owner`;
  if (issue.performed_via_github_app) return `opened through the ${issue.performed_via_github_app.slug ?? 'unknown'} GitHub app (an agent), not by the owner in the browser`;
  if (edited) return 'its review block was edited after it was opened; submit the review again from the Studio';
  return null;
}

const LABEL = { approved: 'Approved', 'revision-requested': 'Revision requested', rejected: 'Rejected', review: 'Back to review', draft: 'Draft', blocked: 'Blocked' };
export function summaryComment({ payload, items, author, problem = author === OWNER ? null : `opened by ${author}, not the owner`, superseded = [] }) {
  const ok = items.filter(i => i.check === 'ok'), bad = items.filter(i => i.check !== 'ok'), count = d => ok.filter(i => i.decision === d).length;
  const row = i => `| \`${i.variantId}\` | v${i.version} | ${i.decision ? LABEL[i.decision] : '—'}${i.preferred ? ' ★' : ''} | ${(i.comment ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')} |`;
  return [
    `### Asset review received: \`${payload.submissionId}\``,
    problem ? `⚠️ This review was ${problem}: **ignored** for approvals.` : `Submitted by the owner (@${OWNER}), so Claude acts on it.`,
    '', `**Approved ${count('approved')} · Revision requested ${count('revision-requested')} · Rejected ${count('rejected')}**`, '',
    ...(ok.length ? ['| Variant | Version | Decision | Comment |', '|---|---|---|---|', ...ok.map(row), ''] : []),
    ...(bad.length ? ['**Not applicable on main** (decide again in the Studio):', ...bad.map(i => `- \`${i.variantId}\` v${i.version}: ${i.note}`), ''] : []),
    ...(superseded.length ? [`Supersedes the older open review${superseded.length === 1 ? '' : 's'} ${superseded.map(n => `#${n}`).join(', ')}.`, ''] : []),
    'Next: Claude records the decisions in `art/approvals.json` through a pull request, revises the variants with requested revisions as new versions, and integrates approved art into the game in a separate PR.',
  ].join('\n');
}

// Older open reviews that this one replaces: every variant they decided is decided again here.
export function supersededBy(payload, openReviews) {
  const mine = new Set(payload.items.map(i => i.variantId));
  return openReviews.filter(r => r.submissionId !== payload.submissionId && r.items.length && r.items.every(i => mine.has(i.variantId))).map(r => r.issue);
}

// CI guard: every variant that becomes (or stays newly) approved in art/approvals.json must name an owner review
// issue whose payload approves exactly that variant, version and hash. Returns the list of checks to make remotely.
export function approvalsNeedingProof(base, head) {
  const out = [];
  for (const [assetId, asset] of Object.entries(head.assets ?? {})) for (const [variantId, record] of Object.entries(asset.variants ?? {})) {
    if (record.status !== 'approved') continue;
    const before = base.assets?.[assetId]?.variants?.[variantId];
    if (before?.status === 'approved' && before.version === record.version && before.specHash === record.specHash) continue; // unchanged approval
    out.push({ assetId, variantId, version: record.version, specHash: record.specHash, review: record.review ?? null });
  }
  return out;
}
export function proofProblem(need, issue) {
  if (!need.review) return `${need.variantId} v${need.version}: approved without "review": {issue, submissionId}. Only the owner's Submit review can approve.`;
  if (!issue) return `${need.variantId}: review issue #${need.review.issue} not found.`;
  const who = authorProblem(issue, { edited: !!issue.lastEditedAt }); if (who) return `${need.variantId}: review issue #${need.review.issue} was ${who}.`;
  const { payload, error } = parsePayload(issue.body);
  if (error) return `${need.variantId}: review issue #${need.review.issue}: ${error}`;
  if (payload.submissionId !== need.review.submissionId) return `${need.variantId}: issue #${need.review.issue} holds submission ${payload.submissionId}, not ${need.review.submissionId}.`;
  if (!payload.items.some(i => i.variantId === need.variantId && i.version === need.version && i.specHash === need.specHash && i.decision === 'approved')) return `${need.variantId} v${need.version} #${need.specHash}: the owner's review #${need.review.issue} does not approve exactly this version.`;
  return null;
}
