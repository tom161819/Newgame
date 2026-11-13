import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { STATUSES, validateManifest, reviewState, updateLocal, buildExportManifest, nextRevision, gameArtSources, inGame, awaitsApproval, emptyManifest } from '../studio/src/lib/approvals.js';
import { objectDefinitions } from '../src/data/objects/index.js';
import { withApprovedArt, APPROVED_VILLAGER_ART } from '../src/data/objects/approvedArt.js';

const variant = { id: 'ruin-a', version: 1, hash: 'aaaaaaaa' }, at = '2026-11-06T18:00:00.000Z';
const repo = { schema: 1, assets: { ruin: { preferred: null, variants: { 'ruin-a': { status: 'review', version: 1, specHash: 'aaaaaaaa', note: '', updatedAt: at } } } } };

test('#211 the committed approvals manifest stays valid under the extended rules (additive change, no migration)', () => {
  const manifest = JSON.parse(readFileSync(new URL('../art/approvals.json', import.meta.url)));
  assert.deepEqual(validateManifest(manifest), []);
  assert.ok(Object.values(manifest.assets).flatMap(a => Object.values(a.variants)).every(v => STATUSES.includes(v.status)));
});

test('#211 Request Revision needs a comment tied to the exact version; Reject and Blocked are valid decisions', () => {
  assert.throws(() => updateLocal(emptyManifest(), { assetId: 'ruin', variant, status: 'revision-requested' }, at), /needs a comment/);
  const local = updateLocal(emptyManifest(), { assetId: 'ruin', variant, status: 'revision-requested', comment: 'More missing stones, broken top edge, rubble at the foot.' }, at);
  const record = local.assets.ruin.variants['ruin-a'];
  assert.equal(record.status, 'revision-requested');assert.deepEqual(record.comments, [{ version: 1, text: 'More missing stones, broken top edge, rubble at the foot.', at }]);
  const state = reviewState({ repo, local, assetId: 'ruin', variant });assert.equal(state.revisionRequested, true);assert.equal(state.awaitsOwner, false, 'now it waits for Claude, not the owner');
  const rejected = updateLocal(emptyManifest(), { assetId: 'ruin', variant, status: 'rejected' }, at);
  const rs = reviewState({ repo, local: rejected, assetId: 'ruin', variant });assert.equal(rs.rejected, true);assert.equal(awaitsApproval(rs), false, 'a rejected variant no longer waits for approval');
  assert.deepEqual(validateManifest({ schema: 1, assets: { ruin: { variants: { 'ruin-a': { status: 'revision-requested', version: 1, specHash: 'aaaaaaaa' } } } } }), ['ruin/ruin-a: a revision request needs a comment for version 1.']);
});

test('#211 a revision is a new version in review: history keeps the old one, approval never carries over', () => {
  const approved = { status: 'approved', version: 1, specHash: 'aaaaaaaa', note: '', updatedAt: at, approvedAt: at, comments: [{ version: 1, text: 'fine', at }] };
  const v2 = nextRevision(approved, { version: 2, specHash: 'bbbbbbbb' }, at);
  assert.equal(v2.status, 'review');assert.equal(v2.approvedAt, undefined);assert.deepEqual(v2.history, [{ version: 1, specHash: 'aaaaaaaa', status: 'approved', at }]);
  const v3 = nextRevision(v2, { version: 3, specHash: 'cccccccc' }, at);assert.equal(v3.history.length, 2, 'any number of revisions');
  assert.throws(() => nextRevision(v3, { version: 3, specHash: 'dddddddd' }), /greater than 3/);
  assert.deepEqual(validateManifest({ schema: 1, assets: { ruin: { variants: { 'ruin-a': v3 } } } }), []);
  // The Studio shows an approval of an older version as outdated, never as approved.
  const state = reviewState({ repo: { schema: 1, assets: { ruin: { variants: { 'ruin-a': approved } } } }, local: emptyManifest(), assetId: 'ruin', variant: { ...variant, version: 2, hash: 'bbbbbbbb' } });
  assert.equal(state.outdated, true);assert.equal(state.awaitsOwner, true);
  assert.ok(validateManifest({ schema: 1, assets: { ruin: { variants: { 'ruin-a': { ...v3, history: [{ version: 5, specHash: 'aaaaaaaa', status: 'review', at }] } } } } }).some(e => /older than version 3/.test(e)));
});

test('#211 export keeps repository comments and history and appends local comments once', () => {
  const withHistory = { schema: 1, assets: { ruin: { preferred: null, variants: { 'ruin-a': nextRevision({ ...repo.assets.ruin.variants['ruin-a'], comments: [{ version: 1, text: 'old', at }] }, { version: 2, specHash: 'bbbbbbbb' }, at) } } } };
  const v = { ...variant, version: 2, hash: 'bbbbbbbb' };
  const local = updateLocal(emptyManifest(), { assetId: 'ruin', variant: v, status: 'approved', comment: 'Now it is right.' }, '2026-11-06T19:00:00.000Z');
  const out = buildExportManifest({ repo: withHistory, local, catalog: [{ id: 'ruin', variants: [v] }] }), record = out.assets.ruin.variants['ruin-a'];
  assert.deepEqual(record.comments.map(c => c.text), ['old', 'Now it is right.']);assert.equal(record.history.length, 1);assert.equal(record.status, 'approved');
  assert.deepEqual(buildExportManifest({ repo: out, local, catalog: [{ id: 'ruin', variants: [v] }] }).assets.ruin.variants['ruin-a'].comments.length, 2, 'no duplicate on a repeated export');
  assert.ok(validateManifest({ ...out, assets: { ...out.assets } }).length === 0);
});

test('#211 In Game is derived from the game data: exactly the exported sprite of the current version', () => {
  const sources = gameArtSources({ definitions: objectDefinitions.map(withApprovedArt), villagerArt: APPROVED_VILLAGER_ART });
  assert.equal(inGame({ spriteMeta: 'art/sprites/windmill/windmill-gpt-0.v1.json' }, sources), true, 'the approved GPT Mill is in the game (owner 13 Nov 2026)');
  assert.equal(inGame({ spriteMeta: 'art/sprites/windmill/windmill-tower.v1.json' }, sources), false, 'the replaced tower mill is not');
  assert.equal(inGame({ spriteMeta: 'art/sprites/windmill/windmill-gpt-0.v2.json' }, sources), false, 'a newer version is not in the game until integrated');
  assert.equal(inGame({ spriteMeta: 'art/sprites/miner/miner-male.v1.json' }, sources), true, 'villager looks count');
  assert.equal(inGame({ spriteMeta: 'art/sprites/builders-workshop/builders-workshop-open-shed.v1.json' }, sources), false, 'concepts in review are not in the game');
});
