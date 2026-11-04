// Quarry recipe for a 3 × 3 site: a rock outcrop with stepped worked faces at
// the back, stacked cut blocks, a timber hoist and a small tool shed.
import { box, prism, sphere, cylinder, clamp, seeded } from './shapes.js';

export const params = [
  { key: 'layout', values: ['cliff', 'pit'], description: 'Rock face at the back, or a stepped pit in the middle.' },
  { key: 'rockHeight', unit: 'units', description: 'Height of the outcrop (style range 1.0–2.4).' },
  { key: 'blocks', description: 'Cut stone blocks stacked at the front (0–8).' },
  { key: 'hoist', description: 'Timber hoist over the face.' },
  { key: 'shed', description: 'Small shingled tool shed.' },
  { key: 'seed', description: 'Deterministic variation of rocks.' },
];

export function build(spec, { footprint, style }) {
  const half = Math.min(footprint.width, footprint.height) / 2 - style.scale.footprintMargin;
  const rockHeight = clamp(spec.rockHeight ?? 1.6, 0.6, 2.6), random = seeded(spec.seed ?? 3), parts = [];
  parts.push(box([half * 2, 0.04, half * 2], [0, 0, 0], 'stone_dark'));
  if (spec.layout === 'pit') {
    // Concentric terraces of worked stone around a low rock core.
    for (const [size, y] of [[2.3, 0.04], [1.7, 0.24], [1.1, 0.44]]) parts.push(box([Math.min(size, half * 2), 0.2, Math.min(size, half * 2)], [0, y, 0], y > 0.3 ? 'stone_light' : 'stone'));
    parts.push(sphere([0.42, 0.3, 0.4], [-0.1, 0.64, -0.1], 'rock', 0));
  } else {
    // Stepped worked faces in front of natural rock at the back (−x, −z).
    const steps = 3;
    for (let i = 0; i < steps; i++) {
      const depth = 0.55 + i * 0.32, h = rockHeight * (1 - i * 0.28);
      parts.push(box([half * 2, h, depth], [0, 0.04, -half + depth / 2], i ? 'stone_light' : 'stone'));
    }
    for (let i = 0; i < 6; i++) {
      const x = -half + 0.35 + i * (half * 2 - 0.7) / 5, r = 0.26 + random() * 0.14;
      // Detail 0 keeps rocks angular instead of round.
      parts.push(sphere([r, r * (0.7 + random() * 0.5), r * 0.8], [x, rockHeight * (0.72 + random() * 0.12), -half + r * 0.8 + 0.02], 'rock', 0));
    }
  }
  const blocks = clamp(Math.round(spec.blocks ?? 5), 0, 8);
  for (let i = 0; i < blocks; i++) {
    const row = i % 3, layer = Math.floor(i / 3);
    parts.push(box([0.28, 0.2, 0.22], [half - 0.32 - row * 0.3, 0.04 + layer * 0.2, half - 0.28 - (layer % 2) * 0.05], 'stone_light'));
  }
  if (spec.hoist) {
    const x = -half * 0.35, z = spec.layout === 'pit' ? 0 : -half + 1.15;
    for (const dz of [-0.35, 0.35]) parts.push(cylinder({ radiusBottom: 0.05, radiusTop: 0.04, height: 1.7, segments: 6 }, [x, 0.04, z + dz], 'wood_dark'));
    parts.push(box([0.1, 0.1, 0.9], [x, 1.7, z], 'wood_dark'));
    parts.push(box([0.02, 0.8, 0.02], [x, 0.9, z], 'iron'));
    parts.push(box([0.22, 0.16, 0.22], [x, 0.74, z], 'stone_light'));
  }
  if (spec.shed) {
    // Front-left corner beside a cliff, back-right corner beside a pit.
    const [sx, sz] = spec.layout === 'pit' ? [half - 0.45, -half + 0.45] : [-half + 0.45, half - 0.45];
    parts.push(box([0.7, 0.62, 0.62], [sx, 0.04, sz], 'wood'));
    parts.push(prism([0.82, 0.38, 0.74], [sx, 0.66, sz], 'roof_shingle', { rotation: Math.PI / 2 }));
  }
  const tallest = parts.reduce((m, p) => Math.max(m, p.at[1] + (p.size?.[1] ?? p.height ?? (p.radii ? p.radii[1] * 2 : 0))), 0);
  return { primitives: parts, lights: [], height: tallest };
}

export default { id: 'quarry', version: 1, label: 'Quarry', params, build };
