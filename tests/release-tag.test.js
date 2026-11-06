import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseTagTarget } from '../scripts/release-tag-lib.mjs';

test('#174 a release is tagged on the first main commit that carries its version',()=>{
  const h=[{commit:'c3',version:'0.4.0'},{commit:'c2',version:'0.4.0'},{commit:'c1',version:'0.4.0'},{commit:'b',version:'0.3.0'}];
  assert.deepEqual(releaseTagTarget(h),{tag:'v0.4.0',version:'0.4.0',commit:'c1'},'later docs-only merges do not move the tag');
  assert.deepEqual(releaseTagTarget([{commit:'r',version:'0.4.1'},{commit:'c3',version:'0.4.0'}]),{tag:'v0.4.1',version:'0.4.1',commit:'r'});
  assert.throws(()=>releaseTagTarget([]));assert.throws(()=>releaseTagTarget([{commit:'x',version:'0.04.01'}]));
});
