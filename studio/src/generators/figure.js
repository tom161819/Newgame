// Figure recipe: villagers by profession, men and women. Low-poly body
// (shoes, hose or skirt, tunic, belt, arms, head, hair) plus headgear, apron,
// a tool or load and colours, all from style-guide materials. The figure faces
// the camera: "side" runs along the shoulders (screen right is +side) and
// "front" towards the viewer.
import { box, cylinder, sphere, clamp, lean, horse, rotateParts } from './shapes.js';

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
  { key: 'tool', values: ['none', 'axe', 'pickaxe', 'hammer', 'bow', 'spear', 'pitchfork', 'peel', 'sack', 'basket', 'carrier', 'sword', 'tongs', 'mallet', 'stave', 'bucket'], description: 'What the figure holds or carries.' },
  { key: 'shield', description: 'Shield on the left arm.' },
  { key: 'shieldShape', values: ['round', 'kite'], description: 'Round buckler-sized shield or tall kite shield.' },
  { key: 'shieldMaterial', description: 'Shield face material (banner, banner_blue, wood …).' },
  { key: 'armor', values: ['none', 'gambeson', 'mail', 'plate'], description: 'Body armour: quilted coat, mail sleeves and hose, or steel plates with pauldrons.' },
  { key: 'tabard', description: 'Surcoat colour worn over the armour.' },
  { key: 'mount', description: '{ coat, barding, saddle }: rides a horse (knights).' },
  { key: 'facing', description: 'Turn in eighths of a full circle (0–7); 0 faces the viewer. For direction sheets.' },
];

const S = Math.SQRT1_2, TURN = Math.PI / 4;
// Model point from (side, height, front).
const at = (side, y, front) => [(side + front) * S, y, (front - side) * S];
const turned = (size, side, y, front, material) => box(size, at(side, y, front), material, { rotation: TURN });

export function build(spec, { style }) {
  const female = spec.sex === 'female';
  const H = clamp(spec.height ?? (female ? 1.12 : 1.2), 0.9, 1.35), k = H / 1.2, w = clamp(spec.build ?? 1, 0.85, 1.2);
  const y = n => n * k, skin = spec.skin ?? 'skin', hair = spec.hair ?? 'hair_brown', garment = spec.garment ?? 'cloth_wool';
  const armour = { mail: 'steel_dark', plate: 'steel', gambeson: 'cloth_ochre' }[spec.armor];
  const sleeves = spec.sleeves ?? armour ?? garment, legs = spec.legs ?? (spec.armor === 'mail' || spec.armor === 'plate' ? armour : 'cloth_brown'), hatMaterial = spec.headgearMaterial ?? 'cloth_brown';
  const parts = [];
  // Feet, legs or skirt.
  for (const side of [-1, 1]) parts.push(turned([0.08 * w, y(0.05), 0.13], side * 0.055 * w, 0, 0.02, 'leather'));
  if (female) parts.push(cylinder({ radiusBottom: 0.2 * w, radiusTop: 0.125 * w, height: y(0.6), segments: 10 }, [0, y(0.03), 0], spec.mount ? legs : garment));
  else {
    for (const side of [-1, 1]) parts.push(turned([0.075 * w, y(0.36), 0.085], side * 0.055 * w, y(0.04), 0, legs));
    parts.push(cylinder({ radiusBottom: 0.16 * w, radiusTop: 0.125 * w, height: y(0.3), segments: 8 }, [0, y(0.34), 0], garment));
  }
  const lowerEnd = female ? 3 : 4;
  // Torso, belt, apron, arms and hands.
  parts.push(cylinder({ radiusBottom: 0.125 * w, radiusTop: 0.15 * w, height: y(0.24), segments: 8 }, [0, y(0.62), 0], garment));
  parts.push(cylinder({ radiusBottom: 0.133 * w, height: y(0.035), segments: 8 }, [0, y(0.6), 0], 'leather'));
  // A woman's apron hangs in front of the flared skirt, so it starts where the skirt is already wide.
  if (spec.apron) parts.push(turned([0.2 * w, y(female ? 0.27 : 0.36), 0.02], 0, y(female ? 0.35 : 0.3), female ? 0.168 * w : 0.14 * w, spec.apron));
  const shoulder = 0.175 * w, hand = y(0.47);
  for (const side of [-1, 1]) {
    parts.push(turned([0.07, y(0.33), 0.075], side * shoulder, y(0.52), 0, sleeves));
    parts.push(sphere([0.04, 0.035, 0.04], at(side * shoulder, hand, 0.01), skin, 1));
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
  parts.push(...tool(spec.tool ?? 'none', { shoulder, hand, y, female }));
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
  if (spec.facing) { const turnedParts = rotateParts(parts, spec.facing * Math.PI / 4); parts.length = 0; parts.push(...turnedParts); }
  const top = Math.max(headTop, ...parts.map(p => p.at[1] + (p.size?.[1] ?? p.height ?? (p.radii ? p.radii[1] * 2 : 0))));
  return { primitives: parts, lights: [], height: top };
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
    default: return [];
  }
}

export default { id: 'figure', version: 1, label: 'Figure (villagers and soldiers)', params, build };
