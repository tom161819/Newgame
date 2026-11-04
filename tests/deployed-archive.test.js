import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp,mkdir,writeFile,readFile,rm,symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { digest } from '../scripts/archive-lib.mjs';
import { verifyDeployedArchive,verifyPublishedRelease } from '../scripts/deployed-archive.mjs';

async function fixture(t){
  const root=await mkdtemp(path.join(tmpdir(),'newgame-deployed-archive-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  const write=async(file,data)=>{await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),data);};
  const commit=message=>{git('add','-A');git('-c','user.name=Release test','-c','user.email=release-test@example.invalid','commit','-qm',message);return git('rev-parse','HEAD');};
  git('init','--quiet');await write('package.json','{"version":"0.3.0"}\n');await write('src/game.js','export const liveGame="release";\n');
  const releaseCommit=commit('Frozen release source'),tree=git('rev-parse',`${releaseCommit}^{tree}`),prefix=`public/versions/${releaseCommit}/`;
  const files={'index.html':Buffer.from('<script src="archive-runtime.js"></script>'),'archive-runtime.js':Buffer.from('/* isolated save namespace */\n'),'assets/king.png':Buffer.from([0,10,13,255,128,0,10])};
  for(const [file,bytes] of Object.entries(files))await write(prefix+file,bytes);
  const record={schema:1,commit:releaseCommit,tree,basePath:`/Newgame/versions/${releaseCommit}/`,verification:{tests:true,build:true,browser:true}};
  await write(prefix+'snapshot.json',JSON.stringify({...record,files:Object.fromEntries(Object.entries(files).map(([file,bytes])=>[file,digest(bytes)]))})+'\n');
  await write('public/versions/versions.json',JSON.stringify([record])+'\n');
  // This successful deployment can include newer live development while the
  // real release source, its built binary assets and its save namespace freeze.
  await write('src/game.js','export const liveGame="later approved graphics";\n');
  const deploymentCommit=commit('Publish exact archive and newer live game');
  return {root,git,write,commit,releaseCommit,deploymentCommit,prefix,files,record,verify:(deployment=deploymentCommit)=>verifyDeployedArchive({root,deploymentCommit:deployment,releaseCommit,version:'0.3.0'})};
}

test('release proof hashes the actual deployed archive including binary bytes while live development advances',async t=>{
  const f=await fixture(t),proof=await f.verify();
  assert.deepEqual(proof,{deploymentCommit:f.deploymentCommit,releaseCommit:f.releaseCommit,archivePath:f.prefix,verifiedGitFiles:4});
  assert.notEqual(f.git('show',`${f.releaseCommit}:src/game.js`),f.git('show',`${f.deploymentCommit}:src/game.js`));
  await assert.rejects(verifyDeployedArchive({root:f.root,deploymentCommit:f.deploymentCommit,releaseCommit:f.releaseCommit,version:'0.4.0'}),/package version/);
});

test('an old successful deployment cannot prove a newer locally present archive',async t=>{
  const f=await fixture(t);await assert.rejects(f.verify(f.releaseCommit),/exact release archive file set/);
});

test('restoring a good local archive cannot conceal corrupted deployed asset bytes',async t=>{
  const f=await fixture(t),file=f.prefix+'assets/king.png';await f.write(file,Buffer.from([255,10,0]));
  const deployedBad=f.commit('Damaged deployed image');await f.write(file,f.files['assets/king.png']);
  await assert.rejects(f.verify(deployedBad),/Deployed archive bytes differ.*king.png/);
});

test('deployed archives reject extra files, missing files and symbolic links',async t=>{
  for(const kind of ['extra','missing','symlink'])await t.test(kind,async t=>{
    const f=await fixture(t),file=f.prefix+'assets/king.png';
    if(kind==='extra')await f.write(f.prefix+'extra.js','unexpected');
    else{await rm(path.join(f.root,file));if(kind==='symlink')await symlink('../archive-runtime.js',path.join(f.root,file));}
    const bad=f.commit(`Invalid deployed file set: ${kind}`);
    if(kind==='extra')await rm(path.join(f.root,f.prefix+'extra.js'));
    else{if(kind==='symlink')await rm(path.join(f.root,file));await f.write(file,f.files['assets/king.png']);}
    await assert.rejects(f.verify(bad),kind==='symlink'?/unsupported Git entry/:/exact release archive file set/);
  });
});

test('deployed metadata must advertise the exact source tree and archive URL',async t=>{
  const f=await fixture(t);await f.write('public/versions/versions.json',JSON.stringify([{...f.record,basePath:'/Newgame/versions/wrong/'}]));
  const bad=f.commit('Incorrect published archive link');await f.write('public/versions/versions.json',JSON.stringify([f.record]));
  await assert.rejects(f.verify(bad),/Deployed version index/);
});

test('a manifest cannot claim another tree even when all local asset hashes match',async t=>{
  const f=await fixture(t),file=f.prefix+'snapshot.json',manifest=JSON.parse(await readFile(path.join(f.root,file),'utf8'));
  await f.write(file,JSON.stringify({...manifest,tree:'f'.repeat(40)}));
  await assert.rejects(f.verify(),/actual release source tree/);
});

test('final release proof checks the live playable official entry and exact served manifest',()=>{
  const entry={version:'0.3.0',title:'M2: Resources, economy and iron',date:'2026-11-04',tag:'v0.3.0',commit:'a'.repeat(40),archiveURL:`/Newgame/versions/${'a'.repeat(40)}/`,available:true,releaseType:'milestone',reconstructed:false,changes:{added:['Actual iron production.']}};
  const manifest=Buffer.from('{"commit":"'+entry.commit+'"}\n'),manifestHash=digest(manifest);
  const catalog={schema:1,currentBuild:{commit:'b'.repeat(40)},versions:[structuredClone(entry)]};
  assert.equal(verifyPublishedRelease({catalog,manifest,entry,manifestHash}).commit,entry.commit);
  for(const change of [{available:false},{commit:'b'.repeat(40)},{tag:undefined},{archiveURL:'/wrong/'},{changes:{added:['Unverified replacement.']}}]){
    assert.throws(()=>verifyPublishedRelease({catalog:{...catalog,versions:[{...entry,...change}]},manifest,entry,manifestHash}),/Published catalog/);
  }
  for(const versions of [[],[entry,entry]])assert.throws(()=>verifyPublishedRelease({catalog:{...catalog,versions},manifest,entry,manifestHash}),/Published catalog/);
  assert.throws(()=>verifyPublishedRelease({catalog,manifest:Buffer.from('stale manifest'),entry,manifestHash}),/Published archive manifest/);
});
