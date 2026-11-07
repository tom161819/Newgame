// Thematic props shared by building recipes. Each helper returns primitives
// standing on the ground at (x, z) in model units; `r` turns the prop around
// the vertical axis where that matters. Only style-guide materials are used.
import { box, cylinder, sphere, prism, lean, horse, rotateParts } from './shapes.js';

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
  // #114 seating for idle workers (#98): seat tops at about 0.17, the height a seated figure needs.
  bench: (x, z, { length = 0.5, r = 0 } = {}) => [box([length, 0.04, 0.12], [x, 0.15, z], 'wood', { rotation: r }), ...[-1, 1].map(s => box([0.04, 0.15, 0.1], [x + s * (length / 2 - 0.05) * Math.cos(r), 0, z - s * (length / 2 - 0.05) * Math.sin(r)], 'wood_dark', { rotation: r }))],
  stool: (x, z) => [cylinder({ radiusBottom: 0.07, radiusTop: 0.07, height: 0.03, segments: 10 }, [x, 0.14, z], 'wood'), ...[[-0.04, -0.03], [0.04, -0.03], [0, 0.045]].map(([dx, dz]) => box([0.025, 0.14, 0.025], [x + dx, 0, z + dz], 'wood_dark'))],
  table: (x, z, { r = 0 } = {}) => [box([0.4, 0.04, 0.26], [x, 0.24, z], 'wood', { rotation: r }), ...[[-0.16, -0.09], [0.16, -0.09], [-0.16, 0.09], [0.16, 0.09]].map(([dx, dz]) => box([0.04, 0.24, 0.04], [x + dx * Math.cos(r) + dz * Math.sin(r), 0, z - dx * Math.sin(r) + dz * Math.cos(r)], 'wood_dark'))],
  basket: (x, z, { y = 0 } = {}) => [cylinder({ radiusBottom: 0.07, radiusTop: 0.09, height: 0.09, segments: 10 }, [x, y, z], 'twigs'), sphere([0.045, 0.03, 0.035], [x - 0.02, y + 0.09, z], 'cloth_ochre', 1), sphere([0.04, 0.028, 0.032], [x + 0.03, y + 0.09, z + 0.02], 'cloth_ochre', 1)],
  saddleRack: (x, z) => [box([0.04, 0.32, 0.04], [x - 0.12, 0, z], 'wood_dark'), box([0.04, 0.32, 0.04], [x + 0.12, 0, z], 'wood_dark'), box([0.3, 0.05, 0.08], [x, 0.3, z], 'wood_dark'), box([0.24, 0.06, 0.26], [x, 0.35, z], 'leather'), box([0.04, 0.14, 0.28], [x, 0.24, z], 'banner')],
});

