// Light Lab (plan m-osvetleni-noc, step 1): the light-map algorithm the game will import, the Lab's scene and time
// helpers, and the proposal / file the Studio hands over.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  LIGHT_TYPES, LIGHT_SCHEMA, DEFAULT_TYPES, defaultLightSettings, readLightSettings, normalizeLightSettings, ambientColor, switchOn,
  resolveLights, lightAt, visibleLights, directionalShade, cornerTints, shadowFor, LightMap, profile, lightingFile,
} from '../studio/src/light-lab/lightmap.js';
import { buildingSources, SCENE_BUILDINGS, darknessFor, nightStartOf, windowGlow, activeSources, newSource, readSources, proposalDoc, labType } from '../studio/src/light-lab/model.js';
import { objectDefinitions } from '../src/data/objects/index.js';

const settings = defaultLightSettings();
const night = 1;

test('Light Lab: settings from untrusted data are completed, clamped and checked', () => {
  const r = readLightSettings({ schema: 1, types: { torch: { radius: 99, color: 'red', strength: 1.5 }, ghost: {} }, global: { shadows: 'yes', quality: 'simple', nightStrength: 0.5 } });
  assert.equal(r.ok, true);
  assert.equal(r.settings.types.torch.radius, 10);
  assert.equal(r.settings.types.torch.color, DEFAULT_TYPES.torch.color);
  assert.equal(r.settings.types.torch.strength, 1.5);
  assert.equal(r.settings.global.shadows, true);
  assert.equal(r.settings.global.quality, 'simple');
  assert.equal(r.settings.global.nightStrength, 0.5);
  assert.deepEqual(Object.keys(r.settings.types), LIGHT_TYPES);
  assert.ok(r.problems.some(p => p.includes('ghost')) && r.problems.some(p => p.includes('torch.radius')) && r.problems.some(p => p.includes('global.shadows')));
  assert.equal(readLightSettings({ schema: 9 }).ok, false);
  assert.equal(readLightSettings('nonsense').ok, false);
  // A page-database proposal and the exported file read back to the same settings.
  assert.deepEqual(readLightSettings(proposalDoc(r.settings)).settings, r.settings);
  assert.deepEqual(readLightSettings(lightingFile(r.settings)).settings, r.settings);
});

test('Light Lab: the committed art/lighting file is valid lighting settings', () => {
  const file = JSON.parse(readFileSync(new URL('../art/lighting/light-lab-default.json', import.meta.url), 'utf8'));
  assert.equal(file.kind, 'light-lab'); assert.equal(file.schema, LIGHT_SCHEMA);
  const r = readLightSettings(file);
  assert.equal(r.ok, true); assert.deepEqual(r.problems, []);
});

test('Light Lab: night darkens to a bluish ambient, day stays white', () => {
  assert.deepEqual(ambientColor(0, settings.global), { r: 255, g: 255, b: 255 });
  const n = ambientColor(night, settings.global);
  assert.ok(n.b > n.r && n.b > n.g, 'night is bluish');
  assert.ok(n.r < 120, 'night is dark');
});

test('Light Lab: dusk and dawn change smoothly, lights switch on one by one', () => {
  const ns = nightStartOf('Summer');
  let prev = 0;
  for (let f = ns - 0.12; f < ns + 0.01; f += 0.002) { const d = darknessFor(f, ns); assert.ok(d >= prev - 1e-9); assert.ok(d - prev < 0.06, 'no jump'); prev = d; }
  assert.equal(darknessFor(0.5, ns), 0); assert.equal(darknessFor(ns + 0.05, ns), 1);
  const g = settings.global, ons = [1, 2, 3, 4, 5, 6].map(seed => switchOn(0.3, seed, g));
  assert.ok(new Set(ons.map(v => v.toFixed(3))).size > 1, 'lights do not all switch on at once');
  for (let seed = 1; seed < 20; seed++) { assert.equal(switchOn(0, seed, g), 0); assert.equal(switchOn(1, seed, g), 1); }
});

test('Light Lab: a light reaches its radius on the ground and its height up the walls', () => {
  const [l] = resolveLights([{ type: 'torch', x: 0, y: 0, seed: 1 }], settings, { darkness: night, seconds: 0 });
  assert.ok(l.rx > l.ry && l.up === DEFAULT_TYPES.torch.height);
  assert.ok(lightAt(l, 0, 0) > 0.8);
  assert.equal(lightAt(l, l.rx + 1, 0), 0);
  assert.equal(lightAt(l, 0, l.ry + 1), 0, 'below the ground point the ellipse ends at ry');
  assert.ok(lightAt(l, 0, -(l.ry + l.up / 2)) > 0, 'above it the light climbs the walls');
  assert.ok(profile(0) === 1 && profile(1) === 0 && profile(0.5) > profile(0.7));
  assert.deepEqual(resolveLights([{ type: 'torch', x: 0, y: 0, seed: 1 }], settings, { darkness: 0 }), [], 'by day nothing is lit');
  assert.deepEqual(resolveLights([{ type: 'window', x: 0, y: 0, seed: 1, on: 0 }], settings, { darkness: night }), [], 'an empty house stays dark');
});

