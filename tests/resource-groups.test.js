// m-ui-prehled-surovin: every collectible resource belongs to exactly one group and has an icon.
import test from 'node:test';
import assert from 'node:assert/strict';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';
import { resourceGroup,groupedResources,RESOURCE_GROUPS,STORE_PREVIEW_DELAY_MS } from '../src/data/resourceGroups.js';

test('each resource is in one group, with an icon; groups keep their order',()=>{
  const all=objectRegistry.byCategory('resource').filter(d=>d.collectible);
  for(const d of all){assert.ok(RESOURCE_GROUPS.includes(resourceGroup(d,objectRegistry)),d.id);assert.ok(d.sprite||d.icon,`${d.id} has an icon`);}
  const g=id=>resourceGroup(objectRegistry.get(id),objectRegistry);
  assert.deepEqual([g('gold'),g('wood'),g('stone'),g('iron'),g('wheat'),g('flour'),g('bread'),g('meat'),g('sword'),g('wheelbarrow')],['gold','materials','materials','materials','foodRaw','foodRaw','food','food','equipment','equipment']);
  const order=groupedResources(all,objectRegistry).map(d=>RESOURCE_GROUPS.indexOf(resourceGroup(d,objectRegistry)));
  assert.deepEqual(order,[...order].sort((a,b)=>a-b));assert.equal(STORE_PREVIEW_DELAY_MS,600);
});
