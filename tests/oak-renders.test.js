import test from 'node:test';
import assert from 'node:assert/strict';
import { recolourLeaves,isLeaf,oakLook,treeHash } from '../src/render/treeSeasonTexture.js';
import { objectRegistry } from '../src/systems/ObjectRegistry.js';

test('m-duby: autumn and spring recolour only the leaves; trunk, shadow and empty pixels stay',()=>{
  const px=()=>new Uint8ClampedArray([60,110,50,255, 90,60,40,255, 0,0,0,0, 20,20,20,90]);
  const a=recolourLeaves(px(),'Autumn',0),b=recolourLeaves(px(),'Autumn',1),sp=recolourLeaves(px(),'Spring'),su=recolourLeaves(px(),'Summer');
  assert.ok(a[0]>a[1]&&a[1]>a[2],'leaf turned orange');assert.notDeepEqual([...a.slice(0,3)],[...b.slice(0,3)],'two autumn tones');
  assert.ok(sp[1]>110,'spring leaf is lighter');assert.deepEqual([...su],[...px()]);
  for(const out of [a,b,sp]){assert.deepEqual([...out.slice(4)],[...px().slice(4)]);assert.equal(out[3],255);}
  assert.equal(isLeaf(100,.5),true);assert.equal(isLeaf(25,.5),false);
});
test('m-duby: the oak has four views of young, broad and grand; a tile always picks the same view',async()=>{
    const looks=Object.keys(objectRegistry.require('oak_tree').artSprites);assert.equal(looks.length,13);
  const seen=new Set();for(let x=0;x<40;x++){const look=oakLook({stage:3},'Summer',treeHash({x,y:7}));assert.ok(looks.includes(look));seen.add(look);assert.equal(look,oakLook({stage:3},'Autumn',treeHash({x,y:7})));}
  assert.equal(seen.size,4,'all four views appear');
  assert.match(oakLook({stage:2},'Spring',1),/^young-/);assert.match(oakLook({stage:3,grand:true},'Summer',2),/^grand-180$/);
  assert.equal(oakLook({stage:3},'Winter',1),'winter');assert.equal(oakLook({stage:2},'Winter',1),null);
});
