// Wall kit: the game's connected stone wall as pieces. A full-tile block of the
// game's wall height (68 px, the king walks on its top) and one parapet per side
// (N = grid y-, E = x+, S = y+, W = x-). The game draws the block and only the
// parapets of sides without a neighbouring wall; S and E sit in front of units
// standing on the wall walk. `assembly` shows a few connected cells for review.
import { box, clamp } from './shapes.js';

export const params = [
  { key: 'piece', values: ['block', 'parapet', 'assembly'], description: 'Wall block, one parapet, or a preview of connected cells.' },
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

export function build(spec, { footprint }) {
  const merlons = spec.merlons ?? 3;
  if (spec.piece === 'parapet') return { primitives: parapet([0, 0], SIDES[spec.side] ? spec.side : 'S', merlons), lights: [], height: WALL_HEIGHT + 0.34 };
  if (spec.piece === 'assembly') {
    const cells = spec.cells ?? [], key = (x, z) => `${x},${z}`, set = new Set(cells.map(([x, z]) => key(x, z))), parts = [];
    const centre = ([x, z]) => [x - footprint.width / 2 + 0.5, z - footprint.height / 2 + 0.5];
    for (const cell of cells) {
      parts.push(...block(centre(cell)));
      for (const [side, [dx, dz]] of Object.entries(SIDES)) if (!set.has(key(cell[0] + dx, cell[1] + dz))) parts.push(...parapet(centre(cell), side, merlons));
    }
    return { primitives: parts, lights: [], height: WALL_HEIGHT + 0.34 };
  }
  return { primitives: block([0, 0]), lights: [], height: WALL_HEIGHT };
}

export default { id: 'wallkit', version: 1, label: 'Wall kit (connected wall pieces)', params, build };
