import { recordsIn,verifyCatalog,immutableChanges } from './archive-lib.mjs';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
const root=fileURLToPath(new URL('../',import.meta.url)),directory=fileURLToPath(new URL('../public/versions/',import.meta.url));
const records=await recordsIn(directory);
if(!records.length)throw new Error('Archiv zatím neobsahuje žádné ověřené verze.');
verifyCatalog(records,JSON.parse(await readFile(new URL('../public/versions/versions.json',import.meta.url),'utf8')),await readFile(new URL('../public/versions/index.html',import.meta.url),'utf8'));
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();
const folders=ref=>{try{return git('ls-tree','--name-only',`${ref}:public/versions`).split('\n').filter(s=>/^[a-f0-9]{40}$/.test(s));}catch{return [];}};
let parent;try{parent=git('rev-parse','--verify','HEAD^');}catch{if(git('rev-parse','--is-shallow-repository')==='true')throw new Error('Kontrola neměnnosti vyžaduje alespoň dva commity historie.');}
const violations=[...immutableChanges(git('diff','--name-only','HEAD','--','public/versions').split('\n'),folders('HEAD')),
  ...(parent?immutableChanges(git('diff','--name-only','--no-renames',parent,'HEAD','--','public/versions').split('\n'),folders(parent)):[])];
if(violations.length)throw new Error(`Existující archiv se nesmí měnit ani mazat:\n${violations.join('\n')}`);
console.log(`Archiv: ${records.length} neměnných verzí, všechny soubory odpovídají SHA-256 manifestům.`);
