// More props for the owner's 7 Nov 2026 batch: the temporary stockpile, the fisherman's hut, the pitch kiln, the
// campfire and the village green with its ornaments (swing tree, haystack, well). Each prop is placed like the others
// in props.js: `(x, z, options)` returns primitives standing on the ground at that point of the footprint.
import { box, cylinder, sphere, prism, lean, rotateParts } from './shapes.js';
import { PROPS } from './props.js';

const place = (parts, x, z, r = 0) => rotateParts(parts, r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
const withLights = (parts, lights) => Object.assign(parts, { lights });

Object.assign(PROPS, {
  // ---------- ground ----------
  // Trodden earth or gravel under a yard; thin so figures stand on it.
  groundPatch: (x, z, { width = 1, depth = 1, material = 'soil', r = 0 } = {}) => [box([width, 0.012, depth], [x, 0, z], material, { rotation: r })],
  stones: (x, z, { count = 5, spread = 0.25, material = 'fieldstone' } = {}) => Array.from({ length: count }, (_, i) => {
    const a = i * 2.39, d = spread * (0.35 + 0.65 * ((i * 37) % 10) / 10);
    return sphere([0.05 + (i % 3) * 0.012, 0.035, 0.045], [x + Math.cos(a) * d, 0, z + Math.sin(a) * d], i % 2 ? material : `${material}_light`, 0);
  }),

  // A straight fence from (x, z) to `to`.
  fenceLine: (x, z, { to }) => PROPS.fence(x, z, to[0], to[1]),
  // ---------- stockpile ----------
  // A sagging canvas tarp on four posts (front higher), with guy ropes and pegs.
  canvasShelter: (x, z, { width = 0.9, depth = 0.7, height = 0.62, cloth = 'cloth_linen', r = 0 } = {}) => place([
    ...[[-1, -1, 0.82], [1, -1, 0.82], [-1, 1, 1], [1, 1, 1]].map(([sx, sz, k]) => box([0.05, height * k, 0.05], [sx * width / 2, 0, sz * depth / 2], 'wood_dark')),
    box([width + 0.1, 0.025, depth / 2 + 0.06], [0, height * 0.86, -depth / 4], cloth, { tilt: [0.18, 0] }),
    box([width + 0.1, 0.025, depth / 2 + 0.06], [0, height * 0.95, depth / 4], cloth, { tilt: [0.12, 0] }),
    box([width + 0.12, 0.05, 0.03], [0, height * 0.94, depth / 2 + 0.02], cloth),
    ...[-1, 1].flatMap(s => [box([0.012, 0.36, 0.012], [s * (width / 2 + 0.08), 0, depth / 2 + 0.06], 'cloth_brown', { tilt: [0, s * 0.4] }), box([0.03, 0.06, 0.03], [s * (width / 2 + 0.14), 0, depth / 2 + 0.08], 'wood')]),
  ], x, z, r),
  // Logs stacked between two stakes, a bark tarp-weight on top.
  stakedLogs: (x, z, { count = 7, length = 0.6, r = 0 } = {}) => {
    const rows = [[0, -0.165], [0, -0.055], [0, 0.055], [0, 0.165], [1, -0.11], [1, 0], [1, 0.11], [2, -0.055], [2, 0.055]].slice(0, count);
    return place([...rows.map(([row, dz], i) => cylinder({ radiusBottom: 0.055, height: length, segments: 8, tilt: [0, -Math.PI / 2] }, [-length / 2 + (i % 2) * 0.03, 0.055 + row * 0.095, dz], i % 3 ? 'bark' : 'wood')),
      ...[-1, 1].flatMap(s => [box([0.04, 0.4, 0.04], [-0.05, 0, s * 0.25], 'wood_dark'), box([0.04, 0.4, 0.04], [0.15, 0, s * 0.25], 'wood_dark')])], x, z, r);
  },
  stonePile: (x, z, { size = 1 } = {}) => [sphere([0.22 * size, 0.1 * size, 0.18 * size], [x, 0, z], 'fieldstone', 1), sphere([0.09, 0.07, 0.08], [x - 0.12 * size, 0.06 * size, z + 0.08], 'fieldstone_light', 0),
    sphere([0.08, 0.06, 0.07], [x + 0.1 * size, 0.07 * size, z - 0.04], 'stone', 0), sphere([0.07, 0.05, 0.06], [x + 0.02, 0.13 * size, z + 0.02], 'fieldstone_dark', 0), sphere([0.06, 0.045, 0.05], [x + 0.22 * size, 0, z + 0.12], 'stone_light', 0)],
  tallyPost: (x, z) => [box([0.05, 0.62, 0.05], [x, 0, z], 'wood_dark'), box([0.2, 0.15, 0.025], [x + 0.02, 0.4, z + 0.035], 'wood'), ...[0, 1, 2, 3].map(i => box([0.008, 0.09, 0.03], [x - 0.05 + i * 0.03, 0.43, z + 0.04], 'soot')), box([0.11, 0.008, 0.03], [x - 0.005, 0.47, z + 0.042], 'soot', { rotation: 0.4 })],
  lanternPole: (x, z, { height = 0.75 } = {}) => withLights([box([0.04, height, 0.04], [x, 0, z], 'wood_dark'), box([0.16, 0.03, 0.03], [x + 0.06, height - 0.04, z], 'wood_dark'),
    box([0.06, 0.08, 0.06], [x + 0.12, height - 0.16, z], 'iron'), box([0.04, 0.05, 0.04], [x + 0.12, height - 0.15, z], 'coals')], [{ type: 'torch', at: [x + 0.12, height - 0.12, z] }]),
  wheelbarrow: (x, z, { r = 0, load = 'stone' } = {}) => place([box([0.32, 0.1, 0.22], [0, 0.1, 0], 'wood', { tilt: [0, -0.1] }), box([0.03, 0.03, 0.4], [-0.08, 0.12, 0], 'wood_dark', { rotation: Math.PI / 2 }),
    cylinder({ radiusBottom: 0.07, height: 0.03, segments: 10, tilt: [Math.PI / 2, 0] }, [0.2, 0.07, -0.015], 'wood_dark'), box([0.03, 0.1, 0.03], [-0.12, 0, -0.08], 'wood_dark'), box([0.03, 0.1, 0.03], [-0.12, 0, 0.08], 'wood_dark'),
    sphere([0.12, 0.06, 0.08], [0, 0.18, 0], load === 'stone' ? 'fieldstone' : 'soil', 1)], x, z, r),

  // ---------- fisherman ----------
  // A rowing boat, either upturned on trestles (drying) or upright on the ground with oars inside.
  boat: (x, z, { r = 0, upturned = true } = {}) => place(upturned ? [
    ...[-0.24, 0.24].flatMap(dx => [box([0.04, 0.22, 0.04], [dx, 0, -0.12], 'wood_dark'), box([0.04, 0.22, 0.04], [dx, 0, 0.12], 'wood_dark'), box([0.04, 0.03, 0.3], [dx, 0.22, 0], 'wood_dark')]),
    sphere([0.42, 0.13, 0.17], [0, 0.24, 0], 'wood', 1), sphere([0.43, 0.04, 0.175], [0, 0.24, 0], 'wood_dark', 1), box([0.78, 0.03, 0.02], [0, 0.36, 0], 'wood_dark'),
  ] : [
    sphere([0.42, 0.12, 0.17], [0, 0.0, 0], 'wood_dark', 1), sphere([0.38, 0.09, 0.14], [0, 0.04, 0], 'wood', 1), box([0.04, 0.02, 0.26], [-0.1, 0.12, 0], 'wood_dark'), box([0.04, 0.02, 0.26], [0.14, 0.12, 0], 'wood_dark'),
    box([0.6, 0.02, 0.03], [0, 0.14, 0.05], 'wood', { rotation: 0.15 }), box([0.1, 0.012, 0.05], [0.29, 0.14, 0.09], 'wood', { rotation: 0.15 }),
  ], x, z, r),
  // A net hung to dry between two posts, with cork floats and a sagging bottom edge.
  netRack: (x, z, { r = 0, width = 0.62 } = {}) => {
    const out = [box([0.04, 0.62, 0.04], [-width / 2, 0, 0], 'wood_dark'), box([0.04, 0.62, 0.04], [width / 2, 0, 0], 'wood_dark'), box([width + 0.08, 0.035, 0.035], [0, 0.6, 0], 'wood')];
    for (let i = 0; i < 6; i++) out.push(box([0.006, 0.42, 0.012], [-width / 2 + 0.06 + i * (width - 0.12) / 5, 0.16, 0.005], 'cloth_wool'));
    for (let j = 0; j < 5; j++) out.push(box([width - 0.08, 0.006, 0.012], [0, 0.2 + j * 0.085, 0.005], 'cloth_wool'));
    for (let i = 0; i < 5; i++) out.push(sphere([0.022, 0.018, 0.018], [-width / 2 + 0.08 + i * (width - 0.16) / 4, 0.55, 0.02], 'cloth_red', 0));
    out.push(box([width - 0.1, 0.03, 0.06], [0, 0.0, 0.05], 'cloth_wool'));
    return place(out, x, z, r);
  },
  // Split fish hung by the tails on a pole frame to dry or smoke.
  fishRack: (x, z, { r = 0, count = 6 } = {}) => {
    const out = [box([0.04, 0.5, 0.04], [-0.25, 0, 0], 'wood_dark'), box([0.04, 0.5, 0.04], [0.25, 0, 0], 'wood_dark'), box([0.58, 0.03, 0.03], [0, 0.48, 0], 'wood_dark')];
    for (let i = 0; i < count; i++) { const fx = -0.2 + i * 0.4 / (count - 1); out.push(box([0.006, 0.05, 0.006], [fx, 0.43, 0], 'cloth_brown'), sphere([0.022, 0.07, 0.008], [fx, 0.28, 0], i % 2 ? 'steel' : 'steel_dark', 1), box([0.04, 0.03, 0.006], [fx, 0.42, 0], 'steel_dark')); }
    return place(out, x, z, r);
  },
  fish: (x, z, { y = 0, r = 0, material = 'steel' } = {}) => [sphere([0.07, 0.022, 0.026], [x, y, z], material, 1, { rotation: r }), box([0.03, 0.03, 0.006], [x - 0.08 * Math.cos(r), y + 0.012, z + 0.08 * Math.sin(r)], 'steel_dark', { rotation: r + Math.PI / 2 })],
  fishBasket: (x, z, { y = 0 } = {}) => [cylinder({ radiusBottom: 0.08, radiusTop: 0.1, height: 0.1, segments: 10 }, [x, y, z], 'twigs'), cylinder({ radiusBottom: 0.1, height: 0.012, segments: 10 }, [x, y + 0.1, z], 'wood_dark'),
    ...PROPS.fish(x - 0.02, z, { y: y + 0.09, r: 0.4 }), ...PROPS.fish(x + 0.03, z + 0.02, { y: y + 0.1, r: -0.8, material: 'steel_dark' })],
  // A conical wicker eel trap lying on its side.
  eelTrap: (x, z, { r = 0 } = {}) => place([cylinder({ radiusBottom: 0.09, radiusTop: 0.02, height: 0.42, segments: 10, tilt: [0, -Math.PI / 2] }, [-0.2, 0.09, 0], 'twigs'),
    cylinder({ radiusBottom: 0.095, radiusTop: 0.095, height: 0.02, segments: 10, tilt: [0, -Math.PI / 2] }, [-0.2, 0.09, 0], 'wood_dark')], x, z, r),
  oars: (x, z, { r = 0 } = {}) => place([box([0.025, 0.7, 0.025], [0, 0, 0], 'wood', { tilt: [0.25, 0] }), box([0.07, 0.18, 0.015], [0, 0.0, -0.02], 'wood', { tilt: [0.25, 0] }),
    box([0.025, 0.7, 0.025], [0.08, 0, 0], 'wood', { tilt: [0.3, 0] }), box([0.07, 0.18, 0.015], [0.08, 0.0, -0.025], 'wood', { tilt: [0.3, 0] })], x, z, r),
  // A small smoke hut for fish: plank box, a vent with a wisp of soot, a smouldering fire hole.
  smokeHut: (x, z, { r = 0 } = {}) => withLights(place([box([0.36, 0.42, 0.32], [0, 0, 0], 'wood_dark'), prism([0.32, 0.16, 0.42], [0, 0.42, 0], 'roof_shingle', { rotation: Math.PI / 2 }),
    box([0.1, 0.08, 0.1], [0, 0.56, 0], 'wood_dark'), box([0.06, 0.04, 0.06], [0, 0.64, 0], 'soot'), box([0.16, 0.12, 0.02], [0.02, 0.0, 0.165], 'soot'), box([0.1, 0.05, 0.02], [0.02, 0.01, 0.17], 'coals')], x, z, r), [{ type: 'brazier', at: [x, 0.05, z + 0.18] }]),
  fishSign: (x, z, { y = 0.7, r = 0 } = {}) => place([box([0.04, y + 0.12, 0.04], [0, 0, 0], 'wood_dark'), box([0.22, 0.03, 0.03], [0.1, y, 0], 'wood_dark'), box([0.006, 0.05, 0.006], [0.18, y - 0.05, 0], 'iron'),
    sphere([0.09, 0.045, 0.015], [0.17, y - 0.17, 0], 'steel', 1), box([0.05, 0.06, 0.012], [0.08, y - 0.15, 0], 'steel_dark', { rotation: 0 })], x, z, r),
  pier: (x, z, { length = 0.8, width = 0.32, r = 0 } = {}) => place([
    ...Array.from({ length: Math.round(length / 0.1) }, (_, i) => box([0.085, 0.03, width], [-length / 2 + 0.05 + i * 0.1, 0.12, 0], i % 3 ? 'wood' : 'wood_dark')),
    ...[-1, 1].flatMap(s => [box([0.05, 0.16, 0.05], [-length / 2 + 0.08, 0, s * (width / 2 - 0.02)], 'wood_dark'), box([0.05, 0.16, 0.05], [length / 2 - 0.05, 0, s * (width / 2 - 0.02)], 'wood_dark')]),
  ], x, z, r),

  // A big net hung on a house wall (r = 0: on a +z face; r = π/2: on a +x face), pegged at the top, with floats.
  wallNet: (x, z, { r = 0, width = 0.7, height = 0.55, y = 0.12 } = {}) => {
    const out = [box([width + 0.06, 0.03, 0.03], [0, y + height, 0.02], 'wood_dark')];
    const cols = Math.round(width / 0.07), rows = Math.round(height / 0.07);
    for (let i = 0; i <= cols; i++) out.push(box([0.006, height * (0.85 + 0.15 * Math.sin(i)), 0.008], [-width / 2 + i * width / cols, y + height * (0.15 - 0.15 * Math.sin(i)), 0.035], 'cloth_wool'));
    for (let j = 0; j < rows; j++) out.push(box([width * (0.95 - j * 0.03), 0.006, 0.008], [0, y + height - (j + 1) * height / (rows + 0.5), 0.035], 'cloth_wool'));
    for (let i = 0; i < 6; i++) out.push(sphere([0.02, 0.02, 0.018], [-width / 2 + 0.06 + i * (width - 0.12) / 5, y + height - 0.05, 0.05], i % 2 ? 'cloth_red' : 'cloth_ochre', 0));
    out.push(sphere([width * 0.35, 0.05, 0.05], [0, 0.0, 0.08], 'cloth_wool', 1));
    return place(out, x, z, r);
  },
  // Fishing rods leaning on a rail, lines hanging.
  rodRack: (x, z, { r = 0, count = 4 } = {}) => place([box([0.04, 0.3, 0.04], [-0.2, 0, 0], 'wood_dark'), box([0.04, 0.3, 0.04], [0.2, 0, 0], 'wood_dark'), box([0.46, 0.03, 0.03], [0, 0.28, 0], 'wood_dark'),
    ...Array.from({ length: count }, (_, i) => [box([0.016, 0.85, 0.016], [-0.15 + i * 0.1, 0, -0.08], 'wood', { tilt: [0.32, 0] }), box([0.004, 0.25, 0.004], [-0.15 + i * 0.1, 0.55, 0.15], 'cloth_linen')]).flat()], x, z, r),
  // A water tub / barrel for live fish: staves, hoops, dark water and a fish showing.
  waterTub: (x, z, { kind = 'tub' } = {}) => kind === 'tub'
    ? [cylinder({ radiusBottom: 0.17, radiusTop: 0.2, height: 0.18, segments: 14 }, [x, 0, z], 'wood'), cylinder({ radiusBottom: 0.205, height: 0.02, segments: 14 }, [x, 0.12, z], 'iron'), cylinder({ radiusBottom: 0.18, height: 0.005, segments: 14 }, [x, 0.17, z], 'opening'),
      ...PROPS.fish(x + 0.03, z, { y: 0.165, r: 0.6 }), box([0.04, 0.03, 0.36], [x, 0.18, z], 'wood_dark', { rotation: 0.4 })]
    : [cylinder({ radiusBottom: 0.11, radiusTop: 0.12, height: 0.3, segments: 12 }, [x, 0, z], 'wood'), ...[0.06, 0.24].map(y => cylinder({ radiusBottom: 0.123, height: 0.02, segments: 12 }, [x, y, z], 'iron')), cylinder({ radiusBottom: 0.11, height: 0.005, segments: 12 }, [x, 0.3, z], 'opening'), cylinder({ radiusBottom: 0.04, radiusTop: 0.05, height: 0.06, segments: 8 }, [x + 0.07, 0.3, z + 0.05], 'wood_dark')],
  // ---------- pitch kiln ----------
  // An earth-covered tar kiln: stone base, a mound of turf with a smoking vent, the tar run-off spout into a trough.
  tarKiln: (x, z, { size = 1 } = {}) => withLights([
    cylinder({ radiusBottom: 0.38 * size, radiusTop: 0.36 * size, height: 0.12, segments: 16 }, [x, 0, z], 'fieldstone'),
    sphere([0.36 * size, 0.34 * size, 0.36 * size], [x, 0.1, z], 'soil', 1), sphere([0.3 * size, 0.18 * size, 0.3 * size], [x, 0.3 * size, z], 'moss', 1),
    cylinder({ radiusBottom: 0.06, radiusTop: 0.05, height: 0.08, segments: 8 }, [x, 0.42 * size, z], 'stone_dark'), cylinder({ radiusBottom: 0.04, height: 0.01, segments: 8 }, [x, 0.5 * size, z], 'coals'),
    box([0.14, 0.12, 0.04], [x + 0.06, 0.08, z + 0.35 * size], 'soot'), box([0.08, 0.06, 0.03], [x + 0.06, 0.09, z + 0.37 * size], 'coals'),
    box([0.05, 0.035, 0.22], [x - 0.16, 0.06, z + 0.4 * size], 'wood_dark', { tilt: [-0.15, 0] }), box([0.12, 0.06, 0.22], [x - 0.16, 0, z + 0.55 * size], 'wood_dark'), box([0.1, 0.01, 0.18], [x - 0.16, 0.06, z + 0.55 * size], 'soot'),
  ], [{ type: 'brazier', at: [x + 0.06, 0.12, z + 0.37 * size] }]),
  // An iron cauldron of bubbling pitch on a tripod over a small fire.
  tarCauldron: (x, z) => withLights([
    ...[0, 2.1, 4.2].map(a => lean({ length: 0.5, radiusBottom: 0.015, segments: 5 }, a, 0.32, [x + Math.cos(a) * 0.16, 0, z + Math.sin(a) * 0.16], 'wood_dark').part),
    box([0.012, 0.12, 0.012], [x, 0.36, z], 'iron'), cylinder({ radiusBottom: 0.09, radiusTop: 0.11, height: 0.13, segments: 12 }, [x, 0.21, z], 'iron'), cylinder({ radiusBottom: 0.1, height: 0.006, segments: 12 }, [x, 0.34, z], 'soot'),
    cylinder({ radiusBottom: 0.13, height: 0.03, segments: 10 }, [x, 0, z], 'fieldstone_dark'), cylinder({ radiusBottom: 0.09, height: 0.035, segments: 8 }, [x, 0.01, z], 'coals'),
    box([0.2, 0.03, 0.03], [x, 0.04, z], 'charred_wood', { rotation: 0.6 }), box([0.2, 0.03, 0.03], [x, 0.04, z], 'charred_wood', { rotation: -0.6 }),
  ], [{ type: 'brazier', at: [x, 0.09, z] }]),
  // Barrels of pitch: tarred dark staves, iron hoops and a drip on the lid.
  tarBarrels: (x, z, { count = 3 } = {}) => [[0, 0], [0.2, 0.02], [0.1, 0.19], [0.1, 0.08, 0.24]].slice(0, count).flatMap(([dx, dz, y = 0]) => [
    cylinder({ radiusBottom: 0.09, radiusTop: 0.09, height: 0.24, segments: 10 }, [x + dx, y, z + dz], 'charred_wood'),
    cylinder({ radiusBottom: 0.093, height: 0.02, segments: 10 }, [x + dx, y + 0.04, z + dz], 'iron'), cylinder({ radiusBottom: 0.093, height: 0.02, segments: 10 }, [x + dx, y + 0.18, z + dz], 'iron'),
    cylinder({ radiusBottom: 0.08, height: 0.006, segments: 10 }, [x + dx, y + 0.24, z + dz], 'soot')]),
  // Resinous pine stumps and roots dug out for the kiln.
  stumpPile: (x, z) => [0, 1, 2, 3].flatMap(i => { const a = i * 1.7, px = x + Math.cos(a) * 0.13 * (i ? 1 : 0), pz = z + Math.sin(a) * 0.12 * (i ? 1 : 0);
    return [cylinder({ radiusBottom: 0.07, radiusTop: 0.06, height: 0.12, segments: 7, tilt: [0.3 * (i % 2), 0.4 * ((i + 1) % 2)] }, [px, i === 3 ? 0.1 : 0, pz], 'bark'), sphere([0.08, 0.03, 0.07], [px, 0, pz], 'wood', 0)]; }),
  // Finished torches bundled upright in a crate, their pitch heads dark.
  torchBundle: (x, z) => [box([0.2, 0.14, 0.16], [x, 0, z], 'wood'), ...[[-0.05, -0.03], [0, -0.03], [0.05, -0.03], [-0.03, 0.03], [0.03, 0.03]].flatMap(([dx, dz], i) => [
    box([0.022, 0.32, 0.022], [x + dx, 0.04, z + dz], 'wood', { tilt: [dz * 2, -dx * 2] }), cylinder({ radiusBottom: 0.025, radiusTop: 0.03, height: 0.07, segments: 6 }, [x + dx * 1.3, 0.36, z + dz * 1.3], i % 2 ? 'soot' : 'charred_wood')])],
  billets: (x, z, { r = 0 } = {}) => PROPS.logs(x, z, { count: 6, length: 0.32, r }),

  // ---------- campfire ----------
  campfire: (x, z, { lit = true } = {}) => withLights([
    ...Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2; return sphere([0.045, 0.035, 0.04], [x + Math.cos(a) * 0.17, 0, z + Math.sin(a) * 0.17], i % 2 ? 'fieldstone' : 'fieldstone_light', 0); }),
    cylinder({ radiusBottom: 0.13, height: 0.012, segments: 12 }, [x, 0, z], lit ? 'coals' : 'soot'),
    ...[0, 1.05, 2.1].map(a => lean({ length: 0.26, radiusBottom: 0.025, segments: 6 }, a, lit ? 0.85 : 1.45, [x + Math.cos(a) * 0.12, 0.01, z + Math.sin(a) * 0.12], lit ? 'bark' : 'charred_wood').part),
    ...(lit ? [] : [box([0.18, 0.03, 0.04], [x + 0.02, 0.012, z], 'charred_wood', { rotation: 0.9 }), sphere([0.06, 0.012, 0.05], [x - 0.03, 0.012, z + 0.03], 'stone_light', 0)]),
  ], lit ? [{ type: 'brazier', at: [x, 0.08, z] }] : []),
  logSeat: (x, z, { r = 0, length = 0.42 } = {}) => place([cylinder({ radiusBottom: 0.06, height: length, segments: 8, tilt: [0, -Math.PI / 2] }, [-length / 2, 0.06, 0], 'bark'), cylinder({ radiusBottom: 0.05, height: 0.005, segments: 8, tilt: [0, -Math.PI / 2] }, [length / 2, 0.06, 0], 'wood')], x, z, r),
  bedroll: (x, z, { r = 0, cloth = 'cloth_wool' } = {}) => place([box([0.42, 0.04, 0.16], [0, 0, 0], cloth), cylinder({ radiusBottom: 0.05, height: 0.16, segments: 8, tilt: [Math.PI / 2, 0] }, [-0.21, 0.05, -0.08], cloth)], x, z, r),

  // ---------- village green and ornaments ----------
  // A broad linden / oak: trunk, root flare and a layered round crown (allowed to overhang).
  greenTree: (x, z, { size = 1, foliage = 'foliage', season = 'summer' } = {}) => {
    const leaf = season === 'winter' ? null : season === 'autumn' ? ['foliage_autumn_dark', 'foliage_autumn', 'foliage_autumn_light'] : [`${foliage}_dark`, foliage, `${foliage}_light`];
    const out = [cylinder({ radiusBottom: 0.14 * size, radiusTop: 0.08 * size, height: 0.12, segments: 9 }, [x, 0, z], 'bark'), cylinder({ radiusBottom: 0.075 * size, radiusTop: 0.06 * size, height: 0.75 * size, segments: 9 }, [x, 0.1, z], 'bark')];
    for (const [a, l] of [[0.6, 0.42], [2.4, 0.4], [4.3, 0.38]]) out.push(lean({ length: l * size, radiusBottom: 0.03 * size, radiusTop: 0.015, segments: 6 }, a, 0.85, [x, 0.6 * size, z], 'bark').part);
    if (leaf) for (const [dx, dy, dz, rr, m] of [[0, 0.72, 0, 0.5, 0], [-0.2, 0.9, 0.12, 0.36, 1], [0.22, 0.88, -0.1, 0.36, 1], [0.05, 1.08, 0.04, 0.3, 2], [0.18, 0.78, 0.2, 0.26, 2]])
      out.push({ ...sphere([rr * size, rr * 0.75 * size, rr * size], [x + dx * size, dy * size, z + dz * size], leaf[m], 1), overhang: true });
    else for (const [a, l] of [[1.2, 0.3], [3.4, 0.28], [5.2, 0.3], [0.2, 0.25]]) out.push(lean({ length: l * size, radiusBottom: 0.015, radiusTop: 0.006, segments: 5 }, a, 0.6, [x, 0.85 * size, z], 'bark').part);
    if (season === 'winter') out.push(sphere([0.2 * size, 0.012, 0.2 * size], [x, 0.001, z], 'snow', 0));
    return out;
  },
  // A rope swing on a branch: the branch, two ropes and a plank seat.
  ropeSwing: (x, z, { height = 0.62, r = 0 } = {}) => place([box([0.42, 0.045, 0.05], [0.12, height, 0], 'bark', { tilt: [0, 0.12] }), box([0.008, height - 0.17, 0.008], [0.07, 0.17, 0], 'cloth_brown'), box([0.008, height - 0.17, 0.008], [0.23, 0.17, 0], 'cloth_brown'),
    box([0.22, 0.025, 0.08], [0.15, 0.15, 0], 'wood')], x, z, r),
  swingFrame: (x, z, { r = 0 } = {}) => place([...[-1, 1].flatMap(s => [box([0.04, 0.62, 0.04], [s * 0.3, 0, -0.1], 'wood_dark', { tilt: [0.16, 0] }), box([0.04, 0.62, 0.04], [s * 0.3, 0, 0.1], 'wood_dark', { tilt: [-0.16, 0] })]),
    box([0.7, 0.045, 0.045], [0, 0.6, 0], 'wood'), box([0.008, 0.42, 0.008], [-0.08, 0.18, 0], 'cloth_brown'), box([0.008, 0.42, 0.008], [0.08, 0.18, 0], 'cloth_brown'), box([0.22, 0.025, 0.08], [0, 0.17, 0], 'wood')], x, z, r),
  // A dome-shaped haystack around a pole, a rake leaning on it, optional snow cap.
  haystack: (x, z, { size = 1, snow = false } = {}) => [
    cylinder({ radiusBottom: 0.26 * size, radiusTop: 0.24 * size, height: 0.18 * size, segments: 12 }, [x, 0, z], 'thatch'), sphere([0.25 * size, 0.3 * size, 0.25 * size], [x, 0.14 * size, z], 'thatch', 1),
    box([0.025, 0.12, 0.025], [x, 0.52 * size, z], 'wood_dark'), cylinder({ radiusBottom: 0.27 * size, height: 0.02, segments: 12 }, [x, 0.08 * size, z], 'cloth_ochre'),
    ...(snow ? [sphere([0.2 * size, 0.12 * size, 0.2 * size], [x, 0.33 * size, z], 'snow', 1)] : []),
    box([0.022, 0.5, 0.022], [x + 0.2 * size, 0, z + 0.18 * size], 'wood', { tilt: [-0.3, -0.2] }), box([0.14, 0.02, 0.03], [x + 0.2 * size, 0.46, z + 0.04 * size], 'wood_dark', { rotation: 0.6 }),
  ],
  // Wells: a stone draw-well with a little roof and windlass, or a sweep well (shadoof) with a long counterweighted pole.
  stoneWell: (x, z, { roof = 'roof_shingle', snow = false } = {}) => [
    cylinder({ radiusBottom: 0.23, radiusTop: 0.22, height: 0.28, segments: 14 }, [x, 0, z], 'fieldstone'), cylinder({ radiusBottom: 0.235, radiusTop: 0.235, height: 0.04, segments: 14 }, [x, 0.28, z], 'stone_light'),
    cylinder({ radiusBottom: 0.16, height: 0.005, segments: 14 }, [x, 0.32, z], 'opening'),
    box([0.045, 0.56, 0.045], [x - 0.19, 0.24, z], 'wood_dark'), box([0.045, 0.56, 0.045], [x + 0.19, 0.24, z], 'wood_dark'),
    cylinder({ radiusBottom: 0.045, height: 0.34, segments: 8, tilt: [0, Math.PI / 2] }, [x + 0.17, 0.62, z], 'wood'), box([0.1, 0.02, 0.02], [x + 0.25, 0.62, z + 0.05], 'wood_dark'),
    box([0.008, 0.18, 0.008], [x, 0.44, z], 'cloth_brown'), cylinder({ radiusBottom: 0.045, radiusTop: 0.05, height: 0.07, segments: 8 }, [x, 0.37, z], 'wood'),
    prism([0.5, 0.2, 0.36], [x, 0.8, z], roof), ...(snow ? [prism([0.48, 0.07, 0.38], [x, 0.94, z], 'snow')] : []),
    cylinder({ radiusBottom: 0.05, radiusTop: 0.055, height: 0.09, segments: 8 }, [x + 0.28, 0, z + 0.14], 'wood'),
  ],
  sweepWell: (x, z, { snow = false } = {}) => [
    box([0.36, 0.24, 0.36], [x, 0, z], 'wood'), box([0.3, 0.005, 0.3], [x, 0.24, z], 'opening'), ...[-1, 1].map(s => box([0.38, 0.03, 0.03], [x, 0.24, z + s * 0.17], 'wood_dark')),
    box([0.06, 0.62, 0.06], [x - 0.34, 0, z - 0.08], 'bark'), box([0.06, 0.08, 0.1], [x - 0.34, 0.6, z - 0.08], 'wood_dark'),
    box([0.8, 0.035, 0.035], [x - 0.1, 0.62, z - 0.08], 'wood', { tilt: [0, -0.42] }), sphere([0.06, 0.05, 0.06], [x - 0.4, 0.42, z - 0.08], 'fieldstone', 1),
    box([0.008, 0.36, 0.008], [x + 0.06, 0.48, z - 0.04], 'wood_dark'), cylinder({ radiusBottom: 0.045, radiusTop: 0.05, height: 0.08, segments: 8 }, [x + 0.06, 0.42, z - 0.04], 'wood'),
    ...(snow ? [box([0.36, 0.03, 0.36], [x, 0.24, z], 'snow')] : []),
  ],
  wayCross: (x, z) => [box([0.2, 0.08, 0.2], [x, 0, z], 'stone_dark'), box([0.08, 0.62, 0.06], [x, 0.08, z], 'stone_light'), box([0.3, 0.07, 0.06], [x, 0.5, z], 'stone_light'), sphere([0.06, 0.04, 0.05], [x + 0.1, 0.08, z + 0.1], 'blossom', 0)],
  maypole: (x, z, { colours = ['cloth_red', 'cloth_blue', 'cloth_ochre'] } = {}) => [cylinder({ radiusBottom: 0.035, radiusTop: 0.025, height: 1.3, segments: 8 }, [x, 0, z], 'wood'), cylinder({ radiusBottom: 0.12, radiusTop: 0.04, height: 0.1, segments: 10 }, [x, 1.12, z], 'foliage_spring'),
    ...colours.flatMap((c, i) => { const a = i / colours.length * Math.PI * 2 + 0.4; return [box([0.012, 1.0, 0.012], [x + Math.cos(a) * 0.04, 0.12, z + Math.sin(a) * 0.04], c, { tilt: [Math.sin(a) * 0.38, -Math.cos(a) * 0.38] })]; }),
    sphere([0.04, 0.04, 0.04], [x, 1.3, z], 'gold_trim', 0)],
  flowerBed: (x, z, { width = 0.4, depth = 0.22, r = 0 } = {}) => place([box([width, 0.05, depth], [0, 0, 0], 'soil'), ...Array.from({ length: 8 }, (_, i) => sphere([0.035, 0.03, 0.035], [-width / 2 + 0.05 + (i % 4) * (width - 0.1) / 3, 0.05, (i < 4 ? -1 : 1) * depth / 4], ['blossom', 'cloth_ochre', 'foliage_light', 'cloth_red'][i % 4], 0))], x, z, r),
  ball: (x, z) => [sphere([0.05, 0.05, 0.05], [x, 0, z], 'leather', 1), box([0.1, 0.006, 0.006], [x, 0.05, z], 'cloth_linen', { rotation: 0.5 })],
  hoop: (x, z) => [cylinder({ radiusBottom: 0.1, radiusTop: 0.1, height: 0.012, segments: 14, tilt: [Math.PI / 2 - 0.25, 0] }, [x, 0.0, z], 'wood'), box([0.012, 0.25, 0.012], [x + 0.14, 0, z + 0.05], 'wood_dark', { tilt: [0, 0.7] })],
  snowman: (x, z, { hat = 'bucket' } = {}) => [sphere([0.13, 0.12, 0.13], [x, 0, z], 'snow', 1), sphere([0.095, 0.09, 0.095], [x, 0.2, z], 'snow', 1), sphere([0.07, 0.065, 0.07], [x, 0.35, z], 'snow', 1),
    box([0.03, 0.012, 0.012], [x + 0.02, 0.41, z + 0.07], 'cloth_ochre'), sphere([0.008, 0.008, 0.008], [x - 0.02, 0.43, z + 0.065], 'soot', 0), sphere([0.008, 0.008, 0.008], [x + 0.025, 0.43, z + 0.06], 'soot', 0),
    ...[0.25, 0.3].map(y => sphere([0.01, 0.01, 0.01], [x + 0.03, y, z + 0.09], 'soot', 0)),
    lean({ length: 0.16, radiusBottom: 0.008, segments: 4 }, 0, 1.0, [x + 0.08, 0.27, z], 'twigs').part, lean({ length: 0.16, radiusBottom: 0.008, segments: 4 }, Math.PI, 1.0, [x - 0.08, 0.27, z], 'twigs').part,
    ...(hat === 'bucket' ? [cylinder({ radiusBottom: 0.06, radiusTop: 0.05, height: 0.07, segments: 10 }, [x, 0.46, z], 'wood')] : [box([0.2, 0.025, 0.04], [x, 0.29, z + 0.05], 'cloth_red', { rotation: 0.2 }), cylinder({ radiusBottom: 0.06, radiusTop: 0.0, height: 0.1, segments: 8 }, [x, 0.46, z], 'cloth_blue')])],
});
