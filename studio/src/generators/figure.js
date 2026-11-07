// Figure recipe: villagers by profession, men and women. Low-poly body
// (shoes, hose or skirt, tunic, belt, arms, head, hair) plus headgear, apron,
// a tool or load and colours, all from style-guide materials. The figure faces
// the camera: "side" runs along the shoulders (screen right is +side) and
// "front" towards the viewer.
import { box, cylinder, sphere, clamp, lean, horse, rotateParts, turnParts, axisMatrix, matMul, orientation } from './shapes.js';

export const params = [
  { key: 'sex', values: ['male', 'female'], description: 'Tunic and hose, or a long dress.' },
  { key: 'height', unit: 'units', description: 'Overall height; defaults to 1.2 (men) or 1.12 (women).' },
  { key: 'build', description: 'Body width factor 0.85–1.2.' },
  { key: 'skin', description: 'skin or skin_tan.' },
  { key: 'hair', description: 'hair_dark, hair_brown, hair_auburn, hair_blond or hair_grey.' },
  { key: 'hairStyle', values: ['short', 'long', 'braid', 'bald'], description: 'Visible hair under the headgear.' },
  { key: 'beard', description: 'Men only: full beard.' },
  { key: 'garment', description: 'Material of the tunic or dress.' },
  { key: 'sleeves', description: 'Material of the sleeves (defaults to the garment).' },
  { key: 'legs', description: 'Material of the hose (men).' },
  { key: 'headgear', values: ['none', 'hood', 'cap', 'brimmed', 'straw', 'coif', 'kerchief', 'helmet', 'baker'], description: 'Hat or head covering.' },
  { key: 'headgearMaterial', description: 'Material of the headgear.' },
  { key: 'apron', description: 'Material of an apron, or omitted.' },
  { key: 'tool', values: ['none', 'axe', 'pickaxe', 'hammer', 'bow', 'spear', 'pitchfork', 'peel', 'sack', 'basket', 'carrier', 'sword', 'tongs', 'mallet', 'stave', 'bucket', 'rod', 'torch', 'loot', 'firebucket'], description: 'What the figure holds or carries (rod = fishing rod and a creel; torch = a lit pitch torch with its light; loot = a bulging sack over the shoulder; firebucket = a leather fire bucket held in front).' },
  { key: 'shield', description: 'Shield on the left arm.' },
  { key: 'shieldShape', values: ['round', 'kite'], description: 'Round buckler-sized shield or tall kite shield.' },
  { key: 'shieldMaterial', description: 'Shield face material (banner, banner_blue, wood …).' },
  { key: 'armor', values: ['none', 'gambeson', 'mail', 'plate'], description: 'Body armour: quilted coat, mail sleeves and hose, or steel plates with pauldrons.' },
  { key: 'tabard', description: 'Surcoat colour worn over the armour.' },
  { key: 'mount', description: '{ coat, barding, saddle }: rides a horse (knights).' },
  { key: 'facing', description: 'Turn in eighths of a full circle (0–7); 0 faces the viewer. For direction sheets.' },
  { key: 'action', values: ['run', 'tag', 'hoop', 'kick', 'swing', 'throw', 'roll-snow', 'hay-jump', 'cast', 'fish-wait', 'catch'], description: 'Still pose for an animation key frame (children\'s games, fishing): arms and legs placed by the action, with its props (ball, hoop, swing, snowball, hay, line and fish).' },
  { key: 'stride', description: 'Walk pose −1…1 (animation frames): +1 puts the right foot forward and swings the free arms the other way; 0 or omitted is the standing figure.' },
];

const S = Math.SQRT1_2, TURN = Math.PI / 4;
// Model point from (side, height, front).
const at = (side, y, front) => [(side + front) * S, y, (front - side) * S];
const turned = (size, side, y, front, material) => box(size, at(side, y, front), material, { rotation: TURN });
// Walk animation: a turned box whose base sits `front` units ahead and whose top leans back by `lean` radians
// (positive = top towards the viewer's front), i.e. a leg or arm swinging about its hip or shoulder.
const SIDE_AXIS = [S, 0, -S];
const swung = (size, side, y, front, theta, material) => box(size, at(side, y, front), material, orientation(matMul(axisMatrix(SIDE_AXIS, theta), [[Math.cos(TURN), 0, Math.sin(TURN)], [0, 1, 0], [-Math.sin(TURN), 0, Math.cos(TURN)]])));
// Which hands are busy: the right one holds a tool, the left one a bow, basket, bucket or shield.
const RIGHT_TOOLS = new Set(['axe', 'pickaxe', 'hammer', 'sword', 'greatsword', 'lance', 'spear', 'pitchfork', 'peel', 'tongs', 'mallet', 'stave', 'rod', 'torch']);
const LEFT_TOOLS = new Set(['bow', 'basket', 'bucket', 'rod']);

