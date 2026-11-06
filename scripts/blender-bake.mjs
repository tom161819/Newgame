// Bakes Studio variants marked `baked: { renderer: "blender" }` with Blender (#149 Blender pilot).
//   npm run blender:bake -- <assetId> [<variantId>]    (BLENDER_PYTHON = a Python with the bpy module)
// For each baked variant: writes the generator's model as JSON, renders it with scripts/blender/render.py,
// stores art/sprites/<asset>/<variant>.v<version>.png (+ .x2.png) and the usual sidecar JSON, and records a
// render hash (renderer script + model) in asset.json so the spec hash changes when the render would.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, writeFile, copyFile, mkdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENERATORS } from '../studio/src/generators/index.js';
import { buildCatalog } from '../studio/src/lib/specs.js';
import { projectPoint } from '../studio/src/lib/projection.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const [assetId, only] = process.argv.slice(2).filter(a => !a.startsWith('--'));
const samples = process.argv.includes('--samples') ? process.argv[process.argv.indexOf('--samples') + 1] : '96';
const python = process.env.BLENDER_PYTHON || 'python3';
if (!assetId) { console.error('Usage: npm run blender:bake -- <assetId> [<variantId>] [--samples 96]'); process.exit(2); }

const style = JSON.parse(await readFile(path.join(root, 'art/style-guide.json'), 'utf8'));
let assetFile = null;
for (const category of await readdir(path.join(root, 'art/assets'))) {
  const file = path.join(root, 'art/assets', category, assetId, 'asset.json');
  try { await readFile(file); assetFile = file; break; } catch { /* next */ }
}
if (!assetFile) throw new Error(`No asset ${assetId}`);
const asset = JSON.parse(await readFile(assetFile, 'utf8'));
const targets = asset.variants.filter(v => v.baked?.renderer === 'blender' && (!only || v.id === only));
if (!targets.length) throw new Error(`No Blender-baked variant in ${assetId}${only ? ` named ${only}` : ''}.`);
const renderer = await readFile(path.join(root, 'scripts/blender/render.py'));
const work = await mkdtemp(path.join(os.tmpdir(), 'blender-bake-'));

for (const variant of targets) {
  const modelFile = path.join(work, `${variant.id}.model.json`), prefix = path.join(work, variant.id);
  execFileSync('node', [path.join(root, 'scripts/blender-model.mjs'), assetId, variant.id, modelFile], { stdio: 'inherit' });
  variant.baked.renderHash = createHash('sha256').update(renderer).update(await readFile(modelFile)).update(`samples=${samples}`).digest('hex').slice(0, 8);
  variant.baked.samples = Number(samples);
  console.log(`Rendering ${variant.id} with Blender (${samples} samples)…`);
  execFileSync(python, [path.join(root, 'scripts/blender/render.py'), modelFile, prefix, '--samples', samples], { stdio: ['ignore', 'ignore', 'inherit'] });
  const render = JSON.parse(await readFile(`${prefix}.render.json`, 'utf8'));
  await writeFile(assetFile, `${JSON.stringify(asset, null, 2)}\n`);
  // The spec hash is the Studio's, computed from the updated asset.json (it includes baked.renderHash).
  const entry = buildCatalog({ specs: [{ ...asset, file: path.relative(root, assetFile) }], generators: GENERATORS, style }).studio[0].variants.find(v => v.id === variant.id);
  const sprite = path.join(root, entry.paths.sprite), one = render.scales['1'], two = render.scales['2'];
  await mkdir(path.dirname(sprite), { recursive: true });
  await copyFile(`${prefix}.png`, sprite);
  await copyFile(`${prefix}.x2.png`, sprite.replace(/\.png$/, '.x2.png'));
  const corner = projectPoint([asset.footprint.width / 2, 0, asset.footprint.height / 2], 1), base = { x: one.anchor.x + corner.x, y: one.anchor.y + corner.y };
  const meta = {
    schema: 1, assetId, variantId: variant.id, name: variant.name, category: asset.category, version: variant.version, specHash: entry.hash,
    generator: 'blender', generatorVersion: 1, styleGuide: `${style.id}@${style.version}`, scale: 1,
    width: one.width, height: one.height, anchor: one.anchor,
    origin: { x: +(one.anchor.x / one.width).toFixed(5), y: +(one.anchor.y / one.height).toFixed(5) },
    footprint: asset.footprint,
    base: { x: +base.x.toFixed(2), y: +base.y.toFixed(2) }, baseOrigin: { x: +(base.x / one.width).toFixed(5), y: +(base.y / one.height).toFixed(5) },
    visualHeight: +base.y.toFixed(2), platform: null, frontLayer: false, gameLights: [], modelHeight: +render.modelHeight.toFixed(3), lights: [],
    x2: { width: two.width, height: two.height, anchor: two.anchor },
    render: { engine: render.engine, blender: render.blender, samples: render.samples, supersampling: render.supersampling, seconds: render.seconds, renderHash: variant.baked.renderHash, script: 'scripts/blender/render.py' },
  };
  await writeFile(sprite.replace(/\.png$/, '.json'), `${JSON.stringify(meta, null, 2)}\n`);
  console.log(`Baked ${entry.paths.sprite} (${one.width}×${one.height}, anchor ${one.anchor.x},${one.anchor.y}, hash ${entry.hash}) in ${render.seconds} s.`);
}
