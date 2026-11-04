// Tree recipe: an oak of clustered low-poly crowns or a pine of stacked cones.
// Trunks stay inside the footprint; canopies may overhang it by the style
// guide's canopyOverhang, so groves read as forest rather than lollipops.
import { cylinder, sphere, canopy, clamp, seeded } from './shapes.js';

export const params = [
  { key: 'kind', values: ['oak', 'pine'], description: 'Broadleaf crown or conifer tiers.' },
  { key: 'height', unit: 'units', description: 'Overall height (style range 1.6–3.6).' },
  { key: 'crown', unit: 'units', description: 'Crown radius, clamped to the footprint plus the canopy overhang.' },
  { key: 'trunk', unit: 'units', description: 'Trunk radius at the base.' },
  { key: 'clusters', description: 'Number of oak crown clusters (3–7).' },
  { key: 'tiers', description: 'Number of pine tiers (2–5).' },
  { key: 'seed', description: 'Deterministic variation of cluster placement.' },
];

export function build(spec, { footprint, style }) {
  const limit = Math.min(footprint.width, footprint.height) / 2 + (style.scale.canopyOverhang ?? 0) - 0.02;
  const height = clamp(spec.height ?? 2.6, 1.0, 4.2), trunk = clamp(spec.trunk ?? 0.09, 0.04, 0.2);
  const crown = clamp(spec.crown ?? 0.6, 0.2, limit), random = seeded(spec.seed ?? 1), parts = [];
  if (spec.kind === 'pine') {
    const tiers = clamp(Math.round(spec.tiers ?? 3), 2, 5), base = height * 0.18;
    parts.push(cylinder({ radiusBottom: trunk, radiusTop: trunk * 0.6, height: height * 0.4, segments: 7 }, [0, 0, 0], 'bark'));
    for (let i = 0; i < tiers; i++) {
      const t = i / tiers, radius = crown * (1 - t * 0.55), tierHeight = (height - base) / tiers * 1.55;
      parts.push(canopy(cylinder({ radiusBottom: radius, radiusTop: 0, height: tierHeight, segments: 8 }, [0, base + (height - base) * t * 0.82, 0], i % 2 ? 'pine_needles' : 'foliage_dark')));
    }
    return { primitives: parts, lights: [], height: base + (height - base) * ((tiers - 1) / tiers) * 0.82 + (height - base) / tiers * 1.55 };
  }
  const trunkHeight = height * 0.4;
  parts.push(cylinder({ radiusBottom: trunk * 1.3, radiusTop: trunk * 0.7, height: trunkHeight + crown * 0.3, segments: 7 }, [0, 0, 0], 'bark'));
  const crownBase = trunkHeight - crown * 0.1, crownHeight = height - crownBase;
  parts.push(canopy(sphere([crown * 0.8, crownHeight * 0.4, crown * 0.8], [0, crownBase, 0], 'foliage')));
  const clusters = clamp(Math.round(spec.clusters ?? 5), 3, 7);
  let top = crownBase + crownHeight * 0.8;
  for (let i = 0; i < clusters; i++) {
    const angle = i / clusters * Math.PI * 2 + random() * 0.6, r = crown * (0.42 + random() * 0.12);
    const reach = Math.max(0, crown - r) * (0.7 + random() * 0.3), y = crownBase + crownHeight * (0.1 + random() * 0.32);
    const x = Math.cos(angle) * reach, z = Math.sin(angle) * reach;
    // Clusters facing the sun (+X+Z) use lighter leaves, the back ones darker.
    parts.push(canopy(sphere([r, r * 0.82, r], [x, y, z], x + z > 0.05 ? 'foliage_light' : x + z < -0.05 ? 'foliage_dark' : 'foliage')));
    top = Math.max(top, y + r * 1.64);
  }
  parts.push(canopy(sphere([crown * 0.42, crown * 0.36, crown * 0.42], [crown * 0.08, crownBase + crownHeight * 0.48, crown * 0.08], 'foliage_light')));
  top = Math.max(top, crownBase + crownHeight * 0.48 + crown * 0.72);
  return { primitives: parts, lights: [], height: top };
}

export default { id: 'tree', version: 1, label: 'Tree', params, build };
