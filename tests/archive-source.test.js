import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { archiveSourcePaths,selectArchiveCommits,archiveOptions } from '../scripts/archive-source.mjs';
test('archive options accept both explicit forms and never silently replace an intended source with HEAD',()=>{
  assert.deepEqual(archiveOptions(['--through=abc','--base','/Newgame/','--commit=def','--commit','ghi']),{through:'abc',base:'/Newgame/',commits:['def','ghi'],all:false});assert.equal(archiveOptions(['--through','abc','--all-commits']).through,'abc');
  for(const args of [['--through'],['--through='],['--though=abc'],['--base','--all-commits'],['--through=a','--through=b']])assert.throws(()=>archiveOptions(args));
});
test('historical export preserves actual code/assets and excludes nested archived games before extraction',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'newgame-export-')),git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try{git('init','-q');await mkdir(path.join(root,'src'));await mkdir(path.join(root,'public/assets'),{recursive:true});await mkdir(path.join(root,'public/versions','a'.repeat(40)),{recursive:true});
    for(const [file,text]of [['package.json','{"version":"0.1.0"}'],['src/game.js','original actual game'],['public/assets/stone.svg','original graphic'],[`public/versions/${'a'.repeat(40)}/index.html`,'huge nested frozen game'],['public/versions/versions.json','[]']])await writeFile(path.join(root,file),text);
    git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','Real source');const commit=git('rev-parse','HEAD'),selected=archiveSourcePaths(root,commit),tar=path.join(root,'export.tar');git('archive','--format=tar','--output',tar,commit,'--',...selected);const files=execFileSync('tar',['-tf',tar],{encoding:'utf8'}).trim().split('\n').filter(file=>!file.endsWith('/'));
    assert.deepEqual(files.sort(),['package.json','src/game.js','public/assets/stone.svg'].sort());assert.equal(execFileSync('tar',['-xOf',tar,'src/game.js'],{encoding:'utf8'}),'original actual game');assert.throws(()=>archiveSourcePaths(root,'HEAD'),/actual full/);
  }finally{await rm(root,{recursive:true,force:true});}
});
test('default archive selection uses real milestones, tags and requested source, without treating every development commit as a release',()=>{
  const history=['a','b','c','d','e'].map(c=>c.repeat(40)),[first,docs,feature,checkpoint,release]=history;
  assert.deepEqual(selectArchiveCommits({history,through:release,milestones:[first,feature],tags:[release]}),[first,feature,release]);
  assert.deepEqual(selectArchiveCommits({history,through:release,milestones:[first],requested:[checkpoint]}),[first,checkpoint,release]);assert.deepEqual(selectArchiveCommits({history,through:release,all:true}),history);
  assert.throws(()=>selectArchiveCommits({history,through:release,requested:['f'.repeat(40)]}),/outside/);assert.equal(docs.length,40);
});
