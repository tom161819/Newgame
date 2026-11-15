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
// as the straight wall; "přechod musí být hladký … cimbuří jenom na krajích"). Two kinds of piece, both drawn on the
// tile centre:
// - diagonal: a tile in the middle of a run. A band turned 45°, as thick as the straight wall (1 tile), from corner
//   to corner of its tile, parapets along both long sides only. Pieces of a run meet at the tile corners with the same
//   cross-section, so the band continues without a joint.
// - elbow: the tile where a run ends – at a straight wall or free. The wall block and half of the band (from the tile
//   centre to the corner) in one piece. Its parapet follows the outer edge: along the block's sides, round the bend and
//   along the band; the two block sides at the band's corner keep only the part outside the band. No parapet ever
//   crosses the wall.
// Merlons stand at fixed places along the band (every √2/4 from a tile corner), so a run shows one even row.
export const DIAGONAL = { thickness: 1, step: Math.SQRT2 / 4 };
const EDGE = 0.5 - 0.06, HALF = Math.SQRT2 / 2;
// Where a band parapet line meets a block parapet line, measured along the band from the tile centre.
const BEND = Math.SQRT2 * EDGE - EDGE;
const CORNERS = { NE: [1, -1], SE: [1, 1], SW: [-1, 1], NW: [-1, -1] };
// Turns parts built along +x so that +x points to grid direction (dx, dz).
const towards = (parts, [dx, dz], [cx, cz] = [0, 0]) => rotateParts(parts, Math.atan2(-dz, dx)).map(p => ({ ...p, at: [p.at[0] + cx, p.at[1], p.at[2] + cz] }));
// A band body from s0 to s1 along +x (s measured from the tile centre).
function bandBody(s0, s1) {
  const h = WALL_HEIGHT, T = DIAGONAL.thickness, L = s1 - s0, c = (s0 + s1) / 2;
  return [box([L, 0.16, T], [c, 0, 0], 'stone_dark'), box([L, h - 0.24, T - 0.02], [c, 0.16, 0], 'stone'), box([L, 0.08, T], [c, h - 0.08, 0], 'stone_light')];
}
// Parapet rails on both band sides from s0 to s1, merlons at the fixed places inside that stretch.
function bandParapets(s0, s1) {
  const h = WALL_HEIGHT, { step } = DIAGONAL, parts = [], width = step / 2;
  for (const u of [-EDGE, EDGE]) {
    parts.push(box([s1 - s0, 0.1, 0.12], [(s0 + s1) / 2, h, u], 'stone'));
    for (let k = -8; k <= 8; k++) { const m = HALF + (k + 0.5) * step; if (m - width / 2 >= s0 - 1e-6 && m + width / 2 <= s1 + 1e-6) parts.push(box([width, 0.24, 0.12], [m, h + 0.1, u], 'stone_light')); }
  }
  return parts;
}
function diagonalPiece(run, [cx, cz] = [0, 0]) {
  return towards([...bandBody(-HALF - 0.01, HALF + 0.01), ...bandParapets(-HALF, HALF)], run === 'ne' ? [1, -1] : [1, 1], [cx, cz]);
}
// Part of one block parapet: `side` of the tile, offsets from..to along that side (−0.5 … 0.5).
function parapetPart([cx, cz], side, from, to, merlons) {
  const [dx, dz] = SIDES[side], along = dx === 0, h = WALL_HEIGHT;
  const at = (offset, y) => [cx + (along ? offset : dx * EDGE), y, cz + (along ? dz * EDGE : offset)];
  const size = (length, height, depth) => (along ? [length, height, depth] : [depth, height, length]);
  const parts = [box(size(to - from, 0.1, 0.12), at((from + to) / 2, h), 'stone')];
  const count = clamp(Math.round(merlons), 2, 4), width = 1 / (count * 2);
  for (let i = 0; i < count; i++) { const m = -0.5 + (i + 0.5) / count; if (m - width / 2 >= from - 1e-6 && m + width / 2 <= to + 1e-6) parts.push(box(size(width, 0.24, 0.12), at(m, h + 0.1), 'stone_light')); }
  return parts;
}
// The two block sides that touch `corner`, each kept only outside the band: from the far end of the side to where its
// parapet line meets the band's parapet line (EDGE·(√2−1) from the side's middle, towards the far end). A little
// overlap (0.05) closes the joint of the two rails.
function elbowSides(corner) {
  const [dx, dz] = CORNERS[corner], m = EDGE * (Math.SQRT2 - 1) - 0.05, range = d => (d > 0 ? [-0.5, -m] : [m, 0.5]);
  return [[dx > 0 ? 'E' : 'W', range(dz)], [dz > 0 ? 'S' : 'N', range(dx)]];
}
function elbowPiece(corner, merlons, [cx, cz] = [0, 0], open = null) {
  const dir = CORNERS[corner] ?? CORNERS.SE, parts = [...block([cx, cz])];
  parts.push(...towards([...bandBody(0, HALF + 0.01), ...bandParapets(BEND - 0.05, HALF)], dir, [cx, cz]));
  for (const [side, [from, to]] of elbowSides(corner)) parts.push(...parapetPart([cx, cz], side, from, to, merlons));
  // In a preview the other two sides get their parapets when open (the game draws those from the kit).
  if (open) for (const side of open) parts.push(...parapet([cx, cz], side, merlons));
  return parts;
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
  if (spec.piece === 'elbow') return { primitives: elbowPiece(CORNERS[spec.corner] ? spec.corner : 'SE', merlons), lights: [], height: WALL_HEIGHT + 0.34 };
  if (spec.piece === 'stair') return { primitives: turnAxis(stairLocal(), spec.axis === 'z' ? 'z' : 'x'), lights: [], height: WALL_HEIGHT };
  if (spec.piece === 'parapet') return { primitives: parapet([0, 0], SIDES[spec.side] ? spec.side : 'S', merlons), lights: [], height: WALL_HEIGHT + 0.34 };
  if (spec.piece === 'assembly') {
    const cells = spec.cells ?? [], key = (x, z) => `${x},${z}`, set = new Set(cells.map(([x, z]) => key(x, z))), parts = [];
    const centre = ([x, z]) => [x - footprint.width / 2 + 0.5, z - footprint.height / 2 + 0.5];
    const gates = new Map((spec.gates ?? []).map(g => [key(...g.cell), g]));
    for (const g of spec.gates ?? []) if (!set.has(key(...g.cell))) set.add(key(...g.cell));
    for (const dg of spec.diagonals ?? []) parts.push(...diagonalPiece(dg.run === 'ne' ? 'ne' : 'se', centre(dg.cell)));
    for (const e of spec.elbows ?? []) set.add(key(...e.cell));
    for (const e of spec.elbows ?? []) { const touch = { NE: ['N', 'E'], SE: ['S', 'E'], SW: ['S', 'W'], NW: ['N', 'W'] }[e.corner] ?? [];
      parts.push(...elbowPiece(e.corner, merlons, centre(e.cell), Object.entries(SIDES).filter(([side, [dx, dz]]) => !touch.includes(side) && !set.has(key(e.cell[0] + dx, e.cell[1] + dz))).map(([side]) => side))); }
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
