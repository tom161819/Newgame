// Pre-made images (baked variants) keep the spec hash the Studio computes for their variant, so their export is not
// "stale" (tests/asset-studio.test.js). usage: node scripts/stamp-baked-hashes.mjs <assetId>...
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { buildCatalog } from '../studio/src/lib/specs.js';
import { GENERATORS } from '../studio/src/generators/index.js';
import { objectDefinitions } from '../src/data/objects/index.js';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const style = JSON.parse(readFileSync(path.join(root, 'art/style-guide.json')));
const specs = readdirSync(path.join(root, 'art/assets')).flatMap(c => readdirSync(path.join(root, 'art/assets', c)).filter(a => existsSync(path.join(root, 'art/assets', c, a, 'asset.json'))).map(a => ({ ...JSON.parse(readFileSync(path.join(root, 'art/assets', c, a, 'asset.json'))), dir: `${c}/${a}` })));
const catalog = buildCatalog({ specs, style, generators: GENERATORS, gameDefinitions: objectDefinitions, gameSprites: {} });
let n = 0;
for (const asset of catalog.studio) if (process.argv.slice(2).includes(asset.id)) for (const v of asset.variants) {
  const file = path.join(root, v.paths.spriteMeta), meta = JSON.parse(readFileSync(file));
  if (meta.specHash !== v.hash) { meta.specHash = v.hash; writeFileSync(file, `${JSON.stringify(meta, null, 2)}\n`); n += 1; }
}
console.log('stamped', n);
