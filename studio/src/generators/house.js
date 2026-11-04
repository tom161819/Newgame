// House recipe: plinth, walls (plaster with timber frame, stone or planks),
// gable roof, door, shuttered windows, optional chimney and door lantern.
// Visible faces: "left" = +Z (sunlit), "right" = +X.
import { box, prism, clamp, lerp } from './shapes.js';

export const params = [
  { key: 'walls', values: ['timber', 'stone', 'wood'], description: 'Plaster with a timber frame, dressed stone, or planks.' },
  { key: 'width', unit: 'units', description: 'Size along grid x, clamped to the footprint.' },
  { key: 'depth', unit: 'units', description: 'Size along grid y, clamped to the footprint.' },
  { key: 'wallHeight', unit: 'units', description: 'Eave height above the plinth.' },
  { key: 'ridge', values: ['x', 'z'], description: 'Direction of the roof ridge.' },
  { key: 'roofHeight', unit: 'units', description: 'Height of the gable roof.' },
  { key: 'roofMaterial', description: 'roof_shingle, roof_tile or thatch.' },
  { key: 'windows', description: 'Windows per visible face (0–3).' },
  { key: 'chimney', description: 'Stone chimney through the roof.' },
  { key: 'lantern', description: 'Torch light beside the door (runtime flame and light).' },
];

export function build(spec, { footprint, style }) {
  const margin = style.scale.footprintMargin, overhang = 0.12, plinth = 0.14;
  const width = clamp(spec.width ?? 1.6, 0.8, footprint.width - margin * 2 - overhang * 2);
  const depth = clamp(spec.depth ?? 1.4, 0.8, footprint.height - margin * 2 - overhang * 2);
  const wallHeight = clamp(spec.wallHeight ?? 1.1, 0.7, 2.2), roofHeight = clamp(spec.roofHeight ?? 0.8, 0.3, 1.6);
  const wallMaterial = spec.walls === 'stone' ? 'stone_light' : spec.walls === 'wood' ? 'wood' : 'plaster';
  const parts = [box([width + 0.06, plinth, depth + 0.06], [0, 0, 0], 'stone_dark'), box([width, wallHeight, depth], [0, plinth, 0], wallMaterial)];
  const top = plinth + wallHeight, lights = [];
  const left = (offset, y, [w, h], material, out = 0.025) => box([w, h, 0.04], [offset, y, depth / 2 + out - 0.02], material);
  const right = (offset, y, [w, h], material, out = 0.025) => box([0.04, h, w], [width / 2 + out - 0.02, y, offset], material);

  if (spec.walls === 'timber' || spec.walls === undefined) {
    for (const x of [-width / 2 + 0.05, 0, width / 2 - 0.05]) parts.push(left(x, plinth, [0.08, wallHeight], 'wood_dark'));
    for (const z of [-depth / 2 + 0.05, depth / 2 - 0.05]) parts.push(right(z, plinth, [0.08, wallHeight], 'wood_dark'));
    parts.push(left(0, plinth + wallHeight * 0.48, [width, 0.07], 'wood_dark'), right(0, plinth + wallHeight * 0.48, [depth, 0.07], 'wood_dark'));
    parts.push(left(0, top - 0.07, [width, 0.07], 'wood_dark'), right(0, top - 0.07, [depth, 0.07], 'wood_dark'));
  }

  const doorX = -width * 0.18;
  parts.push(left(doorX, plinth, [0.36, 0.72], 'wood_dark', 0.035));
  const windows = clamp(Math.round(spec.windows ?? 1), 0, 3);
  for (let i = 0; i < windows; i++) {
    const t = windows === 1 ? 0.5 : i / (windows - 1);
    const y = plinth + wallHeight * 0.55;
    parts.push(right(lerp(-depth / 2 + 0.3, depth / 2 - 0.3, t), y, [0.22, 0.24], 'opening', 0.03));
    parts.push(right(lerp(-depth / 2 + 0.3, depth / 2 - 0.3, t) - 0.17, y, [0.1, 0.26], 'wood', 0.04));
    if (i === windows - 1) parts.push(left(width * 0.22, y, [0.22, 0.24], 'opening', 0.03), left(width * 0.22 + 0.17, y, [0.1, 0.26], 'wood', 0.04));
  }

  const alongX = spec.ridge === 'x';
  const roofW = (alongX ? depth : width) + overhang * 2, roofD = (alongX ? width : depth) + overhang * 2;
  parts.push(prism([roofW, roofHeight, roofD], [0, top, 0], spec.roofMaterial ?? 'roof_shingle', alongX ? { rotation: Math.PI / 2 } : {}));

  if (spec.chimney) {
    const cx = alongX ? width * 0.2 : -width * 0.25, cz = alongX ? -depth * 0.22 : -depth * 0.1;
    parts.push(box([0.22, roofHeight + 0.35, 0.22], [cx, top, cz], 'stone'));
  }
  if (spec.lantern) {
    parts.push(left(doorX + 0.32, plinth + 0.66, [0.06, 0.1], 'iron', 0.07));
    lights.push({ type: 'torch', at: [doorX + 0.32, plinth + 0.9, depth / 2 + 0.1] });
  }
  return { primitives: parts, lights, height: top + Math.max(roofHeight, spec.chimney ? roofHeight + 0.35 : 0) };
}

export default { id: 'house', version: 1, label: 'House', params, build };
