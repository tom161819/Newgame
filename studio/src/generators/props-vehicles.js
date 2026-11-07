// Vehicles (owner, 7 Nov 2026: "new versions of the caravan, the wheelbarrow and the horse wagon, several kinds of
// each"). Each rig is built along +x (front = +x) and turned to face `angle` (0 = +x, π/2 = +z) about (x, z), the
// middle of the whole rig. Horses come from the animal recipe (anatomical skeleton, with a harness).
import { box, cylinder, sphere, prism, turnParts } from './shapes.js';
import { PROPS } from './props.js';
import { build as buildAnimal } from './animal.js';

const place = (parts, x, z, angle) => turnParts(parts, -angle).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
// A harnessed horse standing with its front along +x, hooves at local (hx, 0, hz).
const horseAt = (hx, hz, { coat = 'bay', scale = 0.8 } = {}) => {
  const breed = coat, made = buildAnimal({ species: 'horse', breed, harness: true }, { footprint: { width: 1, height: 1 } }).primitives;
  return turnParts(made, Math.PI / 4).map(p => scaled(p, scale, hx, hz));
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
function load(kind, cx, y, cz, length, width) {
  const parts = [];
  if (kind === 'stone') for (const [f, s, k] of [[-0.3, -0.2, 1], [0.1, 0.25, 0.9], [0.3, -0.1, 0.8], [0, 0, 1.1]]) parts.push(sphere([length * 0.2 * k, width * 0.2 * k, width * 0.24 * k], [cx + f * length, y, cz + s * width], 'fieldstone', 1));
  if (kind === 'soil' || kind === 'manure') parts.push(sphere([length * 0.45, width * 0.3, width * 0.45], [cx, y - width * 0.05, cz], kind === 'soil' ? 'soil' : 'horse_dark', 1));
  if (kind === 'logs') for (let i = 0; i < 5; i++) parts.push(cylinder({ radiusBottom: width * 0.13, height: length * 1.05, segments: 8, tilt: [0, -Math.PI / 2] }, [cx - length * 0.52, y + width * 0.13 + (i > 2 ? width * 0.22 : 0), cz + (i > 2 ? (i - 3.5) * width * 0.26 : (i - 1) * width * 0.28)], 'bark'));
  if (kind === 'sacks') for (const [f, s, up] of [[-0.25, -0.22, 0], [-0.25, 0.22, 0], [0.2, -0.2, 0], [0.2, 0.2, 0], [0, 0, 1]]) parts.push(sphere([length * 0.2, width * 0.17, width * 0.22], [cx + f * length, y + up * width * 0.28, cz + s * width], 'cloth_linen', 1));
  if (kind === 'hay') parts.push(sphere([length * 0.6, width * 0.75, width * 0.68], [cx, y - width * 0.2, cz], 'thatch', 1), sphere([length * 0.45, width * 0.4, width * 0.5], [cx, y + width * 0.45, cz], 'thatch', 1));
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
      L.push(...load(what, -0.01, y + 0.03, 0, len * 0.8, wid * 0.8));
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
    const L = [], two = kind === 'tumbril', pair = kind === 'pair', len = two ? 0.56 : kind === 'timber' ? 1.0 : pair ? 0.96 : 0.8, wid = pair ? 0.5 : 0.42, y = two ? 0.24 : 0.28;
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
        if (pair) for (const s of [-1, 1]) for (const f of [-0.3, 0, 0.3]) bed.push(box([0.025, h + 0.01, 0.035], [f * len, y + 0.04, s * (wid / 2)], 'iron'));
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
    const hx = len / 2 + shift + 0.4;
    if (pair) L.push(...horseAt(hx, 0.15, { coat }), ...horseAt(hx, -0.15, { coat: coat === 'bay' ? 'chestnut' : coat }));
    else L.push(...horseAt(hx, 0, { coat, scale: two ? 0.7 : 0.8 }));
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
    if (pair) L.push(box([0.75, 0.035, 0.035], [len / 2 + shift + 0.36, y - 0.04, 0], 'wood_dark'), ...horseAt(len / 2 + shift + 0.4, 0.15, { coat }), ...horseAt(len / 2 + shift + 0.4, -0.15, { coat: 'black' }));
    else L.push(...[-1, 1].map(s => box([0.6, 0.03, 0.03], [len / 2 + shift + 0.28, y - 0.03, s * 0.13], 'wood_dark')), ...horseAt(len / 2 + shift + 0.4, 0, { coat }));
    const out = place(L, x0, z0, angle);
    const lx = shift + len / 2 + 0.01, lz = wid / 2 - 0.04, c = Math.cos(angle), s = Math.sin(angle);
    return Object.assign(out, { lights: [{ type: 'torch', at: [x0 + lx * c - lz * s, y + 0.32, z0 + lx * s + lz * c] }] });
  },
});