// Action poses (plans g-deti-naves-grafika, g-rybarstvi): target points (side, height, front) in units of a 1.2
// figure for each hand and foot; `lift` raises the whole figure (jumps), `crouch` lowers the hips.
const ACTIONS = {
  run: { hands: { 1: [0.2, 0.5, -0.16], '-1': [-0.17, 0.62, 0.17] }, feet: { 1: [0.06, 0.12, -0.2], '-1': [-0.06, 0, 0.2] }, lift: 0.03 },
  tag: { hands: { 1: [0.16, 0.78, 0.3], '-1': [-0.2, 0.55, -0.1] }, feet: { 1: [0.06, 0, 0.22], '-1': [-0.06, 0.1, -0.18] }, lift: 0.02 },
  hoop: { hands: { 1: [0.2, 0.42, 0.25], '-1': [-0.18, 0.5, -0.12] }, feet: { 1: [0.06, 0, 0.16], '-1': [-0.06, 0.06, -0.14] } },
  kick: { hands: { 1: [0.26, 0.6, -0.08], '-1': [-0.26, 0.62, 0.1] }, feet: { 1: [0.07, 0.2, 0.3], '-1': [-0.06, 0, -0.04] } },
  swing: { hands: { 1: [0.16, 0.95, 0.02], '-1': [-0.16, 0.95, 0.02] }, feet: { 1: [0.06, 0.32, 0.36], '-1': [-0.06, 0.32, 0.36] }, sit: true, lift: 0.18 },
  throw: { hands: { 1: [0.22, 1.08, -0.18], '-1': [-0.15, 0.78, 0.26] }, feet: { 1: [0.06, 0, -0.16], '-1': [-0.06, 0, 0.18] } },
  'roll-snow': { hands: { 1: [0.1, 0.32, 0.3], '-1': [-0.1, 0.32, 0.3] }, feet: { 1: [0.06, 0, -0.18], '-1': [-0.06, 0, -0.02] }, bend: 0.12 },
  'hay-jump': { hands: { 1: [0.26, 1.12, 0.05], '-1': [-0.26, 1.12, 0.05] }, feet: { 1: [0.08, 0.1, -0.12], '-1': [-0.08, 0.14, -0.06] }, lift: 0.28 },
  cast: { hands: { 1: [0.18, 1.0, -0.12], '-1': [-0.04, 0.8, 0.06] }, feet: { 1: [0.06, 0, -0.14], '-1': [-0.06, 0, 0.16] } },
  'fish-wait': { hands: { 1: [0.14, 0.62, 0.3], '-1': [-0.02, 0.58, 0.28] }, feet: { 1: [0.06, 0, 0.04], '-1': [-0.06, 0, -0.06] } },
  catch: { hands: { 1: [0.14, 0.95, 0.12], '-1': [-0.04, 0.9, 0.2] }, feet: { 1: [0.06, 0, -0.12], '-1': [-0.06, 0, 0.12] }, lift: 0 },
};
// A limb as a cylinder between two (side, height, front) points.
function limbTo(a, b, r, material) {
  let A = at(...a), B = at(...b);
  if (A[1] > B[1]) [A, B] = [B, A];
  const dx = B[0] - A[0], dy = B[1] - A[1], dz = B[2] - A[2], len = Math.max(0.001, Math.hypot(dx, dy, dz));
  return lean({ length: len, radiusBottom: r, radiusTop: r * 1.05, segments: 6 }, Math.atan2(dz, dx), Math.acos(clamp(dy / len, -1, 1)), A, material).part;
}

