// Standalone light source: a wooden post with an iron cage, or a stone brazier.
// Only the holder is modelled; the flame and its light are runtime layers.
import { box, cylinder, squareFrustum, clamp } from './shapes.js';

export const params = [
  { key: 'postHeight', unit: 'units', description: 'Height of the post or pedestal.' },
  { key: 'postWidth', unit: 'units', description: 'Post thickness or pedestal width.' },
  { key: 'basket', values: ['cage', 'bowl'], description: 'Iron cage on a post, or a bowl on a stone pedestal.' },
  { key: 'light', values: ['torch', 'brazier'], description: 'Light source type from the style guide.' },
];

export function build(spec) {
  const height = clamp(spec.postHeight ?? 1.4, 0.4, 2.2), width = clamp(spec.postWidth ?? 0.12, 0.08, 0.6);
  const parts = [];
  let top;
  if (spec.basket === 'bowl') {
    parts.push(squareFrustum(width + 0.12, 0.12, 0.92, [0, 0, 0], 'stone_dark'));
    parts.push(squareFrustum(width, height - 0.12, 0.82, [0, 0.12, 0], 'stone'));
    parts.push(cylinder({ radiusBottom: 0.13, radiusTop: 0.27, height: 0.16, segments: 12 }, [0, height, 0], 'iron'));
    top = height + 0.16;
  } else {
    parts.push(box([0.32, 0.08, 0.32], [0, 0, 0], 'stone_dark'));
    parts.push(cylinder({ radiusBottom: width / 2 + 0.01, radiusTop: width / 2, height: height - 0.08, segments: 8 }, [0, 0.08, 0], 'wood_dark'));
    parts.push(cylinder({ radiusBottom: 0.07, radiusTop: 0.11, height: 0.2, segments: 8 }, [0, height, 0], 'iron'));
    for (const [x, z] of [[0.09, 0], [-0.09, 0], [0, 0.09], [0, -0.09]]) parts.push(box([0.02, 0.18, 0.02], [x, height + 0.12, z], 'iron'));
    top = height + 0.3; // tips of the cage prongs
  }
  // The flame sits in the cage (or just above the bowl), not above the prongs.
  const flame = spec.basket === 'bowl' ? top + 0.12 : top - 0.06;
  return { primitives: parts, lights: [{ type: spec.light === 'brazier' ? 'brazier' : 'torch', at: [0, flame, 0] }], height: top };
}

export default { id: 'torch-post', version: 2, label: 'Torch post', params, build };
