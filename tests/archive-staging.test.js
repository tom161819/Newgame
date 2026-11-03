import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,rm,stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileHashes,verifySnapshot } from '../scripts/archive-lib.mjs';
import { stageArchivedSnapshots } from '../scripts/stage-archive.mjs';
async function fixture(){const root=await mkdtemp(path.join(tmpdir(),'newgame-stage-')),source=path.join(root,'source'),target=path.join(root,'output'),commit='a'.repeat(40),directory=path.join(source,commit);await mkdir(directory,{recursive:true});await mkdir(target);await writeFile(path.join(directory,'index.html'),'original playable game');await writeFile(path.join(directory,'archive-runtime.js'),'original save namespace');const record={schema:1,commit,tree:'b'.repeat(40),verification:{build:true,browser:true},files:await fileHashes(directory)};await writeFile(path.join(directory,'snapshot.json'),JSON.stringify(record));await writeFile(path.join(source,'versions.json'),JSON.stringify([record]));return {root,source,target,commit,directory};}
test('separate Pages composition preserves every byte and save wrapper without rewriting generated catalog/index',async()=>{
  const f=await fixture();try{await writeFile(path.join(f.target,'index.html'),'new generated catalog');const before=await fileHashes(f.source),result=await stageArchivedSnapshots({...f,verify:true});assert.equal(result.snapshots,1);assert.equal(result.copied,3);assert.deepEqual(await fileHashes(f.source),before);assert.deepEqual(await verifySnapshot(path.join(f.target,f.commit)),await verifySnapshot(f.directory));assert.equal(await readFile(path.join(f.target,'index.html'),'utf8'),'new generated catalog');assert.equal(await readFile(path.join(f.target,'versions.json'),'utf8'),await readFile(path.join(f.source,'versions.json'),'utf8'));
    const again=await stageArchivedSnapshots(f);assert.equal(again.reused,1);assert.equal(again.copied,0);
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('composition refuses overlapping roots or a conflicting existing snapshot instead of replacing an archive',async()=>{
  const f=await fixture();try{await assert.rejects(()=>stageArchivedSnapshots({...f,target:f.source}),/overlap/);await stageArchivedSnapshots(f);const record=JSON.parse(await readFile(path.join(f.target,f.commit,'snapshot.json'),'utf8'));record.commit='c'.repeat(40);await rm(path.join(f.target,f.commit,'snapshot.json'));await writeFile(path.join(f.target,f.commit,'snapshot.json'),JSON.stringify(record));await assert.rejects(()=>stageArchivedSnapshots(f));assert.equal(JSON.parse(await readFile(path.join(f.directory,'snapshot.json'),'utf8')).commit,f.commit);
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('invalid provenance or traversal in a manifest cannot create a fake or unsafe archive destination',async()=>{
  const f=await fixture();try{const record=JSON.parse(await readFile(path.join(f.directory,'snapshot.json'),'utf8'));record.files['../outside.js']='d'.repeat(64);await writeFile(path.join(f.directory,'snapshot.json'),JSON.stringify(record));await assert.rejects(()=>stageArchivedSnapshots(f),/Unsafe/);assert.equal(await readFile(path.join(f.directory,'index.html'),'utf8'),'original playable game');
  }finally{await rm(f.root,{recursive:true,force:true});}
});
test('editing a generated preview cannot modify the original archived game through a shared writable inode',async()=>{
  const f=await fixture();try{await stageArchivedSnapshots(f);const output=path.join(f.target,f.commit,'index.html');assert.notEqual((await stat(output)).ino,(await stat(path.join(f.directory,'index.html'))).ino);await writeFile(output,'accidental generated-output edit');assert.equal(await readFile(path.join(f.directory,'index.html'),'utf8'),'original playable game');await verifySnapshot(f.directory);await assert.rejects(()=>verifySnapshot(path.join(f.target,f.commit)));
  }finally{await rm(f.root,{recursive:true,force:true});}
});
