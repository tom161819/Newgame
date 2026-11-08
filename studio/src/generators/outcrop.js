// Rocks of the map (plan g-loziska-skaly, owner 8 Nov 2026): stone deposits, iron deposits and rock obstacles in several
// kinds and footprints, with mining stages and winter snow. Built from many faceted boulders (low-poly like the game's
// rocks, but more pieces and more detail: strata, cracks, veins of ore, moss, lichen, pebbles at the foot). The foot
// fades into a loose apron of gravel and soil, so no square shows under the rock on the continuous ground.
import { box, sphere, lean, clamp, seeded, lerp } from './shapes.js';

export const params = [
  { key: 'kind', values: ['stone', 'iron', 'obstacle'], description: 'Stone deposit, iron deposit, or a rock obstacle (not mined).' },
  { key: 'rock', values: ['granite', 'limestone', 'slate', 'mossy'], description: 'Rock of a stone deposit (and the body of an obstacle).' },
  { key: 'ore', values: ['veins', 'red', 'dark'], description: 'Iron deposit: rust veins in grey rock, a red-brown outcrop, or dark ore with glints.' },
  { key: 'shape', values: ['mound', 'boulder', 'boulders', 'outcrop', 'ridge', 'bush'], description: 'Overall shape (obstacles use boulder … bush).' },
  { key: 'stage', description: 'Mining stage 0 full, 1 started, 2 nearly mined, 3 mined out (gravel).' },
  { key: 'season', values: ['summer', 'winter'], description: 'Winter puts snow on the upper faces.' },
  { key: 'height', unit: 'units', description: 'Height of the rock (about 0.4–1.6).' },
  { key: 'seed', description: 'Deterministic variation.' },
];

const ROCK = {
  granite: { body: ['granite', 'granite_dark', 'granite'], cap: 'granite_light', strata: false },
  limestone: { body: ['limestone', 'limestone', 'limestone_dark'], cap: 'limestone_light', strata: true },
  slate: { body: ['slate', 'slate_dark', 'slate'], cap: 'slate_light', strata: true, flat: true },
  mossy: { body: ['granite_dark', 'granite', 'stone_dark'], cap: 'moss', strata: false, moss: 0.7 },
};
const ORE = {
  veins: { body: ['granite', 'granite_dark'], vein: 'ore_rust', glint: null, patches: 9 },
  red: { body: ['ore_red', 'ore', 'ore_red_dark'], vein: 'ore_rust', glint: null, patches: 5 },
  dark: { body: ['ore_dark', 'slate_dark', 'ore_dark'], vein: 'ore', glint: 'steel', patches: 7 },
};

// One faceted boulder: a low-poly ellipsoid, rotated, sitting on the ground (y = bottom).
const stone = (r, [x, y, z], [rx, ry, rz], material, detail = 0) => sphere([rx, ry, rz], [x, y, z], material, detail, { rotation: r() * Math.PI * 2 });

function mass(parts, r, { cx = 0, cz = 0, sx, sz, height, count, palette, flat = false, keep = () => true }) {
  // Big core pieces in the middle, smaller ones round them, a few stacked on top; returns the pieces' tops.
  const tops = [];
  for (let i = 0; i < count; i++) {
    const t = i / count, a = r() * Math.PI * 2, d = Math.sqrt(r()) * (0.25 + t * 0.75);
    const x = cx + Math.cos(a) * d * sx, z = cz + Math.sin(a) * d * sz;
    if (!keep(x, z)) continue;
    const k = lerp(1, 0.42, t) * (0.8 + r() * 0.4), rx = (0.22 + r() * 0.12) * k * Math.max(sx, sz) * 1.5, rz = rx * (0.75 + r() * 0.45);
    const ry = Math.min(rx * 0.95, (flat ? 0.5 : 0.75 + r() * 0.4) * height * k * (1 - d * 0.5) * 0.36);
    parts.push(stone(r, [x, 0, z], [rx, Math.max(0.05, ry), rz], palette[i % palette.length], i < 3 ? 1 : 0));
    tops.push({ x, z, y: ry * 2, rx, rz });
  }
  // Stacked pieces on the highest ones (a broken, layered top).
  for (const top of tops.slice().sort((a, b) => b.y - a.y).slice(0, Math.ceil(count / 7))) {
    const k = 0.5 + r() * 0.25;
    parts.push(stone(r, [top.x + (r() - 0.5) * top.rx * 0.6, top.y * 0.78, top.z + (r() - 0.5) * top.rz * 0.6], [top.rx * k, top.y * 0.22 * (flat ? 0.6 : 1), top.rz * k], palette[(tops.indexOf(top) + 1) % palette.length], 0));
    top.y = top.y * 0.78 + top.y * 0.44 * (flat ? 0.6 : 1);
  }
  return tops;
}