// Trade (obchod F1): market stalls, goods and the merchant's covered wagon.
const GOODS = { food: ['cloth_ochre', 'foliage_autumn_light', 'cloth_red', 'wheat'], cloth: ['cloth_blue', 'cloth_red', 'cloth_linen', 'cloth_green'], tools: ['iron', 'steel', 'wood_dark', 'leather'], pottery: ['roof_tile', 'plaster', 'stone_light', 'roof_tile'] };
const goodsColour = (kind, i) => { const list = GOODS[kind] ?? GOODS.food; const id = list[i % list.length]; return id === 'wheat' ? 'thatch' : id; };
Object.assign(PROPS, {
  // A market stall: four posts, a counter with goods and a sloping striped cloth roof. Front (+x/+z) faces the camera.
  stall: (x, z, { r = 0, cloth = 'cloth_red', stripe = 'cloth_linen', goods = 'food', width = 0.62, depth = 0.4 } = {}) => {
    const local = [];
    for (const [dx, dz, h] of [[-width / 2 + 0.03, depth / 2 - 0.03, 0.62], [width / 2 - 0.03, depth / 2 - 0.03, 0.62], [-width / 2 + 0.03, -depth / 2 + 0.03, 0.74], [width / 2 - 0.03, -depth / 2 + 0.03, 0.74]]) local.push(box([0.04, h, 0.04], [dx, 0, dz], 'wood_dark'));
    local.push(box([width - 0.04, 0.2, 0.16], [0, 0, depth / 2 - 0.1], 'wood'), box([width, 0.03, 0.2], [0, 0.2, depth / 2 - 0.1], 'wood_dark'));
    // Striped cloth roof: alternating thin slats tilted down towards the front.
    const stripes = 5;
    for (let i = 0; i < stripes; i++) local.push(box([width / stripes + 0.005, 0.02, depth + 0.14], [-width / 2 + (i + 0.5) * width / stripes, 0.66, 0], i % 2 ? stripe : cloth, { tilt: [0.2, 0] }));
    // Goods on the counter and a crate or basket below.
    for (let i = 0; i < 4; i++) local.push(sphere([0.045, 0.035, 0.04], [-width / 2 + 0.1 + i * (width - 0.2) / 3, 0.23, depth / 2 - 0.1], goodsColour(goods, i), 1));
    local.push(box([0.16, 0.14, 0.14], [-width / 2 + 0.14, 0, -depth / 2 + 0.12], 'wood'), sphere([0.07, 0.05, 0.06], [width / 2 - 0.14, 0, -depth / 2 + 0.12], goodsColour(goods, 2), 1));
    return rotateParts(local, r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
  },
  goodsPile: (x, z, { kind = 'food' } = {}) => [...PROPS.sacks(x, z, { count: 3 }), ...PROPS.crate(x + 0.26, z - 0.05, { size: 0.2 }), sphere([0.06, 0.045, 0.05], [x + 0.28, 0.2, z - 0.05], goodsColour(kind, 1), 1), ...PROPS.barrel(x - 0.12, z + 0.22)],
  well: (x, z) => [cylinder({ radiusBottom: 0.2, radiusTop: 0.2, height: 0.24, segments: 12 }, [x, 0, z], 'stone'), cylinder({ radiusBottom: 0.15, height: 0.005, segments: 12 }, [x, 0.24, z], 'opening'), box([0.035, 0.52, 0.035], [x - 0.17, 0.2, z], 'wood_dark'), box([0.035, 0.52, 0.035], [x + 0.17, 0.2, z], 'wood_dark'), box([0.4, 0.035, 0.04], [x, 0.7, z], 'wood_dark'), prism([0.46, 0.16, 0.3], [x, 0.72, z], 'roof_shingle'), cylinder({ radiusBottom: 0.05, height: 0.08, segments: 8 }, [x, 0.42, z], 'wood')],
  scales: (x, z) => [box([0.04, 0.5, 0.04], [x, 0, z], 'wood_dark'), box([0.36, 0.025, 0.025], [x, 0.5, z], 'iron', { rotation: Math.PI / 4 }), cylinder({ radiusBottom: 0.07, radiusTop: 0.08, height: 0.02, segments: 10 }, [x - 0.12, 0.34, z + 0.12], 'iron'), cylinder({ radiusBottom: 0.07, radiusTop: 0.08, height: 0.02, segments: 10 }, [x + 0.12, 0.38, z - 0.12], 'iron')],
  // A marked loading place (obchod F1: the marketplace has two): a low plank platform with a post and a rope.
  loadingBay: (x, z, { r = 0 } = {}) => rotateParts([box([0.5, 0.04, 0.36], [0, 0, 0], 'wood'), ...[-0.12, 0.0, 0.12].map(dz => box([0.5, 0.045, 0.02], [0, 0, dz], 'wood_dark')), box([0.04, 0.34, 0.04], [0.27, 0, 0.2], 'wood_dark'), box([0.12, 0.08, 0.02], [0.27, 0.34, 0.2], 'cloth_ochre')], r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] })),
  hitchingPost: (x, z, { length = 0.6, r = 0 } = {}) => rotateParts([box([0.04, 0.32, 0.04], [-length / 2, 0, 0], 'wood_dark'), box([0.04, 0.32, 0.04], [length / 2, 0, 0], 'wood_dark'), box([length + 0.06, 0.04, 0.04], [0, 0.28, 0], 'wood')], r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] })),
  // The merchant's covered wagon (obchod F1). Built along +x and turned to face `angle` (0 = +x, π/2 = +z).
  // load: 'full' (canvas cover, goods showing at the back), 'empty' (no cover, bare bed), 'unloading' (cover rolled
  // back, tailgate down, crates beside). horse: a draught horse in the shafts.
  wagon: (x0, z0, { angle = 0, load = 'full', horse: withHorse = true, cover = 'cloth_linen', coat = 'horse_chestnut' } = {}) => {
    // (x0, z0) is the middle of the whole rig, wagon and horse together.
    const x = x0 - Math.cos(angle) * (withHorse ? 0.45 : 0), z = z0 - Math.sin(angle) * (withHorse ? 0.45 : 0);
    const L = 0.86, W = 0.44, bed = 0.26, local = [];
    local.push(box([L, 0.06, W], [0, bed, 0], 'wood'), box([L, 0.13, 0.03], [0, bed + 0.06, W / 2 - 0.015], 'wood'), box([L, 0.13, 0.03], [0, bed + 0.06, -W / 2 + 0.015], 'wood'), box([0.03, 0.13, W], [L / 2 - 0.015, bed + 0.06, 0], 'wood'));
    if (load !== 'unloading') local.push(box([0.03, 0.13, W], [-L / 2 + 0.015, bed + 0.06, 0], 'wood'));
    else local.push(box([0.2, 0.025, W - 0.04], [-L / 2 - 0.09, bed - 0.05, 0], 'wood', { tilt: [0, -0.5] }));
    local.push(box([0.06, 0.06, W + 0.1], [0.27, 0.13, 0], 'wood_dark'), box([0.06, 0.06, W + 0.1], [-0.27, 0.13, 0], 'wood_dark'));
    for (const wx of [0.27, -0.27]) for (const side of [1, -1]) {
      const wheel = lean({ length: 0.035, radiusBottom: wx > 0 ? 0.14 : 0.16, segments: 12 }, side > 0 ? Math.PI / 2 : -Math.PI / 2, Math.PI / 2, [wx, wx > 0 ? 0.14 : 0.16, side * (W / 2 + 0.03)], 'wood_dark');
      local.push(wheel.part);
    }
    // Shafts to the horse and the driver's bench.
    local.push(box([0.5, 0.03, 0.03], [L / 2 + 0.24, bed - 0.02, 0.16], 'wood_dark'), box([0.5, 0.03, 0.03], [L / 2 + 0.24, bed - 0.02, -0.16], 'wood_dark'), box([0.1, 0.04, W - 0.04], [L / 2 - 0.08, bed + 0.2, 0], 'wood_dark'));
    if (load === 'full') {
      for (const gx of [-0.3, -0.12]) local.push(box([0.15, 0.15, 0.15], [gx, bed + 0.06, -0.08], 'wood'), sphere([0.08, 0.06, 0.07], [gx + 0.02, bed + 0.06, 0.1], 'cloth_linen', 1));
      local.push(...PROPS.barrel(0.1, 0.08, { y: bed + 0.06 }));
      local.push(prism([W + 0.06, 0.3, L * 0.78], [-0.04, bed + 0.2, 0], cover, { rotation: Math.PI / 2 }));
      for (const hx of [-0.36, -0.04, 0.26]) local.push(box([0.03, 0.03, W + 0.07], [hx, bed + 0.19, 0], 'wood_dark'));
    } else if (load === 'unloading') {
      local.push(prism([W + 0.06, 0.24, 0.24], [0.24, bed + 0.2, 0], cover, { rotation: Math.PI / 2 }), box([0.15, 0.15, 0.15], [0.02, bed + 0.06, 0.06], 'wood'));
      local.push(...PROPS.crate(-L / 2 - 0.3, 0.2, { size: 0.18 }), ...PROPS.sack(-L / 2 - 0.32, -0.12), ...PROPS.crate(-L / 2 - 0.18, -0.25, { size: 0.16, r: 0.4 }));
    } else {
      for (const hx of [-0.36, -0.04, 0.26]) { local.push(box([0.025, 0.2, 0.025], [hx, bed + 0.06, W / 2 - 0.02], 'wood_dark'), box([0.025, 0.2, 0.025], [hx, bed + 0.06, -W / 2 + 0.02], 'wood_dark')); }
      local.push(sphere([0.07, 0.05, 0.06], [-0.25, bed + 0.06, -0.1], 'cloth_linen', 1));
    }
    const turned = rotateParts(local, -angle).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
    if (withHorse) { const ax = Math.cos(angle), az = Math.sin(angle); turned.push(...horse([x + ax * (L / 2 + 0.52), 0, z + az * (L / 2 + 0.52)], { angle, coat, saddle: false, scale: 0.85 }).parts); }
    return turned;
  },
  // Wheelwright (#92 revision): a spoked wheel. plane 'x' stands it upright with its face toward +z, 'z' upright
  // facing +x, 'flat' lays it down at height y (on a wheel stand). done < 1 leaves part of the rim unbuilt, so the
  // bare spoke ends show; tire adds a thin iron band round a finished wheel.
  spokedWheel: (x, z, { radius = 0.22, plane = 'x', spokes = 10, done = 1, y = 0, thick = 0.035, tire = done >= 1 } = {}) => spokedWheel(x, z, { radius, plane, spokes, done, y, thick, tire }),
  // Wheel stand: a low post with a half-built wheel lying on it, spokes in, felloes being fitted.
  wheelStand: (x, z, { radius = 0.24, done = 0.55 } = {}) => [cylinder({ radiusBottom: 0.07, radiusTop: 0.055, height: 0.26, segments: 8 }, [x, 0, z], 'bark'), ...spokedWheel(x, z, { radius, plane: 'flat', spokes: 12, done, y: 0.28, thick: 0.035, tire: false })],
  // Bundle of shaped spokes and felloe blanks waiting on the floor.
  spokesBundle: (x, z, { r = 0 } = {}) => rotateParts([...[-0.06, -0.03, 0, 0.03, 0.06].map((o, i) => box([0.3, 0.022, 0.022], [0, (i % 2) * 0.022, o], 'wood')), ...[0, 1].map(i => box([0.18, 0.03, 0.05], [0.02, 0.045, -0.02 + i * 0.06], 'wood_dark', { rotation: 0.3 }))], r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] })),
  // Stall for one horse: posts, a plank back wall, low side boards (so the horse shows), a sloping roof, hay rack and straw. Built open toward
  // local +z with the horse standing along local x, then turned by r (quarter turns: π/2 opens it toward +x).
  horseStall: (x, z, { r = 0, length = 1.1, depth = 0.62, coat = 'horse_bay', horse: withHorse = true } = {}) => {
    const front = 1.08, back = 0.86, local = [];
    for (const lx of [-length / 2 + 0.03, length / 2 - 0.03]) local.push(box([0.06, front, 0.06], [lx, 0, depth / 2 - 0.03], 'wood_dark'), box([0.06, back, 0.06], [lx, 0, -depth / 2 + 0.03], 'wood_dark'));
    local.push(box([length - 0.04, back * 0.85, 0.04], [0, 0, -depth / 2 + 0.02], 'wood'), box([0.04, 0.4, depth - 0.08], [-length / 2 + 0.02, 0, 0], 'wood'), box([0.04, 0.4, depth * 0.55], [length / 2 - 0.02, 0, -depth * 0.2], 'wood'));
    local.push(box([length + 0.04, 0.05, 0.06], [0, front - 0.05, depth / 2 - 0.03], 'wood_dark'));
    const steps = 5;
    for (let i = 0; i < steps; i++) { const t = (i + 0.5) / steps, lz = -depth / 2 - 0.06 + t * (depth + 0.16); local.push(box([length + 0.1, 0.035, (depth + 0.16) / steps + 0.03], [0, back + (front - back) * t, lz], 'roof_shingle')); }
    local.push(box([length - 0.1, 0.015, depth - 0.1], [0, 0, 0], 'thatch'), box([0.34, 0.14, 0.12], [-length / 2 + 0.26, 0.3, -depth / 2 + 0.1], 'wood_dark'), box([0.3, 0.06, 0.09], [-length / 2 + 0.26, 0.42, -depth / 2 + 0.1], 'thatch'));
    local.push(box([0.05, 0.03, 0.03], [length / 2 - 0.12, 0.5, depth / 2 - 0.03], 'iron'));
    if (withHorse) local.push(...horse([0.02, 0, 0.08], { angle: Math.PI, coat, scale: 0.8 }).parts);
    return rotateParts(local, r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] }));
  },
  // Builder's yard (#119): squared beams, planks and a sawhorse.
  planks: (x, z, { count = 5, length = 0.7, r = 0 } = {}) => Array.from({ length: count }, (_, i) => box([length, 0.025, 0.12], [x + Math.sin(r) * (i % 2) * 0.02, i * 0.026, z + Math.cos(r) * (i % 2) * 0.02], i % 3 ? 'wood' : 'wood_dark', { rotation: r })),
  beams: (x, z, { count = 4, length = 0.8, r = 0 } = {}) => Array.from({ length: count }, (_, i) => box([length, 0.08, 0.08], [x + Math.sin(r) * (i % 2) * 0.09, Math.floor(i / 2) * 0.08, z + Math.cos(r) * (i % 2) * 0.09], 'wood', { rotation: r })),
  sawhorse: (x, z, { r = 0, log = true } = {}) => rotateParts([...[-0.15, 0.15].flatMap(dx => [box([0.03, 0.26, 0.03], [dx, 0, -0.07], 'wood_dark', { tilt: [0.25, 0] }), box([0.03, 0.26, 0.03], [dx, 0, 0.07], 'wood_dark', { tilt: [-0.25, 0] })]), box([0.42, 0.04, 0.04], [0, 0.24, 0], 'wood_dark'), ...(log ? [box([0.6, 0.08, 0.08], [0.05, 0.28, 0], 'bark')] : [])], r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] })),
  ladder: (x, z, { r = 0, height = 0.8 } = {}) => rotateParts([box([0.025, height, 0.025], [-0.08, 0, 0], 'wood'), box([0.025, height, 0.025], [0.08, 0, 0], 'wood'), ...Array.from({ length: Math.round(height / 0.14) }, (_, i) => box([0.17, 0.02, 0.02], [0, 0.1 + i * 0.14, 0], 'wood_dark'))], r).map(p => ({ ...p, at: [p.at[0] + x, p.at[1], p.at[2] + z] })),
  mortarTub: (x, z) => [box([0.3, 0.1, 0.2], [x, 0, z], 'wood_dark'), box([0.26, 0.01, 0.16], [x, 0.1, z], 'plaster'), box([0.04, 0.02, 0.2], [x + 0.12, 0.11, z], 'iron', { rotation: 0.5 })],
});


