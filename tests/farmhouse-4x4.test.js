import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { workerScene } from './helpers/workerScene.js';
import { placeBuilding, buildingDefinition, definitionFor, buildingTiles } from '../src/game/buildings.js';
import { serializeGameState, validateGameState } from '../src/systems/GameStateSerializer.js';

// Owner 13 Nov 2026: the GPT farmstead with its fenced yard is 4 × 4; Farmhouses of older saves keep 3 × 3.
function place(s, d) {
  for (let y = 2; y < s.map.length - 5; y++) for (let x = 2; x < s.map[0].length - 5; x++) {
    const r = placeBuilding({ map: s.map, anchor: { x, y }, resources: s.resourceOccupancy, reservedTiles: s.reservedTiles(), inventory: s.inventory, buildings: s.buildings, definition: d });
    if (r.building) return r.building;
  }
  return null;
}

test('a new Farmhouse is 4 × 4 and keeps its size through save and load', () => {
  const s = workerScene(undefined, { workplaces: true }), d = s.objectRegistry.require('farmhouse');
  assert.equal(d.width, 4); assert.deepEqual(d.legacyFootprint, { width: 3, height: 3 });
  for (const [id, n] of Object.entries(d.cost)) s.inventory.add(id, n);
  s.events = s.events ?? new EventEmitter();
  const b = place(s, d);
  s.towerViews.set(b.id, s.createBuildingView(d, b)); s.events.emit('buildings:changed'); s.workplaceSystem?.refresh?.();
  assert.ok(b); assert.equal(b.size, 4); assert.equal(b.tiles.length, 16);
  const state = validateGameState(serializeGameState(s));
  assert.equal(state.buildings.find(x => x.id === b.id).size, 4);
});

test('a Farmhouse from an older save (no size) stays 3 × 3 and shows the art at 3/4', () => {
  const s = workerScene(undefined, { workplaces: true }), d = s.objectRegistry.require('farmhouse');
  const old = { id: 1, type: 'farmhouse', x: 4, y: 4 };
  const legacy = definitionFor(old, s.objectRegistry);
  assert.equal(legacy.width, 3); assert.equal(legacy.height, 3); assert.equal(legacy.id, 'farmhouse');
  assert.equal(buildingTiles(old, legacy).length, 9);
  assert.equal(buildingDefinition(old).width, 3);
  assert.ok(legacy.visual.displayWidth < 270 && legacy.visual.displayWidth > 180);
  assert.ok(Math.abs(legacy.lights[0].x - d.lights[0].x * 0.75) < 1e-9);
  assert.equal(definitionFor({ ...old, size: 4 }, s.objectRegistry).width, 4);
});
