// #213 (AR-3 of #210) Submit Review: the owner's local decisions become one GitHub issue, without any token in the
// browser. The Studio opens a pre-filled "new issue" page; the owner confirms it on GitHub (one click, signed in);
// the Studio then confirms receipt through the public GitHub API by the submission id. Until GitHub confirms, the
// submission stays "waiting" and every local decision is kept. Pure functions here; main.js wires the UI.
import { pendingChanges } from './approvals.js';

export const REVIEW_REPO = Object.freeze({ owner: 'tom161819', name: 'Newgame' });
export const SUBMISSION_SCHEMA = 1;
export const OUTBOX_KEY = 'asset-studio.review-outbox.v1';
export const MAX_URL = 7600; // GitHub accepts about 8 kB in a new-issue URL; longer bodies are pasted by hand.
const LABELS = { approved: 'Approved', 'revision-requested': 'Revision requested', rejected: 'Rejected', review: 'Back to review', draft: 'Draft', blocked: 'Blocked' };

// Stable fingerprint, so re-submitting the same decisions reuses the same submission (no duplicate issue).
export function fingerprint(value) { const text = JSON.stringify(value); let h = 2166136261; for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0'); }

export function reviewItems({ repo, local, catalog }) {
  const items = [];
  for (const change of pendingChanges({ repo, local, catalog })) {
    const asset = catalog.find(a => a.id === change.assetId), variant = asset?.variants.find(v => v.id === change.variantId); if (!variant) continue;
    const record = local.assets?.[asset.id]?.variants?.[variant.id], comment = [...(record?.comments ?? [])].reverse().find(c => c.version === variant.version)?.text ?? null;
    const existing = items.find(i => i.variantId === variant.id);
    if (change.preferred) { if (existing) existing.preferred = true; else items.push({ assetId: asset.id, variantId: variant.id, version: variant.version, specHash: variant.hash, decision: null, comment: null, preferred: true }); continue; }
    const item = { assetId: asset.id, variantId: variant.id, version: variant.version, specHash: variant.hash, decision: change.to, comment, preferred: existing?.preferred ?? false };
    if (existing) Object.assign(existing, item); else items.push(item);
  }
  return items.sort((a, b) => a.assetId.localeCompare(b.assetId) || a.variantId.localeCompare(b.variantId));
}

export function buildSubmission({ repo, local, catalog, now = new Date().toISOString(), outbox = [] }) {
  const items = reviewItems({ repo, local, catalog }); if (!items.length) return null;
  const itemsHash = fingerprint(items), baseManifest = fingerprint(repo);
  // Same decisions as an earlier, still open submission: reuse it instead of creating another issue.
  const earlier = outbox.find(s => s.itemsHash === itemsHash && s.state !== 'superseded');
  if (earlier) return earlier;
  const submissionId = `ar-${now.slice(0, 16).replace(/\D/g, '')}-${itemsHash}`;
  return { schema: SUBMISSION_SCHEMA, kind: 'asset-review', submissionId, createdAt: now, baseManifest, itemsHash, items, state: 'draft' };
}

export function groups(submission) {
  const by = decision => submission.items.filter(i => i.decision === decision);
  return { approved: by('approved'), revision: by('revision-requested'), rejected: by('rejected'), other: submission.items.filter(i => i.decision && !['approved', 'revision-requested', 'rejected'].includes(i.decision)), preferred: submission.items.filter(i => i.preferred) };
}

export function issueTitle(submission) {
  const assets = [...new Set(submission.items.map(i => i.assetId))];
  return `Asset review: ${assets.slice(0, 3).join(', ')}${assets.length > 3 ? ` +${assets.length - 3}` : ''} (${submission.submissionId})`;
}
export function issueBody(submission) {
  const g = groups(submission), line = i => `| \`${i.assetId}\` | \`${i.variantId}\` | v${i.version} · \`${i.specHash}\` | ${i.decision ? LABELS[i.decision] ?? i.decision : '—'}${i.preferred ? ' ★' : ''} | ${i.comment ? i.comment.replace(/\|/g, '\\|').replace(/\n/g, ' ') : ''} |`;
  const payload = { schema: submission.schema, kind: submission.kind, submissionId: submission.submissionId, createdAt: submission.createdAt, baseManifest: submission.baseManifest, items: submission.items };
  return [
    `Asset Studio review submitted by the owner (#210). Approved ${g.approved.length} · Revision requested ${g.revision.length} · Rejected ${g.rejected.length} · Preferred ${g.preferred.length}.`,
    '', '| Asset | Variant | Version | Decision | Comment |', '|---|---|---|---|---|', ...submission.items.map(line), '',
    'Machine-readable decisions (do not edit):', '', '```asset-review', JSON.stringify(payload, null, 1), '```',
  ].join('\n');
}
export function issueUrl(submission, { repo = REVIEW_REPO } = {}) {
  const base = `https://github.com/${repo.owner}/${repo.name}/issues/new`, params = new URLSearchParams({ title: issueTitle(submission), labels: 'asset-review', body: issueBody(submission) });
  const full = `${base}?${params}`;
  if (full.length <= MAX_URL) return { url: full, manual: false };
  // Too long for a URL: open the form with title and label, the body is copied and pasted by hand.
  return { url: `${base}?${new URLSearchParams({ title: issueTitle(submission), labels: 'asset-review' })}`, manual: true };
}

// Receipt check through the public search API (no token). Only an issue by the repository owner counts.
export async function confirmReceipt(submission, { fetch: get = globalThis.fetch, repo = REVIEW_REPO } = {}) {
  let response;
  try { response = await get(`https://api.github.com/search/issues?q=${encodeURIComponent(`"${submission.submissionId}" repo:${repo.owner}/${repo.name} in:body is:issue`)}`, { headers: { Accept: 'application/vnd.github+json' } }); }
  catch (error) { return { state: 'offline', message: `GitHub could not be reached (${error.message}). Your decisions stay in this browser; check again later.` }; }
  if (response.status === 403 || response.status === 429) return { state: 'rate-limited', message: 'GitHub is limiting checks right now. Your decisions are safe; check again in a minute.' };
  if (!response.ok) return { state: 'error', message: `GitHub answered ${response.status}. Your decisions stay in this browser.` };
  const data = await response.json(), issue = (data.items ?? []).find(i => String(i.body ?? '').includes(submission.submissionId));
  if (!issue) return { state: 'waiting', message: 'GitHub has not shown the issue yet. Confirm it on the GitHub page that opened, then check again (search can take up to a minute).' };
  if (issue.user?.login !== repo.owner) return { state: 'not-owner', message: `Issue #${issue.number} was opened by ${issue.user?.login}, not the owner, so it does not count as your review.`, issue: issue.number };
  return { state: 'confirmed', issue: issue.number, url: issue.html_url, message: `GitHub confirmed your review as issue #${issue.number}.` };
}

// Outbox in localStorage: submissions with their state; never holds a token.
export function readOutbox(storage) { try { const list = JSON.parse(storage?.getItem(OUTBOX_KEY) ?? '[]'); return Array.isArray(list) ? list : []; } catch { return []; } }
export function writeOutbox(storage, list) { try { storage?.setItem(OUTBOX_KEY, JSON.stringify(list.slice(-20))); return true; } catch { return false; } }
export function upsertOutbox(list, submission) { const next = list.filter(s => s.submissionId !== submission.submissionId); next.push(submission); return next; }
