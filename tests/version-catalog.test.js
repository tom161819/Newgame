import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,mkdir,writeFile,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { semanticVersion,versionParts } from '../src/data/semver.js';
import { parseChangelog,prepareRelease } from '../scripts/changelog-lib.mjs';
import { assembleVersionCatalog,catalogHTML,catalogContext,readVersionCatalog,sourceBuild } from '../scripts/version-catalog.mjs';
import { displayBuildVersion } from '../src/ui/VersionArchivePanel.js';

const a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40);
const metadata={title:'First playable map',type:'initial',reconstructed:true,commit:a};
const markdown=`# Changelog\n\n## [Unreleased]\n\n### Added\n- Private unfinished release notes.\n\n## [0.1.0] - 2026-11-03\n\n### Added\n- The original official release.\n\n## [0.1.0+archive.1] - 2026-11-01\n<!-- version: ${JSON.stringify(metadata)} -->\n\n### Added\n- A real historical feature.\n`;
const record={commit:a,date:'2026-11-01T12:00:00Z',sequence:1,basePath:`/Newgame/versions/${a}/`,available:true,originalVersion:'0.1.0',subject:'Original source',verification:{build:true,browser:true}};
const build={commit:c,date:'2026-11-04T12:00:00Z',dirty:false,tags:[]};
const assemble=(options={})=>assembleVersionCatalog({data:parseChangelog(markdown,'0.1.0'),records:[record],build,base:'/Newgame/',...options});