export function build(spec, { style }) {
  const female = spec.sex === 'female';
  const H = clamp(spec.height ?? (female ? 1.12 : 1.2), 0.9, 1.35), k = H / 1.2, w = clamp(spec.build ?? 1, 0.85, 1.2);
  const y = n => n * k, skin = spec.skin ?? 'skin', hair = spec.hair ?? 'hair_brown', garment = spec.garment ?? 'cloth_wool';
  const armour = { mail: 'steel_dark', plate: 'steel', gambeson: 'cloth_ochre' }[spec.armor];
  const sleeves = spec.sleeves ?? armour ?? garment, legs = spec.legs ?? (spec.armor === 'mail' || spec.armor === 'plate' ? armour : 'cloth_brown'), hatMaterial = spec.headgearMaterial ?? 'cloth_brown';
  const parts = [];
  // Feet, legs or skirt.
  // Walking (#V03 animation): feet step along the front axis, legs swing about the hip; 0 is the standing pose.
  const stride = spec.mount ? 0 : clamp(spec.stride ?? 0, -1, 1), step = side => stride * side * (female ? 0.06 : 0.1);
  const act = ACTIONS[spec.action] ?? null, foot = side => act?.feet?.[side], handAt = side => act?.hands?.[side];
  for (const side of [-1, 1]) { const f = foot(side); parts.push(f ? turned([0.08 * w, y(0.05), 0.13], f[0] * w, y(f[1]), f[2], 'leather') : turned([0.08 * w, y(0.05), 0.13], side * 0.055 * w, 0, 0.02 + step(side), 'leather')); }
  if (act && female) { // the skirt flares over legs that show below it when they reach out
    for (const side of [-1, 1]) { const f = foot(side); if (f[2] > 0.15 || f[1] > 0.08) parts.push(limbTo([side * 0.055 * w, y(0.3), 0.05], [f[0] * w, y(f[1]) + 0.04, f[2]], 0.035, 'cloth_brown')); }
  }
  if (act && !female) {
    for (const side of [-1, 1]) { const f = foot(side); parts.push(limbTo([side * 0.055 * w, y(0.4 - (act.bend ?? 0)), act.sit ? 0.05 : 0], [f[0] * w, y(f[1]) + 0.04, f[2]], 0.04 * w, legs)); }
    parts.push(cylinder({ radiusBottom: 0.16 * w, radiusTop: 0.125 * w, height: y(0.3), segments: 8 }, [0, y(0.34), 0], garment));
  } else if (female) parts.push(cylinder({ radiusBottom: 0.2 * w, radiusTop: 0.125 * w, height: y(0.6), segments: 10 }, [0, y(0.03), 0], spec.mount ? legs : garment));
  else {
    for (const side of [-1, 1]) {
      const f = step(side), L = y(0.36);
      parts.push(f ? swung([0.075 * w, Math.hypot(L, f), 0.085], side * 0.055 * w, y(0.04), f, Math.atan2(-f, L), legs) : turned([0.075 * w, L, 0.085], side * 0.055 * w, y(0.04), 0, legs));
    }
    parts.push(cylinder({ radiusBottom: 0.16 * w, radiusTop: 0.125 * w, height: y(0.3), segments: 8 }, [0, y(0.34), 0], garment));
  }
  const lowerEnd = female ? 3 : 4;
  // Torso, belt, apron, arms and hands.
  parts.push(cylinder({ radiusBottom: 0.125 * w, radiusTop: 0.15 * w, height: y(0.24), segments: 8 }, [0, y(0.62), 0], garment));
  parts.push(cylinder({ radiusBottom: 0.133 * w, height: y(0.035), segments: 8 }, [0, y(0.6), 0], 'leather'));
  // A woman's apron hangs in front of the flared skirt, so it starts where the skirt is already wide.
  if (spec.apron) parts.push(turned([0.2 * w, y(female ? 0.27 : 0.36), 0.02], 0, y(female ? 0.35 : 0.3), female ? 0.168 * w : 0.14 * w, spec.apron));
  const shoulder = 0.175 * w, hand = y(0.47);
  const kind = spec.tool ?? 'none', busy = side => side > 0 ? RIGHT_TOOLS.has(kind) : LEFT_TOOLS.has(kind) || !!spec.shield;
  for (const side of [-1, 1]) {
    // A free arm swings against the leg on its side; an arm holding something stays still.
    const g = busy(side) ? 0 : -stride * side * 0.07, A = y(0.33), t = handAt(side);
    if (t) { parts.push(limbTo([side * shoulder, y(0.83), 0], [t[0] * w, y(t[1]), t[2]], 0.036, sleeves), sphere([0.04, 0.035, 0.04], at(t[0] * w, y(t[1]) - 0.035, t[2]), skin, 1)); continue; }
    parts.push(g ? swung([0.07, Math.hypot(A, g), 0.075], side * shoulder, y(0.52), g, Math.atan2(-g, A), sleeves) : turned([0.07, A, 0.075], side * shoulder, y(0.52), 0, sleeves));
    parts.push(sphere([0.04, 0.035, 0.04], at(side * shoulder, hand, 0.01 + g), skin, 1));
  }
  // Neck, head, hair, beard.
  parts.push(cylinder({ radiusBottom: 0.04, height: y(0.04), segments: 8 }, [0, y(0.86), 0], skin));
  const head = y(0.885), headTop = head + 0.19;
  parts.push(sphere([0.085, 0.095, 0.085], [0, head, 0], skin, 1));
  const style_ = spec.hairStyle ?? (female ? 'long' : 'short');
  if (style_ !== 'bald') parts.push(sphere([0.092, 0.075, 0.092], at(0, head + 0.06, -0.018), hair, 1));
  if (style_ === 'long') parts.push(turned([0.15, 0.2, 0.045], 0, head - 0.12, -0.07, hair));
  if (style_ === 'braid') parts.push(turned([0.05, 0.26, 0.05], 0.06, head - 0.2, -0.08, hair));
  if (!female && spec.beard) parts.push(sphere([0.065, 0.055, 0.05], at(0, head - 0.015, 0.055), hair, 1));
  parts.push(...headgear(spec.headgear ?? 'none', hatMaterial, head, headTop));
  if (!act) parts.push(...tool(spec.tool ?? 'none', { shoulder, hand, y, female }));
  else parts.push(...actionProps(spec.action, { y, w, handAt }).map(p => ({ ...p, overhang: true }))); // props may reach past the tile like a horse
  if (act?.lift) for (const p of parts) if (!p.ground) p.at = [p.at[0], p.at[1] + y(act.lift), p.at[2]];
  for (const p of parts) delete p.ground;
  if (spec.shield) {
    const kite = spec.shieldShape === 'kite', face = spec.shieldMaterial ?? 'banner';
    parts.push(turned(kite ? [0.22, 0.4, 0.03] : [0.24, 0.3, 0.035], -shoulder - 0.045, y(kite ? 0.24 : 0.32), 0.04, face));
    parts.push(kite ? turned([0.03, 0.4, 0.035], -shoulder - 0.045, y(0.24), 0.045, 'gold_trim') : sphere([0.035, 0.035, 0.03], at(-shoulder - 0.045, y(0.45), 0.065), 'iron', 0));
  }
  // Armour over the body: pauldrons and plates, and a surcoat in the lord's colour.
  if (spec.armor === 'plate') for (const side of [-1, 1]) parts.push(sphere([0.075, 0.05, 0.075], at(side * shoulder, y(0.82), 0), 'steel', 1));
  if (spec.tabard) { parts.push(turned([0.19 * w, y(0.46), 0.02], 0, y(0.36), 0.15 * w, spec.tabard), turned([0.19 * w, y(0.46), 0.02], 0, y(0.36), -0.15 * w, spec.tabard)); }
  if (spec.mount) {
    // Rider: drop the lower body, sit on the horse's back facing its head, legs down its flanks.
    const coat = spec.mount.coat ?? 'horse_bay', mount = horse([0, 0, 0], { angle: -Math.PI / 4, coat, barding: spec.mount.barding ?? null, saddle: spec.mount.saddle ?? true, scale: 1.1 });
    const rider = parts.slice(lowerEnd), lift = mount.back[1] - y(0.36);
    const seated = rotateParts(rider, Math.PI / 2).map(p => ({ ...p, at: [p.at[0] + mount.back[0], p.at[1] + lift, p.at[2] + mount.back[2]] }));
    const legMaterial = spec.armor === 'plate' ? 'steel' : spec.armor === 'mail' ? 'steel_dark' : legs;
    for (const side of [-1, 1]) {
      // Legs hang from the hip down the horse's flank: base at the foot, leaning in to the hip.
      const out = side > 0 ? Math.PI / 4 : -3 * Math.PI / 4, length = y(0.4), t = 0.3;
      const hip = [mount.back[0] + side * 0.1 * Math.SQRT1_2, mount.back[1] + 0.02, mount.back[2] + side * 0.1 * Math.SQRT1_2];
      const foot = [hip[0] + Math.cos(out) * length * Math.sin(t), hip[1] - length * Math.cos(t), hip[2] + Math.sin(out) * length * Math.sin(t)];
      seated.push(lean({ length, radiusBottom: 0.04, radiusTop: 0.045 }, out + Math.PI, t, foot, legMaterial).part, box([0.08, 0.06, 0.12], [foot[0], foot[1] - 0.03, foot[2]], 'leather', { rotation: Math.PI / 4 }));
    }
    // A horse is longer than a tile: like tree canopies it may overhang by the style allowance.
    parts.length = 0; parts.push(...mount.parts.map(p => ({ ...p, overhang: true })), ...seated.map(p => ({ ...p, overhang: true })));
  }
  if (spec.facing) { const turnedParts = turnParts(parts, spec.facing * Math.PI / 4); parts.length = 0; parts.push(...turnedParts); }
  const top = Math.max(headTop, ...parts.map(p => p.at[1] + (p.size?.[1] ?? p.height ?? (p.radii ? p.radii[1] * 2 : 0))));
  // A held torch lights the ground around its carrier (the flame is drawn by the light, like the torch posts).
  const torchHead = parts.find(p => p.torchHead), lights = torchHead ? [{ type: 'torch', at: [torchHead.at[0], torchHead.at[1] + 0.09, torchHead.at[2]] }] : [];
  return { primitives: parts.map(({ torchHead: _, ...p }) => p), lights, height: top };
}

