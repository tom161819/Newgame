import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp, writeFile, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { emptyManifest, updateLocal, reviewState, validateManifest, pendingChanges } from '../studio/src/lib/approvals.js';
import { REVIEWS, PREFERRED, reviewDocId, preferredDocId, layerFromDocs, docWrites, reviewerIds, takeOver, SHARED_NOTE } from '../studio/src/lib/sharedReview.js';

const NOW = '2026-11-06T22:00:00.000Z', LATER = '2026-11-06T23:00:00.000Z';
const variant = (id, hash = 'a1b2c3d4', version = 1) => ({ id, hash, version });
const repo = { schema: 1, updatedAt: null, assets: { tower: { preferred: 'tower-a', variants: { 'tower-a': { status: 'approved', version: 1, specHash: 'a1b2c3d4', note: '', approvedAt: NOW } } } } };
const catalog = [{ id: 'tower', variants: [{ id: 'tower-a' }, { id: 'tower-b' }] }, { id: 'hall', variants: [{ id: 'hall-a' }] }];
// Apply writes the way the page does, into a plain map of documents.
const applyWrites = (store, writes) => { for (const w of writes) { if (w.data) store.set(w.path, structuredClone(w.data)); else store.delete(w.path); } return store; };
const docsOf = (store, collection) => [...store].filter(([p]) => p.startsWith(`${collection}/`)).map(([, data]) => data);

test('document ids follow the database path grammar', () => {
  assert.equal(reviewDocId('barracks-hall', 'barracks-hall-stone'), 'barracks-hall__barracks-hall-stone');
  assert.equal(reviewDocId('a b/c', 'v?1'), 'a_b_c__v_1');
  assert.equal(preferredDocId('game:castle'), 'game:castle');
});

test('a decision becomes one variant document and the preference its own document, signed by the reviewer id', () => {
  const before = emptyManifest();
  let after = updateLocal(before, { assetId: 'tower', variant: variant('tower-b'), status: 'approved', comment: 'Nice roof', by: 'u1' }, NOW);
  after = updateLocal(after, { assetId: 'tower', variant: variant('tower-b'), preferred: true }, NOW);
  const writes = docWrites(before, after, { by: 'u1', now: NOW });
  assert.deepEqual(writes.map(w => w.path), [`${REVIEWS}/tower__tower-b`, `${PREFERRED}/tower`]);
  assert.equal(writes[0].data.record.status, 'approved');
  assert.equal(writes[0].data.record.decidedBy, 'u1');
  assert.deepEqual(writes[0].data.record.comments.map(c => [c.text, c.by]), [['Nice roof', 'u1']]);
  assert.deepEqual(writes[1].data, { assetId: 'tower', variantId: 'tower-b', by: 'u1', at: NOW });
  assert.deepEqual(validateManifest(after), [], 'decidedBy and comment authors keep the manifest valid');
  assert.deepEqual(docWrites(after, after), [], 'nothing unchanged is written again');
});

test('documents rebuild the same layer for every reviewer, so the Studio shows their decisions', () => {
  const store = new Map();
  let mine = updateLocal(emptyManifest(), { assetId: 'tower', variant: variant('tower-b'), status: 'revision-requested', comment: 'Lower the roof', by: 'u1' }, NOW);
  applyWrites(store, docWrites(emptyManifest(), mine, { by: 'u1', now: NOW }));
  const theirs = layerFromDocs(docsOf(store, REVIEWS), docsOf(store, PREFERRED));
  assert.deepEqual(theirs.assets.tower.variants['tower-b'], mine.assets.tower.variants['tower-b']);
  const state = reviewState({ repo, local: theirs, assetId: 'tower', variant: variant('tower-b') });
  assert.equal(state.effective.status, 'revision-requested');
  assert.ok(state.hasLocalChange, 'shared decisions count as waiting for Claude');
  assert.equal(pendingChanges({ repo, local: theirs, catalog: [{ id: 'tower', variants: [variant('tower-a'), variant('tower-b')] }] }).length, 1);
  assert.deepEqual(reviewerIds(theirs), ['u1']);
  // A second reviewer's later decision on the same variant replaces the record; the comment history is kept.
  const second = updateLocal(theirs, { assetId: 'tower', variant: variant('tower-b'), status: 'approved', by: 'u2' }, LATER);
  applyWrites(store, docWrites(theirs, second, { by: 'u2', now: LATER }));
  const now = layerFromDocs(docsOf(store, REVIEWS), docsOf(store, PREFERRED)).assets.tower.variants['tower-b'];
  assert.equal(now.status, 'approved'); assert.equal(now.decidedBy, 'u2'); assert.equal(now.comments[0].by, 'u1');
});

