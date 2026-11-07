// Animal recipe (plans g-domaci-zvirata-grafika, g-noc-grafika): cats, kittens, hunting dogs, rats and wolves.
// Four-legged bodies built like the horse in shapes.js, but small and with species-specific heads, ears and tails.
// Like the figure recipe it takes `facing` (eighths of a turn, 0 = towards the viewer) and `stride` (−1…1) so the
// Studio can show and export walk cycles in eight directions, and a `pose` for the still frames the game needs.
import { box, cylinder, sphere, lean, turnParts } from './shapes.js';

export const params = [
  { key: 'species', values: ['cat', 'dog', 'rat', 'wolf'], description: 'Kind of animal.' },
  { key: 'breed', description: 'dog: hound, sheepdog or mastiff; cat: tabby, black, ginger or kitten; wolf: grey or dark.' },
  { key: 'coat', description: 'Main fur material.' },
  { key: 'marking', description: 'Second fur material: chest, socks, stripes or saddle.' },
  { key: 'pose', values: ['stand', 'sit', 'pounce', 'lie', 'attack', 'run'], description: 'Still pose: standing, sitting, pouncing (cat on a rat), lying wounded with a bandage (dog), lunging attack (wolf), run (long stride).' },
  { key: 'collar', description: 'Collar material (dogs).' },
  { key: 'facing', description: 'Turn in eighths of a full circle (0–7); 0 faces the viewer.' },
  { key: 'stride', description: 'Walk pose −1…1 for animation frames.' },
];

// Body plans in units: length, height of the back, body depth and width, leg length, head size, tail.
const PLANS = {
  cat: { len: 0.26, back: 0.17, depth: 0.09, width: 0.09, leg: 0.09, head: 0.055, ears: 'point', tail: { length: 0.22, radius: 0.016, up: 0.9, bushy: 1 } },
  kitten: { len: 0.16, back: 0.11, depth: 0.065, width: 0.065, leg: 0.06, head: 0.045, ears: 'point', tail: { length: 0.12, radius: 0.012, up: 1.1, bushy: 1 } },
  hound: { len: 0.44, back: 0.32, depth: 0.13, width: 0.12, leg: 0.2, head: 0.07, snout: 0.09, ears: 'flop', tail: { length: 0.22, radius: 0.016, up: 0.3, bushy: 1 } },
  sheepdog: { len: 0.42, back: 0.3, depth: 0.16, width: 0.15, leg: 0.16, head: 0.08, snout: 0.07, ears: 'flop', tail: { length: 0.2, radius: 0.03, up: 0.05, bushy: 1.6 }, shaggy: true },
  mastiff: { len: 0.48, back: 0.36, depth: 0.19, width: 0.18, leg: 0.19, head: 0.1, snout: 0.07, ears: 'flop', tail: { length: 0.18, radius: 0.02, up: 0.2, bushy: 1 } },
  rat: { len: 0.13, back: 0.07, depth: 0.05, width: 0.05, leg: 0.03, head: 0.03, snout: 0.035, ears: 'round', tail: { length: 0.16, radius: 0.006, up: 0.15, bushy: 1 } },
  wolf: { len: 0.56, back: 0.4, depth: 0.17, width: 0.15, leg: 0.24, head: 0.085, snout: 0.11, ears: 'point', tail: { length: 0.3, radius: 0.04, up: -0.45, bushy: 1.5 }, ruff: true },
};
const COATS = {
  cat: { tabby: ['hair_brown', 'hair_dark'], black: ['soot', 'cloth_linen'], ginger: ['hair_auburn', 'cloth_linen'], kitten: ['hair_grey', 'cloth_linen'] },
  dog: { hound: ['horse_chestnut', 'cloth_linen'], sheepdog: ['soot', 'cloth_linen'], mastiff: ['hair_brown', 'horse_dark'] },
  rat: { rat: ['stone_dark', 'hair_grey'] },
  wolf: { grey: ['horse_grey', 'stone_light'], dark: ['stone_dark', 'horse_grey'] },
};
const FRONT = Math.PI / 4; // facing 0: the animal walks towards the viewer (+x +z), like the figure recipe

export function build(spec, { footprint }) {
  const species = spec.species ?? 'cat', breed = spec.breed ?? { cat: 'tabby', dog: 'hound', rat: 'rat', wolf: 'grey' }[species];
  const plan = PLANS[species === 'cat' ? (breed === 'kitten' ? 'kitten' : 'cat') : species === 'dog' ? breed : species];
  const [coatDefault, markDefault] = COATS[species][breed] ?? COATS[species][Object.keys(COATS[species])[0]];
  const coat = spec.coat ?? coatDefault, mark = spec.marking ?? markDefault, pose = spec.pose ?? 'stand', stride = Math.max(-1, Math.min(1, spec.stride ?? (pose === 'run' ? 1 : 0)));
  const fx = Math.cos(FRONT), fz = Math.sin(FRONT), sx = -fz, sz = fx, rot = -FRONT;
  const P = (f, up, s = 0) => [fx * f + sx * s, up, fz * f + sz * s];
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
