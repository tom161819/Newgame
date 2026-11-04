// Primitive helpers. Every primitive is placed by its bottom centre `at: [x, y, z]`
// in model space (origin = footprint centre on the ground). Four-sided cylinders
// are always square-aligned (rotated 45°) so they can form towers and pyramids.

export const box = (size, at, material, extra = {}) => ({ shape: 'box', size, at, material, ...extra });

// `tilt: [x, z]` leans the cylinder about its base (radians around the X and Z axes).
export const cylinder = ({ radiusBottom, radiusTop = radiusBottom, height, segments = 18, tilt }, at, material) =>
  ({ shape: 'cylinder', radiusBottom, radiusTop, height, segments, at, material, ...(tilt ? { tilt } : {}) });

// Top centre of a (possibly tilted) cylinder relative to its base, matching Three's XYZ Euler order.
export function cylinderTop({ height, tilt }) {
  if (!tilt) return [0, height, 0];
  const [x, z] = tilt;
  return [-height * Math.sin(z), height * Math.cos(z) * Math.cos(x), height * Math.cos(z) * Math.sin(x)];
}

// Square frustum whose sides are `width` (bottom) and `width * taper` (top).
export const squareFrustum = (width, height, taper, at, material) =>
  cylinder({ radiusBottom: width / Math.SQRT2, radiusTop: width * taper / Math.SQRT2, height, segments: 4 }, at, material);

export const pyramid = (width, height, at, material) =>
  cylinder({ radiusBottom: width / Math.SQRT2, radiusTop: 0, height, segments: 4 }, at, material);

// Gable roof: triangular cross-section `width` × `height`, ridge running along
// Z for `depth` units; rotation π/2 turns the ridge to run along X.
export const prism = ([width, height, depth], at, material, extra = {}) => ({ shape: 'prism', size: [width, height, depth], at, material, ...extra });

// Low-poly ellipsoid resting on `at`; radii [rx, ry, rz], detail 0–2.
export const sphere = ([rx, ry, rz], at, material, detail = 1, extra = {}) => ({ shape: 'sphere', radii: [rx, ry, rz], detail, at, material, ...extra });

// Marks a part as tree canopy, allowed to overhang the footprint (style.scale.canopyOverhang).
export const canopy = part => ({ ...part, overhang: true });

// Small deterministic generator so recipes can scatter parts without randomness.
export function seeded(seed = 1) {
  let state = (seed * 2654435761) >>> 0 || 1;
  return () => { state ^= state << 13; state >>>= 0; state ^= state >>> 17; state ^= state << 5; state >>>= 0; return state / 0x100000000; };
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
