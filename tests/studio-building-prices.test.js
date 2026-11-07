import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { normalizeProposals, planPriceSync } from '../scripts/prices-sync-lib.mjs';
import { gameBuildings, priceDiff, setAmount, addResource, removeResource, costErrorText, proposalDoc, proposalsFrom, proposalsJson, priceDocId } from '../studio/src/lib/buildingPrices.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const table = gameBuildings();
const all = table.categories.flatMap(c => c.buildings);

test('Buildings in game lists every building of the construction menu with the price from the game code', () => {
  assert.equal(all.length, objectRegistry.buildables().length);
  assert.equal(table.count, all.length);
  for (const b of all) {
    assert.deepEqual(b.cost, objectRegistry.costDefaults.get(b.id), b.id);
    assert.ok(b.footprint.width >= 1 && b.footprint.height >= 1);
  }
  assert.deepEqual(table.resources.map(r => r.id), objectRegistry.costResources().map(d => d.id));
  assert.ok(all.some(b => Object.keys(b.cost).length >= 1));
  for (const c of table.categories) assert.ok(c.buildings.every(b => b.category === c.id));
});

test('editing a draft price: change, add, remove, never the last resource', () => {
  const resources = new Set(table.resources.map(r => r.id));
  let cost = { wood: 10 };
  cost = setAmount(cost, 'wood', '12');
  assert.deepEqual(cost, { wood: 12 });
  for (const bad of ['0', '-1', '1.5', 'x', '']) assert.throws(() => setAmount(cost, 'wood', bad), error => /whole number/.test(costErrorText(error)));
  cost = addResource(cost, 'stone', 3, resources);
  assert.deepEqual(cost, { wood: 12, stone: 3 });
  assert.throws(() => addResource(cost, 'stone', 1, resources), error => /already/.test(costErrorText(error)));
  assert.throws(() => addResource(cost, 'unicorn', 1, resources), error => /not a resource/.test(costErrorText(error)));
  cost = removeResource(cost, 'wood');
  assert.deepEqual(cost, { stone: 3 });
  assert.throws(() => removeResource(cost, 'stone'), error => /last one cannot be removed/.test(costErrorText(error)));
  assert.deepEqual(priceDiff({ wood: 5, stone: 2 }, { wood: 6, iron: 1 }).map(d => d.kind), ['changed', 'removed', 'added']);
});

test('shared proposals are untrusted, the newest per building wins, and prices:sync understands them', () => {
  const warehouse = all.find(b => b.id === 'warehouse');
  const docs = [
    { id: 'warehouse', data: proposalDoc('warehouse', { wood: 20, stone: 5 }, { by: 'u1', note: ' cheaper ', now: '2026-11-07T08:00:00.000Z' }) },
    { id: 'tower', data: proposalDoc('tower', { ...all.find(b => b.id === 'tower').cost }, { now: '2026-11-07T08:00:00.000Z' }) },
    { id: 'bogus', data: { buildingId: 'dragon_lair', cost: { wood: 1 } } },
    { id: 'bad', data: { buildingId: 'castle', cost: { wood: 0 } } },
    { id: 'evil', data: { buildingId: 'castle', cost: { gold: 1, unicorn: 2 } } },
  ];
  const proposals = proposalsFrom(docs, table);
  assert.deepEqual([...proposals.keys()].sort(), ['tower', 'warehouse']);
  assert.equal(proposals.get('warehouse').note, 'cheaper');
  assert.equal(proposals.get('tower').unchanged, true, 'a proposal equal to the game price waits for nothing');
  assert.deepEqual(proposalsJson(proposals).map(p => p.buildingId), ['warehouse']);
  assert.notDeepEqual(warehouse.cost, { wood: 20, stone: 5 });
  // The Mechaniky chat reads the same documents with prices:sync.
  assert.equal(normalizeProposals(docs)[0].buildingId, 'warehouse');
  const plan = planPriceSync(docs.slice(0, 1), objectRegistry);
  assert.deepEqual(plan.applied.map(a => [a.buildingId, a.cost]), [['warehouse', { wood: 20, stone: 5 }]]);
  assert.equal(priceDocId('warehouse'), 'warehouse');
});

test('studio:game-buildings prints the same table from the game code', () => {
  const out = JSON.parse(execFileSync(process.execPath, ['scripts/studio-game-buildings.mjs'], { cwd: root, encoding: 'utf8' }));
  assert.equal(out.count, all.length);
  assert.deepEqual(out.resources, table.resources);
  assert.ok(out.categories.flatMap(c => c.buildings).some(b => b.studioAsset), 'buildings link to their Studio asset');
});