// Props of the action poses. Parts marked `ground` stay on the ground when the figure is lifted.
function actionProps(action, { y, w, handAt }) {
  const hand = side => { const t = handAt(side); return at(t[0] * w, y(t[1]) - 0.035, t[2]); }, g = p => ({ ...p, ground: true });
  switch (action) {
    case 'hoop': { const h = hand(1); return [g(cylinder({ radiusBottom: 0.15, radiusTop: 0.15, height: 0.02, segments: 14, tilt: [Math.PI / 2, 0] }, at(0.22, 0.15, 0.5), 'wood')), lean({ length: 0.3, radiusBottom: 0.012, segments: 4 }, Math.PI / 4, 0.9, h, 'wood_dark').part]; }
    case 'kick': return [g(sphere([0.07, 0.07, 0.07], at(0.12, 0.23, 0.48), 'leather', 1)), g(sphere([0.072, 0.02, 0.072], at(0.12, 0.27, 0.48), 'cloth_linen', 1))];
    case 'swing': return [box([0.34, 0.03, 0.14], at(0, y(0.37), 0.02), 'wood', { rotation: Math.PI / 4 }), ...[-1, 1].map(s => box([0.012, 0.9, 0.012], at(s * 0.17, y(0.37), 0.02), 'twigs', { rotation: Math.PI / 4 }))];
    case 'throw': { const h = hand(1); return [sphere([0.05, 0.05, 0.05], [h[0], h[1] + 0.02, h[2]], 'snow', 1), g(sphere([0.05, 0.05, 0.05], at(-0.35, 0.6, 0.6), 'snow', 1))]; }
    case 'roll-snow': return [g(sphere([0.16, 0.15, 0.16], at(0, 0, 0.44), 'snow', 1))];
    case 'hay-jump': return [g(sphere([0.38, 0.22, 0.32], at(0, 0, 0.1), 'thatch', 1)), g(sphere([0.25, 0.12, 0.2], at(0.1, 0.25, 0.05), 'thatch', 1))];
    case 'cast': case 'fish-wait': case 'catch': {
      const h = hand(1), rod = action === 'cast' ? [0.6, -0.2] : action === 'fish-wait' ? [Math.PI / 4 + 0.1, 0.7] : [Math.PI / 4, 0.45];
      const r = lean({ length: y(1.0), radiusBottom: 0.016, radiusTop: 0.008, segments: 5 }, action === 'cast' ? Math.PI / 4 + Math.PI : rod[0], Math.abs(rod[1]), [h[0], h[1] - 0.1, h[2]], 'wood');
      const out = [r.part, cylinder({ radiusBottom: 0.06, radiusTop: 0.075, height: 0.13, segments: 8 }, at(-0.22, 0, 0.1), 'twigs')];
      if (action === 'fish-wait') out.push(box([0.006, r.end[1] - 0.02, 0.006], [r.end[0], 0.02, r.end[2]], 'cloth_linen'), g(sphere([0.02, 0.02, 0.02], [r.end[0], 0, r.end[2]], 'cloth_red', 0)));
      if (action === 'catch') out.push(box([0.006, 0.25, 0.006], [r.end[0], r.end[1] - 0.25, r.end[2]], 'cloth_linen'), sphere([0.035, 0.09, 0.025], [r.end[0], r.end[1] - 0.42, r.end[2]], 'fish', 1), box([0.05, 0.03, 0.01], [r.end[0], r.end[1] - 0.47, r.end[2]], 'stone_dark', { rotation: Math.PI / 4 }));
      if (action === 'cast') out.push(box([0.005, 0.005, 0.5], [r.end[0] + 0.15, r.end[1] - 0.05, r.end[2] + 0.15], 'cloth_linen', { rotation: Math.PI / 4 }));
      return out;
    }
    default: return [];
  }
}

