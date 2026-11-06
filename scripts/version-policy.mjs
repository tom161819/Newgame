import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { saveVersionFrom } from './changelog-lib.mjs';
import { checkVersionPolicy,CHANGE_RECORD } from './version-policy-lib.mjs';
import { displayVersion } from '../src/data/semver.js';

// #174 version gate. CI passes --base=HEAD^1 (the pull request merge commit's main parent); locally it compares the
// working tree with origin/main. Read-only: it never commits, tags, pushes or edits files.
const root=fileURLToPath(new URL('../',import.meta.url)),args=process.argv.slice(2);
const option=name=>args.find(a=>a.startsWith(`--${name}=`))?.slice(name.length+3);
const git=(...params)=>execFileSync('git',params,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe'],maxBuffer:16*1024*1024}).trim();
try{
  const base=option('base')??'origin/main',mergeBase=git('merge-base',base,'HEAD');
  const atBase=file=>git('show',`${base}:${file}`),local=file=>readFile(path.join(root,file),'utf8');
  const changed=[...new Set([...git('diff','--name-only',mergeBase).split('\n'),...git('ls-files','--others','--exclude-standard').split('\n')].filter(Boolean))].sort();
  const records=await Promise.all(changed.filter(file=>CHANGE_RECORD.test(file)&&existsSync(path.join(root,file))).map(async file=>({path:file,text:await local(file)})));
  const [baseVersion,headVersion]=[JSON.parse(atBase('package.json')).version,JSON.parse(await local('package.json')).version];
  const result=checkVersionPolicy({
    base:{version:baseVersion,save:saveVersionFrom(atBase('src/systems/GameStateSerializer.js')),changelog:atBase('CHANGELOG.md')},
    head:{version:headVersion,save:saveVersionFrom(await local('src/systems/GameStateSerializer.js')),changelog:await local('CHANGELOG.md')},
    changed,records});
  const summary=`Version policy: ${baseVersion} → ${headVersion} (shown v${displayVersion(headVersion)}), ${result.bump??'no release'}; ${result.app.length} game file(s), SAVE_VERSION ${result.saveChanged?'changed':'unchanged'}, ${records.length} change record(s).`;
  if(!result.errors.length){console.log(`${summary} PASS.`);process.exit(0);}
  for(const error of result.errors)console.error(`- ${error}`);
  if(!result.enforced){console.log(`${summary}\nREPORT ONLY: main has no release written under the #174 scheme yet, so these findings do not block this pull request.`);process.exit(0);}
  console.error(`${summary} FAILED.`);process.exitCode=1;
}catch(error){console.error(`Version policy could not run: ${error.message}`);process.exitCode=1;}
