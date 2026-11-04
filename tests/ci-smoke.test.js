import test from 'node:test';
import assert from 'node:assert/strict';
import { smokeScope } from '../scripts/ci-smoke.mjs';
test('CI avoids opening historical games for unrelated changes but retains relevant archive and full release/model checks',()=>{
  const same={previousVersion:'0.1.0',currentVersion:'0.1.0'};assert.equal(smokeScope({...same,paths:['docs/readme.md','tests/pathfinding.test.js']}),'current');assert.equal(smokeScope({...same,paths:['public/versions/versions.json']}),'archive');assert.equal(smokeScope({...same,paths:['src/ui/VersionArchivePanel.js']}),'archive');assert.equal(smokeScope({...same,paths:['scripts/stage-archive.mjs']}),'archive');assert.equal(smokeScope({...same,paths:['src/game/GameScene.js']}),'full');assert.equal(smokeScope({...same,paths:['src/systems/GameStateSerializer.js']}),'full');assert.equal(smokeScope({...same,currentVersion:'0.2.0'}),'full');assert.equal(smokeScope({...same,manual:true}),'full');
  assert.equal(smokeScope({...same,paths:['src/data/objects/buildings.js']}),'full');assert.equal(smokeScope({...same,paths:['src/data/seasons.js']}),'full');assert.equal(smokeScope({...same,paths:['src/data/semver.js']}),'archive');
  for(const file of ['src/ui/PopulationSidebar.js','src/ui/MissingWorkersIndicators.js','src/ui/WorkplacePanel.js','scripts/staffing-smoke.mjs','scripts/forestry-smoke.mjs','scripts/mineral-smoke.mjs','scripts/zoom-smoke.mjs'])assert.equal(smokeScope({...same,paths:[file]}),'full');
});
