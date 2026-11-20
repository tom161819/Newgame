// Wall kit: the game's connected stone wall as pieces. A full-tile block of the
// game's wall height (68 px, the king walks on its top) and one parapet per side
// (N = grid y-, E = x+, S = y+, W = x-). The game draws the block and only the
// parapets of sides without a neighbouring wall; S and E sit in front of units
// standing on the wall walk. `assembly` shows a few connected cells for review.
import { box, clamp, rotateParts } from './shapes.js';

export const params = [
  { key: 'piece', values: ['block', 'parapet', 'gate', 'stair', 'diagonal', 'elbow', 'assembly'], description: 'Wall block, one parapet, a gate (#97: a passable wall tile with doors), a stair up to the wall walk, a diagonal run (m-hradby-diagonala) or a preview of connected cells.' },
  { key: 'run', values: ['se', 'ne'], description: 'Diagonal: the run goes to grid (x+1, y+1) – straight down the screen – or to (x+1, y−1) – straight across the screen.' },
  { key: 'corner', values: ['NE', 'SE', 'SW', 'NW'], description: 'Elbow: the corner the diagonal run leaves the block through.' },
  { key: 'openZ', description: 'Elbow: the side across from the band in z has no wall (the corner beside the band is cut).' },
  { key: 'openX', description: 'Elbow: the same for the side across in x.' },
  { key: 'elbows', description: 'Assembly: [{ cell: [x, z], corner }] wall cells drawn as an elbow (block + half a diagonal band).' },
  { key: 'axis', values: ['x', 'z'], description: 'Gate: direction of the passage (grid x or grid y). Stair: direction the steps climb.' },
  { key: 'state', values: ['closed', 'open', 'portcullis'], description: 'Gate: closed doors, doors swung open, or open doors behind a half-raised portcullis.' },
  { key: 'gates', description: 'Assembly: [{ cell: [x, z], axis, state }] wall cells that are gates.' },
  { key: 'stairs', description: 'Assembly: [{ cell: [x, z], axis }] stairs (not wall cells) leading up to the walk.' },
  { key: 'diagonals', description: 'Assembly: [{ cell: [x, z], run }] tiles drawn as a diagonal piece (not wall cells).' },
  { key: 'side', values: ['N', 'E', 'S', 'W'], description: 'Parapet: which edge of the tile it stands on.' },
  { key: 'merlons', description: 'Merlons per parapet (2–4).' },
  { key: 'cells', description: 'Assembly: [x, z] grid cells of wall inside the footprint.' },
];

// The game's wall is 68 px tall: 68 / 39.191836 px per unit.
export const WALL_HEIGHT = 68 / 39.191836;
const SIDES = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };

function block([cx, cz]) {
  const h = WALL_HEIGHT;
  return [
    box([1, 0.16, 1], [cx, 0, cz], 'stone_dark'),
    box([0.98, h - 0.24, 0.98], [cx, 0.16, cz], 'stone'),
    box([1, 0.08, 1], [cx, h - 0.08, cz], 'stone_light'),
  ];
}

function parapet([cx, cz], side, merlons) {
  const [dx, dz] = SIDES[side], along = dx === 0, edge = 0.5 - 0.06, h = WALL_HEIGHT;
  const at = (offset, y) => [cx + (along ? offset : dx * edge), y, cz + (along ? dz * edge : offset)];
  const size = (length, height, depth) => (along ? [length, height, depth] : [depth, height, length]);
  const parts = [box(size(1, 0.1, 0.12), at(0, h), 'stone')];
  const count = clamp(Math.round(merlons), 2, 4), width = 1 / (count * 2);
  for (let i = 0; i < count; i++) parts.push(box(size(width, 0.24, 0.12), at(-0.5 + (i + 0.5) / count, h + 0.1), 'stone_light'));
  return parts;
}

