// Primitive helpers. Every primitive is placed by its bottom centre `at: [x, y, z]`
// in model space (origin = footprint centre on the ground). Four-sided cylinders
// are always square-aligned (rotated 45°) so they can form towers and pyramids.

export const box = (size, at, material, extra = {}) => ({ shape: 'box', size, at, material, ...extra });

export const cylinder = ({ radiusBottom, radiusTop = radiusBottom, height, segments = 18 }, at, material) =>
  ({ shape: 'cylinder', radiusBottom, radiusTop, height, segments, at, material });

// Square frustum whose sides are `width` (bottom) and `width * taper` (top).
export const squareFrustum = (width, height, taper, at, material) =>
  cylinder({ radiusBottom: width / Math.SQRT2, radiusTop: width * taper / Math.SQRT2, height, segments: 4 }, at, material);

export const pyramid = (width, height, at, material) =>
  cylinder({ radiusBottom: width / Math.SQRT2, radiusTop: 0, height, segments: 4 }, at, material);

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
