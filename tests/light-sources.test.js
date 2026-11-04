import test from 'node:test';
import assert from 'node:assert/strict';
import { LightSourceSystem, flicker } from '../src/systems/LightSourceSystem.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { buildingTiles, towerBase } from '../src/game/buildings.js';

function graphics() {
  const calls = [];
  const g = { calls, visible: true, depth: 0, alpha: 1, destroyed: false };
  for (const name of ['clear', 'fillStyle', 'fillCircle', 'fillEllipse']) g[name] = (...args) => { calls.push([name, ...args]); return g; };
  g.setDepth = d => { g.depth = d; return g; }; g.setVisible = v => { g.visible = v; return g; }; g.setAlpha = a => { g.alpha = a; return g; }; g.destroy = () => { g.destroyed = true; };
  return g;
}
function fixture(inView = true) {
  const flames = [];
  const scene = { add: { graphics: () => { const g = graphics(); flames.push(g); return g; } }, cameras: { main: { worldView: {} } } };
  const inner = { painted: 0, visible: true, destroyed: false, paint() { this.painted++; }, contains: () => true, inView: () => inView, setVisible(v) { this.visible = v; }, setAlpha() {}, destroy() { this.destroyed = true; } };
  return { scene, inner, flames };
}
const placed = (type, x, y) => { const definition = objectRegistry.require(type); return { id: 1, type, x, y, definition, tiles: buildingTiles({ x, y }, definition) }; };

test('completed lit buildings expose their lights in world space for the future light map', () => {
  const { scene, inner, flames } = fixture(), system = new LightSourceSystem(scene);
  const building = placed('brazier', 10, 12), view = system.attach(inner, building), base = towerBase(building), light = objectRegistry.require('brazier').lights[0];
  assert.deepEqual(view.worldLights().map(l => [l.x, l.y]), [[base.x + light.x, base.y + light.y]]);
  const [first] = system.lights();
  assert.equal(first.color, light.color); assert.equal(first.radius, light.radius);
  assert.ok(first.strength > light.intensity * (1 - light.flicker.amplitude) - 1e-9 && first.strength < light.intensity * (1 + light.flicker.amplitude) + 1e-9);
  assert.ok(flames[0].depth > base.y, 'flames draw above the building');
  const tower = system.attach(fixture().inner, placed('tower', 20, 20));
  assert.equal(system.lights().length, 2, 'the approved tower brings its wall torch');
  assert.notEqual(view.lights[0].seed, tower.lights[0].seed, 'neighbouring flames do not flicker in sync');
});

test('flames animate with active time only for visible buildings and follow visibility and removal', () => {
  const visible = fixture(true), hidden = fixture(false), system = new LightSourceSystem(visible.scene);
  const a = system.attach(visible.inner, placed('brazier', 1, 1)), b = system.attach(hidden.inner, placed('brazier', 5, 5));
  const [shown, offscreen] = visible.flames; // both views draw their flames through the same scene
  const before = [shown.calls.length, offscreen.calls.length];
  system.update(500);
  assert.equal(system.seconds, 0.5);
  assert.ok(shown.calls.length > before[0], 'flames on screen redraw');
  assert.equal(offscreen.calls.length, before[1], 'off-screen flames are skipped');
  a.setVisible(false);
  assert.equal(shown.visible, false); assert.equal(visible.inner.visible, false);
  const count = shown.calls.length; system.update(500);
  assert.equal(shown.calls.length, count, 'hidden by fog: not redrawn');
  b.destroy();
  assert.equal(system.views.size, 1); assert.ok(hidden.inner.destroyed && offscreen.destroyed);
  for (let t = 0; t < 10; t += 0.3) { const f = flicker(t, { amplitude: 0.16, speed: 5.5 }, 2); assert.ok(f >= 0.84 - 1e-9 && f <= 1.16 + 1e-9); }
});
