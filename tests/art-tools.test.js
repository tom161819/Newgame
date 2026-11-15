import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reviseSpec, reviseRecord, integrationProblems, buildingArtEntry, setBuildingArt } from '../scripts/art-tools-lib.mjs';
import { validateManifest } from '../studio/src/lib/approvals.js';
import { objectDefinitions } from '../src/data/objects/index.js';

const json = file => JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')), at = '2026-11-06T20:00:00.000Z';

test('#215 art:revise bumps one variant and restarts its review; the old version stays in history', () => {
  const spec = json('art/assets/buildings/builders-workshop/asset.json'), approvals = json('art/approvals.json');
  const revised = reviseSpec(spec, 'builders-workshop-gpt-wood-0');
  assert.equal(revised.variants.find(v => v.id === 'builders-workshop-gpt-wood-0').version, 2);assert.equal(revised.variants.find(v => v.id === 'builders-workshop-gpt-stone-0').version, 1, 'only that variant');
  const next = reviseRecord(approvals, 'builders-workshop', 'builders-workshop-gpt-wood-0', { version: 2, specHash: '12345678' }, at), record = next.assets['builders-workshop'].variants['builders-workshop-gpt-wood-0'];
  assert.equal(record.status, 'review');assert.equal(record.version, 2);assert.equal(record.history.at(-1).version, 1);assert.deepEqual(validateManifest(next), []);
  assert.throws(() => reviseSpec(spec, 'nope'), /no variant nope/);
});

test('#215 art:integrate only takes the owner-approved, current, matching export', () => {
  const meta = json('art/sprites/builders-workshop/builders-workshop-gpt-wood-0.v1.json'), variant = { id: 'builders-workshop-gpt-wood-0', version: 1, hash: meta.specHash };
  const definition = { id: 'builder_workshop', category: 'building', width: 3, height: 3 };
  const approved = { status: 'approved', version: 1, specHash: meta.specHash, review: { issue: 300, submissionId: 'ar-202611062000-aaaaaaaa' } };
  assert.deepEqual(integrationProblems({ record: approved, meta, variant, definition }), []);
  assert.match(integrationProblems({ record: { ...approved, status: 'review' }, meta, variant, definition })[0], /not approved/);
  assert.match(integrationProblems({ record: { ...approved, review: undefined }, meta, variant, definition })[0], /no owner review/);
  assert.match(integrationProblems({ record: { ...approved, specHash: 'ffffffff' }, meta, variant, definition })[0], /approval is for v1 #ffffffff/);
  assert.match(integrationProblems({ record: approved, meta, variant, definition: { ...definition, width: 2, height: 2 } })[0], /Open a technical issue to fix the art; do not change the building/);
  assert.match(integrationProblems({ record: approved, meta: { ...meta, version: 2 }, variant, definition })[0], /run npm run studio:export/);
});

test('#215 art:integrate writes exactly the approved export into APPROVED_BUILDING_ART (insert or replace, nothing else)', () => {
  const source = readFileSync(new URL('../src/data/objects/approvedArt.js', import.meta.url), 'utf8');
  const meta = json('art/sprites/windmill/windmill-gpt-0.v1.json'), entry = buildingArtEntry({ gameId: 'mill', file: 'windmill-gpt-0.v1.png', meta });
  assert.equal(entry.sprite, '/assets/buildings/mill/windmill-gpt-0.v1.png');assert.equal(entry.artSource, 'art/sprites/windmill/windmill-gpt-0.v1.json');assert.deepEqual(entry.origin, meta.baseOrigin);
  const added = setBuildingArt(source, 'art_tools_probe', { sprite: '/assets/buildings/art_tools_probe/x.v1.png', artSource: 'art/sprites/x/x.v1.json', origin: { x: 0.5, y: 0.9 }, visualHeight: 80 });
  assert.equal(added.split('\n').length, source.split('\n').length + 1, 'one new line');assert.match(added, /  art_tools_probe:\{"sprite":"\/assets\/buildings\/art_tools_probe\/x\.v1\.png"/);
  const replaced = setBuildingArt(added, 'art_tools_probe', { sprite: '/assets/buildings/art_tools_probe/x.v2.png', artSource: 'art/sprites/x/x.v2.json', origin: { x: 0.5, y: 0.9 }, visualHeight: 80 });
  assert.equal(replaced.split('\n').length, added.split('\n').length, 'replaced in place');assert.doesNotMatch(replaced, /x\.v1\.png/);
  assert.ok(objectDefinitions.some(d => d.id === 'mill'));
});
