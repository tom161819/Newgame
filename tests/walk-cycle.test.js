import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APPROVED_VILLAGER_ART,WALK_COLUMNS,WALK_CYCLE,walkFrame,walkKey,hasWalk } from '../src/data/objects/approvedArt.js';

const json=p=>JSON.parse(readFileSync(p,'utf8'));
const pngSize=p=>{const b=readFileSync(p);return {width:b.readUInt32BE(16),height:b.readUInt32BE(20)};};

test('every approved villager look has its walk sheet, byte for byte with the export and with the same numbers', () => {
  assert.equal(Object.keys(APPROVED_VILLAGER_ART).length,33);
  for(const [look,art] of Object.entries(APPROVED_VILLAGER_ART)){
    if(look.startsWith('military-knight-')){assert.equal(art.walk,undefined,'Knights have eight still images, no walk sheet');continue;}
    const meta=json(art.artSource).walk,exported=art.artSource.replace('.json','.walk.png'),copy=`public${art.base}.walk.png`;
    assert.ok(readFileSync(copy).equals(readFileSync(exported)),`${look}: the game copy is the export`);
    assert.deepEqual({frameWidth:art.walk.frameWidth,frameHeight:art.walk.frameHeight,origin:art.walk.origin,fps:art.walk.fps},{frameWidth:meta.frameWidth,frameHeight:meta.frameHeight,origin:meta.origin,fps:meta.fps},look);
    assert.deepEqual(meta.columns,WALK_COLUMNS,look);assert.deepEqual(meta.cycle.map(c=>WALK_COLUMNS.indexOf(c)),WALK_CYCLE,look);
    assert.deepEqual(pngSize(copy),{width:meta.frameWidth*3,height:meta.frameHeight*8},`${look}: 8 rows x 3 columns`);
  }
});

test('the frame follows the facing row and the walk phase: idle, stride-a, idle, stride-b at 6 fps; standing is idle', () => {
  const fps=6,step=1000/fps;
  assert.deepEqual([0,1,2,3,4].map(i=>walkFrame(0,i*step+1,fps,true)),[0,1,0,2,0]);
  assert.deepEqual([0,1,2,3].map(i=>walkFrame(5,i*step+1,fps,true)),[15,16,15,17],'row 5 = frames 15–17');
  assert.equal(walkFrame(3,12345,fps,false),9,'standing: idle of row 3');
  assert.equal(walkFrame(7,step*2.5,fps,true),21,'last row, idle in the middle of the cycle');
});

test('without a loaded walk sheet a look falls back to the single facing image', () => {
  const loaded=new Set([walkKey('baker-male')]),scene={textures:{exists:k=>loaded.has(k)}};
  assert.equal(hasWalk(scene,'baker-male'),true);assert.equal(hasWalk(scene,'miner-female'),false,'sheet not loaded (missing or failed)');
  assert.equal(hasWalk(scene,'no-such-look'),false);assert.equal(hasWalk(null,'baker-male'),false);
});