function headgear(kind, material, head, top) {
  switch (kind) {
    case 'hood': return [sphere([0.105, 0.105, 0.105], at(0, head - 0.01, -0.012), material, 1), cylinder({ radiusBottom: 0.07, radiusTop: 0, height: 0.11, segments: 6 }, at(0, top - 0.03, -0.06), material), cylinder({ radiusBottom: 0.15, radiusTop: 0.11, height: 0.07, segments: 8 }, [0, head - 0.06, 0], material)];
    case 'cap': return [cylinder({ radiusBottom: 0.096, radiusTop: 0.075, height: 0.07, segments: 10 }, [0, top - 0.05, 0], material)];
    case 'brimmed': return [cylinder({ radiusBottom: 0.16, height: 0.014, segments: 12 }, [0, top - 0.055, 0], material), cylinder({ radiusBottom: 0.088, radiusTop: 0.07, height: 0.09, segments: 10 }, [0, top - 0.055, 0], material)];
    case 'straw': return [cylinder({ radiusBottom: 0.2, radiusTop: 0.17, height: 0.02, segments: 12 }, [0, top - 0.06, 0], 'thatch'), cylinder({ radiusBottom: 0.09, radiusTop: 0.05, height: 0.08, segments: 10 }, [0, top - 0.05, 0], 'thatch')];
    case 'coif': return [sphere([0.1, 0.1, 0.1], at(0, head - 0.005, -0.012), material, 1), turned([0.13, 0.12, 0.03], 0, head - 0.1, -0.08, material)];
    case 'kerchief': return [sphere([0.098, 0.085, 0.098], at(0, head + 0.03, -0.015), material, 1), cylinder({ radiusBottom: 0.04, radiusTop: 0.01, height: 0.08, segments: 6 }, at(0, head - 0.02, -0.1), material)];
    case 'kettle': return [sphere([0.098, 0.07, 0.098], [0, head + 0.07, 0], 'steel', 1), cylinder({ radiusBottom: 0.17, radiusTop: 0.15, height: 0.02, segments: 12 }, [0, head + 0.07, 0], 'steel')];
    case 'greathelm': return [cylinder({ radiusBottom: 0.1, radiusTop: 0.095, height: 0.2, segments: 10 }, [0, head - 0.02, 0], 'steel'), turned([0.1, 0.018, 0.02], 0, head + 0.1, 0.09, 'opening'), turned([0.02, 0.1, 0.02], 0, head + 0.0, 0.098, 'gold_trim')];
    case 'bascinet': return [sphere([0.1, 0.09, 0.1], [0, head + 0.03, 0], 'steel', 1), cylinder({ radiusBottom: 0.05, radiusTop: 0, height: 0.07, segments: 6 }, [0, head + 0.2, -0.01], 'steel'), cylinder({ radiusBottom: 0.13, radiusTop: 0.1, height: 0.06, segments: 10 }, [0, head - 0.05, 0], 'steel_dark')];
    case 'mailcoif': return [sphere([0.1, 0.1, 0.1], at(0, head - 0.005, -0.01), 'steel_dark', 1), cylinder({ radiusBottom: 0.14, radiusTop: 0.1, height: 0.07, segments: 10 }, [0, head - 0.06, 0], 'steel_dark')];
    case 'helmet': return [sphere([0.1, 0.075, 0.1], [0, head + 0.06, 0], 'iron', 1), cylinder({ radiusBottom: 0.104, height: 0.03, segments: 12 }, [0, head + 0.05, 0], 'iron'), turned([0.02, 0.07, 0.02], 0, head + 0.0, 0.088, 'iron')];
    case 'baker': return [cylinder({ radiusBottom: 0.09, radiusTop: 0.11, height: 0.13, segments: 10 }, [0, top - 0.06, 0], 'cloth_linen')];
    default: return [];
  }
}

