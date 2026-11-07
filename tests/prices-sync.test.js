import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile,readdir,cp,mkdtemp,writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { objectDefinitions } from '../src/data/objects/index.js';
import { planPriceSync,rewriteCost,normalizeProposals } from '../scripts/prices-sync-lib.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),registry=new ObjectRegistry(objectDefinitions);
const p=(buildingId,cost,at='2026-11-07T01:00:00Z')=>({buildingId,cost,by:'owner',at,note:''});

test('the plan applies changed, added and removed resources and reports what it ignores', () => {
  const plan=planPriceSync([p('house',{wood:6,stone:4,gold:5}),p('warehouse',{wood:30}),p('nothing',{stone:1}),p('tower',{dragon:1}),p('mill',{}),p('bakery',{stone:0}),p('farmhouse',{stone:10})],registry);
  assert.deepEqual(plan.applied.map(c=>[c.buildingId,c.cost,c.added,c.removed]),[['house',{wood:6,stone:4,gold:5},['gold'],[]],['warehouse',{wood:30},['wood'],['stone']]]);
  assert.deepEqual(plan.ignored.map(i=>[i.buildingId,i.reason]),[['nothing','unknown building'],['tower','unknown resource dragon'],['mill','empty price'],['bakery','invalid amount of stone'],['farmhouse','unchanged']]);
  assert.deepEqual([...plan.remove].sort(),['farmhouse','house','warehouse'],'unchanged proposals are already in the game; invalid ones stay for the owner');
});

test('Studio documents are read with their ids, and the newest proposal for a building wins', () => {
  const docs={documents:[{id:'house',data:p('house',{wood:7},'2026-11-07T02:00:00Z')},{id:'house-old',data:p('house',{wood:3},'2026-11-07T01:00:00Z')}]};
  assert.equal(normalizeProposals(docs)[0].docId,'house');
  const plan=planPriceSync(docs,registry);
  assert.deepEqual(plan.applied.map(c=>[c.buildingId,c.cost]),[['house',{wood:7}]]);
  assert.deepEqual(plan.remove.sort(),['house','house-old']);
  assert.throws(()=>normalizeProposals({}),/list of price proposals/);
});

test('every buildable price can be rewritten in the definition sources', async () => {
  const dir=path.join(root,'src/data/objects'),files=await Promise.all((await readdir(dir)).filter(n=>n.endsWith('.js')).map(async n=>[n,await readFile(path.join(dir,n),'utf8')]));
  for(const definition of registry.buildables()){
    const hits=files.map(([n,text])=>[n,rewriteCost(text,definition.id,{wood:7})]).filter(([,t])=>t!==null);
    assert.equal(hits.length,1,`${definition.id} found once`);
    const [name,changed]=hits[0],original=files.find(([n])=>n===name)[1];
    assert.notEqual(changed,original,definition.id);assert.equal(rewriteCost(changed,definition.id,definition.cost),original,`${definition.id} round trip keeps the file`);
  }
});

test('prices:sync writes the new defaults into a copy of the game and the registry reads them', async () => {
  const tmp=await mkdtemp(path.join(os.tmpdir(),'prices-sync-'));
  await cp(path.join(root,'src'),path.join(tmp,'src'),{recursive:true});await cp(path.join(root,'scripts/prices-sync.mjs'),path.join(tmp,'scripts/prices-sync.mjs'));await cp(path.join(root,'scripts/prices-sync-lib.mjs'),path.join(tmp,'scripts/prices-sync-lib.mjs'));
  await writeFile(path.join(tmp,'package.json'),JSON.stringify({type:'module'}));
  const input=path.join(tmp,'prices.json');await writeFile(input,JSON.stringify([p('house',{wood:6,gold:5}),p('bowyer',{stone:9}),p('brazier',{stone:2,wood:1}),p('tower',{stone:12}),p('wheat_field',{wood:1})]));
  const out=JSON.parse(execFileSync(process.execPath,[path.join(tmp,'scripts/prices-sync.mjs'),input,'--json'],{encoding:'utf8'}));
  assert.deepEqual(out.applied.map(c=>c.buildingId).sort(),['bowyer','brazier','house','tower','wheat_field']);
  const costs=JSON.parse(execFileSync(process.execPath,['--input-type=module','-e',`const {objectRegistry:r}=await import(${JSON.stringify(path.join(tmp,'src/systems/ObjectRegistry.js'))});console.log(JSON.stringify(Object.fromEntries(['house','bowyer','brazier','tower','wheat_field','warehouse'].map(id=>[id,r.require(id).cost]))));`],{encoding:'utf8'}));
  assert.deepEqual(costs,{house:{wood:6,gold:5},bowyer:{stone:9},brazier:{stone:2,wood:1},tower:{stone:12},wheat_field:{wood:1},warehouse:{stone:10}});
  const dry=JSON.parse(execFileSync(process.execPath,[path.join(tmp,'scripts/prices-sync.mjs'),input,'--json','--dry-run'],{encoding:'utf8'}));
  assert.equal(dry.applied.length,0,'after applying, the same proposals are unchanged');assert.equal(dry.ignored.filter(i=>i.reason==='unchanged').length,5);
});
