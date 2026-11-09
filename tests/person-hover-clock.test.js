import test from 'node:test';
import assert from 'node:assert/strict';
import { clockMinutes,formatClock } from '../src/data/dayNight.js';
import { personHover } from '../src/ui/personHover.js';

test('owner 9 Nov 2026: the day maps onto a 24-hour clock (dawn 05:00, night start 20:00 in spring)',()=>{
  assert.equal(formatClock(clockMinutes(0,.75)),'05:00');assert.equal(formatClock(clockMinutes(.75,.75)),'20:00');
  assert.equal(formatClock(clockMinutes(.5,.75)),'15:00');assert.equal(formatClock(clockMinutes(.999,.75)),'04:57');
  let last=-1;for(let f=0;f<1;f+=.01){const m=(clockMinutes(f,.62)-300+1440)%1440;assert.ok(m>=last,'runs forward');last=m;}
});
test('owner 9 Nov 2026: the hover label names the occupation and its level, not the overall level',()=>{
  const builder={name:'Filip Omáčka',profession:'builder',skills:{construction:{level:48}},experience:{level:3}};
  const h=personHover(builder);assert.equal(h.name,'Filip Omáčka');assert.match(h.role,/48/);assert.doesNotMatch(h.role,/\b3\b/);
  assert.match(personHover({name:'Jan',profession:'idle',experience:{level:2}}).role,/2/);
  assert.match(personHover({name:'Král',experience:{level:5}},{king:true}).role,/King · lvl 5/);
});
