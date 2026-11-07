// Animal recipe (plans g-domaci-zvirata-grafika, g-noc-grafika): cats, kittens, hunting dogs, rats and wolves.
// Four-legged bodies built like the horse in shapes.js, but small and with species-specific heads, ears and tails.
// Like the figure recipe it takes `facing` (eighths of a turn, 0 = towards the viewer) and `stride` (−1…1) so the
// Studio can show and export walk cycles in eight directions, and a `pose` for the still frames the game needs.
import { box, cylinder, sphere, lean, turnParts } from './shapes.js';

export const params = [
  { key: 'species', values: ['cat', 'dog', 'rat', 'wolf', 'horse', 'deer', 'roe', 'boar', 'fox', 'hare', 'bear'], description: 'Kind of animal (horse and the wild animals use the anatomical skeleton).' },
  { key: 'breed', description: 'dog: hound, sheepdog or mastiff; cat: tabby, black, ginger or kitten; wolf: grey or dark; horse: bay, chestnut, grey, black or pony; deer: stag or hind; roe: buck or doe; boar: boar or piglet; fox: red; hare: brown; bear: brown.' },
  { key: 'coat', description: 'Main fur material.' },
  { key: 'marking', description: 'Second fur material: chest, socks, stripes or saddle.' },
  { key: 'pose', values: ['stand', 'sit', 'pounce', 'lie', 'attack', 'run'], description: 'Still pose: standing, sitting, pouncing (cat on a rat), lying wounded with a bandage (dog), lunging attack (wolf), run (long stride).' },
  { key: 'collar', description: 'Collar material (dogs).' },
  { key: 'facing', description: 'Turn in eighths of a full circle (0–7); 0 faces the viewer.' },
  { key: 'stride', description: 'Walk pose −1…1 for animation frames.' },
  { key: 'anatomy', description: 'Dogs and wolves: 2 = the anatomical skeleton of revision 2 (the only one drawn now).' },
  { key: 'markings', description: 'Cats: "patches" = white cat with a black tail tip and a black patch on the head.' },
];

