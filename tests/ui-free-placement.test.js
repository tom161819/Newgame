import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUiConfig, frameStyle, FREE_REGIONS } from '../art/ui/uiConfig.js';

test('g-ui-lab-volne: free placement frames are validated and anchored to an edge', () => {
  const { config, problems } = normalizeUiConfig({ free: { hud: { ax: 'center', ay: 'bottom', x: 4, y: 12, w: 640 }, minimap: { ax: 'nowhere', ay: 'top', x: 1e9, y: -3, w: 3 }, nope: { x: 1 } } });
  assert.deepEqual(config.free.hud, { ax: 'center', ay: 'bottom', x: 4, y: 12, w: 640, h: null });
  assert.deepEqual(config.free.minimap, { ax: 'left', ay: 'top', x: 4000, y: -3, w: 16, h: null });
  assert.ok(problems.includes('free.nope ignored'));
  assert.equal(normalizeUiConfig({}).config.free, undefined, 'no free placement unless a design has one');
  const st = frameStyle(config.free.hud);
  assert.equal(st.position, 'fixed'); assert.equal(st.left, 'calc(50% + 4px)'); assert.equal(st.bottom, '12px'); assert.equal(st.transform, 'translateX(-50%)'); assert.equal(st.width, '640px');
  assert.ok(Object.values(FREE_REGIONS).every(r => typeof r.selector === 'string' && r.label));
});
