import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { objectDefinitions } from '../src/data/objects/index.js';
import { nextBuildingLook, buildingLook } from '../src/game/buildings.js';

// Owner 13 Nov 2026: four GPT cottage looks; every new House takes the next one so neighbours never repeat.
const house = objectDefinitions.find(d => d.id === 'house');
const approvals = JSON.parse(readFileSync(new URL('../art/approvals.json', import.meta.url), 'utf8')).assets;

test('the House has four approved looks, each its own Studio export', () => {
  assert.deepEqual(house.artLooks, ['bench', 'woodshed', 'porch', 'garden']);
  for (const look of house.artLooks) {
    const art = house.artSprites[look], meta = JSON.parse(readFileSync(new URL(`../${art.artSource}`, import.meta.url), 'utf8'));
    assert.equal(meta.variantId, `house-gpt-${look}-0`);
    assert.equal(approvals.house.variants[meta.variantId].status, 'approved');
    assert.deepEqual(art.origin, meta.baseOrigin);
    assert.ok(readFileSync(new URL(`../public${art.sprite}`, import.meta.url)).equals(readFileSync(new URL(`../art/sprites/house/${meta.variantId}.v${meta.version}.png`, import.meta.url))));
  }
});

test('each new House takes the look after the last one built, in a cycle', () => {
  const buildings = [];
  const looks = [];
  for (let id = 1; id <= 9; id++) {
    const look = nextBuildingLook(house, buildings);
    looks.push(look);
    buildings.push({ id, type: 'house', look });
    buildings.push({ id: id + 100, type: 'well' });
  }
  assert.deepEqual(looks, ['bench', 'woodshed', 'porch', 'garden', 'bench', 'woodshed', 'porch', 'garden', 'bench']);
  // Removing the newest House does not repeat its neighbour's look next: the cycle follows the newest standing House.
  assert.equal(nextBuildingLook(house, [{ id: 3, type: 'house', look: 'porch' }, { id: 1, type: 'house', look: 'bench' }]), 'garden');
  assert.equal(nextBuildingLook(objectDefinitions.find(d => d.id === 'well'), buildings), null);
});

test('a House from an older save without a look keeps a stable look by its id', () => {
  assert.equal(buildingLook(house, { id: 6, type: 'house' }), 'porch');
  assert.equal(buildingLook(house, { id: 6, type: 'house', look: 'garden' }), 'garden');
  assert.equal(buildingLook(house, { id: 6, type: 'house', look: 'castle' }), 'porch');
});

test('placed Houses get alternating looks and keep them through save and load', async () => {
  const { workerScene } = await import('./helpers/workerScene.js');
  const { placeBuilding } = await import('../src/game/buildings.js');
  const { serializeGameState, validateGameState } = await import('../src/systems/GameStateSerializer.js');
  const s = workerScene(undefined, { workplaces: true });
  const d = s.objectRegistry.require('house');
  s.inventory.add?.('wood', 100);
  const placed = [];
  for (let i = 0; i < 3; i++) {
    let r = null;
    for (let y = 2; y < s.map.length - 3 && !r?.building; y++) for (let x = 2; x < s.map[0].length - 3 && !r?.building; x++) {
      r = placeBuilding({ map: s.map, anchor: { x, y }, resources: s.resourceOccupancy, reservedTiles: s.reservedTiles(), inventory: s.inventory, buildings: s.buildings, definition: d });
    }
    assert.ok(r?.building, 'a House was placed');
    placed.push(r.building);
  }
  assert.deepEqual(placed.map(b => b.look), ['bench', 'woodshed', 'porch']);
  const state = validateGameState(serializeGameState(s));
  assert.deepEqual(state.buildings.filter(b => b.type === 'house').map(b => b.look), ['bench', 'woodshed', 'porch']);
  const bad = structuredClone(serializeGameState(s));bad.buildings.find(b => b.type === 'house').look = 'castle';
  assert.throws(() => validateGameState(bad));
});