test('untrusted documents that the Studio could not have written are ignored', () => {
  const layer = layerFromDocs([
    { assetId: 'tower', variantId: 'tower-b', record: { status: 'approved', version: 1, specHash: 'nothex!!' } },
    { assetId: 'tower', variantId: 'tower-c', record: { status: 'owned', version: 1, specHash: 'a1b2c3d4' } },
    { assetId: '', variantId: 'x', record: {} }, null,
    { assetId: 'tower', variantId: 'tower-a', record: { status: 'revision-requested', version: 1, specHash: 'a1b2c3d4' } },
  ], [{ assetId: 'tower', variantId: 42 }, { assetId: 'hall', variantId: null }]);
  assert.equal(layer.assets.tower, undefined, 'invalid records, a revision request without a comment and a bad preference are all dropped');
  assert.equal(layer.assets.hall.preferred, null, 'an explicit "no preference" is kept');
});

test('take-over writes the decisions into the manifest, lists revisions and the documents to delete at the version read', () => {
  const store = new Map();
  let layer = updateLocal(emptyManifest(), { assetId: 'tower', variant: variant('tower-b'), status: 'approved', by: 'u1' }, NOW);
  layer = updateLocal(layer, { assetId: 'tower', variant: variant('tower-b'), preferred: true }, NOW);
  layer = updateLocal(layer, { assetId: 'hall', variant: variant('hall-a'), status: 'revision-requested', comment: 'More windows', by: 'u2' }, NOW);
  layer = updateLocal(layer, { assetId: 'gone', variant: variant('gone-a'), status: 'approved', by: 'u2' }, NOW);
  applyWrites(store, docWrites(emptyManifest(), layer, { now: NOW }));
  const read = collection => [...store].filter(([p]) => p.startsWith(`${collection}/`)).map(([p, data], i) => ({ id: p.split('/')[1], version: i + 3, data }));
  const result = takeOver({ repo, docs: { reviews: read(REVIEWS), preferred: read(PREFERRED) }, catalog, now: LATER });
  assert.deepEqual(validateManifest(result.manifest), []);
  assert.equal(result.manifest.note, SHARED_NOTE);
  assert.equal(result.manifest.assets.tower.preferred, 'tower-b');
  assert.equal(result.manifest.assets.tower.variants['tower-a'].status, 'approved', 'committed records stay');
  assert.equal(result.manifest.assets.tower.variants['tower-b'].decidedBy, 'u1');
  assert.equal(result.manifest.assets.gone, undefined, 'variants no longer in the Studio are not written');
  assert.deepEqual(result.ignored, ['gone__gone-a']);
  assert.deepEqual(result.revisions, [{ assetId: 'hall', variantId: 'hall-a', version: 1, comments: ['More windows'] }]);
  assert.deepEqual(result.decisions.find(d => d.variantId === 'tower-b'), { assetId: 'tower', variantId: 'tower-b', version: 1, from: 'draft', to: 'approved', by: 'u1' });
  assert.equal(result.remove.length, store.size);
  assert.ok(result.remove.every(r => Number.isInteger(r.version) && /^(reviews|preferred)\//.test(r.path)));
});

test('studio:sync writes art/approvals.json from the read documents (dry run leaves it untouched)', async () => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const dir = await mkdtemp(path.join(os.tmpdir(), 'studio-sync-'));
  const before = await readFile(path.join(root, 'art/approvals.json'), 'utf8');
  const committed = JSON.parse(before);
  const [assetId, asset] = Object.entries(committed.assets)[0];
  const [variantId, record] = Object.entries(asset.variants)[0];
  const docs = { reviews: [{ id: reviewDocId(assetId, variantId), version: 7, data: { assetId, variantId, record: { ...record, status: 'rejected', updatedAt: NOW } } }], preferred: [] };
  const file = path.join(dir, 'docs.json');
  await writeFile(file, JSON.stringify(docs));
  const report = JSON.parse(execFileSync(process.execPath, [path.join(root, 'scripts/studio-sync.mjs'), file, '--dry-run'], { encoding: 'utf8' }));
  assert.equal(report.written, false);
  assert.deepEqual(report.remove, [{ path: `${REVIEWS}/${reviewDocId(assetId, variantId)}`, version: 7 }]);
  assert.equal(report.decisions[0].to, 'rejected');
  assert.equal(await readFile(path.join(root, 'art/approvals.json'), 'utf8'), before);
});