// Strata: thin flat slabs following the rock, a little out of line (limestone, slate).
function strata(parts, r, tops, material) {
  for (const t of tops) if (t.y > 0.12) for (let y = 0.08; y < t.y * 0.8; y += 0.07 + r() * 0.05) parts.push(stone(r, [t.x + (r() - 0.5) * 0.04, y, t.z + (r() - 0.5) * 0.04], [t.rx * (1.02 - y / t.y * 0.4), 0.012, t.rz * (1.02 - y / t.y * 0.4)], material));
}

// Patches on the surface: half-buried small pieces (veins of ore, moss, lichen, snow) on the upper sides of the tops.
function patches(parts, r, tops, material, count, { upper = 0.45, size = 0.35, flat = 0.4 } = {}) {
  for (let i = 0; i < count; i++) {
    const t = tops[Math.floor(r() * tops.length)]; if (!t) return;
    const a = r() * Math.PI * 2, h = upper + r() * (1 - upper), rad = Math.sqrt(Math.max(0, 1 - h * h));
    const x = t.x + Math.cos(a) * t.rx * rad * 0.85, z = t.z + Math.sin(a) * t.rz * rad * 0.85, y = t.y * h * 0.92;
    const s = size * Math.min(t.rx, t.rz) * (0.5 + r() * 0.6);
    parts.push(stone(r, [x, Math.max(0, y - s * flat), z], [s, s * flat, s * (0.5 + r() * 0.5)], material));
  }
}

// Veins: thin streaks lying over the rock, from low to high on a face.
function veins(parts, r, tops, material, count) {
  for (let i = 0; i < count; i++) {
    const t = tops[Math.floor(r() * tops.length)]; if (!t || t.y < 0.1) continue;
    const a = r() * Math.PI * 2, len = t.y * (0.5 + r() * 0.5);
    parts.push(lean({ length: len, radiusBottom: 0.018 + r() * 0.012, radiusTop: 0.008, segments: 4 }, a + Math.PI, 0.25 + r() * 0.35, [t.x + Math.cos(a) * t.rx * 0.75, t.y * 0.15, t.z + Math.sin(a) * t.rz * 0.75], material).part);
  }
}

// Apron: loose gravel, pebbles and a soil patch round the foot, so the rock sits in the ground.
function apron(parts, r, sx, sz, count, materials = ['fieldstone', 'fieldstone_dark', 'fieldstone_light', 'rock']) {
  // Two soft-edged layers (a wide pale one and a smaller darker one) instead of one hard disc.
  parts.push(sphere([sx * 0.98, 0.006, sz * 0.92], [0, 0, 0], 'gravel', 1, { rotation: r() * 3 }), sphere([sx * 0.78, 0.01, sz * 0.74], [0, 0, 0], 'soil', 1, { rotation: r() * 3 }));
  for (let i = 0; i < count; i++) {
    const a = r() * Math.PI * 2, d = 0.7 + r() * 0.35, s = 0.025 + r() * 0.05, x = clamp(Math.cos(a) * sx * d, -sx * 1.18 + s, sx * 1.18 - s), z = clamp(Math.sin(a) * sz * d, -sz * 1.18 + s, sz * 1.18 - s);
    parts.push(stone(r, [x, 0, z], [s, s * 0.6, s * 0.8], materials[i % materials.length]));
  }
}

// Mining: the front (+x +z, towards the viewer) is cut back; cut faces are light, blocks and chips lie in front.
function mined(parts, r, stage, sx, sz, material) {
  if (stage < 1) return;
  const n = stage === 3 ? 7 : 3 + stage * 2;
  for (let i = 0; i < n; i++) {
    const x = (r() * 0.9 + 0.1) * sx * (stage === 3 ? (r() - 0.5) * 1.6 : 0.9), z = (r() * 0.9 + 0.1) * sz * (stage === 3 ? (r() - 0.5) * 1.6 : 0.9), s = 0.05 + r() * 0.06;
    parts.push(box([s * 1.4, s * 0.8, s], [x, 0, z], i % 3 ? material : 'stone_light', { rotation: r() * 3 }));
  }
  if (stage === 1 || stage === 2) parts.push(box([0.05, 0.4, 0.05], [sx * 0.75, 0, sz * 0.2], 'wood', { rotation: 0.3 }), box([0.03, 0.03, 0.22], [sx * 0.75, 0.38, sz * 0.2], 'iron', { rotation: 0.3 })); // a pick left leaning
}

