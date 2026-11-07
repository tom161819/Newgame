import test from 'node:test';
import assert from 'node:assert/strict';
import { POLICY_LEVELS,policyIcon } from '../src/ui/PolicySliders.js';
import { TAX_RATES,RATIONS } from '../src/data/policy.js';

test('the sliders take their levels from the policy data (5 tax rates, 3 rations) and every level has its own icon',()=>{
  assert.deepEqual(POLICY_LEVELS.tax,Object.keys(TAX_RATES));assert.deepEqual(POLICY_LEVELS.rations,Object.keys(RATIONS));
  assert.deepEqual(POLICY_LEVELS.tax,['none','low','normal','high','very_high']);assert.deepEqual(POLICY_LEVELS.rations,['small','normal','generous']);
  for(const kind of ['tax','rations']){const icons=POLICY_LEVELS[kind].map(level=>policyIcon(kind,level));assert.equal(new Set(icons).size,icons.length,kind);for(const icon of icons)assert.match(icon,/^<svg [^>]*viewBox="0 0 40 40".*<\/svg>$/s);}
  // More gold, more coins drawn.
  const coins=level=>(policyIcon('tax',level).match(/<ellipse/g)??[]).length;assert.ok(coins('low')<coins('normal'));assert.equal(coins('none'),0);
});
