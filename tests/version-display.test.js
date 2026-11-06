import test from 'node:test';
import assert from 'node:assert/strict';
import { displayVersion,versionParts,nextVersion } from '../src/data/semver.js';
import { saveImpacts,saveImpactText } from '../scripts/version-catalog.mjs';
import { parseChangelog } from '../scripts/changelog-lib.mjs';

test('#174 players see MAJOR.MINOR.PATCH with two-digit MINOR and PATCH; canonical SemVer is unchanged',()=>{
  const cases={'0.3.0':'0.03.00','0.3.1':'0.03.01','0.4.0':'0.04.00','1.0.0':'1.00.00','0.3.100':'0.03.100','12.10.9':'12.10.09'};
  for(const [canonical,shown]of Object.entries(cases))assert.equal(displayVersion(canonical),shown,canonical);
  assert.equal(displayVersion(`0.3.0+git.${'a'.repeat(40)}`),'0.03.00+git.aaaaaaa','commit suffixes stay short');assert.equal(displayVersion('0.3.0+dev.working'),'0.03.00+dev.working');
  assert.equal(displayVersion('0.3.0-alpha.1'),'0.03.00-alpha.1');assert.equal(displayVersion('not a version'),'not a version','never throws in the UI');
  assert.throws(()=>versionParts('0.03.01'),'the padded form is display only; SemVer forbids leading zeros');assert.equal(nextVersion('0.3.99','patch'),'0.3.100');
  assert.equal(displayVersion('0.3.0').split('.').length,3,'exactly three numbers, no UPDATE part');
});

test('#174 every release shows its Save/Load impact from the SAVE_VERSION it recorded',()=>{
  const md=`# Changelog\n\n## [Unreleased]\n\n## [0.4.1] - 2026-11-08\n<!-- version: {"title":"Fix","type":"fix","reconstructed":false,"saveVersion":33} -->\n### Fixed\n- A fix.\n\n## [0.4.0] - 2026-11-07\n<!-- version: {"title":"Schema","type":"feature","reconstructed":false,"saveVersion":33} -->\n### Added\n- New data.\n\n## [0.3.1] - 2026-11-06\n<!-- version: {"title":"First","type":"feature","reconstructed":false,"saveVersion":32} -->\n### Added\n- Start.\n\n## [0.3.0] - 2026-11-04\n### Added\n- Old release without a recorded schema.\n`;
  const data=parseChangelog(md,'0.4.1'),impacts=saveImpacts(data.releases);
  assert.deepEqual(Object.fromEntries(impacts),{'0.4.1':{saveVersion:33,saveImpact:'compatible'},'0.4.0':{saveVersion:33,saveImpact:'newSchema'},'0.3.1':{saveVersion:32,saveImpact:'recorded'}});
  assert.equal(impacts.has('0.3.0'),false,'no invented impact for releases before the scheme');
  assert.match(saveImpactText({saveVersion:33,saveImpact:'newSchema'}),/cannot be loaded/);assert.match(saveImpactText({saveVersion:33,saveImpact:'compatible'}),/compatible/);
  assert.throws(()=>parseChangelog(md.replace('"saveVersion":33}','"saveVersion":0}'),'0.4.1'),/saveVersion/);
});
