// Castle recipe (plan g-hrad-nova-grafika): three approaches on the game's 3 × 3 castle footprint.
//   curtain – stone curtain walls with round corner towers, a gatehouse and a palace with a tiled roof;
//   keep    – a tall square keep (bergfried) behind low walls, with a timber hall and a stable in the bailey;
//   motte   – an early stronghold: a stone hall and a timber tower on an earth mound inside a palisade.
// The gate faces +Z (the sunlit "left" face), the side where people gather in front of the castle. Every variant has a
// platform on top where the king stands (the castle gives 75 % more sight from there), the kingdom banner, torches at
// the gate and lit windows at night (light type "window": a warm glow without a flame).
// Visible faces in the game camera: "left" = +Z, "right" = +X.
import { box, cylinder, squareFrustum, pyramid, prism, clamp, lerp } from './shapes.js';
import house from './house.js';
import { primitiveBounds } from '../lib/specs.js';

export const params = [
  { key: 'layout', values: ['curtain', 'keep', 'motte'], description: 'Which kind of castle.' },
  { key: 'roof', description: 'Roof material of the towers and buildings (roof_tile, roof_shingle, thatch).' },
  { key: 'banner', description: 'Banner material (banner, banner_blue).' },
];

const shift = (parts, dx, dz, dy = 0) => parts.map(p => ({ ...p, at: [p.at[0] + dx, p.at[1] + dy, p.at[2] + dz] }));
const front = part => ({ ...part, layer: 'front' });