export function build(spec, { footprint }) {
  const r = seeded(spec.seed ?? 1), parts = [], kind = spec.kind ?? 'stone', stage = clamp(spec.stage ?? 0, 0, 3);
  const w = footprint.width, d = footprint.height, sx = w / 2 * 0.82, sz = d / 2 * 0.82;
  const size = Math.sqrt(w * d), height = (spec.height ?? (0.55 + size * 0.28) * (kind === 'obstacle' ? 1.8 : 1)) * (stage === 2 ? 0.45 : stage === 1 ? 0.8 : 1);
  const rockSize = 1;
  const look = kind === 'iron' ? ORE[spec.ore ?? 'veins'] : ROCK[spec.rock ?? 'granite'], palette = look.body;
  const shape = spec.shape ?? (kind === 'obstacle' ? 'outcrop' : 'mound');
  // Pieces in front are mined away first.
  const keep = stage === 0 ? () => true : (x, z) => (x / sx + z / sz) < (stage === 1 ? 0.9 : stage === 2 ? 0.1 : -9);
  apron(parts, r, sx, sz, Math.round(8 + size * 8 + stage * 6), kind === 'iron' ? ['ore', 'fieldstone_dark', 'ore_red', 'rock'] : undefined);
  let tops = [];
  if (stage < 3) {
    if (shape === 'boulder') { tops = mass(parts, r, { sx: sx * 1.5, sz: sz * 1.4, height: height * 1.4, count: 4, palette, keep: (x, z) => Math.abs(x) < sx * 0.6 && Math.abs(z) < sz * 0.6 }); }
    else if (shape === 'boulders') { for (let i = 0; i < 2 + Math.round(size); i++) { const a = r() * 6.28, k = 0.45; tops.push(...mass(parts, r, { cx: Math.cos(a) * sx * k, cz: Math.sin(a) * sz * k, sx: sx * 0.4, sz: sz * 0.4, height: height * (0.6 + r() * 0.5), count: 3, palette })); } }
    else if (shape === 'ridge') { const n = Math.max(3, Math.round(Math.max(w, d) * 1.6)); for (let i = 0; i < n; i++) { const t = i / (n - 1) - 0.5, along = w >= d; tops.push(...mass(parts, r, { cx: along ? t * sx * 1.7 : 0, cz: along ? 0 : t * sz * 1.7, sx: along ? sx / n * 1.6 : sx * 0.7, sz: along ? sz * 0.7 : sz / n * 1.6, height: height * 1.7 * (0.8 + Math.sin((t + 0.5) * Math.PI) * 0.6 + r() * 0.3), count: 6, palette, flat: look.flat })); } }
    else tops = mass(parts, r, { sx, sz, height: shape === 'outcrop' ? height * 1.6 : height, count: Math.round(10 + size * 9), palette, flat: look.flat, keep });
    if (look.strata) strata(parts, r, tops, palette[1]);
    if (kind === 'iron') { veins(parts, r, tops, look.vein, look.patches + Math.round(size * 3)); patches(parts, r, tops, look.vein, look.patches, { upper: 0.1, size: 0.3 }); if (look.glint) patches(parts, r, tops, look.glint, 6, { upper: 0.3, size: 0.12, flat: 0.5 }); }
    patches(parts, r, tops, 'lichen', Math.round(3 + size * 2), { upper: 0.4, size: 0.2, flat: 0.25 });
    if (look.moss || spec.rock === 'mossy') patches(parts, r, tops, 'moss', Math.round(6 + size * 6), { upper: 0.2, size: 0.45, flat: 0.3 });
    if (shape === 'bush') for (let i = 0; i < 4; i++) { const a = r() * 6.28; parts.push(sphere([0.14 + r() * 0.08, 0.12 + r() * 0.06, 0.13], [Math.cos(a) * sx * 0.8, 0, Math.sin(a) * sz * 0.8], ['foliage_dark', 'foliage', 'olive_scrub'][i % 3], 1)); }
    if (spec.season === 'winter') { patches(parts, r, tops, 'snow', Math.round(10 + size * 10), { upper: 0.55, size: 0.7, flat: 0.2 }); }
  }
  mined(parts, r, stage, sx, sz, palette[0]);
  const top = p => p.shape === 'sphere' ? p.at[1] + p.radii[1] * 2 : p.at[1] + (p.size?.[1] ?? 0.4);
  return { primitives: parts, lights: [], height: Math.max(0.3, ...parts.map(top)) + 0.02 };
}

export default { id: 'outcrop', version: 1, label: 'Rocks and deposits', params, build };
