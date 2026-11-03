import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import { readRelease, prepareRelease } from './changelog-lib.mjs';

// Intentionally local only: no Git commands, tag, network, push or publication.
const root = fileURLToPath(new URL('../', import.meta.url));
try {
  const args = process.argv.slice(2), type = args[0], dateIndex = args.indexOf('--date');
  if (!['major', 'minor', 'patch'].includes(type) || args.some((arg, i) => i > 0 && i !== dateIndex && i !== dateIndex + 1)) {
    throw new Error('Usage: npm run release:prepare -- major|minor|patch [--date YYYY-MM-DD]');
  }
  const date = dateIndex < 0 ? new Intl.DateTimeFormat('sv-SE', { timeZone: process.env.TZ ?? 'Europe/Prague' }).format(new Date()) : args[dateIndex + 1];
  const original = await readRelease(root), next = prepareRelease(original, type, date);
  const files = [['package.json', next.packageText, original.packageText], ['package-lock.json', next.lockText, original.lockText], ['CHANGELOG.md', next.markdown, original.markdown]];
  try { for (const [file, text] of files) await writeFile(path.join(root, file), text); }
  catch (error) { for (const [file, , text] of files) await writeFile(path.join(root, file), text); throw error; }
  console.log(`Prepared v${next.version} locally. Review the changes, run npm test and npm run build, then commit and prepare tag v${next.version}. Nothing was published.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
