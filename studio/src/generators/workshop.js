// Workshop recipe: a production building plus the props that tell what it
// makes. The main body is one of a few kinds (a house from the house recipe,
// a granary raised on staddle stones, a tower windmill, an open furnace shed or
// a big barn) placed off-centre so a yard is left for sacks, barrels, hay,
// logs, an oven or ore. Each prop is listed in the spec, so new buildings are
// mostly data: see studio/src/generators/props.js for the catalogue.
import houseRecipe from './house.js';
import { box, cylinder, prism, sphere, clamp, squareFrustum } from './shapes.js';
import { PROPS, PROP_TYPES } from './props.js';
import './props-village.js';
import './props-vehicles.js';

export const params = [
  { key: 'body.kind', values: ['house', 'raised', 'windmill', 'furnace', 'barn', 'shed', 'hall', 'mine', 'none'], description: 'Main structure: house, granary on staddle stones, tower windmill with sails, bloomery furnace, big barn, open lean-to shed (posts, sloping roof, low back wall; work stays visible underneath), open market hall (posts carrying a gable roof, open on all sides), mine (rocky hill over an ore deposit with a timbered adit on its +z face), or none (props only, e.g. equipment).' },
  { key: 'body', description: 'House parameters (walls, width, depth, wallHeight, ridge, roofHeight, roofMaterial, windows, chimney, lantern) or the kind-specific ones.' },
  { key: 'body.at', unit: 'units', description: '[x, z] centre of the body; the rest of the footprint is the yard.' },
  { key: 'body.ironBands', description: 'Barn: iron bands across the double doors (armory).' },
  { key: 'props', description: `List of { type, at: [x, z], …options }. Types: ${PROP_TYPES.join(', ')}.` },
];

const shift = (parts, dx, dz, dy = 0) => parts.map(p => ({ ...p, at: [p.at[0] + dx, p.at[1] + dy, p.at[2] + dz] }));
const shiftLights = (lights, dx, dz, dy = 0) => lights.map(l => ({ ...l, at: [l.at[0] + dx, l.at[1] + dy, l.at[2] + dz] }));

