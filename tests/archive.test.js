import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm,readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { projectBase,escapeHTML,archiveIndex,archiveRuntime,fileHashes,verifySnapshot,releaseMetadata,verifyCatalog,immutableChanges } from '../scripts/archive-lib.mjs';

test('archive paths and commit metadata remain safe while index links target each immutable revision',()=>{
  assert.equal(projectBase('/Newgame/'),'/Newgame/');assert.equal(projectBase('/'),'/');for(const bad of ['../','/a/../','/x"/','https://other/','/Newgame'])assert.throws(()=>projectBase(bad));
  const commit='a'.repeat(40),html=archiveIndex([{commit,name:'<name>',description:'<script>bad()</script>',date:'2026-11-03T12:00:00Z',sequence:1}],'/Newgame/');
  assert.ok(html.includes(`/Newgame/versions/${commit}/`));assert.ok(html.includes('href="/Newgame/"'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>bad()'));assert.equal(escapeHTML('"&'), '&quot;&amp;');
});

test('snapshot verification accepts only the exact verified files and refuses a rewrite, removal or extra file',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'newgame-archive-test-'));try{
    await writeFile(path.join(dir,'index.html'),'old revision');await writeFile(path.join(dir,'archive-runtime.js'),'isolation');const commit='b'.repeat(40),record={schema:1,commit,verification:{browser:true},files:await fileHashes(dir)};
    await writeFile(path.join(dir,'snapshot.json'),JSON.stringify(record));assert.equal((await verifySnapshot(dir,commit)).commit,commit);
    await writeFile(path.join(dir,'index.html'),'current code');await assert.rejects(()=>verifySnapshot(dir,commit),/nepřepisuje/);await writeFile(path.join(dir,'index.html'),'old revision');await writeFile(path.join(dir,'extra.js'),'extra');await assert.rejects(()=>verifySnapshot(dir,commit));await rm(path.join(dir,'extra.js'));await rm(path.join(dir,'archive-runtime.js'));await assert.rejects(()=>verifySnapshot(dir,commit));
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('archive runtime namespaces local/session settings and IndexedDB without clearing main-game data',()=>{
  class Storage{constructor(){this.values=new Map();}get length(){return this.values.size;}key(index){return [...this.values.keys()][index]??null;}getItem(key){return this.values.get(String(key))??null;}setItem(key,value){this.values.set(String(key),String(value));}removeItem(key){this.values.delete(String(key));}clear(){this.values.clear();}}
  const storage=new Storage();storage.setItem('setting','main');const calls=[],idb={open(...args){calls.push(['open',...args]);},deleteDatabase(...args){calls.push(['delete',...args]);}},window={indexedDB:idb};runInNewContext(archiveRuntime('c'.repeat(40),'/Newgame/'),{Storage,window});
  assert.equal(storage.getItem('setting'),null);storage.setItem('setting','old');assert.equal(storage.getItem('setting'),'old');assert.equal(storage.length,1);assert.equal(storage.key(0),'setting');assert.equal(storage.values.get('setting'),'main');storage.clear();assert.equal(storage.values.get('setting'),'main');assert.equal(storage.length,0);
  idb.open('newgame-saves',1);idb.deleteDatabase('newgame-saves');assert.equal(calls[0][1],`newgame-archive-${'c'.repeat(40)}:newgame-saves`);assert.equal(calls[0][2],1);assert.equal(calls[1][1],calls[0][1]);assert.equal(window.__NEWGAME_ARCHIVE_ROOT__,'/Newgame/versions/');
});

test('release labels come from the actual exported source tree, including checkpoint distinction',async()=>{
  const dir=await mkdtemp(path.join(tmpdir(),'newgame-archive-label-'));try{
    await mkdir(path.join(dir,'src/systems'),{recursive:true});await writeFile(path.join(dir,'src/systems/SkillSystem.js'),'');assert.equal((await releaseMetadata(dir,'x','unknown')).name,'První prototyp pohybu');await writeFile(path.join(dir,'src/systems/WorkerSystem.js'),'');assert.equal((await releaseMetadata(dir,'x','feature')).name,'Skilly a profese');assert.match((await releaseMetadata(dir,'x','Checkpoint verified skills')).name,/kontrolní bod/);
  }finally{await rm(dir,{recursive:true,force:true});}
});

test('catalog requires every stored revision and deployment rejects any change inside an already published snapshot',()=>{
  const commit='d'.repeat(40),record={commit,tree:'e'.repeat(40),basePath:`/Newgame/versions/${commit}/`};
  verifyCatalog([record],[record],`<a href="${record.basePath}">play</a>`);assert.throws(()=>verifyCatalog([record],[],''));assert.throws(()=>verifyCatalog([record],[record],'<a href="/wrong">play</a>'));
  assert.deepEqual(immutableChanges([`public/versions/${commit}/index.html`,`public/versions/${'f'.repeat(40)}/index.html`,'public/versions/index.html'],[commit]),[`public/versions/${commit}/index.html`]);
});
