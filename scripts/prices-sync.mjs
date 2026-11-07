#!/usr/bin/env node
// Applies building price proposals as the game's new default prices (plan task m-prevzeti-cen-ze-studia, #91).
// Input: a JSON file with proposals { buildingId, cost, by, at, note } (Asset Library "Copy prices JSON"), or the Studio's
// `prices` documents as returned by db_list ([{ id, data: {...} }] or { documents: [...] }). `cost` is the WHOLE new price:
// resources missing from it are removed from the building's price.
// Usage: npm run prices:sync -- <file.json> [--dry-run] [--json]
import { readFile,writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planPriceSync,rewriteCost } from './prices-sync-lib.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),args=process.argv.slice(2);
const file=args.find(a=>!a.startsWith('--')),dry=args.includes('--dry-run'),asJson=args.includes('--json');
if(!file){console.error('Usage: npm run prices:sync -- <proposals.json> [--dry-run] [--json]');process.exit(2);}
const { objectRegistry }=await import('../src/systems/ObjectRegistry.js');
const input=JSON.parse(await readFile(path.resolve(file),'utf8'));
const plan=planPriceSync(input,objectRegistry);
const objectsDir=path.join(root,'src/data/objects'),sources=new Map();
const { readdir }=await import('node:fs/promises');
for(const name of (await readdir(objectsDir)).filter(n=>n.endsWith('.js')))sources.set(name,await readFile(path.join(objectsDir,name),'utf8'));
for(const change of plan.applied){
  let done=false;
  for(const [name,text]of sources){const next=rewriteCost(text,change.buildingId,change.cost);if(next!==null){sources.set(name,next);change.file=`src/data/objects/${name}`;done=true;break;}}
  if(!done){change.error='price is not a literal in src/data/objects';}
}
const failed=plan.applied.filter(c=>c.error);for(const c of failed){plan.ignored.push({buildingId:c.buildingId,reason:c.error});}
plan.applied=plan.applied.filter(c=>!c.error);
if(!dry&&plan.applied.length){
  const originals=new Map();for(const name of sources.keys())originals.set(name,await readFile(path.join(objectsDir,name),'utf8'));
  for(const [name,text]of sources)if(text!==originals.get(name))await writeFile(path.join(objectsDir,name),text);
  // Verify in a fresh process that the registry now has exactly the new prices; otherwise restore the files.
  const expected=Object.fromEntries(plan.applied.map(c=>[c.buildingId,c.cost]));
  try{execFileSync(process.execPath,['--input-type=module','-e',`const {objectRegistry:r}=await import(${JSON.stringify(path.join(root,'src/systems/ObjectRegistry.js'))});const e=${JSON.stringify(expected)};for(const [id,c]of Object.entries(e)){const a=r.require(id).cost;if(JSON.stringify(Object.entries(a).sort())!==JSON.stringify(Object.entries(c).sort()))throw new Error(id+' '+JSON.stringify(a));}`],{stdio:'pipe'});}
  catch(error){for(const [name,text]of originals)await writeFile(path.join(objectsDir,name),text);console.error(`Verification failed, nothing changed: ${String(error.stderr||error.message).trim()}`);process.exit(1);}
}
if(asJson)console.log(JSON.stringify({dryRun:dry,...plan},null,2));
else{
  const list=cost=>Object.entries(cost).map(([id,n])=>`${n} ${id}`).join(', ')||'free';
  console.log(`${dry?'Dry run – ':''}applied ${plan.applied.length}, ignored ${plan.ignored.length}`);
  for(const c of plan.applied)console.log(`  ${c.buildingId}: ${list(c.from)} → ${list(c.cost)}${c.added.length?` (added ${c.added.join(', ')})`:''}${c.removed.length?` (removed ${c.removed.join(', ')})`:''} [${c.file}]`);
  for(const c of plan.ignored)console.log(`  ignored ${c.buildingId??'?'}: ${c.reason}`);
  console.log(`remove: ${JSON.stringify(plan.remove)}`);
}
