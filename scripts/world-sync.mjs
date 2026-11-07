import { readFile,writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { WORLD_SETTINGS,DEFAULT_WORLD_LEVELS,validLevels } from '../src/data/worldCode.js';

// World v2 "převzít svět": `npm run world:sync -- <file.json>` takes a Studio World Lab proposal
// ({levels:[…], by, at, note}, or a list of them – the newest wins) and writes it as the default levels in
// src/data/worldCode.js. Prints applied / ignored / remove, like prices:sync.
const root=fileURLToPath(new URL('../',import.meta.url)),file=path.join(root,'src/data/worldCode.js');
const input=process.argv[2];if(!input){console.error('Usage: npm run world:sync -- <proposal.json>');process.exit(1);}
const raw=JSON.parse(await readFile(path.resolve(input),'utf8'));
const proposals=(Array.isArray(raw)?raw:[raw]).map(p=>p?.data??p).filter(Boolean).sort((a,b)=>String(b.at??'').localeCompare(String(a.at??'')));
const report={applied:[],ignored:[],remove:[]};let chosen=null;
for(const p of proposals){
  if(!validLevels(p.levels)){report.ignored.push({by:p.by,at:p.at,reason:`levels must be ${WORLD_SETTINGS.length} whole numbers within each setting's range`});continue;}
  if(chosen){report.ignored.push({by:p.by,at:p.at,reason:'a newer proposal was applied'});report.remove.push(p.id??p.at);continue;}
  chosen=p;report.remove.push(p.id??p.at);
}
if(chosen){
  const source=await readFile(file,'utf8'),line=`export const DEFAULT_WORLD_LEVELS=Object.freeze([${chosen.levels.join(',')}]);`;
  const next=source.replace(/export const DEFAULT_WORLD_LEVELS=Object\.freeze\(\[[^\]]*\]\);/,line);if(next===source&&chosen.levels.join()!==DEFAULT_WORLD_LEVELS.join())throw new Error('DEFAULT_WORLD_LEVELS not found in worldCode.js.');
  await writeFile(file,next);
  report.applied=WORLD_SETTINGS.map((s,i)=>({setting:s.key,from:DEFAULT_WORLD_LEVELS[i],to:chosen.levels[i]})).filter(r=>r.from!==r.to);
  report.proposal={by:chosen.by??null,at:chosen.at??null,note:chosen.note??''};
}
console.log(JSON.stringify(report,null,2));
