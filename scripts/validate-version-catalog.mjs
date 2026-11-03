import { fileURLToPath } from 'node:url';
import { readVersionCatalog } from './version-catalog.mjs';
try{
  const catalog=await readVersionCatalog(fileURLToPath(new URL('../',import.meta.url)));
  console.log(`Catalog: ${catalog.versions.length} verified milestones (${catalog.versions.filter(v=>v.historical).length} reconstructed), ${catalog.builds.length} immutable build snapshots; game v${catalog.gameVersion}.`);
}catch(error){console.error(error.message);process.exitCode=1;}
