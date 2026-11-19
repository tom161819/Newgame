import test from 'node:test';
import assert from 'node:assert/strict';
import { worldClasses,pickClass,ORDER_ICONS } from '../src/ui/WorldPanel.js';

const rows=[
  {id:1,name:'A',rank:'Archer',rankOrder:6,order:'walls'},{id:2,name:'B',rank:'Archer',rankOrder:6,order:'patrol'},
  {id:3,name:'C',rank:'Recruit',rankOrder:10,order:'guard'},{id:4,name:'D',rank:'Archer',rankOrder:6,order:'guard'},
  {id:5,name:'E',rank:'Knight',rankOrder:0,order:'hunt'},
];
test('owner 19 Nov 2026: the party picker groups soldiers by class, free ones first',()=>{
  const g=worldClasses(rows);
  assert.deepEqual(g.map(x=>x.rank),['Knight','Archer','Recruit']);
  assert.deepEqual(g[1].rows.map(r=>r.id),[2,4,1],'patrol, guard, walls');
  for(const r of rows)assert.ok(ORDER_ICONS[r.order],'every order has an icon');
});
test('owner 19 Nov 2026: the class slider picks n of the class and keeps the others',()=>{
  const archers=worldClasses(rows)[1].rows;
  let p=pickClass(new Set([5]),archers,2);assert.deepEqual([...p].sort(),[2,4,5]);
  p=pickClass(new Set([1,5]),archers,2);assert.deepEqual([...p].sort(),[1,2,5],'keeps a hand-picked one');
  p=pickClass(new Set([1,2,4,5]),archers,1);
  assert.equal(archers.filter(r=>p.has(r.id)).length,1);assert.ok(p.has(5),'other classes untouched');
  assert.equal(archers.filter(r=>pickClass(p,archers,0).has(r.id)).length,0);
});
