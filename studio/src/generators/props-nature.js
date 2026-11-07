// Nature decorations for World v2 (plan g-svet-textury): reeds in the shallows, the stones of a ford and small ground
// decals (grass tufts, flowers, pebbles, fallen leaves). Deterministic layouts from a seed, like the other props.
import { box, cylinder, sphere, lean } from './shapes.js';
import { PROPS } from './props.js';

const rnd = seed => { let s = seed | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
Object.assign(PROPS, {
  // A clump of reeds: thin stems leaning out from the root, some with brown cattail heads. season 'winter' = dry, pale.
  reeds: (x, z, { seed = 1, count = 14, height = 0.55, spread = 0.18, season = 'summer', heads = 0.35 } = {}) => {
    const r = rnd(seed), out = [], dry = season === 'winter' || season === 'autumn';
    const stems = dry ? ['thatch', 'grass_scrub', 'twigs'] : ['foliage_dark', 'foliage', 'olive_scrub', 'grass_scrub'];
    for (let i = 0; i < count; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * spread, bx = x + Math.cos(a) * d, bz = z + Math.sin(a) * d, len = height * (0.55 + 0.6 * r()), tilt = (season === 'winter' ? 0.28 : 0.12) + r() * 0.2;
      const s = lean({ length: len, radiusBottom: 0.008, radiusTop: 0.003, segments: 4 }, a + (r() - 0.5), tilt, [bx, 0, bz], stems[i % stems.length]);
      out.push(s.part);
      if (r() < heads) out.push(cylinder({ radiusBottom: 0.014, radiusTop: 0.014, height: 0.07, segments: 6 }, [s.end[0], s.end[1] - 0.1, s.end[2]], dry ? 'hair_brown' : 'horse_dark'));
      if (!dry && r() < 0.4) out.push(lean({ length: len * 0.6, radiusBottom: 0.012, radiusTop: 0.002, segments: 3 }, a + 1.5, 0.5, [bx, 0, bz], 'foliage_light').part); // leaf blade
    }
    out.push(sphere([spread * 0.9, 0.02, spread * 0.8], [x, 0, z], dry ? 'soil' : 'moss', 1));
    return out;
  },
  // Stones of a ford: rounded wet boulders standing out of the shallows, darker where wet. size 0.5–1.5.
  fordStones: (x, z, { seed = 1, count = 3, size = 1 } = {}) => {
    const r = rnd(seed), out = [];
    for (let i = 0; i < count; i++) {
      const a = r() * 6.28, d = i ? 0.08 + r() * 0.16 : 0, k = size * (i ? 0.45 + 0.4 * r() : 1), sx = x + Math.cos(a) * d, sz = z + Math.sin(a) * d;
      out.push(sphere([0.11 * k, 0.07 * k, 0.09 * k], [sx, 0, sz], 'stone_dark', 1, { rotation: r() * 3 }), sphere([0.1 * k, 0.05 * k, 0.08 * k], [sx - 0.01, 0.025 * k, sz - 0.01], i % 2 ? 'stone' : 'rock', 1, { rotation: r() * 3 }));
      out.push(sphere([0.13 * k, 0.006, 0.11 * k], [sx, 0, sz], 'snow', 1)); // a ring of foam where the water meets the stone
    }
    return out;
  },
  // Ground decals: tiny things that sit on the texture. kind: tufts, flowers, pebbles, leaves.
  decals: (x, z, { kind = 'tufts', seed = 1, count = 9, spread = 0.36, colours } = {}) => {
    const r = rnd(seed), out = [];
    for (let i = 0; i < count; i++) {
      const px = x + (r() - 0.5) * spread * 2, pz = z + (r() - 0.5) * spread * 2;
      if (kind === 'tufts') { const c = (colours ?? ['foliage_dark', 'foliage', 'foliage_light'])[i % 3]; for (let b = 0; b < 5; b++) out.push(lean({ length: 0.05 + r() * 0.05, radiusBottom: 0.006, radiusTop: 0.001, segments: 3 }, r() * 6.28, 0.25 + r() * 0.4, [px, 0, pz], c).part); }
      if (kind === 'flowers') { const c = (colours ?? ['gold_trim', 'blossom', 'cloth_linen', 'banner_blue'])[i % (colours?.length ?? 4)]; out.push(cylinder({ radiusBottom: 0.003, height: 0.05, segments: 3 }, [px, 0, pz], 'foliage'), sphere([0.012, 0.008, 0.012], [px, 0.05, pz], c, 1)); }
      if (kind === 'pebbles') out.push(sphere([0.015 + r() * 0.015, 0.01, 0.013 + r() * 0.012], [px, 0, pz], ['fieldstone_light', 'fieldstone', 'rock', 'fieldstone_dark'][i % 4], 1, { rotation: r() * 3 }));
      if (kind === 'leaves') out.push(box([0.03, 0.003, 0.018], [px, 0.002, pz], ['foliage_autumn', 'foliage_autumn_light', 'foliage_autumn_dark', 'hair_auburn'][i % 4], { rotation: r() * 3 }));
    }
    return out;
  },
});
