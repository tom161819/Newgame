// Tree recipe: an oak of clustered low-poly crowns or a pine of stacked cones.
// Trunks stay inside the footprint; canopies may overhang it by the style
// guide's canopyOverhang, so groves read as forest rather than lollipops.
import { cylinder, cylinderTop, sphere, canopy, clamp, seeded } from './shapes.js';

export const params = [
  { key: 'kind', values: ['oak', 'pine', 'bush'], description: 'Broadleaf crown, conifer tiers, or a low bush (#100: shrubs for meadows, shores and dry land).' },
  { key: 'berries', description: 'Bush: material of small berries or flowers on the leaves (e.g. cloth_red, blossom).' },
  { key: 'dry', description: 'Bush: sparse dry scrub with twigs showing (desert, dunes).' },
  { key: 'height', unit: 'units', description: 'Overall height (style range 1.6–3.6).' },
  { key: 'crown', unit: 'units', description: 'Crown radius, clamped to the footprint plus the canopy overhang.' },
  { key: 'trunk', unit: 'units', description: 'Trunk radius at the base.' },
  { key: 'clusters', description: 'Number of oak crown clusters (3–7).' },
  { key: 'tiers', description: 'Number of pine tiers (2–5).' },
  { key: 'seed', description: 'Deterministic variation of cluster placement.' },
  { key: 'season', values: ['summer', 'spring', 'autumn', 'winter'], description: 'Leaf colours by season; winter oaks are bare and pines carry snow. Defaults to summer.' },
];

// Leaf materials per season; summer keeps the original ones.
const LEAVES = {
  spring: { foliage: 'foliage_spring', foliage_light: 'foliage_spring', foliage_dark: 'foliage' },
  autumn: { foliage: 'foliage_autumn', foliage_light: 'foliage_autumn_light', foliage_dark: 'foliage_autumn_dark' },
};

