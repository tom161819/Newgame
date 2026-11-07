import test from 'node:test';
import assert from 'node:assert/strict';
import { POLICY_LEVELS,policyIcon } from '../src/ui/PolicySliders.js';
import { TAX_RATES,RATIONS } from '../src/data/policy.js';
import { readFileSync } from 'node:fs';
import { POLICY_ICON_SETS,policyIconsModule } from '../scripts/sync-policy-icons.mjs';

test('the sliders take their levels from the policy data (5 tax rates, 3 rations) and every level has its own icon',()=>{
  assert.deepEqual(POLICY_LEVELS.tax,Object.keys(TAX_RATES));assert.deepEqual(POLICY_LEVELS.rations,Object.keys(RATIONS));
  assert.deepEqual(POLICY_LEVELS.tax,['none','low','normal','high','very_high']);assert.deepEqual(POLICY_LEVELS.rations,['small','normal','generous']);
  for(const kind of ['tax','rations']){const icons=POLICY_LEVELS[kind].map(level=>policyIcon(kind,level));assert.equal(new Set(icons).size,icons.length,kind);for(const icon of icons)assert.match(icon,/^<svg [^>]*viewBox="0 0 40 40".*<\/svg>$/s);}
  // The icons are the Studio sets the owner chose: each level shows its own exported SVG, and the copy is up to date.
  for(const [kind,{variant,levels}] of Object.entries(POLICY_ICON_SETS))for(const [level,file] of Object.entries(levels))
    assert.equal(policyIcon(kind,level).replace(' aria-hidden="true"',''),readFileSync(`${variant}.${file}.svg`,'utf8').trim(),`${kind} ${level}`);
  assert.equal(readFileSync('src/ui/policyIconsArt.js','utf8'),policyIconsModule(),'run node scripts/sync-policy-icons.mjs');
});
