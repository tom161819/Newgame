// Owner's handover 19 Nov 2026 (m-hradby-diagonala, known gaps): a diagonal wall under construction and a remembered
// diagonal wall were drawn as blocks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { wallLayout } from '../src/game/walls.js';
import { validateMapMemory } from '../src/systems/MapMemoryValidation.js';
import { ObjectRegistry } from '../src/systems/ObjectRegistry.js';
import { COLUMNS } from '../src/game/map.js';
import { objectDefinitions } from '../src/data/objects/index.js';

const wall=(id,x,y,state='complete')=>({id,type:'wall',x,y,tiles:[{x,y}],construction:{state,progress:state==='complete'?100:20,workDone:state==='complete'?1:0}});
const shapes=buildings=>new Map(wallLayout(buildings).walls.map(w=>[w.building.id,w.shape]));
test('a diagonal line under construction already shows its diagonal pieces; finished walls do not lean on unfinished ones',()=>{
  const sites=[wall(1,10,10,'planned'),wall(2,11,11,'building'),wall(3,12,12,'planned')];
  assert.deepEqual(shapes(sites).get(2),{diagonal:'se'},'the middle site is a diagonal piece');
  assert.ok(shapes(sites).get(1)?.elbow&&shapes(sites).get(3)?.elbow,'the ends are elbows');
  const mixed=[wall(1,10,10),wall(2,11,11),wall(3,12,12,'planned')],m=shapes(mixed),layout=wallLayout(mixed);
  assert.ok(m.get(2)?.elbow,'a finished wall at the end of the finished part is an elbow (the wall walk ends there)');
  assert.deepEqual(m.get(3)?.elbow?.startsWith('NW'),true,'the site at the end leans on the finished line');
  assert.equal(layout.finished.size,2,'only finished walls are walkable');
  const done=[wall(1,10,10),wall(2,11,11),wall(3,12,12)];assert.deepEqual(shapes(done).get(2),{diagonal:'se'});
});
test('the remembered map keeps the diagonal piece and the elbow of a wall',()=>{
  const registry=new ObjectRegistry(objectDefinitions),index=10*COLUMNS+10;
  const ok=visual=>{try{validateMapMemory({version:1,explored:[index],terrain:[[index,[0,0,'Spring',0,0]]],objects:[{key:'building:1',kind:'building',type:'wall',x:10,y:10,width:1,height:1,visual}]},registry,{check:c=>{if(!c)throw new Error('bad');},number:()=>{},integer:()=>{},array:()=>{}});return true;}catch{return false;}};
  assert.equal(ok({}),true);assert.equal(ok({diagonal:'se'}),true);assert.equal(ok({elbow:'NW-01'}),true);
  assert.equal(ok({diagonal:'up'}),false);assert.equal(ok({elbow:'x'}),false);
});

// Owner 20 Nov 2026: a joint without its own elbow art hides the merlons of the two sides the band runs into.
test('an elbow names the two sides beside its band corner', async () => {
  const { bandSides,wallShape,wallIndex }=await import('../src/game/walls.js');
  assert.deepEqual(bandSides('NW-10'),['N','W']);assert.deepEqual(bandSides('SE-00'),['S','E']);assert.deepEqual(bandSides(null),[]);
  const walls=[{x:10,y:10},{x:11,y:10},{x:9,y:9},{x:8,y:8}].map((p,i)=>({id:i+1,type:'wall',...p,tiles:[p]}));
  assert.equal(wallShape(wallIndex(walls),walls[0]).elbow,'NW-10','the joint of the owner screenshot');
});