// #97 Gate: the wall block with a passage through it along `axis`. Piers either side, a lintel with a stepped arch
// above the opening, oak doors (closed or swung back against the jambs) and an optional portcullis. Same height as
// the wall, so the walk continues over the gate. Local frame: passage along x; turned for axis 'z'.
const GATE_W = 0.58, GATE_H = 0.82;
function gateLocal(state) {
  const h = WALL_HEIGHT, pier = (1 - GATE_W) / 2, parts = [], spring = 0.16 + GATE_H;
  for (const s of [-1, 1]) {
    const z = s * (GATE_W / 2 + pier / 2);
    parts.push(box([1, 0.16, pier], [0, 0, z], 'stone_dark'), box([0.98, h - 0.24, pier - 0.02], [0, 0.16, z], 'stone'));
  }
  parts.push(box([0.98, h - 0.24 - GATE_H, GATE_W + 0.02], [0, spring, 0], 'stone'), box([1, 0.08, 1], [0, h - 0.08, 0], 'stone_light'));
  // A pale dressed-stone frame on both ends of the passage: jambs and a stepped arch, so the gate reads at 1×.
  for (const face of [0.5, -0.5]) {
    const fx = face - Math.sign(face) * 0.024;
    for (const s of [-1, 1]) parts.push(box([0.04, GATE_H, 0.07], [fx, 0.16, s * (GATE_W / 2 + 0.035)], 'stone_light'));
    for (const [dz, dy, w] of [[0, 0.06, 0.22], [0.17, 0.0, 0.14], [-0.17, 0.0, 0.14], [0.27, -0.08, 0.08], [-0.27, -0.08, 0.08]]) parts.push(box([0.04, 0.11, w], [fx, spring - 0.04 + dy, dz], 'stone_light'));
  }
  // Dark passage ceiling and a cobbled floor that shows where units walk through.
  parts.push(box([0.94, 0.02, GATE_W], [0, spring - 0.03, 0], 'opening'), box([0.98, 0.025, GATE_W], [0, 0.002, 0], 'stone_light'));
  const plank = (x, z, w, rot) => [box([0.05, GATE_H - 0.06, w], [x, 0.18, z], 'wood', { rotation: rot }), ...[0.32, 0.72].map(y => box([0.056, 0.04, w - 0.02], [x, y, z], 'iron', { rotation: rot })), box([0.057, GATE_H - 0.1, 0.012], [x, 0.2, z], 'wood_dark', { rotation: rot })];
  if (state === 'closed') parts.push(...plank(0.42, -GATE_W / 4, GATE_W / 2 - 0.01, 0), ...plank(0.42, GATE_W / 4, GATE_W / 2 - 0.01, 0));
  // Open: each leaf swung back against its jamb, lying along the passage wall.
  else for (const s of [-1, 1]) parts.push(...plank(0.27, s * (GATE_W / 2 - 0.03), GATE_W / 2 - 0.02, Math.PI / 2));
  if (state === 'portcullis') {
    const lift = GATE_H * 0.5;
    for (let i = 0; i < 6; i++) parts.push(box([0.025, GATE_H - lift - 0.02, 0.025], [0.45, 0.16 + lift, -GATE_W / 2 + 0.05 + i * (GATE_W - 0.1) / 5], 'iron'));
    for (const y of [0.16 + lift + 0.04, spring - 0.1]) parts.push(box([0.03, 0.025, GATE_W - 0.04], [0.45, y, 0], 'iron'));
  }
  return parts;
}
// A stone stair climbing along x from the ground at -x to the wall walk at +x, with a low side wall on -z.
function stairLocal() {
  const h = WALL_HEIGHT, steps = 9, parts = [];
  for (let i = 0; i < steps; i++) { const top = (i + 1) * h / steps, x = -0.5 + (i + 0.5) / steps; parts.push(box([1 / steps, top, 0.62], [x, 0, 0.12], i % 2 ? 'stone' : 'stone_light')); }
  parts.push(box([1, h * 0.45, 0.16], [0, 0, -0.38], 'stone'), box([1.0, 0.05, 0.18], [0, h * 0.45, -0.38], 'stone_light'));
  return parts;
}
// m-hradby-diagonala (owner 14–15 Nov 2026: a wall dragged diagonally must be one straight line, not steps; as thick
// as the straight wall; "přechod musí být hladký … cimbuří jenom na krajích"; 05:56: the width of v3 was right, remove
// the teeth at the joints). Two kinds of piece, both drawn on the tile centre:
// - diagonal: a tile in the middle of a run. A band turned 45°, as thick as the straight wall (1 tile), from corner
//   to corner of its tile (a little past, so neighbouring pieces overlap without a seam), parapets along both sides.
// - elbow: the tile where a run ends – at a straight wall or free. The straight wall and half of the band meet in a
//   mitre: where a side of the tile is open, the tile's corner beside the band is cut along the band's edge, so the
//   straight wall's edge runs straight into the band's edge with no corner sticking out. Its parapets follow the
//   outline of the whole wall (found by probing the outline), so they never cross the walk and never stop short.
//   Variant `elbow-<corner>-<a><b>`: a = the side across from the band in z is open (1) or joined (0), b = the same in x.
// Merlons stand at fixed places along the band (every √2/4 from a tile corner), so a run shows one even row.
export const DIAGONAL = { thickness: 1, step: Math.SQRT2 / 4 };
const HALF = Math.SQRT2 / 2, BAND_EDGE = 0.5 - 0.06, SIDE_EDGE = 0.5 - 0.06, CUT = HALF - 0.5;
const CORNERS = { NE: [1, -1], SE: [1, 1], SW: [-1, 1], NW: [-1, -1] };
// Turns parts built along +x so that +x points to grid direction (dx, dz).
const towards = (parts, [dx, dz], [cx, cz] = [0, 0]) => rotateParts(parts, Math.atan2(-dz, dx)).map(p => ({ ...p, at: [p.at[0] + cx, p.at[1], p.at[2] + cz] }));
const shift = (parts, [cx, cz]) => parts.map(p => ({ ...p, at: [p.at[0] + cx, p.at[1], p.at[2] + cz] }));
// Wall body layers (plinth, masonry, coping) for a box of the given size.
const bodyBox = ([w, d], [x, z]) => [box([w, 0.16, d], [x, 0, z], 'stone_dark'), box([w - 0.02, WALL_HEIGHT - 0.24, d - 0.02], [x, 0.16, z], 'stone'), box([w, 0.08, d], [x, WALL_HEIGHT - 0.08, z], 'stone_light')];
// A band body from s0 to s1 along +x (s measured from the tile centre).
const bandBody = (s0, s1) => bodyBox([s1 - s0, DIAGONAL.thickness], [(s0 + s1) / 2, 0]);
const rail = (length, at, along) => box(along ? [length, 0.1, 0.12] : [0.12, 0.1, length], at, 'stone');
const merlon = (width, at, along) => box(along ? [width, 0.24, 0.12] : [0.12, 0.24, width], at, 'stone_light');
function diagonalPiece(run, [cx, cz] = [0, 0]) {
  const h = WALL_HEIGHT, { step } = DIAGONAL, parts = [...bandBody(-HALF - 0.04, HALF + 0.04)];
  for (const u of [-BAND_EDGE, BAND_EDGE]) {
    parts.push(rail(2 * HALF + 0.06, [0, h, u], true));
    // Owner 15 Nov (v5): "to cimbuří je nějaký divný" – merlons ran 2.5 tiles over a 1.5-tile band; keep the 4 per tile that sit on it.
    for (let k = -2; k < 2; k++) parts.push(merlon(step / 2, [(k + 0.5) * step, h + 0.1, u], true));
  }
  return towards(parts, run === 'ne' ? [1, -1] : [1, 1], [cx, cz]);
}
// Valid stretches of a parapet line: points inside the wall whose outward probe leaves it.
function stretches(point, normal, from, to, inside) {
  const out = [];let start = null;const step = 0.01;
  for (let t = from; t <= to + 1e-9; t += step) {
    const [x, z] = point(t), [nx, nz] = normal, ok = inside(x, z) && !inside(x + nx * 0.1, z + nz * 0.1);
    if (ok && start === null) start = t;
    if ((!ok || t + step > to + 1e-9) && start !== null) { const end = ok ? t : t - step; if (end - start > 0.02) out.push([start, end]); start = null; }
  }
  return out;
}
function elbowPiece(corner, openZ, openX, [cx, cz] = [0, 0]) {
  const [dx, dz] = CORNERS[corner] ?? CORNERS.SE, h = WALL_HEIGHT, { step } = DIAGONAL, parts = [];
  // The straight part: the whole tile, minus the strip beside the band on each open side (the band fills the rest).
  const xr = openZ ? (dx > 0 ? [-0.5, CUT] : [-CUT, 0.5]) : [-0.5, 0.5], zr = openX ? (dz > 0 ? [-0.5, CUT] : [-CUT, 0.5]) : [-0.5, 0.5];
  const s0 = openZ || openX ? -CUT : 0;
  parts.push(...shift(bodyBox([xr[1] - xr[0], zr[1] - zr[0]], [(xr[0] + xr[1]) / 2, (zr[0] + zr[1]) / 2]), [cx, cz]));
  // Outline of the whole wall around this tile: the straight part, the band (and its run beyond the corner) and the
  // tiles of joined sides.
  const S = Math.SQRT2, sOf = (x, z) => (x * dx + z * dz) / S, uOf = (x, z) => (-x * dz + z * dx) / S;
  const zSide = dz > 0 ? 'N' : 'S', xSide = dx > 0 ? 'W' : 'E', joined = new Set([!openZ && zSide, !openX && xSide].filter(Boolean));
  const inside = (x, z) => (x >= xr[0] - 1e-9 && x <= xr[1] + 1e-9 && z >= zr[0] - 1e-9 && z <= zr[1] + 1e-9)
    || (sOf(x, z) >= s0 - 1e-9 && sOf(x, z) <= HALF + 2 && Math.abs(uOf(x, z)) <= 0.5 + 1e-9)
    || [...joined].some(side => { const [sx, sz] = SIDES[side]; return Math.abs(x - sx) <= 0.5 && Math.abs(z - sz) <= 0.5; });
  parts.push(...towards(bandBody(s0, HALF + 0.04), [dx, dz], [cx, cz]));
  // Parapets along the four sides of the tile.
  for (const [side, [nx, nz]] of Object.entries(SIDES)) {
    const along = nx === 0, point = t => (along ? [t, nz * SIDE_EDGE] : [nx * SIDE_EDGE, t]);
    for (const [a, b] of stretches(point, [nx, nz], -0.5, 0.5, inside)) {
      const from = Math.max(-0.5, a - 0.06), to = Math.min(0.5, b + 0.06), mid = (from + to) / 2;
      parts.push(rail(to - from, along ? [cx + mid, h, cz + nz * SIDE_EDGE] : [cx + nx * SIDE_EDGE, h, cz + mid], along));
      for (const m of [-1 / 3, 0, 1 / 3]) if (m - 1 / 12 >= a - 1e-6 && m + 1 / 12 <= b + 1e-6) parts.push(merlon(1 / 6, along ? [cx + m, h + 0.1, cz + nz * SIDE_EDGE] : [cx + nx * SIDE_EDGE, h + 0.1, cz + m], along));
    }
  }
  // Parapets along the band's two edges (local frame, then turned).
  const band = [];
  for (const u of [-BAND_EDGE, BAND_EDGE]) {
    const ux = -dz / S, uz = dx / S, sx = dx / S, sz = dz / S, point = t => [t * sx + u * ux, t * sz + u * uz], normal = [Math.sign(u) * ux, Math.sign(u) * uz];
    for (const [a, b] of stretches(point, normal, s0, HALF, inside)) {
      // No overlap backwards: the start lies at the mitre on the tile's edge; the side rail reaches over it instead.
      const from = a, to = Math.min(HALF + 0.03, b + 0.03);
      band.push(rail(to - from, [(from + to) / 2, h, u], true));
      for (let k = -8; k < 8; k++) { const m = HALF + (k + 0.5) * step; if (m - step / 4 >= a - 1e-6 && m + step / 4 <= b + 1e-6) band.push(merlon(step / 2, [m, h + 0.1, u], true)); }
    }
  }
  parts.push(...towards(band, [dx, dz], [cx, cz]));
  return parts;
}
// The flags of an elbow from the joined sides: is the side across from the band in z / in x open?
export function elbowFlags(corner, joined) {
  const [dx, dz] = CORNERS[corner];return [!joined.has(dz > 0 ? 'N' : 'S'), !joined.has(dx > 0 ? 'W' : 'E')];
}
const turnAxis = (parts, axis, [cx, cz] = [0, 0]) => (axis === 'z' ? rotateParts(parts, -Math.PI / 2) : parts).map(p => ({ ...p, at: [p.at[0] + cx, p.at[1], p.at[2] + cz] }));

