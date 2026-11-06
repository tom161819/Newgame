import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { readFile } from 'node:fs/promises';
import { readRelease, prepareRelease, saveVersionFrom } from './changelog-lib.mjs';

// Intentionally local only: no Git commands, tag, network, push or publication.
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const args = process.argv.slice(2), type = args[0], dateIndex = args.indexOf('--date'), titleIndex = args.indexOf('--title'), milestone = args.includes('--milestone');
  const known = new Set([0, dateIndex, dateIndex + 1, titleIndex, titleIndex + 1, args.indexOf('--milestone')].filter(i => i >= 0));
  if (!['major', 'minor', 'patch'].includes(type) || args.some((arg, i) => !known.has(i))) {
    throw new Error('Usage: npm run release:prepare -- major|minor|patch [--date YYYY-MM-DD] [--title "Short release title"] [--milestone]');
  }
  const date = dateIndex < 0 ? new Intl.DateTimeFormat('sv-SE', { timeZone: process.env.TZ ?? 'Europe/Prague' }).format(new Date()) : args[dateIndex + 1];
  const original = await readRelease(root), saveVersion = saveVersionFrom(await readFile(path.join(root, 'src/systems/GameStateSerializer.js'), 'utf8'));
  const next = prepareRelease(original, type, date, { saveVersion, title: titleIndex < 0 ? null : args[titleIndex + 1], milestone });
  const files = [['package.json', next.packageText, original.packageText], ['package-lock.json', next.lockText, original.lockText], ['CHANGELOG.md', next.markdown, original.markdown]];
  try { for (const [file, text] of files) await writeFile(path.join(root, file), text); }
  catch (error) { for (const [file, , text] of files) await writeFile(path.join(root, file), text); throw error; }
  console.log(`Prepared v${next.version} locally. Review the changes, run npm test and npm run build, then commit and prepare tag v${next.version}. Nothing was published.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