function body(spec, style) {
  const kind = spec.kind ?? 'house';
  if (kind === 'house' || kind === 'raised') {
    const width = spec.width ?? 1.4, depth = spec.depth ?? 1.2, lift = kind === 'raised' ? clamp(spec.lift ?? 0.28, 0.15, 0.5) : 0;
    const built = houseRecipe.build(spec, { footprint: { width: width + 0.5, height: depth + 0.5 }, style });
    const parts = shift(built.primitives, 0, 0, lift);
    if (lift) for (const x of [-width / 2 + 0.12, 0, width / 2 - 0.12]) for (const z of [-depth / 2 + 0.12, depth / 2 - 0.12]) parts.push(cylinder({ radiusBottom: 0.07, radiusTop: 0.04, height: lift - 0.05, segments: 8 }, [x, 0, z], 'stone'), cylinder({ radiusBottom: 0.1, height: 0.05, segments: 8 }, [x, lift - 0.05, z], 'stone_light'));
    if (lift) parts.push(box([0.24, lift, 0.2], [-width * 0.18, 0, depth / 2 + 0.14], 'wood_dark'));
    return { parts, lights: shiftLights(built.lights, 0, 0, lift) };
  }
  if (kind === 'windmill') {
    const r = clamp(spec.radius ?? 0.5, 0.35, 0.6), h = clamp(spec.height ?? 1.7, 1.2, 2.4), sail = clamp(spec.sail ?? 0.75, 0.4, 0.9), wood = spec.walls === 'wood';
    const parts = [cylinder({ radiusBottom: r, radiusTop: r * 0.78, height: h, segments: wood ? 8 : 14 }, [0, 0, 0], wood ? 'wood' : 'plaster'),
      cylinder({ radiusBottom: r * 0.86, radiusTop: 0, height: 0.55, segments: wood ? 8 : 14 }, [0, h, 0], spec.roofMaterial ?? 'thatch'),
      box([0.26, 0.5, 0.04], [r * 0.62, 0, r * 0.62], 'wood_dark', { rotation: Math.PI / 4 }),
      box([0.16, 0.16, 0.03], [r * 0.56 + 0.03, h * 0.62, r * 0.56 + 0.03], 'opening', { rotation: Math.PI / 4 })];
    // Sails in the plane facing the camera: a "+" of lattice blades on a hub.
    const hub = [r * 0.72 + 0.06, h - 0.05, r * 0.72 + 0.06];
    // The hub and sails are tagged as the `rotor` layer (#99): the export adds a still sprite without them and a
    // sails-only sprite with the hub as pivot, so the game can turn the sails alone. Pixels of the full sprite are unchanged.
    const rotor = [sphere([0.06, 0.06, 0.06], [hub[0], hub[1] - 0.06, hub[2]], 'wood_dark', 0),
      box([0.17, sail * 2, 0.025], [hub[0] + 0.02, hub[1] - sail, hub[2] + 0.02], 'wood', { rotation: Math.PI / 4 }),
      box([sail * 2, 0.17, 0.025], [hub[0] + 0.02, hub[1] - 0.085, hub[2] + 0.02], 'wood', { rotation: Math.PI / 4 }),
      box([0.03, sail * 2, 0.03], [hub[0] + 0.035, hub[1] - sail, hub[2] + 0.035], 'cloth_linen', { rotation: Math.PI / 4 })];
    parts.push(...rotor.map(part => ({ ...part, layer: 'rotor' })));
    return { parts, lights: [], pivot: [hub[0] + 0.02, hub[1] - 0.06, hub[2] + 0.02] };
  }
  if (kind === 'furnace') {
    // Bloomery: tapered stone stack, chimney, glowing mouth and bellows; `size` scales it.
    const k = clamp(spec.size ?? 1, 0.8, 1.6);
    const parts = [cylinder({ radiusBottom: 0.34 * k, radiusTop: 0.2 * k, height: 0.9 * k, segments: 10 }, [0, 0, 0], 'stone'), cylinder({ radiusBottom: 0.12 * k, radiusTop: 0.1 * k, height: 0.5 * k, segments: 8 }, [0, 0.9 * k, 0], 'stone_dark'),
      box([0.05, 0.2 * k, 0.18 * k], [0.21 * k, 0.08, 0.21 * k], 'opening', { rotation: Math.PI / 4 })];
    parts.push(box([0.2 * k, 0.08 * k, 0.14 * k], [-0.3 * k, 0.12, 0.22 * k], 'leather', { rotation: Math.PI / 4 }));
    return { parts, lights: [{ type: 'brazier', at: [0.27 * k, 0.2, 0.27 * k] }] };
  }
  if (kind === 'barn') {
    const width = spec.width ?? 2.2, depth = spec.depth ?? 1.6, wall = spec.wallHeight ?? 1.2;
    const built = houseRecipe.build({ ...spec, walls: spec.walls ?? 'wood', windows: spec.windows ?? 0 }, { footprint: { width: width + 0.5, height: depth + 0.5 }, style });
    const parts = built.primitives;
    // Wide double doors on the left face and a hayloft hatch.
    parts.push(box([0.7, 0.85, 0.04], [width * 0.1, 0.14, depth / 2 + 0.02], 'wood_dark'), box([0.02, 0.85, 0.05], [width * 0.1, 0.14, depth / 2 + 0.03], 'iron'));
    parts.push(box([0.3, 0.26, 0.04], [width * 0.1, 0.14 + wall - 0.3, depth / 2 + 0.02], 'opening'));
    if (spec.ironBands) for (const y of [0.3, 0.6, 0.85]) parts.push(box([0.72, 0.04, 0.05], [width * 0.1, y, depth / 2 + 0.04], 'iron'));
    return { parts, lights: built.lights };
  }
  if (kind === 'shed') {
    // Open lean-to work shed (#119): posts carry a roof that slopes down to a low plank back wall, so the
    // benches, beams and tools underneath stay visible from the isometric camera (front faces +x and +z).
    const width = clamp(spec.width ?? 1.5, 0.8, 2.6), depth = clamp(spec.depth ?? 1.0, 0.6, 1.5), front = clamp(spec.frontHeight ?? 0.85, 0.6, 1.2), back = clamp(spec.backHeight ?? 0.55, 0.35, front), roof = spec.roofMaterial ?? 'roof_shingle';
    const parts = [];
    for (const x of [-width / 2 + 0.04, 0, width / 2 - 0.04]) parts.push(box([0.06, front, 0.06], [x, 0, depth / 2 - 0.04], 'wood_dark'), box([0.06, back, 0.06], [x, 0, -depth / 2 + 0.04], 'wood_dark'));
    // Back wall of planks up to the low eave, a beam under each eave, the sloping roof as thin overlapping steps.
    if (spec.backWall !== false) parts.push(box([width - 0.04, back * 0.8, 0.04], [0, 0, -depth / 2 + 0.03], 'wood'));
    parts.push(box([width + 0.04, 0.05, 0.06], [0, front - 0.05, depth / 2 - 0.04], 'wood_dark'), box([width + 0.04, 0.05, 0.06], [0, back - 0.05, -depth / 2 + 0.04], 'wood_dark'));
    const steps = 6;
    for (let i = 0; i < steps; i++) { const t = (i + 0.5) / steps, z = -depth / 2 - 0.08 + t * (depth + 0.22), y = back + (front - back) * t; parts.push(box([width + 0.1, 0.035, (depth + 0.22) / steps + 0.03], [0, y, z], roof)); }
    // Side walls: true or 'left' closes the -x end (low, under the back eave); 'right' or 'both' also closes the +x end
    // the camera sees, as a plank wall up to the sloping roof with a small window, so the shed reads as a workshop.
    if (spec.sideWall === true || spec.sideWall === 'left' || spec.sideWall === 'both') parts.push(box([0.04, back * 0.8, depth - 0.1], [-width / 2 + 0.03, 0, 0], 'wood'));
    if (spec.sideWall === 'right' || spec.sideWall === 'both') {
      const x = width / 2 - 0.03;
      for (let i = 0; i < 4; i++) { const t0 = i / 4, t1 = (i + 1) / 4, h = back + (front - back) * ((t0 + t1) / 2) - 0.04; parts.push(box([0.04, h, (depth - 0.08) / 4], [x, 0, -depth / 2 + 0.04 + (depth - 0.08) * (t0 + t1) / 2], 'wood')); }
      parts.push(box([0.05, 0.05, depth - 0.06], [x + 0.005, 0.02, 0], 'wood_dark'), box([0.05, 0.05, depth - 0.06], [x + 0.005, back * 0.75, 0], 'wood_dark'));
      parts.push(box([0.045, 0.14, 0.16], [x + 0.005, back * 0.35, 0.02], 'opening'));
    }
    return { parts, lights: spec.lantern ? [{ type: 'torch', at: [width / 2 - 0.1, front - 0.12, depth / 2 - 0.02] }] : [] };
  }
  if (kind === 'hall') {
    // Open market hall (obchod F1): timber posts on stone pads carrying a gable roof, open on every side, so the
    // stalls and goods underneath stay visible. Ridge along x by default.
    const width = clamp(spec.width ?? 2.2, 1.2, 2.7), depth = clamp(spec.depth ?? 1.4, 0.8, 2.0), eave = clamp(spec.wallHeight ?? 0.9, 0.7, 1.3), roofHeight = clamp(spec.roofHeight ?? 0.6, 0.3, 1.0);
    const parts = [box([width + 0.06, 0.05, depth + 0.06], [0, 0, 0], spec.floor ?? 'stone_light')], posts = Math.max(2, Math.round(width / 0.6));
    for (let i = 0; i <= posts; i++) for (const z of [-depth / 2 + 0.05, depth / 2 - 0.05]) { const x = -width / 2 + 0.05 + i * (width - 0.1) / posts; parts.push(box([0.1, 0.06, 0.1], [x, 0.05, z], 'stone'), box([0.07, eave - 0.05, 0.07], [x, 0.1, z], 'wood_dark')); }
    for (const z of [-depth / 2 + 0.05, depth / 2 - 0.05]) parts.push(box([width, 0.07, 0.08], [0, eave, z], 'wood_dark'));
    for (const x of [-width / 2 + 0.05, width / 2 - 0.05]) parts.push(box([0.08, 0.07, depth], [x, eave, 0], 'wood_dark'));
    parts.push(prism([depth + 0.24, roofHeight, width + 0.24], [0, eave + 0.07, 0], spec.roofMaterial ?? 'roof_tile', { rotation: Math.PI / 2 }));
    return { parts, lights: spec.lantern ? [{ type: 'torch', at: [width / 2 - 0.05, eave - 0.1, depth / 2 + 0.02] }] : [] };
  }
  if (kind === 'mine') {
    // Iron mine (#92 revision): a rocky hill over the deposit built from low-poly boulders, rust-red ore veins on the
    // slopes the camera sees and a timbered adit in a cut face toward the camera (+z), with a plank hood and a torch.
    // `width`/`depth` size the main mound, `height` its top; `aditX` moves the entrance along the face.
    const rx = clamp(spec.width ?? 1.7, 1.0, 2.4) / 2, rz = clamp(spec.depth ?? 1.3, 0.8, 2.0) / 2, ry = clamp(spec.height ?? 0.9, 0.5, 1.4) / 2, adit = spec.aditX ?? 0.1, cz = -rz * 0.25;
    // Front (+z) and right (+x) surface of the main mound, so veins and the portal sit on it.
    const front = (x, y) => cz + rz * Math.sqrt(Math.max(0, 1 - (x / rx) ** 2 - ((y - ry) / ry) ** 2));
    const right = (z, y) => rx * Math.sqrt(Math.max(0, 1 - ((z - cz) / rz) ** 2 - ((y - ry) / ry) ** 2));
    const parts = [
      sphere([rx, ry, rz], [0, 0, cz], 'rock', 2),
      sphere([rx * 0.62, ry * 0.7, rz * 0.7], [-rx * 0.62, 0, cz + rz * 0.35], 'fieldstone_dark', 1),
      sphere([rx * 0.6, ry * 0.62, rz * 0.62], [rx * 0.55, 0, cz - rz * 0.45], 'rock', 1),
      sphere([rx * 0.45, ry * 0.42, rz * 0.45], [-rx * 0.2, ry * 1.3, cz - rz * 0.3], 'fieldstone_dark', 1),
      sphere([rx * 0.22, ry * 0.25, rz * 0.24], [rx * 0.25, ry * 1.55, cz - rz * 0.1], 'rock', 1),
    ];
    for (const [x, z, r, m] of [[-rx * 1.05, cz + rz * 0.95, 0.13, 'rock'], [rx * 1.0, cz + rz * 0.6, 0.11, 'fieldstone_dark'], [rx * 0.75, cz + rz * 1.05, 0.08, 'rock']]) parts.push(sphere([r, r * 0.7, r * 0.9], [x, 0, z], m, 1));
    // Veins: clusters of rust-red ore lumps half sunk into the slopes.
    for (const [x, y, r] of [[adit + 0.45, ry * 0.85, 0.11], [adit + 0.58, ry * 1.15, 0.08], [adit - 0.48, ry * 1.0, 0.1], [adit - 0.6, ry * 0.7, 0.07], [rx * 0.72, ry * 0.4, 0.09], [-rx * 0.1, ry * 1.55, 0.09]]) parts.push(sphere([r, r * 0.7, r * 0.6], [x, y, front(x, y + r * 0.35) - r * 0.35], 'ore', 1));
    for (const [z, y, r] of [[cz + rz * 0.35, ry * 0.75, 0.1], [cz - rz * 0.15, ry * 1.15, 0.09], [cz + rz * 0.05, ry * 0.45, 0.07]]) parts.push(sphere([r * 0.6, r * 0.7, r], [right(z, y + r * 0.35) - r * 0.35, y, z], 'ore', 1));
    // Moss and scrub on the crown and around the foot tie the hill into the ground.
    for (const [x, y, z, r] of [[-rx * 0.3, ry * 2 + 0.05, cz - rz * 0.35, 0.2], [rx * 0.3, ry * 2.4, cz - rz * 0.2, 0.14], [-rx * 0.7, ry * 1.2, cz + rz * 0.2, 0.16], [rx * 0.75, ry * 1.1, cz - rz * 0.5, 0.15]]) parts.push(sphere([r, r * 0.35, r * 0.8], [x, y - r * 0.2, z], 'moss', 1));
    for (const [x, z, r] of [[-rx * 0.95, cz + rz * 0.55, 0.1], [rx * 1.05, cz - rz * 0.1, 0.09], [-rx * 0.35, cz + rz * 1.0, 0.07]]) parts.push(sphere([r, r * 0.7, r], [x, 0, z], 'grass_scrub', 1));
    // The adit: a cut face of dressed stone, a dark opening, two posts and a lintel, a plank hood, trodden soil in front.
    const oh = 0.46, fz = front(adit, oh * 0.5) + 0.04;
    parts.push(box([0.7, oh + 0.18, 0.34], [adit, 0, fz - 0.2], 'fieldstone'));
    parts.push(box([0.32, oh - 0.03, 0.05], [adit, 0.01, fz - 0.03], 'soot'));
    for (const dx of [-0.2, 0.2]) parts.push(box([0.08, oh, 0.08], [adit + dx, 0, fz + 0.02], 'wood_dark'));
    parts.push(box([0.54, 0.08, 0.1], [adit, oh, fz + 0.02], 'wood_dark'), box([0.64, 0.035, 0.2], [adit, oh + 0.08, fz + 0.04], 'roof_shingle'));
    parts.push(box([0.44, 0.012, 0.3], [adit, 0, fz + 0.18], 'soil'));
    return { parts, lights: [{ type: 'torch', at: [adit + 0.27, oh - 0.1, fz + 0.06] }], adit: [adit, fz + 0.36] };
  }
  throw new RangeError(`Unknown workshop body ${kind}`);
}

