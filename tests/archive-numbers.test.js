import test from 'node:test';
import assert from 'node:assert/strict';
import { archiveNumbers,displayArchiveNumber,compareArchiveNumbers } from '../src/data/archiveNumbers.js';

const c=n=>String(n).padStart(40,'0');
const at=h=>`2026-11-03T${String(h).padStart(2,'0')}:00:00Z`;

test('archive numbers: releases keep theirs, snapshots follow the release before them in time', () => {
  const releases=[{version:'0.1.0',commit:c(10),date:at(10)},{version:'0.2.0',commit:c(20),date:at(20)}];
  const snapshots=[{commit:c(1),date:at(1)},{commit:c(2),date:at(2)},{commit:c(10),date:at(10)},{commit:c(12),date:at(12)},{commit:c(15),date:at(15)},{commit:c(21),date:at(21)}];
  const n=archiveNumbers({releases,snapshots});
  assert.deepEqual([...snapshots.map(s=>n.get(s.commit))],['0.0.1','0.0.2','0.1.0','0.1.1','0.1.2','0.2.1']);
});

test('archive numbers: a clash with a released version uses a fourth place for the whole interval', () => {
  const releases=[{version:'0.3.0',commit:c(30),date:at(5)},{version:'0.3.1',commit:c(31),date:at(9)}];
  const snapshots=[{commit:c(1),date:at(6)},{commit:c(2),date:at(7)},{commit:c(3),date:at(10)}];
  const n=archiveNumbers({releases,snapshots});
  assert.deepEqual(snapshots.map(s=>n.get(s.commit)),['0.3.0.1','0.3.0.2','0.3.2']);
  assert.equal(compareArchiveNumbers('0.3.0.2','0.3.1'),-1);assert.equal(compareArchiveNumbers('0.3.0','0.3.0.1'),-1);
});

test('archive numbers: unique, chronological, ties broken by sequence, one number per commit', () => {
  const releases=[{version:'0.1.0',commit:c(100),date:at(12)}],snapshots=[];
  for(let i=1;i<=30;i++)snapshots.push({commit:c(i),date:at(Math.floor(i/3)),order:i});
  snapshots.push({commit:c(5),date:at(1)});// the same commit as a reconstructed milestone
  const n=archiveNumbers({releases,snapshots}),values=[...n.values()];
  assert.equal(new Set(values).size,values.length);assert.equal(n.size,30);
  const ordered=snapshots.slice(0,30).map(s=>n.get(s.commit));assert.deepEqual([...ordered].sort(compareArchiveNumbers),ordered,'numbers grow with time');
  assert.equal(displayArchiveNumber('0.3.0.1'),'0.03.00.01');assert.equal(displayArchiveNumber('0.1.12'),'0.01.12');
});
