// Vehicles (owner, 7 Nov 2026: "new versions of the caravan, the wheelbarrow and the horse wagon, several kinds of
// each"). Each rig is built along +x (front = +x) and turned to face `angle` (0 = +x, π/2 = +z) about (x, z), the
// middle of the whole rig. Horses come from the animal recipe (anatomical skeleton, with a harness).
import { box, cylinder, sphere, prism, turnParts } from './shapes.js';
import { PROPS } from './props.js';
import { build as buildAnimal } from './animal.js';

// Skeletons (the approved Blender horse body) travel with the parts: rotated and moved the same way.
const turnVerts = (verts, a) => { const c = Math.cos(a), s = Math.sin(a); return verts.map(([x, y, z, r]) => [x * c + z * s, y, -x * s + z * c, r]); };
const place = (parts, x, z, angle) => {
  const out = turnParts(parts, -angle).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
  out.skeletons = (parts.skeletons ?? []).map(sk => ({ ...sk, verts: turnVerts(sk.verts, -angle).map(([a, b, c, r]) => [a + x, b, c + z, r]) }));
  return out;
};
const pushAll = (into, parts) => { into.push(...parts); if (parts.skeletons?.length) into.skeletons = [...(into.skeletons ?? []), ...parts.skeletons]; return into; };
// A harnessed horse standing with its front along +x, hooves at local (hx, 0, hz). Owner, 7 Nov 2026: the approved
// realistic horse (Blender skin) at the same size as the standalone horse (scale 1).
const horseAt = (hx, hz, { coat = 'bay', scale = 1 } = {}) => {
  const made = buildAnimal({ species: 'horse', breed: coat, harness: true, skin: true }, { footprint: { width: 2, height: 2 } });
  const parts = turnParts(made.primitives, Math.PI / 4).map(p => scaled(p, scale, hx, hz));
  if (made.skeleton) parts.skeletons = [{ ...made.skeleton, verts: turnVerts(made.skeleton.verts, Math.PI / 4).map(([x, y, z, r]) => [x * scale + hx, y * scale, z * scale + hz, r * scale]), sockFrom: made.skeleton.sockFrom * scale }];
  return parts;
};
function scaled(p, k, dx, dz) {
  const out = { ...p, at: [p.at[0] * k + dx, p.at[1] * k, p.at[2] * k + dz] };
  if (p.size) out.size = p.size.map(v => v * k);
  if (p.radii) out.radii = p.radii.map(v => v * k);
  if (p.height !== undefined) out.height = p.height * k;
  if (p.radiusBottom !== undefined) out.radiusBottom = p.radiusBottom * k;
  if (p.radiusTop !== undefined) out.radiusTop = p.radiusTop * k;
  return out;
}
// Spoked wheel standing in the x–y plane at local (wx, wz): spokes in the given count, an iron tyre.
const wheel = (wx, wz, r, { spokes = 8, thick = 0.035 } = {}) => PROPS.spokedWheel(wx, wz, { radius: r, plane: 'x', spokes, thick });
// Loads lying in a bed at height y over the area [length × width] around (cx, cz).
// Revision 2 (owner: "a full barrow should be heaped with material"): every load rises in a mound above the rim.
function load(kind, cx, y, cz, length, width) {
  const parts = [], rnd = (i, k) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;
  // n pieces laid in layers that shrink upwards (a heap); each piece gets (f, layer height, s, index).
  const heap = (n, layers, fn) => { let i = 0; for (let l = 0; l < layers; l++) { const k = 1 - l / (layers + 0.6), per = Math.max(1, Math.round(n * k / layers * 1.6)); for (let j = 0; j < per && i < n; j++, i++) fn((rnd(i, 1) - 0.5) * length * 0.9 * k, y + l * width * 0.2, (rnd(i, 2) - 0.5) * width * 0.6 * k, i); } };
  if (kind === 'stone') heap(14, 4, (f, h, s, i) => parts.push(sphere([width * (0.13 + rnd(i, 3) * 0.06), width * 0.12, width * (0.13 + rnd(i, 4) * 0.05)], [cx + f, h, cz + s], i % 3 ? 'fieldstone' : 'stone_light', 1)));
  if (kind === 'ore') heap(16, 4, (f, h, s, i) => parts.push(sphere([width * (0.11 + rnd(i, 3) * 0.06), width * 0.11, width * 0.12], [cx + f, h, cz + s], i % 3 ? 'ore' : 'stone_dark', 1)));
  if (kind === 'soil' || kind === 'manure') parts.push(sphere([length * 0.5, width * 0.45, width * 0.5], [cx, y - width * 0.1, cz], kind === 'soil' ? 'soil' : 'horse_dark', 1), sphere([length * 0.3, width * 0.3, width * 0.32], [cx, y + width * 0.25, cz], kind === 'soil' ? 'soil' : 'horse_dark', 1));
  if (kind === 'logs') for (let i = 0; i < 6; i++) { const row = i < 3 ? 0 : i < 5 ? 1 : 2, k = [3, 2, 1][row], j = i - [0, 3, 5][row]; parts.push(cylinder({ radiusBottom: width * 0.14, height: length * 1.05, segments: 8, tilt: [0, -Math.PI / 2] }, [cx - length * 0.52, y + width * 0.14 + row * width * 0.24, cz + (j - (k - 1) / 2) * width * 0.29], 'bark')); }
  if (kind === 'wood') heap(12, 4, (f, h, s, i) => parts.push(box([length * 0.42, width * 0.13, width * 0.15], [cx + f * 0.4, h, cz + s], i % 4 ? 'wood' : 'bark', { rotation: (rnd(i, 5) - 0.5) * 0.6 })));
  if (kind === 'ironbars') for (let l = 0; l < 4; l++) for (let j = 0; j < 4 - l; j++) parts.push(box([length * 0.7, width * 0.09, width * 0.14], [cx, y + l * width * 0.1, cz + (j - (3 - l) / 2) * width * 0.18], l % 2 ? 'steel' : 'iron', { rotation: l % 2 ? 0.08 : -0.05 }));
  if (kind === 'fish') heap(11, 3, (f, h, s, i) => { const r = (rnd(i, 5) - 0.5) * 2.4; parts.push(sphere([length * 0.2, width * 0.07, width * 0.09], [cx + f, h, cz + s], 'fish', 1, { rotation: r }), box([width * 0.08, width * 0.1, width * 0.02], [cx + f - Math.cos(r) * length * 0.2, h, cz + s + Math.sin(r) * length * 0.2], 'stone_dark', { rotation: r })); });
  if (kind === 'meat') heap(7, 3, (f, h, s, i) => parts.push(sphere([length * 0.17, width * 0.15, width * 0.17], [cx + f, h, cz + s], i % 2 ? 'meat' : 'meat_raw', 1, { rotation: rnd(i, 6) * 3 }), box([width * 0.05, width * 0.05, width * 0.14], [cx + f + length * 0.17, h + width * 0.1, cz + s], 'bone', { rotation: rnd(i, 6) * 3 })));
  if (kind === 'bread') heap(12, 4, (f, h, s, i) => parts.push(sphere([width * 0.16, width * 0.1, width * 0.12], [cx + f, h, cz + s], i % 3 ? 'bread' : 'bread_crust', 1, { rotation: rnd(i, 7) * 3 })));
  if (kind === 'mixed') { parts.push(...load('ore', cx - length * 0.22, y, cz - width * 0.15, length * 0.45, width * 0.5), ...load('wood', cx + length * 0.15, y, cz - width * 0.15, length * 0.6, width * 0.5)); parts.push(sphere([length * 0.16, width * 0.18, width * 0.2], [cx - length * 0.05, y + width * 0.15, cz + width * 0.22], 'cloth_linen', 1), sphere([width * 0.14, width * 0.09, width * 0.11], [cx + length * 0.25, y + width * 0.12, cz + width * 0.2], 'bread', 1), sphere([length * 0.13, width * 0.06, width * 0.08], [cx + length * 0.1, y + width * 0.3, cz + width * 0.1], 'fish', 1, { rotation: 0.6 })); }
  if (kind === 'sacks') for (const [f, s, up] of [[-0.25, -0.22, 0], [-0.25, 0.22, 0], [0.2, -0.2, 0], [0.2, 0.2, 0], [0, 0, 1], [-0.1, 0.1, 1.6]]) parts.push(sphere([length * 0.2, width * 0.17, width * 0.22], [cx + f * length, y + up * width * 0.28, cz + s * width], 'cloth_linen', 1));
  if (kind === 'hay') parts.push(sphere([length * 0.62, width * 0.8, width * 0.7], [cx, y - width * 0.2, cz], 'thatch', 1), sphere([length * 0.48, width * 0.45, width * 0.52], [cx, y + width * 0.5, cz], 'thatch', 1));
  if (kind === 'barrels') for (const f of [-0.28, 0.02, 0.3]) parts.push(...PROPS.barrel(cx + f * length, cz, { y }));
  if (kind === 'goods') { parts.push(box([length * 0.3, width * 0.4, width * 0.4], [cx - length * 0.25, y, cz - width * 0.2], 'wood'), box([length * 0.25, width * 0.32, width * 0.32], [cx + length * 0.1, y, cz + width * 0.2], 'wood_dark'), sphere([length * 0.14, width * 0.15, width * 0.18], [cx + length * 0.3, y, cz - width * 0.15], 'cloth_linen', 1)); parts.push(...PROPS.barrel(cx - length * 0.05, cz + width * 0.25, { y })); }
  return parts;
}