export function build(spec, { footprint }) {
  const merlons = spec.merlons ?? 3;
  if (spec.piece === 'gate') {
    const axis = spec.axis === 'z' ? 'z' : 'x', parts = turnAxis(gateLocal(spec.state ?? 'closed'), axis);
    // Parapets on the two wall faces of the gate (the sides the passage goes through stay open at ground level only).
    for (const side of axis === 'x' ? ['E', 'W'] : ['N', 'S']) parts.push(...parapet([0, 0], side, merlons));
    return { primitives: parts, lights: [], height: WALL_HEIGHT + 0.34 };
  }
  if (spec.piece === 'diagonal') return { primitives: diagonalPiece(spec.run === 'ne' ? 'ne' : 'se'), lights: [], height: WALL_HEIGHT + 0.34 };
  if (spec.piece === 'elbow') return { primitives: elbowPiece(CORNERS[spec.corner] ? spec.corner : 'SE', spec.openZ !== false, spec.openX !== false), lights: [], height: WALL_HEIGHT + 0.34 };
  if (spec.piece === 'stair') return { primitives: turnAxis(stairLocal(), spec.axis === 'z' ? 'z' : 'x'), lights: [], height: WALL_HEIGHT };
  if (spec.piece === 'parapet') return { primitives: parapet([0, 0], SIDES[spec.side] ? spec.side : 'S', merlons), lights: [], height: WALL_HEIGHT + 0.34 };
  if (spec.piece === 'assembly') {
    const cells = spec.cells ?? [], key = (x, z) => `${x},${z}`, set = new Set(cells.map(([x, z]) => key(x, z))), parts = [];
    const centre = ([x, z]) => [x - footprint.width / 2 + 0.5, z - footprint.height / 2 + 0.5];
    const gates = new Map((spec.gates ?? []).map(g => [key(...g.cell), g]));
    for (const g of spec.gates ?? []) if (!set.has(key(...g.cell))) set.add(key(...g.cell));
    for (const dg of spec.diagonals ?? []) parts.push(...diagonalPiece(dg.run === 'ne' ? 'ne' : 'se', centre(dg.cell)));
    for (const e of spec.elbows ?? []) set.add(key(...e.cell));
    for (const e of spec.elbows ?? []) { const joined = new Set(Object.entries(SIDES).filter(([, [dx, dz]]) => set.has(key(e.cell[0] + dx, e.cell[1] + dz))).map(([side]) => side));
      const [openZ, openX] = elbowFlags(e.corner, joined);parts.push(...elbowPiece(e.corner, openZ, openX, centre(e.cell))); }
    for (const st of spec.stairs ?? []) parts.push(...turnAxis(stairLocal(), st.axis === 'z' ? 'z' : 'x', centre(st.cell)));
    for (const cell of [...cells, ...(spec.gates ?? []).map(g => g.cell).filter(c => !cells.some(([x, z]) => x === c[0] && z === c[1]))]) {
      const gate = gates.get(key(...cell));
      if (gate) parts.push(...turnAxis(gateLocal(gate.state ?? 'closed'), gate.axis === 'z' ? 'z' : 'x', centre(cell)));
      else parts.push(...block(centre(cell)));
      for (const [side, [dx, dz]] of Object.entries(SIDES)) if (!set.has(key(cell[0] + dx, cell[1] + dz))) parts.push(...parapet(centre(cell), side, merlons));
    }
    return { primitives: parts, lights: [], height: WALL_HEIGHT + 0.34 };
  }
  return { primitives: block([0, 0]), lights: [], height: WALL_HEIGHT };
}

export default { id: 'wallkit', version: 1, label: 'Wall kit (connected wall pieces)', params, build };
