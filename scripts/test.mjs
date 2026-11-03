import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
// Explicit discovery avoids traversing thousands of frozen deployment files.
const files=[];
async function discover(directory){for(const entry of await readdir(directory,{withFileTypes:true})){const file=path.join(directory,entry.name);if(entry.isDirectory())await discover(file);else if(entry.isFile()&&entry.name.endsWith('.test.js'))files.push(file);}}
await discover(fileURLToPath(new URL('../tests/',import.meta.url)));files.sort();
if(!files.length)throw new Error('No regression tests found.');
const result=spawnSync(process.execPath,['--test',...process.argv.slice(2),...files],{stdio:'inherit'});if(result.error)throw result.error;process.exitCode=result.status??1;
