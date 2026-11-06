// #215 art:revise — Claude's revision of one variant after the owner's "Request revision".
//   1. edit the variant's spec in art/assets/.../asset.json as the comment asks;
//   2. npm run art:revise -- <variantId>
// The version goes up by one, the new sprites are exported next to the old ones (history stays), and the approval
// record starts again in review with the old version in its history. Nothing is approved here.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { reviseSpec, reviseRecord } from './art-tools-lib.mjs';
import { validateManifest } from '../studio/src/lib/approvals.js';

const root = fileURLToPath(new URL('../', import.meta.url)), variantId = process.argv[2];
if (!variantId) { console.error('Usage: npm run art:revise -- <variantId>'); process.exit(1); }
let file = null, spec = null;
for (const category of await readdir(path.join(root, 'art/assets'))) for (const id of await readdir(path.join(root, 'art/assets', category))) {
  const candidate = path.join(root, 'art/assets', category, id, 'asset.json'); try { const s = JSON.parse(await readFile(candidate, 'utf8')); if (s.variants.some(v => v.id === variantId)) { file = candidate; spec = s; } } catch { /* not an asset */ }
}
if (!spec) { console.error(`No asset has a variant ${variantId}.`); process.exit(1); }
const revised = reviseSpec(spec, variantId), version = revised.variants.find(v => v.id === variantId).version;
await writeFile(file, `${JSON.stringify(revised, null, 2)}\n`);
const exported = spawnSync(process.execPath, ['scripts/studio-export.mjs', spec.id], { cwd: root, stdio: 'inherit' });
if (exported.status !== 0) { console.error('Export failed; the spec keeps the new version, fix and re-run studio:export.'); process.exit(1); }
const meta = JSON.parse(await readFile(path.join(root, `art/sprites/${spec.id}/${variantId}.v${version}.json`), 'utf8'));
const approvals = reviseRecord(JSON.parse(await readFile(path.join(root, 'art/approvals.json'), 'utf8')), spec.id, variantId, { version, specHash: meta.specHash }, new Date().toISOString());
const errors = validateManifest(approvals); if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
await writeFile(path.join(root, 'art/approvals.json'), `${JSON.stringify(approvals, null, 2)}\n`);
console.log(`${variantId}: v${version - 1} → v${version} (#${meta.specHash}), status review; v${version - 1} kept in history and art/sprites.`);