// A straight crenellated wall along x (axis 'x', at z) or along z (axis 'z', at x); merlons on the outer side.
function wall(axis, at, from, to, { height, thickness = 0.3, outer = 1, material = 'stone', merlons = true, frontLayer = false }) {
  const len = to - from, mid = (from + to) / 2, parts = [];
  const sized = (l, h, t, y, off = 0) => (axis === 'x' ? box([l, h, t], [mid, y, at + off]) : box([t, h, l], [at + off, y, mid]));
  const mat = (part, m) => ({ ...part, material: m });
  parts.push(mat(sized(len + 0.04, 0.14, thickness + 0.08, 0), 'stone_dark'), mat(sized(len, height - 0.14, thickness, 0.14), material));
  parts.push(mat(sized(len, 0.07, thickness + 0.06, height), 'stone_light'));
  if (merlons) {
    const n = Math.max(2, Math.round(len / 0.34)), step = len / n;
    for (let i = 0; i < n; i++) {
      const c = from + step * (i + 0.5), off = outer * (thickness / 2 - 0.05);
      const m = axis === 'x' ? box([step * 0.52, 0.24, 0.12], [c, height + 0.07, at + off], material) : box([0.12, 0.24, step * 0.52], [at + off, height + 0.07, c], material);
      parts.push(frontLayer && outer > 0 ? front(m) : m);
    }
  }
  return parts;
}
// A round tower with a corbelled, crenellated top and an optional cone roof; slits on the faces the camera sees.
function roundTower(x, z, { r = 0.36, height = 2.4, roof = 'roof_tile', roofHeight = 0.8, material = 'stone', frontLayer = false }) {
  const parts = [cylinder({ radiusBottom: r + 0.04, radiusTop: r + 0.02, height: 0.18, segments: 20 }, [x, 0, z], 'stone_dark'),
    cylinder({ radiusBottom: r, radiusTop: r * 0.94, height: height - 0.18, segments: 20 }, [x, 0.18, z], material),
    cylinder({ radiusBottom: r * 0.94, radiusTop: r + 0.07, height: 0.14, segments: 20 }, [x, height, z], 'stone_light')];
  const top = height + 0.14;
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2, m = box([0.13, 0.22, 0.1], [x + Math.cos(a) * (r - 0.01), top, z + Math.sin(a) * (r - 0.01)], material, { rotation: -a + Math.PI / 2 });
    parts.push(frontLayer && Math.cos(a) + Math.sin(a) > 0.1 ? front(m) : m);
  }
  for (const [a, y] of [[Math.PI / 4, height * 0.45], [Math.PI / 2 - 0.2, height * 0.72], [0.2, height * 0.72]]) parts.push(box([0.05, 0.26, 0.07], [x + Math.cos(a) * (r * 0.97 - 0.01), y, z + Math.sin(a) * (r * 0.97 - 0.01)], 'opening', { rotation: -a + Math.PI / 2 }));
  if (roof) parts.push(cylinder({ radiusBottom: r + 0.1, radiusTop: 0, height: roofHeight, segments: 20 }, [x, top + 0.04, z], roof), cylinder({ radiusBottom: 0.015, radiusTop: 0.015, height: 0.22, segments: 6 }, [x, top + roofHeight, z], 'iron'));
  return { parts, top: roof ? top + roofHeight + 0.22 : top + 0.22 };
}
// A flag on a pole standing at (x, y, z), flying towards +X so it reads from the camera.
function flag(x, y, z, material, size = 1) {
  return [cylinder({ radiusBottom: 0.025, radiusTop: 0.02, height: 0.95 * size, segments: 6 }, [x, y, z], 'wood_dark'),
    box([0.42 * size, 0.27 * size, 0.025], [x + 0.22 * size, y + 0.62 * size, z], material),
    box([0.08 * size, 0.27 * size, 0.026], [x + 0.36 * size, y + 0.62 * size, z], 'gold_trim')];
}
// Gate torches on both sides of an opening on the +Z face at (x, z).
function gateTorches(x, z, gap, y = 0.85) {
  const parts = [], lights = [];
  for (const s of [-1, 1]) {
    const tx = x + s * gap;
    parts.push(box([0.07, 0.1, 0.07], [tx, y - 0.05, z + 0.04], 'iron'), cylinder({ radiusBottom: 0.03, radiusTop: 0.045, height: 0.22, segments: 6 }, [tx, y, z + 0.1], 'wood_dark'));
    lights.push({ type: 'torch', at: [tx, y + 0.28, z + 0.1] });
  }
  return { parts, lights };
}
// A lit window: an opening with a stone sill on a +Z or +X face; the light glows at night.
function litWindow(face, x, y, z, lights, size = [0.14, 0.22]) {
  const [w, h] = size;
  lights.push({ type: 'window', at: face === 'left' ? [x, y + h / 2, z + 0.06] : [x + 0.06, y + h / 2, z] });
  return face === 'left'
    ? [box([w + 0.06, 0.04, 0.05], [x, y - 0.04, z + 0.01], 'stone_light'), box([w, h, 0.04], [x, y, z + 0.01], 'opening')]
    : [box([0.05, 0.04, w + 0.06], [x + 0.01, y - 0.04, z], 'stone_light'), box([0.04, h, w], [x + 0.01, y, z], 'opening')];
}
const building = (spec, at, ctx) => { const b = house.build(spec, ctx); return { parts: shift(b.primitives, at[0], at[1], at[2] ?? 0), lights: b.lights.map(l => ({ ...l, at: [l.at[0] + at[0], l.at[1] + (at[2] ?? 0), l.at[2] + at[1]] })), height: (at[2] ?? 0) + b.height }; };

