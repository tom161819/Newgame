import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOLDIER_ANIM_ART,SOLDIER_ANIM_LOOKS } from '../src/data/soldierAnimArt.js';
import { militaryLook,soldierFrame,FACING_INDEX } from '../src/data/objects/approvedArt.js';

const pngSize=file=>{const b=readFileSync(file);return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};};

test('every rank wears the owner\'s 3D soldier, for men and women alike', () => {
  for(const [type,look] of Object.entries({soldier:'army-recruit',archer:'army-archer',swordsman:'army-swordsman',knight:'army-knight'})){
    assert.equal(SOLDIER_ANIM_LOOKS[type],look);assert.equal(militaryLook(type,'male','w1'),look);assert.equal(militaryLook(type,'female','w2'),look);}
});

test('each soldier sheet holds 8 facings of idle, walk, attack and fall frames', () => {
  for(const [look,art] of Object.entries(SOLDIER_ANIM_ART)){
    const a=art.anim;assert.equal(a.columns,1+a.walk.length+a.attack.length+a.die.length,look);
    assert.deepEqual([a.walk.length,a.attack.length,a.die.length],[8,6,4]);
    const size=pngSize(`public${art.base}.walk.png`);assert.equal(size.w,art.walk.frameWidth*a.columns,look);assert.equal(size.h,art.walk.frameHeight*8,look);
    assert.ok(art.walk.origin.x>0&&art.walk.origin.x<1&&art.walk.origin.y>.5&&art.walk.origin.y<1,look);}
});

test('soldier frames: standing, walking in a loop, attacking wins over walking', () => {
  const a=SOLDIER_ANIM_ART['army-knight'].anim,k=FACING_INDEX.E,row=k*a.columns;
  assert.equal(soldierFrame(a,k),row+a.idle);
  assert.equal(soldierFrame(a,k,{moving:true,walkedMs:0}),row+a.walk[0]);
  assert.equal(soldierFrame(a,k,{moving:true,walkedMs:350,walkFps:10}),row+a.walk[3]);
  assert.equal(soldierFrame(a,k,{moving:true,walkedMs:800,walkFps:10}),row+a.walk[0]);
  assert.equal(soldierFrame(a,k,{moving:true,attacking:true,attackMs:250}),row+a.attack[2]);
  assert.equal(soldierFrame(a,k,{attacking:true,attackMs:600}),row+a.attack[0]);
});