export function build(spec, { footprint, style }) {
  const made = spec.body?.kind === 'none' ? { parts: [], lights: [] } : body(spec.body ?? {}, style), [bx, bz] = spec.body?.at ?? [0, 0];
  const parts = shift(made.parts, bx, bz), lights = shiftLights(made.lights, bx, bz);
  for (const prop of spec.props ?? []) {
    const helper = PROPS[prop.type];
    if (!helper) throw new RangeError(`Unknown prop ${prop.type}`);
    const made = prop.type === 'fence' ? helper(...prop.from, ...prop.to) : helper(prop.at[0], prop.at[1], prop);
    parts.push(...made);
    if (made.lights) lights.push(...made.lights);
  }
  if (spec.ground) parts.unshift(box([footprint.width - 0.18, 0.02, footprint.height - 0.18], [0, 0, 0], spec.ground));
  let height = 0;
  for (const p of parts) height = Math.max(height, p.at[1] + (p.size?.[1] ?? p.height ?? (p.radii ? p.radii[1] * 2 : 0)));
  return { primitives: parts, lights, height, ...(made.pivot ? { rotor: { at: [made.pivot[0] + bx, made.pivot[1], made.pivot[2] + bz] } } : {}) };
}

export default { id: 'workshop', version: 1, label: 'Workshop with props', params, build };