function curtain(spec, ctx) {
  const roof = spec.roof ?? 'roof_tile', a = 1.02, wh = 1.45, parts = [], lights = [];
  // Bailey floor, then the palace at the back so the front walls overlap it.
  parts.push(box([2 * a, 0.03, 2 * a], [0, 0, 0], 'fieldstone'));
  const palace = building({ walls: 'stone', width: 1.5, depth: 0.82, wallHeight: 1.85, roofHeight: 0.72, roofMaterial: roof, ridge: 'x', windows: 0, chimney: true }, [-0.18, -0.38], ctx);
  parts.push(...palace.parts);
  for (const x of [-0.65, -0.18, 0.29]) parts.push(...litWindow('left', x, 1.55, 0.03, lights));
  parts.push(...litWindow('right', 0.57, 1.55, -0.38, lights));
  parts.push(...flag(-0.18, palace.height - 0.05, -0.38, spec.banner ?? 'banner', 1.1));
  // Curtain walls: back and left-back full height, front walls a little lower so the palace shows.
  parts.push(...wall('x', -a, -a, a, { height: wh + 0.15, outer: -1 }), ...wall('z', -a, -a, a, { height: wh + 0.15, outer: -1 }));
  parts.push(...wall('z', a, -a, a, { height: wh, outer: 1, frontLayer: true }));
  parts.push(...wall('x', a, -a, -0.42, { height: wh, outer: 1, frontLayer: true }), ...wall('x', a, 0.42, a, { height: wh, outer: 1, frontLayer: true }));
  // Gatehouse in the middle of the front (+Z) wall: two half-round towers, the arch, a portcullis and the walk above.
  const gz = a + 0.06;
  parts.push(box([0.9, 1.9, 0.52], [0, 0, gz - 0.04], 'stone'), box([0.96, 0.08, 0.58], [0, 1.9, gz - 0.04], 'stone_light'));
  for (const x of [-0.36, -0.12, 0.12, 0.36]) parts.push(front(box([0.13, 0.24, 0.12], [x, 1.98, gz + 0.17], 'stone')));
  parts.push(box([0.44, 0.86, 0.04], [0, 0, gz + 0.22], 'stone_dark'), box([0.36, 0.8, 0.05], [0, 0, gz + 0.23], 'opening'));
  for (const x of [-0.12, 0, 0.12]) parts.push(box([0.025, 0.74, 0.03], [x, 0.06, gz + 0.26], 'iron'));
  for (const y of [0.3, 0.6]) parts.push(box([0.36, 0.025, 0.03], [0, y, gz + 0.26], 'iron'));
  parts.push(box([0.06, 0.24, 0.05], [-0.28, 1.3, gz + 0.22], 'opening'), box([0.06, 0.24, 0.05], [0.28, 1.3, gz + 0.22], 'opening'));
  parts.push(box([0.5, 0.62, 0.025], [0, 1.08, gz + 0.235], 'banner'), box([0.5, 0.06, 0.03], [0, 1.68, gz + 0.24], 'wood_dark'));
  const t = gateTorches(0, gz + 0.22, 0.34, 0.78); parts.push(...t.parts); lights.push(...t.lights);
  // Corner towers; the front corner keeps a crenellated top (no roof) so it does not hide the gate. Its top is the
  // platform where the king stands.
  let top = 0;
  for (const [x, z] of [[-a, -a], [a, -a], [-a, a], [a, a]]) {
    const frontCorner = x > 0 && z > 0, tw = roundTower(x, z, { height: frontCorner ? 2.15 : 2.35, roof: frontCorner ? null : roof, frontLayer: frontCorner });
    parts.push(...tw.parts); top = Math.max(top, tw.top);
  }
  return { primitives: parts, lights, height: Math.max(top, palace.height + 1.05), platform: [a, 2.29, a] };
}

