// Thematic props shared by building recipes. Each helper returns primitives
// standing on the ground at (x, z) in model units; `r` turns the prop around
// the vertical axis where that matters. Only style-guide materials are used.
import { box, cylinder, sphere, prism, lean, horse } from './shapes.js';

const T = Math.PI / 4;

export const PROPS = {
  sack: (x, z, { material = 'cloth_linen' } = {}) => [sphere([0.1, 0.085, 0.08], [x, 0, z], material, 1), sphere([0.035, 0.03, 0.035], [x, 0.16, z], material, 0)],
  sacks: (x, z, { count = 3, material = 'cloth_linen' } = {}) => {
    const spots = [[0, 0], [0.17, 0.05], [0.06, 0.16], [0.09, 0.07, 0.15], [0.22, 0.2]];
    return spots.slice(0, count).flatMap(([dx, dz, y = 0]) => PROPS.sack(x + dx, z + dz, { material }).map(p => ({ ...p, at: [p.at[0], p.at[1] + y, p.at[2]] })));
  },
  barrel: (x, z, { y = 0 } = {}) => [cylinder({ radiusBottom: 0.09, radiusTop: 0.09, height: 0.24, segments: 10 }, [x, y, z], 'wood'), cylinder({ radiusBottom: 0.093, height: 0.02, segments: 10 }, [x, y + 0.04, z], 'iron'), cylinder({ radiusBottom: 0.093, height: 0.02, segments: 10 }, [x, y + 0.18, z], 'iron')],
  barrels: (x, z, { count = 3 } = {}) => [[0, 0], [0.2, 0], [0.1, 0.18], [0.1, 0.07, 0.24]].slice(0, count).flatMap(([dx, dz, y = 0]) => PROPS.barrel(x + dx, z + dz, { y })),
  crate: (x, z, { size = 0.22, y = 0, r = 0 } = {}) => [box([size, size, size], [x, y, z], 'wood', { rotation: r }), box([size + 0.01, 0.03, size + 0.01], [x, y + size * 0.45, z], 'wood_dark', { rotation: r })],
  crates: (x, z, { count = 3 } = {}) => [[0, 0, 0], [0.24, 0, 0], [0.12, 0, 0.22], [0.1, 0.22, 0.05]].slice(0, count).flatMap(([dx, y, dz]) => PROPS.crate(x + dx, z + dz, { y })),
  hay: (x, z, { r = 0, y = 0 } = {}) => [box([0.32, 0.18, 0.2], [x, y, z], 'thatch', { rotation: r }), box([0.33, 0.02, 0.05], [x, y + 0.09, z], 'wood_dark', { rotation: r })],
  hayStack: (x, z) => [...PROPS.hay(x, z), ...PROPS.hay(x + 0.02, z + 0.22), ...PROPS.hay(x + 0.01, z + 0.11, { y: 0.18 })],
  logs: (x, z, { count = 6, length = 0.55, r = 0 } = {}) => {
    const out = [];
    for (let i = 0, row = 0; i < count; row++) for (let j = 0; j < 3 - row && i < count; j++, i++) out.push(box([length, 0.075, 0.075], [x + Math.sin(r) * (j * 0.085 + row * 0.04), row * 0.075, z + Math.cos(r) * (j * 0.085 + row * 0.04)], 'bark', { rotation: r }));
    return out;
  },
  firewood: (x, z) => [...PROPS.logs(x, z, { count: 6, length: 0.3 }), box([0.34, 0.03, 0.26], [x, 0.24, z + 0.08], 'roof_shingle')],
  stump: (x, z, { axe = true } = {}) => [cylinder({ radiusBottom: 0.09, radiusTop: 0.08, height: 0.14, segments: 8 }, [x, 0, z], 'bark'), ...(axe ? [box([0.025, 0.24, 0.025], [x + 0.02, 0.14, z + 0.02], 'wood_dark'), box([0.03, 0.06, 0.09], [x + 0.02, 0.34, z + 0.05], 'iron')] : [])],
  millstone: (x, z, { y = 0 } = {}) => [cylinder({ radiusBottom: 0.17, height: 0.07, segments: 14 }, [x, y, z], 'stone_light'), cylinder({ radiusBottom: 0.04, height: 0.072, segments: 8 }, [x, y + 0.001, z], 'stone_dark')],
  wheel: (x, z, { y = 0 } = {}) => [cylinder({ radiusBottom: 0.15, height: 0.03, segments: 12 }, [x, y, z], 'wood_dark'), cylinder({ radiusBottom: 0.12, height: 0.032, segments: 12 }, [x, y + 0.001, z], 'wood'), cylinder({ radiusBottom: 0.035, height: 0.06, segments: 8 }, [x, y, z], 'iron')],
  workbench: (x, z, { r = 0 } = {}) => [box([0.42, 0.04, 0.18], [x, 0.24, z], 'wood', { rotation: r }), ...[[-0.17, -0.06], [0.17, -0.06], [-0.17, 0.06], [0.17, 0.06]].map(([dx, dz]) => box([0.04, 0.24, 0.04], [x + dx * Math.cos(r) + dz * Math.sin(r), 0, z - dx * Math.sin(r) + dz * Math.cos(r)], 'wood_dark')), box([0.12, 0.04, 0.06], [x, 0.28, z], 'iron', { rotation: r })],
  oven: (x, z) => [box([0.6, 0.12, 0.5], [x, 0, z], 'stone_dark'), sphere([0.27, 0.2, 0.22], [x, 0.1, z], 'stone_light', 1), box([0.04, 0.12, 0.14], [x + 0.25, 0.14, z + 0.05], 'opening'), box([0.1, 0.18, 0.1], [x - 0.1, 0.4, z - 0.06], 'stone')],
  stoneStack: (x, z) => [box([0.36, 0.12, 0.24], [x, 0, z], 'stone'), box([0.3, 0.12, 0.2], [x, 0.12, z], 'stone_light'), box([0.16, 0.1, 0.16], [x + 0.06, 0.24, z], 'stone')],
  ore: (x, z) => [sphere([0.2, 0.09, 0.17], [x, 0, z], 'ore', 1), sphere([0.08, 0.06, 0.07], [x + 0.12, 0, z + 0.12], 'ore', 0), sphere([0.07, 0.05, 0.06], [x - 0.1, 0.12, z], 'rock', 0)],
  charcoal: (x, z) => [sphere([0.17, 0.08, 0.15], [x, 0, z], 'stone_dark', 1)],
  anvil: (x, z) => [cylinder({ radiusBottom: 0.09, radiusTop: 0.08, height: 0.16, segments: 8 }, [x, 0, z], 'bark'), box([0.2, 0.07, 0.09], [x, 0.16, z], 'iron', { rotation: T }), box([0.08, 0.03, 0.05], [x + 0.09, 0.2, z - 0.09], 'iron', { rotation: T })],
  toolRack: (x, z, { r = 0 } = {}) => [box([0.04, 0.4, 0.04], [x - 0.15 * Math.cos(r), 0, z + 0.15 * Math.sin(r)], 'wood_dark'), box([0.04, 0.4, 0.04], [x + 0.15 * Math.cos(r), 0, z - 0.15 * Math.sin(r)], 'wood_dark'), box([0.36, 0.03, 0.04], [x, 0.36, z], 'wood_dark', { rotation: r }), ...[-0.08, 0.02, 0.1].map(o => box([0.02, 0.32, 0.02], [x + o * Math.cos(r), 0.04, z - o * Math.sin(r) + 0.03], 'wood'))],
  hideRack: (x, z, { r = 0 } = {}) => [box([0.035, 0.46, 0.035], [x - 0.17 * Math.cos(r), 0, z + 0.17 * Math.sin(r)], 'wood_dark'), box([0.035, 0.46, 0.035], [x + 0.17 * Math.cos(r), 0, z - 0.17 * Math.sin(r)], 'wood_dark'), box([0.4, 0.03, 0.03], [x, 0.43, z], 'wood_dark', { rotation: r }), box([0.28, 0.26, 0.015], [x, 0.15, z], 'leather', { rotation: r })],
  antlers: (x, z, { y = 0.6 } = {}) => [box([0.18, 0.025, 0.025], [x, y, z], 'stone_light', { rotation: T }), box([0.025, 0.1, 0.025], [x - 0.06, y, z + 0.06], 'stone_light'), box([0.025, 0.1, 0.025], [x + 0.06, y, z - 0.06], 'stone_light')],
  fence: (x1, z1, x2, z2) => {
    const n = Math.max(1, Math.round(Math.hypot(x2 - x1, z2 - z1) / 0.3)), alongX = Math.abs(x2 - x1) >= Math.abs(z2 - z1), out = [];
    for (let i = 0; i <= n; i++) out.push(box([0.035, 0.3, 0.035], [x1 + (x2 - x1) * i / n, 0, z1 + (z2 - z1) * i / n], 'wood_dark'));
    for (const y of [0.12, 0.24]) out.push(box(alongX ? [Math.abs(x2 - x1), 0.025, 0.02] : [0.02, 0.025, Math.abs(z2 - z1)], [(x1 + x2) / 2, y, (z1 + z2) / 2], 'wood'));
    return out;
  },
  cart: (x, z) => [box([0.5, 0.06, 0.28], [x, 0.14, z], 'wood'), box([0.5, 0.1, 0.02], [x, 0.2, z + 0.13], 'wood'), box([0.02, 0.1, 0.28], [x + 0.24, 0.2, z], 'wood'), box([0.24, 0.24, 0.02], [x, 0, z + 0.155], 'wood_dark'), box([0.04, 0.04, 0.4], [x - 0.3, 0.14, z - 0.06], 'wood_dark', { rotation: 0.6 })],
  troughs: (x, z) => [box([0.42, 0.12, 0.16], [x, 0, z], 'wood_dark'), box([0.36, 0.02, 0.1], [x, 0.11, z], 'opening')],
  awning: (x, z, { width = 0.6, depth = 0.4, height = 0.6 } = {}) => [box([0.04, height, 0.04], [x - width / 2 + 0.03, 0, z + depth / 2 - 0.03], 'wood_dark'), box([0.04, height, 0.04], [x + width / 2 - 0.03, 0, z + depth / 2 - 0.03], 'wood_dark'), box([width, 0.03, depth], [x, height, z], 'roof_shingle')],
  tarp: (x, z) => [prism([0.5, 0.25, 0.36], [x, 0, z], 'cloth_ochre')],
};

