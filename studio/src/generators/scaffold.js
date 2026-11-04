// Scaffolding recipe: the look of a construction site once builders start.
// Poles around the footprint, ledgers at every lift, plank decks on the two
// faces the camera sees, a ladder, rope lashings and an optional half-built
// core (stone courses or timber frame) inside. Stages follow the game's
// construction progress: low (≤33 %), mid (≤66 %), high.
import { box, cylinder, sphere, clamp } from './shapes.js';

export const params = [
  { key: 'stage', values: ['low', 'mid', 'high'], description: 'Construction stage: number of lifts and core height.' },
  { key: 'poles', values: ['round', 'squared'], description: 'Lashed round poles or sawn square timber.' },
  { key: 'core', values: ['none', 'stone', 'timber'], description: 'Half-built structure inside the scaffold.' },
  { key: 'lift', unit: 'units', description: 'Height of one scaffold lift (0.6–1.0).' },
  { key: 'ladder', description: 'Ladder on the left face.' },
  { key: 'materials', description: 'Stacked stone and planks beside the site.' },
];

const LIFTS = { low: 1, mid: 2, high: 3 };

export function build(spec, { footprint, style }) {
  const margin = style.scale.footprintMargin, lift = clamp(spec.lift ?? 0.8, 0.6, 1), lifts = LIFTS[spec.stage] ?? 2;
  const hx = footprint.width / 2 - margin - 0.04, hz = footprint.height / 2 - margin - 0.04, top = lifts * lift + 0.5;
  const parts = [], square = spec.poles === 'squared', pole = (x, z) => square ? box([0.06, top, 0.06], [x, 0, z], 'wood') : cylinder({ radiusBottom: 0.035, radiusTop: 0.03, height: top, segments: 6 }, [x, 0, z], 'wood');
  const xs = [-hx, 0, hx], zs = [-hz, 0, hz];
  for (const x of xs) for (const z of zs) if (Math.abs(x) === hx || Math.abs(z) === hz) parts.push(pole(x, z));
  // Core inside the scaffold.
  const inner = [footprint.width - 2 * margin - 0.5, footprint.height - 2 * margin - 0.5], coreHeight = Math.max(0.3, (lifts - 0.4) * lift);
  if (spec.core === 'stone') {
    const courses = Math.round(coreHeight / 0.18);
    for (let i = 0; i < courses; i++) parts.push(box([inner[0] - (i % 2) * 0.04, 0.17, inner[1] - (i % 2) * 0.04], [0, i * 0.18, 0], i === courses - 1 ? 'stone_light' : 'stone'));
  } else if (spec.core === 'timber') {
    parts.push(box([inner[0], 0.12, inner[1]], [0, 0, 0], 'stone_dark'));
    for (const x of [-inner[0] / 2 + 0.05, 0, inner[0] / 2 - 0.05]) for (const z of [-inner[1] / 2 + 0.05, inner[1] / 2 - 0.05]) parts.push(box([0.08, coreHeight, 0.08], [x, 0.12, z], 'wood_dark'));
    parts.push(box([inner[0], 0.07, 0.08], [0, 0.12 + coreHeight - 0.07, inner[1] / 2 - 0.05], 'wood_dark'), box([0.08, 0.07, inner[1]], [inner[0] / 2 - 0.05, 0.12 + coreHeight - 0.07, 0], 'wood_dark'));
  }
  // Ledgers and decks per lift; decks only on the camera-facing faces (+X, +Z).
  for (let i = 1; i <= lifts; i++) {
    const y = i * lift;
    for (const z of [-hz, hz]) parts.push(box([hx * 2, 0.04, 0.04], [0, y, z], 'wood_dark'));
    for (const x of [-hx, hx]) parts.push(box([0.04, 0.04, hz * 2], [x, y, 0], 'wood_dark'));
    parts.push(box([hx * 2, 0.04, 0.26], [0, y + 0.04, hz - 0.13], 'wood'), box([0.26, 0.04, hz * 2 - 0.26], [hx - 0.13, y + 0.04, -0.13], 'wood'));
    // Guard rail half a lift above the deck.
    parts.push(box([hx * 2, 0.03, 0.03], [0, y + 0.42, hz], 'wood'), box([0.03, 0.03, hz * 2], [hx, y + 0.42, 0], 'wood'));
    if (!square) for (const [x, z] of [[hx, hz], [-hx, hz], [hx, -hz]]) parts.push(sphere([0.045, 0.03, 0.045], [x, y - 0.02, z], 'cloth_linen', 0));
  }
  if (spec.ladder !== false) {
    const lx = -hx + 0.25, lz = hz + 0.02, height = Math.min(top, lift * lifts + 0.3);
    parts.push(box([0.03, height, 0.03], [lx - 0.1, 0, lz], 'wood'), box([0.03, height, 0.03], [lx + 0.1, 0, lz], 'wood'));
    for (let y = 0.15; y < height; y += 0.18) parts.push(box([0.2, 0.025, 0.025], [lx, y, lz], 'wood_dark'));
  }
  if (spec.materials) {
    parts.push(box([0.3, 0.12, 0.2], [hx - 0.25, 0, hz + 0.0], 'stone'), box([0.26, 0.1, 0.18], [hx - 0.25, 0.12, hz + 0.0], 'stone_light'));
    parts.push(box([0.42, 0.04, 0.1], [-0.05, 0, hz - 0.02], 'wood'), box([0.42, 0.04, 0.1], [-0.05, 0.04, hz - 0.02], 'wood_dark'));
  }
  return { primitives: parts, lights: [], height: top };
}

export default { id: 'scaffold', version: 1, label: 'Construction scaffold', params, build };
