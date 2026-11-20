import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BLINK_MS } from '../src/ui/TutorialGuide.js';

test('owner 19 Nov 2026: the big start-guide arrow and the glowing box blink with one period',()=>{
  const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');
  const period=`tutorial-blink ${BLINK_MS/1000}s`;
  assert.match(css,new RegExp(`\\.tutorial-arrow\\.big:not\\(\\.offscreen\\) \\{[^}]*${period.replace('.','\\.')}`),'big arrow');
  assert.match(css,new RegExp(`\\.tutorial-spot \\{[^}]*${period.replace('.','\\.')}`),'glowing box');
  assert.match(css,/\.tutorial-spot \{[^}]*pointer-events:none/,'the box never takes the click');
  assert.match(css,/html \.tutorial-arrow\.big:not\(\.offscreen\) \{ width:120px; height:76px;/,'bigger arrow');
});
