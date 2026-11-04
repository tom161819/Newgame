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

// A cylinder leaning by `t` radians towards compass `angle` (0 = +x, π/2 = +z),
// standing on `from`. Returns the part and its top point.
export function lean({ length, radiusBottom, radiusTop = radiusBottom, segments = 6 }, angle, t, from, material) {
  const z = -Math.asin(Math.sin(t) * Math.cos(angle));
  const x = Math.asin(clamp(Math.sin(t) * Math.sin(angle) / Math.cos(z), -1, 1));
  const part = cylinder({ radiusBottom, radiusTop, height: length, segments, tilt: [x, z] }, from, material);
  const top = cylinderTop(part);
  return { part, end: [from[0] + top[0], from[1] + top[1], from[2] + top[2]] };
}

// Horse standing with its body along compass `angle`; `coat` and `mane` are materials.
export function horse(at, { angle = -Math.PI / 4, coat = 'horse_bay', mane = 'horse_dark', saddle = false, scale = 1, barding = null } = {}) {
  const [x, y, z] = at, k = scale, fx = Math.cos(angle), fz = Math.sin(angle), sx = -fz, sz = fx;
  const p = (f, up, s = 0) => [x + fx * f * k + sx * s * k, y + up * k, z + fz * f * k + sz * s * k];
  const rot = -angle, parts = [];
  for (const [f, s] of [[0.3, 0.09], [0.3, -0.09], [-0.28, 0.09], [-0.28, -0.09]]) parts.push(box([0.07 * k, 0.42 * k, 0.07 * k], p(f, 0, s), coat, { rotation: rot }));
  for (const [f, s] of [[0.3, 0.09], [0.3, -0.09], [-0.28, 0.09], [-0.28, -0.09]]) parts.push(box([0.075 * k, 0.05 * k, 0.075 * k], p(f, 0, s), mane, { rotation: rot }));
  parts.push(box([0.78 * k, 0.28 * k, 0.27 * k], p(0, 0.4), barding ?? coat, { rotation: rot }));
  const neck = lean({ length: 0.42 * k, radiusBottom: 0.09 * k, radiusTop: 0.06 * k }, angle, 0.62, p(0.3, 0.55), coat);
  parts.push(neck.part);
  parts.push(box([0.28 * k, 0.12 * k, 0.11 * k], [neck.end[0] + fx * 0.08 * k, neck.end[1] - 0.06 * k, neck.end[2] + fz * 0.08 * k], coat, { rotation: rot }));
  parts.push(box([0.05 * k, 0.1 * k, 0.04 * k], [neck.end[0] - fx * 0.02 * k, neck.end[1] - 0.02 * k, neck.end[2] - fz * 0.02 * k], mane, { rotation: rot }));
  // Mane along the top of the neck; the tail hangs from the rump (built from its tip up).
  parts.push(lean({ length: 0.36 * k, radiusBottom: 0.035 * k, radiusTop: 0.03 * k }, angle, 0.62, p(0.27, 0.62), mane).part);
  parts.push(lean({ length: 0.34 * k, radiusBottom: 0.025 * k, radiusTop: 0.05 * k }, angle, 0.35, p(-0.5, 0.32), mane).part);
  if (saddle) parts.push(box([0.24 * k, 0.05 * k, 0.3 * k], p(0.02, 0.68), 'leather', { rotation: rot }), box([0.04 * k, 0.16 * k, 0.32 * k], p(0.02, 0.52), saddle === true ? 'banner' : saddle, { rotation: rot }));
  return { parts, back: p(0.02, 0.73) };
}

// Turn a whole model around the vertical axis by `angle` (Three's rotation.y sense):
// positions and box/prism rotations turn, leaning cylinders keep their lean in the
// new direction, ellipsoids swap radii on quarter turns.
export function rotateParts(parts, angle) {
  const c = Math.cos(angle), s = Math.sin(angle), quarter = Math.round(angle / (Math.PI / 2)) % 2 !== 0 && Math.abs(angle / (Math.PI / 2) - Math.round(angle / (Math.PI / 2))) < 1e-9;
  return parts.map(p => {
    const [x, y, z] = p.at, at = [x * c + z * s, y, -x * s + z * c], out = { ...p, at };
    if (p.shape === 'box' || p.shape === 'prism') out.rotation = (p.rotation ?? 0) + angle;
    if (p.shape === 'sphere' && quarter) out.radii = [p.radii[2], p.radii[1], p.radii[0]];
    if (p.shape === 'cylinder' && p.tilt) {
      const [tx, ty, tz] = cylinderTop(p), rx = tx * c + tz * s, rz = -tx * s + tz * c;
      out.tilt = [Math.atan2(rz, ty), Math.asin(clamp(-rx / p.height, -1, 1))];
    }
    return out;
  });
}
