import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtemp,writeFile,rm,mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readSourceFacts } from '../scripts/git-source-facts.mjs';
test('batched source provenance reads actual original package versions, UTF8, dates and evidence without loading historical bundles',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'newgame-facts-')),git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
  try{git('init','-q');await mkdir(path.join(root,'src'));await writeFile(path.join(root,'src/real.js'),'export const original = true;');await writeFile(path.join(root,'package.json'),JSON.stringify({version:'0.1.0',description:'Původní hra 🏰'}));git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','Original game');const first=git('rev-parse','HEAD');await writeFile(path.join(root,'package.json'),JSON.stringify({version:'0.2.0'}));git('add','.');git('-c','user.name=Test','-c','user.email=test@example.invalid','commit','-qm','Actual next release');const second=git('rev-parse','HEAD');
    const facts=readSourceFacts(root,{packages:[first,second],evidence:[{commit:first,file:'src/real.js'}]});assert.equal(facts.packages.get(first).version,'0.1.0');assert.equal(facts.packages.get(first).description,'Původní hra 🏰');assert.equal(facts.packages.get(second).version,'0.2.0');assert.equal(facts.dates.get(first),git('show','-s','--format=%aI',first));assert.equal(facts.types.get(`${first}:src/real.js`),'blob');
    assert.throws(()=>readSourceFacts(root,{evidence:[{commit:first,file:'src/missing.js'}]}),/Missing/);assert.throws(()=>readSourceFacts(root,{commits:['a'.repeat(40)]}));assert.throws(()=>readSourceFacts(root,{commits:['HEAD']}),/Unsafe/);assert.throws(()=>readSourceFacts(root,{evidence:[{commit:first,file:'../outside'}]}),/Unsafe/);
  }finally{await rm(root,{recursive:true,force:true});}
});
