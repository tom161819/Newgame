import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewSummary, awaitsApproval, reviewState, updateLocal, emptyManifest } from '../studio/src/lib/approvals.js';
import { filterCatalog } from '../studio/src/lib/specs.js';

const variant = (id, hash = 'h1', version = 1) => ({ id, hash, version });
const asset = (id, variants, extra = {}) => ({ id, name: id, category: 'buildings', source: 'studio', variants, ...extra });
const repo = { schema: 1, updatedAt: null, assets: {
  tower: { preferred: 'tower-a', variants: { 'tower-a': { status: 'approved', version: 1, specHash: 'h1' }, 'tower-b': { status: 'review', version: 1, specHash: 'h1' } } },
  wall: { preferred: 'wall-a', variants: { 'wall-a': { status: 'approved', version: 1, specHash: 'h1' } } },
  old: { preferred: 'old-a', variants: { 'old-a': { status: 'approved', version: 1, specHash: 'stale' } } },
} };
const tower = asset('tower', [variant('tower-a'), variant('tower-b')]), wall = asset('wall', [variant('wall-a')]), old = asset('old', [variant('old-a')]), fresh = asset('fresh', [variant('fresh-a')]);
const sprite = { id: 'game-house', name: 'House', category: 'buildings', source: 'game', variants: [] };

test('a variant waits for approval unless it is approved for its current version and spec', () => {
  const local = emptyManifest();
  assert.deepEqual(reviewSummary({ repo, local, asset: tower }), { pending: ['tower-b'], approved: 1, total: 2 }, 'mixed asset: the approved variant is not pending');
  assert.deepEqual(reviewSummary({ repo, local, asset: wall }).pending, []);
  assert.deepEqual(reviewSummary({ repo, local, asset: old }).pending, ['old-a'], 'an approval for an older spec is outdated and waits again');
  assert.deepEqual(reviewSummary({ repo, local, asset: fresh }).pending, ['fresh-a'], 'no record = draft = waiting');
  assert.equal(awaitsApproval(reviewState({ repo, local, assetId: 'wall', variant: variant('wall-a') })), false);
});

test('local edits in this browser count: approving here removes the variant from the queue, sending back to review adds it', () => {
  let local = updateLocal(emptyManifest(), { assetId: 'tower', variant: variant('tower-b'), status: 'approved' });
  assert.deepEqual(reviewSummary({ repo, local, asset: tower }).pending, []);
  local = updateLocal(local, { assetId: 'wall', variant: variant('wall-a'), status: 'review' });
  assert.deepEqual(reviewSummary({ repo, local, asset: wall }).pending, ['wall-a']);
});

test('Needs review hides game sprites and fully approved designs and combines with category, search and source', () => {
  const local = emptyManifest(), isPending = item => reviewSummary({ repo, local, asset: item }).pending.length > 0, all = [tower, wall, old, fresh, sprite];
  assert.deepEqual(filterCatalog(all, { pendingOnly: true, isPending }).map(i => i.id), ['tower', 'old', 'fresh']);
  assert.deepEqual(filterCatalog(all).map(i => i.id), all.map(i => i.id), 'the default shows everything');
  assert.deepEqual(filterCatalog(all, { pendingOnly: true, isPending, query: 'tow' }).map(i => i.id), ['tower']);
  assert.deepEqual(filterCatalog(all, { pendingOnly: true, isPending, source: 'game' }), [], 'In game sprites never wait for approval');
  assert.deepEqual(filterCatalog(all, { pendingOnly: true, isPending, category: 'units' }), []);
});
