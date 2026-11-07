import { readFile,writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readVersionCatalog } from './version-catalog.mjs';
import { displayArchiveNumber,compareArchiveNumbers } from '../src/data/archiveNumbers.js';

// m-verzovani-archivu: `npm run versions:renumber` prints old label → new number → date → commit for every archived
// snapshot and reconstructed milestone. `--write` records `number` and `legacyLabel` in public/versions/versions.json
// (the catalog always computes the same numbers; `npm run versions:validate` checks that the recorded ones still match).
const root=fileURLToPath(new URL('../',import.meta.url)),file=path.join(root,'public/versions/versions.json');
const catalog=await readVersionCatalog(root),rows=[];
for(const b of catalog.builds)rows.push({old:b.legacyLabel,number:b.number,date:b.date,commit:b.commit,kind:'snapshot'});
for(const v of catalog.versions.filter(v=>v.historical))rows.push({old:v.legacyLabel,number:v.number,date:v.commitDate??v.date,commit:v.commit,kind:'milestone'});
rows.sort((a,b)=>compareArchiveNumbers(a.number,b.number)||a.kind.localeCompare(b.kind));
console.log('| Old label | New number | Date | Commit |\n|---|---|---|---|');
for(const r of rows)console.log(`| ${r.old} | v${displayArchiveNumber(r.number)} | ${String(r.date).slice(0,16).replace('T',' ')} | ${r.commit.slice(0,7)} |`);
if(process.argv.includes('--write')){
  const records=JSON.parse(await readFile(file,'utf8')),byCommit=new Map(catalog.builds.map(b=>[b.commit,b]));
  for(const record of records){const b=byCommit.get(record.commit);if(!b)throw new Error(`No catalog entry for ${record.commit}.`);record.number=b.number;record.legacyLabel=b.legacyLabel;}
  await writeFile(file,JSON.stringify(records,null,2)+'\n');console.log(`\nWrote ${records.length} numbers to public/versions/versions.json.`);
}
