// Take the shared Studio review over into art/approvals.json.
//
// Usage: node scripts/studio-sync.mjs <docs.json> [--dry-run]
//
// <docs.json> holds the Studio page's database documents as Claude read them:
//   { "reviews": [{ "id": "...", "version": 3, "data": { ... } }], "preferred": [ ... ] }
// The script writes art/approvals.json and prints a JSON report: the decisions taken over, the revision requests to
// turn into tasks, and the documents to delete (each at the version read) AFTER the republished Studio contains the
// new manifest. Deleting at that version means a decision made in the meantime is never lost.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateManifest } from '../studio/src/lib/approvals.js';
import { takeOver } from '../studio/src/lib/sharedReview.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const [input, ...flags] = process.argv.slice(2);
if (!input) { console.error('Usage: node scripts/studio-sync.mjs <docs.json> [--dry-run]'); process.exit(2); }

// The Studio catalog by id only: art/assets/<category>/<asset>/asset.json.
async function studioCatalog() {
  const base = path.join(root, 'art/assets'), out = [];
  for (const category of await readdir(base, { withFileTypes: true })) {
    if (!category.isDirectory()) continue;
    for (const entry of await readdir(path.join(base, category.name), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      try {
        const spec = JSON.parse(await readFile(path.join(base, category.name, entry.name, 'asset.json'), 'utf8'));
        out.push({ id: spec.id, variants: (spec.variants ?? []).map(v => ({ id: v.id })) });
      } catch (error) { if (error.code !== 'ENOENT') throw error; }
    }
  }
  return out;
}

const manifestFile = path.join(root, 'art/approvals.json');
const repo = JSON.parse(await readFile(manifestFile, 'utf8'));
const docs = JSON.parse(await readFile(path.resolve(input), 'utf8'));
const result = takeOver({ repo, docs, catalog: await studioCatalog() });
const errors = validateManifest(result.manifest);
if (errors.length) { console.error(`The new manifest is invalid:\n- ${errors.join('\n- ')}`); process.exit(1); }
if (!flags.includes('--dry-run')) await writeFile(manifestFile, `${JSON.stringify(result.manifest, null, 2)}\n`);
console.log(JSON.stringify({ written: !flags.includes('--dry-run'), decisions: result.decisions, revisions: result.revisions, ignored: result.ignored, remove: result.remove }, null, 2));
