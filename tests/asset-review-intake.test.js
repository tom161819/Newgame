import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePayload, checkItems, summaryComment, supersededBy, loadCatalog, approvalsNeedingProof, proofProblem, OWNER } from '../scripts/asset-review-lib.mjs';
import { buildSubmission, issueBody } from '../studio/src/lib/reviewSubmit.js';
import { updateLocal, emptyManifest } from '../studio/src/lib/approvals.js';

const root = fileURLToPath(new URL('../', import.meta.url)), variants = loadCatalog(root);
const real = id => ({ id, ...variants.get(id) });
function submission(now = '2026-11-06T19:00:00.000Z') {
  const shed = real('builders-workshop-gpt-wood-0'), awning = real('builders-workshop-gpt-stone-0');
  const catalog = [{ id: 'builders-workshop', variants: [shed, awning].map(v => ({ id: v.id, version: v.version, hash: v.hash })) }];
  let local = updateLocal(emptyManifest(), { assetId: 'builders-workshop', variant: catalog[0].variants[0], status: 'revision-requested', comment: 'Wider roof, more beams.' }, now);
  local = updateLocal(local, { assetId: 'builders-workshop', variant: catalog[0].variants[1], status: 'approved' }, now);
  return buildSubmission({ repo: { schema: 1, assets: {} }, local, catalog, now });
}

test('#214 the intake reads the Studio payload exactly and rejects broken or comment-less revision requests', () => {
  const s = submission(), { payload } = parsePayload(issueBody(s));
  assert.equal(payload.submissionId, s.submissionId);assert.deepEqual(payload.items, s.items);
  assert.match(parsePayload('no block').error, /No ```asset-review block/);assert.match(parsePayload('```asset-review\n{bad\n```').error, /not valid JSON/);
  const noComment = issueBody({ ...s, items: s.items.map(i => i.decision === 'revision-requested' ? { ...i, comment: null } : i) });assert.match(parsePayload(noComment).error, /without a comment/);
});

test('#214 decisions are checked against main: current ones apply, a stale version or unknown variant does not', () => {
  const { payload } = parsePayload(issueBody(submission()));
  assert.ok(checkItems(payload, variants).every(i => i.check === 'ok'));
  const stale = checkItems({ ...payload, items: [{ ...payload.items[0], version: 0 + payload.items[0].version, specHash: '00000000' }, { ...payload.items[1], variantId: 'no-such-variant' }] }, variants);
  assert.deepEqual(stale.map(i => i.check), ['stale', 'unknown']);assert.match(stale[0].note, /Review the current version again/);
  const comment = summaryComment({ payload, items: stale, author: OWNER });assert.match(comment, /Not applicable on main/);
  assert.match(summaryComment({ payload, items: checkItems(payload, variants), author: 'stranger' }), /not the owner: \*\*ignored\*\*/);
  assert.match(summaryComment({ payload, items: checkItems(payload, variants), author: OWNER, superseded: [301] }), /Supersedes the older open review #301/);
});

test('#214 a new review supersedes older open reviews of the same variants only (no duplicates)', () => {
  const { payload } = parsePayload(issueBody(submission()));
  const older = [{ issue: 301, submissionId: 'ar-202611061800-aaaaaaaa', items: [{ variantId: payload.items[0].variantId }] }, { issue: 302, submissionId: 'ar-202611061800-bbbbbbbb', items: [{ variantId: 'other' }] }, { issue: 303, submissionId: payload.submissionId, items: payload.items }];
  assert.deepEqual(supersededBy(payload, older), [301]);
});

test('#214 CI guard: a new approval needs the owner\'s review that approves exactly that version', () => {
  const s = submission(), shed = real('builders-workshop-gpt-stone-0'), issue = { user: { login: OWNER }, body: issueBody(s) };
  const head = { assets: { 'builders-workshop': { variants: { [shed.id]: { status: 'approved', version: shed.version, specHash: shed.hash, review: { issue: 400, submissionId: s.submissionId } } } } } };
  const [need] = approvalsNeedingProof({ assets: {} }, head);assert.equal(need.variantId, shed.id);
  assert.equal(proofProblem(need, issue), null, 'the owner approved exactly this');
  assert.match(proofProblem({ ...need, review: null }, null), /Only the owner's Submit review can approve/);
  assert.match(proofProblem(need, { ...issue, user: { login: 'claude-bot' } }), /not the owner/);
  assert.match(proofProblem({ ...need, specHash: 'deadbeef' }, issue), /does not approve exactly this version/);
  assert.match(proofProblem({ ...need, review: { issue: 400, submissionId: 'ar-202611061900-00000000' } }, issue), /holds submission/);
  // A revision request in the same review never counts as an approval.
  const shedRev = real('builders-workshop-gpt-wood-0');assert.match(proofProblem({ ...need, variantId: shedRev.id, version: shedRev.version, specHash: shedRev.hash }, issue), /does not approve/);
  assert.deepEqual(approvalsNeedingProof(head, head), [], 'an unchanged approval needs nothing new');
});

test('#214 intake dry run on a real event: summary, labels, supersede (no network, no writes)', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'intake-')), s = submission(), event = path.join(dir, 'event.json');
  writeFileSync(event, JSON.stringify({ issue: { number: 500, body: issueBody(s), user: { login: OWNER } }, openReviews: [{ issue: 499, submissionId: 'ar-202611061800-aaaaaaaa', items: s.items.map(i => ({ variantId: i.variantId })) }] }));
  const run = spawnSync(process.execPath, ['scripts/asset-review-intake.mjs', '--dry-run'], { cwd: root, encoding: 'utf8', env: { ...process.env, GITHUB_EVENT_PATH: event, GITHUB_REPOSITORY: 'tom161819/Newgame' } });
  assert.equal(run.status, 0, run.stderr);
  assert.match(run.stdout, /DRY PATCH \/issues\/499/);assert.match(run.stdout, /DRY POST \/issues\/500\/labels .*agent:claude/);assert.match(run.stdout, /Approved 1 · Revision requested 1/);
});
