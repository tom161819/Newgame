import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,readFile,cp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseChangelog,prepareRelease,readRelease,validateDate } from '../scripts/changelog-lib.mjs';
import { versionParts,compareVersions,nextVersion } from '../src/data/semver.js';
import { seenVersionState } from '../src/ui/ChangelogPanel.js';

const history=`# Changelog\n\n## [Unreleased]\n\n### Added\n- A completed development change hidden from players.\n\n## [0.2.0] - 2026-11-03\n\n### Added\n- Players can manage a kingdom.\n\n### Fixed\n- Saved resources no longer duplicate.\n\n### Removed\n\n## [0.1.0] - 2026-11-02\n\n### Added\n- The first playable map.\n`;

test('semantic versions compare numerically and major/minor/patch bump only the intended component',()=>{
  assert.deepEqual(versionParts('0.1.0'),[0,1,0]);assert.equal(compareVersions('0.10.0','0.9.9'),1);assert.equal(compareVersions('0.1.0','0.1.0'),0);
  assert.equal(nextVersion('0.9.7','patch'),'0.9.8');assert.equal(nextVersion('0.9.7','minor'),'0.10.0');assert.equal(nextVersion('0.9.7','major'),'1.0.0');
  for(const bad of ['v0.1.0','0.1','00.1.0','0.01.0','-1.0.0','0.1.0-beta','1.2.9007199254740992'])assert.throws(()=>versionParts(bad));assert.throws(()=>nextVersion('0.1.0','commit'));
});
test('changelog generator returns real releases newest first, excludes Unreleased and empty categories, and preserves continuation text',()=>{
  const data=parseChangelog(history.replace('- The first playable map.','- The first playable map.\n  With a readable continuation.'),'0.2.0');
  assert.deepEqual(data.releases.map(r=>r.version),['0.2.0','0.1.0']);assert.equal(data.releases[0].date,'2026-11-03');assert.equal(data.releases[0].changes.removed,undefined);
  assert.equal(data.releases[1].changes.added[0],'The first playable map. With a readable continuation.');assert.ok(!JSON.stringify(data.releases).includes('hidden from players'));assert.equal(data.unreleased.changes.added.length,1);
});
test('release validation refuses mismatched or duplicate versions, empty releases, wrong dates, category errors and unsorted history',()=>{
  const cases=[history.replace('## [0.1.0]','## [0.2.0]'),history.replace('2026-11-03','2026-02-30'),history.replace('2026-11-03','03-11-2026'),history.replace('## [0.2.0]','## [0.0.1]'),history.replace('2026-11-02','2026-11-04'),history.replace('### Fixed','### Planned'),history.replace('## [Unreleased]','## [Unreleased]\n\n## [Unreleased]'),history.replace('### Added\n- The first playable map.','### Added')];
  for(const value of cases)assert.throws(()=>parseChangelog(value,'0.2.0'));
  assert.throws(()=>parseChangelog(history,'0.3.0'),/does not match/);assert.throws(()=>parseChangelog('# Changelog\n\n## [Unreleased]','0.1.0'),/no released versions/);assert.equal(validateDate('2024-02-29'),'2024-02-29');
});
test('release preparation moves only completed Unreleased changes and updates package plus both lockfile roots without changing save schema',()=>{
  const pkg={version:'0.2.0',scripts:{build:'vite build'}},lock={version:'0.2.0',packages:{'':{version:'0.2.0'},'node_modules/dependency':{version:'7.0.0'}}};
  for(const type of ['patch','minor','major']){const next=prepareRelease({markdown:history,pkg,lock},type,'2026-11-03'),data=parseChangelog(next.markdown,next.version);
    assert.equal(data.releases[0].changes.added[0],'A completed development change hidden from players.');assert.deepEqual(data.unreleased.changes,{});assert.deepEqual(data.releases.slice(1),parseChangelog(history,'0.2.0').releases);
    const updated=JSON.parse(next.lockText);assert.equal(JSON.parse(next.packageText).version,next.version);assert.equal(updated.version,next.version);assert.equal(updated.packages[''].version,next.version);assert.equal(updated.packages['node_modules/dependency'].version,'7.0.0');
  }
  assert.equal(pkg.version,'0.2.0');assert.equal(lock.version,'0.2.0');assert.throws(()=>prepareRelease({markdown:history.replace('### Added\n- A completed development change hidden from players.',''),pkg,lock},'minor','2026-11-03'),/no completed changes/);
});
test('NEW tracks only upgrades; first launch, invalid local data, same version and downgrades do not produce false updates',()=>{
  assert.deepEqual(seenVersionState('0.2.0',null),{seen:'0.2.0',isNew:false});assert.equal(seenVersionState('0.2.0','invalid').isNew,false);assert.equal(seenVersionState('0.2.0','0.1.0').isNew,true);
  assert.equal(seenVersionState('0.2.0','0.2.0').isNew,false);assert.deepEqual(seenVersionState('0.1.0','0.2.0'),{seen:'0.2.0',isNew:false});
});
test('release CLI prepares only local files and failure leaves all authoritative files unchanged',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'newgame-release-test-')),project=fileURLToPath(new URL('../',import.meta.url));
  try{
    for(const dir of ['scripts','src/data','src/systems'])await mkdir(path.join(root,dir),{recursive:true});
    await writeFile(path.join(root,'src/systems/GameStateSerializer.js'),'export const SAVE_VERSION=7;\n');
    for(const file of ['scripts/changelog-lib.mjs','scripts/prepare-release.mjs','src/data/semver.js','src/data/changelogCategories.js'])await cp(path.join(project,file),path.join(root,file));
    const pkg={type:'module',version:'0.2.0'},lock={version:'0.2.0',packages:{'':{version:'0.2.0'}}};
    await writeFile(path.join(root,'package.json'),JSON.stringify(pkg));await writeFile(path.join(root,'package-lock.json'),JSON.stringify(lock));await writeFile(path.join(root,'CHANGELOG.md'),history);
    const output=execFileSync(process.execPath,['scripts/prepare-release.mjs','minor','--date','2026-11-03'],{cwd:root,encoding:'utf8'});assert.match(output,/Prepared v0.3.0 locally/);const {data}=await readRelease(root);assert.equal(data.version,'0.3.0');assert.equal(data.releases.length,3);
    assert.deepEqual(data.releases[0].metadata,{title:'A completed development change hidden from players.',type:'feature',reconstructed:false,saveVersion:7},'#174: every release records its title, kind and save schema');
    const before=await Promise.all(['package.json','package-lock.json','CHANGELOG.md'].map(f=>readFile(path.join(root,f),'utf8')));
    assert.throws(()=>execFileSync(process.execPath,['scripts/prepare-release.mjs','patch','--date','2026-11-03'],{cwd:root,stdio:'pipe'}));
    assert.deepEqual(await Promise.all(['package.json','package-lock.json','CHANGELOG.md'].map(f=>readFile(path.join(root,f),'utf8'))),before);
    // #174: once a release recorded its schema, a changed SAVE_VERSION cannot ship as a patch.
    await writeFile(path.join(root,'CHANGELOG.md'),before[2].replace('## [Unreleased]\n','## [Unreleased]\n\n### Fixed\n- A later fix.\n'));await writeFile(path.join(root,'src/systems/GameStateSerializer.js'),'export const SAVE_VERSION=8;\n');
    assert.throws(()=>execFileSync(process.execPath,['scripts/prepare-release.mjs','patch','--date','2026-11-03'],{cwd:root,stdio:'pipe'}),/minor or major/);
    assert.match(execFileSync(process.execPath,['scripts/prepare-release.mjs','minor','--date','2026-11-03','--title','Schema 8'],{cwd:root,encoding:'utf8'}),/Prepared v0.4.0/);
    const schema=(await readRelease(root)).data.releases[0];assert.deepEqual([schema.version,schema.metadata.saveVersion,schema.metadata.title,schema.metadata.type],['0.4.0',8,'Schema 8','fix']);
    await writeFile(path.join(root,'package.json'),before[0]);await writeFile(path.join(root,'package-lock.json'),before[1]);await writeFile(path.join(root,'CHANGELOG.md'),before[2]);
    const broken=JSON.parse(before[1]);broken.packages[''].version='0.1.0';await writeFile(path.join(root,'package-lock.json'),JSON.stringify(broken));await assert.rejects(()=>readRelease(root),/do not match/);
  }finally{await rm(root,{recursive:true,force:true});}
});
