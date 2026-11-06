import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,cp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync,spawnSync } from 'node:child_process';
import { checkVersionPolicy,changeRecordProblems,CHANGE_RECORD_SECTIONS } from '../scripts/version-policy-lib.mjs';

const record=(extra='')=>CHANGE_RECORD_SECTIONS.map(s=>`## ${s}\n${s} text.${extra}\n`).join('\n');
const log=(version,save,unreleased='')=>`# Changelog\n\n## [Unreleased]\n${unreleased}\n## [${version}] - 2026-11-06\n<!-- version: ${JSON.stringify({title:'T',type:'feature',reconstructed:false,...(save?{saveVersion:save}:{})})} -->\n### Added\n- A release.\n\n## [0.2.0] - 2026-11-01\n### Added\n- Older release.\n`;
const base={version:'0.4.0',save:33,changelog:log('0.4.0',33)};
const docs=[{path:'docs/changes/1-x.md',text:record()}];
const check=(head,changed,records=docs,b=base)=>checkVersionPolicy({base:b,head,changed,records});

test('#174 a game change ships as the next PATCH with a recorded release; Studio, scripts and docs need no release',()=>{
  assert.deepEqual(check({version:'0.4.1',save:33,changelog:log('0.4.1',33)},['src/ui/X.js','docs/changes/1-x.md']).errors,[]);
  const unreleased=check({version:'0.4.0',save:33,changelog:base.changelog},['src/ui/X.js']);assert.equal(unreleased.enforced,true);assert.match(unreleased.errors.join(),/without a release/);
  for(const file of ['index.html','public/assets/a.png','vite.config.js'])assert.match(check({version:'0.4.0',save:33,changelog:base.changelog},[file]).errors.join(),/without a release/,file);
  for(const file of ['studio/src/main.js','scripts/x-smoke.mjs','tests/a.test.js','public/versions/abc/index.html'])assert.deepEqual(check({version:'0.4.0',save:33,changelog:base.changelog},[file]).errors,[],file);
  assert.deepEqual(check({version:'0.4.0',save:33,changelog:base.changelog},['docs/COORDINATION.md'],[]).errors,[],'coordination-only updates need no record');
});

test('#174 a new SAVE_VERSION needs MINOR or MAJOR; versions never skip, repeat or go back',()=>{
  assert.match(check({version:'0.4.1',save:34,changelog:log('0.4.1',34)},['src/systems/A.js']).errors.join(),/MINOR 0\.5\.0/);
  assert.deepEqual(check({version:'0.5.0',save:34,changelog:log('0.5.0',34)},['src/systems/A.js']).errors,[]);
  assert.deepEqual(check({version:'1.0.0',save:34,changelog:log('1.0.0',34)},['src/systems/A.js']).errors,[]);
  for(const version of ['0.4.2','0.3.9','0.6.0'])assert.match(check({version,save:33,changelog:log(version,33)},['src/a.js']).errors.join(),/skips or goes back/,version);
  assert.match(check({version:'0.4.1',save:33,changelog:log('0.4.1',32)},['src/a.js']).errors.join(),/must record the SAVE_VERSION/);
  assert.match(check({version:'0.4.1',save:33,changelog:log('0.4.1',33,'\n### Fixed\n- Still hidden.\n')},['src/a.js']).errors.join(),/Unreleased must be empty/);
});

test('#174 every non-docs pull request carries a complete change record for the next agent',()=>{
  assert.match(check({version:'0.4.0',save:33,changelog:base.changelog},['scripts/a.mjs'],[]).errors.join(),/Add a change record/);
  assert.deepEqual(changeRecordProblems(record()),[]);
  assert.deepEqual(changeRecordProblems(record().replace('## Testing\nTesting text.\n','## Testing\n<!-- todo -->\n')),['section "## Testing" is empty']);
  assert.deepEqual(changeRecordProblems('## What and why\nx'),CHANGE_RECORD_SECTIONS.slice(1).map(s=>`missing section "## ${s}"`));
});

test('#174 bootstrap: findings only report until main has a release written under the scheme',()=>{
  const old={version:'0.3.0',save:32,changelog:log('0.3.0',null)};
  const result=check({version:'0.3.0',save:32,changelog:old.changelog},['src/a.js'],[],old);assert.equal(result.enforced,false);assert.ok(result.errors.length>=2);
});

test('#174 the CLI compares a branch with its base through Git and exits non-zero only when enforced',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'newgame-version-policy-')),project=fileURLToPath(new URL('../',import.meta.url));
  const git=(...a)=>execFileSync('git',a,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']});
  try{
    for(const dir of ['scripts','src/data','src/systems','src/ui','docs/changes'])await mkdir(path.join(root,dir),{recursive:true});
    for(const file of ['scripts/version-policy.mjs','scripts/version-policy-lib.mjs','scripts/changelog-lib.mjs','src/data/semver.js','src/data/changelogCategories.js'])await cp(path.join(project,file),path.join(root,file));
    const files=async(version,save,changelog)=>{await writeFile(path.join(root,'package.json'),JSON.stringify({type:'module',version}));await writeFile(path.join(root,'src/systems/GameStateSerializer.js'),`export const SAVE_VERSION=${save};\n`);await writeFile(path.join(root,'CHANGELOG.md'),changelog);};
    git('init','-q','-b','main');git('config','user.email','t@t');git('config','user.name','t');
    await files('0.4.0',33,log('0.4.0',33));await writeFile(path.join(root,'src/ui/A.js'),'a\n');git('add','-A');git('commit','-qm','base');
    git('checkout','-qb','feature');await writeFile(path.join(root,'src/ui/A.js'),'b\n');
    const run=()=>spawnSync(process.execPath,['scripts/version-policy.mjs','--base=main'],{cwd:root,encoding:'utf8'});
    let r=run();assert.equal(r.status,1,r.stdout+r.stderr);assert.match(r.stderr,/without a release/);assert.match(r.stderr,/Add a change record/);
    await files('0.4.1',33,log('0.4.1',33));await writeFile(path.join(root,'docs/changes/1-a.md'),record());
    r=run();assert.equal(r.status,0,r.stdout+r.stderr);assert.match(r.stdout,/0\.4\.0 → 0\.4\.1 \(shown v0\.04\.01\), patch.*PASS/);
  }finally{await rm(root,{recursive:true,force:true});}
});