test('archival identifiers follow full SemVer while official release comparisons remain strict',()=>{
  for(const value of ['0.1.0+archive.1',`0.1.0+git.${a}`,'0.1.0-alpha.1+build.42'])assert.deepEqual(semanticVersion(value).parts,[0,1,0]);
  for(const bad of ['0.1.0+','0.1.0+archive..1','0.1.0-01','01.1.0+archive.1'])assert.throws(()=>semanticVersion(bad));
  assert.throws(()=>versionParts('0.1.0+archive.1'));assert.equal(displayBuildVersion(`0.1.0+git.${a}`),'0.01.00+git.aaaaaaa');assert.equal(displayBuildVersion('0.1.0+archive.12'),'0.01.00+archive.12');
});
test('reconstructed notes require explicit labels and actual full SHA; duplicate metadata is rejected',()=>{
  for(const value of [markdown.replace(a,'abc'),markdown.replace('+archive.1','+git.a'),markdown.replace('"reconstructed":true','"reconstructed":false'),markdown.replace('<!-- version:',`<!-- version: ${JSON.stringify(metadata)} -->\n<!-- version:`),markdown.replace('## [Unreleased]',`## [Unreleased]\n<!-- version: ${JSON.stringify(metadata)} -->`)])assert.throws(()=>parseChangelog(value,'0.1.0'));
});
test('central catalog preserves original numbers and URLs; snapshots are not invented releases',()=>{
  const catalog=assemble({records:[record,{...record,commit:b,sequence:2,date:'2026-11-02T12:00:00Z',basePath:`/Newgame/versions/${b}/`}]});
  assert.equal(catalog.versions.length,2);assert.equal(catalog.builds.length,2);assert.equal(catalog.versions[1].version,'0.1.0+archive.1');assert.equal(catalog.versions[1].archiveURL,record.basePath);
  assert.equal(catalog.versions[0].version,'0.1.0');assert.equal(catalog.versions[0].reconstructed,false);assert.equal(catalog.currentBuild.version,`0.1.0+dev.${c}`);
  assert.deepEqual(catalog.builds.map(v=>v.gameVersion),['0.1.0','0.1.0']);assert.equal(new Set([...catalog.versions,...catalog.builds,catalog.currentBuild].map(v=>v.version)).size,5);
  assert.deepEqual(catalog.builds.map(v=>[v.buildNumber,v.buildLabel]),[[2,`Archive build 2 · v0.01.00 · ${b.slice(0,7)}`],[1,`Archive build 1 · v0.01.00 · ${a.slice(0,7)}`]]);assert.equal(catalog.builds.every(v=>v.releaseType==='snapshot'&&!catalog.versions.some(r=>r.version===v.version)),true);
  assert.equal(JSON.stringify(catalog).includes('Private unfinished release notes'),false);assert.ok(catalogHTML(catalog).includes(`href="${record.basePath}"`));
});
test('missing verified build is unavailable everywhere, without a fake Play link',()=>{
  const catalog=assemble({records:[{...record,available:false}]});const historical=catalog.versions.find(v=>v.reconstructed);
  assert.equal(historical.available,false);assert.equal(historical.archiveURL,null);assert.equal(catalog.builds[0].archiveURL,null);assert.ok(!catalogHTML(catalog).includes(`href="${record.basePath}"`));
});
test('unavailable milestones still sort by their actual commit time, rather than falling below older builds from the same day',()=>{
  const data=parseChangelog(markdown,'0.1.0');data.releases.push({version:'0.1.0+archive.2',date:'2026-11-01',metadata:{...metadata,commit:b,title:'Later same-day milestone'},resolvedCommitDate:'2026-11-01T13:00:00Z',changes:{added:['A real later change.']}});
  const catalog=assemble({data});assert.deepEqual(catalog.versions.filter(v=>v.reconstructed).map(v=>v.commit),[b,a]);assert.equal(catalog.versions.find(v=>v.commit===b).available,false);
});
test('catalog refuses duplicate commits, unsafe or mismatching URLs, duplicate anchors and inaccurate dates',()=>{
  assert.throws(()=>assemble({records:[record,record]}),/unique/);assert.throws(()=>assemble({records:[record,{...record,commit:b,basePath:`/Newgame/versions/${b}/`}]}),/build numbers/);assert.throws(()=>assemble({records:[{...record,sequence:0}]}),/build numbers/);
  for(const basePath of [`https://example.com/versions/${a}/`,`/Newgame/versions/${b}/`,'/../versions/'])assert.throws(()=>assemble({records:[{...record,basePath}]}));
  assert.throws(()=>assemble({records:[{...record,date:'2026-11-02T00:00:00Z'}]}),/date/);
  const data=parseChangelog(markdown,'0.1.0');data.releases[0].resolvedCommit=a;assert.throws(()=>assemble({data}),/two distinct/);
  data.releases[0].resolvedCommit=null;data.releases.push(data.releases[1]);assert.throws(()=>assemble({data}),/Duplicate catalog/);
});
test('release preparation preserves all historical entries, advances only the official version and hides Unreleased',()=>{
  const pkg={version:'0.1.0'},lock={version:'0.1.0',packages:{'':{version:'0.1.0'}}},next=prepareRelease({markdown,pkg,lock},'minor','2026-11-04');
  const before=parseChangelog(markdown,pkg.version),after=parseChangelog(next.markdown,next.version);assert.equal(next.version,'0.2.0');assert.deepEqual(after.releases.slice(1),before.releases);assert.deepEqual(after.unreleased.changes,{});
  assert.equal(after.releases[0].changes.added[0],'Private unfinished release notes.');
});
test('static archive escapes authored text, preserves every canonical URL and links to actual release changes',()=>{
  const catalog=assemble();catalog.versions[0].title='<img src=x onerror=alert(1)>';const html=catalogHTML(catalog);
  assert.ok(html.includes('&lt;img'));assert.ok(!html.includes('<img'));assert.ok(html.includes('?changelog=0.1.0%2Barchive.1'));assert.ok(html.includes(`href="${record.basePath}"`));
  assert.ok(html.includes('Reconstructed archive labels'));
  // m-verzovani-archivu: snapshots show their time-ordered number (#174 two-digit places); the old label is the tooltip.
  const build=catalog.builds[0];assert.ok(build.number,'every snapshot has a number');
  assert.ok(html.includes(`data-archive-number="${build.number}"`));assert.ok(html.includes(`title="Archive build 1 · v0.01.00 · ${a.slice(0,7)}"`));assert.ok(html.includes('data-build-number="1"'));assert.ok(html.includes('not a release'));
});
test('git-archive builds use exact exported provenance and original metadata without nested archives',async()=>{
  const root=await mkdtemp(path.join(tmpdir(),'newgame-catalog-'));
  try{
    await mkdir(path.join(root,'public/versions'),{recursive:true});await writeFile(path.join(root,'public/versions/versions.json'),JSON.stringify([record]));
    const environment={GAME_BUILD_COMMIT:c,GAME_BUILD_DATE:build.date,GAME_BUILD_TAG:'v0.1.0'},release={data:parseChangelog(markdown,'0.1.0')};
    assert.equal(sourceBuild(root,environment).commit,c);assert.equal(sourceBuild(root,environment).repository,false);
    await assert.rejects(()=>readVersionCatalog(root,{base:record.basePath,environment,release}),/actual source commit/);
    const catalog=await readVersionCatalog(root,{base:`/Newgame/versions/${c}/`,environment,release});assert.equal(catalog.currentBuild.commit,c);assert.equal(catalog.builds[0].gameVersion,'0.1.0');assert.equal(catalog.versions.find(v=>v.reconstructed).available,true);
    const main=await readVersionCatalog(root,{environment,release});assert.equal(main.builds[0].available,false);assert.equal(main.versions[0].commit,c);assert.equal(main.versions[0].tag,'v0.1.0');
    assert.deepEqual(catalogContext(`/Newgame/versions/${c}/`),{base:`/Newgame/versions/${c}/`,projectBase:'/Newgame/',archiveCommit:c});
  }finally{await rm(root,{recursive:true,force:true});}
});