export function build(spec, { footprint, style }) {
  const limit = Math.min(footprint.width, footprint.height) / 2 + (style.scale.canopyOverhang ?? 0) - 0.02;
  const height = clamp(spec.height ?? 2.6, 1.0, 4.2), trunk = clamp(spec.trunk ?? 0.09, 0.04, 0.2);
  const crown = clamp(spec.crown ?? 0.6, 0.2, limit), random = seeded(spec.seed ?? 1), parts = [];
  const season = spec.season ?? 'summer', leaf = id => LEAVES[season]?.[id] ?? id;
  if (spec.kind === 'bush') {
    // Low shrub: a few overlapping leaf clumps on short twigs, lighter towards the sun. Dry scrub: thinner clumps
    // in olive and straw tones with bare twigs between them.
    const h = clamp(spec.height ?? 0.6, 0.25, 1.2), r = clamp(spec.crown ?? 0.32, 0.12, Math.min(0.48, limit)), n = clamp(Math.round(spec.clusters ?? 5), 3, 8);
    const dry = !!spec.dry, leafy = dry ? ['olive_scrub', 'grass_scrub', 'olive_scrub'] : [leaf('foliage_dark'), leaf('foliage'), leaf('foliage_light')];
    let top = 0;
    for (let i = 0; i < (dry ? 5 : 3); i++) { const a = random() * Math.PI * 2, t = 0.25 + random() * 0.35; parts.push({ shape: 'cylinder', radiusBottom: 0.018, radiusTop: 0.008, height: h * (dry ? 0.9 : 0.55), segments: 5, at: [Math.cos(a) * 0.04, 0, Math.sin(a) * 0.04], material: 'twigs', tilt: [Math.sin(a) * t, -Math.cos(a) * t] }); }
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2 + random() * 0.7, d = r * (0.25 + random() * 0.45), s = r * (dry ? 0.32 : 0.48) * (0.75 + random() * 0.45);
      const x = Math.cos(a) * d, z = Math.sin(a) * d, y = (dry ? h * 0.35 : h * 0.12) + random() * h * 0.3;
      if (Math.hypot(x, z) + s > limit) continue;
      parts.push(canopy(sphere([s, s * (dry ? 0.6 : 0.78), s], [x, y, z], leafy[x + z > 0.03 ? 2 : x + z < -0.03 ? 0 : 1], dry ? 0 : 1)));
      if (spec.berries && i % 2 === 0) parts.push(canopy(sphere([0.035, 0.03, 0.035], [x + s * 0.5, y + s * 1.2, z + s * 0.5], spec.berries, 0)));
      top = Math.max(top, y + s * (dry ? 1.2 : 1.56));
    }
    if (!dry) { const s = r * 0.5; parts.push(canopy(sphere([s, s * 0.8, s], [r * 0.08, h * 0.38, r * 0.08], leaf('foliage_light')))); top = Math.max(top, h * 0.38 + s * 1.6); }
    return { primitives: parts, lights: [], height: top + 0.02 };
  }
  if (spec.kind === 'pine') {
    const tiers = clamp(Math.round(spec.tiers ?? 3), 2, 5), base = height * 0.18;
    parts.push(cylinder({ radiusBottom: trunk, radiusTop: trunk * 0.6, height: height * 0.4, segments: 7 }, [0, 0, 0], 'bark'));
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers, radius = crown * (1 - t * 0.55), tierHeight = (height - base) / tiers * 1.55;
      const y = base + (height - base) * t * 0.82;
      parts.push(canopy(cylinder({ radiusBottom: radius, radiusTop: 0, height: tierHeight, segments: 8 }, [0, y, 0], i % 2 ? 'pine_needles' : 'foliage_dark')));
      // Snow rests on the upper half of each tier.
      if (season === 'winter') parts.push(canopy(cylinder({ radiusBottom: radius * 0.6, radiusTop: 0, height: tierHeight * 0.58, segments: 8 }, [0, y + tierHeight * 0.44, 0], 'snow')));
    }
    return { primitives: parts, lights: [], height: base + (height - base) * ((tiers - 1) / tiers) * 0.82 + (height - base) / tiers * 1.55 };
  }
  const trunkHeight = height * 0.4;
  parts.push(cylinder({ radiusBottom: trunk * 1.3, radiusTop: trunk * 0.7, height: trunkHeight + crown * 0.3, segments: 7 }, [0, 0, 0], 'bark'));
  const crownBase = trunkHeight - crown * 0.1, crownHeight = height - crownBase;
  if (season === 'winter') {
    // Bare oak: leaning limbs from the top of the trunk, each forking into two
    // twigs, with a little snow on the forks. Reach stays inside the canopy allowance.
    const trunkTop = trunkHeight + crown * 0.3 - 0.06, limbs = clamp(Math.round(spec.clusters ?? 5), 3, 7);
    let top = trunkTop;
    const lean = (length, angle, t, from) => {
      const z = -Math.asin(Math.sin(t) * Math.cos(angle)), x = Math.asin(clamp(Math.sin(t) * Math.sin(angle) / Math.cos(z), -1, 1));
      const part = cylinder({ radiusBottom: trunk * 0.42 * length / crown, radiusTop: trunk * 0.12, height: length, segments: 5, tilt: [x, z] }, from, 'bark');
      const end = cylinderTop(part);
      return { part, end: [from[0] + end[0], from[1] + end[1], from[2] + end[2]] };
    };
    for (let i = 0; i < limbs; i++) {
      const angle = i / limbs * Math.PI * 2 + random() * 0.5, limb = lean(crown * (1.05 + random() * 0.2), angle, 0.55 + random() * 0.2, [0, trunkTop, 0]);
      parts.push(canopy(limb.part));
      for (const side of [-1, 1]) {
        const twig = lean(crown * 0.45, angle + side * 0.5, 0.75, limb.end);
        if (Math.hypot(twig.end[0], twig.end[2]) > limit - 0.04) continue;
        parts.push(canopy(twig.part)); top = Math.max(top, twig.end[1]);
      }
      parts.push(canopy(sphere([crown * 0.12, crown * 0.04, crown * 0.12], [limb.end[0], limb.end[1] - 0.02, limb.end[2]], 'snow', 0)));
      top = Math.max(top, limb.end[1]);
    }
    return { primitives: parts, lights: [], height: top + 0.03 };
  }
  parts.push(canopy(sphere([crown * 0.8, crownHeight * 0.4, crown * 0.8], [0, crownBase, 0], leaf('foliage'))));
  const clusters = clamp(Math.round(spec.clusters ?? 5), 3, 7);
  let top = crownBase + crownHeight * 0.8;
  for (let i = 0; i < clusters; i++) {
    const angle = i / clusters * Math.PI * 2 + random() * 0.6, r = crown * (0.42 + random() * 0.12);
    const reach = Math.max(0, crown - r) * (0.7 + random() * 0.3), y = crownBase + crownHeight * (0.1 + random() * 0.32);
    const x = Math.cos(angle) * reach, z = Math.sin(angle) * reach;
    // Clusters facing the sun (+X+Z) use lighter leaves, the back ones darker.
    parts.push(canopy(sphere([r, r * 0.82, r], [x, y, z], leaf(x + z > 0.05 ? 'foliage_light' : x + z < -0.05 ? 'foliage_dark' : 'foliage'))));
    if (season === 'spring' && i % 2 === 0) parts.push(canopy(sphere([r * 0.4, r * 0.3, r * 0.4], [x + r * 0.35, y + r * 1.0, z + r * 0.35], 'blossom', 0)));
    top = Math.max(top, y + r * 1.64);
  }
  parts.push(canopy(sphere([crown * 0.42, crown * 0.36, crown * 0.42], [crown * 0.08, crownBase + crownHeight * 0.48, crown * 0.08], leaf('foliage_light'))));
  top = Math.max(top, crownBase + crownHeight * 0.48 + crown * 0.72);
  return { primitives: parts, lights: [], height: top };
}

export default { id: 'tree', version: 1, label: 'Tree', params, build };