// Body plans in units: length, height of the back, body depth and width, leg length, head size, tail.
const PLANS = {
  cat: { len: 0.26, back: 0.17, depth: 0.09, width: 0.09, leg: 0.09, head: 0.055, ears: 'point', tail: { length: 0.22, radius: 0.016, up: 0.9, bushy: 1 } },
  kitten: { len: 0.16, back: 0.11, depth: 0.065, width: 0.065, leg: 0.06, head: 0.045, ears: 'point', tail: { length: 0.12, radius: 0.012, up: 1.1, bushy: 1 } },
  hound: { len: 0.44, back: 0.32, depth: 0.13, width: 0.12, leg: 0.2, head: 0.07, snout: 0.09, ears: 'flop', tail: { length: 0.22, radius: 0.016, up: 0.3, bushy: 1 } },
  sheepdog: { len: 0.42, back: 0.3, depth: 0.16, width: 0.15, leg: 0.16, head: 0.08, snout: 0.07, ears: 'flop', tail: { length: 0.2, radius: 0.03, up: 0.05, bushy: 1.6 }, shaggy: true },
  mastiff: { len: 0.48, back: 0.36, depth: 0.19, width: 0.18, leg: 0.19, head: 0.1, snout: 0.07, ears: 'flop', tail: { length: 0.18, radius: 0.02, up: 0.2, bushy: 1 } },
  rat: { len: 0.13, back: 0.07, depth: 0.05, width: 0.05, leg: 0.03, head: 0.03, snout: 0.035, ears: 'round', tail: { length: 0.16, radius: 0.006, up: 0.15, bushy: 1 } },
  // Horse and wild animals (owner, 7 Nov 2026: horses and more wild animals). Drawn with the canine skeleton plus
  // per-species extras: hooves, manes, antlers, tusks, long ears, a shoulder hump.
  // Revision 2 (owner, 7 Nov 2026: "more realistic"): deeper barrels, longer arched necks, heavier legs where the
  // animal is heavy, slimmer where it is light; boars carry the weight in front with the head low; hares sit high behind.
  horse: { cannon: 0.62, len: 0.86, back: 0.66, depth: 0.3, width: 0.23, leg: 0.36, head: 0.105, snout: 0.25, skullH: 1.0, skullW: 0.75, ears: 'point', earSize: 0.65, tail: { length: 0.42, radius: 0.04, up: -1.15, bushy: 1.4 }, hoof: 'horse_dark', mane: true, neckUp: 0.62, long: true, legK: 1.15 },
  draught: { cannon: 0.85, len: 0.94, back: 0.66, depth: 0.37, width: 0.3, leg: 0.34, head: 0.125, snout: 0.25, skullH: 1.1, ears: 'point', earSize: 0.6, tail: { length: 0.42, radius: 0.05, up: -1.15, bushy: 1.4 }, hoof: 'horse_dark', mane: true, neckUp: 0.52, long: true, legK: 1.55, feather: true },
  pony: { cannon: 0.75, len: 0.62, back: 0.45, depth: 0.26, width: 0.22, leg: 0.24, head: 0.1, snout: 0.15, ears: 'point', earSize: 0.6, tail: { length: 0.34, radius: 0.045, up: -1.1, bushy: 1.5 }, hoof: 'horse_dark', mane: true, neckUp: 0.5, long: true, legK: 1.25 },
  deer: { len: 0.68, back: 0.58, depth: 0.22, width: 0.16, leg: 0.38, head: 0.075, snout: 0.13, skullW: 0.85, ears: 'point', earSize: 0.95, tail: { length: 0.08, radius: 0.025, up: 0.4, bushy: 1 }, hoof: 'soot', neckUp: 0.62, long: true, legK: 0.8 },
  fawn: { len: 0.4, back: 0.38, depth: 0.14, width: 0.11, leg: 0.26, head: 0.06, snout: 0.07, ears: 'point', earSize: 1.1, tail: { length: 0.04, radius: 0.015, up: 0.4, bushy: 1 }, hoof: 'soot', neckUp: 0.5, long: true, legK: 0.8 },
  roe: { len: 0.46, back: 0.42, depth: 0.16, width: 0.12, leg: 0.28, head: 0.058, snout: 0.075, skullW: 0.85, ears: 'point', earSize: 1.05, tail: { length: 0.03, radius: 0.02, up: 0.4, bushy: 1 }, hoof: 'soot', neckUp: 0.55, long: true, legK: 0.75 },
  boar: { len: 0.66, back: 0.42, depth: 0.27, width: 0.22, leg: 0.15, head: 0.13, snout: 0.12, skullH: 1.15, skullW: 0.85, ears: 'point', earSize: 0.5, tail: { length: 0.12, radius: 0.012, up: -1.2, bushy: 1 }, hoof: 'soot', socks: 'soot', ridge: true, neckUp: -0.04, hips: 0.88, legK: 1.15, wedge: true, headDown: 0.5 },
  piglet: { len: 0.3, back: 0.18, depth: 0.12, width: 0.1, leg: 0.06, head: 0.06, snout: 0.05, skullH: 1.1, ears: 'point', earSize: 0.5, tail: { length: 0.05, radius: 0.008, up: -1.0, bushy: 1 }, hoof: 'soot', neckUp: -0.05, hips: 0.92, wedge: true, headDown: 0.4 },
  fox: { len: 0.42, back: 0.27, depth: 0.11, width: 0.095, leg: 0.15, head: 0.06, snout: 0.1, skullW: 0.9, ears: 'point', earSize: 1.2, tail: { length: 0.34, radius: 0.04, up: -0.3, bushy: 1.7 }, socks: 'soot', neckUp: 0.3, legK: 0.85 },
  hare: { len: 0.26, back: 0.2, depth: 0.12, width: 0.1, leg: 0.08, head: 0.05, snout: 0.035, ears: 'long', tail: { length: 0.03, radius: 0.022, up: 0.6, bushy: 1 }, hips: 1.25, neckUp: 0.25, hindK: 1.5 },
  bear: { len: 0.82, back: 0.55, depth: 0.36, width: 0.34, leg: 0.24, head: 0.13, snout: 0.11, skullW: 1.1, ears: 'round', tail: { length: 0.05, radius: 0.03, up: 0.2, bushy: 1 }, hump: true, legK: 1.7, neckUp: 0.12, hips: 0.92, muzzle: 'hair_brown' },
  cub: { len: 0.38, back: 0.27, depth: 0.18, width: 0.17, leg: 0.11, head: 0.085, snout: 0.06, ears: 'round', tail: { length: 0.03, radius: 0.02, up: 0.2, bushy: 1 }, legK: 1.5, neckUp: 0.2, muzzle: 'hair_brown' },
  wolf: { len: 0.56, back: 0.4, depth: 0.17, width: 0.15, leg: 0.24, head: 0.085, snout: 0.11, ears: 'point', tail: { length: 0.3, radius: 0.04, up: -0.45, bushy: 1.5 }, ruff: true },
};
const COATS = {
  cat: { tabby: ['hair_brown', 'hair_dark'], white: ['cloth_linen', 'soot'], black: ['soot', 'cloth_linen'], ginger: ['hair_auburn', 'cloth_linen'], kitten: ['hair_grey', 'cloth_linen'] },
  dog: { hound: ['horse_chestnut', 'cloth_linen'], sheepdog: ['soot', 'cloth_linen'], mastiff: ['hair_brown', 'horse_dark'] },
  rat: { rat: ['stone_dark', 'hair_grey'] },
  wolf: { grey: ['horse_grey', 'stone_light'], dark: ['stone_dark', 'horse_grey'] },
  horse: { bay: ['horse_bay', 'horse_dark'], chestnut: ['horse_chestnut', 'cloth_linen'], grey: ['horse_grey', 'stone_light'], black: ['horse_dark', 'soot'], pony: ['hair_blond', 'cloth_linen'],
    palomino: ['hair_blond', 'cloth_linen'], dun: ['cloth_ochre', 'soot'], piebald: ['horse_dark', 'cloth_linen'], draught: ['horse_chestnut', 'hair_blond'], dapple: ['stone_light', 'horse_grey'] },
  deer: { stag: ['hair_auburn', 'cloth_linen'], hind: ['hair_brown', 'cloth_linen'], pricket: ['hair_auburn', 'cloth_linen'], calf: ['horse_chestnut', 'cloth_linen'] },
  roe: { buck: ['hair_auburn', 'cloth_linen'], doe: ['horse_chestnut', 'cloth_linen'], fawn: ['horse_chestnut', 'cloth_linen'] },
  boar: { boar: ['horse_dark', 'stone_dark'], sow: ['hair_brown', 'horse_dark'], piglet: ['hair_brown', 'hair_blond'] },
  fox: { red: ['hair_auburn', 'cloth_linen'], pale: ['cloth_ochre', 'cloth_linen'], cross: ['horse_chestnut', 'soot'] },
  hare: { brown: ['hair_brown', 'cloth_linen'], grey: ['hair_grey', 'cloth_linen'], white: ['cloth_linen', 'stone_light'] },
  bear: { brown: ['horse_dark', 'hair_brown'], dark: ['soot', 'horse_dark'], grizzled: ['hair_brown', 'hair_blond'], cub: ['horse_bay', 'hair_brown'] },
};
const SKELETON = new Set(['dog', 'wolf', 'horse', 'deer', 'roe', 'boar', 'fox', 'hare', 'bear']);
const planKey = (species, breed) => species === 'cat' ? (breed === 'kitten' ? 'kitten' : 'cat') : species === 'dog' ? breed : species === 'horse' && breed === 'pony' ? 'pony' : species === 'horse' && breed === 'draught' ? 'draught' : species === 'boar' && breed === 'piglet' ? 'piglet' : (species === 'deer' || species === 'roe') && (breed === 'calf' || breed === 'fawn') ? 'fawn' : species === 'bear' && breed === 'cub' ? 'cub' : species;
const FRONT = Math.PI / 4; // facing 0: the animal walks towards the viewer (+x +z), like the figure recipe

