import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync,readdirSync,statSync } from 'node:fs';
import path from 'node:path';

// Owner 19 Nov 2026: black squares on the map. A dropped Wood or Ore pile used an SVG with only a viewBox; WebGL cannot
// upload an SVG image without an intrinsic size ("texImage2D: bad image data") and drew it black.
const walk=dir=>readdirSync(dir).flatMap(n=>{const p=path.join(dir,n);return statSync(p).isDirectory()?walk(p):p.endsWith('.svg')?[p]:[];});
test('every SVG used as a game texture has width and height on its root',()=>{
  const root=new URL('../public/assets/',import.meta.url).pathname,missing=[];
  for(const f of walk(root)){const tag=readFileSync(f,'utf8').match(/<svg[^>]*>/)?.[0]??'';if(!/\swidth="/.test(tag)||!/\sheight="/.test(tag))missing.push(path.relative(root,f));}
  assert.deepEqual(missing,[]);
});