test('Light Lab: only lights in view are drawn, into a reduced-resolution map', () => {
  const calls = { gradients: 0, fills: 0, size: null };
  const createCanvas = (w, h) => ({ width: w, height: h, getContext: () => new Proxy({}, { get: (t, k) => k === 'createRadialGradient' ? () => { calls.gradients++; return { addColorStop() {} }; } : k === 'fillRect' ? () => { calls.fills++; } : t[k] ?? (() => {}), set: (t, k, v) => { t[k] = v; return true; } }) });
  const lights = resolveLights([{ type: 'torch', x: 100, y: 100, seed: 1 }, { type: 'campfire', x: 5000, y: 5000, seed: 2 }], settings, { darkness: night });
  assert.equal(visibleLights(lights, { x0: 0, y0: 0, x1: 800, y1: 600 }).length, 1);
  const map = new LightMap({ createCanvas });
  const out = map.render({ width: 800, height: 600, view: { x: 0, y: 0, zoom: 1 }, lights, darkness: night, settings });
  assert.equal(out.width, 400); assert.equal(out.height, 300);
  assert.deepEqual([map.stats.drawn, map.stats.culled], [1, 1]);
  assert.equal(calls.gradients, 2, 'one light, two halves (ground and walls)');
});

test('Light Lab: the side of a sprite facing the light is lighter, the far side darker', () => {
  const lights = resolveLights([{ type: 'torch', x: 60, y: 0, seed: 1 }], settings, { darkness: night });
  const shade = directionalShade(0, 0, 60, lights, settings.global, night);
  assert.ok(shade && shade.x > 0.9, 'the light is to the right');
  const t = cornerTints(shade);
  assert.ok(t.tr > 1 && t.tl < 1 && t.br > t.bl);
  assert.equal(directionalShade(0, 0, 60, lights, { ...settings.global, quality: 'simple' }, night), null, 'Simple quality has no directional lighting');
  assert.equal(directionalShade(0, 0, 60, [], settings.global, night), null);
  const both = resolveLights([{ type: 'torch', x: 60, y: 0, seed: 1 }, { type: 'torch', x: -60, y: 0, seed: 1 }], settings, { darkness: night });
  assert.equal(directionalShade(0, 0, 60, both, settings.global, night), null, 'lights on both sides cancel out');
  const sh = shadowFor(0, 0, 40, lights, settings.global, night);
  assert.ok(sh.x < 0 && sh.alpha > 0, 'the shadow falls away from the light');
  assert.equal(shadowFor(0, 0, 40, lights, { ...settings.global, shadows: false }, night), null);
});

test('Light Lab: scene sources come from the game definitions; windows follow home and bedtime', () => {
  const defs = new Map(objectDefinitions.filter(d => d.category === 'building').map(d => [d.id, d]));
  const sources = buildingSources(SCENE_BUILDINGS, defs);
  assert.ok(sources.some(s => s.type === 'forge'), 'the smelter is a forge');
  assert.equal(sources.filter(s => s.type === 'window').length, SCENE_BUILDINGS.filter(b => b.id === 'house').length);
  assert.ok(sources.some(s => s.type === 'torch') && sources.some(s => s.type === 'brazier') && sources.some(s => s.type === 'campfire'));
  assert.equal(labType('torch_post', 'torch'), 'torch');
  const ns = nightStartOf('Summer'), house = { index: 0, home: true, bedtime: 0.05 };
  assert.equal(windowGlow(0.4, ns, house), 0, 'no window light by day');
  assert.equal(windowGlow(ns + 0.01, ns, house), 1, 'lit in the evening');
  assert.equal(windowGlow(ns + 0.08, ns, house), 0, 'dark after bedtime');
  assert.equal(windowGlow(ns + 0.01, ns, { ...house, home: false }), 0, 'dark when nobody is home');
  const active = activeSources(sources, [{ index: sources.find(s => s.type === 'window').house, home: false }], ns + 0.01, ns);
  assert.equal(active.find(s => s.type === 'window').on, 0);
  const n = newSource('lantern', 10.4, 20.6, sources);
  assert.equal(n.type, 'lantern'); assert.ok(!sources.some(s => s.seed === n.seed));
  assert.deepEqual(readSources([n, { type: 'nope', x: 1, y: 1 }, null]), [n]);
});

test('Light Lab: normalize keeps defaults for an empty object', () => {
  assert.deepEqual(normalizeLightSettings({}), defaultLightSettings());
});
