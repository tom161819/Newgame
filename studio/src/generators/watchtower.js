// Watchtower recipe: plinth, square or round shaft, crenellated platform or a
// timber hoarding, optional roof, door, arrow slits, banner and wall torches.
// Visible faces in the game camera: "left" = +Z (lit by the sun), "right" = +X.
import { box, cylinder, squareFrustum, pyramid, lerp, clamp } from './shapes.js';

export const params = [
  { key: 'body', values: ['square', 'round'], description: 'Shaft shape.' },
  { key: 'width', unit: 'tiles', description: 'Shaft width at the base, clamped to the footprint minus the style margin.' },
  { key: 'height', unit: 'units', description: 'Height of the stone shaft including the plinth.' },
  { key: 'taper', description: 'Top width as a fraction of the base width (0.8–1).' },
  { key: 'material', description: 'Shaft material id from the style guide.' },
  { key: 'plinth', description: 'Plinth material id, or null for none.' },
  { key: 'top', values: ['crenellated', 'hoarding'], description: 'Battlements or an overhanging timber gallery.' },
  { key: 'roof', values: ['none', 'cone', 'pyramid'], description: 'Roof above the top.' },
  { key: 'slits', description: 'Arrow slits per visible face (0–4).' },
  { key: 'banner', description: 'Kingdom banner on the right face.' },
  { key: 'torches', description: 'Wall torches: { face: left|right, offset, height }. Flames and light are added at runtime.' },
];