// Spoked wheel made of boxes: spokes from the hub and short straight felloes round the rim. Each piece runs from
// point a to point b in the wheel plane (u, v); upright wheels lean their boxes about the base (tilt), flat ones turn
// about the vertical axis.
function spokedWheel(x, z, { radius, plane, spokes, done, y, thick, tire }) {
  const flat = plane === 'flat', cy = flat ? y : radius + 0.01, parts = [];
  const piece = (a, b, width, depth, material, lift = 0) => {
    const du = b[0] - a[0], dv = b[1] - a[1], length = Math.hypot(du, dv);
    if (flat) return box([length, depth, width], [x + (a[0] + b[0]) / 2, y + lift, z + (a[1] + b[1]) / 2], material, { rotation: Math.atan2(-dv, du) });
    if (plane === 'x') return box([width, length, depth], [x + a[0], cy + a[1], z], material, { tilt: [0, Math.atan2(-du, dv)] });
    return box([depth, length, width], [x, cy + a[1], z + a[0]], material, { tilt: [Math.atan2(du, dv), 0] });
  };
  const at = (r, phi) => [r * Math.cos(phi), r * Math.sin(phi)], rim = radius - 0.018, segs = 16;
  for (let i = 0; i < spokes; i++) { const phi = (i + 0.25) * 2 * Math.PI / spokes; parts.push(piece(at(0.035, phi), at(rim - 0.012, phi), 0.018, thick * 0.55, 'wood', thick * 0.22)); }
  for (let k = 0; k < Math.round(segs * done); k++) parts.push(piece(at(rim, k * 2 * Math.PI / segs), at(rim, (k + 1) * 2 * Math.PI / segs), 0.036, thick, 'wood_dark'));
  if (tire) for (let k = 0; k < segs; k++) parts.push(piece(at(radius - 0.004, k * 2 * Math.PI / segs), at(radius - 0.004, (k + 1) * 2 * Math.PI / segs), 0.01, thick * 1.05, 'iron'));
  const hub = thick + 0.035;
  if (flat) parts.push(cylinder({ radiusBottom: 0.045, height: hub, segments: 10 }, [x, y - 0.0175, z], 'iron'));
  else if (plane === 'x') parts.push(cylinder({ radiusBottom: 0.045, height: hub, segments: 10, tilt: [Math.PI / 2, 0] }, [x, cy, z - hub / 2], 'iron'));
  else parts.push(cylinder({ radiusBottom: 0.045, height: hub, segments: 10, tilt: [0, -Math.PI / 2] }, [x - hub / 2, cy, z], 'iron'));
  return parts;
}

