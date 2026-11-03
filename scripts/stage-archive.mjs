import { readFile,mkdir,lstat,copyFile,rename,mkdtemp,rm,access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { verifySnapshot } from './archive-lib.mjs';

const sha=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
export async function stageArchivedSnapshots({source,target,verify=false}){
  source=path.resolve(source);target=path.resolve(target);
  if(source===target||source.startsWith(target+path.sep)||target.startsWith(source+path.sep))throw new Error('Archive source and staging destination must not overlap.');
  const start=performance.now(),metadata=await readFile(path.join(source,'versions.json'),'utf8'),records=JSON.parse(metadata);
  if(!Array.isArray(records)||new Set(records.map(r=>r.commit)).size!==records.length)throw new Error('Invalid archive staging catalog.');
  for(const record of records)if(!sha(record.commit)||!sha(record.tree)||!record.verification?.build||!record.verification?.browser)throw new Error('Only verified source snapshots may be staged.');
  await mkdir(target,{recursive:true});let copied=0,reused=0,bytes=0;
  for(const entry of records){
    const original=path.join(source,entry.commit),destination=path.join(target,entry.commit),manifest=JSON.parse(await readFile(path.join(original,'snapshot.json'),'utf8'));
    if(manifest.commit!==entry.commit||manifest.tree!==entry.tree||manifest.schema!==1||!manifest.files?.['index.html']||!manifest.files['archive-runtime.js'])throw new Error('Snapshot staging provenance mismatch.');
    if(verify)await verifySnapshot(original,entry.commit);
    let exists=false;try{await access(destination);exists=true;}catch(error){if(error.code!=='ENOENT')throw error;}
    if(exists){await verifySnapshot(destination,entry.commit);reused++;continue;}
    const pending=await mkdtemp(path.join(target,`.pending-${entry.commit}-`));
    try{
      for(const file of [...Object.keys(manifest.files),'snapshot.json']){
        if(file.startsWith('/')||file.includes('\\')||file.split('/').includes('..')||!file||file!=='snapshot.json'&&!/^[a-f0-9]{64}$/.test(manifest.files[file]))throw new Error('Unsafe file in snapshot manifest.');
        const input=path.join(original,file),output=path.join(pending,file),info=await lstat(input);if(!info.isFile()||info.isSymbolicLink())throw new Error('Archive contains a non-regular file.');
        await mkdir(path.dirname(output),{recursive:true});
        // A reflink is independent on write, unlike a hard link. Unsupported
        // filesystems safely fall back to an ordinary byte-for-byte copy.
        await copyFile(input,output,constants.COPYFILE_EXCL|constants.COPYFILE_FICLONE);copied++;bytes+=info.size;
      }
      await rename(pending,destination);
    }finally{await rm(pending,{recursive:true,force:true});}
  }
  // Vite owns the generated index/catalog; keep the old metadata URL available.
  await copyFile(path.join(source,'versions.json'),path.join(target,'versions.json'));
  return {snapshots:records.length,copied,reused,bytes,elapsedMs:Math.round(performance.now()-start)};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2),out=args.find(a=>a.startsWith('--out='))?.slice(6)??'dist';
  await access(path.resolve(root,out,'index.html'));const result=await stageArchivedSnapshots({source:path.join(root,'public/versions'),target:path.resolve(root,out,'versions'),verify:args.includes('--verify')});console.log(`Archive composition: ${JSON.stringify(result)}. Original snapshots unchanged.`);
}