// ---------- dogs and wolves (revision 2: anatomical skeleton) ----------
// Owner, 7 Nov 2026: "better shapes, more like a real dog / wolf". The body is a deep chest, a tucked waist and a
// rump; the neck rises forward to a skull with a tapered muzzle; legs have elbows, wrists, stifles and hocks (the
// hind legs bend backwards). Joints are points (front, up) on the animal's side; limbs are tapered cylinders between.
function canine(spec, plan, { species, breed, coat, mark, pose, stride, P, rot }) {
  const parts = [], L = plan.len, H = plan.back, D = plan.depth, W = plan.width, hd = plan.head, legR = Math.max(0.016, W * 0.16) * (plan.legK ?? 1), sock = plan.socks ?? (species === 'horse' && (breed === 'bay' || breed === 'dun') ? 'horse_dark' : coat);
  const ell = (f, y, s, [a, b, c], material, pitch = 0) => sphere([a, b, c], P(f + b * Math.sin(pitch), y - b * Math.cos(pitch), s), material, 1, { rotation: rot, ...(pitch ? { tilt: [0, pitch] } : {}) });
  const limb = (from, to, r0, r1, material) => { // from = lower point [f, y, s], to = upper point
    const a = P(...from), b = P(...to), dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz);
    return lean({ length: len, radiusBottom: r0, radiusTop: r1, segments: 7 }, Math.atan2(dz, dx), Math.acos(Math.max(-1, Math.min(1, dy / len))), a, material).part;
  };
  const lie = pose === 'lie', sit = pose === 'sit', attack = pose === 'attack', run = pose === 'run';
  const wolf = species === 'wolf', shaggy = !!plan.shaggy;
  // Pose: heights of the withers (shoulder top) and the hips, head lift.
  const withers = lie ? D * 1.05 : sit ? H * 1.05 : attack ? H * 0.82 : H;
  const hips = lie ? D * 0.95 : sit ? D * 0.75 : attack ? H * 1.02 : H * (plan.hips ?? 0.96);
  const swing = (run ? 1.6 : 1) * stride;
  // Torso: chest, waist (belly tucked up) and rump, following the line from withers to hips.
  const chestF = L * 0.24, rumpF = -L * 0.27;
  if (sit) {
    parts.push(ell(rumpF + L * 0.12, D * 0.5, 0, [L * 0.24, D * 0.5, W * 0.5], coat), ell(L * 0.02, H * 0.5, 0, [L * 0.3, D * 0.5, W * 0.46], coat, 0.85));
  } else {
    parts.push(ell(chestF, withers - D * 0.5, 0, [L * 0.27, D * 0.54, W * 0.5], coat));
    parts.push(ell(0, (withers + hips) / 2 - D * 0.38, 0, [L * 0.26, D * 0.36, W * 0.42], coat, (hips - withers) / L));
    parts.push(ell(rumpF, hips - D * 0.45, 0, [L * 0.24, D * 0.44, W * 0.46], coat));
  }
  const chestTop = sit ? H * 0.95 : withers, chestFront = sit ? L * 0.22 : chestF + L * 0.18;
  // Chest / belly marking.
  parts.push(ell(chestFront - L * 0.04, chestTop - D * 0.75, 0, [L * 0.12, D * 0.3, W * 0.36], mark));
  // Legs. Front: shoulder → elbow → wrist → paw. Hind: hip → stifle → hock → paw.
  const legs = [];
  if (lie) {
    for (const s of [-1, 1]) {
      legs.push(limb([chestF + L * 0.42, legR, s * W * 0.25], [chestF + L * 0.05, legR * 1.2, s * W * 0.3], legR * 0.8, legR, coat));
      legs.push(limb([rumpF + L * 0.2, legR, s * W * 0.55], [rumpF - L * 0.05, D * 0.5, s * W * 0.4], legR * 0.9, legR * 1.6, coat));
    }
  } else {
    for (const [s, phase] of [[1, 1], [-1, -1]]) {
      const sw = swing * phase * L * 0.22, f0 = sit ? L * 0.2 : chestF + L * 0.06, sy = chestTop - D * 0.55;
      const elbow = [f0 - L * 0.02 + sw * 0.3, H * 0.5 + (sit ? H * 0.05 : 0) - (attack ? H * 0.12 : 0), s * W * 0.32], wrist = [f0 + sw * 0.85 + (attack ? L * 0.12 : 0), H * 0.14, s * W * 0.3], paw = [f0 + sw + L * 0.03 + (attack ? L * 0.12 : 0), 0, s * W * 0.3];
      legs.push(limb(elbow, [f0, sy, s * W * 0.34], legR * 1.3, legR * 1.8, coat), limb(wrist, elbow, legR * 0.85, legR * 1.1, coat), limb(paw, wrist, legR * 0.8 * (plan.cannon ?? 1), legR * 0.85 * (plan.cannon ?? 1), sock));
      legs.push(ell(paw[0] + legR * 0.4, legR * 0.8, paw[2], [legR * 1.4, legR * 0.8, legR * 1.1], plan.hoof ?? (wolf ? coat : breed === 'sheepdog' ? mark : coat)));
    }
    for (const [s, phase] of [[1, -1], [-1, 1]]) {
      const sw = swing * phase * L * 0.22;
      if (sit) {
        legs.push(ell(rumpF + L * 0.1, D * 0.36, s * W * 0.42, [L * 0.22, D * 0.32, W * 0.18], coat, 0.25), limb([rumpF + L * 0.38, legR, s * W * 0.4], [rumpF + L * 0.05, legR * 1.4, s * W * 0.42], legR * 0.8, legR * 1.1, coat));
        continue;
      }
      const hip = [rumpF + L * 0.02, hips - D * 0.45, s * W * 0.36], stifle = [rumpF + L * 0.12 + sw * 0.4, H * 0.5 + (attack ? H * 0.05 : 0), s * W * 0.36];
      const hock = [rumpF - L * 0.1 + sw * 0.7 - (attack ? L * 0.1 : 0), H * 0.25, s * W * 0.33], paw = [rumpF - L * 0.04 + sw, 0, s * W * 0.33];
      legs.push(ell(rumpF + L * 0.04, Math.max(hips - D * 0.95, D * 0.5 * (plan.hindK ?? 1)), s * W * 0.3, [L * 0.17 * (plan.hindK ?? 1), D * 0.42 * (plan.hindK ?? 1), W * 0.16 * (plan.hindK ?? 1)], coat, -0.35));
      legs.push(limb(stifle, hip, legR * 1.4, legR * 1.9, coat), limb(hock, stifle, legR * 0.9, legR * 1.3, coat), limb(paw, hock, legR * 0.75 * (plan.cannon ?? 1), legR * 0.85 * (plan.cannon ?? 1), sock));
      legs.push(ell(paw[0] + legR * 0.4, legR * 0.8, paw[2], [legR * 1.4, legR * 0.8, legR * 1.1], plan.hoof ?? coat));
    }
  }
  parts.push(...legs);
  // Neck and head. The neck rises forward from the chest; the attack pose lowers and stretches it.
  const neckBase = [chestFront - L * 0.04, chestTop - D * 0.25], headUp = lie ? D * 0.75 : attack ? withers - hd * 0.2 : chestTop + (sit ? H * 0.38 : H * 0.3);
  const skull = [chestFront + (lie ? L * 0.22 : attack ? L * 0.3 : L * (plan.neckUp !== undefined && plan.neckUp < 0.1 ? 0.2 : 0.12)), headUp];
  const nx = skull[0] - neckBase[0], ny = skull[1] - neckBase[1], neckPitch = Math.atan2(ny, nx);
  parts.push(ell((neckBase[0] + skull[0]) / 2, (neckBase[1] + skull[1]) / 2 + hd * 0.1, 0, [Math.hypot(nx, ny) / 2 + hd * 0.25, hd * 0.85 * (wolf ? 1.15 : 1), W * 0.36], coat, neckPitch));
  if (wolf) parts.push(ell(neckBase[0] + nx * 0.35, neckBase[1] + ny * 0.35 + hd * 0.2, 0, [hd * 1.25, hd * 1.35, W * 0.52], coat === 'horse_grey' ? 'stone_light' : 'horse_grey', neckPitch));
  if (shaggy) parts.push(ell(neckBase[0] + nx * 0.2, neckBase[1] + ny * 0.2, 0, [hd * 1.2, hd * 1.4, W * 0.55], mark, neckPitch));
  parts.push(ell(skull[0], skull[1] + hd * 0.15, 0, [hd * 1.0, hd * 0.85 * (plan.skullH ?? 1), hd * 0.82 * (plan.skullW ?? 1)], coat));
  if (wolf) for (const s of [-1, 1]) parts.push(ell(skull[0] - hd * 0.1, skull[1] - hd * 0.1, s * hd * 0.55, [hd * 0.55, hd * 0.55, hd * 0.35], 'stone_light'));
  // Muzzle: a tapered cylinder from the tip (lower) back up into the skull; nose; lower jaw.
  const snout = plan.snout ?? hd; const tipF = skull[0] + hd * 0.7 + snout, tipY = skull[1] - hd * (attack ? 0.15 : plan.long ? 0.9 : 0.3) - snout * (plan.headDown ?? 0), muzzleMat = species === 'dog' && breed === 'sheepdog' ? 'cloth_linen' : species === 'dog' && breed === 'mastiff' ? 'horse_dark' : plan.muzzle ?? (species === 'fox' || species === 'hare' ? mark : species === 'boar' ? 'soot' : coat);
  parts.push(limb([tipF, tipY, 0], [skull[0] + hd * 0.35, skull[1] + hd * 0.1, 0], hd * (breed === 'mastiff' || species === 'horse' ? 0.45 : species === 'boar' ? 0.32 : species === 'bear' ? 0.42 : 0.3), hd * (plan.wedge ? 0.8 : 0.62), muzzleMat));
  if (plan.wedge) parts.push(ell(tipF + hd * 0.08, tipY + hd * 0.2, 0, [hd * 0.07, hd * 0.26, hd * 0.28], breed === 'piglet' ? 'cloth_red' : 'stone_dark')); // flat disc snout
  parts.push(ell(tipF + hd * 0.05, tipY + hd * 0.05, 0, [hd * 0.2, hd * 0.17, hd * 0.2], 'soot'));
  if (attack) parts.push(limb([tipF - hd * 0.1, tipY - hd * 0.55, 0], [skull[0] + hd * 0.4, skull[1] - hd * 0.35, 0], hd * 0.2, hd * 0.4, coat), ell(tipF - snout * 0.45, tipY - hd * 0.3, 0, [snout * 0.4, hd * 0.12, hd * 0.25], 'cloth_red'),
    ...[-1, 1].map(s => ell(tipF - hd * 0.15, tipY - hd * 0.32, s * hd * 0.12, [hd * 0.05, hd * 0.1, hd * 0.05], 'cloth_linen')));
  // Eyes (amber for wolves), then ears.
  for (const s of [-1, 1]) {
    parts.push(ell(skull[0] + hd * 0.62, skull[1] + hd * 0.25, s * hd * 0.42, [hd * 0.14, hd * 0.12, hd * 0.12], wolf ? 'cloth_ochre' : 'soot'));
    if (plan.ears === 'long') {
      parts.push(cylinder({ radiusBottom: hd * 0.22, radiusTop: hd * 0.12, height: hd * 2.0, segments: 6, tilt: [s * 0.2, -0.35] }, P(skull[0] - hd * 0.2, skull[1] + hd * 0.7, s * hd * 0.3), coat), ell(skull[0] - hd * 0.75, skull[1] + hd * 2.6, s * hd * 0.65, [hd * 0.12, hd * 0.1, hd * 0.12], 'soot'));
    } else if (plan.ears === 'round') {
      parts.push(ell(skull[0] - hd * 0.3, skull[1] + hd * 1.05, s * hd * 0.6, [hd * 0.25, hd * 0.25, hd * 0.14], coat));
    } else if (wolf || breed === 'sheepdog' || plan.earSize) {
      const e = P(skull[0] - hd * 0.15, skull[1] + hd * 0.8, s * hd * 0.48), k = plan.earSize ?? 1;
      parts.push(cylinder({ radiusBottom: hd * (wolf ? 0.32 : 0.28) * k, radiusTop: hd * 0.02, height: hd * (wolf ? 1.0 : plan.earSize ? 1.0 : 0.6) * k, segments: 4, tilt: [s * (plan.earSize ? 0.5 : 0.25), wolf ? 0.1 : plan.earSize ? -0.2 : -0.5] }, e, species === 'fox' ? 'soot' : coat));
    } else {
      parts.push(ell(skull[0] - hd * 0.25, skull[1] - hd * (breed === 'hound' ? 0.7 : 0.25), s * hd * 0.9, [hd * 0.35, hd * (breed === 'hound' ? 0.85 : 0.45), hd * 0.12], breed === 'hound' ? 'horse_dark' : coat, -0.2));
    }
  }
  if (spec.collar) parts.push(ell(neckBase[0] + nx * 0.3, neckBase[1] + ny * 0.3 - hd * 0.65, 0, [hd * 0.62, hd * 0.2, W * 0.42], spec.collar, neckPitch));
  // Back markings: a wolf's dark saddle, a hound's saddle, the sheepdog's shaggy coat.
  if (!sit && !lie) {
    if (wolf) parts.push(ell(-L * 0.05, (withers + hips) / 2 - D * 0.02, 0, [L * 0.36, D * 0.16, W * 0.42], coat === 'horse_grey' ? 'stone_dark' : 'soot'));
    if (breed === 'hound') parts.push(ell(-L * 0.08, (withers + hips) / 2 - D * 0.04, 0, [L * 0.3, D * 0.14, W * 0.44], 'horse_dark'));
    if (shaggy) for (const f of [-0.25, 0, 0.22]) parts.push(ell(L * f, (withers + hips) / 2 - D * 0.62, 0, [L * 0.18, D * 0.6, W * 0.56], coat));
  }
  // Tail from the rump: wolves carry it low and bushy, hounds up, sheepdogs a long plume.
  const tail = plan.tail, rump = [rumpF - L * 0.2, (sit ? D * 0.4 : hips) - D * 0.2], up = sit ? -0.6 : attack ? 0.1 : tail.up + stride * 0.08;
  const tipT = [rump[0] - Math.cos(up) * tail.length, Math.max(0.03, rump[1] + Math.sin(up) * tail.length)];
  const rT = tail.radius * tail.bushy;
  if (up >= 0) parts.push(limb([rump[0], rump[1], 0], [tipT[0], tipT[1], 0], rT * 0.7, rT, coat)); // lean upwards: from the rump
  else parts.push(limb([tipT[0], tipT[1], 0], [rump[0], rump[1], 0], rT, rT * 0.7, coat));
  if (wolf) parts.push(ell(tipT[0], tipT[1] + rT * 0.6, 0, [rT * 1.1, rT, rT], 'soot'));
  if (lie && species === 'dog') parts.push(cylinder({ radiusBottom: D * 0.5, radiusTop: D * 0.5, height: L * 0.14, segments: 10, tilt: [0, -Math.PI / 2] }, P(-L * 0.08, D * 0.55), 'cloth_linen'), sphere([0.012, 0.012, 0.012], P(-L * 0.02, D * 1.05), 'cloth_red', 0));
  // Horse and wild-animal extras.
  const nk = (t) => [neckBase[0] + nx * t, neckBase[1] + ny * t];
  if (plan.mane && species === 'horse' && !lie) {
    // Revision 3 (owner: realistic hand-painted horses, not low-poly): muscle masses over the skeleton – shoulder,
    // forearm, barrel, croup and gaskin – each a smooth ellipsoid, a lighter sheen on top and a darker belly for
    // soft colour gradients; cheek and nostril on the head; the mane, forelock and tail as many hanging strands.
    const sheen = { bay: 'horse_chestnut', chestnut: 'hair_auburn', grey: 'stone_light', black: 'stone_dark', pony: 'bread', palomino: 'bread', dun: 'bread', piebald: 'stone_dark', draught: 'hair_auburn', dapple: 'cloth_linen' }[breed] ?? coat;
    const shade = { grey: 'horse_grey', dapple: 'horse_grey', palomino: 'hair_brown', pony: 'hair_brown', dun: 'hair_brown', black: 'soot' }[breed] ?? 'horse_dark';
    for (const s2 of [-1, 1]) {
      parts.push(ell(chestF + L * 0.02, withers - D * 0.2, s2 * W * 0.14, [L * 0.16, D * 0.42, W * 0.4], coat, -0.25)); // shoulder
      parts.push(ell(rumpF - L * 0.02, hips - D * 0.15, s2 * W * 0.13, [L * 0.2, D * 0.45, W * 0.42], coat)); // croup and hindquarter
      if (!sit) parts.push(ell(chestF + L * 0.1, H * 0.55, s2 * W * 0.3, [legR * 2.2, H * 0.12, legR * 1.8], coat), ell(rumpF + L * 0.06, H * 0.5, s2 * W * 0.32, [legR * 2.4, H * 0.14, legR * 1.9], coat)); // forearm and gaskin
    }
    parts.push(ell(L * 0.0, (withers + hips) / 2 - D * 0.05, 0, [L * 0.3, D * 0.12, W * 0.32], sheen)); // light along the back
    parts.push(ell(rumpF - L * 0.02, hips + D * 0.0, 0, [L * 0.14, D * 0.1, W * 0.3], sheen));
    parts.push(ell(-L * 0.02, (withers + hips) / 2 - D * 0.82, 0, [L * 0.26, D * 0.16, W * 0.42], shade)); // darker belly
    parts.push(ell(skull[0] - hd * 0.1, skull[1] - hd * 0.15, 0, [hd * 0.65, hd * 0.6, hd * 0.95], coat)); // cheeks / jaw
    for (const s2 of [-1, 1]) parts.push(ell(tipF - hd * 0.05, tipY + hd * 0.25, s2 * hd * 0.25, [hd * 0.08, hd * 0.08, hd * 0.05], 'soot')); // nostrils
    parts.push(ell(tipF - hd * 0.25, tipY + hd * 0.05, 0, [hd * 0.35, hd * 0.3, hd * 0.4], breed === 'grey' || breed === 'dapple' ? 'stone_dark' : shade)); // soft muzzle
    for (let i = 0; i < 9; i++) { const t = 0.05 + i * 0.11, [f, y] = nk(t), side = i % 2 ? 1 : -1; parts.push(limb([f - hd * 0.15, y + hd * 0.2, W * (0.2 + 0.08 * side)], [f - hd * 0.3, y + hd * 0.95, W * 0.05 * side], hd * 0.12, hd * 0.2, i % 3 ? mark : coat === mark ? 'soot' : mark)); }
    for (const [dz, dl] of [[-0.3, 0.95], [0, 1.05], [0.3, 0.9]]) { const tl = plan.tail.length * dl, tx = rumpF - L * 0.24, ty = hips - D * 0.12; parts.push(limb([tx - tl * 0.25, Math.max(0.03, ty - tl * 0.95), dz * W * 0.3], [tx, ty, 0], plan.tail.radius * 0.6, plan.tail.radius * 0.9, mark)); }
  }
  if (plan.mane) { // mane along the top of the neck and a forelock; a dark mane on light coats
    if (species !== 'horse' || lie) for (const t of [0.15, 0.4, 0.65, 0.9]) { const [f, y] = nk(t); parts.push(ell(f - hd * 0.2, y + hd * 0.85, 0, [hd * 0.55, hd * 0.4, W * 0.12], mark, neckPitch)); }
    parts.push(ell(skull[0] + hd * 0.2, skull[1] + hd * 0.75, 0, [hd * 0.3, hd * 0.25, hd * 0.2], mark));
    if (breed === 'chestnut') parts.push(ell(skull[0] + hd * 0.8, skull[1] - hd * 0.1, 0, [hd * 0.5, hd * 0.25, hd * 0.25], 'cloth_linen', neckPitch)); // white blaze
    if (spec.harness) parts.push(ell(neckBase[0] + nx * 0.1, neckBase[1] + ny * 0.1 - hd * 0.1, 0, [hd * 0.9, hd * 1.2, W * 0.5], 'leather', neckPitch), ell(skull[0] + hd * 0.6, skull[1] - hd * 0.1, 0, [hd * 0.5, hd * 0.12, hd * 0.85], 'leather'));
    if (spec.saddle) parts.push(ell(L * 0.08, withers + D * 0.02, 0, [L * 0.16, D * 0.12, W * 0.56], 'leather'), ell(L * 0.08, withers - D * 0.35, 0, [L * 0.18, D * 0.35, W * 0.53], spec.saddle === true ? 'cloth_red' : spec.saddle));
  }
  if (breed === 'stag' || breed === 'buck') { // antlers: a beam on each side with tines (the roe buck's are short)
    const big = breed === 'stag', [hf, hy] = [skull[0] - hd * 0.2, skull[1] + hd * 0.7];
    for (const s of [-1, 1]) {
      const base = [hf, hy, s * hd * 0.35], top = [hf - hd * (big ? 1.2 : 0.3), hy + hd * (big ? 3.2 : 1.8), s * hd * (big ? 1.6 : 0.6)];
      parts.push(limb(base, top, hd * 0.12, hd * 0.07, 'antler'));
      for (const t of big ? [0.3, 0.6, 0.9] : [0.6]) { const a = [base[0] + (top[0] - base[0]) * t, base[1] + (top[1] - base[1]) * t, base[2] + (top[2] - base[2]) * t]; parts.push(limb(a, [a[0] + hd * 0.7, a[1] + hd * 0.6, a[2] + s * hd * 0.1], hd * 0.07, hd * 0.03, 'antler')); }
    }
  }
  if ((species === 'deer' || species === 'roe') && !sit && !lie) parts.push(ell(rumpF - L * 0.2, hips - D * 0.4, 0, [L * 0.06, D * 0.3, W * 0.4], 'cloth_linen')); // white rump patch
  if (species === 'deer' && breed === 'hind' || breed === 'doe') parts.push(...[-0.1, 0.05].map(f => ell(L * f, (withers + hips) / 2 - D * 0.2, W * 0.5, [L * 0.03, D * 0.03, W * 0.05], 'cloth_linen'))); // pale spots
  if (plan.ridge && !lie) for (let i = 0; i < 6; i++) { const t = i / 5, f = chestF + L * 0.1 - t * L * 0.55, y = withers + (hips - withers) * t; parts.push(cylinder({ radiusBottom: W * 0.12, radiusTop: 0, height: D * (0.32 - t * 0.18), segments: 4 }, P(f, y - D * 0.08), 'soot')); } // bristle crest
  if (plan.feather && !lie) for (const s2 of [-1, 1]) for (const f of [chestF + L * 0.09, rumpF - L * 0.02]) parts.push(ell(f + L * 0.03, legR * 2.4, s2 * W * 0.32, [legR * 1.15, legR * 1.5, legR * 1.1], 'cloth_linen')); // white feathered fetlocks
  if (breed === 'dapple' && !lie) for (const [f, y, s2] of [[0.2, 0.75, 1], [0, 0.85, -1], [-0.2, 0.75, 1], [0.1, 0.6, -1], [-0.1, 0.6, 1], [-0.28, 0.85, -1]]) parts.push(ell(L * f, H * y, s2 * W * 0.47, [L * 0.05, D * 0.12, W * 0.06], 'horse_grey'));
  if (breed === 'piebald' && !lie) parts.push(ell(L * 0.02, withers - D * 0.4, W * 0.08, [L * 0.2, D * 0.45, W * 0.48], 'cloth_linen'), ell(rumpF, hips - D * 0.6, -W * 0.08, [L * 0.12, D * 0.35, W * 0.49], 'cloth_linen'));
  if (breed === 'dun' && !lie) parts.push(ell(-L * 0.05, (withers + hips) / 2 + D * 0.02, 0, [L * 0.4, D * 0.06, W * 0.12], 'soot'));
  if ((breed === 'calf' || breed === 'fawn') && !lie) for (const [f, y, s2] of [[0.15, 0.82, 1], [0, 0.9, 1], [-0.15, 0.85, 1], [0.08, 0.7, 1], [-0.08, 0.72, 1], [0.15, 0.82, -1], [0, 0.9, -1], [-0.15, 0.85, -1], [0.05, 0.72, -1]]) parts.push(ell(L * f, H * y, s2 * W * 0.46, [L * 0.035, L * 0.035, W * 0.08], 'cloth_linen'));
  if (breed === 'pricket') for (const s2 of [-1, 1]) parts.push(limb([skull[0] - hd * 0.2, skull[1] + hd * 0.7, s2 * hd * 0.3], [skull[0] - hd * 0.5, skull[1] + hd * 2.2, s2 * hd * 0.45], hd * 0.09, hd * 0.04, 'antler'));
  if (breed === 'stag' && !sit) parts.push(ell(neckBase[0] + nx * 0.45, neckBase[1] + ny * 0.45 - hd * 0.5, 0, [hd * 1.0, hd * 0.9, W * 0.42], 'horse_dark', neckPitch)); // shaggy throat mane
  if (breed === 'grizzled') parts.push(ell(chestF, withers - D * 0.25, 0, [L * 0.25, D * 0.3, W * 0.5], 'hair_blond'));
  if (plan.hump) parts.push(ell(chestF, withers - D * 0.05, 0, [L * 0.18, D * 0.25, W * 0.36], species === 'boar' ? 'soot' : coat)); // bristly ridge / shoulder hump
  if (species === 'boar' && breed === 'boar') for (const s of [-1, 1]) parts.push(limb([tipF - hd * 0.2, tipY - hd * 0.1, s * hd * 0.3], [tipF - hd * 0.55, tipY - hd * 0.35, s * hd * 0.32], hd * 0.06, hd * 0.1, 'bone'));
  if (breed === 'piglet') for (const f of [-0.2, 0, 0.2]) parts.push(ell(L * f, (withers + hips) / 2 - D * 0.15, 0, [L * 0.12, D * 0.08, W * 0.52], 'hair_blond')); // stripes
  if (species === 'fox') parts.push(ell(tipT[0], Math.max(tipT[1], plan.tail.radius * 1.5) + plan.tail.radius * 0.6, 0, [plan.tail.radius * 1.8, plan.tail.radius * 1.4, plan.tail.radius * 1.4], 'cloth_linen')); // white tail tip
  if (species === 'hare' || species === 'roe' || species === 'deer') parts.push(ell(rumpF - L * 0.22, hips - D * 0.2, 0, [plan.tail.radius * 1.5, plan.tail.radius * 1.5, plan.tail.radius * 1.5], 'cloth_linen'));
  return parts;
}

