import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOLDIER_ANIM_ART,SOLDIER_ANIM_LOOKS } from '../src/data/soldierAnimArt.js';
import { militaryLook,soldierFrame,soldierIdle,FACING_INDEX } from '../src/data/objects/approvedArt.js';

const pngSize=file=>{const b=readFileSync(file);return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};};

test('every rank wears the owner\'s 3D soldier, for men and women alike', () => {
  for(const [type,look] of Object.entries({soldier:'army-recruit',archer:'army-archer',swordsman:'army-swordsman',knight:'army-knight'})){
    assert.equal(SOLDIER_ANIM_LOOKS[type],look);assert.equal(militaryLook(type,'male','w1'),look);assert.equal(militaryLook(type,'female','w2'),look);}
});

test('each soldier sheet holds 8 facings of idle, walk, attack and fall frames', () => {
  for(const [look,art] of Object.entries(SOLDIER_ANIM_ART)){
    const a=art.anim;assert.equal(a.columns,a.idles.length+a.walk.length+a.attack.length+a.die.length,look);assert.equal(a.idles[0],a.idle);assert.equal(a.idles.length,6);
    assert.deepEqual([a.walk.length,a.attack.length,a.die.length],[8,6,4]);
    const size=pngSize(`public${art.base}.walk.png`);assert.equal(size.w,art.walk.frameWidth*a.perRow,look);assert.equal(size.h,art.walk.frameHeight*Math.ceil(8*a.columns/a.perRow),look);assert.ok(size.w<=4096&&size.h<=4096,`${look} fits a WebGL texture`);
    assert.equal(art.walk.scale,.5,'drawn at half size: double detail for zooming in');
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

test('standing soldiers make small moves at their own random times, then stand still again', () => {
  const a=SOLDIER_ANIM_ART['army-recruit'].anim,seq=[.5,0,.5,.9];let i=0;const rnd=()=>seq[i++%seq.length];
  const st={};assert.equal(soldierIdle(a,st,100,rnd),a.idle);// waits 1.5–8.5 s first
  let col=a.idle,t=0;while(col===a.idle&&t<20000){col=soldierIdle(a,st,100,rnd);t+=100;}
  assert.ok(a.idles.slice(1).includes(col)&&t<9000,`moved after ${t} ms`);
  let back=0;while(soldierIdle(a,st,100,rnd)!==a.idle&&back<5000)back+=100;assert.ok(back<=2800,`still again after ${back} ms`);
  const other={};const cols=new Set();for(let n=0;n<4000;n++)cols.add(soldierIdle(a,other,100));assert.ok(cols.size>=3,'several different moves');
  assert.equal(soldierIdle({idle:0,idles:[0]},{},100),0);
});

test('the enemy army has the same four soldiers in its own colour, as hostile units for the Test map', async () => {
  const { ENEMY_ANIM_LOOKS }=await import('../src/data/soldierAnimArt.js');const { objectRegistry }=await import('../src/systems/ObjectRegistry.js');
  assert.deepEqual(Object.keys(ENEMY_ANIM_LOOKS).sort(),['archer','knight','soldier','swordsman']);
  for(const [rank,look] of Object.entries(ENEMY_ANIM_LOOKS)){const d=objectRegistry.get(`enemy_${rank}`);assert.equal(d.look,look);assert.equal(d.gameplay.hostile,true);assert.equal(d.gameplay.zoneOnly,true);assert.equal(SOLDIER_ANIM_ART[look].side,'enemy');}
  assert.ok(objectRegistry.get('enemy_archer').stats.attackRange>1,'the enemy archer shoots from afar');
});