export function build(spec, { footprint, style }) {
  const margin = style.scale.footprintMargin;
  const maxWidth = Math.min(footprint.width, footprint.height) - margin * 2;
  const round = spec.body === 'round';
  const width = clamp(spec.width ?? 1.6, 0.6, maxWidth - 0.24);
  const height = clamp(spec.height ?? 3.6, 1.4, 6);
  const taper = clamp(spec.taper ?? 0.95, 0.75, 1);
  const material = spec.material ?? 'stone';
  const plinthHeight = spec.plinth ? 0.28 : 0;
  const parts = [], lights = [];

  // Half-extent of the shaft surface at a given height (square half-side or radius).
  const halfAt = y => lerp(width / 2, width * taper / 2, clamp((y - plinthHeight) / (height - plinthHeight), 0, 1));
  const surface = (face, offset, y, out = 0) => {
    const h = halfAt(y) + out;
    if (round) {
      const angle = (face === 'left' ? Math.PI / 2 : 0) + offset;
      return [Math.cos(angle) * h, y, Math.sin(angle) * h];
    }
    return face === 'left' ? [offset, y, h] : [h, y, offset];
  };
  // A thin box flat against a visible face; for round shafts it is rotated to the tangent.
  const onFace = (face, offset, y, size, materialId, out = 0.02) => {
    const [w, h, d] = size, at = surface(face, offset, y, out - d / 2);
    if (round) {
      const angle = (face === 'left' ? Math.PI / 2 : 0) + offset;
      return box([d, h, w], at, materialId, { rotation: -angle });
    }
    return face === 'left' ? box([w, h, d], at, materialId) : box([d, h, w], at, materialId);
  };

  if (plinthHeight) {
    const plinthWidth = width + 0.14;
    parts.push(round
      ? cylinder({ radiusBottom: plinthWidth / 2, radiusTop: plinthWidth / 2 - 0.02, height: plinthHeight, segments: 22 }, [0, 0, 0], spec.plinth)
      : squareFrustum(plinthWidth, plinthHeight, 0.97, [0, 0, 0], spec.plinth));
  }
  parts.push(round
    ? cylinder({ radiusBottom: width / 2, radiusTop: width * taper / 2, height: height - plinthHeight, segments: 22 }, [0, plinthHeight, 0], material)
    : squareFrustum(width, height - plinthHeight, taper, [0, plinthHeight, 0], material));

  // Door with a lighter stone frame on the sunlit face.
  parts.push(onFace('left', 0, 0, [0.5, 0.98, 0.06], 'stone_light', 0.03));
  parts.push(onFace('left', 0, 0, [0.38, 0.86, 0.07], 'wood_dark', 0.06));

  const slits = clamp(Math.round(spec.slits ?? 2), 0, 4);
  for (let i = 0; i < slits; i++) {
    const y = lerp(1.35, height - 0.65, slits === 1 ? 0.5 : i / (slits - 1));
    parts.push(onFace('right', 0, y, [0.08, 0.36, 0.05], 'opening', 0.03));
    if (i > 0 || slits === 1) parts.push(onFace('left', round ? -0.25 : -0.18, y + 0.2, [0.08, 0.36, 0.05], 'opening', 0.03));
  }

  const topWidth = width * taper;
  let topY = height;
  if (spec.top === 'hoarding') {
    const hoardWidth = Math.min(topWidth + 0.26, maxWidth - 0.06), hoardHeight = clamp(spec.hoardingHeight ?? 1, 0.6, 1.6);
    const wood = spec.hoardingMaterial ?? 'wood';
    // Corbels under the gallery, then the gallery box, corner posts and openings.
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1]]) parts.push(box([0.12, 0.3, 0.12], [x * (topWidth / 2 - 0.02), height - 0.3, z * (topWidth / 2 - 0.02)], 'wood_dark'));
    parts.push(box([hoardWidth, hoardHeight, hoardWidth], [0, height, 0], wood));
    for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) parts.push(box([0.1, hoardHeight + 0.04, 0.1], [x * (hoardWidth / 2 - 0.03), height, z * (hoardWidth / 2 - 0.03)], 'wood_dark'));
    for (const offset of [-0.32, 0.32]) {
      parts.push(box([0.24, 0.26, 0.04], [offset, height + hoardHeight * 0.45, hoardWidth / 2 + 0.005], 'opening'));
      parts.push(box([0.04, 0.26, 0.24], [hoardWidth / 2 + 0.005, height + hoardHeight * 0.45, offset], 'opening'));
    }
    topY = height + hoardHeight;
    if (spec.roof === 'pyramid' || spec.roof === 'cone') {
      const roofWidth = Math.min(hoardWidth + 0.14, maxWidth);
      parts.push(spec.roof === 'cone'
        ? cylinder({ radiusBottom: roofWidth / 2, radiusTop: 0, height: spec.roofHeight ?? 1, segments: 20 }, [0, topY, 0], spec.roofMaterial ?? 'roof_shingle')
        : pyramid(roofWidth, spec.roofHeight ?? 1, [0, topY, 0], spec.roofMaterial ?? 'roof_shingle'));
      topY += spec.roofHeight ?? 1;
    }
  } else {
    // Projecting corbel course, platform and merlons.
    const ledge = Math.min(topWidth + 0.16, maxWidth - 0.04), ledgeHeight = 0.16, merlonHeight = 0.28;
    parts.push(round
      ? cylinder({ radiusBottom: ledge / 2 - 0.04, radiusTop: ledge / 2, height: ledgeHeight, segments: 22 }, [0, height, 0], 'stone_light')
      : squareFrustum(ledge - 0.06, ledgeHeight, (ledge) / (ledge - 0.06), [0, height, 0], 'stone_light'));
    const merlonY = height + ledgeHeight;
    if (round) {
      const count = 10, radius = ledge / 2 - 0.08;
      for (let i = 0; i < count; i++) {
        const angle = i / count * Math.PI * 2;
        parts.push(box([0.2, merlonHeight, 0.14], [Math.cos(angle) * radius, merlonY, Math.sin(angle) * radius], material, { rotation: -angle + Math.PI / 2 }));
      }
    } else {
      const perSide = 3, inset = ledge / 2 - 0.07;
      for (let i = 0; i < perSide; i++) {
        const t = lerp(-inset + 0.07, inset - 0.07, i / (perSide - 1));
        for (const [x, z, w, d] of [[t, inset, 0.22, 0.14], [t, -inset, 0.22, 0.14], [inset, t, 0.14, 0.22], [-inset, t, 0.14, 0.22]]) parts.push(box([w, merlonHeight, d], [x, merlonY, z], material));
      }
    }
    topY = merlonY + merlonHeight;
    if (spec.roof === 'cone' || spec.roof === 'pyramid') {
      const base = ledge - 0.3, roofHeight = clamp(spec.roofHeight ?? 1.1, 0.5, 2);
      parts.push(spec.roof === 'cone'
        ? cylinder({ radiusBottom: base / 2, radiusTop: 0, height: roofHeight, segments: 20 }, [0, merlonY, 0], spec.roofMaterial ?? 'roof_shingle')
        : pyramid(base, roofHeight, [0, merlonY, 0], spec.roofMaterial ?? 'roof_shingle'));
      topY = merlonY + roofHeight;
    }
  }

  if (spec.banner) {
    const y = Math.min(height - 0.4, 2.6);
    parts.push(onFace('right', 0.0, y - 0.75, [0.34, 0.78, 0.04], 'banner', 0.04));
    parts.push(onFace('right', 0.0, y + 0.02, [0.44, 0.05, 0.05], 'wood_dark', 0.06));
  }

  for (const torch of spec.torches ?? []) {
    const face = torch.face === 'right' ? 'right' : 'left';
    const y = clamp(torch.height ?? 1.25, 0.6, height - 0.4);
    const offset = round ? (torch.offset ?? 0) + (face === 'left' ? 0.45 : -0.45) : clamp(torch.offset ?? 0.4, -halfAt(y) + 0.12, halfAt(y) - 0.12);
    parts.push(onFace(face, offset, y - 0.05, [0.08, 0.12, 0.08], 'iron', 0.07));
    const tip = surface(face, offset, y, 0.13);
    parts.push(cylinder({ radiusBottom: 0.035, radiusTop: 0.05, height: 0.26, segments: 6 }, tip, 'wood_dark'));
    lights.push({ type: 'torch', at: [tip[0], y + 0.32, tip[2]] });
  }

  return { primitives: parts, lights, height: topY };
}

export default { id: 'watchtower', version: 1, label: 'Watchtower', params, build };