export const PROP_TYPES = Object.keys(PROPS);

// Mining (#92 revision): rails from the adit, a loaded mine cart, ore heaps, pickaxes and pit props.
Object.assign(PROPS, {
  // Straight track along +z (r = 0) or +x (r = π/2) from (x, z), `length` long: sleepers and two iron rails.
  rails: (x, z, { length = 0.9, r = 0 } = {}) => {
    const ax = Math.sin(r), az = Math.cos(r), out = [], n = Math.max(2, Math.round(length / 0.16));
    for (let i = 0; i <= n; i++) out.push(box([0.24, 0.025, 0.05], [x + ax * length * i / n, 0, z + az * length * i / n], 'wood_dark', { rotation: r }));
    for (const side of [-0.07, 0.07]) out.push(box([0.02, 0.02, length + 0.06], [x + ax * length / 2 + az * side, 0.025, z + az * length / 2 - ax * side], 'iron', { rotation: r }));
    return out;
  },
  minecart: (x, z, { r = 0, load = true } = {}) => {
    const out = [box([0.2, 0.15, 0.28], [x, 0.07, z], 'wood_dark', { rotation: r }), box([0.21, 0.025, 0.29], [x, 0.2, z], 'iron', { rotation: r }), box([0.21, 0.025, 0.29], [x, 0.09, z], 'iron', { rotation: r })];
    for (const [dx, dz] of [[-0.1, -0.09], [0.1, -0.09], [-0.1, 0.09], [0.1, 0.09]]) out.push(cylinder({ radiusBottom: 0.045, height: 0.025, segments: 8, tilt: [0, Math.PI / 2] }, [x + dx * Math.cos(r) + dz * Math.sin(r), 0.0, z - dx * Math.sin(r) + dz * Math.cos(r)], 'iron'));
    if (load) out.push(sphere([0.1, 0.07, 0.13], [x, 0.18, z], 'ore', 0), sphere([0.05, 0.04, 0.05], [x + 0.04, 0.22, z - 0.06], 'rock', 0));
    return out;
  },
  oreHeap: (x, z, { size = 1 } = {}) => [sphere([0.24 * size, 0.12 * size, 0.2 * size], [x, 0, z], 'ore', 1), sphere([0.12 * size, 0.08 * size, 0.1 * size], [x + 0.16 * size, 0, z + 0.14 * size], 'ore', 0), sphere([0.08 * size, 0.06 * size, 0.07 * size], [x - 0.15 * size, 0, z + 0.1 * size], 'rock', 0), sphere([0.07, 0.05, 0.06], [x - 0.02, 0.14 * size, z + 0.02], 'ore', 0)],
  // Pickaxes and a shovel leaning on a low rail.
  pickRack: (x, z, { r = 0 } = {}) => {
    const out = [box([0.04, 0.26, 0.04], ground(along(x, z, r, -0.16)), 'wood_dark'), box([0.04, 0.26, 0.04], ground(along(x, z, r, 0.16)), 'wood_dark'), box([0.38, 0.03, 0.04], [x, 0.24, z], 'wood_dark', { rotation: r })];
    for (const d of [-0.09, 0.03]) { const [px, pz] = along(x, z, r, d); out.push(box([0.025, 0.3, 0.025], [px, 0, pz + 0.03], 'wood'), box([0.16, 0.03, 0.03], [px, 0.28, pz + 0.03], 'iron', { rotation: r })); }
    const [sx, sz] = along(x, z, r, 0.12); out.push(box([0.025, 0.3, 0.025], [sx, 0.05, sz + 0.03], 'wood'), box([0.07, 0.09, 0.02], [sx, 0, sz + 0.03], 'iron', { rotation: r }));
    return out;
  },
  pitProps: (x, z, { count = 5, r = 0 } = {}) => PROPS.logs(x, z, { count, length: 0.5, r }),
});