Object.assign(PROPS, {
  // ---------- wheelbarrows and hand carts (the Hauler's vehicle) ----------
  // kind: 'plank' (open plank barrow, spoked wheel), 'tub' (deep box, iron-banded solid wheel), 'handcart' (two
  // wheels, rails, shafts), 'sack' (upright sack barrow on two small wheels). load: empty, stone, soil, logs, sacks, hay.
  barrow: (x, z, { angle = 0, kind = 'plank', load: what = 'empty' } = {}) => {
    const L = [];
    if (kind === 'plank' || kind === 'tub') {
      const tub = kind === 'tub', len = tub ? 0.36 : 0.34, wid = tub ? 0.24 : 0.26, y = 0.12, h = tub ? 0.13 : 0.08;
      L.push(box([len, 0.025, wid * 0.8], [0, y, 0], 'wood'));
      for (const s of [-1, 1]) L.push(box([len, h, 0.02], [0, y, s * wid / 2], tub ? 'wood_dark' : 'wood', { tilt: [s * (tub ? 0.1 : 0.35), 0] }));
      L.push(box([0.02, h, wid], [-len / 2, y, 0], 'wood'), box([0.02, h * 0.8, wid * 0.8], [len / 2, y, 0], 'wood', { tilt: [0, -0.4] }));
      if (tub) for (const f of [-0.12, 0.12]) L.push(box([0.015, h + 0.01, wid + 0.03], [f, y - 0.005, 0], 'iron'));
      for (const s of [-1, 1]) L.push(box([0.62, 0.025, 0.025], [-0.08, y - 0.02, s * 0.1], 'wood_dark'), box([0.06, 0.03, 0.03], [-0.38, y - 0.02, s * 0.11], 'leather'), box([0.025, 0.12, 0.025], [-0.13, 0, s * 0.1], 'wood_dark'));
      if (tub) L.push(cylinder({ radiusBottom: 0.085, height: 0.04, segments: 14, tilt: [Math.PI / 2, 0] }, [0.25, 0.085, -0.02], 'wood_dark'), cylinder({ radiusBottom: 0.09, height: 0.03, segments: 14, tilt: [Math.PI / 2, 0] }, [0.25, 0.085, -0.015], 'iron'));
      else L.push(...wheel(0.25, 0, 0.09, { spokes: 6, thick: 0.03 }));
      L.push(...load(what, -0.01, y + 0.04, 0, len * 0.95, wid * 1.35)); // heaped above the rim
    } else if (kind === 'handcart') {
      const len = 0.5, wid = 0.34, y = 0.2;
      L.push(box([len, 0.03, wid], [0, y, 0], 'wood'), box([0.05, 0.05, wid + 0.1], [0, y - 0.05, 0], 'wood_dark'));
      for (const s of [-1, 1]) { L.push(box([len, 0.02, 0.02], [0, y + 0.12, s * wid / 2], 'wood_dark')); for (const f of [-0.22, 0, 0.22]) L.push(box([0.02, 0.12, 0.02], [f, y + 0.02, s * wid / 2], 'wood_dark')); }
      for (const s of [-1, 1]) L.push(...wheel(0, s * (wid / 2 + 0.04), 0.19, { spokes: 8 }), box([0.5, 0.03, 0.03], [-0.45, y - 0.02, s * 0.12], 'wood_dark'));
      L.push(box([0.03, 0.03, 0.27], [-0.68, y - 0.02, 0], 'wood_dark'), box([0.03, 0.2, 0.03], [0.22, 0, 0], 'wood_dark'));
      L.push(...load(what, 0, y + 0.03, 0, len * 0.85, wid * 0.85));
    } else { // sack barrow: two handles leaning back, a toe plate and two small wheels
      for (const s of [-1, 1]) L.push(box([0.025, 0.6, 0.025], [0.06, 0.04, s * 0.09], 'wood_dark', { tilt: [0, 0.35] }), ...wheel(0.08, s * 0.14, 0.06, { spokes: 5, thick: 0.025 }));
      for (const h of [0.2, 0.36]) L.push(box([0.02, 0.02, 0.2], [0.06 - h * 0.34, 0.04 + h * 0.94, 0], 'wood_dark'));
      L.push(box([0.1, 0.015, 0.2], [0.11, 0.02, 0], 'iron'));
      if (what !== 'empty') L.push(sphere([0.07, 0.13, 0.09], [0.07, 0.15, 0], what === 'sacks' ? 'cloth_linen' : 'cloth_wool', 1, { tilt: [0, 0.35] }), sphere([0.06, 0.1, 0.08], [0.0, 0.33, 0], 'cloth_linen', 1, { tilt: [0, 0.35] }));
    }
    return place(L, x, z, angle);
  },

  // ---------- horse wagons (the player's Horse Wagon) ----------
  // kind: 'farm' (four-wheeled flatbed with rails), 'hay' (ladder-sided hay wagon), 'tumbril' (two-wheeled tipping cart),
  // 'timber' (long log wagon), 'pair' (big wagon with two horses). load as for barrows; coat: horse breed.
  horseWagon: (x0, z0, { angle = 0, kind = 'farm', load: what = 'empty', coat = 'bay', tipped = false } = {}) => {
    const L = [], two = kind === 'tumbril' || kind === 'ore', pair = kind === 'pair', len = two ? 0.56 : kind === 'timber' ? 1.0 : pair ? 0.96 : 0.8, wid = pair ? 0.5 : 0.42, y = two ? 0.24 : 0.28;
    const shift = pair ? -0.5 : -0.42; // the bed sits behind the horse; (x0, z0) is the middle of the rig
    const bed = [];
    if (kind === 'timber') {
      bed.push(box([len, 0.05, 0.08], [0, y - 0.04, 0], 'wood_dark'));
      for (const f of [-0.36, 0.36]) bed.push(box([0.07, 0.06, wid + 0.08], [f * len, y, 0], 'wood_dark'), ...[-1, 1].map(s => box([0.03, 0.14, 0.03], [f * len, y + 0.04, s * (wid / 2 + 0.02)], 'iron')));
    } else {
      bed.push(box([len, 0.04, wid], [0, y, 0], 'wood'));
      if (kind === 'hay') for (const s of [-1, 1]) { bed.push(box([len + 0.1, 0.025, 0.025], [0, y + 0.24, s * (wid / 2 + 0.05)], 'wood_dark')); for (let i = 0; i < 6; i++) bed.push(box([0.02, 0.26, 0.02], [-len / 2 + 0.05 + i * (len - 0.1) / 5, y, s * (wid / 2 + 0.02)], 'wood_dark', { tilt: [s * -0.18, 0] })); }
      else {
        const h = two ? 0.16 : pair ? 0.15 : 0.1;
        for (const s of [-1, 1]) bed.push(box([len, h, 0.03], [0, y + 0.04, s * (wid / 2 - 0.015)], kind === 'farm' ? 'wood' : 'wood_dark'));
        bed.push(box([0.03, h, wid], [-len / 2 + 0.015, y + 0.04, 0], 'wood'), box([0.03, h, wid], [len / 2 - 0.015, y + 0.04, 0], 'wood'));
        if (pair || kind === 'ore') for (const s of [-1, 1]) for (const f of [-0.3, 0, 0.3]) bed.push(box([0.025, h + 0.01, 0.035], [f * len, y + 0.04, s * (wid / 2)], 'iron'));
        // Plank seams and corner stakes on every box side (revision 2: more realistic carpentry).
        for (const s of [-1, 1]) { bed.push(box([len - 0.02, 0.008, 0.034], [0, y + 0.04 + h * 0.5, s * (wid / 2 - 0.015)], 'wood_dark')); for (const f of [-0.5, 0.5]) bed.push(box([0.035, h + 0.05, 0.035], [f * (len - 0.03), y, s * (wid / 2 - 0.01)], 'wood_dark')); }
        if (kind === 'covered') { bed.push(prism([wid + 0.06, 0.3, len * 0.85], [-0.02, y + 0.04 + h, 0], 'cloth_linen', { rotation: Math.PI / 2 })); for (const f of [-0.3, 0, 0.3]) bed.push(box([0.025, 0.02, wid + 0.07], [f * len, y + 0.05 + h, 0], 'wood_dark')); }
      }
    }
    bed.push(...load(what, 0, y + 0.06, 0, len * 0.85, wid * 0.85));
    if (two && tipped) { // the tumbril tips its bed back to dump the load
      const c = Math.cos(-0.45), s = Math.sin(-0.45);
      for (const p of bed) { const dx = p.at[0], dy = p.at[1] - y; p.at = [dx * c - dy * s, y + dx * s + dy * c, p.at[2]]; if (p.shape === 'box') p.tilt = [p.tilt?.[0] ?? 0, (p.tilt?.[1] ?? 0) - 0.45]; }
    }
    L.push(...bed.map(p => ({ ...p, at: [p.at[0] + shift, p.at[1], p.at[2]] })));
    // Axles and wheels: small front, big back pair; the tumbril has one big pair in the middle.
    const axles = two ? [[0, 0.24]] : [[len * 0.32, 0.16], [-len * 0.32, 0.2]];
    for (const [ax, r] of axles) { L.push(box([0.06, 0.05, wid + 0.14], [ax + shift, r - 0.02, 0], 'wood_dark')); for (const s of [-1, 1]) L.push(...wheel(ax + shift, s * (wid / 2 + 0.05), r, { spokes: r > 0.2 ? 10 : 8 })); }
    // Shafts (one horse) or a pole (pair), the driver's bench with a seated sack.
    if (pair) L.push(box([0.75, 0.035, 0.035], [len / 2 + shift + 0.36, y - 0.04, 0], 'wood_dark'));
    else for (const s of [-1, 1]) L.push(box([0.6, 0.03, 0.03], [len / 2 + shift + 0.28, y - 0.03, s * 0.13], 'wood_dark'));
    if (!two && kind !== 'timber') L.push(box([0.1, 0.04, wid - 0.06], [len / 2 + shift - 0.06, y + 0.2, 0], 'wood_dark'), box([0.03, 0.2, 0.03], [len / 2 + shift - 0.06, y, wid / 2 - 0.05], 'wood_dark'), box([0.03, 0.2, 0.03], [len / 2 + shift - 0.06, y, -wid / 2 + 0.05], 'wood_dark'));
    const hx = len / 2 + shift + 0.5;
    for (const s of pair ? [-0.27, -0.03, 0.03, 0.27] : [-0.1, 0.1]) L.push(box([0.42, 0.012, 0.012], [len / 2 + shift + 0.27, y + 0.08, s], 'leather', { tilt: [0, 0.18] })); // traces to the collar
    if (pair) { pushAll(L, horseAt(hx, 0.2, { coat })); pushAll(L, horseAt(hx, -0.2, { coat: coat === 'bay' ? 'chestnut' : coat })); }
    else pushAll(L, horseAt(hx, 0, { coat }));
    return place(L, x0, z0, angle);
  },

  // ---------- merchant caravans (revision 2) ----------
  // kind: 'striped' (hooped wagon, striped canvas, lantern and a chest on the tail), 'house' (wooden box wagon with a
  // shingle roof, a window and steps: the travelling merchant's home), 'pair' (long covered wagon, two horses, spare
  // wheel). load: full, unloading, empty.
  caravan: (x0, z0, { angle = 0, kind = 'striped', load: what = 'full', coat = 'chestnut', cover = 'cloth_red' } = {}) => {
    const L = [], pair = kind === 'pair', len = pair ? 1.0 : 0.84, wid = pair ? 0.5 : 0.44, y = 0.28, shift = pair ? -0.5 : -0.42;
    L.push(box([len, 0.05, wid], [shift, y, 0], 'wood'), box([len - 0.1, 0.03, wid + 0.04], [shift, y + 0.05, 0], 'wood_dark'));
    for (const [ax, r] of [[len * 0.3, 0.16], [-len * 0.3, 0.2]]) { L.push(box([0.06, 0.05, wid + 0.14], [ax + shift, r - 0.02, 0], 'wood_dark')); for (const s of [-1, 1]) L.push(...wheel(ax + shift, s * (wid / 2 + 0.05), r, { spokes: 10 })); }
    if (kind === 'house') {
      const h = 0.36, bl = len * 0.8, bx = shift - 0.03;
      L.push(box([bl, h, wid], [bx, y + 0.08, 0], 'wood'));
      for (const f of [-0.4, -0.13, 0.13, 0.4]) for (const s of [-1, 1]) L.push(box([0.025, h, 0.01], [bx + f * bl, y + 0.08, s * (wid / 2 + 0.005)], 'wood_dark'));
      for (const s of [-1, 1]) L.push(box([0.12, 0.1, 0.01], [bx + 0.08, y + 0.22, s * (wid / 2 + 0.012)], 'cloth_ochre'), box([0.14, 0.02, 0.015], [bx + 0.08, y + 0.33, s * (wid / 2 + 0.015)], cover));
      L.push(prism([wid + 0.1, 0.14, bl + 0.08], [bx, y + 0.08 + h, 0], 'roof_shingle', { rotation: Math.PI / 2 }), box([0.04, 0.1, 0.04], [bx - bl * 0.3, y + h + 0.14, 0.08], 'stone_dark'));
      L.push(box([0.02, 0.24, 0.14], [bx - bl / 2 - 0.005, y + 0.08, 0], 'wood_dark'), ...[0, 1].map(i => box([0.08, 0.02, 0.14], [bx - bl / 2 - 0.06 - i * 0.05, y - 0.1 - i * 0.09, 0], 'wood_dark')));
      if (what === 'unloading') L.push(...PROPS.crate(shift - len / 2 - 0.3, 0.2, { size: 0.16 }), ...PROPS.sack(shift - len / 2 - 0.3, -0.12), ...PROPS.barrel(shift - len / 2 - 0.15, -0.3));
      if (what === 'full') L.push(...PROPS.barrel(shift + len / 2 - 0.12, -0.12, { y: y + 0.05 }));
    } else {
      const hoops = pair ? [-0.42, -0.14, 0.14, 0.4] : [-0.38, -0.05, 0.26];
      for (const s of [-1, 1]) L.push(box([len, 0.11, 0.03], [shift, y + 0.06, s * (wid / 2 - 0.015)], 'wood'));
      if (what === 'full' || what === 'unloading') L.push(...load('goods', shift - 0.05, y + 0.08, 0, len * 0.7, wid * 0.8));
      if (what !== 'empty') {
        const covLen = what === 'unloading' ? 0.26 : len * 0.8, covX = what === 'unloading' ? shift + len * 0.28 : shift - 0.02;
        L.push(prism([wid + 0.08, 0.34, covLen], [covX, y + 0.17, 0], cover, { rotation: Math.PI / 2 }));
        if (kind === 'striped' && what === 'full') for (const f of [-0.3, 0, 0.3]) L.push(prism([wid + 0.085, 0.342, 0.06], [covX + f * covLen, y + 0.17, 0], 'cloth_linen', { rotation: Math.PI / 2 }));
        L.push(box([0.03, 0.18, wid + 0.08], [covX - covLen / 2, y + 0.15, 0], 'wood_dark'));
      } else for (const hx of hoops) for (const s of [-1, 1]) L.push(box([0.025, 0.22, 0.025], [shift + hx * len, y + 0.06, s * (wid / 2 - 0.02)], 'wood_dark'));
      if (what === 'unloading') { L.push(box([0.2, 0.025, wid - 0.04], [shift - len / 2 - 0.09, y - 0.06, 0], 'wood', { tilt: [0, -0.5] })); L.push(...PROPS.crate(shift - len / 2 - 0.32, 0.2, { size: 0.17 }), ...PROPS.sack(shift - len / 2 - 0.34, -0.14)); }
      if (kind === 'striped') L.push(box([0.16, 0.12, 0.2], [shift - len / 2 + 0.02, y - 0.12, 0], 'wood_dark'), box([0.17, 0.025, 0.21], [shift - len / 2 + 0.02, y, 0], 'iron'));
      if (pair) L.push(...PROPS.spokedWheel(shift - len / 2 - 0.02, 0, { radius: 0.16, plane: 'z', spokes: 10, y: 0 }).map(p => ({ ...p, at: [p.at[0], p.at[1] + y - 0.12, p.at[2]] })));
    }
    L.push(box([0.1, 0.04, wid - 0.06], [shift + len / 2 - 0.06, y + 0.22, 0], 'wood_dark'));
    // Lantern on a hook at the front of the bench.
    const lantern = [box([0.04, 0.14, 0.02], [shift + len / 2 - 0.02, y + 0.22, wid / 2 - 0.04], 'wood_dark'), box([0.04, 0.05, 0.04], [shift + len / 2 + 0.01, y + 0.3, wid / 2 - 0.04], 'iron')];
    L.push(...lantern);
    if (pair) { L.push(box([0.75, 0.035, 0.035], [len / 2 + shift + 0.36, y - 0.04, 0], 'wood_dark')); pushAll(L, horseAt(len / 2 + shift + 0.5, 0.2, { coat })); pushAll(L, horseAt(len / 2 + shift + 0.5, -0.2, { coat: 'black' })); }
    else { L.push(...[-1, 1].map(s => box([0.6, 0.03, 0.03], [len / 2 + shift + 0.28, y - 0.03, s * 0.13], 'wood_dark'))); pushAll(L, horseAt(len / 2 + shift + 0.5, 0, { coat })); }
    const out = place(L, x0, z0, angle);
    const lx = shift + len / 2 + 0.01, lz = wid / 2 - 0.04, c = Math.cos(angle), s = Math.sin(angle);
    return Object.assign(out, { lights: [{ type: 'torch', at: [x0 + lx * c - lz * s, y + 0.32, z0 + lx * s + lz * c] }] });
  },
});
