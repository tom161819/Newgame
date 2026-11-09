import test from 'node:test';
import assert from 'node:assert/strict';
import { WATER_LIFE, stepFade, fishLook, surfaced, ringAllowed, nextRingMs, ringCount, ringLook } from '../src/data/waterLife.js';
import { FishShadows } from '../src/game/FishShadows.js';
import { DEV_LOOK_KEYS, devDefault, devRange, setDevFactor, devFactor, resetDevBalance } from '../src/data/devBalance.js';
import { transitionDays, transitionSteps, blendMask, SeasonTransition } from '../src/game/SeasonTransition.js';

// m-plynule-prechody (73, 78): smooth fish, surface rings, and the gradual season change of the continuous ground.

test('fish opacity rises and falls smoothly over the fade time, with a slight scale-up from the depth', () => {
  const { inMs, outMs, depthScale } = WATER_LIFE.fade; assert.ok(inMs >= 600 && inMs <= 1000 && outMs >= 600 && outMs <= 1000);
  let f = 0, prev = -1, steps = 0; const looks = [];
  while (f < 1) { f = stepFade(f, 16, true); const l = fishLook(f); assert.ok(l.alpha >= prev, 'never drops while rising'); assert.ok(l.alpha - Math.max(0, prev) < 0.1, 'no jump'); prev = l.alpha; looks.push(l); steps++; }
  assert.ok(Math.abs(steps * 16 - inMs) <= 16, `full after about ${inMs} ms (${steps * 16})`);
  assert.equal(fishLook(0).alpha, 0); assert.equal(fishLook(1).alpha, 1); assert.equal(fishLook(0).scale, depthScale); assert.equal(fishLook(1).scale, 1);
  prev = 2; while (f > 0) { f = stepFade(f, 16, false); const a = fishLook(f).alpha; assert.ok(a <= prev && prev - a < 0.1 || prev === 2); prev = a; }
  assert.equal(f, 0);
});

test('surface rings come every 8–15 s per fish, 1–2 rings of about a second, only on unfrozen water', () => {
  const r = WATER_LIFE.ripple; assert.ok(r.minMs >= 8000 && r.maxMs <= 15000); assert.ok(r.durationMs >= 800 && r.durationMs <= 1200);
  for (let n = 0; n < 50; n++) { const d = nextRingMs(7, 9, n); assert.ok(d >= r.minMs && d <= r.maxMs); assert.ok([1, 2].includes(ringCount(7, 9, n))); }
  assert.equal(ringAllowed({ frozen: false, fade: 1 }), true); assert.equal(ringAllowed({ frozen: true, fade: 1 }), false, 'no rings under ice'); assert.equal(ringAllowed({ frozen: false, fade: 0.5 }), false);
  const a = ringLook(0), b = ringLook(r.durationMs / 2); assert.ok(b.scale > a.scale && b.alpha < a.alpha, 'spreads and fades'); assert.equal(ringLook(r.durationMs), null);
  let up = 0; for (let t = 0; t < 600000; t += 500) if (surfaced(3, 4, t)) up++; assert.ok(up > 600 && up < 1150, 'a fish is up most of the time, then dives');
});

