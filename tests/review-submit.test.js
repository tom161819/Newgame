import test from 'node:test';
import assert from 'node:assert/strict';
import { emptyManifest, updateLocal } from '../studio/src/lib/approvals.js';
import { buildSubmission, reviewItems, issueBody, issueUrl, confirmReceipt, upsertOutbox, readOutbox, writeOutbox, MAX_URL, OUTBOX_KEY } from '../studio/src/lib/reviewSubmit.js';

const at = '2026-11-06T19:00:00.000Z';
const catalog = [{ id: 'ruin', variants: [{ id: 'ruin-a', version: 1, hash: 'aaaaaaaa' }, { id: 'ruin-b', version: 2, hash: 'bbbbbbbb' }, { id: 'ruin-c', version: 1, hash: 'cccccccc' }] }];
const repo = { schema: 1, assets: { ruin: { preferred: null, variants: { 'ruin-a': { status: 'review', version: 1, specHash: 'aaaaaaaa', note: '', updatedAt: at } } } } };
function decisions() {
  let local = emptyManifest();
  local = updateLocal(local, { assetId: 'ruin', variant: catalog[0].variants[0], status: 'revision-requested', comment: 'More missing stones and rubble at the foot.' }, at);
  local = updateLocal(local, { assetId: 'ruin', variant: catalog[0].variants[1], status: 'approved' }, at);
  local = updateLocal(local, { assetId: 'ruin', variant: catalog[0].variants[1], preferred: true }, at);
  local = updateLocal(local, { assetId: 'ruin', variant: catalog[0].variants[2], status: 'rejected' }, at);
  return local;
}

test('#213 the submission lists every decision with exact version, hash, comment and preference', () => {
  const items = reviewItems({ repo, local: decisions(), catalog });
  assert.deepEqual(items.map(i => [i.variantId, i.version, i.specHash, i.decision, i.comment, i.preferred]), [
    ['ruin-a', 1, 'aaaaaaaa', 'revision-requested', 'More missing stones and rubble at the foot.', false],
    ['ruin-b', 2, 'bbbbbbbb', 'approved', null, true],
    ['ruin-c', 1, 'cccccccc', 'rejected', null, false]]);
  assert.equal(buildSubmission({ repo, local: emptyManifest(), catalog }), null, 'nothing to send');
  const s = buildSubmission({ repo, local: decisions(), catalog, now: at });
  assert.match(s.submissionId, /^ar-202611061900-[0-9a-f]{8}$/);assert.equal(s.items.length, 3);assert.equal(s.state, 'draft');
  const body = issueBody(s), json = JSON.parse(body.match(/```asset-review\n([\s\S]*?)\n```/)[1]);
  assert.equal(json.submissionId, s.submissionId);assert.deepEqual(json.items, s.items);assert.match(body, /Revision requested 1/);assert.match(body, /More missing stones/);
});

test('#213 a pre-filled issue link with the asset-review label; long reviews fall back to paste', () => {
  const s = buildSubmission({ repo, local: decisions(), catalog, now: at }), link = issueUrl(s);
  assert.equal(link.manual, false);assert.match(link.url, /^https:\/\/github\.com\/tom161819\/Newgame\/issues\/new\?/);
  const params = new URL(link.url).searchParams;assert.equal(params.get('labels'), 'asset-review');assert.equal(params.get('body'), issueBody(s));
  const long = { ...s, items: Array.from({ length: 60 }, (_, i) => ({ ...s.items[0], variantId: `ruin-${i}`, comment: 'x'.repeat(120) })) };
  const fallback = issueUrl(long);assert.equal(fallback.manual, true);assert.ok(fallback.url.length < MAX_URL && !new URL(fallback.url).searchParams.has('body'));
});

test('#213 receipt only counts when GitHub returns the owner\'s issue; failures keep the submission waiting', async () => {
  const s = buildSubmission({ repo, local: decisions(), catalog, now: at });
  const reply = (status, body) => async () => ({ ok: status < 400, status, json: async () => body });
  assert.deepEqual(await confirmReceipt(s, { fetch: reply(200, { items: [{ number: 301, html_url: 'https://github.com/tom161819/Newgame/issues/301', body: `x ${s.submissionId}`, user: { login: 'tom161819' } }] }) }), { state: 'confirmed', issue: 301, url: 'https://github.com/tom161819/Newgame/issues/301', message: 'GitHub confirmed your review as issue #301.' });
  assert.equal((await confirmReceipt(s, { fetch: reply(200, { items: [] }) })).state, 'waiting');
  assert.equal((await confirmReceipt(s, { fetch: reply(200, { items: [{ number: 302, body: s.submissionId, user: { login: 'someone-else' } }] }) })).state, 'not-owner', 'another account cannot approve');
  assert.equal((await confirmReceipt(s, { fetch: reply(403, {}) })).state, 'rate-limited');
  assert.equal((await confirmReceipt(s, { fetch: reply(500, {}) })).state, 'error');
  assert.equal((await confirmReceipt(s, { fetch: async () => { throw new Error('offline'); } })).state, 'offline');
});

test('#213 re-submitting the same decisions reuses the submission (no duplicate issue); the outbox survives reloads', () => {
  const store = new Map(), storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  const first = { ...buildSubmission({ repo, local: decisions(), catalog, now: at }), state: 'waiting' };
  writeOutbox(storage, upsertOutbox(readOutbox(storage), first));
  const again = buildSubmission({ repo, local: decisions(), catalog, now: '2026-11-06T20:00:00.000Z', outbox: readOutbox(storage) });
  assert.equal(again.submissionId, first.submissionId);assert.equal(again.state, 'waiting');
  const changed = updateLocal(decisions(), { assetId: 'ruin', variant: catalog[0].variants[2], status: 'approved' }, at);
  assert.notEqual(buildSubmission({ repo, local: changed, catalog, now: at, outbox: readOutbox(storage) }).submissionId, first.submissionId, 'different decisions → a new submission');
  assert.equal(JSON.parse(store.get(OUTBOX_KEY)).length, 1);assert.ok(!store.get(OUTBOX_KEY).includes('token'));
  assert.deepEqual(readOutbox({ getItem: () => '{bad json' }), [], 'a broken outbox is ignored, not fatal');
});
