// Light Lab take-over (plan m-osvetleni-noc): writes art/lighting/light-lab-default.json from a Light Lab proposal.
//   npm run studio:lighting -- <file>        the `lightingProposal/default` document (as db_get returns it, or its
//                                            data), or a file exported from the Light Lab
//   npm run studio:lighting -- --defaults    the Lab's built-in defaults
//   add --dry-run to print the result without writing
// The settings are validated and completed with the same code the Lab and (later) the game use; what was clamped or
// ignored is printed. Mechaniky takes the file into src/data/lighting.js in step 2.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { readLightSettings, defaultLightSettings, lightingFile } from '../studio/src/light-lab/lightmap.js';

const args = process.argv.slice(2), dry = args.includes('--dry-run'), input = args.find(a => !a.startsWith('--'));
const target = fileURLToPath(new URL('../art/lighting/light-lab-default.json', import.meta.url));
let raw, meta = {};
if (args.includes('--defaults')) raw = defaultLightSettings();
else if (input) {
  const parsed = JSON.parse(readFileSync(input, 'utf8')), doc = parsed?.data && typeof parsed.data === 'object' ? parsed.data : parsed;
  raw = doc; meta = { by: doc?.by ?? null, at: doc?.at ?? undefined, note: doc?.note ?? '' };
} else { console.error('Usage: npm run studio:lighting -- <proposal.json> | --defaults [--dry-run]'); process.exit(2); }
const result = readLightSettings(raw);
if (!result.ok) { console.error(`Not applied: ${result.problems.join('; ')}`); process.exit(1); }
const file = lightingFile(result.settings, { ...meta, at: meta.at ?? new Date().toISOString() });
for (const p of result.problems) console.log(`fixed: ${p}`);
const json = JSON.stringify(file, null, 2) + '\n';
if (dry) { process.stdout.write(json); process.exit(0); }
mkdirSync(fileURLToPath(new URL('../art/lighting/', import.meta.url)), { recursive: true });
writeFileSync(target, json);
console.log(`applied: art/lighting/light-lab-default.json (${Object.keys(file.types).length} light types${meta.by ? `, by ${meta.by}` : ''})`);
