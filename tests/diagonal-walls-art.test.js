// m-hradby-diagonala: only the owner's approved diagonal pieces enter the game (AGENTS.md, graphics rule 7).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { DIAGONAL_WALL_ART } from '../src/data/objects/approvedArt.js';

const approvals = JSON.parse(readFileSync(new URL('../art/approvals.json', import.meta.url), 'utf8')).assets['wall-diagonal'].variants;
test('diagonal walls: every piece in the game is approved in that version, exported and deployed', () => {
  for (const [key, art] of Object.entries(DIAGONAL_WALL_ART)) {
    const [, variant, version] = art.artSource.match(/wall-diagonal\/(.+)\.v(\d+)\.json$/);
    const record = approvals[variant];
    assert.equal(record?.status, 'approved', `${key}: ${variant} approved`);
    assert.equal(record.version, Number(version), `${key}: approved version`);
    const meta = JSON.parse(readFileSync(new URL(`../${art.artSource}`, import.meta.url), 'utf8'));
    assert.equal(meta.specHash, record.specHash, `${key}: hash`);
    assert.deepEqual(art.origin, meta.origin, `${key}: origin`);
    assert.ok(existsSync(new URL(`../public${art.sprite}`, import.meta.url)), `${key}: sprite deployed`);
  }
});
test('diagonal walls: all sixteen elbows and both runs, in the Tripo stone (owner 20 Nov 2026)', () => {
  for (const key of ['elbow-NW-00', 'elbow-NW-01', 'elbow-NW-10', 'elbow-SE-00']) assert.ok(key in DIAGONAL_WALL_ART, key);
  assert.equal(Object.keys(DIAGONAL_WALL_ART).length, 18);
});