// Military trades (V02). Racks hold identical weapons; the forge carries a runtime light.
const along = (x, z, r, d) => [x + Math.cos(r) * d, z - Math.sin(r) * d], ground = ([px, pz]) => [px, 0, pz];
Object.assign(PROPS, {
  forge: (x, z) => Object.assign([box([0.5, 0.3, 0.4], [x, 0, z], 'stone'), box([0.38, 0.04, 0.28], [x, 0.3, z], 'coals'), cylinder({ radiusBottom: 0.3, radiusTop: 0.1, height: 0.22, segments: 4 }, [x, 0.62, z], 'stone_dark'), box([0.14, 0.4, 0.14], [x, 0.84, z], 'stone_dark'), box([0.03, 0.32, 0.03], [x - 0.2, 0.3, z + 0.15], 'wood_dark'), box([0.03, 0.32, 0.03], [x + 0.2, 0.3, z + 0.15], 'wood_dark')], { lights: [{ type: 'brazier', at: [x, 0.38, z] }] }),
  quench: (x, z) => [cylinder({ radiusBottom: 0.11, height: 0.2, segments: 10 }, [x, 0, z], 'wood'), cylinder({ radiusBottom: 0.09, height: 0.005, segments: 10 }, [x, 0.2, z], 'opening'), cylinder({ radiusBottom: 0.113, height: 0.02, segments: 10 }, [x, 0.15, z], 'iron')],
  swordRack: (x, z, { r = 0, count = 4 } = {}) => {
    const out = [box([0.035, 0.5, 0.035], ground(along(x, z, r, -0.24)), 'wood_dark'), box([0.035, 0.5, 0.035], ground(along(x, z, r, 0.24)), 'wood_dark'), box([0.52, 0.035, 0.04], [x, 0.44, z], 'wood_dark', { rotation: r })];
    for (let i = 0; i < count; i++) { const [px, pz] = along(x, z, r, -0.16 + i * 0.32 / Math.max(1, count - 1)); out.push(box([0.025, 0.34, 0.012], [px, 0.08, pz], 'steel', { rotation: r }), box([0.09, 0.02, 0.02], [px, 0.42, pz], 'gold_trim', { rotation: r }), box([0.018, 0.07, 0.018], [px, 0.44, pz], 'leather')); }
    return out;
  },
  bowRack: (x, z, { r = 0, count = 3 } = {}) => {
    const [ax, az] = along(x, z, r, -0.2), [bx, bz] = along(x, z, r, 0.2), out = [box([0.035, 0.5, 0.035], [ax, 0, az], 'wood_dark'), box([0.035, 0.5, 0.035], [bx, 0, bz], 'wood_dark'), box([0.46, 0.035, 0.04], [x, 0.46, z], 'wood_dark', { rotation: r })];
    for (let i = 0; i < count; i++) { const [px, pz] = along(x, z, r, -0.12 + i * 0.12); out.push(lean({ length: 0.62, radiusBottom: 0.014, radiusTop: 0.01, segments: 5 }, -r + Math.PI / 2, 0.12, [px, 0, pz], 'wood').part); }
    return out;
  },
  staves: (x, z) => [-0.06, -0.02, 0.02, 0.06].flatMap((o, i) => [lean({ length: 0.7, radiusBottom: 0.016, segments: 5 }, i * 1.7, 0.08 + i * 0.03, [x + o, 0, z + (i % 2) * 0.05], i % 2 ? 'wood' : 'bark').part]),
  bowForm: (x, z, { r = 0 } = {}) => {
    const out = PROPS.workbench(x, z, { r }), [ax, az] = along(x, z, r, -0.02);
    out.push(lean({ length: 0.24, radiusBottom: 0.014, segments: 5 }, -r + Math.PI, 1.25, [ax, 0.29, az], 'wood').part, lean({ length: 0.24, radiusBottom: 0.014, segments: 5 }, -r, 1.25, [ax, 0.29, az], 'wood').part);
    return out;
  },
  armorStand: (x, z, { material = 'steel' } = {}) => [box([0.18, 0.04, 0.18], [x, 0, z], 'wood_dark'), box([0.04, 0.42, 0.04], [x, 0.04, z], 'wood_dark'), cylinder({ radiusBottom: 0.09, radiusTop: 0.115, height: 0.22, segments: 8 }, [x, 0.3, z], material), box([0.3, 0.06, 0.12], [x, 0.5, z], material, { rotation: -Math.PI / 4 }), sphere([0.07, 0.07, 0.07], [x, 0.55, z], material, 1)],
  plates: (x, z) => [0, 1, 2, 3].map(i => box([0.28 - i * 0.02, 0.025, 0.18 - i * 0.01], [x + i * 0.01, i * 0.026, z], i % 2 ? 'steel' : 'steel_dark', { rotation: i * 0.2 })),
  shield: (x, z, { angle = Math.PI / 4, material = 'banner', y = 0 } = {}) => { const disc = lean({ length: 0.03, radiusBottom: 0.15, segments: 12 }, angle, Math.PI / 2, [x, y + 0.15, z], material); return [disc.part, sphere([0.035, 0.035, 0.035], [x + Math.cos(angle) * 0.03, y + 0.13, z + Math.sin(angle) * 0.03], 'iron', 0)]; },
  banner: (x, z, { material = 'banner' } = {}) => [box([0.03, 0.9, 0.03], [x, 0, z], 'wood_dark'), box([0.02, 0.32, 0.22], [x + 0.02, 0.52, z + 0.11], material), sphere([0.03, 0.03, 0.03], [x, 0.9, z], 'gold_trim', 0)],
  weaponCrate: (x, z) => [...PROPS.crate(x, z, { size: 0.26 }), ...[-0.06, 0, 0.06].map(o => box([0.02, 0.12, 0.02], [x + o, 0.26, z + o * 0.5], 'leather')), box([0.12, 0.02, 0.02], [x, 0.36, z], 'gold_trim')],
  horse: (x, z, { angle = -Math.PI / 4, coat = 'horse_bay', saddle = false } = {}) => horse([x, 0, z], { angle, coat, saddle }).parts,
  saddleRack: (x, z) => [box([0.04, 0.32, 0.04], [x - 0.12, 0, z], 'wood_dark'), box([0.04, 0.32, 0.04], [x + 0.12, 0, z], 'wood_dark'), box([0.3, 0.05, 0.08], [x, 0.3, z], 'wood_dark'), box([0.24, 0.06, 0.26], [x, 0.35, z], 'leather'), box([0.04, 0.14, 0.28], [x, 0.24, z], 'banner')],
});

export const PROP_TYPES = Object.keys(PROPS);