function tool(kind, { shoulder, hand, y, female }) {
  const r = shoulder + 0.04, l = -shoulder - 0.04;
  switch (kind) {
    case 'axe': return [turned([0.035, 0.62, 0.035], r, hand - 0.2, 0.05, 'wood_dark'), turned([0.035, 0.13, 0.16], r, hand + 0.27, 0.12, 'iron')];
    case 'pickaxe': return [turned([0.035, 0.62, 0.035], r, hand - 0.2, 0.05, 'wood_dark'), turned([0.04, 0.045, 0.32], r, hand + 0.38, 0.05, 'iron')];
    case 'hammer': return [turned([0.03, 0.4, 0.03], r, hand - 0.12, 0.05, 'wood_dark'), turned([0.07, 0.07, 0.17], r, hand + 0.26, 0.06, 'iron'), sphere([0.06, 0.04, 0.05], at(-0.12, y(0.42), 0.1), 'leather', 0)];
    case 'bow': return [turned([0.025, 0.8, 0.035], l, y(0.18), 0.05, 'wood'), turned([0.006, 0.76, 0.006], l, y(0.2), 0.0, 'cloth_linen'), cylinder({ radiusBottom: 0.045, radiusTop: 0.05, height: 0.32, segments: 8 }, at(0.09, y(0.55), -0.13), 'leather'), turned([0.012, 0.08, 0.012], 0.07, y(0.87), -0.13, 'wood')];
    case 'sword': return [turned([0.03, 0.42, 0.012], r, hand + 0.04, 0.07, 'steel'), turned([0.12, 0.025, 0.025], r, hand + 0.02, 0.07, 'gold_trim'), turned([0.025, 0.07, 0.025], r, hand - 0.05, 0.07, 'leather')];
    case 'greatsword': return [turned([0.04, 0.62, 0.014], r, hand + 0.04, 0.07, 'steel'), turned([0.16, 0.03, 0.03], r, hand + 0.02, 0.07, 'steel_dark'), turned([0.03, 0.12, 0.03], r, hand - 0.1, 0.07, 'leather')];
    case 'lance': { const l = lean({ length: y(1.2), radiusBottom: 0.025, radiusTop: 0.012, segments: 6 }, Math.PI / 4, 0.28, at(r, hand - 0.25, 0.05), 'wood'); return [l.part, box([0.012, 0.1, 0.14], [l.end[0], l.end[1] - 0.14, l.end[2]], 'banner', { rotation: Math.PI / 4 })]; }
    case 'spear': return [turned([0.025, y(1.32), 0.025], r, 0.02, 0.06, 'wood_dark'), cylinder({ radiusBottom: 0.03, radiusTop: 0, height: 0.11, segments: 4 }, at(r, 0.02 + y(1.32), 0.06), 'iron')];
    case 'pitchfork': return [turned([0.025, y(1.15), 0.025], r, 0.02, 0.06, 'wood'), turned([0.025, 0.02, 0.12], r, 0.02 + y(1.15), 0.06, 'iron'), ...[-0.05, 0, 0.05].map(o => turned([0.012, 0.14, 0.012], r, 0.03 + y(1.15), 0.06 + o, 'iron'))];
    case 'peel': return [turned([0.025, y(0.95), 0.025], r, 0.03, 0.06, 'wood'), turned([0.02, 0.18, 0.14], r, 0.03 + y(0.95), 0.06, 'wood')];
    case 'sack': return [sphere([0.12, 0.09, 0.1], at(0.1, y(0.8), -0.06), 'cloth_linen', 1)];
    case 'basket': return [cylinder({ radiusBottom: 0.07, radiusTop: 0.09, height: 0.09, segments: 10 }, at(l, hand - 0.06, 0.05), 'thatch'), sphere([0.03, 0.025, 0.03], at(l - 0.02, hand + 0.03, 0.05), 'cloth_ochre', 0), sphere([0.03, 0.025, 0.03], at(l + 0.03, hand + 0.03, 0.06), 'cloth_red', 0)];
    // Crate on a carrying frame, tall enough to show above the shoulders.
    case 'carrier': return [turned([0.26, 0.36, 0.16], 0, y(0.52), -0.2, 'wood'), turned([0.28, 0.035, 0.18], 0, y(0.52) + 0.36, -0.2, 'wood_dark'), turned([0.03, y(0.6), 0.03], -0.13, y(0.3), -0.12, 'wood_dark'), turned([0.03, y(0.6), 0.03], 0.13, y(0.3), -0.12, 'wood_dark'), ...[-0.08, 0.08].map(s => turned([0.025, y(0.3), 0.02], s, y(0.55), -0.11, 'leather'))];
    // #92 trade tools (new values only; existing figures are unchanged).
    case 'tongs': return [turned([0.022, 0.56, 0.022], r - 0.02, hand - 0.22, 0.07, 'iron'), turned([0.022, 0.56, 0.022], r + 0.02, hand - 0.22, 0.1, 'iron'), turned([0.09, 0.06, 0.07], r, hand - 0.26, 0.085, 'ore')];
    case 'mallet': return [turned([0.035, 0.42, 0.035], r, hand - 0.12, 0.06, 'wood_dark'), turned([0.13, 0.13, 0.22], r, hand + 0.28, 0.07, 'wood_dark')];
    case 'stave': return [turned([0.04, y(1.25), 0.03], r + 0.02, 0.04, 0.1, 'wood_dark'), turned([0.05, 0.1, 0.045], r + 0.02, 0.04 + y(0.6), 0.1, 'leather')];
    case 'bucket': return [cylinder({ radiusBottom: 0.085, radiusTop: 0.105, height: 0.17, segments: 10 }, at(l - 0.03, hand - 0.16, 0.08), 'wood_dark'), cylinder({ radiusBottom: 0.108, height: 0.018, segments: 10 }, at(l - 0.03, hand - 0.03, 0.08), 'iron'), turned([0.008, 0.1, 0.008], l - 0.03, hand, 0.08, 'iron')];
    case 'rod': return [turned([0.018, y(1.0), 0.018], r, hand - 0.22, 0.1, 'wood'), turned([0.006, 0.45, 0.006], r, hand + y(0.35), 0.28, 'cloth_linen'),
      cylinder({ radiusBottom: 0.06, radiusTop: 0.075, height: 0.13, segments: 8 }, at(l - 0.02, y(0.38), -0.02), 'twigs'), cylinder({ radiusBottom: 0.077, height: 0.015, segments: 8 }, at(l - 0.02, y(0.51), -0.02), 'wood_dark'),
      turned([0.01, y(0.34), 0.01], 0, y(0.52), -0.06, 'leather')];
    case 'torch': return [turned([0.03, 0.34, 0.03], r, hand - 0.08, 0.09, 'wood'), { ...cylinder({ radiusBottom: 0.035, radiusTop: 0.04, height: 0.07, segments: 6 }, at(r, hand + 0.26, 0.09), 'soot'), torchHead: true }];
    case 'loot': return [sphere([0.15, 0.13, 0.13], at(0.05, y(0.82), -0.1), 'cloth_brown', 1), sphere([0.05, 0.04, 0.05], at(0.12, y(1.02), -0.04), 'cloth_brown', 0), sphere([0.025, 0.02, 0.025], at(-0.02, y(0.98), -0.06), 'gold_trim', 0)];
    case 'firebucket': return [cylinder({ radiusBottom: 0.075, radiusTop: 0.09, height: 0.15, segments: 10 }, at(0, hand - 0.02, 0.2), 'leather'), cylinder({ radiusBottom: 0.075, height: 0.006, segments: 10 }, at(0, hand + 0.125, 0.2), 'steel'), turned([0.008, 0.08, 0.13], 0, hand + 0.13, 0.2, 'iron')];
    default: return [];
  }
}

export default { id: 'figure', version: 1, label: 'Figure (villagers and soldiers)', params, build };