export function build(spec, { footprint }) {
  const species = spec.species ?? 'cat', breed = spec.breed ?? { cat: 'tabby', dog: 'hound', rat: 'rat', wolf: 'grey' }[species] ?? Object.keys(COATS[species])[0];
  const plan = PLANS[planKey(species, breed)];
  const [coatDefault, markDefault] = COATS[species][breed] ?? COATS[species][Object.keys(COATS[species])[0]];
  const coat = spec.coat ?? coatDefault, mark = spec.marking ?? markDefault, pose = spec.pose ?? 'stand', stride = Math.max(-1, Math.min(1, spec.stride ?? (pose === 'run' ? 1 : 0)));
  const fx = Math.cos(FRONT), fz = Math.sin(FRONT), sx = -fz, sz = fx, rot = -FRONT;
  const P = (f, up, s = 0) => [fx * f + sx * s, up, fz * f + sz * s];
  if (SKELETON.has(species)) {
    const canineParts = canine(spec, plan, { species, breed, coat, mark, pose, stride, P, rot });
    const turned = spec.facing ? turnParts(canineParts, spec.facing * Math.PI / 4) : canineParts, out = turned.map(p => ({ ...p, overhang: true }));
    return { primitives: out, lights: [], height: Math.max(...out.map(p => p.at[1] + (p.size?.[1] ?? p.height ?? (p.radii ? p.radii[1] * 2 : 0)))) };
  }
  const parts = [];
  const { len, depth, width, leg, head } = plan;
  // Pose shapes the body: sitting lowers the rump, pouncing and attacking lower the front, lying puts it on the ground.
  const lie = pose === 'lie', sit = pose === 'sit', low = pose === 'pounce' || pose === 'attack';
  const backY = lie ? depth * 0.55 : plan.back - depth / 2, frontDrop = low ? leg * 0.35 : 0, rumpDrop = sit ? leg * 0.85 : 0;
  // Legs: front pair and hind pair, swinging with the stride (opposite pairs together).
  const legW = Math.max(0.018, width * 0.28), hipF = len * 0.36, hipB = -len * 0.34;
  for (const [f, s, phase] of [[hipF, width * 0.32, 1], [hipF, -width * 0.32, -1], [hipB, width * 0.32, -1], [hipB, -width * 0.32, 1]]) {
    if (lie) { parts.push(box([leg * 0.9, legW, legW], P(f + leg * 0.35, 0, s * 1.4), coat, { rotation: rot })); continue; }
    const hipY = (f > 0 ? backY - frontDrop : backY - rumpDrop) - depth * 0.25, swing = stride * phase * leg * 0.45 + (low && f > 0 ? leg * 0.35 : 0);
    if (sit && f < 0) { parts.push(box([leg * 0.9, legW * 1.3, legW * 1.4], P(f + leg * 0.2, 0, s), coat, { rotation: rot })); continue; }
    const foot = P(f + swing, 0, s), dx = -swing, dy = hipY, t = Math.atan2(Math.abs(dx), dy), angle = FRONT + (dx < 0 ? Math.PI : 0);
    parts.push(lean({ length: Math.hypot(dx, dy), radiusBottom: legW * 0.45, radiusTop: legW * 0.6, segments: 6 }, angle, t, foot, coat).part);
    parts.push(box([legW * 1.2, legW * 0.6, legW * 1.1], [foot[0] + fx * legW * 0.2, 0, foot[2] + fz * legW * 0.2], f > 0 && species === 'dog' && breed === 'sheepdog' ? mark : (species === 'cat' && breed === 'black' ? mark : coat), { rotation: rot }));
  }
  // Body: an ellipsoid tilted by the pose, a lighter chest/belly patch, shaggy or ruffed extras.
  const midY = backY - (frontDrop - rumpDrop) * 0 - (frontDrop + rumpDrop) / 2;
  parts.push(sphere([len / 2, depth / 2, width / 2], P(0, midY - depth / 2), coat, 1, { rotation: rot }));
  parts.push(sphere([len * 0.22, depth * 0.38, width * 0.4], P(len * 0.24, midY - depth * 0.42 - frontDrop * 0.4), mark, 1, { rotation: rot }));
  if (species === 'cat' && breed === 'tabby') for (const f of [-0.25, -0.05, 0.15]) parts.push(box([len * 0.06, depth * 0.08, width * 1.02], P(len * f, midY + depth * 0.36, 0), mark, { rotation: rot }));
  if (plan.shaggy) parts.push(sphere([len * 0.45, depth * 0.42, width * 0.58], P(-0.02, midY - depth * 0.3), coat, 1, { rotation: rot }));
  if (plan.ruff) parts.push(sphere([len * 0.2, depth * 0.62, width * 0.62], P(len * 0.3, midY - depth * 0.45 - frontDrop * 0.5), coat, 1, { rotation: rot }));
  if (species === 'wolf') parts.push(sphere([len * 0.3, depth * 0.2, width * 0.42], P(-len * 0.05, midY + depth * 0.18), mark === 'stone_light' ? 'hair_grey' : 'soot', 1, { rotation: rot }));
  // Head on a short neck, snout, ears, eyes; the attack pose opens the jaw.
  const neckLen = species === 'rat' ? 0 : head * 0.9, headF = len / 2 + head * 0.55, headY = midY + (lie ? head * 0.2 : depth * 0.45) - frontDrop * (low ? 0.9 : 0) + (sit ? head * 0.8 : 0);
  if (neckLen) parts.push(sphere([head * 0.75, head * 0.9, head * 0.7], P(len / 2 - head * 0.1, (midY + headY) / 2 - head * 0.6 - frontDrop * 0.3), coat, 1, { rotation: rot }));
  parts.push(sphere([head, head * 0.9, head * 0.95], P(headF, headY - head * 0.9), coat, 1, { rotation: rot }));
  if (plan.snout) {
    parts.push(box([plan.snout, head * 0.55, head * 0.6], P(headF + head * 0.6 + plan.snout * 0.35, headY - head * 1.05), species === 'wolf' ? coat : mark === 'cloth_linen' ? coat : mark, { rotation: rot }));
    parts.push(box([head * 0.25, head * 0.25, head * 0.3], P(headF + head * 0.62 + plan.snout * 0.85, headY - head * 0.62), 'soot', { rotation: rot }));
    if (pose === 'attack') parts.push(box([plan.snout * 0.9, head * 0.18, head * 0.5], P(headF + head * 0.5 + plan.snout * 0.4, headY - head * 1.35), 'cloth_red', { rotation: rot }), box([plan.snout * 0.85, head * 0.2, head * 0.55], P(headF + head * 0.5 + plan.snout * 0.45, headY - head * 1.6), coat, { rotation: rot }));
  } else parts.push(sphere([head * 0.45, head * 0.35, head * 0.45], P(headF + head * 0.75, headY - head * 0.9), mark, 0, { rotation: rot }));
  if (species === 'cat' && breed === 'white') parts.push(sphere([head * 0.55, head * 0.32, head * 0.5], P(headF - head * 0.1, headY - head * 0.2, head * 0.25), 'soot', 1, { rotation: rot })); // owner: a black patch on the head
  for (const s of [-1, 1]) {
    parts.push(sphere([head * 0.16, head * 0.16, head * 0.16], P(headF + head * 0.82, headY - head * 0.45, s * head * 0.4), species === 'cat' ? 'foliage_spring' : 'soot', 0));
    if (plan.ears === 'point') parts.push(cylinder({ radiusBottom: head * 0.32, radiusTop: 0, height: head * (species === 'wolf' ? 0.95 : 0.85), segments: 4 }, P(headF - head * 0.15, headY - head * 0.05, s * head * 0.5), coat));
    else if (plan.ears === 'flop') parts.push(box([head * 0.35, head * 0.9, head * 0.12], P(headF - head * 0.1, headY - head * 1.2, s * head * 0.95), species === 'dog' && breed === 'hound' ? 'horse_dark' : coat, { rotation: rot }));
    else parts.push(sphere([head * 0.35, head * 0.35, head * 0.12], P(headF - head * 0.2, headY - head * 0.15, s * head * 0.55), 'skin', 0, { rotation: rot }));
  }
  if (spec.collar) parts.push(cylinder({ radiusBottom: head * 0.72, radiusTop: head * 0.7, height: head * 0.25, segments: 10 }, P(len / 2 + head * 0.05, (midY + headY) / 2 - head * 0.7), spec.collar));
  // Tail: from the rump, up and back (cats curl it up; wolves carry it low; the attack pose raises it).
  const tail = plan.tail, rumpAt = P(-len / 2 + 0.01, midY - rumpDrop * 0.5 + (sit ? -depth * 0.3 : 0));
  const tailUp = sit ? 0.15 : pose === 'attack' ? 0.35 : tail.up + stride * 0.08;
  // Tail from the rump backwards: raised tails lean up from the rump; drooping ones (wolves) are built from the tip up,
  // because a lean cannot point below the horizontal.
  const back = FRONT + Math.PI + (sit ? 0.9 : 0), r0 = tail.radius * tail.bushy * 0.8, r1 = tail.radius * tail.bushy, tailMat = coat;
  let tip;
  if (tailUp >= 0) { const l = lean({ length: tail.length, radiusBottom: r0, radiusTop: r1, segments: 6 }, back, Math.PI / 2 - tailUp, rumpAt, tailMat); parts.push(l.part); tip = l.end; }
  else {
    tip = [rumpAt[0] + Math.cos(back) * Math.cos(tailUp) * tail.length, Math.max(0.02, rumpAt[1] + Math.sin(tailUp) * tail.length), rumpAt[2] + Math.sin(back) * Math.cos(tailUp) * tail.length];
    const dx = rumpAt[0] - tip[0], dy = rumpAt[1] - tip[1], dz = rumpAt[2] - tip[2], L = Math.hypot(dx, dy, dz);
    parts.push(lean({ length: L, radiusBottom: r1, radiusTop: r0, segments: 6 }, Math.atan2(dz, dx), Math.acos(dy / L), tip, tailMat).part);
  }
  if (species === 'wolf' || (species === 'cat' && breed !== 'black')) parts.push(sphere([r1 * 1.1, r1 * 1.1, r1 * 1.1], [tip[0], tip[1] - r1, tip[2]], species === 'wolf' ? 'soot' : mark, 0));
  // Extras: a bandage on a wounded dog, a rat under a pouncing cat.
  if (lie && species === 'dog') parts.push(cylinder({ radiusBottom: depth * 0.56, radiusTop: depth * 0.56, height: len * 0.14, segments: 10, tilt: [0, -Math.PI / 2] }, P(-len * 0.05, midY - depth * 0.05), 'cloth_linen'), sphere([0.012, 0.012, 0.012], P(-len * 0.02, midY + depth * 0.5), 'cloth_red', 0));
  if (pose === 'pounce' && species === 'cat') parts.push(...build({ species: 'rat' }, { footprint }).primitives.map(p => ({ ...p, at: [p.at[0] + fx * (len * 0.95), p.at[1], p.at[2] + fz * (len * 0.95)] })));
  // A wolf is nearly a tile long: like a horse it may overhang by the style allowance.
  const turned = spec.facing ? turnParts(parts, spec.facing * Math.PI / 4) : parts, out = species === 'wolf' ? turned.map(p => ({ ...p, overhang: true })) : turned;
  return { primitives: out, lights: [], height: Math.max(...out.map(p => p.at[1] + (p.size?.[1] ?? p.height ?? (p.radii ? p.radii[1] * 2 : 0)))) };
}

export default { id: 'animal', version: 1, label: 'Animal', params, build };
