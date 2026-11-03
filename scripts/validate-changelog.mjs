import { fileURLToPath } from 'node:url';
import { readRelease } from './changelog-lib.mjs';
try {
  const { data } = await readRelease(fileURLToPath(new URL('../', import.meta.url)));
  console.log(`Release v${data.version}: ${data.releases.length} released entries validated; Unreleased stays private to development.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