// Builder's yard revision 3: a carpenter's bench (ponk) with tools on it and a tool board, and a fence gateway.
Object.assign(PROPS, {
  carpenterBench: (x, z, { r = 0 } = {}) => {
    const at = (dx, dz) => [x + dx * Math.cos(r) + dz * Math.sin(r), z - dx * Math.sin(r) + dz * Math.cos(r)];
    const out = [box([0.62, 0.06, 0.24], [x, 0.26, z], 'wood', { rotation: r })];
    for (const [dx, dz] of [[-0.26, -0.08], [0.26, -0.08], [-0.26, 0.08], [0.26, 0.08]]) { const [px, pz] = at(dx, dz); out.push(box([0.05, 0.26, 0.05], [px, 0, pz], 'wood_dark')); }
    const [sx, sz] = at(0, 0); out.push(box([0.56, 0.03, 0.2], [sx, 0.08, sz], 'wood_dark', { rotation: r }));
    // Vise jaw, a saw, a mallet and a plane on top; a plank being worked.
    const [vx, vz] = at(-0.29, 0.1); out.push(box([0.06, 0.1, 0.06], [vx, 0.22, vz], 'wood_dark', { rotation: r }));
    const [px, pz] = at(-0.05, -0.03); out.push(box([0.4, 0.025, 0.1], [px, 0.32, pz], 'stone_light', { rotation: r + 0.08 }));
    const [wx, wz] = at(0.2, 0.05); out.push(box([0.2, 0.012, 0.06], [wx, 0.32, wz], 'steel', { rotation: r + 0.4 }), box([0.06, 0.03, 0.03], [wx - 0.09, 0.32, wz], 'wood_dark', { rotation: r + 0.4 }));
    const [mx, mz] = at(0.12, -0.07); out.push(box([0.07, 0.05, 0.05], [mx, 0.32, mz], 'wood_dark', { rotation: r }), box([0.02, 0.02, 0.12], [mx, 0.335, mz + 0.06], 'wood', { rotation: r }));
    const [lx, lz] = at(-0.2, -0.08); out.push(box([0.11, 0.04, 0.04], [lx, 0.32, lz], 'wood', { rotation: r }), box([0.03, 0.03, 0.03], [lx, 0.36, lz], 'wood_dark'));
    return out;
  },
  // Tool board on a wall facing +z (r = 0): saw, axe, hammer and a coil of rope hanging on pegs.
  toolBoard: (x, z, { r = 0, y = 0.36 } = {}) => {
    const out = [box([0.5, 0.26, 0.02], [x, y, z], 'wood_dark', { rotation: r })];
    const at = d => [x + Math.cos(r) * d, z - Math.sin(r) * d + 0.02 * Math.cos(r)];
    const [a, b] = at(-0.15); out.push(box([0.16, 0.08, 0.012], [a, y + 0.1, b], 'steel', { rotation: r }));
    const [c, d] = at(0.0); out.push(box([0.025, 0.2, 0.02], [c, y + 0.03, d], 'wood'), box([0.07, 0.05, 0.02], [c, y + 0.19, d], 'iron', { rotation: r }));
    const [e, f] = at(0.13); out.push(box([0.02, 0.15, 0.02], [e, y + 0.05, f], 'wood'), box([0.07, 0.035, 0.03], [e, y + 0.18, f], 'iron', { rotation: r }));
    const [g, k] = at(0.21); out.push(cylinder({ radiusBottom: 0.04, height: 0.02, segments: 8, tilt: [Math.PI / 2, 0] }, [g, y + 0.06, k], 'cloth_linen'));
    return out;
  },
  // Two taller gate posts with a cross beam: the yard entrance between two fence runs.
  gateway: (x, z, { r = 0, width = 0.5 } = {}) => {
    const out = [];
    for (const d of [-width / 2, width / 2]) out.push(box([0.06, 0.48, 0.06], [x + Math.cos(r) * d, 0, z - Math.sin(r) * d], 'wood_dark'));
    out.push(box([width + 0.14, 0.05, 0.06], [x, 0.44, z], 'wood_dark', { rotation: r }));
    return out;
  },
});