function keep(spec, ctx) {
  const roof = spec.roof ?? 'roof_shingle', a = 1.12, wh = 1.05, parts = [], lights = [];
  parts.push(box([2 * a, 0.03, 2 * a], [0, 0, 0], 'soil'));
  // Bergfried at the back corner: tall, slightly tapering, with a corbelled crenellated top (the platform).
  const kx = -0.42, kz = -0.42, kw = 1.0, kh = 3.35;
  parts.push(squareFrustum(kw + 0.12, 0.3, 0.96, [kx, 0, kz], 'stone_dark'), squareFrustum(kw, kh - 0.3, 0.92, [kx, 0.3, kz], 'stone'));
  const tw = kw * 0.92, ledge = tw + 0.18;
  parts.push(squareFrustum(tw - 0.02, 0.16, ledge / (tw - 0.02), [kx, kh, kz], 'stone_light'));
  const my = kh + 0.16;
  for (let i = 0; i < 4; i++) {
    const s = lerp(-ledge / 2 + 0.1, ledge / 2 - 0.1, i / 3), inset = ledge / 2 - 0.06;
    parts.push(front(box([0.16, 0.28, 0.12], [kx + s, my, kz + inset], 'stone')), box([0.16, 0.28, 0.12], [kx + s, my, kz - inset], 'stone'));
    parts.push(front(box([0.12, 0.28, 0.16], [kx + inset, my, kz + s], 'stone')), box([0.12, 0.28, 0.16], [kx - inset, my, kz + s], 'stone'));
  }
  parts.push(...flag(kx - 0.2, my, kz - 0.2, spec.banner ?? 'banner', 1.15));
  // The high entrance with a timber stair, slits and two lit windows.
  parts.push(box([0.26, 0.42, 0.04], [kx + 0.15, 1.5, kz + kw / 2 - 0.02], 'wood_dark'), box([0.34, 0.06, 0.32], [kx + 0.15, 1.44, kz + kw / 2 + 0.14], 'wood'));
  for (let i = 0; i < 5; i++) parts.push(box([0.3, 0.06, 0.12], [kx + 0.15 + 0.13 * (i + 1), 1.44 - 0.27 * (i + 1), kz + kw / 2 + 0.14], 'wood'));
  parts.push(box([0.05, 1.44, 0.05], [kx + 0.15 + 0.7, 0, kz + kw / 2 + 0.14], 'wood_dark'));
  parts.push(...litWindow('left', kx - 0.2, 2.45, kz + kw * 0.46 + 0.01, lights), ...litWindow('right', kx + kw * 0.45 + 0.01, 2.45, kz + 0.1, lights));
  parts.push(box([0.05, 0.24, 0.05], [kx - 0.25, 1.1, kz + kw / 2 + 0.005], 'opening'), box([0.05, 0.24, 0.05], [kx + kw / 2 + 0.005, 1.4, kz - 0.25], 'opening'));
  // Bailey: a timber hall on the right and a lean-to stable, then the low walls.
  const hall = building({ walls: 'timber', width: 0.62, depth: 1.05, wallHeight: 0.85, roofHeight: 0.55, roofMaterial: roof, ridge: 'z', windows: 1, chimney: true }, [0.62, -0.5], ctx);
  parts.push(...hall.parts);
  parts.push(...litWindow('left', 0.62, 0.62, -0.5 + 0.53, lights, [0.12, 0.18]));
  parts.push(box([0.7, 0.62, 0.36], [-0.55, 0, 0.55], 'wood'), prism([0.36, 0.22, 0.74], [-0.55, 0.62, 0.55], roof, { rotation: Math.PI / 2 }));
  parts.push(...wall('x', -a, -a, a, { height: wh, outer: -1, thickness: 0.26 }), ...wall('z', -a, -a, a, { height: wh, outer: -1, thickness: 0.26 }));
  parts.push(...wall('z', a, -a, a, { height: wh, outer: 1, thickness: 0.26, frontLayer: true }));
  parts.push(...wall('x', a, -a, 0.02, { height: wh, outer: 1, thickness: 0.26, frontLayer: true }), ...wall('x', a, 0.7, a, { height: wh, outer: 1, thickness: 0.26, frontLayer: true }));
  // Gate in the front wall: square gate towers with pyramid roofs and a timber gate.
  for (const x of [0.02, 0.7]) parts.push(box([0.26, 1.45, 0.4], [x, 0, a], 'stone'), pyramid(0.34, 0.42, [x, 1.45, a], roof));
  parts.push(box([0.42, 0.08, 0.36], [0.36, 1.05, a], 'stone_light'), box([0.42, 0.34, 0.3], [0.36, 0.71, a], 'stone'));
  parts.push(box([0.42, 0.7, 0.04], [0.36, 0, a + 0.02], 'wood_dark'), box([0.42, 0.05, 0.05], [0.36, 0.35, a + 0.045], 'iron'));
  const t = gateTorches(0.36, a + 0.2, 0.3, 0.86); parts.push(...t.parts); lights.push(...t.lights);
  // Corner bastions at the back and left; the right-front corner gets a small round tower.
  for (const [x, z] of [[-a, -a], [a, -a], [-a, a]]) parts.push(box([0.36, 1.3, 0.36], [x, 0, z], 'stone'), box([0.4, 0.07, 0.4], [x, 1.3, z], 'stone_light'));
  const rt = roundTower(a - 0.02, a - 0.02, { r: 0.26, height: 1.45, roof, roofHeight: 0.5 }); parts.push(...rt.parts);
  return { primitives: parts, lights, height: my + 0.28 + 1.1, platform: [kx, my, kz] };
}

