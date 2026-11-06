import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { artifactConfig, outDir, root } from '../scripts/artifact.vite.config.mjs';

test('build:artifact builds the game with relative URLs while the release plugin still sees an absolute base', () => {
  const seen = [];
  const release = { name: 'game-release-data', configResolved(resolved) { seen.push(resolved.base); } };
  const other = { name: 'other', configResolved() { seen.push('other'); } };
  const config = artifactConfig({ plugins: [release, other], build: { copyPublicDir: false } });
  assert.equal(config.base, './');
  assert.equal(config.root, root);
  assert.equal(config.build.outDir, outDir);
  assert.equal(path.basename(outDir), 'dist-artifact');
  assert.equal(config.build.copyPublicDir, false, 'the repository build options are kept');
  config.plugins[0].configResolved({ base: './', build: {} });
  config.plugins[1].configResolved({ base: './' });
  assert.deepEqual(seen, ['/', 'other']);
  assert.equal(config.plugins[1], other, 'other plugins are untouched');
});