// Bakery revision 2: loaves, a bread stall, a hanging pretzel sign, a baker's peel and bread baskets.
Object.assign(PROPS, {
  loaf: (x, z, { y = 0, r = 0 } = {}) => [sphere([0.06, 0.035, 0.04], [x, y, z], 'cloth_ochre', 1, { rotation: r }), box([0.05, 0.006, 0.008], [x, y + 0.062, z], 'cloth_brown', { rotation: r + 0.6 })],
  breadStall: (x, z, { r = 0 } = {}) => {
    const at = (dx, dz) => [x + dx * Math.cos(r) + dz * Math.sin(r), z - dx * Math.sin(r) + dz * Math.cos(r)];
    const [fx, fz] = at(0, 0.12);
    const out = [box([0.56, 0.05, 0.26], [x, 0.24, z], 'wood', { rotation: r }), box([0.56, 0.2, 0.02], [fx, 0.04, fz], 'wood_dark', { rotation: r })];
    for (const [dx, dz] of [[-0.25, -0.1], [0.25, -0.1]]) { const [px, pz] = at(dx, dz); out.push(box([0.04, 0.62, 0.04], [px, 0, pz], 'wood_dark')); }
    for (const [dx, dz] of [[-0.25, 0.1], [0.25, 0.1]]) { const [px, pz] = at(dx, dz); out.push(box([0.04, 0.5, 0.04], [px, 0, pz], 'wood_dark')); }
    // Striped cloth awning sloping toward the customer side (+z when r = 0).
    const [ax, az] = at(0, 0.02); out.push(box([0.64, 0.025, 0.34], [ax, 0.58, az], 'cloth_red', { rotation: r, tilt: [0.25, 0] }));
    for (const d of [-0.2, 0, 0.2]) { const [sx, sz] = at(d, 0.02); out.push(box([0.07, 0.03, 0.34], [sx, 0.585, sz], 'cloth_linen', { rotation: r, tilt: [0.25, 0] })); }
    for (const [dx, dz, rr] of [[-0.18, -0.04, 0.3], [-0.05, 0.05, -0.2], [0.08, -0.05, 0.5], [0.2, 0.05, 0], [-0.12, 0.08, 1.2]]) { const [lx, lz] = at(dx, dz); out.push(...PROPS.loaf(lx, lz, { y: 0.29, r: rr })); }
    return out;
  },
  breadBasket: (x, z, { y = 0 } = {}) => [cylinder({ radiusBottom: 0.08, radiusTop: 0.1, height: 0.08, segments: 10 }, [x, y, z], 'wood'), ...PROPS.loaf(x - 0.03, z, { y: y + 0.06, r: 0.4 }), ...PROPS.loaf(x + 0.03, z + 0.03, { y: y + 0.07, r: -0.6 })],
  // Wrought-iron bracket from a wall facing +z with a hanging pretzel sign (r = π/2 for a wall facing +x).
  bakerSign: (x, z, { y = 0.75, r = 0 } = {}) => {
    const ox = Math.sin(r), oz = Math.cos(r);
    return [box([0.03, 0.03, 0.26], [x + ox * 0.13, y, z + oz * 0.13], 'iron', { rotation: r }), box([0.012, 0.08, 0.012], [x + ox * 0.22, y - 0.08, z + oz * 0.22], 'iron'),
      cylinder({ radiusBottom: 0.1, height: 0.03, segments: 12, tilt: [Math.PI / 2 * oz, Math.PI / 2 * ox] }, [x + ox * 0.22, y - 0.24, z + oz * 0.22], 'cloth_ochre'),
      cylinder({ radiusBottom: 0.04, height: 0.035, segments: 8, tilt: [Math.PI / 2 * oz, Math.PI / 2 * ox] }, [x + ox * 0.22, y - 0.2, z + oz * 0.22], 'opening')];
  },
  // Baker's peel leaning against a wall or the oven.
  peel: (x, z, { r = 0 } = {}) => [box([0.03, 0.5, 0.025], [x, 0.12, z], 'wood', { rotation: r, tilt: [0.25, 0] }), box([0.16, 0.14, 0.015], [x, 0, z - 0.03], 'wood', { rotation: r, tilt: [0.25, 0] })],
});