// A minimal Phaser-like scene: one deep-water body in view, no fog.
function fakeScene({ season = 'Summer' } = {}) {
  const made = [], obj = () => { const o = { visible: true, alpha: 1, scaleX: 1, setVisible(v) { this.visible = v; return this; }, setAlpha(a) { this.alpha = a; return this; }, setScale(s) { this.scaleX = s; return this; }, setPosition() { return this; }, setFrame() { return this; }, setDepth() { return this; }, setStrokeStyle() { return this; }, destroy() {} }; made.push(o); return o; };
  const ground = Array.from({ length: 100 }, () => Array(100).fill(4));
  return { made, textures: { exists: () => true }, add: { image: obj, ellipse: obj }, cameras: { main: { worldView: { x: 3200 - 300, y: 1600 - 200, right: 3200 + 300, bottom: 1600 + 200 } } },
    groundGrid: ground, fishing: { bodies: [{ id: 0 }], bodyAt: () => 0, state: () => 'plentiful' }, seasons: { enabled: true, season }, terrain: { season } };
}
test('FishShadows: a fish fades in instead of popping, and touches the surface only on open water', () => {
  for (const season of ['Summer', 'Winter']) {
    const scene = fakeScene({ season }), fish = new FishShadows(scene); fish.update(16);
    const first = [...fish.fish.values()]; assert.ok(first.length > 3, 'fish in view');
    const alphas = []; for (let t = 0; t < 1200; t += 16) { fish.update(16); alphas.push(Math.max(...[...fish.fish.values()].map(f => f.image.visible ? f.image.alpha : 0))); }
    assert.ok(alphas[0] < 0.05, `starts almost invisible (${alphas[0]})`); assert.ok(alphas.at(-1) > 0.2, 'fully there after the fade');
    for (let i = 1; i < alphas.length; i++) assert.ok(Math.abs(alphas[i] - alphas[i - 1]) < 0.04, 'smooth');
    for (const f of fish.fish.values()) f.ripple = fish.time; // every fish due to touch the surface
    fish.update(16);
    if (season === 'Summer') assert.ok(fish.ripples.length > 0, 'rings on open water'); else assert.equal(fish.ripples.length, 0, 'no rings under ice');
    // Leaving the pick (stock, camera): the fish sinks away, it is not dropped at once.
    scene.fishing.state = () => 'overfished'; fish.next = 0; fish.update(16);
    const leaving = [...fish.fish.values()].filter(f => f.leaving); assert.ok(leaving.length > 0 && leaving.some(f => f.image.visible), 'sinking, still drawn');
    for (let t = 0; t < 1000; t += 16) fish.update(16);
    assert.equal([...fish.fish.values()].filter(f => f.leaving).length, 0, 'gone after the fade');
  }
});

test('the ground of a chunk mid-change is the new season over the old one through the mask', () => {
  const gw = 20, gh = 10, data = new Uint8ClampedArray(gw * gh * 4);
  blendMask(data, gw, gh, (gx, gy) => [gx, gy], fx => fx < 10 ? 0 : fx < 12 ? 0.5 : 1);
  const alpha = (x, y) => data[(y * gw + x) * 4 + 3];
  assert.equal(alpha(2, 5), 0); assert.equal(alpha(11, 5), 128); assert.equal(alpha(15, 5), 255);
  // The game's mask: deterministic and patchy mid-change.
  const t = new SeasonTransition({}, { seasons: null }), state = { from: 'Autumn', to: 'Winter', progress: 0.5 };
  const a = new Uint8ClampedArray(40 * 40 * 4), b = new Uint8ClampedArray(40 * 40 * 4), w = (fx, fy) => t.weight(fx, fy, state);
  blendMask(a, 40, 40, (x, y) => [x * 0.5, y * 0.5], w); blendMask(b, 40, 40, (x, y) => [x * 0.5, y * 0.5], w);
  assert.deepEqual(a, b, 'deterministic');
  let none = 0, full = 0; for (let i = 3; i < a.length; i += 4) { if (a[i] < 20) none++; if (a[i] > 235) full++; }
  assert.ok(none > 50 && full > 50, `patches of both seasons (${none} old, ${full} new)`);
});

test('Dev tool: season change length and steps, with their defaults and ranges', () => {
  assert.deepEqual(DEV_LOOK_KEYS, ['seasonDays', 'seasonSteps']);
  assert.equal(devDefault('seasonDays'), 3); assert.equal(devDefault('seasonSteps'), 9); assert.deepEqual({ ...devRange('seasonDays') }, { min: 1, max: 5, step: 0.5 });
  setDevFactor('seasonDays', 2); setDevFactor('seasonSteps', 12); assert.equal(transitionDays(), 2); assert.equal(transitionSteps(), 12); assert.equal(devFactor('seasonDays'), 2);
  resetDevBalance(); assert.equal(transitionDays(), 3); assert.equal(transitionSteps(), 9);
});
