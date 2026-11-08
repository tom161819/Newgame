import test from 'node:test';
import assert from 'node:assert/strict';
import { previewWorld, previewPixels } from '../src/ui/WorldGenerator.js';
import { COLUMNS, ROWS } from '../src/game/config.js';
import { defaultWorldLevels } from '../src/data/worldCode.js';

test('world generator preview: same code gives the same map, one pixel per tile', () => {
  const a = previewPixels(previewWorld(defaultWorldLevels(), 1234)), b = previewPixels(previewWorld(defaultWorldLevels(), 1234));
  assert.equal(a.length, COLUMNS * ROWS * 4);
  assert.deepEqual(a, b);
  const levels = defaultWorldLevels(); levels[0] = 0;
  assert.notDeepEqual(previewPixels(previewWorld(levels, 1234)), a, 'a slider changes the map');
});