// Farmstead revision 2: haycocks, a plough, a farm-tool rack (pitchfork, scythe, rake, flail) and a hen house.
Object.assign(PROPS, {
  haycock: (x, z, { size = 1 } = {}) => [cylinder({ radiusBottom: 0.2 * size, radiusTop: 0.16 * size, height: 0.2 * size, segments: 10 }, [x, 0, z], 'thatch'), cylinder({ radiusBottom: 0.16 * size, radiusTop: 0.02, height: 0.22 * size, segments: 10 }, [x, 0.2 * size, z], 'thatch'), box([0.02, 0.1, 0.02], [x, 0.4 * size, z], 'wood_dark')],
  plough: (x, z, { r = 0 } = {}) => {
    const at = d => [x + Math.cos(r) * d, z - Math.sin(r) * d];
    const [bx, bz] = at(0), [hx, hz] = at(-0.24), [sx, sz] = at(0.18);
    return [box([0.5, 0.04, 0.05], [bx, 0.1, bz], 'wood', { rotation: r }), box([0.04, 0.24, 0.04], [hx, 0.08, hz], 'wood_dark', { rotation: r, tilt: [0, 0.4] }),
      box([0.14, 0.04, 0.12], [sx, 0, sz], 'iron', { rotation: r + 0.4 }), box([0.03, 0.12, 0.03], [sx - Math.cos(r) * 0.04, 0, sz + Math.sin(r) * 0.04], 'wood_dark'),
      cylinder({ radiusBottom: 0.07, height: 0.02, segments: 10, tilt: [Math.PI / 2 * Math.cos(r), Math.PI / 2 * Math.sin(r)] }, [...at(0.3)].length === 2 ? [at(0.3)[0], 0.0, at(0.3)[1]] : [x, 0, z], 'wood_dark')];
  },
  farmTools: (x, z, { r = 0 } = {}) => {
    const p = d => { const [px, pz] = along(x, z, r, d); return [px, pz + 0.03 * Math.cos(r)]; };
    const out = [box([0.04, 0.42, 0.04], ground(along(x, z, r, -0.2)), 'wood_dark'), box([0.04, 0.42, 0.04], ground(along(x, z, r, 0.2)), 'wood_dark'), box([0.46, 0.03, 0.04], [x, 0.38, z], 'wood_dark', { rotation: r })];
    { const [a, b] = p(-0.12); out.push(box([0.02, 0.44, 0.02], [a, 0.02, b], 'wood'), box([0.08, 0.06, 0.012], [a, 0.0, b], 'iron', { rotation: r })); }
    { const [a, b] = p(-0.02); out.push(box([0.02, 0.46, 0.02], [a, 0.04, b], 'wood'), box([0.2, 0.025, 0.02], [a + 0.06 * Math.cos(r), 0.46, b], 'steel', { rotation: r + 0.3 })); }
    { const [a, b] = p(0.08); out.push(box([0.02, 0.44, 0.02], [a, 0.02, b], 'wood'), box([0.12, 0.02, 0.02], [a, 0.02, b], 'wood_dark', { rotation: r })); }
    { const [a, b] = p(0.16); out.push(box([0.02, 0.4, 0.02], [a, 0.02, b], 'wood'), box([0.018, 0.14, 0.018], [a, 0.36, b], 'wood_dark', { tilt: [0, 0.6] })); }
    return out;
  },
  henHouse: (x, z, { r = 0 } = {}) => {
    const out = [];
    for (const [dx, dz] of [[-0.14, -0.1], [0.14, -0.1], [-0.14, 0.1], [0.14, 0.1]]) out.push(box([0.035, 0.12, 0.035], [x + dx, 0, z + dz], 'wood_dark'));
    out.push(box([0.34, 0.2, 0.26], [x, 0.12, z], 'wood', { rotation: r }), prism([0.3, 0.12, 0.38], [x, 0.32, z], 'roof_shingle', { rotation: r + Math.PI / 2 }), box([0.06, 0.08, 0.02], [x + 0.05, 0.16, z + 0.135], 'opening'), box([0.05, 0.02, 0.22], [x + 0.05, 0.0, z + 0.22], 'wood', { tilt: [-0.5, 0] }));
    for (const [dx, dz, m] of [[0.32, 0.25, 'cloth_linen'], [0.45, 0.12, 'cloth_brown'], [0.25, 0.42, 'cloth_linen']]) out.push(sphere([0.06, 0.05, 0.045], [x + dx, 0, z + dz], m, 0), sphere([0.03, 0.03, 0.03], [x + dx + 0.05, 0.06, z + dz], m, 0), box([0.015, 0.025, 0.015], [x + dx + 0.06, 0.1, z + dz], 'cloth_red'));
    return out;
  },
});
