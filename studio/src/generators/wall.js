// Wall segment recipe for a 1 × 1 tile running along grid x. Segments span the
// full tile length so neighbours join without gaps (walls ignore the margin).
import { box, cylinder, clamp } from './shapes.js';

export const params = [
  { key: 'style', values: ['stone', 'palisade'], description: 'Crenellated masonry or sharpened timber stakes.' },
  { key: 'height', unit: 'units', description: 'Wall height without battlements (style range 1.4–2.0).' },
  { key: 'thickness', unit: 'units', description: 'Thickness across the wall.' },
  { key: 'merlons', description: 'Merlons per segment on the outer (+Z) edge.' },
];

export function build(spec) {
  const height = clamp(spec.height ?? 1.6, 0.8, 2.4), thickness = clamp(spec.thickness ?? 0.5, 0.2, 0.9), parts = [];
  if (spec.style === 'palisade') {
    const stakes = 7, step = 1 / stakes;
    parts.push(box([1, 0.1, thickness + 0.06], [0, 0, 0], 'stone_dark'));
    for (let i = 0; i < stakes; i++) {
      const x = -0.5 + step / 2 + i * step, h = height * (0.9 + (i % 3) * 0.05);
      parts.push(cylinder({ radiusBottom: step / 2, radiusTop: step / 2, height: h, segments: 7 }, [x, 0.05, 0], 'bark'));
      parts.push(cylinder({ radiusBottom: step / 2, radiusTop: 0.005, height: 0.22, segments: 7 }, [x, 0.05 + h, 0], 'wood'));
    }
    parts.push(box([1, 0.08, 0.06], [0, height * 0.55, thickness / 2 - 0.02], 'wood_dark'));
    return { primitives: parts, lights: [], height: 0.05 + height + 0.22 }; // tallest stake + its point
  }
  parts.push(box([1, 0.16, thickness + 0.08], [0, 0, 0], 'stone_dark'));
  parts.push(box([1, height - 0.16, thickness], [0, 0.16, 0], 'stone'));
  parts.push(box([1, 0.08, thickness + 0.06], [0, height, 0], 'stone_light'));
  const merlons = clamp(Math.round(spec.merlons ?? 2), 1, 4), width = 1 / (merlons * 2);
  // Evenly spaced merlons with equal gaps; the outer edge faces +Z.
  for (let i = 0; i < merlons; i++) parts.push(box([width, 0.3, 0.14], [-0.5 + (i + 0.5) / merlons, height + 0.08, thickness / 2 - 0.04], 'stone'));
  return { primitives: parts, lights: [], height: height + 0.38 };
}

export default { id: 'wall', version: 1, label: 'Wall segment', params, build };
