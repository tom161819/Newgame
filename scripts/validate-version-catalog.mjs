import { fileURLToPath } from 'node:url';
import { readVersionCatalog } from './version-catalog.mjs';
try{
  const catalog=await readVersionCatalog(fileURLToPath(new URL('../',import.meta.url)));
  // m-verzovani-archivu: numbers recorded by `versions:renumber --write` must match the rule.
  const stale=catalog.builds.filter(b=>b.recordedNumber!==undefined&&b.recordedNumber!==b.number);if(stale.length)throw new Error(`Archive numbers changed for ${stale.map(b=>b.commit.slice(0,7)).join(', ')}; run npm run versions:renumber -- --write.`);
  console.log(`Catalog: ${catalog.versions.length} verified milestones (${catalog.versions.filter(v=>v.historical).length} reconstructed), ${catalog.builds.length} immutable build snapshots; game v${catalog.gameVersion}.`);
}catch(error){console.error(error.message);process.exitCode=1;}
