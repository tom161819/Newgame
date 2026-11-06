// Writes the Studio model of one variant as JSON for the Blender renderer (scripts/blender/render.py):
// the generator's primitives plus the style colours, sun and projection the render must match.
//   node scripts/blender-model.mjs <assetId> <variantId> <out.json> [--spec-from <variantId>]
// --spec-from builds the model from another variant's spec (a Blender twin of a Studio variant).
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { PIXELS_PER_UNIT, ELEVATION, cameraDirection } from '../studio/src/lib/projection.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const [assetId, variantId, out] = process.argv.slice(2);
if (!assetId || !variantId || !out) { console.error('Usage: node scripts/blender-model.mjs <assetId> <variantId> <out.json>'); process.exit(2); }

async function findAsset(id) {
  for (const category of await readdir(path.join(root, 'art/assets'))) {
    try { const spec = JSON.parse(await readFile(path.join(root, 'art/assets', category, id, 'asset.json'), 'utf8')); if (spec.id === id) return spec; } catch { /* next */ }
  }
  throw new Error(`No asset ${id}`);
}

const style = JSON.parse(await readFile(path.join(root, 'art/style-guide.json'), 'utf8'));
const asset = await findAsset(assetId), variant = asset.variants.find(v => v.id === variantId);
if (!variant) throw new Error(`No variant ${variantId} in ${assetId}`);
const model = GENERATORS[asset.generator].build(variant.spec, { footprint: asset.footprint, style });
const used = [...new Set(model.primitives.map(p => p.material))];
const materials = Object.fromEntries(used.map(id => [id, { ...style.materials[id], hex: style.palette[style.materials[id].color] ?? style.materials[id].color }]));
await writeFile(path.resolve(out), `${JSON.stringify({
  assetId, variantId, footprint: asset.footprint, height: model.height, primitives: model.primitives, materials,
  light: style.light, projection: { pixelsPerUnit: PIXELS_PER_UNIT, elevation: ELEVATION, cameraDirection: cameraDirection() },
}, null, 1)}\n`);
console.log(`Wrote ${out}: ${model.primitives.length} primitives, ${used.length} materials.`);
