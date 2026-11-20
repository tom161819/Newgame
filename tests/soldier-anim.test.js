import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { SOLDIER_ANIM_ART,SOLDIER_ANIM_LOOKS } from '../src/data/soldierAnimArt.js';
import { militaryLook,soldierFrame,soldierIdle,FACING_INDEX } from '../src/data/objects/approvedArt.js';

const pngSize=file=>{const b=readFileSync(file);return {w:b.readUInt32BE(16),h:b.readUInt32BE(20)};};

test('every rank wears the owner\'s 3D soldier, for men and women alike', () => {
  // Owner 18 Nov 2026: five more figures – the Soldier, Crossbowman, Halberdier, Royal Archer and Light Cavalry (with
  // his horse); the Branec now dresses the untrained Recruits.
  for(const [type,look] of Object.entries({recruit:'army-recruit',soldier:'army-soldier',archer:'army-archer',swordsman:'army-swordsman',knight:'army-knight',
    crossbowman:'army-crossbowman',halberdier:'army-halberdier',royal_archer:'army-royal-archer',light_cavalry:'army-light-cavalry'})){
    assert.equal(SOLDIER_ANIM_LOOKS[type],look);assert.equal(militaryLook(type,'male','w1'),look);assert.equal(militaryLook(type,'female','w2'),look);}
});

test('each soldier sheet holds 8 facings of idle, walk, attack and fall frames', () => {
  for(const [look,art] of Object.entries(SOLDIER_ANIM_ART)){
    const a=art.anim,extra=(a.attacks??[]).slice(1).reduce((n,m)=>n+m.length,0)+(a.block?.length??0);assert.equal(a.columns,a.idles.length+a.walk.length+a.attack.length+a.die.length+extra,look);assert.equal(a.idles[0],a.idle);assert.equal(a.idles.length,6);
    assert.deepEqual([a.walk.length,a.attack.length,a.die.length],[8,6,4]);
    const size=pngSize(`public${art.base}.walk.png`);assert.equal(size.w,art.walk.frameWidth*a.perRow,look);assert.equal(size.h,art.walk.frameHeight*Math.ceil(8*a.columns/a.perRow),look);assert.ok(size.w<=4096&&size.h<=4096,`${look} fits a WebGL texture`);
    assert.equal(art.walk.scale,.5,'drawn at half size: double detail for zooming in');
    assert.ok(art.walk.origin.x>0&&art.walk.origin.x<1&&art.walk.origin.y>.5&&art.walk.origin.y<1,look);}
});

test('soldier frames: standing, walking in a loop, attacking wins over walking', () => {
  const a=SOLDIER_ANIM_ART['army-archer'].anim,k=FACING_INDEX.E,row=k*a.columns;// one attack: loops it (the Knight mixes moves, below)
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

test('owner 20 Nov 2026: a sword-and-shield figure mixes attacks, blocks and a guard in a fight; others loop one attack',async()=>{
  const { combatColumn,COMBAT_MOVES } = await import('../src/data/objects/approvedArt.js');
  const anim={attack:[9,10,11,12,13,14],attackFps:10,attacks:[[9,10,11,12,13,14],[24,25,26,27,28,29],[30,31,32,33,34,35]],block:[42,43,44,45,46,47]};
  assert.equal(combatColumn(anim,0,5),9,'a fight opens with a strike');
  const moves=new Set(),blocks=[];for(let slot=1;slot<400;slot++){const c=combatColumn(anim,slot*600+250,5);moves.add(c);if(c>=42)blocks.push(c);}
  for(const c of [11,26,32])assert.ok(moves.has(c),`move frame ${c} is used`);
  assert.ok(blocks.length>60&&blocks.length<200,`blocks and guards: ${blocks.length}`);
  assert.notDeepEqual([1,2,3,4,5].map(s=>combatColumn(anim,s*600,1)),[1,2,3,4,5].map(s=>combatColumn(anim,s*600,2)),'two fighters do not move in step');
  assert.equal(combatColumn({attack:[9,10],attackFps:10},350),10,'one attack loops as before');
  assert.ok(COMBAT_MOVES.attack+COMBAT_MOVES.block<1);
  const { SOLDIER_ANIM_ART } = await import('../src/data/soldierAnimArt.js');
  for(const look of ['army-knight','enemy-knight']){const a=SOLDIER_ANIM_ART[look].anim;assert.equal(a.attacks.length,4,look);assert.equal(a.block.length,5,look);assert.ok(a.attacks.every(m=>m.length===6&&m.every(c=>c<a.columns)));}
});