function motte(spec, ctx) {
  const roof = spec.roof ?? 'roof_shingle', parts = [], lights = [], top = 0.5;
  // Earth mound with a grassy crown and a ring of stones at its foot.
  parts.push(cylinder({ radiusBottom: 1.4, radiusTop: 1.1, height: top - 0.04, segments: 28 }, [0, 0, 0], 'soil'), cylinder({ radiusBottom: 1.12, radiusTop: 1.08, height: 0.04, segments: 28 }, [0, top - 0.04, 0], 'moss'));
  // Stone hall at the back and a timber tower (the platform) on the left-back.
  const hall = building({ walls: 'stone', width: 1.15, depth: 0.7, wallHeight: 1.05, roofHeight: 0.62, roofMaterial: roof, ridge: 'x', windows: 0, chimney: true }, [0.1, -0.42, top], ctx);
  parts.push(...hall.parts);
  for (const x of [-0.15, 0.35]) parts.push(...litWindow('left', x, top + 0.62, -0.42 + 0.36, lights, [0.13, 0.2]));
  parts.push(...litWindow('right', 0.1 + 0.59, top + 0.62, -0.42, lights, [0.13, 0.2]));
  const tx = -0.62, tz = -0.35, tw = 0.6, th = 1.75;
  for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) parts.push(box([0.1, th, 0.1], [tx + x * tw / 2, top, tz + z * tw / 2], 'wood_dark'));
  parts.push(box([tw - 0.04, 0.9, tw - 0.04], [tx, top, tz], 'wood'));
  for (const s of [1, -1]) parts.push(box([0.05, 1.0, 0.04], [tx, top + 0.95, tz + s * (tw / 2 - 0.05)], 'wood_dark', { tilt: [0, s * 0.5] }));
  const gy = top + th;
  parts.push(box([tw + 0.24, 0.5, tw + 0.24], [tx, gy, tz], 'wood'), box([0.26, 0.2, 0.04], [tx, gy + 0.18, tz + (tw + 0.24) / 2 + 0.005], 'opening'), box([0.04, 0.2, 0.26], [tx + (tw + 0.24) / 2 + 0.005, gy + 0.18, tz], 'opening'));
  parts.push(pyramid(tw + 0.38, 0.62, [tx, gy + 0.5, tz], roof));
  parts.push(...flag(tx + 0.02, gy + 1.08, tz, spec.banner ?? 'banner', 0.95));
  // Palisade around the crown, open at the gate on the +Z side.
  const R = 1.0, n = 34;
  for (let i = 0; i < n; i++) {
    const ang = i / n * Math.PI * 2, x = Math.cos(ang) * R, z = Math.sin(ang) * R;
    if (Math.abs(x - 0.1) < 0.28 && z > 0) continue; // gate gap
    const h = 0.72 + ((i * 7) % 3) * 0.05, frontStake = Math.cos(ang) + Math.sin(ang) > 0.2;
    const stake = [cylinder({ radiusBottom: 0.075, radiusTop: 0.075, height: h, segments: 7 }, [x, top - 0.02, z], 'bark'), cylinder({ radiusBottom: 0.075, radiusTop: 0.005, height: 0.16, segments: 7 }, [x, top - 0.02 + h, z], 'wood')];
    parts.push(...(frontStake ? stake.map(front) : stake));
  }
  // Gate: two posts, a lintel with a little roof, an open gate leaf, and a timber ramp down the mound.
  const gx = 0.1, gz = R;
  for (const s of [-1, 1]) parts.push(box([0.12, 1.15, 0.12], [gx + s * 0.27, top - 0.02, gz], 'wood_dark'));
  parts.push(box([0.66, 0.1, 0.16], [gx, top + 1.1, gz], 'wood_dark'), prism([0.82, 0.2, 0.3], [gx, top + 1.2, gz], roof, { rotation: Math.PI / 2 }));
  parts.push(box([0.06, 0.7, 0.24], [gx - 0.2, top, gz + 0.13], 'wood'));
  for (let i = 0; i < 3; i++) parts.push(box([0.46, 0.1, 0.12], [gx, top - 0.15 * (i + 1), gz + 0.06 + 0.1 * (i + 1)], 'wood'));
  const t = gateTorches(gx, gz + 0.06, 0.27, top + 0.75); parts.push(...t.parts); lights.push(...t.lights);
  return { primitives: parts, lights, height: gy + 0.5 + 0.62 + 0.4, platform: [tx, gy, tz] };
}

const LAYOUTS = { curtain, keep, motte };
export function build(spec, { footprint, style }) {
  const model = (LAYOUTS[spec.layout] ?? curtain)(spec, { footprint, style });
  // The flag poles and roof tips decide the real height; take it from the parts.
  model.height = Math.max(...model.primitives.map(part => primitiveBounds(part).max[1]));
  return model;
}

export default { id: 'castle', version: 1, label: 'Castle', params, build };
